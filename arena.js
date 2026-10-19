/* ===== Numeria Quest — Arena Battle Lebih Luas =====
   Dimuat PALING AKHIR (setelah naga.js). Tidak mengubah script.js: setBt() dibungkus.
   Kanvas ditampilkan memenuhi layar (object-fit: contain), jadi memperbesar ukuran logis arena
   membuat semua isinya (pemain, musuh) tampak lebih kecil dan ruang geraknya lebih lega.
   Bawaan lama: 640 x 360 (w 640, vh 300, bdy 60).  Rasio dijaga 16:9 agar tidak ada pita hitam.
   Garis tanah (GY) tetap di posisi yang sama pada layar: tanah ~2/3 tinggi kanvas, sisanya tertutup panel perintah.
   Ubah angka di bawah untuk mengatur: lebih besar = arena makin luas, karakter makin kecil.
     800x450 (bawaan di sini)  ·  960x540 (sangat luas) */
(function () {
  const ARENA = { w: 1280, vh: 300, bdy: 420 }; // tinggi total kanvas = vh + bdy (450 = 16:9 untuk w 800)
  globalThis.ARENA = ARENA; // dibaca monster_pixel.js (tinggi monster = ARENA.bdy / 2)
  const HERO_DY = -60; // koreksi: script.js menggambar hero di GY-120, padahal sprite setinggi 36 baris x 5 = 180px -> kaki tenggelam 60px. -60 = kaki tepat di garis tanah (sejajar monster)
  const HERO_HS = 5; // skala sprite player saat battle. Bawaan script.js = 5; makin kecil = player makin kecil (3 = sangat kecil)
  ARENA.heroDY = HERO_DY; // dibaca hero_pixel.js (koreksi posisi kaki hero)

  // Bungkus heroB: gambar dengan skala lebih kecil, tapi geser x,y supaya telapak kaki & tengah badan
  // tetap di titik yang sama seperti skala 5 (tidak melayang / bergeser). Posisi pedang/tongkat/busur
  // ikut mengecil karena dihitung dari skala yang sama.
  const _heroB = heroB;
  heroB = function (x, y, a, col, hs = 3) {
    if (hs !== 5) return _heroB(x, y, a, col, hs);
    // y + 36*(5-HERO_HS) menjaga telapak kaki tetap di tempat saat skala diperkecil
    return _heroB(x + 20 * (5 - HERO_HS), y + 36 * (5 - HERO_HS) + HERO_DY, a, col, HERO_HS);
  };

  const _setBt = setBt;
  setBt = function (v) {
    if (v === btOn) return;
    _setBt(v);
    if (!v) return; // keluar battle: ukuran dunia (480x270) sudah dipulihkan oleh setBt asli
    VW = ARENA.w;
    VH = ARENA.vh;
    BDY = ARENA.bdy;
    SC = typeof OUT_W === "number" ? OUT_W / VW : 1; // skala logis -> piksel kanvas (arena 1280 logis = 1:1 di kanvas 1280x720)
    cv.width = typeof OUT_W === "number" ? OUT_W : VW;
    cv.height = typeof OUT_H === "number" ? OUT_H : VH + BDY;
    silA.width = rimA.width = VW;
    silA.height = rimA.height = VH + BDY;
    ctx.imageSmoothingEnabled = false;
  };
})();
