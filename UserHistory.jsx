import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { detectionAPI } from '../services/api'
import { 
  ClockIcon, 
  VideoCameraIcon,
  EyeIcon,
  TrashIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  FilmIcon
} from '@heroicons/react/24/outline'

const UserHistory = () => {
  const [history, setHistory] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchHistory()
  }, [])

  // Simple client-side search filter
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredHistory(history)
    } else {
      const filtered = history.filter((item) => {
        const name = String(item?.video_name || '')
        return name.toLowerCase().includes(searchTerm.toLowerCase())
      })
      setFilteredHistory(filtered)
    }
  }, [searchTerm, history])

  const fetchHistory = async () => {
    try {
      const response = await detectionAPI.getUserHistory()
      setHistory(response.data)
      setFilteredHistory(response.data)
    } catch (error) {
      setError('Gagal memuat riwayat deteksi')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date)
  }

  const getStatusBadge = (result) => {
    if (result === 'fake') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
          <ExclamationTriangleIcon className="w-3.5 h-3.5" />
          DEEPFAKE
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckBadgeIcon className="w-3.5 h-3.5" />
        AUTHENTIC
      </span>
    )
  }

  // --- RENDERING HELPERS ---
  
  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat arsip deteksi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-12">
      
      {/* Top Header Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard"
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-slate-900">Riwayat Analisis</h1>
            </div>
            <div className="flex items-center gap-2">
               <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Total Scan</p>
                  <p className="text-sm font-bold text-slate-900">{history.length} Video</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 1. Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           {/* Total Card */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Arsip</p>
                <h3 className="text-3xl font-bold text-slate-900">{history.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <ClockIcon className="w-6 h-6" />
              </div>
           </div>
           
           {/* Danger Card */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-500 mb-1">Ancaman Deepfake</p>
                <h3 className="text-3xl font-bold text-rose-600">
                  {history.filter(i => i.final_result === 'fake').length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
           </div>

           {/* Safe Card */}
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-500 mb-1">Video Asli</p>
                <h3 className="text-3xl font-bold text-emerald-600">
                  {history.filter(i => i.final_result === 'real').length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckBadgeIcon className="w-6 h-6" />
              </div>
           </div>
        </div>

        {/* 2. Content Area */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          
          {/* Toolbar / Filter */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Daftar Log Deteksi</h2>
            
            <div className="flex gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cari nama video..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <FunnelIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Table Content */}
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 text-center text-sm border-b border-rose-100">
              {error}
            </div>
          )}

          {history.length === 0 ? (
            // EMPTY STATE
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <VideoCameraIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Belum ada riwayat</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Anda belum melakukan deteksi video apapun. Mulai analisis pertama Anda sekarang.
              </p>
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                + Mulai Deteksi Baru
              </Link>
            </div>
          ) : filteredHistory.length === 0 ? (
            // NO SEARCH RESULTS
            <div className="py-20 text-center">
              <p className="text-slate-500">Tidak ditemukan video dengan nama "{searchTerm}"</p>
            </div>
          ) : (
            // TABLE
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4 rounded-tl-lg">Video Source</th>
                    <th className="px-6 py-4">Status Analisis</th>
                    <th className="px-6 py-4 text-center">AI Confidence</th>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      
                      {/* Column 1: Video Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <FilmIcon className="w-5 h-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]" title={item.video_name}>
                              {item.video_name}
                            </p>
                            <p className="text-xs text-slate-400 font-mono">ID: {String(item.id).substring(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(item.final_result)}
                      </td>

                      {/* Column 3: Confidence */}
                      <td className="px-6 py-4 text-center">
                         <div className="flex flex-col items-center">
                           <span className={`text-sm font-bold ${
                             item.final_confidence > 80 ? 'text-slate-900' : 'text-slate-600'
                           }`}>
                             {item.final_confidence}%
                           </span>
                           {/* Mini Progress Bar */}
                           <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                             <div 
                                className={`h-full rounded-full ${
                                  item.final_confidence > 80 ? 'bg-green-500' : 
                                  item.final_confidence > 50 ? 'bg-yellow-400' : 'bg-red-400'
                                }`} 
                                style={{ width: `${item.final_confidence}%` }}
                             ></div>
                           </div>
                         </div>
                      </td>

                      {/* Column 4: Date */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                           <ClockIcon className="w-4 h-4 text-slate-400" />
                           {formatDate(item.created_at)}
                        </div>
                      </td>

                      {/* Column 5: Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Data"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination (Visual Only for now) */}
          {filteredHistory.length > 0 && (
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <p>Menampilkan {filteredHistory.length} data</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border rounded bg-white disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 border rounded bg-white disabled:opacity-50" disabled>Next</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default UserHistory