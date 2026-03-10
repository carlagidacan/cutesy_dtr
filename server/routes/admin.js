import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Admin Middleware: ensure the user has 'admin' role
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Requires admin privileges' })
        }
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Server error authorizing admin' })
    }
}

// GET /api/admin/users
// Fetch all regular users
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })

        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ message: 'Server error fetching users' })
    }
})

// PUT /api/admin/users/:id/reset-password
// Reset a specific user's password
router.put('/users/:id/reset-password', auth, isAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' })
        }

        const user = await User.findById(req.params.id)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot reset another admin password through this endpoint' })
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(newPassword, salt)
        await user.save()

        res.json({ message: 'Password reset successfully' })
    } catch (error) {
        console.error('Error resetting password:', error)
        res.status(500).json({ message: 'Server error resetting password' })
    }
})

export default router
