const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  getDashboard,
  getWardAttendance,
  getWardCalendar,
  getWardSummary,
} = require('../controllers/parentController');

router.use(authenticate, authorize('parent'));

router.get('/dashboard', getDashboard);
router.get('/ward/attendance', getWardAttendance);
router.get('/ward/calendar', getWardCalendar);
router.get('/ward/summary', getWardSummary);

module.exports = router;
