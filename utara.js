/* ===== Numeria Quest — Wilayah Utara: Hutan Elf, Pegunungan Naga, Hutan Beast =====
   Dimuat PALING AKHIR (setelah guildquest.js). Tidak mengubah file lain.
   Cara kerja singkat:
   - Tiga wilayah ini adalah peta BESAR terpisah (seperti Rumah Guild, tapi seluas hutan).
   - Pintu masuknya: gerbang di TEMBOK ATAS dunia, dekat Desa Sunyi (lihat GATE di bawah).
   - Jalur: Gerbang Utara -> Hutan Elf (hub)
                                |-- gerbang utara  -> Pegunungan Naga (bos: Naga Emas)
                                |-- gerbang timur  -> Hutan Beast (desa manusia binatang, bos: Fenrix)
   - Monster muncul acak saat berjalan (tiap STEPS langkah), kecuali di desa/pos aman. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const MIN_RANK = 2, // rank guild minimal untuk membuka gerbang (0=E, 1=D, 2=C, 3=B, ...)
    GATE = [64, 0], // posisi gerbang di tembok atas dunia (tembok y=0, dekat Desa Sunyi)
    STEPS = 16; // tiap sekian langkah, game "melempar dadu" untuk memunculkan monster

  /* ---------- nama wilayah & tema warna ---------- */
  Object.assign(MN, {
    NE: "Hutan Elf Silvara",
    NG: "Pegunungan Naga Drakonis",
    NB: "Hutan Beast Ferala",
  });
  // a/b = warna lantai (kotak-kotak), w/w2 = tembok tepi, t/t2 = pohon
  Object.assign(TH, {
    e: {
      a: "#2f7a52",
      b: "#2b7049",
      w: "#10301f",
      w2: "#1c4a30",
      t: "#1f8a5a",
      t2: "#9af0c0",
    },
    j: {
      a: "#7a6a62",
      b: "#72625a",
      w: "#2a2024",
      w2: "#463438",
      t: "#5a4a3a",
      t2: "#a89070",
    },
    b: {
      a: "#4a6a34",
      b: "#456230",
      w: "#1a2a12",
      w2: "#2c4220",
      t: "#3a6a28",
      t2: "#8acc5a",
    },
  });

  /* ---------- sprite monster ---------- */
  const x2 = (m) =>
    m.flatMap((r) => {
      const d = [...r].map((c) => c + c).join("");
      return [d, d];
    });
  // sprite baru dari gambar sendiri (versi besar dibuat otomatis)
  const addSp = (k, p, m) => {
    const big = x2(m);
    SP[k] = { p, m, a: [m, m] };
    SP[k + "L"] = { p, m: big, a: [big, big] };
  };
  // pakai ulang gambar lama dengan warna baru (animasi ikut)
  const recolor = (k, base, pal) => {
    [
      ["", 0],
      ["L", 1],
    ].forEach(([s]) => {
      const b = SP[base + s];
      SP[k + s] = { p: { ...b.p, ...pal }, m: b.m, a: b.a };
    });
  };
  addSp(
    "pixie",
    {
      K: "#1a2a1a",
      G: "#7ee08a",
      S: "#f8e0c8",
      M: "#d2284d",
      P: "#b46ae0",
      W: "#e8f8ff",
    },
    [
      "................",
      "....KKKKKKKK....",
      "...KGGGGGGGGK...",
      "..KGGSSSSSSGGK..",
      "..KGSSKSSKSSGK..",
      "..KGSSSSSSSSGK..",
      "...KKSSMMSSKK...",
      ".KK..KPPPPK..KK.",
      "KWWK.KPPPPK.KWWK",
      "KWWWKKPPPPKKWWWK",
      "KWWWK.KPPK.KWWWK",
      ".KWWK.KPPK.KWWK.",
      "..KK..KKKK..KK..",
      "................",
      "................",
      "................",
    ],
  );
  recolor("spiritfox", "fox", { K: "#1a1c3a", O: "#cfe0ff", P: "#8ad0ff" });
  recolor("lightowl", "owl", {
    B: "#d8c060",
    b: "#a89030",
    W: "#fffbe0",
    Y: "#7cf0ff",
  });
  recolor("glowshroom", "shroom", { R: "#8a4ad0", W: "#e8d0ff", s: "#d0f0e0" });
  recolor("entkuno", "ent", {
    G: "#6a3aa0",
    g: "#b88af0",
    B: "#4a3a2a",
    b: "#2a2018",
    Y: "#7cf0c8",
  });
  recolor("forestwolf", "wolf", { G: "#3a5a3a", g: "#6a9a5a", D: "#223a22" });
  recolor("tiger", "fox", { K: "#2a1408", O: "#e8892a", P: "#ffd9a0" });
  recolor("bear", "yeti", { K: "#1a1008", W: "#8a5a30", b: "#5e3a1c" });
  recolor("fenrix", "wolf", {
    G: "#e8e0c8",
    g: "#fff8e0",
    D: "#b8a070",
    Y: "#ff4040",
  });
  recolor("wyvern", "dragon", { P: "#2f7a4a", D: "#1a4a2a" });
  recolor("lavagolem", "golem", { S: "#b8502a", D: "#6a2410", Y: "#ffb02e" });
  recolor("stormeagle", "owl", {
    B: "#5a6ab8",
    b: "#3a4488",
    W: "#e8f0ff",
    Y: "#ffe14d",
  });
  recolor("gargoyle2", "gargoyle", {
    P: "#a8523a",
    p: "#6a2e22",
    H: "#e8b090",
    Y: "#ffd24d",
  });
  recolor("zerath", "dragon", {
    P: "#d8a020",
    D: "#8a5a10",
    Y: "#ff4040",
    W: "#fff8d0",
  });

  /* ---------- monster (indeks E dihitung otomatis) ---------- */
  const ALL = ["arit", "pecahan", "persen", "geom", "alj"],
    EI = {},
    mon = (key, o) => {
      EI[key] = E.length;
      E.push({ sp: key, d: [3, 5], s: 4, ...o });
    };
  const bgE = ["#143a2c", "#3a9a6a", "#0e2a20", "#d8ffe8"], // hutan elf
    bgB = ["#1c2e14", "#5a8a3a", "#121e0c", "#f0ffc0"], // hutan beast
    bgG = ["#2a1a22", "#8a4a3a", "#1a1016", "#ffd9a0"]; // pegunungan naga
  // --- Hutan Elf ---
  mon("pixie", {
    n: "Peri Pembulat Cahaya",
    hp: 230,
    atk: 21,
    topics: ["pecahan", "persen"],
    weak: "pecahan",
    xp: 78,
    coin: 60,
    bg: bgE,
    intro:
      "Seekor peri kecil berputar-putar di udara. Ia membulatkan semua angkamu jadi kacau!",
    win: "Peri itu tertawa kecil lalu menghilang di antara dedaunan.",
  });
  mon("spiritfox", {
    n: "Rubah Roh Bulan",
    hp: 250,
    atk: 22,
    topics: ["arit", "geom"],
    weak: "geom",
    xp: 84,
    coin: 64,
    bg: bgE,
    intro:
      "Rubah berbulu perak muncul dari kabut. Ekornya meninggalkan jejak sudut yang berpendar!",
    win: "Rubah roh itu melompat pergi tanpa suara.",
  });
  mon("lightowl", {
    n: "Hantu Cahaya Faktor",
    hp: 270,
    atk: 23,
    topics: ["alj", "arit"],
    weak: "alj",
    xp: 90,
    coin: 68,
    bg: bgE,
    intro:
      "Burung hantu bercahaya turun dari dahan. Matanya menghitung faktor dari semua angka!",
    win: "Burung hantu itu terbang tinggi dan hilang di balik daun.",
  });
  mon("glowshroom", {
    n: "Jamur Bercahaya Median",
    hp: 260,
    atk: 22,
    topics: ["persen", "alj"],
    weak: "persen",
    xp: 86,
    coin: 66,
    bg: bgE,
    intro:
      "Jamur ungu berpendar bergoyang. Spora cahayanya membuat angka tertukar tempat!",
    win: "Jamur itu mengkerut dan kembali jadi tanah.",
  });
  mon("entkuno", {
    n: "Ent Kuno Akar Kuadrat",
    hp: 560,
    atk: 28,
    topics: ALL,
    weak: "alj",
    d: [4, 5],
    xp: 240,
    coin: 320,
    bg: ["#0e2a20", "#6a3aa0", "#0a1c16", "#7cf0c8"],
    intro:
      "Akar-akar raksasa menutup jalan ke utara! Ent Kuno Akar Kuadrat bangkit menjaga gerbang Pegunungan Naga.",
    win: "Ent Kuno itu roboh dan akarnya menepi. Jalan ke Pegunungan Naga terbuka.",
  });
  // --- Hutan Beast ---
  mon("forestwolf", {
    n: "Serigala Taring Pengali",
    hp: 290,
    atk: 25,
    topics: ["arit", "persen"],
    weak: "arit",
    xp: 96,
    coin: 72,
    bg: bgB,
    intro:
      "Serigala hijau berbulu lebat menggeram. Taringnya mengalikan setiap luka!",
    win: "Serigala itu menyelinap kembali ke semak-semak.",
  });
  mon("tiger", {
    n: "Macan Tutul Variabel",
    hp: 310,
    atk: 26,
    topics: ["alj", "geom"],
    weak: "geom",
    xp: 102,
    coin: 76,
    bg: bgB,
    intro:
      "Macan tutul melompat dari dahan! Totol di tubuhnya adalah variabel yang terus berubah.",
    win: "Macan tutul itu mengibaskan ekor lalu menghilang.",
  });
  mon("bear", {
    n: "Beruang Hutan Rasio",
    hp: 360,
    atk: 27,
    topics: ["pecahan", "persen"],
    weak: "pecahan",
    xp: 110,
    coin: 82,
    bg: bgB,
    intro:
      "Beruang besar berdiri di dua kaki. Cakarnya membagi apa saja jadi dua bagian!",
    win: "Beruang itu mundur ke dalam gua sambil mendengus.",
  });
  mon("fenrix", {
    n: "Fenrix Alfa Pembagi",
    hp: 820,
    atk: 35,
    topics: ALL,
    weak: "pecahan",
    d: [4, 5],
    xp: 320,
    coin: 420,
    bg: ["#1c2e14", "#d8c070", "#121e0c", "#fffbe0"],
    intro:
      "Serigala putih raksasa menghadang di celah bukit. Fenrix Alfa Pembagi, penjaga altar Hutan Beast, menggeram!",
    win: "Fenrix menunduk hormat lalu menepi. Jalan menuju Altar Beast terbuka.",
  });
  // --- Pegunungan Naga ---
  mon("wyvern", {
    n: "Wyvern Muda Eksponen",
    hp: 380,
    atk: 31,
    topics: ["alj", "geom"],
    weak: "geom",
    xp: 130,
    coin: 96,
    bg: bgG,
    intro:
      "Wyvern muda menukik dari tebing! Sayapnya memangkatkan angka sampai tak terkendali.",
    win: "Wyvern itu terbang menjauh sambil mengepak marah.",
  });
  mon("lavagolem", {
    n: "Golem Magma Koefisien",
    hp: 420,
    atk: 32,
    topics: ["arit", "alj"],
    weak: "alj",
    xp: 138,
    coin: 102,
    bg: bgG,
    intro:
      "Batu-batu merah menyatu jadi golem! Tubuhnya penuh koefisien yang membara.",
    win: "Golem itu retak dan padam menjadi batu biasa.",
  });
  mon("stormeagle", {
    n: "Elang Petir Peluang",
    hp: 350,
    atk: 31,
    topics: ["persen", "pecahan"],
    weak: "persen",
    xp: 128,
    coin: 94,
    bg: bgG,
    intro:
      "Elang biru menjerit, petir menyambar di sekitarmu. Peluang selamat tipis sekali!",
    win: "Elang itu terbang ke awan dan petirnya mereda.",
  });
  ["I", "II"].forEach((n, i) =>
    mon("garg" + i, {
      sp: "gargoyle" + (i + 1), // Jalur I = gargoyle1, Jalur II = gargoyle2 (gambar di monster_utara.js)
      n: "Gargoyle Penjaga Jalur " + n,
      hp: 560,
      atk: 34,
      topics: ALL,
      weak: "geom",
      d: [4, 5],
      xp: 190,
      coin: 240,
      bg: bgG,
      intro:
        "Patung batu di tengah jalur bergerak! Gargoyle Penjaga menutup jalan ke puncak.",
      win: "Gargoyle itu hancur jadi kerikil. Jalur terbuka.",
    }),
  );
  mon("zerath", {
    n: "Naga Emas Zerath Tak Terhingga",
    hp: 1180,
    atk: 43,
    topics: ALL,
    weak: "alj",
    d: [4, 5],
    xp: 480,
    coin: 640,
    bg: ["#2a1a22", "#e8b040", "#1a1016", "#fff8d0"],
    intro:
      "Di puncak, seekor naga emas membentangkan sayap. Zerath Tak Terhingga, penguasa Pegunungan Naga, menyemburkan api!",
    win: 'Zerath jatuh dan menunduk. "Kamu layak menyandang nama Penjaga Angka," geramnya pelan.',
  });

  /* ---------- musik sintetis tiap wilayah (nada:lama) ---------- */
  {
    const seq = (s, d = 1) =>
      s
        .trim()
        .split(/\s+/)
        .map((t) => {
          const [n, b] = t.split(":");
          return [n === "-" ? null : n, b ? +b : d];
        });
    SND.tracks.NE = {
      bpm: 72,
      v: [
        {
          w: "triangle",
          g: 0.09,
          n: seq("A4:2 C5:1 E5:1 D5:2 C5:1 A4:1 G4:2 A4:2 E4:3 -:1"),
        },
        { w: "triangle", g: 0.12, n: seq("A2:4 F2:4 G2:4 E2:4") },
        {
          w: "square",
          g: 0.02,
          n: seq("E4 A4 C5 A4 D4 G4 B4 G4 C4 F4 A4 F4 B3 E4 G4 E4", 0.5),
        },
      ],
    };
    SND.tracks.NB = {
      bpm: 104,
      v: [
        {
          w: "triangle",
          g: 0.1,
          n: seq("D4:1 D4:1 F4:1 D4:1 A4:2 G4:1 F4:1 D4:2 F4:1 E4:1 D4:2 -:2"),
        },
        {
          w: "triangle",
          g: 0.13,
          n: seq("D2:2 D2:2 A2:2 A2:2 C3:2 C3:2 G2:2 G2:2"),
        },
        { w: "square", g: 0.02, n: seq("A3 D4 F4 D4 A3 C4 E4 C4", 0.5) },
      ],
    };
    SND.tracks.NG = {
      bpm: 84,
      v: [
        {
          w: "triangle",
          g: 0.1,
          n: seq("D4:2 F4:1 A4:1 D5:2 C5:1 A4:1 A#4:2 A4:2 G4:3 -:1"),
        },
        { w: "triangle", g: 0.13, n: seq("D2:4 A#2:4 G2:4 A2:4") },
        {
          w: "square",
          g: 0.025,
          n: seq("D4 A4 D5 A4 A#3 F4 A#4 F4 G3 D4 G4 D4 A3 E4 A4 E4", 0.5),
        },
      ],
    };
  }

  /* ---------- sprite warga: elf (telinga runcing) & manusia binatang (telinga + ekor) ---------- */
  // tiap model = daftar [nomor baris, isi baris 16 huruf]; huruf mengikuti palet NPC (H=rambut, K=garis, S=kulit)
  const EAR = {
    elf: [
      [4, "KSKHSSSSSSSSHKSK"],
      [5, ".KKHSESSSSESHKK."],
    ],
    elfHelm: [[5, "KSKHSESSSSESHKSK"]],
    cat: [
      [0, "...KK......KK..."],
      [1, "...KHKKKKKKKHK.."],
    ],
    wolf: [
      [0, "...K........K..."],
      [1, "...KHKKKKKKKHK.."],
    ],
    rabbit: [
      [0, "...KHK....KHK..."],
      [1, "...KHKKKKKKKHK.."],
    ],
  };
  function race(sp, ear, tail) {
    const m = sp.m.map((r) => r.split(""));
    EAR[ear].forEach(([i, s]) => (m[i] = s.split("")));
    if (tail)
      for (let r = 14; r <= 17; r++)
        if (m[r][14] === ".") {
          m[r][14] = r === 14 ? "h" : "H"; // ujung ekor lebih terang
          m[r][15] = "K";
        }
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  Object.assign(SP, {
    elfRanger: race(
      mkRoyal(
        {
          H: "#f0e8a0",
          A: "#2f7a4a",
          a: "#1f5a38",
          X: "#9cf0b0",
          T: "#3f8a56",
          t: "#2a6040",
          V: "#d8c070",
          P: "#5a4a2a",
          p: "#3a2e1a",
          O: "#3a2a1a",
          R: "#2f7a4a",
        },
        { hat: "hood", cape: 1 },
      ),
      "elf",
    ),
    elfMage: race(
      mkRoyal(
        {
          H: "#d0b0ff",
          A: "#6a3aa0",
          X: "#ffe14d",
          T: "#6a3aa0",
          t: "#4a2a80",
          V: "#e8d0ff",
          P: "#3a2a50",
          p: "#241a38",
        },
        { hat: "witch" },
      ),
      "elf",
    ),
    elfQueen: race(
      mkRoyal(
        {
          H: "#f8f0b0",
          h: "#fffbd0",
          A: "#e2b84a",
          a: "#b8902a",
          X: "#7cf0c8",
          T: "#f0fff0",
          t: "#c8e8d0",
          V: "#3f9a6a",
          E: "#3a8a5a",
        },
        { hat: "tiara", long: 1, dress: 1 },
      ),
      "elf",
    ),
    elfElder: race(
      mkRoyal(
        {
          H: "#f4f4f4",
          M: "#ffffff",
          T: "#4a7a5a",
          t: "#2a5a3a",
          V: "#e2b84a",
          P: "#3a4a3a",
          p: "#2a3a2a",
        },
        { beard: 1 },
      ),
      "elf",
    ),
    elfGuard: race(
      mkRoyal(
        {
          H: "#e8e0a0",
          A: "#c8e0d0",
          a: "#88a898",
          X: "#ffffff",
          T: "#2f7a4a",
          t: "#1f5a38",
          V: "#dfe6f2",
          P: "#c8d8c8",
          p: "#98a898",
          O: "#4a4a3a",
        },
        { hat: "helm", spear: 1 },
      ),
      "elfHelm",
    ),
    elfMerchant: race(
      mkRoyal(
        {
          H: "#c8f0a0",
          A: "#e8f8d0",
          X: "#ffffff",
          T: "#8ac86a",
          t: "#5a9a40",
          V: "#7a4b2a",
          P: "#3b3030",
          p: "#2a2020",
        },
        { hat: "scarf" },
      ),
      "elf",
    ),
    neko: race(
      mkRoyal(
        {
          H: "#e8a060",
          h: "#ffd0a0",
          T: "#d85a8a",
          t: "#a8305a",
          V: "#fff0f0",
          P: "#5a3a4a",
          p: "#3a2430",
        },
        {},
      ),
      "cat",
      1,
    ),
    rubah: race(
      mkRoyal(
        {
          H: "#e8742a",
          h: "#ffb27a",
          T: "#8a5a2b",
          t: "#5e3a1a",
          V: "#fff0d0",
          P: "#4a3a2a",
          p: "#33281f",
        },
        {},
      ),
      "cat",
      1,
    ),
    serigala: race(
      mkRoyal(
        {
          H: "#8a90a8",
          h: "#c8ccd8",
          A: "#aab3c6",
          T: "#5a6a8a",
          t: "#3a4868",
          V: "#e2b84a",
          P: "#3a3a4a",
          p: "#242430",
        },
        { cape: 1 },
      ),
      "wolf",
      1,
    ),
    kelinci: race(
      mkRoyal(
        {
          H: "#f4f4f4",
          h: "#ffffff",
          T: "#f0d0e0",
          t: "#c8a0b8",
          V: "#7a4b2a",
          P: "#8a6a7a",
          p: "#5a4a5a",
        },
        {},
      ),
      "rabbit",
      1,
    ),
    serigalaTua: race(
      mkRoyal(
        {
          H: "#e8e8e8",
          h: "#ffffff",
          M: "#ffffff",
          T: "#6a4a2a",
          t: "#4a3018",
          V: "#e2b84a",
          P: "#3a2a1a",
          p: "#241a10",
        },
        { beard: 1, cape: 1 },
      ),
      "wolf",
      1,
    ),
  });

  /* ---------- alat bantu membuat peta ---------- */
  const SOLID = "#TwBDLfSEMCRPQUZHem", // petak yang tidak bisa dilewati (sama dengan solid() di world.js)
    rng = (s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    blank = (w, h, c = ".") =>
      [...Array(h)].map((_, y) =>
        [...Array(w)].map((_, x) =>
          x === 0 || y === 0 || x === w - 1 || y === h - 1 ? "#" : c,
        ),
      ),
    inb = (g, x, y) =>
      x > 0 && y > 0 && y < g.length - 1 && x < g[0].length - 1,
    put = (g, x, y, c) => inb(g, x, y) && (g[y][x] = c),
    box = (g, x, y, w, h, c) => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
    },
    forest = (g, p, r) =>
      g.forEach((row, y) =>
        row.forEach(
          (c, x) => c === "." && inb(g, x, y) && r() < p && (row[x] = "T"),
        ),
      ),
    disc = (g, cx, cy, rad, c) => {
      for (let y = cy - rad; y <= cy + rad; y++)
        for (let x = cx - rad; x <= cx + rad; x++)
          if ((x - cx) ** 2 + (y - cy) ** 2 <= rad * rad) put(g, x, y, c);
    },
    // jalan: garis lurus antar titik, selebar 2*hw+1 petak
    carve = (g, pts, hw, c = ".") => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          box(g, x - hw, y - hw, hw * 2 + 1, hw * 2 + 1, c);
        }
      }
    },
    clr = (g, cx, cy, rad) => {
      for (let y = cy - rad; y <= cy + rad; y++)
        for (let x = cx - rad; x <= cx + rad; x++)
          if (inb(g, x, y) && "TM".includes(g[y][x])) g[y][x] = ".";
    },
    house = (g, x, y) => {
      box(g, x, y, 4, 3, "B");
      put(g, x + 1, y + 2, "E"); // pintu
    },
    pt = (x, y, to, tx, ty, f, more) => ({
      t: "portal",
      x,
      y,
      to,
      tx,
      ty,
      f,
      ...more,
    }),
    chest = (id, [x, y], i) => ({
      t: "chest",
      id,
      x,
      y,
      coin: 220 + i * 12,
      po: i % 2 ? 0 : 1,
      fp: i % 3 === 1 ? 1 : 0,
      sc: i % 5 === 4 ? 1 : 0,
    }),
    wk = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`;

  // pastikan semua titik penting bisa dijangkau dari titik awal; kalau terkurung, buka jalan lewat pohon/gunung
  function ensure(g, start, targets, tag) {
    const W = g[0].length,
      H = g.length,
      D4 = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ],
      flood = () => {
        const seen = new Uint8Array(W * H),
          st = [start];
        seen[start[1] * W + start[0]] = 1;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of D4) {
            const a = x + dx,
              b = y + dy;
            if (inb(g, a, b) && !SOLID.includes(g[b][a]) && !seen[b * W + a]) {
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
            if (!inb(g, x, y) || !"TM.,".includes(g[y][x])) return null;
          }
        }
        return pts;
      };
    let seen = flood();
    const near = ([x, y]) =>
      [[0, 0], ...D4].some(([dx, dy]) => seen[(y + dy) * W + x + dx]);
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
      if (!near(t)) console.warn(`[utara] ${tag}: titik belum terjangkau`, t);
    });
  }

  /* ---------- NPC (pakai spawnNpc milik town.js: otomatis mencari petak kosong terdekat) ---------- */
  const gn = (map, who, sp, [x, y], lines, fx, more) =>
    spawnNpc(map, {
      t: "npc",
      id: "gen",
      d: [who, lines],
      sp,
      x,
      y,
      fx: fx || {},
      ...more,
    });
  const merchant = (map, sp, [x, y]) =>
    spawnNpc(map, { t: "npc", id: "toko", sp, x, y, fx: {} }); // id "toko" = buka toko

  const ZONES = {}; // aturan monster acak per wilayah: { pool, p (peluang), safe (area aman) }

  /* ===================== 1) HUTAN ELF SILVARA (100x72) ===================== */
  {
    const W = 100,
      H = 72,
      r = rng(7701),
      g = blank(W, H);
    forest(g, 0.24, r);
    [
      [12, 48, 14, 8],
      [74, 52, 13, 7],
      [18, 20, 10, 6],
      [78, 22, 10, 8],
      [40, 6, 3, 2],
    ].forEach(([x, y, w, h]) => box(g, x, y, w, h, "w")); // danau
    box(g, 38, 2, 25, 11, "."); // hutan keramat di utara
    box(g, 34, 24, 32, 20, "."); // desa elf
    box(g, 42, 58, 17, 12, "."); // pos masuk
    carve(
      g,
      [
        [50, 69],
        [50, 58],
        [50, 15],
      ],
      1,
      ",",
    ); // jalur utama
    carve(
      g,
      [
        [35, 34],
        [98, 34],
      ],
      0,
      ",",
    ); // jalan desa & jalur ke timur (Hutan Beast)
    for (let x = 1; x < W - 1; x++) g[14][x] = "M"; // punggung bukit utara; celah 1 petak dijaga Ent Kuno
    g[14][50] = ".";
    [
      [36, 26],
      [43, 26],
      [56, 26],
      [61, 26],
      [36, 37],
      [43, 37],
      [56, 37],
      [61, 37],
    ].forEach(([x, y]) => house(g, x, y));
    put(g, 54, 31, "f"); // air mancur
    put(g, 46, 31, "L");
    g[H - 1][50] = "D"; // gerbang selatan (ke dunia luar)
    g[0][50] = "D"; // gerbang utara (ke Pegunungan Naga)
    g[34][W - 1] = "D"; // gerbang timur (ke Hutan Beast)
    const cs = [
        [8, 8],
        [91, 8],
        [10, 33],
        [90, 44],
        [8, 64],
        [91, 64],
        [30, 62],
        [70, 66],
        [28, 9],
        [72, 9],
      ],
      cr = [
        [47, 66],
        [57, 31],
      ],
      npcs = [
        [48, 64],
        [53, 29],
        [47, 31],
        [45, 40],
        [58, 31],
        [58, 40],
        [90, 33],
        [50, 6],
        [40, 31],
        [64, 33],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => clr(g, x, y, 1));
    ensure(
      g,
      [50, 69],
      [...cs, ...cr, ...npcs, [49, 14], [50, 1], [97, 34], [51, 68]],
      "Hutan Elf",
    );
    MP.NE = { th: "e", w: W, h: H, g: g.map((row) => row.join("")) };
    EN.NE = [
      pt(50, H - 1, "O", GATE[0], GATE[1] + 2, [0, 1]),
      pt(50, 0, "NG", 50, 77, [0, -1]),
      pt(W - 1, 34, "NB", 2, 34, [1, 0]),
      { t: "foe", i: EI.entkuno, x: 50, y: 14, sp: "entkuno" },
      ...cs.map((p, i) => chest("ne" + (i + 1), p, i)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    ZONES.NE = {
      pool: [EI.pixie, EI.spiritfox, EI.lightowl, EI.glowshroom],
      p: 0.35,
      safe: [
        [34, 24, 65, 43],
        [42, 58, 58, 70],
        [38, 1, 62, 13],
      ],
    };
    const e = gn.bind(null, "NE");
    e(
      "Penjaga Gerbang Elf Thalion",
      "elfGuard",
      [48, 64],
      [
        "Selamat datang di Hutan Elf Silvara, pengelana. Hutan ini hidup, jadi jangan merusak pohonnya.",
        "Di balik desa ke arah utara, akar-akar tua menjaga jalan ke Pegunungan Naga.",
        wk(EI.entkuno),
      ],
      { face: 1 },
    );
    e(
      "Ratu Elf Aelwyn",
      "elfQueen",
      [53, 29],
      [
        "Aku Aelwyn, ratu para elf Silvara. Kami jarang menerima tamu manusia, tapi kamu datang dengan niat baik.",
        "Ent Kuno menjaga jalan ke Pegunungan Naga sejak seribu tahun lalu. Ia hanya mau minggir pada orang yang pandai berhitung.",
        "Di timur desa ada jalan ke Hutan Beast. Para manusia binatang di sana adalah tetangga kami.",
      ],
      { face: -1 },
    );
    e(
      "Tetua Elf Faelor",
      "elfElder",
      [47, 31],
      [
        "Umurku sudah tiga ratus tahun, tapi soal pecahan masih bisa membuatku pusing.",
        "Peri kecil di hutan ini gemar mengacaukan angka. " + wk(EI.pixie),
      ],
      { wander: 2 },
    );
    e(
      "Pemanah Elf Lirael",
      "elfRanger",
      [45, 40],
      [
        "Rubah perak berkeliaran saat bulan terbit. Sudutnya sulit ditebak, tapi gerakannya berpola.",
        wk(EI.spiritfox),
      ],
      { wander: 3 },
    );
    e(
      "Penyihir Elf Nymeria",
      "elfMage",
      [58, 31],
      [
        "Jamur ungu itu bukan racun, hanya jahil. Sporanya menukar posisi angka.",
        wk(EI.glowshroom),
        wk(EI.lightowl),
      ],
      { wander: 2 },
    );
    merchant("NE", "elfMerchant", [58, 40]);
    e(
      "Pengelana Manusia",
      "pria",
      [90, 33],
      [
        "Di sebelah timur ada Hutan Beast. Penghuninya manusia binatang: kucing, rubah, serigala, kelinci. Mereka ramah kalau kamu sopan.",
      ],
      { face: -1 },
    );
    e(
      "Penjaga Hutan Keramat",
      "elfGuard",
      [50, 6],
      [
        "Kamu berhasil melewati Ent Kuno. Di atas sana, gerbang menuju Pegunungan Naga.",
        "Hati-hati. Naga tidak suka tamu yang tidak membawa hadiah.",
      ],
      { face: 1 },
    );
    e(
      "Anak Elf Sylva",
      "elfMerchant",
      [40, 31],
      [
        "Kakak, kamu tahu? Kalau diam di bawah pohon besar, daunnya berbisik hitungan!",
      ],
      { wander: 3 },
    );
    e(
      "Pemburu Elf Caelum",
      "elfRanger",
      [64, 33],
      [
        "Aku suka memburu rusa roh, tapi malam ini giliran jaga di jalan timur.",
        "Siapkan HP dan Mana penuh sebelum masuk ke Pegunungan Naga.",
      ],
      { face: 1 },
    );
  }

  /* ===================== 2) HUTAN BEAST FERALA (100x72) ===================== */
  {
    const W = 100,
      H = 72,
      r = rng(9923),
      g = blank(W, H);
    forest(g, 0.3, r);
    [
      [14, 10, 8, 6],
      [80, 10, 10, 7],
      [20, 56, 12, 6],
      [76, 56, 12, 6],
    ].forEach(([x, y, w, h]) => box(g, x, y, w, h, "w")); // danau
    box(g, 40, 23, 34, 24, "."); // desa manusia binatang
    box(g, 1, 29, 10, 11, "."); // pos masuk
    box(g, 86, 24, 12, 21, "."); // altar di balik punggung bukit
    carve(
      g,
      [
        [1, 34],
        [97, 34],
      ],
      1,
      ",",
    ); // jalur barat -> timur
    for (let y = 1; y < H - 1; y++) g[y][84] = "M"; // punggung bukit timur; celah 1 petak dijaga Fenrix
    g[34][84] = ".";
    [
      [42, 25],
      [49, 25],
      [56, 25],
      [63, 25],
      [44, 38],
      [52, 38],
      [60, 38],
      [67, 38],
    ].forEach(([x, y]) => house(g, x, y));
    put(g, 47, 33, "L");
    put(g, 61, 33, "L");
    g[34][0] = "D"; // gerbang barat (ke Hutan Elf)
    const cs = [
        [8, 8],
        [45, 8],
        [92, 8],
        [10, 24],
        [30, 62],
        [60, 64],
        [90, 64],
        [5, 66],
        [94, 50],
        [92, 30],
      ],
      cr = [
        [55, 31],
        [5, 37],
      ],
      npcs = [
        [4, 33],
        [56, 30],
        [50, 34],
        [62, 33],
        [46, 31],
        [66, 41],
        [53, 41],
        [88, 34],
        [92, 38],
        [8, 36],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => clr(g, x, y, 1));
    ensure(
      g,
      [2, 34],
      [...cs, ...cr, ...npcs, [83, 34], [85, 34]],
      "Hutan Beast",
    );
    MP.NB = { th: "b", w: W, h: H, g: g.map((row) => row.join("")) };
    EN.NB = [
      pt(0, 34, "NE", W - 3, 34, [-1, 0]),
      { t: "foe", i: EI.fenrix, x: 84, y: 34, sp: "fenrix" },
      ...cs.map((p, i) => chest("nb" + (i + 1), p, i)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    ZONES.NB = {
      pool: [EI.forestwolf, EI.tiger, EI.bear],
      p: 0.38,
      safe: [
        [40, 23, 73, 46],
        [1, 28, 10, 40],
        [86, 24, 97, 44],
      ],
    };
    const e = gn.bind(null, "NB");
    e(
      "Penjaga Gerbang Taro",
      "serigala",
      [4, 33],
      [
        "Hmph. Manusia ya? Tidak apa, selama kamu tidak menginjak ladang kami.",
        "Desa Ferala ada di tengah hutan. Ikuti jalan setapak ke timur.",
        wk(EI.forestwolf),
      ],
      { face: 1 },
    );
    e(
      "Kepala Suku Garrok",
      "serigalaTua",
      [56, 30],
      [
        "Aku Garrok, kepala suku Ferala. Dulu kami dan manusia hidup berdampingan.",
        "Di balik bukit timur ada Altar Beast. Fenrix, serigala putih penjaganya, hanya mau minggir pada yang pandai membagi.",
        wk(EI.fenrix),
      ],
      { face: 1 },
    );
    e(
      "Neko Mimi",
      "neko",
      [50, 34],
      [
        "Nyaa! Kamu manusia ya? Telingamu kok tidak ada? Lucu sekali!",
        "Hati-hati macan tutul di hutan. Totolnya berubah-ubah, persis variabel. " +
          wk(EI.tiger),
      ],
      { wander: 3 },
    );
    e(
      "Rubah Kira",
      "rubah",
      [62, 33],
      [
        "Hihi, aku bisa menebak soal berikutnya dari ekormu. Bercanda!",
        "Beruang hutan itu lamban tapi kuat. " + wk(EI.bear),
      ],
      { wander: 2 },
    );
    e(
      "Pemburu Rowan",
      "serigala",
      [46, 31],
      [
        "Aku berburu sejak kecil. Serigala hijau menyerang berkelompok, jadi jangan berhenti terlalu lama di hutan.",
      ],
      { wander: 2 },
    );
    merchant("NB", "kelinci", [66, 41]);
    e(
      "Bocah Kucing Nyo",
      "neko",
      [53, 41],
      ["Kakak mau lihat ekorku? Ayo kejar kalau bisa!"],
      { wander: 4 },
    );
    e(
      "Penjaga Altar",
      "serigalaTua",
      [88, 34],
      [
        "Kamu mengalahkan Fenrix! Sudah lama tidak ada manusia yang pantas berdiri di sini.",
        "Peti-peti di sekitar altar adalah persembahan para pengembara. Ambil seperlunya.",
      ],
      { face: -1 },
    );
    e(
      "Tabib Kelinci Lumi",
      "kelinci",
      [92, 38],
      ["Udara di altar ini menenangkan. Kalau lelah, duduklah sebentar."],
      { wander: 2 },
    );
    e(
      "Pengelana Elf",
      "elfRanger",
      [8, 36],
      [
        "Aku datang dari Hutan Elf di barat. Para manusia binatang itu sebenarnya baik hati.",
        "Kalau mau ke Pegunungan Naga, lewat Hutan Elf lalu utara.",
      ],
      { face: 1 },
    );
  }

  /* ===================== 3) PEGUNUNGAN NAGA DRAKONIS (100x80) ===================== */
  {
    const W = 100,
      H = 80,
      g = blank(W, H, "M");
    carve(
      g,
      [
        [50, 77],
        [50, 66],
        [24, 62],
        [24, 48],
        [74, 44],
        [74, 30],
        [28, 26],
        [28, 16],
        [50, 11],
      ],
      2,
      ".",
    ); // jalur berliku ke puncak
    box(g, 38, 68, 25, 10, "."); // pos penunggang naga (aman)
    box(g, 40, 3, 21, 9, "."); // dataran puncak: sarang Zerath
    const rooms = [
      [10, 62, [22, 62]],
      [88, 56, [88, 46, 76, 45]],
      [88, 24, [88, 31, 76, 31]],
      [12, 38, [24, 38, 24, 48]],
      [62, 28, [62, 29]],
    ];
    rooms.forEach(([x, y, to]) => {
      disc(g, x, y, 3, ".");
      carve(
        g,
        [
          [x, y],
          ...(to.length > 2
            ? [
                [to[0], to[1]],
                [to[2], to[3]],
              ]
            : [to]),
        ],
        0,
        ".",
      );
    });
    // dua penghalang 1 petak di jalur: dijaga Gargoyle
    [22, 23, 25, 26].forEach((x) => (g[55][x] = "M"));
    [72, 73, 75, 76].forEach((x) => (g[37][x] = "M"));
    g[H - 1][50] = "D"; // gerbang selatan (ke Hutan Elf)
    const cs = [
        [10, 62],
        [88, 56],
        [88, 24],
        [12, 38],
        [62, 28],
        [43, 4],
        [57, 4],
        [43, 9],
        [57, 9],
        [50, 3],
      ],
      cr = [
        [45, 72],
        [55, 72],
        [30, 21],
      ],
      npcs = [
        [44, 71],
        [56, 71],
        [52, 73],
        [47, 74],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => clr(g, x, y, 1));
    ensure(
      g,
      [50, 77],
      [
        ...cs,
        ...cr,
        ...npcs,
        [24, 56],
        [24, 54],
        [74, 38],
        [74, 36],
        [50, 7],
        [50, 78],
      ],
      "Pegunungan Naga",
    );
    MP.NG = { th: "j", w: W, h: H, g: g.map((row) => row.join("")) };
    EN.NG = [
      pt(50, H - 1, "NE", 50, 2, [0, 1]),
      { t: "foe", i: EI.garg0, x: 24, y: 55, sp: "gargoyle1" },
      { t: "foe", i: EI.garg1, x: 74, y: 37, sp: "gargoyle2" },
      { t: "foe", i: EI.zerath, x: 50, y: 6, sp: "zerath" },
      ...cs.map((p, i) => chest("ng" + (i + 1), p, i + 3)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    ZONES.NG = {
      pool: [EI.wyvern, EI.lavagolem, EI.stormeagle],
      p: 0.4,
      safe: [
        [38, 68, 62, 78],
        [40, 3, 60, 11],
      ],
    };
    window.UTARA_POOL_NG = ZONES.NG.pool; // monster_utara.js menambahkan Roh Angin & Patung Surgawi ke daftar ini
    const e = gn.bind(null, "NG");
    e(
      "Penunggang Naga Veyra",
      "ksatria",
      [44, 71],
      [
        "Selamat datang di Pos Penunggang Naga. Kami hidup berdampingan dengan para naga, tapi Zerath tidak mau diajak berdamai.",
        "Jalur ke puncak dijaga dua Gargoyle. " + wk(EI.garg0),
      ],
      { face: 1 },
    );
    e(
      "Pandai Besi Naga Brunhild",
      "pandai",
      [56, 71],
      [
        "Sisik naga paling keras di dunia, tapi tetap bisa ditempa kalau tahu caranya.",
        "Wyvern muda sering menyerang jalur bawah. " + wk(EI.wyvern),
      ],
      { face: -1 },
    );
    merchant("NG", "elfMerchant", [52, 73]);
    e(
      "Pendaki Tua",
      "kakek2",
      [47, 74],
      [
        "Aku sudah tiga kali mencoba mencapai puncak. Dua kali pulang dengan tangan kosong.",
        "Golem batu di sini keras. " + wk(EI.lavagolem),
        "Elang petir menyambar dari udara. " + wk(EI.stormeagle),
      ],
      { wander: 2 },
    );
  }

  /* ===================== MONSTER ACAK SAAT BERJALAN ===================== */
  let cnt = 0;
  const _os = onStep;
  onStep = function () {
    _os();
    const z = ZONES[mp];
    if (!z || busy) return;
    if (
      z.safe.some(
        ([x0, y0, x1, y1]) => px >= x0 && px <= x1 && py >= y0 && py <= y1,
      )
    )
      return void (cnt = 0);
    if (++cnt < STEPS || Math.random() > z.p) return;
    const i = P(z.pool);
    cnt = -8; // jeda beberapa langkah setelah bertarung
    held = null;
    W.on = false;
    start(i);
  };

  /* ===================== PETA MINI ===================== */
  {
    const _m2 = mini2,
      BG = { e: "#2f7a52", j: "#7a6a62", b: "#4a6a34" },
      COL = {
        "#": "#1c2a22",
        T: "#1a5a3a",
        M: "#5a5870",
        w: "#2a6fd6",
        B: "#b8472f",
        E: "#6b3a1c",
        ",": "#a9854f",
        f: "#5aa8ff",
        D: "#e2b84a",
        L: "#ffd166",
      };
    mini2 = function (id) {
      if (!ZONES[id]) return _m2(id);
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

  /* ===================== GERBANG UTARA DI DUNIA LUAR ===================== */
  {
    const O = MP.O,
      [gx, gy] = GATE,
      set = (x, y, c) =>
        (O.g[y] = O.g[y].slice(0, x) + c + O.g[y].slice(x + 1));
    // bersihkan pohon di sekitar gerbang, buat jalan setapak turun ke batu teleportasi Desa Sunyi
    for (let y = 1; y <= 4; y++)
      for (let x = gx - 2; x <= gx + 2; x++)
        if (O.g[y][x] === "T") set(x, y, ".");
    for (let y = 1; y <= 4; y++) set(gx, y, ",");
    set(gx, gy, "D"); // pintu batu di tembok atas
    delete O.mc; // gambar peta mini dibuat ulang
    EN.O.push(
      pt(gx, gy, "NE", 50, 69, [0, -1], {
        k: () => ri() >= MIN_RANK,
        kf: () =>
          dlg("Penjaga Gerbang Utara", [
            `Di utara ada Hutan Elf, Pegunungan Naga, dan Hutan Beast. Terlalu berbahaya untuk pemula.`,
            `Datanglah lagi kalau guild-mu sudah Rank ${RK[MIN_RANK]} atau lebih tinggi.`,
          ]),
      }),
    );
    gn(
      "O",
      "Penjaga Gerbang Utara",
      "gerbang",
      [gx - 1, gy + 2],
      [
        "Gerbang ini menuju tanah utara: Hutan Elf, Pegunungan Naga, dan Hutan Beast.",
        `Hanya petualang Rank ${RK[MIN_RANK]} ke atas yang boleh lewat. Isi penuh HP dan Mana dulu di kristal Desa Sunyi.`,
      ],
      { face: 1 },
    );
    gn(
      "O",
      "Penjaga Gerbang Utara",
      "gerbang",
      [gx + 1, gy + 2],
      [
        "Para elf dan manusia binatang di sana ramah, tapi monsternya tidak. Bawa banyak ramuan!",
      ],
      { face: -1 },
    );
  }
})();
