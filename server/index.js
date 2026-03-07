import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import apiRoutes from './routes/api.js'
import authRoutes from './routes/auth.js'
import internshipRoutes from './routes/internship.js'
import timeRecordsRoutes from './routes/timeRecords.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
let dbConnectionPromise

// Middleware
app.use(cors())
app.use(express.json())

app.use(async (req, res, next) => {
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

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server Connected Successfully!' })
})

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
      dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI)
      await dbConnectionPromise
      console.log('MongoDB connected successfully')
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