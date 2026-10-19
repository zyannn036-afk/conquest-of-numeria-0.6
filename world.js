/* ===== Numeria Quest — Guild, zona, quest, party, perlengkapan ===== */
var TILEX = "MCRPQUZHc,em"; // daftar petak yang digambar lewat tileX() (bisa ditambah file lain)
const OY = 2,
  F = {};
let px = 2,
  py = 4,
  face = [1, 0],
  mv = null,
  held = null,
  busy = false,
  invOpen = false,
  mp = "V",
  trail = [],
  fd = 0,
  zl = 0,
  tab = 0,
  HAT = null;
const BP = { hero: { ...SP.hero.p }, heroB: { ...SP.heroB.p } };
const mkSp = (o) => ({
  p: { ...BP.hero, ...o },
  m: SP.hero.m,
  f: SP.hero.f,
  oy: SP.hero.oy,
});
SP.euclid = mkSp({ B: "#7a5bd6", C: "#8aa0c8", S: "#e8d2b8", Y: "#fff" });
SP.toko = mkSp({ B: "#e08a2f", C: "#c0763a", Y: "#fff0c0" });
SP.fib = mkSp({ B: "#e0476a", C: "#f08ab0" });
SP.pos = mkSp({ B: "#3a6bd6", C: "#e8e8e8", Y: "#d2284d" });
SP.tetua = mkSp({
  B: "#e8e8e8",
  b: "#b0b0b0",
  h: "#fff",
  C: "#8a5a2b",
  c: "#5a3a1a",
});
SP.warga = mkSp({ B: "#3fa65a", C: "#d9a0c0" });
SP.penjaga = mkSp({
  B: "#8a8a9a",
  b: "#5a5a6a",
  h: "#b8b8c8",
  C: "#9aa3b8",
  c: "#6c748c",
  Y: "#d2284d",
});
SP.anak = mkSp({
  B: "#f0c850",
  b: "#b8902a",
  h: "#fff0a0",
  C: "#e0476a",
  c: "#9c2a46",
});
SP.kakek = mkSp({
  B: "#d8d8d8",
  b: "#a0a0a0",
  h: "#fff",
  C: "#7a5a3a",
  c: "#523a24",
});
SP.seniman = mkSp({
  B: "#3a2a2a",
  b: "#1a1010",
  h: "#6a4a4a",
  C: "#a24dff",
  c: "#6a2bb5",
  Y: "#ff9ac1",
});
SP.lyra = mkSp({
  B: "#222244",
  b: "#111133",
  C: "#2a2a5a",
  c: "#1a1a3a",
  Y: "#ffd166",
});
const PM = [
  {
    n: "Aria",
    r: "Pendekar",
    atk: 3,
    def: 0,
    sp: "m0",
    d: "Ikut menyerang tiap giliran (kekuatan +3)",
    o: { B: "#e0476a", b: "#9c2a46", h: "#f08ab0", C: "#c2504a", c: "#8e332f" },
  },
  {
    n: "Bram",
    r: "Tameng",
    atk: 0,
    def: 3,
    sp: "m1",
    d: "+3 Pertahanan · ikut menyerang",
    o: { B: "#8a8a9a", b: "#5a5a6a", h: "#b8b8c8", C: "#9aa3b8", c: "#6c748c" },
  },
  {
    n: "Cleo",
    r: "Penyihir",
    atk: 4,
    def: 0,
    sp: "m2",
    d: "Ikut menyerang tiap giliran (kekuatan +4)",
    o: { B: "#a24dff", b: "#6a2bb5", h: "#c99aff", C: "#7a5bd6", c: "#4f3a9a" },
  },
  {
    n: "Dion",
    r: "Penyembuh",
    atk: 0,
    def: 1,
    sp: "m3",
    d: "+1 Pertahanan · ikut menyerang · pulihkan 15 HP tiap menang",
    o: { B: "#f0c850", b: "#b8902a", h: "#fff0a0", C: "#e8f4ee", c: "#aac8b8" },
  },
];
PM.forEach((m) => (SP[m.sp] = mkSp(m.o)));
/* perlengkapan: s=slot (h kepala, b badan, c jubah, w senjata) */
const EQ = {
  cap: { n: "Topi Petualang", s: "h", def: 1, hat: "cap" },
  helm: { n: "Helm Besi", s: "h", def: 3, hp: 10, hat: "helm", price: 80 },
  crown: { n: "Mahkota Aksioma", s: "h", atk: 3, def: 2, mp: 15, hat: "crown" },
  leather: {
    n: "Zirah Kulit",
    s: "b",
    def: 2,
    hp: 10,
    pal: { C: "#a0703a", c: "#6b4a2a", W: "#d9a86a" },
  },
  iron: {
    n: "Zirah Besi",
    s: "b",
    def: 4,
    hp: 20,
    pal: { C: "#9aa3b8", c: "#6c748c", W: "#e6ebf5" },
    price: 120,
  },
  bluecape: {
    n: "Jubah Biru",
    s: "c",
    def: 1,
    mp: 10,
    pal: { R: "#3a6bd6", r: "#27489a" },
  },
  goldcape: {
    n: "Jubah Emas",
    s: "c",
    def: 2,
    mp: 15,
    pal: { R: "#e0b040", r: "#a67c1a" },
    price: 100,
  },
  wood: { n: "Pedang Kayu", s: "w", atk: 2, fist: "#b87a3a", sw: "#b87a3a" },
  gold: {
    n: "Pedang Emas",
    s: "w",
    atk: 4,
    pen: 4,
    fist: "#ffd166",
    sw: "#ffd166",
  },
  star: {
    n: "Pedang Bintang",
    s: "w",
    atk: 7,
    crit: 6,
    fist: "#a24dff",
    sw: "#d9a0ff",
    price: 150,
  },
};
const SI = { h: "♔", b: "▣", c: "≋", w: "✱" },
  SL = { h: "Kepala", b: "Badan", c: "Jubah", w: "Senjata" };
const st = (e) =>
  [
    e.atk ? `+${e.atk} Serangan` : "",
    e.def ? `+${e.def} Pertahanan` : "",
    e.hp ? `+${e.hp} HP` : "",
    e.mp ? `+${e.mp} Mana` : "",
    e.crit ? `+${e.crit}% Critical` : "",
    e.pen ? `+${e.pen}% Penetrasi` : "",
  ]
    .filter(Boolean)
    .join(" · ") || "Kosmetik";
const bon = (k) =>
  Object.values(Pl.eq).reduce((s, i) => s + ((i && EQ[i][k]) || 0), 0) +
  (F.party && k === "def" ? PM.reduce((s, m) => s + (m.def || 0), 0) : 0); // serangan party dihitung aktif lewat partyAttack()
function applyEq() {
  let pal = {},
    sw = "#b8863b",
    fist = "#ffd166";
  HAT = null;
  Object.values(Pl.eq)
    .filter(Boolean)
    .forEach((k) => {
      const e = EQ[k];
      if (e.pal) Object.assign(pal, e.pal);
      if (e.hat) HAT = e.hat;
      if (e.fist) {
        fist = e.fist;
        sw = e.sw;
      }
    });
  SP.hero.p = { ...BP.hero, ...pal, G: sw };
  SP.heroB.p = { ...BP.heroB, ...pal };
  globalThis.fistC = fist;
}
const HD = {
  cap: [
    [4, 0, 8, 1, "#8a5a2b"],
    [2, 1, 12, 2, "#8a5a2b"],
    [4, 1, 3, 1, "#b87a3a"],
    [2, 3, 12, 1, "#5a3a1a"],
  ],
  helm: [
    [4, 0, 8, 1, "#c4c9d8"],
    [2, 1, 12, 3, "#9aa3b8"],
    [5, 1, 2, 1, "#fff"],
    [2, 3, 12, 1, "#ffd166"],
  ],
  crown: [
    [2, 1, 1, 2, "#ffd166"],
    [5, 0, 1, 3, "#ffd166"],
    [7, 0, 2, 3, "#ffd166"],
    [10, 0, 1, 3, "#ffd166"],
    [13, 1, 1, 2, "#ffd166"],
    [2, 3, 12, 1, "#e0b040"],
    [7, 2, 2, 1, "#d2284d"],
  ],
};
function hatDraw(x, y, u, fl) {
  (HD[HAT] || []).forEach(([a, b, w, h, c]) => {
    ctx.fillStyle = c;
    ctx.fillRect(
      Math.round(x + (fl ? 16 - a - w : a) * u),
      Math.round(y + b * u),
      Math.ceil(w * u),
      Math.ceil(h * u),
    );
  });
}
/* rank */
const RK = ["E", "D", "C", "B", "A", "S", "SS", "SSS"],
  RT = [0, 40, 100, 180, 280, 400, 550, 750],
  ri = () => RT.filter((t) => F.gp >= t).length - 1,
  rk = () => RK[ri()];
const gain = (n) => {
  const o = ri();
  F.gp += n;
  return ri() > o ? `RANK NAIK ke ${rk()}!` : "";
};
/* peta */
const MN = {
    V: "Desa Satuan",
    H: "Hutan Pecahan",
    K: "Kota Bangun",
    T: "Desa Sunyi",
    D: "Dungeon Sang Nol",
    I: "Rumah Guild",
  },
  MP = {};
