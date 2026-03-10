import { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { teacherAPI } from '../../services/api';
import {
  FileText,
  Download,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  Calendar,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

function getAttendanceColor(pct) {
  if (pct >= 85) return 'text-emerald-700 bg-emerald-50';
  if (pct >= 70) return 'text-amber-700 bg-amber-50';
  return 'text-red-700 bg-red-50';
}

function getAttendanceBarColor(pct) {
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function Reports() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classesLoading, setClassesLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  async function fetchClasses() {
    try {
      const res = await teacherAPI.getMyClasses();
      setClasses(res.data?.classes || []);
    } catch {
      toast.error('Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  }

  async function handleGenerateReport(e) {
    e.preventDefault();
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await teacherAPI.getClassReport(selectedClass, params);
      setReportData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await teacherAPI.exportAttendance(selectedClass, params);
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const className =
        classes.find((c) => (c._id || c.id) === selectedClass)?.name || 'report';
      a.download = `attendance-${className}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  }

  const studentStats = reportData?.studentStats || [];
  const totalSessions = reportData?.totalSessions ?? 0;

  const avgRate =
    studentStats.length > 0
      ? Math.round(studentStats.reduce((sum, s) => sum + (s.rate ?? 0), 0) / studentStats.length)
      : 0;
  const highestRate =
    studentStats.length > 0
      ? Math.max(...studentStats.map((s) => s.rate ?? 0))
      : 0;
  const lowestRate =
    studentStats.length > 0
      ? Math.min(...studentStats.map((s) => s.rate ?? 0))
      : 0;

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.student?.name || '—'}</p>
          <p className="text-xs text-slate-400">
            {row.student?.rollNumber || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Roll No.',
      render: (row) => row.student?.rollNumber || '—',
      cellClass: 'hidden sm:table-cell',
    },
    {
      header: 'Total Sessions',
      render: (row) => (
        <span className="text-sm font-medium text-slate-700">
          {row.total ?? 0}
        </span>
      ),
    },
    {
      header: 'Present',
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-600">
          {row.present ?? 0}
        </span>
      ),
    },
    {
      header: 'Absent',
      render: (row) => (
        <span className="text-sm font-semibold text-red-500">
          {row.absent ?? 0}
        </span>
      ),
    },
    {
      header: 'Late',
      render: (row) => (
        <span className="text-sm font-semibold text-amber-500">
          {row.late ?? 0}
        </span>
      ),
    },
    {
      header: 'Attendance %',
      render: (row) => {
        const pct =
          row.rate ??
          (row.total > 0
            ? Math.round((row.present / row.total) * 100)
            : 0);
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all ${getAttendanceBarColor(pct)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getAttendanceColor(pct)}`}
            >
              {pct}%
            </span>
          </div>
        );
      },
    },
  ];

  if (classesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-500">
          Generate and export attendance reports for your classes
        </p>
      </div>

      {/* Filter Form */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">
            Report Filters
          </h2>
        </div>
        <form
          onSubmit={handleGenerateReport}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setReportData(null);
              }}
              className="input-field"
              required
            >
              <option value="">Select a class...</option>
              {classes.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code || c.year || ''})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-44">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-44">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              End Date
            </label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field pl-9"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Generate Report
              </>
            )}
          </button>
        </form>
      </div>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              icon={Users}
              label="Total Students"
              value={studentStats.length}
              iconBg="bg-indigo-100"
              iconColor="text-indigo-600"
            />
            <StatsCard
              icon={BarChart3}
              label="Average Attendance"
              value={`${avgRate}%`}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatsCard
              icon={TrendingUp}
              label="Highest Attendance"
              value={`${highestRate}%`}
              iconBg="bg-emerald-100"
              iconColor="text-emerald-600"
            />
            <StatsCard
              icon={TrendingDown}
              label="Lowest Attendance"
              value={`${lowestRate}%`}
              iconBg="bg-red-100"
              iconColor="text-red-600"
            />
          </div>

          {/* Export + Table */}
          <div className="card p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
              <h2 className="text-base font-semibold text-slate-900">
                Student Attendance Details
              </h2>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-secondary !text-xs"
              >
                {exporting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Exporting…
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
            <DataTable
              columns={columns}
              data={studentStats}
              searchable
              searchPlaceholder="Search students..."
              emptyMessage="No student data found for this period."
              pageSize={15}
            />
          </div>
        </>
      )}

      {/* Empty state when no report generated */}
      {!reportData && !loading && (
        <div className="card border-2 border-dashed border-slate-200 py-16 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-600">
            No report generated yet
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Select a class and date range above to generate an attendance report
          </p>
        </div>
      )}
    </div>
  );
}
