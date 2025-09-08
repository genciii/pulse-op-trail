-- Database schema for Operator Tracking System

-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE operator_tracking;

-- Connect to the database and run the following:

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Production lines table
CREATE TABLE IF NOT EXISTS production_lines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    capacity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    efficiency_target DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stations table (individual work stations within production lines)
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    line_id INTEGER REFERENCES production_lines(id),
    position_order INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    efficiency_percentage DECIMAL(5,2) DEFAULT 0.00,
    target_efficiency DECIMAL(5,2) DEFAULT 100.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    employee_id VARCHAR(50) UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    skill_level VARCHAR(20) DEFAULT 'beginner',
    status VARCHAR(20) DEFAULT 'offline',
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
-- Added start_date and end_date to support date ranges
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE,
    end_date DATE,
    department_id INTEGER REFERENCES departments(id),
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shift assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS shift_assignments (
    id SERIAL PRIMARY KEY,
    shift_id INTEGER REFERENCES shifts(id) ON DELETE CASCADE,
    operator_id INTEGER REFERENCES operators(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    station_id INTEGER REFERENCES stations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shift_id, operator_id, assigned_date)
);

-- Attendance logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES operators(id),
    date DATE DEFAULT CURRENT_DATE,
    clock_in TIME,
    clock_out TIME,
    total_hours DECIMAL(4,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'absent',
    shift_id INTEGER REFERENCES shifts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operator_id, date)
);

-- Station performance logs
CREATE TABLE IF NOT EXISTS station_performance (
    id SERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES stations(id),
    operator_id INTEGER REFERENCES operators(id),
    date DATE DEFAULT CURRENT_DATE,
    shift_id INTEGER REFERENCES shifts(id),
    efficiency_percentage DECIMAL(5,2) DEFAULT 0.00,
    units_produced INTEGER DEFAULT 0,
    target_units INTEGER DEFAULT 0,
    downtime_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default departments
INSERT INTO departments (name, description) VALUES 
('Production', 'Main production department'),
('Quality Control', 'Quality assurance and testing'),
('Maintenance', 'Equipment maintenance and repair'),
('Logistics', 'Material handling and shipping')
ON CONFLICT (name) DO NOTHING;

-- Insert sample production lines
INSERT INTO production_lines (name, department_id, capacity) VALUES 
('DIS1', 1, 10),
('DIS2', 1, 8),
('IC1', 1, 6),
('IC2', 1, 6),
('DIGER', 1, 5)
ON CONFLICT (name) DO NOTHING;


-- Insert sample stations for each line
INSERT INTO stations (name, line_id, position_order) VALUES 
-- DIS1 stations
('BANT BASI', 1, 1),
('BANT DESTEK', 1, 2),
('BANT SONU', 1, 3),
('BARKOD BASIM', 1, 4),
('DOĞUM İZNİ', 1, 5),
('HATTAN İADE', 1, 6),
('SENDİKA', 1, 7),
('KAYNAK TAKİP', 1, 8),
('LOÇ BAKIM', 1, 9),
('BARKOD BASIM', 1, 10),

-- DIS2 stations  
('BANT BAKIM', 2, 1),
('BANT DESTEK', 2, 2),
('LOÇ', 2, 3),
('SENDİKA', 2, 4),
('İYİLEŞTİRME', 2, 5),
('BANT BAKIM', 2, 6),
('HATTAN İADE', 2, 7),
('KAYNAK TAKİP', 2, 8),

-- IC1 stations
('BANT SONU', 3, 1),
('DOĞUM İZNİ', 3, 2),
('HATTAN İADE', 3, 3),
('KAYNAK TAKİP', 3, 4),
('LOÇ BAKIM', 3, 5),
('BANT BAKIM', 3, 6),

-- IC2 stations
('BARKOD BASIM', 4, 1),
('LOÇ', 4, 2),
('SENDİKA', 4, 3),
('İYİLEŞTİRME', 4, 4),
('BANT BASI', 4, 5),

-- DIGER stations
('BANT BAKIM', 5, 1),
('BANT DESTEK', 5, 2),
('BANT SONU', 5, 3),
('BARKOD BASIM', 5, 4),
('DOĞUM İZNİ', 5, 5)
ON CONFLICT (name, line_id, position_order) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operators_status ON operators(status);
CREATE INDEX IF NOT EXISTS idx_operators_department ON operators(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(date);
CREATE INDEX IF NOT EXISTS idx_attendance_operator ON attendance_logs(operator_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_operator ON shift_assignments(operator_id);
CREATE INDEX IF NOT EXISTS idx_station_performance_date ON station_performance(date);