function mkm(id, th, r, o, W = 20, H = 11) {
  const g = [...Array(H)].map((_, y) =>
    [...Array(W)].map((_, x) =>
      x * y == 0 || x == W - 1 || y == H - 1 ? "#" : ".",
    ),
  );
  r.forEach(([c, x, y, w = 1, h = 1]) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) g[j][i] = c;
  });
  o.forEach(([x, y]) => (g[y][x] = "."));
  MP[id] = { th, w: W, h: H, g: g.map((a) => a.join("")) };
}
mkm(
  "V",
  "v",
  [
    ["T", 3, 1],
    ["w", 10, 1, 2, 2],
    ["w", 4, 2, 2, 2],
    ["B", 14, 1, 4, 3],
    ["D", 15, 3],
    ["T", 3, 6],
    ["w", 6, 8, 2, 2],
    ["T", 11, 8],
  ],
  [
    [19, 5],
    [9, 10],
  ],
);
mkm(
  "H",
  "h",
  [
    ["T", 2, 1],
    ["T", 6, 1],
    ["T", 11, 1, 2],
    ["T", 16, 2],
    ["T", 3, 3],
    ["T", 9, 3, 2],
    ["T", 14, 4],
    ["T", 3, 7],
    ["T", 12, 7],
    ["T", 6, 9],
    ["T", 11, 9],
    ["T", 16, 9],
    ["T", 18, 3],
    ["T", 1, 8],
  ],
  [
    [0, 5],
    [19, 5],
  ],
);
/* Kota Bangun: 44x32 petak. Gerbang utara (22,0), sungai di y=14..15, jembatan di x=22 dijaga Golem */
mkm(
  "K",
  "k",
  [
    /* jalan */
    ["r", 21, 1, 3, 13],
    ["r", 1, 5, 42, 2],
    ["r", 17, 9, 11, 4],
    ["r", 21, 16, 3, 13],
    ["r", 1, 20, 42, 2],
    ["r", 1, 25, 42, 2],
    ["r", 16, 22, 13, 3],
    /* jalan setapak ke pintu rumah */
    ["r", 6, 11],
    ["r", 13, 11],
    ["r", 30, 11],
    ["r", 37, 11],
    /* sungai + jembatan */
    ["w", 1, 14, 42, 2],
    ["b", 22, 14, 1, 2],
    /* rumah: utara atas */
    ["B", 2, 2, 6, 3],
    ["E", 4, 4],
    ["B", 10, 2, 5, 3],
    ["E", 12, 4],
    ["B", 26, 2, 5, 3],
    ["E", 28, 4],
    ["B", 33, 2, 6, 3],
    ["E", 35, 4],
    /* rumah: utara bawah (kantor pos di kiri) */
    ["B", 3, 8, 7, 3],
    ["E", 6, 10],
    ["B", 12, 8, 4, 3],
    ["E", 13, 10],
    ["B", 29, 8, 4, 3],
    ["E", 30, 10],
    ["B", 35, 8, 6, 3],
    ["E", 37, 10],
    /* rumah: selatan */
    ["B", 2, 17, 6, 3],
    ["E", 4, 19],
    ["B", 10, 17, 5, 3],
    ["E", 12, 19],
    ["B", 29, 17, 5, 3],
    ["E", 31, 19],
    ["B", 36, 17, 6, 3],
    ["E", 38, 19],
    ["B", 3, 22, 7, 3],
    ["E", 6, 24],
    ["B", 11, 22, 4, 3],
    ["E", 12, 24],
    ["B", 30, 22, 5, 3],
    ["E", 32, 24],
    ["B", 37, 22, 5, 3],
    ["E", 39, 24],
    /* alun-alun: air mancur, kios, patung */
    ["f", 22, 10],
    ["S", 18, 9],
    ["S", 19, 9],
    ["S", 25, 9],
    ["S", 26, 9],
    ["f", 22, 23],
    ["S", 17, 22],
    ["S", 18, 22],
    ["S", 26, 22],
    ["S", 27, 22],
    /* lampu tepi sungai */
    ["L", 5, 13],
    ["L", 11, 13],
    ["L", 19, 13],
    ["L", 25, 13],
    ["L", 33, 13],
    ["L", 39, 13],
    ["L", 8, 16],
    ["L", 19, 16],
    ["L", 25, 16],
    ["L", 35, 16],
    /* pohon */
    ["T", 17, 2],
    ["T", 19, 3],
    ["T", 24, 2],
    ["T", 41, 3],
    ["T", 9, 12],
    ["T", 16, 11],
    ["T", 33, 12],
    ["T", 41, 11],
    ["T", 4, 28],
    ["T", 7, 27],
    ["T", 10, 29],
    ["T", 14, 28],
    ["T", 17, 28],
    ["T", 27, 28],
    ["T", 30, 28],
    ["T", 34, 27],
    ["T", 37, 29],
    ["T", 40, 28],
  ],
  [[22, 0]],
  44,
  32,
);
mkm(
  "T",
  "t",
  [
    ["B", 3, 1, 3, 3],
    ["D", 18, 2],
    ["T", 12, 1],
    ["T", 17, 3],
    ["T", 3, 6],
    ["w", 14, 6],
    ["w", 14, 7, 2],
    ["B", 3, 8, 2, 2],
    ["T", 7, 9],
    ["T", 18, 8],
  ],
  [[0, 5]],
);
mkm(
  "D",
  "d",
  [
    ["T", 3, 1],
    ["T", 13, 1],
    ["T", 5, 3],
    ["T", 13, 3],
    ["T", 5, 6],
    ["T", 13, 6],
    ["T", 3, 8],
    ["T", 13, 8],
  ],
  [[9, 10]],
);
mkm(
  "I",
  "i",
  [
    ["B", 6, 3, 7, 1],
    ["T", 2, 2],
    ["T", 17, 2],
    ["T", 2, 7],
    ["T", 17, 7],
  ],
  [[9, 10]],
);
const pt = (x, y, to, tx, ty, f) => ({ t: "portal", x, y, to, tx, ty, f });
const EN = {
  V: [
    { t: "npc", id: "toko", x: 12, y: 7, sp: "toko" },
    { t: "npc", id: "fib", x: 8, y: 4, sp: "fib" },
    { t: "crystal", x: 3, y: 8 },
    { t: "foe", i: 0, x: 9, y: 6, sp: "slime" },
    { t: "chest", id: "a", x: 3, y: 9, coin: 20, fp: 1 },
    pt(19, 5, "H", 1, 5),
    pt(9, 10, "K", 22, 1, [0, 1]),
    pt(15, 3, "I", 9, 9, [0, -1]),
  ],
  H: [
    { t: "foe", i: 1, x: 11, y: 5, sp: "fox" },
    { t: "herb", id: "a", x: 5, y: 2 },
    { t: "herb", id: "b", x: 16, y: 7 },
    { t: "herb", id: "c", x: 8, y: 8 },
    { t: "chest", id: "b", x: 17, y: 2, coin: 35, po: 1 },
    pt(0, 5, "V", 18, 5, [-1, 0]),
    pt(19, 5, "T", 1, 5),
  ],
  K: [
    { t: "foe", i: 2, x: 22, y: 14, sp: "golem" },
    { t: "npc", id: "pos", x: 6, y: 11, sp: "pos" },
    { t: "npc", id: "warga", x: 19, y: 11, sp: "warga" },
    { t: "npc", id: "penjaga", x: 21, y: 13, sp: "penjaga" },
    { t: "npc", id: "anak", x: 31, y: 11, sp: "anak" },
    { t: "npc", id: "kakek", x: 19, y: 24, sp: "kakek" },
    { t: "npc", id: "seniman", x: 25, y: 24, sp: "seniman" },
    { t: "crystal", x: 26, y: 12 },
    { t: "chest", id: "c", x: 40, y: 12, coin: 40, fp: 1 },
    { t: "chest", id: "g", x: 2, y: 29, coin: 50, po: 1 },
    { t: "chest", id: "h", x: 41, y: 29, coin: 60, fp: 1 },
    pt(22, 0, "V", 9, 9, [0, -1]),
  ],
  T: [
    { t: "npc", id: "tetua", x: 6, y: 4, sp: "tetua" },
    { t: "crystal", x: 10, y: 8 },
    pt(0, 5, "H", 18, 5, [-1, 0]),
    pt(18, 2, "D", 9, 9, [0, -1]),
  ],
  D: [
    { t: "foe", i: 3, x: 9, y: 2, sp: "dragon" },
    { t: "chest", id: "e", x: 17, y: 8, coin: 80, po: 1 },
    pt(9, 10, "T", 17, 2, [-1, 0]),
  ],
  I: [
    { t: "npc", id: "euclid", x: 9, y: 2, sp: "euclid" },
    { t: "board", x: 4, y: 2 },
    { t: "npc", id: "lyra", x: 14, y: 6, sp: "lyra", on: () => F.ch2 },
    pt(9, 10, "V", 15, 4, [0, 1]),
  ],
};
const gone = (e) =>
  (e.t === "foe" && F.done[e.i]) ||
  (e.t === "herb" && F.herb[e.id]) ||
  (e.on && !e.on());
let solid = (x, y) =>
  x < 0 ||
  y < 0 ||
  x >= MP[mp].w ||
  y >= MP[mp].h ||
  "#TwBDLfSEMCRPQUZHem".includes(MP[mp].g[y][x]);
const at = (x, y) =>
  EN[mp].find((e) => e.x === x && e.y === y && !gone(e)) ||
  (mp === "O" && RV.list.find((r) => r.x === x && r.y === y));
const W = { on: false, init, back, draw: drawWorld, defeated };

/* ===== OPEN WORLD =====
   Desa Satuan, Hutan Pecahan, Desa Sunyi, dan Kota Bangun digabung jadi SATU peta besar ("O").
   Tidak ada layar loading antar wilayah. Rumah Guild & Dungeon tetap jadi interior lewat pintu. */
const OW = { V: [13, 0], H: [32, 0], T: [51, 0], K: [0, 10] }, // posisi tiap wilayah
  OWW = 71,
  OWH = 42;
let lastZ = null;
MN.O = "Dataran Numeria";
// wilayah pada petak (x,y): V/H/T/K atau "O" untuk dataran terbuka di antaranya
function reg(x, y) {
  for (const id of ["V", "H", "T", "K"]) {
    const [ox, oy] = OW[id],
      m = MP[id];
    if (x >= ox && y >= oy && x < ox + m.w && y < oy + m.h) return id;
  }
  return "O";
}
const zone = () => (mp === "O" ? reg(px, py) : mp),
  rn = () => MN[zone()];
