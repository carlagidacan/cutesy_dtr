import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuccessModal from './SuccessModal'
import AddRecordModal from './AddRecordModal'
import InternshipSetupModal from './InternshipSetupModal'
import AlertModal from './AlertModal'
import { generateAttendanceReport } from '../utils/reportGenerator'
import { useTheme } from '../contexts/ThemeContext'

const Home = () => {
  const [user, setUser] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [message, setMessage] = useState('')
  const [requiredHours, setRequiredHours] = useState('')
  const [startDate, setStartDate] = useState('')
  const [estimatedEndDate, setEstimatedEndDate] = useState('')
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [timeRecords, setTimeRecords] = useState([])
  const [totalHoursWorked, setTotalHoursWorked] = useState(0)
  const [editingRecord, setEditingRecord] = useState(null)
  const [recordForm, setRecordForm] = useState({
    date: new Date().toISOString().split('T')[0],
    dates: [],
    dateInput: '',
    clockInTime: '',
    clockOutTime: '',
    description: ''
  })
  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  })
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [deleteConfirmationDate, setDeleteConfirmationDate] = useState('')
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false)
  const [currentRecordsPage, setCurrentRecordsPage] = useState(1)
  const [selectedRecords, setSelectedRecords] = useState([])
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false)
  const [excludeLunchBreak, setExcludeLunchBreak] = useState(false)
  const [lunchBreakDuration, setLunchBreakDuration] = useState(1)
  const [holidays, setHolidays] = useState({
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
  })
  const [leaveAndAbsentDays, setLeaveAndAbsentDays] = useState(0)
  const [leaveAndAbsentDates, setLeaveAndAbsentDates] = useState([])
  const [newLeaveDate, setNewLeaveDate] = useState('')
  const [activeSetupTab, setActiveSetupTab] = useState('basic')
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === 'dark'
  const recordsPerPage = 5

  const formatHoursAndMinutes = (decimalHours) => {
    if (decimalHours === 0) return '0h 0m'

    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)

    if (hours === 0) {
      return `${minutes}m`
    } else if (minutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${minutes}m`
    }
  }

  const openAlertModal = (message, title = 'Warning') => {
    setAlertModal({ isOpen: true, title, message })
  }

  const closeAlertModal = () => {
    setAlertModal({ isOpen: false, title: '', message: '' })
  }

  const handleSetupAutoOpen = () => {
    if (localStorage.getItem('openInternshipSetupOnArrival') === 'true') {
      setShowConfig(true)
      localStorage.removeItem('openInternshipSetupOnArrival')
      return true
    }

    return false
  }

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    fetchUserData()

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeInterval)
  }, [navigate])

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(timeRecords.length / recordsPerPage))

    if (currentRecordsPage > totalPages) {
      setCurrentRecordsPage(totalPages)
    }
  }, [timeRecords.length, currentRecordsPage])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
      setMessage('Welcome to your OJT Time Record!')

      // Fetch internship configuration after getting user data
      const internshipConfig = await fetchInternshipConfig()
      // Fetch time records after getting user data
      await fetchTimeRecords(internshipConfig)
    } catch (error) {
      setMessage('Error loading user data')
      console.error('Error:', error)
      // If token is invalid, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        setTheme('light')
        navigate('/login')
      }
    }
  }

  const fetchInternshipConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/internship/config', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const config = response.data
      setRequiredHours(config.requiredHours.toString())
      setStartDate(config.startDate.split('T')[0]) // Convert to YYYY-MM-DD format
      setEstimatedEndDate(config.estimatedEndDate.split('T')[0])
      setWorkingDays(config.workingDays)
      setExcludeLunchBreak(config.excludeLunchBreak || false)
      setLunchBreakDuration(config.lunchBreakDuration || 1)
      setHolidays(config.holidays || holidays)
      setLeaveAndAbsentDays(config.leaveAndAbsentDays || 0)

      // Also save to localStorage as backup
      localStorage.setItem('requiredHours', config.requiredHours.toString())
      localStorage.setItem('startDate', config.startDate.split('T')[0])
      localStorage.setItem('workingDays', JSON.stringify(config.workingDays))
      localStorage.setItem('excludeLunchBreak', config.excludeLunchBreak.toString())
      localStorage.setItem('lunchBreakDuration', config.lunchBreakDuration.toString())
      localStorage.setItem('holidays', JSON.stringify(config.holidays || holidays))
      localStorage.setItem('leaveAndAbsentDays', config.leaveAndAbsentDays?.toString() || '0')
      localStorage.setItem('leaveAndAbsentDates', JSON.stringify(config.leaveAndAbsentDates || []))
      setLeaveAndAbsentDates(config.leaveAndAbsentDates || [])
      localStorage.setItem('internshipConfigSaved', 'true')

      handleSetupAutoOpen()
      return config

    } catch (error) {
      console.error('Error fetching internship config:', error)
      const openedFromSignup = handleSetupAutoOpen()

      if (!openedFromSignup && error.response?.status === 404) {
        setShowConfig(true)
      }

      // Fallback to localStorage if database fetch fails
      loadFromLocalStorage()
      return null
    }
  }

  const loadFromLocalStorage = () => {
    const savedRequiredHours = localStorage.getItem('requiredHours')
    const savedStartDate = localStorage.getItem('startDate')
    const savedWorkingDays = localStorage.getItem('workingDays')
    const savedExcludeLunchBreak = localStorage.getItem('excludeLunchBreak')
    const savedLunchBreakDuration = localStorage.getItem('lunchBreakDuration')
    const savedHolidays = localStorage.getItem('holidays')
    const savedLeaveAndAbsentDays = localStorage.getItem('leaveAndAbsentDays')

    if (savedRequiredHours) {
      setRequiredHours(savedRequiredHours)
    }
    if (savedStartDate) {
      setStartDate(savedStartDate)
      const days = savedWorkingDays ? JSON.parse(savedWorkingDays) : workingDays
      const holidaysData = savedHolidays ? JSON.parse(savedHolidays) : holidays
      const leaveDays = savedLeaveAndAbsentDays ? parseInt(savedLeaveAndAbsentDays) : 0
      calculateEndDateWithProgress(savedRequiredHours, savedStartDate, days, totalHoursWorked, excludeLunchBreak, lunchBreakDuration, holidaysData, timeRecords, leaveDays)
    }
    if (savedWorkingDays) {
      setWorkingDays(JSON.parse(savedWorkingDays))
    }
    if (savedExcludeLunchBreak !== null) {
      setExcludeLunchBreak(savedExcludeLunchBreak === 'true')
    }
    if (savedLunchBreakDuration) {
      setLunchBreakDuration(parseFloat(savedLunchBreakDuration))
    }
    if (savedHolidays) {
      setHolidays(JSON.parse(savedHolidays))
    }

    // We keep leaveAndAbsentDays for backwards compatibility
    if (savedLeaveAndAbsentDays) {
      setLeaveAndAbsentDays(parseInt(savedLeaveAndAbsentDays))
    }

    const savedLeaveAndAbsentDates = localStorage.getItem('leaveAndAbsentDates')
    if (savedLeaveAndAbsentDates) {
      setLeaveAndAbsentDates(JSON.parse(savedLeaveAndAbsentDates))
    }
  }

  const fetchTimeRecords = async (configOverride = null) => {
    try {
      const token = localStorage.getItem('token')
      const recordsResponse = await axios.get('/api/records', {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTimeRecords(recordsResponse.data)

      // Calculate total hours from the records directly as fallback
      const calculatedTotal = recordsResponse.data.reduce((total, record) => {
        return total + parseFloat(record.hours || 0)
      }, 0)

      // Try to get total from backend, but use calculated total as fallback
      try {
        const totalResponse = await axios.get('/api/records/total', {
          headers: { Authorization: `Bearer ${token}` }
        })

        const effectiveRequiredHours = configOverride?.requiredHours?.toString() ?? requiredHours
        const effectiveStartDate = configOverride?.startDate?.split?.('T')?.[0] ?? startDate
        const effectiveWorkingDays = configOverride?.workingDays ?? workingDays
        const effectiveexcludeLunchBreak = configOverride?.excludeLunchBreak ?? excludeLunchBreak
        const effectiveLunchBreakDuration = configOverride?.lunchBreakDuration ?? lunchBreakDuration
        const effectiveHolidays = configOverride?.holidays ?? holidays
        const effectiveLeaveAndAbsentDays = configOverride?.leaveAndAbsentDays ?? leaveAndAbsentDays

        // Recalculate estimated end date based on progress
        if (effectiveRequiredHours && effectiveStartDate) {
          calculateEndDateWithProgress(
            effectiveRequiredHours,
            effectiveStartDate,
            effectiveWorkingDays,
            backendTotal,
            effectiveexcludeLunchBreak,
            effectiveLunchBreakDuration,
            effectiveHolidays,
            recordsResponse.data,
            effectiveLeaveAndAbsentDays
          )
        }
      } catch (totalError) {
        console.warn('Backend total endpoint failed, using calculated total:', totalError)
        setTotalHoursWorked(calculatedTotal)

        const effectiveRequiredHours = configOverride?.requiredHours?.toString() ?? requiredHours
        const effectiveStartDate = configOverride?.startDate?.split?.('T')?.[0] ?? startDate
        const effectiveWorkingDays = configOverride?.workingDays ?? workingDays
        const effectiveexcludeLunchBreak = configOverride?.excludeLunchBreak ?? excludeLunchBreak
        const effectiveLunchBreakDuration = configOverride?.lunchBreakDuration ?? lunchBreakDuration
        const effectiveHolidays = configOverride?.holidays ?? holidays
        const effectiveLeaveAndAbsentDays = configOverride?.leaveAndAbsentDays ?? leaveAndAbsentDays

        // Recalculate estimated end date based on progress
        if (effectiveRequiredHours && effectiveStartDate) {
          calculateEndDateWithProgress(
            effectiveRequiredHours,
            effectiveStartDate,
            effectiveWorkingDays,
            calculatedTotal,
            effectiveexcludeLunchBreak,
            effectiveLunchBreakDuration,
            effectiveHolidays,
            recordsResponse.data,
            effectiveLeaveAndAbsentDays
          )
        }
      }

    } catch (error) {
      console.error('Error fetching time records:', error)
      openAlertModal('Error loading time records. Please try again.')
    }
  }

  const addTimeRecord = async () => {
    try {
      const token = localStorage.getItem('token')
      const hours = calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime)
      const datesToSubmit = recordForm.dates && recordForm.dates.length > 0
        ? recordForm.dates
        : [recordForm.date]

      // Create one record per date
      await Promise.all(datesToSubmit.map(date =>
        axios.post('/api/records', {
          date,
          clockInTime: recordForm.clockInTime,
          clockOutTime: recordForm.clockOutTime,
          description: recordForm.description,
          hours
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ))

      setShowAddRecord(false)
      setRecordForm({
        date: new Date().toISOString().split('T')[0],
        dates: [],
        dateInput: '',
        clockInTime: '',
        clockOutTime: '',
        description: ''
      })

      // Refresh records
      await fetchTimeRecords()

    } catch (error) {
      console.error('Error adding time record:', error)
      openAlertModal(error.response?.data?.message || 'Error adding record. Please try again.')
    }
  }

  const updateTimeRecord = async () => {
    try {
      const token = localStorage.getItem('token')
      const hours = calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime)
      const recordData = {
        ...recordForm,
        hours: hours
      }

      await axios.put(`/api/records/${editingRecord._id}`, recordData, {
        headers: { Authorization: `Bearer ${token}` }
      })


      setShowAddRecord(false)
      setEditingRecord(null)
      setRecordForm({
        date: new Date().toISOString().split('T')[0],
        dates: [],
        dateInput: '',
        clockInTime: '',
        clockOutTime: '',
        description: ''
      })

      // Refresh records
      await fetchTimeRecords()

    } catch (error) {
      console.error('Error updating time record:', error)
      openAlertModal(error.response?.data?.message || 'Error updating record. Please try again.')
    }
  }

  const deleteTimeRecord = async (recordId) => {
    setRecordToDelete(recordId)
    setIsDeletingMultiple(false)
    setDeleteConfirmationDate('')
    setShowDeleteConfirm(true)
  }

  const handleDeleteSelected = () => {
    if (selectedRecords.length === 0) return
    setIsDeletingMultiple(true)
    setDeleteConfirmationDate('')
    setShowDeleteConfirm(true)
  }

  const confirmDeleteRecord = async () => {
    try {
      const token = localStorage.getItem('token')

      if (isDeletingMultiple) {
        await axios.delete('/api/records/batch', {
          headers: { Authorization: `Bearer ${token}` },
          data: { recordIds: selectedRecords }
        })
        setSelectedRecords([])
      } else {
        if (!recordToDelete) return
        await axios.delete(`/api/records/${recordToDelete}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }

      // Refresh records
      await fetchTimeRecords()

    } catch (error) {
      console.error('Error deleting time record(s):', error)
      openAlertModal('Error deleting record(s). Please try again.')
    } finally {
      setShowDeleteConfirm(false)
      setRecordToDelete(null)
      setIsDeletingMultiple(false)
      setDeleteConfirmationDate('')
    }
  }

  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev =>
      prev.includes(recordId)
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId]
    )
  }

  const toggleAllRecordsSelection = () => {
    if (selectedRecords.length === paginatedRecords.length) {
      // If all visible are selected, deselect them
      setSelectedRecords(prev =>
        prev.filter(id => !paginatedRecords.some(r => r._id === id))
      )
    } else {
      // Select all visible records that aren't already selected
      const visibleIds = paginatedRecords.map(r => r._id)
      setSelectedRecords(prev => {
        const newSelection = [...prev]
        visibleIds.forEach(id => {
          if (!newSelection.includes(id)) newSelection.push(id)
        })
        return newSelection
      })
    }
  }

  const handleAddRecord = () => {
    setEditingRecord(null)
    setRecordForm({
      date: new Date().toISOString().split('T')[0],
      clockInTime: '',
      clockOutTime: '',
      description: ''
    })
    setShowAddRecord(true)
  }

  const handleEditRecord = (record) => {
    setEditingRecord(record)
    const hours = parseFloat(record.hours)
    const defaultStart = '08:00'
    const fallbackClockInTime = record.clockInTime || defaultStart
    const startTime = new Date(`2000-01-01T${fallbackClockInTime}:00`)
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000)

    setRecordForm({
      date: record.date.split('T')[0],
      clockInTime: record.clockInTime || defaultStart,
      clockOutTime: record.clockOutTime || endTime.toTimeString().slice(0, 5),
      description: record.description || ''
    })
    setShowAddRecord(true)
  }

  const saveInternshipConfig = async () => {
    try {
      const token = localStorage.getItem('token')
      const configData = {
        requiredHours: parseInt(requiredHours),
        startDate: startDate,
        estimatedEndDate: estimatedEndDate,
        workingDays: workingDays,
        hoursPerDay: 8,
        excludeLunchBreak: excludeLunchBreak,
        lunchBreakDuration: parseFloat(lunchBreakDuration),
        holidays: holidays,
        leaveAndAbsentDays: parseInt(leaveAndAbsentDays) || 0,
        leaveAndAbsentDates: leaveAndAbsentDates
      }

      await axios.post('/api/internship/config', configData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Also save to localStorage as backup
      localStorage.setItem('requiredHours', requiredHours)
      localStorage.setItem('startDate', startDate)
      localStorage.setItem('workingDays', JSON.stringify(workingDays))
      localStorage.setItem('excludeLunchBreak', excludeLunchBreak.toString())
      localStorage.setItem('lunchBreakDuration', lunchBreakDuration.toString())
      localStorage.setItem('holidays', JSON.stringify(holidays))
      localStorage.setItem('leaveAndAbsentDays', (parseInt(leaveAndAbsentDays) || 0).toString())
      localStorage.setItem('leaveAndAbsentDates', JSON.stringify(leaveAndAbsentDates))
      localStorage.setItem('internshipConfigSaved', 'true')

      // Update progress summary after successful save
      calculateEndDateWithProgress(requiredHours, startDate, workingDays, totalHoursWorked, excludeLunchBreak, lunchBreakDuration, holidays, timeRecords, leaveAndAbsentDates)

      setShowSuccessModal(true)
      setShowConfig(false)

    } catch (error) {
      console.error('Error saving internship config:', error)
      openAlertModal('Error saving configuration. Please try again.')
    }
  }

  const handleCancelConfig = () => {
    setShowConfig(false)
    loadFromLocalStorage()
  }

  const handleRequiredHoursChange = (e) => {
    const hours = e.target.value
    setRequiredHours(hours)
  }

  const handleLeaveAndAbsentDaysChange = (e) => {
    const days = Math.max(0, parseInt(e.target.value) || 0)
    setLeaveAndAbsentDays(days)
  }

  const handleAddLeaveDate = () => {
    if (!newLeaveDate) return
    if (!leaveAndAbsentDates.includes(newLeaveDate)) {
      setLeaveAndAbsentDates([...leaveAndAbsentDates, newLeaveDate].sort())
    }
    setNewLeaveDate('')
  }

  const handleRemoveLeaveDate = (dateToRemove) => {
    setLeaveAndAbsentDates(leaveAndAbsentDates.filter(date => date !== dateToRemove))
  }

  const handleStartDateChange = (e) => {
    const date = e.target.value
    setStartDate(date)
  }

  const handleWorkingDayChange = (day) => {
    const updatedDays = { ...workingDays, [day]: !workingDays[day] }
    setWorkingDays(updatedDays)
  }

  const handleExcludeLunchBreakChange = () => {
    const newValue = !excludeLunchBreak
    setExcludeLunchBreak(newValue)
  }

  const handleLunchBreakDurationChange = (e) => {
    const duration = parseFloat(e.target.value)
    setLunchBreakDuration(duration)
  }

  const handleHolidayChange = (monthOrObject) => {
    // Quick Action buttons pass a full updated object; individual cards pass a string key
    if (typeof monthOrObject === 'object' && monthOrObject !== null) {
      setHolidays(monthOrObject)
      return
    }
    const month = monthOrObject
    const philippineHolidays = {
      january: 1, february: 1, march: 0, april: 4, may: 1, june: 1,
      july: 0, august: 2, september: 0, october: 0, november: 3, december: 4
    }
    const updatedHolidays = {
      ...holidays,
      [month]: holidays[month] > 0 ? 0 : philippineHolidays[month]
    }
    setHolidays(updatedHolidays)
  }


  const handleSave = () => {
    if (requiredHours && startDate) {
      saveInternshipConfig()
    } else {
      openAlertModal('Please fill in required hours and start date.')
    }
  }

  const calculateHoursFromTimes = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return 0

    const startTime = new Date(`2000-01-01T${clockIn}:00`)
    const endTime = new Date(`2000-01-01T${clockOut}:00`)

    // Handle overnight shifts
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1)
    }

    const diffInMs = endTime - startTime
    let hours = Math.round((diffInMs / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places

    // Exclude lunch break if enabled
    if (excludeLunchBreak && hours > lunchBreakDuration) {
      hours -= lunchBreakDuration
    }

    return Math.max(0, hours) // Ensure non-negative hours
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMonthsInInternshipPeriod = () => {
    if (!startDate || !estimatedEndDate) return []

    const start = new Date(startDate)
    const end = new Date(estimatedEndDate)

    const months = []
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ]

    // Get the first full month after start date
    let currentMonth = start.getMonth()
    let currentYear = start.getFullYear()

    // If we're not at the beginning of the month, start from next month
    if (start.getDate() > 1) {
      currentMonth++
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
    }

    // Include every month from the first eligible month through the month of the end date.
    while (
      currentYear < end.getFullYear() ||
      (currentYear === end.getFullYear() && currentMonth <= end.getMonth())
    ) {
      months.push({
        key: monthNames[currentMonth],
        date: new Date(currentYear, currentMonth, 1)
      })

      currentMonth++
      if (currentMonth > 11) {
        currentMonth = 0
        currentYear++
      }
    }

    return months
  }

  const calculateWorkedTime = () => {
    return `${totalHoursWorked}h`
  }

  const countHolidaysBetweenDates = (startDate, endDate, holidayConfig) => {
    if (!startDate || !endDate || !holidayConfig) return 0

    const start = new Date(startDate)
    const end = new Date(endDate)

    // If dates are the same, no holidays in between
    if (start.getTime() === end.getTime()) return 0

    // Ensure start is before end
    if (start > end) return 0

    let totalHolidays = 0

    // Count holidays for each month in the range
    let currentDate = new Date(start)
    while (currentDate <= end) {
      const month = currentDate.getMonth() // 0-11
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ]

      const monthName = monthNames[month]
      const holidaysInMonth = holidayConfig[monthName] || 0

      if (holidaysInMonth > 0) {
        // Check if we need full month or partial month
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

        const rangeStart = new Date(Math.max(start.getTime(), monthStart.getTime()))
        const rangeEnd = new Date(Math.min(end.getTime(), monthEnd.getTime()))

        if (rangeStart <= rangeEnd) {
          // Calculate proportion of month covered
          const totalDaysInMonth = monthEnd.getDate()
          const daysInRange = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
          const proportion = daysInRange / totalDaysInMonth

          // Add proportional holidays (rounded to nearest whole number)
          totalHolidays += Math.round(holidaysInMonth * proportion)
        }
      }

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    }

    return totalHolidays
  }

  const formatLocalYYYYMMDD = (date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const calculateEndDateWithProgress = (hours, start, selectedDays = workingDays, workedHours = 0, excludeLunch = excludeLunchBreak, lunchDuration = lunchBreakDuration, holidayConfig = holidays, records = timeRecords, leaveDatesArray = leaveAndAbsentDates) => {
    if (!hours || !start) {
      return
    }

    const totalHours = Math.max(0, Number(hours))
    const remainingHours = Math.max(0, totalHours - Math.max(0, Number(workedHours || 0)))
    const baseHoursPerDay = 9
    const effectiveHoursPerDay = excludeLunch ? Math.max(0.1, baseHoursPerDay - lunchDuration) : baseHoursPerDay
    const requiredDays = Math.ceil(remainingHours / effectiveHoursPerDay) // Notice no "+ Number(leaveDays || 0)" here, we handle specific dates later
    const workingDayNumbers = []

    if (selectedDays.sunday) workingDayNumbers.push(0)
    if (selectedDays.monday) workingDayNumbers.push(1)
    if (selectedDays.tuesday) workingDayNumbers.push(2)
    if (selectedDays.wednesday) workingDayNumbers.push(3)
    if (selectedDays.thursday) workingDayNumbers.push(4)
    if (selectedDays.friday) workingDayNumbers.push(5)
    if (selectedDays.saturday) workingDayNumbers.push(6)

    if (workingDayNumbers.length === 0) {
      setEstimatedEndDate('')
      return
    }

    const startDateValue = new Date(start)

    // Find the latest time record date
    let lastRecordDate = null
    if (records && records.length > 0) {
      const recordDates = records.map(record => new Date(record.date))
      lastRecordDate = new Date(Math.max(...recordDates))
    }

    if (requiredDays === 0) {
      // If no hours remaining, completion date is the latest record date or start date
      const completionDate = lastRecordDate && lastRecordDate > startDateValue ? lastRecordDate : startDateValue
      setEstimatedEndDate(completionDate.toISOString().split('T')[0])
      return
    }

    // Determine the anchor date (where we start counting future required days)
    let anchorDate = new Date(startDateValue)
    if (lastRecordDate && lastRecordDate >= startDateValue) {
      // Start counting from the day NEXT TO the latest record date to avoid double counting
      anchorDate = new Date(lastRecordDate)
      anchorDate.setDate(anchorDate.getDate() + 1)
    }

    const currentDate = new Date(anchorDate)
    currentDate.setHours(0, 0, 0, 0)

    let scheduledDays = 0

    while (scheduledDays < requiredDays) {
      if (workingDayNumbers.includes(currentDate.getDay())) {
        scheduledDays++
        if (scheduledDays === requiredDays) {
          break
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Now consider the specific list of leave & absent dates
    // ONLY absent dates that are strictly greater than anchorDate will shift the timeline forward
    // because any absent dates in the past are inherently already represented by 0 accumulated progress
    // meaning the estimation is naturally deferred.
    let futureAbsentDatesCount = 0;
    if (Array.isArray(leaveDatesArray)) {
      leaveDatesArray.forEach(d => {
        const leaveDateObj = new Date(d);
        leaveDateObj.setHours(0, 0, 0, 0);
        // Only consider the date if it falls ON OR AFTER our anchorDate (the day we start counting forward from)
        // AND it's on a working day
        if (leaveDateObj >= anchorDate && workingDayNumbers.includes(leaveDateObj.getDay())) {
          futureAbsentDatesCount++;
        }
      })
    }

    let absentDaysToBuffer = futureAbsentDatesCount;
    while (absentDaysToBuffer > 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (workingDayNumbers.includes(currentDate.getDay())) {
        absentDaysToBuffer--;
      }
    }

    // Add holidays back to the end date
    // We only add holidays if they are part of our normal schedule (i.e. we would have worked them)
    // To do this properly, we keep extending dates forward whenever we hit a holiday we need to cover.
    let remainingHolidaysToCover = countHolidaysBetweenDates(anchorDate, currentDate, holidayConfig);

    while (remainingHolidaysToCover > 0) {
      currentDate.setDate(currentDate.getDate() + 1);

      // If this new day is a working day, it consumes one of the holiday bÃ¹ffers we needed to add
      if (workingDayNumbers.includes(currentDate.getDay())) {
        remainingHolidaysToCover--;
      }
    }

    setEstimatedEndDate(formatLocalYYYYMMDD(currentDate))
  }

  useEffect(() => {
    if (requiredHours && startDate) {
      calculateEndDateWithProgress(requiredHours, startDate, workingDays, totalHoursWorked, excludeLunchBreak, lunchBreakDuration, holidays, timeRecords, leaveAndAbsentDates)
    }
  }, [requiredHours, startDate, workingDays, totalHoursWorked, excludeLunchBreak, lunchBreakDuration, holidays, timeRecords, leaveAndAbsentDates])

  const calculateEndDate = (hours, start, selectedDays = workingDays) => {
    calculateEndDateWithProgress(hours, start, selectedDays, totalHoursWorked, excludeLunchBreak, lunchBreakDuration, holidays, timeRecords, leaveAndAbsentDates)
  }

  const getRemainingHours = () => {
    if (!requiredHours) return null
    return Math.max(0, parseInt(requiredHours) - totalHoursWorked)
  }

  const getProgressPercentage = () => {
    if (!requiredHours) return 0
    return Math.min(100, (totalHoursWorked / parseInt(requiredHours)) * 100)
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const handleNavbarThemeToggle = async () => {
    if (!user || isUpdatingTheme) {
      return
    }

    const previousTheme = theme
    const nextTheme = theme === 'dark' ? 'light' : 'dark'

    try {
      setIsUpdatingTheme(true)
      setTheme(nextTheme)

      const token = localStorage.getItem('token')
      const response = await axios.put(
        '/api/auth/profile',
        {
          name: user.name || '',
          company: user.company || '',
          email: user.email || '',
          password: '',
          theme: nextTheme
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data?.user) {
        setUser((current) => ({ ...current, ...response.data.user }))
      }
    } catch (error) {
      setTheme(previousTheme)
      openAlertModal(error.response?.data?.message || 'Unable to update theme. Please try again.', 'Theme Update Failed')
    } finally {
      setIsUpdatingTheme(false)
    }
  }

  const confirmLogout = () => {
    localStorage.removeItem('token')
    setTheme('light')
    navigate('/login')
  }

  const totalRecordPages = Math.max(1, Math.ceil(timeRecords.length / recordsPerPage))
  const paginatedRecords = timeRecords.slice(
    (currentRecordsPage - 1) * recordsPerPage,
    currentRecordsPage * recordsPerPage
  )

  const downloadAttendanceReport = async () => {
    if (isGeneratingReport || timeRecords.length === 0) {
      if (timeRecords.length === 0) {
        openAlertModal('No time records available to include in the report.')
      }
      return
    }

    try {
      setIsGeneratingReport(true)
      // TODO: Implement logic to retrieve previous total from database/localStorage
      const previousTotal = 0 // This could be retrieved from historical data
      await generateAttendanceReport({ user, timeRecords, totalHoursWorked, previousTotal })
      setMessage({ text: 'PDF report downloaded successfully!', type: 'success' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      setMessage({ text: 'Error generating PDF report. Please try again.', type: 'error' })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9F6C4] via-white to-[#89D4FF]">
      {/* Navigation */}
      <nav className="border-b border-white/70 bg-white/90 shadow-[0_12px_40px_rgba(68,172,255,0.14)] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => navigate('/profile')}
                className="flex min-w-0 items-center space-x-2 rounded-2xl bg-white/70 px-2 py-2 text-left transition-all duration-200 hover:bg-[#F9F6C4] sm:space-x-3 sm:px-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#44ACFF] via-[#89D4FF] to-[#FE9EC7] sm:h-10 sm:w-10">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-800 sm:text-base">Hi, {user?.name || 'User'}!</p>
                  <p className="truncate text-xs text-slate-500 sm:text-sm">Profile</p>
                </div>
              </button>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
              <button
                type="button"
                onClick={handleNavbarThemeToggle}
                disabled={isUpdatingTheme}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-4 sm:h-10 sm:w-10 ${theme === 'dark' ? 'border-[#FFD24A]/80 bg-[#FFD24A] text-slate-900 focus:ring-[#FFD24A]/25' : 'border-slate-300 bg-white text-slate-700 focus:ring-slate-300/35'} ${isUpdatingTheme ? 'cursor-not-allowed opacity-70' : 'hover:scale-105'}`}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0-1.414 1.414M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center space-x-1 rounded-lg bg-gradient-to-r from-[#44ACFF] to-[#89D4FF] px-2.5 py-1.5 text-[10px] font-medium text-slate-900 shadow-[0_10px_24px_rgba(68,172,255,0.22)] transition-all duration-200 hover:brightness-105 sm:space-x-2 sm:px-4 sm:py-2 sm:text-base"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Setup</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-1.5 px-2.5 sm:py-2 sm:px-4 rounded-lg transition-colors duration-200 text-xs sm:text-base flex items-center"
              >
                <span className="hidden sm:inline">Logout</span>
                <svg className="w-3.5 h-3.5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Add Record Modal */}
      <AddRecordModal
        isOpen={showAddRecord}
        onClose={() => {
          setShowAddRecord(false)
          setEditingRecord(null)
        }}
        editingRecord={editingRecord}
        recordForm={recordForm}
        setRecordForm={setRecordForm}
        onSubmit={editingRecord ? updateTimeRecord : addTimeRecord}
        calculateHoursFromTimes={calculateHoursFromTimes}
        onValidationError={openAlertModal}
        excludeLunchBreak={excludeLunchBreak}
        lunchBreakDuration={lunchBreakDuration}
      />

      <InternshipSetupModal
        isOpen={showConfig}
        onClose={handleCancelConfig}
        onSave={handleSave}
        requiredHours={requiredHours}
        onRequiredHoursChange={handleRequiredHoursChange}
        startDate={startDate}
        onStartDateChange={handleStartDateChange}
        estimatedEndDate={estimatedEndDate}
        workingDays={workingDays}
        onWorkingDayChange={handleWorkingDayChange}
        excludeLunchBreak={excludeLunchBreak}
        onExcludeLunchBreakChange={handleExcludeLunchBreakChange}
        lunchBreakDuration={lunchBreakDuration}
        onLunchBreakDurationChange={handleLunchBreakDurationChange}
        holidays={holidays}
        onHolidayChange={handleHolidayChange}
        getMonthsInInternshipPeriod={getMonthsInInternshipPeriod}
        leaveAndAbsentDates={leaveAndAbsentDates}
        newLeaveDate={newLeaveDate}
        onNewLeaveDateChange={(e) => setNewLeaveDate(e.target.value)}
        onAddLeaveDate={handleAddLeaveDate}
        onRemoveLeaveDate={handleRemoveLeaveDate}
      />
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 animate-fade-in-up">

        {/* Current Time Display */}
        <div className="mb-6 rounded-xl border border-white/75 bg-white/90 p-4 text-center shadow-[0_20px_50px_rgba(68,172,255,0.16)] sm:mb-8 sm:rounded-2xl sm:p-6 lg:p-8">
          <div className="mb-3 sm:mb-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#44ACFF] sm:text-sm">
              {formatDate(currentTime)}
            </p>
          </div>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 font-mono">
            {formatTime(currentTime)}
          </div>
          <div className="inline-flex items-center rounded-full bg-[#89D4FF]/20 px-2 py-1 text-xs font-medium text-[#44ACFF] sm:px-3 sm:text-sm">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">OJT Time Tracking</span>
            <span className="sm:hidden">Time Tracking</span>
          </div>
        </div>

        {/* Add Record Button */}
        <div className="text-center mb-6 sm:mb-8">
          <button
            onClick={handleAddRecord}
            className="mx-auto flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_20px_40px_rgba(68,172,255,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_24px_46px_rgba(254,158,199,0.25)] sm:w-auto sm:space-x-3 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-lg"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Time Record</span>
          </button>
        </div>

        {/* Progress Summary */}
        <div className="mb-6 rounded-xl border border-white/75 bg-white/90 p-4 shadow-[0_20px_50px_rgba(68,172,255,0.16)] sm:mb-8 sm:rounded-2xl sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Progress Summary</h2>
            {requiredHours && (
              <div className="text-xs sm:text-sm font-medium text-gray-500">
                {Math.round(getProgressPercentage())}% Complete
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="rounded-lg bg-[#F9F6C4]/70 p-3 sm:p-4">
              <h3 className="mb-1 text-xs font-medium text-[#44ACFF] sm:text-sm">Hours Completed</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                {formatHoursAndMinutes(totalHoursWorked)}
              </p>
            </div>
            <div className="rounded-lg bg-[#89D4FF]/18 p-3 sm:p-4">
              <h3 className="mb-1 text-xs font-medium text-[#44ACFF] sm:text-sm">Hours Remaining</h3>
              <p className="text-lg font-bold text-slate-900 sm:text-2xl">
                {formatHoursAndMinutes(getRemainingHours())}
              </p>
            </div>
            <div className="rounded-lg bg-[#FE9EC7]/18 p-3 sm:p-4">
              <h3 className="mb-1 text-xs font-medium text-[#FE9EC7] sm:text-sm">Start Date</h3>
              <p className="text-sm font-bold text-slate-900 sm:text-lg">
                {startDate ? new Date(startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: window.innerWidth >= 640 ? 'numeric' : '2-digit'
                }) : 'Not set'}
              </p>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-[#F9F6C4]/80 to-[#FE9EC7]/22 p-3 sm:p-4">
              <h3 className="mb-1 text-xs font-medium text-[#44ACFF] sm:text-sm">Estimated End Date</h3>
              <p className="text-sm font-bold text-slate-900 sm:text-lg">
                {estimatedEndDate ? new Date(estimatedEndDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: window.innerWidth >= 640 ? 'numeric' : '2-digit'
                }) : 'Not calculated'}
              </p>
            </div>
          </div>

          {requiredHours && (
            <div className="mb-3 h-2 w-full rounded-full bg-slate-200 sm:mb-4 sm:h-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] transition-all duration-300 sm:h-3"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Recent Time Records */}
        <div className={`rounded-xl border p-4 shadow-[0_20px_50px_rgba(68,172,255,0.16)] sm:rounded-2xl sm:p-6 ${isDarkMode ? 'border-cyan-500/30 bg-black' : 'border-white/75 bg-white/90'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Records</h2>
              {timeRecords.length > 0 && (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paginatedRecords.length > 0 && selectedRecords.length >= paginatedRecords.length && paginatedRecords.every(r => selectedRecords.includes(r._id))}
                    onChange={toggleAllRecordsSelection}
                    className="w-4 h-4 rounded border-gray-300 text-[#44ACFF] focus:ring-[#44ACFF]"
                  />
                  <span className="text-sm text-gray-600">Select All Page</span>
                </label>
              )}
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {selectedRecords.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center justify-center space-x-1 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 shadow-sm border border-red-200 transition-all duration-200 hover:bg-red-100 sm:w-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Selected ({selectedRecords.length})</span>
                </button>
              )}
              <button
                onClick={downloadAttendanceReport}
                disabled={isGeneratingReport || timeRecords.length === 0}
                className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#44ACFF] to-[#89D4FF] px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_16px_32px_rgba(68,172,255,0.2)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_20px_36px_rgba(68,172,255,0.24)] disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-300 disabled:to-gray-400 sm:w-auto sm:flex-initial"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>
                  {isGeneratingReport ? 'Generating...' : timeRecords.length === 0 ? 'No Records Available' : 'Download Report'}
                </span>
              </button>
            </div>
          </div>

          {timeRecords.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {paginatedRecords.map((record) => (
                <div key={record._id} className={`flex items-center justify-between rounded-lg p-3 transition-colors duration-200 sm:p-4 border ${selectedRecords.includes(record._id) ? (isDarkMode ? 'border-cyan-300/70 bg-cyan-500/30 shadow-sm' : 'border-[#44ACFF] bg-[#89D4FF]/20 shadow-sm') : (isDarkMode ? 'border-cyan-500/40 bg-cyan-500/20 hover:bg-cyan-500/25' : 'border-transparent bg-[#F9F6C4]/45 hover:bg-[#89D4FF]/12')}`}>
                  <div className="flex-1 min-w-0 flex items-center mb-[2px] mt-[1px]">
                    <div className="mr-3 w-5">
                      <input
                        type="checkbox"
                        checked={selectedRecords.includes(record._id)}
                        onChange={() => toggleRecordSelection(record._id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#44ACFF] focus:ring-[#44ACFF]"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 min-w-24">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-base font-bold text-[#44ACFF] sm:text-lg min-w-20">
                        {formatHoursAndMinutes(parseFloat(record.hours))}
                      </div>
                      {record.description && (
                        <div className="text-xs sm:text-sm text-gray-600 truncate max-w-full sm:max-w-xs xl:max-w-md">
                          {record.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => handleEditRecord(record)}
                      className="p-1 text-[#44ACFF] hover:text-[#FE9EC7] sm:p-1"
                      title="Edit record"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTimeRecord(record._id)}
                      className="text-red-600 hover:text-red-800 p-1 sm:p-1"
                      title="Delete record"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {timeRecords.length > recordsPerPage && (
                <div className="flex items-center justify-center gap-2 pt-3 sm:pt-4">
                  <button
                    onClick={() => setCurrentRecordsPage((page) => Math.max(1, page - 1))}
                    disabled={currentRecordsPage === 1}
                    className="rounded-lg border border-[#89D4FF]/35 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-[#89D4FF]/12 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalRecordPages }, (_, index) => {
                    const pageNumber = index + 1
                    const isActive = pageNumber === currentRecordsPage
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentRecordsPage(pageNumber)}
                        className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-200 ${isActive ? 'bg-[#44ACFF] text-white shadow-md' : 'border border-[#89D4FF]/35 text-slate-600 hover:bg-[#89D4FF]/12'}`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setCurrentRecordsPage((page) => Math.min(totalRecordPages, page + 1))}
                    disabled={currentRecordsPage === totalRecordPages}
                    className="rounded-lg border border-[#89D4FF]/35 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-[#89D4FF]/12 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">No time records yet</p>
              <button
                onClick={handleAddRecord}
                className="text-sm font-medium text-[#44ACFF] hover:text-[#FE9EC7] sm:text-base"
              >
                Add your first record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Configuration Saved!"
        message="Your internship configuration has been saved successfully."
        theme={theme}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        title={alertModal.title}
        message={alertModal.message}
        theme={theme}
      />

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_70px_rgba(254,158,199,0.18)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              <div className="text-center mb-8">
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Logout</h2>
                <p className="text-lg text-gray-600">Are you sure you want to log out of your account?</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button onClick={() => setShowLogoutConfirm(false)} className="order-2 w-full rounded-2xl bg-gray-100 px-6 py-3 text-lg font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 sm:order-1 sm:flex-1">Cancel</button>
                <button onClick={confirmLogout} className="w-full sm:flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg order-1 sm:order-2">
                  <span>Yes, Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_70px_rgba(254,158,199,0.18)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Delete Time Record</h2>
                <p className="text-gray-600 text-lg mb-4">This action cannot be undone.</p>
                {(() => {
                  if (isDeletingMultiple) {
                    const expectedText = `delete ${selectedRecords.length} records`;
                    return (
                      <>
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm font-medium text-red-800 mb-2">You are about to delete <span className="font-bold">{selectedRecords.length} records</span></p>
                          <p className="text-sm text-red-600">Type <span className="font-mono bg-red-100 px-1 py-0.5 rounded">delete {selectedRecords.length} records</span> to confirm:</p>
                        </div>
                        <input type="text" value={deleteConfirmationDate} onChange={(e) => setDeleteConfirmationDate(e.target.value)} placeholder={`Type: ${expectedText}`} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors duration-200" autoFocus />
                      </>
                    )
                  }
                  const recordToDeleteObj = timeRecords.find(record => record._id === recordToDelete)
                  if (!recordToDeleteObj) return null
                  const formattedDate = new Date(recordToDeleteObj.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  return (
                    <>
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-medium text-red-800 mb-2">You are about to delete the record for <span className="font-bold">{formattedDate}</span></p>
                        <p className="text-sm text-red-600">Type the date exactly as shown above to confirm deletion:</p>
                      </div>
                      <input type="text" value={deleteConfirmationDate} onChange={(e) => setDeleteConfirmationDate(e.target.value)} placeholder={`Type: ${formattedDate}`} className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors duration-200" autoFocus />
                    </>
                  )
                })()}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button onClick={() => { setShowDeleteConfirm(false); setRecordToDelete(null); setDeleteConfirmationDate('') }} className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-200 text-lg order-2 sm:order-1">Cancel</button>
                {(() => {
                  let isMatch = false
                  if (isDeletingMultiple) {
                    isMatch = deleteConfirmationDate.trim().toLowerCase() === `delete ${selectedRecords.length} records`.toLowerCase()
                  } else {
                    const recordToDeleteObj = timeRecords.find(record => record._id === recordToDelete)
                    if (recordToDeleteObj) {
                      const formattedDate = new Date(recordToDeleteObj.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      isMatch = deleteConfirmationDate.trim().toLowerCase() === formattedDate.toLowerCase()
                    }
                  }
                  return (
                    <button onClick={confirmDeleteRecord} disabled={!isMatch} className={`w-full sm:flex-1 font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform shadow-lg flex items-center justify-center space-x-2 text-lg order-1 sm:order-2 ${isMatch ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:scale-[1.02] hover:shadow-xl cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete {isDeletingMultiple ? 'Records' : 'Record'}</span>
                    </button>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
