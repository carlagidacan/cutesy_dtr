import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useTheme } from '../contexts/ThemeContext'
import { generateWeeklyAccomplishmentReport } from '../utils/weeklyReportGenerator'

const WeeklyReportModal = ({ isOpen, onClose, timeRecords, user, internshipConfig }) => {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  // Convert a date to ISO week format "YYYY-WNN"
  const toISOWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay() || 7
    d.setDate(d.getDate() + 4 - day)
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }

  const recordWeeks = timeRecords.map(r => toISOWeek(r.date)).sort()
  const minWeek = recordWeeks[0] || ''
  const maxWeek = recordWeeks[recordWeeks.length - 1] || ''
  const weeksWithRecords = new Set(recordWeeks)

  const [selectedWeek, setSelectedWeek] = useState('')
  const [weekRecords, setWeekRecords] = useState([])
  const [tasksDraft, setTasksDraft] = useState('')
  const [reflectionDraft, setReflectionDraft] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Handle selected week change to auto-aggregate tasks
  useEffect(() => {
    if (selectedWeek && timeRecords.length > 0) {
      const [y, w] = selectedWeek.split('-W')
      const year = parseInt(y)
      const week = parseInt(w)

      // Get first day of ISO week
      const firstDayOfYear = new Date(year, 0, 1)
      const daysOffset = (week - 1) * 7
      const firstDayOfWeek = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay() + 1 + daysOffset))
      
      const lastDayOfWeek = new Date(firstDayOfWeek)
      lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6)
      lastDayOfWeek.setHours(23, 59, 59, 999)

      // Filter records
      const weekRecords = timeRecords.filter(record => {
        const recordDate = new Date(record.date)
        return recordDate >= firstDayOfWeek && recordDate <= lastDayOfWeek
      })

      // Sort chronological
      weekRecords.sort((a, b) => new Date(a.date) - new Date(b.date))

      setWeekRecords(weekRecords)

      // Concatenate descriptions
      const combinedTasks = weekRecords
        .map(r => {
          const dateStr = new Date(r.date).toLocaleDateString()
          return `${dateStr}: ${r.description || 'Logged hours'}`
        })
        .join('\n')

      setTasksDraft(combinedTasks)
    } else {
      setTasksDraft('')
      setWeekRecords([])
    }
    setReflectionDraft('') // Reset reflection on week change
    setErrorMsg('')
  }, [selectedWeek, timeRecords])

  const handleGenerateReflection = async () => {
    if (!tasksDraft || tasksDraft.trim() === '') {
      setErrorMsg('Cannot generate reflection without task descriptions.')
      return
    }

    try {
      setIsGeneratingAI(true)
      setErrorMsg('')
      const token = localStorage.getItem('token')
      
      const response = await axios.post('/api/reports/generate-reflection', {
        tasks: tasksDraft
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.tasksSummary) {
        setTasksDraft(response.data.tasksSummary)
      }
      setReflectionDraft(response.data.reflection)
    } catch (error) {
      console.error(error)
      setErrorMsg(error.response?.data?.message || 'Failed to generate reflection with AI. Please make sure GEMINI_API_KEY is configured in your server.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleDownload = () => {
    if (!selectedWeek) {
      setErrorMsg('Please select a week first.')
      return
    }

    generateWeeklyAccomplishmentReport({
      user,
      internshipConfig,
      selectedWeek,
      weekRecords,
      tasksAccomplishments: tasksDraft,
      learningsDifficulties: reflectionDraft
    })
    
    // onClose() // Optionally completely dismiss modal or leave it open
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      <div className={`relative w-full max-w-4xl overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl transition-all max-h-[90vh] flex flex-col ${isDarkMode ? 'border border-cyan-500/30 bg-[#121212]' : 'bg-white'}`}>
        
        {/* Header */}
        <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b flex-shrink-0 ${isDarkMode ? 'border-cyan-500/30 bg-black/40' : 'border-[#89D4FF]/30 bg-gradient-to-r from-[#F9F6C4]/30 to-[#89D4FF]/10'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-cyan-50' : 'text-slate-900'} pr-2`}>
              Weekly Accomplishment Report
            </h3>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${
                isDarkMode 
                  ? 'text-cyan-300 hover:bg-cyan-500/20' 
                  : 'text-slate-500 hover:bg-[#F9F6C4]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {errorMsg && (
            <div className={`mb-4 rounded-xl border p-3 text-sm ${isDarkMode ? 'border-red-500/50 bg-red-950/50 text-red-200' : 'border-red-200 bg-red-50 text-red-600'}`}>
              {errorMsg}
            </div>
          )}

          <div className="mb-6">
            <label className={`block mb-2 text-sm font-semibold ${isDarkMode ? 'text-cyan-100' : 'text-slate-700'}`}>
              Select Week
            </label>
            <input 
              type="week" 
              value={selectedWeek}
              min={minWeek}
              max={maxWeek}
              onChange={(e) => {
                const val = e.target.value
                if (val && !weeksWithRecords.has(val)) {
                  setErrorMsg('No records found for the selected week. Please choose a week with logged entries.')
                  return
                }
                setErrorMsg('')
                setSelectedWeek(val)
              }}
              className={`w-full rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? 'bg-black/50 border-cyan-500/30 text-cyan-50 placeholder-cyan-500/50 focus:border-cyan-400 focus:ring-cyan-400/20'
                  : 'bg-white border-[#89D4FF]/50 text-slate-900 focus:border-[#44ACFF] focus:ring-[#89D4FF]/30'
              }`}
            />
          </div>

          <div className="mb-6">
            <label className={`block mb-2 text-sm font-semibold ${isDarkMode ? 'text-cyan-100' : 'text-slate-700'}`}>
              Tasks, Activities, & Accomplishments
            </label>
            <textarea 
              value={tasksDraft}
              onChange={(e) => setTasksDraft(e.target.value)}
              rows="5"
              placeholder="Select a week to auto-populate from your records, or type manually..."
              className={`w-full rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? 'bg-black/50 border-cyan-500/30 text-cyan-50 focus:border-cyan-400 focus:ring-cyan-400/20'
                  : 'bg-white border-[#89D4FF]/50 text-slate-900 focus:border-[#44ACFF] focus:ring-[#89D4FF]/30'
              }`}
            ></textarea>
          </div>

          <div className="mb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-2">
              <label className={`block text-sm font-semibold ${isDarkMode ? 'text-cyan-100' : 'text-slate-700'}`}>
                Learnings, Applications, & Difficulties
              </label>
              <button 
                onClick={handleGenerateReflection}
                disabled={isGeneratingAI || !selectedWeek || !tasksDraft}
                className={`self-start sm:self-auto py-1.5 px-4 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center gap-2 ${
                  isDarkMode 
                    ? 'bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-cyan-500/50 text-cyan-100 hover:bg-cyan-900/60 disabled:opacity-50' 
                    : 'bg-gradient-to-r from-[#FE9EC7]/20 to-[#89D4FF]/20 border border-[#89D4FF]/70 text-[#44ACFF] hover:bg-[#89D4FF]/30 disabled:opacity-50'
                }`}
              >
                {isGeneratingAI ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Auto-Generate
                  </>
                )}
              </button>
            </div>
            
            <textarea 
              value={reflectionDraft}
              onChange={(e) => setReflectionDraft(e.target.value)}
              rows="6"
              placeholder="What new skills did you learn? How did you apply school knowledge? Any difficulties encountered? AI can draft this for you!"
              className={`w-full rounded-xl px-4 py-3 border focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? 'bg-black/50 border-cyan-500/30 text-cyan-50 focus:border-cyan-400 focus:ring-cyan-400/20'
                  : 'bg-white border-[#89D4FF]/50 text-slate-900 focus:border-[#44ACFF] focus:ring-[#89D4FF]/30'
              }`}
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-4 sm:px-6 py-4 border-t flex-shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl sm:rounded-b-3xl ${isDarkMode ? 'border-cyan-500/30 bg-black/40' : 'border-[#89D4FF]/30 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDarkMode
                ? 'border border-cyan-500/30 text-cyan-100 hover:bg-cyan-950/50'
                : 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!selectedWeek || !tasksDraft}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
              isDarkMode
                ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 text-black hover:scale-105 disabled:opacity-50 disabled:hover:scale-100'
                : 'bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] text-slate-900 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100'
            }`}
          >
            Download PDF Report
          </button>
        </div>

      </div>
    </div>
  )
}

export default WeeklyReportModal
