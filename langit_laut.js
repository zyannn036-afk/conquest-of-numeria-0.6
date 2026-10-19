/* ===== Numeria Quest — Kota Langit Aeria (ras malaikat) & Kota Bawah Laut Aquaria (ras duyung) =====
   Dimuat PALING AKHIR (setelah utara.js). Tidak mengubah file lain; semua dibungkus dari sini.
   Cara kerja singkat (mengikuti pola utara.js):
   - Aeria dan Aquaria adalah peta besar terpisah (id "AN" dan "AQ"), bukan bagian dari peta dunia "O".
   - KOTA LANGIT: pintunya "Tangga Awan" di puncak Pegunungan Naga (peta "NG"), terbuka setelah Zerath dikalahkan.
       Jalur: Tangga Awan -> Pulau Dermaga -> Kota Aeria (istana, plaza, rumah) -> jembatan sempit ke utara
              -> Altar Seraph (bos: Nolzael, Malaikat Jatuh). Ada 4 pulau kecil di sudut + 2 pulau sayap.
   - KOTA BAWAH LAUT: pintunya "Pusaran Mutiara" di Samudra Prima (peta "O"), hanya bisa dimasuki naik perahu
       dan guild minimal Rank C (lihat MIN_RANK_SEA). Jalur: pusaran -> Gerbang Gelembung -> Kota Aquaria
       -> punggung karang di utara -> Makam Kapal Karam (bos: Leviathan).
   - Monster muncul acak saat berjalan (tiap STEPS langkah) di luar area aman.
   - Tidak ada penginapan (penginapan selalu keluar ke peta dunia), jadi pemulihan lewat kristal di tiap kota.
   Bagian yang mudah diubah ada di blok "pengaturan" tepat di bawah ini. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const MIN_RANK_SEA = 2, // rank guild minimal untuk masuk Aquaria (0=E, 1=D, 2=C, 3=B, ...)
    SKY_GATE = [46, 2], // pintu Tangga Awan di puncak Pegunungan Naga (peta "NG"), di utara dataran sarang Zerath
    SEA_GATE = [228, 72], // pusaran di Samudra Prima (peta "O"), petak laut di sebelah timur Pelabuhan Sigma
    SEA_BACK = [229, 72], // tempat perahu muncul lagi setelah keluar dari Aquaria
    STEPS = 16; // tiap sekian langkah, game "melempar dadu" untuk memunculkan monster

  /* ---------- nama wilayah & tema warna ---------- */
  Object.assign(MN, { AN: "Kota Langit Aeria", AQ: "Kota Bawah Laut Aquaria" });
  // x = lantai awan marmer (Aeria), m = dasar laut berpasir (Aquaria). a/b = lantai kotak-kotak, t/t2 = pohon
  Object.assign(TH, {
    x: { a: "#f2f6ff", b: "#e6edfa", w: "#9fb4d8", w2: "#c4d4ee", t: "#f0d070", t2: "#fff6c0" },
    m: { a: "#cdbd8a", b: "#c3b380", w: "#1a3a5a", w2: "#2a5a7a", t: "#e86a8a", t2: "#ffb0c8" },
  });

  /* ---------- sprite monster (pakai ulang gambar lama dengan warna baru; versi besar & animasi ikut) ---------- */
  const recolor = (k, base, pal) =>
    ["", "L"].forEach((s) => {
      const b = SP[base + s];
      SP[k + s] = { p: { ...b.p, ...pal }, m: b.m, a: b.a };
    });
  recolor("cloudbird", "owl", { B: "#f4f8ff", b: "#bcd0ee", W: "#ffffff", Y: "#ffd24d" });
  recolor("windspirit", "pixie", { G: "#bfe8ff", P: "#7ab8ff", M: "#ffffff", W: "#ffffff" });
  recolor("thundergolem", "golem", { S: "#e8eef8", D: "#8a9ac0", Y: "#ffe14d" });
  recolor("seraphstatue", "gargoyle", { P: "#f0e8c8", p: "#b8a878", H: "#ffffff", Y: "#7cf0ff" });
  recolor("fallenangel", "gargoyle", { P: "#2a2040", p: "#140c24", H: "#e8d8ff", Y: "#ff3050" });
  recolor("eel", "cobra", { G: "#2a6ab8", g: "#7ac8ff", D: "#1a3a78", Y: "#fff04a", R: "#ffffff" });
  recolor("lanternfish", "shark", { G: "#2a5a8a", g: "#5ac8e8", Y: "#fff04a", W: "#d8fbff" });
  recolor("reefcrab", "crab", { R: "#b86ae0", r: "#7a3aa8", Y: "#fff04a", W: "#f0d8ff" });
  recolor("glowjelly", "jelly", { B: "#c890ff", b: "#f0d8ff", D: "#8a5ad0", R: "#7cf0c8" });
  recolor("leviathan", "dragon", { P: "#1f8aa8", D: "#0f4a68", Y: "#ffe14d", W: "#bff6ff" });

  /* ---------- monster (indeks E dihitung otomatis) ---------- */
  const ALL = ["arit", "pecahan", "persen", "geom", "alj"],
    EI = {},
    mon = (key, o) => {
      EI[key] = E.length;
      E.push({ sp: key, d: [3, 5], s: 4, ...o });
    };
  const bgS = ["#2f6ac0", "#f8d8a0", "#a8c0e8", "#ffffff"], // langit siang
    bgSB = ["#1a1030", "#b04a8a", "#2a1a3a", "#ffe0ff"], // altar, bos
    bgQ = ["#06304a", "#1a8ab0", "#0a2a40", "#bff6ff"], // dasar laut
    bgQB = ["#021a2e", "#0a6a8a", "#03121e", "#7cf0c8"]; // makam kapal, bos
  // --- Aeria (setelah Zerath, jadi lebih kuat dari monster Pegunungan Naga) ---
  mon("cloudbird", {
    n: "Merpati Awan Persentase", hp: 430, atk: 34, topics: ["persen", "pecahan"], weak: "persen", xp: 160, coin: 120, bg: bgS,
    intro: "Segerombol merpati putih menukik dari awan. Setiap kepakan sayapnya mengubah angka jadi persen!",
    win: "Merpati itu melebur menjadi kapas awan.",
  });
  mon("windspirit", {
    n: "Roh Angin Sudut", hp: 460, atk: 35, topics: ["arit", "geom"], weak: "geom", xp: 170, coin: 126, bg: bgS,
    intro: "Pusaran angin berbentuk peri berputar di sekelilingmu. Sudut-sudut tajam menyayat dari segala arah!",
    win: "Roh angin itu mereda menjadi hembusan lembut.",
  });
  mon("thundergolem", {
    n: "Golem Petir Koefisien", hp: 540, atk: 38, topics: ["arit", "alj"], weak: "alj", xp: 190, coin: 140, bg: bgS,
    intro: "Awan hitam memadat jadi golem! Setiap langkahnya melepas petir berkoefisien besar.",
    win: "Golem itu pecah jadi hujan gerimis.",
  });
  mon("seraphstatue", {
    n: "Patung Penjaga Surgawi", hp: 500, atk: 37, topics: ["pecahan", "alj"], weak: "pecahan", xp: 180, coin: 134, bg: bgS,
    intro: "Patung malaikat di pinggir jalan membuka mata. Ia menjaga Aeria dari siapa pun yang tidak bisa berhitung!",
    win: "Patung itu retak, lalu kembali membeku dalam doa.",
  });
  mon("fallenangel", {
    n: "Nolzael Malaikat Jatuh Nol Mutlak", hp: 1500, atk: 48, topics: ALL, weak: "pecahan", d: [4, 5], xp: 700, coin: 900, bg: bgSB,
    intro: "Di Altar Seraph, sayap hitam terbentang. Nolzael, malaikat yang jatuh karena memuja angka nol, menatapmu. Tidak ada jalan mundur!",
    win: 'Sayap hitam Nolzael memudar jadi putih. "Terima kasih... sudah mengingatkanku bahwa nol hanyalah awal," bisiknya.',
  });
  // --- Aquaria ---
  mon("eel", {
    n: "Belut Listrik Gradien", hp: 330, atk: 26, topics: ["alj", "persen"], weak: "alj", xp: 112, coin: 82, d: [2, 5], bg: bgQ,
    intro: "Seekor belut berpendar melilit di antara karang. Tegangannya naik turun seperti gradien!",
    win: "Belut itu menyelinap ke celah karang, listriknya padam.",
  });
  mon("lanternfish", {
    n: "Ikan Lentera Median", hp: 350, atk: 27, topics: ["arit", "persen"], weak: "persen", xp: 118, coin: 88, d: [2, 5], bg: bgQ,
    intro: "Cahaya kecil bergoyang di kegelapan, lalu rahang besar muncul di belakangnya. Ikan Lentera menyerang!",
    win: "Ikan itu berenang pergi, lenteranya meredup.",
  });
  mon("reefcrab", {
    n: "Kepiting Karang Prima", hp: 390, atk: 27, topics: ["pecahan", "geom"], weak: "geom", xp: 126, coin: 94, d: [2, 5], bg: bgQ,
    intro: "Kepiting ungu melambaikan capit. Cangkangnya tak bisa dibagi oleh bilangan mana pun selain dirinya sendiri!",
    win: "Kepiting itu menyelam ke dalam pasir sambil menggerutu.",
  });
  mon("glowjelly", {
    n: "Ubur-ubur Cahaya Rata-rata", hp: 340, atk: 25, topics: ["persen", "pecahan"], weak: "pecahan", xp: 108, coin: 80, d: [2, 5], bg: bgQ,
    intro: "Ubur-ubur berpendar ungu melayang mendekat. Sengatnya meratakan semua angka jadi sama besar!",
    win: "Ubur-ubur itu memudar jadi serpihan cahaya.",
  });
  mon("leviathan", {
    n: "Leviathan Samudra Tak Terhingga", hp: 800, atk: 35, topics: ALL, weak: "alj", d: [4, 5], xp: 480, coin: 620, bg: bgQB,
    intro: "Bangkai kapal berderak. Leviathan, naga laut penjaga Makam Kapal Karam, bangkit dari lumpur dan mengaum. Tidak ada jalan mundur!",
    win: 'Leviathan terkulai dan menunduk. "Kamu layak melihat harta Aquaria," gemuruhnya pelan.',
  });

  /* ---------- musik sintetis tiap kota (nada:lama) ---------- */
  {
    const seq = (s, d = 1) =>
      s
        .trim()
        .split(/\s+/)
        .map((t) => {
          const [n, b] = t.split(":");
          return [n === "-" ? null : n, b ? +b : d];
        });
    SND.tracks.AN = {
      bpm: 76,
      v: [
        { w: "triangle", g: 0.09, n: seq("G5:2 B5:1 A5:1 G5:2 E5:1 D5:1 E5:2 G5:2 A5:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("C3:4 G2:4 A2:4 F2:4") },
        { w: "square", g: 0.02, n: seq("E4 G4 C5 G4 D4 G4 B4 G4 C4 E4 A4 E4 A3 C4 F4 C4", 0.5) },
      ],
    };
    SND.tracks.AQ = {
      bpm: 60,
      v: [
        { w: "triangle", g: 0.09, n: seq("A4:3 C5:1 E5:2 D5:1 C5:1 B4:3 A4:1 G4:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("A2:4 F2:4 C3:4 G2:4") },
        { w: "square", g: 0.02, n: seq("E4:2 A4:2 C5:2 A4:2 D4:2 G4:2 B4:2 G4:2", 1) },
      ],
    };
  }

  /* ---------- sprite warga: malaikat (halo + sayap) & duyung (sirip + ekor ikan) ---------- */
  // tiap model = badan mkRoyal 16x24 yang dimodifikasi; huruf mengikuti palet NPC (W/w = sayap, F/f = sirip)
  const WING = { 5: [0], 6: [0, 1], 7: [0, 1], 8: [0, 1, 2, 3], 9: [0, 1, 2], 10: [0, 1], 11: [0], 12: [0], 13: [0], 14: [0] },
    TAIL = [
      "..KTTTTttTTTTK..",
      "...KTTTVVTTTK...",
      "....KTTttTTK....",
      ".....KTVVTK.....",
      "....KFKTTKFK....",
      "..KFFFKttKFFFK..",
      "..KKKKK..KKKKK..",
    ];
  function angel(sp) {
    const m = sp.m.map((r) => r.split(""));
    m[0] = ".....GGGGGG.....".split(""); // halo emas
    Object.entries(WING).forEach(([j, cols]) =>
      cols.forEach((c) => {
        const ch = j % 2 ? "W" : "w";
        if (m[j][c] === ".") m[j][c] = ch;
        if (m[j][15 - c] === ".") m[j][15 - c] = ch;
      }),
    );
    sp.p = { W: "#ffffff", w: "#b9ceef", ...sp.p };
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  function mer(sp) {
    const m = sp.m.map((r) => r.split(""));
    [[4, [1]], [5, [0, 1]], [6, [1]]].forEach(([j, cs]) =>
      cs.forEach((c) => {
        const ch = j === 5 ? "F" : "f";
        if (m[j][c] === ".") m[j][c] = ch;
        if (m[j][15 - c] === ".") m[j][15 - c] = ch;
      }),
    );
    TAIL.forEach((r, i) => (m[17 + i] = r.split(""))); // ekor ikan menggantikan kaki
    sp.p = { F: "#59d0c8", f: "#a8f0e8", ...sp.p };
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  // palet dasar: malaikat serba putih-emas-biru muda; duyung berkulit kebiruan, ekor bersisik
  const AP = (o) => ({ H: "#f4e8a8", h: "#fff8d0", T: "#f6f8ff", t: "#c8d4ee", V: "#e2b84a", Y: "#e2b84a", P: "#e8eefc", p: "#b8c4e0", O: "#d8c890", S: "#fde8d4", s: "#e8c8a8", ...o }),
    MP2 = (o) => ({ S: "#a8e8e0", s: "#78c8c8", E: "#0a2a40", M: "#d86a8a", V: "#ffe9c8", Y: "#ffd166", ...o });
  Object.assign(SP, {
    angRaja: angel(mkRoyal(AP({ H: "#f0f0f0", h: "#ffffff", A: "#e2b84a", a: "#b8902a", X: "#7cf0ff", T: "#2f4fa8", t: "#1f3578", V: "#f4f1ea" }), { hat: "crown", beard: 1 })),
    angRatu: angel(mkRoyal(AP({ H: "#f8e48a", h: "#fff6c0", A: "#e2b84a", a: "#b8902a", X: "#7cf0ff", T: "#f6f8ff", t: "#c8d4ee", V: "#6fa8ff", E: "#4a7ad0" }), { hat: "tiara", long: 1, dress: 1 })),
    angGuard: angel(mkRoyal(AP({ H: "#e8d890", A: "#e8f0ff", a: "#9ab0d8", X: "#ffffff", T: "#f0f4ff", t: "#b8c8e8", V: "#e2b84a", P: "#dfe8fa", p: "#a8b8d8" }), { hat: "helm", spear: 1 })),
    angCleric: angel(mkRoyal(AP({ H: "#c8e0ff", A: "#ffffff", a: "#cfdaf0", X: "#e2b84a", T: "#e8f0ff", t: "#b8c8e8", V: "#7ab0e8" }), { hat: "hood" })),
    angMerchant: angel(mkRoyal(AP({ H: "#d8b070", A: "#ffe9a0", X: "#ffffff", T: "#ffe9b8", t: "#d8b878", V: "#e08a2f" }), { hat: "scarf" })),
    angKid: angel(mkRoyal(AP({ H: "#ffd8a0", h: "#fff0c8", T: "#cfe8ff", t: "#9ac0e8", V: "#ffffff" }), {})),
    angElder: angel(mkRoyal(AP({ H: "#f4f4f4", M: "#ffffff", T: "#dfe8fa", t: "#b0c0e0", V: "#e2b84a" }), { beard: 1 })),
    angBard: angel(mkRoyal(AP({ H: "#ffb8d8", h: "#ffe0f0", T: "#fff0f8", t: "#e8c0d8", V: "#e2b84a" }), { long: 1 })),
    merRaja: mer(mkRoyal(MP2({ H: "#e8e8e8", h: "#ffffff", A: "#e2b84a", a: "#b8902a", X: "#7cf0c8", T: "#1f8aa8", t: "#0f5a78", V: "#bff6ff", F: "#e2b84a", f: "#fff0a0" }), { hat: "crown", beard: 1 })),
    merRatu: mer(mkRoyal(MP2({ H: "#ff8ac0", h: "#ffc0e0", A: "#e2b84a", a: "#b8902a", X: "#ffffff", T: "#e86a9a", t: "#a8386a", V: "#ffe9f0", F: "#ff8ac0", f: "#ffd0e8" }), { hat: "tiara", long: 1 })),
    merGuard: mer(mkRoyal(MP2({ H: "#1a3a5a", A: "#c9a050", a: "#8a6a20", X: "#fff0a0", T: "#2a6ab8", t: "#1a3a78", V: "#7ac8ff", P: "#3a6ab8", p: "#1a3a78" }), { hat: "helm", spear: 1 })),
    merCleric: mer(mkRoyal(MP2({ H: "#7cf0c8", A: "#e8fff8", a: "#a8d8c8", X: "#ffffff", T: "#e8fff8", t: "#a8d8c8", V: "#59d0c8" }), { hat: "hood" })),
    merMerchant: mer(mkRoyal(MP2({ H: "#ffb070", A: "#f4a050", X: "#ffffff", T: "#f08a50", t: "#b85a2a", V: "#ffe9c8", F: "#f08a50", f: "#ffd0a0" }), { hat: "scarf" })),
    merKid: mer(mkRoyal(MP2({ H: "#59d0e8", h: "#a8f0ff", T: "#ffd0f0", t: "#d890c0", V: "#ffffff", F: "#ffd0f0", f: "#ffffff" }), {})),
    merElder: mer(mkRoyal(MP2({ H: "#e8f4f4", M: "#ffffff", T: "#2a8a8a", t: "#1a5a5a", V: "#ffe9c8" }), { beard: 1 })),
    merBard: mer(mkRoyal(MP2({ H: "#b86ae0", h: "#e8c8ff", T: "#8a5ad0", t: "#5a3a98", V: "#f0d8ff", F: "#b86ae0", f: "#e8c8ff" }), { long: 1 })),
  });

  /* ---------- petak baru ----------
     Aeria  : A = jurang langit (tidak bisa dilewati), = = jembatan awan (bisa dilewati), N = tiang marmer,
              I = dinding rumah malaikat, j = patung malaikat
     Aquaria: W = palung gelap (tidak bisa dilewati), K = karang, X = rumput laut, o = rumah kerang, N = tiang mutiara */
  const NEWSOLID = "AIjNWKXo";
  TILEX += "AIjN=WKXo";
  const MINE = (id) => id === "AN" || id === "AQ";
  {
    const _tx = tileX;
    tileX = function (c, X, Y, x, y, th, t) {
      const g = MP[mp].g,
        up = g[y - 1]?.[x],
        dn = g[y + 1]?.[x],
        fl = (col, a, b, w, h) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, w, h);
        },
        sea = th === "m";
      if (c === "A") {
        // jurang langit: gradasi biru + awan; di bawah pulau tergantung batu & kabut
        const k = Math.min(1, y / MP[mp].h),
          h = (x * 73 + y * 151) % 13,
          o = rm ? 0 : Math.round(Math.sin(t / 900 + x + y));
        fl(`rgb(${Math.round(140 - 60 * k)},${Math.round(200 - 70 * k)},${Math.round(248 - 30 * k)})`, 0, 0, 16, 16);
        if (h < 3) {
          fl("rgba(255,255,255,.55)", 2 + ((h * 3) % 6), 7 + o, 9, 3);
          fl("rgba(255,255,255,.55)", 4 + ((h * 2) % 5), 5 + o, 6, 3);
        }
        if (up && up !== "A" && up !== "=") {
          fl("#8f86a8", 0, 0, 16, 5);
          fl("#6a6288", 0, 5, 16, 2);
          fl("#8f86a8", 2 + ((x * 5) % 6), 7, 4, 3);
          fl("#6a6288", 5 + ((x * 3) % 5), 10, 3, 2);
          fl("rgba(255,255,255,.5)", 0, 0, 16, 1);
        } else if (up === "=") fl("rgba(40,60,120,.25)", 1, 0, 14, 3);
      } else if (c === "=") {
        fl("#f6efd0", 0, 0, 16, 16);
        fl("#e8d9a0", 0, 15, 16, 1);
        fl("#e8d9a0", 15, 0, 1, 16);
        fl("#ffffff", ((x * 5) % 10) + 2, ((y * 3) % 10) + 2, 3, 2);
        if (up === "A") fl("#e2b84a", 0, 0, 16, 2);
        if (dn === "A") fl("#e2b84a", 0, 14, 16, 2);
        if (g[y][x - 1] === "A") fl("#e2b84a", 0, 0, 2, 16);
        if (g[y][x + 1] === "A") fl("#e2b84a", 14, 0, 2, 16);
      } else if (c === "N") {
        fl("rgba(0,0,0,.2)", 1, 14, 15, 2);
        if (sea) {
          fl("#f8e8ee", 4, 3, 8, 12);
          fl("#ffffff", 4, 3, 3, 12);
          fl("#d8a8c0", 10, 3, 2, 12);
          fl("#e86a8a", 2, 0, 12, 3);
          fl("#e86a8a", 2, 14, 12, 2);
        } else {
          fl("#e6ecfa", 4, 3, 8, 12);
          fl("#ffffff", 4, 3, 3, 12);
          fl("#b8c4e0", 10, 3, 2, 12);
          fl("#e2b84a", 2, 0, 12, 3);
          fl("#e2b84a", 2, 14, 12, 2);
        }
      } else if (c === "I") {
        if (up !== "I") {
          fl("#d8e4fa", 0, 0, 16, 16);
          fl("#6a9ae0", 0, 0, 16, 5);
          fl("#e2b84a", 0, 5, 16, 1);
          fl("#8ab4f0", 2, 1, 12, 2);
        } else {
          fl("#f6f8ff", 0, 0, 16, 16);
          if ((x + y) % 2) {
            fl("#e2b84a", 3, 3, 10, 1);
            fl("#7ab0e8", 4, 4, 8, 7);
            fl("#e8f4ff", 5, 5, 3, 2);
          }
        }
        if (dn !== "I") {
          fl("#c8d4ee", 0, 12, 16, 4);
          fl("#e2b84a", 0, 15, 16, 1);
        }
      } else if (c === "j") {
        fl("rgba(0,0,0,.25)", 2, 14, 13, 2);
        fl("#b8c4e0", 3, 11, 10, 5);
        fl("#e6ecfa", 5, 5, 6, 7);
        fl("#fde8d4", 6, 2, 4, 4);
        fl("#ffffff", 2, 4, 3, 7);
        fl("#ffffff", 11, 4, 3, 7);
        fl("#e2b84a", 5, 0, 6, 1);
        if (!rm && Math.sin(t / 400 + x * 3) > 0.6) fl("#ffffff", 7, 7, 2, 2);
      } else if (c === "W") {
        // palung gelap: biru tua + gelembung naik pelan
        fl((x + y) % 2 ? "#0a2a4a" : "#0b2e50", 0, 0, 16, 16);
        if ((x * 7 + y * 5) % 9 === 0) {
          ctx.globalAlpha = 0.4;
          fl("#6ac8f0", 3 + ((x * 3) % 9), rm ? 6 : ((t / 60 + y * 7 + x * 13) % 14) | 0, 2, 2);
          ctx.globalAlpha = 1;
        }
      } else if (c === "K") {
        const v = (x * 7 + y * 13) % 4,
          C1 = [["#e8607a", "#ffb0c0"], ["#f09a4a", "#ffd9a0"], ["#b86ae0", "#e8c8ff"], ["#4ac8c8", "#b8fff0"]][v];
        fl("rgba(0,0,0,.25)", 2, 14, 12, 2);
        fl(C1[0], 6, 6, 4, 9);
        fl(C1[0], 3, 3, 3, 9);
        fl(C1[0], 10, 2, 3, 10);
        fl(C1[0], 1, 7, 3, 3);
        fl(C1[1], 6, 6, 1, 8);
        fl(C1[1], 3, 3, 1, 7);
        fl(C1[1], 10, 2, 1, 8);
      } else if (c === "X") {
        const sw = rm ? 0 : Math.sin(t / 500 + x * 1.3 + y) * 1.6;
        fl("rgba(0,0,0,.2)", 4, 14, 8, 2);
        for (let k = 0; k < 4; k++) {
          const o = Math.round((sw * (4 - k)) / 2);
          fl("#2f9e57", 6 + o, k * 4, 3, 4);
          fl("#5fd078", 6 + o, k * 4, 1, 4);
          if (k % 2) fl("#2f9e57", 3 + o, k * 4 + 1, 3, 2);
        }
      } else if (c === "o") {
        if (up !== "o") {
          fl("#f4b0c4", 0, 0, 16, 16);
          for (let i = 0; i < 4; i++) fl("#e88aa8", i * 4, 0, 2, 7);
          fl("#e86a8a", 0, 7, 16, 1);
          fl("#fff0f4", 3, 3, 2, 2);
        } else {
          fl("#fce4ec", 0, 0, 16, 16);
          if ((x + y) % 2) {
            fl("#e88aa8", 4, 3, 8, 8);
            fl("#5ab8e8", 5, 4, 6, 6);
            fl("#bff6ff", 6, 5, 2, 2);
          }
        }
        if (dn !== "o") {
          fl("#e8b8c8", 0, 12, 16, 4);
          fl("#e86a8a", 0, 15, 16, 1);
        }
      } else if (c === "," && (th === "x" || sea)) {
        // jalan: marmer berurat emas (Aeria) / jalan kerang & mutiara (Aquaria)
        fl(sea ? "#ead8c0" : "#fff8e0", 0, 0, 16, 16);
        fl(sea ? "#d8c0a0" : "#f0e2b0", (x + y) % 2 ? 0 : 8, 0, 1, 16);
        fl(sea ? "#d8c0a0" : "#f0e2b0", 0, (x + y) % 2 ? 8 : 0, 16, 1);
        fl(sea ? "#ffffff" : "#e2b84a", ((x * 5) % 11) + 2, ((y * 7) % 11) + 2, 2, 2);
      } else _tx(c, X, Y, x, y, th, t);
    };
    // kilau lantai: bintang di awan marmer, riak di pasir
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th === "x") {
        if ((x * 7 + y * 13) % 17 === 0) {
          ctx.globalAlpha = rm ? 0.7 : 0.4 + 0.4 * Math.sin(performance.now() / 500 + x * 3 + y);
          ctx.fillStyle = "#ffe9a0";
          ctx.fillRect(X + 4 + ((x * 3) % 7), Y + 4 + ((y * 5) % 6), 2, 2);
          ctx.globalAlpha = 1;
        }
      } else if (th === "m") {
        if ((x * 5 + y * 9) % 7 === 0) {
          ctx.fillStyle = "rgba(255,255,255,.18)";
          ctx.fillRect(X + 2 + ((x * 3) % 8), Y + 6 + ((y * 5) % 6), 5, 1);
        }
      } else _bd(th, X, Y, x, y);
    };
  }

  /* ---------- petak yang tidak bisa dilewati ---------- */
  {
    const _solid = solid;
    solid = (x, y) => _solid(x, y) || (MINE(mp) && NEWSOLID.includes((MP[mp].g[y] || "")[x] || " "));
  }

  /* ---------- alat bantu membuat peta ---------- */
  const SOLIDALL = "#TwBDLfSEMCRPQUZHemGlk" + NEWSOLID,
    rng = (s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    grid = (w, h, c) => [...Array(h)].map(() => Array(w).fill(c)),
    inb = (g, x, y) => x > 0 && y > 0 && y < g.length - 1 && x < g[0].length - 1,
    put = (g, x, y, c) => inb(g, x, y) && (g[y][x] = c),
    box = (g, x, y, w, h, c) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
    },
    // pulau melayang: elips dengan tepi bergelombang halus
    isle = (g, cx, cy, rx, ry, s, c = ".") => {
      for (let y = cy - ry - 3; y <= cy + ry + 3; y++)
        for (let x = cx - rx - 3; x <= cx + rx + 3; x++) {
          const dx = (x - cx) / rx,
            dy = (y - cy) / ry,
            a = Math.atan2(dy, dx),
            r = 1 + 0.09 * Math.sin(3 * a + s) + 0.06 * Math.sin(7 * a + 2 * s);
          if (dx * dx + dy * dy <= r * r) put(g, x, y, c);
        }
    },
    // jembatan awan: hanya menimpa jurang (A), selebar 2*hw+1 petak
    bridge = (g, pts, hw) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) if (inb(g, x + ii, y + j) && g[y + j][x + ii] === "A") g[y + j][x + ii] = "=";
        }
      }
    },
    carve = (g, pts, hw, c = ".", over = "TKX.") => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) if (inb(g, x + ii, y + j) && over.includes(g[y + j][x + ii])) g[y + j][x + ii] = c;
        }
      }
    },
    // tebarkan benda (pohon/karang/rumput laut) hanya di lantai kosong
    scatter = (g, p, r, c) =>
      g.forEach((row, y) => row.forEach((ch, x) => ch === "." && inb(g, x, y) && r() < p && (row[x] = c))),
    // buang penghalang dekoratif di sekitar suatu titik
    clr = (g, cx, cy, rad) => {
      for (let y = cy - rad; y <= cy + rad; y++)
        for (let x = cx - rad; x <= cx + rad; x++) if (inb(g, x, y) && "TKX".includes(g[y][x])) g[y][x] = ".";
    },
    wipe = (g, x0, y0, x1, y1) => {
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) if (inb(g, x, y) && "TKX".includes(g[y][x])) g[y][x] = ".";
    },
    // titik perkiraan -> petak lantai kosong terdekat (supaya peti/kristal tidak jatuh di jurang atau di atas rumah)
    snap = (g, [x, y], used) => {
      for (let r = 0; r <= 6; r++)
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            const a = x + dx,
              b = y + dy;
            if (Math.max(Math.abs(dx), Math.abs(dy)) === r && inb(g, a, b) && ".Tb".includes(g[b][a]) && !used.some(([u, v]) => u === a && v === b)) {
              used.push([a, b]);
              return [a, b];
            }
          }
      console.warn("[langit_laut] titik tidak dapat dipasang", x, y);
      return [x, y];
    },
    // hiasan: hanya dipasang di lantai kosong (tidak menimpa jurang atau bangunan)
    deco = (g, list, c) => list.forEach(([x, y]) => inb(g, x, y) && ".,T".includes(g[y][x]) && (g[y][x] = c)),
    // rumah 4x3 (pintu di tengah bawah). Dilewati kalau sebagian jatuh di luar pulau.
    hut = (g, x, y, ch) => {
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) if (!".,TKX".includes((g[y + j] || [])[x + i] || "A")) return false;
      box(g, x, y, 4, 3, ch);
      put(g, x + 1, y + 2, "E");
      return true;
    },
    pt = (x, y, to, tx, ty, f, more) => ({ t: "portal", mine: 1, x, y, to, tx, ty, f, ...more }),
    chest = (id, [x, y], i) => ({
      t: "chest",
      id,
      x,
      y,
      coin: 320 + i * 14,
      po: i % 2 ? 0 : 1,
      fp: i % 3 === 1 ? 1 : 0,
      sc: i % 5 === 4 ? 1 : 0,
    }),
    wk = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`;

  // pastikan semua titik penting bisa dijangkau dari titik awal; kalau terkurung pohon/karang, buka jalan kecil
  function ensure(g, start, targets, tag) {
    const W = g[0].length,
      H = g.length,
      D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      flood = () => {
        const seen = new Uint8Array(W * H),
          st = [start];
        seen[start[1] * W + start[0]] = 1;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of D4) {
            const a = x + dx,
              b = y + dy;
            if (inb(g, a, b) && !SOLIDALL.includes(g[b][a]) && !seen[b * W + a]) {
              seen[b * W + a] = 1;
              st.push([a, b]);
            }
          }
        }
        return seen;
      },
      route = (a, b, first) => {
        const pts = first === "x" ? [a, [b[0], a[1]], b] : [a, [a[0], b[1]], b];
        for (let i = 0; i < 2; i++) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1],
            n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
          for (let k = 0; k <= n; k++) {
            const x = Math.round(x0 + ((x1 - x0) * k) / n),
              y = Math.round(y0 + ((y1 - y0) * k) / n);
            if (!inb(g, x, y) || !"TKX.,".includes(g[y][x])) return null;
          }
        }
        return pts;
      };
    let seen = flood();
    const near = ([x, y]) => [[0, 0], ...D4].some(([dx, dy]) => seen[(y + dy) * W + x + dx]);
    targets.forEach((t) => {
      if (near(t)) return;
      let best = null,
        bd = 1e9;
      for (let y = 1; y < H - 1; y++)
        for (let x = 1; x < W - 1; x++) {
          const d = Math.abs(x - t[0]) + Math.abs(y - t[1]);
          if (seen[y * W + x] && d < bd) ((bd = d), (best = [x, y]));
        }
      const r = best && (route(t, best, "x") || route(t, best, "y"));
      if (r) carve(g, r, 0, ".");
      seen = flood();
      if (!near(t)) console.warn(`[langit_laut] ${tag}: titik belum terjangkau`, t);
    });
  }

  /* ---------- NPC (spawn sendiri: spawnNpc milik town.js tidak tahu petak baru yang solid) ---------- */
  function spawn(map, e) {
    const g = MP[map].g,
      EL = EN[map],
      ok = (x, y) =>
        x > 0 &&
        y > 0 &&
        y < g.length - 1 &&
        x < g[0].length - 1 &&
        !SOLIDALL.includes(g[y][x]) &&
        g[y][x] !== "=" &&
        !EL.some((o) => o.x === x && o.y === y);
    let best = null;
    for (let r = 0; r <= 4 && !best; r++)
      for (let dy = -r; dy <= r && !best; dy++)
        for (let dx = -r; dx <= r && !best; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(e.x + dx, e.y + dy)) best = [e.x + dx, e.y + dy];
    if (!best) return console.warn("[langit_laut] NPC tidak muat", e.d && e.d[0], e.x, e.y);
    [e.x, e.y] = best;
    e.fx = Object.assign({ face: 1, ox: 0, oy: 0, tm: R(10, 80), go: 0, ph: R(0, 1), home: [e.x, e.y] }, e.fx || {});
    EL.push(e);
  }
  const gn = (map, who, sp, [x, y], lines, fx, more) =>
      spawn(map, { t: "npc", id: "gen", d: [who, lines], sp, x, y, fx: fx || {}, ...more }),
    merchant = (map, sp, [x, y]) => spawn(map, { t: "npc", id: "toko", sp, x, y, fx: {} });

  const ZONES = {}; // aturan monster acak per wilayah: { pool, p (peluang), safe (area aman) }
  const zerath = E.findIndex((m) => m.sp === "zerath"); // pintu Tangga Awan terbuka setelah dia kalah

  /* ===================== 1) KOTA LANGIT AERIA (100x76) ===================== */
  {
    const W = 100,
      H = 76,
      r = rng(5521),
      g = grid(W, H, "A");
    isle(g, 50, 34, 24, 17, 1); // kota utama
    isle(g, 50, 67, 13, 6, 2); // pulau dermaga (tangga awan)
    isle(g, 12, 36, 8, 8, 3); // pulau sayap barat: Taman Awan
    isle(g, 88, 36, 8, 8, 4); // pulau sayap timur: Menara Lonceng
    isle(g, 50, 8, 16, 5, 5); // Altar Seraph
    [[12, 13], [88, 13], [12, 60], [88, 60]].forEach(([x, y], i) => isle(g, x, y, 6, 4, 6 + i)); // pulau sudut
    // jembatan awan (lebar 3; jembatan ke altar & pulau sudut selebar 1)
    bridge(g, [[50, 61], [50, 50]], 1);
    bridge(g, [[27, 36], [17, 36]], 1);
    bridge(g, [[73, 36], [83, 36]], 1);
    bridge(g, [[12, 28], [12, 17]], 0);
    bridge(g, [[88, 28], [88, 17]], 0);
    bridge(g, [[12, 44], [12, 57]], 0);
    bridge(g, [[88, 44], [88, 57]], 0);
    bridge(g, [[50, 18], [50, 12]], 0); // dijaga Nolzael di tengah (50,15)
    scatter(g, 0.08, r, "T"); // pohon cahaya
    // jalan & plaza
    box(g, 40, 29, 21, 19, ","); // plaza
    carve(g, [[50, 50], [50, 28]], 0, ",", "TKX.");
    carve(g, [[27, 36], [40, 36]], 0, ",");
    carve(g, [[60, 36], [73, 36]], 0, ",");
    carve(g, [[50, 72], [50, 61]], 0, ",");
    wipe(g, 37, 60, 63, 73); // pulau dermaga bebas pohon
    wipe(g, 34, 2, 66, 13); // altar bebas pohon
    // istana
    wipe(g, 40, 18, 60, 28);
    box(g, 42, 20, 17, 7, "I");
    put(g, 50, 26, "E");
    [[44, 27], [47, 27], [53, 27], [56, 27]].forEach(([x, y]) => put(g, x, y, "N"));
    // rumah warga
    [[31, 26], [36, 26], [30, 33], [30, 39], [36, 44], [31, 44], [65, 26], [60, 26], [66, 33], [66, 39], [60, 44], [65, 44]].forEach(([x, y]) => hut(g, x, y, "I"));
    // air mancur, patung, lampu
    put(g, 50, 38, "f");
    deco(g, [[45, 33], [55, 33], [45, 43], [55, 43]], "j");
    deco(g, [[41, 30], [59, 30], [41, 46], [59, 46], [50, 47]], "L");
    // altar: tiang, patung, lampu
    deco(g, [[42, 5], [58, 5], [42, 11], [58, 11]], "N");
    deco(g, [[50, 5], [37, 8], [63, 8]], "j");
    deco(g, [[47, 12], [55, 12]], "L");
    // pulau dermaga: lampu kecil
    deco(g, [[44, 63], [56, 63]], "L");

    const used = [],
      sn = (p) => snap(g, p, used),
      cs = [
        [38, 21], [63, 22], [35, 47], [63, 47], // kota utama (sudut)
        [6, 33], [14, 40], [9, 30], // taman awan
        [94, 33], [86, 40], [91, 30], // menara lonceng
        [12, 12], [88, 12], [12, 61], [88, 61], // pulau sudut
        [41, 7], [59, 7], [45, 10], [55, 10], [50, 8], // altar
      ].map(sn),
      cr = [[46, 64], [44, 31], [58, 10]].map(sn),
      npcs = [
        [49, 70], [53, 66], [46, 28], [54, 28], [48, 27], [52, 27], [46, 38], [47, 40], [43, 34], [57, 40],
        [54, 38], [50, 19], [12, 36], [8, 38], [88, 36], [50, 9],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => clr(g, x, y, 1));
    ensure(g, [50, 71], [...cs, ...cr, ...npcs, [50, 16], [50, 13], [50, 72]], "Aeria");
    MP.AN = { th: "x", w: W, h: H, g: g.map((row) => row.join("")) };
    EN.AN = [
      pt(50, 72, "NG", SKY_GATE[0], SKY_GATE[1] + 1, [0, 1], { kind: "stair" }),
      { t: "foe", i: EI.fallenangel, x: 50, y: 15, sp: "fallenangel" },
      ...cs.map((p, i) => chest("an" + (i + 1), p, i)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    ZONES.AN = {
      pool: [EI.cloudbird, EI.windspirit, EI.thundergolem, EI.seraphstatue],
      p: 0.4,
      safe: [[37, 59, 63, 74], [34, 19, 66, 50], [34, 2, 66, 13]],
    };
    const e = gn.bind(null, "AN");
    e("Penjaga Tangga Awan Eldrin", "angGuard", [49, 70], [
      "Selamat datang di Aeria, kota langit para malaikat. Jarang ada manusia yang sanggup menaklukkan Zerath lalu menaiki Tangga Awan.",
      "Di luar jalan kota, awan menyimpan monster liar. Kalau HP-mu tinggal sedikit, jangan menyeberangi jembatan ke pulau-pulau kecil.",
      wk(EI.windspirit),
    ], { face: -1 });
    e("Pemandu Awan Lumi", "angKid", [53, 66], [
      "Kakak manusia! Sayapmu mana? Oh, tidak punya ya? Pantas kamu naik tangga.",
      "Kalau jatuh dari jembatan nggak apa-apa kok, awan di bawah empuk. Tapi tidak ada yang berani mencoba.",
    ], { wander: 3 });
    e("Raja Aurelion", "angRaja", [46, 28], [
      "Aku Aurelion, raja para malaikat Aeria. Seribu tahun kami menjaga Menara Angka agar hitungan dunia tetap seimbang.",
      "Tapi salah satu dari kami, Nolzael, tergoda oleh Sang Nol. Ia jatuh, dan kini mengurung diri di Altar Seraph di utara kota.",
      wk(EI.fallenangel),
    ], { face: 1 });
    e("Ratu Seraphine", "angRatu", [54, 28], [
      "Nolzael dulu penjaga paling rajin. Ia mengira angka nol adalah akhir dari segalanya. Tolong sadarkan dia.",
      "Altar Seraph ada di utara istana, lewat jembatan yang sempit. Bawa banyak ramuan, ya.",
    ], { face: -1 });
    e("Penjaga Istana Caelum", "angGuard", [48, 27], [
      "Istana Cahaya Surya hanya dibuka untuk tamu undangan. Tapi pahlawan yang naik tangga awan selalu diterima di plaza.",
    ], { face: 1 });
    e("Penjaga Istana Auriel", "angGuard", [52, 27], [
      "Kami berdua berjaga siang malam. Capek sih, tapi sayap kami tidak pernah pegal.",
    ], { face: -1 });
    e("Tetua Orphiel", "angElder", [46, 38], [
      "Umurku sembilan ratus tahun, tapi soal pecahan masih bisa membuatku pusing.",
      "Merpati awan itu lucu, tapi galak. " + wk(EI.cloudbird),
    ], { wander: 2 });
    e("Pendeta Cahaya Celestine", "angCleric", [43, 34], [
      "Kristal di dekat istana menyimpan cahaya pertama Aeria. Sentuhlah kalau lelah.",
      "Patung penjaga di pinggir kota sebenarnya baik, tapi ia hanya mau lewat kalau kamu bisa membagi pecahan. " + wk(EI.seraphstatue),
    ], { face: 1 });
    e("Pemusik Harpa Melodia", "angBard", [47, 40], [
      "Harpaku dipetik dari kabut pagi. Dengar, setiap nadanya adalah bilangan.",
    ], { act: "music", face: 1 });
    merchant("AN", "angMerchant", [57, 40]);
    e("Malaikat Kecil Pip", "angKid", [54, 38], [
      "Aku belum boleh terbang jauh. Kata Ibu, sayapku belum tumbuh sempurna. Hehe.",
    ], { wander: 4 });
    e("Penjaga Jembatan Altar Zephyr", "angGuard", [50, 19], [
      "Jembatan ini mengarah ke Altar Seraph. Nolzael tidak mau diganggu, tapi seluruh Aeria berharap ia sadar.",
      "Isi penuh HP dan Mana di kristal sebelum menyeberang. Jembatannya hanya muat satu orang.",
    ], { face: -1 });
    e("Tukang Kebun Awan Flora", "angMerchant", [12, 36], [
      "Bunga awan hanya mekar kalau disiram embun fajar. Lihat, kelopaknya berbentuk pecahan seperdelapan!",
    ], { act: "water", face: 1 });
    e("Pengembara Bersayap Ravel", "angElder", [8, 38], [
      "Taman Awan sepi sejak Nolzael jatuh. Tapi di sini aku bisa membaca dengan tenang.",
    ], { act: "read", face: 1 });
    e("Penjaga Lonceng Tintin", "angGuard", [88, 36], [
      "Lonceng besar di menara ini berdentang sembilan kali tiap fajar, satu dentang untuk tiap angka tunggal.",
      "Kalau kamu dengar dentang ke-nol, jangan panik. Itu cuma jeda.",
    ], { face: -1 });
    spawn("AN", {
      t: "npc",
      id: "gen",
      d: ["Seraph Agung Elioth", [
        "Kamu menyadarkan Nolzael! Aeria berutang padamu.",
        "Peti-peti di altar ini persembahan para malaikat. Ambil, kamu pantas mendapatkannya.",
      ]],
      sp: "angElder",
      x: 50,
      y: 9,
      fx: { face: 1 },
      on: () => !!F.done[EI.fallenangel],
    });
  }

  /* ===================== 2) KOTA BAWAH LAUT AQUARIA (100x72) ===================== */
  {
    const W = 100,
      H = 72,
      r = rng(8093),
      g = grid(W, H, ".");
    for (let x = 0; x < W; x++) g[0][x] = g[H - 1][x] = "W";
    for (let y = 0; y < H; y++) g[y][0] = g[y][W - 1] = "W";
    scatter(g, 0.2, r, "K"); // hutan karang
    g.forEach((row, y) => row.forEach((c, x) => c === "." && inb(g, x, y) && r() < 0.06 && (row[x] = "X"))); // rumput laut
    // gerbang gelembung di selatan, kota di tengah, makam kapal di utara
    wipe(g, 40, 58, 60, 70);
    wipe(g, 28, 20, 72, 52);
    wipe(g, 28, 2, 72, 13);
    wipe(g, 2, 26, 24, 46);
    wipe(g, 76, 26, 97, 46);
    carve(g, [[50, 69], [50, 15]], 1, ",", "TKX.");
    carve(g, [[28, 36], [72, 36]], 0, ",", "TKX.");
    carve(g, [[24, 36], [28, 36]], 0, ",");
    carve(g, [[72, 36], [76, 36]], 0, ",");
    for (let x = 1; x < W - 1; x++) g[14][x] = "K"; // punggung karang utara; celah 1 petak dijaga Leviathan
    g[14][50] = ".";
    // istana mutiara
    box(g, 42, 20, 17, 7, "o");
    put(g, 50, 26, "E");
    [[44, 27], [47, 27], [53, 27], [56, 27]].forEach(([x, y]) => put(g, x, y, "N"));
    // rumah kerang
    [[31, 26], [36, 26], [30, 33], [30, 39], [36, 44], [31, 44], [65, 26], [60, 26], [66, 33], [66, 39], [60, 44], [65, 44]].forEach(([x, y]) => hut(g, x, y, "o"));
    // air mancur gelembung, lampu laut
    put(g, 50, 38, "f");
    deco(g, [[41, 30], [59, 30], [41, 46], [59, 46], [50, 47], [44, 63], [56, 63]], "L");
    // bangkai kapal: dek kayu, peti, tiang mutiara
    box(g, 40, 4, 21, 7, "b");
    [[40, 4], [60, 4], [40, 10], [60, 10]].forEach(([x, y]) => put(g, x, y, "k"));
    [[44, 4], [56, 4], [44, 10], [56, 10]].forEach(([x, y]) => put(g, x, y, "N"));

    const used = [],
      sn = (p) => snap(g, p, used),
      cs = [
        [34, 22], [66, 22], [33, 50], [67, 50], // kota
        [6, 30], [20, 42], [10, 44], [18, 28], // gua karang (barat)
        [94, 30], [80, 42], [90, 44], [82, 28], // palung gelap (timur)
        [6, 66], [94, 66], [32, 8], [68, 8], // sudut
        [42, 6], [58, 6], [50, 8], [46, 9], [54, 9], // makam kapal
      ].map(sn),
      cr = [[46, 64], [44, 31], [58, 9]].map(sn),
      npcs = [
        [49, 66], [53, 64], [46, 28], [54, 28], [48, 27], [52, 27], [46, 38], [47, 40], [43, 34], [57, 40],
        [54, 38], [50, 17], [10, 36], [16, 38], [86, 36], [50, 9],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => clr(g, x, y, 1));
    ensure(g, [50, 67], [...cs, ...cr, ...npcs, [50, 15], [50, 13], [50, 68]], "Aquaria");
    MP.AQ = { th: "m", w: W, h: H, g: g.map((row) => row.join("")) };
    EN.AQ = [
      pt(50, 69, "O", SEA_BACK[0], SEA_BACK[1], [1, 0], { kind: "bubble", pre: () => ((boat = true), (RV.list.length = 0), (RV.cur = null)) }),
      { t: "foe", i: EI.leviathan, x: 50, y: 14, sp: "leviathan" },
      ...cs.map((p, i) => chest("aq" + (i + 1), p, i)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    ZONES.AQ = {
      pool: [EI.eel, EI.lanternfish, EI.reefcrab, EI.glowjelly],
      p: 0.38,
      safe: [[40, 58, 60, 70], [28, 20, 72, 52], [28, 2, 72, 13]],
    };
    const e = gn.bind(null, "AQ");
    e("Penjaga Gerbang Nerio", "merGuard", [49, 66], [
      "Selamat datang di Aquaria, kota para duyung. Jarang ada manusia yang berani menembus pusaran itu.",
      "Napasmu aman di sini. Gelembung sihir Ratu Marina melindungi seluruh kota.",
      "Di luar kota, karang menyembunyikan banyak makhluk. " + wk(EI.eel),
    ], { face: -1 });
    e("Anak Duyung Bubu", "merKid", [53, 64], [
      "Kakak punya kaki! Bisa dipakai buat lari? Aku cuma bisa berenang. Hehe.",
      "Jangan dekat-dekat ubur-ubur ungu. Mereka suka menyetrum orang yang tidak bisa menghitung rata-rata.",
    ], { wander: 3 });
    e("Raja Thalassos", "merRaja", [46, 28], [
      "Aku Thalassos, raja duyung Aquaria. Dasar laut ini menyimpan semua angka yang pernah tenggelam.",
      "Di utara, di antara bangkai kapal tua, Leviathan tertidur. Belakangan ia gelisah, dan ombak di atas jadi liar.",
      wk(EI.leviathan),
    ], { face: 1 });
    e("Ratu Marina", "merRatu", [54, 28], [
      "Mutiara Bilangan Prima di istana ini tidak bisa dibagi siapa pun. Itu sebabnya ia bersinar paling terang.",
      "Leviathan dulu penjaga ramah. Kalau kamu bisa menenangkannya, harta di Makam Kapal Karam boleh kamu ambil.",
    ], { face: -1 });
    e("Penjaga Istana Triton", "merGuard", [48, 27], [
      "Istana Mutiara tertutup untuk tamu biasa. Tapi pahlawan dari permukaan boleh bersantai di plaza.",
    ], { face: 1 });
    e("Penjaga Istana Oceanus", "merGuard", [52, 27], [
      "Tombakku terbuat dari tulang paus tua. Jangan tanya paus yang mana.",
    ], { face: -1 });
    e("Tetua Proteus", "merElder", [46, 38], [
      "Aku sudah menghitung ombak sejak sebelum kota ini berdiri. Jumlahnya belum habis.",
      "Kepiting karang itu kebal pembagian biasa. " + wk(EI.reefcrab),
    ], { wander: 2 });
    e("Pendeta Mutiara Perla", "merCleric", [43, 34], [
      "Kristal di dekat istana dibuat dari mutiara terakhir Aquaria. Sentuhlah kalau tubuhmu lelah.",
      "Ikan lentera memikat dengan cahaya, lalu menggigit. " + wk(EI.lanternfish),
    ], { face: 1 });
    e("Penyanyi Duyung Sirene", "merBard", [47, 40], [
      "Lagu ini turun-temurun dari nenek moyang kami. Setiap baitnya satu bilangan ganjil.",
    ], { act: "music", face: 1 });
    merchant("AQ", "merMerchant", [57, 40]);
    e("Anak Duyung Gelembung", "merKid", [54, 38], [
      "Kalau tiup gelembung besar-besar, aku bisa lihat pelangi. Mau coba?",
    ], { wander: 4 });
    e("Penjaga Pintu Utara Nerida", "merGuard", [50, 17], [
      "Di balik punggung karang ini ada Makam Kapal Karam. Leviathan tidur di sana.",
      "Isi penuh HP dan Mana di kristal kota sebelum maju. Celahnya hanya muat satu perenang.",
    ], { face: -1 });
    e("Penjelajah Gua Coral", "merCleric", [10, 36], [
      "Gua karang di barat penuh peti, tapi jalannya berbelit. Ikuti jalan pasir kalau tersesat.",
    ], { wander: 2 });
    e("Pengintai Palung Abyss", "merElder", [86, 36], [
      "Palung di timur gelap sekali. Ikan lentera di sana besar-besar.",
      "Hanya yang berani menghitung dalam gelap yang bisa pulang membawa harta.",
    ], { face: -1 });
    spawn("AQ", {
      t: "npc",
      id: "gen",
      d: ["Juru Kunci Makam Kaptain Lumut", [
        "Kamu menenangkan Leviathan! Sudah ratusan tahun tidak ada yang bisa.",
        "Peti-peti di dek kapal ini tinggalan para pelaut lama. Ambil, kamu pantas mendapatkannya.",
      ]],
      sp: "merElder",
      x: 50,
      y: 9,
      fx: { face: 1 },
      on: () => !!F.done[EI.leviathan],
    });
  }

  /* ===================== PINTU MASUK DI DUNIA LUAR ===================== */
  // (1) Tangga Awan: dari dataran sarang Zerath (peta NG) naik ke Aeria. Terbuka setelah Zerath dikalahkan.
  {
    const G = MP.NG,
      [gx, gy] = SKY_GATE;
    G.g[gy] = G.g[gy].slice(0, gx) + "," + G.g[gy].slice(gx + 1); // celah di punggung gunung
    delete G.mc;
    EN.NG.push(
      pt(gx, gy, "AN", 50, 70, [0, -1], {
        kind: "stair",
        k: () => !!F.done[zerath],
        kf: () =>
          dlg("Tangga Awan", [
            "Tangga cahaya itu tertutup kabut tebal. Dari baliknya terdengar suara harpa yang jauh.",
            "Sepertinya kabut hanya menyingkir untuk orang yang menaklukkan penjaga puncak, sang Naga Emas.",
          ]),
      }),
    );
    gn("NG", "Penjaga Tangga Awan", "angGuard", [gx + 2, gy + 1], [
      "Tangga cahaya di utara ini menuju Aeria, kota para malaikat. Dari bawah kamu tidak akan melihatnya.",
      "Hanya mereka yang menaklukkan Zerath yang boleh naik. Para malaikat menghargai keberanian.",
    ], { face: -1 });
  }
  // (2) Pusaran Mutiara: di Samudra Prima (peta O), hanya bisa dimasuki dengan perahu dan guild Rank C ke atas.
  {
    const [wx, wy] = SEA_GATE;
    EN.O.push(
      pt(wx, wy, "AQ", 50, 66, [0, -1], {
        kind: "whirl",
        pre: () => ((boat = false), (RV.list.length = 0), (RV.cur = null)), // turun dari perahu: Aquaria berjalan kaki
        k: () => ri() >= MIN_RANK_SEA,
        kf: () =>
          dlg("Pusaran Mutiara", [
            "Pusaran itu menyedot perahumu dengan kuat. Dari dasarnya terlihat kilau mutiara dan kubah kota.",
            `Terlalu berbahaya bagi petualang pemula. Kembalilah saat guild-mu sudah Rank ${RK[MIN_RANK_SEA]} atau lebih tinggi.`,
          ]),
      }),
    );
  }

  /* ---------- portal milik file ini: dibungkus sebelum portal lain ---------- */
  {
    const _hp = H.portal;
    H.portal = (e) => {
      if (!e.mine) return _hp(e);
      if (e.k && !e.k()) return e.kf();
      if (e.pre) e.pre();
      go(e);
    };
  }

  /* ---------- gambar pintu: tangga cahaya, pusaran, gelembung ---------- */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      if (e.kind) {
        const X = e.x * 16,
          Y = e.y * 16 + OY;
        if (e.kind === "stair") {
          ctx.globalAlpha = rm ? 0.4 : 0.3 + 0.2 * Math.sin(t / 300);
          ctx.fillStyle = "#fff6c0";
          ctx.fillRect(X - 1, Y - 6, 18, 24);
          ctx.globalAlpha = 1;
          for (let k = 0; k < 4; k++) {
            ctx.fillStyle = k % 2 ? "#fff6c0" : "#ffffff";
            ctx.fillRect(X + 2 + k * 2, Y + 12 - k * 3, 12 - k * 2, 3);
            ctx.fillStyle = "#e2b84a";
            ctx.fillRect(X + 2 + k * 2, Y + 14 - k * 3, 12 - k * 2, 1);
          }
        } else if (e.kind === "whirl") {
          const cx = X + 8,
            cy = Y + 8,
            a0 = rm ? 0 : t / 400;
          ctx.fillStyle = "rgba(10,40,90,.55)";
          ctx.fillRect(X, Y, 16, 16);
          ctx.lineWidth = 1;
          for (let k = 0; k < 3; k++) {
            ctx.strokeStyle = k % 2 ? "#bff6ff" : "#ffffff";
            ctx.beginPath();
            ctx.arc(cx, cy, 2 + k * 2.5, a0 * (k % 2 ? -1 : 1) + k, a0 * (k % 2 ? -1 : 1) + k + Math.PI * 1.3);
            ctx.stroke();
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(cx - 1, cy - 1, 2, 2);
        } else if (e.kind === "bubble") {
          ctx.globalAlpha = rm ? 0.4 : 0.3 + 0.2 * Math.sin(t / 350);
          ctx.fillStyle = "#bff6ff";
          ctx.fillRect(X - 1, Y - 8, 18, 26);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1;
          for (let k = 0; k < 4; k++) {
            const by = Y + 14 - (((rm ? 0 : t / 40) + k * 9) % 22);
            ctx.beginPath();
            ctx.arc(X + 5 + ((k * 5) % 8), by, 2 + (k % 2), 0, 6.28);
            ctx.stroke();
          }
        }
        return;
      }
      _ent(e, t, bob);
    };
  }

  /* ---------- suasana: bulu jatuh di Aeria, air biru dan gelembung di Aquaria ---------- */
  {
    const _wd = W.draw;
    W.draw = function (t) {
      _wd(t);
      if (mp === "AN" && !rm) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 16; i++) {
          const x = ((i * 83 + t * 0.01 * (1 + (i % 3)) + Math.sin(t / 600 + i) * 6) % VW) | 0,
            y = ((i * 47 + t * 0.025 * (1 + (i % 2))) % VH) | 0;
          ctx.globalAlpha = 0.45 + 0.3 * Math.sin(t / 300 + i);
          ctx.fillRect(x, y, 3, 1);
          ctx.fillRect(x + 1, y + 1, 2, 1);
        }
        ctx.restore();
      } else if (mp === "AQ") {
        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#0a64a8";
        ctx.fillRect(0, 0, VW, VH);
        if (!rm) {
          ctx.globalAlpha = 0.07;
          ctx.fillStyle = "#bff6ff";
          for (let i = 0; i < 5; i++) {
            const x = ((i * 113 + t * 0.012) % (VW + 120)) - 60;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 26, 0);
            ctx.lineTo(x + 86, VH);
            ctx.lineTo(x + 60, VH);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = 0.5;
          ctx.strokeStyle = "#d8f8ff";
          ctx.lineWidth = 1;
          for (let i = 0; i < 14; i++) {
            const bx = (i * 61 + Math.sin(t / 700 + i) * 4) % VW,
              by = VH - ((t * 0.03 * (1 + (i % 3)) + i * 37) % (VH + 10));
            ctx.beginPath();
            ctx.arc(bx, by, 1 + (i % 3), 0, 6.28);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    };
  }

  /* ===================== MONSTER ACAK SAAT BERJALAN ===================== */
  {
    let cnt = 0;
    const _os = onStep;
    onStep = function () {
      _os();
      const z = ZONES[mp];
      if (!z || busy) return;
      if (z.safe.some(([x0, y0, x1, y1]) => px >= x0 && px <= x1 && py >= y0 && py <= y1)) return void (cnt = 0);
      if (++cnt < STEPS || Math.random() > z.p) return;
      const i = P(z.pool);
      cnt = -8; // jeda beberapa langkah setelah bertarung
      held = null;
      W.on = false;
      start(i);
    };
  }

  /* ===================== PETA MINI ===================== */
  {
    const _m2 = mini2,
      BG = { x: "#f2f6ff", m: "#cdbd8a" },
      COL = {
        A: "#6aa8e8", "=": "#f0e4b0", W: "#0a2a4a", K: "#e8607a", X: "#2f9e57", o: "#f4b0c4", I: "#d8e4fa", N: "#e6ecfa",
        j: "#ffffff", E: "#6b3a1c", T: "#c8a830", ",": "#e8d9a0", f: "#5aa8ff", L: "#ffd166", b: "#c28a4a", k: "#8a5a2b",
      };
    mini2 = function (id) {
      if (!MINE(id)) return _m2(id);
      const m = MP[id];
      if (m.mc) return m.mc;
      const c = document.createElement("canvas"),
        k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d");
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          k.fillStyle = COL[ch] || BG[m.th];
          k.fillRect(x, y, 1, 1);
        }),
      );
      return (m.mc = c);
    };
  }
})();
