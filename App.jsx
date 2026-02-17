import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import UserHistory from './pages/UserHistory'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import DetectionLogs from './pages/DetectionLogs'
import AdminDataset from './pages/AdminDataset'
import { AuthProvider } from './contexts/AuthContext'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />}
      />
      <Route
        path="/register"
        element={!user ? <Register /> : <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />}
      />
      
      {/* User Routes */}
      <Route path="/dashboard" element={user && user.role !== 'admin' ? <UserDashboard /> : <Navigate to="/login" />} />
      <Route path="/history" element={user && user.role !== 'admin' ? <UserHistory /> : <Navigate to="/login" />} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
      <Route path="/admin/users" element={user && user.role === 'admin' ? <UserManagement /> : <Navigate to="/login" />} />
      <Route path="/admin/logs" element={user && user.role === 'admin' ? <DetectionLogs /> : <Navigate to="/login" />} />
      <Route path="/admin/dataset" element={user && user.role === 'admin' ? <AdminDataset /> : <Navigate to="/login" />} />
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
