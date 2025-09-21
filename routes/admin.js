const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    renderDashboard,
    renderFacultyManagement,
    renderStudentManagement,
    renderClassManagement,
    renderResultsMonitoring,
    renderAttendanceMonitoring,
    renderSettings
} = require('../controllers/adminController');

const router = express.Router();

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(authorizeRole('Admin'));

// Dashboard
router.get('/', renderDashboard);
router.get('/dashboard', renderDashboard);

// Management pages
router.get('/faculty', renderFacultyManagement);
router.get('/students', renderStudentManagement);
router.get('/classes', renderClassManagement);
router.get('/results', renderResultsMonitoring);
router.get('/attendance', renderAttendanceMonitoring);
router.get('/settings', renderSettings);

module.exports = router;
