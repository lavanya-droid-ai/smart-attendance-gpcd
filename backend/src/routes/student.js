const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  getDashboard,
  markBleAttendance,
  markNfcAttendance,
  getMyAttendance,
  getTodayStatus,
  getAttendanceStats,
} = require('../controllers/studentController');

router.use(authenticate, authorize('student'));

router.get('/dashboard', getDashboard);
router.post('/attendance/ble', markBleAttendance);
router.post('/attendance/nfc', markNfcAttendance);
router.get('/attendance', getMyAttendance);
router.get('/attendance/today', getTodayStatus);
router.get('/attendance/stats', getAttendanceStats);

module.exports = router;
