const router = require('express').Router();
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  getDashboard,
  getAllUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  getAllClasses,
  createClass,
  updateClass,
  enrollStudents,
  removeStudent,
  getAnalytics,
} = require('../controllers/adminController');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

router.get('/classes', getAllClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.post('/classes/:id/enroll', enrollStudents);
router.delete('/classes/:id/students/:studentId', removeStudent);

router.get('/analytics', getAnalytics);

module.exports = router;
