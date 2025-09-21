const User = require('../models/User');
const Class = require('../models/Class');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const StudentRequest = require('../models/StudentRequest');
const moment = require('moment');

// Dashboard
const renderDashboard = async (req, res) => {
    try {
        // Analytics data
        const totalStudents = await User.countDocuments({ role: 'Student', isActive: true });
        const totalFaculty = await User.countDocuments({ role: 'Faculty', isActive: true });
        const totalClasses = await Class.countDocuments({ isActive: true });
        const pendingRequests = await StudentRequest.countDocuments({ status: 'Pending' });
        
        // Performance metrics
        const allGrades = await Grade.find().populate('studentId classId');
        const passedStudents = allGrades.filter(g => g.status === 'Pass').length;
        const passPercentage = allGrades.length > 0 ? Math.round((passedStudents / allGrades.length) * 100) : 0;
        
        // Recent attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = await Attendance.countDocuments({ 
            date: { $gte: today }, 
            sessionSubmitted: true 
        });
        
        // Grade distribution
        const gradeDistribution = {};
        ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].forEach(grade => {
            gradeDistribution[grade] = allGrades.filter(g => g.letterGrade === grade).length;
        });
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard - Lab Exam Portal',
            user: req.user,
            stats: {
                totalStudents,
                totalFaculty,
                totalClasses,
                pendingRequests,
                passPercentage,
                todayAttendance
            },
            gradeDistribution,
            moment,
            currentPage: 'dashboard'
        });
        
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).render('error', { message: 'Failed to load dashboard' });
    }
};

// Faculty Management
const renderFacultyManagement = async (req, res) => {
    try {
        const faculty = await User.find({ role: 'Faculty' }).sort({ createdAt: -1 });
        const classes = await Class.find({ isActive: true });
        
        res.render('admin/faculty', {
            title: 'Faculty Management - Lab Exam Portal',
            user: req.user,
            faculty,
            classes,
            moment,
            currentPage: 'faculty'
        });
        
    } catch (error) {
        console.error('Faculty management error:', error);
        res.status(500).render('error', { message: 'Failed to load faculty management' });
    }
};

// Student Management
const renderStudentManagement = async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' }).sort({ createdAt: -1 });
        const pendingRequests = await StudentRequest.find({ status: 'Pending' })
            .populate('studentId facultyId classId');
        const classes = await Class.find({ isActive: true });
        
        res.render('admin/students', {
            title: 'Student Management - Lab Exam Portal',
            user: req.user,
            students,
            pendingRequests,
            classes,
            moment,
            currentPage: 'students'
        });
        
    } catch (error) {
        console.error('Student management error:', error);
        res.status(500).render('error', { message: 'Failed to load student management' });
    }
};

// Class Management
const renderClassManagement = async (req, res) => {
    try {
        const classes = await Class.find().populate('facultyId studentIds').sort({ createdAt: -1 });
        const faculty = await User.find({ role: 'Faculty', isActive: true });
        
        res.render('admin/classes', {
            title: 'Class Management - Lab Exam Portal',
            user: req.user,
            classes,
            faculty,
            moment,
            currentPage: 'classes'
        });
        
    } catch (error) {
        console.error('Class management error:', error);
        res.status(500).render('error', { message: 'Failed to load class management' });
    }
};

// Results Monitoring
const renderResultsMonitoring = async (req, res) => {
    try {
        const { status, classId } = req.query;
        
        let query = {};
        if (status && status !== 'all') query.status = status;
        if (classId) query.classId = classId;
        
        const results = await Grade.find(query)
            .populate('studentId classId')
            .sort({ percentage: -1 });
        
        const classes = await Class.find({ isActive: true });
        
        // Calculate stats
        const totalResults = results.length;
        const passedResults = results.filter(r => r.status === 'Pass').length;
        const failedResults = results.filter(r => r.status === 'Fail').length;
        const avgPercentage = totalResults > 0 ? 
            Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / totalResults) : 0;
        
        res.render('admin/results', {
            title: 'Results Monitoring - Lab Exam Portal',
            user: req.user,
            results,
            classes,
            selectedStatus: status || 'all',
            selectedClass: classId,
            stats: {
                total: totalResults,
                passed: passedResults,
                failed: failedResults,
                avgPercentage
            },
            moment,
            currentPage: 'results'
        });
        
    } catch (error) {
        console.error('Results monitoring error:', error);
        res.status(500).render('error', { message: 'Failed to load results monitoring' });
    }
};

// Attendance Monitoring
const renderAttendanceMonitoring = async (req, res) => {
    try {
        const { status, classId, date } = req.query;
        
        let query = { isActive: true };
        if (status && status !== 'all') query.status = status;
        if (classId) query.classId = classId;
        if (date) {
            const queryDate = new Date(date);
            queryDate.setHours(0, 0, 0, 0);
            query.date = {
                $gte: queryDate,
                $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
            };
        }
        
        const attendanceRecords = await Attendance.find(query)
            .populate('studentId classId facultyId')
            .sort({ date: -1 });
        
        const classes = await Class.find({ isActive: true });
        
        // Calculate stats
        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter(r => r.status === 'Present').length;
        const absentRecords = attendanceRecords.filter(r => r.status === 'Absent').length;
        const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;
        
        res.render('admin/attendance', {
            title: 'Attendance Monitoring - Lab Exam Portal',
            user: req.user,
            attendanceRecords,
            classes,
            selectedStatus: status || 'all',
            selectedClass: classId,
            selectedDate: date,
            stats: {
                total: totalRecords,
                present: presentRecords,
                absent: absentRecords,
                attendanceRate
            },
            moment,
            currentPage: 'attendance'
        });
        
    } catch (error) {
        console.error('Attendance monitoring error:', error);
        res.status(500).render('error', { message: 'Failed to load attendance monitoring' });
    }
};

// Settings
const renderSettings = async (req, res) => {
    try {
        res.render('admin/settings', {
            title: 'Admin Settings - Lab Exam Portal',
            user: req.user,
            moment,
            currentPage: 'settings'
        });
        
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).render('error', { message: 'Failed to load settings' });
    }
};

module.exports = {
    renderDashboard,
    renderFacultyManagement,
    renderStudentManagement,
    renderClassManagement,
    renderResultsMonitoring,
    renderAttendanceMonitoring,
    renderSettings
};
