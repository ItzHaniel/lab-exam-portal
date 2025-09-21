const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class is required']
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'], // Simplified to only Present/Absent
    required: [true, 'Attendance status is required']
  },
  sessionType: {
    type: String,
    enum: ['Lecture', 'Lab', 'Tutorial', 'Exam'],
    default: 'Lab'
  },
  remarks: {
    type: String,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  // New fields for session-based attendance
  sessionSubmitted: {
    type: Boolean,
    default: false
  },
  totalStudentsInSession: {
    type: Number,
    default: 0
  },
  presentCountInSession: {
    type: Number,
    default: 0
  },
  sessionTimestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ studentId: 1, classId: 1, date: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ classId: 1, date: 1 });
attendanceSchema.index({ facultyId: 1, date: 1 });

// Method to calculate attendance percentage for a student in a class
attendanceSchema.statics.calculateAttendancePercentage = async function(studentId, classId, startDate = null, endDate = null) {
  const query = { studentId, classId, isActive: true };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const totalClasses = await this.countDocuments(query);
  const attendedClasses = await this.countDocuments({
    ...query,
    status: 'Present'
  });
  
  return totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
};

// Static method to check if attendance is already submitted for a class on a date
attendanceSchema.statics.isSessionSubmitted = async function(classId, facultyId, date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  
  const attendance = await this.findOne({
    classId,
    facultyId,
    date: { $gte: startDate, $lt: endDate },
    sessionSubmitted: true
  });
  
  return !!attendance;
};

// Static method to get session data for a class and date
attendanceSchema.statics.getSessionData = async function(classId, facultyId, date) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
  
  const attendanceRecords = await this.find({
    classId,
    facultyId,
    date: { $gte: startDate, $lt: endDate }
  }).populate('studentId', 'firstName lastName email profileImage');
  
  return attendanceRecords;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
