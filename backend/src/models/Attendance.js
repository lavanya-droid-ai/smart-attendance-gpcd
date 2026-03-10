const mongoose = require('mongoose');
const { ATTENDANCE_METHODS, ATTENDANCE_STATUS } = require('../config/constants');

const attendanceSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    method: {
      type: String,
      enum: Object.values(ATTENDANCE_METHODS),
      required: [true, 'Attendance method is required'],
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    deviceId: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    biometricVerified: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      default: ATTENDANCE_STATUS.PRESENT,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ session: 1, student: 1 }, { unique: true });
attendanceSchema.index({ student: 1, class: 1 });
attendanceSchema.index({ class: 1, markedAt: -1 });
attendanceSchema.index({ session: 1, status: 1 });

attendanceSchema.statics.getSessionSummary = function (sessionId) {
  return this.aggregate([
    { $match: { session: new mongoose.Types.ObjectId(sessionId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);
};

attendanceSchema.statics.getStudentAttendanceRate = async function (studentId, classId) {
  const result = await this.aggregate([
    {
      $match: {
        student: new mongoose.Types.ObjectId(studentId),
        class: new mongoose.Types.ObjectId(classId),
      },
    },
    {
      $group: {
        _id: null,
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
        _id: 0,
        total: 1,
        present: 1,
        rate: {
          $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$present', '$total'] }, 100] }],
        },
      },
    },
  ]);

  return result[0] || { total: 0, present: 0, rate: 0 };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
