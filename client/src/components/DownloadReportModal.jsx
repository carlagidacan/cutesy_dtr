import React, { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const DownloadReportModal = ({ isOpen, onClose, onDownload }) => {
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'
  
  const [filterType, setFilterType] = useState('all') // 'all', 'weekly', 'monthly'
  const [selectedWeek, setSelectedWeek] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  
  if (!isOpen) return null

  const handleDownload = () => {
    onDownload({ filterType, selectedWeek, selectedMonth })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
      <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl transform transition-all animate-in slide-in-from-bottom-4 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-700 text-white' 
          : 'bg-white/95 border-white/80 shadow-[0_30px_70px_rgba(68,172,255,0.18)]'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Report Options
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
           <div>
             <label className={`block mb-3 text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
               What data do you want to include?
             </label>
             <div className="space-y-3">
               <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${filterType === 'all' ? (isDarkMode ? 'border-blue-500 bg-blue-900/30' : 'border-[#44ACFF] bg-[#89D4FF]/10') : (isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')}`}>
                 <input type="radio" value="all" checked={filterType === 'all'} onChange={(e) => setFilterType(e.target.value)} className="w-4 h-4 text-[#44ACFF] border-gray-300 focus:ring-[#44ACFF]" />
                 <span className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>All Records</span>
               </label>
               
               <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${filterType === 'weekly' ? (isDarkMode ? 'border-blue-500 bg-blue-900/30' : 'border-[#44ACFF] bg-[#89D4FF]/10') : (isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')}`}>
                 <input type="radio" value="weekly" checked={filterType === 'weekly'} onChange={(e) => setFilterType(e.target.value)} className="w-4 h-4 text-[#44ACFF] border-gray-300 focus:ring-[#44ACFF]" />
                 <span className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Specific Week</span>
               </label>
               
               {filterType === 'weekly' && (
                 <div className="ml-7 mt-2 animate-in fade-in slide-in-from-top-1">
                   <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} className={`w-full p-2.5 rounded-lg border text-sm font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-[#44ACFF] focus:ring-2 focus:ring-[#44ACFF]/20'} outline-none transition-colors`} />
                 </div>
               )}
               
               <label className={`flex items-center p-3 border rounded-xl cursor-pointer transition-colors ${filterType === 'monthly' ? (isDarkMode ? 'border-blue-500 bg-blue-900/30' : 'border-[#44ACFF] bg-[#89D4FF]/10') : (isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')}`}>
                 <input type="radio" value="monthly" checked={filterType === 'monthly'} onChange={(e) => setFilterType(e.target.value)} className="w-4 h-4 text-[#44ACFF] border-gray-300 focus:ring-[#44ACFF]" />
                 <span className={`ml-3 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Specific Month</span>
               </label>
               
               {filterType === 'monthly' && (
                 <div className="ml-7 mt-2 animate-in fade-in slide-in-from-top-1">
                   <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={`w-full p-2.5 rounded-lg border text-sm font-medium ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-[#44ACFF] focus:ring-2 focus:ring-[#44ACFF]/20'} outline-none transition-colors`} />
                 </div>
               )}
             </div>
           </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={onClose} className={`order-2 sm:order-1 flex-1 py-3 px-4 rounded-xl font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Cancel
          </button>
          <button onClick={handleDownload} disabled={(filterType === 'weekly' && !selectedWeek) || (filterType === 'monthly' && !selectedMonth)} className={`order-1 sm:order-2 flex-1 py-3 px-4 rounded-xl font-semibold text-slate-900 transition-all duration-200 ${((filterType === 'weekly' && !selectedWeek) || (filterType === 'monthly' && !selectedMonth)) ? 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-[#44ACFF] via-[#89D4FF] to-[#FE9EC7] hover:scale-[1.02] shadow-[0_10px_20px_rgba(68,172,255,0.2)]'}`}>
            Download report
          </button>
        </div>
      </div>
    </div>
  )
}

export default DownloadReportModal
