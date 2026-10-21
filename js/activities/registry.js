// Every activity in the book. The id must match the worksheet id in the
// syllabus (kurikulum/silabus.md) and in the QR code printed on the
// worksheet, so scanning a worksheet opens its activity: <site>/#/<id>

import paudPola from './paud-01-pola.js';
import paudKelompok from './paud-02-kelompok.js';
import { paudLangkah, paudKacangHijau } from './urutan.js';
import { paudAntarAyam, paudAyamTersesat } from './ayam.js';
import paudGerakUlang from './paud-06-gerak-ulang.js';
import paudJikaLampu from './paud-07-jika-lampu.js';
import paudYaTidak from './paud-09-ya-tidak.js';
import paudTombol from './paud-10-tombol.js';
import sdaGambarRahasia from './sda-09-gambar-rahasia.js';
import { sdaTimbangan, sdlLampuGapura } from './bit-sum.js';

export const JENJANG = [
  { id: 'paud', label: 'PAUD', detail: '4–6 tahun' },
  { id: 'sd-awal', label: 'SD Awal', detail: '7–9 tahun' },
  { id: 'sd-lanjut', label: 'SD Lanjut', detail: '10–12 tahun' },
  { id: 'smp', label: 'SMP', detail: '13–15 tahun' },
  { id: 'sma', label: 'SMA/SMK', detail: '16–18 tahun' },
];

const order = (a) => JENJANG.findIndex((j) => j.id === a.jenjang);

export const activities = [
  paudPola, paudKelompok, paudLangkah, paudAntarAyam, paudKacangHijau,
  paudGerakUlang, paudJikaLampu, paudAyamTersesat, paudYaTidak, paudTombol,
  sdaTimbangan, sdaGambarRahasia,
  sdlLampuGapura,
]
  .sort((a, b) => order(a) - order(b) || a.id.localeCompare(b.id));

// Old ids that should keep working if a worksheet id is renamed after printing.
const ALIASES = {
  'pola-berulang': 'paud-01-pola',
  'gambar-biner': 'sda-09-gambar-rahasia',
  'kartu-biner': 'sdl-01-lampu-gapura',
  'sdl-01-biner': 'sdl-01-lampu-gapura',
  'sda-08-kartu-titik': 'sda-08-timbangan',
};

export function findActivity(id) {
  const real = ALIASES[id] || id;
  return activities.find((a) => a.id === real);
}
