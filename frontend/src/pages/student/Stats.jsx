import { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, AlertTriangle, BookOpen, CheckCircle2,
  XCircle, Clock, BarChart3,
} from 'lucide-react';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function StudentStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await studentAPI.getStats();
        setStats(data);
      } catch {
        toast.error('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400">
        <BarChart3 className="mb-2 h-10 w-10" />
        <p className="text-sm">No statistics available</p>
      </div>
    );
  }

  const classStats = stats.stats || [];
  const overallPct = stats.overallRate ?? 0;

  const totalPresent = classStats.reduce((sum, s) => sum + (s.present || 0), 0);
  const totalLate = classStats.reduce((sum, s) => sum + (s.late || 0), 0);
  const totalSessions = classStats.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalAbsent = Math.max(totalSessions - totalPresent - totalLate, 0);

  const donutData = [
    { name: 'Present', value: totalPresent },
    { name: 'Absent', value: totalAbsent },
    { name: 'Late', value: totalLate },
  ].filter(d => d.value > 0);

  const classBreakdown = classStats.map(s => ({
    className: s.class?.name || 'Unknown',
    classCode: s.class?.code,
    classId: s.class?._id,
    present: s.present || 0,
    total: s.total || 0,
    late: s.late || 0,
    percentage: s.total > 0 ? Math.round(((s.present || 0) / s.total) * 100) : 0,
  }));

  function getPercentageColor(pct) {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  function getBarColor(pct) {
    if (pct >= 90) return '#10b981';
    if (pct >= 75) return '#4f46e5';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Statistics</h1>
        <p className="text-sm text-slate-500">Detailed attendance analytics and trends</p>
      </div>

      {/* Top Row: Overall + Total Sessions + Warning */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Overall Attendance */}
        <div className="card flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            overallPct >= 75 ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            <TrendingUp className={`h-7 w-7 ${overallPct >= 75 ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
            <p className={`text-3xl font-bold ${getPercentageColor(overallPct)}`}>
              {overallPct}%
            </p>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="card flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
            <BookOpen className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Sessions</p>
            <p className="text-3xl font-bold text-blue-600">{totalSessions}</p>
          </div>
        </div>

        {/* Risk or Healthy indicator */}
        <div className={`card flex items-center gap-4 ${
          overallPct < 75 ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
        }`}>
          {overallPct < 75 ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">At Risk</p>
                <p className="text-xs text-red-600">
                  Attendance below 75% — attend regularly!
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">On Track</p>
                <p className="text-xs text-emerald-600">
                  Great! Attendance is above the minimum requirement.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Attendance Breakdown</h2>
          {donutData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <p className="text-sm">No data</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {[
                  { label: 'Present', value: totalPresent, color: 'bg-emerald-500', icon: CheckCircle2 },
                  { label: 'Absent', value: totalAbsent, color: 'bg-red-500', icon: XCircle },
                  { label: 'Late', value: totalLate, color: 'bg-amber-500', icon: Clock },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <item.icon className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {item.label}: <span className="font-semibold text-slate-800">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enrolled Classes count */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Classes Overview</h2>
          {classStats.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <p className="text-sm">No class data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classStats.map((s, i) => {
                const pct = s.total > 0 ? Math.round(((s.present || 0) / s.total) * 100) : 0;
                return (
                  <div key={s.class?._id || i} className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 shrink-0 text-primary-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{s.class?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{s.present || 0}/{s.total || 0} sessions</p>
                    </div>
                    <span className={`text-sm font-bold ${getPercentageColor(pct)}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class-wise Bar Chart */}
      {classBreakdown.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Class-wise Comparison</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classBreakdown} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickFormatter={v => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="className"
                tick={{ fontSize: 11, fill: '#64748b' }}
                width={120}
              />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={v => [`${v}%`, 'Attendance']}
              />
              <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                {classBreakdown.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.percentage)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-class Breakdown Cards */}
      {classBreakdown.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Per-Class Breakdown</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classBreakdown.map((cls, i) => {
              const pct = cls.percentage ?? 0;
              return (
                <div key={cls.classId || i} className="card">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <BookOpen className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {cls.className}
                      </p>
                      {cls.classCode && (
                        <p className="truncate text-xs text-slate-500">{cls.classCode}</p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: getBarColor(pct),
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {cls.present}/{cls.total} sessions
                    </span>
                    <span className={`font-bold ${getPercentageColor(pct)}`}>
                      {pct}%
                    </span>
                  </div>

                  {pct < 75 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Below 75% minimum
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
