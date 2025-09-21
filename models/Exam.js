const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  examType: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: ['CIA1', 'CIA2', 'CIA3', 'MSE', 'ESE', 'Assignment', 'Lab Test', 'Viva'],
    default: 'Assignment'
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
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Duration must be at least 15 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1'],
    max: [100, 'Total marks cannot exceed 100']
  },
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters']
  },
  syllabus: [{
    topic: {
      type: String,
      required: true,
      trim: true
    },
    weight: {
      type: Number,
      min: 1,
      max: 100
    }
  }],
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true,
    maxlength: [100, 'Venue cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
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
examSchema.index({ classId: 1, scheduledDate: 1 });
examSchema.index({ facultyId: 1, scheduledDate: 1 });
examSchema.index({ scheduledDate: 1, status: 1 });

// Virtual for exam status based on date
examSchema.virtual('computedStatus').get(function() {
  const now = new Date();
  const examDate = new Date(this.scheduledDate);
  
  if (this.status === 'Cancelled') return 'Cancelled';
  if (this.status === 'Completed') return 'Completed';
  
  if (examDate < now) return 'Completed';
  if (examDate.toDateString() === now.toDateString()) return 'Today';
  return 'Upcoming';
});

// Virtual for time remaining
examSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const examDate = new Date(this.scheduledDate);
  const diffTime = examDate - now;
  
  if (diffTime <= 0) return null;
  
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
});

// Method to check if exam is upcoming
examSchema.methods.isUpcoming = function() {
  return new Date(this.scheduledDate) > new Date();
};

// Method to check if exam is today
examSchema.methods.isToday = function() {
  const today = new Date();
  const examDate = new Date(this.scheduledDate);
  return examDate.toDateString() === today.toDateString();
};

module.exports = mongoose.model('Exam', examSchema);
