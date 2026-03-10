import { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/api';
import { BarChart3, CalendarDays } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const BAR_COLORS = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await adminAPI.getAnalytics();
      setData(res.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const yearStats = data?.yearStats || [];
  const departmentStats = data?.departmentStats || [];
  const period = data?.period || '30 days';

  const overallRate =
    yearStats.length > 0
      ? Math.round(
          yearStats.reduce((sum, y) => sum + (y.rate || 0), 0) /
            yearStats.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500">
            Attendance insights and statistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">Period: {period}</span>
        </div>
      </div>

      {/* Year-wise Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {yearStats.length > 0
          ? yearStats.map((ys, i) => (
              <StatsCard
                key={ys.year || i}
                icon={BarChart3}
                label={ys.year || `Year ${i + 1}`}
                value={`${ys.rate ?? 0}%`}
                iconBg={
                  ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100'][
                    i % 4
                  ]
                }
                iconColor={
                  ['text-blue-600', 'text-emerald-600', 'text-amber-600', 'text-purple-600'][
                    i % 4
                  ]
                }
              />
            ))
          : ['First Year', 'Second Year', 'Third Year', 'Final Year'].map(
              (yr, i) => (
                <StatsCard
                  key={yr}
                  icon={BarChart3}
                  label={yr}
                  value="—"
                  iconBg={
                    ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100'][i]
                  }
                  iconColor={
                    ['text-blue-600', 'text-emerald-600', 'text-amber-600', 'text-purple-600'][i]
                  }
                />
              )
            )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Year-wise Attendance Rate */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Year-wise Attendance Rate
            </h2>
            <span className="text-xs text-slate-500">{period}</span>
          </div>
          <div className="h-72">
            {yearStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                    formatter={(v, name) => {
                      if (name === 'rate') return [`${v}%`, 'Rate'];
                      return [v, name];
                    }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {yearStats.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No year-wise data available.
              </div>
            )}
          </div>
        </div>

        {/* Department-wise Attendance Rate */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Department-wise Attendance Rate
            </h2>
            <span className="text-xs text-slate-500">{period}</span>
          </div>
          <div className="h-72">
            {departmentStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="department"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                    }}
                    formatter={(v, name) => {
                      if (name === 'rate') return [`${v}%`, 'Rate'];
                      return [v, name];
                    }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {departmentStats.map((_, i) => (
                      <Cell
                        key={i}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No department data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Year Details Table */}
        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Year-wise Breakdown
          </h2>
          {yearStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                    <th className="pb-2 pr-4">Year</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2 pr-4">Present</th>
                    <th className="pb-2">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yearStats.map((ys, i) => (
                    <tr key={ys.year || i}>
                      <td className="py-2 pr-4 font-medium text-slate-700">{ys.year}</td>
                      <td className="py-2 pr-4 text-slate-600">{ys.total}</td>
                      <td className="py-2 pr-4 text-slate-600">{ys.present}</td>
                      <td className="py-2">
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {ys.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">
              No year-wise data available.
            </p>
          )}
        </div>

        {/* Department Details + Overall */}
        <div className="card flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Department Breakdown
            </h2>
            {departmentStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                      <th className="pb-2 pr-4">Department</th>
                      <th className="pb-2 pr-4">Total</th>
                      <th className="pb-2 pr-4">Present</th>
                      <th className="pb-2">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {departmentStats.map((ds, i) => (
                      <tr key={ds.department || i}>
                        <td className="py-2 pr-4 font-medium text-slate-700">{ds.department}</td>
                        <td className="py-2 pr-4 text-slate-600">{ds.total}</td>
                        <td className="py-2 pr-4 text-slate-600">{ds.present}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {ds.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                No department data available.
              </p>
            )}
          </div>
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Overall Attendance Rate</p>
            <p className="mt-1 text-3xl font-bold text-primary-600">
              {overallRate}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
