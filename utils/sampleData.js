const User = require('../models/User');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const Grade = require('../models/Grade');
const mongoose = require('mongoose');

const createSampleData = async () => {
  try {
    console.log('🌱 Creating sample data for testing...');
    
    // Find your existing student user
    const student = await User.findOne({ role: 'Student' });
    if (!student) {
      console.log('❌ No student user found. Please create a student account first.');
      return;
    }
    
    console.log(`✅ Found student: ${student.firstName} ${student.lastName}`);
    
    // Create a sample faculty user if doesn't exist
    let faculty = await User.findOne({ role: 'Faculty' });
    if (!faculty) {
      faculty = new User({
        username: 'drsmith',
        email: 'drsmith@university.edu',
        password: 'Faculty123!',
        role: 'Faculty',
        firstName: 'Dr. John',
        lastName: 'Smith',
        isActive: true
      });
      await faculty.save();
      console.log('✅ Created sample faculty user');
    }
    
    // Create sample classes
    const sampleClasses = [
      {
        className: 'Computer Networks Lab',
        classCode: 'CS301L',
        subject: 'Computer Networks',
        description: 'Practical implementation of networking concepts',
        semester: 5,
        year: 2024,
        facultyId: faculty._id,
        studentIds: [student._id],
        schedule: [
          {
            dayOfWeek: 'Monday',
            startTime: '10:00',
            endTime: '12:00',
            room: 'Lab-A'
          },
          {
            dayOfWeek: 'Wednesday',
            startTime: '14:00',
            endTime: '16:00',
            room: 'Lab-A'
          }
        ]
      },
      {
        className: 'Database Management Systems Lab',
        classCode: 'CS302L',
        subject: 'Database Management Systems',
        description: 'Hands-on experience with database design and queries',
        semester: 5,
        year: 2024,
        facultyId: faculty._id,
        studentIds: [student._id],
        schedule: [
          {
            dayOfWeek: 'Tuesday',
            startTime: '10:00',
            endTime: '12:00',
            room: 'Lab-B'
          }
        ]
      },
      {
        className: 'Software Engineering Lab',
        classCode: 'CS303L',
        subject: 'Software Engineering',
        description: 'Project-based software development methodologies',
        semester: 5,
        year: 2024,
        facultyId: faculty._id,
        studentIds: [student._id],
        schedule: [
          {
            dayOfWeek: 'Friday',
            startTime: '09:00',
            endTime: '11:00',
            room: 'Lab-C'
          }
        ]
      }
    ];
    
    // Clear existing classes and create new ones
    await Class.deleteMany({});
    const createdClasses = await Class.insertMany(sampleClasses);
    console.log(`✅ Created ${createdClasses.length} sample classes`);
    
    // Create sample exams
    const sampleExams = [
      {
        title: 'TCP/IP Implementation',
        description: 'Implement TCP/IP protocol stack',
        examType: 'CIA1',
        classId: createdClasses[0]._id,
        facultyId: faculty._id,
        scheduledDate: new Date('2024-12-15T10:00:00'),
        startTime: '10:00',
        endTime: '12:00',
        duration: 120,
        totalMarks: 20,
        instructions: 'Implement basic TCP/IP functionality using C/Python',
        venue: 'Lab-A',
        status: 'Scheduled'
      },
      {
        title: 'SQL Query Optimization',
        description: 'Database performance optimization techniques',
        examType: 'CIA2',
        classId: createdClasses[1]._id,
        facultyId: faculty._id,
        scheduledDate: new Date('2024-12-20T14:00:00'),
        startTime: '14:00',
        endTime: '16:00',
        duration: 120,
        totalMarks: 50,
        instructions: 'Optimize given SQL queries for better performance',
        venue: 'Lab-B',
        status: 'Scheduled'
      },
      {
        title: 'Agile Project Demo',
        description: 'Present your software project following agile methodology',
        examType: 'Assignment',
        classId: createdClasses[2]._id,
        facultyId: faculty._id,
        scheduledDate: new Date('2024-12-18T09:00:00'),
        startTime: '09:00',
        endTime: '11:00',
        duration: 120,
        totalMarks: 30,
        instructions: 'Demo your project with proper documentation',
        venue: 'Lab-C',
        status: 'Scheduled'
      }
    ];
    
    // Clear existing exams and create new ones
    await Exam.deleteMany({});
    const createdExams = await Exam.insertMany(sampleExams);
    console.log(`✅ Created ${createdExams.length} sample exams`);
    
    // Create sample grades
    const sampleGrades = [
    {
        studentId: student._id,
        classId: createdClasses[0]._id,
        semester: 5,
        year: 2024,
        assessments: {
        CIA1: { marks: 18, maxMarks: 20, examId: createdExams[0]._id },
        CIA2: { marks: 42, maxMarks: 50 },
        CIA3: { marks: 16, maxMarks: 20 },
        MSE: { marks: 35, maxMarks: 50 },
        ESE: { marks: 40, maxMarks: 50 }
        },
        practicalMarks: [
        {
            experimentName: 'Network Configuration',
            observation: 4,
            record: 5,
            date: new Date(),
            facultyId: faculty._id
        },
        {
            experimentName: 'Protocol Analysis',
            observation: 5,
            record: 4,
            date: new Date(),
            facultyId: faculty._id
        }
        ],
        // ✅ Let the pre-save middleware calculate these
        gradedBy: faculty._id,
        gradedAt: new Date()
    },
    {
        studentId: student._id,
        classId: createdClasses[1]._id,
        semester: 5,
        year: 2024,
        assessments: {
        CIA1: { marks: 16, maxMarks: 20 },
        CIA2: { marks: 38, maxMarks: 50 },
        CIA3: { marks: 18, maxMarks: 20 },
        MSE: { marks: 42, maxMarks: 50 },
        ESE: { marks: 45, maxMarks: 50 }
        },
        practicalMarks: [
        {
            experimentName: 'Database Design',
            observation: 5,
            record: 5,
            date: new Date(),
            facultyId: faculty._id
        }
        ],
        // ✅ Let the pre-save middleware calculate these
        gradedBy: faculty._id,
        gradedAt: new Date()
    }
    ];

    
    // Clear existing grades and create new ones
    await Grade.deleteMany({});
    const createdGrades = await Grade.insertMany(sampleGrades);
    console.log(`✅ Created ${createdGrades.length} sample grades`);
    
    console.log('🎉 Sample data creation completed successfully!');
    console.log('📝 You can now login as a student and see the dashboard with data');
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

module.exports = { createSampleData };
