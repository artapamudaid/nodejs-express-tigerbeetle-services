# Ledger Service - TigerBeetle Integration

Sistem ledger terintegrasi dengan TigerBeetle untuk mengelola transaksi akuntansi berkinerja tinggi. Aplikasi ini dibangun menggunakan Node.js, Express, dan TigerBeetle sebagai database ledger yang konsisten dan cepat.

## 📋 Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi TigerBeetle di Ubuntu VPS](#instalasi-tigerbeetle-di-ubuntu-vps)
- [Setup Aplikasi](#setup-aplikasi)
- [Dokumentasi Sistem](#dokumentasi-sistem)
- [Testing Sistem](#testing-sistem)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Persyaratan Sistem

- **OS**: Ubuntu 20.04 LTS atau lebih baru
- **Node.js**: v18.x atau lebih baru
- **npm**: v9.x atau lebih baru
- **RAM**: Minimal 2GB (untuk TigerBeetle)
- **Disk**: Minimal 10GB
- **k6**: Untuk load testing (opsional)

---

## 🚀 Instalasi TigerBeetle di Ubuntu VPS

### 1. Update System Packages

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Download TigerBeetle

```bash
# Buat direktori untuk TigerBeetle
mkdir -p ~/tigerbeetle
cd ~/tigerbeetle

# Download TigerBeetle (sesuaikan versi)
wget https://github.com/tigerbeetle/tigerbeetle/releases/download/releases%2F0.16.70/tigerbeetle -O tigerbeetle
chmod +x tigerbeetle
```

### 3. Format & Jalankan TigerBeetle

```bash
# Format data file (create new ledger)
./tigerbeetle format --cluster=0 --replica=0 --replica-count=1 0_0.tigerbeetle

# Jalankan TigerBeetle dengan port 3000
./tigerbeetle start --addresses=3000 0_0.tigerbeetle
```

**Output yang diharapkan:**
```
info(io): listening on 3000
info(main): 0: cluster=0 replica=0 size=1024 max_clients=10485760
```

TigerBeetle sekarang berjalan di `localhost:3000` atau `VPS_IP:3000`

### 4. (Opsional) Setup TigerBeetle sebagai Systemd Service

Buat file service untuk autostart:

```bash
sudo nano /etc/systemd/system/tigerbeetle.service
```

Isi dengan:

```ini
[Unit]
Description=TigerBeetle Ledger Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tigerbeetle
ExecStart=/home/ubuntu/tigerbeetle/tigerbeetle start --addresses=3000 0_0.tigerbeetle
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable dan start service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tigerbeetle
sudo systemctl start tigerbeetle
sudo systemctl status tigerbeetle
```

### 5. Verifikasi Koneksi TigerBeetle

```bash
# Cek apakah port 3000 terbuka
sudo netstat -tulpn | grep 3000
# atau
sudo ss -tulpn | grep 3000
```

---

## 🔧 Setup Aplikasi

### 1. Clone Repository dan Install Dependencies

```bash
# Clone atau extract project
cd /path/to/my-ledger-service

# Install dependencies
npm install
```

### 2. Konfigurasi Environment Variables

```bash
# Copy env-example ke .env
cp env-example .env

# Edit .env sesuai kebutuhan
nano .env
```

Isi `.env`:

```env
# Port aplikasi
PORT=3333

# TigerBeetle Configuration
TB_CLUSTER_ID=0
TB_REPLICA_ADDRESSES=localhost:3000
```

**Penjelasan:**
- `PORT`: Port tempat Express server berjalan
- `TB_CLUSTER_ID`: Cluster ID TigerBeetle (default 0)
- `TB_REPLICA_ADDRESSES`: Alamat dan port TigerBeetle

### 3. Jalankan Aplikasi

```bash
npm start
```

**Output yang diharapkan:**
```
Ledger Service running on http://localhost:3333
Connected to TigerBeetle at port localhost:3000
```

---

## 📚 Dokumentasi Sistem

### Arsitektur Sistem

```
┌─────────────────┐
│   Client/API    │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Express  │ (Port 3333)
    │  App     │
    └────┬────┘
         │
    ┌────▼──────────────────┐
    │  Ledger Service Layer  │
    │                        │
    │ • Transfer            │
    │ • Account Mgmt        │
    │ • Query Balance       │
    └────┬──────────────────┘
         │
    ┌────▼──────────┐
    │  TigerBeetle   │ (Port 3000)
    │  Ledger DB     │
    │                │
    │ • ACID         │
    │ • Two-Phase    │
    │   Commit       │
    └────────────────┘
```

### Struktur Project

```
my-ledger-service/
├── src/
│   ├── app.js                 # Express app utama
│   ├── worker.js              # Worker untuk async tasks
│   ├── config/
│   │   └── tigerbeetle.js     # TigerBeetle client config
│   ├── controllers/
│   │   └── ledgerController.js # Business logic untuk ledger
│   ├── routes/
│   │   └── api.js             # Route definitions
│   ├── services/
│   │   └── ledgerService.js   # Ledger operations
│   └── utils/
│       ├── id.js              # ID generation utilities
│       ├── queue.js           # Task queue (Redis)
│       └── serialization.js   # BigInt serialization
├── test-async.js              # Test async operations
├── test-coa.js                # Test Chart of Accounts
├── test-connect.js            # Test connection
├── loadtest.js                # k6 load test script
└── package.json               # Dependencies
```

### API Endpoints

Aplikasi menyediakan API untuk:

- **Membuat Account** - POST `/api/v1/accounts`
- **Query Balance** - GET `/api/v1/accounts/:id`
- **Transfer** - POST `/api/v1/transfers`
- **Query Transfer** - GET `/api/v1/transfers/:id`

Untuk detail lengkap, lihat [src/routes/api.js](src/routes/api.js)

### Key Features

1. **BigInt Support** - Mendukung angka besar untuk akuntansi presisi
2. **ACID Transactions** - Dijamin oleh TigerBeetle
3. **Queue Support** - Redis untuk async processing
4. **Security** - Helmet, CORS, logging dengan Morgan
5. **Error Handling** - Global error handler

---

## ✅ Testing Sistem

### Prasyarat Testing

Pastikan:
- TigerBeetle sudah running di port 3000
- Aplikasi sudah running di port 3333
- Node.js v18+ sudah terinstall
- k6 sudah terinstall (untuk load test)

### 1. Test Connection

Tes koneksi ke TigerBeetle:

```bash
node test-connect.js
```

**Output yang diharapkan:**
```
Connected to TigerBeetle successfully!
Server info: {...}
```

Jika error, pastikan TigerBeetle running dan port 3000 accessible.

### 2. Test Chart of Accounts (CoA)

Membuat dan menguji Chart of Accounts:

```bash
node test-coa.js
```

**Output yang diharapkan:**
```
Creating accounts...
Account 1 ID: 189448446272267589831377658726411419675
Account 2 ID: 239845069173352372265889147526328241950
...
All tests passed!
```

Tes ini membuat akun debit dan kredit untuk transaksi testing.

### 3. Test Async Operations

Menguji operasi asynchronous dan queue:

```bash
node test-async.js
```

**Output yang diharapkan:**
```
Testing async operations...
Transfer 1: SUCCESS
Transfer 2: SUCCESS
...
Async tests completed!
```

Tes ini memverifikasi bahwa transaksi dapat diproses secara paralel.

### 4. Load Test dengan k6

#### Instalasi k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Ubuntu/Debian:**
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3232A
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

#### Jalankan Load Test

Buka terminal baru dan jalankan load test:

```bash
k6 run loadtest.js
```

**Konfigurasi Load Test:**

File `loadtest.js` sudah dikonfigurasi dengan:
- **Ramp-up**: 50 users dalam 5 detik
- **Plateau**: 50 users selama 10 detik
- **Ramp-down**: Turun ke 0 users dalam 5 detik

**Output yang diharapkan:**
```
     data_received..............: 15 MB    50 kB/s
     data_sent...................: 3.2 MB  10 kB/s
     http_req_duration..........: avg=120ms p(95)=250ms p(99)=500ms
     http_reqs...................: 5000    16.66/s
     iterations.................: 5000    16.66/s
     vus.........................: 50      max=50
```

#### Kustomisasi Load Test

Edit `loadtest.js` untuk mengubah:

```javascript
// Ubah target VUs dan duration
stages: [
  { duration: '10s', target: 100 },  // 100 users
  { duration: '30s', target: 100 },  // hold 30 seconds
  { duration: '5s', target: 0 },     // ramp down
],
```

### Test Checklist

```
[ ] npm start - Aplikasi berjalan di port 3333
[ ] TigerBeetle running di port 3000
[ ] node test-connect.js - Koneksi OK
[ ] node test-coa.js - Accounts created
[ ] node test-async.js - Async operations OK
[ ] k6 run loadtest.js - Load test passed
```

---

## 🐛 Troubleshooting

### TigerBeetle tidak bisa connect

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solusi:**
```bash
# Verifikasi TigerBeetle running
sudo lsof -i :3000

# Atau cek di VPS
ssh user@vps_ip
ps aux | grep tigerbeetle

# Jika tidak running, start ulang
cd ~/tigerbeetle
./tigerbeetle start --addresses=3000 0_0.tigerbeetle
```

### Port sudah digunakan

**Error:**
```
Error: listen EADDRINUSE :::3333
```

**Solusi:**
```bash
# Kill process di port 3333
sudo lsof -ti:3333 | xargs kill -9

# Atau ubah port di .env
PORT=3334
```

### Koneksi VPS TigerBeetle

Jika TigerBeetle di VPS, update `.env`:

```env
TB_REPLICA_ADDRESSES=VPS_IP_ADDRESS:3000
```

Pastikan firewall memperbolehkan port 3000:

```bash
# Di VPS
sudo ufw allow 3000
sudo ufw enable
```

### Module not found errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### BigInt Serialization Error

Sudah ditangani di `src/utils/serialization.js`. Jika masih error, pastikan Node.js versi terbaru:

```bash
node --version  # Harus v18+
```

---

## 📊 Monitoring & Logging

### View Application Logs

```bash
# Real-time logs
npm start

# Atau dengan PM2 (jika menggunakan PM2)
pm2 logs my-ledger-service
```

### Monitor TigerBeetle

```bash
# Lihat TigerBeetle status
systemctl status tigerbeetle

# View recent logs
journalctl -u tigerbeetle -n 100 -f
```

### Check System Resources

```bash
# CPU & Memory usage
htop

# Atau
top -p $(pidof tigerbeetle) $(pidof node)
```

---

## 🚀 Production Deployment

### Menggunakan PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start dengan PM2
pm2 start src/app.js --name "ledger-service"

# Autostart on reboot
pm2 startup
pm2 save
```

### Environment Production

```bash
# .env untuk production
NODE_ENV=production
PORT=3333
TB_CLUSTER_ID=0
TB_REPLICA_ADDRESSES=vps-ip:3000
```

### Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/ledger-service
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ledger-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📞 Support & Documentation

- **TigerBeetle Docs**: https://docs.tigerbeetle.com
- **Express.js**: https://expressjs.com
- **k6 Documentation**: https://k6.io/docs

---

## 📝 License

ISC

---

**Last Updated**: February 2026
