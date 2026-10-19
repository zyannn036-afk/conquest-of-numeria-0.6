/* ===== Numeria Quest — efek skill DASAR bergaya katalog pixel art =====
   Dimuat PALING AKHIR (setelah equip_katalog.js). Semua skill DASAR (TANPA elemen):

   PENDEKAR PEDANG
   - Tebasan Kuat (id "pow")  -> "Slash"        : gelombang sabit merah meluncur + sabit besar saat mendarat
   - Dash Tembus  (id "pen")  -> "Dash Attack"  : garis kecepatan merah + sabit raksasa & tusukan putih panas
   - Lompat Dash  (id "crt")  -> "Jump Slash"   : jejak melompat + sabit diagonal jatuh + gelombang tanah
   - Pedang Pelangi (ulti)    -> "Excalibur"    : pilar cahaya emas berderet + pilar raksasa bersayap api

   PEMANAH (BARU)
   - skill 1 (id "shot")  -> "Arrow Shot (3 Arrow)" : 3 panah menyebar, ledakan sinar saat kena
   - skill 2 (id "multi") -> "Rain of Arrows"      : panah emas jatuh dari langit, menancap + tiang cahaya
   - skill 3 (id "giant") -> "Giant Arrow"         : panah raksasa berekor api + bola api saat kena
   - ulti               -> "Arrow Storm"          : hujan panah emas + ledakan sinar bintang
   Urutan skill pemanah ada di ARC_ID (bagian PEMANAH) kalau ingin ditukar.

   UKURAN: semua efek (termasuk bola cahaya pengumpul tenaga & ledakan hantam) dibuat LEBIH TINGGI dari karakter hero. Tinggi sasaran = tinggi hero x CFG.tall
   (bawaan 1,35). Tinggi hero dihitung dari sprite (122 baris x 5 x skala hero). Kalau mau lebih kecil / besar,
   ubah angka di CFG (mis. SKFX.cfg.tall = 1.6 dari konsol browser untuk mencoba langsung).

   Efek digambar procedural ke kanvas kecil (1 "sel" = PX satuan logis) lalu diperbesar tanpa smoothing,
   jadi tampilannya blok-blok piksel seperti di gambar referensi. Tidak ada gambar yang perlu dimuat.
   PENYIHIR: skill 1/2/3 = Magic Circle / Fireball / Beam, ulti = Explosion (ledakan raksasa >= 62% tinggi arena).
   PEMANAH elemen: api = panah berekor api + ledakan bola api, es = panah es + efek es penyihir (tiang es & membeku), petir = panah listrik + petir menyambar dari langit.
   PEDANG elemen: api = Fire Slash + ledakan, es = 3 Ice Swords (bentuk Heavenly Swords), petir = dash + Thunder Slash + petir (lihat bagian PENDEKAR PEDANG — skill ELEMEN).
   Sihir elemen: Kegelapan = Black Hole, Cahaya = Heavenly Swords (arena bergetar lewat an.se), Es = Hujan Es (lihat bagian PENYIHIR — sihir elemen). */
