import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  employeeName: String,
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['hire', 'work', 'stop', 'delete', 'clone'],
    required: true
  },
  timestamp: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: true
});

// Virtual for formatted time
activitySchema.virtual('time').get(function() {
  const date = new Date(this.timestamp);
  return date.toTimeString().split(' ')[0];
});

export default mongoose.model('Activity', activitySchema);
