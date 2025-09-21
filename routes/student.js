const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

const router = express.Router();

// Apply authentication and role authorization to all routes
router.use(authenticateToken);
router.use(authorizeRole('Student'));

// Student dashboard routes
router.get('/dashboard', studentController.renderDashboard);
router.get('/classes', studentController.renderClasses);
router.get('/exams', studentController.renderExams);
router.get('/results', studentController.renderResults);
router.get('/faculties', studentController.renderFaculties);
router.get('/settings', studentController.renderSettings);

// API routes for AJAX calls (future use)
router.get('/api/dashboard-stats', async (req, res) => {
  try {
    // Quick stats for dashboard updates
    res.json({
      success: true,
      message: 'API endpoint ready for future use'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
