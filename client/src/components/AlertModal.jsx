import React from 'react'

const AlertModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title">
      <div className="flex min-h-screen items-center justify-center px-4 py-8 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative inline-block w-full max-w-md overflow-hidden rounded-3xl bg-white px-6 py-6 text-left align-middle shadow-2xl transition-all">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
          </div>

          <div className="text-center">
            <h3 id="alert-modal-title" className="text-xl font-bold text-gray-900">
              {title}
            </h3>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {message}
            </p>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertModal