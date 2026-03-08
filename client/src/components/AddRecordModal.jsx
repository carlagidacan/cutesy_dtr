import React from 'react'

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
  lunchBreakDuration = 1
}) => {
  if (!isOpen) return null

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

  const handleClose = () => {
    onClose()
  }

  const handleSubmit = () => {
    if (!recordForm.date || !recordForm.clockInTime || !recordForm.clockOutTime) {
      onValidationError?.('Please fill in date, clock in time, and clock out time.')
      return
    }
    
    const hours = calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime)
    if (hours <= 0) {
      onValidationError?.('Clock out time must be after clock in time.')
      return
    }
    
    onSubmit()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm max-h-[95vh] overflow-y-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_70px_rgba(68,172,255,0.22)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4 sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div className="p-3 sm:p-6 md:p-8">
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
              onClick={handleClose}
              className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F9F6C4] transition-all duration-200 hover:scale-105 hover:bg-[#FE9EC7]/35 sm:ml-0 sm:h-10 sm:w-10"
            >
              <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="group">
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                Date
              </label>
              <input
                type="date"
                value={recordForm.date}
                onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Clock In Time
                </label>
                <input
                  type="time"
                  value={recordForm.clockInTime}
                  onChange={(e) => setRecordForm({ ...recordForm, clockInTime: e.target.value })}
                  className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
                />
              </div>
              
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                  Clock Out Time
                </label>
                <input
                  type="time"
                  value={recordForm.clockOutTime}
                  onChange={(e) => setRecordForm({ ...recordForm, clockOutTime: e.target.value })}
                  className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3 text-base text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4 sm:text-lg"
                />
              </div>
            </div>
            
            {recordForm.clockInTime && recordForm.clockOutTime && (
              <div className="rounded-2xl border border-[#89D4FF]/40 bg-gradient-to-r from-[#F9F6C4]/70 to-[#89D4FF]/18 p-3 sm:p-4">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 text-[#44ACFF] sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-base font-bold text-slate-900 sm:text-lg">
                      Total time: {formatHoursAndMinutes(calculateHoursFromTimes(recordForm.clockInTime, recordForm.clockOutTime))}
                    </p>
                    {excludeLunchBreak && (
                      <p className="text-xs text-slate-600 mt-1">
                        (Lunch break of {formatHoursAndMinutes(lunchBreakDuration)} excluded)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
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
          
          <div className="mt-6 sm:mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button
              onClick={handleSubmit}
              className="order-2 flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 text-base font-bold text-slate-900 shadow-[0_18px_36px_rgba(68,172,255,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(254,158,199,0.24)] sm:order-1 sm:flex-1 sm:space-x-3 sm:px-8 sm:py-4 sm:text-lg"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{editingRecord ? 'Update Record' : 'Add Record'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddRecordModal
