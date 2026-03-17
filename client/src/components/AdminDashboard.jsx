import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SuccessModal from './SuccessModal'
import AlertModal from './AlertModal'
import { useTheme } from '../contexts/ThemeContext'

const AdminDashboard = () => {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isResetting, setIsResetting] = useState(false)
    const [resetError, setResetError] = useState('')

    const [successModal, setSuccessModal] = useState({ isOpen: false, title: '', message: '' })
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' })

    const navigate = useNavigate()
    const { theme, setTheme } = useTheme()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token')
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            }
            const response = await axios.get('/api/admin/users', config)
            setUsers(response.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching users:', error)
            setAlertModal({
                isOpen: true,
                title: 'Error',
                message: 'Failed to load users. You might not have admin privileges.'
            })
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setTheme('light')
        navigate('/login')
    }

    const openResetModal = (user) => {
        setSelectedUser(user)
        setNewPassword('')
        setConfirmPassword('')
        setResetError('')
        setShowPasswordModal(true)
    }

    const handleResetSubmit = async (e) => {
        e.preventDefault()
        setResetError('')

        if (newPassword.length < 6) {
            setResetError('Password must be at least 6 characters long')
            return
        }

        if (newPassword !== confirmPassword) {
            setResetError('Passwords do not match')
            return
        }

        setIsResetting(true)
        try {
            const token = localStorage.getItem('token')
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            }

            await axios.put(`/api/admin/users/${selectedUser._id}/reset-password`, { newPassword }, config)

            setShowPasswordModal(false)
            setSuccessModal({
                isOpen: true,
                title: 'Password Reset Successful',
                message: `The password for ${selectedUser.name} has been reset.`
            })
        } catch (error) {
            console.error('Error resetting password:', error)
            setResetError(error.response?.data?.message || 'Failed to reset password')
        } finally {
            setIsResetting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#44ACFF]"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#44ACFF] to-[#FE9EC7] flex items-center justify-center text-white font-bold mr-2">
                                    A
                                </div>
                                <span className="font-bold text-xl text-gray-900">Admin Dashboard</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow rounded-2xl overflow-hidden border border-gray-200">
                        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Registered Users</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage users and reset passwords if they are locked out.
                                </p>
                            </div>
                            <div className="text-sm text-gray-500 font-medium">
                                Total Users: <span className="text-[#44ACFF] font-bold">{users.length}</span>
                            </div>
                        </div>

                        {users.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
                                <p className="mt-1 text-sm text-gray-500">No regular users are registered in the system yet.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <li key={user._id} className="hover:bg-gray-50 transition-colors">
                                        <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                            <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                                                <div className="flex-shrink-0 mb-2 sm:mb-0 mr-4">
                                                    <div className="h-10 w-10 rounded-full bg-[#89D4FF]/20 flex items-center justify-center">
                                                        <span className="text-[#44ACFF] font-medium text-lg">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-[#44ACFF] truncate">{user.name}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[140px] sm:max-w-full">{user.email}</p>
                                                </div>
                                                <div className="mt-1 sm:mt-0 sm:ml-6 min-w-0 flex-1 sm:flex-none hidden sm:block">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        {user.company}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-3 sm:ml-4 flex-shrink-0">
                                                <button
                                                    onClick={() => openResetModal(user)}
                                                    className="inline-flex items-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 border border-[#44ACFF] text-xs sm:text-sm font-medium rounded-lg text-[#44ACFF] bg-transparent hover:bg-[#44ACFF]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#44ACFF] transition-colors"
                                                >
                                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:-ml-0.5 sm:mr-1.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                    </svg>
                                                    <span className="hidden sm:inline">Reset Password</span>
                                                    <span className="sm:hidden">Reset</span>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>

            {/* Reset Password Modal */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            You are resetting the password for <span className="font-semibold text-gray-700">{selectedUser.name}</span> ({selectedUser.email}).
                        </p>

                        <form onSubmit={handleResetSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#44ACFF]"
                                        required
                                        minLength={6}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#44ACFF]"
                                        required
                                        minLength={6}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                {resetError && (
                                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                                        {resetError}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#44ACFF]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-slate-900 bg-[#F9F6C4] hover:bg-[#F9F6C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#44ACFF] disabled:opacity-50"
                                    style={{ background: 'linear-gradient(to right, #44ACFF, #FE9EC7)' }}
                                >
                                    {isResetting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            <SuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
                theme={theme}
            />

            {/* Alert Modal */}
            <AlertModal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
                title={alertModal.title}
                message={alertModal.message}
                theme={theme}
            />
        </div>
    )
}

export default AdminDashboard
