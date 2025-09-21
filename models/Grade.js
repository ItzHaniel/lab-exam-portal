const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
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
  
  // CIA Assessments (Total = 40 marks after scaling)
  assessments: {
    CIA1: {
      marks: { type: Number, min: 0, max: 20, default: null },
      maxMarks: { type: Number, default: 20 },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
    },
    CIA2: {
      marks: { type: Number, min: 0, max: 50, default: null },
      maxMarks: { type: Number, default: 50 },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
    },
    CIA3: {
      marks: { type: Number, min: 0, max: 20, default: null },
      maxMarks: { type: Number, default: 20 },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
    },
    // MSE + ESE (Total = 50 marks after scaling)
    MSE: {
      marks: { type: Number, min: 0, max: 50, default: null },
      maxMarks: { type: Number, default: 50 },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
    },
    ESE: {
      marks: { type: Number, min: 0, max: 50, default: null },
      maxMarks: { type: Number, default: 50 },
      examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' }
    }
  },
  
  // Practical Experiments (Dynamic list - can add/remove)
  practicalMarks: [{
    experimentName: {
      type: String,
      required: [true, 'Experiment name is required'],
      trim: true,
      maxlength: [100, 'Experiment name cannot exceed 100 characters']
    },
    observation: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },
    record: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },
    date: {
      type: Date,
      default: Date.now
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Calculated fields
  ciaTotal: {
    type: Number,
    default: null
  },
  eseTotal: {
    type: Number,
    default: null
  },
  practicalTotal: {
    type: Number,
    default: null
  },
  totalMarks: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  percentage: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  letterGrade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'I', 'W'],
    required: false
  },
  gradePoints: {
    type: Number,
    min: 0,
    max: 10,
    default: null
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Incomplete', 'Withdrawn'],
    required: false
  },
  
  // Metadata
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: {
    type: Date
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
gradeSchema.index({ studentId: 1, classId: 1, semester: 1, year: 1 });
gradeSchema.index({ classId: 1 });
gradeSchema.index({ gradedBy: 1 });

// Method to calculate CIA total (scaled to 40 marks)
gradeSchema.methods.calculateCIA = function() {
  const cia1 = this.assessments.CIA1.marks || 0;
  const cia2 = this.assessments.CIA2.marks || 0;
  const cia3 = this.assessments.CIA3.marks || 0;
  
  // Raw total: CIA1(20) + CIA2(50) + CIA3(20) = 90 marks
  const rawTotal = cia1 + cia2 + cia3;
  
  // Scale down to 40 marks: (rawTotal / 90) * 40
  this.ciaTotal = Math.round((rawTotal / 90) * 40);
  return this.ciaTotal;
};

// Method to calculate ESE total (scaled to 50 marks)
gradeSchema.methods.calculateESE = function() {
  const mse = this.assessments.MSE.marks || 0;
  const ese = this.assessments.ESE.marks || 0;
  
  // Raw total: MSE(50) + ESE(50) = 100 marks
  const rawTotal = mse + ese;
  
  // Scale down to 50 marks: (rawTotal / 100) * 50
  this.eseTotal = Math.round((rawTotal / 100) * 50);
  return this.eseTotal;
};

// Method to calculate practical total (fixed 3 experiments with averaging)
gradeSchema.methods.calculatePractical = function() {
    if (!this.practicalMarks || this.practicalMarks.length === 0) {
        this.practicalTotal = 0;
        return 0;
    }
    
    // Ensure we have exactly 3 experiments
    const experiments = this.practicalMarks.slice(0, 3); // Take first 3 only
    
    if (experiments.length === 0) {
        this.practicalTotal = 0;
        return 0;
    }
    
    // Calculate average for observation and record separately
    let totalObservation = 0;
    let totalRecord = 0;
    let validExperiments = 0;
    
    experiments.forEach(experiment => {
        if (experiment.observation !== null && experiment.record !== null) {
            totalObservation += experiment.observation || 0;
            totalRecord += experiment.record || 0;
            validExperiments++;
        }
    });
    
    if (validExperiments === 0) {
        this.practicalTotal = 0;
        return 0;
    }
    
    // Average marks per experiment out of 5 each
    const avgObservation = totalObservation / validExperiments; // Out of 5
    const avgRecord = totalRecord / validExperiments; // Out of 5
    
    // Total practical marks = ceil(avg observation) + ceil(avg record) = max 10 marks
    this.practicalTotal = Math.ceil(avgObservation) + Math.ceil(avgRecord);
    
    // Ensure it doesn't exceed 10
    this.practicalTotal = Math.min(this.practicalTotal, 10);
    
    return this.practicalTotal;
};

// Method to initialize 3 default experiments
gradeSchema.methods.initializeExperiments = function(facultyId) {
    if (!this.practicalMarks || this.practicalMarks.length === 0) {
        this.practicalMarks = [
            {
                experimentName: 'Experiment 1',
                observation: null,
                record: null,
                date: new Date(),
                facultyId: facultyId
            },
            {
                experimentName: 'Experiment 2',
                observation: null,
                record: null,
                date: new Date(),
                facultyId: facultyId
            },
            {
                experimentName: 'Experiment 3',
                observation: null,
                record: null,
                date: new Date(),
                facultyId: facultyId
            }
        ];
    }
    return this;
};

// Method to calculate final grade
gradeSchema.methods.calculateFinalGrade = function() {
  const ciaTotal = this.calculateCIA(); // 40 marks
  const eseTotal = this.calculateESE(); // 50 marks
  const practicalTotal = this.calculatePractical(); // 10 marks
  
  // Total = CIA(40) + ESE(50) + Practical(10) = 100 marks
  this.totalMarks = ciaTotal + eseTotal + practicalTotal;
  this.percentage = this.totalMarks; // Since total is already out of 100
  
  this.calculateLetterGrade();
  return this.totalMarks;
};

// Method to calculate letter grade and grade points
gradeSchema.methods.calculateLetterGrade = function() {
  const percentage = this.percentage;
  
  if (percentage === null || percentage === undefined) {
    return;
  }
  
  if (percentage >= 90) {
    this.letterGrade = 'A+';
    this.gradePoints = 10;
    this.status = 'Pass';
  } else if (percentage >= 80) {
    this.letterGrade = 'A';
    this.gradePoints = 9;
    this.status = 'Pass';
  } else if (percentage >= 70) {
    this.letterGrade = 'B+';
    this.gradePoints = 8;
    this.status = 'Pass';
  } else if (percentage >= 60) {
    this.letterGrade = 'B';
    this.gradePoints = 7;
    this.status = 'Pass';
  } else if (percentage >= 50) {
    this.letterGrade = 'C+';
    this.gradePoints = 6;
    this.status = 'Pass';
  } else if (percentage >= 40) {
    this.letterGrade = 'C';
    this.gradePoints = 5;
    this.status = 'Pass';
  } else if (percentage >= 35) {
    this.letterGrade = 'D';
    this.gradePoints = 4;
    this.status = 'Pass';
  } else {
    this.letterGrade = 'F';
    this.gradePoints = 0;
    this.status = 'Fail';
  }
};

// Method to add experiment
gradeSchema.methods.addExperiment = function(experimentName, facultyId) {
  this.practicalMarks.push({
    experimentName,
    observation: null,
    record: null,
    date: new Date(),
    facultyId
  });
  return this;
};

// Method to remove experiment
gradeSchema.methods.removeExperiment = function(experimentId) {
  this.practicalMarks = this.practicalMarks.filter(exp => !exp._id.equals(experimentId));
  return this;
};

// Pre-save middleware to calculate grades
gradeSchema.pre('save', function(next) {
  if (this.isModified('assessments') || this.isModified('practicalMarks')) {
    this.calculateFinalGrade();
  }
  next();
});

module.exports = mongoose.model('Grade', gradeSchema);
