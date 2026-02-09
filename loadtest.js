import http from 'k6/http';
import { check } from 'k6';

// KONFIGURASI BEBAN
export const options = {
  // Skenario: Naik pelan-pelan, tahan, lalu turun
  stages: [
    { duration: '5s', target: 50 },  // Naik ke 50 User dalam 5 detik
    { duration: '10s', target: 50 }, // Tahan 50 User selama 10 detik
    { duration: '5s', target: 0 },   // Turun ke 0
  ],
  // Atau pakai fixed VUs (Virtual Users) untuk hajar langsung
  // vus: 100,
  // duration: '10s',
};

export default function () {
  const url = 'http://localhost:3002/api/v1/transfers';
  
  // GANTI DENGAN ID YANG ANDA DAPAT TADI
  const DEBIT_ID = '189448446272267589831377658726411419675';
  const CREDIT_ID = '239845069173352372265889147526328241950';
  const TENANT_ID = '500';

  const payload = JSON.stringify({
    debit_account_id: DEBIT_ID,
    credit_account_id: CREDIT_ID,
    amount: 100 // Transfer 100 perak terus menerus
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
    },
  };

  // Kirim Request
  const res = http.post(url, payload, params);

  // Validasi: Harus 200 OK (Masuk Queue)
  check(res, {
    'is status 200': (r) => r.status === 200,
  });
}