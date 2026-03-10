const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');
const { ROLES, SESSION_STATUS, ATTENDANCE_STATUS } = require('../config/constants');

const getDashboard = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [usersByRole, activeSessions, todayAttendance, totalStudents] = await Promise.all([
      User.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Session.countDocuments({
        status: SESSION_STATUS.ACTIVE,
        expiresAt: { $gt: new Date() },
      }),
      Attendance.countDocuments({
        markedAt: { $gte: todayStart, $lte: todayEnd },
        status: { $in: [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE] },
      }),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
    ]);

    const roleCounts = {};
    usersByRole.forEach((r) => { roleCounts[r._id] = r.count; });

    const todaySessions = await Session.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });

    const expectedAttendance = todaySessions > 0 ? todaySessions * totalStudents : 1;
    const attendanceRate = Math.round((todayAttendance / expectedAttendance) * 100);

    res.status(200).json({
      success: true,
      data: {
        users: roleCounts,
        activeSessions,
        todaySessions,
        todayAttendance,
        attendanceRate: Math.min(attendanceRate, 100),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, department, year, search, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (department) filter.department = department;
    if (year) filter.year = year;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('parentOf', 'name email rollNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, employeeId, rollNumber, year, parentOf } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required.',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    const user = await User.create({
      name, email, password, role, phone, employeeId, rollNumber, year, parentOf,
    });

    await AuditLog.log({
      action: 'ADMIN_CREATE_USER',
      actor: req.user._id,
      target: `User:${user._id}`,
      details: { role, email },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, message: `Duplicate value for ${field}.` });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    delete updates.password;

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await AuditLog.log({
      action: 'ADMIN_UPDATE_USER',
      actor: req.user._id,
      target: `User:${user._id}`,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await AuditLog.log({
      action: user.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      actor: req.user._id,
      target: `User:${user._id}`,
      details: { isActive: user.isActive },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};

const getAllClasses = async (req, res) => {
  try {
    const { page = 1, limit = 20, year, isActive } = req.query;

    const filter = {};
    if (year) filter.year = year;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [classes, total] = await Promise.all([
      Class.find(filter)
        .populate('teacher', 'name email employeeId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Class.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        classes,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch classes.' });
  }
};

const createClass = async (req, res) => {
  try {
    const { name, code, year, teacher, schedule } = req.body;

    if (!name || !code || !year || !teacher) {
      return res.status(400).json({
        success: false,
        message: 'Name, code, year, and teacher are required.',
      });
    }

    const teacherUser = await User.findOne({ _id: teacher, role: ROLES.TEACHER, isActive: true });
    if (!teacherUser) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive teacher.',
      });
    }

    const classDoc = await Class.create({ name, code, year, teacher, schedule });

    await AuditLog.log({
      action: 'CLASS_CREATED',
      actor: req.user._id,
      target: `Class:${classDoc._id}`,
      details: { name, code, year, teacher },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const populated = await classDoc.populate('teacher', 'name email employeeId');

    res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      data: { class: populated },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Class code already exists.' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create class.' });
  }
};

const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.teacher) {
      const teacherUser = await User.findOne({
        _id: updates.teacher,
        role: ROLES.TEACHER,
        isActive: true,
      });
      if (!teacherUser) {
        return res.status(400).json({ success: false, message: 'Invalid or inactive teacher.' });
      }
    }

    const classDoc = await Class.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('teacher', 'name email employeeId');

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    await AuditLog.log({
      action: 'CLASS_UPDATED',
      actor: req.user._id,
      target: `Class:${classDoc._id}`,
      details: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Class updated successfully.',
      data: { class: classDoc },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update class.' });
  }
};

const enrollStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Provide an array of student IDs.',
      });
    }

    const validStudents = await User.find({
      _id: { $in: studentIds },
      role: ROLES.STUDENT,
      isActive: true,
    }).select('_id');

    if (validStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid active students found.',
      });
    }

    const validIds = validStudents.map((s) => s._id);

    const classDoc = await Class.findByIdAndUpdate(
      id,
      { $addToSet: { students: { $each: validIds } } },
      { new: true }
    ).populate('teacher', 'name email employeeId');

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    await AuditLog.log({
      action: 'STUDENTS_ENROLLED',
      actor: req.user._id,
      target: `Class:${classDoc._id}`,
      details: { enrolled: validIds.length, requested: studentIds.length },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: `${validIds.length} student(s) enrolled successfully.`,
      data: { class: classDoc },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enroll students.' });
  }
};

const removeStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;

    const classDoc = await Class.findByIdAndUpdate(
      id,
      { $pull: { students: studentId } },
      { new: true }
    ).populate('teacher', 'name email employeeId');

    if (!classDoc) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    await AuditLog.log({
      action: 'STUDENT_REMOVED',
      actor: req.user._id,
      target: `Class:${classDoc._id}`,
      details: { studentId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Student removed from class.',
      data: { class: classDoc },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove student.' });
  }
};

const resetDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const previousDeviceId = user.deviceId;
    user.deviceId = null;
    await user.save();

    await AuditLog.log({
      action: 'DEVICE_RESET',
      actor: req.user._id,
      target: `User:${user._id}`,
      details: { previousDeviceId },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Device binding reset successfully.',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset device binding.' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [departmentStats, yearStats] = await Promise.all([
      Attendance.aggregate([
        { $match: { markedAt: { $gte: thirtyDaysAgo } } },
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo',
          },
        },
        { $unwind: '$classInfo' },
        {
          $group: {
            _id: '$classInfo.department',
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [
                  { $in: ['$status', [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            department: '$_id',
            _id: 0,
            total: 1,
            present: 1,
            rate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
              ],
            },
          },
        },
      ]),
      Attendance.aggregate([
        { $match: { markedAt: { $gte: thirtyDaysAgo } } },
        {
          $lookup: {
            from: 'classes',
            localField: 'class',
            foreignField: '_id',
            as: 'classInfo',
          },
        },
        { $unwind: '$classInfo' },
        {
          $group: {
            _id: '$classInfo.year',
            total: { $sum: 1 },
            present: {
              $sum: {
                $cond: [
                  { $in: ['$status', [ATTENDANCE_STATUS.PRESENT, ATTENDANCE_STATUS.LATE]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            year: '$_id',
            _id: 0,
            total: 1,
            present: 1,
            rate: {
              $cond: [
                { $eq: ['$total', 0] },
                0,
                { $round: [{ $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 1] },
              ],
            },
          },
        },
        { $sort: { year: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { departmentStats, yearStats, period: '30 days' },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

module.exports = {
  getDashboard,
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  resetDevice,
  getAllClasses,
  createClass,
  updateClass,
  enrollStudents,
  removeStudent,
  getAnalytics,
};
