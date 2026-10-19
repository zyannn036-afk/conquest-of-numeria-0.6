/* ===== Numeria Quest — Perluasan Timur: Padang Himpunan, Hutan Peluang, Kota Himpunan =====
   Dimuat setelah ocean.js dan SEBELUM town.js (town.js yang menaruh warga lewat OCEAN_NPCS).
   Jalur: Kota Logaritma -> gerbang timur (baru dibuka) -> Padang Himpunan -> Hutan Peluang (zig-zag,
          dijaga Ent Tua Peluang di punggung bukit terakhir) -> Kota Himpunan.
   Dunia dilebarkan dari 340 menjadi 480 petak. ===== */

(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const WW = 480, // lebar dunia baru (sebelumnya 340)
    FX0 = 354, // Hutan Peluang: kolom pertama..terakhir, baris pertama..terakhir
    FX1 = 423,
    FY0 = 21,
    FY1 = 99,
    CX = 428, // Kota Himpunan: pojok kiri-atas dan ukurannya
    CY = 44,
    CW = 50,
    CH = 34,
    FOREST_P = 0.4, // peluang monster hutan muncul tiap WILD_STEPS langkah (bandit dihitung terpisah)
    PLAIN_P = 0.3; // peluang monster di Padang Himpunan

  /* ---------- nama wilayah, tema warna, perlengkapan ---------- */
  Object.assign(MN, { W: "Padang Himpunan", E: "Hutan Peluang", X: "Kota Himpunan" });
  Object.assign(TH, {
    g: { a: "#1d5a4a", b: "#194f42", w: "#0b2a26", w2: "#14403a", t: "#14684f", t2: "#4fe0b0" },
    z: { a: "#d6c8a4", b: "#cdbf9b", w: "#4a2f5e", w2: "#6a4a84", t: "#2f9e57", t2: "#5fd078" },
  });
  EQ.rootstaff = { n: "Tongkat Akar Peluang", s: "w", atk: 10, fist: "#7ee0a0", sw: "#b8f0c0" };

  /* ---------- monster hutan (indeks E dihitung otomatis) ---------- */
  const ART = {
    shroom: {
      pal: { K: "#2a1428", R: "#d2284d", W: "#fff4f4", s: "#f4ecd0" },
      m: [
        "................",
        ".....KKKKKK.....",
        "...KKRRRRRRKK...",
        "..KRRRWWRRRRRK..",
        ".KRRWWWRRRWWRRK.",
        ".KRRRWWRRRRWWRK.",
        "KRRRRRRRRRRRRRRK",
        "KKKKKKKKKKKKKKKK",
        "...KssssssssK...",
        "...KsKssssKsK...",
        "...KsKssssKsK...",
        "...KssKKKKssK...",
        "...KssssssssK...",
        "..KssssssssssK..",
        "..KKKKKKKKKKKK..",
        "................",
      ],
    },
    owl: {
      pal: { K: "#1a1428", B: "#8a6a4a", b: "#6a4a30", W: "#f4ecd0", Y: "#ffd24d" },
      m: [
        "................",
        "..K..........K..",
        "..KKKKKKKKKKKK..",
        ".KBBBBBBBBBBBBK.",
        ".KBWWWBBBBWWWBK.",
        ".KBWKYWBBWYKWBK.",
        ".KBWWWWYYWWWWBK.",
        ".KBBBBBYYBBBBBK.",
        "KBBbbBBBBBBbbBBK",
        "KBBbbBBWWBBbbBBK",
        "KBBBBBWWWWBBBBBK",
        ".KBBBBBWWBBBBBK.",
        "..KBBBBBBBBBBK..",
        "...KKYYKKYYKK...",
        "....KKK..KKK....",
        "................",
      ],
    },
    ent: {
      pal: { K: "#14210f", G: "#3f9a3a", g: "#78d070", B: "#7a5230", b: "#5a3a20", Y: "#ffe14d" },
      m: [
        "...KKGGGGGGKK...",
        "..KGGggGGGGggGK.",
        ".KGggGGGGGGGGgGK",
        ".KGGGGGGGGGGGGK.",
        "..KKBBBBBBBBKK..",
        "..KBYYBBBBYYBK..",
        "..KBBBBBBBBBBK..",
        "..KBBBKKKKBBBK..",
        "...KBBBBBBBBK...",
        ".GKBBbBBBBbBBKG.",
        "GGKBBbBBBBbBBKGG",
        ".GKBBbBBBBbBBKG.",
        "..KBBBBBBBBBBK..",
        "..KBBBK..KBBBK..",
        ".KBBBBK..KBBBBK.",
        ".KKKKKK..KKKKKK.",
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
  mon("shroom", {
    n: "Jamur Statistik",
    sp: "shroom",
    hp: 200,
    atk: 19,
    topics: ["persen", "arit", "pecahan"],
    weak: "persen",
    d: [3, 5],
    s: 4,
    xp: 62,
    coin: 48,
    bg: ["#14282a", "#2a5a50", "#10221f", "#b8fff0"],
    intro: "Jamur besar bergoyang di balik semak. Bintik-bintiknya adalah data yang tidak mau diam!",
    win: "Jamur itu menciut, melepas kabut spora, lalu lenyap.",
  });
  mon("owl", {
    n: "Burung Hantu Modus",
    sp: "owl",
    hp: 220,
    atk: 20,
    topics: ["geom", "alj"],
    weak: "geom",
    d: [3, 5],
    s: 4,
    xp: 68,
    coin: 52,
    bg: ["#101a2e", "#2a3a6a", "#0c1426", "#ffe9a0"],
    intro: "Sepasang mata bulat menyala di dahan. Burung hantu itu selalu tahu angka yang paling sering muncul!",
    win: "Burung hantu itu mengepak pergi dan hilang di antara pepohonan.",
  });
  mon("ent", {
    n: "Ent Tua Peluang",
    sp: "ent",
    hp: 380,
    atk: 24,
    topics: ["arit", "pecahan", "persen", "geom", "alj"],
    weak: "persen",
    d: [4, 5],
    s: 4,
    xp: 190,
    coin: 260,
    bg: ["#0f2a1c", "#2a6a3a", "#0a1c12", "#d8ffb0"],
    intro:
      "Akar-akar raksasa bergerak menutup jalan! Ent Tua Peluang membuka matanya. Tiap dahannya menghitung kemungkinan kamu gagal. Tidak ada jalan lain!",
    win: "Ent itu mendesah panjang, akarnya mengendur, dan jalan ke timur terbuka.",
  });

  /* ---------- musik (zona yang tidak terdaftar di bgm.js memakai musik sintetis ini) ---------- */
  {
    const T = SND.tracks;
    T.W = T.forest;
    T.E = T.forest;
    T.X = T.L || T.quiet;
  }

  /* ===================== MEMBANGUN DUNIA (340x123 -> 480x123) ===================== */
  const O = MP.O,
    WH = O.h,
    W0 = O.w,
    g = O.g.map((r) => r.split("")),
    bm = O.bm,
    rnd = ((s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })(20261016),
    inb = (x, y) => x > 0 && y > 0 && x < WW - 1 && y < WH - 1,
    set = (x, y, c, th) => {
      if (x < 0 || y < 0 || x >= WW || y >= WH) return;
      g[y][x] = c;
      if (th) bm[y][x] = th;
    },
    rect = (x, y, w, h, c, th) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c, th);
    },
    // jejak: membersihkan pohon di sepanjang garis, tengahnya ditandai (mis. "," = tanah jalan)
    carve = (pts, hw, mid) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) {
              const X = x + ii,
                Y = y + j;
              if (inb(X, Y) && g[Y][X] === "T") g[Y][X] = ".";
            }
          if (mid && inb(x, y) && g[y][x] === ".") g[y][x] = mid;
        }
      }
    },
    clr = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++)
          if (inb(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r && g[y][x] === "T") g[y][x] = ".";
    };

  // (1) perluas peta: buang tembok timur lama (x=339), isi 340..479
  for (let y = 0; y < WH; y++) {
    const edge = y === 0 || y === WH - 1;
    g[y].length = bm[y].length = edge ? W0 : W0 - 1;
    for (let x = g[y].length; x < WW; x++) {
      let c, t;
      if (edge || x === WW - 1) (c = "#"), (t = "h");
      else if (y <= 20 || y >= 100) (c = "M"), (t = x >= FX0 - 1 && x <= FX1 + 1 ? "g" : "h");
      else if (x >= FX0 && x <= FX1) (c = rnd() < 0.34 ? "T" : "."), (t = "g");
      else (c = rnd() < 0.14 ? "T" : "."), (t = "h");
      g[y].push(c);
      bm[y].push(t);
    }
  }

  // (2) gerbang timur Kota Logaritma (tembok x=337 dibuka di baris jalan timur y=64..65)
  set(337, 64, "r", "l");
  set(337, 65, "r", "l");

  // (3) punggung bukit: pintu hutan, dua celah zig-zag, penjaga (Ent), dan gerbang timur hutan
  const ridge = (x0, x1, g0, g1) => {
    for (let y = 1; y < WH - 1; y++) if (y < g0 || y > g1) rect(x0, y, x1 - x0 + 1, 1, "M", "g");
  };
  ridge(353, 353, 61, 67); // pintu barat hutan
  ridge(372, 373, 28, 32); // celah utara
  ridge(388, 389, 88, 92); // celah selatan
  ridge(404, 405, 60, 60); // selat akar sempit: dijaga Ent
  ridge(424, 424, 57, 63); // gerbang timur hutan

  // (4) kolam, tempat istirahat, jejak kafilah
  rect(383, 62, 4, 3, "w", "g"); // kolam hutan
  clr(358, 64, 4); // Pos Hutan Peluang (zona aman)
  clr(398, 62, 3); // Pondok Pertapa (sebelum Ent)
  carve(
    [
      [338, 64],
      [353, 64],
      [366, 64],
      [366, 30],
      [380, 30],
      [380, 90],
      [396, 90],
      [396, 60],
      [412, 60],
      [427, 60],
      [CX, 60],
    ],
    1,
    ",",
  );
  carve([[338, 65], [337, 65]], 0, ",");
  carve([[426, 22], [426, 98]], 1, null); // lorong di antara gerbang hutan dan tembok kota: dibuat lapang

  // (5) Kota Himpunan: x 428..477, y 44..77
  const pc = (lx, ly) => [CX + lx, CY + ly],
    lrect = (lx, ly, w, h, c, th = "z") => rect(CX + lx, CY + ly, w, h, c, th);
  lrect(0, 0, CW, CH, ".", "z");
  lrect(0, 0, CW, 1, "Q");
  lrect(0, CH - 1, CW, 1, "Q");
  lrect(0, 0, 1, CH, "Q");
  lrect(CW - 1, 0, 1, CH, "Q");
  lrect(1, 16, 48, 2, "r"); // jalan utama barat-timur
  lrect(0, 16, 1, 2, "r"); // gerbang barat
  lrect(24, 9, 2, 24, "r"); // avenue utara-selatan
  lrect(17, 12, 16, 10, "r"); // alun-alun
  lrect(24, 16, 2, 2, "f"); // air mancur
  lrect(20, 1, 10, 7, "U"); // Balai Himpunan
  [[22, 8], [27, 8]].forEach(([a, b]) => lrect(a, b, 1, 1, "Z"));
  lrect(39, 12, 6, 4, "w"); // kolam kota
  const HOUSES = [
    [3, 3, 6], [3, 9, 6], [3, 21, 6], [3, 27, 6],
    [11, 3, 5], [11, 9, 5], [11, 22, 5], [11, 28, 5],
    [34, 3, 5], [40, 3, 6], [34, 9, 5],
    [41, 21, 6], [41, 27, 6],
    [18, 26, 6], [27, 26, 6],
    [34, 27, 6], // penginapan
  ];
  HOUSES.forEach(([a, b, w]) => {
    lrect(a, b, w, 3, "B");
    lrect(a + (w >> 1), b + 2, 1, 1, "E");
  });
  [[15, 14], [16, 14], [17, 14]].forEach(([a, b]) => lrect(a, b, 1, 1, "S")); // kios
  [[16, 12], [33, 12], [16, 21], [33, 21], [23, 10], [26, 10], [23, 19], [26, 19]].forEach(([a, b]) =>
    lrect(a, b, 1, 1, "L"),
  );
  // pohon taman (jarang), lalu pastikan depan pintu rumah tetap kosong
  for (let y = CY + 2; y < CY + CH - 2; y++)
    for (let x = CX + 2; x < CX + CW - 2; x++)
      if (g[y][x] === "." && (x * 5 + y * 9) % 23 === 0) g[y][x] = "T";
  HOUSES.forEach(([a, b, w]) => {
    const [fx, fy] = pc(a + (w >> 1), b + 3);
    if (g[fy][fx] === "T") g[fy][fx] = ".";
  });

  /* ===================== ENTITAS ===================== */
  const put = (e) => {
    if ("TCRPM".includes(g[e.y][e.x])) g[e.y][e.x] = ".";
    EN.O.push(e);
    return e;
  };
  const targets = []; // titik yang harus bisa dicapai dengan berjalan kaki
  const add = (e) => {
    targets.push([e.x, e.y]);
    return put(e);
  };
  const [t1x, t1y] = pc(21, 14),
    [c1x, c1y] = pc(28, 14);
  [
    // titik teleportasi + kristal
    { t: "tele", wp: "E", x: 357, y: 62 },
    { t: "crystal", x: 357, y: 66 },
    { t: "tele", wp: "X", x: t1x, y: t1y },
    { t: "crystal", x: c1x, y: c1y },
    // Pondok Pertapa: kristal pemulih sebelum menantang Ent
    { t: "crystal", x: 400, y: 64 },
    // peti: padang, hutan, kota
    { t: "chest", id: "p1", x: 345, y: 30, coin: 130, po: 1 },
    { t: "chest", id: "p2", x: 345, y: 94, coin: 140, fp: 1 },
    { t: "chest", id: "e1", x: 360, y: 28, coin: 150, po: 1 },
    { t: "chest", id: "e2", x: 362, y: 92, coin: 150, fp: 1 },
    { t: "chest", id: "e3", x: 376, y: 40, coin: 160, sc: 1 },
    { t: "chest", id: "e4", x: 376, y: 84, coin: 160, po: 1 },
    { t: "chest", id: "e5", x: 384, y: 56, coin: 170, fp: 1 },
    { t: "chest", id: "e6", x: 392, y: 24, coin: 170, po: 1 },
    { t: "chest", id: "e7", x: 392, y: 96, coin: 180, sc: 1 },
    { t: "chest", id: "e8", x: 400, y: 72, coin: 180, fp: 1 },
    { t: "chest", id: "e9", x: 414, y: 30, coin: 200, po: 1, sc: 1 },
    { t: "chest", id: "e10", x: 416, y: 90, coin: 200, fp: 1 },
    { t: "chest", id: "n1", x: 445, y: 30, coin: 190, po: 1 },
    { t: "chest", id: "n2", x: 470, y: 28, coin: 200, sc: 1 },
    { t: "chest", id: "n3", x: 440, y: 90, coin: 190, fp: 1 },
    { t: "chest", id: "n4", x: 468, y: 92, coin: 210, po: 1 },
    { t: "chest", id: "h1", x: pc(47, 2)[0], y: pc(47, 2)[1], coin: 160, po: 1 },
    { t: "chest", id: "h2", x: pc(2, 31)[0], y: pc(2, 31)[1], coin: 170, fp: 1 },
    { t: "chest", id: "h3", x: pc(47, 31)[0], y: pc(47, 31)[1], coin: 200, sc: 1 },
    { t: "chest", id: "h4", x: pc(2, 2)[0], y: pc(2, 2)[1], coin: 180, po: 1 },
  ].forEach((e) => {
    if (e.t === "chest") clr(e.x, e.y, 1);
    add(e);
  });
  // Ent Tua Peluang menjaga selat akar (ridge 404..405, celah y=60)
  put({ t: "foe", i: EI.ent, x: 404, y: 60, sp: "ent" });
  // penginapan Kota Himpunan (memakai interior "J" milik town.js)
  {
    const [ix, iy] = pc(37, 29);
    EN.O.push({
      t: "portal",
      x: ix,
      y: iy,
      to: "J",
      tx: 9,
      ty: 8,
      f: [0, -1],
      inn: [ix, iy + 1],
      innName: "Penginapan Dadu Emas",
      sign: 1,
    });
  }
  TELES.push(...EN.O.filter((e) => e.t === "tele" && ["E", "X"].includes(e.wp)));
  WP.push({ id: "E", n: "Pos Hutan Peluang" }, { id: "X", n: "Kota Himpunan" });

  // pastikan semua titik penting bisa dicapai: kalau terkurung pohon, buka jalan kecil ke wilayah yang terjangkau
  {
    const BLOCK = "#TwBDLfSEMCRPQUZHemGlk",
      free = (x, y) => inb(x, y) && !BLOCK.includes(g[y][x]),
      D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      flood = () => {
        const seen = new Uint8Array(WW * WH),
          st = [[338, 64]];
        seen[64 * WW + 338] = 1;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of D4) {
            const a = x + dx,
              b = y + dy;
            if (free(a, b) && !seen[b * WW + a]) {
              seen[b * WW + a] = 1;
              st.push([a, b]);
            }
          }
        }
        return seen;
      };
    let seen = flood();
    const near = ([x, y]) => D4.some(([dx, dy]) => seen[(y + dy) * WW + (x + dx)]);
    const HARD = "#MQwBEDLfSZUHCRPelkG", // penghalang yang tidak boleh ditembus jalan kecil (pohon boleh dibuka)
      clean = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1],
            n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
          for (let k = 0; k <= n; k++) {
            const x = Math.round(x0 + ((x1 - x0) * k) / n),
              y = Math.round(y0 + ((y1 - y0) * k) / n);
            if (!inb(x, y) || (HARD.includes(g[y][x]) && !(x === pts[0][0] && y === pts[0][1]))) return false;
          }
        }
        return true;
      };
    targets.forEach((t) => {
      if (near(t)) return;
      const cand = [];
      for (let y = t[1] - 45; y <= t[1] + 45; y++)
        for (let x = t[0] - 45; x <= t[0] + 45; x++)
          if (inb(x, y) && seen[y * WW + x]) cand.push([Math.abs(x - t[0]) + Math.abs(y - t[1]), x, y]);
      cand.sort((a, b) => a[0] - b[0]);
      for (const [, x, y] of cand.slice(0, 400)) {
        const a = [t, [x, t[1]], [x, y]],
          b = [t, [t[0], y], [x, y]],
          route = clean(a) ? a : clean(b) ? b : null;
        if (route) {
          carve(route, 0, null);
          break;
        }
      }
      seen = flood();
      if (!near(t)) console.warn("Titik timur belum terjangkau:", t);
    });
  }

  // selesai: tulis kembali ke peta dunia
  O.w = WW;
  O.g = g.map((r) => r.join(""));
  delete O.mc;

  /* ===================== PERILAKU ===================== */
  const inCity = (x, y) => x >= CX && x < CX + CW && y >= CY && y < CY + CH,
    inForest = (x, y) => x >= FX0 && x <= FX1 && y >= FY0 && y <= FY1;
  {
    const _reg = reg;
    reg = function (x, y) {
      if (x >= 338) return inCity(x, y) ? "X" : inForest(x, y) ? "E" : "W";
      return _reg(x, y);
    };
    const _wild = wild;
    wild = function (x, y) {
      if (x < 338) return _wild(x, y);
      if (TELES.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 7)) return null;
      const z = reg(x, y);
      if (z === "E") return { forest: 1, pool: [4, 6, EI.shroom, EI.owl], p: FOREST_P };
      if (z === "W") return { pool: [4, 6], p: PLAIN_P };
      return null; // kota
    };
  }
  // dekorasi: lantai kota ber-ubin, hutan berkunang-kunang
  {
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th === "z") {
        ctx.fillStyle = "rgba(0,0,0,.07)";
        ctx.fillRect(X, Y + 15, 16, 1);
        ctx.fillRect(X + 15, Y, 1, 16);
      } else if (th === "g") {
        _bd(th, X, Y, x, y);
        if ((x * 7 + y * 13) % 19 === 0) {
          ctx.globalAlpha = rm ? 0.7 : 0.4 + 0.4 * Math.sin(performance.now() / 500 + x * 3 + y);
          ctx.fillStyle = "#b8fff0";
          ctx.fillRect(X + 5 + ((x * 3) % 6), Y + 4 + ((y * 5) % 7), 2, 2);
          ctx.globalAlpha = 1;
        }
      } else _bd(th, X, Y, x, y);
    };
  }
  // peta mini: warna hutan & kota baru
  {
    const _m2 = mini2;
    mini2 = function (id) {
      if (id !== "O") return _m2(id);
      const m = MP.O;
      if (m.mc) return m.mc;
      const c = _m2(id),
        k = c.getContext("2d");
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (x < 337) return;
          const t = m.bm[y][x];
          if (ch === "." && (t === "g" || t === "z")) {
            k.fillStyle = t === "g" ? "#14684f" : "#d6c8a4";
            k.fillRect(x, y, 1, 1);
          }
        }),
      );
      return c;
    };
  }

  /* ===================== QUEST ===================== */
  QS.push({
    id: "hutanp",
    n: "Hutan Peluang",
    d: "Lewati gerbang timur Kota Logaritma, seberangi Hutan Peluang, kalahkan Ent Tua yang menutup jalan, lalu temui Wali Kota Himpunan.",
    gp: 140,
    coin: 450,
    it: "rootstaff",
    on: () => !!F.rajaLaut,
    chk: () => F.hutanOk,
    pr: () => (F.done[EI.ent] ? "Temui Wali Kota di Kota Himpunan" : "Seberangi Hutan Peluang di timur Logaritma"),
  });

  /* ===================== NPC & DIALOG ===================== */
  const wk2 = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`,
    gn = (who, sp, [x, y], lines, fx, more) =>
      OCEAN_NPCS.push(["O", { t: "npc", id: "gen", d: [who, lines], sp, x, y, fx: fx || {}, ...more }]),
    cs = (id, spr, [x, y], fx) => OCEAN_NPCS.push(["O", { t: "npc", id, sp: spr, x, y, fx: fx || {} }]);

  N.wali = () => {
    if (F.done[EI.ent] && !F.hutanOk) {
      F.hutanOk = 1;
      SND.sfx("win");
      return dlg(
        "Wali Kota Himpunan",
        [
          "Kamu menembus Hutan Peluang dan menaklukkan Ent Tua? Kabar itu membuat seisi Balai gempar!",
          "Selama bertahun-tahun, tak seorang pun dari kami berani menebak jalan di hutan itu. Selamat datang di Kota Himpunan, Penjaga Angka.",
          "Kembalilah ke Guild dan klaim hadiahmu di Papan Quest. Sentuh Batu Teleportasi di alun-alun dulu supaya perjalananmu berikutnya lebih singkat.",
        ],
        () => {
          hud();
          idle();
          say("Kembali ke Papan Quest Guild untuk klaim hadiah 'Hutan Peluang'.");
        },
      );
    }
    if (F.hutanOk)
      return dlg("Wali Kota Himpunan", [
        "Himpunan berutang budi padamu, Penjaga. Hutan itu kini lebih tenang berkatmu.",
        "Dewan kami masih menafsirkan petunjuk menuju Jurang Tak Hingga. Jalannya belum terbuka. Datanglah lagi nanti.",
      ]);
    dlg("Wali Kota Himpunan", [
      "Selamat datang di Kota Himpunan! Kami menghitung segala sesuatu: orang, barang, bahkan kemungkinan hujan.",
      "Hutan di barat kota itu dijaga seekor Ent tua. Jalannya zig-zag dan menyesatkan.",
    ]);
  };

  /* --- gerbang timur Kota Logaritma & Padang Himpunan --- */
  gn("Penjaga Gerbang Timur", "gerbang", [335, 63], [
    "Gerbang timur ini jarang dibuka. Di baliknya Padang Himpunan, lalu Hutan Peluang.",
    "Orang bilang hutan itu mengubah jalan setiap kali kita menoleh. Bawa ramuan yang banyak!",
  ], { face: 1 });
  gn("Musafir", "pria", [343, 62], [
    "Jejak kafilah di depan menuju Hutan Peluang. Lewat celah utara dulu, lalu celah selatan.",
    "Di ujungnya ada Kota Himpunan. Katanya warganya senang menghitung apa saja.",
  ], { face: 1 });

  /* --- Hutan Peluang --- */
  gn("Penjaga Hutan Peluang", "ranger", [361, 62], [
    "Pos ini aman. Tidak ada monster yang berani mendekati batu teleportasinya.",
    "Hutan ini berliku: celah utara, lalu celah selatan, baru lurus ke punggung bukit terakhir. Di sana Ent Tua menunggu.",
    wk2(EI.shroom),
  ], { face: -1 });
  gn("Pemanah Hutan", "pmanah", [360, 66], [
    "Burung hantu di sini aneh. Dia seperti menghitung langkahku dari atas dahan.",
    wk2(EI.owl),
  ], { face: 1 });
  gn("Nelayan Hutan", "nelayan", [381, 63], [
    "Kolam ini tersembunyi, ikannya jinak. Cuma sesekali jamur besar lewat dan mengagetkan.",
  ], { act: "fish", face: 1 });
  gn("Pertapa Hutan", "kakek2", [399, 61], [
    "Ent itu bukan jahat. Dia hanya menjaga hutan dari yang datang tanpa persiapan.",
    "Beristirahatlah di kristal itu sebelum menantangnya. Dia menguji semua jenis soal, dan lemah terhadap persen.",
  ], { face: 1 });

  /* --- Kota Himpunan (offset 428,44) --- */
  gn("Penjaga Gerbang", "gerbang", pc(1, 15), [
    "Selamat datang di Kota Himpunan! Kamu pasti menembus Hutan Peluang. Tidak banyak yang berhasil.",
    "Sentuh Batu Teleportasi di alun-alun supaya lain kali kamu bisa langsung ke sini.",
  ], { face: 1 });
  cs("wali", "pejabat", pc(24, 10), { face: 1 });
  cs("dagang", "dagang", pc(16, 15), { face: 1 });
  cs("tabib", "tabib", pc(31, 13), { face: -1 });
  gn("Ksatria Patroli", "ksatria", pc(19, 13), [
    "Patroli kota! Alun-alun ini kujaga sampai pagi.",
  ], { pace: [...pc(19, 13), ...pc(19, 20)] });
  gn("Prajurit Patroli", "prajurit", pc(30, 15), [
    "Tidak ada keributan di sekitar Balai Himpunan, ya!",
  ], { pace: [...pc(30, 15), ...pc(30, 20)] });
  gn("Penjaga Balai", "ksatria", pc(23, 9), [
    "Wali Kota menerima tamu dari Guild kapan saja. Silakan, Penjaga Angka.",
  ], { face: 1 });
  gn("Penjaga Balai", "prajurit", pc(26, 9), [
    "Himpunan itu kumpulan hal yang berbeda tapi bersatu. Itu semboyan kami.",
  ], { face: -1 });
  gn("Pembaca Buku", "pembaca", pc(14, 19), [
    "Ssst... aku sedang membaca soal irisan dan gabungan himpunan. Seru, lho!",
  ], { act: "read", face: -1 });
  gn("Tukang Kebun Kota", "tukangkebun", pc(13, 13), [
    "Pohon-pohon di taman ini kutanam dari bibit Hutan Peluang. Tumbuhnya acak, tapi selalu cantik.",
  ], { act: "water", face: 1 });
  gn("Nelayan Kolam", "nelayan", pc(38, 13), [
    "Ikan di kolam ini ada yang bergaris, ada yang berbintik. Aku sedang mengelompokkannya.",
  ], { act: "fish", face: 1 });
  gn("Pemain Seruling", "musisi", pc(28, 20), [
    "Lagu ini kudengar dari burung di hutan. Nadanya tidak pernah sama dua kali.",
  ], { act: "music", face: -1 });
  gn("Anak Kota", "bocah", pc(27, 22), [
    "Kakak lewat hutan itu? Aku belum pernah. Kata Ibu, nanti tersesat.",
  ], { wander: 3, face: 1 });
  gn("Bangsawati", "wanita", pc(20, 22), [
    "Pasar kota hari ini ramai sekali. Aku menghitung ada tiga puluh tujuh kios!",
  ], { act: "talk", face: 1, ph: 0 });
  gn("Bangsawan", "pria2", pc(21, 22), [
    "Aku hitung tiga puluh enam. Satu kios itu cuma bayangan.",
  ], { act: "talk", face: -1, ph: 1 });
  gn("Pandai Besi Kota", "pandai", pc(8, 18), [
    "Tang! Tang! Aku menempa pedang dari kayu akar hutan. Ringan tapi keras.",
  ], { act: "hammer", face: 1 });
  gn("Tukang Sapu", "tukangsapu", pc(14, 24), [
    "Daun dari Hutan Peluang terbawa angin sampai ke sini. Kusapu, datang lagi.",
  ], { act: "sweep", face: 1 });
  gn("Vega (Penyihir Rank SS)", "pmage", pc(30, 22), [
    "Kami menyisir hutan itu tiga hari. Jamur besar di sana pandai bermain angka.",
    wk2(EI.shroom),
  ], { act: "talk", face: 1, ph: 0 });
  gn("Orion (Pendekar Rank SS)", "pdekar", pc(31, 22), [
    "Ent Tua itu tidak bisa dikalahkan dengan kekuatan saja. Kamu harus lebih cepat berhitung.",
    wk2(EI.ent),
  ], { act: "talk", face: -1, ph: 1 });
  gn("Veteran Hasta (Rank SS)", "pveteran", pc(37, 19), [
    "Aku pernah melihat ujung peta. Ada jurang yang tidak kelihatan dasarnya.",
    "Simpan game di penginapan sebelum menantang yang besar-besar!",
  ], {}, { gift: "fpot" });
})();
