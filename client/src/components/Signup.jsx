import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuccessModal from './SuccessModal'

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const navigate = useNavigate()

  const { name, company, email, password } = formData

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Basic validation
    if (!company.trim()) {
      setError('Internship company is required')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await axios.post('/api/auth/signup', formData)

      localStorage.removeItem('requiredHours')
      localStorage.removeItem('startDate')
      localStorage.removeItem('workingDays')
      localStorage.removeItem('internshipConfigSaved')
      localStorage.setItem('openInternshipSetupOnArrival', 'true')
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token)
      
      // Store user info and show success modal
      setUserInfo(response.data.user)
      setShowSuccessModal(true)
    } catch (error) {
      setError(error.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowSuccessModal(false)
    // Redirect to dashboard after modal closes
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#89D4FF] py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-6 sm:max-w-md sm:space-y-8">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(254,158,199,0.24)] backdrop-blur-sm sm:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] shadow-[0_12px_30px_rgba(254,158,199,0.28)]">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-center mb-4">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#FE9EC7]">
                OJT Daily Time Record
              </p>
            </div>
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
              Create Account
            </h2>
            <p className="mt-3 text-center text-xs text-slate-500 sm:mt-4 sm:text-sm">
              Create your account to get started
            </p>
          </div>
        <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="group">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="block w-full rounded-xl border border-[#FE9EC7]/45 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#FE9EC7] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#44ACFF] sm:text-base"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Internship Company
              </label>
              <div className="relative">
                <input
                  id="company"
                  name="company"
                  type="text"
                  autoComplete="organization"
                  required
                  className="block w-full rounded-xl border border-[#FE9EC7]/45 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#FE9EC7] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#44ACFF] sm:text-base"
                  placeholder="Enter your internship company"
                  value={company}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M5 21V7l8-4 6 4v14M9 9h.01M9 12h.01M9 15h.01M13 9h.01M13 12h.01M13 15h.01M17 9h.01M17 12h.01M17 15h.01" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-[#FE9EC7]/45 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#FE9EC7] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#44ACFF] sm:text-base"
                  placeholder="Enter your Gmail address"
                  value={email}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border border-[#FE9EC7]/45 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 group-hover:border-[#FE9EC7] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#44ACFF] sm:text-base"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={handleChange}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">Minimum 6 characters required</p>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-red-800 font-medium">{error}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl border border-[#FE9EC7]/30 bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_32px_rgba(254,158,199,0.28)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_20px_38px_rgba(68,172,255,0.24)] focus:outline-none focus:ring-2 focus:ring-[#44ACFF] focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base lg:py-4 lg:text-lg"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#FE9EC7] transition-colors duration-200 hover:text-[#44ACFF]">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={handleModalClose}
        title="Sign Up Successful!"
        message="Your account has been created successfully."
        userName={userInfo?.name}
      />
    </div>
  )
}

export default Signup