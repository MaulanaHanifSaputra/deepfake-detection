# DeepFake Detection System - Frontend

Frontend aplikasi web untuk sistem deteksi video deepfake menggunakan React.js.

## Fitur

### User Flow
- **Login/Register**: Autentikasi pengguna dengan role-based access
- **Dashboard User**: Menu utama untuk deteksi video dan riwayat
- **Upload Video**: Drag & drop interface untuk upload video
- **Hasil Deteksi**: Tampilan real-time hasil CNN dan Transformer
- **Riwayat Deteksi**: Histori semua deteksi yang pernah dilakukan

### Admin Flow
- **Dashboard Admin**: Statistik sistem (total user, deteksi, persentase deepfake)
- **Manajemen Pengguna**: Lihat, edit, hapus pengguna
- **Monitoring Deteksi**: Log semua deteksi dari seluruh user
- **Export Data**: Download log deteksi dalam format CSV

## Teknologi

- **React 19.2.3** - Frontend framework
- **React Router 7.12.0** - Routing
- **Tailwind CSS 4.1.18** - Styling
- **Axios 1.13.2** - HTTP client
- **Headless UI** - Component library
- **Heroicons** - Icon library
- **Vite 7.3.1** - Build tool

## Struktur Proyek

```
src/
├── components/          # Reusable components
│   └── VideoUpload.jsx  # Video upload component
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/              # Page components
│   ├── Login.jsx       # Login page
│   ├── Register.jsx    # Registration page
│   ├── UserDashboard.jsx # User dashboard
│   ├── UserHistory.jsx # User detection history
│   ├── AdminDashboard.jsx # Admin dashboard
│   ├── UserManagement.jsx # User management
│   └── DetectionLogs.jsx # Detection logs
├── services/           # API services
│   └── api.js         # API configuration
├── App.jsx            # Main app component
├── main.jsx           # App entry point
└── index.css          # Global styles
```

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## API Endpoints

Frontend menghubungkan ke backend Flask pada port 5000:

### Authentication
- `POST /login` - Login pengguna
- `POST /register` - Registrasi pengguna baru
- `GET /verify-token` - Verifikasi token JWT

### Detection
- `POST /detect` - Upload dan deteksi video
- `GET /user/history` - Riwayat deteksi user

### Admin
- `GET /admin/stats` - Statistik sistem
- `GET /admin/users` - Daftar semua pengguna
- `DELETE /admin/users/:id` - Hapus pengguna
- `GET /admin/logs` - Log deteksi semua user

## Konfigurasi

### Tailwind CSS
Konfigurasi Tailwind ada di `tailwind.config.js` dan `postcss.config.js`.

### Vite
Konfigurasi build tool ada di `vite.config.js` dengan proxy untuk API requests.

## User Flow

### 1. Login/Register
- Pengguna masukkan username dan password
- Sistem verifikasi data di tabel `users`
- Redirect ke dashboard sesuai role

### 2. User Dashboard
- Menu "Deteksi Video" untuk upload video
- Menu "Riwayat Deteksi" untuk lihat hasil sebelumnya
- Statistik personal deteksi

### 3. Video Detection
- Upload video (MP4, AVI, MOV, WMV, FLV max 100MB)
- Backend ekstrak frame dan analisis dengan CNN + Transformer
- Tampilkan hasil dengan confidence score
- Simpan ke database

### 4. Admin Dashboard
- Statistik keseluruhan sistem
- Akses ke manajemen pengguna dan monitoring
- Export data untuk analisis

## Styling

Menggunakan Tailwind CSS dengan custom components:
- `.btn-primary` - Button utama (biru)
- `.btn-secondary` - Button sekunder (abu)
- `.card` - Card container dengan shadow
- `.input-field` - Input field dengan focus states

## Deployment

Frontend siap di-deploy sebagai static files setelah build:
```bash
npm run build
```

Folder `dist` dapat di-deploy ke web server atau CDN.
