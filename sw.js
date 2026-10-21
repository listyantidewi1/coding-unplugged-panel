// Offline support: cache the app shell so a panel keeps working when the
// school network drops. Bump VERSION whenever files change.
const VERSION = 'cu-v6';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icons/icon.svg',
  'css/app.css',
  'js/app.js',
  'js/core/util.js',
  'js/core/sound.js',
  'js/core/session.js',
  'js/core/kit.js',
  'js/core/peta.js',
  'js/core/kisi.js',
  'js/activities/registry.js',
  'js/activities/paud-01-pola.js',
  'js/activities/paud-02-kelompok.js',
  'js/activities/urutan.js',
  'js/activities/ayam.js',
  'js/activities/paud-06-gerak-ulang.js',
  'js/activities/paud-07-jika-lampu.js',
  'js/activities/paud-09-ya-tidak.js',
  'js/activities/paud-10-tombol.js',
  'js/activities/sda-09-gambar-rahasia.js',
  'js/activities/bit-sum.js',
  'js/activities/kampung.js',
  'js/activities/sda-01-motif-batik.js',
  'js/activities/sda-02-rumah-adat.js',
  'js/activities/sda-04-resep.js',
  'js/activities/sda-05-senam-pagi.js',
  'js/activities/sda-06-jika-hujan.js',
  'js/activities/sda-10-tabel-hewan.js',
  'js/activities/sda-11-cari-halaman.js',
  'js/activities/sda-12-baris-upacara.js',
  'js/activities/sda-13-tombol-lift.js',
  'js/activities/sdl-02-piksel-warna.js',
  'js/activities/sdl-03-sandi-senter.js',
  'js/activities/sdl-04-hemat-kuota.js',
  'js/activities/sdl-05-anyaman-rusak.js',
  'js/activities/sdl-06-kartu-data.js',
  'js/activities/sdl-07-cari-rumah.js',
  'js/activities/sdl-08-rak-buku.js',
  'js/activities/sdl-09-rel-kereta.js',
  'js/activities/sdl-10-cari-kata.js',
  'js/activities/sdl-11-gula-kurang.js',
  'js/activities/sdl-12-kancil.js',
  'js/activities/sdl-13-kurir-kampung.js',
  'js/activities/sdl-14-merpati-pos.js',
  'js/activities/sdl-15-mesin-kantin.js',
  'js/activities/sdl-16-mesin-cerdas.js',
  'js/activities/sdl-17-latih-mesin.js',
  'js/activities/sdl-18-data-pribadi.js',
  'js/activities/smp-01-kartu-pelajar.js',
  'js/activities/smp-02-kode-huruf.js',
  'js/activities/smp-03-videotron.js',
  'js/activities/smp-04-lagu-mampat.js',
  'js/activities/smp-05-angka-cek.js',
  'js/activities/smp-06-tebak-huruf.js',
  'js/activities/smp-07-koperasi.js',
  'js/activities/smp-08-loker.js',
  'js/activities/smp-09-klasemen.js',
  'js/activities/smp-10-salaman.js',
  'js/activities/smp-11-gotong-royong.js',
  'js/activities/smp-12-ojek.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Network first so updates show up, cache as fallback when offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