(function buildOpenWorld() {
  const g = [],
    bm = [];
  for (let y = 0; y < OWH; y++) {
    g.push([]);
    bm.push([]);
    for (let x = 0; x < OWW; x++) {
      g[y].push((x * 13 + y * 7) % 11 === 0 && (x + y) % 3 ? "T" : "."); // pohon tersebar
      bm[y].push("h");
    }
  }
  // tempel tiap wilayah ke peta besar
  Object.entries(OW).forEach(([id, [ox, oy]]) => {
    const m = MP[id];
    m.g.forEach((row, y) =>
      [...row].forEach((c, x) => {
        g[oy + y][ox + x] = c;
        bm[oy + y][ox + x] = m.th;
      }),
    );
  });
  // buka tembok antar wilayah (hanya tepi dunia yang tetap tembok)
  for (let y = 0; y < OWH; y++)
    for (let x = 0; x < OWW; x++) {
      const edge = x == 0 || y == 0 || x == OWW - 1 || y == OWH - 1;
      if (edge) g[y][x] = "#";
      else if (g[y][x] === "#") g[y][x] = ".";
    }
  // sungai kota dilanjutkan sampai tepi dunia supaya jembatan (dan Golem) tetap satu-satunya jalan
  for (let x = 43; x < OWW - 1; x++) g[24][x] = g[25][x] = "w";
  MP.O = { th: "h", w: OWW, h: OWH, g: g.map((r) => r.join("")), bm };
  // entitas tiap wilayah dipindah sesuai posisinya
  EN.O = [];
  Object.entries(OW).forEach(([id, [ox, oy]]) =>
    EN[id].forEach((e) => {
      if (e.t === "portal" && e.to !== "I" && e.to !== "D") return; // portal antar wilayah dihapus
      EN.O.push({ ...e, x: e.x + ox, y: e.y + oy });
    }),
  );
  Object.assign(
    EN.I.find((e) => e.t === "portal"),
    { to: "O", tx: 28, ty: 4 },
  );
  Object.assign(
    EN.D.find((e) => e.t === "portal"),
    { to: "O", tx: 68, ty: 2 },
  );
})();

/* ===== NPC BARU (mengikuti sheet desain) =====
   Satu badan dasar 16x24, lalu tiap NPC beda warna + aksesori kepala (helm, tudung, topi penyihir, dll). */
const NB = [
  "................",
  "....KKKKKKKK....",
  "...KHHhHHHHHK...",
  "..KHHHHHHHHHHK..",
  "..KHSSSSSSSSHK..",
  "..KHSESSSSESHK..",
  "..KHSSSSSSSSHK..",
  "...KsSSMMSSsK...",
  "....KKsSSsKK....",
  "...KTTVVVVTTK...",
  "..KTTTVVVVTTTK..",
  ".KSTTTVVVVTTTSK.",
  ".KSTTTTVVTTTTSK.",
  ".KSTTTTVVTTTTSK.",
  "..KDDDDYYDDDDK..",
  "..KTTTTttTTTTK..",
  "..KTTTTttTTTTK..",
  "..KPPPPppPPPPK..",
  "...KPPPKKPPPK...",
  "...KPPPK.KPPPK..",
  "...KppPK.KPppK..",
  "...KOOOK.KOOOK..",
  "..KOOOOK.KOOOOK.",
  "..KKKKKK.KKKKKK.",
];
const NH = {
  // aksesori kepala: menggantikan baris 1-4 badan dasar
  helm: [
    "....KKKKKKKK....",
    "...KAXXAAAAAK...",
    "..KAAAAAAAAAAK..",
    "..KaaaaaaaaaaK..",
  ],
  hood: [
    "....KKKKKKKK....",
    "...KAAXAAAAAK...",
    "..KAAAAAAAAAAK..",
    "..KAHSSSSSSHAK..",
  ],
  scarf: [
    "....KKKKKKKK....",
    "...KAAXAAAAAK...",
    "..KAAAAAAAAAAK..",
    "..KAHHSSSSHHAK..",
  ],
  witch: [
    "......KKKK......",
    "....KAAXAAAK....",
    "..KKAAAAAAAAKK..",
    "..KHHHHHHHHHHK..",
  ],
  brim: [
    "....KKKKKKKK....",
    "...KAAAAAAAAK...",
    "..KAAAAAAAAAAK..",
    "KKKaaaaaaaaaaKKK",
  ],
};
const NP = {
  K: "#1a1420",
  H: "#6b4226",
  h: "#8a5a36",
  S: "#f1c9a5",
  s: "#d8a584",
  E: "#2a1a14",
  M: "#b5686a",
  T: "#e9dfc9",
  t: "#b8a888",
  V: "#6b4a35",
  D: "#5a3a22",
  Y: "#e2b84a",
  P: "#4a3a30",
  p: "#33281f",
  O: "#4a3326",
  A: "#b8c0d0",
  a: "#7c869c",
  X: "#ffffff",
  R: "#a8222f",
};
const mkNpc = (o, hat, cape) => {
  const m = NB.map((r) => r.split(""));
  if (NH[hat]) NH[hat].forEach((r, i) => (m[i + 1] = r.split("")));
  if (cape)
    // jubah mengintip di sisi badan
    for (let j = 10; j <= 19; j++) {
      if (m[j][0] === ".") m[j][0] = "R";
      if (m[j][15] === ".") m[j][15] = "R";
    }
  return { p: { ...NP, ...o }, m: m.map((r) => r.join("")), oy: 8 };
};
const blue = {
  A: "#2f4fa8",
  a: "#1f3578",
  X: "#8fb4ff",
  T: "#2f4fa8",
  t: "#1f3578",
  V: "#e8eef8",
  P: "#1f2a50",
  p: "#141c38",
};
Object.assign(SP, {
  pos: mkNpc({
    T: "#e8e4d8",
    t: "#b8b4a4",
    V: "#3f6b4f",
    P: "#5a4630",
    p: "#3e3022",
  }),
  warga: mkNpc({
    H: "#3a2a1c",
    h: "#5a4028",
    T: "#d8d0b8",
    V: "#4a7a4a",
    P: "#4a3a2a",
  }),
  toko: mkNpc(
    {
      A: "#efe4c8",
      a: "#c9b78f",
      X: "#fff8e8",
      T: "#f3ead8",
      V: "#7a4b2a",
      P: "#3b3030",
      p: "#2a2020",
    },
    "scarf",
  ),
  penjaga: mkNpc(
    {
      H: "#3a2a1c",
      A: "#b8c0d0",
      a: "#7c869c",
      T: "#3a5fa8",
      t: "#27407a",
      V: "#dfe6f2",
      P: "#2f3a52",
      p: "#222a3c",
      O: "#3a3a46",
    },
    "helm",
  ),
  anak: mkNpc({
    H: "#8a5a2b",
    h: "#b07a44",
    T: "#efe6cf",
    V: "#4a7a4a",
    P: "#5a6a3a",
  }),
  kakek: mkNpc({
    H: "#e6e6e6",
    h: "#ffffff",
    T: "#7a5a3a",
    t: "#523a24",
    V: "#a0804e",
    P: "#3a2a1a",
    p: "#2a1c10",
  }),
  seniman: mkNpc(
    {
      H: "#2a1c2a",
      A: "#7a3fb5",
      a: "#512a80",
      X: "#c99aff",
      T: "#a24dff",
      t: "#6a2bb5",
      V: "#ff9ac1",
      P: "#3a2a4a",
    },
    "brim",
  ),
  tetua: mkNpc(
    {
      H: "#e6e6e6",
      A: "#f4f1ea",
      a: "#cbbf9f",
      X: "#fff",
      T: "#f2eee4",
      t: "#cfc7ad",
      V: "#d8b04a",
      P: "#e8e2d0",
      p: "#c8c0a8",
      O: "#8a6a3a",
    },
    "hood",
  ),
  euclid: mkNpc(
    {
      H: "#2a2030",
      T: "#2c2c3a",
      t: "#1c1c28",
      V: "#6a5a4a",
      P: "#3a3030",
      R: "#c02535",
    },
    null,
    true,
  ),
  lyra: mkNpc({ ...blue, H: "#b9d0f0", h: "#e0eeff" }, "witch"),
  fib: mkNpc(
    { ...blue, H: "#9ab8e0", h: "#c8dcf5", A: "#3a3a9a", a: "#26266a" },
    "witch",
  ),
  m0: mkNpc(
    {
      H: "#2a2030",
      T: "#8a2a3a",
      t: "#5a1a24",
      V: "#3a3040",
      P: "#3a3030",
      R: "#c02535",
    },
    null,
    true,
  ),
  m1: mkNpc(
    {
      H: "#3a2a1c",
      A: "#9aa3b8",
      a: "#6c748c",
      T: "#4a6aa8",
      t: "#33497a",
      V: "#dfe6f2",
      P: "#2f3a52",
    },
    "helm",
  ),
  m2: mkNpc({ ...blue, H: "#c8d4f0", h: "#ffffff", A: "#3a4fb8" }, "witch"),
  m3: mkNpc(
    {
      H: "#d86a8a",
      h: "#f0a0b8",
      A: "#f4f1ea",
      a: "#cbbf9f",
      T: "#f2eee4",
      t: "#cfc7ad",
      V: "#d8b04a",
      P: "#e8e2d0",
      p: "#c8c0a8",
    },
    "scarf",
  ),
});

