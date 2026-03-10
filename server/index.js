import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import apiRoutes from './routes/api.js'
import authRoutes from './routes/auth.js'
import internshipRoutes from './routes/internship.js'
import timeRecordsRoutes from './routes/timeRecords.js'
import adminRoutes from './routes/admin.js'
import User from './models/User.js'
import bcrypt from 'bcryptjs'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
let dbConnectionPromise

// Middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'DTR backend is running',
    health: '/api/test'
  })
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server Connected Successfully!' })
})

app.use(async (req, res, next) => {
  if (req.path === '/' || req.path === '/api/test') {
    next()
    return
  }

  try {
    await connectDB()
    next()
  } catch (error) {
    console.error('Database initialization failed:', error)
    res.status(500).json({ message: 'Database connection failed' })
  }
})

// Routes
app.use('/api', apiRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/internship', internshipRoutes)
app.use('/api/records', timeRecordsRoutes)
app.use('/api/admin', adminRoutes)

// Seed default admin
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash('admin123', salt)

      const admin = new User({
        name: 'System Admin',
        company: 'DTR System',
        email: 'admin@dtr.com',
        password: hashedPassword,
        role: 'admin'
      })

      await admin.save()
      console.log('Default admin account created: admin@dtr.com / admin123')
    }
  } catch (error) {
    console.error('Failed to seed admin user:', error)
  }
}

// Connect to MongoDB
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (dbConnectionPromise) {
    return dbConnectionPromise
  }

  try {
    if (process.env.MONGODB_URI) {
      dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
      })
      await dbConnectionPromise
      console.log('MongoDB connected successfully')

      // Seed admin once connected
      await seedAdmin()

      return mongoose.connection
    } else {
      console.log('MongoDB URI not found in environment variables')
      console.log('Running without database connection')
      return null
    }
  } catch (error) {
    dbConnectionPromise = null
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// Start server
const startServer = async () => {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

if (!process.env.VERCEL) {
  startServer()
}

export default app