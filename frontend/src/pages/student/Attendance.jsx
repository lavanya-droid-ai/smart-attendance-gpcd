import { useState, useEffect, useCallback } from 'react';
import { studentAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import {
  CheckCircle2, XCircle, Clock, Filter, CalendarDays, List,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const STATUS_BADGE = {
  present: { label: 'Present', cls: 'bg-emerald-100 text-emerald-700' },
  absent: { label: 'Absent', cls: 'bg-red-100 text-red-700' },
  late: { label: 'Late', cls: 'bg-amber-100 text-amber-700' },
};

const METHOD_BADGE = {
  ble: { label: 'BLE', cls: 'bg-blue-100 text-blue-700' },
  nfc: { label: 'NFC', cls: 'bg-purple-100 text-purple-700' },
  manual: { label: 'Manual', cls: 'bg-slate-100 text-slate-700' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');
  const [classFilter, setClassFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [classes, setClasses] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date());

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (classFilter) params.classId = classFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      const { data } = await studentAPI.getAttendance(params);
      const list = data?.records || [];
      setRecords(list);

      const classMap = new Map();
      list.forEach(r => {
        if (r.class?._id && r.class?.name) {
          classMap.set(r.class._id, r.class.name);
        }
      });
      if (classMap.size > 0 && classes.length === 0) {
        setClasses([...classMap.entries()].map(([id, name]) => ({ id, name })));
      }
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [classFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const summary = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
  };
  summary.percentage = summary.total > 0
    ? Math.round(((summary.present + summary.late) / summary.total) * 100)
    : 0;

  const columns = [
    {
      header: 'Date',
      accessor: 'date',
      render: row => {
        const d = row.session?.date || row.markedAt;
        try { return d ? format(new Date(d), 'MMM d, yyyy') : '—'; } catch { return '—'; }
      },
    },
    { header: 'Class', accessor: row => row.class?.name || '—' },
    { header: 'Code', accessor: row => row.class?.code || '—' },
    {
      header: 'Status',
      render: row => {
        const cfg = STATUS_BADGE[row.status] || { label: row.status, cls: 'bg-slate-100 text-slate-700' };
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Method',
      render: row => {
        const cfg = METHOD_BADGE[row.method] || { label: row.method || '—', cls: 'bg-slate-100 text-slate-600' };
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
            {cfg.label}
          </span>
        );
      },
    },
    {
      header: 'Time',
      accessor: row => row.markedAt ? format(new Date(row.markedAt), 'hh:mm a') : '—',
    },
  ];

  function getPercentageColor(pct) {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  // Calendar helpers
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  function getDayStatus(day) {
    const dayRecords = records.filter(r => {
      const d = r.session?.date || r.markedAt;
      try { return d ? isSameDay(new Date(d), day) : false; } catch { return false; }
    });
    if (dayRecords.length === 0) return 'none';
    const allPresent = dayRecords.every(r => r.status === 'present');
    const allAbsent = dayRecords.every(r => r.status === 'absent');
    if (allPresent) return 'present';
    if (allAbsent) return 'absent';
    return 'partial';
  }

  const calDotColor = {
    present: 'bg-emerald-500',
    absent: 'bg-red-500',
    partial: 'bg-amber-500',
    none: 'bg-slate-200',
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
        <p className="text-sm text-slate-500">View and filter your attendance records</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Total Sessions', value: summary.total, icon: CalendarDays, color: 'text-slate-700', bg: 'bg-slate-100' },
          { label: 'Present', value: summary.present, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
          { label: 'Absent', value: summary.absent, icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
          { label: 'Late', value: summary.late, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
          {
            label: 'Attendance %',
            value: `${summary.percentage}%`,
            icon: CheckCircle2,
            color: getPercentageColor(summary.percentage),
            bg: summary.percentage >= 75 ? 'bg-emerald-100' : 'bg-red-100',
          },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + View Toggle */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filters</span>
          </div>

          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="input-field max-w-[200px]"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="input-field max-w-[160px]"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="input-field max-w-[160px]"
            placeholder="To"
          />

          <div className="ml-auto flex rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'table' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'calendar' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          searchable
          searchPlaceholder="Search by class, code..."
          pageSize={10}
          emptyMessage="No attendance records found."
        />
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <button
              onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              {format(calMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-xs font-semibold uppercase text-slate-500">
                {d}
              </div>
            ))}

            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}

            {calDays.map(day => {
              const status = getDayStatus(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div
                  key={day.toISOString()}
                  className={`relative flex flex-col items-center rounded-lg py-2 transition-colors ${
                    isToday ? 'bg-primary-50 ring-2 ring-primary-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-sm ${isToday ? 'font-bold text-primary-700' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`mt-1 h-2 w-2 rounded-full ${calDotColor[status]}`} />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
            {[
              { label: 'All Present', color: 'bg-emerald-500' },
              { label: 'Partial', color: 'bg-amber-500' },
              { label: 'Absent', color: 'bg-red-500' },
              { label: 'No Class', color: 'bg-slate-200' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                <span className="text-xs text-slate-500">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
