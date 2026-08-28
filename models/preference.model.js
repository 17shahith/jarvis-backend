import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  theme: {
    type: String,
    enum: ['violet', 'amber', 'emerald', 'cyber'],
    default: 'violet'
  },
  aiModel: {
    type: String,
    default: 'qwen2.5:1.5b'
  },
  voiceEnabled: {
    type: Boolean,
    default: true
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  customNickName: {
    type: String,
    default: 'Sir'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

preferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Preference = mongoose.models.Preference || mongoose.model('Preference', preferenceSchema);
export default Preference;
