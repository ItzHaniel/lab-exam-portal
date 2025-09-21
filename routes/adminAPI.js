const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const User = require('../models/User');
const Class = require('../models/Class');
const StudentRequest = require('../models/StudentRequest');
const bcrypt = require('bcrypt');

const router = express.Router();

// Apply authentication and admin authorization
router.use(authenticateToken);
router.use(authorizeRole('Admin'));

// ================================
// FACULTY MANAGEMENT
// ================================

// Add Faculty
router.post('/faculty/add', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create faculty
        const faculty = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: 'Faculty',
            isActive: true
        });
        
        await faculty.save();
        
        res.json({ 
            success: true, 
            message: 'Faculty added successfully',
            faculty: {
                _id: faculty._id,
                firstName: faculty.firstName,
                lastName: faculty.lastName,
                email: faculty.email,
                phone: faculty.phone
            }
        });
        
    } catch (error) {
        console.error('Add faculty error:', error);
        res.status(500).json({ success: false, message: 'Failed to add faculty' });
    }
});

// Toggle Faculty Status
router.post('/faculty/toggle-status', async (req, res) => {
    try {
        const { facultyId, isActive } = req.body;
        
        const faculty = await User.findByIdAndUpdate(
            facultyId, 
            { isActive: !isActive },
            { new: true }
        );
        
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        
        res.json({ 
            success: true, 
            message: `Faculty ${!isActive ? 'activated' : 'deactivated'} successfully`,
            faculty
        });
        
    } catch (error) {
        console.error('Toggle faculty status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update faculty status' });
    }
});

// Update Faculty
router.post('/faculty/update', async (req, res) => {
    try {
        const { facultyId, firstName, lastName, email, phone } = req.body;
        
        const faculty = await User.findByIdAndUpdate(
            facultyId,
            { firstName, lastName, email, phone },
            { new: true, runValidators: true }
        );
        
        if (!faculty) {
            return res.status(404).json({ success: false, message: 'Faculty not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Faculty updated successfully',
            faculty
        });
        
    } catch (error) {
        console.error('Update faculty error:', error);
        res.status(500).json({ success: false, message: 'Failed to update faculty' });
    }
});

// ================================
// STUDENT MANAGEMENT
// ================================

// Add Student
router.post('/student/add', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;
        
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create student
        const student = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role: 'Student',
            isActive: true
        });
        
        await student.save();
        
        res.json({ 
            success: true, 
            message: 'Student added successfully',
            student: {
                _id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                phone: student.phone
            }
        });
        
    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({ success: false, message: 'Failed to add student' });
    }
});

// Toggle Student Status
router.post('/student/toggle-status', async (req, res) => {
    try {
        const { studentId, isActive } = req.body;
        
        const student = await User.findByIdAndUpdate(
            studentId, 
            { isActive: !isActive },
            { new: true }
        );
        
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        
        res.json({ 
            success: true, 
            message: `Student ${!isActive ? 'activated' : 'deactivated'} successfully`,
            student
        });
        
    } catch (error) {
        console.error('Toggle student status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update student status' });
    }
});

// Approve/Reject Student Request
router.post('/student-request/:action', async (req, res) => {
    try {
        const { requestId } = req.body;
        const action = req.params.action; // 'approve' or 'reject'
        
        const request = await StudentRequest.findById(requestId)
            .populate('studentId classId facultyId');
        
        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found' });
        }
        
        if (action === 'approve') {
            // Handle the request based on type
            if (request.requestType === 'ADD_STUDENT') {
                // Add student to class
                await Class.findByIdAndUpdate(
                    request.classId,
                    { $addToSet: { studentIds: request.studentId } }
                );
            } else if (request.requestType === 'REMOVE_STUDENT') {
                // Remove student from class
                await Class.findByIdAndUpdate(
                    request.classId,
                    { $pull: { studentIds: request.studentId } }
                );
            }
            
            request.status = 'Approved';
            request.reviewedBy = req.user._id;
            request.reviewedAt = new Date();
        } else {
            request.status = 'Rejected';
            request.reviewedBy = req.user._id;
            request.reviewedAt = new Date();
        }
        
        await request.save();
        
        res.json({ 
            success: true, 
            message: `Request ${action}d successfully`
        });
        
    } catch (error) {
        console.error(`${req.params.action} request error:`, error);
        res.status(500).json({ success: false, message: `Failed to ${req.params.action} request` });
    }
});

// ================================
// CLASS MANAGEMENT
// ================================

// Add Class
router.post('/class/add', async (req, res) => {
    try {
        const { 
            className, 
            classCode, 
            subject, 
            facultyId, 
            semester, 
            year, 
            maxStudents, 
            schedule, 
            description 
        } = req.body;
        
        // Check if class code already exists
        const existingClass = await Class.findOne({ classCode });
        if (existingClass) {
            return res.status(400).json({ success: false, message: 'Class code already exists' });
        }
        
        // Create class
        const newClass = new Class({
            className,
            classCode,
            subject,
            facultyId: facultyId || null,
            semester: parseInt(semester),
            year: parseInt(year),
            maxStudents: parseInt(maxStudents) || 50,
            schedule,
            description,
            studentIds: [],
            isActive: true
        });
        
        await newClass.save();
        await newClass.populate('facultyId', 'firstName lastName email');
        
        res.json({ 
            success: true, 
            message: 'Class created successfully',
            class: newClass
        });
        
    } catch (error) {
        console.error('Add class error:', error);
        res.status(500).json({ success: false, message: 'Failed to create class' });
    }
});

// Assign Faculty to Class
router.post('/class/assign-faculty', async (req, res) => {
    try {
        const { classId, facultyId } = req.body;
        
        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { facultyId: facultyId || null },
            { new: true }
        ).populate('facultyId', 'firstName lastName email');
        
        if (!updatedClass) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        res.json({ 
            success: true, 
            message: facultyId ? 'Faculty assigned successfully' : 'Faculty unassigned successfully',
            class: updatedClass
        });
        
    } catch (error) {
        console.error('Assign faculty error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign faculty' });
    }
});

// Toggle Class Status
router.post('/class/toggle-status', async (req, res) => {
    try {
        const { classId, isActive } = req.body;
        
        const classObj = await Class.findByIdAndUpdate(
            classId, 
            { isActive: !isActive },
            { new: true }
        ).populate('facultyId', 'firstName lastName email');
        
        if (!classObj) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        res.json({ 
            success: true, 
            message: `Class ${!isActive ? 'activated' : 'deactivated'} successfully`,
            class: classObj
        });
        
    } catch (error) {
        console.error('Toggle class status error:', error);
        res.status(500).json({ success: false, message: 'Failed to update class status' });
    }
});

// Update Class
router.post('/class/update', async (req, res) => {
    try {
        const { 
            classId, 
            className, 
            classCode, 
            subject, 
            semester, 
            year, 
            maxStudents, 
            schedule, 
            description 
        } = req.body;
        
        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { 
                className, 
                classCode, 
                subject, 
                semester: parseInt(semester), 
                year: parseInt(year), 
                maxStudents: parseInt(maxStudents), 
                schedule, 
                description 
            },
            { new: true, runValidators: true }
        ).populate('facultyId', 'firstName lastName email');
        
        if (!updatedClass) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Class updated successfully',
            class: updatedClass
        });
        
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ success: false, message: 'Failed to update class' });
    }
});

module.exports = router;
