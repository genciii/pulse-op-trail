import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './database/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Utility function to format time
const formatTime = (timeString) => {
  if (!timeString) return null;
  return timeString.substring(0, 5); // HH:MM format
};

// DEPARTMENTS ENDPOINTS
app.get('/api/departments', async (req, res) => {
  try {
    const result = await query('SELECT * FROM departments ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PRODUCTION LINES ENDPOINTS
app.get('/api/production-lines', async (req, res) => {
  try {
    const result = await query(`
      SELECT pl.*, d.name as department_name,
             COUNT(s.id) as station_count,
             AVG(s.efficiency_percentage) as avg_efficiency
      FROM production_lines pl
      LEFT JOIN departments d ON pl.department_id = d.id
      LEFT JOIN stations s ON pl.id = s.line_id
      WHERE pl.status = 'active'
      GROUP BY pl.id, d.name
      ORDER BY pl.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching production lines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// STATIONS ENDPOINTS
app.get('/api/stations', async (req, res) => {
  try {
    const { line_id } = req.query;
    let queryText = `
      SELECT s.*, pl.name as line_name, 
             o.name as operator_name, o.id as operator_id,
             sa.id as assignment_id
      FROM stations s
      LEFT JOIN production_lines pl ON s.line_id = pl.id
      LEFT JOIN shift_assignments sa ON s.id = sa.station_id AND sa.assigned_date = CURRENT_DATE
      LEFT JOIN operators o ON sa.operator_id = o.id
    `;
    
    const params = [];
    if (line_id) {
      queryText += ' WHERE s.line_id = $1';
      params.push(line_id);
    }
    
    queryText += ' ORDER BY s.line_id, s.position_order';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/stations/:id/efficiency', async (req, res) => {
  try {
    const { id } = req.params;
    const { efficiency_percentage } = req.body;
    
    const result = await query(
      'UPDATE stations SET efficiency_percentage = $1 WHERE id = $2 RETURNING *',
      [efficiency_percentage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating station efficiency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OPERATORS ENDPOINTS
app.get('/api/operators', async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*, d.name as department_name,
             sa.station_id, s.name as station_name, pl.name as line_name
      FROM operators o
      LEFT JOIN departments d ON o.department_id = d.id
      LEFT JOIN shift_assignments sa ON o.id = sa.operator_id AND sa.assigned_date = CURRENT_DATE
      LEFT JOIN stations s ON sa.station_id = s.id
      LEFT JOIN production_lines pl ON s.line_id = pl.id
      ORDER BY o.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching operators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT o.*, d.name as department_name
      FROM operators o
      LEFT JOIN departments d ON o.department_id = d.id
      WHERE o.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching operator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/operators', async (req, res) => {
  try {
    const { name, email, employee_id, department_id, skill_level } = req.body;
    
    if (!name || !email || !department_id) {
      return res.status(400).json({ error: 'Name, email, and department are required' });
    }

    const result = await query(`
      INSERT INTO operators (name, email, employee_id, department_id, skill_level)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, email, employee_id, department_id, skill_level || 'beginner']);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Email or employee ID already exists' });
    }
    console.error('Error creating operator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, employee_id, department_id, skill_level, status } = req.body;
    
    const result = await query(`
      UPDATE operators 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          employee_id = COALESCE($3, employee_id),
          department_id = COALESCE($4, department_id),
          skill_level = COALESCE($5, skill_level),
          status = COALESCE($6, status),
          last_active = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [name, email, employee_id, department_id, skill_level, status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating operator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/operators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM operators WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting operator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SHIFTS ENDPOINTS
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*, d.name as department_name,
             COUNT(sa.id) as assigned_count
      FROM shifts s
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN shift_assignments sa ON s.id = sa.shift_id AND sa.assigned_date = CURRENT_DATE
      WHERE s.is_active = true
      GROUP BY s.id, d.name
      ORDER BY s.start_time
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/shifts', async (req, res) => {
  try {
    const { name, start_time, end_time, department_id, capacity } = req.body;
    
    if (!name || !start_time || !end_time || !department_id || !capacity) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const result = await query(`
      INSERT INTO shifts (name, start_time, end_time, department_id, capacity)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, start_time, end_time, department_id, capacity]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_time, end_time, department_id, capacity } = req.body;
    
    const result = await query(`
      UPDATE shifts 
      SET name = COALESCE($1, name),
          start_time = COALESCE($2, start_time),
          end_time = COALESCE($3, end_time),
          department_id = COALESCE($4, department_id),
          capacity = COALESCE($5, capacity)
      WHERE id = $6
      RETURNING *
    `, [name, start_time, end_time, department_id, capacity, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating shift:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SHIFT ASSIGNMENTS ENDPOINTS
app.post('/api/shift-assignments', async (req, res) => {
  try {
    const { shift_id, operator_id, station_id, assigned_date } = req.body;
    
    if (!shift_id || !operator_id) {
      return res.status(400).json({ error: 'Shift ID and Operator ID are required' });
    }

    const result = await query(`
      INSERT INTO shift_assignments (shift_id, operator_id, station_id, assigned_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (shift_id, operator_id, assigned_date) 
      DO UPDATE SET station_id = $3
      RETURNING *
    `, [shift_id, operator_id, station_id, assigned_date || new Date().toISOString().split('T')[0]]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating shift assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/shift-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM shift_assignments WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ATTENDANCE ENDPOINTS
app.get('/api/attendance', async (req, res) => {
  try {
    const { date, operator_id } = req.query;
    let queryText = `
      SELECT al.*, o.name as operator_name, o.email as operator_email,
             d.name as department_name, s.name as shift_name
      FROM attendance_logs al
      LEFT JOIN operators o ON al.operator_id = o.id
      LEFT JOIN departments d ON o.department_id = d.id
      LEFT JOIN shifts s ON al.shift_id = s.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (date) {
      conditions.push(`al.date = $${params.length + 1}`);
      params.push(date);
    }
    
    if (operator_id) {
      conditions.push(`al.operator_id = $${params.length + 1}`);
      params.push(operator_id);
    }
    
    if (conditions.length > 0) {
      queryText += ' WHERE ' + conditions.join(' AND ');
    }
    
    queryText += ' ORDER BY al.date DESC, o.name';
    
    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { operator_id, shift_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Check if already clocked in
    const existing = await query(
      'SELECT * FROM attendance_logs WHERE operator_id = $1 AND date = $2',
      [operator_id, today]
    );

    if (existing.rows.length > 0 && existing.rows[0].clock_in) {
      return res.status(400).json({ error: 'Already clocked in today' });
    }

    let result;
    if (existing.rows.length > 0) {
      // Update existing record
      result = await query(`
        UPDATE attendance_logs 
        SET clock_in = $1, status = 'present', shift_id = $2
        WHERE operator_id = $3 AND date = $4
        RETURNING *
      `, [currentTime, shift_id, operator_id, today]);
    } else {
      // Create new record
      result = await query(`
        INSERT INTO attendance_logs (operator_id, date, clock_in, status, shift_id)
        VALUES ($1, $2, $3, 'present', $4)
        RETURNING *
      `, [operator_id, today, currentTime, shift_id]);
    }

    // Update operator status
    await query(
      'UPDATE operators SET status = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
      ['online', operator_id]
    );

    res.json({ message: 'Clocked in successfully', record: result.rows[0] });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { operator_id } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const existing = await query(
      'SELECT * FROM attendance_logs WHERE operator_id = $1 AND date = $2 AND clock_in IS NOT NULL AND clock_out IS NULL',
      [operator_id, today]
    );

    if (existing.rows.length === 0) {
      return res.status(400).json({ error: 'No active clock-in found for today' });
    }

    // Calculate total hours
    const clockInTime = new Date(`${today}T${existing.rows[0].clock_in}`);
    const clockOutTime = new Date(`${today}T${currentTime}`);
    const totalHours = Math.round((clockOutTime - clockInTime) / (1000 * 60 * 60) * 100) / 100;

    const result = await query(`
      UPDATE attendance_logs 
      SET clock_out = $1, total_hours = $2
      WHERE operator_id = $3 AND date = $4
      RETURNING *
    `, [currentTime, totalHours, operator_id, today]);

    // Update operator status
    await query(
      'UPDATE operators SET status = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2',
      ['offline', operator_id]
    );

    res.json({ message: 'Clocked out successfully', totalHours, record: result.rows[0] });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CSV IMPORT ENDPOINTS
app.post('/api/import/operators', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const errors = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let imported = 0;
        
        for (const row of results) {
          try {
            const { name, email, employee_id, department_name, skill_level } = row;
            
            if (!name || !email) {
              errors.push(`Row skipped: Missing name or email - ${JSON.stringify(row)}`);
              continue;
            }

            // Get department ID
            let departmentId = null;
            if (department_name) {
              const deptResult = await query(
                'SELECT id FROM departments WHERE name ILIKE $1',
                [department_name.trim()]
              );
              if (deptResult.rows.length > 0) {
                departmentId = deptResult.rows[0].id;
              }
            }

            await query(`
              INSERT INTO operators (name, email, employee_id, department_id, skill_level)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (email) DO UPDATE SET
                name = EXCLUDED.name,
                employee_id = EXCLUDED.employee_id,
                department_id = EXCLUDED.department_id,
                skill_level = EXCLUDED.skill_level
            `, [name.trim(), email.trim(), employee_id?.trim(), departmentId, skill_level?.trim() || 'beginner']);
            
            imported++;
          } catch (error) {
            errors.push(`Error importing row: ${error.message} - ${JSON.stringify(row)}`);
          }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: `Import completed. ${imported} operators imported.`,
          imported,
          errors: errors.length > 0 ? errors : null
        });
      });
  } catch (error) {
    console.error('Error importing operators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// STATUS UPDATE ENDPOINT
app.post('/api/operators/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['online', 'offline', 'on_break'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(
      'UPDATE operators SET status = $1, last_active = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DASHBOARD STATS ENDPOINT
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get operator counts by status
    const operatorStats = await query(`
      SELECT status, COUNT(*) as count
      FROM operators
      GROUP BY status
    `);
    
    // Get attendance stats for today
    const attendanceStats = await query(`
      SELECT status, COUNT(*) as count
      FROM attendance_logs
      WHERE date = $1
      GROUP BY status
    `, [today]);
    
    // Get production line efficiency
    const lineStats = await query(`
      SELECT pl.name, pl.id,
             COUNT(s.id) as total_stations,
             COUNT(sa.id) as occupied_stations,
             AVG(s.efficiency_percentage) as avg_efficiency
      FROM production_lines pl
      LEFT JOIN stations s ON pl.id = s.line_id
      LEFT JOIN shift_assignments sa ON s.id = sa.station_id AND sa.assigned_date = $1
      WHERE pl.status = 'active'
      GROUP BY pl.id, pl.name
      ORDER BY pl.name
    `, [today]);

    res.json({
      operators: operatorStats.rows,
      attendance: attendanceStats.rows,
      production_lines: lineStats.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// HEALTH CHECK ENDPOINT
app.get('/api/health', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as timestamp');
    res.json({ 
      status: 'OK', 
      timestamp: result.rows[0].timestamp,
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  - GET /api/operators');
  console.log('  - GET /api/shifts');
  console.log('  - GET /api/attendance');
  console.log('  - GET /api/production-lines');
  console.log('  - GET /api/stations');
  console.log('  - POST /api/import/operators');
  console.log('  - GET /api/dashboard/stats');
  console.log('  - GET /api/health');
});

export default app;