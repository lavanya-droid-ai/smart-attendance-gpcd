import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { adminAPI } from '../../services/api';
import {
  Users,
  GraduationCap,
  Radio,
  TrendingUp,
  UserPlus,
  BookOpen,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      const res = await adminAPI.getDashboard();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
          <button
            onClick={() => navigate('/admin/classes')}
            className="btn-secondary"
          >
            <BookOpen className="h-4 w-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          icon={GraduationCap}
          label="Total Students"
          value={data?.users?.student ?? 0}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          icon={Users}
          label="Total Teachers"
          value={data?.users?.teacher ?? 0}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatsCard
          icon={Radio}
          label="Active Sessions"
          value={data?.activeSessions ?? 0}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
        <StatsCard
          icon={TrendingUp}
          label="Today's Attendance"
          value={`${data?.attendanceRate ?? 0}%`}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Trend - placeholder */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Attendance Trend
            </h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>
          <div className="h-72">
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No trend data available yet.
            </div>
          </div>
        </div>

        {/* Year-wise Attendance - placeholder */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Year-wise Attendance
            </h2>
            <span className="text-xs text-slate-500">Current month</span>
          </div>
          <div className="h-72">
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No year-wise data available yet.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-900">
            Today's Summary
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">Sessions Today</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {data?.todaySessions ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">Attendance Marked Today</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {data?.todayAttendance ?? 0}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-500">Total Parents</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {data?.users?.parent ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
