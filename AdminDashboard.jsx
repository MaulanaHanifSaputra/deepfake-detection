import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { 
  UsersIcon, 
  VideoCameraIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDetections: 0,
    fakeDetections: 0,
    realDetections: 0,
    fakePercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats')
      setStats(response.data)
    } catch (error) {
      setError('Gagal memuat statistik')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Selamat datang, Admin {user?.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-blue-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-600">Total User</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card bg-green-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <VideoCameraIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-600">Total Deteksi</p>
                  <p className="text-2xl font-bold text-green-900">{stats.totalDetections}</p>
                </div>
              </div>
            </div>

            <div className="card bg-red-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-600">Deepfake</p>
                  <p className="text-2xl font-bold text-red-900">{stats.fakeDetections}</p>
                  <p className="text-xs text-red-500">{stats.fakePercentage}%</p>
                </div>
              </div>
            </div>

            <div className="card bg-emerald-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-emerald-600">Video Asli</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.realDetections}</p>
                  <p className="text-xs text-emerald-500">{100 - stats.fakePercentage}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/admin/users" className="block">
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <UsersIcon className="h-12 w-12 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Manajemen Pengguna</h3>
                    <p className="text-gray-600">Kelola semua pengguna sistem</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/admin/logs" className="block">
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <VideoCameraIcon className="h-12 w-12 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Monitoring Deteksi</h3>
                    <p className="text-gray-600">Lihat semua log deteksi</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link to="/admin/dataset" className="block">
              <div className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-12 w-12 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Dataset & Training</h3>
                    <p className="text-gray-600">Upload dataset dan jalankan training</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aktivitas Terkini</h2>
            <div className="card">
              <div className="text-center py-8 text-gray-500">
                <p>Tidak ada aktivitas terkini</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard
