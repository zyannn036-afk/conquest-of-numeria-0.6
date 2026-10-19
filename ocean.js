/* ===== Numeria Quest — Perluasan: Samudra Prima, Pelabuhan Sigma, Pulau Singgah,
   Kota Kerajaan Logaritma + Istana, perahu layar, monster laut, dan Kraken.
   Dimuat setelah realm.js dan SEBELUM town.js (town.js yang menaruh warga lewat OCEAN_NPCS).
   Jalur: Desa -> Kota Bangun -> Hutan Rimba -> Padang Pasir -> (punggung bukit ke-3, memutar ke utara)
          -> Pelabuhan Sigma -> berlayar zig-zag di Samudra Prima -> Kota Logaritma. ===== */

let boat = false; // true saat pemain sedang berlayar
var OCEAN_NPCS = []; // [peta, entitas] — dibaca town.js

(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const SEA_X0 = 216, // kolom pertama laut
    SEA_X1 = 282, // kolom terakhir laut
    WW = 340, // lebar dunia baru (sebelumnya 200)
    SEA_P = 0.4, // peluang monster laut muncul tiap WILD_STEPS langkah
    FARE = 150; // harga izin berlayar (sekali beli, berlaku selamanya)

  /* ---------- nama wilayah & tema warna ---------- */
  Object.assign(MN, {
    S: "Samudra Prima",
    G: "Pelabuhan Sigma",
    M: "Pulau Singgah",
    C: "Pesisir Logaritma",
    L: "Kota Kerajaan Logaritma",
    Y: "Istana Logaritma",
  });
  Object.assign(TH, {
    o: { a: "#2a6fd6", b: "#2a6fd6", w: "#12301e", w2: "#1c4a2c", t: "#2f9e57", t2: "#8cc0ff" },
    l: { a: "#b3c9d0", b: "#abc1c9", w: "#2a4a6a", w2: "#3a6a8a", t: "#2f9e57", t2: "#5fd078" },
    y: { a: "#d8e4e6", b: "#cfdde0", w: "#1f4a6a", w2: "#2f6a8a", t: "#6d6a88", t2: "#9a97b8" },
  });

  /* ---------- perlengkapan baru ---------- */
  Object.assign(EQ, {
    trident: { n: "Trisula Mutiara", s: "w", atk: 9, fist: "#7ee0e8", sw: "#bff6ff" },
    nakhoda: { n: "Topi Nakhoda", s: "h", def: 4, hat: "capt", price: 160 },
    shark: {
      n: "Zirah Sisik Hiu",
      s: "b",
      def: 6,
      pal: { C: "#4a7a9a", c: "#2f5a7a", W: "#a8d8ee" },
      price: 220,
    },
  });
  HD.capt = [
    [4, 0, 8, 1, "#f4f1ea"],
    [2, 1, 12, 2, "#f4f1ea"],
    [7, 1, 2, 1, "#e2b84a"],
    [2, 3, 12, 1, "#23356e"],
  ];

  /* ---------- monster laut (indeks E dihitung otomatis) ---------- */
  const ART = {
    jelly: {
      pal: { K: "#12203a", B: "#7ec8ff", b: "#d6f0ff", D: "#4a90d8", W: "#ffffff", R: "#ff7aa8" },
      m: [
        "................",
        "......KKKK......",
        "....KKbbbbKK....",
        "...KbbBBBBbbK...",
        "..KbBBBBBBBBbK..",
        "..KBBKWBBKWBBK..",
        "..KBBBBBBBBBBK..",
        "..KBBBBRRBBBBK..",
        "..KDDDDDDDDDDK..",
        "...KKDKDDKDKK...",
        "...KDK.KK.KDK...",
        "..KDK..KK..KDK..",
        "..KDK.KDDK.KDK..",
        "...KDK.KK.KDK...",
        "...KK..KK..KK...",
        "................",
      ],
    },
    crab: {
      pal: { K: "#2a1010", R: "#e0502f", r: "#a8321c", Y: "#ffe14d", W: "#ffd9b0" },
      m: [
        "................",
        "..KKK......KKK..",
        ".KRRRK....KRRRK.",
        ".KRKRRK..KRRKRK.",
        ".KRRRRK..KRRRRK.",
        "..KKRRKKKKRRKK..",
        "....KRRRRRRK....",
        "..KKRRYKKYRRKK..",
        ".KRRRRRRRRRRRRK.",
        ".KRRrRRRRRRrRRK.",
        "..KRRRRWWRRRRK..",
        "...KRRRRRRRRK...",
        "..KRK.KRRK.KRK..",
        ".KRK..K..K..KRK.",
        ".KK...K..K...KK.",
        "................",
      ],
    },
    shark: {
      pal: { K: "#101a2a", G: "#6a86a8", g: "#9ab4d0", Y: "#ffe14d", W: "#ffffff" },
      m: [
        "................",
        "........KK......",
        ".......KGGK.....",
        "......KGGGGK....",
        ".....KGGGGGGK...",
        "..KKKGGGGGGGGKK.",
        ".KGGGGGGGGGGGGGK",
        "KGGYKGGGGGGGGGGK",
        "KGGGGGGGGGGGGGGK",
        "KgGWKWKWKWKGGGgK",
        ".KgWWWWWWWWgGgK.",
        "..KKgggggggKKgK.",
        "....KKKKKKK..KgK",
        "..............KK",
        "................",
        "................",
      ],
    },
    kraken: {
      pal: { K: "#1a0f2e", P: "#8a4ad0", p: "#b88af0", D: "#5a2a90", Y: "#ffe14d", W: "#ffffff" },
      m: [
        "......KKKK......",
        "....KKPPPPKK....",
        "...KPPPPPPPPK...",
        "..KPPPpppPPPPK..",
        "..KPPPPPPPPPPK..",
        ".KPPYKPPPPKYPPK.",
        ".KPPPPPPPPPPPPK.",
        ".KPPPPWWWWPPPPK.",
        "..KPPPPPPPPPPK..",
        ".KPDPPPDDPPPDPK.",
        "KPPK.KPPPPK.KPPK",
        "KPK.KPDKKDPK.KPK",
        "KPK.KPK..KPK.KPK",
        ".KPK.KK..KK.KPK.",
        "..KPK......KPK..",
        "...KK......KK...",
      ],
    },
  };
  const blank = (r) => /^\.*$/.test(r),
    nBlank = (m, fromEnd) => {
      let n = 0;
      for (let i = 0; i < m.length; i++) {
        if (blank(m[fromEnd ? m.length - 1 - i : i])) n++;
        else break;
      }
      return n;
    },
    shift = (m, k, up) => {
      const w = ".".repeat(m[0].length);
      if (up && nBlank(m, 0) >= k) return m.slice(k).concat(Array(k).fill(w));
      if (!up && nBlank(m, 1) >= k) return Array(k).fill(w).concat(m.slice(0, m.length - k));
      return m;
    },
    x2 = (m) =>
      m.flatMap((r) => {
        const d = [...r].map((c) => c + c).join("");
        return [d, d];
      });
  Object.entries(ART).forEach(([k, o]) => {
    const big = x2(o.m);
    SP[k] = { p: o.pal, m: o.m, a: [o.m, shift(o.m, 1, 0)] };
    SP[k + "L"] = { p: o.pal, m: big, a: [big, shift(big, 2, 0), shift(big, 2, 1)] };
  });
  const EI = {},
    mon = (key, o) => {
      EI[key] = E.length;
      E.push(o);
    };
  mon("jelly", {
    n: "Ubur-ubur Rasio",
    sp: "jelly",
    hp: 160,
    atk: 16,
    topics: ["pecahan", "persen"],
    weak: "persen",
    d: [2, 5],
    s: 4,
    xp: 50,
    coin: 40,
    bg: ["#0f2a4a", "#2a6a9a", "#0f2a44", "#d8f4ff"],
    intro: "Ubur-ubur raksasa mengambang di atas ombak. Sengatnya berisi pecahan yang berdenyut!",
    win: "Ubur-ubur itu mengecil, lalu hanyut terbawa arus.",
  });
  mon("crab", {
    n: "Kepiting Akar",
    sp: "crab",
    hp: 190,
    atk: 17,
    topics: ["alj", "geom"],
    weak: "geom",
    d: [3, 5],
    s: 4,
    xp: 56,
    coin: 44,
    bg: ["#10304a", "#2f7a9a", "#12304a", "#fff0d0"],
    intro: "Kepiting bercapit besar memanjat lambung perahu. Capitnya menjepit tiap variabel!",
    win: "Kepiting itu terjun ke laut dengan bunyi cebur.",
  });
  mon("shark", {
    n: "Hiu Eksponen",
    sp: "shark",
    hp: 210,
    atk: 19,
    topics: ["arit", "alj", "persen"],
    weak: "alj",
    d: [3, 5],
    s: 4,
    xp: 64,
    coin: 52,
    bg: ["#0a1f3a", "#1f5a8a", "#0a1c34", "#bfe0ff"],
    intro: "Sirip hiu membelah ombak. Gigi-giginya dipangkatkan tinggi-tinggi!",
    win: "Hiu itu menyelam dalam-dalam dan tidak muncul lagi.",
  });
  mon("kraken", {
    n: "Kraken Tak Hingga",
    sp: "kraken",
    hp: 320,
    atk: 22,
    topics: ["arit", "pecahan", "persen", "geom", "alj"],
    weak: "alj",
    d: [4, 5],
    s: 4,
    xp: 160,
    coin: 220,
    bg: ["#1a0f3a", "#4a2a7a", "#140a2e", "#e0b8ff"],
    intro:
      "Selat bergemuruh! Kraken Tak Hingga bangkit dari dasar laut. Tentakelnya menjulur tanpa batas. Tidak ada jalan mundur!",
    win: "Kraken itu tenggelam perlahan. Selat terbuka, dan ombak kembali tenang.",
  });

  /* ---------- petak baru: G gerbang istana, l mercusuar, k peti kayu, p dermaga ---------- */
  TILEX += "Glkp";
  {
    const _tx = tileX;
    tileX = function (c, X, Y, x, y, th, t) {
      const fl = (col, a, b, w, h) => {
        ctx.fillStyle = col;
        ctx.fillRect(X + a, Y + b, w, h);
      };
      if (c === "G") {
        fl("#e8f2f0", 0, 0, 16, 16);
        fl("#e2b84a", 0, 0, 16, 2);
        fl("#14546a", 1, 2, 14, 14);
        fl("#0d3a4a", 3, 4, 10, 12);
        fl("#06161e", 5, 7, 6, 9);
        fl("#7ee0e8", 1, 2, 14, 1);
        fl("#fff", 7, 3, 2, 2);
      } else if (c === "l") {
        fl("rgba(0,0,0,.25)", 2, 14, 13, 2);
        fl("#e8e4d8", 4, 2, 8, 13);
        fl("#b8b4a4", 10, 2, 2, 13);
        fl("#d2284d", 4, 5, 8, 2);
        fl("#d2284d", 4, 10, 8, 2);
        fl("#2a2a3a", 3, -2, 10, 4);
        fl("#ffd166", 5, -1, 6, 2);
        fl("#d2284d", 4, -5, 8, 3);
        fl("#d2284d", 6, -7, 4, 2);
        ctx.globalAlpha = rm ? 0.2 : 0.14 + 0.12 * Math.sin(t / 300);
        fl("#ffd166", -5, -6, 26, 8);
        ctx.globalAlpha = 1;
      } else if (c === "k") {
        fl("rgba(0,0,0,.25)", 1, 14, 15, 2);
        fl("#8a5a2b", 1, 6, 9, 9);
        fl("#b87a3a", 1, 6, 9, 2);
        fl("#5e3a1a", 1, 10, 9, 1);
        fl("#5e3a1a", 5, 6, 1, 9);
        fl("#a8743c", 8, 9, 7, 6);
        fl("#d9a05a", 8, 9, 7, 2);
        fl("#5e3a1a", 11, 9, 1, 6);
      } else if (c === "p") {
        fl("#8a5a2b", 0, 0, 16, 16);
        for (let k = 3; k < 16; k += 4) {
          fl("#6b4220", k, 0, 1, 16);
          fl("#b87a3a", k - 2, (k * 5) % 11 + 1, 1, 2);
        }
        fl("#4a2f18", 0, 0, 16, 2);
        fl("#4a2f18", 0, 14, 16, 2);
        fl("#c28a4a", 0, 0, 16, 1);
        fl("#c28a4a", 0, 14, 16, 1);
      } else _tx(c, X, Y, x, y, th, t);
    };
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th === "l" || th === "y") {
        ctx.fillStyle = "rgba(0,0,0,.07)";
        ctx.fillRect(X, Y + 15, 16, 1);
        ctx.fillRect(X + 15, Y, 1, 16);
      } else _bd(th, X, Y, x, y);
    };
  }

  /* ---------- sprite NPC baru ---------- */
  Object.assign(SP, {
    kapten: mkRoyal(
      { H: "#4a3322", A: "#23356e", a: "#162556", X: "#f4f1ea", T: "#23356e", t: "#162556", V: "#f4f1ea", Y: "#e2b84a", P: "#e8e4d8", p: "#b8b4a4" },
      { hat: "brim", beard: 1 },
    ),
    pelaut: mkRoyal(
      { H: "#6b4226", A: "#f4f1ea", a: "#c8c4b4", X: "#fff", T: "#3a6bd6", t: "#27489a", V: "#f4f1ea", P: "#2a2a3a", p: "#1a1a28" },
      { hat: "scarf" },
    ),
    rajalaut: mkRoyal(
      { H: "#e6e6e6", h: "#fff", A: "#e2b84a", a: "#b8902a", X: "#7ee0e8", T: "#14546a", t: "#0d3a4a", V: "#e2b84a", Y: "#e2b84a", P: "#1a2a3a", p: "#101c28", R: "#14546a" },
      { hat: "crown", beard: 1, cape: 1 },
    ),
    ratulaut: mkRoyal(
      { H: "#4ad0d8", h: "#9af0f0", A: "#e2b84a", a: "#b8902a", X: "#7ee0e8", T: "#eaf6f8", t: "#bcd8de", V: "#14546a", E: "#14546a" },
      { hat: "tiara", long: 1, dress: 1 },
    ),
    putrilaut: mkRoyal(
      { H: "#2a8ac0", h: "#7ac8f0", A: "#e2b84a", a: "#b8902a", X: "#fff", T: "#14546a", t: "#0d3a4a", V: "#eaf6f8", E: "#14546a" },
      { hat: "tiara", long: 1, dress: 1 },
    ),
  });

  /* ---------- musik ---------- */
  {
    const T = SND.tracks,
      seq = (s, d = 1) =>
        s
          .trim()
          .split(/\s+/)
          .map((t) => {
            const [n, b] = t.split(":");
            return [n === "-" ? null : n, b ? +b : d];
          });
    T.S = {
      bpm: 84,
      v: [
        { w: "square", g: 0.05, n: seq("D5:1 F5:.5 E5:.5 D5:1 A4:1 Bb4:1 C5:.5 D5:.5 C5:1 A4:1 G4:1 A4:.5 Bb4:.5 A4:1 F4:1 D4:2 -:2") },
        { w: "triangle", g: 0.12, n: seq("D2:4 Bb1:4 G2:4 A1:2 A2:2") },
        { w: "square", g: 0.02, n: seq("D4 A4 D5 A4 D4 A4 D5 A4 Bb3 F4 Bb4 F4 Bb3 F4 Bb4 F4 G3 D4 G4 D4 G3 D4 G4 D4 A3 E4 A4 E4 A3 E4 A4 E4", 0.5) },
      ],
    };
    T.G = {
      bpm: 108,
      v: [
        { w: "square", g: 0.05, n: seq("E5:.5 G5:.5 E5:.5 C5:.5 D5:1 G4:1 A4:.5 C5:.5 A4:.5 F4:.5 G4:1 E4:1 F4:.5 A4:.5 C5:.5 A4:.5 E5:1 C5:1 D5:1 G4:1 C5:2") },
        { w: "triangle", g: 0.12, n: seq("C3:2 G2:2 A2:2 E2:2 F2:2 C3:2 G2:2 G2:2") },
        { w: "square", g: 0.02, n: seq("C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3", 0.5) },
      ],
    };
    T.L = {
      bpm: 72,
      v: [
        { w: "triangle", g: 0.09, n: seq("B4:2 D5:1 G5:1 F#5:2 D5:1 B4:1 C5:2 E5:1 A5:1 G5:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("G2:4 D3:4 C3:4 D3:4") },
        { w: "square", g: 0.02, n: seq("D4:4 A3:4 E4:4 F#3:4") },
      ],
    };
    T.Y = {
      bpm: 64,
      v: [
        { w: "triangle", g: 0.09, n: seq("D5:2 A4:2 F5:2 E5:1 D5:1 C5:2 A4:2 G4:2 -:2") },
        { w: "triangle", g: 0.12, n: seq("D2:4 Bb1:4 G1:4 A1:4") },
        { w: "square", g: 0.02, n: seq("F4:8 E4:8") },
      ],
    };
    T.M = T.quiet;
    T.C = T.forest;
  }

  /* ===================== MEMBANGUN DUNIA (200x123 -> 340x123) ===================== */
  const O = MP.O,
    WH = O.h,
    g = O.g.map((r) => r.split("")),
    bm = O.bm,
    rnd = ((s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })(20261015);
  for (let y = 0; y < WH; y++)
    for (let x = O.w; x < WW; x++) {
      g[y].push(".");
      bm[y].push("s");
    }
  const set = (x, y, c, th) => {
      if (x < 0 || y < 0 || x >= WW || y >= WH) return;
      g[y][x] = c;
      if (th) bm[y][x] = th;
    },
    rect = (x, y, w, h, c, th) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c, th);
    },
    carve = (pts, hw, mid) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) {
              const X = x + ii,
                Y = y + j;
              if (g[Y] && "TCRP".includes(g[Y][X])) g[Y][X] = ".";
            }
          if (g[y][x] === ".") g[y][x] = mid;
        }
      }
    },
    clear = (x, y) => {
      if ("TCRPM".includes(g[y][x])) g[y][x] = ".";
    };

  // (1) tepi timur Padang Pasir: tembok dunia lama (x=199) dibuka, gurun diperpanjang sampai x=215
  for (let y = 1; y < 86; y++) set(199, y, ".", "s");
  rect(200, 1, 16, 25, "M", "s"); // pegunungan utara
  for (let y = 26; y < 86; y++)
    for (let x = 200; x <= 215; x++) {
      const v = rnd();
      set(x, y, v < 0.035 ? "C" : v < 0.065 ? "R" : ".", "s");
    }
  rect(200, 86, 16, 36, "M", "s");

  // (2) punggung bukit ketiga: celah hanya di utara (y 28..32) => jalan ke pelabuhan memutar jauh
  for (let y = 26; y < 86; y++)
    if (y < 28 || y > 32) {
      set(165, y, "M");
      set(166, y, "M");
    }
  // jejak kafilah ke pelabuhan: dari persimpangan dekat gerbang Kota Kerajaan ke utara, melewati celah, lalu turun ke timur
  carve(
    [
      [135, 107],
      [135, 31],
      [176, 31],
      [176, 52],
      [201, 52],
    ],
    1,
    ",",
  );

  // (3) Samudra Prima: x 216..282, seluruh tinggi dunia
  rect(SEA_X0, 1, SEA_X1 - SEA_X0 + 1, WH - 2, "w", "o");
  const wall = (x, gap0, gap1) => {
    for (let y = 1; y < WH - 1; y++) if (y < gap0 || y > gap1) rect(x, y, 2, 1, "M", "o");
  };
  wall(238, 97, 103); // celah selatan
  wall(258, 29, 35); // celah utara
  wall(270, 60, 60); // selat sempit: dijaga Kraken
  // karang tersebar (menjauhi celah, pelabuhan, dan pulau)
  for (let y = 2; y < WH - 2; y++)
    for (let x = SEA_X0 + 3; x < SEA_X1 - 1; x++) {
      if ((x >= 236 && x <= 241) || (x >= 256 && x <= 261) || (x >= 268 && x <= 273)) continue;
      if (x < 226 && y > 44 && y < 62) continue;
      if (x >= 242 && x <= 256 && y >= 58 && y <= 72) continue;
      if (x >= 274 && y >= 56 && y <= 64) continue;
      if (g[y][x] === "w" && rnd() < 0.012) set(x, y, "R", "o");
    }

  // (4) Pelabuhan Sigma: x 201..222, y 42..63 (offset 201,42)
  const GX = 201,
    GY = 42,
    pg = (lx, ly) => [GX + lx, GY + ly],
    grect = (lx, ly, w, h, c, th = "s") => rect(GX + lx, GY + ly, w, h, c, th);
  grect(0, 0, 15, 22, ".", "s");
  grect(0, 10, 13, 2, "r"); // jalan masuk dari barat
  grect(7, 3, 2, 16, "r"); // jalan utara-selatan
  grect(13, 11, 5, 1, "p"); // dermaga ke laut
  // bangunan: penginapan (utara kiri), kantor (utara kanan), rumah-rumah (selatan)
  grect(2, 3, 5, 3, "B");
  grect(4, 5, 1, 1, "E");
  grect(10, 3, 5, 3, "B");
  grect(12, 5, 1, 1, "E");
  grect(2, 13, 5, 3, "B");
  grect(4, 15, 1, 1, "E");
  grect(10, 17, 5, 3, "B");
  grect(12, 19, 1, 1, "E");
  grect(2, 18, 5, 3, "B");
  grect(4, 20, 1, 1, "E");
  grect(10, 7, 3, 1, "S"); // kios pedagang
  grect(14, 7, 1, 1, "l"); // mercusuar
  [[12, 13], [13, 13], [13, 14], [10, 16], [11, 16]].forEach(([a, b]) => grect(a, b, 1, 1, "k"));
  [[6, 9], [9, 9], [6, 12], [9, 12]].forEach(([a, b]) => grect(a, b, 1, 1, "L"));
  [[1, 1], [5, 1], [9, 1], [13, 1], [1, 7], [1, 21], [8, 21]].forEach(([a, b]) => grect(a, b, 1, 1, "T"));

  // (5) Pulau Singgah: x 246..252, y 63..68 (laut di sekelilingnya)
  rect(246, 63, 7, 6, ".", "s");
  [[246, 63], [252, 63], [246, 68], [252, 68]].forEach(([x, y]) => set(x, y, "w", "o"));
  set(246, 65, "p", "s"); // dermaga pulau
  [[248, 63], [251, 64], [249, 67], [251, 67]].forEach(([x, y]) => set(x, y, "P", "s"));
  set(249, 64, "l", "s");

  // (6) benua seberang: pesisir pasir x 283..287, daratan hijau, gunung di utara & selatan
  for (let y = 1; y < WH - 1; y++)
    for (let x = SEA_X1 + 1; x < WW - 1; x++) {
      const beach = x <= 287,
        mtn = y <= 20 || y >= 100;
      if (mtn) set(x, y, "M", "h");
      else if (beach) set(x, y, ".", "s");
      else set(x, y, rnd() < 0.18 ? "T" : ".", "h");
    }
  rect(281, 60, 3, 1, "p", "s"); // dermaga seberang (281,282 di atas laut, 283 di pantai)
  for (let x = 283; x <= 287; x++) {
    set(x, 60, ",", "s");
    set(x, 61, ",", "s");
  }
  // (7) Kota Kerajaan Logaritma: x 288..337, y 44..77 (offset 288,44)
  const CX = 288,
    CY = 44,
    pl = (lx, ly) => [CX + lx, CY + ly],
    lrect = (lx, ly, w, h, c, th = "l") => rect(CX + lx, CY + ly, w, h, c, th);
  lrect(0, 0, 50, 34, ".", "l");
  lrect(0, 0, 50, 1, "Q");
  lrect(0, 33, 50, 1, "Q");
  lrect(0, 0, 1, 34, "Q");
  lrect(49, 0, 1, 34, "Q");
  lrect(1, 16, 11, 2, "r"); // jalan dari gerbang barat
  lrect(0, 16, 1, 2, "r"); // gerbang
  lrect(8, 1, 2, 32, "w"); // kanal
  lrect(8, 16, 2, 2, "p"); // jembatan kanal
  lrect(12, 17, 26, 7, "r"); // alun-alun
  lrect(22, 9, 6, 8, "r"); // avenue ke istana
  lrect(22, 24, 6, 9, "r"); // jalan selatan
  lrect(12, 24, 26, 2, "r");
  lrect(38, 20, 11, 2, "r"); // jalan timur
  // istana: badan utama + dua sayap, gerbang di (24,8),(25,8)
  lrect(16, 1, 18, 8, "U");
  lrect(10, 3, 6, 6, "U");
  lrect(34, 3, 6, 6, "U");
  lrect(24, 8, 2, 1, "G");
  [[22, 10], [27, 10], [22, 13], [27, 13]].forEach(([a, b]) => lrect(a, b, 1, 1, "Z"));
  // rumah (pintu terkunci kecuali penginapan)
  [
    [2, 3, 5], [2, 9, 5], [2, 21, 5], [2, 27, 5],
    [11, 11, 6], [11, 27, 6],
    [41, 4, 7], [41, 10, 7], [41, 15, 7], [41, 24, 7], [41, 29, 7],
    [29, 27, 6], // penginapan
  ].forEach(([a, b, w]) => {
    lrect(a, b, w, 3, "B");
    lrect(a + (w >> 1), b + 2, 1, 1, "E");
  });
  lrect(24, 20, 2, 1, "f"); // air mancur
  [[14, 19], [15, 19], [16, 19], [33, 19], [34, 19], [35, 19]].forEach(([a, b]) => lrect(a, b, 1, 1, "S"));
  [[13, 18], [36, 18], [13, 22], [36, 22], [21, 10], [28, 10], [21, 14], [28, 14], [21, 21], [28, 21]].forEach(([a, b]) => lrect(a, b, 1, 1, "L"));
  [[12, 9], [16, 9], [12, 15], [3, 14], [3, 19], [5, 14], [30, 15], [18, 31], [32, 31], [38, 31], [47, 22], [47, 18]].forEach(([a, b]) => lrect(a, b, 1, 1, "T"));

  // dunia selesai
  for (let y = 0; y < WH; y++) {
    set(WW - 1, y, "#");
    if (y === 0 || y === WH - 1) for (let x = 0; x < WW; x++) set(x, y, "#");
  }
  O.w = WW;
  O.g = g.map((r) => r.join(""));
  delete O.mc;

  /* ---------- Istana Logaritma (interior 24x13) ---------- */
  (function () {
    const r = [],
      a = (...x) => r.push(x);
    a("c", 10, 2, 4, 10);
    a("H", 11, 1, 2, 1);
    [[7, 3], [7, 6], [7, 9], [16, 3], [16, 6], [16, 9]].forEach(([x, y]) => a("Z", x, y));
    a("f", 3, 6);
    a("f", 20, 6);
    mkm("Y", "y", r, [[11, 12], [12, 12]], 24, 13);
  })();

  /* ===================== ENTITAS ===================== */
  const DOCKS = [
    { id: "G", lx: 218, ly: 53, sx: 219, sy: 53, name: "Pelabuhan Sigma" },
    { id: "M", lx: 246, ly: 65, sx: 245, sy: 65, name: "Pulau Singgah" },
    { id: "L", lx: 281, ly: 60, sx: 280, sy: 60, name: "Kota Logaritma" },
  ];
  const put = (e) => {
    if ("TCRPM".includes(g[e.y][e.x])) {
      g[e.y][e.x] = ".";
      O.g[e.y] = g[e.y].join("");
    }
    EN.O.push(e);
  };
  const [g1x, g1y] = pg(5, 9),
    [g2x, g2y] = pg(5, 12),
    [c1x, c1y] = pl(21, 20),
    [c2x, c2y] = pl(31, 21);
  [
    // tele + kristal
    { t: "tele", wp: "G", x: g1x, y: g1y },
    { t: "crystal", x: g2x, y: g2y },
    { t: "tele", wp: "M", x: 248, y: 65 },
    { t: "crystal", x: 248, y: 67 },
    { t: "tele", wp: "L", x: c1x, y: c1y },
    { t: "crystal", x: c2x, y: c2y },
    // peti
    { t: "chest", id: "d8", x: 150, y: 30, coin: 110, fp: 1 },
    { t: "chest", id: "d9", x: 190, y: 75, coin: 140, po: 1 },
    { t: "chest", id: "o1", x: 251, y: 65, coin: 150, po: 1, sc: 1 },
    { t: "chest", id: "l1", x: 300, y: 30, coin: 140, fp: 1 },
    { t: "chest", id: "l2", x: 325, y: 28, coin: 150, po: 1 },
    { t: "chest", id: "l3", x: 296, y: 90, coin: 160, sc: 1 },
    { t: "chest", id: "l4", x: 322, y: 92, coin: 170, po: 1 },
    { t: "chest", id: "l5", x: pl(47, 2)[0], y: pl(47, 2)[1], coin: 120, po: 1 },
    { t: "chest", id: "l6", x: pl(2, 31)[0], y: pl(2, 31)[1], coin: 130, fp: 1 },
    { t: "chest", id: "l7", x: pl(47, 32)[0], y: pl(47, 32)[1], coin: 180, sc: 1 },
    // Kraken menjaga selat sempit
    { t: "foe", i: EI.kraken, x: 270, y: 60, sp: "kraken" },
  ].forEach(put);
  // perahu layar di tiap dermaga (di petak laut tempat perahu ditambatkan)
  DOCKS.forEach((d) =>
    EN.O.push({ t: "boat", dock: d, x: d.sx, y: d.sy, on: () => !boat && (d.id === "G" || !!F.boatOwn) }),
  );
  // penginapan baru (memakai interior "J" milik town.js)
  {
    const [ix1, iy1] = pg(4, 5),
      [ix2, iy2] = pl(32, 29);
    [
      { x: ix1, y: iy1, name: "Penginapan Camar Biru" },
      { x: ix2, y: iy2, name: "Penginapan Mutiara Laut" },
    ].forEach((i) =>
      EN.O.push({ t: "portal", x: i.x, y: i.y, to: "J", tx: 9, ty: 8, f: [0, -1], inn: [i.x, i.y + 1], innName: i.name, sign: 1 }),
    );
  }
  // gerbang istana (tanpa kunci) dan pintu keluarnya
  {
    const [gx, gy] = pl(24, 8);
    EN.O.push(
      Object.assign(pt(gx, gy, "Y", 11, 11, [0, -1]), { gate: 1 }),
      Object.assign(pt(gx + 1, gy, "Y", 12, 11, [0, -1]), { gate: 1 }),
    );
    EN.Y = [
      pt(11, 12, "O", gx, gy + 1, [0, 1]),
      pt(12, 12, "O", gx + 1, gy + 1, [0, 1]),
    ];
  }
  TELES.push(...EN.O.filter((e) => e.t === "tele" && ["G", "M", "L"].includes(e.wp)));
  WP.push({ id: "G", n: "Pelabuhan Sigma" }, { id: "M", n: "Pulau Singgah" }, { id: "L", n: "Kota Logaritma" });

  /* ===================== PERILAKU ===================== */
  // wilayah baru
  {
    const _reg = reg;
    reg = function (x, y) {
      if (x >= 201 && x <= 222 && y >= 42 && y <= 63) return "G";
      if (x >= 288 && x <= 337 && y >= 44 && y <= 77) return "L";
      if (x >= 245 && x <= 253 && y >= 62 && y <= 69) return "M";
      if (x >= SEA_X0 && x <= SEA_X1) return "S";
      if (x > SEA_X1) return "C";
      return _reg(x, y);
    };
    const _wild = wild;
    wild = function (x, y) {
      if (TELES.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 7)) return null;
      const z = reg(x, y);
      if (z === "S") return boat ? { pool: [EI.jelly, EI.crab, EI.shark], p: SEA_P } : null;
      if (z === "C") return { pool: [4, 6], p: 0.3 };
      if (z === "G" || z === "L" || z === "M" || z === "Y") return null;
      return _wild(x, y);
    };
  }
  // petak yang bisa dilewati: di perahu hanya laut terbuka, berjalan kaki tidak boleh masuk laut / mercusuar / peti kayu / gerbang
  const seaT = (x, y) => x >= SEA_X0 && x <= SEA_X1 && !!MP.O.g[y] && MP.O.g[y][x] === "w";
  {
    const _solid = solid;
    solid = (x, y) =>
      boat
        ? !(mp === "O" && seaT(x, y))
        : _solid(x, y) || "Glk".includes((MP[mp].g[y] || "")[x] || " ");
    const _step = step;
    step = function (dx, dy) {
      if (boat && !mv && !busy) {
        const tx = px + dx,
          ty = py + dy,
          d = DOCKS.find((k) => k.lx === tx && k.ly === ty);
        if (d && !at(tx, ty)) {
          face = [dx, dy];
          return landAt(d);
        }
      }
      _step(dx, dy);
    };
    const _wd = W.draw;
    W.draw = function (t) {
      if (boat) trail = [0, 1, 2, 3].map(() => [-60, -60]); // party "ikut di perahu" (tidak digambar)
      _wd(t);
    };
    const _init = W.init;
    W.init = function () {
      _init();
      boat = false;
      F.boatOwn = 0;
      F.rajaLaut = 0;
      F.lautInfo = 0;
    };
    const _tpKey = tpKey;
    tpKey = function () {
      if (boat) return say("Teleportasi tidak bisa dipakai di atas laut.");
      _tpKey();
    };
    const _tpMenu = tpMenu;
    tpMenu = function (scroll, here) {
      if (boat) {
        busy = false;
        invOpen = false;
        idle();
        return say("Gulungan tidak bekerja di atas laut. Berlabuhlah dulu.");
      }
      _tpMenu(scroll, here);
    };
  }
  function boardAt(d) {
    RV.list.length = 0;
    RV.cur = null;
    boat = true;
    mp = "O";
    px = d.sx;
    py = d.sy;
    face = [d.sx - d.lx, d.sy - d.ly];
    mv = null;
    held = null;
    fd = 12;
    zl = 150;
    SND.sfx("portal");
    SND.music(zone());
    idle();
    say("Layar dikembangkan! Arahkan perahu ke laut lepas. Dekati dermaga untuk berlabuh.");
  }
  function landAt(d) {
    boat = false;
    RV.list.length = 0;
    RV.cur = null;
    go({ to: "O", tx: d.lx, ty: d.ly, f: [d.lx - d.sx, d.ly - d.sy] });
    say(`Kamu berlabuh di ${d.name}. Perahu ditambatkan di dermaga.`);
  }
  H.boat = (e) => {
    if (!F.boatOwn)
      return dlg("Perahu Layar", [
        "Perahu layar bercat biru ini milik Pelabuhan Sigma.",
        "Bicaralah dengan Kapten Sigma dulu untuk membeli izin berlayar.",
      ]);
    boardAt(e.dock);
  };
  // gambar: perahu di dermaga, gerbang tanpa kilau, dan perahu yang dikendarai pemain
  const sail = (x, y, fl) => {
      const dir = fl ? -1 : 1,
        mx = fl ? x + 1 : x + 14;
      ctx.fillStyle = "#6b4a35";
      ctx.fillRect(mx, y - 14, 1, 24);
      for (let r = 0; r < 10; r++) {
        const w = 11 - r;
        ctx.fillStyle = r % 3 === 0 ? "#cfc7ad" : "#f4f1ea";
        ctx.fillRect(dir > 0 ? mx + 1 : mx - w, y - 12 + r, w, 1);
      }
      ctx.fillStyle = "#d2284d";
      ctx.fillRect(dir > 0 ? mx + 1 : mx - 4, y - 16, 4, 2);
    },
    hull = (x, y, fl) => {
      const w = rm ? 0 : Math.round(Math.sin(performance.now() / 250));
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillRect(x - 3, y + 15 + w, 5, 1);
      ctx.fillRect(x + 14, y + 15 - w, 6, 1);
      ctx.fillStyle = "#3a2412";
      ctx.fillRect(x - 2, y + 10, 20, 5);
      ctx.fillStyle = "#5e3a1a";
      ctx.fillRect(x - 1, y + 11, 18, 4);
      ctx.fillStyle = "#b87a3a";
      ctx.fillRect(x - 2, y + 9, 20, 2);
      ctx.fillStyle = "#4a2f18";
      ctx.fillRect(x + 3, y + 11, 1, 4);
      ctx.fillRect(x + 8, y + 11, 1, 4);
      ctx.fillRect(x + 13, y + 11, 1, 4);
      ctx.fillStyle = "#b87a3a";
      if (fl) ctx.fillRect(x - 4, y + 8, 2, 3), ctx.fillRect(x + 18, y + 7, 2, 4);
      else ctx.fillRect(x + 18, y + 8, 2, 3), ctx.fillRect(x - 4, y + 7, 2, 4);
    };
  {
    const _spr = spr;
    spr = function (k, x, y, s, al, tint, fr, fl, mm) {
      if (boat && W.on) {
        if (/^m[0-3]$/.test(k)) return; // anggota party ikut di dalam perahu
        if (k === "hero") {
          sail(x, y, fl);
          _spr(k, x, y, s, al, tint, fr, fl, mm);
          hull(x, y, fl);
          return;
        }
      }
      _spr(k, x, y, s, al, tint, fr, fl, mm);
    };
    const _ent = ent;
    ent = function (e, t, bob) {
      if (e.t === "boat") {
        const X = e.x * 16,
          Y = e.y * 16 + OY + (rm ? 0 : Math.round(Math.sin(t / 400 + e.x)));
        const fl = e.dock.lx > e.dock.sx;
        sail(X, Y, fl);
        hull(X, Y, fl);
        return;
      }
      if (e.t === "portal" && e.gate) return; // gerbang istana: tanpa kilau portal
      _ent(e, t, bob);
    };
  }
  // peta mini: warna untuk laut, kota baru, dan dermaga
  {
    const _mini2 = mini2;
    mini2 = function (id) {
      if (id !== "O") return _mini2(id);
      const m = MP.O;
      if (m.mc) return m.mc;
      const c = document.createElement("canvas"),
        k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d"),
        BG = { h: "#2c6a3c", v: "#3f8f4e", k: "#8d8aa8", t: "#c9a86a", d: "#2a2640", i: "#a8743c", s: "#dfbf78", f: "#1d4a2c", r: "#a9a7c4", n: "#c0b79f", o: "#2a6fd6", l: "#b3c9d0", y: "#d8e4e6" },
        col = { "#": "#4a4868", w: "#2a6fd6", B: "#b8472f", E: "#6b3a1c", T: "#1d6e3a", r: "#8886a8", b: "#c28a4a", p: "#c28a4a", L: "#ffd166", f: "#5aa8ff", S: "#d2284d", M: "#6a6784", C: "#3f8f4e", R: "#8a8a98", P: "#2f9e57", Q: "#c8c6e0", U: "#2f4fa8", D: "#5a3a22", Z: "#e8e1cf", H: "#e2b84a", c: "#a8222f", ",": "#a9854f", G: "#14546a", l: "#e8e4d8", k: "#8a5a2b" };
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          k.fillStyle = col[ch] || BG[m.bm ? m.bm[y][x] : m.th] || "#3d3a5c";
          k.fillRect(x, y, 1, 1);
        }),
      );
      return (m.mc = c);
    };
  }

  /* ===================== QUEST ===================== */
  QS.push({
    id: "laut",
    n: "Lintas Samudra",
    d: "Seberangi Samudra Prima dari Pelabuhan Sigma (jauh di timur Padang Pasir), kalahkan Kraken di selat sempit, lalu temui Raja Logaritma di istananya.",
    gp: 120,
    coin: 400,
    it: "trident",
    on: () => F.q.raja === 3,
    chk: () => F.rajaLaut,
    pr: () => (F.boatOwn ? "Temui Raja di Kota Logaritma" : "Beli izin berlayar di Pelabuhan Sigma"),
  });
  {
    const _eu = N.euclid;
    N.euclid = () => {
      if (F.q.raja === 3 && !F.q.laut && !F.lautInfo) {
        F.lautInfo = 1;
        return dlg("Guildmaster Euclid", [
          "Raja Aksioma sudah memberi restunya. Kini ada kabar dari seberang lautan: Raja Logaritma ingin bertemu denganmu.",
          "Ambil misi 'Lintas Samudra' di Papan Quest. Jalannya sangat jauh: dari Padang Pasir, ambil jejak kafilah memutar lewat utara sampai ke Pelabuhan Sigma di pantai timur.",
          "Dari sana kamu harus berlayar zig-zag melewati karang. Bawa banyak ramuan, dan hati-hati dengan penghuni laut!",
        ]);
      }
      _eu();
    };
  }

  /* ===================== TOKO LAUT ===================== */
  const ITS = [
    IT[0],
    IT[1],
    IT[2],
    ["Gulungan Teleportasi (sekali pakai)", 60, () => (Pl.scr = (Pl.scr | 0) + 1)],
    ...["nakhoda", "shark"].map((k) => [`${EQ[k].n} (${st(EQ[k])})`, EQ[k].price, () => (Pl.own[k] = 1), () => Pl.own[k]]),
  ];
  function shopSea() {
    busy = true;
    say("Pedagang Pelabuhan menggelar barang dari seberang lautan.");
    ui(
      `<div class="card"><b class="ok">Pedagang Pelabuhan</b> <span class="qm">Koin: ${Pl.coin}</span><div style="display:grid;gap:8px;margin:8px 0">${ITS.map((t, i) => `<button class="b" data-b="${i}" ${Pl.coin < t[1] || (t[3] && t[3]()) ? "disabled" : ""}>${t[0]} — ${t[3] && t[3]() ? "dimiliki" : t[1] + " koin"}</button>`).join("")}</div><button class="b g" id="sc">Tutup</button></div>`,
    );
    document.querySelectorAll("[data-b]").forEach(
      (b) =>
        (b.onclick = () => {
          const t = ITS[b.dataset.b];
          SND.sfx("coin");
          Pl.coin -= t[1];
          t[2]();
          hud();
          shopSea();
        }),
    );
    $("#sc").onclick = idle;
  }

  /* ===================== NPC & DIALOG ===================== */
  const wk2 = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`,
    gn = (map, who, sp, [x, y], lines, fx, more) =>
      OCEAN_NPCS.push([map, { t: "npc", id: "gen", d: [who, lines], sp, x, y, fx, ...more }]),
    sp = (map, id, spr_, [x, y], fx) => OCEAN_NPCS.push([map, { t: "npc", id, sp: spr_, x, y, fx: fx || {} }]);

  Object.assign(N, {
    dagangS: () => shopSea(),
    kapten: () => {
      if (F.boatOwn)
        return dlg("Kapten Sigma", [
          "Perahumu sudah siap di ujung dermaga. Dekati perahu itu dan tekan tombol bicara untuk naik.",
          P([
            "Dari sini pelayaran memutar: selatan lewat celah karang pertama, utara lewat celah kedua, lalu selat sempit tempat Kraken bersarang.",
            "Berlabuhlah di Pulau Singgah kalau Mana dan HP menipis. Monster laut tidak berani mendekati batu teleportasinya.",
            "Dermaga seberang ada di pesisir barat Kota Logaritma. Perahu lain sudah menunggu di sana.",
          ]),
        ]);
      busy = true;
      say("Kapten Sigma menawarkan izin berlayar.");
      ui(
        `<div class="card"><b class="ok">Kapten Sigma</b><div style="margin:6px 0 10px">Samudra Prima itu luas, penuh karang dan penghuni lapar. Di selat paling sempit, Kraken Tak Hingga menutup jalan.<br>Izin berlayar ${FARE} koin, sekali bayar, berlaku untuk semua dermaga. Mau?</div><div class="row"><button class="b" id="kb" ${Pl.coin < FARE ? "disabled" : ""}>Beli izin (${FARE} koin)</button><button class="b g" id="kx">Nanti saja</button></div></div>`,
      );
      $("#kb").onclick = () => {
        Pl.coin -= FARE;
        F.boatOwn = 1;
        SND.sfx("quest");
        hud();
        dlg("Kapten Sigma", [
          "Terima kasih! Izin berlayar sudah kucatat. Di tiap dermaga akan ada perahu yang siap untukmu.",
          "Naiklah perahu di ujung dermaga. Bawa ramuan, dan jangan lawan monster laut di tengah arus kalau HP-mu tipis!",
        ]);
      };
      $("#kx").onclick = idle;
    },
    rajalaut: () => {
      if (F.q.laut === 1 && !F.rajaLaut) {
        F.rajaLaut = 1;
        SND.sfx("win");
        return dlg(
          "Raja Logaritma",
          [
            "Kamu menyeberangi Samudra Prima dan menaklukkan Kraken? Kabar itu sudah sampai lebih dulu daripada perahumu.",
            "Kami di Logaritma menjaga separuh peta menuju Jurang Tak Hingga. Aksioma menyimpan separuhnya, kami separuhnya lagi. Sang Nol mencari keduanya.",
            "Peta itu aman selama Penjaga Angka bersedia melindunginya. Terimalah restu kami.",
            "Kembalilah ke Guild dan klaim hadiahmu di Papan Quest. Gunakan Batu Teleportasi biar cepat.",
          ],
          () => {
            hud();
            idle();
            say("Kembali ke Papan Quest Guild untuk klaim hadiah 'Lintas Samudra'.");
          },
        );
      }
      if (F.rajaLaut)
        return dlg("Raja Logaritma", [
          "Logaritma berutang budi padamu, Penjaga. Laut ini tenang berkatmu.",
        ]);
      dlg("Raja Logaritma", [
        "Selamat datang di Logaritma, pengelana. Kalau Guild mengutusmu, ambil dulu misi 'Lintas Samudra' di Papan Quest.",
      ]);
    },
    ratulaut: () =>
      dlg("Ratu Logaritma", [
        "Selamat datang, Penjaga Angka. Logaritma mengajarkan kami bahwa hal yang sangat besar bisa dihitung langkah demi langkah.",
        "Laut ini dulu damai. Sejak Kristal Aksioma pecah, penghuninya menghitung tanpa henti dan mengamuk.",
      ]),
  });

  /* --- Pelabuhan Sigma (offset 201,42) --- */
  sp("O", "kapten", "kapten", pg(12, 9), { face: 1 });
  sp("O", "dagangS", "dagang", pg(11, 8), { face: 1 });
  gn("O", "Nelayan Pelabuhan", "nelayan", pg(14, 13), [
    "Ikan laut di sini besar-besar, tapi kadang yang menggigit malah ubur-ubur!",
    "Kalau dengar ombak bergemuruh dari selat, jangan dekat-dekat. Itu Kraken.",
  ], { act: "fish", face: 1 });
  gn("O", "Pelaut Tua", "pelaut", pg(3, 10), [
    "Sudah empat puluh tahun aku berlayar. Selat sempit dulu aman, sampai tentakel itu muncul.",
    "Pelayaran ke seberang itu zig-zag. Selatan dulu, lalu utara, baru lurus ke timur.",
  ], { pace: [...pg(3, 10), ...pg(11, 10)] });
  gn("O", "Tukang Sapu Dermaga", "tukangsapu", pg(6, 16), [
    "Pasir terbawa angin terus. Sudah kusapu, datang lagi, begitu tiap hari.",
  ], { act: "sweep", face: 1 });
  gn("O", "Pandai Besi Dermaga", "pandai", pg(9, 17), [
    "Tang! Tang! Jangkar dan paku kapal, itu keahlianku.",
    "Zirah sisik hiu dijual di toko, ditempa dari sisik asli. Kuat sekali!",
  ], { act: "hammer", face: -1 });
  gn("O", "Anak Pelabuhan", "bocah", pg(4, 8), [
    "Kakak mau berlayar? Aku mau jadi kapten kalau besar!",
    "Kata Kakekku, jangan berenang di dekat dermaga.",
  ], { wander: 2, face: 1 });
  gn("O", "Selene (Penyihir Rank S)", "pmage", pg(9, 6), [
    "Kami baru mau berangkat ke Logaritma. Lautnya lebih berbahaya daripada gurun.",
    wk2(EI.jelly),
  ], { act: "talk", face: 1, ph: 0 });
  gn("O", "Kael (Pendekar Rank S)", "pdekar", pg(10, 6), [
    "Hiu di tengah arus itu cepat sekali. Jangan kalah kecepatan hitung!",
    wk2(EI.shark),
  ], { act: "talk", face: -1, ph: 1 });
  gn("O", "Pemain Seruling", "musisi", pg(12, 12), [
    "Lagu pelaut ini katanya bisa menenangkan ombak. Katanya.",
  ], { act: "music", face: 1 });

  /* --- Pulau Singgah --- */
  gn("O", "Penjaga Mercusuar", "kakek2", [250, 66], [
    "Lampu mercusuar ini kunyalakan tiap malam supaya kapal tidak menabrak karang.",
    "Kamu beruntung sampai sini. Duduklah, sentuh batu itu, dan pulihkan tenaga.",
    wk2(EI.crab),
  ], { face: -1 }, { gift: "pot" });
  gn("O", "Nelayan Singgah", "nelayan", [252, 66], [
    "Satu-satunya pulau di tengah celah. Untung ada tempat memancing yang tenang.",
  ], { act: "fish", face: 1 });

  /* --- Kota Kerajaan Logaritma (offset 288,44) --- */
  gn("O", "Kapten Dermaga", "kapten", [284, 61], [
    "Selamat datang di Pesisir Logaritma! Perahumu kutambatkan dengan aman.",
    "Dari sini ikuti jalan setapak ke gerbang barat kota.",
  ], { face: 1 });
  gn("O", "Penjaga Gerbang", "gerbang", pl(1, 15), [
    "Selamat datang di Kota Kerajaan Logaritma! Kamu pasti menyeberangi samudra, ya?",
    "Sentuh Batu Teleportasi di alun-alun supaya lain kali kamu bisa langsung ke sini.",
  ], { face: 1 });
  gn("O", "Ksatria Patroli", "ksatria", pl(23, 10), [
    "Patroli kota! Kanal dan jalan ini kujaga sampai pagi.",
  ], { pace: [...pl(23, 10), ...pl(23, 16)] });
  gn("O", "Prajurit Patroli", "prajurit", pl(26, 16), [
    "Tidak ada keributan di sekitar istana, ya!",
  ], { pace: [...pl(26, 16), ...pl(26, 10)] });
  sp("O", "dagangS", "dagang", pl(15, 20), { face: 1 });
  gn("O", "Nelayan Kanal", "nelayan", pl(7, 22), [
    "Ikan di kanal ini jinak sekali. Seperti memancing di kolam sendiri.",
  ], { act: "fish", face: 1 });
  gn("O", "Bangsawati", "wanita", pl(20, 22), [
    "Kain sutra dari pelabuhan seberang. Warnanya persis warna laut, bukan?",
  ], { act: "talk", face: 1, ph: 0 });
  gn("O", "Bangsawan", "pria2", pl(21, 22), [
    "Betul sekali. Logaritma hidup dari laut: ikan, garam, dan kain.",
  ], { act: "talk", face: -1, ph: 1 });
  gn("O", "Tukang Kebun Kota", "tukangkebun", pl(12, 10), [
    "Pohon-pohon di taman ini kutanam dari bibit pantai. Kuat angin laut.",
  ], { act: "water", face: 1 });
  gn("O", "Pembaca Buku", "pembaca", pl(13, 15), [
    "Ssst... aku sedang membaca soal pangkat dan akar. Seru, lho!",
  ], { act: "read", face: -1 });
  gn("O", "Anak Kota", "bocah", pl(30, 21), [
    "Kakak datang naik perahu? Wah, aku belum pernah!",
  ], { wander: 3, face: 1 });
  gn("O", "Marina (Penyihir Rank S)", "pmage", pl(32, 22), [
    "Aku dan Triton mengawal pedagang melewati selat. Kraken itu nyaris menenggelamkan kami.",
    wk2(EI.kraken),
  ], { act: "talk", face: 1, ph: 0 });
  gn("O", "Triton (Pendekar Rank S)", "pdekar", pl(33, 22), [
    "Kalau kamu yang mengalahkannya, selat jadi aman. Semoga ada yang berani.",
  ], { act: "talk", face: -1, ph: 1 });
  gn("O", "Veteran Naru (Rank S)", "pveteran", pl(37, 16), [
    "Dulu aku berlayar sampai ujung dunia. Kembali dengan satu kaki lebih lemah, tapi sepuluh cerita.",
    "Simpan game di penginapan sebelum menantang yang besar-besar!",
  ], {}, { gift: "fpot" });
  gn("O", "Pemain Kecapi", "musisi", pl(28, 22), [
    "Lagu ini diwariskan nelayan Logaritma. Iramanya mengikuti ombak.",
  ], { act: "music", face: -1 });
  gn("O", "Penjaga Istana", "ksatria", pl(23, 9), [
    "Raja menerima tamu dari Guild kapan saja. Silakan masuk, Penjaga Angka.",
  ], { face: 1 });
  gn("O", "Penjaga Istana", "prajurit", pl(26, 9), [
    "Disiplin dan setia. Itu semboyan Logaritma.",
  ], { face: -1 });

  /* --- Istana Logaritma --- */
  sp("Y", "rajalaut", "rajalaut", [11, 2], { face: 1 });
  sp("Y", "ratulaut", "ratulaut", [12, 2], { face: -1 });
  gn("Y", "Putri Mutiara", "putrilaut", [15, 3], [
    "Kamu yang mengalahkan Kraken? Wah, hebat! Ayahanda sudah menunggumu.",
    "Dulu aku sering bermain di dermaga. Sekarang Ayahanda melarang karena monster.",
  ], { face: -1 });
  gn("Y", "Penasihat Kerajaan", "pejabat", [4, 5], [
    "Catatan istana: nama Guild Penjaga Angka kini disebut-sebut di seluruh Logaritma.",
    "Logaritma mencatat bahwa tiap penyeberangan yang selamat membuat jalur dagang lebih ramai.",
  ], {}, {});
  gn("Y", "Ksatria Bahari", "ksatria", [8, 7], [
    "Aku dilatih untuk melindungi pelabuhan dan Raja. Yang berniat jahat, bicara denganku.",
  ], {});
  gn("Y", "Ksatria Bahari", "ksatria", [15, 7], [
    "Kraken itu mimpi buruk pelaut kami selama bertahun-tahun.",
  ], {});
  gn("Y", "Prajurit Istana", "prajurit", [9, 10], [
    "Selamat datang. Jangan menyentuh kolam di dekat singgasana.",
  ], {});
  gn("Y", "Prajurit Istana", "prajurit", [14, 10], [
    "Siap! Aula ini kujaga sepanjang hari.",
  ], {});
  sp("Y", "tabib", "tabib", [3, 9], {});
  gn("Y", "Pelayan Istana", "pelayan", [20, 4], [
    "Mohon jangan menyentuh vas karang di dekat singgasana. Itu pusaka kerajaan.",
  ], {});
  gn("Y", "Tamu Kerajaan", "tamu", [20, 9], [
    "Aku datang dari Aksioma lewat samudra. Perjalanan terpanjang dalam hidupku!",
  ], {});
})();
