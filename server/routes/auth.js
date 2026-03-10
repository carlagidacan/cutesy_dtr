import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router()

const normalizeEmail = (value = '') => value.trim().toLowerCase()

const isDuplicateEmailError = (error) => error?.code === 11000 && error?.keyPattern?.email

// Register user
router.post('/signup', async (req, res) => {
  try {
    const { name, company, email, password } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Full name is required' })
    }

    if (!company?.trim()) {
      return res.status(400).json({ message: 'Internship company is required' })
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' })
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const normalizedEmail = normalizeEmail(email)

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail })
    if (user) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    // Create new user
    user = new User({
      name: name.trim(),
      company: company.trim(),
      email: normalizedEmail,
      password
    })

    // Hash password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)

    await user.save()

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        company: user.company,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = normalizeEmail(email)

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id
      }
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        company: user.company,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' })
    }

    res.json(user)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, company, email, password } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ message: 'Full name is required' })
    }

    if (!company?.trim()) {
      return res.status(400).json({ message: 'Internship company is required' })
    }

    if (!email?.trim()) {
      return res.status(400).json({ message: 'Email is required' })
    }

    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' })
    }

    const normalizedEmail = normalizeEmail(email)
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id }
    })

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    user.name = name.trim()
    user.company = company.trim()
    user.email = normalizedEmail

    if (password) {
      const salt = await bcrypt.genSalt(10)
      user.password = await bcrypt.hash(password, salt)
    }

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        company: user.company,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(400).json({ message: 'Email already exists' })
    }

    console.error(error.message)
    res.status(500).send('Server error')
  }
})

export default router