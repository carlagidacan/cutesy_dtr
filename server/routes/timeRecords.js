import express from 'express'
import TimeRecord from '../models/TimeRecord.js'
import auth from '../middleware/auth.js'

const router = express.Router()

const isValidTimeValue = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)

const normalizeRecordDate = (value) => {
  const dateValue = new Date(value)

  return new Date(Date.UTC(
    dateValue.getUTCFullYear(),
    dateValue.getUTCMonth(),
    dateValue.getUTCDate()
  ))
}

// Get all time records for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    let query = { userId: req.user.id }
    
    // Add date filtering if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const records = await TimeRecord.find(query).sort({ date: -1 })
    res.json(records)
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Get total hours worked by the authenticated user
router.get('/total', auth, async (req, res) => {
  try {
    const totalHours = await TimeRecord.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: null, totalHours: { $sum: '$hours' } } }
    ])
    
    res.json({ 
      totalHours: totalHours.length > 0 ? totalHours[0].totalHours : 0 
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Add a new time record
router.post('/', auth, async (req, res) => {
  try {
    const { date, clockInTime, clockOutTime, hours, description, tasks } = req.body
    const normalizedDate = normalizeRecordDate(date)

    // Validate required fields
    if (!date || !clockInTime || !clockOutTime || !hours) {
      return res.status(400).json({ 
        message: 'Date, clock in time, clock out time, and hours are required'
      })
    }

    if (!isValidTimeValue(clockInTime) || !isValidTimeValue(clockOutTime)) {
      return res.status(400).json({
        message: 'Clock in and clock out time must use HH:MM format'
      })
    }

    // Check if record already exists for this date
    const existingRecord = await TimeRecord.findOne({ 
      userId: req.user.id, 
      date: normalizedDate
    })
    
    if (existingRecord) {
      return res.status(400).json({ 
        message: 'A record already exists for this date. Please edit the existing record.' 
      })
    }

    // Create new time record
    const timeRecord = new TimeRecord({
      userId: req.user.id,
      date: normalizedDate,
      clockInTime,
      clockOutTime,
      hours: parseFloat(hours),
      description: description || '',
      tasks: tasks || []
    })

    await timeRecord.save()

    res.status(201).json({
      message: 'Time record added successfully',
      record: timeRecord
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A record already exists for this date. Please edit the existing record.'
      })
    }

    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Update an existing time record
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, clockInTime, clockOutTime, hours, description, tasks } = req.body
    const normalizedDate = date ? normalizeRecordDate(date) : null
    
    // Find the record and verify ownership
    const timeRecord = await TimeRecord.findOne({
      _id: req.params.id,
      userId: req.user.id
    })
    
    if (!timeRecord) {
      return res.status(404).json({ message: 'Time record not found' })
    }

    if (clockInTime !== undefined && clockInTime !== '' && !isValidTimeValue(clockInTime)) {
      return res.status(400).json({
        message: 'Clock in time must use HH:MM format'
      })
    }

    if (clockOutTime !== undefined && clockOutTime !== '' && !isValidTimeValue(clockOutTime)) {
      return res.status(400).json({
        message: 'Clock out time must use HH:MM format'
      })
    }

    if (normalizedDate) {
      const conflictingRecord = await TimeRecord.findOne({
        userId: req.user.id,
        date: normalizedDate,
        _id: { $ne: req.params.id }
      })

      if (conflictingRecord) {
        return res.status(400).json({
          message: 'A record already exists for this date. Please edit the existing record.'
        })
      }
    }

    // Update fields
    timeRecord.date = normalizedDate || timeRecord.date
    timeRecord.clockInTime = clockInTime !== undefined ? clockInTime : timeRecord.clockInTime
    timeRecord.clockOutTime = clockOutTime !== undefined ? clockOutTime : timeRecord.clockOutTime
    timeRecord.hours = parseFloat(hours) || timeRecord.hours
    timeRecord.description = description !== undefined ? description : timeRecord.description
    timeRecord.tasks = tasks !== undefined ? tasks : timeRecord.tasks

    await timeRecord.save()

    res.json({
      message: 'Time record updated successfully',
      record: timeRecord
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'A record already exists for this date. Please edit the existing record.'
      })
    }

    console.error(error.message)
    res.status(500).send('Server error')
  }
})

// Delete a time record
router.delete('/:id', auth, async (req, res) => {
  try {
    const timeRecord = await TimeRecord.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    })
    
    if (!timeRecord) {
      return res.status(404).json({ message: 'Time record not found' })
    }

    res.json({ message: 'Time record deleted successfully' })
  } catch (error) {
    console.error(error.message)
    res.status(500).send('Server error')
  }
})

export default router