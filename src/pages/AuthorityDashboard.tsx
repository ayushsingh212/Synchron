import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle, XCircle, Eye, Download, 
  Filter, Search, RefreshCw, Users, Building,
  BarChart3, Calendar, Clock, AlertCircle, TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api'; // Update with your actual API URL

const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    pendingVariants: [],
    approvedVariants: [],
    stats: {
      pending: 0,
      approvedToday: 0,
      totalFaculty: 0,
      departments: 0,
      avgFitnessScore: 0
    },
    loading: true,
    filters: {
      course: 'all',
      dateRange: 'today',
      search: '',
      sortBy: 'date' // date, fitness, course
    },
    selectedVariant: null,
    showPreviewModal: false
  });

  // Fetch initial data
  useEffect(() => {
    loadDashboardData();
    
    // Setup auto-refresh
    const interval = setInterval(() => {
      if (!document.hidden) {
        refreshPendingList();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Fetch pending variants (manager-approved, waiting for authority)
      const pendingRes = await axios.get(
        `${API_BASE_URL}/timetable/solutions/pending-authority`,
        { withCredentials: true }
      );
      
      // Fetch stats
      const statsRes = await axios.get(
        `${API_BASE_URL}/authority/dashboard/stats`,
        { withCredentials: true }
      );
      
      setState(prev => ({
        ...prev,
        pendingVariants: pendingRes.data.data || [],
        stats: statsRes.data.data || prev.stats,
        loading: false
      }));
      
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleAuthorityApprove = async (variantId, comment = '') => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timetable/authority-approve/${variantId}`,
        { comment },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Timetable variant approved by authority!');
        
        // Update UI immediately
        setState(prev => ({
          ...prev,
          pendingVariants: prev.pendingVariants.filter(v => v._id !== variantId),
          stats: {
            ...prev.stats,
            pending: prev.stats.pending - 1,
            approvedToday: prev.stats.approvedToday + 1
          }
        }));
      }
      
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve timetable');
    }
  };

  const handleReject = async (variantId) => {
    const reason = prompt('Please enter rejection reason (this will be sent to the manager):');
    if (!reason || reason.trim() === '') {
      toast.warning('Rejection reason is required');
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/timetable/authority-reject/${variantId}`,
        { reason: reason.trim() },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Timetable variant rejected');
        
        // Update UI
        setState(prev => ({
          ...prev,
          pendingVariants: prev.pendingVariants.filter(v => v._id !== variantId),
          stats: { ...prev.stats, pending: prev.stats.pending - 1 }
        }));
      }
      
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject timetable');
    }
  };

  const viewVariantDetails = (variant) => {
    navigate(`/dashboard/authority/review/${variant._id}`, {
      state: { variant }
    });
  };

  const openPreviewModal = (variant) => {
    setState(prev => ({
      ...prev,
      selectedVariant: variant,
      showPreviewModal: true
    }));
  };

  const closePreviewModal = () => {
    setState(prev => ({
      ...prev,
      selectedVariant: null,
      showPreviewModal: false
    }));
  };

  const refreshPendingList = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/timetable/solutions/pending-authority`,
        { withCredentials: true }
      );
      setState(prev => ({
        ...prev,
        pendingVariants: res.data.data || [],
        stats: { ...prev.stats, pending: res.data.data?.length || 0 }
      }));
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Filter and sort variants
  const getFilteredAndSortedVariants = () => {
    let filtered = state.pendingVariants.filter(v => {
      const matchesSearch = !state.filters.search || 
        v.course?.toLowerCase().includes(state.filters.search.toLowerCase()) ||
        v.generatedBy?.name?.toLowerCase().includes(state.filters.search.toLowerCase()) ||
        v.approvedBy?.name?.toLowerCase().includes(state.filters.search.toLowerCase());
      
      const matchesCourse = state.filters.course === 'all' || 
        v.course === state.filters.course;
      
      return matchesSearch && matchesCourse;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (state.filters.sortBy) {
        case 'fitness':
          return (b.fitness || 0) - (a.fitness || 0);
        case 'course':
          return (a.course || '').localeCompare(b.course || '');
        case 'date':
        default:
          return new Date(b.managerApprovedAt || b.createdAt) - new Date(a.managerApprovedAt || a.createdAt);
      }
    });

    return filtered;
  };

  const filteredVariants = getFilteredAndSortedVariants();

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading Authority Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Authority Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Review and approve manager-approved timetable variants
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Pending Review"
          value={state.stats.pending}
          icon={<Bell className="h-8 w-8" />}
          color="yellow"
          trend="+2 today"
          onClick={() => document.getElementById('pending-table')?.scrollIntoView({ behavior: 'smooth' })}
        />
        <StatCard
          title="Approved Today"
          value={state.stats.approvedToday}
          icon={<CheckCircle className="h-8 w-8" />}
          color="green"
          trend="↑ 12%"
        />
        <StatCard
          title="Avg Fitness Score"
          value={`${state.stats.avgFitnessScore || 0}%`}
          icon={<TrendingUp className="h-8 w-8" />}
          color="blue"
          trend="↑ 5%"
        />
        <StatCard
          title="Total Faculty"
          value={state.stats.totalFaculty}
          icon={<Users className="h-8 w-8" />}
          color="purple"
          onClick={() => navigate('/dashboard/faculty')}
        />
        <StatCard
          title="Departments"
          value={state.stats.departments}
          icon={<Building className="h-8 w-8" />}
          color="indigo"
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by course, manager, or approver..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={state.filters.search}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, search: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={state.filters.course}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, course: e.target.value }
            }))}
          >
            <option value="all">All Courses</option>
            <option value="btech">B.Tech</option>
            <option value="mtech">M.Tech</option>
            <option value="bca">BCA</option>
            <option value="mca">MCA</option>
          </select>

          <select
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            value={state.filters.sortBy}
            onChange={(e) => setState(prev => ({
              ...prev,
              filters: { ...prev.filters, sortBy: e.target.value }
            }))}
          >
            <option value="date">Sort by Date</option>
            <option value="fitness">Sort by Fitness</option>
            <option value="course">Sort by Course</option>
          </select>
          
          <button
            onClick={refreshPendingList}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Pending Variants Table */}
      <div id="pending-table" className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            Pending Authority Approval
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredVariants.length}
            </span>
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            Auto-refresh every 30s
          </div>
        </div>

        {filteredVariants.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All Caught Up! 🎉
            </h3>
            <p className="text-gray-500">
              No timetable variants are pending authority approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timetable Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Manager Approved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submission Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fitness Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.map((variant) => (
                  <VariantRow
                    key={variant._id}
                    variant={variant}
                    onApprove={handleAuthorityApprove}
                    onReject={handleReject}
                    onView={viewVariantDetails}
                    onPreview={openPreviewModal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickActionCard
          title="View All Approved"
          description="See all authority-approved timetables"
          icon={<CheckCircle />}
          onClick={() => navigate('/dashboard/authority/approved')}
          color="green"
        />
        <QuickActionCard
          title="Generate Reports"
          description="Export approval analytics and data"
          icon={<BarChart3 />}
          onClick={() => navigate('/dashboard/reports')}
          color="blue"
        />
        <QuickActionCard
          title="Calendar View"
          description="View timetables in calendar format"
          icon={<Calendar />}
          onClick={() => navigate('/dashboard/calendar')}
          color="purple"
        />
      </div>

      {/* Preview Modal */}
      {state.showPreviewModal && state.selectedVariant && (
        <VariantPreviewModal
          variant={state.selectedVariant}
          onClose={closePreviewModal}
          onApprove={handleAuthorityApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, color, trend, onClick }) => {
  const colorClasses = {
    yellow: 'border-yellow-500 bg-yellow-50',
    green: 'border-green-500 bg-green-50',
    blue: 'border-blue-500 bg-blue-50',
    purple: 'border-purple-500 bg-purple-50',
    indigo: 'border-indigo-500 bg-indigo-50'
  };
  
  const iconColorClasses = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600'
  };
  
  return (
    <div 
      className={`p-6 rounded-lg border-l-4 ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {React.cloneElement(icon, { className: `h-6 w-6 ${iconColorClasses[color]}` })}
        </div>
      </div>
    </div>
  );
};

