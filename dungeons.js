/* ===== Numeria Quest — Dungeon: elemen, rank, lantai, bos lantai & bos dungeon =====
   Dimuat PALING AKHIR (setelah town.js). Tidak mengubah berkas lain selain index.html (satu baris <script>).

   TIPE (elemen): api, kayu, air, es, biasa
     - tiap elemen: warna lorong & kegelapan, warna musuh (sprite diwarnai ulang), latar battle,
       kelemahan soal, dan sedikit beda stat musuh (lihat tabel EL di bawah).
   RANK -> JUMLAH LANTAI:  C = 1 lantai · B = 2 · A = 3 · S = 4  (lihat tabel RNK).
   BOS:
     - Bos LANTAI  : menjaga tangga turun di tiap lantai kecuali lantai terakhir. Mengalahkannya membuka jalan
                     ke tangga dan membuka peti bonus lantai.
     - Bos DUNGEON : di lantai terakhir, menjaga ruang harta.
   Labirin = SATU jalan berkelok selebar 4 petak. Bentuknya dari seed tetap (sama tiap main, aman untuk simpan/muat).
   Di dalam: gelap, peta mini berkabut, musuh biasa muncul lagi tiap kali masuk lantai (bos & peti tidak),
   Kristal Simpan di tengah jalur tiap lantai.
   AREA PINTU: 4 petak di sekeliling pintu gua di dunia terbuka dibersihkan (pohon, kaktus, batu) dan lahan dipilih
   yang bebas NPC/peti/herba, supaya dungeon selalu bisa dimasuki. Ubah CLR untuk melebarkan/menyempitkan. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const LIGHT_IN = 92, // radius terang penuh di sekitar karakter (piksel)
    LIGHT_OUT = 172, // radius tempat gelap mencapai maksimum
    DARK = 0.9, // kegelapan maksimum (0..1). Isi 0 untuk mematikan efek gelap
    RESPAWN = true, // musuh biasa muncul lagi tiap kali masuk lantai
    SEEN_R = 10, // jarak (petak) dari pintu gua supaya tandanya muncul di peta mini dunia
    CLR = 4, // petak bersih di sekeliling pintu gua
    DGV = 2; // versi data dungeon (naikkan bila susunan dungeon diubah; progres dungeon lama direset)

  /* ---------- rank: lantai, ukuran labirin, kekuatan ---------- */
  const RNK = {
    C: {
      fl: 1,
      cw: 8,
      ch: 6,
      foes: 8,
      chests: 5,
      coin: [30, 60],
      treasure: 120,
      hp: 1,
      atk: 1,
      xp: 1,
      dd: 0,
    },
    B: {
      fl: 2,
      cw: 8,
      ch: 6,
      foes: 7,
      chests: 4,
      coin: [45, 90],
      treasure: 180,
      hp: 1.3,
      atk: 1.15,
      xp: 1.4,
      dd: 1,
    },
    A: {
      fl: 3,
      cw: 9,
      ch: 6,
      foes: 7,
      chests: 4,
      coin: [60, 110],
      treasure: 260,
      hp: 1.7,
      atk: 1.3,
      xp: 1.9,
      dd: 1,
    },
    S: {
      fl: 4,
      cw: 10,
      ch: 7,
      foes: 8,
      chests: 4,
      coin: [80, 140],
      treasure: 380,
      hp: 2.2,
      atk: 1.5,
      xp: 2.6,
      dd: 2,
    },
  };
  /* ---------- elemen ---------- */
  const EL = {
    biasa: {
      n: "Biasa",
      sfx: "",
      col: "#c77dff",
      tint: [40, 0, 80],
      dark: "4,2,14",
      hp: 1,
      atk: 1,
      weak: null,
      bg: null,
      hue: null,
      pool: [0, 1, 6, 4, 5],
      bi: "Bayangan bergerak di balik pilar.",
    },
    api: {
      n: "Api",
      sfx: "Api",
      col: "#ff6a3d",
      tint: [130, 30, 0],
      dark: "18,3,0",
      hp: 0.95,
      atk: 1.2,
      weak: "persen",
      bg: ["#3a1208", "#d0501a", "#2a0e06", "#ffd08a"],
      hue: [10, 0.75, 0],
      pool: [7, 9, 4, 6, 8],
      bi: "Udara terasa menyengat dan lantai berpendar merah.",
    },
    kayu: {
      n: "Kayu",
      sfx: "Rimba",
      col: "#5fd96a",
      tint: [0, 85, 20],
      dark: "2,12,4",
      hp: 1.2,
      atk: 0.95,
      weak: "geom",
      bg: ["#10281a", "#2f6a3a", "#0c2014", "#c8ffb0"],
      hue: [118, 0.5, 0],
      pool: [6, 14, 15, 1, 4],
      bi: "Akar-akar bergerak dan daun berdesir.",
    },
    air: {
      n: "Air",
      sfx: "Samudra",
      col: "#4aa8ff",
      tint: [0, 55, 115],
      dark: "1,6,20",
      hp: 1.05,
      atk: 1.05,
      weak: "pecahan",
      bg: ["#0c2440", "#2a6fa8", "#0a1a30", "#bfefff"],
      hue: [208, 0.65, 0],
      pool: [10, 11, 12, 0],
      bi: "Air menggenang dan ombak menghantam dinding.",
    },
    es: {
      n: "Es",
      sfx: "Es",
      col: "#aee6ff",
      tint: [70, 125, 165],
      dark: "3,8,20",
      hp: 1.1,
      atk: 1.1,
      weak: "alj",
      bg: ["#1a2a40", "#8fc4e6", "#14233a", "#ffffff"],
      hue: [190, 0.45, 0.14],
      pool: [4, 15, 0, 8, 1],
      bi: "Napasmu mengembun dan lantai berderak beku.",
    },
  };
  /* bos lantai (1 per lantai, kecuali lantai terakhir) dan bos dungeon (menurut rank). b = indeks musuh dasar di E */
  const FB = {
    biasa: [
      { n: "Golem Batu Hitung", b: 2 },
      { n: "Kesatria Kerangka Selisih", b: 5 },
      { n: "Ratu Kobold Faktor", b: 6 },
    ],
    api: [
      { n: "Salamander Penjumlah", b: 9 },
      { n: "Ifrit Pengali", b: 7 },
      { n: "Kobra Magma Pembagi", b: 9 },
    ],
    kayu: [
      { n: "Treant Penjumlah", b: 6 },
      { n: "Ratu Lebah Rasio", b: 14 },
      { n: "Penjaga Akar Variabel", b: 15 },
    ],
    air: [
      { n: "Putri Duyung Persen", b: 10 },
      { n: "Kepiting Cangkang Selisih", b: 11 },
      { n: "Hiu Palung Eksponen", b: 12 },
    ],
    es: [
      { n: "Serigala Salju Desimal", b: 4 },
      { n: "Burung Hantu Kristal", b: 15 },
      { n: "Ratu Salju Pecahan", b: 8 },
    ],
  };
  const BOSS = {
    biasa: {
      C: { n: "Naga Parabola", b: 3 },
      B: { n: "Raja Kerangka Himpunan", b: 5 },
      A: { n: "Golem Agung Persamaan", b: 2 },
      S: { n: "Penjaga Nol Sejati", b: 3 },
    },
    api: {
      C: { n: "Singa Bara Desimal", b: 9 },
      B: { n: "Ifrit Agung Persamaan", b: 7 },
      A: { n: "Naga Kawah Kuadrat", b: 3 },
      S: { n: "Raja Api Tak Hingga", b: 3 },
    },
    kayu: {
      C: { n: "Raja Lumut Selisih", b: 6 },
      B: { n: "Dryad Himpunan", b: 15 },
      A: { n: "Ent Raksasa Faktorial", b: 16 },
      S: { n: "Pohon Dunia Aksioma", b: 16 },
    },
    air: {
      C: { n: "Ratu Ombak Pecahan", b: 10 },
      B: { n: "Raja Kepiting Rasio", b: 11 },
      A: { n: "Hiu Purba Eksponen", b: 12 },
      S: { n: "Leviathan Tak Terhingga", b: 13 },
    },
    es: {
      C: { n: "Beruang Beku Desimal", b: 4 },
      B: { n: "Raja Mumi Beku", b: 8 },
      A: { n: "Naga Es Kuadrat", b: 3 },
      S: { n: "Dewi Es Nol Mutlak", b: 3 },
    },
  };

  const XPD = [12, 20, 32, 70], // xp & koin asli E[0..3] (baru diisi init() saat game baru)
    CND = [10, 18, 30, 60];
  /* indeks E: 0 Slime, 1 Rubah, 2 Golem, 3 Naga, 4 Serigala, 5 Bandit, 6 Goblin, 7 Kalajengking, 8 Mumi, 9 Kobra,
     10 Ubur-ubur, 11 Kepiting, 12 Hiu, 13 Kraken, 14 Jamur, 15 Burung Hantu, 16 Ent */
  const DG = [
    {
      id: "D",
      name: "Dungeon Sang Nol",
      el: "biasa",
      rank: "C",
      seed: 20261101,
      boss: 3,
    }, // bos = Naga Parabola asli (quest lama tetap jalan)
    {
      id: "DA",
      name: "Gua Akar Berbisik",
      el: "kayu",
      rank: "B",
      door: [24, 72],
      seed: 20261102,
      boss: {
        b: 6,
        n: "Raja Goblin Akar",
        hp: 230,
        atk: 19,
        xp: 90,
        coin: 120,
        intro:
          "Di ujung lorong akar, Raja Goblin menggebrak singgasana kayunya. Hitunganmu akan dia kurangi sampai habis!",
        win: "Mahkota akar Raja Goblin retak. Peti harta di belakangnya terbuka untukmu.",
      },
    },
    {
      id: "DP",
      name: "Makam Pasir Terkubur",
      el: "api",
      rank: "A",
      door: [128, 62],
      seed: 20261103,
      boss: {
        b: 8,
        n: "Firaun Variabel",
        hp: 280,
        atk: 21,
        xp: 130,
        coin: 160,
        intro:
          "Peti mati emas terbuka. Firaun Variabel bangkit, perbannya menyala dan penuh persamaan yang belum terpecahkan!",
        win: "Firaun itu runtuh jadi debu emas. Harta makam kini milikmu.",
      },
    },
    {
      id: "DK",
      name: "Gua Karang Tenggelam",
      el: "air",
      rank: "B",
      door: [301, 97],
      seed: 20261104,
      boss: {
        b: 11,
        n: "Raja Kepiting Rasio",
        hp: 340,
        atk: 23,
        xp: 170,
        coin: 200,
        intro:
          "Air menggenang di aula karang. Raja Kepiting Rasio mengangkat capit raksasanya dan menuntut perbandingan yang tepat!",
        win: "Capit raksasa itu terkulai. Harta karang berkilau di balik aula.",
      },
    },
    {
      id: "DL",
      name: "Liang Peluang Purba",
      el: "kayu",
      rank: "S",
      door: [377, 94],
      seed: 20261105,
      boss: {
        b: 16,
        n: "Ent Purba Himpunan",
        hp: 400,
        atk: 25,
        xp: 220,
        coin: 250,
        intro:
          "Akar-akar purba bergerak. Ent Purba Himpunan membuka matanya, dan setiap soal terasa seperti undian!",
        win: "Ent Purba itu kembali tidur di bawah tanah. Harta liang terbuka.",
      },
    },
    {
      id: "DB",
      name: "Kawah Bara Kecil",
      el: "api",
      rank: "C",
      door: [60, 90],
      seed: 20261106,
    },
    {
      id: "DI",
      name: "Gua Es Kristal",
      el: "es",
      rank: "B",
      door: [330, 30],
      seed: 20261107,
    },
    {
      id: "DR",
      name: "Palung Ombak Dalam",
      el: "air",
      rank: "A",
      door: [290, 45],
      seed: 20261108,
    },
    {
      id: "DX",
      name: "Tambang Terlupakan",
      el: "biasa",
      rank: "A",
      door: [150, 40],
      seed: 20261109,
    },
    {
      id: "DM",
      name: "Jantung Magma Numeria",
      el: "api",
      rank: "S",
      door: [100, 108],
      seed: 20261110,
    },
    {
      id: "DE",
      name: "Istana Es Nol Mutlak",
      el: "es",
      rank: "S",
      door: [430, 30],
      seed: 20261111,
    },
  ];
  const DNG = {}, // id dungeon -> definisi
    FL = {}, // id peta lantai -> { d, f, foes }
    CH = new Set(), // semua id peti dungeon (untuk migrasi simpanan lama)
    BI = new Set(), // indeks E milik bos (musik bos)
    E0 = E.length; // indeks E pertama yang dibuat berkas ini
  DG.forEach((d) => (DNG[d.id] = d));
  const fid = (d, f) => (f === 1 ? d.id : d.id + f), // lantai 1 memakai id dungeon (kompatibel dengan data lama)
    nfl = (d) => RNK[d.rank].fl;

  /* ---------- utilitas ---------- */
  const rng = (s) => () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const D4 = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  const toHsl = (hex) => {
    const n = parseInt(hex.slice(1), 16),
      r = ((n >> 16) & 255) / 255,
      g = ((n >> 8) & 255) / 255,
      b = (n & 255) / 255,
      mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      l = (mx + mn) / 2;
    let h = 0,
      s = 0;
    if (mx !== mn) {
      const d = mx - mn;
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h =
        mx === r
          ? (g - b) / d + (g < b ? 6 : 0)
          : mx === g
            ? (b - r) / d + 2
            : (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  };
  const toHex = (h, s, l) => {
    const a = s * Math.min(l, 1 - l),
      f = (n) => {
        const k = (n + h / 30) % 12;
        return Math.round(
          255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
        );
      };
    return (
      "#" +
      [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, "0")).join("")
    );
  };

  /* ---------- sprite berwarna elemen (varian "<sprite>_<elemen>" + versi battle "...L") ---------- */
  const BASE_SP = {}; // kunci varian -> sprite asli (agar suara monster tetap berbunyi)
  function variant(sp, elId) {
    const el = EL[elId];
    if (!el.hue || !SP[sp]) return sp;
    const key = sp + "_" + elId;
    if (!SP[key]) {
      const [h, sat, dl] = el.hue,
        recolor = (pal) => {
          const o = {};
          for (const k in pal) {
            const c = pal[k];
            if (typeof c !== "string" || !/^#[0-9a-f]{6}$/i.test(c)) {
              o[k] = c;
              continue;
            }
            const [, s, l] = toHsl(c);
            o[k] =
              l < 0.1 || l > 0.93
                ? c
                : toHex(
                    h,
                    Math.max(s, sat),
                    Math.max(0.05, Math.min(0.95, l + dl)),
                  );
          }
          return o;
        };
      SP[key] = { ...SP[sp], p: recolor(SP[sp].p) };
      if (SP[sp + "L"]) SP[key + "L"] = { ...SP[sp + "L"], p: SP[key].p };
      BASE_SP[key] = sp;
    }
    return key;
  }

  /* ---------- pembuat musuh (biasa / bos lantai / bos dungeon) ---------- */
  // kind: 0 biasa, 1 bos lantai, 2 bos dungeon. over: nilai yang menimpa (bos buatan tangan memakai hp/atk/xp/coin apa adanya x rank)
  function mkFoe(bi, d, f, kind, over) {
    over = over || {};
    const b = E[bi],
      el = EL[d.el],
      rk = RNK[d.rank],
      fm = 1 + 0.06 * (f - 1),
      hand = (k) => over[k] != null,
      BH = [1, 1.25, 1.5][kind],
      BA = [1, 1.12, 1.25][kind],
      BX = [1, 2.4, 4][kind],
      hp = Math.round((hand("hp") ? over.hp : b.hp * BH) * rk.hp * fm * el.hp),
      atk = Math.round((hand("atk") ? over.atk : b.atk * BA) * rk.atk * el.atk),
      xp = Math.round(
        (hand("xp") ? over.xp : (b.xp || XPD[bi]) * (kind ? BX : 1.15)) *
          rk.xp *
          fm,
      ),
      coin = Math.round(
        (hand("coin") ? over.coin : (b.coin || CND[bi]) * (kind ? BX : 1.15)) *
          rk.xp *
          fm,
      ),
      lo = Math.min(5, Math.max(b.d[0] + rk.dd, [1, 3, 4][kind])),
      hi = Math.min(5, Math.max(b.d[1] + rk.dd, lo)),
      weak = el.weak || b.weak,
      name = over.n || b.n + (el.sfx ? " " + el.sfx : "");
    const o = {
      ...b,
      n: name,
      sp: variant(b.sp, d.el),
      hp,
      atk,
      xp,
      coin,
      d: [lo, kind ? 5 : hi],
      weak,
      el: d.el, // elemen monster (api/kayu/air/es/biasa), dipakai untuk label di battle
      topics: [...new Set([...(b.topics || []), weak])],
      s: Math.min(5, b.s + (kind ? 1 : 0)),
      bg: el.bg || b.bg,
    };
    if (kind === 0) {
      o.intro = `${name} (elemen ${el.n}) menghadang di lorong ${d.name}. Jawab dengan benar untuk lolos!`;
      o.win = `${name} tumbang. Lorong di depan terbuka lagi.`;
    } else if (kind === 1) {
      o.intro = `Penjaga lantai ${f}! ${name} menghalangi tangga ke lantai berikutnya. ${el.bi}`;
      o.win = `${name} tumbang. Tangga ke lantai ${f + 1} kini bebas, dan peti bonus terbuka.`;
    } else {
      o.intro =
        over.intro ||
        `${name}, penguasa ${d.name}, bangkit menghadangmu. ${el.bi}`;
      o.win =
        (over.win || `${name} tumbang. Harta ${d.name} terbuka untukmu.`) +
        " Lingkaran sihir muncul untuk membawamu keluar.";
    }
    E.push(o);
    if (kind) BI.add(E.length - 1);
    return E.length - 1;
  }

  /* ---------- pembuat labirin: SATU jalan berkelok, lebar 4 petak ---------- */
  function build(d, f) {
    const rk = RNK[d.rank],
      id = fid(d, f),
      last = f === rk.fl,
      R = rng(d.seed + (f - 1) * 7919),
      cw = rk.cw,
      ch = rk.ch,
      P = 5, // tiap sel = lorong 4 petak + 1 petak tembok
      w = P * cw + 1,
      h = P * ch + 1;
    const g = [...Array(h)].map(() => Array(w).fill("#"));
    const shuffle = (a) => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(R() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // jalur melewati semua sel tepat sekali: mulai dari ular lurus, lalu dikocok ("backbite") supaya berkelok acak
    let path = [];
    for (let r = 0; r < ch; r++)
      for (let i = 0; i < cw; i++)
        path.push([r % 2 ? cw - 1 - i : i, ch - 1 - r]);
    for (let n = 0; n < cw * ch * 30; n++) {
      const [hx, hy] = path[path.length - 1],
        [dx, dy] = D4[Math.floor(R() * 4)],
        nx = hx + dx,
        ny = hy + dy;
      if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
      const i = path.findIndex(([x, y]) => x === nx && y === ny);
      if (i === path.length - 2) continue;
      path = path.slice(0, i + 1).concat(path.slice(i + 1).reverse());
    }
    const conn = (a, b) => {
      // 4 petak penghubung (lubang di tembok) antara dua sel bertetangga
      const t = [];
      for (let k = 1; k <= 4; k++)
        t.push(
          a[1] === b[1]
            ? [P * Math.max(a[0], b[0]), P * a[1] + k]
            : [P * a[0] + k, P * Math.max(a[1], b[1])],
        );
      return t;
    };
    path.forEach(([x, y], k) => {
      for (let j = 1; j <= 4; j++)
        for (let i = 1; i <= 4; i++) g[P * y + j][P * x + i] = ".";
      if (k) conn(path[k - 1], [x, y]).forEach(([tx, ty]) => (g[ty][tx] = "."));
    });
    const L = path.length,
      ents = [];
    // slot sepanjang jalur: Kristal di tengah, sisanya peti & musuh (acak)
    const nf = d.nf || rk.foes,
      nc = d.nc || rk.chests,
      N = nf + nc + 1,
      slots = [...Array(N)].map(
        (_, i) => path[Math.round(2 + ((L - 5) * (i + 0.5)) / N)],
      ),
      mid = Math.floor(N / 2),
      rest = shuffle([...Array(N).keys()].filter((i) => i !== mid)),
      chestSet = new Set(rest.slice(0, nc));
    const at = ([cx, cy], corner) =>
      corner
        ? [P * cx + (R() < 0.5 ? 1 : 4), P * cy + (R() < 0.5 ? 1 : 4)]
        : [P * cx + 2 + Math.floor(R() * 2), P * cy + 2 + Math.floor(R() * 2)];
    const kinds = ["po", "fp", "po", "sc", "fp", "po"],
      foeIdx = [],
      pool = d.pool || EL[d.el].pool;
    let ci = 0;
    const lo = rk.coin[0],
      hi = rk.coin[1],
      fcm = 1 + 0.1 * (f - 1);
    slots.forEach((c, i) => {
      if (i === mid) {
        const [x, y] = at(c);
        ents.push({ t: "crystal", x, y });
      } else if (chestSet.has(i)) {
        const [x, y] = at(c, 1),
          cid = id + "c" + ci;
        CH.add(cid);
        ents.push({
          t: "chest",
          id: cid,
          x,
          y,
          coin: Math.round((lo + ((hi - lo) * ci) / Math.max(1, nc - 1)) * fcm),
          [kinds[ci % kinds.length]]: 1,
        });
        ci++;
      } else {
        const [x, y] = at(c),
          bi = pool[Math.floor(R() * pool.length)],
          idx = mkFoe(bi, d, f, 0);
        foeIdx.push(idx);
        ents.push({ t: "foe", i: idx, x, y, sp: E[idx].sp });
      }
    });
    // ruang di ujung jalur; bos berdiri di celah masuk, tiga petak lainnya ditutup pilar
    const gate = conn(path[L - 2], path[L - 1]),
      bk = 1 + Math.floor(R() * 2),
      bt = gate[bk];
    gate.forEach(([x, y], k) => k !== bk && (g[y][x] = "Z"));
    const [fx, fy] = path[L - 1],
      corners = [
        [1, 1],
        [4, 1],
        [1, 4],
        [4, 4],
      ].map(([i, j]) => [P * fx + i, P * fy + j]);
    corners.sort(
      (a, b) =>
        Math.abs(b[0] - bt[0]) +
        Math.abs(b[1] - bt[1]) -
        Math.abs(a[0] - bt[0]) -
        Math.abs(a[1] - bt[1]),
    );
    let bossIdx,
      stair = null;
    if (last) {
      const tid = d.id === "D" ? "e" : id + "t";
      CH.add(tid);
      ents.push({
        t: "chest",
        id: tid,
        x: corners[0][0],
        y: corners[0][1],
        coin: d.treasure || rk.treasure,
        po: 1,
        fp: 1,
      });
      if (d.boss === 3)
        bossIdx = 3; // Naga Parabola asli (quest "Kalahkan Naga")
      else if (d.boss) bossIdx = mkFoe(d.boss.b, d, f, 2, d.boss);
      else {
        const t = BOSS[d.el][d.rank];
        bossIdx = mkFoe(t.b, d, f, 2, { n: t.n });
      }
    } else {
      // tangga turun di sudut terjauh dari bos; peti bonus bos lantai di sudut berikutnya
      const [sx, sy] = corners[0],
        bid = id + "b";
      CH.add(bid);
      ents.push({
        t: "chest",
        id: bid,
        x: corners[1][0],
        y: corners[1][1],
        coin: Math.round(rk.treasure * 0.35),
        po: 1,
        ...(f > 1 ? { fp: 1 } : {}),
      });
      stair = { x: sx, y: sy, ax: sx + (sx % P === 1 ? 1 : -1), ay: sy };
      ents.push({
        t: "portal",
        x: sx,
        y: sy,
        to: fid(d, f + 1),
        tx: 2,
        ty: h - 2,
        f: [0, -1],
        stair: "dn",
        dng: d.id,
      });
      const t = FB[d.el][f - 1];
      bossIdx = mkFoe(t.b, d, f, 1, { n: t.n });
    }
    // lantai terakhir: lingkaran sihir keluar dungeon di tengah ruang harta.
    // Baru muncul setelah bos dungeon kalah (on = false -> disembunyikan oleh gone() di world.js).
    // Tujuan keluarnya (tx, ty) diisi nanti di bagian "pasang dungeon ke dunia", setelah posisi pintu gua diketahui.
    if (last) {
      const spots = [
          [2, 2],
          [3, 2],
          [2, 3],
          [3, 3],
        ].map(([i, j]) => [P * fx + i, P * fy + j]),
        [cx, cy] =
          spots.find(([x, y]) => !ents.some((e) => e.x === x && e.y === y)) ||
          spots[0];
      ents.push({
        t: "portal",
        x: cx,
        y: cy,
        to: "O",
        tx: 0,
        ty: 0,
        f: [0, 1],
        dng: d.id,
        circle: 1, // penanda: ini lingkaran sihir (digambar khusus)
        on: () => !!F.done[bossIdx],
      });
    }
    ents.push({ t: "foe", i: bossIdx, x: bt[0], y: bt[1], sp: E[bossIdx].sp });
    // pintu keluar/naik di tembok bawah, tepat di bawah sel awal
    g[h - 1][2] = ".";
    return {
      w,
      h,
      g: g.map((r) => r.join("")),
      ents,
      foeIdx,
      bossIdx,
      ex: 2,
      stair,
    };
  }

  /* ---------- pasang dungeon ke dunia ---------- */
  const setT = (x, y, c) => {
    const r = MP.O.g[y];
    MP.O.g[y] = r.slice(0, x) + c + r.slice(x + 1);
  };
  const tile = (x, y) => (MP.O.g[y] || "")[x],
    clearable = (c) => c === "T" || c === "C" || c === "R", // pohon, kaktus, batu: boleh dibersihkan
    walk = (c) => c === "." || c === "," || clearable(c);
  // lahan layak: lengkungan pintu + halaman depan (CLR petak ke bawah, selebar 2*CLR+1) harus lahan terbuka,
  // tanpa entitas apa pun di sekitarnya, dan di dataran terbuka (bukan di dalam kota/wilayah)
  const okSpot = (x, y) => {
    if (
      x - CLR < 1 ||
      x + CLR > MP.O.w - 2 ||
      y - CLR < 1 ||
      y + CLR > MP.O.h - 2
    )
      return false;
    for (let j = y - 1; j <= y + CLR; j++)
      for (let i = x - CLR; i <= x + CLR; i++)
        if (j <= y && Math.abs(i - x) > 1 ? false : !walk(tile(i, j)))
          return false;
    for (const [i, j] of [
      [-CLR, -CLR],
      [CLR, -CLR],
      [-CLR, CLR],
      [CLR, CLR],
      [0, 0],
    ])
      if (reg(x + i, y + j) !== "O") return false;
    return (
      !EN.O.some(
        (e) => Math.abs(e.x - x) <= CLR + 1 && Math.abs(e.y - y) <= CLR + 1,
      ) &&
      !DG.some(
        (o) =>
          o.ox != null && Math.abs(o.ox - x) < 14 && Math.abs(o.oy - y) < 14,
      )
    );
  };
  const findSpot = (X, Y) => {
    if (okSpot(X, Y)) return [X, Y];
    for (let r = 1; r <= 45; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (
            Math.max(Math.abs(dx), Math.abs(dy)) === r &&
            okSpot(X + dx, Y + dy)
          )
            return [X + dx, Y + dy];
    return [X, Y];
  };
  // bersihkan CLR petak di sekeliling pintu (pohon/kaktus/batu jadi tanah kosong)
  const clearAround = (X, Y) => {
    for (let y = Y - CLR; y <= Y + CLR; y++)
      for (let x = X - CLR; x <= X + CLR; x++)
        if (
          x > 0 &&
          y > 0 &&
          x < MP.O.w - 1 &&
          y < MP.O.h - 1 &&
          clearable(tile(x, y))
        )
          setT(x, y, ".");
  };

  DG.forEach((d) => {
    const n = nfl(d);
    let prev = null,
      door,
      mapIds = [];
    for (let f = 1; f <= n; f++) {
      const id = fid(d, f),
        m = build(d, f);
      FL[id] = { d, f, foes: m.foeIdx };
      MN[id] = n > 1 ? `${d.name} · Lt.${f}` : d.name;
      MP[id] = {
        th: "d",
        w: m.w,
        h: m.h,
        g: m.g,
        dng: d.id,
        tint: EL[d.el].tint,
        dk: EL[d.el].dark,
      };
      if (f === 1) {
        if (d.door) {
          const [X, Y] = findSpot(d.door[0], d.door[1]);
          clearAround(X, Y);
          [
            [X - 1, Y - 1],
            [X, Y - 1],
            [X + 1, Y - 1],
            [X - 1, Y],
            [X + 1, Y],
          ].forEach(([x, y]) => setT(x, y, "M"));
          setT(X, Y, "D");
          EN.O.push({
            t: "portal",
            x: X,
            y: Y,
            to: id,
            tx: m.ex,
            ty: m.h - 2,
            f: [0, -1],
            dng: d.id,
          });
          d.ox = X;
          d.oy = Y;
        } else {
          const e = EN.O.find((p) => p.t === "portal" && p.to === d.id);
          Object.assign(e, { tx: m.ex, ty: m.h - 2, f: [0, -1], dng: d.id });
          clearAround(e.x, e.y);
          d.ox = e.x;
          d.oy = e.y;
        }
        door = { to: "O", tx: d.ox, ty: d.oy + 1, f: [0, 1] };
      } else
        door = {
          to: fid(d, f - 1),
          tx: prev.stair.ax,
          ty: prev.stair.ay,
          f: [prev.stair.ax > prev.stair.x ? -1 : 1, 0],
          stair: "up",
        };
      if (f === n) {
        // lingkaran sihir membawa pemain ke depan pintu gua di dunia terbuka
        const c = m.ents.find((e) => e.circle);
        if (c) Object.assign(c, { tx: d.ox, ty: d.oy + 1, f: [0, 1] });
      }
      EN[id] = [
        { t: "portal", x: m.ex, y: m.h - 1, dng: d.id, ...door },
        ...m.ents,
      ];
      prev = m;
      mapIds.push(id);
      if (f === n) d.bossIdx = m.bossIdx;
    }
    d.maps = mapIds;
  });
  DG.forEach((d) => {
    d.floors = nfl(d);
  });

  /* ---------- musik: semua lantai dungeon memakai lagu dungeon; bos memakai lagu bos ---------- */
  {
    const _m = SND.music;
    SND.music = function (n) {
      return _m.call(SND, FL[n] ? "D" : n);
    };
    const _mon = SND.mon; // varian berwarna tetap memakai suara sprite aslinya
    SND.mon = function (sp, k) {
      return _mon.call(SND, BASE_SP[sp] || sp, k);
    };
    const _st = start;
    start = function (i) {
      _st(i);
      if (BI.has(i)) SND.music("boss");
    };
  }

  /* ---------- musuh biasa muncul lagi tiap masuk lantai + info rank/elemen ---------- */
  {
    const _p = H.portal;
    H.portal = (e) => {
      const m = FL[e.to];
      if (RESPAWN && m) m.foes.forEach((i) => delete F.done[i]);
      _p(e);
      if (m) {
        const d = m.d,
          last = m.f === d.floors;
        say(
          `${d.name} · Rank ${d.rank} · elemen ${EL[d.el].n} · lantai ${m.f}/${d.floors}. ` +
            (last
              ? "Bos dungeon menjaga ruang harta di ujung lorong."
              : "Bos lantai menjaga tangga turun di ujung lorong."),
        );
      }
    };
  }

  /* ---------- simpan/muat: dungeon versi lama direset (indeks musuh & peti berubah) ---------- */
  {
    const migrate = () => {
      if (F.dgv === DGV) return;
      Object.keys(F.done || {}).forEach((k) => +k >= E0 && delete F.done[k]);
      Object.keys(F.chest || {}).forEach(
        (k) => k !== "e" && CH.has(k) && delete F.chest[k],
      );
      F.fog = {};
      F.dgv = DGV;
    };
    const _ng = newGame;
    newGame = function () {
      const r = _ng.apply(this, arguments);
      F.dgv = DGV;
      return r;
    };
    const _lg = loadGame;
    loadGame = function () {
      const ok = _lg.apply(this, arguments);
      if (ok) migrate();
      return ok;
    };
  }

  /* ---------- tanda pintu gua di peta mini dunia (muncul setelah kamu mendekat) ---------- */
  {
    const _os = onStep;
    onStep = function () {
      _os();
      if (mp !== "O") return;
      const s = (F.dsn = F.dsn || {});
      DG.forEach((d) => {
        if (!s[d.id] && Math.abs(px - d.ox) + Math.abs(py - d.oy) <= SEEN_R)
          s[d.id] = 1;
      });
    };
  }

  /* ---------- label elemen di HUD battle ----------
     Fungsi bars() di script.js yang mengisi nama musuh & kelemahan. Kita bungkus: panggil dulu
     yang asli, lalu tambahkan ikon + nama elemen, dan warnai tulisannya sesuai elemen. */
  const ICON = { api: "🔥", kayu: "🌿", air: "💧", es: "❄", biasa: "✦" };
  {
    const _bars = bars;
    bars = function () {
      _bars(); // jalankan versi asli dulu
      const e = S && S.e,
        en = document.querySelector("#en"),
        ch = document.querySelector("#ch");
      if (!e || !en || !ch) return;
      if (e.el && EL[e.el]) {
        // monster dungeon: tampilkan elemen
        const el = EL[e.el];
        en.textContent = `${ICON[e.el]} ${en.textContent}`;
        en.style.color = el.col;
        ch.textContent = `Elemen: ${el.n} · ${ch.textContent}`;
      } else {
        en.style.color = ""; // monster dunia luar: warna normal lagi
      }
    };
  }

  /* ---------- DEBUFF (efek buruk) dari monster elemen ----------
     Monster dungeon bisa menimpakan efek ke pemain setelah menyerang. Efek berlangsung DUR giliran.
       api  -> Terbakar     : HP berkurang tiap giliran (tidak sampai membunuh, sisa minimal 1 HP)
       kayu -> Terlilit Akar: serangan pemain turun 25% (Pl.atk dikurangi sementara, dikembalikan saat efek habis)
       air  -> Basah        : Mana (MP) berkurang tiap giliran
       es   -> Beku         : anggota party tidak ikut menyerang
     Ramuan HP menghapus efek. Efek juga hilang saat battle selesai.
     Ubah angka di DBF_* untuk mengatur peluang & kekuatan. */
  const DBF_DUR = 3, // lama efek (giliran)
    DBF_CHANCE = 0.35, // peluang kena efek dari musuh biasa
    DBF_BOSS = 0.55, // peluang kena efek dari bos
    DBF_BURN = 5, // damage Terbakar per giliran
    DBF_WET = 8; // Mana yang hilang per giliran saat Basah
  const DB = {
    api: { n: "Terbakar", ic: "🔥", col: "#ff6a3d", on: "Kamu terbakar! HP akan berkurang tiap giliran." },
    kayu: { n: "Terlilit Akar", ic: "🌿", col: "#5fd96a", on: "Akar melilit tanganmu! Seranganmu melemah." },
    air: { n: "Basah", ic: "💧", col: "#4aa8ff", on: "Tubuhmu basah kuyup! Manamu terus menurun." },
    es: { n: "Beku", ic: "❄", col: "#aee6ff", on: "Party membeku! Mereka tidak bisa menyerang." },
  };
  let dbf = null, // efek yang sedang aktif: { k: elemen, t: sisa giliran, cut: serangan yang dikurangi }
    hitFlag = false; // true setelah musuh menyerang -> giliran berikutnya cek/pasang efek

  // hapus efek (kembalikan serangan yang tadi dikurangi)
  const clearDbf = () => {
    if (dbf && dbf.cut) Pl.atk += dbf.cut;
    dbf = null;
  };
  // pasang efek baru (atau perpanjang bila sudah kena)
  const applyDbf = (k) => {
    if (dbf && dbf.k === k) return (dbf.t = DBF_DUR); // sudah kena: cukup perpanjang
    clearDbf();
    dbf = { k, t: DBF_DUR, cut: 0 };
    if (k === "kayu") {
      dbf.cut = Math.max(2, Math.round((12 + 2 * Pl.lv + Pl.atk + bon("atk")) * 0.25));
      Pl.atk -= dbf.cut;
    }
    flo(DB[k].ic, "h", DB[k].col);
    burst(PCX, 170, DB[k].col);
  };
  // efek per giliran, mengembalikan teks untuk ditampilkan
  const tickDbf = () => {
    const k = dbf.k;
    let t = "";
    if (k === "api") {
      const d = Math.min(DBF_BURN, Pl.hp - 1); // sisakan minimal 1 HP
      Pl.hp -= d;
      if (d > 0) flo("-" + d, "h", DB[k].col);
      burst(PCX, 170, DB[k].col);
      t = `Api membakarmu! −${d} HP.`;
    } else if (k === "air") {
      Pl.fp = Math.max(0, Pl.fp - DBF_WET);
      t = `Tubuh basah menguras mana! −${DBF_WET} MP.`;
    }
    dbf.t--;
    if (dbf.t <= 0) {
      clearDbf();
      t += ` Efek ${DB[k].n} hilang.`;
    }
    return t;
  };

  {
    // 1) tandai bahwa musuh elemen baru saja menyerang
    const _et = enemyTurn;
    enemyTurn = function () {
      hitFlag = !!(S && S.e && S.e.el && DB[S.e.el]);
      _et();
    };
    // 2) saat giliran pemain dimulai lagi: jalankan efek lama, lalu coba pasang efek baru
    const _mn = menu;
    menu = function () {
      if (!hitFlag) return _mn();
      hitFlag = false;
      let msg = "";
      if (dbf) msg = tickDbf();
      const el = S.e.el,
        ch = BI.has(S.i) ? DBF_BOSS : DBF_CHANCE;
      if (Math.random() < ch) {
        applyDbf(el);
        msg = (msg ? msg + " " : "") + DB[el].on;
      }
      _mn(); // menu asli (juga memanggil bars)
      if (msg) say(msg + " Pilih aksi.");
    };
    // 3) Beku: party tidak menyerang
    const _pa = partyAttack;
    partyAttack = function (done) {
      if (dbf && dbf.k === "es" && F.party && PM.length) {
        say("Party membeku dan tidak bisa menyerang giliran ini!");
        return setTimeout(done, 700);
      }
      _pa(done);
    };
    // 4) Ramuan HP menghapus efek
    const _up = usePot;
    usePot = function () {
      const n = Pl.pot;
      _up();
      if (Pl.pot < n && dbf) {
        clearDbf();
        bars(); // segarkan HUD
        say("Kamu minum ramuan. +40 HP dan efek buruk hilang.");
      }
    };
    // 5) bersihkan efek saat battle mulai/selesai
    const _s2 = start;
    start = function (i) {
      clearDbf();
      hitFlag = false;
      _s2(i);
    };
    const _w = win;
    win = function () {
      clearDbf();
      hitFlag = false;
      _w();
    };
    const _l = lose;
    lose = function () {
      clearDbf();
      hitFlag = false;
      _l();
    };
    // 6) tampilkan efek aktif di HUD pemain (di bawah bar Mana)
    const _b2 = bars;
    bars = function () {
      _b2();
      const cb = document.querySelector("#cb");
      if (!cb) return;
      if (dbf) {
        const d = DB[dbf.k];
        cb.textContent = `${cb.textContent ? cb.textContent + " · " : ""}${d.ic} ${d.n} (${dbf.t})`;
        cb.style.color = d.col;
      } else cb.style.color = "";
    };
  }

  /* ---------- lingkaran sihir keluar dungeon ----------
     Muncul di ruang harta setelah bos dungeon kalah. Melangkah ke dalamnya = keluar ke pintu gua.
     Warna mengikuti elemen dungeon. Digambar dengan garis sederhana (lingkaran + bintang berputar). */
  {
    const _ent3 = ent;
    ent = function (e, t, bob) {
      if (!e.circle) return _ent3(e, t, bob);
      const X = e.x * 16 + 8,
        Y = e.y * 16 + OY + 8,
        col = EL[(DNG[e.dng] || {}).el || "biasa"].col,
        a = rm ? 0 : t / 500; // sudut putar (diam bila gerakan dikurangi)
      ctx.save();
      // cahaya di dasar
      ctx.globalAlpha = 0.28 + (rm ? 0 : 0.12 * Math.sin(t / 200));
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(X, Y, 8, 0, Math.PI * 2);
      ctx.fill();
      // dua cincin
      ctx.globalAlpha = 1;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      [7, 4.5].forEach((r) => {
        ctx.beginPath();
        ctx.arc(X, Y, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      // bintang segi enam: dua segitiga yang berputar
      ctx.strokeStyle = "#fff";
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
          const g = a + (k * Math.PI) / 3 + (i * 2 * Math.PI) / 3;
          ctx[i ? "lineTo" : "moveTo"](X + Math.cos(g) * 6.5, Y + Math.sin(g) * 6.5);
        }
        ctx.closePath();
        ctx.stroke();
      }
      // percikan cahaya naik ke atas
      if (!rm)
        for (let i = 0; i < 3; i++) {
          const ph = (t / 700 + i / 3) % 1;
          ctx.globalAlpha = 1 - ph;
          ctx.fillStyle = "#fff";
          ctx.fillRect(Math.round(X + Math.sin(i * 2.1) * 5), Math.round(Y + 4 - ph * 14), 1, 1);
        }
      ctx.restore();
    };

    // pesan setelah menang melawan bos dungeon, dan setelah masuk lingkaran
    const _bk = W.back;
    W.back = function (i) {
      _bk(i);
      const m = FL[mp];
      if (i !== null && m && m.d.bossIdx === i)
        say("Lingkaran sihir muncul di ruangan. Melangkahlah ke dalamnya untuk keluar dari dungeon.");
    };
    const _pc = H.portal;
    H.portal = (e) => {
      _pc(e);
      if (e.circle) say("Lingkaran sihir membawamu keluar dari dungeon.");
    };
  }

  /* ---------- MONSTER MENDEKAT (mengejar pemain) ----------
     Monster biasa di dalam dungeon mengejar pemain bila jaraknya (hitungan petak, kiri/kanan + atas/bawah)
     sudah masuk CHASE_R. Saat pemain menjauh (lewat CHASE_R + 2), monster kembali ke tempat asalnya.
     Bos tidak ikut bergerak. Monster yang menyentuh pemain langsung memulai battle.
     Atur angka di bawah ini: */
  const CHASE_R = 6, // radius mengejar (petak). Isi 0 untuk mematikan fitur ini
    CHASE_SPD = 26, // makin besar = monster makin lambat (pemain bergerak 1 petak per 8 frame)
    CHASE_GRACE = 90; // jeda aman setelah battle/masuk lantai (frame), supaya tidak langsung diserang lagi
  let chaseGrace = 0;

  // kembalikan semua monster ke posisi awal
  const homeFoes = () => {
    (EN[mp] || []).forEach((e) => {
      if (e.t === "foe" && e.hx != null) {
        e.x = e.hx;
        e.y = e.hy;
        e.ox = e.oy = 0;
        e.agro = false;
      }
    });
  };
  // bolehkah monster `self` melangkah ke petak (x, y)?
  const canGo = (x, y, self) =>
    !solid(x, y) &&
    !(x === px && y === py) &&
    !(mv && x === px + mv.dx && y === py + mv.dy) &&
    !EN[mp].some((o) => o !== self && o.x === x && o.y === y && !gone(o));

  function updChase() {
    const m = FL[mp];
    if (!m || CHASE_R <= 0) return;
    if (chaseGrace > 0) chaseGrace--;
    if (busy || UIX.open) return;
    for (const e of EN[mp]) {
      // hanya monster biasa yang masih hidup (bos tidak ada di m.foes)
      if (e.t !== "foe" || gone(e) || !m.foes.includes(e.i)) continue;
      if (e.hx == null) {
        // catat posisi asal sekali saja
        e.hx = e.x;
        e.hy = e.y;
        e.tm = 0;
        e.ox = e.oy = 0;
      }
      // efek geser halus saat melangkah
      e.ox = Math.abs(e.ox) < 0.5 ? 0 : e.ox * 0.72;
      e.oy = Math.abs(e.oy) < 0.5 ? 0 : e.oy * 0.72;
      const dx = px - e.x,
        dy = py - e.y,
        dist = Math.abs(dx) + Math.abs(dy);
      // menyentuh pemain -> battle
      if (dist <= 1 && !mv && chaseGrace <= 0) return H.foe(e);
      // mengejar (dengan sedikit "ingatan": sudah mengejar tetap lanjut sampai CHASE_R + 2)
      e.agro = dist <= CHASE_R + (e.agro ? 2 : 0);
      const tx = e.agro ? px : e.hx,
        ty = e.agro ? py : e.hy,
        ddx = tx - e.x,
        ddy = ty - e.y;
      if (!ddx && !ddy) continue; // sudah di tujuan
      if (--e.tm > 0) continue;
      e.tm = CHASE_SPD;
      // urutan arah: sumbu terjauh dulu, lalu sumbu lain, lalu menyamping (menyelip di pilar)
      const sx = Math.sign(ddx),
        sy = Math.sign(ddy),
        ord =
          Math.abs(ddx) >= Math.abs(ddy)
            ? [[sx, 0], [0, sy], [0, 1], [0, -1]]
            : [[0, sy], [sx, 0], [1, 0], [-1, 0]];
      for (const [mx, my] of ord) {
        if (!mx && !my) continue;
        if (canGo(e.x + mx, e.y + my, e)) {
          e.x += mx;
          e.y += my;
          e.ox = -mx * 16;
          e.oy = -my * 16;
          break;
        }
      }
    }
  }

  {
    // jalankan pergerakan monster tiap frame saat berada di dalam dungeon
    const _wd0 = W.draw;
    W.draw = function (t) {
      updChase();
      _wd0(t);
    };
    // setelah battle: beri jeda aman; kalau kalah/kabur monster dikembalikan ke posisi awal
    const _bk3 = W.back;
    W.back = function (i) {
      _bk3(i);
      if (FL[mp]) {
        chaseGrace = CHASE_GRACE;
        if (i === null) homeFoes();
      }
    };
    // masuk lantai: monster di posisi awal + jeda aman
    const _pr = H.portal;
    H.portal = (e) => {
      _pr(e);
      if (FL[mp]) {
        homeFoes();
        chaseGrace = CHASE_GRACE;
      }
    };
    // gambar: geser halus + tanda seru "!" di atas monster yang sedang mengejar
    const _ent4 = ent;
    ent = function (e, t, bob) {
      if (e.t !== "foe" || !(e.ox || e.oy || e.agro)) return _ent4(e, t, bob);
      ctx.save();
      ctx.translate(Math.round(e.ox || 0), Math.round(e.oy || 0));
      _ent4(e, t, bob);
      if (e.agro) {
        const X = e.x * 16,
          Y = e.y * 16 + OY - 9 + (rm ? 0 : Math.round(Math.sin(t / 120)));
        ctx.fillStyle = "#000";
        ctx.fillRect(X + 6, Y - 1, 4, 9);
        ctx.fillStyle = "#ff4d4d";
        ctx.fillRect(X + 7, Y, 2, 5);
        ctx.fillRect(X + 7, Y + 6, 2, 1);
      }
      ctx.restore();
    };
  }

  /* ---------- DROP ITEM dari monster ----------
     Setelah monster kalah, ada peluang (0..1) menjatuhkan item. Item otomatis masuk Tas.
       - Ramuan HP, Ramuan Mana, Gulungan Teleportasi (monster biasa)
       - Perlengkapan langka (hanya yang belum dimiliki)
     Monster dungeon ber-elemen peluangnya lebih besar (x DROP_EL). Bos hampir pasti menjatuhkan item
     (lihat DROP_BOSS). Ubah angka di bawah untuk mengatur peluang. */
  const DROP = { pot: 0.25, fpot: 0.15, scr: 0.05, gear: 0.04 }, // peluang monster biasa
    DROP_BOSS = { pot: 1, fpot: 0.6, scr: 0.25, gear: 0.4 }, // peluang bos
    DROP_EL = 1.3, // pengali peluang untuk monster dungeon ber-elemen
    DROP_GEAR = ["helm", "goldcape", "iron", "star"]; // perlengkapan yang bisa jatuh

  // lempar peluang: true bila berhasil
  const roll = (p, mul) => Math.random() < Math.min(1, p * mul);

  function dropItems() {
    const e = S && S.e;
    if (!e) return;
    const boss = BI.has(S.i) || S.i === 3, // bos lantai / bos dungeon / Naga asli
      T = boss ? DROP_BOSS : DROP,
      mul = e.el && !boss ? DROP_EL : 1,
      got = [];
    if (roll(T.pot, mul)) {
      Pl.pot++;
      got.push("Ramuan HP");
    }
    if (roll(T.fpot, mul)) {
      Pl.fpot++;
      got.push("Ramuan Mana");
    }
    if (roll(T.scr, mul)) {
      Pl.scr = (Pl.scr | 0) + 1;
      got.push("Gulungan Teleportasi");
    }
    if (roll(T.gear, mul)) {
      const left = DROP_GEAR.filter((k) => !Pl.own[k]); // hanya yang belum dimiliki
      if (left.length) {
        const k = left[Math.floor(Math.random() * left.length)];
        Pl.own[k] = 1;
        if (!Pl.eq[EQ[k].s]) Pl.eq[EQ[k].s] = k; // dipasang otomatis bila slotnya kosong
        applyEq();
        got.push(`${EQ[k].n} (perlengkapan langka!)`);
      }
    }
    if (!got.length) return;
    SND.sfx("chest");
    // tulis daftar item ke kartu hasil battle (di atas tombol Lanjut)
    const row = document.querySelector("#ui .card .row");
    if (row)
      row.insertAdjacentHTML(
        "beforebegin",
        `<div class="ok" style="margin-top:6px">Item jatuh: ${got.join(", ")}</div>`,
      );
  }
  {
    const _w2 = win;
    win = function () {
      _w2(); // hasil battle tampil dulu
      dropItems(); // lalu item ditambahkan
    };
  }

  /* ---------- gambar tangga ---------- */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      _ent(e, t, bob);
      if (!e.stair) return;
      const X = e.x * 16,
        Y = e.y * 16 + OY,
        dn = e.stair === "dn",
        col = EL[(DNG[e.dng] || {}).el || "biasa"].col;
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#14122a";
      ctx.fillRect(X + 1, Y + 1, 14, 14);
      for (let i = 0; i < 4; i++) {
        const k = dn ? i : 3 - i; // tangga turun menyempit ke bawah, tangga naik melebar ke bawah
        ctx.fillStyle = ["#bcb8ec", "#9a96d0", "#7a76b4", "#5a5690"][i];
        ctx.fillRect(X + 2 + k, Y + 2 + i * 3, 12 - 2 * k, 2);
      }
      ctx.fillStyle = col;
      const a = Math.round(Math.sin(t / 220) * 1);
      for (let r = 0; r < 3; r++) {
        const wd = dn ? 5 - 2 * r : 1 + 2 * r,
          yy = Y + 5 + r + (dn ? a : -a);
        ctx.fillRect(X + 8 - (wd >> 1), yy, wd, 1);
      }
    };
  }

  /* ---------- peta mini berkabut di dalam dungeon ---------- */
  {
    const _mini2 = mini2;
    const paint = (m, x, y) => {
      const c = m.g[y][x];
      m.fk.fillStyle = c === "#" || c === "Z" ? "#3a3858" : "#9a96c4";
      m.fk.fillRect(x, y, 1, 1);
    };
    mini2 = function (id) {
      const m = MP[id];
      if (!m.dng) return _mini2(id);
      const n = m.w * m.h,
        fg = (F.fog = F.fog || {});
      let s = fg[id];
      if (typeof s !== "string" || s.length !== n) {
        s = "0".repeat(n);
        fg[id] = s;
      }
      if (!m.fc) {
        const c = document.createElement("canvas");
        c.width = m.w;
        c.height = m.h;
        m.fc = c;
        m.fk = c.getContext("2d");
        m.fs = null;
      }
      if (m.fs !== s) {
        m.fk.clearRect(0, 0, m.w, m.h);
        for (let i = 0; i < n; i++)
          if (s[i] === "1") paint(m, i % m.w, (i / m.w) | 0);
        m.fs = s;
      }
      if (id === mp) {
        let a = null;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const x = px + dx,
              y = py + dy;
            if (dx * dx + dy * dy > 5 || x < 0 || y < 0 || x >= m.w || y >= m.h)
              continue;
            const i = y * m.w + x;
            if ((a || s)[i] === "0") {
              a = a || s.split("");
              a[i] = "1";
              paint(m, x, y);
            }
          }
        if (a) {
          s = a.join("");
          fg[id] = s;
          m.fs = s;
        }
      }
      return m.fc;
    };
  }

  /* ---------- gelap + peta mini ditaruh di atas kegelapan ---------- */
  {
    let pend = null;
    const _dm = drawMini;
    drawMini = function (mw, mh, CX, CY, fx, fy, t) {
      if (MP[mp].dng) {
        pend = [mw, mh, CX, CY, fx, fy, t];
        return;
      }
      _dm(mw, mh, CX, CY, fx, fy, t);
      if (mp === "O" && F.dsn) {
        const S = Math.min(1, 84 / mw),
          ox = Math.round(VW - mw * S - 4),
          oy = 4;
        ctx.globalAlpha = 1;
        DG.forEach((d) => {
          if (!F.dsn[d.id]) return;
          const X = Math.round(ox + d.ox * S) - 1,
            Y = Math.round(oy + d.oy * S) - 1;
          ctx.fillStyle = "#000";
          ctx.fillRect(X - 1, Y - 1, 5, 5);
          ctx.fillStyle = EL[d.el].col; // warna tanda = elemen dungeon
          ctx.fillRect(X, Y, 3, 3);
        });
      }
    };
    const _wd = W.draw;
    W.draw = function (t) {
      pend = null;
      _wd(t);
      const m = MP[mp];
      if (!m.dng) return;
      const mw = m.w,
        mh = m.h,
        fx = mv ? px + (mv.dx * mv.t) / 8 : px,
        fy = mv ? py + (mv.dy * mv.t) / 8 : py,
        CX =
          mw * 16 <= VW
            ? -Math.floor((VW - mw * 16) / 2)
            : clamp(Math.round(fx * 16 + 8 - VW / 2), 0, mw * 16 - VW),
        CY =
          mh * 16 + OY <= VH
            ? -Math.floor((VH - mh * 16 - OY) / 2)
            : clamp(
                Math.round(fy * 16 + OY + 8 - VH / 2),
                0,
                mh * 16 + OY - VH,
              ),
        sx = fx * 16 + 8 - CX,
        sy = fy * 16 + OY + 8 - CY;
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(${m.tint.join(",")},0.14)`;
      ctx.fillRect(0, 0, VW, VH);
      if (DARK > 0) {
        const k = Math.max(0, Math.min(1, (150 - zl) / 60)), // gelap baru penuh setelah tulisan nama wilayah lewat
          fl = rm ? 0 : 1,
          r0 = LIGHT_IN + fl * 3 * Math.sin(t / 180),
          r1 = LIGHT_OUT + fl * 4 * Math.sin(t / 230),
          gr = ctx.createRadialGradient(sx, sy, r0, sx, sy, r1);
        gr.addColorStop(0, `rgba(${m.dk},0)`);
        gr.addColorStop(1, `rgba(${m.dk},${(DARK * k).toFixed(3)})`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, VW, VH);
      }
      if (pend) _dm(...pend);
    };
  }
})();
