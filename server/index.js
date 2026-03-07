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

// Middleware
app.use(cors())
app.use(express.json())

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
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI)
      console.log('MongoDB connected successfully')
    } else {
      console.log('MongoDB URI not found in environment variables')
      console.log('Running without database connection')
    }
  } catch (error) {
    console.error('MongoDB connection error:', error)
    console.log('Running without database connection')
  }
}

// Start server
const startServer = async () => {
  await connectDB()
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer()