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
import { sdaRumahNenek, sdaRuteSalah } from './kampung.js';
import sdaMotifBatik from './sda-01-motif-batik.js';
import sdaRumahAdat from './sda-02-rumah-adat.js';
import sdaResep from './sda-04-resep.js';
import sdaSenamPagi from './sda-05-senam-pagi.js';
import sdaJikaHujan from './sda-06-jika-hujan.js';
import sdaTabelHewan from './sda-10-tabel-hewan.js';
import sdaCariHalaman from './sda-11-cari-halaman.js';
import sdaBarisUpacara from './sda-12-baris-upacara.js';
import sdaTombolLift from './sda-13-tombol-lift.js';
import sdlPikselWarna from './sdl-02-piksel-warna.js';
import sdlSandiSenter from './sdl-03-sandi-senter.js';
import sdlHematKuota from './sdl-04-hemat-kuota.js';
import sdlAnyamanRusak from './sdl-05-anyaman-rusak.js';
import sdlKartuData from './sdl-06-kartu-data.js';
import sdlCariRumah from './sdl-07-cari-rumah.js';
import sdlRakBuku from './sdl-08-rak-buku.js';
import sdlRelKereta from './sdl-09-rel-kereta.js';
import sdlCariKata from './sdl-10-cari-kata.js';
import sdlGulaKurang from './sdl-11-gula-kurang.js';
import sdlKancil from './sdl-12-kancil.js';
import sdlKurirKampung from './sdl-13-kurir-kampung.js';
import sdlMerpatiPos from './sdl-14-merpati-pos.js';
import sdlMesinKantin from './sdl-15-mesin-kantin.js';
import sdlMesinCerdas from './sdl-16-mesin-cerdas.js';
import sdlLatihMesin from './sdl-17-latih-mesin.js';
import sdlDataPribadi from './sdl-18-data-pribadi.js';
import smpKartuPelajar from './smp-01-kartu-pelajar.js';
import smpKodeHuruf from './smp-02-kode-huruf.js';
import smpVideotron from './smp-03-videotron.js';
import smpLaguMampat from './smp-04-lagu-mampat.js';
import smpAngkaCek from './smp-05-angka-cek.js';
import smpTebakHuruf from './smp-06-tebak-huruf.js';
import smpKoperasi from './smp-07-koperasi.js';
import smpLoker from './smp-08-loker.js';
import smpKlasemen from './smp-09-klasemen.js';
import smpSalaman from './smp-10-salaman.js';
import smpGotongRoyong from './smp-11-gotong-royong.js';
import smpOjek from './smp-12-ojek.js';
import smpMejaBundar from './smp-13-meja-bundar.js';
import smpAmplopBerlapis from './smp-14-amplop-berlapis.js';
import smpKembalian from './smp-15-kembalian.js';
import smpGerbangTol from './smp-16-gerbang-tol.js';
import smpKomputerKertas from './smp-17-komputer-kertas.js';
import smpSandiGeser from './smp-18-sandi-geser.js';
import smpAplikasiJadwal from './smp-19-aplikasi-jadwal.js';
import smpPenyiram from './smp-20-penyiram.js';
import smpMesinPencari from './smp-21-mesin-pencari.js';
import smpPesanBerantai from './smp-22-pesan-berantai.js';
import smpJejakDigital from './smp-23-jejak-digital.js';
import smpDeepfake from './smp-24-deepfake.js';
import smpChatbot from './smp-25-chatbot.js';
import smaAksaraUnicode from './sma-01-aksara-unicode.js';
import smaKodeHemat from './sma-02-kode-hemat.js';
import smaAntreanTumpukan from './sma-03-antrean-tumpukan.js';
import smaPohonCari from './sma-04-pohon-cari.js';
import smaGudangBeras from './sma-05-gudang-beras.js';
import smaPendaftaran from './sma-06-pendaftaran.js';
import smaPangkatCepat from './sma-07-pangkat-cepat.js';
import smaPentasSeni from './sma-08-pentas-seni.js';
import smaKabelDusun from './sma-09-kabel-dusun.js';
import smaBagasi from './sma-10-bagasi.js';
import smaMudahDicek from './sma-11-mudah-dicek.js';
import smaKurirKeliling from './sma-12-kurir-keliling.js';
import smaJadwalUjian from './sma-13-jadwal-ujian.js';
import smaMenaraBts from './sma-14-menara-bts.js';
import smaPipaAir from './sma-15-pipa-air.js';
import smaKelasObjek from './sma-16-kelas-objek.js';
import smaPlatNomor from './sma-17-plat-nomor.js';
import smaSatuKoki from './sma-18-satu-koki.js';
import LabJaringan from './sma-19-lab-jaringan.js';
import KodeHttp from './sma-20-kode-http.js';
import SandiBerkunci from './sma-21-sandi-berkunci.js';
import ArisanJujur from './sma-22-arisan-jujur.js';
import KunciPublik from './sma-23-kunci-publik.js';
import BankSampah from './sma-24-bank-sampah.js';
import UjiTuring from './sma-25-uji-turing.js';
import SeleksiBeasiswa from './sma-26-seleksi-beasiswa.js';
import RancangPrompt from './sma-27-rancang-prompt.js';
import BacaLateral from './sma-28-baca-lateral.js';
import HakCipta from './sma-29-hak-cipta.js';
import Hidroponik from './sma-30-hidroponik.js';
import Mahadata from './sma-31-mahadata.js';
import PekerjaanKa from './sma-32-pekerjaan-ka.js';
import DuaLangkah from './sma-33-dua-langkah.js';
import BasisData from './sma-34-basis-data.js';
import DiagramAlir from './smp-26-diagram-alir.js';
import NilaiRapor from './smp-27-nilai-rapor.js';
import IuranKas from './smp-28-iuran-kas.js';
import TargetTabungan from './smp-29-target-tabungan.js';
import OngkosKirim from './smp-30-ongkos-kirim.js';
import SuhuSeminggu from './smp-31-suhu-seminggu.js';
import MesinKonversi from './smp-32-mesin-konversi.js';
import OlahTeks from './smp-33-olah-teks.js';
import UjiProgram from './smp-34-uji-program.js';
import KodeGelembung from './smp-35-kode-gelembung.js';
import CariBinerKode from './smp-36-cari-biner-kode.js';
import SimulasiDadu from './smp-37-simulasi-dadu.js';
import BlokKeTeks from './smp-38-blok-ke-teks.js';
import MenaraHanoi from './smp-39-menara-hanoi.js';
import LampuOtomatis from './smp-40-lampu-otomatis.js';
import UlarTangga from './smp-41-ular-tangga.js';
import AplikasiKantin from './smp-42-aplikasi-kantin.js';
import PythonKasir from './sma-35-python-kasir.js';
import RekapBazar from './sma-36-rekap-bazar.js';
import DataLomba from './sma-37-data-lomba.js';
import FungsiLingkup from './sma-38-fungsi-lingkup.js';
import RekursiMemo from './sma-39-rekursi-memo.js';
import RimaPantun from './sma-40-rima-pantun.js';
import KasusUji from './sma-41-kasus-uji.js';
import PesanGalat from './sma-42-pesan-galat.js';
import PercepatKode from './sma-43-percepat-kode.js';
import UrutCariKode from './sma-44-urut-cari-kode.js';

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
  sdaMotifBatik, sdaRumahAdat, sdaRumahNenek, sdaResep, sdaSenamPagi, sdaJikaHujan, sdaRuteSalah, sdaTimbangan, sdaGambarRahasia, sdaTabelHewan, sdaCariHalaman, sdaBarisUpacara, sdaTombolLift,
  sdlLampuGapura, sdlPikselWarna, sdlSandiSenter, sdlHematKuota, sdlAnyamanRusak, sdlKartuData, sdlCariRumah, sdlRakBuku, sdlRelKereta, sdlCariKata, sdlGulaKurang, sdlKancil, sdlKurirKampung, sdlMerpatiPos, sdlMesinKantin, sdlMesinCerdas, sdlLatihMesin, sdlDataPribadi,
  smpKartuPelajar, smpKodeHuruf, smpVideotron, smpLaguMampat, smpAngkaCek, smpTebakHuruf, smpKoperasi, smpLoker, smpKlasemen, smpSalaman, smpGotongRoyong, smpOjek,
  smpMejaBundar, smpAmplopBerlapis, smpKembalian, smpGerbangTol, smpKomputerKertas, smpSandiGeser, smpAplikasiJadwal, smpPenyiram, smpMesinPencari, smpPesanBerantai,
  smpJejakDigital, smpDeepfake, smpChatbot,
  smaAksaraUnicode, smaKodeHemat, smaAntreanTumpukan, smaPohonCari, smaGudangBeras, smaPendaftaran, smaPangkatCepat, smaPentasSeni, smaKabelDusun, smaBagasi, smaMudahDicek,
  smaKurirKeliling, smaJadwalUjian, smaMenaraBts, smaPipaAir, smaKelasObjek, smaPlatNomor, smaSatuKoki, LabJaringan, KodeHttp, SandiBerkunci, ArisanJujur, KunciPublik,
  BankSampah,
  UjiTuring,
  SeleksiBeasiswa,
  RancangPrompt,
  BacaLateral,
  HakCipta,
  Hidroponik,
  Mahadata,
  PekerjaanKa,
  DuaLangkah,
  BasisData,
  DiagramAlir,
  NilaiRapor,
  IuranKas,
  TargetTabungan,
  OngkosKirim,
  SuhuSeminggu,
  MesinKonversi,
  OlahTeks,
  UjiProgram,
  KodeGelembung,
  CariBinerKode,
  SimulasiDadu,
  BlokKeTeks,
  MenaraHanoi,
  LampuOtomatis,
  UlarTangga,
  AplikasiKantin,
  PythonKasir,
  RekapBazar,
  DataLomba,
  FungsiLingkup,
  RekursiMemo,
  RimaPantun,
  KasusUji,
  PesanGalat,
  PercepatKode,
  UrutCariKode,
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
