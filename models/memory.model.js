import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional if running without active login session
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);
export default Memory;
