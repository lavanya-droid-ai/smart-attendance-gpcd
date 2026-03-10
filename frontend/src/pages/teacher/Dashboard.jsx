import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { teacherAPI } from '../../services/api';
import {
  BookOpen,
  CalendarCheck,
  Users,
  TrendingUp,
  Play,
  Radio,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await teacherAPI.getDashboard();
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
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

  const sessions = data?.todaySessions || [];
  const activeSessions = data?.activeSessions || [];
  const summary = data?.attendanceSummary || {};
  const totalPresent = (summary.present ?? 0) + (summary.late ?? 0);
  const totalAttendees = totalPresent;
  const totalStudentsInClasses = (data?.classes || []).reduce(
    (sum, c) => sum + (c.students?.length ?? 0),
    0
  );
  const attendanceRate =
    totalStudentsInClasses > 0
      ? Math.round((totalAttendees / totalStudentsInClasses) * 100)
      : 0;

  const statusConfig = {
    active: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
      dot: 'bg-emerald-500',
      label: 'Active',
    },
    completed: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      badge: 'bg-slate-100 text-slate-600',
      dot: 'bg-slate-400',
      label: 'Completed',
    },
    upcoming: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700',
      dot: 'bg-blue-500',
      label: 'Upcoming',
    },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Teacher'}!
          </h1>
          <p className="text-sm text-slate-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your teaching overview.
          </p>
        </div>
        <button
          onClick={() => navigate('/teacher/sessions')}
          className="btn-primary"
        >
          <Play className="h-4 w-4" />
          Start New Session
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={BookOpen}
          label="My Classes"
          value={data?.totalClasses ?? 0}
          iconBg="bg-indigo-100"
          iconColor="text-indigo-600"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Today's Sessions"
          value={sessions.length}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatsCard
          icon={Users}
          label="Students Present Today"
          value={totalPresent}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Today's Sessions */}
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">
              Today's Schedule
            </h2>
          </div>
          <button
            onClick={() => navigate('/teacher/sessions')}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-500">
              No sessions scheduled for today
            </p>
            <button
              onClick={() => navigate('/teacher/sessions')}
              className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Start a new session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const config = statusConfig[session.status] || statusConfig.upcoming;
              return (
                <div
                  key={session._id || session.id}
                  className={`flex items-center justify-between rounded-xl border ${config.border} ${config.bg} px-4 py-3 transition-all hover:shadow-sm`}
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
                        <BookOpen className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {session.className || session.class?.name || 'Class'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session.startTime
                          ? format(new Date(session.startTime), 'hh:mm a')
                          : session.time || '—'}
                        {session.duration && ` · ${session.duration} min`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {session.status === 'active' && (
                      <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        </span>
                        <span className="text-sm font-semibold text-emerald-700">
                          {session.attendeesCount ?? 0}
                        </span>
                        <span className="text-xs text-slate-400">present</span>
                      </div>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                      {config.label}
                    </span>

                    {session.status === 'active' && (
                      <button
                        onClick={() =>
                          navigate(
                            `/teacher/session/${session._id || session.id}/live`
                          )
                        }
                        className="btn-primary !px-3 !py-1.5 !text-xs"
                      >
                        <Radio className="h-3.5 w-3.5" />
                        Live View
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Active Sessions
            </h2>
          </div>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session._id}
                className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-medium text-slate-900">
                      {session.class?.name || 'Class'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.attendeesCount ?? 0} students present
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/teacher/session/${session._id}/live`)}
                  className="btn-primary !px-3 !py-1.5 !text-xs"
                >
                  <Radio className="h-3.5 w-3.5" />
                  Live View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
