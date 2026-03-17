import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuccessModal from './SuccessModal'
import AlertModal from './AlertModal'
import { useTheme } from '../contexts/ThemeContext'

const createEmptyForm = () => ({
	name: '',
	company: '',
	email: '',
	password: ''
})

const Profile = () => {
	const [formData, setFormData] = useState(createEmptyForm())
	const [userInfo, setUserInfo] = useState(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '' })
	const navigate = useNavigate()
	const { theme, setTheme } = useTheme()

	useEffect(() => {
		const token = localStorage.getItem('token')

		if (!token) {
			navigate('/login')
			return
		}

		fetchProfile()
	}, [navigate])

	const fetchProfile = async () => {
		try {
			setIsLoading(true)
			const token = localStorage.getItem('token')
			const response = await axios.get('/api/auth/profile', {
				headers: { Authorization: `Bearer ${token}` }
			})

			const profile = response.data
			setUserInfo(profile)
			setFormData({
				name: profile.name || '',
				company: profile.company || '',
				email: profile.email || '',
				password: ''
			})
			setTheme(profile.theme)
		} catch (error) {
			if (error.response?.status === 401) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			setAlertModal({
				isOpen: true,
				title: 'Unable to Load Profile',
				message: error.response?.data?.message || 'There was a problem loading your profile.'
			})
		} finally {
			setIsLoading(false)
		}
	}

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormData((current) => ({ ...current, [name]: value }))
	}

	const handleSave = async (event) => {
		event.preventDefault()

		if (!formData.name.trim() || !formData.company.trim() || !formData.email.trim()) {
			setAlertModal({
				isOpen: true,
				title: 'Missing Information',
				message: 'Full name, company, and email are required.'
			})
			return
		}

		if (formData.password && formData.password.length < 6) {
			setAlertModal({
				isOpen: true,
				title: 'Invalid Password',
				message: 'New password must be at least 6 characters long.'
			})
			return
		}

		try {
			setIsSaving(true)
			const token = localStorage.getItem('token')
			const response = await axios.put('/api/auth/profile', formData, {
				headers: { Authorization: `Bearer ${token}` }
			})

			const updatedUser = response.data.user
			setUserInfo(updatedUser)
			setFormData({
				name: updatedUser.name || '',
				company: updatedUser.company || '',
				email: updatedUser.email || '',
				password: ''
			})
			setTheme(updatedUser.theme)
			setShowSuccessModal(true)
		} catch (error) {
			if (error.response?.status === 401) {
				localStorage.removeItem('token')
				navigate('/login')
				return
			}

			setAlertModal({
				isOpen: true,
				title: 'Unable to Save Profile',
				message: error.response?.data?.message || 'There was a problem saving your profile.'
			})
		} finally {
			setIsSaving(false)
		}
	}

	const closeAlertModal = () => {
		setAlertModal({ isOpen: false, title: '', message: '' })
	}

	const profileInitials = useMemo(() => {
		if (!formData.name.trim()) {
			return 'U'
		}

		return formData.name
			.trim()
			.split(/\s+/)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() || '')
			.join('')
	}, [formData.name])

	const memberSince = userInfo?.createdAt
		? new Date(userInfo.createdAt).toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
				year: 'numeric'
			})
		: 'Not available'

	const isDarkMode = theme === 'dark'

	const themeClasses = isDarkMode
		? {
				page: 'min-h-screen bg-gradient-to-br from-black via-[#03141a] to-[#052834] px-3 py-5 text-cyan-100 sm:px-6 sm:py-8 lg:px-8',
				card: 'rounded-3xl border border-cyan-500/35 bg-black/85 p-5 shadow-[0_24px_60px_rgba(6,182,212,0.15)] backdrop-blur-sm sm:p-6',
				primaryText: 'text-cyan-50',
				secondaryText: 'text-cyan-100/75',
				mutedText: 'text-cyan-100/60',
				accentLabel: 'text-cyan-300',
				avatar: 'mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-black text-2xl font-bold text-cyan-50 shadow-[0_16px_40px_rgba(6,182,212,0.35)] sm:h-24 sm:w-24 sm:text-3xl',
				backButton: 'inline-flex w-full items-center justify-center rounded-xl border border-cyan-500/50 bg-black/70 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-950/60 sm:w-auto sm:justify-start',
				infoCardOne: 'rounded-2xl border border-cyan-400/30 bg-cyan-950/35 p-4',
				infoCardTwo: 'rounded-2xl border border-cyan-400/35 bg-cyan-900/25 p-4',
				infoCardThree: 'rounded-2xl border border-cyan-500/30 bg-black/70 p-4',
				input: 'block w-full rounded-2xl border-2 border-cyan-500/45 bg-black/50 px-4 py-3.5 text-base text-cyan-50 transition-all duration-200 placeholder:text-cyan-200/45 group-hover:border-cyan-400 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 sm:px-5 sm:py-4',
				noteCard: 'rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-black/80 to-cyan-950/55 p-4',
				cancelButton: 'w-full rounded-2xl border border-cyan-500/45 bg-black/70 px-6 py-3 text-sm font-semibold text-cyan-100 transition-colors duration-200 hover:bg-cyan-950/60 sm:w-auto',
				saveButton: 'flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-black via-cyan-900 to-cyan-500 px-6 py-3 text-sm font-bold text-cyan-50 shadow-[0_18px_36px_rgba(6,182,212,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(6,182,212,0.3)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
		  }
		: {
				page: 'min-h-screen bg-gradient-to-br from-[#F9F6C4] via-white to-[#89D4FF] px-3 py-5 text-slate-900 sm:px-6 sm:py-8 lg:px-8',
				card: 'rounded-3xl border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_rgba(68,172,255,0.16)] backdrop-blur-sm sm:p-6',
				primaryText: 'text-slate-900',
				secondaryText: 'text-slate-700',
				mutedText: 'text-slate-500',
				accentLabel: 'text-[#44ACFF]',
				avatar: 'mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] text-2xl font-bold text-slate-900 shadow-[0_16px_40px_rgba(68,172,255,0.24)] sm:h-24 sm:w-24 sm:text-3xl',
				backButton: 'inline-flex w-full items-center justify-center rounded-xl border border-[#89D4FF]/40 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-[#F9F6C4] sm:w-auto sm:justify-start',
				infoCardOne: 'rounded-2xl bg-[#F9F6C4]/75 p-4',
				infoCardTwo: 'rounded-2xl bg-[#89D4FF]/16 p-4',
				infoCardThree: 'rounded-2xl bg-[#FE9EC7]/16 p-4',
				input: 'block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3.5 text-base text-slate-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4',
				noteCard: 'rounded-2xl border border-[#FE9EC7]/35 bg-gradient-to-r from-[#F9F6C4]/70 to-[#FE9EC7]/20 p-4',
				cancelButton: 'w-full rounded-2xl border border-[#89D4FF]/35 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-[#F9F6C4] sm:w-auto',
				saveButton: 'flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 text-sm font-bold text-slate-900 shadow-[0_18px_36px_rgba(68,172,255,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(254,158,199,0.24)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
		  }

	return (
		<div className={themeClasses.page}>
			<div className="mx-auto max-w-5xl">
				<div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
					<button
						type="button"
						onClick={() => navigate('/')}
						className={themeClasses.backButton}
					>
						<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
						</svg>
						Back to Dashboard
					</button>
				</div>

				<div className="grid gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
					<section className={themeClasses.card}>
						<div className="flex flex-col items-center text-center">
							<div className={themeClasses.avatar}>
								{profileInitials}
							</div>
							<p className={`text-[11px] font-semibold uppercase tracking-[0.24em] sm:text-sm sm:tracking-[0.28em] ${themeClasses.accentLabel}`}>
								Student Profile
							</p>
							<h1 className={`mt-3 text-xl font-bold sm:text-2xl ${themeClasses.primaryText}`}>
								{userInfo?.name || 'Loading profile'}
							</h1>
							<p className={`mt-1 text-sm ${themeClasses.mutedText}`}>
								{userInfo?.email || 'No email available'}
							</p>
						</div>

						<div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
							<div className={themeClasses.infoCardOne}>
								<p className={`text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.accentLabel}`}>Company</p>
								<p className={`mt-2 text-base font-semibold ${themeClasses.primaryText}`}>{userInfo?.company || 'Not set'}</p>
							</div>
							<div className={themeClasses.infoCardTwo}>
								<p className={`text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.accentLabel}`}>Member Since</p>
								<p className={`mt-2 text-base font-semibold ${themeClasses.primaryText}`}>{memberSince}</p>
							</div>
							<div className={themeClasses.infoCardThree}>
								<p className={`text-xs font-semibold uppercase tracking-[0.2em] ${themeClasses.accentLabel}`}>Account Access</p>
								<p className={`mt-2 text-sm leading-6 ${themeClasses.secondaryText}`}>
									Update your personal details here. Leave the password field empty if you do not want to change it.
								</p>
							</div>
						</div>
					</section>

					<section className={`${themeClasses.card} sm:p-8`}>
						<div className="mb-6 sm:mb-8">
							<p className={`text-sm font-semibold uppercase tracking-[0.28em] ${themeClasses.accentLabel}`}>Edit Details</p>
							<h2 className={`mt-3 text-2xl font-bold sm:text-3xl ${themeClasses.primaryText}`}>Manage your account information</h2>
							<p className={`mt-2 text-sm sm:text-base ${themeClasses.mutedText}`}>
								Review the information currently saved on your account and update it when needed.
							</p>
						</div>

						{isLoading ? (
							<div className="flex min-h-[320px] items-center justify-center">
								<div className={`flex items-center ${themeClasses.secondaryText}`}>
									<svg className={`mr-3 h-6 w-6 animate-spin ${themeClasses.accentLabel}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Loading profile...
								</div>
							</div>
						) : (
							<form className="space-y-5 sm:space-y-6" onSubmit={handleSave}>
								<div className="grid gap-5 sm:gap-6 md:grid-cols-2">
									<div className="group md:col-span-2">
										<label htmlFor="name" className={`mb-2 block text-sm font-semibold ${themeClasses.secondaryText}`}>
											Full Name
										</label>
										<input
											id="name"
											name="name"
											type="text"
											value={formData.name}
											onChange={handleChange}
											className={themeClasses.input}
											placeholder="Enter your full name"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="company" className={`mb-2 block text-sm font-semibold ${themeClasses.secondaryText}`}>
											Internship Company
										</label>
										<input
											id="company"
											name="company"
											type="text"
											value={formData.company}
											onChange={handleChange}
											className={themeClasses.input}
											placeholder="Enter your internship company"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="email" className={`mb-2 block text-sm font-semibold ${themeClasses.secondaryText}`}>
											Email Address
										</label>
										<input
											id="email"
											name="email"
											type="email"
											value={formData.email}
											onChange={handleChange}
											className={themeClasses.input}
											placeholder="Enter your email address"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="password" className={`mb-2 block text-sm font-semibold ${themeClasses.secondaryText}`}>
											New Password
										</label>
										<input
											id="password"
											name="password"
											type="password"
											value={formData.password}
											onChange={handleChange}
											className={themeClasses.input}
											placeholder="Leave blank to keep your current password"
										/>
										<p className={`mt-2 text-sm ${themeClasses.mutedText}`}>Use at least 6 characters if you want to replace your password.</p>
									</div>
								</div>

								<div className={themeClasses.noteCard}>
									<p className={`text-sm font-medium ${themeClasses.secondaryText}`}>
										Changes are saved directly to your account. Your current session remains active after updating your details.
									</p>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
									<button
										type="button"
										onClick={() => navigate('/')}
										className={themeClasses.cancelButton}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isSaving}
										className={themeClasses.saveButton}
									>
										{isSaving ? 'Saving...' : 'Save Profile'}
									</button>
								</div>
							</form>
						)}
					</section>
				</div>
			</div>

			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				title="Profile Updated"
				message="Your account information has been updated successfully."
				userName={userInfo?.name}
				theme={theme}
			/>

			<AlertModal
				isOpen={alertModal.isOpen}
				onClose={closeAlertModal}
				title={alertModal.title}
				message={alertModal.message}
				theme={theme}
			/>
		</div>
	)
}

export default Profile
