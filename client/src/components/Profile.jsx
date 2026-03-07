import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import SuccessModal from './SuccessModal'
import AlertModal from './AlertModal'

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

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#F9F6C4] via-white to-[#89D4FF] px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
			<div className="mx-auto max-w-5xl">
				<div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
					<button
						type="button"
						onClick={() => navigate('/')}
						className="inline-flex w-full items-center justify-center rounded-xl border border-[#89D4FF]/40 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-[#F9F6C4] sm:w-auto sm:justify-start"
					>
						<svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
						</svg>
						Back to Dashboard
					</button>
				</div>

				<div className="grid gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
					<section className="rounded-3xl border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_rgba(68,172,255,0.16)] backdrop-blur-sm sm:p-6">
						<div className="flex flex-col items-center text-center">
							<div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] text-2xl font-bold text-slate-900 shadow-[0_16px_40px_rgba(68,172,255,0.24)] sm:h-24 sm:w-24 sm:text-3xl">
								{profileInitials}
							</div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#44ACFF] sm:text-sm sm:tracking-[0.28em]">
								Student Profile
							</p>
							<h1 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
								{userInfo?.name || 'Loading profile'}
							</h1>
							<p className="mt-1 text-sm text-slate-500">
								{userInfo?.email || 'No email available'}
							</p>
						</div>

						<div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
							<div className="rounded-2xl bg-[#F9F6C4]/75 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#44ACFF]">Company</p>
								<p className="mt-2 text-base font-semibold text-slate-900">{userInfo?.company || 'Not set'}</p>
							</div>
							<div className="rounded-2xl bg-[#89D4FF]/16 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#44ACFF]">Member Since</p>
								<p className="mt-2 text-base font-semibold text-slate-900">{memberSince}</p>
							</div>
							<div className="rounded-2xl bg-[#FE9EC7]/16 p-4">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FE9EC7]">Account Access</p>
								<p className="mt-2 text-sm leading-6 text-slate-700">
									Update your personal details here. Leave the password field empty if you do not want to change it.
								</p>
							</div>
						</div>
					</section>

					<section className="rounded-3xl border border-white/80 bg-white/92 p-5 shadow-[0_24px_60px_rgba(68,172,255,0.16)] backdrop-blur-sm sm:p-8">
						<div className="mb-6 sm:mb-8">
							<p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#44ACFF]">Edit Details</p>
							<h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">Manage your account information</h2>
							<p className="mt-2 text-sm text-slate-500 sm:text-base">
								Review the information currently saved on your account and update it when needed.
							</p>
						</div>

						{isLoading ? (
							<div className="flex min-h-[320px] items-center justify-center">
								<div className="flex items-center text-slate-600">
									<svg className="mr-3 h-6 w-6 animate-spin text-[#44ACFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
										<label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-700">
											Full Name
										</label>
										<input
											id="name"
											name="name"
											type="text"
											value={formData.name}
											onChange={handleChange}
											className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3.5 text-base text-slate-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4"
											placeholder="Enter your full name"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="company" className="mb-2 block text-sm font-semibold text-slate-700">
											Internship Company
										</label>
										<input
											id="company"
											name="company"
											type="text"
											value={formData.company}
											onChange={handleChange}
											className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3.5 text-base text-slate-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4"
											placeholder="Enter your internship company"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
											Email Address
										</label>
										<input
											id="email"
											name="email"
											type="email"
											value={formData.email}
											onChange={handleChange}
											className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3.5 text-base text-slate-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4"
											placeholder="Enter your email address"
										/>
									</div>

									<div className="group md:col-span-2">
										<label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
											New Password
										</label>
										<input
											id="password"
											name="password"
											type="password"
											value={formData.password}
											onChange={handleChange}
											className="block w-full rounded-2xl border-2 border-[#89D4FF]/40 px-4 py-3.5 text-base text-slate-900 transition-all duration-200 group-hover:border-[#89D4FF] focus:border-[#44ACFF] focus:outline-none focus:ring-4 focus:ring-[#89D4FF]/30 sm:px-5 sm:py-4"
											placeholder="Leave blank to keep your current password"
										/>
										<p className="mt-2 text-sm text-slate-500">Use at least 6 characters if you want to replace your password.</p>
									</div>
								</div>

								<div className="rounded-2xl border border-[#FE9EC7]/35 bg-gradient-to-r from-[#F9F6C4]/70 to-[#FE9EC7]/20 p-4">
									<p className="text-sm font-medium text-slate-700">
										Changes are saved directly to your account. Your current session remains active after updating your details.
									</p>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
									<button
										type="button"
										onClick={() => navigate('/')}
										className="w-full rounded-2xl border border-[#89D4FF]/35 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-[#F9F6C4] sm:w-auto"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isSaving}
										className="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#FE9EC7] via-[#F9F6C4] to-[#44ACFF] px-6 py-3 text-sm font-bold text-slate-900 shadow-[0_18px_36px_rgba(68,172,255,0.22)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_22px_42px_rgba(254,158,199,0.24)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
			/>

			<AlertModal
				isOpen={alertModal.isOpen}
				onClose={closeAlertModal}
				title={alertModal.title}
				message={alertModal.message}
			/>
		</div>
	)
}

export default Profile
