const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const StudentRequest = require('../models/StudentRequest');
const Class = require('../models/Class');

const router = express.Router();

// Apply authentication
router.use(authenticateToken);
router.use(authorizeRole('Faculty'));

// Save complete attendance session (replaces bulk-mark)
router.post('/attendance/session', async (req, res) => {
    try {
        const { classId, attendanceRecords } = req.body;
        const facultyId = req.user._id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (!classId || !attendanceRecords || attendanceRecords.length === 0) {
            return res.status(400).json({ success: false, message: 'Missing required data' });
        }
        
        // Check if attendance already submitted for today
        const isSubmitted = await Attendance.isSessionSubmitted(classId, facultyId, today);
        if (isSubmitted) {
            return res.status(400).json({ success: false, message: 'Attendance already submitted for today' });
        }
        
        // Calculate session stats
        const totalStudents = attendanceRecords.length;
        const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
        const sessionTimestamp = new Date();
        
        let savedCount = 0;
        const errors = [];
        
        // Save attendance records
        for (const record of attendanceRecords) {
            try {
                await Attendance.findOneAndUpdate(
                    {
                        studentId: record.studentId,
                        classId,
                        facultyId,
                        date: {
                            $gte: today,
                            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
                    },
                    {
                        studentId: record.studentId,
                        classId,
                        facultyId,
                        date: today,
                        status: record.status || 'Absent',
                        remarks: record.remarks || '',
                        sessionType: 'Lab',
                        markedAt: sessionTimestamp,
                        sessionSubmitted: true,
                        totalStudentsInSession: totalStudents,
                        presentCountInSession: presentCount,
                        sessionTimestamp: sessionTimestamp,
                        isActive: true
                    },
                    { upsert: true, new: true, runValidators: true }
                );
                savedCount++;
            } catch (error) {
                errors.push(`Failed to save ${record.studentId}: ${error.message}`);
            }
        }
        
        if (errors.length > 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'Some records failed to save',
                errors 
            });
        }
        
        res.json({ 
            success: true, 
            message: `Attendance session saved for ${savedCount} students`,
            stats: {
                total: totalStudents,
                present: presentCount,
                absent: totalStudents - presentCount,
                timestamp: sessionTimestamp
            }
        });
        
    } catch (error) {
        console.error('Attendance session save error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to save attendance session'
        });
    }
});

// Get attendance session for a class and date
router.get('/attendance/session', async (req, res) => {
    try {
        const { classId, date } = req.query;
        const facultyId = req.user._id;
        
        if (!classId) {
            return res.status(400).json({ success: false, message: 'Class ID required' });
        }
        
        const queryDate = date ? new Date(date) : new Date();
        
        const attendanceRecords = await Attendance.getSessionData(classId, facultyId, queryDate);
        const isSubmitted = await Attendance.isSessionSubmitted(classId, facultyId, queryDate);
        
        let sessionStats = null;
        if (attendanceRecords.length > 0) {
            const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
            sessionStats = {
                total: attendanceRecords.length,
                present: presentCount,
                absent: attendanceRecords.length - presentCount,
                timestamp: attendanceRecords[0].sessionTimestamp
            };
        }
        
        res.json({ 
            success: true, 
            attendanceRecords,
            isSubmitted,
            sessionStats
        });
        
    } catch (error) {
        console.error('Get attendance session error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance session' });
    }
});

// Save individual grade
router.post('/save-grade', async (req, res) => {
    try {
        const { studentId, classId, assessments, practicalMarks } = req.body;
        const facultyId = req.user._id;
        
        // Find or create grade record
        let grade = await Grade.findOne({ studentId, classId });
        
        if (!grade) {
            const classInfo = await Class.findById(classId);
            grade = new Grade({
                studentId,
                classId,
                semester: classInfo.semester,
                year: classInfo.year,
                gradedBy: facultyId
            });
        }
        
        // Update assessments
        if (assessments) grade.assessments = assessments;
        if (practicalMarks) grade.practicalMarks = practicalMarks;
        
        grade.gradedBy = facultyId;
        grade.gradedAt = new Date();
        
        // Calculate final grade
        grade.calculateFinalGrade();
        
        await grade.save();
        
        res.json({ success: true, grade });
    } catch (error) {
        console.error('Grade save error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save grade' });
    }
});