/* ===== KARAKTER BARU: pendekar rambut perak, jubah hitam-merah, pedang ===== */
(function newHero() {
  const P = {
    K: "#140f1c",
    H: "#dedaf0",
    h: "#ffffff",
    j: "#a39dc6",
    S: "#f3d6c4",
    s: "#d9b09c",
    E: "#e2223c",
    M: "#b5686a",
    C: "#2a2433",
    c: "#15111c",
    W: "#d7d1e0",
    D: "#5a2a2e",
    Y: "#e2b84a",
    A: "#8f95aa",
    a: "#5d6278",
    R: "#1f1a26",
    r: "#b3202f",
    G: "#b88a3c",
    B: "#e3e7f2",
    b: "#c0243a",
  };
  const m = [
    "...K..KK..K.....",
    "..KHKKHHKKHK....",
    ".KHHHhHHHHhHHK..",
    ".KHhHHHHHHHHjK..",
    ".KHHHHHHHHHHHjK.",
    ".KHjSSSSSSSSjHK.",
    ".KHSSESSSSESSHK.",
    "..KHSSSSSSSSHK..",
    "...KsSSMMSSsK...",
    "....KKsSSsKK....",
    "..KCcrWWWWrcCK..",
    ".KAACCCWWCCCAAK.",
    "KRAaCCCWWCCCaAK.",
    "KRcCCCDWWDCCcKGG",
    "KRcCCCCDDCCCCcBb",
    "KrRCCCCDDCCCCcBb",
    "KrRDDDDYYDDDDKBb",
    ".KrCCCCccCCCCKBb",
    ".KrRCCCccCCCCKBb",
    "..KRCCCKKCCCcKBb",
    "...KccK..KccKKBb",
    "...KccK..KccK.Bb",
    "..KAAAK..KAAAKBb",
    "..KKKKK..KKKKK.K",
  ];
  const f = [
    0,
    [
      "..KccK...KccK.Bb",
      "..KccK...KcK..Bb",
      ".KAAAK...KAAK.Bb",
      ".KKKKK...KKKK.Kb",
    ],
    [
      "..KccK..KccK..Bb",
      "...KcK..KccK..Bb",
      "...KAAK.KAAAK.Bb",
      "...KKKK.KKKKK.Kb",
    ],
  ];
  SP.hero = { p: { ...P }, m, f, oy: 8 };
  // versi battle: tanpa pedang di matriks (pedang digambar mengikuti animasi serangan)
  SP.heroB = {
    p: { ...P },
    m: m.map((r, j) => (j >= 13 ? r.slice(0, 14) + "K." : r)),
    oy: 0,
  };
  BP.hero = { ...P };
  BP.heroB = { ...P };
})();
/* quest */
const QS = [
  {
    id: "slime",
    n: "Slime di Desa",
    d: "Kalahkan Slime Retak di Desa Satuan.",
    gp: 20,
    coin: 25,
    it: "cap",
    chk: () => F.done[0],
    pr: () => "Slime belum dikalahkan",
  },
  {
    id: "herb",
    n: "Herba Hutan",
    d: "Petik 3 Herba di Hutan Pecahan.",
    gp: 20,
    coin: 30,
    it: "bluecape",
    chk: () => F.hc >= 3,
    pr: () => `Herba ${F.hc}/3`,
  },
  {
    id: "fox",
    n: "Rubah Pecah-Pecah",
    d: "Kalahkan Rubah di Hutan Pecahan.",
    gp: 30,
    coin: 40,
    it: "wood",
    chk: () => F.done[1],
    pr: () => "Rubah belum dikalahkan",
  },
  {
    id: "surat",
    n: "Antar Surat",
    d: "Ambil surat di Kota Bangun, antar ke Tetua Desa Sunyi.",
    gp: 30,
    coin: 40,
    it: "leather",
    chk: () => F.deliv,
    pr: () => (F.surat ? "Antar ke Desa Sunyi" : "Cari Petugas Pos di Kota"),
  },
  {
    id: "golem",
    n: "Jembatan Kota",
    d: "Kalahkan Golem di jembatan Kota Bangun.",
    gp: 40,
    coin: 60,
    it: "gold",
    chk: () => F.done[2],
    pr: () => "Golem belum dikalahkan",
  },
  {
    id: "naga",
    n: "Naga Parabola",
    d: "Kalahkan Naga di Dungeon Sang Nol. Berbahaya!",
    gp: 80,
    coin: 120,
    it: "crown",
    chk: () => F.done[3],
    pr: () => "Naga belum dikalahkan",
  },
];
const claimed = () => QS.filter((q) => F.q[q.id] === 3).length;
function board() {
  if (!busy) SND.sfx("bag");
  busy = true;
  say("Papan Quest Guild.");
  ui(
    `<div class="card"><b class="ok">Papan Quest</b> <span class="qm">Selesai ${claimed()}/5 (minimal untuk Chapter 1)</span>${QS.filter(
      (q) => !q.on || q.on(),
    )
      .map((q) => {
        const s = F.q[q.id] || 0,
          e = EQ[q.it];
        return `<div class="irow"><div><b>${q.n}</b> ${s == 3 ? '<span class="ok">✔</span>' : ""}<br><small>${q.d}<br>Hadiah: ${q.coin} koin · ${e.n} · ${q.gp} GP</small></div>${s == 0 ? `<button class="b" data-a="${q.id}">Ambil</button>` : s == 1 ? (q.chk() ? `<button class="b" data-c="${q.id}">Klaim</button>` : `<small>${q.pr()}</small>`) : ""}</div>`;
      })
      .join("")}${
      F.party
        ? `<div class="qm" style="margin:8px 0 4px">Misi Party (bisa diulang, naikkan rank)</div><div class="row">${E.slice(
            0,
            4,
          )
            .map(
              (e, i) =>
                `<button class="b" data-h="${i}">${e.n.split(" ")[0]} +${[15, 25, 40, 90][i]} GP</button>`,
            )
            .join("")}</div>`
        : ""
    }<div class="row" style="margin-top:8px"><button class="b g" id="bx">Tutup</button></div></div>`,
  );
  document.querySelectorAll("[data-a]").forEach(
    (b) =>
      (b.onclick = () => {
        F.q[b.dataset.a] = 1;
        board();
      }),
  );
  document
    .querySelectorAll("[data-c]")
    .forEach((b) => (b.onclick = () => claim(b.dataset.c)));
  document.querySelectorAll("[data-h]").forEach(
    (b) =>
      (b.onclick = () => {
        F.hunt = 1;
        busy = false;
        W.on = false;
        start(+b.dataset.h);
      }),
  );
  $("#bx").onclick = idle;
}
function claim(id) {
  const q = QS.find((x) => x.id === id),
    e = EQ[q.it];
  F.q[id] = 3;
  SND.sfx("quest");
  Pl.coin += q.coin;
  Pl.own[q.it] = 1;
  if (!Pl.eq[e.s]) Pl.eq[e.s] = q.it;
  applyEq();
  const r = gain(q.gp);
  hud();
  const L = [
    `Quest "${q.n}" selesai! +${q.coin} koin, +${q.gp} GP.`,
    `Hadiah: ${e.n} (${st(e)}). Dipasang otomatis jika slotnya kosong, cek di Tas.`,
  ];
  if (r) L.push(r);
  dlg("Resepsionis Guild", L, () =>
    claimed() >= 5 && !F.ch1 ? ch1() : board(),
  );
}
function ch1() {
  SND.sfx("win");
  F.ch1 = 1;
  F.ch2 = 1;
  dlg(
    "Guildmaster Euclid",
    [
      "Lima quest selesai! Kamu resmi menjadi Penjaga Guild Rank E.",
      'Dari bayangan terdengar suara Sang Nol: "Kamu baru menyentuh permukaan. Kristal terakhir ada di Jurang Tak Hingga."',
      "Seorang utusan Serikat Pelita baru tiba di aula guild. Temui dia!",
    ],
    () => {
      const rows = Object.entries(ST)
        .map(
          ([k, v]) =>
            `<div>${TN[k]}: ${v.ok}/${v.n} benar (${Math.round((v.ok / v.n) * 100)}%)</div>`,
        )
        .join("");
      hud();
      ui(
        `<div class="card"><b class="ok">Chapter 1 selesai!</b> Level ${Pl.lv} · Combo terpanjang ×${Pl.max}<div style="margin:8px 0">${rows}</div><div class="row"><button class="b" id="ex">Mulai Chapter 2</button></div></div>`,
      );
      say("Chapter 2: Serikat Pelita.");
      $("#ex").onclick = idle;
    },
  );
}
/* dunia */
function hud() {
  $("#pn").textContent =
    `${JOB().n} Lv${Pl.lv} — HP ${Pl.hp}/${mhp()}, Mana ${Pl.fp}/${mmp()}`;
  $("#php").style.width = (Pl.hp / mhp()) * 100 + "%";
  $("#pfp").style.width = (Pl.fp / mmp()) * 100 + "%";
  $("#cb").textContent =
    `Koin ${Pl.coin} · XP ${Pl.xp}/${Pl.lv * 30} · Ramuan ${Pl.pot}`;
  $("#chp").textContent = `RPG · Chapter ${F.ch2 ? 2 : 1}`;
  const i = ri(),
    nx = RT[i + 1],
    pr = nx ? ((F.gp - RT[i]) / (nx - RT[i])) * 100 : 100;
  $("#en").textContent = F.party
    ? `Party Rank ${rk()} · ${F.gp} GP`
    : `Guild Rank ${rk()} · ${rn()}`;
  $("#ehp").style.width =
    (F.party ? pr : (Math.min(5, claimed()) / 5) * 100) + "%";
  $("#ch").textContent = F.party
    ? `Party ${PM.length + 1}/5 · ${rn()}`
    : `Quest selesai ${claimed()}/5`;
}
function idle() {
  busy = false;
  invOpen = false;
  hud();
  ui(`<div class="card hint"><span class="qm">${UIX.hint()}</span></div>`);
}
function dlg(who, lines, cb) {
  busy = true;
  let i = 0;
  const show = () => {
    SND.sfx("talk");
    say(who + " berbicara...");
    ui(
      `<div class="card"><b class="ok">${who}</b><div style="margin:6px 0 10px">${lines[i]}</div><div class="row"><button class="b" id="dn">${i < lines.length - 1 ? "Lanjut" : "Tutup"}</button></div></div>`,
    );
    const b = $("#dn");
    b.onclick = () => {
      if (++i < lines.length) show();
      else {
        busy = false;
        cb ? cb() : idle();
      }
    };
    b.focus();
  };
  show();
}
function go(e) {
  mp = e.to;
  px = e.tx;
  py = e.ty;
  face = e.f || [1, 0];
  mv = null;
  held = null;
  trail = [0, 1, 2, 3].map(() => [px, py]);
  fd = 12;
  zl = 150;
  SND.sfx("portal");
  SND.music(zone());
  hud();
  say(`Kamu tiba di ${rn()}.`);
}
function step(dx, dy) {
  if (mv || busy) return;
  face = [dx, dy];
  const tx = px + dx,
    ty = py + dy,
    e = at(tx, ty);
  if (e) {
    if (e.t === "foe" || e.t === "roam") act();
    else if (e.t === "portal") H.portal(e);
    else SND.sfx("bump");
    return;
  }
  if (solid(tx, ty)) return SND.sfx("bump");
  mv = { dx, dy, t: 0 };
}
function act() {
  if (busy || mv) return;
  document.activeElement?.blur?.();
  const e = at(px + face[0], py + face[1]);
  if (e) H[e.t](e);
  else if (MP[mp].g[py + face[1]]?.[px + face[0]] === "E")
    dlg("Rumah Warga", [
      "Pintunya terkunci. Sepertinya penghuninya sedang pergi.",
    ]);
}
const H = {
  npc: (e) => N[e.id](),
  portal: go,
  board,
  crystal: () => {
    SND.sfx("crystal");
    Pl.hp = mhp();
    Pl.fp = Math.max(Pl.fp, Math.round(mmp() / 2));
    hud();
    dlg("Kristal Simpan", ["Cahaya hangat memulihkan HP dan Manamu."]);
  },
  herb: (e) => {
    F.herb[e.id] = 1;
    F.hc++;
    SND.sfx("herb");
    dlg("Herba", [`Kamu memetik Herba Penyembuh (${F.hc}/3).`]);
  },
  chest: (e) => {
    if (F.chest[e.id]) return dlg("Peti", ["Peti ini sudah kosong."]);
    F.chest[e.id] = 1;
    SND.sfx("chest");
    Pl.coin += e.coin;
    const L = [`Kamu menemukan ${e.coin} koin!`];
    if (e.fp) {
      Pl.fpot++;
      L.push("Ada Ramuan Mana! Masuk ke Tas.");
    }
    if (e.po) {
      Pl.pot++;
      L.push("Ada Ramuan HP! Masuk ke Tas.");
    }
    dlg("Peti", L);
  },
  foe: (e) => {
    W.on = false;
    start(e.i);
  },
};
const N = {
  euclid: () => {
    const n = claimed();
    if (!F.met) {
      F.met = 1;
      return dlg("Guildmaster Euclid", [
        "Selamat datang di Guild Penjaga Angka. Sang Nol memecahkan Kristal Aksioma, dan hitungan di Numeria jadi kacau.",
        "Papan quest ada di sisi kiri ruangan. Ambil misi, kerjakan di desa, hutan, kota, desa terpencil, atau dungeon, lalu klaim hadiahnya di papan.",
        "Selesaikan minimal 5 quest untuk membuktikan dirimu. Kristal bercahaya di desa memulihkanmu gratis.",
      ]);
    }
    if (n >= 5 && !F.ch1) return ch1();
    dlg("Guildmaster Euclid", [
      F.ch2
        ? `Serikat Pelita mencarimu. Rank kita sekarang ${rk()}, jaga nama baik Guild!`
        : `Kamu sudah menyelesaikan ${n}/5 quest.${n < 5 ? " Teruslah bekerja!" : ""}`,
    ]);
  },
  lyra: () => {
    if (F.party)
      return dlg("Kapten Lyra", [
        `Party kita Rank ${rk()} (${F.gp} GP). Ambil Misi Party di papan quest untuk naik rank.`,
        "Urutan rank: E, D, C, B, A, S, SS, lalu SSS.",
      ]);
    dlg(
      "Kapten Lyra",
      [
        "Aku Lyra dari Serikat Pelita. Kabar tentangmu sampai ke kami.",
        "Kami butuh Penjaga Angka untuk memimpin party berisi lima orang. Kenalkan: Aria si pendekar, Bram sang tameng, Cleo si penyihir, dan Dion si penyembuh.",
        "Party baru mulai dari Rank E. Selesaikan misi party sampai kita mencapai SSS!",
      ],
      () => {
        F.party = 1;
        SND.sfx("quest");
        trail = [0, 1, 2, 3].map(() => [px, py]);
        hud();
        inv(2);
      },
    );
  },
  fib: () =>
    dlg("Nona Fibonacci", [
      P([
        "Jawab cepat memberi damage ekstra, tapi akurat lebih penting.",
        "Setiap musuh punya kelemahan topik: Slime–aritmetika, Rubah–pecahan, Golem–geometri, Naga–aljabar.",
        "Perlengkapan yang kamu pasang di Tas terlihat di karaktermu, dan menambah Serangan atau Pertahanan.",
        "Combo beruntun menambah damage sampai +50%.",
      ]),
    ]),
  pos: () => {
    if (F.deliv)
      return dlg("Petugas Pos", ["Terima kasih sudah mengantar suratnya!"]);
    if (!F.surat) {
      F.surat = 1;
      return dlg("Petugas Pos", [
        'Ada surat untuk Tetua di Desa Sunyi, tapi jalannya jauh. Bisa kamu antarkan? (ambil quest "Antar Surat" di papan guild)',
        "Kamu menerima Surat Tetua.",
      ]);
    }
    dlg("Petugas Pos", [
      "Surat itu untuk Tetua di Desa Sunyi, timur Hutan Pecahan.",
    ]);
  },
  tetua: () => {
    if (F.surat && !F.deliv) {
      F.deliv = 1;
      return dlg("Tetua Desa Sunyi", [
        "Surat dari kota! Terima kasih, anak muda.",
        "Hati-hati: gua di timur laut desa ini adalah Dungeon Sang Nol.",
      ]);
    }
    dlg("Tetua Desa Sunyi", [
      "Desa kami terpencil dan tenang. Sudah lama tidak ada petualang yang mampir.",
    ]);
  },
  warga: () =>
    dlg("Warga Kota", [
      "Golem di jembatan itu mengganggu pedagang. Semoga ada petualang yang berani!",
    ]),
  toko: () => shop(),
  penjaga: () =>
    dlg("Penjaga Kota", [
      F.done[2]
        ? "Jembatan sudah aman berkat kamu. Silakan jelajahi sisi selatan kota!"
        : "Berhenti! Jembatan ke sisi selatan dijaga Golem Segi Banyak. Bawa ramuan sebelum menyeberang.",
    ]),
  anak: () =>
    dlg("Anak Kota", [
      "Kak, kota ini luas banget! Kantor pos ada di kiri, alun-alun di tengah.",
      F.done[2]
        ? "Wah, Golemnya kalah! Kakak keren!"
        : "Golem di jembatan itu lemah terhadap geometri, kata Kakekku.",
    ]),
  kakek: () =>
    dlg("Kakek Penjual Peta", [
      "Dulu seluruh jembatan Kota Bangun lurus dan rapi, sampai Sang Nol memecahkan Kristal Aksioma.",
      "Peti-peti harta tersembunyi di sudut kota. Coba cari di pojok selatan dan timur!",
    ]),
  seniman: () =>
    dlg("Seniman Jalanan", [
      "Lihat patung ini! Setiap sisinya melambangkan bentuk geometri.",
      "Segitiga, persegi, lingkaran... semuanya ada di kota ini.",
    ]),
};
const IT = [
  ["Ramuan HP (+40 HP)", 15, () => Pl.pot++],
  ["Ramuan Mana (+40 Mana)", 20, () => Pl.fpot++],
  ["Batu Petunjuk (+1 petunjuk tiap battle)", 40, () => Pl.hb++],
  [
    "Pena Tajam (+3 damage)",
    60,
    () => {
      Pl.atk += 3;
      Pl.pn++;
    },
  ],
  ...["helm", "goldcape", "iron", "star"].map((k) => [
    `${EQ[k].n} (${st(EQ[k])})`,
    EQ[k].price,
    () => (Pl.own[k] = 1),
    () => Pl.own[k],
  ]),
];
function shop() {
  busy = true;
  say("Pedagang Kuno menggelar dagangannya.");
  ui(
    `<div class="card"><b class="ok">Pedagang Kuno</b> <span class="qm">Koin: ${Pl.coin}</span><div style="display:grid;gap:8px;margin:8px 0">${IT.map((t, i) => `<button class="b" data-b="${i}" ${Pl.coin < t[1] || (t[3] && t[3]()) ? "disabled" : ""}>${t[0]} — ${t[3] && t[3]() ? "dimiliki" : t[1] + " koin"}</button>`).join("")}</div><button class="b g" id="sc">Tutup</button></div>`,
  );
  document.querySelectorAll("[data-b]").forEach(
    (b) =>
      (b.onclick = () => {
        const t = IT[b.dataset.b];
        SND.sfx("coin");
        Pl.coin -= t[1];
        t[2]();
        hud();
        shop();
      }),
  );
  $("#sc").onclick = idle;
}
/* tas & karakter */
const ITM = [
  [
    "pot",
    "Ramuan HP",
    "♥",
    "#d2284d",
    "Pulihkan 40 HP.",
    () => {
      if (Pl.hp >= mhp()) return "HP sudah penuh.";
      Pl.pot--;
      Pl.hp = Math.min(mhp(), Pl.hp + 40);
      return "+40 HP";
    },
  ],
  [
    "fpot",
    "Ramuan Mana",
    "◆",
    "#b87800",
    "Pulihkan 40 Mana. Di battle tanpa memakai giliran.",
    () => {
      if (Pl.fp >= mmp()) return "Mana sudah penuh.";
      Pl.fpot--;
      Pl.fp = Math.min(mmp(), Pl.fp + 40);
      return "+40 Mana";
    },
  ],
  ["hb", "Batu Petunjuk", "?", "#4b3fd1", "Pasif: +1 petunjuk tiap battle."],
  ["pn", "Pena Tajam", "✎", "#0f9d74", "Pasif: +3 damage tiap buah."],
];
function inv(tb) {
  if (!invOpen) SND.sfx("bag");
  if (tb !== undefined) tab = tb;
  busy = true;
  invOpen = true;
  say("Tas & perlengkapan.");
  const own = Object.keys(Pl.own).filter((k) => Pl.own[k]),
    tn = ["Item", "Equip", "Status", "Job"].concat(F.ch2 ? ["Party"] : []);
  let b = "";
  if (tab == 0)
    b =
      ITM.map(([k, n, ic, c, d, u]) => {
        const q = Pl[k] || 0;
        return `<div class="irow" style="${q ? "" : "opacity:.45"}"><span class="ic" style="color:${c}">${ic}</span><div><b>${n} ×${q}</b><br><small>${d}</small></div>${u && q ? `<button class="b" data-u="${k}">Pakai</button>` : ""}</div>`;
      }).join("") +
      (F.surat && !F.deliv
        ? '<div class="irow"><span class="ic">✉</span><div><b>Surat Tetua</b><br><small>Barang quest: antar ke Desa Sunyi.</small></div></div>'
        : "") +
      (F.hc && !F.herb.x
        ? `<div class="irow"><span class="ic" style="color:#0f9d74">✿</span><div><b>Herba ×${F.hc}</b><br><small>Barang quest Herba Hutan.</small></div></div>`
        : "");
  else if (tab == 1)
    b = own.length
      ? own
          .map((k) => {
            const e = EQ[k],
              on = Pl.eq[e.s] === k;
            return `<div class="irow"><span class="ic">${SI[e.s]}</span><div><b>${e.n}</b> ${on ? '<span class="ok">terpasang</span>' : ""}<br><small>${SL[e.s]} · ${st(e)}</small></div><button class="b ${on ? "g" : ""}" data-e="${k}">${on ? "Lepas" : "Pasang"}</button></div>`;
          })
          .join("")
      : '<div class="qm">Belum punya perlengkapan. Selesaikan quest atau belanja di toko.</div>';
  else if (tab == 2) b = statTab();
  else if (tab == 3) b = jobTab();
  else b = partyTab();
  ui(
    `<div class="card"><div class="ihd"><canvas id="pv" class="pv" width="84" height="84"></canvas><div><b class="ok">Karakter · ${JOB().n}</b><div class="qm">Lv${Pl.lv} · HP ${Pl.hp}/${mhp()} · Mana ${Pl.fp}/${mmp()} · Kekuatan ${pwr()}<br>Critical ${pc(critC())}% · Penetrasi ${pc(penC())}% · Pertahanan +${bon("def")}${Pl.sp ? ` · <b class="ok">Poin status ${Pl.sp}</b>` : ""}<br>${F.party ? "Party" : "Guild"} Rank ${rk()} · ${F.gp} GP<br>Koin ${Pl.coin} · Combo maks ×${Pl.max}</div></div></div><div class="row" style="margin:8px 0">${tn.map((t, i) => `<button class="b ${i == tab ? "" : "g"}" data-t="${i}">${t}</button>`).join("")}</div>${b}<div class="row" style="margin-top:8px"><button class="b g" id="ix">Tutup [I]</button></div></div>`,
  );
  const pv = $("#pv");
  if (pv) {
    const o = ctx;
    ctx = pv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    heroB(6, 8, 0, null);
    ctx = o;
  }
  document
    .querySelectorAll("[data-t]")
    .forEach((x) => (x.onclick = () => inv(+x.dataset.t)));
  document.querySelectorAll("[data-s]").forEach(
    (x) =>
      (x.onclick = () => {
        statUp(x.dataset.s);
        SND.sfx("equip");
        hud();
        inv();
      }),
  );
  jobPreviews();
  document.querySelectorAll("[data-j]").forEach((x) => (x.onclick = () => changeJob(x.dataset.j)));
  document
    .querySelectorAll("[data-k]")
    .forEach((x) => (x.onclick = () => kickMember(+x.dataset.k)));
  document.querySelectorAll("[data-e]").forEach(
    (x) =>
      (x.onclick = () => {
        const k = x.dataset.e,
          s = EQ[k].s;
        Pl.eq[s] = Pl.eq[s] === k ? null : k;
        SND.sfx("equip");
        applyEq();
        inv();
      }),
  );
  document.querySelectorAll("[data-u]").forEach(
    (x) =>
      (x.onclick = () => {
        const m = ITM.find((i) => i[0] === x.dataset.u)[5]();
        SND.sfx("potion");
        hud();
        inv();
        say(m);
      }),
  );
  $("#ix").onclick = idle;
}
function useF() {
  SND.sfx("potion");
  Pl.fpot--;
  Pl.fp = Math.min(mmp(), Pl.fp + 40);
  flo("+40 MP", "h", "#ffd166");
  bars();
  say("Ramuan Mana diminum. +40 Mana.");
  lockPad(false);
  renderPad();
}
function usePot() {
  SND.sfx("potion");
  Pl.pot--;
  Pl.hp = Math.min(mhp(), Pl.hp + 40);
  flo("+40 HP", "h", "#7ef0c8");
  bars();
  say("Kamu minum ramuan. +40 HP.");
  lockPad(false);
  renderPad();
}
function defeated(i) {
  F.done[i] = 1;
  {
    const h = PM.reduce((t, m) => t + (m.heal || 0), 0); // tabib di party memulihkan HP tiap menang
    if (h) Pl.hp = Math.min(mhp(), Pl.hp + h);
  }
}
function back(i) {
  W.on = true;
  mode = "world";
  Pl.combo = 0;
  mv = null;
  held = null;
  SND.music(zone());
  let m = i === null ? "Kamu kembali ke peta." : "Pertarungan selesai.";
  if (F.hunt) {
    if (i !== null) {
      const g = [15, 25, 40, 90][i],
        r = gain(g);
      m = `Misi party selesai! +${g} GP. ${r}`;
    }
    F.hunt = 0;
  }
  idle();
  say(m);
}
function init() {
  Object.keys(F).forEach((k) => delete F[k]);
  Object.assign(F, {
    done: {},
    chest: {},
    q: {},
    herb: {},
    hc: 0,
    gp: 0,
    ch1: 0,
    ch2: 0,
    party: 0,
    pm: [],
    lyra: 0,
    hunt: 0,
    surat: 0,
    deliv: 0,
    met: 0,
  });
  mp = "O";
  px = 15;
  py = 4;
  face = [1, 0];
  mv = null;
  held = null;
  trail = [0, 1, 2, 3].map(() => [px, py]);
  fd = 0;
  zl = 150;
  W.on = true;
  mode = "world";
  E.forEach((e, i) => {
    if (i < 4) {
      e.xp = [12, 20, 32, 70][i];
      e.coin = [10, 18, 30, 60][i];
    }
  });
  applyEq();
  SND.music(zone());
  idle();
  say(
    "Desa Satuan. Rumah Guild ada di kanan atas: masuk lewat pintunya dan temui Guildmaster.",
  );
}
/* ---------- gambar peta ---------- */
const TH = {
  v: {
    a: "#3f8f4e",
    b: "#3a8548",
    w: "#1f5a33",
    w2: "#2f7a45",
    t: "#2f9e57",
    t2: "#5fd078",
  },
  h: {
    a: "#2c6a3c",
    b: "#276235",
    w: "#12301e",
    w2: "#1c4a2c",
    t: "#1d6e3a",
    t2: "#3fa65a",
  },
  k: {
    a: "#8d8aa8",
    b: "#85829f",
    w: "#4a4868",
    w2: "#5c5a7c",
    t: "#2f9e57",
    t2: "#5fd078",
  },
  t: {
    a: "#c9a86a",
    b: "#c0a062",
    w: "#6b5030",
    w2: "#8a6a40",
    t: "#6e8f3a",
    t2: "#9cc85a",
  },
  d: {
    a: "#2a2640",
    b: "#262238",
    w: "#120f22",
    w2: "#1c1832",
    t: "#6d6a88",
    t2: "#9a97b8",
  },
  i: {
    a: "#a8743c",
    b: "#9c6a36",
    w: "#4a2f18",
    w2: "#6b4524",
    t: "#6d6a88",
    t2: "#9a97b8",
  },
};
function mark(e, X, Y, bob, up = 0) {
  Y -= up;
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";
  ctx.strokeText("!", X + 8, Y - 2 + bob);
  ctx.fillStyle = "#ffd166";
  ctx.fillText("!", X + 8, Y - 2 + bob);
}
function ent(e, t, bob) {
  const X = e.x * 16,
    Y = e.y * 16 + OY;
  if (e.t === "portal") {
    if (MP[mp].g[e.y][e.x] !== "D") {
      ctx.globalAlpha = 0.12 + 0.1 * Math.sin(t / 250);
      ctx.fillStyle = "#fff";
      ctx.fillRect(X, Y, 16, 16);
      ctx.globalAlpha = 1;
    } else if (mp === "O" && e.to === "I" && !F.met) mark(e, X, Y, bob);
    return;
  }
  if (e.t === "crystal") {
    const cx = X + 8,
      cy = Y + 8 + bob;
    ctx.fillStyle = "#7ef0c8";
    ctx.fillRect(cx - 1, cy - 6, 2, 12);
    ctx.fillRect(cx - 3, cy - 4, 6, 8);
    ctx.fillRect(cx - 5, cy - 2, 10, 4);
    ctx.fillStyle = "#d9fff2";
    ctx.fillRect(cx - 1, cy - 4, 2, 3);
    return;
  }
  if (e.t === "chest") {
    const o = F.chest[e.id];
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(X + 2, Y + 6, 12, 9);
    ctx.fillStyle = "#b87a3a";
    ctx.fillRect(X + 2, o ? Y + 2 : Y + 4, 12, o ? 3 : 4);
    if (o) {
      ctx.fillStyle = "#2b1608";
      ctx.fillRect(X + 3, Y + 7, 10, 5);
    } else {
      ctx.fillStyle = "#ffd166";
      ctx.fillRect(X + 7, Y + 8, 2, 3);
    }
    return;
  }
  if (e.t === "herb") {
    ctx.fillStyle = "#1f7a41";
    ctx.fillRect(X + 4, Y + 9, 8, 5);
    ctx.fillRect(X + 7, Y + 5, 2, 5);
    ctx.fillStyle = "#5fd078";
    ctx.fillRect(X + 3, Y + 7, 4, 3);
    ctx.fillRect(X + 9, Y + 6, 4, 3);
    ctx.fillStyle = "#fff";
    ctx.fillRect(X + 7, Y + 4, 2, 2);
    return;
  }
  if (e.t === "board") {
    ctx.fillStyle = "#4a2f18";
    ctx.fillRect(X + 1, Y + 1, 14, 13);
    ctx.fillStyle = "#b87a3a";
    ctx.fillRect(X + 2, Y + 2, 12, 11);
    ctx.fillStyle = "#f4ecd0";
    ctx.fillRect(X + 3, Y + 3, 4, 5);
    ctx.fillRect(X + 8, Y + 4, 4, 4);
    ctx.fillRect(X + 4, Y + 9, 6, 3);
    ctx.fillStyle = "#d2284d";
    ctx.fillRect(X + 5, Y + 3, 1, 1);
    if (
      QS.some(
        (q) => (!q.on || q.on()) && (!F.q[q.id] || (F.q[q.id] == 1 && q.chk())),
      )
    )
      mark(e, X, Y, bob);
    return;
  }
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 0.3;
  ctx.fillRect(X + 3, Y + 14, 10, 2);
  ctx.globalAlpha = 1;
  const so = SP[e.sp],
    fm =
      e.t === "foe" && so.a && !rm
        ? so.a[(Math.floor(t / 420) + e.x) % 2]
        : null;
  spr(e.sp, X, Y + (e.t === "foe" ? bob : 0), 1, 1, null, 0, 0, fm);
  if (
    (e.id === "euclid" && (!F.met || (claimed() >= 5 && !F.ch1))) ||
    (e.id === "lyra" && !F.lyra)
  )
    mark(e, X, Y, bob, 8);
}
function mini(id) {
  const m = MP[id];
  if (m.mc) return m.mc;
  const c = document.createElement("canvas"),
    k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d"),
    col = {
      "#": "#4a4868",
      w: "#2a6fd6",
      B: "#b8472f",
      E: "#6b3a1c",
      T: "#2f9e57",
      r: "#a8a5c8",
      b: "#c28a4a",
      L: "#ffd166",
      f: "#5aa8ff",
      S: "#d2284d",
    };
  m.g.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      k.fillStyle = col[ch] || "#3d3a5c";
      k.fillRect(x, y, 1, 1);
    }),
  );
  return (m.mc = c);
}
function drawWorld(t) {
  // jalan DULU sebelum mengambil data peta. Kalau langkah ini pindah peta (mis. keluar guild
  // sambil menahan tombol), data peta di bawah tidak jadi basi dan layar tidak macet.
  if (!mv && held && !busy) step(held[0], held[1]);
  updRoam();
  const bob = rm ? 0 : Math.round(Math.sin(t / 300)),
    g = MP[mp].g,
    th = MP[mp].th,
    C = TH[th];
  const zn = zone();
  if (zn !== lastZ) {
    if (lastZ && mp === "O") {
      zl = 150;
      SND.music(zn);
    }
    lastZ = zn;
  }
  if (mv) {
    mv.t++;
    if (mv.t === 4) SND.sfx("step");
    if (mv.t >= 8) {
      trail.unshift([px, py]);
      trail.length = 4;
      px += mv.dx;
      py += mv.dy;
      mv = null;
      onStep();
    }
  }
  const fx = mv ? px + (mv.dx * mv.t) / 8 : px,
    fy = mv ? py + (mv.dy * mv.t) / 8 : py,
    fr = mv ? 1 + ((mv.t >> 2) & 1) : 0;
  ctx.fillStyle = "#14122b";
  ctx.fillRect(0, 0, VW, VH);
  const mw = MP[mp].w,
    mh = MP[mp].h,
    // peta yang lebih kecil dari layar (interior) ditaruh di tengah
    CX =
      mw * 16 <= VW
        ? -Math.floor((VW - mw * 16) / 2)
        : clamp(Math.round(fx * 16 + 8 - VW / 2), 0, mw * 16 - VW),
    CY =
      mh * 16 + OY <= VH
        ? -Math.floor((VH - mh * 16 - OY) / 2)
        : clamp(Math.round(fy * 16 + OY + 8 - VH / 2), 0, mh * 16 + OY - VH),
    x0 = Math.max(0, CX >> 4),
    x1 = Math.min(mw - 1, (CX + VW - 1) >> 4),
    y0 = Math.max(0, (CY - OY) >> 4),
    y1 = Math.min(mh - 1, (CY + VH - 1 - OY) >> 4);
  const road = (X, Y, x, y) => {
    ctx.fillStyle = (x + y) % 2 ? "#7c799c" : "#757293";
    ctx.fillRect(X, Y, 16, 16);
    ctx.fillStyle = "#908db0";
    ctx.fillRect(X + 1, Y + 1, 6, 4);
    ctx.fillRect(X + 9, Y + 6, 6, 4);
    ctx.fillRect(X + 2, Y + 11, 6, 4);
    ctx.fillStyle = "#5e5b7c";
    ctx.fillRect(X, Y + 15, 16, 1);
    ctx.fillRect(X + 15, Y, 1, 16);
  };
  ctx.save();
  ctx.translate(-CX, -CY);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const X = x * 16,
        Y = y * 16 + OY,
        c = g[y][x];
      const th = MP[mp].bm ? MP[mp].bm[y][x] : MP[mp].th,
        C = TH[th];
      ctx.fillStyle = (x + y) % 2 ? C.a : C.b;
      ctx.fillRect(X, Y, 16, 16);
      if ((x * 7 + y * 3) % 5 == 0) {
        ctx.fillStyle = C.t2;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(X + 4, Y + 5, 2, 2);
        ctx.fillRect(X + 10, Y + 11, 2, 2);
        ctx.globalAlpha = 1;
      }
      if (th === "v" && y == 5 && x > 0) {
        ctx.fillStyle = "#c9a86a";
        ctx.fillRect(X, Y, 16, 16);
        ctx.fillStyle = "#b08c52";
        ctx.fillRect(X + 3, Y + 4, 2, 2);
        ctx.fillRect(X + 11, Y + 10, 2, 2);
      }
      if (
        (x * 5 + y * 11) % 13 == 0 &&
        c === "." &&
        (th === "v" || th === "h") &&
        y != 5
      ) {
        ctx.fillStyle = (x + y) % 2 ? "#ff9ac1" : "#ffe27a";
        ctx.fillRect(X + 10, Y + 3, 2, 2);
        ctx.fillRect(X + 4, Y + 10, 2, 2);
        ctx.fillStyle = "#fff";
        ctx.fillRect(X + 11, Y + 4, 1, 1);
      }
      baseDeco(th, X, Y, x, y);
      if (c === "#") {
        if ("kdirn".includes(th)) {
          ctx.fillStyle = C.w;
          ctx.fillRect(X, Y, 16, 16);
          ctx.fillStyle = C.w2;
          ctx.fillRect(X, Y + 7, 16, 2);
          ctx.fillRect(X + (y % 2 ? 4 : 10), Y, 2, 7);
          ctx.fillRect(X + (y % 2 ? 10 : 4), Y + 9, 2, 7);
        } else {
          ctx.fillStyle = C.w;
          ctx.fillRect(X, Y, 16, 16);
          ctx.fillStyle = C.w2;
          ctx.fillRect(X + 2, Y + 2, 6, 6);
          ctx.fillRect(X + 8, Y + 8, 6, 6);
        }
      } else if (c === "T") {
        if ("di".includes(th)) {
          ctx.fillStyle = "rgba(0,0,0,.3)";
          ctx.fillRect(X + 2, Y + 13, 13, 3);
          ctx.fillStyle = C.t;
          ctx.fillRect(X + 4, Y + 1, 8, 15);
          ctx.fillStyle = C.t2;
          ctx.fillRect(X + 4, Y + 1, 3, 15);
          ctx.fillRect(X + 3, Y, 10, 3);
        } else {
          ctx.fillStyle = "rgba(0,0,0,.28)";
          ctx.fillRect(X + 2, Y + 13, 13, 3);
          ctx.fillStyle = "#6b4a35";
          ctx.fillRect(X + 6, Y + 9, 4, 7);
          ctx.fillStyle = C.t;
          ctx.fillRect(X + 2, Y + 2, 12, 9);
          ctx.fillRect(X + 4, Y, 8, 2);
          ctx.fillStyle = C.t2;
          ctx.fillRect(X + 4, Y + 3, 3, 3);
          ctx.fillStyle = "rgba(0,0,0,.2)";
          ctx.fillRect(X + 9, Y + 7, 5, 4);
          ctx.fillRect(X + 3, Y + 9, 3, 2);
        }
      } else if (c === "w") {
        ctx.fillStyle = "#2a6fd6";
        ctx.fillRect(X, Y, 16, 16);
        ctx.fillStyle = "#8cc0ff";
        ctx.globalAlpha = 0.5;
        ctx.fillRect(
          X + ((((rm ? 0 : t / 200) + x * 3) % 12) | 0),
          Y + ((y * 5) % 12),
          3,
          1,
        );
        ctx.globalAlpha = 1;
      } else if (c === "B") {
        if (mp === "I" || mp === "J") {
          ctx.fillStyle = "#5a3a1a";
          ctx.fillRect(X, Y + 4, 16, 12);
          ctx.fillStyle = "#c28a4a";
          ctx.fillRect(X, Y + 2, 16, 4);
        } else {
          const up = g[y - 1][x] === "B";
          ctx.fillStyle = up ? "#d9c3a0" : "#b8472f";
          ctx.fillRect(X, Y, 16, 16);
          if (!up) {
            ctx.fillStyle = "#8a2f1c";
            ctx.fillRect(X, Y + 12, 16, 4);
          } else if ((x + y) % 2) {
            ctx.fillStyle = "#4a6a9a";
            ctx.fillRect(X + 4, Y + 4, 8, 7);
            ctx.fillStyle = "#bfe0ff";
            ctx.fillRect(X + 5, Y + 5, 3, 2);
          }
        }
      } else if (c === "D") {
        if ((mp === "O" ? reg(x, y) : mp) === "R") {
          gateTile(X, Y);
        } else if ((mp === "O" ? reg(x, y) : mp) === "V") {
          ctx.fillStyle = "#d9c3a0";
          ctx.fillRect(X, Y, 16, 16);
          ctx.fillStyle = "#6b3a1c";
          ctx.fillRect(X + 2, Y + 2, 12, 14);
          ctx.fillStyle = "#ffd166";
          ctx.fillRect(X + 10, Y + 9, 2, 2);
        } else {
          ctx.fillStyle = "#6d6a88";
          ctx.fillRect(X, Y, 16, 16);
          ctx.fillStyle = "#0b0818";
          ctx.fillRect(X + 2, Y + 3, 12, 13);
          ctx.fillRect(X + 4, Y + 1, 8, 3);
        }
      } else if (c === "r") {
        road(X, Y, x, y);
      } else if (c === "b") {
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(X, Y, 16, 16);
        ctx.fillStyle = "#6b4220";
        for (let k = 3; k < 16; k += 4) ctx.fillRect(X, Y + k, 16, 1);
        ctx.fillStyle = "#b87a3a";
        for (let k = 0; k < 16; k += 4) ctx.fillRect(X + 3, Y + k, 2, 1);
        ctx.fillStyle = "#4a2f18";
        ctx.fillRect(X, Y, 2, 16);
        ctx.fillRect(X + 14, Y, 2, 16);
        ctx.fillStyle = "#c28a4a";
        ctx.fillRect(X, Y, 1, 16);
        ctx.fillRect(X + 14, Y, 1, 16);
      } else if (c === "L") {
        if (g[y][x - 1] === "r" || g[y][x + 1] === "r") road(X, Y, x, y);
        ctx.fillStyle = "rgba(0,0,0,.28)";
        ctx.fillRect(X + 4, Y + 14, 9, 2);
        ctx.fillStyle = "#3a3550";
        ctx.fillRect(X + 7, Y + 6, 2, 10);
        ctx.fillRect(X + 5, Y + 14, 6, 2);
        ctx.fillStyle = "#1a1530";
        ctx.fillRect(X + 4, Y, 8, 7);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(X + 5, Y + 1, 6, 5);
        ctx.fillStyle = "#fff6c0";
        ctx.fillRect(X + 6, Y + 2, 2, 2);
      } else if (c === "f") {
        road(X, Y, x, y);
        ctx.fillStyle = "rgba(0,0,0,.28)";
        ctx.fillRect(X + 1, Y + 13, 15, 3);
        ctx.fillStyle = "#4a4868";
        ctx.fillRect(X, Y + 3, 16, 12);
        ctx.fillStyle = "#9a97b8";
        ctx.fillRect(X + 1, Y + 3, 14, 3);
        ctx.fillRect(X + 1, Y + 12, 14, 2);
        ctx.fillStyle = "#2a6fd6";
        ctx.fillRect(X + 2, Y + 6, 12, 6);
        ctx.fillStyle = "#8cc0ff";
        ctx.fillRect(X + 3 + (((rm ? 0 : t / 150 + x) % 7) | 0), Y + 8, 3, 1);
        const sh = rm ? 4 : 3 + Math.round(1.5 * Math.sin(t / 220));
        ctx.fillStyle = "#bfe0ff";
        ctx.fillRect(X + 7, Y + 6 - sh, 2, sh + 1);
        ctx.fillStyle = "#fff";
        ctx.fillRect(X + 6, Y + 5 - sh, 4, 1);
      } else if (c === "S") {
        road(X, Y, x, y);
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fillRect(X + 1, Y + 14, 15, 2);
        ctx.fillStyle = "#6b4a35";
        ctx.fillRect(X + 1, Y + 2, 2, 13);
        ctx.fillRect(X + 13, Y + 2, 2, 13);
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = k % 2 ? "#f4ecd0" : "#d2284d";
          ctx.fillRect(X + k * 4, Y, 4, 6);
        }
        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fillRect(X, Y + 5, 16, 1);
        ctx.fillStyle = "#b87a3a";
        ctx.fillRect(X + 1, Y + 9, 14, 6);
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(X + 1, Y + 13, 14, 2);
        const gd = ["#ff6b6b", "#ffd166", "#7ef0c8"][(x * 3 + y) % 3];
        ctx.fillStyle = gd;
        ctx.fillRect(X + 3, Y + 7, 3, 3);
        ctx.fillRect(X + 8, Y + 7, 3, 3);
        ctx.fillRect(X + 11, Y + 8, 2, 2);
      } else if (c === "E") {
        ctx.fillStyle = "#d9c3a0";
        ctx.fillRect(X, Y, 16, 16);
        ctx.fillStyle = "#4a2f18";
        ctx.fillRect(X + 3, Y + 2, 10, 14);
        ctx.fillStyle = "#6b3a1c";
        ctx.fillRect(X + 4, Y + 3, 8, 13);
        ctx.fillStyle = "#8a5a2b";
        ctx.fillRect(X + 4, Y + 3, 3, 13);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(X + 10, Y + 10, 2, 2);
      } else if (TILEX.includes(c)) {
        tileX(c, X, Y, x, y, th, t);
      }
    }
  /* cahaya lampu (digambar di atas semua petak) */
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (g[y][x] === "L") {
        ctx.globalAlpha = 0.1 + 0.07 * Math.sin(t / 300 + x);
        ctx.fillStyle = "#ffd166";
        ctx.fillRect(x * 16 - 2, y * 16 + OY - 4, 20, 18);
        ctx.globalAlpha = 1;
      }
  const hy =
      fy * 16 +
      OY -
      (mv ? Math.round(Math.abs(Math.sin((mv.t / 8) * Math.PI)) * 2) : 0),
    fl = face[0] < 0;
  const L = EN[mp]
    .filter((e) => !gone(e))
    .map((e) => ({ y: e.y, f: () => ent(e, t, bob) }));
  if (mp === "O")
    RV.list.forEach((r) =>
      L.push({ y: r.y + r.oy / 16, f: () => drawRoam(r, t, bob) }),
    );
  if (F.party)
    PM.forEach((m, i) => {
      const a = trail[i] || [px, py],
        b = i ? trail[i - 1] || [px, py] : [px, py],
        k = mv ? mv.t / 8 : 0,
        x = a[0] + (b[0] - a[0]) * k,
        y = a[1] + (b[1] - a[1]) * k;
      L.push({
        y: y - 0.01 * (i + 1),
        f: () => {
          ctx.fillStyle = "#000";
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x * 16 + 3, y * 16 + OY + 14, 10, 2);
          ctx.globalAlpha = 1;
          spr(m.sp, x * 16, y * 16 + OY, 1, 1, null, mv ? fr : 0, b[0] < a[0]);
        },
      });
    });
  L.push({
    y: fy,
    f: () => {
      ctx.fillStyle = "#000";
      ctx.globalAlpha = 0.3;
      ctx.fillRect(fx * 16 + 3, fy * 16 + OY + 14, 10, 2);
      ctx.globalAlpha = 1;
      spr("hero", fx * 16, hy, 1, 1, null, fr, fl);
      hatDraw(fx * 16, hy - 8, 1, fl);
    },
  });
  L.sort((a, b) => a.y - b.y).forEach((o) => o.f());
  ctx.restore();
  if (th === "d") {
    ctx.fillStyle = "rgba(30,0,60,.3)";
    ctx.fillRect(0, 0, VW, VH);
  }
  if (mp === "O") {
    const nt = Math.max(0, Math.sin(t / 45000)); // siang-malam
    ctx.fillStyle = `rgba(12,10,60,${(nt * 0.4).toFixed(2)})`;
    ctx.fillRect(0, 0, VW, VH);
  }
  if (mw > 20) drawMini(mw, mh, CX, CY, fx, fy, t);
  if (fd > 0) {
    ctx.fillStyle = `rgba(0,0,0,${fd / 12})`;
    ctx.fillRect(0, 0, VW, VH);
    fd--;
  }
  if (zl > 0) {
    ctx.globalAlpha = Math.min(1, zl / 30);
    ctx.font = 'bold 16px "Pixelify Sans",monospace';
    ctx.textAlign = "center";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.strokeText(rn(), VW / 2, 64);
    ctx.fillStyle = "#ffd166";
    ctx.fillText(rn(), VW / 2, 64);
    ctx.globalAlpha = 1;
    zl--;
  }
}
addEventListener("keydown", (e) => {
  if (!W.on || UIX.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(),
    m = {
      arrowup: [0, -1],
      w: [0, -1],
      arrowdown: [0, 1],
      s: [0, 1],
      arrowleft: [-1, 0],
      a: [-1, 0],
      arrowright: [1, 0],
      d: [1, 0],
    }[k];
  if (document.activeElement?.tagName === "INPUT") return;
  if (invOpen && (k === "i" || k === "escape")) {
    e.preventDefault();
    idle();
    return;
  }
  if (k === "i" && !busy) {
    e.preventDefault();
    inv();
    return;
  }
  if (k === "t" && !busy) {
    e.preventDefault();
    tpKey();
    return;
  }
  if (m) {
    if (!busy) {
      held = m;
      e.preventDefault();
    }
    return;
  }
  if (
    (k === " " || k === "enter") &&
    !busy &&
    document.activeElement?.tagName !== "BUTTON"
  ) {
    e.preventDefault();
    act();
  }
});
addEventListener("keyup", (e) => {
  held = null;
});
