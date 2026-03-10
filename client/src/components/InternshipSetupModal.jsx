import React, { useState } from 'react'

const InternshipSetupModal = ({
    isOpen,
    onClose,
    onSave,
    // Basic Info
    requiredHours,
    onRequiredHoursChange,
    startDate,
    onStartDateChange,
    estimatedEndDate,
    // Working Days
    workingDays,
    onWorkingDayChange,
    // Lunch Break
    excludeLunchBreak,
    onExcludeLunchBreakChange,
    lunchBreakDuration,
    onLunchBreakDurationChange,
    // Holidays
    holidays,
    onHolidayChange,
    getMonthsInInternshipPeriod,
    // Leave & Absent
    leaveAndAbsentDates,
    newLeaveDate,
    onNewLeaveDateChange,
    onAddLeaveDate,
    onRemoveLeaveDate,
}) => {
    const [activeTab, setActiveTab] = useState('basic')

    if (!isOpen) return null

    const philippineHolidayCounts = {
        january: 1, february: 1, march: 0, april: 4, may: 1, june: 1,
        july: 0, august: 2, september: 0, october: 0, november: 3, december: 4
    }

    const monthDataMap = {
        january: { label: 'January', holidays: ["New Year's Day"] },
        february: { label: 'February', holidays: ['Chinese New Year'] },
        march: { label: 'March', holidays: [] },
        april: { label: 'April', holidays: ['Maundy Thursday', 'Good Friday', 'Black Saturday', 'Araw ng Kagitingan'] },
        may: { label: 'May', holidays: ['Labor Day'] },
        june: { label: 'June', holidays: ['Independence Day'] },
        july: { label: 'July', holidays: [] },
        august: { label: 'August', holidays: ['Ninoy Aquino Day', 'National Heroes Day'] },
        september: { label: 'September', holidays: [] },
        october: { label: 'October', holidays: [] },
        november: { label: 'November', holidays: ["All Saints' Day", "All Souls' Day", 'Bonifacio Day'] },
        december: { label: 'December', holidays: ['Immaculate Conception', 'Christmas Eve', 'Christmas Day', "New Year's Eve"] },
    }

    const monthsInPeriod = getMonthsInInternshipPeriod()

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/80 bg-white/95 shadow-[0_30px_80px_rgba(68,172,255,0.26)] transform transition-all duration-300 scale-100 animate-in slide-in-from-bottom-4">
                <div className="p-6 sm:p-8">

                    {/* Header */}
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
                            onClick={onClose}
                            className="ml-2 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#F9F6C4] text-slate-600 transition-all duration-200 hover:scale-105 hover:bg-[#FE9EC7]/35 sm:ml-0 sm:h-10 sm:w-10"
                        >
                            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Shared Estimated End Date Display */}
                    <div className="mb-6 rounded-2xl border-2 border-[#FE9EC7]/30 bg-gradient-to-r from-[#F9F6C4]/40 to-[#FE9EC7]/15 p-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700">Estimated End Date</h3>
                            <p className="text-xs text-amber-600/80 italic mt-0.5">
                                * Save configuration to apply changes.
                            </p>
                        </div>
                        <div className="mt-2 sm:mt-0 text-lg sm:text-xl font-bold text-[#44ACFF]">
                            {estimatedEndDate
                                ? new Date(estimatedEndDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                                : 'Not calculated yet'
                            }
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex space-x-2 border-b-2 border-slate-100 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'basic', label: 'Basic Info' },
                            { id: 'schedule', label: 'Schedule' },
                            { id: 'holidays', label: 'Leaves & Holidays' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 px-4 py-2 font-semibold text-sm sm:text-base rounded-t-xl transition-all duration-200 border-b-4 ${activeTab === tab.id ? 'border-[#44ACFF] text-[#44ACFF] bg-[#89D4FF]/10' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6 min-h-[160px] sm:min-h-[200px]">
                        {/* ── Tab: Basic Info ─────────────────────────────────── */}
                        {activeTab === 'basic' && (
                            <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Required Hours</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={requiredHours}
                                            onChange={onRequiredHoursChange}
                                            placeholder="e.g. 400"
                                            className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 py-4 pl-5 pr-16 text-lg text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                            <span className="text-gray-400 font-medium">hrs</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={onStartDateChange}
                                        className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-5 py-4 text-lg text-gray-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                                    />
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Schedule ───────────────────────────────────── */}
                        {activeTab === 'schedule' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">Working Days</label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(dayKey => {
                                            const labels = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
                                            return (
                                                <div key={dayKey} className="flex flex-col items-center">
                                                    <label className="flex flex-col items-center cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={workingDays[dayKey]}
                                                            onChange={() => onWorkingDayChange(dayKey)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 transform group-hover:scale-105 shadow-md ${workingDays[dayKey] ? 'bg-gradient-to-br from-[#44ACFF] to-[#FE9EC7] text-slate-900 shadow-lg' : 'bg-[#F9F6C4] text-slate-500 hover:bg-[#89D4FF]/25 group-hover:shadow-lg'}`}>
                                                            {labels[dayKey]}
                                                        </div>
                                                        <span className={`text-xs mt-2 font-medium transition-colors duration-200 ${workingDays[dayKey] ? 'text-[#44ACFF]' : 'text-gray-400'}`}>
                                                            {dayKey.charAt(0).toUpperCase() + dayKey.slice(1)}
                                                        </span>
                                                    </label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <p className="mt-4 rounded-xl border border-[#89D4FF]/40 bg-[#89D4FF]/10 p-3 text-center text-sm text-slate-600">
                                        Select your working days. End date calculation will be based on these days only.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">Lunch Break Settings</label>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <label className="flex items-center cursor-pointer group">
                                                <input type="checkbox" checked={excludeLunchBreak} onChange={onExcludeLunchBreakChange} className="sr-only" />
                                                <div className={`relative w-12 h-6 rounded-full transition-all duration-200 ${excludeLunchBreak ? 'bg-gradient-to-r from-[#44ACFF] to-[#FE9EC7]' : 'bg-gray-300 group-hover:bg-gray-400'}`}>
                                                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${excludeLunchBreak ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className="ml-3 text-sm font-medium text-gray-700">Exclude lunch break from daily hours</span>
                                            </label>
                                        </div>
                                        {excludeLunchBreak && (
                                            <div className="group">
                                                <label className="block text-xs font-medium text-gray-600 mb-2">Lunch Break Duration</label>
                                                <div className="relative max-w-xs">
                                                    <select
                                                        value={lunchBreakDuration}
                                                        onChange={onLunchBreakDurationChange}
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
                                            ? `Daily effective hours: ${9 - lunchBreakDuration}h (9h - ${lunchBreakDuration}h lunch break)`
                                            : 'Full 9-hour workday will be counted (no lunch break deduction)'
                                        }
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Tab: Leaves & Holidays ──────────────────────────── */}
                        {activeTab === 'holidays' && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                                {/* Leave & Absent Dates */}
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Leave &amp; Absent Dates</label>
                                    <div className="flex flex-col space-y-3">
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                            <input
                                                type="date"
                                                value={newLeaveDate}
                                                onChange={onNewLeaveDateChange}
                                                className="block flex-1 rounded-2xl border-2 border-[#89D4FF]/40 px-5 py-3 text-lg text-gray-900 transition-all duration-200 focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30"
                                            />
                                            <button
                                                type="button"
                                                onClick={onAddLeaveDate}
                                                disabled={!newLeaveDate || leaveAndAbsentDates.includes(newLeaveDate)}
                                                className="flex h-[56px] px-6 items-center justify-center rounded-2xl border-2 border-transparent bg-gradient-to-r from-[#44ACFF] to-[#89D4FF] text-white font-bold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                            >
                                                Add Date
                                            </button>
                                        </div>
                                        {leaveAndAbsentDates.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 p-4 bg-[#F9F6C4]/30 rounded-2xl border border-[#89D4FF]/20">
                                                {leaveAndAbsentDates.sort().map(date => (
                                                    <span
                                                        key={date}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#44ACFF] border border-[#89D4FF] text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                                                    >
                                                        {new Date(date).toLocaleDateString()}
                                                        <button type="button" onClick={() => onRemoveLeaveDate(date)} className="p-0.5 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors duration-200">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-500 italic p-2 text-center">No absent dates added yet.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Philippine Holidays */}
                                <div className="pt-6 border-t border-slate-200">
                                    <label className="block text-sm font-semibold text-gray-700 mb-4">Philippine Holidays During Internship</label>
                                    {monthsInPeriod.length === 0 ? (
                                        <div className="text-center py-8 rounded-xl border border-[#89D4FF]/40 bg-[#89D4FF]/10">
                                            <p className="text-sm text-slate-600 mb-2">Complete your start date and required hours first</p>
                                            <p className="text-xs text-slate-500">Holiday configuration will appear once your internship period is defined</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-4">
                                                <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => { const u = { ...holidays }; monthsInPeriod.forEach(m => { u[m.key] = philippineHolidayCounts[m.key] }); onHolidayChange(u) }} className="px-3 py-1 text-xs bg-[#89D4FF]/20 text-[#44ACFF] rounded-full hover:bg-[#89D4FF]/30 transition-colors duration-200">Enable All Philippines Holidays</button>
                                                    <button type="button" onClick={() => { const u = { ...holidays }; monthsInPeriod.forEach(m => { u[m.key] = 0 }); onHolidayChange(u) }} className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-full hover:bg-gray-300 transition-colors duration-200">Disable All</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {monthsInPeriod.map(month => {
                                                    const data = monthDataMap[month.key]
                                                    const philippineCount = philippineHolidayCounts[month.key]
                                                    const isEnabled = holidays[month.key] > 0
                                                    return (
                                                        <div key={month.key} className="group">
                                                            <div
                                                                className={`rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${isEnabled ? 'border-[#44ACFF] bg-gradient-to-br from-[#44ACFF]/10 to-[#FE9EC7]/10 shadow-md' : 'border-[#89D4FF]/30 bg-white hover:border-[#89D4FF] hover:shadow-sm'}`}
                                                                onClick={() => onHolidayChange(month.key)}
                                                            >
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <span className="text-2xl">{data.icon}</span>
                                                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-200 ${isEnabled ? 'bg-[#44ACFF] text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                        {holidays[month.key]}
                                                                    </div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-semibold text-gray-800 mb-1">{data.label}</p>
                                                                    <p className={`text-xs transition-colors duration-200 ${isEnabled ? 'text-[#44ACFF] font-medium' : 'text-gray-400'}`}>
                                                                        {philippineCount === 0 ? 'No holidays' : philippineCount === 1 ? '1 holiday' : `${philippineCount} holidays`}
                                                                    </p>
                                                                    {philippineCount > 0 && (
                                                                        <div className="mt-2 text-xs text-gray-500">
                                                                            {data.holidays.slice(0, 2).map((h, i) => <div key={i}>{h}</div>)}
                                                                            {data.holidays.length > 2 && <div>+{data.holidays.length - 2} more</div>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="mt-4 rounded-xl border border-[#89D4FF]/40 bg-[#89D4FF]/10 p-3">
                                                <div className="text-sm text-slate-600 text-center">
                                                    <span className="font-medium">Total holidays during internship:</span>{' '}
                                                    <span className="font-bold text-[#44ACFF]">
                                                        {Object.entries(holidays).filter(([m, c]) => monthsInPeriod.some(mp => mp.key === m) && c > 0).reduce((s, [, c]) => s + c, 0)} days
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-center text-xs text-slate-500">
                                                Only months within your internship period ({startDate ? new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'start'} - {estimatedEndDate ? new Date(estimatedEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'end'}) are shown.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-100">
                        <button
                            onClick={onSave}
                            className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 font-medium text-slate-900 shadow-[0_16px_32px_rgba(68,172,255,0.22)] transition-all duration-200 hover:brightness-105"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Save Configuration</span>
                        </button>
                    </div>

                    {/* Configuration Summary */}
                    {requiredHours && startDate && (
                        <div className="mt-4 rounded-xl border border-[#89D4FF]/40 bg-gradient-to-r from-[#89D4FF]/12 to-[#FE9EC7]/12 p-4">
                            <h4 className="mb-2 text-sm font-semibold text-[#44ACFF]">Configuration Summary</h4>
                            <p className="mb-2 text-sm text-slate-700">
                                <span className="font-medium">Duration:</span> Based on {excludeLunchBreak ? 9 - lunchBreakDuration : 9} effective hours per day on selected working days{excludeLunchBreak ? ` (9h work - ${lunchBreakDuration}h lunch break)` : ''}.
                                You'll need approximately <span className="font-semibold">{Math.ceil(requiredHours / (excludeLunchBreak ? 9 - lunchBreakDuration : 9))} working days</span> to complete <span className="font-semibold">{requiredHours} hours</span>.
                                <br />
                                <span className="font-medium">Holidays:</span>{' '}
                                {Object.entries(holidays).filter(([m, c]) => c > 0 && monthsInPeriod.some(mp => mp.key === m)).reduce((s, [, c]) => s + c, 0)} Philippine holiday
                                {Object.entries(holidays).filter(([m, c]) => c > 0 && monthsInPeriod.some(mp => mp.key === m)).reduce((s, [, c]) => s + c, 0) === 1 ? '' : 's'} during internship period.
                            </p>
                            <div className="flex flex-wrap gap-1">
                                <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-[#44ACFF]">Working:</span>
                                {Object.entries(workingDays).filter(([, v]) => v).map(([day]) => (
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
    )
}

export default InternshipSetupModal
