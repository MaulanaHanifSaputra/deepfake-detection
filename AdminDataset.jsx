import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const AdminDataset = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [uploadType, setUploadType] = useState('video')
  const [label, setLabel] = useState('real')
  const [file, setFile] = useState(null)

  const [trainStatus, setTrainStatus] = useState(null)
  const [trainLoading, setTrainLoading] = useState(false)
  const [lastTrainState, setLastTrainState] = useState({})

  const fetchDataset = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/admin/dataset')
      setItems(res.data.items || [])
    } catch (e) {
      setError('Gagal memuat dataset')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrainStatus = async () => {
    try {
      const res = await axios.get('/api/admin/train/status')
      const newStatus = res.data.status
      
      // Check for training completion
      if (lastTrainState.image?.running && !newStatus.image?.running) {
        if (newStatus.image?.last_success) {
          setSuccess('✅ Training CNN selesai! Model berhasil diperbarui.')
        } else {
          setError('❌ Training CNN gagal. Cek log error.')
        }
        setTimeout(() => {
          setSuccess('')
          setError('')
        }, 5000)
      }
      
      if (lastTrainState.video?.running && !newStatus.video?.running) {
        if (newStatus.video?.last_success) {
          setSuccess('✅ Training Transformer selesai! Model berhasil diperbarui.')
        } else {
          setError('❌ Training Transformer gagal. Cek log error.')
        }
        setTimeout(() => {
          setSuccess('')
          setError('')
        }, 5000)
      }
      
      setTrainStatus(newStatus)
      setLastTrainState(trainStatus || {})
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    fetchDataset()
    fetchTrainStatus()
    const t = setInterval(fetchTrainStatus, 2000)
    return () => clearInterval(t)
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!file) {
      setError('Pilih file dulu')
      return
    }

    try {
      const form = new FormData()
      form.append('label', label)
      if (uploadType === 'video') {
        form.append('video', file)
        await axios.post('/api/admin/dataset/video', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        form.append('image', file)
        await axios.post('/api/admin/dataset/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      setFile(null)
      setSuccess(`✅ Dataset berhasil ditambahkan! Total items: ${items.length + 1}`)
      await fetchDataset()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e2) {
      setError(e2.response?.data?.error || 'Gagal upload dataset')
    }
  }

  const startTrain = async (type) => {
    setError('')
    setSuccess('')
    setTrainLoading(true)
    try {
      if (type === 'image') {
        await axios.post('/api/admin/train/image')
        setSuccess('🚀 Training CNN dimulai! Mohon tunggu proses selesai...')
      } else {
        await axios.post('/api/admin/train/video')
        setSuccess('🚀 Training Transformer dimulai! Mohon tunggu proses selesai...')
      }
      await fetchTrainStatus()
      setTimeout(() => setSuccess(''), 4000)
    } catch (e) {
      setError(e.response?.data?.message || 'Gagal memulai training')
    } finally {
      setTrainLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dataset & Training</h1>
              <p className="text-gray-600">Upload dataset (manual label) dan jalankan training manual</p>
            </div>
            <Link to="/admin/dashboard" className="btn-secondary">Kembali</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-center gap-3 shadow-sm">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center gap-3 shadow-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{success}</span>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Dataset</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
                  <select
                    className="input-field"
                    value={uploadType}
                    onChange={(e) => {
                      setUploadType(e.target.value)
                      setFile(null)
                    }}
                  >
                    <option value="video">Video (untuk Transformer)</option>
                    <option value="image">Image (untuk CNN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <select className="input-field" value={label} onChange={(e) => setLabel(e.target.value)}>
                    <option value="real">Real</option>
                    <option value="fake">Fake</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    className="input-field"
                    type="file"
                    accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn-primary" type="submit">Upload</button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Training</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                className="btn-primary"
                onClick={() => startTrain('image')}
                disabled={trainLoading || trainStatus?.image?.running}
              >
                Train CNN (Image)
              </button>
              <button
                className="btn-primary"
                onClick={() => startTrain('video')}
                disabled={trainLoading || trainStatus?.video?.running}
              >
                Train Transformer (Video)
              </button>
            </div>

            {trainStatus && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded border border-gray-200">
                  <div className="font-medium text-gray-900">CNN (Image)</div>
                  <div className="text-sm text-gray-600">Running: {String(trainStatus.image?.running)}</div>
                  <div className="text-sm text-gray-600">Last success: {String(trainStatus.image?.last_success)}</div>
                  {trainStatus.image?.last_error && (
                    <div className="text-sm text-red-600 break-words">{trainStatus.image.last_error}</div>
                  )}
                </div>
                <div className="p-4 rounded border border-gray-200">
                  <div className="font-medium text-gray-900">Transformer (Video)</div>
                  <div className="text-sm text-gray-600">Running: {String(trainStatus.video?.running)}</div>
                  <div className="text-sm text-gray-600">Last success: {String(trainStatus.video?.last_success)}</div>
                  {trainStatus.video?.last_error && (
                    <div className="text-sm text-red-600 break-words">{trainStatus.video.last_error}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dataset Terakhir (maks 200)</h2>
            {loading ? (
              <div className="py-8 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.label}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{it.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {it.created_at ? new Date(it.created_at).toLocaleString('id-ID') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {items.length === 0 && (
                  <div className="py-8 text-center text-gray-500">Belum ada data dataset</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDataset
