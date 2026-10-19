/* ===== Numeria Quest — Desain Monster Utara (Gargoyle 1 & 2, Elang, Golem, Roh Angin, Patung Surgawi, Ent Kuno) =====
   Dimuat PALING AKHIR (setelah utara_sprites.js, yang berisi gambarnya).
   Sama seperti rubah.js: tiap gambar berukuran 96x128 piksel (rasio 3:4) dengan garis tepi gelap 1 piksel.
   Tiap monster punya 3 gambar:
     0 = diam (bernapas pelan, dibuat otomatis dari gambar 0),  2 = serang jarak dekat,  3 = spesial (dipakai saat serang jarak jauh)
   Monster yang terpengaruh (nama di game -> gambar):
     gargoyle1 (Gargoyle Penjaga Jalur I), gargoyle2 (Jalur II), stormeagle (Elang Petir), lavagolem (Golem Magma = golem api),
     entkuno (Ent Kuno), windspirit (Roh Angin, Aeria), seraphstatue (Patung Penjaga Surgawi, Aeria), thundergolem (Golem Petir/Cahaya, Aeria),
     golem_water / golem_earth / golem_wind / golem_lightning / golem_ice / golem_shadow (golem elemen lain, siap dipakai).
   ---- CARA MENGATUR UKURAN (ubah angka di CFG di bawah) ----
   bt  : tinggi BADAN monster saat battle, dalam piksel per satuan skala musuh (s). Contoh: s=4 dan bt=54 -> badan setinggi 216 px.
         Semakin besar angkanya, semakin besar monster di battle. (Dibatasi MAX_VIS supaya kepala tidak terpotong di atas layar.)
   wt  : tinggi badan monster di DUNIA, dalam satuan petak. 1 = setinggi 1 petak, 2.4 = 2,4 petak (sekitar 1,6x tinggi pemain).
   fly : melayang di atas tanah, pecahan dari tinggi badan (0 = menapak tanah, 0.1 = melayang sepersepuluh tinggi badan). */
(function () {
  // Ukuran battle monster besar = 2x tinggi pemain.
  // Kanvas battle 1280x720 (arena.js: vh 300 + bdy 420). Pemain digambar setinggi 36 baris x HERO_HS (5) = 180 px.
  // Kalau HERO_HS di arena.js diubah, sesuaikan PLAYER_PX (= 36 x HERO_HS).
  const PLAYER_PX = 180,
    BIG_X = 2,
    BIG = (PLAYER_PX * BIG_X) / 4; // bt per skala musuh (s = 4) -> badan setinggi 360 px
  const MAX_VIS = 440; // tinggi badan maksimal di battle (px); tanah ~480 dari atas kanvas 720
  const CFG = {
    gargoyle1: { bt: BIG, wt: 2.4, fly: 0 },
    gargoyle2: { bt: BIG, wt: 2.4, fly: 0 },
    celestial: { bt: BIG, wt: 2.8, fly: 0.03 },
    elang: { bt: BIG, wt: 2.0, fly: 0.12 },
    windspirit: { bt: BIG, wt: 2.2, fly: 0.06 },
    entkuno: { bt: BIG, wt: 2.8, fly: 0 },
    golem_fire: { bt: BIG, wt: 2.4, fly: 0 },
    golem_water: { bt: BIG, wt: 2.4, fly: 0 },
    golem_earth: { bt: BIG, wt: 2.4, fly: 0 },
    golem_wind: { bt: BIG, wt: 2.4, fly: 0 },
    golem_lightning: { bt: BIG, wt: 2.4, fly: 0 },
    golem_ice: { bt: BIG, wt: 2.4, fly: 0 },
    golem_shadow: { bt: BIG, wt: 2.4, fly: 0 },
  };
  // nama monster di game -> nama gambar di utara_sprites.js ; base = gambar kecil lama sebagai cadangan
  const MAP = {
    gargoyle1: { d: "gargoyle1", base: "gargoyle" },
    gargoyle2: { d: "gargoyle2", base: "gargoyle" },
    stormeagle: { d: "elang", base: "owl" },
    lavagolem: { d: "golem_fire", base: "golem" },
    entkuno: { d: "entkuno", base: "ent" },
    windspirit: { d: "windspirit", base: "pixie" }, // Roh Angin Sudut (Kota Langit Aeria)
    thundergolem: { d: "golem_lightning", base: "golem" }, // Golem Petir/Cahaya (Aeria)
    seraphstatue: { d: "celestial", base: "gargoyle" }, // Patung Penjaga Surgawi (Aeria)
    golem_water: { d: "golem_water", base: "golem" },
    golem_earth: { d: "golem_earth", base: "golem" },
    golem_wind: { d: "golem_wind", base: "golem" },
    golem_lightning: { d: "golem_lightning", base: "golem" },
    golem_ice: { d: "golem_ice", base: "golem" },
    golem_shadow: { d: "golem_shadow", base: "golem" },
  };
  if (typeof UTARA_SPR === "undefined") return; // utara_sprites.js belum dimuat

  /* ---------- daftarkan nama sprite ke SP (supaya kode lama tetap jalan) ---------- */
  const KIND = {};
  Object.keys(MAP).forEach((k) => {
    const b = MAP[k].base;
    [
      ["", false],
      ["L", true],
    ].forEach(([suf, big]) => {
      if (!SP[k + suf]) {
        const src = SP[b + suf] || SP["golem" + suf] || SP["fox" + suf];
        if (src) SP[k + suf] = { ...src };
      }
      if (big && SP[k + suf]) {
        // 3 "frame" kosong yang berbeda; dipakai game hanya sebagai penanda urutan frame (0, 1, 2)
        const m = SP[k + suf].m;
        SP[k + suf] = { ...SP[k + suf], a: [m.slice(), m.slice(), m.slice()] };
      }
      KIND[k + suf] = { d: MAP[k].d, big };
    });
  });

  /* ---------- gambar ke kanvas kecil (di-cache), lalu cukup 1x drawImage per frame ---------- */
  const IMG = {},
    CV = {};
  const imgOf = (d, i) => {
    const key = d + i;
    if (!IMG[key]) {
      const f = UTARA_SPR[d].f[i];
      if (!f) return null;
      const im = new Image();
      im.src = f;
      IMG[key] = im;
    }
    return IMG[key];
  };
  const ready = (im) => im && im.complete && im.naturalWidth > 0;
  // idx: 0 diam, 1 bernapas, 2 serang dekat, 3 spesial
  const cvOf = (d, idx, white) => {
    const key = d + idx + (white ? "w" : "n");
    if (CV[key]) return CV[key];
    let im = imgOf(d, idx === 3 ? 2 : idx === 2 ? 1 : 0) || imgOf(d, 0);
    if (!ready(im)) return null; // gambar belum selesai dimuat
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 128;
    const g = c.getContext("2d");
    if (idx === 1) {
      // bernapas: badan bagian atas naik 1 piksel, kaki tetap
      g.drawImage(im, 0, 1, 96, 96, 0, 0, 96, 96);
      g.drawImage(im, 0, 96, 96, 32, 0, 96, 96, 32);
    } else g.drawImage(im, 0, 0);
    if (white) {
      g.globalCompositeOperation = "source-in"; // kilat putih saat terkena / aba-aba serangan
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 96, 128);
    }
    return (CV[key] = c);
  };

  /* ---------- pembungkus spr(): monster utara digambar dari sprite 96x128 ---------- */
  const _spr = spr;
  spr = function (k, x, y, s, al = 1, tint, fr = 0, fl = 0, mm) {
    const kd = KIND[k];
    if (!kd) return _spr(k, x, y, s, al, tint, fr, fl, mm);
    const D = UTARA_SPR[kd.d],
      cfg = CFG[kd.d];
    let idx = 0,
      H,
      W,
      X,
      Y;
    if (kd.big) {
      // battle: kaki di garis tanah, tinggi badan = bt * s (dibatasi MAX_VIS)
      idx = Math.max(0, (SP[k].a || []).indexOf(mm)); // 0, 1 atau 2 dari script.js
      if (idx === 2 && typeof an !== "undefined" && an.rc > 0) idx = 3; // serang jarak jauh = gambar spesial
      const vis = Math.min(cfg.bt * s, MAX_VIS),
        sc = idx === 2 ? D.sc[1] : idx === 3 ? D.sc[2] : 1;
      H = (vis / D.fr) * sc;
      W = H * 0.75;
      X = x + (32 * s) / 2 - W / 2;
      Y = y + 32 * s - H - cfg.fly * vis + H / 64;
    } else {
      // dunia: tinggi badan = wt petak; sedikit naik saat melangkah
      idx = fr ? 1 : 0;
      const vis = cfg.wt * 16 * s;
      H = vis / D.fr;
      W = H * 0.75;
      X = x + 8 * s - W / 2;
      Y =
        y +
        15 * s -
        H -
        cfg.fly * vis +
        H / 64 -
        (fr ? Math.round(s * 0.5) : 0);
    }
    const c = cvOf(kd.d, idx, !!tint);
    if (!c) return _spr(k, x, y, s, al, tint, fr, fl, mm); // gambar belum siap: pakai gambar lama sebentar
    X = Math.round(X);
    Y = Math.round(Y);
    W = Math.round(W);
    H = Math.round(H);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = al;
    ctx.save();
    if (fl) {
      ctx.translate(X + W / 2, 0);
      ctx.scale(-1, 1);
      ctx.translate(-(X + W / 2), 0);
    }
    ctx.drawImage(c, X, Y, W, H);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = sm;
  };

  /* Roh Angin, Golem Petir (cahaya) dan Patung Penjaga Surgawi hidup di Kota Langit Aeria (langit_laut.js).
     Monsternya sudah didaftarkan di sana; file ini hanya memberi gambar 96x128 lewat MAP di atas. */
})();
