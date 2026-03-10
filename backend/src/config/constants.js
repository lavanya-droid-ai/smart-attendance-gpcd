const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
};

const ALL_ROLES = Object.values(ROLES);

const ATTENDANCE_METHODS = {
  BLE: 'ble',
  NFC: 'nfc',
  MANUAL: 'manual',
};

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
};

const SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const YEARS = {
  FIRST: 'First Year',
  SECOND: 'Second Year',
  THIRD: 'Third Year',
  FINAL: 'Final Year',
};

const ALL_YEARS = Object.values(YEARS);

const DEPARTMENT = 'BPT';

const COLLEGE = {
  NAME: 'Govt. Physiotherapy College',
  DOMAIN: 'sybpt.gpcd.edu.in',
  PROGRAM: 'Bachelor of Physiotherapy',
  ABBREVIATION: 'BPT',
  APPROX_STUDENTS_PER_CLASS: 124,
};

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const TOKEN_TYPES = {
  BLE: 'ble',
  NFC: 'nfc',
  SESSION: 'session',
};

const SOCKET_EVENTS = {
  SESSION_STARTED: 'session:started',
  SESSION_ENDED: 'session:ended',
  ATTENDANCE_MARKED: 'attendance:marked',
  ATTENDANCE_UPDATE: 'attendance:update',
  JOIN_SESSION: 'session:join',
  LEAVE_SESSION: 'session:leave',
};

module.exports = {
  ROLES,
  ALL_ROLES,
  ATTENDANCE_METHODS,
  ATTENDANCE_STATUS,
  SESSION_STATUS,
  YEARS,
  ALL_YEARS,
  DEPARTMENT,
  COLLEGE,
  DAYS_OF_WEEK,
  TOKEN_TYPES,
  SOCKET_EVENTS,
};
