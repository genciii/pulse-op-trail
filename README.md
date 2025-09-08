# Operator Tracking System - PostgreSQL Edition

A comprehensive full-stack web application for planning operator shifts and viewing their real-time attendance status. Built with Node.js/Express.js backend, PostgreSQL database, and React frontend.

## Features

- **PostgreSQL Database**: Persistent data storage with proper relationships and indexing
- **Real-time Operator Tracking**: Monitor operator status (online, offline, on break) in real-time
- **Production Line Management**: Visual dashboard showing station efficiency and operator assignments
- **Shift Management**: Create and manage shifts with capacity planning and operator assignments
- **Attendance Tracking**: Clock in/out functionality with automatic time tracking
- **CSV Import**: Bulk import operators from CSV files
- **Live Dashboard**: Visual overview of current operator status and production line efficiency
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technology Stack

- **Backend**: Node.js, Express.js, PostgreSQL, Multer (file uploads)
- **Frontend**: React, TypeScript, Tailwind CSS, Lucide React Icons
- **Database**: PostgreSQL with proper schema design and relationships
- **Build Tool**: Vite

## Prerequisites

- Node.js (version 16 or higher)
- PostgreSQL (version 12 or higher)
- npm or yarn

## Installation & Setup

### 1. Database Setup

First, install and start PostgreSQL, then create the database:

```sql
CREATE DATABASE operator_tracking;
```

### 2. Initialize Database Schema

Run the SQL schema file to create all tables and initial data:

```bash
psql -U postgres -d operator_tracking -f database/schema.sql
```

### 3. Environment Configuration

Copy the example environment file and configure your database connection:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=operator_tracking
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Application

**Start the Backend Server:**
```bash
npm run server
```

The backend server will start on `http://localhost:5001`

**Start the Frontend Development Server** (in a new terminal):
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- **departments**: Organization departments
- **production_lines**: Manufacturing lines with capacity and efficiency tracking
- **stations**: Individual work stations within production lines
- **operators**: Employee information with skills and status
- **shifts**: Work shifts with time ranges and capacity
- **shift_assignments**: Many-to-many relationship between operators and shifts
- **attendance_logs**: Daily attendance tracking with clock in/out times
- **station_performance**: Historical performance data for stations

## API Endpoints

### Core Endpoints
- `GET /api/operators` - Get all operators with current assignments
- `POST /api/operators` - Create new operator
- `PUT /api/operators/:id` - Update operator information
- `DELETE /api/operators/:id` - Delete operator

### Production Management
- `GET /api/production-lines` - Get all production lines with statistics
- `GET /api/stations` - Get all stations with current assignments
- `PUT /api/stations/:id/efficiency` - Update station efficiency

### Shift Management
- `GET /api/shifts` - Get all shifts with assignment counts
- `POST /api/shifts` - Create new shift
- `POST /api/shift-assignments` - Assign operator to shift/station

### Attendance
- `GET /api/attendance` - Get attendance logs (with date/operator filters)
- `POST /api/attendance/clock-in` - Clock in operator
- `POST /api/attendance/clock-out` - Clock out operator

### Data Import
- `POST /api/import/operators` - Import operators from CSV file

### Dashboard
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics

## CSV Import Format

When importing operators, use a CSV file with the following columns:

```csv
name,email,employee_id,department_name,skill_level
John Smith,john.smith@company.com,EMP001,Production,intermediate
Sarah Johnson,sarah.johnson@company.com,EMP002,Quality Control,advanced
```

## Features Overview

### Dashboard
- Real-time statistics (online, offline, on break, present today)
- Production line efficiency overview with visual indicators
- Current operator status with quick actions
- Auto-refresh every 30 seconds

### Production Management
- Visual representation of production lines similar to your reference image
- Station-by-station status with efficiency percentages
- Easy operator assignment to stations
- Real-time occupancy tracking

### Operator Management
- Complete operator database with skills and departments
- Bulk import from CSV files
- Real-time status updates
- Assignment tracking

### Shift Planning
- Create shifts with time ranges and capacity
- Assign operators to specific shifts and stations
- Visual capacity indicators
- Department-based organization

### Attendance Tracking
- Quick clock in/out for all operators
- Daily attendance reports
- Automatic hour calculation
- Historical attendance logs

## Production Line Dashboard

The production view replicates the dashboard shown in your reference image:
- Color-coded efficiency indicators (green ≥75%, amber ≥50%, red <50%)
- Station occupancy status (green dot = occupied, gray dot = empty)
- Real-time efficiency percentages
- Easy operator assignment interface

## Customization

### Adding New Departments
Insert new departments directly into the database:
```sql
INSERT INTO departments (name, description) VALUES ('New Department', 'Description');
```

### Adding Production Lines
```sql
INSERT INTO production_lines (name, department_id, capacity) VALUES ('LINE_NAME', 1, 10);
```

### Database Backup
```bash
pg_dump -U postgres operator_tracking > backup.sql
```

### Database Restore
```bash
psql -U postgres -d operator_tracking < backup.sql
```

## Performance Considerations

- Database indexes are created for frequently queried columns
- Connection pooling is implemented for optimal database performance
- Efficient queries with proper JOINs to minimize database calls
- Real-time updates use polling (can be upgraded to WebSockets)

## Security Features

- Input validation and sanitization
- SQL injection prevention through parameterized queries
- File upload restrictions for CSV imports
- Error handling with appropriate HTTP status codes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper database migrations
4. Test thoroughly with sample data
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues related to:
- Database setup: Check PostgreSQL logs and connection settings
- CSV import: Ensure proper column headers and data format
- Performance: Monitor database query performance and connection pool usage