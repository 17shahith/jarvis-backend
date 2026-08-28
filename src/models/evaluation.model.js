import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  modelUsed: {
    type: String,
    required: true,
    index: true
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
    required: true,
    index: true
  },
  memoryHitsCount: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 1
  },
  userFeedbackRating: {
    type: Number,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

const Evaluation = mongoose.models.Evaluation || mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
