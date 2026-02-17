import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  VideoCameraIcon, 
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

const DetectionLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterResult, setFilterResult] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchLogs()
  }, [currentPage, filterResult])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        ...(filterResult !== 'all' && { result: filterResult })
      }
      
      const response = await axios.get('/api/admin/logs', { params })
      setLogs(response.data.logs || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      setError('Gagal memuat log deteksi')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (result) => {
    if (result === 'fake') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          DEEPFAKE
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ASLI
        </span>
      )
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredLogs = logs.filter(log =>
    log.video_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleViewDetail = (log) => {
    setSelectedLog(log)
    setShowDetailModal(true)
  }

  const handleDeleteLog = async (logId) => {
    if (!window.confirm('Yakin ingin menghapus log deteksi ini?')) return
    try {
      await axios.delete(`/api/admin/logs/${logId}`)
      await fetchLogs()
    } catch (err) {
      setError('Gagal menghapus log')
    }
  }

  const exportSingleLog = async (log) => {
    try {
      // Create CSV content for single log
      const csvContent = [
        ['ID Log', log.id],
        ['Nama Video', log.video_name],
        ['Pengguna', log.username],
        ['Hasil Akhir', log.final_result === 'fake' ? 'DEEPFAKE' : 'ASLI'],
        ['Keyakinan Akhir', `${log.final_confidence}%`],
        ['CNN Result', log.cnn_result?.toUpperCase() || 'N/A'],
        ['CNN Confidence', `${log.cnn_confidence || 0}%`],
        ['Transformer Result', log.transformer_result?.toUpperCase() || 'N/A'],
        ['Transformer Confidence', `${log.transformer_confidence || 0}%`],
        ['Tanggal', new Date(log.created_at).toLocaleString('id-ID')]
      ].map(row => row.join(',')).join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `detection_log_${log.id}_${log.video_name.replace(/[^a-z0-9]/gi, '_')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Gagal mengekspor log deteksi')
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Monitoring Deteksi</h1>
              <p className="text-gray-600">Lihat semua log deteksi dari seluruh pengguna</p>
            </div>
            <Link
              to="/admin/dashboard"
              className="btn-secondary"
            >
              Kembali ke Dashboard
            </Link>
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

          {/* Search and Filters */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input-field pl-10"
                    placeholder="Cari video atau pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FunnelIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    className="input-field pl-10 appearance-none"
                    value={filterResult}
                    onChange={(e) => {
                      setFilterResult(e.target.value)
                      setCurrentPage(1)
                    }}
                  >
                    <option value="all">Semua Hasil</option>
                    <option value="fake">Deepfake</option>
                    <option value="real">Asli</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hasil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keyakinan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transformer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <VideoCameraIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.video_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: #{log.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{log.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.final_result)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${getConfidenceColor(log.final_confidence)}`}>
                          {log.final_confidence}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{log.cnn_result?.toUpperCase() || 'N/A'}</div>
                          <div className="text-xs">{log.cnn_confidence || 0}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div className="font-medium">{log.transformer_result?.toUpperCase() || 'N/A'}</div>
                          <div className="text-xs">{log.transformer_confidence || 0}%</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewDetail(log)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Lihat Detail"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => exportSingleLog(log)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Export Log"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Hapus log"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada log ditemukan</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || filterResult !== 'all' 
                      ? 'Coba ubah filter atau kata kunci pencarian' 
                      : 'Belum ada log deteksi yang tersedia'}
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Menampilkan {filteredLogs.length} dari {logs.length} hasil
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                  <p className="text-sm text-gray-500">Total Deteksi</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {logs.filter(item => item.final_result === 'fake').length}
                  </p>
                  <p className="text-sm text-gray-500">Deepfake</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {logs.filter(item => item.final_result === 'real').length}
                  </p>
                  <p className="text-sm text-gray-500">Video Asli</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {logs.filter(item => item.username).length > 0 
                      ? [...new Set(logs.map(item => item.username))].length 
                      : 0}
                  </p>
                  <p className="text-sm text-gray-500">Pengguna Aktif</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Detail Deteksi</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID Log</p>
                  <p className="text-sm text-gray-900">#{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Nama Video</p>
                  <p className="text-sm text-gray-900">{selectedLog.video_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Pengguna</p>
                  <p className="text-sm text-gray-900">{selectedLog.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Hasil Akhir</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedLog.final_result)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Keyakinan Akhir</p>
                  <p className={`text-sm font-medium ${getConfidenceColor(selectedLog.final_confidence)}`}>
                    {selectedLog.final_confidence}%
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Tanggal</p>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Detail Model</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs font-medium text-blue-700 mb-1">CNN</p>
                    <p className="text-sm text-blue-900 font-semibold">
                      {selectedLog.cnn_result?.toUpperCase() || 'N/A'}
                    </p>
                    <p className="text-xs text-blue-600">
                      Keyakinan: {selectedLog.cnn_confidence || 0}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs font-medium text-purple-700 mb-1">Transformer</p>
                    <p className="text-sm text-purple-900 font-semibold">
                      {selectedLog.transformer_result?.toUpperCase() || 'N/A'}
                    </p>
                    <p className="text-xs text-purple-600">
                      Keyakinan: {selectedLog.transformer_confidence || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn-secondary"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DetectionLogs
