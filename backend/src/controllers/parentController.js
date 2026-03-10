const User = require('../models/User');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { ATTENDANCE_STATUS, SESSION_STATUS } = require('../config/constants');

const getWard = async (parentId) => {
  const parent = await User.findById(parentId);
  if (!parent || !parent.parentOf) return null;
  return User.findById(parent.parentOf).select('name email rollNumber year');
};

const getDashboard = async (req, res) => {
  try {
    const ward = await getWard(req.user._id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const enrolledClasses = await Class.find({
      students: ward._id,
      isActive: true,
    }).select('_id name code');

    const classIds = enrolledClasses.map((c) => c._id);

    const [todaySessions, todayAttendance, totalPresent, totalSessions] = await Promise.all([
      Session.find({
        class: { $in: classIds },
        date: { $gte: todayStart, $lte: todayEnd },
      }).populate('class', 'name code'),
      Attendance.find({
        student: ward._id,
        markedAt: { $gte: todayStart, $lte: todayEnd },
      }).populate('class', 'name code'),
      Attendance.countDocuments({
        student: ward._id,
        class: { $in: classIds },
        status: { $in: [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE] },
      }),
      Session.countDocuments({
        class: { $in: classIds },
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED] },
      }),
    ]);

    const overallPercentage = totalSessions > 0
      ? Math.round((totalPresent / totalSessions) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        ward,
        todaySessions: todaySessions.length,
        todayAttendance,
        overallPercentage: Math.min(overallPercentage, 100),
        enrolledClasses: enrolledClasses.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

const getWardAttendance = async (req, res) => {
  try {
    const ward = await getWard(req.user._id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const { classId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { student: ward._id };
    if (classId) filter.class = classId;
    if (startDate || endDate) {
      filter.markedAt = {};
      if (startDate) filter.markedAt.$gte = new Date(startDate);
      if (endDate) filter.markedAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('class', 'name code')
        .populate('session', 'date startTime endTime')
        .sort({ markedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Attendance.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ward,
        records,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ward attendance.' });
  }
};

const getWardCalendar = async (req, res) => {
  try {
    const ward = await getWard(req.user._id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const { month, year } = req.query;
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const enrolledClasses = await Class.find({
      students: ward._id,
      isActive: true,
    }).select('_id');
    const classIds = enrolledClasses.map((c) => c._id);

    const [sessions, attendance] = await Promise.all([
      Session.find({
        class: { $in: classIds },
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED] },
      }).select('date class'),
      Attendance.find({
        student: ward._id,
        class: { $in: classIds },
        markedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }).select('markedAt status session'),
    ]);

    const calendar = {};

    sessions.forEach((session) => {
      const day = new Date(session.date).getDate();
      if (!calendar[day]) calendar[day] = { totalSessions: 0, present: 0, late: 0, absent: 0 };
      calendar[day].totalSessions++;
    });

    const attendedSessionIds = new Set();
    attendance.forEach((record) => {
      const day = new Date(record.markedAt).getDate();
      if (!calendar[day]) calendar[day] = { totalSessions: 0, present: 0, late: 0, absent: 0 };
      attendedSessionIds.add(record.session.toString());
      if (record.status === ATTENDANCE_STATUS.PRESENT) calendar[day].present++;
      else if (record.status === ATTENDANCE_STATUS.LATE) calendar[day].late++;
    });

    Object.keys(calendar).forEach((day) => {
      const entry = calendar[day];
      entry.absent = entry.totalSessions - entry.present - entry.late;
      if (entry.absent < 0) entry.absent = 0;
    });

    res.status(200).json({
      success: true,
      data: { ward, month: m, year: y, calendar },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch calendar.' });
  }
};

const getWardSummary = async (req, res) => {
  try {
    const ward = await getWard(req.user._id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found.' });
    }

    const { month, year } = req.query;
    const m = parseInt(month, 10) || new Date().getMonth() + 1;
    const y = parseInt(year, 10) || new Date().getFullYear();

    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const enrolledClasses = await Class.find({
      students: ward._id,
      isActive: true,
    }).select('_id name code');
    const classIds = enrolledClasses.map((c) => c._id);

    const [totalSessions, attendanceRecords] = await Promise.all([
      Session.countDocuments({
        class: { $in: classIds },
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED] },
      }),
      Attendance.aggregate([
        {
          $match: {
            student: ward._id,
            class: { $in: classIds },
            markedAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = { present: 0, late: 0, absent: 0 };
    attendanceRecords.forEach((r) => {
      if (r._id === ATTENDANCE_STATUS.PRESENT) statusCounts.present = r.count;
      else if (r._id === ATTENDANCE_STATUS.LATE) statusCounts.late = r.count;
    });

    const totalMarked = statusCounts.present + statusCounts.late;
    statusCounts.absent = Math.max(totalSessions - totalMarked, 0);

    const attendanceRate = totalSessions > 0
      ? Math.round((totalMarked / totalSessions) * 100)
      : 0;

    const perClass = await Promise.all(
      enrolledClasses.map(async (cls) => {
        const rate = await Attendance.getStudentAttendanceRate(ward._id, cls._id);
        return { class: cls, ...rate };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        ward,
        month: m,
        year: y,
        totalSessions,
        ...statusCounts,
        attendanceRate: Math.min(attendanceRate, 100),
        perClass,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary.' });
  }
};

module.exports = {
  getDashboard,
  getWardAttendance,
  getWardCalendar,
  getWardSummary,
};
