import React, { useState } from 'react'

// ─── Tiny helpers ────────────────────────────────────────────────────────────
const toISO = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const fromISO = (s) => new Date(s + 'T00:00:00')
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Maps JS getDay() index → workingDays key
const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

// ─── Inline Calendar ─────────────────────────────────────────────────────────
function InlineCalendar({ selectedDates = [], onChange, workingDays = {} }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  // anchor = first click in a pending range selection
  const [anchor, setAnchor] = useState(null)
  const [hovered, setHovered] = useState(null)

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  // Build the range that is currently being previewed (anchor → hovered)
  const previewRange = () => {
    if (!anchor || !hovered) return new Set()
    const a = fromISO(anchor), b = fromISO(hovered)
    const [start, end] = a <= b ? [a, b] : [b, a]
    const set = new Set()
    const cur = new Date(start)
    while (cur <= end) { set.add(toISO(cur)); cur.setDate(cur.getDate() + 1) }
    return set
  }

  // Returns true if the day-of-week (0=Sun..6=Sat) is a working day
  const isWorkingDay = (jsDay) => {
    const key = DAY_KEYS[jsDay]
    // If workingDays isn't configured yet, allow all days
    if (Object.keys(workingDays).length === 0) return true
    return !!workingDays[key]
  }

  const handleDayClick = (iso) => {
    const jsDay = fromISO(iso).getDay()
    if (!isWorkingDay(jsDay)) return // Block non-working days

    if (!anchor) {
      // First click — set anchor. If it was already selected, deselect it.
      if (selectedDates.includes(iso)) {
        onChange(selectedDates.filter(d => d !== iso))
        return
      }
      setAnchor(iso)
      setHovered(iso)
    } else {
      // Second click — commit the range
      const a = fromISO(anchor), b = fromISO(iso)
      const [start, end] = a <= b ? [a, b] : [b, a]
      const toAdd = []
      const cur = new Date(start)
      while (cur <= end) {
        const s = toISO(cur)
        if (!selectedDates.includes(s) && isWorkingDay(cur.getDay())) toAdd.push(s)
        cur.setDate(cur.getDate() + 1)
      }
      onChange([...selectedDates, ...toAdd].sort())
      setAnchor(null)
      setHovered(null)
    }
  }

  const preview = anchor ? previewRange() : new Set()
  const selectedSet = new Set(selectedDates)

  // Cells: leading blanks + day numbers
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="rounded-2xl border-2 border-[#89D4FF]/40 bg-white overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#89D4FF]/20 bg-gradient-to-r from-[#F9F6C4]/40 to-[#89D4FF]/10">
        <button
          type="button"
          onClick={prevMonth}
          className="flex items-center justify-center h-7 w-7 rounded-xl hover:bg-[#89D4FF]/20 transition-colors duration-150"
        >
          <svg className="w-4 h-4 text-[#44ACFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-bold text-gray-700">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="flex items-center justify-center h-7 w-7 rounded-xl hover:bg-[#89D4FF]/20 transition-colors duration-150"
        >
          <svg className="w-4 h-4 text-[#44ACFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div
        className="grid grid-cols-7 px-2 pb-3 gap-y-0.5"
        onMouseLeave={() => anchor && setHovered(anchor)}
      >
        {cells.map((day, idx) => {
          if (!day) return <div key={`blank-${idx}`} />

          const iso = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isSelected = selectedSet.has(iso)
          const inPreview = preview.has(iso)
          const isAnchor = anchor === iso
          const isToday = toISO(today) === iso
          const jsDay = new Date(viewYear, viewMonth, day).getDay()
          const isOff = !isWorkingDay(jsDay)

          let cellClass = 'relative flex items-center justify-center h-8 w-full text-sm rounded-xl transition-all duration-150 font-medium '
          cellClass += isOff ? 'cursor-not-allowed ' : 'cursor-pointer '

          if (isOff) {
            cellClass += 'text-gray-300 line-through '
          } else if (isSelected) {
            cellClass += 'bg-[#44ACFF] text-white shadow-sm hover:bg-[#3299ee] '
          } else if (inPreview) {
            cellClass += 'bg-[#89D4FF]/35 text-[#1a7dc0] '
            if (isAnchor) cellClass += 'ring-2 ring-[#44ACFF] '
          } else if (isToday) {
            cellClass += 'border-2 border-[#44ACFF]/60 text-[#44ACFF] hover:bg-[#89D4FF]/20 '
          } else {
            cellClass += 'text-gray-700 hover:bg-[#89D4FF]/20 '
          }

          return (
            <div
              key={iso}
              className={cellClass}
              onClick={() => handleDayClick(iso)}
              onMouseEnter={() => anchor && !isOff && setHovered(iso)}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#44ACFF]" />
              )}
            </div>
          )
        })}
      </div>

      {/* Hint */}
      <div className="px-3 pb-3">
        {anchor ? (
          <div className="flex items-start gap-2 rounded-xl bg-[#44ACFF]/8 border border-[#44ACFF]/20 px-3 py-2">
            <span className="text-sm mt-0.5">📍</span>
            <p className="text-[11px] text-[#44ACFF] leading-snug">
              Nice! Now click the <strong>same date</strong> to add just that day,
              or pick a <strong>different date</strong> to highlight the whole range.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
            <span className="text-sm mt-0.5">💡</span>
            <p className="text-[11px] text-gray-400 leading-snug">
              Tap any date to select it. For a <strong>single day</strong>, tap the same date twice.
              To pick a <strong>range</strong>, tap a start date then an end date.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
const AddRecordModal = ({
  isOpen,
  onClose,
  editingRecord,
  recordForm,
  setRecordForm,
  onSubmit,
  calculateHoursFromTimes,
  onValidationError,
  excludeLunchBreak = false,
  lunchBreakDuration = 1,
  workingDays = {}
}) => {
  if (!isOpen) return null

  const formatHoursAndMinutes = (decimalHours) => {
    if (decimalHours === 0) return '0h 0m'
    const hours = Math.floor(decimalHours)
    const minutes = Math.round((decimalHours - hours) * 60)
    if (hours === 0) return `${minutes}m`
    if (minutes === 0) return `${hours}h`
    return `${hours}h ${minutes}m`
  }

  const handleSubmit = () => {
    const dates = recordForm.dates || []
    if (!editingRecord && dates.length === 0) {
      onValidationError?.('Please select at least one date.')
      return
    }
    if (editingRecord && !recordForm.date) {
      onValidationError?.('Please fill in the date.')
      return
    }
    if (!recordForm.clockInTime || !recordForm.clockOutTime) {
      onValidationError?.('Please fill in clock in and clock out times.')
      return
    }
    const hours = calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime, recordForm.lunchExcluded)
    if (hours <= 0) {
      onValidationError?.('Clock out time must be after clock in time.')
      return
    }
    onSubmit()
  }

  const handleRemoveDate = (dateToRemove) => {
    const updated = (recordForm.dates || []).filter(d => d !== dateToRemove)
    setRecordForm({ ...recordForm, dates: updated })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm max-h-[95vh] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_70px_rgba(68,172,255,0.22)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div className="p-3 sm:p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-2 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] shadow-[0_12px_30px_rgba(254,158,199,0.22)] sm:mr-4 sm:h-12 sm:w-12">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-2xl font-bold text-gray-900 truncate">
                  {editingRecord ? 'Edit Record' : 'Add Time Record'}
                </h2>
                <p className="mt-0.5 truncate text-xs text-slate-500 sm:mt-1 sm:text-sm">Track your daily work hours</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F9F6C4] transition-all duration-200 hover:scale-105 hover:bg-[#FE9EC7]/35 sm:ml-0 sm:h-10 sm:w-10"
            >
              <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* ── Date section ── */}
            {editingRecord ? (
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Date</label>
                <input
                  type="date"
                  value={recordForm.date}
                  onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                  className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Date(s)</label>
                  {(recordForm.dates || []).length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRecordForm({ ...recordForm, dates: [] })}
                      className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors duration-150"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Custom inline calendar */}
                <InlineCalendar
                  selectedDates={recordForm.dates || []}
                  onChange={(dates) => setRecordForm({ ...recordForm, dates })}
                  workingDays={workingDays}
                />

                {/* Selected date badges */}
                {(recordForm.dates || []).length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2 p-3 bg-[#F9F6C4]/30 rounded-2xl border border-[#89D4FF]/20 max-h-28 overflow-y-auto">
                    {(recordForm.dates || []).map((date) => (
                      <span
                        key={date}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#44ACFF] border border-[#89D4FF] text-sm font-medium shadow-sm"
                      >
                        {fromISO(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(date)}
                          className="p-0.5 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors duration-200"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-400 italic text-center">No dates selected yet.</p>
                )}
              </div>
            )}

            {/* ── Clock in / out ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Clock In Time</label>
                <input
                  type="time"
                  value={recordForm.clockInTime}
                  onChange={(e) => setRecordForm({ ...recordForm, clockInTime: e.target.value })}
                  className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
                />
              </div>
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Clock Out Time</label>
                <input
                  type="time"
                  value={recordForm.clockOutTime}
                  onChange={(e) => setRecordForm({ ...recordForm, clockOutTime: e.target.value })}
                  className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
                />
              </div>
            </div>

            {/* ── Lunch Break Toggle ── */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-[#89D4FF]/40 bg-white px-4 py-3 transition-all duration-200 hover:border-[#89D4FF] sm:px-5 sm:py-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[#F9F6C4]">
                  <svg className="w-4 h-4 text-[#44ACFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m14.95 5.66-.7-.7M6.7 6.7l-.7-.7m12.02.02-.7.7M6.7 17.3l-.7.7" />
                    <circle cx="12" cy="12" r="4" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Lunch Break</p>
                  <p className="text-xs text-gray-400">
                    {recordForm.lunchExcluded
                      ? `${formatHoursAndMinutes(lunchBreakDuration)} deducted from total`
                      : 'Included in total hours'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordForm({ ...recordForm, lunchExcluded: !recordForm.lunchExcluded })}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-4 ${
                  recordForm.lunchExcluded ? 'bg-[#44ACFF] focus:ring-[#89D4FF]/30' : 'bg-gray-200 focus:ring-gray-200/30'
                }`}
                role="switch"
                aria-checked={recordForm.lunchExcluded}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${recordForm.lunchExcluded ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* ── Hours preview ── */}
            {recordForm.clockInTime && recordForm.clockOutTime && (
              <div className="rounded-2xl border border-[#89D4FF]/40 bg-gradient-to-r from-[#F9F6C4]/70 to-[#89D4FF]/18 p-3 sm:p-4">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-[#44ACFF] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-900 sm:text-lg">
                      {!editingRecord && (recordForm.dates || []).length > 1
                        ? `${formatHoursAndMinutes(calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime, recordForm.lunchExcluded))} × ${(recordForm.dates || []).length} days`
                        : `Total time: ${formatHoursAndMinutes(calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime, recordForm.lunchExcluded))}`
                      }
                    </p>
                    {recordForm.lunchExcluded && (
                      <p className="text-xs text-slate-600 mt-1">
                        (Lunch break of {formatHoursAndMinutes(lunchBreakDuration)} excluded)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Description ── */}
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Description <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={recordForm.description}
                onChange={(e) => setRecordForm({ ...recordForm, description: e.target.value })}
                placeholder="Describe what you worked on today..."
                rows="3"
                className="block w-full resize-none rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
              />
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 sm:mt-8">
            <button
              onClick={handleSubmit}
              className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 text-base font-bold text-slate-900 shadow-[0_18px_36px_rgba(68,172,255,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(254,158,199,0.24)] sm:space-x-3 sm:px-8 sm:py-4 sm:text-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>
                {editingRecord
                  ? 'Update Record'
                  : (recordForm.dates || []).length > 1
                    ? `Add ${(recordForm.dates || []).length} Records`
                    : 'Add Record'
                }
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddRecordModal
