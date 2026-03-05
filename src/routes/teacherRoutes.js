const express = require('express');
const teacherController = require('../controllers/teacherController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('teacher'));
router.get('/dashboard', teacherController.getDashboard);
router.post('/students', teacherController.addStudent);
router.post('/students/:id/delete', teacherController.deleteStudent);
router.post('/students/:id/attendance', teacherController.markAttendance);
router.get('/attendance', teacherController.getAttendance);

module.exports = router;
