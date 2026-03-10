import mongoose from 'mongoose'

const normalizeEmail = (value) => {
  if (typeof value !== 'string') {
    return value
  }

  return value.trim().toLowerCase()
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    set: normalizeEmail
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
})

export default mongoose.model('User', userSchema)