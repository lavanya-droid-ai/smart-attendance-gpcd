const mongoose = require('mongoose');
const { SESSION_STATUS } = require('../config/constants');
const { generateBLEToken, generateNFCToken, generateSessionToken } = require('../utils/tokenGenerator');

const sessionSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class reference is required'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher reference is required'],
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
      default: Date.now,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.ACTIVE,
    },
    bleToken: {
      type: String,
      default: null,
    },
    nfcToken: {
      type: String,
      default: null,
    },
    sessionToken: {
      type: String,
      unique: true,
    },
    attendeesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ class: 1, date: 1 });
sessionSchema.index({ teacher: 1, status: 1 });
sessionSchema.index({ sessionToken: 1 }, { unique: true });
sessionSchema.index({ status: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.methods.isSessionActive = function () {
  return this.status === SESSION_STATUS.ACTIVE && new Date() < this.expiresAt;
};

sessionSchema.methods.refreshTokens = function () {
  this.bleToken = generateBLEToken(this._id, this.class);
  this.nfcToken = generateNFCToken(this._id, this.class);
  return this;
};

sessionSchema.pre('save', function (next) {
  if (this.isNew) {
    this.sessionToken = this.sessionToken || generateSessionToken();
    this.bleToken = this.bleToken || generateBLEToken(this._id, this.class);
    this.nfcToken = this.nfcToken || generateNFCToken(this._id, this.class);
  }
  next();
});

sessionSchema.statics.findActiveSessions = function (teacherId) {
  return this.find({
    teacher: teacherId,
    status: SESSION_STATUS.ACTIVE,
    expiresAt: { $gt: new Date() },
  }).populate('class', 'name code year');
};

module.exports = mongoose.model('Session', sessionSchema);
