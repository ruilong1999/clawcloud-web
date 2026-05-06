import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['assistant', 'coder', 'creative'],
    default: 'assistant'
  },
  emoji: {
    type: String,
    default: '🦞'
  },
  tier: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  modelType: {
    type: String,
    enum: ['normal', 'advanced'],
    default: 'normal'
  },
  // Resources based on tier
  cpu: {
    type: Number,
    required: true
  },
  mem: {
    type: Number,
    required: true
  },
  disk: {
    type: Number,
    required: true
  },
  // Pricing (CNY per hour)
  hourlyRate: {
    type: Number,
    required: true
  },
  idleRate: {
    type: Number,
    default: 0.2
  },
  // Work status
  isWorking: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Number
  },
  todayWorkSeconds: {
    type: Number,
    default: 0
  },
  lastWorkDate: {
    type: String
  },
  totalWorkSeconds: {
    type: Number,
    default: 0
  },
  // Statistics
  totalSessions: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for today's work time formatted
employeeSchema.virtual('todayWorkTime').get(function() {
  const hours = Math.floor(this.todayWorkSeconds / 3600);
  const minutes = Math.floor((this.todayWorkSeconds % 3600) / 60);
  const seconds = this.todayWorkSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

// Static method to get pricing config
employeeSchema.statics.getPricingConfig = function() {
  return {
    low: {
      cpu: 1,
      mem: 2,
      disk: 10,
      normal: 1,
      advanced: null
    },
    medium: {
      cpu: 2,
      mem: 4,
      disk: 40,
      normal: 2,
      advanced: 3
    },
    high: {
      cpu: 4,
      mem: 8,
      disk: 40,
      normal: 4,
      advanced: 6
    },
    idleRate: 0.2
  };
};

// Method to calculate daily cost
employeeSchema.methods.calculateDailyCost = function(date = new Date()) {
  const dateStr = date.toISOString().split('T')[0];

  if (this.lastWorkDate !== dateStr) {
    return 0;
  }

  // Calculate cost based on work time
  const workHours = this.todayWorkSeconds / 3600;
  return Math.round(workHours * this.hourlyRate * 100) / 100;
};

// Method to get 24/7 potential cost
employeeSchema.methods.getPotential247Cost = function() {
  return 24 * this.hourlyRate;
};

// Pre-save hook to validate tier and model type compatibility
employeeSchema.pre('save', function(next) {
  const pricing = this.constructor.getPricingConfig();

  if (this.tier === 'low' && this.modelType === 'advanced') {
    next(new Error('Advanced models not available for Lite tier'));
  } else {
    next();
  }
});

export default mongoose.model('Employee', employeeSchema);
