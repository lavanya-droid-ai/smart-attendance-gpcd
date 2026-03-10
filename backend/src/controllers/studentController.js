const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { validateAttendanceToken } = require('../utils/tokenGenerator');
const {
  TOKEN_TYPES,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  SOCKET_EVENTS,
} = require('../config/constants');

const getDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const enrolledClasses = await Class.find({
      students: studentId,
      isActive: true,
    }).select('_id name code');

    const classIds = enrolledClasses.map((c) => c._id);

    const [todayAttendance, totalAttendance, totalSessions, recentSessions] = await Promise.all([
      Attendance.find({
        student: studentId,
        class: { $in: classIds },
        markedAt: { $gte: todayStart, $lte: todayEnd },
      })
        .populate('class', 'name code')
        .populate('session', 'startTime endTime'),
      Attendance.countDocuments({
        student: studentId,
        class: { $in: classIds },
        status: { $in: [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE] },
      }),
      Session.countDocuments({
        class: { $in: classIds },
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED] },
      }),
      Session.find({
        class: { $in: classIds },
        status: { $in: [SESSION_STATUS.ACTIVE, SESSION_STATUS.COMPLETED] },
      })
        .populate('class', 'name code')
        .sort({ date: -1 })
        .limit(10),
    ]);

    const overallPercentage = totalSessions > 0
      ? Math.round((totalAttendance / totalSessions) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        enrolledClasses: enrolledClasses.length,
        todayAttendance,
        overallPercentage: Math.min(overallPercentage, 100),
        recentSessions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

const markBleAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { token, deviceId } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'BLE token is required.' });
    }

    const decoded = validateAttendanceToken(token, TOKEN_TYPES.BLE);
    if (!decoded.valid) {
      return res.status(400).json({ success: false, message: decoded.error });
    }

    const session = await Session.findById(decoded.sessionId);

    if (!session || !session.isSessionActive()) {
      return res.status(400).json({ success: false, message: 'Session is not active or has expired.' });
    }

    const classDoc = await Class.findById(decoded.classId);
    if (!classDoc || !classDoc.students.some((s) => s.equals(studentId))) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class.',
      });
    }

    const existing = await Attendance.findOne({ session: session._id, student: studentId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session.',
        data: { attendance: existing },
      });
    }

    const isLate = (new Date() - session.startTime) > 15 * 60 * 1000;

    const attendance = await Attendance.create({
      session: session._id,
      student: studentId,
      class: decoded.classId,
      method: ATTENDANCE_METHODS.BLE,
      status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
      isLate,
      deviceId,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${session._id}`).emit(SOCKET_EVENTS.ATTENDANCE_MARKED, {
        sessionId: session._id,
        studentId,
        studentName: req.user.name,
        method: ATTENDANCE_METHODS.BLE,
        status: attendance.status,
      });
    }

    await AuditLog.log({
      action: 'BLE_ATTENDANCE_MARKED',
      actor: studentId,
      target: `Attendance:${attendance._id}`,
      details: { sessionId: session._id, method: ATTENDANCE_METHODS.BLE, isLate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: isLate ? 'Attendance marked (late).' : 'Attendance marked successfully.',
      data: { attendance },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this session.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to mark BLE attendance.' });
  }
};

const markNfcAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { token, deviceId } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'NFC token is required.' });
    }

    const decoded = validateAttendanceToken(token, TOKEN_TYPES.NFC);
    if (!decoded.valid) {
      return res.status(400).json({ success: false, message: decoded.error });
    }

    const session = await Session.findById(decoded.sessionId);

    if (!session || !session.isSessionActive()) {
      return res.status(400).json({ success: false, message: 'Session is not active or has expired.' });
    }

    const classDoc = await Class.findById(decoded.classId);
    if (!classDoc || !classDoc.students.some((s) => s.equals(studentId))) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in this class.',
      });
    }

    const existing = await Attendance.findOne({ session: session._id, student: studentId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this session.',
        data: { attendance: existing },
      });
    }

    const isLate = (new Date() - session.startTime) > 15 * 60 * 1000;

    const attendance = await Attendance.create({
      session: session._id,
      student: studentId,
      class: decoded.classId,
      method: ATTENDANCE_METHODS.NFC,
      status: isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.PRESENT,
      isLate,
      deviceId,
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${session._id}`).emit(SOCKET_EVENTS.ATTENDANCE_MARKED, {
        sessionId: session._id,
        studentId,
        studentName: req.user.name,
        method: ATTENDANCE_METHODS.NFC,
        status: attendance.status,
      });
    }

    await AuditLog.log({
      action: 'NFC_ATTENDANCE_MARKED',
      actor: studentId,
      target: `Attendance:${attendance._id}`,
      details: { sessionId: session._id, method: ATTENDANCE_METHODS.NFC, isLate },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: isLate ? 'Attendance marked (late).' : 'Attendance marked successfully.',
      data: { attendance },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this session.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to mark NFC attendance.' });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { classId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { student: studentId };

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
    res.status(500).json({ success: false, message: 'Failed to fetch attendance records.' });
  }
};

const getTodayStatus = async (req, res) => {
  try {
    const studentId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const enrolledClasses = await Class.find({
      students: studentId,
      isActive: true,
    }).select('_id name code');

    const classIds = enrolledClasses.map((c) => c._id);

    const todaySessions = await Session.find({
      class: { $in: classIds },
      date: { $gte: todayStart, $lte: todayEnd },
    }).populate('class', 'name code');

    const sessionIds = todaySessions.map((s) => s._id);

    const attendanceRecords = await Attendance.find({
      student: studentId,
      session: { $in: sessionIds },
    });

    const markedSessionIds = new Set(attendanceRecords.map((a) => a.session.toString()));

    const status = todaySessions.map((session) => {
      const record = attendanceRecords.find(
        (a) => a.session.toString() === session._id.toString()
      );
      return {
        session,
        attended: markedSessionIds.has(session._id.toString()),
        status: record ? record.status : ATTENDANCE_STATUS.ABSENT,
        method: record ? record.method : null,
      };
    });

    res.status(200).json({ success: true, data: { date: todayStart, status } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s status.' });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrolledClasses = await Class.find({
      students: studentId,
      isActive: true,
    }).select('_id name code');

    const stats = await Promise.all(
      enrolledClasses.map(async (cls) => {
        const rate = await Attendance.getStudentAttendanceRate(studentId, cls._id);
        return { class: cls, ...rate };
      })
    );

    const totalPresent = stats.reduce((sum, s) => sum + s.present, 0);
    const totalSessions = stats.reduce((sum, s) => sum + s.total, 0);
    const overallRate = totalSessions > 0
      ? Math.round((totalPresent / totalSessions) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: { stats, overallRate },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance stats.' });
  }
};

module.exports = {
  getDashboard,
  markBleAttendance,
  markNfcAttendance,
  getMyAttendance,
  getTodayStatus,
  getAttendanceStats,
};
