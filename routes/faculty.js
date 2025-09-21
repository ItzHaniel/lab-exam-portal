const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const facultyController = require('../controllers/facultyController');

const router = express.Router();

// Apply authentication and role authorization to all routes
router.use(authenticateToken);
router.use(authorizeRole('Faculty'));

// Faculty dashboard routes
router.get('/dashboard', facultyController.renderDashboard);
router.get('/attendance', facultyController.renderAttendance);
router.get('/grading', facultyController.renderGrading);
router.get('/results', facultyController.renderResults);
router.get('/students', facultyController.renderStudentManagement);
router.get('/settings', require('../controllers/studentController').renderSettings);

module.exports = router;
