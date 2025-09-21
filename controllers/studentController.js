const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Grade = require('../models/Grade');
const moment = require('moment');

// Render student dashboard
const renderDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get student's classes
    const classes = await Class.find({ studentIds: studentId })
      .populate('facultyId', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    // Get upcoming exams (next 30 days)
    const upcomingExams = await Exam.find({
      classId: { $in: classes.map(c => c._id) },
      scheduledDate: { 
        $gte: new Date(),
        $lte: moment().add(30, 'days').toDate()
      },
      status: { $in: ['Scheduled'] }
    })
    .populate('classId', 'className classCode')
    .sort({ scheduledDate: 1 })
    .limit(5);
    
    // Get recent grades
    const recentGrades = await Grade.find({ studentId })
      .populate('classId', 'className classCode subject')
      .sort({ gradedAt: -1 })
      .limit(5);
    
    // Calculate quick stats
    const totalClasses = classes.length;
    const totalUpcomingExams = upcomingExams.length;
    const completedExams = await Exam.countDocuments({
      classId: { $in: classes.map(c => c._id) },
      scheduledDate: { $lt: new Date() },
      status: 'Completed'
    });
    
    // Calculate GPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    recentGrades.forEach(grade => {
      if (grade.gradePoints !== null) {
        totalGradePoints += grade.gradePoints;
        totalCredits += 1; // Assuming 1 credit per course for now
      }
    });
    const currentGPA = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 'N/A';
    
    res.render('student/dashboard', {
      title: 'Student Dashboard - Lab Exam Portal',
      user: req.user,
      classes,
      upcomingExams,
      recentGrades,
      stats: {
        totalClasses,
        totalUpcomingExams,
        completedExams,
        currentGPA
      },
      moment,
      currentPage: 'dashboard'
    });
    
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load dashboard',
      error: { status: 500 }
    });
  }
};

// Render classes page
const renderClasses = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const classes = await Class.find({ studentIds: studentId })
      .populate('facultyId', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    // Get upcoming assignments for each class
    const classesWithExams = await Promise.all(
      classes.map(async (classItem) => {
        const upcomingExams = await Exam.find({
          classId: classItem._id,
          scheduledDate: { $gte: new Date() },
          status: 'Scheduled'
        }).sort({ scheduledDate: 1 }).limit(3);
        
        return {
          ...classItem.toObject(),
          upcomingExams
        };
      })
    );
    
    res.render('student/classes', {
      title: 'My Classes - Lab Exam Portal',
      user: req.user,
      classes: classesWithExams,
      moment,
      currentPage: 'classes'
    });
    
  } catch (error) {
    console.error('Student classes error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load classes',
      error: { status: 500 }
    });
  }
};

// Render exams page
const renderExams = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get student's classes
    const classes = await Class.find({ studentIds: studentId });
    const classIds = classes.map(c => c._id);
    
    // Get all upcoming exams
    const upcomingExams = await Exam.find({
      classId: { $in: classIds },
      scheduledDate: { $gte: new Date() },
      status: 'Scheduled'
    })
    .populate('classId', 'className classCode subject')
    .populate('facultyId', 'firstName lastName')
    .sort({ scheduledDate: 1 });
    
    // Get past exams (for reference)
    const pastExams = await Exam.find({
      classId: { $in: classIds },
      scheduledDate: { $lt: new Date() }
    })
    .populate('classId', 'className classCode subject')
    .sort({ scheduledDate: -1 })
    .limit(10);
    
    res.render('student/exams', {
      title: 'Upcoming Exams - Lab Exam Portal',
      user: req.user,
      upcomingExams,
      pastExams,
      moment,
      currentPage: 'exams'
    });
    
  } catch (error) {
    console.error('Student exams error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load exams',
      error: { status: 500 }
    });
  }
};

// Render results page
const renderResults = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    const grades = await Grade.find({ studentId })
      .populate('classId', 'className classCode subject')
      .sort({ semester: -1, year: -1 });
    
    // Group by semester and year
    const groupedGrades = {};
    grades.forEach(grade => {
      const key = `${grade.year}-S${grade.semester}`;
      if (!groupedGrades[key]) {
        groupedGrades[key] = {
          semester: grade.semester,
          year: grade.year,
          grades: [],
          totalGradePoints: 0,
          totalCredits: 0,
          sgpa: 0
        };
      }
      groupedGrades[key].grades.push(grade);
      
      if (grade.gradePoints !== null) {
        groupedGrades[key].totalGradePoints += grade.gradePoints;
        groupedGrades[key].totalCredits += 1;
      }
    });
    
    // Calculate SGPA for each semester
    Object.keys(groupedGrades).forEach(key => {
      const semesterData = groupedGrades[key];
      if (semesterData.totalCredits > 0) {
        semesterData.sgpa = (semesterData.totalGradePoints / semesterData.totalCredits).toFixed(2);
      }
    });
    
    res.render('student/results', {
      title: 'Latest Results - Lab Exam Portal',
      user: req.user,
      groupedGrades,
      moment,
      currentPage: 'results'
    });
    
  } catch (error) {
    console.error('Student results error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load results',
      error: { status: 500 }
    });
  }
};

// Render faculties page
const renderFaculties = async (req, res) => {
  try {
    const studentId = req.user._id;
    
    // Get student's classes with faculty info
    const classes = await Class.find({ studentIds: studentId })
      .populate('facultyId', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    // Extract unique faculties
    const facultyMap = new Map();
    classes.forEach(classItem => {
      if (classItem.facultyId) {
        const facultyId = classItem.facultyId._id.toString();
        if (!facultyMap.has(facultyId)) {
          facultyMap.set(facultyId, {
            ...classItem.facultyId.toObject(),
            classes: []
          });
        }
        facultyMap.get(facultyId).classes.push({
          className: classItem.className,
          classCode: classItem.classCode,
          subject: classItem.subject
        });
      }
    });
    
    const faculties = Array.from(facultyMap.values());
    
    res.render('student/faculties', {
      title: 'Faculty Contacts - Lab Exam Portal',
      user: req.user,
      faculties,
      currentPage: 'faculties'
    });
    
  } catch (error) {
    console.error('Student faculties error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load faculties',
      error: { status: 500 }
    });
  }
};

// Render settings page
const renderSettings = async (req, res) => {
  try {
    res.render('shared/settings', {
      title: 'Settings - Lab Exam Portal',
      user: req.user,
      currentPage: 'settings',
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('Settings error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load settings',
      error: { status: 500 }
    });
  }
};

module.exports = {
  renderDashboard,
  renderClasses,
  renderExams,
  renderResults,
  renderFaculties,
  renderSettings
};
