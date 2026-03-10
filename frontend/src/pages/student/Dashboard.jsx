import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Bluetooth, Nfc, CheckCircle2, XCircle, Clock, Activity,
  CalendarCheck, TrendingUp, Wifi, Send, AlertTriangle,
} from 'lucide-react';

const STATUS_CONFIG = {
  present: { label: 'Present', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  absent: { label: 'Absent', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  late: { label: 'Late', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  not_marked: { label: 'Not Marked', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: Clock },
};

const METHOD_BADGE = {
  ble: { label: 'BLE', bg: 'bg-blue-100 text-blue-700' },
  nfc: { label: 'NFC', bg: 'bg-purple-100 text-purple-700' },
  manual: { label: 'Manual', bg: 'bg-slate-100 text-slate-700' },
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [todayStatus, setTodayStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bleToken, setBleToken] = useState('');
  const [nfcToken, setNfcToken] = useState('');
  const [marking, setMarking] = useState({ ble: false, nfc: false });
  const [bleScanning, setBleScanning] = useState(true);
  const [markSuccess, setMarkSuccess] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, todayRes] = await Promise.all([
        studentAPI.getDashboard(),
        studentAPI.getTodayStatus(),
      ]);
      setDashboard(dashRes.data);
      setTodayStatus(todayRes.data?.status || []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => setBleScanning(prev => !prev), 2000);
    return () => clearInterval(interval);
  }, []);

  async function handleBleMark(e) {
    e.preventDefault();
    if (!bleToken.trim()) return toast.error('Enter a BLE session token');
    setMarking(m => ({ ...m, ble: true }));
    try {
      await studentAPI.markBle({ token: bleToken.trim() });
      toast.success('Attendance marked via BLE!');
      setMarkSuccess('ble');
      setBleToken('');
      fetchData();
      setTimeout(() => setMarkSuccess(null), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'BLE marking failed');
    } finally {
      setMarking(m => ({ ...m, ble: false }));
    }
  }

  async function handleNfcMark(e) {
    e.preventDefault();
    if (!nfcToken.trim()) return toast.error('Enter an NFC token');
    setMarking(m => ({ ...m, nfc: true }));
    try {
      await studentAPI.markNfc({ token: nfcToken.trim() });
      toast.success('Attendance marked via NFC!');
      setMarkSuccess('nfc');
      setNfcToken('');
      fetchData();
      setTimeout(() => setMarkSuccess(null), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'NFC marking failed');
    } finally {
      setMarking(m => ({ ...m, nfc: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overallPercentage = dashboard?.overallPercentage ?? 0;
  const todayAttendanceRecords = dashboard?.todayAttendance || [];
  const recentSessions = dashboard?.recentSessions || [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name || 'Student'}!
        </h1>
        <p className="text-sm text-slate-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} &middot; Govt. Physiotherapy College &middot; BPT Program
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          icon={TrendingUp}
          label="Attendance %"
          value={`${overallPercentage}%`}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Classes Today"
          value={todayStatus.length}
          iconBg="bg-primary-100"
          iconColor="text-primary-600"
        />
        <StatsCard
          icon={CheckCircle2}
          label="Present Today"
          value={todayStatus.filter(c => c.attended).length}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* Today's Classes */}
      {todayStatus.length > 0 && (
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Today's Classes</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayStatus.map((cls, i) => {
              const cfg = STATUS_CONFIG[cls.status] || STATUS_CONFIG.not_marked;
              const StatusIcon = cfg.icon;
              const method = cls.method ? METHOD_BADGE[cls.method] : null;
              return (
                <div
                  key={cls.session?._id || i}
                  className={`flex items-center gap-3 rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}
                >
                  <StatusIcon className={`h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {cls.session?.class?.name || `Class ${i + 1}`}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      {method && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${method.bg}`}>
                          {method.label}
                        </span>
                      )}
                    </div>
                    {cls.session?.startTime && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {format(new Date(cls.session.startTime), 'hh:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance Marking Section */}
      <div className="card border-2 border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
        <div className="mb-5 flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-slate-900">Mark Attendance</h2>
        </div>

        {/* BLE Auto-detection */}
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="relative">
            <Wifi className={`h-6 w-6 text-blue-600 ${bleScanning ? 'animate-pulse' : ''}`} />
            <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-blue-50 ${bleScanning ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">BLE Auto-Detection</p>
            <p className="text-xs text-blue-600">
              {bleScanning ? 'Scanning for nearby sessions...' : 'Searching for beacons...'}
            </p>
          </div>
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full bg-blue-400 ${bleScanning ? 'animate-bounce' : ''}`}
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Success animation */}
        {markSuccess && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 animate-pulse">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Attendance Marked Successfully!</p>
              <p className="text-xs text-emerald-600">
                Marked via {markSuccess === 'ble' ? 'BLE' : 'NFC'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* BLE Token Entry */}
          <form onSubmit={handleBleMark} className="space-y-3">
            <div className="flex items-center gap-2">
              <Bluetooth className="h-4 w-4 text-blue-600" />
              <label className="text-sm font-semibold text-slate-700">BLE Session Token</label>
            </div>
            <p className="text-xs text-slate-500">Enter the BLE token displayed in the classroom</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={bleToken}
                onChange={e => setBleToken(e.target.value)}
                placeholder="e.g. BLE-ABC123"
                className="input-field flex-1"
                disabled={marking.ble}
              />
              <button
                type="submit"
                disabled={marking.ble || !bleToken.trim()}
                className="btn-primary shrink-0"
              >
                {marking.ble ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="h-4 w-4" />}
                Mark
              </button>
            </div>
          </form>

          {/* NFC Token Entry */}
          <form onSubmit={handleNfcMark} className="space-y-3">
            <div className="flex items-center gap-2">
              <Nfc className="h-4 w-4 text-purple-600" />
              <label className="text-sm font-semibold text-slate-700">NFC Token</label>
            </div>
            <p className="text-xs text-slate-500">Enter the NFC token to tap and mark attendance</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nfcToken}
                onChange={e => setNfcToken(e.target.value)}
                placeholder="e.g. NFC-XYZ789"
                className="input-field flex-1"
                disabled={marking.nfc}
              />
              <button
                type="submit"
                disabled={marking.nfc || !nfcToken.trim()}
                className="btn-primary shrink-0 !bg-purple-600 hover:!bg-purple-700"
              >
                {marking.nfc ? <LoadingSpinner size="sm" className="text-white" /> : <Send className="h-4 w-4" />}
                Mark
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Bottom section: Today's Attendance + Recent Sessions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Today's Marked Attendance */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Today's Attendance</h2>
          {todayAttendanceRecords.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <CalendarCheck className="mb-2 h-8 w-8" />
              <p className="text-sm">No attendance marked today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayAttendanceRecords.slice(0, 5).map((rec, i) => {
                const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.not_marked;
                const StatusIcon = cfg.icon;
                return (
                  <div
                    key={rec._id || i}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                  >
                    <StatusIcon className={`h-4 w-4 shrink-0 ${cfg.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {rec.class?.name || 'Unknown Class'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {rec.markedAt ? format(new Date(rec.markedAt), 'hh:mm a') : ''}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Sessions</h2>
          {recentSessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-slate-400">
              <TrendingUp className="mb-2 h-8 w-8" />
              <p className="text-sm">No recent sessions</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((session, i) => (
                <div
                  key={session._id || i}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0 text-primary-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {session.class?.name || 'Unknown Class'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {session.date ? format(new Date(session.date), 'MMM d, yyyy') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low attendance warning */}
      {overallPercentage < 75 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Low Attendance Warning</p>
            <p className="mt-0.5 text-xs text-red-600">
              Your attendance is below 75%. Please ensure regular attendance to meet the minimum requirement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
