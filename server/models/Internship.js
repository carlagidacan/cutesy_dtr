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
  holidays: {
    january: { type: Number, default: 1, min: 0 },
    february: { type: Number, default: 1, min: 0 },
    march: { type: Number, default: 0, min: 0 },
    april: { type: Number, default: 4, min: 0 },
    may: { type: Number, default: 1, min: 0 },
    june: { type: Number, default: 1, min: 0 },
    july: { type: Number, default: 0, min: 0 },
    august: { type: Number, default: 2, min: 0 },
    september: { type: Number, default: 0, min: 0 },
    october: { type: Number, default: 0, min: 0 },
    november: { type: Number, default: 3, min: 0 },
    december: { type: Number, default: 4, min: 0 }
  },
  hoursPerDay: {
    type: Number,
    default: 8,
    min: 1,
    max: 12
  },
  excludeLunchBreak: {
    type: Boolean,
    default: false
  },
  lunchBreakDuration: {
    type: Number,
    default: 1,
    min: 0.25,
    max: 2
  }
}, {
  timestamps: true
})

export default mongoose.model('Internship', internshipSchema)