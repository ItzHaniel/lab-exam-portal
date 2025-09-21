const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    maxlength: [100, 'Class name cannot exceed 100 characters']
  },
  classCode: {
    type: String,
    required: [true, 'Class code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Class code cannot exceed 20 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot exceed 8']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be at least 2020'],
    max: [2030, 'Year cannot exceed 2030']
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  schedule: [{
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
    },
    room: {
      type: String,
      required: true,
      trim: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
classSchema.index({ classCode: 1 });
classSchema.index({ facultyId: 1 });
classSchema.index({ semester: 1, year: 1 });

// Virtual for enrolled student count
classSchema.virtual('enrolledStudents').get(function() {
  return this.studentIds.length;
});

// Method to check if student is enrolled
classSchema.methods.hasStudent = function(studentId) {
  return this.studentIds.includes(studentId);
};

// Method to add student
classSchema.methods.addStudent = function(studentId) {
  if (!this.hasStudent(studentId)) {
    this.studentIds.push(studentId);
  }
  return this;
};

// Method to remove student
classSchema.methods.removeStudent = function(studentId) {
  this.studentIds = this.studentIds.filter(id => !id.equals(studentId));
  return this;
};

module.exports = mongoose.model('Class', classSchema);
