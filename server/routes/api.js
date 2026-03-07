import express from 'express'

const router = express.Router()

// Sample route
router.get('/hello', (req, res) => {
  res.json({ message: 'Hello from API!' })
})

// Add more routes here
router.get('/users', (req, res) => {
  res.json({ users: [] })
})

export default router