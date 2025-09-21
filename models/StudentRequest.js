const mongoose = require('mongoose');

const studentRequestSchema = new mongoose.Schema({
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
  requestType: {
    type: String,
    enum: ['ADD_STUDENT', 'REMOVE_STUDENT'],
    required: [true, 'Request type is required']
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminComments: {
    type: String,
    maxlength: [500, 'Admin comments cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
studentRequestSchema.index({ facultyId: 1, status: 1 });
studentRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('StudentRequest', studentRequestSchema);
