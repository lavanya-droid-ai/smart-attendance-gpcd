const mongoose = require('mongoose');
const { ALL_YEARS, DEPARTMENT, DAYS_OF_WEEK } = require('../config/constants');

const scheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM 24-hour format'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use HH:MM 24-hour format'],
    },
  },
  { _id: false }
);

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class/subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      uppercase: true,
      trim: true,
      unique: true,
    },
    department: {
      type: String,
      default: DEPARTMENT,
    },
    year: {
      type: String,
      enum: ALL_YEARS,
      required: [true, 'Year is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    schedule: [scheduleSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

classSchema.index({ teacher: 1 });
classSchema.index({ year: 1, department: 1 });
classSchema.index({ code: 1 }, { unique: true });

classSchema.virtual('studentCount').get(function () {
  return this.students ? this.students.length : 0;
});

classSchema.set('toJSON', { virtuals: true });
classSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Class', classSchema);
