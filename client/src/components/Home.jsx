import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuccessModal from './SuccessModal'
import AddRecordModal from './AddRecordModal'
import AlertModal from './AlertModal'
import { generateAttendanceReport } from '../utils/reportGenerator'

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
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [currentRecordsPage, setCurrentRecordsPage] = useState(1)
  const [excludeLunchBreak, setExcludeLunchBreak] = useState(false)
  const [lunchBreakDuration, setLunchBreakDuration] = useState(1)
  const navigate = useNavigate()
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
      await fetchInternshipConfig()
      // Fetch time records after getting user data
      await fetchTimeRecords()
    } catch (error) {
      setMessage('Error loading user data')
      console.error('Error:', error)
      // If token is invalid, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
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
      
      // Also save to localStorage as backup
      localStorage.setItem('requiredHours', config.requiredHours.toString())
      localStorage.setItem('startDate', config.startDate.split('T')[0])
      localStorage.setItem('workingDays', JSON.stringify(config.workingDays))
      localStorage.setItem('excludeLunchBreak', config.excludeLunchBreak.toString())
      localStorage.setItem('lunchBreakDuration', config.lunchBreakDuration.toString())
      localStorage.setItem('internshipConfigSaved', 'true')

      handleSetupAutoOpen()
      
    } catch (error) {
      console.error('Error fetching internship config:', error)
      const openedFromSignup = handleSetupAutoOpen()

      if (!openedFromSignup && error.response?.status === 404) {
        setShowConfig(true)
      }

      // Fallback to localStorage if database fetch fails
      loadFromLocalStorage()
    }
  }

  const loadFromLocalStorage = () => {
    const savedRequiredHours = localStorage.getItem('requiredHours')
    const savedStartDate = localStorage.getItem('startDate')
    const savedWorkingDays = localStorage.getItem('workingDays')
    const savedExcludeLunchBreak = localStorage.getItem('excludeLunchBreak')
    const savedLunchBreakDuration = localStorage.getItem('lunchBreakDuration')
    
    if (savedRequiredHours) {
      setRequiredHours(savedRequiredHours)
    }
    if (savedStartDate) {
      setStartDate(savedStartDate)
      const days = savedWorkingDays ? JSON.parse(savedWorkingDays) : workingDays
      calculateEndDate(savedRequiredHours, savedStartDate, days)
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
  }

  const fetchTimeRecords = async () => {
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
      
      console.log('Calculated total hours:', calculatedTotal)
      console.log('Records:', recordsResponse.data)
      
      // Try to get total from backend, but use calculated total as fallback
      try {
        const totalResponse = await axios.get('/api/records/total', {
          headers: { Authorization: `Bearer ${token}` }
        })
        console.log('Backend total response:', totalResponse.data)
        const backendTotal = totalResponse.data.totalHours || totalResponse.data.total || calculatedTotal
        setTotalHoursWorked(backendTotal)
        
        // Recalculate estimated end date based on progress
        if (requiredHours && startDate) {
          calculateEndDateWithProgress(requiredHours, startDate, workingDays, backendTotal)
        }
      } catch (totalError) {
        console.warn('Backend total endpoint failed, using calculated total:', totalError)
        setTotalHoursWorked(calculatedTotal)
        
        // Recalculate estimated end date based on progress
        if (requiredHours && startDate) {
          calculateEndDateWithProgress(requiredHours, startDate, workingDays, calculatedTotal)
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
      const recordData = {
        ...recordForm,
        hours: hours
      }
      
      const response = await axios.post('/api/records', recordData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      
      setShowAddRecord(false)
      setRecordForm({
        date: new Date().toISOString().split('T')[0],
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
    setShowDeleteConfirm(true)
  }

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/records/${recordToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Refresh records
      await fetchTimeRecords()
      
    } catch (error) {
      console.error('Error deleting time record:', error)
      openAlertModal('Error deleting record. Please try again.')
    } finally {
      setShowDeleteConfirm(false)
      setRecordToDelete(null)
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
        lunchBreakDuration: parseFloat(lunchBreakDuration)
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
      localStorage.setItem('internshipConfigSaved', 'true')
      
      setShowSuccessModal(true)
      setShowConfig(false)
      
    } catch (error) {
      console.error('Error saving internship config:', error)
      openAlertModal('Error saving configuration. Please try again.')
    }
  }

  const handleRequiredHoursChange = (e) => {
    const hours = e.target.value
    setRequiredHours(hours)
    calculateEndDate(hours, startDate, workingDays)
  }

  const handleStartDateChange = (e) => {
    const date = e.target.value
    setStartDate(date)
    calculateEndDate(requiredHours, date, workingDays)
  }

  const handleWorkingDayChange = (day) => {
    const updatedDays = { ...workingDays, [day]: !workingDays[day] }
    setWorkingDays(updatedDays)
    calculateEndDate(requiredHours, startDate, updatedDays)
  }

  const handleExcludeLunchBreakChange = () => {
    const newValue = !excludeLunchBreak
    setExcludeLunchBreak(newValue)
    calculateEndDate(requiredHours, startDate, workingDays)
  }

  const handleLunchBreakDurationChange = (e) => {
    const duration = parseFloat(e.target.value)
    setLunchBreakDuration(duration)
    calculateEndDate(requiredHours, startDate, workingDays)
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

  const calculateWorkedTime = () => {
    return `${totalHoursWorked}h`
  }

  const calculateEndDateWithProgress = (hours, start, selectedDays = workingDays, workedHours = 0) => {
    if (!hours || !start) {
      return
    }

    const totalHours = Math.max(0, Number(hours))
    const remainingHours = Math.max(0, totalHours - Math.max(0, Number(workedHours || 0)))
    const baseHoursPerDay = 8
    const effectiveHoursPerDay = excludeLunchBreak ? Math.max(0.1, baseHoursPerDay - lunchBreakDuration) : baseHoursPerDay
    const requiredDays = Math.ceil(remainingHours / effectiveHoursPerDay)
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

    if (requiredDays === 0) {
      const completedDate = new Date()
      completedDate.setHours(0, 0, 0, 0)
      setEstimatedEndDate(completedDate.toISOString().split('T')[0])
      return
    }

    const startDateValue = new Date(start)
    const today = new Date()
    const anchorDate = workedHours > 0 && today > startDateValue ? today : startDateValue
    const currentDate = new Date(anchorDate)
    currentDate.setHours(0, 0, 0, 0)

    let scheduledDays = 0

    while (scheduledDays < requiredDays) {
      if (workingDayNumbers.includes(currentDate.getDay())) {
        scheduledDays++
      }

      if (scheduledDays === requiredDays) {
        break
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    setEstimatedEndDate(currentDate.toISOString().split('T')[0])
  }

  const calculateEndDate = (hours, start, selectedDays = workingDays) => {
    calculateEndDateWithProgress(hours, start, selectedDays, totalHoursWorked)
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

  const confirmLogout = () => {
    localStorage.removeItem('token')
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
      await generateAttendanceReport({ user, timeRecords, totalHoursWorked })
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

      {/* Simplified Setup Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_80px_rgba(68,172,255,0.26)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] shadow-[0_12px_30px_rgba(254,158,199,0.22)] sm:mr-4 sm:h-12 sm:w-12">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Internship Setup</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">Configure your internship details</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfig(false)}
                  className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F9F6C4] text-slate-600 transition-all duration-200 hover:scale-105 hover:bg-[#FE9EC7]/35 sm:ml-0 sm:h-10 sm:w-10"
                >
                  <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Required Hours
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={requiredHours}
                        onChange={handleRequiredHoursChange}
                        placeholder="e.g. 400"
                        className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 py-4 pl-5 pr-16 text-lg text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 font-medium">hrs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-5 py-4 text-lg text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Estimated End Date
                  </label>
                  <div className="rounded-2xl border-2 border-[#FE9EC7]/35 bg-gradient-to-r from-[#F9F6C4]/70 to-[#FE9EC7]/25 px-5 py-4 text-lg font-medium text-slate-700">
                    {estimatedEndDate ? 
                      new Date(estimatedEndDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'Not calculated yet'
                    }
                  </div>
                </div>
                
                {/* Working Days Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Working Days
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                    {[
                      { key: 'monday', label: 'Mon', fullName: 'Monday' },
                      { key: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
                      { key: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
                      { key: 'thursday', label: 'Thu', fullName: 'Thursday' },
                      { key: 'friday', label: 'Fri', fullName: 'Friday' },
                      { key: 'saturday', label: 'Sat', fullName: 'Saturday' },
                      { key: 'sunday', label: 'Sun', fullName: 'Sunday' }
                    ].map((day) => (
                      <div key={day.key} className="flex flex-col items-center">
                        <label className="flex flex-col items-center cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={workingDays[day.key]}
                            onChange={() => handleWorkingDayChange(day.key)}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 transform group-hover:scale-105 shadow-md ${
                            workingDays[day.key]
                              ? 'bg-gradient-to-br from-[#44ACFF] to-[#FE9EC7] text-slate-900 shadow-lg'
                              : 'bg-[#F9F6C4] text-slate-500 hover:bg-[#89D4FF]/25 group-hover:shadow-lg'
                          }`}>
                            {day.label}
                          </div>
                          <span className={`text-xs mt-2 font-medium transition-colors duration-200 ${
                            workingDays[day.key] ? 'text-[#44ACFF]' : 'text-gray-400'
                          }`}>
                            {day.fullName}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-xl border border-[#89D4FF]/40 bg-[#89D4FF]/10 p-3 text-center text-sm text-slate-600">
                    Select your working days. End date calculation will be based on these days only.
                  </p>
                </div>
                
                {/* Lunch Break Configuration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Lunch Break Settings
                  </label>
                  
                  <div className="space-y-4">
                    {/* Exclude lunch break toggle */}
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={excludeLunchBreak}
                          onChange={handleExcludeLunchBreakChange}
                          className="sr-only"
                        />
                        <div className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                          excludeLunchBreak
                            ? 'bg-gradient-to-r from-[#44ACFF] to-[#FE9EC7]'
                            : 'bg-gray-300 group-hover:bg-gray-400'
                        }`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                            excludeLunchBreak ? 'translate-x-6' : 'translate-x-0'
                          }`}></div>
                        </div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          Exclude lunch break from daily hours
                        </span>
                      </label>
                    </div>
                    
                    {/* Lunch break duration input - only shown when enabled */}
                    {excludeLunchBreak && (
                      <div className="group">
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                          Lunch Break Duration
                        </label>
                        <div className="relative max-w-xs">
                          <select
                            value={lunchBreakDuration}
                            onChange={handleLunchBreakDurationChange}
                            className="block w-full rounded-xl border-2 border-[#89D4FF]/40 py-3 pl-4 pr-12 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                          >
                            <option value="0.25">15 minutes</option>
                            <option value="0.5">30 minutes</option>
                            <option value="0.75">45 minutes</option>
                            <option value="1">1 hour</option>
                            <option value="1.25">1 hour 15 minutes</option>
                            <option value="1.5">1 hour 30 minutes</option>
                            <option value="2">2 hours</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="mt-4 rounded-xl border border-[#FE9EC7]/35 bg-gradient-to-r from-[#F9F6C4]/70 to-[#FE9EC7]/25 p-3 text-center text-sm text-slate-600">
                    {excludeLunchBreak 
                      ? `Daily effective hours: ${8 - lunchBreakDuration}h (8h - ${lunchBreakDuration}h lunch break)`
                      : 'Full 8-hour workday will be counted (no lunch break deduction)'
                    }
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={handleSave}
                  className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 font-medium text-slate-900 shadow-[0_16px_32px_rgba(68,172,255,0.22)] transition-all duration-200 hover:brightness-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Configuration</span>
                </button>
              </div>
              
              {requiredHours && startDate && (
                <div className="mt-4 rounded-xl border border-[#89D4FF]/40 bg-gradient-to-r from-[#89D4FF]/12 to-[#FE9EC7]/12 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-[#44ACFF]">Configuration Summary</h4>
                  <p className="mb-2 text-sm text-slate-700">
                    <span className="font-medium">Duration:</span> Based on {excludeLunchBreak ? 8 - lunchBreakDuration : 8} effective hours per day on selected working days{excludeLunchBreak ? ` (excluding ${lunchBreakDuration}h lunch break)` : ''}. 
                    You'll need approximately <span className="font-semibold">{Math.ceil(requiredHours / (excludeLunchBreak ? 8 - lunchBreakDuration : 8))} working days</span> to complete <span className="font-semibold">{requiredHours} hours</span>.
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#44ACFF]">Working:</span>
                    {Object.entries(workingDays)
                      .filter(([day, isSelected]) => isSelected)
                      .map(([day, isSelected], index, array) => (
                        <span key={day} className="rounded-md bg-white px-2 py-1 text-xs text-[#44ACFF]">
                          {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        
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
        <div className="rounded-xl border border-white/75 bg-white/90 p-4 shadow-[0_20px_50px_rgba(68,172,255,0.16)] sm:rounded-2xl sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Records</h2>
            <button
              onClick={downloadAttendanceReport}
              disabled={isGeneratingReport || timeRecords.length === 0}
              className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#44ACFF] to-[#89D4FF] px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_16px_32px_rgba(68,172,255,0.2)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_20px_36px_rgba(68,172,255,0.24)] disabled:cursor-not-allowed disabled:transform-none disabled:from-gray-300 disabled:to-gray-400 sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>
                {isGeneratingReport ? 'Generating...' : timeRecords.length === 0 ? 'No Records Available' : 'Download Report'}
              </span>
            </button>
          </div>
          
          {timeRecords.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {paginatedRecords.map((record) => (
                <div key={record._id} className="flex items-center justify-between rounded-lg bg-[#F9F6C4]/45 p-3 transition-colors duration-200 hover:bg-[#89D4FF]/12 sm:p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-base font-bold text-[#44ACFF] sm:text-lg">
                        {formatHoursAndMinutes(parseFloat(record.hours))}
                      </div>
                      {record.description && (
                        <div className="text-xs sm:text-sm text-gray-600 truncate max-w-full sm:max-w-xs">
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
                        className={`rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                          isActive
                            ? 'bg-[#44ACFF] text-white shadow-md'
                            : 'border border-[#89D4FF]/35 text-slate-600 hover:bg-[#89D4FF]/12'
                        }`}
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
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={closeAlertModal}
        title={alertModal.title}
        message={alertModal.message}
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
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="order-2 w-full rounded-2xl bg-gray-100 px-6 py-3 text-lg font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 sm:order-1 sm:flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg order-1 sm:order-2"
                >
                  <span>Yes, Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
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
                <p className="text-gray-600 text-lg">Are you sure you want to delete this record? This action cannot be undone.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setRecordToDelete(null)
                  }}
                  className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-200 text-lg order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteRecord}
                  className="w-full sm:flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-lg order-1 sm:order-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home