// Add experiment to ALL students in class
router.post('/add-experiment', async (req, res) => {
    try {
        const { classId, experimentName } = req.body;
        const facultyId = req.user._id;
        
        // Get all students in class
        const classInfo = await Class.findById(classId).populate('studentIds');
        if (!classInfo) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        // Add experiment to ALL students
        for (const student of classInfo.studentIds) {
            let grade = await Grade.findOne({ studentId: student._id, classId });
            
            if (!grade) {
                grade = new Grade({
                    studentId: student._id,
                    classId,
                    semester: classInfo.semester,
                    year: classInfo.year,
                    gradedBy: facultyId
                });
                grade.initializeExperiments(facultyId);
            }
            
            // Add new experiment
            grade.practicalMarks.push({
                experimentName,
                observation: null,
                record: null,
                date: new Date(),
                facultyId: facultyId
            });
            
            await grade.save();
        }
        
        res.json({ success: true, message: `Experiment "${experimentName}" added to all students` });
    } catch (error) {
        console.error('Add experiment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to add experiment' });
    }
});

// Remove experiment from ALL students in class
router.post('/remove-experiment', async (req, res) => {
    try {
        const { classId, experimentIndex } = req.body;
        
        // Get all students in class
        const classInfo = await Class.findById(classId).populate('studentIds');
        if (!classInfo) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        // Remove experiment from ALL students
        for (const student of classInfo.studentIds) {
            const grade = await Grade.findOne({ studentId: student._id, classId });
            if (grade && grade.practicalMarks && grade.practicalMarks.length > experimentIndex) {
                grade.practicalMarks.splice(experimentIndex, 1);
                grade.calculateFinalGrade();
                await grade.save();
            }
        }
        
        res.json({ success: true, message: 'Experiment removed from all students' });
    } catch (error) {
        console.error('Remove experiment error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to remove experiment' });
    }
});

// Student add/remove requests
router.post('/student-request', async (req, res) => {
    try {
        const { classId, studentId, reason, requestType } = req.body;
        const facultyId = req.user._id;
        
        // Check if request already exists
        const existingRequest = await StudentRequest.findOne({
            studentId,
            classId,
            facultyId,
            requestType,
            status: 'Pending'
        });
        
        if (existingRequest) {
            return res.status(400).json({ success: false, message: 'Similar request already pending' });
        }
        
        const request = new StudentRequest({
            studentId,
            classId,
            facultyId,
            requestType,
            reason,
            status: 'Pending'
        });
        
        await request.save();
        
        res.json({ success: true, request });
    } catch (error) {
        console.error('Student request error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create request' });
    }
});

// Export reports
router.get('/export-results/:format', async (req, res) => {
    try {
        const { classId } = req.query;
        const { format } = req.params;
        const facultyId = req.user._id;
        
        if (!classId) {
            return res.status(400).json({ success: false, message: 'Class ID required' });
        }
        
        // Get class and results
        const classInfo = await Class.findOne({ _id: classId, facultyId });
        if (!classInfo) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        const results = await Grade.find({ classId })
            .populate('studentId', 'firstName lastName email')
            .sort({ percentage: -1 });
        
        if (format === 'csv') {
            let csv = 'Student Name,Email,CIA Total,ESE Total,Practical Total,Total Marks,Percentage,Letter Grade,Status\n';
            
            results.forEach(result => {
                const name = `"${result.studentId.firstName} ${result.studentId.lastName}"`;
                const email = `"${result.studentId.email}"`;
                const cia = result.ciaTotal || 0;
                const ese = result.eseTotal || 0;
                const practical = result.practicalTotal || 0;
                const total = result.totalMarks || 0;
                const percentage = result.percentage || 0;
                const grade = `"${result.letterGrade || 'N/A'}"`;
                const status = `"${result.status || 'Pending'}"`;
                
                csv += `${name},${email},${cia},${ese},${practical},${total},${percentage},${grade},${status}\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${classInfo.classCode}_results_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csv);
        } else {
            res.status(400).json({ success: false, message: `Format ${format} not implemented yet` });
        }
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to export results' });
    }
});

module.exports = router;
