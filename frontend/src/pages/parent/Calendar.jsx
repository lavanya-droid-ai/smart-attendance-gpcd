import { useState, useEffect, useCallback } from 'react';
import { parentAPI } from '../../services/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths,
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock,
  CalendarDays,
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ParentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        month: currentMonth.getMonth() + 1,
        year: currentMonth.getFullYear(),
      };
      const [calRes, sumRes] = await Promise.all([
        parentAPI.getWardCalendar(params),
        parentAPI.getWardSummary(params),
      ]);

      setCalendarData(calRes.data?.calendar || {});
      setSummaryData(sumRes.data || null);
    } catch {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  function getDayInfo(day) {
    return calendarData[day.getDate()] || null;
  }

  function getDayColor(day) {
    const info = getDayInfo(day);
    if (!info || info.totalSessions === 0) return 'bg-slate-100 text-slate-400';

    const attended = (info.present || 0) + (info.late || 0);
    if (attended === info.totalSessions) return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200';
    if (attended === 0) return 'bg-red-100 text-red-700 hover:bg-red-200';
    return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
  }

  function handleDayClick(day) {
    const info = getDayInfo(day);
    if (info && info.totalSessions > 0) {
      setSelectedDay({ date: day, info });
      setModalOpen(true);
    }
  }

  const summary = summaryData || {};

  function getPercentageColor(pct) {
    if (pct >= 90) return 'text-emerald-600';
    if (pct >= 75) return 'text-blue-600';
    if (pct >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Attendance Calendar</h1>
        <p className="text-sm text-slate-500">Visual overview of your ward's attendance</p>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Month navigation */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth(d => subMonths(d, 1))}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="text-lg font-bold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentMonth(d => addMonths(d, 1))}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {d}
            </div>
          ))}

          {/* Padding */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {/* Days */}
          {calDays.map(day => {
            const isToday = isSameDay(day, new Date());
            const colorCls = getDayColor(day);
            const info = getDayInfo(day);
            const hasData = info && info.totalSessions > 0;
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                disabled={!hasData}
                className={`relative flex flex-col items-center rounded-xl py-2.5 transition-all ${colorCls} ${
                  isToday ? 'ring-2 ring-primary-400 ring-offset-1' : ''
                } ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>
                  {format(day, 'd')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          {[
            { label: 'All Present', color: 'bg-emerald-200' },
            { label: 'Partially Present', color: 'bg-amber-200' },
            { label: 'Absent', color: 'bg-red-200' },
            { label: 'No Class', color: 'bg-slate-200' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded-md ${l.color}`} />
              <span className="text-xs text-slate-600">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Monthly Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: 'Total Classes', value: summary.totalSessions ?? 0, icon: CalendarDays, color: 'text-slate-700', bg: 'bg-slate-100' },
            { label: 'Present', value: summary.present ?? 0, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'Absent', value: summary.absent ?? 0, icon: XCircle, color: 'text-red-700', bg: 'bg-red-100' },
            { label: 'Late', value: summary.late ?? 0, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-100' },
            {
              label: 'Percentage',
              value: `${summary.attendanceRate ?? 0}%`,
              icon: CheckCircle2,
              color: getPercentageColor(summary.attendanceRate ?? 0),
              bg: (summary.attendanceRate ?? 0) >= 75 ? 'bg-emerald-100' : 'bg-red-100',
            },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
                <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedDay(null); }}
        title={selectedDay ? format(selectedDay.date, 'EEEE, MMMM d, yyyy') : ''}
      >
        {selectedDay && (
          <div className="space-y-3">
            {(() => {
              const info = selectedDay.info;
              return (
                <>
                  <div className="flex items-center gap-3 rounded-xl p-3 bg-slate-50">
                    <CalendarDays className="h-5 w-5 text-slate-600" />
                    <span className="text-sm text-slate-700">
                      Total Sessions: <strong>{info.totalSessions || 0}</strong>
                    </span>
                  </div>
                  {(info.present || 0) > 0 && (
                    <div className="flex items-center gap-3 rounded-xl p-3 bg-emerald-50">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm text-emerald-700">
                        Present: <strong>{info.present}</strong>
                      </span>
                    </div>
                  )}
                  {(info.late || 0) > 0 && (
                    <div className="flex items-center gap-3 rounded-xl p-3 bg-amber-50">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <span className="text-sm text-amber-700">
                        Late: <strong>{info.late}</strong>
                      </span>
                    </div>
                  )}
                  {(info.absent || 0) > 0 && (
                    <div className="flex items-center gap-3 rounded-xl p-3 bg-red-50">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-sm text-red-700">
                        Absent: <strong>{info.absent}</strong>
                      </span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
