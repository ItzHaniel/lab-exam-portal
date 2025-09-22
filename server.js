const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const studentRoutes = require('./routes/student');
const settingsRoutes = require('./routes/settings');
const facultyRoutes = require('./routes/faculty');
const facultyAPIRoutes = require('./routes/facultyAPI');
const adminRoutes = require('./routes/admin');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');

// Database connection
require('./config/database');

// Trust proxy for Vercel
app.set('trust proxy', 1);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/auth', authRoutes);

// Root route - redirect to login
app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Student routes
app.use('/student', studentRoutes);

// Add settings routes
app.use('/api/settings', settingsRoutes);

// Find your existing app.use routes and add:
app.use('/faculty', facultyRoutes);

// Faculty API
app.use('/api/faculty', facultyAPIRoutes);

//Admin routes
app.use('/admin', adminRoutes);

// ===========================================
// TEST DATA SEEDER ROUTE (DEVELOPMENT ONLY)
// ===========================================
app.get('/seed-test-data', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).send('Seeding disabled in production');
    }
    
    try {
        console.log('🌱 Starting test data seeding...');
        
        // Import models
        const User = require('./models/User');
        const Class = require('./models/Class');
        const Exam = require('./models/Exam');
        const Grade = require('./models/Grade');
        const Attendance = require('./models/Attendance');
        const StudentRequest = require('./models/StudentRequest');
        
        // Clear existing data
        await User.deleteMany({});
        await Class.deleteMany({});
        await Exam.deleteMany({});
        await Grade.deleteMany({});
        await Attendance.deleteMany({});
        await StudentRequest.deleteMany({});
        
        console.log('🗑️ Cleared existing data');
        
        // Create Admin
        const admin = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@labexam.com',
            username: 'admin',
            password: 'admin123',
            role: 'Admin',
            isActive: true
        });
        await admin.save();
        
        // Create Faculty Users
        const faculty1 = new User({
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@university.edu',
            username: 'sjohnson',
            password: 'faculty123',
            role: 'Faculty',
            isActive: true
        });
        
        const faculty2 = new User({
            firstName: 'Prof. Michael',
            lastName: 'Chen',
            email: 'michael.chen@university.edu',
            username: 'mchen',
            password: 'faculty123',
            role: 'Faculty',
            isActive: true
        });
        
        await faculty1.save();
        await faculty2.save();
        console.log('👩‍🏫 Created faculty users');
        
        // Create Students
        const students = [];
        const studentNames = [
            ['Alice', 'Smith', 'alice.smith@student.edu'],
            ['Bob', 'Wilson', 'bob.wilson@student.edu'],
            ['Carol', 'Davis', 'carol.davis@student.edu'],
            ['David', 'Miller', 'david.miller@student.edu'],
            ['Emma', 'Garcia', 'emma.garcia@student.edu'],
            ['Frank', 'Martinez', 'frank.martinez@student.edu'],
            ['Grace', 'Anderson', 'grace.anderson@student.edu'],
            ['Henry', 'Taylor', 'henry.taylor@student.edu'],
            ['Ivy', 'Thomas', 'ivy.thomas@student.edu'],
            ['Jack', 'Brown', 'jack.brown@student.edu'],
            ['Kate', 'Lee', 'kate.lee@student.edu'],
            ['Leo', 'White', 'leo.white@student.edu']
        ];
        
        for (const [firstName, lastName, email] of studentNames) {
            const student = new User({
                firstName,
                lastName,
                email,
                username: email.split('@')[0],
                password: 'student123',
                role: 'Student',
                isActive: true
            });
            await student.save();
            students.push(student);
        }
        console.log('👨‍🎓 Created student users');
        
        // Create Classes
        const class1 = new Class({
            className: 'Advanced Database Systems',
            classCode: 'CS401',
            subject: 'Computer Science',
            semester: 7,
            year: 2024,
            facultyId: faculty1._id,
            studentIds: students.slice(0, 6).map(s => s._id),
            schedule: [
                {
                    dayOfWeek: 'Monday',
                    startTime: '09:00',
                    endTime: '11:00',
                    room: 'Lab 101'
                },
                {
                    dayOfWeek: 'Wednesday',
                    startTime: '14:00',
                    endTime: '16:00',
                    room: 'Lab 101'
                }
            ],
            isActive: true
        });
        
        const class2 = new Class({
            className: 'Machine Learning Lab',
            classCode: 'CS402',
            subject: 'Computer Science',
            semester: 7,
            year: 2024,
            facultyId: faculty1._id,
            studentIds: students.slice(4, 10).map(s => s._id),
            schedule: [
                {
                    dayOfWeek: 'Tuesday',
                    startTime: '10:00',
                    endTime: '12:00',
                    room: 'Lab 102'
                }
            ],
            isActive: true
        });
        
        const class3 = new Class({
            className: 'Web Development Lab',
            classCode: 'CS301',
            subject: 'Computer Science',
            semester: 5,
            year: 2024,
            facultyId: faculty2._id,
            studentIds: students.slice(6, 12).map(s => s._id),
            schedule: [
                {
                    dayOfWeek: 'Friday',
                    startTime: '09:00',
                    endTime: '12:00',
                    room: 'Lab 103'
                }
            ],
            isActive: true
        });
        
        await class1.save();
        await class2.save();
        await class3.save();
        console.log('📚 Created classes');
        
        // Create Exams
        const examTypes = ['CIA1', 'CIA2', 'CIA3', 'MSE', 'ESE'];
        const classes = [class1, class2, class3];

        for (const cls of classes) {
            for (const examType of examTypes) {
                const exam = new Exam({
                    title: `${examType} - ${cls.className}`,
                    description: `${examType} examination for ${cls.className}`,
                    classId: cls._id,
                    facultyId: cls.facultyId,
                    examType: examType,
                    scheduledDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
                    startTime: '10:00',
                    endTime: '12:00',
                    duration: 120, // Add this line - 120 minutes (2 hours)
                    venue: cls.schedule[0].room,
                    totalMarks: examType === 'CIA2' ? 50 : examType === 'MSE' || examType === 'ESE' ? 50 : 20,
                    status: 'Scheduled',
                    instructions: `Please arrive 15 minutes early. Bring your ID card and required stationery.`,
                    isActive: true
                });
                await exam.save();
            }
        }
        console.log('📝 Created exams');
        
        // Create Realistic Grades
        for (const cls of classes) {
            for (const studentId of cls.studentIds) {
                const grade = new Grade({
                    studentId: studentId,
                    classId: cls._id,
                    semester: cls.semester,
                    year: cls.year,
                    assessments: {
                        CIA1: {
                            marks: Math.floor(Math.random() * 8) + 12, // 12-20
                            maxMarks: 20
                        },
                        CIA2: {
                            marks: Math.floor(Math.random() * 20) + 30, // 30-50
                            maxMarks: 50
                        },
                        CIA3: {
                            marks: Math.floor(Math.random() * 8) + 12, // 12-20
                            maxMarks: 20
                        },
                        MSE: {
                            marks: Math.floor(Math.random() * 20) + 30, // 30-50
                            maxMarks: 50
                        },
                        ESE: {
                            marks: Math.floor(Math.random() * 25) + 25, // 25-50
                            maxMarks: 50
                        }
                    },
                    practicalMarks: [
                        {
                            experimentName: 'Database Design Lab',
                            observation: Math.round((Math.random() * 2 + 3) * 2) / 2,
                            record: Math.round((Math.random() * 2 + 3) * 2) / 2,
                            date: new Date(),
                            facultyId: cls.facultyId
                        },
                        {
                            experimentName: 'Query Optimization',
                            observation: Math.round((Math.random() * 2 + 3) * 2) / 2,
                            record: Math.round((Math.random() * 2 + 3) * 2) / 2,
                            date: new Date(),
                            facultyId: cls.facultyId
                        }
                    ],
                    gradedBy: cls.facultyId,
                    gradedAt: new Date(),
                    isActive: true
                });
                
                // Calculate final grade
                grade.calculateFinalGrade();
                await grade.save();
            }
        }
        console.log('🏆 Created grades');
        
        // Create Attendance (last 10 days)
        for (const cls of classes) {
            for (let i = 0; i < 10; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                for (const studentId of cls.studentIds) {
                    const attendance = new Attendance({
                        studentId: studentId,
                        classId: cls._id,
                        facultyId: cls.facultyId,
                        date: date,
                        status: Math.random() > 0.15 ? 'Present' : Math.random() > 0.5 ? 'Late' : 'Absent',
                        sessionType: 'Lab',
                        markedAt: date,
                        isActive: true
                    });
                    await attendance.save();
                }
            }
        }
        console.log('✅ Created attendance records');
        
        // Create Pending Requests
        const requests = [
            {
                studentId: students[10]._id,
                classId: class1._id,
                facultyId: faculty1._id,
                requestType: 'ADD_STUDENT',
                reason: 'Student wants to join advanced database course.',
                status: 'Pending'
            },
            {
                studentId: students[2]._id,
                classId: class2._id,
                facultyId: faculty1._id,
                requestType: 'REMOVE_STUDENT',
                reason: 'Student struggling with course material.',
                status: 'Pending'
            }
        ];
        
        for (const requestData of requests) {
            const request = new StudentRequest(requestData);
            await request.save();
        }
        console.log('⏳ Created pending requests');
        
        // Success Response
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>🎉 Test Data Created!</title>
                <style>
                    body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
                    .success { color: #28a745; font-size: 24px; margin-bottom: 20px; text-align: center; }
                    .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .credential-item { margin: 15px 0; padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px; }
                    .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 8px; display: inline-block; }
                    .btn:hover { background: #0056b3; }
                    .summary { background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="success">🎉 Test Data Created Successfully!</div>
                
                <div class="credentials">
                    <h3>🔑 Login Credentials - Ready to Test:</h3>
                    
                    <div class="credential-item">
                        <strong>👩‍🏫 Faculty (Dr. Sarah Johnson):</strong><br>
                        Email: <code>sarah.johnson@university.edu</code><br>
                        Password: <code>faculty123</code><br>
                        <small>✅ Has 2 classes with students and grades</small>
                    </div>
                    
                    <div class="credential-item">
                        <strong>👨‍🎓 Student (Alice Smith):</strong><br>
                        Email: <code>alice.smith@student.edu</code><br>
                        Password: <code>student123</code><br>
                        <small>✅ Enrolled in Database Systems class</small>
                    </div>
                </div>
                
                <div class="summary">
                    <h3>📊 What Was Created:</h3>
                    <ul>
                        <li>✅ <strong>12 Students</strong> - All password: student123</li>
                        <li>✅ <strong>2 Faculty</strong> - Dr. Sarah (2 classes), Prof. Michael (1 class)</li>
                        <li>✅ <strong>3 Classes</strong> - Database, ML Lab, Web Dev</li>
                        <li>✅ <strong>Realistic Grades</strong> - CIA/ESE/Practical with your marking scheme</li>
                        <li>✅ <strong>10 Days Attendance</strong> - Ready to test attendance marking</li>
                        <li>✅ <strong>2 Pending Requests</strong> - Test student management</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="/auth/login" class="btn">🚀 Start Testing - Login Here</a>
                </div>
                
                <p style="text-align: center;"><em>🔒 This seeder only works in development mode!</em></p>
            </body>
            </html>
        `;
        
        res.send(html);
        console.log('🎉 Test data seeding completed successfully!');
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        res.status(500).send(`
            <h1 style="color: red;">❌ Seeding Failed</h1>
            <pre style="background: #f8f8f8; padding: 20px; border-radius: 8px;">${error.message}</pre>
            <p><a href="/">← Go back to home</a></p>
        `);
    }
});

// Placeholder routes for future dashboards
app.get('/student/*', (req, res) => {
  res.send(`
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🎓 Student Dashboard</h2>
      <p style="color: #6b7280; margin-bottom: 2rem;">Coming Soon! This will contain the student dashboard with exams, classes, and results.</p>
      
      <div style="background: #f3f4f6; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
        <h4>Planned Features:</h4>
        <ul style="text-align: left; display: inline-block;">
          <li>📚 Upcoming Exams</li>
          <li>📖 My Classes</li>
          <li>📊 Latest Results</li>
          <li>👩‍🏫 Faculty Contacts</li>
          <li>📅 Calendar View</li>
        </ul>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/auth/logout" 
           style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🚪 Logout
        </a>
        <a href="/auth/login" 
           style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🔑 Back to Login
        </a>
      </div>
    </div>
  `);
});

// Faculty dashboard with proper logout  
app.get('/faculty/*', (req, res) => {
  res.send(`
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>👩‍🏫 Faculty Dashboard</h2>
      <p style="color: #6b7280; margin-bottom: 2rem;">Coming Soon! This will contain the faculty dashboard with attendance, grading, and student management.</p>
      
      <div style="background: #f3f4f6; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
        <h4>Planned Features:</h4>
        <ul style="text-align: left; display: inline-block;">
          <li>✅ Mark Attendance</li>
          <li>📝 Grade Submissions</li>
          <li>📈 Results & Reports</li>
          <li>👥 Student Management</li>
          <li>📅 Class Schedule</li>
        </ul>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/auth/logout" 
           style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🚪 Logout
        </a>
        <a href="/auth/login" 
           style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🔑 Back to Login
        </a>
      </div>
    </div>
  `);
});

// Admin dashboard with proper logout
app.get('/admin/*', (req, res) => {
  res.send(`
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>⚙️ Admin Dashboard</h2>
      <p style="color: #6b7280; margin-bottom: 2rem;">Coming Soon! This will contain the admin panel with user management, analytics, and system settings.</p>
      
      <div style="background: #f3f4f6; padding: 2rem; border-radius: 12px; margin-bottom: 2rem;">
        <h4>Planned Features:</h4>
        <ul style="text-align: left; display: inline-block;">
          <li>👥 Faculty Setup</li>
          <li>🎓 Student Management</li>
          <li>📚 Class Configuration</li>
          <li>📊 Result Monitoring</li>
          <li>📈 Analytics Dashboard</li>
        </ul>
      </div>
      
      <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
        <a href="/auth/logout" 
           style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🚪 Logout
        </a>
        <a href="/auth/login" 
           style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
                  color: white; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  text-decoration: none; 
                  font-weight: 600;
                  transition: transform 0.2s;"
           onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          🔑 Back to Login
        </a>
      </div>
    </div>
  `);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Page Not Found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;

// Railway doesn't need conditional listening - always start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        console.log(`🌐 Visit: http://localhost:${PORT}`);
    } else {
        console.log(`🌐 Production server is running`);
    }
});

// Keep this for potential future compatibility
module.exports = app;

