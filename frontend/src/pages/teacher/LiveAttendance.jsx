import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { teacherAPI } from '../../services/api';
import { io } from 'socket.io-client';
import {
  ArrowLeft,
  Users,
  UserCheck,
  UserX,
  Radio,
  Bluetooth,
  Smartphone,
  Hand,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  UserPlus,
  UsersRound,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const METHOD_CONFIG = {
  ble: { label: 'BLE', icon: Bluetooth, bg: 'bg-blue-100', text: 'text-blue-700' },
  nfc: { label: 'NFC', icon: Smartphone, bg: 'bg-purple-100', text: 'text-purple-700' },
  manual: { label: 'Manual', icon: Hand, bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function LiveAttendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [presentStudents, setPresentStudents] = useState([]);
  const [absentStudents, setAbsentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [bulkMarking, setBulkMarking] = useState(false);
  const [remarkModal, setRemarkModal] = useState(null);
  const [remark, setRemark] = useState('');

  const socketRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const fetchLiveData = useCallback(async () => {
    try {
      const [liveRes, absentRes] = await Promise.all([
        teacherAPI.getLiveAttendance(sessionId),
        teacherAPI.getAbsentStudents(sessionId),
      ]);
      const live = liveRes.data || {};
      setSessionData(live.session || null);
      setTotalStudentsCount(live.totalStudents ?? 0);
      setPresentStudents(live.attendance || []);
      setAbsentStudents(absentRes.data?.absentStudents || []);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Session not found');
        navigate('/teacher/sessions');
        return;
      }
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  useEffect(() => {
    const baseUrl =
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
      window.location.origin;

    const socket = io(baseUrl, {
      auth: { token: localStorage.getItem('token') },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-session', sessionId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('attendance-marked', (data) => {
      if (data.sessionId === sessionId || data.session === sessionId) {
        setPresentStudents((prev) => {
          const exists = prev.some(
            (s) =>
              (s.studentId || s.student?._id || s._id) ===
              (data.studentId || data.student?._id || data._id)
          );
          if (exists) return prev;
          return [...prev, data];
        });
        setAbsentStudents((prev) =>
          prev.filter(
            (s) =>
              (s._id || s.id) !==
              (data.studentId || data.student?._id || data._id)
          )
        );
      }
    });

    socket.on('session-ended', (data) => {
      if (data.sessionId === sessionId || data.session === sessionId) {
        toast('Session has ended', { icon: '🔴' });
        navigate('/teacher/sessions');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, navigate]);

  // Fallback polling every 10 seconds
  useEffect(() => {
    refreshTimerRef.current = setInterval(fetchLiveData, 10000);
    return () => clearInterval(refreshTimerRef.current);
  }, [fetchLiveData]);

  async function handleMarkManual(studentId) {
    setMarkingId(studentId);
    try {
      await teacherAPI.markManual(sessionId, {
        studentId,
        remarks: remark || 'Marked manually by teacher',
      });
      toast.success('Student marked present');
      setRemarkModal(null);
      setRemark('');
      fetchLiveData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarkingId(null);
    }
  }

  async function handleBulkMark() {
    if (absentStudents.length === 0) return;
    setBulkMarking(true);
    try {
      const studentIds = absentStudents.map((s) => s._id || s.id);
      await teacherAPI.markBulk(sessionId, { studentIds });
      toast.success(`Marked ${studentIds.length} students present`);
      fetchLiveData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bulk mark');
    } finally {
      setBulkMarking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const totalStudents =
    totalStudentsCount || presentStudents.length + absentStudents.length || 0;
  const presentCount = presentStudents.length;
  const percentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const bleToken = sessionData?.bleToken || sessionData?.tokens?.ble;
  const nfcToken = sessionData?.nfcToken || sessionData?.tokens?.nfc;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/sessions')}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                Live Attendance
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {sessionData?.className || sessionData?.class?.name || 'Session'}{' '}
              {sessionData?.startTime &&
                `· Started at ${format(new Date(sessionData.startTime), 'hh:mm a')}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              connected
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {connected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            onClick={fetchLiveData}
            className="btn-secondary !px-3 !py-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Attendance Counter */}
      <div className="card bg-gradient-to-br from-indigo-600 to-indigo-700 text-white">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-indigo-200">
              Attendance Progress
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums">{presentCount}</span>
              <span className="text-2xl font-light text-indigo-200">/</span>
              <span className="text-2xl font-semibold text-indigo-200">
                {totalStudents}
              </span>
            </div>
            <p className="mt-1 text-sm text-indigo-200">students present</p>
          </div>

          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-200">
                {percentage}% Complete
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-indigo-800/50">
              <div
                className="h-full rounded-full bg-white transition-all duration-700 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-indigo-300">
              <span>{presentCount} Present</span>
              <span>{absentStudents.length} Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Token Display */}
      {(bleToken || nfcToken) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bleToken && (
            <div className="card flex items-center gap-4 border border-blue-200 bg-blue-50/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <Bluetooth className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600">BLE Token</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">
                  {bleToken}
                </p>
              </div>
            </div>
          )}
          {nfcToken && (
            <div className="card flex items-center gap-4 border border-purple-200 bg-purple-50/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <Smartphone className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600">NFC Token</p>
                <p className="mt-0.5 font-mono text-lg font-bold text-slate-900">
                  {nfcToken}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Present Students */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                <h2 className="text-base font-semibold text-slate-900">
                  Present Students
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {presentCount}
                </span>
              </div>
            </div>

            {presentStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
                  Waiting for students to mark attendance...
                </p>
              </div>
            ) : (
              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {presentStudents.map((record, idx) => {
                  const student = record.student || record;
                  const method = record.method || 'manual';
                  const config = METHOD_CONFIG[method] || METHOD_CONFIG.manual;
                  const MethodIcon = config.icon;

                  return (
                    <div
                      key={student._id || student.id || idx}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition-all hover:bg-slate-50"
                      style={{
                        animation: `fadeInUp 0.3s ease-out ${idx * 0.02}s both`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {student.name || 'Student'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {student.rollNumber || student.email || ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
                        >
                          <MethodIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                        {record.markedAt && (
                          <span className="text-xs text-slate-400">
                            {format(new Date(record.markedAt), 'hh:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Absent Students */}
        <div>
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <h2 className="text-base font-semibold text-slate-900">
                  Absent
                </h2>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {absentStudents.length}
                </span>
              </div>
            </div>

            {absentStudents.length > 0 && (
              <button
                onClick={handleBulkMark}
                disabled={bulkMarking}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-2.5 text-sm font-medium text-indigo-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
              >
                {bulkMarking ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Marking All…
                  </>
                ) : (
                  <>
                    <UsersRound className="h-4 w-4" />
                    Mark All Remaining Present
                  </>
                )}
              </button>
            )}

            {absentStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 py-8 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-2 text-sm font-medium text-emerald-600">
                  All students present!
                </p>
              </div>
            ) : (
              <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
                {absentStudents.map((student) => (
                  <div
                    key={student._id || student.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {student.rollNumber || student.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setRemarkModal(student);
                        setRemark('');
                      }}
                      disabled={markingId === (student._id || student.id)}
                      className="ml-2 shrink-0 rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                      title="Mark Present"
                    >
                      {markingId === (student._id || student.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remark Modal for Manual Marking */}
      <Modal
        open={!!remarkModal}
        onClose={() => setRemarkModal(null)}
        title="Mark Student Present"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-900">
                {remarkModal?.name || 'Student'}
              </p>
              <p className="text-sm text-slate-500">
                {remarkModal?.rollNumber || remarkModal?.email}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <MessageSquare className="h-4 w-4 text-slate-400" />
              Remarks (optional)
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Late arrival, medical reason..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              onClick={() => setRemarkModal(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleMarkManual(remarkModal?._id || remarkModal?.id)
              }
              disabled={markingId != null}
              className="btn-primary"
            >
              {markingId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Marking…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Present
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
