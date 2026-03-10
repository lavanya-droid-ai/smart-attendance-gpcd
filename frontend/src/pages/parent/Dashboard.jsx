import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { parentAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  User, GraduationCap, CalendarCheck, CheckCircle2,
  TrendingUp, AlertTriangle, Calendar, BookOpen,
} from 'lucide-react';

export default function ParentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await parentAPI.getDashboard();
        setDashboard(data);
      } catch {
        toast.error('Failed to load dashboard');
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

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center py-20 text-slate-400">
        <AlertTriangle className="mb-2 h-10 w-10" />
        <p className="text-sm">Unable to load dashboard data</p>
      </div>
    );
  }

  const ward = dashboard.ward || {};
  const todayAttendance = dashboard.todayAttendance || [];
  const overallPct = dashboard.overallPercentage ?? 0;
  const enrolledClasses = dashboard.enrolledClasses ?? 0;
  const todaySessions = dashboard.todaySessions ?? 0;

  const STATUS_CONFIG = {
    present: { label: 'Present', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    absent: { label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    late: { label: 'Late', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    not_marked: { label: 'Not Marked', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Parent Dashboard
        </h1>
        <p className="text-sm text-slate-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} &middot; Govt. Physiotherapy College
        </p>
      </div>

      {/* Ward Info Card */}
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
          <GraduationCap className="h-8 w-8 text-primary-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">{ward.name || 'Ward'}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {ward.rollNumber && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Roll: {ward.rollNumber}
              </span>
            )}
            {ward.year && (
              <span className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> {ward.year} Year BPT
              </span>
            )}
            {ward.email && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {ward.email}
              </span>
            )}
          </div>
        </div>

        {/* Prominent attendance percentage */}
        <div className={`flex flex-col items-center rounded-2xl p-4 ${
          overallPct >= 75 ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          <p className="text-xs font-medium text-slate-500">Overall</p>
          <p className={`text-4xl font-extrabold ${
            overallPct >= 90 ? 'text-emerald-600' :
            overallPct >= 75 ? 'text-blue-600' :
            overallPct >= 60 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {overallPct}%
          </p>
          <p className="text-xs text-slate-500">Attendance</p>
        </div>
      </div>

      {/* Low attendance alert */}
      {overallPct < 75 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Attendance Alert</p>
            <p className="mt-0.5 text-xs text-red-600">
              Your ward's attendance has dropped below 75%. Please ensure regular attendance to avoid shortage.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          icon={CalendarCheck}
          label="Today's Sessions"
          value={todaySessions}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={BookOpen}
          label="Enrolled Classes"
          value={enrolledClasses}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Overall Attendance"
          value={`${overallPct}%`}
          iconBg={overallPct >= 75 ? 'bg-emerald-100' : 'bg-red-100'}
          iconColor={overallPct >= 75 ? 'text-emerald-600' : 'text-red-600'}
        />
      </div>

      {/* Today's Attendance */}
      {todayAttendance.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Today's Attendance</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayAttendance.map((rec, i) => {
              const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.not_marked;
              return (
                <div
                  key={rec._id || i}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
                >
                  <CheckCircle2 className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {rec.class?.name || `Class ${i + 1}`}
                    </p>
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today's Summary */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Today's Summary</h2>
        {todayAttendance.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-slate-400">
            <TrendingUp className="mb-2 h-8 w-8" />
            <p className="text-sm">No attendance data for today</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-2xl font-bold text-emerald-600">
                {todayAttendance.filter(r => r.status === 'present').length}
              </p>
              <p className="text-xs font-medium text-slate-500">Present</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-2xl font-bold text-amber-600">
                {todayAttendance.filter(r => r.status === 'late').length}
              </p>
              <p className="text-xs font-medium text-slate-500">Late</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-2xl font-bold text-red-600">
                {Math.max(todaySessions - todayAttendance.length, 0)}
              </p>
              <p className="text-xs font-medium text-slate-500">Unmarked</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
