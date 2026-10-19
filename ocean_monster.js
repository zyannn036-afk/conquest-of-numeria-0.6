/* ===== Numeria Quest — Desain Monster Samudra / ocean (Ubur-ubur Rasio, Kepiting Akar, Hiu Eksponen, Kraken Tak Hingga) =====
   Dimuat PALING AKHIR (setelah ocean_sprites.js, yang berisi gambarnya, dibuat dari lembar bestiary).
   Tiap monster punya 3 gambar:  0 = diam (bernapas pelan, dibuat otomatis dari gambar 0),  2 = serang jarak dekat,  3 = spesial (serang jarak jauh)
   Monster yang terpengaruh (nama di game -> gambar), semuanya didefinisikan di ocean.js:
     jelly (Ubur-ubur Rasio) = Giant Jellyfish, shark (Hiu Eksponen) = Giant Shark,
     crab (Kepiting Akar) = Crab Monster,  kraken (Kraken Tak Hingga, bos selat) = Kraken.
   ---- UKURAN ----
   Di battle: tinggi BADAN monster = SETENGAH dari BDY (BDY arena = 420 -> 210 px). Diambil langsung dari BDY,
     jadi kalau ARENA.bdy di arena.js diubah, ukuran ikut berubah. Ubah BT_FRAC kalau mau pecahan lain.
   wt  : tinggi badan di DUNIA dalam petak.   fly : melayang di atas tanah (pecahan tinggi badan). */
(function () {
  if (typeof OCEAN_SPR === "undefined") return; // ocean_sprites.js belum dimuat
  const BT_FRAC = 0.5; // tinggi badan battle = BT_FRAC x BDY
  const CFG = {
    jelly: { wt: 1.8, fly: 0.08 },
    crab: { wt: 1.6, fly: 0 },
    shark: { wt: 2.2, fly: 0.04 },
    kraken: { wt: 3.0, fly: 0 },
  };
  const MAP = {
    jelly: { d: "jelly", base: "jelly" },
    crab: { d: "crab", base: "crab" },
    shark: { d: "shark", base: "shark" },
    kraken: { d: "kraken", base: "kraken" },
  };

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
        // 3 "frame" berbeda; dipakai game hanya sebagai penanda urutan frame (0, 1, 2)
        const m = SP[k + suf].m;
        SP[k + suf] = { ...SP[k + suf], a: [m.slice(), m.slice(), m.slice()] };
      }
      KIND[k + suf] = { d: MAP[k].d, big };
    });
  });

  /* ---------- gambar ke kanvas kecil (di-cache) ---------- */
  const IMG = {},
    CV = {};
  const imgOf = (d, i) => {
    const key = d + i;
    if (!IMG[key]) {
      const f = OCEAN_SPR[d].f[i];
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
    const im = imgOf(d, idx === 3 ? 2 : idx === 2 ? 1 : 0) || imgOf(d, 0);
    if (!ready(im)) return null;
    const { w, h } = OCEAN_SPR[d];
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    if (idx === 1) {
      // bernapas: bagian atas naik 1 piksel, dasar tetap
      const cut = Math.round(h * 0.75);
      g.drawImage(im, 0, 1, w, cut, 0, 0, w, cut);
      g.drawImage(im, 0, cut, w, h - cut, 0, cut, w, h - cut);
    } else g.drawImage(im, 0, 0);
    if (white) {
      g.globalCompositeOperation = "source-in"; // kilat putih saat terkena / aba-aba serangan
      g.fillStyle = "#fff";
      g.fillRect(0, 0, w, h);
    }
    return (CV[key] = c);
  };

  /* ---------- pembungkus spr(): monster ocean digambar dari sprite OCEAN_SPR ---------- */
  const _spr = spr;
  spr = function (k, x, y, s, al = 1, tint, fr = 0, fl = 0, mm) {
    const kd = KIND[k];
    if (!kd) return _spr(k, x, y, s, al, tint, fr, fl, mm);
    const D = OCEAN_SPR[kd.d],
      cfg = CFG[kd.d];
    let idx = 0,
      kz,
      vis,
      X,
      Y;
    if (kd.big) {
      // battle: dasar gambar di garis tanah, tinggi badan = BT_FRAC x BDY (setengah BDY)
      idx = Math.max(0, (SP[k].a || []).indexOf(mm)); // 0, 1 atau 2 dari script.js
      if (idx === 2 && typeof an !== "undefined" && an.rc > 0) idx = 3; // serang jarak jauh = gambar spesial
      vis = BT_FRAC * (typeof BDY === "number" && BDY > 0 ? BDY : 420);
      kz = vis / D.ih; // pembesaran gambar (210 / 70 = 3x -> piksel tetap tegas)
      X = x + (32 * s) / 2 - (D.w * kz) / 2;
      Y = y + 32 * s - D.h * kz - cfg.fly * vis;
    } else {
      // dunia: tinggi badan = wt petak; sedikit naik saat melangkah
      idx = fr ? 1 : 0;
      vis = cfg.wt * 16 * s;
      kz = vis / D.ih;
      X = x + 8 * s - (D.w * kz) / 2;
      Y = y + 15 * s - D.h * kz - cfg.fly * vis - (fr ? Math.round(s * 0.5) : 0);
    }
    const c = cvOf(kd.d, idx, !!tint);
    if (!c) return _spr(k, x, y, s, al, tint, fr, fl, mm); // gambar belum siap: pakai gambar lama sebentar
    const W = Math.round(D.w * kz),
      H = Math.round(D.h * kz);
    X = Math.round(X);
    Y = Math.round(Y);
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
})();
