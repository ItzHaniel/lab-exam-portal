const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const StudentRequest = require('../models/StudentRequest');
const moment = require('moment');

// Render faculty dashboard
const renderDashboard = async (req, res) => {
  try {
    const facultyId = req.user._id;
    
    // Get faculty's classes
    const classes = await Class.find({ facultyId })
      .populate('studentIds', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    // Get upcoming exams faculty needs to conduct
    const upcomingExams = await Exam.find({
      facultyId,
      scheduledDate: { 
        $gte: new Date(),
        $lte: moment().add(30, 'days').toDate()
      },
      status: { $in: ['Scheduled'] }
    })
    .populate('classId', 'className classCode')
    .sort({ scheduledDate: 1 })
    .limit(5);
    
    // Get recent grading activity
    const recentGrades = await Grade.find({ 
      gradedBy: facultyId,
      gradedAt: { $exists: true }
    })
    .populate('studentId', 'firstName lastName')
    .populate('classId', 'className classCode')
    .sort({ gradedAt: -1 })
    .limit(5);
    
    // Get pending student requests
    const pendingRequests = await StudentRequest.find({
      facultyId,
      status: 'Pending'
    })
    .populate('studentId', 'firstName lastName')
    .populate('classId', 'className classCode')
    .sort({ createdAt: -1 })
    .limit(5);
    
    // Calculate quick stats
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + cls.studentIds.length, 0);
    const totalUpcomingExams = upcomingExams.length;
    
    // Get today's classes for attendance marking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todaysClasses = classes.filter(cls => {
      const currentDay = moment().format('dddd');
      return cls.schedule.some(schedule => schedule.dayOfWeek === currentDay);
    });
    
    res.render('faculty/dashboard', {
      title: 'Faculty Dashboard - Lab Exam Portal',
      user: req.user,
      classes,
      upcomingExams,
      recentGrades,
      pendingRequests,
      todaysClasses,
      stats: {
        totalClasses,
        totalStudents,
        totalUpcomingExams,
        pendingRequests: pendingRequests.length
      },
      moment,
      currentPage: 'dashboard'
    });
    
  } catch (error) {
    console.error('Faculty dashboard error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load dashboard',
      error: { status: 500 }
    });
  }
};

// Render attendance page
const renderAttendance = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const { classId, date, status } = req.query;
    
    // Get faculty's classes
    const classes = await Class.find({ facultyId })
      .populate('studentIds', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    let attendanceRecords = [];
    let selectedClass = null;
    let selectedDate = date || moment().format('YYYY-MM-DD');
    
    if (classId) {
      selectedClass = await Class.findOne({ _id: classId, facultyId })
        .populate('studentIds', 'firstName lastName email');
      
      if (selectedClass) {
        // Get attendance records for the selected class and date
        const query = {
          classId: selectedClass._id,
          date: {
            $gte: new Date(selectedDate),
            $lt: moment(selectedDate).add(1, 'day').toDate()
          }
        };
        
        if (status && status !== 'all') {
          query.status = status;
        }
        
        attendanceRecords = await Attendance.find(query)
          .populate('studentId', 'firstName lastName email')
          .sort({ 'studentId.firstName': 1 });
        
        // Create attendance map for easy lookup
        const attendanceMap = {};
        attendanceRecords.forEach(record => {
          attendanceMap[record.studentId._id] = record;
        });
        
        // Prepare students with attendance status
        selectedClass.studentsWithAttendance = selectedClass.studentIds.map(student => ({
          ...student.toObject(),
          attendance: attendanceMap[student._id] || null
        }));
      }
    }
    
    res.render('faculty/attendance', {
      title: 'Attendance Management - Lab Exam Portal',
      user: req.user,
      classes,
      selectedClass,
      attendanceRecords,
      selectedDate,
      selectedStatus: status || 'all',
      moment,
      currentPage: 'attendance'
    });
    
  } catch (error) {
    console.error('Faculty attendance error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load attendance',
      error: { status: 500 }
    });
  }
};

