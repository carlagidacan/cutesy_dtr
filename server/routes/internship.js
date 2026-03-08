import express from 'express'
import Internship from '../models/Internship.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// Get internship configuration
router.get('/config', auth, async (req, res) => {
  try {
    const internship = await Internship.findOne({ userId: req.user.id })
    
    if (!internship) {
      return res.status(404).json({ message: 'No internship configuration found' })
    }

    res.json(internship)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Create or update internship configuration
router.post('/config', auth, async (req, res) => {
  try {
    const {
      requiredHours,
      startDate,
      estimatedEndDate,
      workingDays,
      holidays,
      hoursPerDay,
      excludeLunchBreak,
      lunchBreakDuration,
      leaveAndAbsentDays
    } = req.body

    // Validate required fields
    if (!requiredHours || !startDate || !estimatedEndDate) {
      return res.status(400).json({ 
        message: 'Required hours, start date, and estimated end date are required' 
      })
    }

    // Check if internship config already exists for this user
    let internship = await Internship.findOne({ userId: req.user.id })

    if (internship) {
      // Update existing configuration
      internship.requiredHours = requiredHours
      internship.startDate = startDate
      internship.estimatedEndDate = estimatedEndDate
      internship.workingDays = workingDays || internship.workingDays
      internship.holidays = holidays || internship.holidays
      internship.hoursPerDay = hoursPerDay ?? internship.hoursPerDay
      internship.excludeLunchBreak = excludeLunchBreak !== undefined ? excludeLunchBreak : internship.excludeLunchBreak
      internship.lunchBreakDuration = lunchBreakDuration ?? internship.lunchBreakDuration
      internship.leaveAndAbsentDays = leaveAndAbsentDays ?? internship.leaveAndAbsentDays

      await internship.save()
    } else {
      // Create new configuration
      internship = new Internship({
        userId: req.user.id,
        requiredHours,
        startDate,
        estimatedEndDate,
        workingDays: workingDays || {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false
        },
        holidays: holidays || {
          january: 1,
          february: 1,
          march: 0,
          april: 4,
          may: 1,
          june: 1,
          july: 0,
          august: 2,
          september: 0,
          october: 0,
          november: 3,
          december: 4
        },
        hoursPerDay: hoursPerDay ?? 8,
        excludeLunchBreak: excludeLunchBreak ?? false,
        lunchBreakDuration: lunchBreakDuration ?? 1,
        leaveAndAbsentDays: leaveAndAbsentDays ?? 0
      })

      await internship.save()
    }

    res.json({
      message: 'Internship configuration saved successfully',
      internship
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Delete internship configuration
router.delete('/config', auth, async (req, res) => {
  try {
    const internship = await Internship.findOneAndDelete({ userId: req.user.id })
    
    if (!internship) {
      return res.status(404).json({ message: 'No internship configuration found' })
    }

    res.json({ message: 'Internship configuration deleted successfully' })
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

export default router