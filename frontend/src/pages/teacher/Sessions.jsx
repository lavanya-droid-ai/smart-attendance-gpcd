import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { teacherAPI } from '../../services/api';
import {
  Play,
  Square,
  Radio,
  Clock,
  BookOpen,
  Users,
  Loader2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function Sessions() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [endingId, setEndingId] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [duration, setDuration] = useState(60);
  const [activeTab, setActiveTab] = useState('active');

  const fetchData = useCallback(async () => {
    try {
      const [classesRes, dashRes] = await Promise.all([
        teacherAPI.getMyClasses(),
        teacherAPI.getDashboard(),
      ]);
      setClasses(classesRes.data?.classes || []);

      const dash = dashRes.data || {};
      setActiveSessions(dash.activeSessions || []);
      const allToday = dash.todaySessions || [];
      setSessionHistory(allToday.filter((s) => s.status !== 'active'));
    } catch {
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStartSession(e) {
    e.preventDefault();
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }
    setStarting(true);
    try {
      const res = await teacherAPI.startSession({
        classId: selectedClass,
        duration: Number(duration),
      });
      toast.success('Session started successfully!');
      const newSession = res.data.session || res.data;
      if (newSession?._id || newSession?.id) {
        navigate(`/teacher/session/${newSession._id || newSession.id}/live`);
      } else {
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    } finally {
      setStarting(false);
    }
  }

  async function handleEndSession(sessionId) {
    setEndingId(sessionId);
    try {
      await teacherAPI.endSession(sessionId);
      toast.success('Session ended successfully');
      setConfirmEnd(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to end session');
    } finally {
      setEndingId(null);
    }
  }

  const historyColumns = [
    {
      header: 'Date',
      render: (row) => (
        <span className="text-sm text-slate-700">
          {row.startTime
            ? format(new Date(row.startTime), 'MMM d, yyyy')
            : row.date || '—'}
        </span>
      ),
    },
    {
      header: 'Class',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.className || row.class?.name || '—'}
          </p>
          <p className="text-xs text-slate-400">
            {row.class?.code || row.classCode || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Time',
      render: (row) =>
        row.startTime
          ? format(new Date(row.startTime), 'hh:mm a')
          : '—',
    },
    {
      header: 'Duration',
      render: (row) => (
        <span className="text-sm text-slate-600">
          {row.duration ? `${row.duration} min` : '—'}
        </span>
      ),
    },
    {
      header: 'Attendance',
      render: (row) => (
        <span className="text-sm font-semibold text-slate-700">
          {row.attendeesCount ?? 0}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const s = row.status || 'completed';
        const map = {
          completed: 'bg-slate-100 text-slate-600',
          active: 'bg-emerald-50 text-emerald-700',
          cancelled: 'bg-red-50 text-red-600',
        };
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[s] || map.completed}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </span>
        );
      },
    },
  ];

  if (loading) {
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
        <h1 className="text-2xl font-bold text-slate-900">Sessions</h1>
        <p className="text-sm text-slate-500">
          Start attendance sessions and manage session history
        </p>
      </div>

      {/* Start Session Form */}
      <div className="card border-2 border-dashed border-indigo-200 bg-indigo-50/30">
        <div className="mb-4 flex items-center gap-2">
          <Play className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-900">
            Start New Session
          </h2>
        </div>
        <form
          onSubmit={handleStartSession}
          className="flex flex-col gap-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Choose a class...</option>
              {classes.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.name} ({c.code || c.year || ''})
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-36">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Duration (min)
            </label>
            <input
              type="number"
              min="15"
              max="180"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            type="submit"
            disabled={starting}
            className="btn-primary whitespace-nowrap"
          >
            {starting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Session
              </>
            )}
          </button>
        </form>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'active'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Radio className="h-4 w-4" />
            Active Sessions
            {activeSessions.length > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-100 px-1.5 text-xs font-semibold text-emerald-700">
                {activeSessions.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            Session History
          </div>
        </button>
      </div>

      {/* Active Sessions */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="card border-2 border-dashed border-slate-200 py-12 text-center">
              <Radio className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                No active sessions right now
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Start a new session using the form above
              </p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session._id || session.id}
                className="card overflow-hidden border-2 border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-white"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                      <BookOpen className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {session.className || session.class?.name || 'Class'}
                        </h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                          </span>
                          Live
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Started{' '}
                          {session.startTime
                            ? formatDistanceToNow(new Date(session.startTime), {
                                addSuffix: true,
                              })
                            : 'recently'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {session.attendeesCount ?? 0} students
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        navigate(
                          `/teacher/session/${session._id || session.id}/live`
                        )
                      }
                      className="btn-primary"
                    >
                      <Eye className="h-4 w-4" />
                      View Live
                    </button>
                    <button
                      onClick={() => setConfirmEnd(session)}
                      className="btn-secondary !border-red-200 !text-red-600 hover:!bg-red-50"
                    >
                      <Square className="h-4 w-4" />
                      End
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Session History */}
      {activeTab === 'history' && (
        <DataTable
          columns={historyColumns}
          data={sessionHistory}
          loading={false}
          searchable
          searchPlaceholder="Search sessions..."
          emptyMessage="No session history found."
          pageSize={10}
        />
      )}

      {/* End Session Confirmation */}
      <Modal
        open={!!confirmEnd}
        onClose={() => setConfirmEnd(null)}
        title="End Session"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700">
                Are you sure you want to end the session for{' '}
                <span className="font-semibold">
                  {confirmEnd?.className || confirmEnd?.class?.name || 'this class'}
                </span>
                ? Students will no longer be able to mark attendance.
              </p>
              {confirmEnd && (
                <p className="mt-2 text-xs text-slate-500">
                  Current attendance: {confirmEnd.attendeesCount ?? 0} students
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => setConfirmEnd(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleEndSession(confirmEnd?._id || confirmEnd?.id)
              }
              disabled={endingId != null}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {endingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ending…
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  End Session
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
