import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['reminder', 'calendar', 'automation'],
    default: 'reminder'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'canceled'],
    default: 'pending'
  },
  scheduledAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;
