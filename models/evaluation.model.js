import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  modelUsed: {
    type: String,
    required: true
  },
  promptLength: {
    type: Number,
    required: true
  },
  responseLength: {
    type: Number,
    required: true
  },
  latencyMs: {
    type: Number,
    required: true
  },
  memoryHitsCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number, // 1 for success, 0 for failure/error
    default: 1
  },
  userFeedbackRating: {
    type: Number, // 1-5 stars if provided
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
