# Coding & Computational Thinking · Panel Interaktif

Versi digital lembar kerja buku *Unplugged Coding & Computational Thinking*,
dibuat untuk interactive flat panel (layar sentuh besar di kelas).

- Murni client-side: HTML, CSS, dan JavaScript biasa, tanpa build step, tanpa server, tanpa library.
- Bisa dihosting di Vercel atau hosting statis apa pun milik penerbit (cukup unggah isi folder ini).
- Setelah dibuka sekali lewat HTTPS, bisa dipakai tanpa internet (service worker `sw.js`).
- Tidak ada data anak yang dikirim atau disimpan di server.

## Alamat untuk QR di buku

Setiap lembar kerja punya ID yang sama dengan silabus (`kurikulum/silabus.md`).

| Alamat | Isi |
|---|---|
| `https://<situs>/#/<id>` | layar mulai aktivitas (pilih mode) |
| `#/<id>?mode=sendiri` | langsung main, satu papan |
| `#/<id>?mode=giliran-3` | 3 tim bergiliran di satu papan, poin per soal |
| `#/<id>?mode=lomba-2` | layar dibagi, 2 pemain berlomba pada soal yang sama |
| `#/<id>?mode=kreasi` / `pasangan` | mode khusus aktivitas |
| `#/?jenjang=paud` | daftar aktivitas satu jenjang |

Hash routing dipakai agar tautan tetap jalan di hosting statis mana pun tanpa aturan rewrite.

## Menjalankan secara lokal

```
python3 -m http.server 8080
```
lalu buka http://localhost:8080.

## Menambah aktivitas

1. Buat `js/activities/<id>.js` yang mengekspor objek:
   `id, title, topic, jenjang, age, icon, source, rounds, maxPlayers, goal, create(root, ctx)`,
   dan opsional `extraModes: [{ id, icon, label, desc, create }]`.
2. `create` menggambar soal ke dalam `root`. Pakai `ctx.rand` (acak dengan seed yang sama di semua panel),
   panggil `ctx.solved()` saat soal selesai (mengembalikan `true` bila masih ada soal berikutnya) dan
   `ctx.mistake()` saat salah. Mode Sendiri, Bergiliran, dan Berlomba ditangani `js/core/session.js`.
3. Daftarkan di `js/activities/registry.js` dan tambahkan berkasnya ke daftar `FILES` di `sw.js`
   (naikkan `VERSION`).

Ukuran di dalam aktivitas memakai satuan container (`cqmin`, `cqw`, `cqh`) agar tetap terbaca di 1–4 panel.

Komponen bersama yang bisa dipakai ulang:

- `js/core/kit.js`: soal pilihan (`choice`), seret-atau-ketuk (`dnd`), papan urutan (`orderBoard`).
- `js/core/peta.js`: peta kisi yang dijalankan dengan program panah (dipakai peta kampung `sda-03` dan `sda-07`).
- `js/core/kisi.js`: kisi warna yang bisa diwarnai (`paintGrid`) dan pemilih warna (`swatches`), dipakai aktivitas piksel dan anyaman SD Lanjut.
- `js/activities/bit-sum.js`: mesin bilangan biner (`sda-08` anak timbangan, `sdl-01` lampu gapura).

## Atribusi

Konsep sebagian aktivitas terinspirasi dari CS Unplugged (csunplugged.org), University of Canterbury.
Aktivitas dirancang ulang untuk kurikulum Indonesia.
