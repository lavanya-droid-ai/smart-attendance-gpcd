const mongoose = require('mongoose');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { SESSION_STATUS, ATTENDANCE_METHODS, ATTENDANCE_STATUS, SOCKET_EVENTS } = require('../config/constants');

const getDashboard = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [classes, todaySessions, activeSessions] = await Promise.all([
      Class.find({ teacher: teacherId, isActive: true }).select('name code year studentCount'),
      Session.find({
        teacher: teacherId,
        date: { $gte: todayStart, $lte: todayEnd },
      }).populate('class', 'name code'),
      Session.findActiveSessions(teacherId),
    ]);

    const sessionIds = todaySessions.map((s) => s._id);
    const attendanceSummary = await Attendance.aggregate([
      { $match: { session: { $in: sessionIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {};
    attendanceSummary.forEach((s) => { summary[s._id] = s.count; });

    res.status(200).json({
      success: true,
      data: {
        totalClasses: classes.length,
        classes,
        todaySessions,
        activeSessions,
        attendanceSummary: summary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

const getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user._id, isActive: true })
      .populate('students', 'name email rollNumber year')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { classes } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.' });
  }
};

const startSession = async (req, res) => {
  try {
    const { classId, duration } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Class ID is required.' });
    }

    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user._id,
      isActive: true,
    });

    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: 'Class not found or you are not assigned to this class.',
      });
    }

    const existingActive = await Session.findOne({
      class: classId,
      teacher: req.user._id,
      status: SESSION_STATUS.ACTIVE,
      expiresAt: { $gt: new Date() },
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        message: 'An active session already exists for this class.',
        data: { session: existingActive },
      });
    }

    const durationMs = (duration || 60) * 60 * 1000;
    const now = new Date();

    const session = await Session.create({
      class: classId,
      teacher: req.user._id,
      date: now,
      startTime: now,
      endTime: new Date(now.getTime() + durationMs),
      expiresAt: new Date(now.getTime() + durationMs),
    });

    await session.populate('class', 'name code year');

    const io = req.app.get('io');
    if (io) {
      io.to(`class:${classId}`).emit(SOCKET_EVENTS.SESSION_STARTED, {
        sessionId: session._id,
        classId,
        className: classDoc.name,
        bleToken: session.bleToken,
        nfcToken: session.nfcToken,
      });
    }

    await AuditLog.log({
      action: 'SESSION_STARTED',
      actor: req.user._id,
      target: `Session:${session._id}`,
      details: { classId, className: classDoc.name },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Session started successfully.',
      data: {
        session,
        bleToken: session.bleToken,
        nfcToken: session.nfcToken,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to start session.' });
  }
};

const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    if (session.status !== SESSION_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: 'Session is not active.' });
    }

    const attendeesCount = await Attendance.countDocuments({
      session: sessionId,
      status: { $in: [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE] },
    });

    session.status = SESSION_STATUS.COMPLETED;
    session.endTime = new Date();
    session.attendeesCount = attendeesCount;
    await session.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit(SOCKET_EVENTS.SESSION_ENDED, {
        sessionId: session._id,
        classId: session.class,
        attendeesCount,
      });
    }

    await AuditLog.log({
      action: 'SESSION_ENDED',
      actor: req.user._id,
      target: `Session:${session._id}`,
      details: { attendeesCount },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Session ended successfully.',
      data: { session, attendeesCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to end session.' });
  }
};

const getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
    }).populate('class', 'name code students');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const attendance = await Attendance.find({ session: sessionId })
      .populate('student', 'name email rollNumber')
      .populate('markedBy', 'name email')
      .sort({ markedAt: 1 });

    const summary = await Attendance.getSessionSummary(sessionId);

    res.status(200).json({
      success: true,
      data: {
        session,
        attendance,
        summary,
        totalStudents: session.class.students ? session.class.students.length : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch attendance.' });
  }
};

const getLiveAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
      status: SESSION_STATUS.ACTIVE,
    }).populate('class', 'name code students');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found.',
      });
    }

    const attendance = await Attendance.find({ session: sessionId })
      .populate('student', 'name email rollNumber')
      .sort({ markedAt: -1 });

    const markedStudentIds = attendance.map((a) => a.student._id.toString());
    const totalStudents = session.class.students ? session.class.students.length : 0;

    res.status(200).json({
      success: true,
      data: {
        session,
        attendance,
        markedCount: attendance.length,
        totalStudents,
        pendingCount: totalStudents - markedStudentIds.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch live attendance.' });
  }
};

const markManualAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentId, status = ATTENDANCE_STATUS.PRESENT, remarks } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required.' });
    }

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const existing = await Attendance.findOne({ session: sessionId, student: studentId });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already marked for this student.',
        data: { attendance: existing },
      });
    }

    const attendance = await Attendance.create({
      session: sessionId,
      student: studentId,
      class: session.class,
      method: ATTENDANCE_METHODS.MANUAL,
      markedBy: req.user._id,
      status,
      remarks,
    });

    await attendance.populate('student', 'name email rollNumber');

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit(SOCKET_EVENTS.ATTENDANCE_MARKED, {
        sessionId,
        studentId,
        method: ATTENDANCE_METHODS.MANUAL,
        status,
      });
    }

    await AuditLog.log({
      action: 'MANUAL_ATTENDANCE_MARKED',
      actor: req.user._id,
      target: `Attendance:${attendance._id}`,
      details: { sessionId, studentId, method: ATTENDANCE_METHODS.MANUAL },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked manually.',
      data: { attendance },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for this student in this session.',
      });
    }
    res.status(500).json({ success: false, message: 'Failed to mark attendance.' });
  }
};

const markBulkAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { studentIds, status = ATTENDANCE_STATUS.PRESENT, remarks } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of student IDs.',
      });
    }

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const existingRecords = await Attendance.find({
      session: sessionId,
      student: { $in: studentIds },
    }).select('student');

    const alreadyMarked = new Set(existingRecords.map((r) => r.student.toString()));
    const newStudentIds = studentIds.filter((id) => !alreadyMarked.has(id));

    if (newStudentIds.length === 0) {
      return res.status(409).json({
        success: false,
        message: 'All students already have attendance recorded.',
      });
    }

    const records = newStudentIds.map((studentId) => ({
      session: sessionId,
      student: studentId,
      class: session.class,
      method: ATTENDANCE_METHODS.MANUAL,
      markedBy: req.user._id,
      status,
      remarks,
    }));

    const inserted = await Attendance.insertMany(records, { ordered: false });

    const io = req.app.get('io');
    if (io) {
      io.to(`session:${sessionId}`).emit(SOCKET_EVENTS.ATTENDANCE_UPDATE, {
        sessionId,
        count: inserted.length,
        method: ATTENDANCE_METHODS.MANUAL,
      });
    }

    await AuditLog.log({
      action: 'BULK_ATTENDANCE_MARKED',
      actor: req.user._id,
      target: `Session:${sessionId}`,
      details: { count: inserted.length, skipped: alreadyMarked.size },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: `${inserted.length} attendance record(s) created. ${alreadyMarked.size} skipped (already marked).`,
      data: { created: inserted.length, skipped: alreadyMarked.size },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to mark bulk attendance.' });
  }
};

const getAbsentStudents = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      teacher: req.user._id,
    }).populate('class', 'students');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    const markedRecords = await Attendance.find({ session: sessionId }).select('student');
    const markedIds = new Set(markedRecords.map((r) => r.student.toString()));

    const absentIds = (session.class.students || []).filter(
      (id) => !markedIds.has(id.toString())
    );

    const absentStudents = await mongoose.model('User')
      .find({ _id: { $in: absentIds } })
      .select('name email rollNumber year')
      .sort({ rollNumber: 1 });

    res.status(200).json({
      success: true,
      data: {
        absentStudents,
        absentCount: absentStudents.length,
        totalStudents: session.class.students.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch absent students.' });
  }
};

const getClassReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;

    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user._id,
    }).populate('students', 'name email rollNumber');

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const sessionFilter = { class: classId };
    if (Object.keys(dateFilter).length > 0) sessionFilter.date = dateFilter;

    const sessions = await Session.find(sessionFilter).sort({ date: -1 });

    const studentStats = await Promise.all(
      (classDoc.students || []).map(async (student) => {
        const rate = await Attendance.getStudentAttendanceRate(student._id, classId);
        return { student, ...rate };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        class: classDoc,
        sessions,
        studentStats,
        totalSessions: sessions.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report.' });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { Parser } = require('json2csv');
    const { classId } = req.params;
    const { sessionId, startDate, endDate } = req.query;

    const classDoc = await Class.findOne({
      _id: classId,
      teacher: req.user._id,
    });

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    const filter = { class: classId };

    if (sessionId) {
      filter.session = sessionId;
    } else {
      if (startDate || endDate) {
        filter.markedAt = {};
        if (startDate) filter.markedAt.$gte = new Date(startDate);
        if (endDate) filter.markedAt.$lte = new Date(endDate);
      }
    }

    const records = await Attendance.find(filter)
      .populate('student', 'name email rollNumber year')
      .populate('session', 'date startTime')
      .populate('markedBy', 'name')
      .sort({ markedAt: 1 });

    const data = records.map((r) => ({
      Date: r.session ? new Date(r.session.date).toLocaleDateString() : '',
      'Roll Number': r.student ? r.student.rollNumber : '',
      'Student Name': r.student ? r.student.name : '',
      Email: r.student ? r.student.email : '',
      Year: r.student ? r.student.year : '',
      Status: r.status,
      Method: r.method,
      'Marked At': new Date(r.markedAt).toLocaleString(),
      'Marked By': r.markedBy ? r.markedBy.name : 'Self',
      Remarks: r.remarks || '',
    }));

    const fields = [
      'Date', 'Roll Number', 'Student Name', 'Email', 'Year',
      'Status', 'Method', 'Marked At', 'Marked By', 'Remarks',
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${classDoc.code}_${Date.now()}.csv`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to export attendance.' });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const classes = await Class.find({ teacher: teacherId, isActive: true }).select('_id name code students');

    const report = await Promise.all(
      classes.map(async (cls) => {
        const sessions = await Session.find({
          class: cls._id,
          date: { $gte: todayStart, $lte: todayEnd },
        });

        const sessionIds = sessions.map((s) => s._id);

        const presentCount = await Attendance.countDocuments({
          session: { $in: sessionIds },
          status: { $in: [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE] },
        });

        return {
          class: cls,
          sessionsToday: sessions.length,
          totalStudents: cls.students ? cls.students.length : 0,
          presentCount,
          attendanceRate: cls.students && cls.students.length > 0
            ? Math.round((presentCount / (cls.students.length * Math.max(sessions.length, 1))) * 100)
            : 0,
        };
      })
    );

    res.status(200).json({ success: true, data: { date: todayStart, report } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate daily report.' });
  }
};

module.exports = {
  getDashboard,
  getMyClasses,
  startSession,
  endSession,
  getSessionAttendance,
  getLiveAttendance,
  markManualAttendance,
  markBulkAttendance,
  getAbsentStudents,
  getClassReport,
  exportAttendance,
  getDailyReport,
};
