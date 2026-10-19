/* ===== Numeria Quest — Benua Iblis: Jurang Tak Hingga, Dataran Neraka, Kastil Raja Iblis =====
   Dimuat setelah east.js dan SEBELUM town.js (town.js yang menaruh warga lewat OCEAN_NPCS).
   Jalur: Kota Himpunan -> gerbang timur (dijaga, dibuka setelah Hutan Peluang selesai) -> Pos Jurang
          -> jembatan sempit di atas lava (dijaga Gargoyle) -> Dataran Neraka (zig-zag, 3 punggung bukit)
          -> gerbang Kastil (dijaga Ksatria Iblis) -> aula takhta: Raja Iblis Tak Hingga.
   Dunia dilebarkan 160 petak ke timur. Wilayah: B Jurang, Q Dataran Neraka, Z Kastil.
   Semua koordinat di berkas ini ditulis relatif terhadap tepi timur Kota Himpunan (x=478); SH menggeser ke posisi sebenarnya. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const SH = MP.O.w - 480, // pergeseran ke timur bila ada wilayah lain (Dataran Salju) disisipkan sebelum Benua Iblis
    WW = 640 + SH, // lebar dunia baru
    X0 = 478, // kolom pertama Benua Iblis (lorong di luar gerbang timur Kota Himpunan)
    BX0 = 488, // jurang lava: kolom pertama..terakhir; jembatan di baris BY
    BX1 = 495,
    BY = 60,
    QX = 504, // Dataran Neraka mulai di kolom ini
    CAX = 596, // Kastil Raja Iblis: pojok kiri-atas dan ukurannya
    CAY = 40,
    CAW = 42,
    CAH = 41,
    WILD_B = 0.3, // peluang monster muncul tiap WILD_STEPS langkah
    WILD_Q = 0.4,
    WILD_Z = 0.45;

  /* ---------- nama wilayah, tema warna, perlengkapan ---------- */
  Object.assign(MN, { B: "Jurang Tak Hingga", Q: "Dataran Neraka", Z: "Kastil Raja Iblis" });
  Object.assign(TH, {
    q: { a: "#4a2a32", b: "#43262d", w: "#9a2208", w2: "#ff7a22", t: "#3a1a24", t2: "#7a2a3a" },
    u: { a: "#2a1a3a", b: "#251634", w: "#9a2208", w2: "#ff7a22", t: "#3a1a24", t2: "#7a2a3a" },
  });
  EQ.demonblade = { n: "Pedang Penumpas Iblis", s: "w", atk: 14, fist: "#ff9a5a", sw: "#ffd0a0" };

  /* ---------- sprite monster (16x16; versi battle 32x32 dibuat otomatis) ---------- */
  const IMP = [
    "................", "..K..........K..", ".KRK........KRK.", ".KRRKKKKKKKKRRK.",
    "..KRRRRRRRRRRK..", ".KRRYKRRRRKYRRK.", ".KRRRRRRRRRRRRK.", "..KRRWRRRRWRRK..",
    "...KRRWWWWRRK...", "..KKrRRRRRRrKK..", ".KRKKrRRRRrKKRK.", "KRRK.KRrrRK.KRRK",
    "KKK..KRRRRK..KKK", "....KRRKKRRK....", "...KRRK..KRRK...", "...KKK....KKK...",
  ];
  const DEM = [
    "..H..........H..", "..HH........HH..", "..KHKKKKKKKKHK..", "..KPPPPPPPPPPK..",
    ".KPPPPPPPPPPPPK.", ".KPYYKPPPPKYYPK.", ".KPPPPPPPPPPPPK.", "..KPPWKWWKWWPK..",
    "...KPPPPPPPPK...", ".KKPPpRRRRpPPKK.", "KPPKPpRRRRpPKPPK", "KPPKPPpRRpPPKPPK",
    ".KKKPPPPPPPPKKK.", "...KPPKKKKPPK...", "..KPPK....KPPK..", "..KKKK....KKKK..",
  ];
  const x2 = (m) =>
      m.flatMap((r) => {
        const d = [...r].map((c) => c + c).join("");
        return [d, d];
      }),
    addSp = (k, p, m, big) => {
      big = big || x2(m);
      SP[k] = { p, m, a: [m, m] };
      SP[k + "L"] = { p, m: big, a: [big, big] };
    },
    dp = (P, p, H, Y, R) => ({ K: "#14081c", P, p, H, Y, W: "#ffffff", R });
  addSp("imp", { K: "#240a14", R: "#d2284d", r: "#8a1530", Y: "#ffe14d", W: "#ffffff" }, IMP);
  addSp(
    "hound",
    { K: "#1a0810", G: "#8a1c1c", g: "#e0502f", D: "#4a0e12", W: "#ffffff", R: "#ffb02e", Y: "#ffe14d" },
    SP.wolf.m,
    SP.wolfL.m,
  ); // serigala diwarnai ulang jadi anjing neraka
  addSp("demon", dp("#7a2a8a", "#4e1a5e", "#f4ecd0", "#ffe14d", "#ff7a22"), DEM);
  addSp("gargoyle", dp("#7c8296", "#545a6e", "#c8ccd8", "#ff4040", "#aab0c4"), DEM);
  addSp("dknight", dp("#2f3f7a", "#1f2a58", "#e2b84a", "#7cf0ff", "#e2b84a"), DEM);
  addSp("dking", dp("#c9a050", "#8a6a20", "#ff4040", "#ff4040", "#d2284d"), DEM);

  /* ---------- monster (indeks E dihitung otomatis) ---------- */
  const ALL = ["arit", "pecahan", "persen", "geom", "alj"],
    EI = {},
    mon = (key, o) => {
      EI[key] = E.length;
      E.push({ sp: key, d: [4, 5], s: 4, ...o });
    };
  mon("imp", {
    n: "Imp Faktorial", hp: 240, atk: 23, topics: ["arit", "alj"], weak: "alj", xp: 78, coin: 58,
    bg: ["#2a0a14", "#7a1a28", "#200810", "#ffb27a"],
    intro: "Imp kecil bertanduk menyeringai. Ekornya membentuk tanda seru, faktorial yang tidak pernah selesai!",
    win: "Imp itu meletup jadi asap dan menghilang.",
  });
  mon("hound", {
    n: "Anjing Neraka Sigma", hp: 270, atk: 25, topics: ["persen", "geom"], weak: "geom", xp: 86, coin: 64,
    bg: ["#2a0e08", "#8a2a14", "#200a06", "#ffc27a"],
    intro: "Anjing berbulu bara menggeram. Setiap jejak kakinya menjumlahkan api!",
    win: "Anjing itu melolong, lalu lenyap dalam kobaran api.",
  });
  mon("demon", {
    n: "Iblis Tanduk Kuadrat", hp: 320, atk: 27, topics: ["pecahan", "alj", "geom"], weak: "pecahan", xp: 100, coin: 76,
    bg: ["#240a2e", "#6a1a7a", "#1a0822", "#ffc8ff"],
    intro: "Iblis bertanduk dua melangkah maju. Tanduknya dikuadratkan tiap kali ia marah!",
    win: "Iblis itu terbakar oleh angka-angka yang kamu jawab dengan benar.",
  });
  mon("gargoyle", {
    n: "Gargoyle Jembatan Jurang", hp: 480, atk: 30, topics: ALL, weak: "geom", xp: 240, coin: 320,
    bg: ["#14141e", "#4a4a6a", "#0c0c16", "#ffd2a0"],
    intro: "Patung batu di jembatan membuka matanya! Gargoyle menutup satu-satunya jalan di atas lava. Tidak ada jalan mundur!",
    win: "Gargoyle itu retak dan runtuh ke lava. Jalan ke Dataran Neraka terbuka.",
  });
  mon("dknight", {
    n: "Ksatria Iblis Nol Mutlak", hp: 600, atk: 33, topics: ALL, weak: "pecahan", xp: 320, coin: 420,
    bg: ["#10142e", "#2f3f7a", "#0a0e22", "#9ae8ff"],
    intro: "Ksatria berzirah biru berdiri di gerbang kastil. \"Tidak ada yang melewati Nol Mutlak,\" katanya dingin.",
    win: "Zirah Ksatria itu berdentang jatuh. Gerbang kastil terbuka.",
  });
  mon("dking", {
    n: "Raja Iblis Tak Hingga", hp: 880, atk: 38, topics: ALL, weak: "alj", xp: 600, coin: 900,
    bg: ["#2a0808", "#8a1c1c", "#1c0505", "#ffd166"],
    intro: "Takhta bergemuruh. Raja Iblis Tak Hingga bangkit, mahkotanya menyala. \"Aku tidak punya batas. Kamu punya berapa soal?\"",
    win: "Raja Iblis itu menyusut menjadi satu titik cahaya, lalu padam. Benua Iblis menjadi hening.",
  });

  /* ---------- musik ---------- */
  {
    const T = SND.tracks,
      seq = (s, d = 1) =>
        s.trim().split(/\s+/).map((t) => {
          const [n, b] = t.split(":");
          return [n === "-" ? null : n, b ? +b : d];
        });
    T.B = {
      bpm: 70,
      v: [
        { w: "triangle", g: 0.09, n: seq("A4:2 C5:1 E5:1 D5:2 B4:1 A4:1 G#4:2 B4:2 A4:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("A1:4 F1:4 E1:4 E1:4") },
        { w: "square", g: 0.02, n: seq("E3:4 C3:4 B2:4 B2:4") },
      ],
    };
    T.Q = {
      bpm: 96,
      v: [
        { w: "square", g: 0.05, n: seq("A4:.5 A4:.5 C5:.5 A4:.5 E5:1 D5:.5 C5:.5 B4:1 G#4:1 A4:.5 C5:.5 E5:.5 A5:.5 G5:1 E5:1 F5:2") },
        { w: "triangle", g: 0.12, n: seq("A2:1 A2:1 F2:1 E2:1 A2:1 A2:1 D2:1 E2:1") },
        { w: "square", g: 0.02, n: seq("A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 E3 G#3 B3 G#3", 0.5) },
      ],
    };
    T.Z = T.boss || T.dungeon || T.Q;
  }

  /* ===================== MEMBANGUN DUNIA (480x123 -> 640x123) ===================== */
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
    })(20261017),
    inb = (x, y) => x > 0 && y > 0 && x < WW - 1 && y < WH - 1, // koordinat dunia sebenarnya
    set = (x, y, c, th) => {
      x += SH;
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
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) {
              const X = x + ii + SH,
                Y = y + j;
              if (inb(X, Y) && g[Y][X] === "T") g[Y][X] = ".";
            }
          if (mid && inb(x + SH, y) && g[y][x + SH] === ".") g[y][x + SH] = mid;
        }
      }
    },
    clr = (cx, cy, r) => {
      cx += SH;
      for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++)
          if (inb(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r && g[y][x] === "T") g[y][x] = ".";
    },
    ridge = (x0, x1, g0, g1) => {
      for (let y = 1; y < WH - 1; y++) if (y < g0 || y > g1) rect(x0, y, x1 - x0 + 1, 1, "M", "q");
    };

  // (1) perluas peta: buang tembok timur lama (x=479), isi 479..639
  for (let y = 0; y < WH; y++) {
    const edge = y === 0 || y === WH - 1;
    g[y].length = bm[y].length = edge ? O.w : O.w - 1;
    for (let x = g[y].length; x < WW; x++) {
      let c;
      if (edge || x === WW - 1) c = "#";
      else if (y <= 20 || y >= 100) c = "M";
      else c = rnd() < 0.1 ? "T" : ".";
      g[y].push(c);
      bm[y].push("q");
    }
  }

  // (2) gerbang timur Kota Himpunan (tembok x=477, baris jalan y=60..61)
  g[60][477] = g[61][477] = "r";
  bm[60][477] = bm[61][477] = "z";

  // (3) jurang lava + jembatan satu petak (dijaga Gargoyle), tiga punggung bukit zig-zag
  rect(BX0, 21, BX1 - BX0 + 1, 79, "w", "q");
  rect(BX0, BY, BX1 - BX0 + 1, 1, ",", "q");
  ridge(520, 521, 28, 32); // celah utara
  ridge(540, 541, 88, 92); // celah selatan
  ridge(560, 561, 58, 62); // celah tengah

  // (4) Pos Jurang (zona aman), pos Dataran Neraka, pos sebelum Kastil, kolam lava
  rect(479, 44, 9, 25, ".", "q");
  rect(480, 47, 6, 3, "B", "q"); // penginapan
  set(483, 49, "E", "q");
  clr(554, 64, 4);
  clr(588, 62, 3);
  [[514, 45, 4, 3], [532, 62, 5, 3], [552, 75, 4, 3], [572, 40, 5, 3], [506, 70, 3, 3]].forEach(([a, b, w, h]) =>
    rect(a, b, w, h, "w", "q"),
  );
  carve([[478, 60], [486, 60]], 1, ",");
  carve([[496, 60], [512, 60], [512, 30], [530, 30], [530, 90], [550, 90], [550, 60], [570, 60], [595, 60]], 1, ",");

  // (5) Kastil Raja Iblis: x 596..637, y 40..80; gerbang barat di y=60, aula takhta di balik dinding dalam x=620
  const lr = (x, y, w, h, c, t = "u") => rect(CAX + x, CAY + y, w, h, c, t),
    pc = (lx, ly) => [CAX + lx, CAY + ly];
  lr(0, 0, CAW, CAH, ".");
  lr(0, 0, CAW, 1, "M");
  lr(0, CAH - 1, CAW, 1, "M");
  lr(0, 0, 1, CAH, "M");
  lr(CAW - 1, 0, 1, CAH, "M");
  lr(0, 20, 1, 1, "."); // gerbang
  lr(24, 1, 1, CAH - 2, "M"); // dinding aula takhta
  lr(24, 20, 1, 1, ".");
  lr(14, 10, 3, 2, "w");
  lr(14, 29, 3, 2, "w");

  /* ===================== ENTITAS ===================== */
  const put = (e) => {
    e.x += SH; // koordinat lokal -> dunia
    if ("TCRPM".includes(g[e.y][e.x])) g[e.y][e.x] = ".";
    EN.O.push(e);
    return e;
  };
  const targets = [], // titik yang harus bisa dicapai dengan berjalan kaki
    add = (e) => {
      put(e);
      targets.push([e.x, e.y]); // sesudah put: sudah koordinat dunia
      return e;
    };
  [
    { t: "tele", wp: "B", x: 483, y: 56 },
    { t: "crystal", x: 485, y: 63 },
    { t: "tele", wp: "Q", x: 554, y: 62 },
    { t: "crystal", x: 554, y: 66 },
    { t: "crystal", x: 588, y: 63 }, // sebelum gerbang kastil
    { t: "crystal", x: pc(16, 22)[0], y: pc(16, 22)[1] },
    { t: "crystal", x: pc(27, 23)[0], y: pc(27, 23)[1] }, // di depan aula takhta
    // peti: seberang jembatan, dataran (berurutan dari barat ke timur), kastil
    { t: "chest", id: "i1", x: 498, y: 34, coin: 220, po: 1 },
    { t: "chest", id: "i2", x: 498, y: 88, coin: 220, fp: 1 },
    { t: "chest", id: "i3", x: 508, y: 40, coin: 230, po: 1 },
    { t: "chest", id: "i4", x: 508, y: 80, coin: 230, sc: 1 },
    { t: "chest", id: "i5", x: 526, y: 45, coin: 240, fp: 1 },
    { t: "chest", id: "i6", x: 528, y: 80, coin: 240, po: 1 },
    { t: "chest", id: "i7", x: 536, y: 56, coin: 250, po: 1, sc: 1 },
    { t: "chest", id: "i8", x: 536, y: 96, coin: 250, fp: 1 },
    { t: "chest", id: "i9", x: 546, y: 34, coin: 260, po: 1 },
    { t: "chest", id: "i10", x: 556, y: 84, coin: 260, sc: 1 },
    { t: "chest", id: "i11", x: 566, y: 30, coin: 270, fp: 1 },
    { t: "chest", id: "i12", x: 570, y: 92, coin: 270, po: 1 },
    { t: "chest", id: "i13", x: 584, y: 48, coin: 280, sc: 1 },
    { t: "chest", id: "i14", x: 588, y: 76, coin: 280, po: 1, fp: 1 },
    ...[[4, 4], [4, 36], [20, 4], [20, 36], [30, 6], [38, 34]].map(([a, b], i) => ({
      t: "chest", id: "k" + (i + 1), x: pc(a, b)[0], y: pc(a, b)[1], coin: 300 + i * 20, po: i % 2 ? 0 : 1, fp: i % 2, sc: i > 3 ? 1 : 0,
    })),
  ].forEach((e) => {
    if (e.t === "chest") clr(e.x, e.y, 1);
    add(e);
  });
  // penjaga: Gargoyle di jembatan, Ksatria Iblis di gerbang kastil, Raja Iblis di aula takhta
  put({ t: "foe", i: EI.gargoyle, x: 491, y: BY, sp: "gargoyle" });
  put({ t: "foe", i: EI.dknight, x: CAX + 1, y: 60, sp: "dknight" });
  put({ t: "foe", i: EI.dking, x: pc(34, 20)[0], y: 60, sp: "dking" });
  // penginapan Pos Jurang (memakai interior "J" milik town.js)
  EN.O.push({
    t: "portal", x: 483 + SH, y: 49, to: "J", tx: 9, ty: 8, f: [0, -1],
    inn: [483 + SH, 50], innName: "Penginapan Pos Jurang", sign: 1,
  });
  TELES.push(...EN.O.filter((e) => e.t === "tele" && ["B", "Q"].includes(e.wp)));
  WP.push({ id: "B", n: "Pos Jurang Tak Hingga" }, { id: "Q", n: "Pos Dataran Neraka" });

  // pastikan semua titik penting bisa dicapai: kalau terkurung pohon, buka jalan kecil ke wilayah yang terjangkau
  {
    const BLOCK = "#TwBDLfSEMCRPQUZHemGlk",
      HARD = "#MQwBEDLfSZUHCRPelkG", // penghalang yang tidak boleh ditembus jalan kecil (pohon boleh dibuka)
      D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      free = (x, y) => inb(x, y) && !BLOCK.includes(g[y][x]),
      flood = () => {
        const seen = new Uint8Array(WW * WH),
          st = [[479 + SH, 60]];
        seen[60 * WW + 479 + SH] = 1;
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
      },
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
    let seen = flood();
    const near = ([x, y]) => D4.some(([dx, dy]) => seen[(y + dy) * WW + (x + dx)]);
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
          carve(route.map(([x, y]) => [x - SH, y]), 0, null);
          break;
        }
      }
      seen = flood();
      if (!near(t)) console.warn("Titik Benua Iblis belum terjangkau:", t);
    });
  }

  // selesai: tulis kembali ke peta dunia
  O.w = WW;
  O.g = g.map((r) => r.join(""));
  delete O.mc;

  /* ===================== PERILAKU ===================== */
  {
    const _reg = reg;
    reg = function (x, y) {
      if (x < X0 + SH) return _reg(x, y);
      x -= SH;
      if (x >= CAX && x < CAX + CAW && y >= CAY && y < CAY + CAH) return "Z";
      return x < QX ? "B" : "Q";
    };
    const _wild = wild;
    wild = function (x, y) {
      if (x < X0 + SH) return _wild(x, y);
      if (TELES.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 7)) return null;
      if (x - SH <= 487 || (x - SH >= BX0 && x - SH <= BX1)) return null; // pos & jembatan aman (penjaga yang menghadang)
      const z = reg(x, y);
      if (z === "B") return { pool: [EI.imp], p: WILD_B };
      if (z === "Q") return { pool: [EI.imp, EI.hound, EI.demon], p: WILD_Q };
      return { pool: [EI.hound, EI.demon], p: WILD_Z };
    };
    // dekorasi: bara beterbangan di tanah iblis, lantai kastil berubin
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th !== "q" && th !== "u") return _bd(th, X, Y, x, y);
      if (th === "u") {
        ctx.fillStyle = "rgba(0,0,0,.1)";
        ctx.fillRect(X, Y + 15, 16, 1);
        ctx.fillRect(X + 15, Y, 1, 16);
      }
      if ((x * 7 + y * 11) % 17 === 0) {
        ctx.globalAlpha = rm ? 0.7 : 0.35 + 0.35 * Math.sin(performance.now() / 420 + x * 3 + y);
        ctx.fillStyle = "#ff9a3a";
        ctx.fillRect(X + 4 + ((x * 3) % 7), Y + 5 + ((y * 5) % 6), 2, 2);
        ctx.globalAlpha = 1;
      }
    };
    // peta mini: lava, jalan, tanah iblis
    const _m2 = mini2;
    mini2 = function (id) {
      if (id !== "O") return _m2(id);
      const m = MP.O;
      if (m.mc) return m.mc;
      const c = _m2(id),
        k = c.getContext("2d"),
        COL = { w: "#ff5a1a", ",": "#8a5a4a", M: "#4a2f3f", T: "#2a1018" };
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (x < X0 + SH) return;
          const t = m.bm[y][x],
            col = COL[ch] || (ch === "." ? (t === "u" ? "#2a1a3a" : "#4a2a32") : null);
          if (col) {
            k.fillStyle = col;
            k.fillRect(x, y, 1, 1);
          }
        }),
      );
      return c;
    };
  }

  /* ===================== QUEST ===================== */
  QS.push({
    id: "iblis",
    n: "Benua Iblis",
    d: "Minta izin di gerbang timur Kota Himpunan, lintasi Dataran Salju, seberangi Jurang Tak Hingga, tembus Dataran Neraka, lalu kalahkan Raja Iblis Tak Hingga di kastilnya.",
    gp: 260,
    coin: 1200,
    it: "demonblade",
    on: () => !!F.hutanOk,
    chk: () => F.iblisOk,
    pr: () =>
      F.done[EI.dking]
        ? "Bicara dengan Peri di aula takhta"
        : F.jurangOpen
          ? "Kalahkan Raja Iblis di Kastil, ujung timur Benua Iblis"
          : "Minta izin Penjaga Gerbang Timur di Kota Himpunan",
  });

  /* ===================== NPC & DIALOG ===================== */
  const wk2 = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`,
    gn = (who, sp, [x, y], lines, fx, more) =>
      OCEAN_NPCS.push(["O", { t: "npc", id: "gen", d: [who, lines], sp, x: x + SH, y, fx: fx || {}, ...more }]),
    cs = (id, spr, [x, y], fx) => OCEAN_NPCS.push(["O", { t: "npc", id, sp: spr, x: x + SH, y, fx: fx || {} }]);

  // Wali Kota Himpunan memberi petunjuk setelah Hutan Peluang selesai
  {
    const _w = N.wali;
    N.wali = () =>
      F.hutanOk
        ? dlg(
            "Wali Kota Himpunan",
            [
              "Dewan akhirnya menafsirkan petunjuknya: Jurang Tak Hingga ada di balik gerbang timur kota ini. Di seberangnya terbentang Benua Iblis.",
              "Penjaga gerbang akan membukakan jalan untukmu. Berhati-hatilah, Penjaga Angka.",
            ],
            () => idle(),
          )
        : _w();
  }

  // dua penjaga menutup lorong gerbang timur sampai Hutan Peluang selesai
  N.jgate = () => {
    if (!F.hutanOk)
      return dlg("Penjaga Gerbang Timur", [
        "Di balik gerbang ini ada dataran salju, lalu Jurang Tak Hingga dan Benua Iblis. Tidak ada yang lewat tanpa izin Wali Kota.",
        "Selesaikan dulu urusanmu di Hutan Peluang, lalu temui Wali Kota.",
      ]);
    F.jurangOpen = 1;
    SND.sfx("quest");
    dlg(
      "Penjaga Gerbang Timur",
      [
        "Kamu menaklukkan Ent Tua dan Wali Kota sudah memberi izin. Gerbang timur kami buka!",
        "Lewati dataran salju dan Raksasa Es di ujungnya, lalu seberangi jembatan di Jurang Tak Hingga. Di sana ada Gargoyle yang menutup jalan. Dia lemah terhadap Geometri.",
      ],
      () => {
        hud();
        idle();
        say("Gerbang timur terbuka! Benua Iblis menunggu di seberang jurang.");
      },
    );
  };
  [60, 61].forEach((y) =>
    OCEAN_NPCS.push(["O", { t: "npc", id: "jgate", sp: "gerbang", x: X0, y, fx: { face: -1 }, on: () => !F.jurangOpen }]),
  );

  // Peri di aula takhta: penutup perjalanan
  N.peri = () => {
    if (!F.iblisOk) {
      F.iblisOk = 1;
      SND.sfx("win");
      return dlg(
        "Peri Cahaya",
        [
          "Kamu mengalahkan Raja Iblis Tak Hingga! Sudah ratusan tahun angka-angka di benua ini terkurung di mahkotanya.",
          "Lihat, cahaya mulai kembali ke tanah ini. Terima kasih, Penjaga Angka.",
          "Kembalilah ke Guild dan klaim hadiahmu di Papan Quest. Benua ini kini aman untuk dijelajahi.",
        ],
        () => {
          hud();
          idle();
          say("Kembali ke Papan Quest Guild untuk klaim hadiah 'Benua Iblis'.");
        },
      );
    }
    dlg("Peri Cahaya", ["Tanah ini perlahan pulih berkatmu. Angka-angka di sini kembali bernyanyi."]);
  };
  OCEAN_NPCS.push(["O", { t: "npc", id: "peri", sp: "putri", x: pc(38, 20)[0] + SH, y: 60, fx: { face: -1 }, on: () => !!F.done[EI.dking] }]);

  /* --- Pos Jurang --- */
  gn("Penjaga Pos Jurang", "ksatria", [481, 57], [
    "Pos ini aman. Tidak ada iblis yang berani mendekati batu teleportasinya.",
    "Jembatan di timur hanya satu petak lebarnya, dan Gargoyle menjaganya. " + wk2(EI.gargoyle),
  ], { face: 1 });
  gn("Pengungsi", "wanita", [485, 55], [
    "Dulu benua di seberang itu hijau. Lalu Raja Iblis mencuri angka-angkanya dan semuanya jadi gersang.",
    "Kalau kamu lewat, hati-hati dengan anjing neraka. Gigitannya penuh persen!",
  ], { face: 1 });
  cs("dagang", "dagang", [486, 59], { face: -1 });
  cs("tabib", "tabib", [481, 62], { face: 1 });

  /* --- Dataran Neraka --- */
  gn("Pertapa Insaf", "kakek2", [556, 63], [
    "Aku dulu iblis, tapi bosan membakar segalanya. Sekarang aku menjaga pos ini.",
    wk2(EI.imp),
    wk2(EI.hound),
    wk2(EI.demon),
  ], { face: -1 });
  gn("Veteran Hasta (Rank SS)", "pveteran", [591, 61], [
    "Itu gerbang kastil. Ksatria Iblis di baliknya tidak bisa dikalahkan dengan kekuatan saja. " + wk2(EI.dknight),
    "Isi penuh HP dan Manamu di kristal sebelum masuk. Setelah itu tidak ada tempat untuk mundur.",
  ], { face: 1 });

  /* --- Kastil Raja Iblis --- */
  gn("Prajurit Iblis Pembelot", "prajurit", pc(26, 19), [
    "Aula di belakangku adalah takhta Raja Iblis. Dia lemah terhadap Aljabar, tapi soalnya paling sulit se-benua.",
    wk2(EI.dking),
  ], { face: -1 });
})();
