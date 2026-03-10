import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" />
  }

  // If route requires admin but user is not admin
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" />
  }

  // If route is for normal users (e.g. Dashboard) but user is admin
  if (!requireAdmin && user.role === 'admin' && location.pathname === '/') {
    return <Navigate to="/admin" />
  }

  return children
}

export default PrivateRoute