import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Activity, 
  Plus, 
  RefreshCw,
  UserCheck,
  UserX,
  Coffee,
  Building2,
  Mail,
  Timer,
  Upload,
  Download,
  Settings,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Zap,
  Target
} from 'lucide-react';

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5001/api`;

interface Department {
  id: number;
  name: string;
  description: string;
}

interface ProductionLine {
  id: number;
  name: string;
  department_id: number;
  department_name: string;
  capacity: number;
  station_count: number;
  avg_efficiency: number;
  status: string;
}

interface Station {
  id: number;
  name: string;
  line_id: number;
  line_name: string;
  position_order: number;
  efficiency_percentage: number;
  target_efficiency: number;
  operator_name?: string;
  operator_id?: number;
  assignment_id?: number;
}

interface Operator {
  id: number;
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  department_name: string;
  skill_level: string;
  status: 'online' | 'offline' | 'on_break';
  last_active: string;
  station_id?: number;
  station_name?: string;
  line_name?: string;
}

interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  department_id: number;
  department_name: string;
  capacity: number;
  assigned_count: number;
  is_active: boolean;
}

interface DashboardStats {
  operators: { status: string; count: string }[];
  attendance: { status: string; count: string }[];
  production_lines: {
    id: number;
    name: string;
    total_stations: string;
    occupied_stations: string;
    avg_efficiency: string;
  }[];
}

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'shifts' | 'attendance' | 'operators' | 'production'>('dashboard');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  // Fetch data functions
  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/departments`);
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchOperators = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/operators`);
      const data = await response.json();
      setOperators(data);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchShifts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts`);
      const data = await response.json();
      setShifts(data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
    }
  };

  const fetchProductionLines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/production-lines`);
      const data = await response.json();
      setProductionLines(data);
    } catch (error) {
      console.error('Error fetching production lines:', error);
    }
  };

  const fetchStations = async (lineId?: number) => {
    try {
      const url = lineId ? `${API_BASE_URL}/stations?line_id=${lineId}` : `${API_BASE_URL}/stations`;
      const response = await fetch(url);
      const data = await response.json();
      setStations(data);
    } catch (error) {
      console.error('Error fetching stations:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDepartments(),
      fetchOperators(),
      fetchShifts(),
      fetchProductionLines(),
      fetchStations(),
      fetchDashboardStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      fetchOperators();
      fetchDashboardStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Status management functions
  const updateOperatorStatus = async (operatorId: number, status: string) => {
    try {
      await fetch(`${API_BASE_URL}/operators/${operatorId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchOperators();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const assignOperatorToStation = async (operatorId: number, stationId: number, shiftId: number) => {
    try {
      await fetch(`${API_BASE_URL}/shift-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: shiftId,
          operator_id: operatorId,
          station_id: stationId,
          assigned_date: new Date().toISOString().split('T')[0]
        })
      });
      await Promise.all([fetchOperators(), fetchStations()]);
    } catch (error) {
      console.error('Error assigning operator:', error);
    }
  };

  // Form components
  const AddOperatorForm = () => {
    const [formData, setFormData] = useState({
      name: '', email: '', employee_id: '', department_id: '', skill_level: 'beginner'
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE_URL}/operators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setFormData({ name: '', email: '', employee_id: '', department_id: '', skill_level: 'beginner' });
        setShowAddOperator(false);
        await fetchOperators();
      } catch (error) {
        console.error('Error adding operator:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add New Operator</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
              <select
                value={formData.skill_level}
                onChange={(e) => setFormData({ ...formData, skill_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Operator
              </button>
              <button
                type="button"
                onClick={() => setShowAddOperator(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddShiftForm = () => {
    const [formData, setFormData] = useState({
      name: '', start_time: '', end_time: '', capacity: '', department_id: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE_URL}/shifts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        setFormData({ name: '', start_time: '', end_time: '', capacity: '', department_id: '' });
        setShowAddShift(false);
        await fetchShifts();
      } catch (error) {
        console.error('Error adding shift:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Add New Shift</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Shift
              </button>
              <button
                type="button"
                onClick={() => setShowAddShift(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ImportModal = () => {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const handleImport = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file) return;

      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${API_BASE_URL}/import/operators`, {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        alert(result.message);
        setShowImportModal(false);
        setFile(null);
        await fetchOperators();
      } catch (error) {
        console.error('Error importing:', error);
        alert('Import failed');
      } finally {
        setImporting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Import Operators from CSV</h3>
          <form onSubmit={handleImport} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Expected columns: name, email, employee_id, department_name, skill_level
              </p>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={importing}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {importing ? 'Importing...' : 'Import'}
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      online: { color: 'bg-green-100 text-green-800', icon: UserCheck, label: 'Online' },
      offline: { color: 'bg-gray-100 text-gray-800', icon: UserX, label: 'Offline' },
      on_break: { color: 'bg-amber-100 text-amber-800', icon: Coffee, label: 'On Break' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  // Efficiency badge component
  const EfficiencyBadge = ({ percentage }: { percentage: number }) => {
    let color = 'bg-red-100 text-red-800';
    if (percentage >= 75) color = 'bg-green-100 text-green-800';
    else if (percentage >= 50) color = 'bg-amber-100 text-amber-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {percentage.toFixed(1)}%
      </span>
    );
  };

  // Main dashboard view
  const DashboardView = () => {
    if (!dashboardStats) return <div>Loading...</div>;

    const operatorCounts = dashboardStats.operators.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    const attendanceCounts = dashboardStats.attendance.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-green-600">{operatorCounts.online || 0}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Break</p>
                <p className="text-2xl font-bold text-amber-600">{operatorCounts.on_break || 0}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">{operatorCounts.offline || 0}</p>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceCounts.present || 0}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Production Lines Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Production Lines Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardStats.production_lines.map((line) => {
                const efficiency = parseFloat(line.avg_efficiency) || 0;
                const occupancy = (parseInt(line.occupied_stations) / parseInt(line.total_stations)) * 100;
                
                return (
                  <div key={line.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{line.name}</h4>
                      <EfficiencyBadge percentage={efficiency} />
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Stations:</span>
                        <span>{line.occupied_stations}/{line.total_stations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Occupancy:</span>
                        <span>{occupancy.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${occupancy}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current Operators Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Current Operator Status</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {operators.slice(0, 8).map((operator) => (
                <div key={operator.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{operator.name}</p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {operator.department_name}
                        {operator.station_name && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{operator.station_name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={operator.status} />
                    <div className="flex space-x-1">
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'online')}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Set Online"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'on_break')}
                        className="p-1 text-amber-600 hover:bg-amber-100 rounded"
                        title="Set On Break"
                      >
                        <Coffee className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'offline')}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Set Offline"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Production view (based on your screenshot)
  const ProductionView = () => {
    const selectedLineStations = selectedLine 
      ? stations.filter(s => s.line_id === selectedLine)
      : stations;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Production Line Status</h2>
          <div className="flex space-x-2">
            <select
              value={selectedLine || ''}
              onChange={(e) => {
                const lineId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedLine(lineId);
                fetchStations(lineId || undefined);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Lines</option>
              {productionLines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
            <button
              onClick={() => fetchStations(selectedLine || undefined)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Production Lines Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {productionLines.map((line) => {
            const lineStations = stations.filter(s => s.line_id === line.id);
            const avgEfficiency = lineStations.length > 0 
              ? lineStations.reduce((sum, s) => sum + s.efficiency_percentage, 0) / lineStations.length
              : 0;

            return (
              <div key={line.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{line.name}</h3>
                    <EfficiencyBadge percentage={avgEfficiency} />
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      {lineStations.filter(s => s.operator_id).length}/{lineStations.length} Occupied
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-2">
                    {lineStations.map((station) => (
                      <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            station.operator_id ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{station.name}</p>
                            {station.operator_name && (
                              <p className="text-xs text-gray-500">{station.operator_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <EfficiencyBadge percentage={station.efficiency_percentage} />
                          {!station.operator_id && (
                            <select
                              onChange={(e) => {
                                if (e.target.value && shifts.length > 0) {
                                  assignOperatorToStation(
                                    parseInt(e.target.value),
                                    station.id,
                                    shifts[0].id
                                  );
                                }
                              }}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                            >
                              <option value="">Assign</option>
                              {operators
                                .filter(op => op.status === 'online' && !op.station_id)
                                .map(op => (
                                  <option key={op.id} value={op.id}>{op.name}</option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Shifts management view
  const ShiftsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Shift Management</h2>
        <button
          onClick={() => setShowAddShift(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shift</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <div key={shift.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{shift.name}</h3>
                <span className="text-sm text-gray-500">{shift.department_name}</span>
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {shift.start_time} - {shift.end_time}
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {shift.assigned_count}/{shift.capacity}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(shift.assigned_count / shift.capacity) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {shift.capacity - shift.assigned_count} positions available
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Operators management view
  const OperatorsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Operator Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={() => setShowAddOperator(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Operator</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {operators.map((operator) => (
                <tr key={operator.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{operator.name}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {operator.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Building2 className="w-3 h-3 mr-1" />
                      {operator.department_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {operator.station_name ? (
                      <div className="flex items-center">
                        <Timer className="w-4 h-4 mr-1 text-gray-400" />
                        {operator.line_name} - {operator.station_name}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={operator.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      operator.skill_level === 'expert' ? 'bg-purple-100 text-purple-800' :
                      operator.skill_level === 'advanced' ? 'bg-green-100 text-green-800' :
                      operator.skill_level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {operator.skill_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'online')}
                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                        title="Set Online"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'on_break')}
                        className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
                        title="Set On Break"
                      >
                        <Coffee className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateOperatorStatus(operator.id, 'offline')}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                        title="Set Offline"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Attendance view
  const AttendanceView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
        <div className="flex space-x-2">
          <button
            onClick={refreshData}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Clock In/Out */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Clock In/Out</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((operator) => (
            <div key={operator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">{operator.name}</p>
                <p className="text-xs text-gray-500">{operator.department_name}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Clock in with first available shift
                    if (shifts.length > 0) {
                      fetch(`${API_BASE_URL}/attendance/clock-in`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          operator_id: operator.id,
                          shift_id: shifts[0].id 
                        })
                      }).then(() => refreshData());
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                >
                  Clock In
                </button>
                <button
                  onClick={() => {
                    fetch(`${API_BASE_URL}/attendance/clock-out`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ operator_id: operator.id })
                    }).then(() => refreshData());
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Clock Out
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Operator Tracking System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <span className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <nav className="flex space-x-1 mb-6 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'production', label: 'Production', icon: BarChart3 },
            { id: 'operators', label: 'Operators', icon: Users },
            { id: 'shifts', label: 'Shifts', icon: Calendar },
            { id: 'attendance', label: 'Attendance', icon: Clock }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Main Content */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'production' && <ProductionView />}
        {activeTab === 'operators' && <OperatorsView />}
        {activeTab === 'shifts' && <ShiftsView />}
        {activeTab === 'attendance' && <AttendanceView />}

        {/* Modals */}
        {showAddOperator && <AddOperatorForm />}
        {showAddShift && <AddShiftForm />}
        {showImportModal && <ImportModal />}
      </div>
    </div>
  );
}

export default App;