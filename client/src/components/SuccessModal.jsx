import React, { useEffect } from 'react'

const SuccessModal = ({ isOpen, onClose, title, message, userName = '', theme = 'light' }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto-close modal after 3 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isDarkMode = theme === 'dark'

  const modalClasses = isDarkMode
    ? {
        panel: 'inline-block align-bottom rounded-2xl border border-cyan-500/45 bg-[#121212] px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6',
        iconWrap: 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-950/60',
        icon: 'h-8 w-8 text-cyan-300',
        title: 'text-lg leading-6 font-bold text-cyan-50 mb-2',
        message: 'text-sm text-cyan-100/80',
        user: 'mt-1 block font-medium text-cyan-200',
        button: 'w-full inline-flex justify-center rounded-xl border border-cyan-400/40 shadow-sm px-4 py-2 bg-cyan-700 text-base font-medium text-cyan-50 hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400 focus:ring-offset-black transition-colors duration-200 sm:text-sm'
      }
    : {
        panel: 'inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6',
        iconWrap: 'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100',
        icon: 'h-8 w-8 text-green-600',
        title: 'text-lg leading-6 font-bold text-gray-900 mb-2',
        message: 'text-sm text-gray-500',
        user: 'mt-1 block font-medium text-gray-700',
        button: 'w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 sm:text-sm'
      }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className={modalClasses.panel}>
          <div>
            {/* Success icon */}
            <div className={modalClasses.iconWrap}>
              <svg className={modalClasses.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="text-center">
              <h3 className={modalClasses.title} id="modal-title">
                {title}
              </h3>
              <div className="mt-2">
                <p className={modalClasses.message}>
                  {message}
                  {userName && (
                    <span className={modalClasses.user}>
                      Welcome, {userName}!
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="mt-5">
            <button
              type="button"
              className={modalClasses.button}
              onClick={onClose}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessModal