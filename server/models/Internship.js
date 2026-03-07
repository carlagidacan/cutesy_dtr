import mongoose from 'mongoose'

const internshipSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  requiredHours: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  estimatedEndDate: {
    type: Date,
    required: true
  },
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  hoursPerDay: {
    type: Number,
    default: 8,
    min: 1,
    max: 12
  }
}, {
  timestamps: true
})

export default mongoose.model('Internship', internshipSchema)