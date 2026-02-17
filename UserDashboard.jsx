import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { detectionAPI } from '../services/api'
import { 
  ArrowRightOnRectangleIcon,
  CloudArrowUpIcon,
  ShieldCheckIcon,
  PlayCircleIcon,
  XMarkIcon,
  ChevronRightIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import VideoUpload from '../components/VideoUpload'

const UserDashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  // State: Mode upload aktif atau tidak
  const [isUploading, setIsUploading] = useState(false)
  const [quickStats, setQuickStats] = useState({
    totalScans: 0,
    fakeFound: 0,
    avgConfidence: 0,
    todayScans: 0
  })

  const [statsLoading, setStatsLoading] = useState(false)
  const [statsError, setStatsError] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      setStatsLoading(true)
      setStatsError('')
      const response = await detectionAPI.getUserStats()
      setQuickStats(response.data)
      setLastUpdatedAt(new Date())
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
      setStatsError('Gagal memuat statistik. Coba refresh.')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserStats()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleUploadComplete = () => {
    fetchUserStats()
  }

  const handleResetUpload = () => {
    setIsUploading(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
      
      {/* --- Top Navigation (Minimalist) --- */}
      <nav className="w-full bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <ShieldCheckIcon className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">DeepGuard</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-700">{user?.username || 'Guest'}</span>
            <span className="text-xs text-slate-400">Personal Plan</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title="Keluar"
          >
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* --- Main Layout: 2 Columns --- */}
      <main className="max-w-6xl mx-auto p-6 lg:p-10">
        
        {/* Hero Section */}
        <div className="relative mb-12">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl"></div>
          
          {/* Content */}
          <div className="relative px-8 py-12 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              Powered Deepfake Detection
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Halo, {user?.username}<br/>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Deteksi Video Palsu
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Platform terdepan untuk identifikasi deepfake menggunakan teknologi AI terbaru. 
              Analisis video dengan akurasi tinggi dalam hitungan detik.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => {
                  const uploadSection = document.getElementById('upload-section')
                  uploadSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  <PlayCircleIcon className="w-6 h-6" />
                  Mulai Deteksi Sekarang
                </div>
              </button>
              
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Real-time Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>99% Accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <CpuChipIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Analysis</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Teknologi deep learning canggih menganalisis setiap frame video untuk mendeteksi manipulasi digital yang tidak terlihat oleh mata manusia.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Fast Processing</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Hasil analisis tersedia dalam hitungan detik. Tidak perlu menunggu lama untuk mengetahui keaslian video Anda.
            </p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow border border-slate-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Secure & Private</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Video Anda diproses secara aman dengan enkripsi end-to-end. Data tidak disimpan dan tidak dibagikan kepada pihak ketiga.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT COLUMN: ACTION CENTER (2/3 Width) --- */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* The Main Card */}
            <div id="upload-section" className="bg-white rounded-3xl p-1 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
              
              {/* Toggle Header inside Card */}
              {isUploading && (
                <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <CloudArrowUpIcon className="w-5 h-5 text-blue-600" />
                    Upload Video
                  </h3>
                  <button 
                    onClick={() => setIsUploading(false)}
                    className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <XMarkIcon className="w-4 h-4" /> Batal
                  </button>
                </div>
              )}

              {/* Dynamic Content Area */}
              <div className="p-6 md:p-8">
                {isUploading ? (
                  // TAMPILAN 1: Form Upload (Komponen Anda)
                  <div className="animate-fade-in">
                    <VideoUpload onUploadComplete={handleUploadComplete} onResetUpload={handleResetUpload} />
                  </div>
                ) : (
                  // TAMPILAN 2: Call to Action (Ramah & Mengundang)
                  <div className="flex flex-col items-center text-center py-10 px-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse-slow">
                      <CloudArrowUpIcon className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Mulai Deteksi Baru
                    </h2>
                    <p className="text-slate-500 max-w-md mb-8">
                      Unggah video Anda untuk dianalisis oleh AI kami. Kami akan memeriksa tanda-tanda manipulasi deepfake secara detail.
                    </p>
                    <button
                      onClick={() => setIsUploading(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
                    >
                      <PlayCircleIcon className="w-5 h-5" />
                      Upload Video Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips / Banner (Supaya tidak kosong) */}
            {!isUploading && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg">
                <div>
                  <h3 className="font-bold text-lg">Tips Keamanan</h3>
                  <p className="text-indigo-100 text-sm mt-1">Perhatikan kedipan mata yang tidak wajar pada video.</p>
                </div>
                <ShieldCheckIcon className="w-12 h-12 text-white/20" />
              </div>
            )}
          </div>

          {/* --- RIGHT COLUMN: SIDEBAR INFO (1/3 Width) --- */}
          <div className="space-y-6">
            
            {/* Stats Summary (Vertical Stack) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Statistik Anda</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {lastUpdatedAt ? `Terakhir diperbarui: ${lastUpdatedAt.toLocaleTimeString()}` : 'Terakhir diperbarui: -'}
                  </p>
                </div>
                <button
                  onClick={fetchUserStats}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100"
                  disabled={statsLoading}
                  title="Refresh statistik"
                >
                  {statsLoading ? 'Memuat...' : 'Refresh'}
                </button>
              </div>

              {statsError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
                  {statsError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500">Total Scan</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{quickStats.totalScans}</p>
                  <p className="text-xs text-slate-400 mt-1">Semua waktu</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-xs text-slate-500">Scan Hari Ini</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{quickStats.todayScans}</p>
                  <p className="text-xs text-slate-400 mt-1">00:00 - sekarang</p>
                </div>

                <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                  <p className="text-xs text-slate-500">Fake Terdeteksi</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{quickStats.fakeFound}</p>
                  <p className="text-xs text-red-700/70 mt-1">
                    Rate:{' '}
                    {quickStats.totalScans > 0
                      ? `${Math.round((quickStats.fakeFound / quickStats.totalScans) * 100)}%`
                      : '0%'
                    }
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                  <p className="text-xs text-slate-500">Rata-rata Confidence</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{Number(quickStats.avgConfidence || 0).toFixed(2)}%</p>
                  <p className="text-xs text-green-700/70 mt-1">Dari semua hasil</p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Cara membaca statistik</p>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    “Fake Terdeteksi” adalah jumlah video dengan hasil akhir FAKE. “Rata-rata confidence” dihitung dari confidence hasil akhir (0-100).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default UserDashboard