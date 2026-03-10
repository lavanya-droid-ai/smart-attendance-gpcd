import { useState, useEffect } from 'react';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { teacherAPI } from '../../services/api';
import {
  CalendarCheck,
  Users,
  UserCheck,
  UserX,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function DailyReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyReport();
  }, []);

  async function fetchDailyReport() {
    try {
      const res = await teacherAPI.getDailyReport();
      setData(res.data);
    } catch {
      toast.error('Failed to load daily report');
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

  const report = data?.report || [];
  const totalStudents = report.reduce((sum, r) => sum + (r.totalStudents ?? 0), 0);
  const totalPresent = report.reduce((sum, r) => sum + (r.presentCount ?? 0), 0);
  const totalAbsent = totalStudents - totalPresent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Daily Report</h1>
        <p className="text-sm text-slate-500">
          {data?.date
            ? format(new Date(data.date), 'EEEE, MMMM d, yyyy')
            : format(new Date(), 'EEEE, MMMM d, yyyy')}{' '}
          — Today's attendance summary
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={CalendarCheck}
          label="Total Classes Today"
          value={report.length}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatsCard
          icon={Users}
          label="Total Students"
          value={totalStudents}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={UserCheck}
          label="Present"
          value={totalPresent}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={UserX}
          label="Absent"
          value={totalAbsent}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
      </div>

      {/* Per-class Breakdown */}
      {report.length === 0 ? (
        <div className="card border-2 border-dashed border-slate-200 py-16 text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-600">
            No classes today
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            You don't have any sessions scheduled or completed today
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {report.map((entry) => {
            const cls = entry.class || {};
            const total = entry.totalStudents || 0;
            const present = entry.presentCount || 0;
            const pct = entry.attendanceRate ?? (total > 0 ? Math.round((present / total) * 100) : 0);

            const pctColor =
              pct >= 85
                ? 'text-emerald-600'
                : pct >= 70
                  ? 'text-amber-600'
                  : 'text-red-600';

            const barColor =
              pct >= 85
                ? 'bg-emerald-500'
                : pct >= 70
                  ? 'bg-amber-500'
                  : 'bg-red-500';

            return (
              <div
                key={cls._id || cls.code}
                className="card overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {cls.name || 'Class'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {cls.code || ''}{entry.sessionsToday != null ? ` · ${entry.sessionsToday} session${entry.sessionsToday !== 1 ? 's' : ''} today` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${pctColor}`}>
                      {pct}%
                    </span>
                    <p className="text-xs text-slate-400">attendance</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">
                      {present}/{total} students present
                    </span>
                    <span className="text-slate-400">
                      {total - present} absent
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Session info */}
                <div className="mt-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    {entry.sessionsToday ?? 0} session{(entry.sessionsToday ?? 0) !== 1 ? 's' : ''} completed
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
