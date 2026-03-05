const express = require('express');
const adminController = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireRole('admin'));
router.get('/dashboard', adminController.getDashboard);
router.post('/teachers', adminController.addTeacher);
router.post('/teachers/:id/delete', adminController.deleteTeacher);

module.exports = router;