// Render grading page
const renderGrading = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const { classId, status } = req.query;
    
    // Get faculty's classes
    const classes = await Class.find({ facultyId })
      .sort({ semester: 1, className: 1 });
    
    let grades = [];
    let selectedClass = null;
    
    if (classId) {
      selectedClass = await Class.findOne({ _id: classId, facultyId })
        .populate('studentIds', 'firstName lastName email');
      
      if (selectedClass) {
        const query = { classId: selectedClass._id };
        
        if (status === 'graded') {
          query.totalMarks = { $ne: null };
        } else if (status === 'ungraded') {
          query.totalMarks = null;
        }
        
        grades = await Grade.find(query)
          .populate('studentId', 'firstName lastName email')
          .sort({ 'studentId.firstName': 1 });
        
        // Ensure all students have grade records
        for (const student of selectedClass.studentIds) {
            let existingGrade = grades.find(g => g.studentId._id.equals(student._id));
            if (!existingGrade) {
                const newGrade = new Grade({
                    studentId: student._id,
                    classId: selectedClass._id,
                    semester: selectedClass.semester,
                    year: selectedClass.year
                });
                
                // Initialize with 3 experiments
                newGrade.initializeExperiments(facultyId);
                await newGrade.save();
                
                grades.push(await Grade.findById(newGrade._id).populate('studentId', 'firstName lastName email'));
            } else if (!existingGrade.practicalMarks || existingGrade.practicalMarks.length === 0) {
                // Add experiments to existing grades that don't have them
                existingGrade.initializeExperiments(facultyId);
                await existingGrade.save();
            }
        }
        
        grades.sort((a, b) => a.studentId.firstName.localeCompare(b.studentId.firstName));
      }
    }
    
    res.render('faculty/grading', {
    title: 'Submissions & Grading - Lab Exam Portal',
    user: req.user,
    classes,
    selectedClass,
    grades,
    selectedStatus: status || 'all',
    moment, // Add this line
    currentPage: 'grading'
  });

    
  } catch (error) {
    console.error('Faculty grading error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load grading',
      error: { status: 500 }
    });
  }
};

// Render results page
const renderResults = async (req, res) => {
  try {
    const facultyId = req.user._id;
    const { classId, status } = req.query;
    
    // Get faculty's classes
    const classes = await Class.find({ facultyId })
      .sort({ semester: 1, className: 1 });
    
    let results = [];
    let selectedClass = null;
    let classStats = {};
    
    if (classId) {
      selectedClass = await Class.findOne({ _id: classId, facultyId });
      
      if (selectedClass) {
        const query = { classId: selectedClass._id };
        
        if (status === 'pass') {
          query.status = 'Pass';
        } else if (status === 'fail') {
          query.status = 'Fail';
        }
        
        results = await Grade.find(query)
          .populate('studentId', 'firstName lastName email')
          .sort({ percentage: -1 });
        
        // Calculate class statistics
        const totalStudents = results.length;
        const passedStudents = results.filter(r => r.status === 'Pass').length;
        const failedStudents = results.filter(r => r.status === 'Fail').length;
        const avgPercentage = totalStudents > 0 
          ? results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalStudents 
          : 0;
        
        classStats = {
          totalStudents,
          passedStudents,
          failedStudents,
          passPercentage: totalStudents > 0 ? Math.round((passedStudents / totalStudents) * 100) : 0,
          avgPercentage: Math.round(avgPercentage)
        };
      }
    }
    
    res.render('faculty/results', {
      title: 'Results & Reports - Lab Exam Portal',
      user: req.user,
      classes,
      selectedClass,
      results,
      classStats,
      selectedStatus: status || 'all',
      currentPage: 'results'
    });
    
  } catch (error) {
    console.error('Faculty results error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load results',
      error: { status: 500 }
    });
  }
};

// Render student management page
const renderStudentManagement = async (req, res) => {
  try {
    const facultyId = req.user._id;
    
    // Get faculty's classes
    const classes = await Class.find({ facultyId })
      .populate('studentIds', 'firstName lastName email')
      .sort({ semester: 1, className: 1 });
    
    // Get pending student requests
    const pendingRequests = await StudentRequest.find({
      facultyId,
      status: 'Pending'
    })
    .populate('studentId', 'firstName lastName email')
    .populate('classId', 'className classCode')
    .sort({ createdAt: -1 });
    
    // Get all students for adding to classes
    const allStudents = await User.find({ role: 'Student', isActive: true })
      .sort({ firstName: 1 });
    
    res.render('faculty/students', {
      title: 'Student Management - Lab Exam Portal',
      user: req.user,
      classes,
      pendingRequests,
      allStudents,
      moment: require('moment'), 
      currentPage: 'students'
    });
    
  } catch (error) {
    console.error('Faculty student management error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Unable to load student management',
      error: { status: 500 }
    });
  }
};

module.exports = {
  renderDashboard,
  renderAttendance,
  renderGrading,
  renderResults,
  renderStudentManagement
};