const SKFX = (() => {
  const PX = 3, // 1 sel seni = 3 satuan logis
    N = 80, // kanvas kerja N x N sel
    C0 = N / 2;
  const CFG = { tall: 1.35, heroRows: 122, swSlash: 1.3, swDash: 1, excH: 1.5, excW: 1.7, excBeam: 1, excBurst: 1, excLunge: 30, excRaise: 1, excGuardUp: 5, excGrip: 13 }; // ULTI Excalibur: excRaise = 1 hero mengangkat pedang ke atas (0 = pose lama), excGuardUp = tinggi pelindung bilah di atas kepalan (px), excGrip = panjang gagang yang terlihat (px), excH = ukuran pedang raksasa, excW = lebar pilar & lingkaran langit, excBeam = tebal sinar, excBurst = ukuran ledakan bintang, excLunge = jarak hero maju saat menembak // swSlash: pengali ukuran tebasan elemen pedang; swDash: pengali jarak dash petir
  /* jarak antar 3 panah Arrow Shot (x tinggi efek): 3 panah berderet setinggi ~0,8 x efek, jadi barisnya melewati kepala hero */
  const SPREAD = 0.36;
  const ARW = 2.0; // skala sprite panah Arrow Shot (kepala panah ~72 px, 3 baris panah total ~ 1 x tinggi efek)
  const cv = document.createElement("canvas");
  cv.width = cv.height = N;
  const g = cv.getContext("2d");
  g.imageSmoothingEnabled = false;

  /* palet merah-bara ala katalog: gelap -> terang */
  const PAL = ["#4a0626", "#a8102e", "#ff3a2e", "#ff8a3a", "#ffd47a", "#ffffff"];
  const SPARK = ["#ff3a2e", "#ff8a3a", "#ffd47a", "#ffffff"];
  /* palet emas (Excalibur, panah emas) gelap -> terang */
  const GOLD = ["#5a2200", "#b5530a", "#ff9a1a", "#ffd24a", "#fff0a8", "#ffffff"];
  const SPARKG = ["#ff9a1a", "#ffd24a", "#fff0a8", "#ffffff"];
  /* palet biru-es keputihan (Arrow Shot) gelap -> terang */
  const CY = ["#06223f", "#1767c2", "#3fb4ff", "#aeeeff", "#ffffff"];
  const SPARKC = ["#3fb4ff", "#aeeeff", "#ffffff", "#ffffff"];
  /* palet petir kuning-putih (Panah Petir) gelap -> terang */
  const BOL = ["#4a3a00", "#a68a10", "#ffe14d", "#fff3a0", "#ffffff", "#ffffff"];
  const SPARKB = ["#ffe14d", "#fff3a0", "#ffffff", "#7cf0ff"];
  const srnd = (n) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease3 = (k) => 1 - (1 - clampN(k, 0, 1)) ** 3;

  /* ---------- ukuran efek relatif terhadap tinggi hero ---------- */
  const heroH = () => CFG.heroRows * 5 * (typeof KRK_SEJ_SKALA === "number" ? KRK_SEJ_SKALA : 0.3);
  const topY = () => (typeof BDY === "number" ? BDY : 0);
  /* tinggi efek utama; dibatasi supaya tidak lebih tinggi dari ruang yang tampil di layar */
  const effH = () => Math.min(heroH() * CFG.tall, GY + topY() + 14);
  /* tinggi LEDAKAN RAKSASA ulti penyihir: minimal 62% dari seluruh tinggi arena (GY + BDY), jadi selalu > setengah BDY & > setengah layar */
  const ultH = () => Math.min(Math.max(effH() * 1.55, (GY + topY()) * 0.62), GY + topY() + 14);
  /* titik tengah vertikal efek setinggi h: dasar efek sedikit di bawah garis tanah */
  const yc = (h) => GY + 10 - h / 2;
  /* efek kecil/sekunder sedikit lebih rendah dari yang utama, tapi tetap di atas tinggi hero */
  const bk = (b) => 0.96 + 0.04 * clampN((b - 0.7) / 0.45, 0, 1);
  /* jalankan fn() dengan koordinat diperbesar f; titik (px,py) dipindah ke (qx,qy) */
  const warp = (px, py, qx, qy, f, fn) => {
    ctx.save();
    ctx.translate(qx, qy);
    ctx.scale(f, f);
    ctx.translate(-px, -py);
    fn();
    ctx.restore();
  };

  /* sabit: lingkar luar radius R (cembung ke kanan), ujung di sudut ±A; d = ketebalan (makin besar makin tebal) */
  function cres(R, A, d, col) {
    const tx = R * Math.cos(A),
      ty = R * Math.sin(A),
      Ri = Math.hypot(tx + d, ty),
      ai = Math.atan2(ty, tx + d);
    g.fillStyle = col;
    g.beginPath();
    g.arc(0, 0, R, -A, A, false);
    g.arc(-d, 0, Ri, ai, -ai, true);
    g.closePath();
    g.fill();
  }
  /* sabit berlapis: tepi cembung paling terang (putih panas), sisi dalam merah tua */
  function cresStack(R, A, thick, heat, pal = PAL) {
    const L = [
      [pal[0], 1.0, 1.0],
      [pal[1], 0.96, 0.72],
      [pal[2], 0.92, 0.5],
      [pal[3], 0.88, 0.32],
      [pal[4], 0.84, 0.18],
      [pal[5], 0.78, 0.08],
    ];
    g.save();
    g.translate(-R * 0.6, 0); // pusat visual sabit (bukan pusat lingkarannya) ada di titik (0,0)
    L.forEach(([col, ka, kd], i) => {
      if (i > 1 + heat) return; // heat 0..4: berapa lapis terang yang ikut tergambar
      cres(R, A * ka, R * thick * kd, col);
    });
    g.restore();
  }
  /* tinggi vertikal sabit (satuan logis, skala 1) setelah diputar rot / dicermin flip, + titik tengahnya */
  function cresV(R, A, thick, rot, flip) {
    const d = R * thick,
      tx = R * Math.cos(A),
      ty = R * Math.sin(A),
      Ri = Math.hypot(tx + d, ty),
      ai = Math.atan2(ty, tx + d),
      sn = Math.sin(rot),
      cs = Math.cos(rot);
    let lo = 1e9,
      hi = -1e9;
    const add = (x, y) => {
      x -= R * 0.6;
      if (flip) x = -x;
      const yy = x * sn + y * cs;
      if (yy < lo) lo = yy;
      if (yy > hi) hi = yy;
    };
    for (let i = 0; i <= 20; i++) {
      const a = -A + (2 * A * i) / 20,
        b = -ai + (2 * ai * i) / 20;
      add(R * Math.cos(a), R * Math.sin(a));
      add(-d + Ri * Math.cos(b), Ri * Math.sin(b));
    }
    return { h: (hi - lo) * PX, mid: ((hi + lo) / 2) * PX };
  }

  /* tempel kanvas kerja ke kanvas game: pusat (x,y), putar rot, flip, skala s, alpha, cahaya shadow */
  function blit(x, y, rot, flip, s, alpha, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(flip ? -s : s, s);
    ctx.globalAlpha = clampN(alpha, 0, 1);
    ctx.imageSmoothingEnabled = false;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 16 * SC;
    }
    ctx.drawImage(cv, -C0 * PX, -C0 * PX, N * PX, N * PX);
    ctx.restore();
  }
  const clear = () => {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, N, N);
    g.setTransform(1, 0, 0, 1, C0, C0);
  };
  const sq = (x, y, w, h, c, a = 1) => {
    ctx.globalAlpha = clampN(a, 0, 1);
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
    ctx.globalAlpha = 1;
  };
  const flashAt = (x, y, r, a, c0 = "rgba(255,255,255,.9)", c1 = "rgba(255,170,120,.45)", c2 = "rgba(255,120,80,0)") => {
    const fg = ctx.createRadialGradient(x, y, 0, x, y, r);
    fg.addColorStop(0, c0);
    fg.addColorStop(0.45, c1);
    fg.addColorStop(1, c2);
    ctx.save();
    ctx.globalAlpha = clampN(a, 0, 1);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.283);
    ctx.fill();
    ctx.restore();
  };

  /* percikan bara menyebar dari titik hantam (dipanggil di dalam warp, jadi ikut membesar) */
  function sparks(x, y, t, n, spread) {
    if (rm || t > 16) return;
    for (let i = 0; i < n; i++) {
      const ang = i * 2.399 + 0.3,
        sp = (0.35 + ((i * 7) % 5) * 0.16) * spread,
        e = 1 - (1 - Math.min(1, t / 12)) ** 2,
        px = x + Math.cos(ang) * sp * e,
        py = y + Math.sin(ang) * sp * e * 0.8 + t * t * 0.07,
        z = i % 3 === 0 ? 4 : 3;
      sq(px, py, z, z, SPARK[i % 4], 1 - t / 16);
    }
  }

  /* =====================================================================
     PEDANG — Slash
     ===================================================================== */

  /* gelombang sabit yang meluncur (frame 3-4 di katalog); x,y = posisi gelombang di lintasannya */
  function wave(x, y, tn, pal = PAL, spk = SPARK, glow = "#ff3a2e") {
    if (rm) return;
    const H = effH(),
      v = cresV(16, 1.1, 1.15, 0, 0),
      f = H / v.h,
      Y = yc(H) - v.mid * f,
      fl = tn % 2 ? 1 : 0.94;
    clear();
    g.save();
    cresStack(16, 1.1, 1.15, 4, pal);
    g.restore();
    warp(x, y, x, Y, f, () => {
      blit(x, y, 0, 0, fl, 1, glow);
      // garis kecepatan tipis di belakang sabit
      for (let j = -1; j <= 1; j++) {
        const l = 34 + ((tn * 7 + j * 13) % 26);
        sq(x - 16 - l, y + j * 15, l, 2, pal[3], 0.55);
        sq(x - 16 - l * 0.6, y + j * 15, l * 0.6, 1, pal[5], 0.8);
      }
    });
    // ekor percikan bara di belakang gelombang
    for (let j = 0; j < 3; j++)
      an.pt.push({
        x: x - 12 * f * 0.6,
        y: Y + R(-26, 26) * f,
        vx: -1.2 - Math.random() * 2.4,
        vy: (Math.random() - 0.5) * 1.4,
        l: 18,
        c: P(spk),
      });
  }

  /* sabit besar saat mendarat (frame 4 di katalog). s.t = 0..17, s.big = skala, s.rot = kemiringan, s.flip = cermin */
  function hit(s) {
    const t = s.t,
      k = t / 16,
      grow = ease3(t / 6), // melebar cepat lalu melambat
      sc = 0.6 + 0.4 * grow,
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9),
      H = effH() * bk(s.big),
      v = cresV(16, 1.3, 1.0, s.rot, s.flip),
      f = H / v.h,
      Y = yc(H) - v.mid * f;
    clear();
    g.save();
    // ujung sabit memanjang saat melebar
    cresStack(16, 0.95 + 0.35 * grow, 1.1 - 0.3 * k, t < 10 ? 4 : 3);
    g.restore();
    warp(s.x, s.y, s.x, Y, f, () => {
      blit(s.x, s.y, s.rot, s.flip, sc, alpha, "#ff5a2e");
      if (t < 4) flashAt(s.x, s.y, 48, 1 - t / 4); // kilat putih sesaat di awal
      sparks(s.x, s.y, t, 16, 70);
    });
  }

  /* =====================================================================
     PEDANG — Dash Attack
     ===================================================================== */

  /* garis kecepatan merah di belakang pemain; seluruh barisnya setinggi efek (frame 2-3 di katalog) */
  function dashTrail(x, y, tn, T, spk) {
    if (rm) return;
    const H = effH(),
      n = 7,
      top = yc(H) - H / 2,
      step = (H - 14) / (n - 1);
    for (let i = 0; i < n; i++) {
      const dy = top + 7 + i * step,
        mid = i === 3,
        len = (70 + ((i * 29 + tn * 11) % 70) + (mid ? 40 : 0)) * 1.7,
        th = (mid ? 6 : i % 2 ? 3 : 4) * 2.4,
        x0 = x - len,
        gr = ctx.createLinearGradient(x0, 0, x, 0);
      gr.addColorStop(0, T ? T[0] : "rgba(168,16,46,0)");
      gr.addColorStop(0.55, T ? T[1] : "rgba(255,58,46,.75)");
      gr.addColorStop(1, T ? T[2] : "rgba(255,138,58,.95)");
      ctx.fillStyle = gr;
      ctx.fillRect(x0, dy - th / 2, len, th);
      const l2 = len * 0.45;
      ctx.fillStyle = "rgba(255,244,214,.95)";
      ctx.fillRect(x - l2, dy - 1.2, l2, 2.4);
    }
    // pecahan bara tertinggal
    if (tn % 2 === 0)
      for (let j = 0; j < 3; j++)
        an.pt.push({
          x: x - 20,
          y: top + R(0, H),
          vx: -2 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.2,
          l: 14,
          c: P(spk || SPARK),
        });
  }

  /* sabit raksasa + tusukan putih panas di musuh (frame 5 di katalog) */
  function dashHit(s) {
    const t = s.t,
      grow = ease3(t / 5),
      alpha = t < 9 ? 1 : Math.max(0, 1 - (t - 9) / 8),
      H = effH() * bk(s.big),
      v = cresV(15, 1.3, 1.1, s.rot, 0),
      f = H / (v.h * 1.05),
      Y = yc(H) - v.mid * f;
    clear();
    g.save();
    cresStack(15, 1.0 + 0.3 * grow, 1.1, 4);
    g.restore();
    warp(s.x, s.y, s.x, Y, f, () => {
      blit(s.x + 4, s.y, s.rot, 0, 0.65 + 0.4 * grow, alpha, "#ff3a2e");
      // tusukan horizontal menembus musuh
      const len = 120 * Math.min(1, t / 3.5),
        th = 9 * (1 - t / 17) + 2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = "#ff3a2e";
      ctx.shadowBlur = 14 * SC;
      ctx.fillStyle = PAL[2];
      ctx.beginPath();
      ctx.moveTo(s.x - len, s.y);
      ctx.lineTo(s.x, s.y - th);
      ctx.lineTo(s.x + len * 0.7, s.y);
      ctx.lineTo(s.x, s.y + th);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(s.x - len, s.y);
      ctx.lineTo(s.x, s.y - th * 0.38);
      ctx.lineTo(s.x + len * 0.7, s.y);
      ctx.lineTo(s.x, s.y + th * 0.38);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      sparks(s.x, s.y, t, 18, 85);
    });
  }

  /* =====================================================================
     PEDANG — Jump Slash
     ===================================================================== */

  /* jejak melompat: garis kecepatan merah di belakang pemain + bara (dipanggil tiap frame saat melompat) */
  function jumpTrail(x, y, tn) {
    if (rm) return;
    const H = effH(),
      n = 5,
      top = yc(H) - H / 2,
      step = (H - 12) / (n - 1);
    for (let i = 0; i < n; i++) {
      const dy = top + 6 + i * step,
        mid = i === 2,
        len = (38 + ((i * 17 + tn * 9) % 34) + (mid ? 26 : 0)) * 1.7,
        th = (mid ? 5 : i % 2 ? 3 : 4) * 2.4,
        x0 = x - len,
        gr = ctx.createLinearGradient(x0, 0, x, 0);
      gr.addColorStop(0, "rgba(168,16,46,0)");
      gr.addColorStop(0.6, "rgba(255,58,46,.7)");
      gr.addColorStop(1, "rgba(255,138,58,.9)");
      ctx.fillStyle = gr;
      ctx.fillRect(Math.round(x0), Math.round(dy - th / 2), len, th);
      ctx.fillStyle = "rgba(255,244,214,.9)";
      ctx.fillRect(Math.round(x - len * 0.4), Math.round(dy - 1.2), len * 0.4, 2.4);
    }
    if (tn % 2 === 0)
      for (let j = 0; j < 2; j++)
        an.pt.push({
          x: x - 8,
          y: top + R(0, H),
          vx: -1.5 - Math.random() * 2,
          vy: (Math.random() - 0.2) * 1.4,
          l: 14,
          c: P(SPARK),
        });
  }

  /* cincin gelombang kejut berpiksel di tanah (elips pipih), pal = palet */
  function ring(cx, gy, rx, a, pal, flat = 0.22) {
    if (a <= 0 || rx < 4) return;
    const n = Math.max(12, Math.floor((6.283 * rx) / 3.2));
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * 6.283,
        px = cx + Math.cos(ang) * rx,
        py = gy + Math.sin(ang) * rx * flat,
        front = Math.sin(ang) > 0; // sisi depan (bawah) lebih terang
      sq(Math.round(px / 3) * 3, Math.round(py / 3) * 3, 3, 3, front ? pal[4] : pal[2], a * (front ? 1 : 0.7));
    }
  }

  /* sabit diagonal jatuh + gelombang tanah. s.t = 0..17, s.big = skala, s.rot = kemiringan, s.flip = cermin */
  function jumpHit(s) {
    if (s.t < 0) return;
    const t = s.t,
      k = t / 16,
      grow = ease3(t / 5),
      alpha = t < 9 ? 1 : Math.max(0, 1 - (t - 9) / 8),
      gy = typeof GY === "number" ? GY : s.y + 70,
      H = effH() * bk(s.big),
      v = cresV(16, 1.35, 1.12, s.rot, s.flip),
      f = H / (v.h * 1.1),
      Y = yc(H) - v.mid * f;
    clear();
    g.save();
    cresStack(16, 0.95 + 0.4 * grow, 1.12 - 0.3 * k, t < 10 ? 4 : 3);
    g.restore();
    warp(s.x, s.y, s.x, Y, f, () => {
      // sabit "jatuh" dari kiri-atas lalu menghantam tepat di musuh
      blit(s.x - 34 * (1 - grow), s.y - 44 * (1 - grow), s.rot, s.flip, 0.65 + 0.45 * grow, alpha, "#ff4a2e");
      if (t < 4) flashAt(s.x, s.y, 44, 1 - t / 4);
      sparks(s.x, s.y, t, s.big > 0.9 ? 16 : 6, 66);
    });
    if (s.big > 0.9) {
      // gelombang kejut di tanah + duri energi merah yang mencuat setinggi efek
      for (let r = 0; r < 2; r++) {
        const te = t - 2 - r * 3;
        if (te < 0) continue;
        ring(s.x, gy - 4, 24 + te * 22, Math.max(0, 1 - te / 13) * alpha, PAL);
      }
      if (t >= 2 && t < 14)
        for (let i = -3; i <= 3; i++) {
          const h = H * (1 - Math.abs(i) * 0.02) * Math.min(1, (t - 2) / 3) * (1 - Math.max(0, t - 8) / 7);
          if (h < 2) continue;
          const xx = Math.round((s.x + i * 22) / 3) * 3,
            yy = Math.round((gy - h) / 3) * 3;
          sq(xx, yy, 6, Math.round(h / 3) * 3, i % 2 ? PAL[3] : PAL[2], alpha);
          sq(xx, yy, 6, 3, PAL[5], alpha);
        }
    }
  }

  /* =====================================================================
     PEDANG — Excalibur (ulti)
     ===================================================================== */

  /* pilar cahaya berpiksel: lapisan oranye -> kuning -> putih; pangkal melebar (flare), sedikit bergoyang */
  function pillar(cx, yb, h, w, t, alpha, seed, flare) {
    if (h < 3 || alpha <= 0) return;
    const rows = Math.ceil(h / 3),
      L = [
        [w, GOLD[2], 0.85],
        [w * 0.7, GOLD[3], 0.95],
        [w * 0.4, GOLD[4], 1],
        [w * 0.15, "#ffffff", 1],
      ];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    L.forEach(([ww, col, al], li) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = clampN(alpha * al, 0, 1);
      if (li === 0) {
        ctx.shadowColor = "#ff9a1a";
        ctx.shadowBlur = 16 * SC;
      } else ctx.shadowBlur = 0;
      for (let r = 0; r < rows; r++) {
        const wob = Math.sin(r * 0.55 + t * 1.3 + seed) * 0.1 + (((r * 13 + t * 7 + seed) % 4) - 1.5) * 0.03,
          base = 1 + flare * Math.max(0, 1 - r / 9) * 1.6,
          tap = 1 - 0.3 * (r / rows) ** 2,
          half = Math.max(1.5, ww * 0.5 * (1 + wob) * base * tap),
          x0 = Math.round((cx - half) / 3) * 3,
          x1 = Math.round((cx + half) / 3) * 3;
        ctx.fillRect(x0, Math.round(yb - (r + 1) * 3), Math.max(3, x1 - x0), 3);
      }
    });
    ctx.restore();
  }

  /* "sayap api": berkas bulu memancar ke atas-samping dari pangkal pilar (ledakan akhir) */
  function wings(cx, by, t, big, alpha) {
    const grow = ease3(t / 6);
    for (let side = -1; side <= 1; side += 2)
      for (let k = 0; k < 8; k++) {
        const ang = 0.05 + k * 0.14,
          len = (84 + 14 * Math.sin(k * 1.9) + (7 - k) * 9) * 1.5 * grow * big;
        for (let d = 6; d < len; d += 3) {
          const f = d / len,
            px = cx + side * (20 * big + Math.cos(ang) * d * 1.12),
            py = by - Math.sin(ang) * d * 0.92 + f * f * 27, // ujung bulu sedikit melengkung turun
            z = f < 0.25 ? 18 : f < 0.5 ? 12 : f < 0.78 ? 9 : 6,
            col = f < 0.2 ? GOLD[5] : f < 0.45 ? GOLD[4] : f < 0.75 ? GOLD[3] : GOLD[2];
          sq(Math.round(px / 3) * 3, Math.round(py / 3) * 3, z, z, col, alpha * (1 - f * 0.4));
        }
      }
  }

  /* bara emas naik ke atas dari titik hantam */
  function sparksG(x, y, t, n, spread) {
    if (rm || t > 20) return;
    for (let i = 0; i < n; i++) {
      const ang = i * 2.399 + 0.7,
        sp = (0.3 + ((i * 7) % 5) * 0.17) * spread,
        e = 1 - (1 - Math.min(1, t / 14)) ** 2,
        px = x + Math.cos(ang) * sp * e,
        py = y + Math.sin(ang) * sp * e * 0.35 - t * (1.2 + (i % 4) * 0.6) * 1.4,
        z = i % 3 === 0 ? 4 : 3;
      sq(px, py, z, z, SPARKG[i % 4], 1 - t / 20);
    }
  }

  /* s.t = 0..17 (boleh mulai negatif = menunda), s.big = skala lebar, s.flip = 1 -> pilar raksasa terakhir */
  function excHit(s) {
    if (s.t < 0) return;
    const fin = !!s.flip,
      t = fin ? s.t * 0.72 : s.t, // pilar raksasa dilambatkan agar terasa megah (umur total s.t tetap 0..17)
      big = s.big,
      gy = typeof GY === "number" ? GY : s.y + 70,
      H = effH(),
      rise = ease3(t / (fin ? 4 : 3)),
      hold = 8,
      fade = t < hold ? 1 : Math.max(0, 1 - (t - hold) / (fin ? 4.2 : 5)),
      h = (fin ? H * 1.55 : H * 1.05) * rise * CFG.excH, // pilar kecil sudah > tinggi hero, pilar raksasa menembus langit
      w = (fin ? 58 : 22) * big * CFG.excW * (1 - 0.3 * Math.max(0, (t - 8) / 10));
    if (fin && t < 4 && typeof VW === "number") {
      const top = -topY();
      ctx.save();
      ctx.globalAlpha = (1 - t / 4) * 0.4;
      ctx.fillStyle = "#fff0b0";
      ctx.fillRect(0, top, VW, VH - top);
      ctx.restore();
    }
    ring(s.x, gy - 4, (fin ? 30 : 14) + t * (fin ? 20 : 11), Math.max(0, 1 - t / (fin ? 12 : 11)) * fade, GOLD);
    if (fin && t > 2) ring(s.x, gy - 4, 14 + (t - 2) * 14, Math.max(0, 1 - (t - 2) / 13) * fade, GOLD);
    pillar(s.x, gy, h, w, t, fade, s.x | 0, fin ? 1 : 0.5);
    if (fin) wings(s.x, gy - 6, t, big * (1 + (CFG.excW - 1) * 0.6), fade);
    if (t < 3) flashAt(s.x, gy - 28, (fin ? 105 : 51) * big * CFG.excW, 1 - t / 3, "rgba(255,255,230,.9)", "rgba(255,190,80,.4)", "rgba(255,150,40,0)");
    sparksG(s.x, gy - 8, t, fin ? 26 : 8, (fin ? 160 : 74) * big);
  }

  /* fase mengumpulkan energi (frame 0-22): cahaya di ujung pedang menembak lurus ke langit + bara emas berputar masuk */
  function excCharge(a, fx, fy) {
    if (rm) return;
    const tn = a.t,
      k = Math.min(1, tn / 22),
      e = 1 - (1 - k) ** 2,
      H = effH(),
      rr0 = (30 + 22 * k) * 1.4;
    // tiang cahaya dari ujung pedang ke atas, makin tinggi & tebal (lebih tinggi dari hero)
    pillar(fx, fy, H * 1.1 * e, 7 + 13 * k, tn, 0.35 + 0.6 * k, 3, 0.3);
    const gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, rr0);
    gr.addColorStop(0, "rgba(255,255,220,.85)");
    gr.addColorStop(0.5, "rgba(255,190,70,.35)");
    gr.addColorStop(1, "rgba(255,150,40,0)");
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.45 * k;
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(fx, fy, rr0, 0, 6.283);
    ctx.fill();
    ctx.restore();
    for (let j = 0; j < 8; j++) {
      const ang = tn * 0.38 + j * 0.785,
        rr = (10 + 54 * (1 - k) * (0.6 + (0.4 * ((j * 5) % 3)) / 2)) * 1.4;
      sq(Math.round((fx + Math.cos(ang) * rr) / 3) * 3, Math.round((fy + Math.sin(ang) * rr * 0.8) / 3) * 3, 4, 4, SPARKG[j % 4], 0.5 + 0.5 * k);
    }
  }

  /* kilau hangat di dasar layar selama tebasan ulti (pengganti garis pelangi) */
  function ultBg() {
    if (rm || typeof VW !== "number") return;
    const top = -topY(),
      gr = ctx.createLinearGradient(0, VH, 0, top);
    gr.addColorStop(0, "rgba(255,170,40,.34)");
    gr.addColorStop(0.6, "rgba(255,150,40,.10)");
    gr.addColorStop(1, "rgba(255,150,40,0)");
    ctx.save();
    ctx.globalAlpha = 0.8 + 0.2 * Math.sin(Date.now() / 70);
    ctx.fillStyle = gr;
    ctx.fillRect(0, top, VW, VH - top);
    ctx.restore();
  }

  /* =====================================================================
     PEMANAH — skill dasar (tanpa elemen)
     Urutan mengikuti katalog: skill 1 = Arrow Shot, skill 2 = Rain of Arrows, skill 3 = Giant Arrow.
     Bila di jobs.js urutannya beda, tukar nilai di ARC_ID (nama skill yang memuat "hujan" / "raksasa" / "besar"
     juga dikenali otomatis). Skill elemen (api/es/petir) tidak disentuh.
     ===================================================================== */
  /* id skill pemanah di jobs.js: S1 = "shot" (Panah Kuat), S2 = "multi" (Panah Sebar), S3 = "giant" (Panah Raksasa).
     Skill elemen (fire/ice/bolt) & heal TIDAK ada di peta ini, jadi tidak disentuh. */
  const ARC_ID = { shot: "shot", multi: "rain", giant: "giant" };
  function arcKind(sk) {
    if (!sk) return null;
    if (sk.id === "ult") return "ult";
    if (!(sk.id in ARC_ID)) return null;
    const nm = String(sk.n || "").toLowerCase();
    if (/hujan|rain/.test(nm)) return "rain";
    if (/raksasa|besar|giant/.test(nm)) return "giant";
    if (/tiga|shot|3 /.test(nm)) return "shot";
    return ARC_ID[sk.id];
  }

  const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const GOLD_RGB = GOLD.map(hexRGB);

  /* sprite panah berpiksel (menghadap kanan), disimpan sekali: len = panjang sel, head = panjang mata panah, hs = setengah tebal poros */
  const SPR = {};
  function arrowSpr(key, len, head, hs, pal) {
    if (SPR[key]) return SPR[key];
    const hh = Math.round(head * 0.62),
      w = len + 4,
      h = 2 * (hh + 3) + 1,
      cy = h >> 1,
      c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const x = c.getContext("2d");
    x.imageSmoothingEnabled = false;
    const rc = (px, py, pw, ph, col) => {
      x.fillStyle = col;
      x.fillRect(px, py, pw, ph);
    };
    const sx0 = 4,
      sx1 = len - head;
    for (let dy = -hs - 1; dy <= hs + 1; dy++) {
      const a = Math.abs(dy);
      rc(sx0, cy + dy, sx1 - sx0 + 1, 1, a === 0 ? pal[4] : a === 1 ? pal[3] : a === 2 ? pal[2] : pal[1]);
    }
    // mata panah (segitiga bertingkat): tepi biru/emas, inti putih
    for (let i = 0; i < head; i++) {
      const half = Math.round(((head - i) / head) * hh);
      for (let dy = -half; dy <= half; dy++) {
        const a = Math.abs(dy);
        rc(sx1 + i, cy + dy, 1, 1, a >= half ? pal[2] : a >= half - 1 ? pal[3] : pal[4]);
      }
    }
    // bulu di ekor
    for (let j = 0; j < 6; j++) {
      const f = Math.floor((5 - j) * 0.9);
      rc(sx0 + j, cy - hs - 1 - f, 1, f + 1, pal[2]);
      rc(sx0 + j, cy + hs + 1, 1, f + 1, pal[2]);
      if (f > 1) {
        rc(sx0 + j, cy - hs - 1 - f + 1, 1, 1, pal[3]);
        rc(sx0 + j, cy + hs + f, 1, 1, pal[3]);
      }
    }
    return (SPR[key] = c);
  }
  const sprShot = () => arrowSpr("shot", 40, 9, 1, CY);
  const sprGold = () => arrowSpr("gold", 46, 10, 1, [GOLD[1], GOLD[2], GOLD[3], GOLD[4], GOLD[5]]);
  const sprFire = () => arrowSpr("fire", 46, 10, 1, [PAL[1], PAL[2], PAL[3], PAL[4], PAL[5]]);
  const sprBolt = () => arrowSpr("bolt", 46, 10, 1, [BOL[1], BOL[2], BOL[3], BOL[4], BOL[5]]);

  function blitSpr(spr, x, y, rot, s, alpha, glow) {
    const w = spr.width * PX * s,
      h = spr.height * PX * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = clampN(alpha, 0, 1);
    ctx.imageSmoothingEnabled = false;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 14 * SC;
    }
    ctx.drawImage(spr, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  const TINT = [
    ["rgba(23,103,194,0)", "rgba(63,180,255,.7)", "rgba(220,250,255,.95)"],
    ["rgba(181,83,10,0)", "rgba(255,154,26,.75)", "rgba(255,240,168,.95)"],
    ["rgba(168,16,46,0)", "rgba(255,90,40,.75)", "rgba(255,230,160,.95)"],
    ["rgba(160,130,0,0)", "rgba(255,225,77,.75)", "rgba(255,255,230,.95)"],
  ];
  /* garis kecepatan di belakang titik (x,y); arah gerak = ang; ti: 0 biru, 1 emas */
  function streaks(x, y, ang, len, n, spread, ti, a = 1) {
    const T = TINT[ti];
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = clampN(a, 0, 1);
    for (let j = 0; j < n; j++) {
      const off = (j - (n - 1) / 2) * spread,
        l = len * (0.55 + (0.45 * ((j * 37 + Math.floor(Math.abs(x))) % 5)) / 4),
        gr = ctx.createLinearGradient(-l, 0, 0, 0);
      gr.addColorStop(0, T[0]);
      gr.addColorStop(0.6, T[1]);
      gr.addColorStop(1, T[2]);
      ctx.fillStyle = gr;
      ctx.fillRect(-l, off - 2, l, 4);
    }
    ctx.restore();
  }

  /* sinar bintang: n sinar berbentuk belah ketupat dari (cx,cy); sinar yang tegak lurus sepanjang base (jadi tinggi total = 2 x base) */
  function rays(cx, cy, n, base, rot0, pal, alpha) {
    if (alpha <= 0 || base < 4) return;
    ctx.save();
    ctx.shadowColor = pal[2];
    ctx.shadowBlur = 14 * SC;
    for (let j = 0; j < n; j++) {
      const th0 = (j * 6.2832) / n,
        vert = Math.abs(Math.sin(th0)) > 0.98,
        th = th0 + rot0,
        L = base * (vert ? 1 : j % 2 ? 0.62 : 0.85),
        w = L * 0.085,
        ca = Math.cos(th),
        sa = Math.sin(th);
      const poly = (ww, col) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(cx - ca * L * 0.12, cy - sa * L * 0.12);
        ctx.lineTo(cx + ca * L * 0.2 - sa * ww, cy + sa * L * 0.2 + ca * ww);
        ctx.lineTo(cx + ca * L, cy + sa * L);
        ctx.lineTo(cx + ca * L * 0.2 + sa * ww, cy + sa * L * 0.2 - ca * ww);
        ctx.closePath();
        ctx.fill();
      };
      ctx.globalAlpha = clampN(alpha, 0, 1);
      poly(w, pal[2]);
      ctx.shadowBlur = 0;
      poly(w * 0.45, pal[4]);
      ctx.shadowBlur = 14 * SC;
    }
    ctx.restore();
  }

  /* bola api berpiksel di kanvas kerja: radius Rc sel, tepi bergerigi bergoyang */
  function fireball(Rc, tn) {
    clear();
    const id = g.createImageData(N, N),
      d = id.data;
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = x - C0 + 0.5,
          dy = y - C0 + 0.5,
          r = Math.hypot(dx, dy);
        if (r > Rc * 1.2) continue;
        const ang = Math.atan2(dy, dx),
          rr = Rc * (1 + 0.1 * Math.sin(ang * 6 + tn * 0.8) + 0.06 * Math.sin(ang * 13 - tn)),
          q = r / rr;
        if (q > 1) continue;
        const c = GOLD_RGB[q > 0.78 ? 2 : q > 0.55 ? 3 : q > 0.3 ? 4 : 5],
          o = (y * N + x) * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 255;
      }
    g.putImageData(id, 0, 0);
  }

  /* panah raksasa berekor api (arah kanan) di kanvas kerja: ekor mengerucut ke kiri, kepala bulat bercahaya di kanan.
     Tinggi total = 77 sel (= 231 satuan logis pada skala 1). */
  function giantArrow(tn) {
    clear();
    const cols = [GOLD[2], GOLD[3], GOLD[4], "#ffffff"],
      span = [1, 0.74, 0.48, 0.22];
    for (let li = 0; li < 4; li++) {
      g.fillStyle = cols[li];
      for (let x = -39; x <= 36; x++) {
        const noise = 1 + 0.12 * Math.sin(x * 0.55 + tn * 1.1 + li) + (((x * 13 + tn * 7 + li * 5) % 4) - 1.5) * 0.03;
        let half;
        if (x <= 4) half = 38 * Math.max(0, 1 - (4 - x) / 44) ** 1.4;
        else half = 38 * Math.sqrt(Math.max(0, 1 - ((x - 4) / 33) ** 2));
        half = Math.max(0, Math.round(half * span[li] * noise));
        if (half > 0) g.fillRect(x, -half, 1, half * 2 + 1);
      }
    }
    // poros + mata panah + bulu
    for (let dy = -2; dy <= 2; dy++) {
      const a = Math.abs(dy);
      g.fillStyle = a === 0 ? "#ffffff" : a === 1 ? GOLD[4] : GOLD[3];
      g.fillRect(-32, dy, 56, 1);
    }
    for (let i = 0; i < 24; i++) {
      const half = Math.round(((24 - i) / 24) * 10);
      for (let dy = -half; dy <= half; dy++) {
        const a = Math.abs(dy);
        g.fillStyle = a >= half ? GOLD[2] : a >= half - 1 ? GOLD[3] : "#ffffff";
        g.fillRect(14 + i, dy, 1, 1);
      }
    }
    for (let j = 0; j < 7; j++) {
      const f = Math.floor((6 - j) * 1.1);
      g.fillStyle = GOLD[3];
      g.fillRect(-32 + j, -3 - f, 1, f + 1);
      g.fillRect(-32 + j, 3, 1, f + 1);
    }
  }
  const GIANT_V = 77 * PX; // tinggi sprite panah raksasa pada skala 1

  /* bola cahaya + percikan yang menggulung ke busur sebelum menembak (k = 0..1) */
  function charge(fx, fy, k, ti, t, size = 1) {
    if (rm) return;
    const SP = ti ? SPARKG : SPARKC,
      H = effH(),
      r = H * (0.22 + 0.6 * k) * size, // di puncak: garis tengah bola ~ 1,6 x tinggi efek (> tinggi hero), sejak awal sudah besar
      gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    gr.addColorStop(0, "rgba(255,255,255,.9)");
    gr.addColorStop(0.45, ti ? "rgba(255,190,70,.4)" : "rgba(80,190,255,.4)");
    gr.addColorStop(1, ti ? "rgba(255,150,40,0)" : "rgba(40,120,255,0)");
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * k;
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, 6.283);
    ctx.fill();
    ctx.restore();
    for (let j = 0; j < 8; j++) {
      const ang = t * 0.4 + j * 0.785,
        rr = (10 + H * 0.34 * (1 - k) * (0.6 + (0.4 * ((j * 5) % 3)) / 2)) * size;
      sq(Math.round((fx + Math.cos(ang) * rr) / 3) * 3, Math.round((fy + Math.sin(ang) * rr * 0.8) / 3) * 3, 4, 4, SP[j % 4], 0.5 + 0.5 * k);
    }
  }

  /* frame-frame penting: W0 = akhir ancang-ancang (frame lepas), AP = frame anak panah tiba di musuh */
  function phase(a, K) {
    const W0 = (a.sk && a.sk.V && +a.sk.V.w) || 10;
    let AP = 0;
    try {
      if (typeof atmOf === "function") AP = +atmOf(a, K)[0] || 0;
    } catch (e) {}
    if (AP <= W0 + 2) AP = W0 + 14;
    return { W0, AP };
  }

  /* ---------- skill 1: Arrow Shot (3 Arrow) — dipanggil tiap frame dari jobFrame ---------- */
  function shotFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t;
    if (t <= W0) return charge(fx, fy, t / W0, 0, t, 1.0);
    if (t > AP + 1) return;
    const kf = clampN((t - W0) / (AP - W0), 0, 1),
      e = Math.pow(kf, 1.1),
      H = effH(),
      Y = yc(H),
      tx = ecx() - 24,
      lf = clampN(0.25 + e * 2.5, 0, 1), // panah "tumbuh" dari busur lalu penuh
      half = sprShot().width * PX * ARW * lf * 0.5;
    if (t - W0 <= 4) flashAt(fx, fy, 60 * (1 - (t - W0) / 5), 1, "rgba(255,255,255,.9)", "rgba(80,190,255,.5)", "rgba(40,120,255,0)");
    for (let i = 0; i < 3; i++) {
      const ty = Y + (i - 1) * H * SPREAD,
        ang = Math.atan2(ty - fy, tx - fx),
        ca = Math.cos(ang),
        sa = Math.sin(ang),
        fxp = fx + (tx - fx) * e, // ujung depan panah
        fyp = fy + (ty - fy) * e,
        cx = fxp - ca * half,
        cy = fyp - sa * half;
      streaks(cx - ca * half * 0.8, cy - sa * half * 0.8, ang, 170 * lf, 3, 11, 0, 0.9);
      blitSpr(sprShot(), cx, cy, ang, ARW * lf, 1, "#3fb4ff");
    }
  }

  /* ---------- serangan biasa pemanah: panah LURUS dari busur ke musuh (tanpa lengkung jatuh) ---------- */
  function basicFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      n = a.n || 1,
      hg = typeof HG === "number" ? HG : 6,
      FL = (a.sk && a.sk.V && +a.sk.V.fl) || AP - W0,
      tx = ecx() - 24,
      ty = 150,
      el = a.sk && a.sk.el,
      ice = el === "ice",
      fire = el === "fire",
      bolt = el === "bolt",
      glow = fire ? "#ff5a1a" : bolt ? "#ffe14d" : ice ? "#3fb4ff" : el && typeof EL !== "undefined" && EL[el] ? EL[el].c : "#ffb43a",
      spr = ice ? sprShot() : fire ? sprFire() : bolt ? sprBolt() : sprGold(),
      ti = ice ? 0 : fire ? 2 : bolt ? 3 : 1,
      sc = el ? 1.5 : 1.2;
    a.o2 = a.o2 || [];
    if (t <= W0) return charge(fx, fy, t / W0, ice ? 0 : 1, t, el ? 0.55 : 0.4);
    for (let i = 0; i < n; i++) {
      const L = W0 + 1 + i * hg;
      if (t < L || t > L + FL) continue;
      if (!a.o2[i]) a.o2[i] = { x: fx, y: fy };
      const o = a.o2[i],
        e = clampN((t - L) / FL, 0, 1),
        ang = Math.atan2(ty - o.y, tx - o.x),
        half = spr.width * PX * sc * 0.5,
        ca = Math.cos(ang),
        sa = Math.sin(ang),
        px = o.x + (tx - o.x) * e - ca * half,
        py = o.y + (ty - o.y) * e - sa * half;
      if (fire) {
        // ekor api meruncing di belakang panah
        const len = half * 2.6;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        const gr = ctx.createLinearGradient(-len, 0, 0, 0);
        gr.addColorStop(0, "rgba(255,90,20,0)");
        gr.addColorStop(0.6, "rgba(255,140,40,.55)");
        gr.addColorStop(1, "rgba(255,230,160,.9)");
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(0, -half * 0.55);
        ctx.lineTo(-len, 0);
        ctx.lineTo(0, half * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      streaks(px - ca * half * 0.8, py - sa * half * 0.8, ang, 90, 2, 6, ti, 0.8);
      blitSpr(spr, px, py, ang, sc, 1, glow);
      if (bolt && !rm) {
        // busur listrik menyambar-nyambar di sekitar panah
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(ang);
        ctx.strokeStyle = "#fff3a0";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ffe14d";
        ctx.shadowBlur = 10 * SC;
        for (let j = 0; j < 2; j++) {
          let x = -half;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          for (let k = 0; k < 6; k++) {
            x += half * 0.4;
            ctx.lineTo(x, (srnd(t * 3 + j * 11 + k) - 0.5) * 38);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      if (!rm && (fire || ice || bolt))
        an.pt.push({ x: px - ca * half * 0.7, y: py + R(-half * 0.3, half * 0.3), vx: -1.5 - Math.random() * 2, vy: (fire ? -0.6 : 0) + (Math.random() - 0.5) * 1.2, l: 16, c: P(fire ? SPARKG : bolt ? SPARKB : SPARKC) });
    }
  }
  const arcEl = (sk) => (sk && (sk.el === "fire" || sk.el === "ice" || sk.el === "bolt") ? sk.el : null);

  /* ---------- PEMANAH elemen: Panah Petir — begitu panah kena, petir turun menyambar musuh dari langit ---------- */
  /* jalur petir bergerigi dari (x0,y0) ke (x1,y1); seed diganti tiap 2 frame supaya berkedip */
  function boltPath(x0, y0, x1, y1, seed, amp) {
    const n = Math.max(4, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 18)),
      pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n,
        e = i === 0 || i === n ? 0 : 1;
      pts.push([x0 + (x1 - x0) * u + (srnd(i * 3.1 + seed) - 0.5) * amp * e, y0 + (y1 - y0) * u + (srnd(i * 7.7 + seed + 9) - 0.5) * 6 * e]);
    }
    return pts;
  }
  function boltDraw(pts, w, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.lineJoin = "miter";
    [
      [w * 2.6, "rgba(255,225,77,.35)", 1],
      [w, BOL[3], 0],
      [w * 0.4, "#ffffff", 0],
    ].forEach(([lw, col, gl]) => {
      ctx.globalAlpha = clampN(a, 0, 1);
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      if (gl) {
        ctx.shadowColor = "#ffe14d";
        ctx.shadowBlur = 18 * SC;
      } else ctx.shadowBlur = 0;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.stroke();
    });
    ctx.restore();
  }
  function boltHit(s) {
    const t = s.t,
      H = effH(),
      gy = GY,
      top = -topY() - 10,
      Y = yc(H),
      fin = !!s.fin,
      seed = (t >> 1) * 13 + (s.x | 0),
      a = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 7),
      grow = ease3(t / 4);
    if (t < 4 && typeof VW === "number") {
      ctx.save();
      ctx.globalAlpha = (1 - t / 4) * (fin ? 0.45 : 0.3);
      ctx.fillStyle = "#fffbd0";
      ctx.fillRect(0, top, VW, VH - top);
      ctx.restore();
    }
    (fin
      ? [
          [0, 1],
          [-70, 0.6],
          [64, 0.6],
        ]
      : [[0, 0.7]]
    ).forEach(([dx, k], bi) => {
      if (t < bi) return;
      const pts = boltPath(s.x + dx * 1.5 + 40, top, s.x + dx * 0.4, gy + 2, seed + bi * 41, 34);
      boltDraw(pts, (fin ? 10 : 7) * k, a);
      if (bi === 0)
        [0.3, 0.5, 0.7].forEach((u, j) => {
          const p = pts[Math.floor(pts.length * u)];
          boltDraw(boltPath(p[0], p[1], p[0] + (srnd(j * 17 + seed) - 0.5) * 130, p[1] + 70 + srnd(j * 5 + seed) * 50, seed + j, 20), 3.5, a * 0.9);
        });
    });
    if (t < 5) flashAt(s.x, Y, H * 0.6, 1 - t / 5, "rgba(255,255,230,.95)", "rgba(255,225,77,.5)", "rgba(255,200,40,0)");
    rays(s.x, Y, 10, H * 0.45 * grow, 0, BOL, a * 0.9);
    ring(s.x, gy - 4, 20 + t * 26, Math.max(0, 1 - t / 12) * a, BOL);
    if (fin) ring(s.x, gy - 4, 10 + t * 16, Math.max(0, 1 - t / 10) * a, BOL);
    sparksC(s.x, gy - 8, t, fin ? 34 : 16, fin ? 200 : 120, SPARKB);
  }

  /* ---------- skill 2: Rain of Arrows ---------- */
  function rainFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t;
    if (t <= W0) return charge(fx, fy, t / W0, 1, t, 1.0);
    const H = effH(),
      gy = GY,
      top = -topY() - 24,
      u = t - W0,
      spr = sprGold(),
      fall = 9,
      X0 = ecx(),
      ang = 1.45,
      dirx = Math.cos(ang),
      diry = Math.sin(ang),
      half = (spr.width * PX * 2.2) / 2;
    // panah pembuka melesat ke langit dari busur
    if (u <= 7) {
      const ua = -1.2,
        px = fx + Math.cos(ua) * u * 54,
        py = fy + Math.sin(ua) * u * 54;
      streaks(px - Math.cos(ua) * 90, py - Math.sin(ua) * 90, ua, 130, 3, 8, 1, 0.9);
      blitSpr(spr, px, py, ua, 1.3, 1, "#ffb43a");
    }
    // hujan: 16 panah jatuh dari atas layar, menancap di tanah, lalu memudar; tiap panah ≥ tinggi efek
    for (let j = 0; j < 16; j++) {
      const lx = X0 - 112 + ((j * 53) % 225),
        tl = AP - 3 + (j % 8) * 1.2 + Math.floor(j / 8) * 1.5, // frame mendarat
        ts = tl - fall;
      if (t < ts || t > tl + 12) continue;
      const p = clampN((t - ts) / fall, 0, 1),
        pe = p * p,
        D = gy + 6 - top,
        frx = lx + (pe - 1) * D * 0.12, // ujung depan panah
        fry = top + D * pe,
        cx = frx - dirx * half,
        cy = fry - diry * half,
        al = t > tl + 7 ? clampN(1 - (t - tl - 7) / 5, 0, 1) : 1;
      if (p < 1) streaks(cx - dirx * half * 0.7, cy - diry * half * 0.7, ang, 110, 2, 10, 1, 0.8);
      else if (j % 2 === 0) pillar(lx, gy, H * 1.0 * ease3((t - tl) / 2), 12, t, al * 0.75, j * 7, 0.6); // tiang cahaya di tiap panah yang menancap
      blitSpr(spr, cx, cy, ang, 2.2, al, "#ffb43a");
    }
  }
  /* efek benturan hujan panah (ledakan di tanah, mengikuti hit) */
  function rainHit(s) {
    const t = s.t,
      H = effH(),
      gy = typeof GY === "number" ? GY : s.y + 70,
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9),
      big = s.fin ? 1 : 0.6;
    // tiang cahaya di titik hantam: hit kecil 0,8 x, hit akhir 1,05 x tinggi efek (keduanya > tinggi hero)
    pillar(s.x, gy, H * (s.fin ? 1.05 : 1.0) * ease3(t / 3), (s.fin ? 34 : 20) * (1 - 0.3 * Math.max(0, (t - 8) / 10)), t, alpha, s.x | 0, 0.8);
    ring(s.x, gy - 4, (26 + t * 20) * big, Math.max(0, 1 - t / 13) * alpha, GOLD);
    if (s.fin && t > 2) ring(s.x, gy - 4, 14 + (t - 2) * 14, Math.max(0, 1 - (t - 2) / 12) * alpha, GOLD);
    if (t < 4) flashAt(s.x, gy - H * 0.3, H * 0.5 * big, 1 - t / 4, "rgba(255,255,230,.9)", "rgba(255,190,80,.4)", "rgba(255,150,40,0)");
    sparksG(s.x, gy - 8, t, s.fin ? 24 : 8, 130 * big);
  }

  /* ---------- skill 3: Giant Arrow ---------- */
  function giantFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH(),
      Y = yc(H),
      sf = H / GIANT_V,
      tx = ecx() - 20;
    if (t <= W0) {
      const k = t / W0;
      charge(fx, fy, k, 1, t, 1.1);
      giantArrow(t);
      // panah raksasa "terbentuk" di depan busur
      blit(fx + 30 * k, fy + (Y - fy) * ease3(k) * 0.4, 0, 0, sf * (0.3 + 0.5 * k), 0.4 + 0.5 * k, "#ff9a1a");
      return;
    }
    if (t > AP + 1) return;
    const kf = clampN((t - W0) / (AP - W0), 0, 1),
      e = Math.pow(kf, 1.2),
      gk = ease3(kf * 2.2), // naik ke tinggi tengah efek sambil membesar
      s0 = sf * (0.8 + 0.2 * gk),
      front = fx + 30 + (tx - fx - 30) * e, // posisi ujung kepala panah
      cx = front - 38 * PX * s0,
      cy = fy + (Y - fy) * gk;
    giantArrow(t);
    blit(cx, cy, 0, 0, s0, 1, "#ff9a1a");
    if (t % 2 === 0)
      for (let j = 0; j < 2; j++)
        an.pt.push({ x: cx - 20 * PX * s0 * Math.random(), y: cy + R(-30, 30) * s0 * 1.5, vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5, l: 16, c: P(SPARKG) });
  }
  function giantHit(s) {
    const t = s.t,
      H = effH(),
      Y = yc(H),
      gy = typeof GY === "number" ? GY : s.y + 70,
      grow = ease3(t / 5),
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9),
      sf = H / GIANT_V;
    // panah menancap di musuh (api membeku lalu padam)
    if (t < 12) {
      giantArrow(2);
      blit(s.x - 38 * PX * sf + 22, Y, 0, 0, sf, alpha * (t < 8 ? 1 : 1 - (t - 8) / 4), "#ff9a1a");
    }
    // bola api raksasa
    fireball(36 * (0.55 + 0.45 * grow), t);
    blit(s.x, Y, 0, 0, (H / (N * PX * 0.9)) * (0.7 + 0.3 * grow), alpha, "#ff9a1a");
    rays(s.x, Y, 12, (H / 2) * 1.0 * grow, 0, GOLD, alpha * 0.9);
    ring(s.x, gy - 4, 26 + t * 24, Math.max(0, 1 - t / 13) * alpha, GOLD);
    if (t < 4) flashAt(s.x, Y, H * 0.55, 1 - t / 4, "rgba(255,255,230,.95)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    sparksG(s.x, gy - 8, t, 22, 150);
  }

  /* ---------- Arrow Shot: ledakan sinar saat kena (s.fin=1 hit terakhir, 0 hit kecil) ---------- */
  function burstHit(s) {
    const t = s.t,
      H = effH(),
      Y = yc(H),
      grow = ease3(t / 4),
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9),
      pal = s.gold ? GOLD : s.white ? [CY[4], CY[4], CY[3], CY[4], CY[4]] : CY;
    if (t < 4) flashAt(s.x, Y, H * 0.4, 1 - t / 4, "rgba(255,255,255,.95)", s.gold ? "rgba(255,190,80,.45)" : "rgba(80,190,255,.45)", s.gold ? "rgba(255,150,40,0)" : "rgba(40,120,255,0)");
    rays(s.x, Y, s.fin ? 12 : 8, (H / 2) * grow, s.rot || 0, pal, alpha);
    if (s.fin) {
      // tiga panah menembus: tusukan horizontal setinggi barisan panah
      const len = 190 * Math.min(1, t / 3.5),
        th = 7 * (1 - t / 17) + 2;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = pal[2];
      ctx.shadowBlur = 12 * SC;
      for (let i = 0; i < 3; i++) {
        const yy = Y + (i - 1) * H * SPREAD;
        ctx.fillStyle = pal[2];
        ctx.beginPath();
        ctx.moveTo(s.x - len, yy);
        ctx.lineTo(s.x, yy - th);
        ctx.lineTo(s.x + len * 0.5, yy);
        ctx.lineTo(s.x, yy + th);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(s.x - len, yy);
        ctx.lineTo(s.x, yy - th * 0.38);
        ctx.lineTo(s.x + len * 0.5, yy);
        ctx.lineTo(s.x, yy + th * 0.38);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // percikan
    if (!rm && t <= 16)
      for (let i = 0; i < (s.fin ? 18 : 8); i++) {
        const ang = i * 2.399 + 0.5,
          sp = (0.4 + ((i * 7) % 5) * 0.16) * 110,
          e2 = 1 - (1 - Math.min(1, t / 12)) ** 2;
        sq(s.x + Math.cos(ang) * sp * e2, Y + Math.sin(ang) * sp * e2 * 1.2, i % 3 === 0 ? 4 : 3, i % 3 === 0 ? 4 : 3, (s.gold ? SPARKG : SPARKC)[i % 4], 1 - t / 16);
      }
  }

  /* ---------- ULTI: Arrow Storm ---------- */
  function ultFrame(a, K, fx, fy) {
    let AP = 24;
    try {
      if (typeof atmOf === "function") AP = +atmOf(a, K)[0] || 24;
    } catch (e) {}
    const t = a.t,
      H = effH();
    if (t <= AP) {
      const k = clampN(t / AP, 0, 1),
        e = 1 - (1 - k) ** 2;
      // tiang cahaya dari busur ke langit (lebih tinggi dari hero) + dua busur cahaya mengapit bola energi
      pillar(fx, fy, H * 1.1 * e, 6 + 10 * k, t, 0.3 + 0.55 * k, 5, 0.3);
      charge(fx, fy, k, 1, t, 1.2);
      for (let sd = -1; sd <= 1; sd += 2) {
        clear();
        g.save();
        cresStack(16, 1.0, 0.5, 2, [GOLD[0], GOLD[1], GOLD[2], GOLD[3], GOLD[4], GOLD[5]]);
        g.restore();
        blit(fx + sd * (74 - 34 * k), fy, 0, sd < 0 ? 1 : 0, 0.55 + 0.9 * k, 0.45 + 0.5 * k, "#ff9a1a");
      }
      return;
    }
    // badai panah: panah emas berjatuhan terus di sekitar musuh selama tebasan ulti
    const ph = t - AP,
      spr = sprGold(),
      gy = GY,
      top = -topY() - 24,
      ang = 1.45,
      half = (spr.width * PX * 1.8) / 2,
      D = gy + 6 - top,
      X0 = ecx();
    for (let j = 0; j < 10; j++) {
      const per = 13,
        p = ((ph + j * 3.3) % per) / per,
        lx = X0 - 150 + ((j * 61) % 301),
        pe = p * p,
        frx = lx + (pe - 1) * D * 0.12,
        fry = top + D * pe,
        cx = frx - Math.cos(ang) * half,
        cy = fry - Math.sin(ang) * half;
      streaks(cx - Math.cos(ang) * half * 0.7, cy - Math.sin(ang) * half * 0.7, ang, 90, 2, 10, 1, 0.7);
      blitSpr(spr, cx, cy, ang, 1.8, p < 0.08 ? p * 12 : 1, "#ffb43a");
    }
  }
  /* ledakan sinar bintang di musuh; s.fin = hantaman terakhir */
  function ultHit(s) {
    const t = s.t,
      H = effH(),
      Y = yc(H),
      gy = typeof GY === "number" ? GY : s.y + 70,
      grow = ease3(t / 4),
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9);
    if (s.fin) {
      if (t < 5 && typeof VW === "number") {
        const top = -topY();
        ctx.save();
        ctx.globalAlpha = (1 - t / 5) * 0.4;
        ctx.fillStyle = "#fff0b0";
        ctx.fillRect(0, top, VW, VH - top);
        ctx.restore();
      }
      fireball(36 * (0.55 + 0.45 * grow), t);
      blit(s.x, Y, 0, 0, (H / (N * PX * 0.9)) * (0.7 + 0.3 * grow), alpha, "#ff9a1a");
    }
    if (t < 4) flashAt(s.x, Y, H * (s.fin ? 0.6 : 0.4), 1 - t / 4, "rgba(255,255,230,.95)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    rays(s.x, Y, s.fin ? 20 : 12, (H / 2) * (s.fin ? 1.25 : 1.0) * grow, s.fin ? 0 : s.rot || 0, GOLD, alpha);
    ring(s.x, gy - 4, (s.fin ? 30 : 18) + t * (s.fin ? 24 : 16), Math.max(0, 1 - t / 13) * alpha, GOLD);
    sparksG(s.x, gy - 8, t, s.fin ? 26 : 10, s.fin ? 170 : 90);
  }

  /* =====================================================================
     PENYIHIR — skill dasar (tanpa elemen), urutan katalog:
     S1 (id "fire") -> Magic Circle : lingkaran sihir di kaki musuh + tiang api menjulang
     S2 (id "wat")  -> Fireball     : bola api besar meluncur LURUS + ledakan
     S3 (id "bolt") -> Beam         : sinar tebal dari tongkat ke musuh + ledakan
     (Di game ketiganya berelemen api/air/petir; efek status & damage tetap, hanya tampilannya diganti.)
     ===================================================================== */
  const MAGE_ID = { fire: "circle", wat: "fball", bolt: "beam", dark: "hole", holy: "swords", ice: "ice" };
  const mageKind = (sk) => (sk && sk.id in MAGE_ID ? MAGE_ID[sk.id] : null);

  /* lingkaran sihir pipih di tanah: cincin ganda, bintang segi-6 berputar, rune */
  function circleDraw(x, gy, rx, a, t) {
    if (a <= 0 || rx < 6) return;
    const flat = 0.26,
      rot = t * 0.08;
    ctx.save();
    ctx.translate(x, gy - 4);
    ctx.scale(1, flat);
    ctx.globalAlpha = clampN(a, 0, 1);
    ctx.shadowColor = "#ff9a1a";
    ctx.shadowBlur = 14 * SC;
    ctx.lineWidth = 6;
    ctx.strokeStyle = GOLD[2];
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, 6.283);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 3;
    ctx.strokeStyle = GOLD[4];
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.96, 0, 6.283);
    ctx.stroke();
    ctx.strokeStyle = GOLD[3];
    ctx.beginPath();
    ctx.arc(0, 0, rx * 0.7, 0, 6.283);
    ctx.stroke();
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const ang = rot + (k * Math.PI) / 3 + i * 2.0944,
          px = Math.cos(ang) * rx * 0.7,
          py = Math.sin(ang) * rx * 0.7;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = GOLD[5];
    for (let i = 0; i < 12; i++) {
      const ang = -rot * 0.6 + i * 0.5236;
      ctx.fillRect(Math.round((Math.cos(ang) * rx * 0.85) / 3) * 3, Math.round((Math.sin(ang) * rx * 0.85) / 3) * 3, 6, 12);
    }
    ctx.restore();
  }

  /* ---------- skill 1: Magic Circle (dipanggil tiap frame dari jobFrame) ---------- */
  function circleFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH();
    if (t <= W0) return charge(fx, fy, t / W0, 1, t, 1.0);
    const u = t - W0,
      k = clampN(u / (AP - W0), 0, 1),
      fade = t > AP + 6 ? clampN(1 - (t - AP - 6) / 5, 0, 1) : 1;
    if (u <= 4) flashAt(fx, fy, 60 * (1 - u / 5), 1, "rgba(255,255,255,.9)", "rgba(255,190,80,.5)", "rgba(255,150,40,0)");
    circleDraw(ecx(), GY, H * 0.46 * ease3(k * 1.4), fade, t);
    // tiang cahaya tipis mulai naik dari lingkaran sebelum tiang api menyembur
    pillar(ecx(), GY - 4, H * 0.4 * k, 8 + 10 * k, t, 0.55 * fade * k, 3, 0.8);
  }
  /* tiang api menjulang dari lingkaran saat kena; s.t = 0..17 */
  function circleHit(s) {
    const t = s.t,
      H = effH(),
      gy = GY,
      alpha = t < 9 ? 1 : Math.max(0, 1 - (t - 9) / 8);
    circleDraw(s.x, gy, H * 0.46, alpha, t + 10);
    ring(s.x, gy - 4, H * 0.46 + t * 10, Math.max(0, 1 - t / 13) * alpha, GOLD);
    [0, -64, 64, -32, 32].forEach((dx, i) => {
      const te = t - (i === 0 ? 0 : 1 + (i % 2)),
        h = H * (i === 0 ? 1.1 : 0.95) * ease3(te / 3),
        w = (i === 0 ? 36 : 22) * (1 - 0.3 * Math.max(0, (te - 8) / 10));
      pillar(s.x + dx, gy, h, w, t, alpha, i * 11, 0.7);
    });
    if (t < 4) flashAt(s.x, gy - H * 0.3, H * 0.5, 1 - t / 4, "rgba(255,255,230,.9)", "rgba(255,190,80,.4)", "rgba(255,150,40,0)");
    sparksG(s.x, gy - 8, t, 26, 150);
  }

  /* ---------- skill 2: Fireball ---------- */
  function fballFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH(),
      Y = yc(H),
      tx = ecx() - 24;
    if (t <= W0) return charge(fx, fy, t / W0, 1, t, 1.1);
    if (t > AP + 1) return;
    const kf = clampN((t - W0) / (AP - W0), 0, 1),
      e = Math.pow(kf, 1.1),
      d = H * 0.85 * (0.6 + 0.4 * ease3(kf * 2)), // garis tengah bola ~ 0,85 x tinggi efek (> tinggi hero)
      px = fx + (tx - fx) * e,
      py = fy + (Y - fy) * e,
      ang = Math.atan2(Y - fy, tx - fx),
      len = d * 1.5;
    // ekor api meruncing di belakang bola (setinggi bola)
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang);
    const gr = ctx.createLinearGradient(-len, 0, 0, 0);
    gr.addColorStop(0, "rgba(255,90,20,0)");
    gr.addColorStop(0.6, "rgba(255,140,40,.55)");
    gr.addColorStop(1, "rgba(255,230,160,.9)");
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.moveTo(0, -d * 0.5);
    ctx.lineTo(-len, 0);
    ctx.lineTo(0, d * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    fireball(30, t);
    blit(px, py, 0, 0, d / 180, 1, "#ff7a1a");
    if (!rm)
      for (let j = 0; j < 2; j++)
        an.pt.push({ x: px - Math.cos(ang) * d * 0.4, y: py + R(-d * 0.35, d * 0.35), vx: -2 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.5, l: 16, c: P(SPARKG) });
  }
  function fballHit(s) {
    const t = s.t,
      H = effH(),
      Y = yc(H),
      gy = GY,
      grow = ease3(t / 5),
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9);
    if (t < 4) flashAt(s.x, Y, H * 0.6, 1 - t / 4, "rgba(255,255,230,.95)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    fireball(36 * (0.55 + 0.45 * grow), t);
    blit(s.x, Y, 0, 0, (H / (N * PX * 0.9)) * (0.7 + 0.3 * grow), alpha, "#ff7a1a");
    rays(s.x, Y, 12, (H / 2) * grow, 0, GOLD, alpha * 0.9);
    pillar(s.x, gy, H * 0.9 * ease3(t / 3), 30 * (1 - 0.3 * Math.max(0, (t - 8) / 10)), t, alpha * 0.8, s.x | 0, 0.8);
    ring(s.x, gy - 4, 26 + t * 24, Math.max(0, 1 - t / 13) * alpha, GOLD);
    sparksG(s.x, gy - 8, t, 24, 150);
  }

  /* ---------- skill 3: Beam ---------- */
  function beamFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH();
    if (t <= W0) return charge(fx, fy, t / W0, 1, t, 1.1);
    const end = AP + 7;
    if (t > end) return;
    const u = t - W0,
      ext = clampN(u / Math.max(2, AP - W0 - 1), 0, 1),
      env = clampN(u / 3, 0, 1) * (t > AP + 3 ? clampN(1 - (t - AP - 3) / 4, 0, 1) : 1),
      hh = H * env * (1 + 0.06 * Math.sin(t * 1.7)), // tebal sinar ~ 1 x tinggi efek (> tinggi hero)
      tx = ecx() - 10,
      ty = yc(H),
      dx = tx - fx,
      dy = ty - fy,
      full = Math.hypot(dx, dy),
      L = full * ext,
      ang = Math.atan2(dy, dx),
      LY = [
        [1.0, GOLD[1], 0.45],
        [0.8, GOLD[2], 0.75],
        [0.52, GOLD[3], 0.95],
        [0.28, GOLD[4], 1],
        [0.1, "#ffffff", 1],
      ];
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang);
    LY.forEach(([kk, col, al], li) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = clampN(al * (0.4 + 0.6 * env), 0, 1);
      if (li === 0) {
        ctx.shadowColor = "#ff9a1a";
        ctx.shadowBlur = 18 * SC;
      } else ctx.shadowBlur = 0;
      for (let x = 0; x < L; x += 3) {
        const ramp = 0.3 + 0.7 * clampN(x / 90, 0, 1),
          wob = 1 + 0.05 * Math.sin(x * 0.15 - t * 1.3 + li),
          half = (hh * kk * 0.5 * ramp * wob) | 0;
        if (half > 0) ctx.fillRect(x, -half, 3, half * 2);
      }
    });
    ctx.restore();
    flashAt(fx, fy, 70 * env, 1, "rgba(255,255,255,.9)", "rgba(255,190,80,.5)", "rgba(255,150,40,0)");
    flashAt(fx + Math.cos(ang) * L, fy + Math.sin(ang) * L, H * 0.5 * env, 0.9, "rgba(255,255,230,.9)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    if (!rm && t % 2 === 0)
      for (let j = 0; j < 3; j++)
        an.pt.push({ x: fx + Math.cos(ang) * L, y: fy + Math.sin(ang) * L + R(-H * 0.3, H * 0.3), vx: 1 + Math.random() * 3, vy: (Math.random() - 0.5) * 2, l: 16, c: P(SPARKG) });
  }
  function beamHit(s) {
    const t = s.t,
      H = effH(),
      Y = yc(H),
      gy = GY,
      grow = ease3(t / 4),
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9);
    if (t < 4) flashAt(s.x, Y, H * 0.6, 1 - t / 4, "rgba(255,255,230,.95)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    rays(s.x, Y, 12, (H / 2) * grow, 0, GOLD, alpha);
    ring(s.x, gy - 4, 20 + t * 20, Math.max(0, 1 - t / 13) * alpha, GOLD);
    sparksG(s.x, gy - 8, t, 22, 140);
  }
  /* =====================================================================
     PENYIHIR — sihir elemen tambahan (semua LEBIH TINGGI dari hero):
     Kegelapan (id "dark")  -> Black Hole    : lubang hitam berputar di musuh, lalu runtuh + gelombang kejut
     Cahaya    (id "holy")  -> Heavenly Swords: lingkaran suci di langit, 5 pedang emas jatuh, ARENA BERGETAR
     Es        (id "ice")   -> Hujan Es      : 3 pecahan es melesat, tiang es menjulang, hit akhir membekukan musuh
     ===================================================================== */
  const DK = ["#12002a", "#3a0e6e", "#6a2bd6", "#a24dff", "#d6a8ff", "#ffffff"];
  const SPARKD = ["#a24dff", "#d6a8ff", "#ffffff", "#6a2bd6"];
  const HOL = ["#6a5a20", "#d8b84a", "#fff2a8", "#ffffff", "#ffffff", "#ffffff"];
  const SPARKH = ["#fff2a8", "#ffffff", "#ffe680", "#ffffff"];
  const ICE = ["#06223f", "#1767c2", "#3fb4ff", "#aeeeff", "#e8ffff", "#ffffff"];
  const SPARKI = ["#3fb4ff", "#aeeeff", "#ffffff", "#e8ffff"];

  /* bola pengumpul tenaga berwarna (c1 = warna tengah, c2 = warna tepi transparan) */
  function chargeC(fx, fy, k, t, size, c1, c2, spk) {
    if (rm) return;
    const H = effH(),
      r = H * (0.2 + 0.5 * k) * size,
      gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    gr.addColorStop(0, "rgba(255,255,255,.9)");
    gr.addColorStop(0.45, c1);
    gr.addColorStop(1, c2);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * k;
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(fx, fy, r, 0, 6.283);
    ctx.fill();
    ctx.restore();
    for (let j = 0; j < 8; j++) {
      const ang = t * 0.4 + j * 0.785,
        rr = (10 + H * 0.34 * (1 - k) * (0.6 + (0.4 * ((j * 5) % 3)) / 2)) * size;
      sq(Math.round((fx + Math.cos(ang) * rr) / 3) * 3, Math.round((fy + Math.sin(ang) * rr * 0.8) / 3) * 3, 4, 4, spk[j % 4], 0.5 + 0.5 * k);
    }
  }
  /* percikan berwarna dari titik hantam; up = 1 naik ke atas, 0 hanya menyebar */
  function sparksC(x, y, t, n, spread, spk, up = 1) {
    if (rm || t > 20) return;
    for (let i = 0; i < n; i++) {
      const ang = i * 2.399 + 0.7,
        sp = (0.3 + ((i * 7) % 5) * 0.17) * spread,
        e = 1 - (1 - Math.min(1, t / 14)) ** 2,
        px = x + Math.cos(ang) * sp * e,
        py = y + Math.sin(ang) * sp * e * 0.5 - up * t * (1.2 + (i % 4) * 0.6) * 1.4,
        z = i % 3 === 0 ? 4 : 3;
      sq(px, py, z, z, spk[i % 4], clampN(1 - t / 20, 0, 1));
    }
  }

  /* ---------- KEGELAPAN: Black Hole ---------- */
  function holeDraw(x, y, r, t, a, spin = 1) {
    if (a <= 0 || r < 6) return;
    const gr = ctx.createRadialGradient(x, y, r * 0.3, x, y, r * 1.7);
    gr.addColorStop(0, "rgba(120,40,220,.55)");
    gr.addColorStop(0.5, "rgba(90,20,170,.25)");
    gr.addColorStop(1, "rgba(60,0,120,0)");
    ctx.save();
    ctx.globalAlpha = clampN(a, 0, 1);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.7, 0, 6.283);
    ctx.fill();
    ctx.restore();
    // 4 lengan spiral berpiksel yang berputar (makin ke tengah makin terang)
    ctx.save();
    ctx.shadowColor = "#a24dff";
    ctx.shadowBlur = 14 * SC;
    for (let arm = 0; arm < 4; arm++)
      for (let i = 0; i < 46; i++) {
        const f = i / 46,
          rad = r * (0.42 + 0.6 * f),
          ang = arm * 1.5708 + f * 4.2 - t * 0.28 * spin,
          z = f < 0.3 ? 6 : f < 0.65 ? 5 : 3,
          col = DK[f < 0.22 ? 5 : f < 0.45 ? 4 : f < 0.7 ? 3 : 2];
        sq(Math.round((x + Math.cos(ang) * rad) / 3) * 3, Math.round((y + Math.sin(ang) * rad) / 3) * 3, z, z, col, a * (1 - f * 0.5));
      }
    ctx.restore();
    // horizon peristiwa: cakram hitam dengan tepi ungu terang
    ctx.save();
    ctx.globalAlpha = clampN(a, 0, 1);
    ctx.shadowColor = "#d6a8ff";
    ctx.shadowBlur = 20 * SC;
    ctx.fillStyle = DK[4];
    ctx.beginPath();
    ctx.arc(x, y, r * 0.46, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = DK[2];
    ctx.beginPath();
    ctx.arc(x, y, r * 0.43, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, 6.283);
    ctx.fill();
    ctx.restore();
  }
  /* serpihan yang tersedot masuk ke lubang hitam */
  function holePull(x, y, r, t, a) {
    if (rm) return;
    for (let i = 0; i < 20; i++) {
      const ph = (t * 0.045 + i * 0.137) % 1,
        rad = r * (1.9 - 1.5 * ph),
        ang = i * 2.399 + ph * 3 - t * 0.05;
      sq(Math.round((x + Math.cos(ang) * rad) / 3) * 3, Math.round((y + Math.sin(ang) * rad) / 3) * 3, 3, 3, SPARKD[i % 4], a * ph);
    }
  }
  function holeFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH(),
      X = ecx(),
      Y = yc(H);
    if (t <= W0) return chargeC(fx, fy, t / W0, t, 1.0, "rgba(162,77,255,.45)", "rgba(80,20,160,0)", SPARKD);
    if (t > AP + 1) return;
    const k = clampN((t - W0) / (AP - W0), 0, 1),
      r = H * 0.5 * ease3(k * 1.2);
    if (!rm)
      for (let i = 0; i < 16; i++) {
        const u = i / 15,
          px = fx + (X - fx) * u,
          py = fy + (Y - fy) * u + Math.sin(u * 9 - t * 0.8) * 8 * (1 - u); // benang energi tongkat -> lubang hitam
        sq(Math.round(px / 3) * 3, Math.round(py / 3) * 3, 3, 3, SPARKD[i % 4], 0.85 * Math.min(1, k * 3));
      }
    holeDraw(X, Y, r, t, 1);
    holePull(X, Y, r, t, 1);
  }
  function holeHit(s) {
    const t = s.t,
      H = effH(),
      R0 = H * 0.5,
      Y = yc(H),
      gy = GY,
      k = t < 10 ? 0 : clampN((t - 10) / 7, 0, 1),
      r = t < 10 ? R0 * (1 + 0.05 * Math.sin(t)) : R0 * (1 - k) ** 1.6;
    holeDraw(s.x, Y, r, t + 12, 1, 1 + k * 2);
    if (t < 10) holePull(s.x, Y, R0, t + 12, 1);
    // 25% damage menjadi HP pemain: serpihan merah muda melesat ke kiri (ke arah hero)
    if (!rm && (t === 3 || t === 6))
      for (let j = 0; j < 5; j++) an.pt.push({ x: s.x - R0 * 0.4, y: Y + R(-R0 * 0.5, R0 * 0.5), vx: -4 - Math.random() * 3, vy: (Math.random() - 0.5) * 1.5, l: 30, c: P(["#ff7a9a", "#ffc2d0", "#ffffff"]) });
    if (t >= 9) {
      const te = t - 9;
      ring(s.x, gy - 4, 20 + te * 30, Math.max(0, 1 - te / 9), DK);
      ring(s.x, gy - 4, 10 + te * 20, Math.max(0, 1 - te / 8), DK);
    }
    if (t >= 10 && t < 15) flashAt(s.x, Y, R0 * (0.5 + k), 1 - (t - 10) / 5, "rgba(255,255,255,.9)", "rgba(190,120,255,.5)", "rgba(120,40,220,0)");
    sparksC(s.x, Y, t, 22, 160, SPARKD, 0);
  }

  /* ---------- CAHAYA: Heavenly Swords (pedang surgawi turun dari langit + arena bergetar) ---------- */
  const swordSet = (H) => [
    { dx: 0, len: H * 1.3, w: 24, d: 2 },
    { dx: -64, len: H * 1.05, w: 14, d: 1 },
    { dx: 64, len: H * 1.05, w: 14, d: 1 },
    { dx: -126, len: H * 0.9, w: 11, d: 0 },
    { dx: 126, len: H * 0.9, w: 11, d: 0 },
  ];
  /* pedang emas menghadap ke bawah: tip = ujung runcing, len = panjang total, trail = jejak cahaya di atas gagang */
  function swordDown(x, tip, len, w, a, t, trail, pal = HOL, glow = "#fff2a8", tr = "255,245,190") {
    if (a <= 0) return;
    const rows = Math.ceil((len * 0.74) / 3),
      xt = Math.round(x / 3) * 3,
      gyd = tip - rows * 3;
    ctx.save();
    ctx.globalAlpha = clampN(a, 0, 1);
    if (trail > 4) {
      const gr = ctx.createLinearGradient(0, tip - len - trail, 0, tip - len * 0.5);
      gr.addColorStop(0, `rgba(${tr},0)`);
      gr.addColorStop(1, `rgba(${tr},.65)`);
      ctx.fillStyle = gr;
      ctx.fillRect(xt - w * 0.7, tip - len - trail, w * 1.4, trail + len * 0.5);
    }
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16 * SC;
    [
      [w, pal[1]],
      [w * 0.72, pal[2]],
      [w * 0.34, "#ffffff"],
    ].forEach(([ww, col], li) => {
      ctx.fillStyle = col;
      if (li) ctx.shadowBlur = 0;
      for (let r = 0; r < rows; r++) {
        const half = Math.min(ww / 2, 1.5 + r * 1.6);
        ctx.fillRect(Math.round((xt - half) / 3) * 3, tip - (r + 1) * 3, Math.max(3, Math.round((half * 2) / 3) * 3), 3);
      }
    });
    ctx.shadowBlur = 10 * SC;
    ctx.fillStyle = pal[1]; // pelindung bilah
    ctx.fillRect(xt - w * 1.3, gyd - 9, w * 2.6, 9);
    ctx.shadowBlur = 0;
    ctx.fillStyle = pal[2];
    ctx.fillRect(xt - w * 1.3, gyd - 9, w * 2.6, 3);
    ctx.fillStyle = pal[1]; // gagang + pommel
    ctx.fillRect(xt - Math.max(3, w * 0.14), tip - len, Math.max(6, w * 0.28), len - rows * 3 - 9);
    ctx.fillStyle = pal[2];
    ctx.fillRect(xt - w * 0.25, tip - len - 6, w * 0.5, 9);
    ctx.restore();
  }
  function swordsFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      H = effH(),
      X = ecx(),
      gy = GY,
      top = -topY() + 36,
      S = swordSet(H);
    if (t <= W0) return chargeC(fx, fy, t / W0, t, 1.0, "rgba(255,240,170,.5)", "rgba(255,220,120,0)", SPARKH);
    if (t > AP + 1) return;
    const k = clampN((t - W0) / (AP - W0), 0, 1),
      FD = 6;
    // lingkaran suci di langit + kolom cahaya pucat menuju musuh
    circleDraw(X, top + 4, H * 0.55 * ease3(k * 2), 1, t);
    flashAt(X, top, H * 0.5 * k, 0.7, "rgba(255,255,255,.9)", "rgba(255,240,170,.4)", "rgba(255,220,120,0)");
    const cw = H * 0.42 * k,
      cg = ctx.createLinearGradient(0, top, 0, gy);
    cg.addColorStop(0, "rgba(255,245,190,0)");
    cg.addColorStop(0.3, "rgba(255,245,190,.3)");
    cg.addColorStop(1, "rgba(255,245,190,.08)");
    ctx.save();
    ctx.fillStyle = cg;
    ctx.fillRect(X - cw / 2, top, cw, gy - top);
    ctx.restore();
    S.forEach((sw, i) => {
      const land = AP - (2 - sw.d) * 2,
        f = clampN((t - (land - FD)) / FD, 0, 1);
      if (f <= 0) {
        sq(Math.round((X + sw.dx) / 3) * 3, top + 8 + (i % 2) * 6, 6, 6, "#ffffff", 0.6 + 0.4 * Math.sin(t));
        return;
      }
      swordDown(X + sw.dx, top + 18 + (gy + 2 - top - 18) * f * f, sw.len, sw.w, 1, t, 130 * (1 - f * 0.5));
    });
  }
  function holyHit(s) {
    const t = s.t,
      H = effH(),
      gy = GY,
      S = swordSet(H),
      alpha = t < 10 ? 1 : Math.max(0, 1 - (t - 10) / 8),
      grow = ease3(t / 4);
    if (!rm && t === 0) an.se = Math.max(an.se || 0, 36); // arena bergetar
    if (t < 5 && typeof VW === "number") {
      const top = -topY();
      ctx.save();
      ctx.globalAlpha = (1 - t / 5) * 0.55;
      ctx.fillStyle = "#fffbe0";
      ctx.fillRect(0, top, VW, VH - top);
      ctx.restore();
    }
    S.forEach((sw, i) =>
      pillar(s.x + sw.dx, gy, H * (i === 0 ? 1.45 : 1.1) * ease3((t - (sw.d === 2 ? 0 : 1)) / 3), (i === 0 ? 46 : 26) * (1 - 0.3 * Math.max(0, (t - 8) / 10)), t, alpha * 0.8, i * 17, 0.8)
    );
    S.forEach((sw) => swordDown(s.x + sw.dx, gy + 2, sw.len, sw.w, alpha, t, 0));
    for (let r = 0; r < 3; r++) {
      const te = t - r * 3;
      if (te >= 0) ring(s.x, gy - 4, 24 + te * 30, Math.max(0, 1 - te / 14) * alpha, HOL);
    }
    rays(s.x, yc(H), 16, H * 0.75 * grow, 0, HOL, alpha * 0.9);
    if (t < 5) flashAt(s.x, yc(H), H * 0.8, 1 - t / 5, "rgba(255,255,240,.95)", "rgba(255,240,170,.5)", "rgba(255,220,120,0)");
    sparksC(s.x, gy - 8, t, 40, 200, SPARKH);
  }

  /* ---------- ES: Hujan Es (3 pecahan es -> tiang es menjulang; hit akhir membekukan musuh) ---------- */
  function iceShard(x, y, ang, len, w, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.globalAlpha = clampN(a, 0, 1);
    const gr = ctx.createLinearGradient(-len * 1.4, 0, 0, 0);
    gr.addColorStop(0, "rgba(63,180,255,0)");
    gr.addColorStop(1, "rgba(174,238,255,.6)");
    ctx.fillStyle = gr; // ekor beku di belakang pecahan
    ctx.beginPath();
    ctx.moveTo(0, -w * 0.35);
    ctx.lineTo(-len * 1.4, 0);
    ctx.lineTo(0, w * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = "#3fb4ff";
    ctx.shadowBlur = 16 * SC;
    const poly = (k, col) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(len * 0.5 * k, 0);
      ctx.lineTo(len * 0.12 * k, (-w * 0.5) * k);
      ctx.lineTo(-len * 0.5 * k, 0);
      ctx.lineTo(len * 0.12 * k, (w * 0.5) * k);
      ctx.closePath();
      ctx.fill();
    };
    poly(1, ICE[1]);
    ctx.shadowBlur = 0;
    poly(0.82, ICE[2]);
    poly(0.58, ICE[3]);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-len * 0.3, -1.5, len * 0.7, 3);
    ctx.restore();
  }
  function iceFrame(a, K, fx, fy) {
    const { W0 } = phase(a, K),
      t = a.t,
      n = a.n || 3,
      H = effH(),
      Y0 = yc(H),
      hg = typeof HG === "number" ? HG : 4,
      FL = +((a.sk && a.sk.V && a.sk.V.fl) || 9),
      tx = ecx() - 24;
    if (t <= W0) return chargeC(fx, fy, t / W0, t, 1.0, "rgba(80,190,255,.45)", "rgba(40,120,255,0)", SPARKI);
    a.oi = a.oi || [];
    for (let i = 0; i < n; i++) {
      const L = W0 + 1 + i * hg;
      if (t < L || t > L + FL) continue;
      if (!a.oi[i]) a.oi[i] = { x: fx, y: fy };
      const o = a.oi[i],
        ty = Y0 + (i - (n - 1) / 2) * 26,
        e = clampN((t - L) / FL, 0, 1),
        px = o.x + (tx - o.x) * e,
        py = o.y + (ty - o.y) * e,
        ang = Math.atan2(ty - o.y, tx - o.x);
      iceShard(px, py, ang, H * 0.5, H * 0.2, 1);
      if (!rm) an.pt.push({ x: px - Math.cos(ang) * H * 0.3, y: py + R(-H * 0.1, H * 0.1), vx: -1 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.2, l: 16, c: P(SPARKI) });
    }
  }
  /* tiang es bersisi (kiri gelap, kanan terang, garis facet putih) menjulang dari tanah */
  function iceSpike(cx, yb, h, w, a, seed) {
    if (h < 4 || a <= 0) return;
    const rows = Math.ceil(h / 3);
    ctx.save();
    ctx.shadowColor = "#3fb4ff";
    ctx.shadowBlur = 14 * SC;
    for (let r = 0; r < rows; r++) {
      const f = r / rows,
        half = Math.max(1.5, w * 0.5 * (1 - f ** 1.5) * (1 + 0.06 * Math.sin(r * 0.7 + seed))),
        yy = Math.round(yb - (r + 1) * 3),
        x0 = Math.round((cx - half) / 3) * 3,
        xm = Math.round(cx / 3) * 3,
        x1 = Math.round((cx + half) / 3) * 3;
      ctx.globalAlpha = clampN(a * 0.95, 0, 1);
      ctx.fillStyle = ICE[2];
      ctx.fillRect(x0, yy, Math.max(3, xm - x0), 3);
      ctx.fillStyle = ICE[3];
      ctx.fillRect(xm, yy, Math.max(3, x1 - xm), 3);
      if (r % 7 === 3) {
        ctx.fillStyle = ICE[5];
        ctx.fillRect(x0, yy, Math.max(3, x1 - x0), 3);
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  /* balok es bening membungkus musuh (hit akhir) */
  function iceBlock(x, gy, h, w, a) {
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = clampN(a, 0, 1);
    const gr = ctx.createLinearGradient(x, gy - h, x, gy);
    gr.addColorStop(0, "rgba(232,255,255,.75)");
    gr.addColorStop(1, "rgba(63,180,255,.35)");
    ctx.shadowColor = "#3fb4ff";
    ctx.shadowBlur = 18 * SC;
    ctx.fillStyle = gr;
    ctx.strokeStyle = ICE[4];
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, gy);
    ctx.lineTo(x - w / 2, gy - h * 0.8);
    ctx.lineTo(x - w * 0.3, gy - h);
    ctx.lineTo(x + w * 0.3, gy - h);
    ctx.lineTo(x + w / 2, gy - h * 0.8);
    ctx.lineTo(x + w / 2, gy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, gy - h);
    ctx.lineTo(x - w * 0.1, gy - h * 0.35);
    ctx.lineTo(x + w * 0.2, gy - h * 0.6);
    ctx.moveTo(x + w * 0.1, gy);
    ctx.lineTo(x - w * 0.1, gy - h * 0.35);
    ctx.stroke();
    ctx.restore();
  }
  function iceHit(s) {
    const t = s.t,
      H = effH(),
      gy = GY,
      fin = !!s.fin,
      alpha = t < 9 ? 1 : Math.max(0, 1 - (t - 9) / 8),
      grow = ease3(t / 4);
    if (!fin) {
      [0, -22, 22].forEach((dx, i) => iceSpike(s.x + dx, gy, H * (0.75 - Math.abs(dx) * 0.006) * ease3(t / 3), 26, alpha, i * 7));
      ring(s.x, gy - 4, 18 + t * 20, Math.max(0, 1 - t / 12) * alpha, ICE);
      if (t < 3) flashAt(s.x, yc(H), H * 0.35, 1 - t / 3, "rgba(255,255,255,.9)", "rgba(120,210,255,.45)", "rgba(40,120,255,0)");
      sparksC(s.x, gy - 8, t, 14, 110, SPARKI);
      return;
    }
    iceBlock(s.x, gy, H * 0.95, H * 0.5, alpha * 0.85 * clampN((t - 1) / 3, 0, 1));
    [0, -46, 46, -92, 92].forEach((dx, i) => iceSpike(s.x + dx, gy, H * (1.15 - i * 0.06) * ease3((t - (i ? 1 : 0)) / 3), i < 3 ? 34 : 26, alpha, i * 5));
    for (let r = 0; r < 3; r++) {
      const te = t - r * 3;
      if (te >= 0) ring(s.x, gy - 4, 24 + te * 28, Math.max(0, 1 - te / 14) * alpha, ICE);
    }
    rays(s.x, yc(H), 12, H * 0.6 * grow, 0, ICE, alpha * 0.9);
    if (t < 5) flashAt(s.x, yc(H), H * 0.8, 1 - t / 5, "rgba(240,255,255,.95)", "rgba(120,210,255,.5)", "rgba(40,120,255,0)");
    sparksC(s.x, gy - 8, t, 34, 190, SPARKI);
  }
  /* =====================================================================
     PENYIHIR — ULTI "Explosion": lingkaran sihir + kristal api menjulang, 6 ledakan sedang, lalu LEDAKAN RAKSASA
     ===================================================================== */
  function ultMFrame(a, K, fx, fy) {
    let AP = 26;
    try {
      if (typeof atmOf === "function") AP = +atmOf(a, K)[0] || 26;
    } catch (e) {}
    const t = a.t,
      H = effH(),
      X = ecx(),
      gy = GY,
      last = (typeof UH !== "undefined" && UH && UH.ultm && UH.ultm[6]) || 64,
      k = clampN(t / last, 0, 1),
      fade = t > last + 6 ? clampN(1 - (t - last - 6) / 6, 0, 1) : 1;
    if (fade <= 0) return;
    if (t <= AP) charge(fx, fy, t / AP, 1, t, 1.3);
    circleDraw(X, gy, H * (0.3 + 0.2 * k) * ease3(t / 16), fade, t);
    // kristal api menjulang di sekeliling musuh, makin tinggi mendekati ledakan akhir
    for (let i = 0; i < 7; i++) {
      const d = Math.abs(i - 3),
        g = clampN((t - (AP * 0.4 + d * 3)) / 10, 0, 1);
      if (g <= 0) continue;
      const h = Math.max(H, ultH() * 0.7) * (0.35 + 0.4 * k) * ease3(g) * (1 - d * 0.08) * (1 + 0.05 * Math.sin(t * 0.5 + i));
      pillar(X + (i - 3) * 34, gy - 2, h, 8 + 6 * k, t, 0.8 * fade, i * 13, 0.6);
    }
    flashAt(X, GY - ultH() * 0.4, ultH() * (0.18 + 0.32 * k), 0.5 * fade, "rgba(255,240,200,.8)", "rgba(255,150,60,.35)", "rgba(255,100,30,0)");
    if (!rm && t % 2 === 0)
      an.pt.push({ x: X + R(-90, 90), y: gy - 6, vx: (Math.random() - 0.5) * 1.2, vy: -2 - Math.random() * 3, l: 22, c: P(SPARKG) });
  }
  /* ledakan; s.fin = ledakan raksasa terakhir */
  function ultMHit(s) {
    const fin = !!s.fin,
      t = fin ? s.t * 0.72 : s.t,
      H = effH(),
      FH = ultH(),
      Y = fin ? GY + 10 - FH / 2 : yc(H),
      gy = GY,
      grow = ease3(t / (fin ? 5 : 4)),
      alpha = t < (fin ? 9 : 8) ? 1 : Math.max(0, 1 - (t - (fin ? 9 : 8)) / (fin ? 6 : 9));
    if (fin) {
      if (t < 6 && typeof VW === "number") {
        const top = -topY();
        ctx.save();
        ctx.globalAlpha = (1 - t / 6) * 0.6;
        ctx.fillStyle = "#fff0b0";
        ctx.fillRect(0, top, VW, VH - top);
        ctx.restore();
      }
      for (let r = 0; r < 3; r++) {
        const te = t - r * 3;
        if (te >= 0) ring(s.x, gy - 4, 30 + te * 34 * Math.min(1.5, FH / (H * 1.55)), Math.max(0, 1 - te / 14) * alpha, GOLD);
      }
      const fs = FH / (H * 1.55); // pembesar relatif terhadap ukuran lama
      pillar(s.x, gy, FH * 1.08 * ease3(t / 4), 70 * Math.min(1.6, fs) * (1 - 0.3 * Math.max(0, (t - 8) / 8)), t, alpha * 0.85, s.x | 0, 1);
      fireball(33 * (0.5 + 0.5 * grow), t);
      blit(s.x, Y, 0, 0, (FH / (2 * 33 * PX)) * (0.7 + 0.3 * grow), alpha, "#ff5a1a");
      rays(s.x, Y, 24, FH * 0.62 * grow, 0, GOLD, alpha);
      wings(s.x, gy - 6, t, 1.3 * Math.min(1.5, fs), alpha);
      if (t < 5) flashAt(s.x, Y, FH * 0.62, 1 - t / 5, "rgba(255,255,230,.95)", "rgba(255,190,80,.5)", "rgba(255,150,40,0)");
      sparksG(s.x, gy - 8, t, 56, 230 * Math.min(1.5, fs));
      return;
    }
    if (t < 4) flashAt(s.x, Y, H * 0.5, 1 - t / 4, "rgba(255,255,230,.95)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    fireball(24 * (0.55 + 0.45 * grow), t);
    blit(s.x, Y, 0, 0, ((H * 0.75) / (2 * 24 * PX)) * (0.7 + 0.3 * grow), alpha, "#ff7a1a");
    rays(s.x, Y, 8, (H / 2) * 0.85 * grow, s.rot || 0, GOLD, alpha * 0.9);
    ring(s.x, gy - 4, 18 + t * 18, Math.max(0, 1 - t / 13) * alpha, GOLD);
    sparksG(s.x, gy - 8, t, 12, 100);
  }
  /* ---------- peluru sihir penyihir (serangan biasa, Kegelapan, Hujan Es): bola meluncur LURUS ke musuh ---------- */
  function orbFrame(a, K, fx, fy) {
    const { W0, AP } = phase(a, K),
      t = a.t,
      n = a.n || 1,
      V = (a.sk && a.sk.V) || {},
      hg = typeof HG === "number" ? HG : 4,
      FL = +V.fl || AP - W0,
      el = a.sk && a.sk.el,
      hex = (el && typeof EL !== "undefined" && EL[el] && EL[el].c) || (a.sk && a.sk.col) || "#c99aff",
      [cr, cg, cb2] = /^#[0-9a-f]{6}$/i.test(hex) ? hexRGB(hex) : [201, 154, 255],
      c0 = `rgba(${cr},${cg},${cb2},0)`,
      c1 = `rgba(${cr},${cg},${cb2},.55)`,
      rad = V.t === "dark" ? 34 : V.t === "ice" ? 24 : 28,
      tx = ecx() - 24;
    a.o3 = a.o3 || [];
    if (t <= W0) {
      const k = t / W0;
      flashAt(fx, fy, 14 + 34 * k, 0.55 + 0.45 * k, "rgba(255,255,255,.9)", c1, c0);
      for (let j = 0; j < 6; j++) {
        const ang = t * 0.4 + j * 1.047,
          rr = 8 + 36 * (1 - k);
        sq(Math.round((fx + Math.cos(ang) * rr) / 3) * 3, Math.round((fy + Math.sin(ang) * rr * 0.8) / 3) * 3, 4, 4, hex, 0.5 + 0.5 * k);
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      const L = W0 + 1 + i * hg;
      if (t < L || t > L + FL) continue;
      if (!a.o3[i]) a.o3[i] = { x: fx, y: fy };
      const o = a.o3[i],
        ty = 150 + (n > 1 ? (i - (n - 1) / 2) * 18 : 0),
        e = clampN((t - L) / FL, 0, 1),
        px = o.x + (tx - o.x) * e,
        py = o.y + (ty - o.y) * e,
        ang = Math.atan2(ty - o.y, tx - o.x),
        len = rad * 3.2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ang);
      const gr = ctx.createLinearGradient(-len, 0, 0, 0);
      gr.addColorStop(0, c0);
      gr.addColorStop(1, c1);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.moveTo(0, -rad * 0.8);
      ctx.lineTo(-len, 0);
      ctx.lineTo(0, rad * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      flashAt(px, py, rad * 1.5, 1, "rgba(255,255,255,.95)", c1, c0);
      sq(px - 6, py - 6, 12, 12, "#ffffff", 1);
      if (!rm) an.pt.push({ x: px - Math.cos(ang) * rad, y: py + R(-rad * 0.5, rad * 0.5), vx: -1.5 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.2, l: 14, c: hex });
    }
  }


  /* =====================================================================
     PENDEKAR PEDANG — skill ELEMEN
     Api   (fire) -> Fire Slash   : 2 tebasan sabit api (lidah api di tepi sabit), disusul LEDAKAN (efek ledakan penyihir yang ada)
     Es    (ice)  -> Ice Swords   : 3 pedang es (bentuk pedang Heavenly Swords, warna es) melayang lalu ditembakkan; tertancap -> pecah,
                                    hit akhir memunculkan tiang es + membekukan musuh (efek es penyihir)
     Petir (bolt) -> Thunder Slash: hero dash (garis kecepatan kuning) -> tebasan sabit listrik -> petir menyambar dari langit (efek petir pemanah)
     Skill dikenali dari sk.el (atau sk.id) = "fire" / "ice" / "bolt" milik pendekar pedang (id pow/pen/crt/atk/ult tidak disentuh).
     ===================================================================== */
  const FIRE = ["#4a0a00", "#b01800", "#ff4a0a", "#ff9a1a", "#ffe14a", "#ffffff"];
  const SPARKF = ["#ff4a0a", "#ff9a1a", "#ffe14a", "#ffffff"];
  /* palet pedang es: [1] bilah luar, [2] bilah dalam / gagang terang */
  const ICESW = ["#06223f", "#3fb4ff", "#aeeeff", "#ffffff", "#ffffff", "#ffffff"];
  const swEl = (sk) => {
    if (!sk || /^(pow|pen|crt|atk|ult)$/.test(String(sk.id))) return null;
    const e = sk.el || sk.id;
    return e === "fire" || e === "ice" || e === "bolt" ? e : null;
  };

  /* lidah api berpiksel di sepanjang tepi cembung sabit (digambar di kanvas kerja, ikut diputar/diskalakan) */
  function slashFlames(R, A, t, pal) {
    const out = t > 10 ? Math.max(0, 1 - (t - 10) / 8) : 1,
      sd = Math.floor(t / 2) * 7.3,
      n = 28;
    if (out <= 0) return;
    g.save();
    g.translate(-R * 0.6, 0);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1),
        a = -A * 0.97 + 2 * A * 0.97 * u,
        hh = (2 + 7 * srnd(i * 1.7 + sd)) * (0.45 + 0.55 * Math.sin(Math.PI * u)) * out;
      for (let d = 0; d < hh; d++) {
        const r = R + 1 + d,
          q = d / hh;
        g.fillStyle = q < 0.25 ? pal[4] : q < 0.55 ? pal[3] : q < 0.85 ? pal[2] : pal[1];
        g.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r - d * 0.6), 1, 1);
      }
    }
    g.restore();
  }
  /* percikan listrik bergerigi yang menyambar keluar dari tepi sabit */
  function slashZap(R, A, t, pal) {
    if (t > 14) return;
    const sd = Math.floor(t / 1.5) * 11.3;
    g.save();
    g.translate(-R * 0.6, 0);
    for (let i = 0; i < 9; i++) {
      const a = (srnd(i * 5.3 + sd) * 2 - 1) * A * 0.95,
        ca = Math.cos(a),
        sa = Math.sin(a),
        steps = 4 + Math.floor(srnd(i * 2.1 + sd) * 5);
      let px = ca * R,
        py = sa * R;
      for (let st = 0; st < steps; st++) {
        const nx = px + ca * 2 + (srnd(i * 9.1 + st * 3.7 + sd) - 0.5) * 5,
          ny = py + sa * 2 + (srnd(i * 7.7 + st * 5.3 + sd + 4) - 0.5) * 5,
          m = Math.max(Math.abs(nx - px), Math.abs(ny - py), 1);
        for (let q = 0; q <= m; q++) {
          g.fillStyle = q % 2 ? pal[3] : pal[5];
          g.fillRect(Math.round(px + ((nx - px) * q) / m), Math.round(py + ((ny - py) * q) / m), 1, 1);
        }
        px = nx;
        py = ny;
      }
    }
    g.restore();
  }
  /* tebasan sabit elemen (api / petir): s.t = 0..17, s.big = skala, s.rot = kemiringan, s.flip = cermin */
  function elSlash(s, el) {
    const fire = el === "fire",
      pal = fire ? FIRE : BOL,
      spk = fire ? SPARKF : SPARKB,
      glow = fire ? "#ff5a1a" : "#ffe14d",
      t = s.t,
      k = t / 16,
      grow = ease3(t / 6),
      sc = 0.6 + 0.4 * grow,
      alpha = t < 8 ? 1 : Math.max(0, 1 - (t - 8) / 9),
      H = Math.min(effH() * bk(s.big) * CFG.swSlash, GY + topY() + 14), // lebih besar dari hero (tebasan skill 1 x swSlash)
      v = cresV(16, 1.3, 1.0, s.rot, s.flip),
      f = H / v.h,
      Y = yc(H) - v.mid * f,
      A = 0.95 + 0.35 * grow;
    clear();
    g.save();
    cresStack(16, A, 1.1 - 0.3 * k, t < 10 ? 4 : 3, pal);
    g.restore();
    if (fire) slashFlames(16, A, t, pal);
    else slashZap(16, A, t, pal);
    warp(s.x, s.y, s.x, Y, f, () => {
      blit(s.x, s.y, s.rot, s.flip, sc, alpha, glow);
      if (t < 4)
        flashAt(s.x, s.y, 48, 1 - t / 4, "rgba(255,255,255,.9)", fire ? "rgba(255,150,60,.5)" : "rgba(255,235,120,.5)", fire ? "rgba(255,80,20,0)" : "rgba(255,200,40,0)");
      sparksC(s.x, s.y, t, 16, 70, spk, 0);
    });
  }

  /* pedang es menghadap kanan (ujung di (x,y)), memakai bentuk pedang Heavenly Swords tapi berwarna es; phi = arah terbang */
  function swordIceDraw(x, y, phi, len, w, a, trail) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(phi - Math.PI / 2);
    swordDown(0, 0, len, w, a, 0, trail, ICESW, "#3fb4ff", "174,238,255");
    ctx.restore();
  }
  const swTY = (i, H) => yc(H) + (i - 1) * H * 0.24; // tinggi tancap pedang ke-i (0..2) di musuh
  /* fase tembak (dipanggil tiap frame dari jobFrame): 3 pedang es terbentuk di depan hero, lalu melesat satu per satu */
  function swordIceFrame(a, K, fx, fy) {
    const { W0 } = phase(a, K),
      t = a.t,
      H = effH(),
      hg = typeof HG === "number" ? HG : 4,
      FL = +((a.sk && a.sk.V && a.sk.V.fl) || 9),
      tx = ecx() - 10,
      len = H * 0.85,
      w = H * 0.075,
      hover = (i) => ({ x: fx + len * 0.9, y: fy + (i - 1) * H * 0.3 });
    a.os = a.os || [];
    if (t <= W0) chargeC(fx, fy, t / W0, t, 0.8, "rgba(80,190,255,.45)", "rgba(40,120,255,0)", SPARKI);
    for (let i = 0; i < 3; i++) {
      const L = W0 + 1 + i * hg;
      if (t < L) {
        const gk = ease3((clampN(t / W0, 0, 1)) * 1.2),
          h = hover(i);
        swordIceDraw(h.x, h.y, 0, len * (0.35 + 0.65 * gk), w * (0.5 + 0.5 * gk), 0.4 + 0.6 * gk, 0);
        continue;
      }
      if (t > L + FL) continue;
      if (!a.os[i]) a.os[i] = hover(i);
      const o = a.os[i],
        ty = swTY(i, H),
        e = Math.pow(clampN((t - L) / FL, 0, 1), 1.3),
        px = o.x + (tx - o.x) * e,
        py = o.y + (ty - o.y) * e,
        phi = Math.atan2(ty - o.y, tx - o.x);
      swordIceDraw(px, py, phi, len, w, 1, 110);
      if (!rm) an.pt.push({ x: px - Math.cos(phi) * len * 0.5, y: py + R(-w, w), vx: -1.5 - Math.random() * 2, vy: (Math.random() - 0.5) * 1.2, l: 16, c: P(SPARKI) });
    }
  }
  /* pedang es tertancap di musuh lalu pecah. s.idx = 0..2 (tinggi tancap), s.fin = hit terakhir */
  function iceSwordHit(s) {
    const t = s.t,
      H = effH(),
      i = s.idx | 0,
      ty = s.y + (i - 1) * H * 0.24,
      tx = s.x - 10,
      alpha = t < 10 ? 1 : Math.max(0, 1 - (t - 10) / 6),
      grow = ease3(t / 4),
      qv = Math.sin(t * 2.2) * 3 * Math.max(0, 1 - t / 10); // pedang bergetar setelah menancap
    if (t < 4) flashAt(tx, ty, H * 0.32, 1 - t / 4, "rgba(255,255,255,.95)", "rgba(120,210,255,.5)", "rgba(40,120,255,0)");
    swordIceDraw(tx + qv, ty, 0, H * 0.85, H * 0.075, alpha, 0);
    rays(tx, ty, 8, H * 0.25 * grow, 0, ICE, alpha * 0.9);
    ring(s.x, GY - 4, 16 + t * 16, Math.max(0, 1 - t / 11) * alpha * 0.8, ICE);
    sparksC(tx, ty, t, s.fin ? 18 : 10, s.fin ? 120 : 80, SPARKI, 0);
    if (!s._sh && t >= 10 && !rm) {
      s._sh = 1; // pecah: serpihan es beterbangan
      for (let j = 0; j < 14; j++)
        an.pt.push({ x: tx - R(0, H * 0.6), y: ty + R(-10, 10), vx: R(-2, 4), vy: R(-3, 1), l: 24, c: P(SPARKI) });
    }
  }

  /* percikan listrik pendek di sekitar pedang */
  function crackle(x, y, t) {
    if (rm) return;
    const seed = Math.floor(t / 2) * 13;
    for (let j = 0; j < 3; j++) {
      const a = srnd(j * 4.1 + seed) * 6.283,
        L = 36 + srnd(j + seed) * 40;
      boltDraw(boltPath(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, seed + j, 16), 3, 0.9);
    }
  }
  /* efek saat hero mengayun (dipanggil tiap frame dari jobFrame); fx,fy = ujung pedang, hx,hy = tangan hero.
     Api & petir: gelombang sabit besar meluncur ke musuh (seperti skill 1) sebelum tebasan hantam.
     Petir: hero BENAR-BENAR maju (dash) lewat globalThis.SWDASH yang dibaca heroB() di hero_pixel.js, lalu kembali ke posisi semula. */
  function swordElFrame(el, a, K, fx, fy, hx, hy) {
    if (el === "ice") return swordIceFrame(a, K, fx, fy);
    const { W0, AP } = phase(a, K),
      t = a.t,
      fire = el === "fire",
      pal = fire ? FIRE : BOL,
      spk = fire ? SPARKF : SPARKB,
      glow = fire ? "#ff5a1a" : "#ffe14d";
    if (!fire && typeof hx === "number") {
      const dd = globalThis.SWDASH;
      if (a._hx0 == null) a._hx0 = hx - (dd && Date.now() - dd.ts < 250 ? dd.x : 0);
      const D = clampN(ecx() - 120 - a._hx0, 40, 360) * (CFG.swDash == null ? 1 : CFG.swDash);
      let x = 0;
      if (t <= W0) x = D * ease3(t / W0); // maju cepat
      else if (t <= AP + 4) x = D; // tebas di depan musuh
      else if (t <= AP + 12) x = D * (1 - ease3((t - AP - 4) / 8)); // kembali ke posisi awal
      globalThis.SWDASH = { x, ts: Date.now() };
    }
    if (t > W0 && t <= AP) {
      const e = clampN((t - W0) / Math.max(1, AP - W0), 0, 1);
      wave(fx + (ecx() - 60 - fx) * e, fy, t, pal, spk, glow);
    }
    if (fire) {
      if (t <= W0) chargeC(fx, fy, t / W0, t, 0.4, "rgba(255,120,30,.5)", "rgba(255,60,0,0)", SPARKF);
      if (t <= W0 + 8) {
        flashAt(fx, fy, 36, 0.8, "rgba(255,255,200,.9)", "rgba(255,120,30,.5)", "rgba(255,60,0,0)"); // bilah menyala
        if (!rm)
          for (let j = 0; j < 2; j++)
            an.pt.push({ x: fx + R(-8, 8), y: fy + R(-8, 8), vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random() * 1.8, l: 18, c: P(SPARKF) });
      }
      return;
    }
    if (t <= W0 + 2 && typeof hx === "number") dashTrail(hx + 8, hy + 62, t, TINT[3], SPARKB);
    if (t <= W0 + 8) crackle(fx, fy, t);
  }


  /* =====================================================================
     ULTI PEDANG — Excalibur versi baru (mengikuti gambar referensi, 4 tahap):
       1) hero mengangkat PEDANG EMAS RAKSASA, garis cahaya naik dari tanah, lingkaran sihir di kaki
       2) PILAR cahaya dari ujung pedang ke langit, lingkaran halo di atas, sinar memancar, bintang berkilau
       3) hero maju & menembakkan SINAR EMAS tebal lurus ke musuh, cincin cahaya di ujung pedang
       4) sinar terus menyala selama hantaman beruntun (DPS), tiap hantaman = ledakan bintang; hantaman terakhir = ledakan raksasa
     Ukuran diatur di CFG: excH, excW, excBeam, excBurst, excLunge.
     ===================================================================== */
  const GOLDSW = [GOLD[0], GOLD[3], GOLD[4], GOLD[5], GOLD[5], GOLD[5]];
  /* bintang berkilau 4 sudut berpiksel */
  function star4(x, y, r, a) {
    if (a <= 0) return;
    const cx = Math.round(x / 3) * 3,
      cy = Math.round(y / 3) * 3;
    for (let d = 3; d <= r; d += 3) {
      const al = a * (1 - d / (r + 3)),
        c = d < r * 0.4 ? "#ffffff" : GOLD[4];
      sq(cx + d, cy, 3, 3, c, al);
      sq(cx - d - 3, cy, 3, 3, c, al);
      sq(cx, cy + d, 3, 3, c, al);
      sq(cx, cy - d - 3, 3, 3, c, al);
    }
    sq(cx - 3, cy - 3, 9, 9, "#ffffff", a);
  }
  /* garis cahaya vertikal naik dari tanah di sekitar hero */
  function excStreaks(x0, H, k, t, a) {
    if (a <= 0) return;
    ctx.save();
    for (let j = -7; j <= 7; j++) {
      const x = Math.round((x0 + j * H * 0.075) / 3) * 3,
        h = H * (0.45 + 0.9 * srnd(j * 3.1 + 1)) * ease3(k) * (0.85 + 0.15 * Math.sin(t * 0.4 + j)),
        gr = ctx.createLinearGradient(0, GY - h, 0, GY);
      gr.addColorStop(0, "rgba(255,215,90,0)");
      gr.addColorStop(1, "rgba(255,225,120,.55)");
      ctx.globalAlpha = clampN(a, 0, 1);
      ctx.fillStyle = gr;
      ctx.fillRect(x, GY - h, j % 3 === 0 ? 6 : 3, h);
    }
    ctx.restore();
  }
  /* pedang emas raksasa menghadap ke atas; gagang di tangan (hx,hy). Mengembalikan y ujung pedang */
  function excSword(hx, hy, H, sc, a, t) {
    const len = H * CFG.excH * sc,
      tipY = hy - len * 0.74;
    if (a <= 0 || sc <= 0.02) return tipY;
    flashAt(hx, hy - len * 0.4, len * 0.45, 0.55 * a, "rgba(255,255,230,.8)", "rgba(255,190,80,.3)", "rgba(255,150,40,0)");
    ctx.save();
    // pose angkat pedang: gagang dipotong supaya hanya sepanjang genggaman hero (bukan batang panjang menutupi badan)
    const grip = globalThis.EXCHAND && CFG.excRaise ? hy + CFG.excGrip * sc : null;
    if (grip != null) {
      ctx.beginPath();
      ctx.rect(hx - len, tipY - len, len * 2, grip - (tipY - len));
      ctx.clip();
    }
    ctx.translate(hx, tipY);
    ctx.rotate(Math.PI);
    swordDown(0, 0, len, H * 0.11 * sc, a, t, 0, GOLDSW, "#ffd24a", "255,225,120");
    ctx.restore();
    if (grip != null) {
      // pommel kecil di ujung gagang
      const pw = Math.max(6, Math.round((H * 0.05 * sc) / 3) * 3);
      sq(Math.round((hx - pw / 2) / 3) * 3, Math.round(grip / 3) * 3, pw, 6, GOLD[4], a);
      sq(Math.round((hx - pw / 2) / 3) * 3 + 3, Math.round(grip / 3) * 3 + 3, Math.max(3, pw - 6), 3, "#ffffff", a);
    }
    return tipY;
  }
  /* sinar emas tebal dari ujung pedang (fx,fy) ke musuh + cincin cahaya vertikal di pangkalnya */
  function excBeam(fx, fy, t, u, env) {
    const H = effH(),
      tx = ecx() - 6,
      ty = yc(H),
      dx = tx - fx,
      dy = ty - fy,
      full = Math.hypot(dx, dy),
      L = full * ease3(u / 3),
      ang = Math.atan2(dy, dx),
      hh = H * 0.62 * CFG.excBeam * env * (1 + 0.05 * Math.sin(t * 1.7)),
      LY = [
        [1.0, GOLD[1], 0.45],
        [0.8, GOLD[2], 0.75],
        [0.52, GOLD[3], 0.95],
        [0.28, GOLD[4], 1],
        [0.1, "#ffffff", 1],
      ];
    if (env <= 0 || hh < 2) return;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(ang);
    LY.forEach(([kk, col, al], li) => {
      ctx.fillStyle = col;
      ctx.globalAlpha = clampN(al * (0.4 + 0.6 * env), 0, 1);
      if (li === 0) {
        ctx.shadowColor = "#ff9a1a";
        ctx.shadowBlur = 20 * SC;
      } else ctx.shadowBlur = 0;
      for (let x = 0; x < L; x += 3) {
        const ramp = 0.35 + 0.65 * clampN(x / 80, 0, 1),
          pul = 1 + 0.1 * Math.sin(x * 0.09 - t * 1.5 + li),
          half = (hh * kk * 0.5 * ramp * pul) | 0;
        if (half > 0) ctx.fillRect(x, -half, 3, half * 2);
      }
    });
    // cincin cahaya vertikal: 3 cincin tetap di ujung pedang + denyut cincin yang berjalan sepanjang sinar
    ctx.shadowBlur = 0;
    for (let i = 0; i < 6; i++) {
      const moving = i >= 3,
        p = moving ? ((t * 4 + (i - 3) * 32) % 100) / 100 : 0,
        x = moving ? 14 + p * 100 : 12 + i * 16,
        ry = hh * (moving ? 0.9 - 0.4 * p : 0.95 - i * 0.14),
        al = env * (moving ? 1 - p : 1 - i * 0.18);
      ctx.globalAlpha = clampN(al, 0, 1);
      ctx.lineWidth = 6;
      ctx.strokeStyle = GOLD[3];
      ctx.beginPath();
      ctx.ellipse(x, 0, ry * 0.28, ry, 0, 0, 6.283);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(x, 0, ry * 0.28, ry, 0, 0, 6.283);
      ctx.stroke();
    }
    ctx.restore();
    flashAt(fx, fy, hh * 0.9, 0.9 * env, "rgba(255,255,255,.95)", "rgba(255,200,90,.5)", "rgba(255,150,40,0)");
    flashAt(fx + Math.cos(ang) * L, fy + Math.sin(ang) * L, H * 0.5 * env, 0.9, "rgba(255,255,230,.9)", "rgba(255,190,80,.45)", "rgba(255,150,40,0)");
    if (!rm && t % 2 === 0)
      for (let j = 0; j < 3; j++) {
        const q = Math.random() * L;
        an.pt.push({ x: fx + Math.cos(ang) * q, y: fy + Math.sin(ang) * q + R(-hh * 0.6, hh * 0.6), vx: 0.5 + Math.random() * 2, vy: (Math.random() - 0.7) * 1.4, l: 18, c: P(SPARKG) });
      }
  }
  /* dipanggil tiap frame dari jobFrame saat ulti pedang (K "ult"): tahap 1-3; hx,hy = tangan hero */
  function excUlt(a, K, fx, fy, hx, hy) {
    if (rm) return;
    let AP = 24;
    try {
      if (typeof atmOf === "function") AP = +atmOf(a, K)[0] || 24;
    } catch (e) {}
    AP = clampN(AP, 20, 40);
    const t = a.t,
      H = effH(),
      k = clampN(t / AP, 0, 1),
      lastUH = typeof UH !== "undefined" && UH && Array.isArray(UH.ult) && UH.ult.length ? UH.ult[UH.ult.length - 1] : AP + 40,
      end = a._exEnd != null ? a._exEnd + 5 : lastUH + 6,
      raising = CFG.excRaise && t >= 1 && t < AP - 3, // tahap hero mengangkat pedang (sebelum menembak)
      cur = globalThis.EXCHAND,
      eh = raising && cur && Date.now() - cur.ts < 600 ? cur : a._exHand || null, // posisi kepalan terangkat (dari hero_excalibur.js)
      px = eh ? eh.x : typeof hx === "number" ? hx : fx,
      py = eh ? eh.y - CFG.excGuardUp : typeof hy === "number" ? hy : fy,
      feet = eh ? eh.feet : px - heroH() * 0.16,
      skyY = -topY() + 40;
    if (eh && raising) a._exHand = { x: eh.x, y: eh.y, feet: eh.feet }; // ingat posisinya: pilar & halo tetap di tempat saat hero maju menembak
    globalThis.EXCRAISE = raising ? { ts: Date.now() } : null; // dibaca heroB() di hero_excalibur.js
    // hero maju sedikit saat menembak (dibaca heroB() di hero_pixel.js)
    {
      const L0 = CFG.excLunge || 0,
        x = t < AP - 3 ? 0 : t <= end ? L0 * ease3((t - AP + 3) / 4) : t <= end + 8 ? L0 * (1 - ease3((t - end) / 8)) : 0;
      globalThis.SWDASH = { x, ts: Date.now() };
    }
    if (t > end + 10) return;
    // ---- tahap 1-2: pedang raksasa, pilar ke langit, halo, sinar memancar ----
    if (t <= AP + 4) {
      const fade = t <= AP ? 1 : 1 - (t - AP) / 4,
        sc = k < 0.5 ? ease3(k / 0.5) : 1 - 0.45 * ((k - 0.5) / 0.5);
      excStreaks(feet, H, k, t, 0.9 * fade);
      circleDraw(feet, GY, H * 0.42 * ease3(k * 1.5), fade, t); // lingkaran sihir di kaki
      const tipY = excSword(px, py, H, sc, fade, t);
      if (k > 0.3) {
        const e = ease3((k - 0.3) / 0.7),
          top = Math.min(tipY, py - H * 0.5);
        // kolom cahaya lembut dari langit ke tanah + pilar terang dari ujung pedang
        const cw = H * 0.5 * e * CFG.excW,
          cg = ctx.createLinearGradient(0, skyY, 0, GY);
        cg.addColorStop(0, "rgba(255,230,140,0)");
        cg.addColorStop(0.4, "rgba(255,230,140,.35)");
        cg.addColorStop(1, "rgba(255,230,140,.12)");
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.fillStyle = cg;
        ctx.fillRect(px - cw / 2, skyY, cw, GY - skyY);
        ctx.restore();
        pillar(px, top, (top - skyY + 20) * e, (8 + 20 * k) * CFG.excW, t, (0.45 + 0.5 * k) * fade, 5, 0.3);
        circleDraw(px, skyY + 10, H * 0.95 * e * CFG.excW * 0.7, fade * 0.9, t); // halo luar
        circleDraw(px, skyY + 10, H * 0.62 * e * CFG.excW * 0.7, fade * 0.9, t + 20); // halo dalam
        rays(px, top + (py - top) * 0.3, 18, H * 1.25 * e, t * 0.01, GOLD, 0.4 * fade);
      }
      for (let j = 0; j < 12; j++) {
        const cyc = ((t * 0.7 + j * 5.3) % 14) / 14,
          sx = feet + (srnd(j * 7.3) * 2 - 1) * H * 0.7,
          sy = GY - srnd(j * 3.7 + 2) * H * 1.5;
        star4(sx, sy, 9 + 12 * srnd(j + 4), Math.sin(cyc * Math.PI) * k * fade);
      }
    }
    // ---- tahap 3-4: sinar emas sampai hantaman terakhir ----
    if (t >= AP - 2 && t <= end + 8) {
      const u = t - (AP - 2),
        env = clampN(u / 3, 0, 1) * (t > end ? clampN(1 - (t - end) / 8, 0, 1) : 1);
      excBeam(fx, fy, t, u, env);
    }
  }
  /* ledakan bintang di musuh tiap hantaman; s.fin = hantaman terakhir (raksasa); s.dy = geser vertikal */
  function excBeamHit(s) {
    const fin = !!s.fin,
      t = fin ? s.t * 0.72 : s.t,
      H = effH(),
      Y = yc(H) + (s.dy || 0),
      gy = GY,
      m = CFG.excBurst,
      grow = ease3(t / (fin ? 5 : 4)),
      alpha = t < (fin ? 9 : 7) ? 1 : Math.max(0, 1 - (t - (fin ? 9 : 7)) / (fin ? 7 : 8));
    if (!s._sk && !rm) {
      s._sk = 1;
      an.se = Math.max(an.se || 0, fin ? 34 : 10); // arena bergetar
    }
    if (fin && t < 5 && typeof VW === "number") {
      const top = -topY();
      ctx.save();
      ctx.globalAlpha = (1 - t / 5) * 0.5;
      ctx.fillStyle = "#fff0b0";
      ctx.fillRect(0, top, VW, VH - top);
      ctx.restore();
    }
    if (t < 4) flashAt(s.x, Y, H * (fin ? 0.9 : 0.5) * m, 1 - t / 4, "rgba(255,255,255,.95)", "rgba(255,200,90,.5)", "rgba(255,150,40,0)");
    flashAt(s.x, Y, H * (fin ? 0.7 : 0.32) * m, 0.9 * alpha, "rgba(255,255,255,.95)", "rgba(255,225,130,.45)", "rgba(255,170,60,0)");
    rays(s.x, Y, fin ? 28 : 14, H * (fin ? 1.25 : 0.65) * m * grow, s.rot || 0, GOLD, alpha);
    if (fin) rays(s.x, Y, 14, H * 0.8 * m * grow, 0.11, GOLD, alpha * 0.8);
    ring(s.x, gy - 4, (fin ? 30 : 18) + t * (fin ? 26 : 16), Math.max(0, 1 - t / 13) * alpha, GOLD);
    if (fin && t > 2) ring(s.x, gy - 4, 14 + (t - 2) * 18, Math.max(0, 1 - (t - 2) / 13) * alpha, GOLD);
    sparksG(s.x, gy - 8, t, fin ? 40 : 12, (fin ? 220 : 100) * m);
  }

  const MFR = { ult: ultMFrame, circle: circleFrame, fball: fballFrame, beam: beamFrame, hole: holeFrame, swords: swordsFrame, ice: iceFrame };
  const mageFrame = (k, a, K, fx, fy) => (MFR[k] || beamFrame)(a, K, fx, fy);

  return {
    gold: true,
    cfg: CFG,
    heroH,
    effH,
    ARC_ID,
    arcKind,
    wave,
    hit,
    dashTrail,
    dashHit,
    jumpTrail,
    jumpHit,
    excCharge,
    excHit,
    ultBg,
    SPARKG,
    shotFrame,
    basicFrame,
    arcEl,
    boltHit,
    mageKind,
    mageFrame,
    circleHit,
    fballHit,
    beamHit,
    ultMHit,
    holeHit,
    holyHit,
    iceHit,
    ultH,
    orbFrame,
    rainFrame,
    giantFrame,
    ultFrame,
    rainHit,
    giantHit,
    burstHit,
    ultHit,
    yc,
    swEl,
    elSlash,
    iceSwordHit,
    swordElFrame,
    excUlt,
    excBeamHit,
  };
})();

