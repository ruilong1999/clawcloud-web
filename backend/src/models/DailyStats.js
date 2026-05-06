import mongoose from 'mongoose';

const dailyStatsSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },
  totalCost: {
    type: Number,
    default: 0
  },
  totalPotential: {
    type: Number,
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  },
  employeeStats: [{
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    employeeName: String,
    workSeconds: Number,
    cost: Number
  }],
  activeEmployees: {
    type: Number,
    default: 0
  },
  totalEmployees: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for date queries
dailyStatsSchema.index({ date: -1 });

export default mongoose.model('DailyStats', dailyStatsSchema);
