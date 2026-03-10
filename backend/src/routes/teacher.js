const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
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
} = require('../controllers/teacherController');

router.use(authenticate, authorize('teacher', 'admin'));

router.get('/dashboard', getDashboard);
router.get('/daily-report', getDailyReport);

router.get('/classes', getMyClasses);
router.get('/classes/:classId/report', getClassReport);
router.get('/classes/:classId/export', exportAttendance);

router.post('/sessions', startSession);
router.patch('/sessions/:sessionId/end', endSession);
router.get('/sessions/:sessionId/attendance', getSessionAttendance);
router.get('/sessions/:sessionId/live', getLiveAttendance);
router.get('/sessions/:sessionId/absent', getAbsentStudents);
router.post('/sessions/:sessionId/attendance', markManualAttendance);
router.post('/sessions/:sessionId/attendance/bulk', markBulkAttendance);

module.exports = router;