/* ---------- sambungkan ke sistem efek yang sudah ada (tanpa mengubah logika battle) ---------- */
(() => {
  const isSword = () => ((typeof Pl !== "undefined" && Pl && Pl.job) || "sword") === "sword";
  const isArcher = () => typeof Pl !== "undefined" && !!Pl && Pl.job === "archer";
  const isMage = () => typeof Pl !== "undefined" && !!Pl && Pl.job === "mage";
  const seen = {};
  const log = (what) => {
    if (!seen[what]) {
      seen[what] = 1;
      try {
        console.info("[SKFX pemanah]", what);
      } catch (e) {}
    }
  };
  /* pasang pembungkus dengan aman: bila fungsi aslinya tidak ada / tidak bisa ditimpa, lewati saja */
  const hook = (name, make) => {
    try {
      if (typeof globalThis[name] === "function") make();
    } catch (e) {
      try {
        console.warn("[SKFX] gagal memasang", name, e);
      } catch (e2) {}
    }
  };
  /* tahan semua gambar dari fungsi lama (logika tetap jalan): dipakai agar efek bawaan jobs.js tidak tumpang tindih */
  const MUTE = ["fillRect", "strokeRect", "fill", "stroke", "drawImage", "fillText", "strokeText"];
  const muted = (fn) => {
    const noop = () => {};
    MUTE.forEach((m) => {
      ctx[m] = noop;
    });
    try {
      return fn();
    } finally {
      MUTE.forEach((m) => {
        delete ctx[m];
      });
    }
  };

  /* warna ulti emas: dipakai script.js lewat ultHue() / ultCol() (null = pakai pelangi bawaan) */
  globalThis.ultHue = () => (SKFX.gold && isSword() ? 36 + 12 * Math.sin(Date.now() / 160) : 0);
  globalThis.ultCol = (j) => (SKFX.gold && isSword() ? SKFX.SPARKG[((j % 4) + 4) % 4] : null);

  /* ---- efek susulan (drawSlash) ---- */
  hook("drawSlash", () => {
    const _ds = drawSlash;
    drawSlash = function (s) {
      if (s.kind === "sxh") return SKFX.hit(s);
      if (s.kind === "sxd") return SKFX.dashHit(s);
      if (s.kind === "sxj") return SKFX.jumpHit(s);
      if (s.kind === "sxe") return SKFX.excHit(s);
      if (s.t >= 0 && s.kind === "sxb") return SKFX.excBeamHit(s); // ledakan bintang sinar Excalibur
      if (s.t >= 0 && s.kind === "sxf") return SKFX.elSlash(s, "fire"); // tebasan api
      if (s.t >= 0 && s.kind === "sxl") return SKFX.elSlash(s, "bolt"); // tebasan petir
      if (s.t >= 0 && s.kind === "sxi") return SKFX.iceSwordHit(s); // pedang es tertancap
      if (s.t >= 0 && s.kind === "axb") return SKFX.burstHit(s);
      if (s.t >= 0 && s.kind === "axr") return SKFX.rainHit(s);
      if (s.t >= 0 && s.kind === "axg") return SKFX.giantHit(s);
      if (s.t >= 0 && s.kind === "axu") return SKFX.ultHit(s);
      if (s.t >= 0 && s.kind === "mxc") return SKFX.circleHit(s);
      if (s.t >= 0 && s.kind === "mxf") return SKFX.fballHit(s);
      if (s.t >= 0 && s.kind === "mxb") return SKFX.beamHit(s);
      if (s.t >= 0 && s.kind === "mxu") return SKFX.ultMHit(s);
      if (s.t >= 0 && s.kind === "axf") return SKFX.fballHit(s); // panah api kena: ledakan bola api (efek penyihir)
      if (s.t >= 0 && s.kind === "axm") return SKFX.ultMHit(s); // panah api hit antara: ledakan sedang
      if (s.t >= 0 && s.kind === "axl") return SKFX.boltHit(s); // panah petir kena: petir menyambar
      if (s.t >= 0 && s.kind === "mxh") return SKFX.holeHit(s);
      if (s.t >= 0 && s.kind === "mxs") return SKFX.holyHit(s);
      if (s.t >= 0 && s.kind === "mxi") return SKFX.iceHit(s);
      if (/^(ax|mx)/.test(s.kind || "")) return;
      return _ds.apply(this, arguments);
    };
  });

  /* tambah efek susulan langsung ke antrean (tanpa lewat slashFx, supaya tidak ikut dimatikan saat ulti) */
  const arcFx = (kind, x, y, extra = {}) => {
    if (rm) return;
    an.sf.push(Object.assign({ t: extra.delay || 0, col: "#fff", kind, x, y, big: 1, flip: 0, rot: 0 }, extra));
  };
  const arcHit = (kind, i, fin, r) => {
    const X = ecx() + (fin ? 0 : R(-8, 8)),
      Y = SKFX.yc(SKFX.effH());
    if (kind === "shot") {
      arcFx("axb", X, Y, { fin: fin ? 1 : 0, rot: fin ? 0 : (i - 1) * 0.3 });
      if (fin && r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, white: 1, delay: -2 });
    } else if (kind === "rain") {
      arcFx("axr", X + (fin ? 0 : [-84, -42, 42, 84][i % 4]), GY, { fin: fin ? 1 : 0 });
      if (fin && r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, gold: 1, delay: -1 });
    } else if (kind === "giant") {
      if (fin) {
        arcFx("axg", X, Y);
        if (r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, gold: 1, delay: -1 });
      } else arcFx("axb", X, Y, { fin: 0, gold: 1, rot: (i - 1) * 0.3 });
    }
  };

  /* panah elemen pemanah: api -> ledakan, es -> tiang es + membeku (efek es penyihir), petir -> petir turun menyambar */
  const arcElHit = (el, i, fin, r) => {
    const X = ecx() + (fin ? 0 : R(-8, 8)),
      Y = SKFX.yc(SKFX.effH());
    if (el === "fire") arcFx(fin ? "axf" : "axm", X, Y, { fin: fin ? 1 : 0, rot: (i - 1) * 0.3 });
    else if (el === "ice") arcFx("mxi", X, GY, { fin: fin ? 1 : 0 });
    else arcFx("axl", X, Y, { fin: fin ? 1 : 0 });
    if (fin && r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, gold: 1, delay: -1 });
  };

  /* skill elemen pendekar pedang: api = tebasan api + ledakan, es = pedang es tertancap + tiang es/membeku, petir = tebasan listrik + petir menyambar */
  const swHit = (el, i, fin, r) => {
    const X = ecx(),
      Y = SKFX.yc(SKFX.effH()),
      sd = i % 2;
    if (el === "fire") {
      if (fin) {
        arcFx("sxf", X, Y, { big: 1.15, rot: -0.55, flip: 0 });
        arcFx("sxf", X, Y + 4, { big: 0.8, rot: 0.5, flip: 1, delay: -2 });
        arcFx("mxf", X, Y, { delay: -4 }); // ledakan bola api (efek penyihir)
      } else {
        arcFx("sxf", X, Y, { big: 0.85, rot: sd ? 0.5 : -0.5, flip: sd });
        arcFx("axm", X, Y, { fin: 0, rot: (i - 1) * 0.3, delay: -3 }); // ledakan sedang
      }
    } else if (el === "ice") {
      arcFx("sxi", X, Y, { idx: fin ? 2 : sd, fin: fin ? 1 : 0 });
      if (fin) arcFx("mxi", X, GY, { fin: 1, delay: -3 }); // tiang es + membeku
    } else if (fin) {
      arcFx("sxl", X, Y, { big: 1.15, rot: -0.55, flip: 0 });
      arcFx("sxl", X, Y + 4, { big: 0.8, rot: 0.5, flip: 1, delay: -2 });
      arcFx("axl", X, Y, { fin: 1, delay: -4 }); // petir menyambar dari langit
    } else {
      arcFx("sxl", X, Y, { big: 0.85, rot: sd ? 0.5 : -0.5, flip: sd });
      arcFx("axl", X, Y, { fin: 0, delay: -3 });
    }
    if (fin && r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, gold: 1, delay: -1 });
  };

  /* ---- Pendekar Pedang: efek kena (hitFx) ---- */
  hook("hitFx", () => {
    const _hf = hitFx;
    hitFx = function (act, r, col) {
      if (isSword() && (act === "pow" || act === "pen" || act === "crt")) {
        const X = ecx(),
          Y = 150;
        if (act === "pow") {
          slashFx("#ff3a2e", "sxh", X, Y, 1.15, 0, -0.55, 0);
          slashFx("#ffd47a", "sxh", X, Y + 4, 0.8, 1, 0.5, -3);
        } else if (act === "pen") {
          slashFx("#ff3a2e", "sxd", X, Y, 1.1, 0, -0.12, 0);
        } else {
          slashFx("#ff3a2e", "sxj", X, Y, 1.3, 0, 0.95, 0); // sabit besar jatuh dari kiri-atas + gelombang tanah
          slashFx("#ffd47a", "sxj", X + 8, Y - 4, 0.7, 1, -0.5, -3); // sabit kecil menyilang
        }
        if (r.crit) slashFx("#fff", "c", X, Y, 1.2, 1, 0.7, -2); // crit: tetap ada kilatan putih lama
        if (r.pen && act === "pow") slashFx("#7cf0ff", "p", X, Y, 1.1, 0, 0, -1);
        return;
      }
      if (isSword()) {
        const el = SKFX.swEl(typeof skill === "function" ? skill(act) : null);
        if (el) {
          log("hitFx " + act + " -> sword " + el);
          swHit(el, 0, true, r);
          return;
        }
      }
      if (isArcher()) {
        const k = SKFX.arcKind(typeof skill === "function" ? skill(act) : null);
        if (k && k !== "ult") {
          log("hitFx " + act + " -> " + k);
          arcHit(k, 0, true, r);
          return;
        }
      }
      if (isArcher()) {
        const el = SKFX.arcEl(typeof skill === "function" ? skill(act) : null);
        if (el) {
          log("hitFx " + act + " -> archer " + el);
          arcElHit(el, 0, true, r);
          return;
        }
      }
      if (isMage()) {
        const k = SKFX.mageKind(typeof skill === "function" ? skill(act) : null);
        if (k) {
          log("hitFx " + act + " -> mage " + k);
          const X = ecx(),
            Y = SKFX.yc(SKFX.effH());
          const MK = { circle: ["mxc", GY], fball: ["mxf", Y], beam: ["mxb", Y], hole: ["mxh", Y], swords: ["mxs", GY], ice: ["mxi", GY] }[k] || ["mxb", Y];
          arcFx(MK[0], X, MK[1], k === "ice" ? { fin: 1 } : {});
          if (r && r.crit) arcFx("axb", X, Y, { fin: 1, rot: 0.39, gold: 1, delay: -1 });
          return;
        }
      }
      return _hf.apply(this, arguments);
    };
  });

  /* ---- Pemanah: hit kecil & hit terakhir lewat jalur job (sk.V) ---- */
  hook("jobMini", () => {
    const _jm = jobMini;
    jobMini = function (sk, col, i) {
      if (isSword() && SKFX.swEl(sk)) {
        log("jobMini " + (sk && sk.id) + " -> sword " + SKFX.swEl(sk));
        swHit(SKFX.swEl(sk), i, false);
        return;
      }
      if (isMage() && SKFX.mageKind(sk) === "ice") {
        log("jobMini " + (sk && sk.id) + " -> mage ice");
        arcFx("mxi", ecx() + R(-34, 34), GY, { fin: 0 });
        return;
      }
      if (isArcher() && SKFX.arcEl(sk)) {
        log("jobMini " + (sk && sk.id) + " -> archer " + sk.el);
        arcElHit(sk.el, i, false);
        return;
      }
      if (isArcher()) {
        const k = SKFX.arcKind(sk);
        if (k && k !== "ult") {
          log("jobMini " + (sk && sk.id) + " -> " + k);
          arcHit(k, i, false);
          return;
        }
      }
      return _jm.apply(this, arguments);
    };
  });
  hook("jobImpact", () => {
    const _ji = jobImpact;
    jobImpact = function (act, r, col) {
      if (isSword()) {
        const el = SKFX.swEl(typeof skill === "function" ? skill(act) : null);
        if (el) {
          log("jobImpact " + act + " -> sword " + el);
          swHit(el, 0, true, r);
          return true;
        }
      }
      if (isArcher()) {
        const el = SKFX.arcEl(typeof skill === "function" ? skill(act) : null);
        if (el) {
          log("jobImpact " + act + " -> archer " + el);
          arcElHit(el, 0, true, r);
          return true;
        }
      }
      if (isArcher()) {
        const k = SKFX.arcKind(typeof skill === "function" ? skill(act) : null);
        if (k && k !== "ult") {
          log("jobImpact " + act + " -> " + k);
          arcHit(k, 0, true, r);
          return true;
        }
      }
      return _ji.apply(this, arguments);
    };
  });

  /* ---- jobFrame: jejak lompat & Excalibur (pedang) + pelepasan panah (pemanah) ---- */
  hook("jobFrame", () => {
    const _jf = jobFrame;
    jobFrame = function (a, K, fx, fy, hx, hy) {
      if (a && !rm) {
        if (isSword()) {
          if (K === "jump" && a.sk && a.sk.id === "crt" && a.t <= 14) SKFX.jumpTrail(hx + 8, hy + 62, a.t);
          else if (K === "ult") SKFX.excUlt(a, K, fx, fy, hx, hy);
          else if (K !== "ult" && SKFX.swEl(a.sk)) {
            // skill elemen pedang: logika lama jalan tanpa gambar & tanpa sabetan bawaan, diganti efek elemen
            const el = SKFX.swEl(a.sk),
              n0 = an.pt.length,
              sf = slashFx;
            log("jobFrame K=" + K + " skill=" + (a.sk && a.sk.id) + " -> sword " + el);
            slashFx = () => {};
            let ret;
            try {
              ret = muted(() => _jf.apply(this, arguments));
            } finally {
              slashFx = sf;
            }
            if (an.pt.length > n0) an.pt.length = n0;
            SKFX.swordElFrame(el, a, K, fx, fy, hx, hy);
            return ret;
          }
        } else if (isArcher()) {
          const ult = K === "ult" || (typeof ULTK !== "undefined" && ULTK && ULTK[K]),
            k = ult ? "ult" : SKFX.arcKind(a.sk);
          if (k) {
            log("jobFrame K=" + K + " skill=" + (a.sk && a.sk.id) + " -> " + k);
            // jalankan logika lama tapi tanpa gambarnya (efek bawaan jobs.js diganti efek katalog)
            const n0 = an.pt.length;
            const ret = muted(() => _jf.apply(this, arguments));
            if (an.pt.length > n0) an.pt.length = n0;
            if (k === "shot") SKFX.shotFrame(a, K, fx, fy);
            else if (k === "rain") SKFX.rainFrame(a, K, fx, fy);
            else if (k === "giant") SKFX.giantFrame(a, K, fx, fy);
            else SKFX.ultFrame(a, K, fx, fy);
            return ret;
          }
          if (K === "shoot" && a.sk && a.sk.V && a.sk.V.t === "arrow" && (a.sk.id === "atk" || a.sk.el)) {
            // serangan biasa & panah elemen (api/es/petir): logika lama jalan tanpa gambar (panah lengkung dimatikan), diganti panah lurus
            const n0 = an.pt.length;
            const ret = muted(() => _jf.apply(this, arguments));
            if (an.pt.length > n0) an.pt.length = n0;
            SKFX.basicFrame(a, K, fx, fy);
            return ret;
          }
        } else if (isMage() && (K === "cast" || K === "ultm")) {
          const k = K === "ultm" ? "ult" : SKFX.mageKind(a.sk),
            orb = !k && K === "cast" && a.sk && a.sk.V && /^(orb|dark|ice)$/.test(a.sk.V.t);
          if (k || orb) {
            log("jobFrame " + K + " -> mage " + k);
            // logika lama jalan tanpa gambar & tanpa sabetan bawaan (petir/bola lama), diganti efek katalog
            const n0 = an.pt.length,
              sf = slashFx;
            slashFx = () => {};
            let ret;
            try {
              ret = muted(() => _jf.apply(this, arguments));
            } finally {
              slashFx = sf;
            }
            if (an.pt.length > n0) an.pt.length = n0;
            if (k) SKFX.mageFrame(k, a, K, fx, fy);
            else SKFX.orbFrame(a, K, fx, fy);
            return ret;
          }
        }
      }
      return _jf.apply(this, arguments);
    };
  });

  /* ---- ulti pedang: Pedang Pelangi tampil sebagai Excalibur; ulti pemanah: Arrow Storm.
     Logika damage / hit-stop / suara tetap milik doUlt / jobUlt; di sini hanya efek visual tiap hantaman yang diganti.
     Ubah SKFX.gold = false untuk mengembalikan ulti pedang ke pelangi. ---- */
  hook("doUlt", () => {
    const _du = doUlt;
    doUlt = function () {
      const out = _du.apply(this, arguments);
      if (SKFX.gold && isSword() && an && an.a && an.a.k === "ult" && !an.a._ex) {
        an.a._ex = 1;
        const cb = an.a.cb,
          A = an.a,
          OFF = [-58, 46, -26, 60, -4, 28]; // sebaran 6 ledakan kecil di sekitar musuh
        an.a.cb = function (i) {
          const sf = slashFx,
            bu = typeof burst === "function" ? burst : null,
            hn = typeof hitNum === "function" ? hitNum : null;
          slashFx = () => {}; // matikan sabit pelangi bawaan
          if (bu) burst = (x, y, c) => bu(x, y, c === "#fff" || c === "#ffffff" ? c : SKFX.SPARKG[(Math.random() * 3) | 0]);
          if (hn) hitNum = (d, c, o) => hn(d, i === 6 ? "#fff0a8" : "#ffd24a", o);
          let ret;
          try {
            ret = cb.apply(this, arguments);
          } finally {
            slashFx = sf;
            if (bu) burst = bu;
            if (hn) hitNum = hn;
          }
          const X = ecx(),
            Y = 150;
          if (i < 6) arcFx("sxb", X + OFF[i] * 0.5, Y, { fin: 0, rot: (i - 2) * 0.2, dy: R(-30, 30) });
          else {
            arcFx("sxb", X, Y, { fin: 1 }); // ledakan bintang raksasa, tepat di hantaman terakhir
            A._exEnd = A.t; // sinar padam sesaat setelah ini
          }
          return ret;
        };
      } else if ((isArcher() || isMage()) && an && an.a && typeof an.a.cb === "function" && !an.a._ax) {
        an.a._ax = 1;
        log("ulti " + (isMage() ? "penyihir" : "pemanah") + " k=" + an.a.k);
        const cb = an.a.cb;
        an.a.cb = function (i) {
          const sf = slashFx,
            jm = typeof jobMini === "function" ? jobMini : null,
            ji = typeof jobImpact === "function" ? jobImpact : null;
          slashFx = () => {}; // matikan sabit / sinar bawaan jobs.js
          if (jm) jobMini = () => {};
          if (ji) jobImpact = () => true;
          let ret;
          try {
            ret = cb.apply(this, arguments);
          } finally {
            slashFx = sf;
            if (jm) jobMini = jm;
            if (ji) jobImpact = ji;
          }
          if (isMage()) {
            const fm = i >= 6;
            arcFx("mxu", ecx() + (fm ? 0 : R(-50, 50)), SKFX.yc(SKFX.effH()), { fin: fm ? 1 : 0, rot: (i - 2) * 0.2 });
            return ret;
          }
          const k = an.a && an.a.k,
            tot = (typeof UH !== "undefined" && UH && UH[k] && UH[k].length) || (an.a && an.a.n) || 6,
            fin = i >= tot - 1;
          arcFx("axu", ecx() + (fin ? 0 : R(-16, 16)), SKFX.yc(SKFX.effH()), { fin: fin ? 1 : 0, rot: (i - 2) * 0.2 });
          return ret;
        };
      }
      return out;
    };
  });
})();
