import mongoose from 'mongoose'

const timeRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clockInTime: {
    type: String,
    trim: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/
  },
  clockOutTime: {
    type: String,
    trim: true,
    match: /^([01]\d|2[0-3]):([0-5]\d)$/
  },
  hours: {
    type: Number,
    required: true,
    min: 0.1,
    max: 24
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  tasks: [{
    task: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    completed: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
})

// One record per user per calendar date.
timeRecordSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.model('TimeRecord', timeRecordSchema)