const VariantRow = ({ variant, onApprove, onReject, onView, onPreview }) => {
  const fitnessScore = variant.fitness || variant.statistics?.fitness_score || 0;
  const fitnessPercent = Math.round(fitnessScore * 100) / 100;
  
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{variant.course?.toUpperCase()}</p>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Variant #{variant.rank || 1}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Year {variant.year} • Semester {variant.semester}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {variant.statistics?.sections || 0} sections • {variant.statistics?.faculty || 0} faculty
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {variant.approvedBy?.name || 'Manager'}
          </p>
          <p className="text-xs text-gray-500">{variant.approvedBy?.email || 'N/A'}</p>
          <p className="text-xs text-green-600 mt-1">
            ✓ Manager Approved
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="text-gray-900">
            {new Date(variant.managerApprovedAt || variant.createdAt).toLocaleDateString()}
          </p>
          <p className="text-gray-500">
            {new Date(variant.managerApprovedAt || variant.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  fitnessPercent >= 80 ? 'bg-green-500' : 
                  fitnessPercent >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(fitnessPercent, 100)}%` }}
              />
            </div>
          </div>
          <span className="font-bold text-gray-900 min-w-[3rem] text-right">
            {fitnessPercent.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(variant)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Quick Preview"
          >
            <Eye className="h-5 w-5" />
          </button>
          <button
            onClick={() => onView(variant)}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            title="Full Details"
          >
            Review
          </button>
          <button
            onClick={() => {
              const comment = prompt('Add optional comment for the manager:');
              onApprove(variant._id, comment || '');
            }}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
            title="Approve"
          >
            <CheckCircle className="h-5 w-5" />
          </button>
          <button
            onClick={() => onReject(variant._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Reject"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const QuickActionCard = ({ title, description, icon, onClick, color }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-100"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {React.cloneElement(icon, { className: 'h-6 w-6' })}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

const VariantPreviewModal = ({ variant, onClose, onApprove, onReject }) => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  // Get first section for preview
  const firstSection = variant.sections ? Object.values(variant.sections)[0] : null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Timetable Preview - Variant #{variant.rank || 1}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {variant.course?.toUpperCase()} • Year {variant.year} • Semester {variant.semester}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-3xl font-light"
          >
            &times;
          </button>
        </div>

        <div className="p-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Fitness Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {(variant.fitness || 0).toFixed(2)}%
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Sections</p>
              <p className="text-2xl font-bold text-green-600">
                {variant.statistics?.sections || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Faculty</p>
              <p className="text-2xl font-bold text-purple-600">
                {variant.statistics?.faculty || 0}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {variant.statistics?.total_classes || 0}
              </p>
            </div>
          </div>

          {/* Sample Timetable */}
          {firstSection && (
            <div>
              <h3 className="font-semibold text-lg mb-3">
                Sample: {firstSection.section_name || firstSection.section_id}
              </h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Time</th>
                      {days.map(day => (
                        <th key={day} className="px-4 py-2 text-center text-sm font-medium text-gray-600">
                          {day.substring(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(firstSection.periods || {}).slice(0, 4).map(([period, time]) => (
                      <tr key={period}>
                        <td className="px-4 py-2 text-sm text-gray-600 bg-gray-50">{time}</td>
                        {days.map(day => {
                          const slot = firstSection.timetable?.[day]?.[period];
                          return (
                            <td key={day} className="px-4 py-2 text-xs text-center">
                              {slot ? (
                                typeof slot === 'string' ? slot : (
                                  <div>
                                    <div className="font-semibold">{slot.subject}</div>
                                    <div className="text-gray-500">{slot.faculty_name}</div>
                                  </div>
                                )
                              ) : 'FREE'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * Showing first 4 periods as preview. Full view available after approval.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              onClick={() => {
                const comment = prompt('Add optional comment:');
                onApprove(variant._id, comment || '');
                onClose();
              }}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle className="h-5 w-5" />
              Approve Variant
            </button>
            <button
              onClick={() => {
                onReject(variant._id);
                onClose();
              }}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <XCircle className="h-5 w-5" />
              Reject Variant
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityDashboard;