/* ===== Numeria Quest — Perluasan dunia: Hutan Rimba, Padang Pasir, Kota Kerajaan, Istana,
   teleportasi, monster yang muncul otomatis di perjalanan, dan bandit hutan.
   Dimuat setelah world.js dan royals.js. ===== */

/* ---------- pengaturan yang mudah diubah ---------- */
const WILD_STEPS = 20, // tiap sekian langkah di alam liar, game "melempar dadu" spawn
  BANDIT_P = 0.3, // peluang bandit menyergap di hutan (30%)
  MAX_ROAM = 3; // maksimum monster berkeliaran bersamaan

/* ---------- nama wilayah, tema warna, perlengkapan, quest ---------- */
Object.assign(MN, {
  F: "Hutan Rimba Akar",
  P: "Padang Pasir Desimal",
  R: "Kota Kerajaan Aksioma",
  N: "Istana Kerajaan",
});
Object.assign(TH, {
  s: {
    a: "#dfbf78",
    b: "#d6b56c",
    w: "#8a6a40",
    w2: "#a8844e",
    t: "#6e8f3a",
    t2: "#9cc85a",
  },
  f: {
    a: "#245a33",
    b: "#205230",
    w: "#0f2a1a",
    w2: "#183e26",
    t: "#17602f",
    t2: "#35a050",
  },
  r: {
    a: "#aeacc8",
    b: "#a6a4c2",
    w: "#2f3f7a",
    w2: "#46589c",
    t: "#2f9e57",
    t2: "#5fd078",
  },
  n: {
    a: "#c9c0aa",
    b: "#c0b79f",
    w: "#25346e",
    w2: "#3a4e96",
    t: "#6d6a88",
    t2: "#9a97b8",
  },
});
EQ.royal = {
  n: "Jubah Kerajaan",
  s: "c",
  def: 3,
  pal: { R: "#2f4fa8", r: "#e2b84a" },
};
QS.push({
  id: "raja",
  n: "Panggilan Raja",
  d: "Rank A: Raja memanggilmu. Pergi ke Kota Kerajaan (jauh di tenggara: gerbang selatan Kota Bangun, Hutan Rimba, lalu Padang Pasir) dan temui Raja di Ruang Tahta.",
  gp: 100,
  coin: 300,
  it: "royal",
  on: () => ri() >= 4,
  chk: () => F.raja,
  pr: () => "Temui Raja di Istana",
});

/* ---------- peta: Kota Kerajaan (55x36) & Istana (24x13) ---------- */
(function () {
  const r = [],
    a = (...x) => r.push(x);
  // tembok kota + gerbang barat
  a("Q", 0, 0, 55, 1);
  a("Q", 0, 35, 55, 1);
  a("Q", 0, 0, 1, 36);
  a("Q", 54, 0, 1, 36);
  // jalan, alun-alun, pasar
  a("r", 25, 9, 6, 8);
  a("r", 14, 17, 28, 11);
  a("r", 26, 28, 4, 7);
  a("r", 0, 23, 14, 2);
  a("r", 42, 23, 12, 2);
  a("r", 2, 12, 12, 10);
  // istana: bangunan utama + dua sayap, gerbang di (27..28, 8)
  a("U", 19, 1, 18, 8);
  a("U", 14, 3, 5, 6);
  a("U", 37, 3, 5, 6);
  a("D", 27, 8, 2, 1);
  // rumah warga (pintu terkunci)
  a("U", 3, 27, 7, 4);
  a("E", 6, 30);
  a("U", 11, 28, 6, 4);
  a("E", 13, 31);
  a("U", 44, 13, 8, 4);
  a("E", 47, 16);
  a("U", 44, 18, 8, 4);
  a("E", 47, 21);
  a("U", 44, 27, 8, 4);
  a("E", 47, 30);
  a("U", 33, 29, 7, 4);
  a("E", 36, 32);
  // pasar: kios
  [3, 5, 7, 9, 11].forEach((x) => {
    a("S", x, 14);
    a("S", x, 18);
  });
  // air mancur, lampu, pohon taman
  a("f", 27, 22);
  a("f", 28, 22);
  [
    [25, 10],
    [30, 10],
    [25, 14],
    [30, 14],
    [15, 18],
    [40, 18],
    [15, 26],
    [40, 26],
    [21, 18],
    [34, 18],
  ].forEach(([x, y]) => a("L", x, y));
  [
    [23, 10],
    [32, 10],
    [23, 13],
    [32, 13],
    [15, 11],
    [40, 11],
    [20, 20],
    [35, 20],
    [20, 25],
    [35, 25],
    [3, 33],
    [7, 33],
    [12, 33],
    [18, 33],
    [22, 33],
    [33, 33],
    [41, 33],
    [49, 33],
  ].forEach(([x, y]) => a("T", x, y));
  mkm("R", "r", r, [], 55, 36);

  const n = [],
    b = (...x) => n.push(x);
  b("c", 10, 2, 4, 10);
  b("H", 11, 1, 2, 1);
  [
    [6, 4],
    [6, 7],
    [6, 10],
    [17, 4],
    [17, 7],
    [17, 10],
  ].forEach(([x, y]) => b("Z", x, y));
  mkm(
    "N",
    "n",
    n,
    [
      [11, 12],
      [12, 12],
    ],
    24,
    13,
  );
})();
OW.R = [145, 86];

/* ---------- entitas Kota Kerajaan & Istana ---------- */
const gateLock = () => ({
  k: () => F.q.raja >= 1,
  kf: () => N.jagaistana(),
});
EN.R = [
  Object.assign(pt(27, 8, "N", 11, 11, [0, -1]), gateLock()),
  Object.assign(pt(28, 8, "N", 12, 11, [0, -1]), gateLock()),
  { t: "tele", wp: "R", x: 19, y: 25 },
  { t: "crystal", x: 36, y: 25 },
  { t: "npc", id: "jagaistana", x: 26, y: 9, sp: "ksatria" },
  { t: "npc", id: "jagaistana", x: 29, y: 9, sp: "prajurit" },
  { t: "npc", id: "gerbang", x: 2, y: 22, sp: "gerbang" },
  { t: "npc", id: "dagang", x: 7, y: 16, sp: "dagang" },
  { t: "npc", id: "bangsawan", x: 22, y: 19, sp: "bangsawan" },
  { t: "npc", id: "tamu", x: 33, y: 20, sp: "tamu" },
  { t: "npc", id: "pejabat", x: 30, y: 19, sp: "pejabat" },
  { t: "npc", id: "pelayan", x: 40, y: 22, sp: "pelayan" },
  { t: "npc", id: "kuda", x: 49, y: 25, sp: "kuda" },
  { t: "npc", id: "tabib", x: 46, y: 22, sp: "tabib" },
  { t: "chest", id: "r1", x: 52, y: 33, coin: 90, po: 1 },
  { t: "chest", id: "r2", x: 2, y: 33, coin: 80, fp: 1 },
  { t: "chest", id: "r3", x: 52, y: 3, coin: 120, sc: 1 },
];
EN.N = [
  { t: "npc", id: "raja", x: 11, y: 2, sp: "raja" },
  { t: "npc", id: "ratu", x: 12, y: 2, sp: "ratu" },
  { t: "npc", id: "pangeran", x: 8, y: 3, sp: "pangeran" },
  { t: "npc", id: "putri", x: 15, y: 3, sp: "putri" },
  { t: "npc", id: "pejabat", x: 4, y: 5, sp: "pejabat" },
  { t: "npc", id: "ksatria", x: 8, y: 7, sp: "ksatria" },
  { t: "npc", id: "ksatria", x: 15, y: 7, sp: "ksatria" },
  { t: "npc", id: "prajurit", x: 9, y: 10, sp: "prajurit" },
  { t: "npc", id: "prajurit", x: 14, y: 10, sp: "prajurit" },
  { t: "npc", id: "tabib", x: 3, y: 9, sp: "tabib" },
  { t: "npc", id: "pelayan", x: 20, y: 4, sp: "pelayan" },
  { t: "npc", id: "tamu", x: 20, y: 9, sp: "tamu" },
  pt(11, 12, "O", 172, 95, [0, 1]),
  pt(12, 12, "O", 173, 95, [0, 1]),
];

/* ---------- wilayah: Hutan Rimba (F), Padang Pasir (P) ---------- */
reg = function (x, y) {
  for (const id of ["V", "H", "T", "K", "R"]) {
    const [ox, oy] = OW[id],
      m = MP[id];
    if (x >= ox && y >= oy && x < ox + m.w && y < oy + m.h) return id;
  }
  if (y >= 42 && x < 71) return "F";
  if (x >= 71 && y >= 26) return "P";
  return "O";
};

/* ---------- membangun dunia terbuka 200x123 ---------- */
let TELES = [];
(function buildWorld() {
  const WW = 200,
    WH = 123,
    rnd = ((s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })(20261014),
    g = [],
    bm = [];
  for (let y = 0; y < WH; y++) {
    g.push([]);
    bm.push([]);
    for (let x = 0; x < WW; x++) {
      g[y].push((x * 13 + y * 7) % 11 === 0 && (x + y) % 3 ? "T" : ".");
      bm[y].push("h");
    }
  }
  Object.entries(OW).forEach(([id, [ox, oy]]) => {
    const m = MP[id];
    m.g.forEach((row, y) =>
      [...row].forEach((c, x) => {
        g[oy + y][ox + x] = c;
        bm[oy + y][ox + x] = m.th;
      }),
    );
  });
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++) if (g[y][x] === "#") g[y][x] = ".";
  const inb = (x, y) => x > 0 && y > 0 && x < WW - 1 && y < WH - 1,
    fill = (x0, y0, x1, y1, f) => {
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) if (inb(x, y)) f(x, y);
    },
    clr = (cx, cy, r) =>
      fill(cx - r, cy - r, cx + r, cy + r, (x, y) => {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r && "TCR".includes(g[y][x]))
          g[y][x] = ".";
      }),
    carve = (pts, hw, mid) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          fill(x - hw, y - hw, x + hw, y + hw, (X, Y) => {
            if ("TCR".includes(g[Y][X])) g[Y][X] = ".";
          });
          if (inb(x, y) && g[y][x] === ".") g[y][x] = mid;
        }
      }
    };
  // sungai kota diperpanjang sampai kaki gunung; gerbang selatan kota (jalan ke hutan)
  for (let x = 43; x <= 70; x++) g[24][x] = g[25][x] = "w";
  for (let x = 0; x < 44; x++) g[41][x] = x >= 21 && x <= 23 ? "r" : "#";
  for (let y = 39; y <= 40; y++) for (let x = 21; x <= 23; x++) g[y][x] = "r";
  // pegunungan timur laut (tidak bisa dilewati)
  fill(71, 0, WW - 1, 25, (x, y) => (g[y][x] = "M"));
  // HUTAN RIMBA: x 1..69, y 42..97
  fill(1, 42, 69, 97, (x, y) => {
    g[y][x] = rnd() < 0.3 ? "T" : ".";
    bm[y][x] = "f";
  });
  fill(0, 98, 70, WH - 1, (x, y) => {
    g[y][x] = "M";
    bm[y][x] = "f";
  });
  fill(70, 42, 70, 97, (x, y) => {
    g[y][x] = y >= 66 && y <= 74 ? "." : "M";
    bm[y][x] = "f";
  });
  const fp = [
    [22, 41],
    [22, 50],
    [34, 56],
    [34, 66],
    [48, 70],
    [58, 78],
    [66, 72],
    [70, 70],
  ];
  fp.forEach(([x, y]) => clr(x, y, 3));
  [
    [10, 60],
    [50, 50],
    [14, 85],
    [40, 90],
    [60, 60],
    [8, 72],
  ].forEach(([x, y]) => clr(x, y, R(2, 3)));
  carve(fp, 1, ",");
  clr(64, 72, 5);
  // PADANG PASIR: x 71..198, y 26..121 (kecuali Kota Kerajaan)
  fill(71, 26, WW - 2, WH - 2, (x, y) => {
    if (x >= 145 && y >= 86) return;
    const v = rnd();
    g[y][x] = v < 0.035 ? "C" : v < 0.065 ? "R" : ".";
    bm[y][x] = "s";
  });
  fill(71, 26, 71, 41, (x, y) => (g[y][x] = "M")); // sekat: dataran selatan tidak tembus ke gurun
  // dua punggung bukit memaksa rute berliku: celah utara (x=90) dan celah selatan (x=125)
  fill(90, 26, 91, WH - 2, (x, y) => {
    if (y < 30 || y > 34) g[y][x] = "M";
  });
  fill(125, 26, 126, WH - 2, (x, y) => {
    if (y < 105 || y > 110) g[y][x] = "M";
  });
  // jejak kafilah menuju Kota Kerajaan
  carve(
    [
      [71, 70],
      [80, 70],
      [80, 32],
      [104, 32],
      [104, 107],
      [135, 107],
      [135, 109],
      [144, 109],
    ],
    2,
    ",",
  );
  // oasis
  fill(97, 36, 101, 38, (x, y) => (g[y][x] = "w"));
  [
    [96, 35],
    [102, 35],
    [96, 39],
    [102, 39],
    [99, 35],
    [99, 39],
  ].forEach(([x, y]) => (g[y][x] = "P"));
  // tepi dunia
  for (let y = 0; y < WH; y++)
    for (let x = 0; x < WW; x++)
      if (x == 0 || y == 0 || x == WW - 1 || y == WH - 1) g[y][x] = "#";
  MP.O = { th: "h", w: WW, h: WH, g: g.map((r) => r.join("")), bm };

  // entitas
  EN.O = [];
  Object.entries(OW).forEach(([id, [ox, oy]]) =>
    EN[id].forEach((e) => {
      if (e.t === "portal" && !["I", "D", "N"].includes(e.to)) return;
      EN.O.push({ ...e, x: e.x + ox, y: e.y + oy });
    }),
  );
  const put = (e) => {
    if ("TCRP".includes(g[e.y][e.x])) {
      g[e.y][e.x] = ".";
      MP.O.g[e.y] = g[e.y].join("");
    }
    EN.O.push(e);
  };
  [
    { t: "tele", wp: "V", x: 29, y: 6 },
    { t: "tele", wp: "K", x: 20, y: 22 },
    { t: "tele", wp: "T", x: 61, y: 5 },
    // Pos Hutan Rimba (zona aman)
    { t: "tele", wp: "F", x: 64, y: 70 },
    { t: "crystal", x: 66, y: 68 },
    { t: "npc", id: "ranger", x: 62, y: 73, sp: "ranger" },
    { t: "chest", id: "f1", x: 6, y: 48, coin: 45, po: 1 },
    { t: "chest", id: "f2", x: 12, y: 91, coin: 60, fp: 1 },
    { t: "chest", id: "f3", x: 50, y: 93, coin: 70, sc: 1 },
    { t: "chest", id: "f4", x: 36, y: 86, coin: 55, po: 1 },
    // Oasis (zona aman)
    { t: "tele", wp: "A", x: 102, y: 36 },
    { t: "crystal", x: 102, y: 38 },
    { t: "npc", id: "nomad", x: 99, y: 34, sp: "nomad" },
    { t: "chest", id: "d1", x: 74, y: 28, coin: 70, po: 1 },
    { t: "chest", id: "d2", x: 118, y: 44, coin: 90, fp: 1 },
    { t: "chest", id: "d3", x: 108, y: 92, coin: 100, sc: 1 },
    { t: "chest", id: "d4", x: 186, y: 40, coin: 120, po: 1 },
    { t: "chest", id: "d5", x: 160, y: 70, coin: 110, fp: 1 },
    { t: "chest", id: "d6", x: 130, y: 118, coin: 130, po: 1 },
    { t: "chest", id: "d7", x: 95, y: 100, coin: 85, po: 1 },
  ].forEach(put);
  TELES = EN.O.filter((e) => e.t === "tele");
})();

/* ---------- teleportasi ---------- */
const WP = [
  { id: "V", n: "Desa Satuan" },
  { id: "K", n: "Kota Bangun" },
  { id: "T", n: "Desa Sunyi" },
  { id: "F", n: "Pos Hutan Rimba" },
  { id: "A", n: "Oasis Pasir" },
  { id: "R", n: "Kota Kerajaan" },
];
function tpMenu(scroll, here) {
  busy = true;
  invOpen = false;
  say(
    scroll
      ? "Gulungan Teleportasi bersinar di tanganmu."
      : "Batu Teleportasi berdengung pelan.",
  );
  ui(
    `<div class="card"><b class="ok">${scroll ? "Gulungan Teleportasi" : "Batu Teleportasi"}</b> <span class="qm">${scroll ? `Sekali pakai · sisa ${Pl.scr | 0}` : "Gratis antar batu yang sudah ditemukan"}</span><div class="opts" style="margin:8px 0">${WP.map((w) => `<button class="b" data-w="${w.id}" ${!F.tp[w.id] || w.id === here ? "disabled" : ""}>${F.tp[w.id] ? w.n : "???"}${w.id === here ? " (di sini)" : ""}</button>`).join("")}</div><div class="qm">Titik baru ditemukan dengan berjalan ke sana dan menyentuh batunya.</div><div class="row" style="margin-top:8px"><button class="b g" id="tpx">Tutup</button></div></div>`,
  );
  document
    .querySelectorAll("[data-w]")
    .forEach((b) => (b.onclick = () => tpGo(b.dataset.w, scroll)));
  $("#tpx").onclick = idle;
}
function tpGo(id, scroll) {
  const w = WP.find((x) => x.id === id),
    s = TELES.find((e) => e.wp === id);
  if (scroll) {
    if (!(Pl.scr > 0)) return idle();
    Pl.scr--;
  }
  RV.list.length = 0;
  const L = [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
  ]
    .map(([a, b]) => [s.x + a, s.y + b])
    .find(
      ([x, y]) =>
        !solid(x, y) && !EN.O.some((e) => e.x === x && e.y === y && !gone(e)),
    ) || [s.x, s.y + 1];
  mp = "O";
  [px, py] = L;
  face = [0, 1];
  mv = null;
  held = null;
  trail = [0, 1, 2, 3].map(() => [px, py]);
  fd = 12;
  zl = 150;
  SND.sfx("portal");
  SND.music(zone());
  idle();
  say(`Teleportasi ke ${w.n}.`);
}
function tpKey() {
  if (mp !== "O") return say("Teleportasi hanya bisa dipakai di luar ruangan.");
  if (Pl.scr > 0) return tpMenu(true, null);
  say(
    "Belum punya Gulungan Teleportasi (beli di pedagang). Atau sentuh Batu Teleportasi.",
  );
}
H.tele = (e) => {
  const w = WP.find((x) => x.id === e.wp);
  if (!F.tp[e.wp]) {
    F.tp[e.wp] = 1;
    SND.sfx("quest");
    return dlg(
      "Batu Teleportasi",
      [
        `Batu itu bersinar dan mengenali jiwamu. Titik teleportasi "${w.n}" ditemukan!`,
      ],
      () => tpMenu(false, e.wp),
    );
  }
  SND.sfx("portal");
  tpMenu(false, e.wp);
};
ITM.push([
  "scr",
  "Gulungan Teleportasi",
  "✦",
  "#4b3fd1",
  "Sekali pakai: teleportasi ke Batu yang sudah ditemukan (tombol T).",
  () => {
    if (mp !== "O") return "Tidak bisa dipakai di dalam ruangan.";
    setTimeout(() => tpMenu(true, null), 0);
    return "Gulungan dibuka.";
  },
]);
IT.push([
  "Gulungan Teleportasi (sekali pakai)",
  60,
  () => (Pl.scr = (Pl.scr | 0) + 1),
]);

/* ---------- monster yang muncul otomatis di perjalanan ---------- */
const RV = { list: [], steps: 0, grace: 0, cur: null };
// konfigurasi alam liar per wilayah (null = zona aman). Indeks E: 4 Serigala, 5 Bandit, 6 Goblin, 7 Kalajengking, 8 Mumi, 9 Kobra
function wild(x, y) {
  if (TELES.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 7))
    return null; // sekitar batu teleportasi aman
  const z = reg(x, y);
  if (z === "H") return { forest: 1, pool: [] };
  if (z === "F") return { forest: 1, pool: [4, 6], p: 0.25 };
  if (z === "P") return { pool: [7, 8, 9], p: 0.55 };
  if (z === "O" && y >= 26) return { pool: [4, 6], p: 0.4 };
  return null;
}
function freeTile(x, y, self) {
  return (
    x > 0 &&
    y > 0 &&
    x < MP.O.w - 1 &&
    y < MP.O.h - 1 &&
    !solid(x, y) &&
    !(x === px && y === py) &&
    !(mv && x === px + mv.dx && y === py + mv.dy) &&
    !EN.O.some((e) => e.x === x && e.y === y && !gone(e)) &&
    !RV.list.some((r) => r !== self && r.x === x && r.y === y) &&
    !!wild(x, y)
  );
}
function spawn(i, dmin, dmax) {
  for (let k = 0; k < 30; k++) {
    const a = Math.random() * 6.283,
      d = R(dmin, dmax),
      x = px + Math.round(Math.cos(a) * d),
      y = py + Math.round(Math.sin(a) * d);
    if (!freeTile(x, y, null)) continue;
    const e = E[i];
    RV.list.push({
      t: "roam",
      i,
      sp: e.sp,
      x,
      y,
      ox: 0,
      oy: 0,
      tm: R(10, 40),
      spd: i === 5 ? 15 : 30,
      born: 0,
      face: 1,
    });
    SND.mon(e.sp, "appear");
    say(
      i === 5
        ? "Semak-semak bergemerisik... ada Bandit!"
        : `${e.n} muncul dan mengejarmu!`,
    );
    return;
  }
}
function onStep() {
  if (mp !== "O") return;
  const w = wild(px, py);
  if (!w) return void (RV.steps = 0);
  if (++RV.steps < WILD_STEPS || RV.list.length >= MAX_ROAM) return;
  RV.steps = 0;
  if (w.forest && Math.random() < BANDIT_P) return spawn(5, 3, 4);
  if (w.pool.length && Math.random() < w.p) spawn(P(w.pool), 5, 8);
}
function updRoam() {
  if (mp !== "O") return void (RV.list.length = 0);
  if (RV.grace > 0) RV.grace--;
  if (!wild(px, py)) {
    RV.list.length = 0;
    RV.steps = 0;
    return;
  }
  if (busy || UIX.open) return;
  RV.list = RV.list.filter(
    (r) => Math.abs(r.x - px) + Math.abs(r.y - py) <= 26,
  );
  for (const r of RV.list) {
    r.born++;
    r.ox = Math.abs(r.ox) < 0.5 ? 0 : r.ox * 0.72;
    r.oy = Math.abs(r.oy) < 0.5 ? 0 : r.oy * 0.72;
    const dx = px - r.x,
      dy = py - r.y;
    if (Math.abs(dx) + Math.abs(dy) <= 1 && !mv && RV.grace <= 0)
      return H.roam(r);
    if (--r.tm > 0) continue;
    r.tm = r.spd;
    const ord =
      Math.abs(dx) >= Math.abs(dy)
        ? [
            [Math.sign(dx), 0],
            [0, Math.sign(dy)],
          ]
        : [
            [0, Math.sign(dy)],
            [Math.sign(dx), 0],
          ];
    for (const [sx, sy] of ord) {
      if (!sx && !sy) continue;
      if (freeTile(r.x + sx, r.y + sy, r)) {
        r.x += sx;
        r.y += sy;
        r.ox = -sx * 16;
        r.oy = -sy * 16;
        if (sx) r.face = sx;
        break;
      }
    }
  }
}
H.roam = (r) => {
  RV.cur = r;
  const fight = () => {
    W.on = false;
    start(r.i);
  };
  if (r.i === 5)
    dlg(
      "Bandit Hutan",
      [
        P([
          "Berhenti! Serahkan koinmu, atau kau tidak akan keluar dari hutan ini!",
          "Hehehe... dompetmu kelihatan berat. Sini!",
        ]),
      ],
      fight,
    );
  else fight();
};
function drawRoam(r, t, bob) {
  const X = r.x * 16 + r.ox,
    Y = r.y * 16 + OY + r.oy;
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 0.3;
  ctx.fillRect(X + 2, Y + 13, 12, 3);
  ctx.globalAlpha = 1;
  const so = SP[r.sp],
    fm = so.a && !rm ? so.a[(Math.floor(t / 380) + r.x) % 2] : null;
  spr(
    r.sp,
    X,
    Y + bob,
    1,
    Math.min(1, r.born / 20),
    null,
    0,
    r.face > 0 ? 1 : 0,
    fm,
  );
  if (r.born < 90) mark(r, X, Y, bob, 0);
}
{
  const _back = W.back;
  W.back = function (i) {
    const r = RV.cur;
    if (!r) return _back(i);
    RV.list = RV.list.filter((x) => x !== r);
    RV.cur = null;
    RV.grace = 90;
    const lost = i === null && r.i === 5 ? Math.min(Pl.coin, R(8, 20)) : 0;
    Pl.coin -= lost;
    _back(i);
    if (lost) say(`Bandit merampas ${lost} koin saat kamu kabur!`);
  };
  const _init = W.init;
  W.init = function () {
    _init();
    F.tp = {};
    F.raja = 0;
    Pl.scr = 0;
    RV.list = [];
    RV.steps = 0;
    RV.grace = 0;
    RV.cur = null;
  };
}

/* ---------- gerbang Istana & peti ---------- */
H.portal = (e) => (e.k && !e.k() ? e.kf() : go(e));
H.chest = (e) => {
  if (F.chest[e.id]) return dlg("Peti", ["Peti ini sudah kosong."]);
  F.chest[e.id] = 1;
  SND.sfx("chest");
  Pl.coin += e.coin;
  const L = [`Kamu menemukan ${e.coin} koin!`];
  if (e.fp) (Pl.fpot++, L.push("Ada Ramuan Mana! Masuk ke Tas."));
  if (e.po) (Pl.pot++, L.push("Ada Ramuan HP! Masuk ke Tas."));
  if (e.sc)
    ((Pl.scr = (Pl.scr | 0) + 1),
      L.push("Ada Gulungan Teleportasi! Masuk ke Tas."));
  hud();
  dlg("Peti", L);
};

/* ---------- penggambaran ---------- */
{
  const _ent = ent;
  ent = function (e, t, bob) {
    if (e.t === "tele") return drawTele(e, t, bob);
    _ent(e, t, bob);
    if (e.id === "raja" && F.q.raja === 1 && !F.raja)
      mark(e, e.x * 16, e.y * 16 + OY, bob, 8);
  };
}
function drawTele(e, t, bob) {
  const X = e.x * 16,
    Y = e.y * 16 + OY,
    on = F.tp && F.tp[e.wp];
  ctx.fillStyle = "rgba(0,0,0,.3)";
  ctx.fillRect(X + 2, Y + 13, 12, 3);
  ctx.fillStyle = "#4a4868";
  ctx.fillRect(X + 3, Y + 11, 10, 4);
  ctx.fillStyle = "#6d6a88";
  ctx.fillRect(X + 5, Y + 2, 6, 10);
  ctx.fillStyle = "#9a97b8";
  ctx.fillRect(X + 5, Y + 2, 2, 10);
  if (on) {
    ctx.globalAlpha = 0.25 + (rm ? 0.1 : 0.2 * Math.sin(t / 260));
    ctx.fillStyle = "#7ef0c8";
    ctx.fillRect(X + 2, Y - 2 + bob, 12, 14);
  }
  ctx.globalAlpha = on ? 0.9 : 0.35;
  ctx.fillStyle = on ? "#7ef0c8" : "#8a87b8";
  ctx.fillRect(X + 7, Y + 4, 2, 6);
  ctx.fillRect(X + 6, Y + 6, 4, 2);
  ctx.globalAlpha = 1;
  if (!on) mark(e, X, Y, bob, 2);
}
function baseDeco(th, X, Y, x, y) {
  if (th === "s") {
    if ((x * 5 + y * 9) % 7 === 0) {
      ctx.fillStyle = "rgba(120,80,30,.32)";
      ctx.fillRect(X + 3, Y + 6, 9, 1);
      ctx.fillRect(X + 6, Y + 9, 7, 1);
    }
    if ((x * 3 + y * 7) % 13 === 0) {
      ctx.fillStyle = "#b89252";
      ctx.fillRect(X + 10, Y + 3, 2, 2);
    }
  } else if (th === "f") {
    if ((x * 3 + y * 5) % 7 === 0) {
      ctx.fillStyle = "rgba(0,0,0,.2)";
      ctx.fillRect(X + 3, Y + 4, 7, 4);
    }
    if ((x * 7 + y * 3) % 11 === 0) {
      ctx.fillStyle = "#3fa65a";
      ctx.fillRect(X + 9, Y + 9, 2, 3);
      ctx.fillRect(X + 11, Y + 10, 2, 2);
    }
  } else if (th === "r" || th === "n") {
    ctx.fillStyle = "rgba(0,0,0,.07)";
    ctx.fillRect(X, Y + 15, 16, 1);
    ctx.fillRect(X + 15, Y, 1, 16);
  }
}
function gateTile(X, Y) {
  ctx.fillStyle = "#e8e1cf";
  ctx.fillRect(X, Y, 16, 16);
  ctx.fillStyle = "#e2b84a";
  ctx.fillRect(X, Y, 16, 2);
  ctx.fillStyle = "#2f4fa8";
  ctx.fillRect(X + 1, Y + 2, 14, 14);
  ctx.fillStyle = "#1f3578";
  ctx.fillRect(X + 3, Y + 4, 10, 12);
  ctx.fillStyle = "#0b0818";
  ctx.fillRect(X + 5, Y + 7, 6, 9);
  ctx.fillStyle = "#e2b84a";
  ctx.fillRect(X + 1, Y + 2, 14, 1);
}
function tileX(c, X, Y, x, y, th, t) {
  const g = MP[mp].g,
    up = g[y - 1]?.[x],
    dn = g[y + 1]?.[x],
    fl = (col, a, b, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(X + a, Y + b, w, h);
    };
  if (c === "M") {
    fl("rgba(0,0,0,.25)", 0, 12, 16, 4);
    fl("#58557a", 0, 5, 16, 11);
    fl("#6f6c94", 1, 3, 12, 6);
    fl("#8a87ae", 3, 1, 8, 4);
    fl("#fff", 5, 0, 4, 2);
    fl("#fff", 4, 2, 6, 1);
    fl("#3f3d5a", 9, 8, 6, 8);
    fl("#3f3d5a", 0, 12, 6, 4);
  } else if (c === "C") {
    fl("rgba(0,0,0,.25)", 3, 14, 10, 2);
    fl("#2f8a45", 6, 2, 4, 13);
    fl("#2f8a45", 2, 6, 5, 2);
    fl("#2f8a45", 2, 4, 2, 4);
    fl("#2f8a45", 9, 8, 5, 2);
    fl("#2f8a45", 12, 5, 2, 5);
    fl("#5fd078", 6, 2, 1, 13);
  } else if (c === "R") {
    fl("rgba(0,0,0,.25)", 2, 14, 13, 2);
    fl("#6a6a78", 2, 8, 12, 7);
    fl("#8a8a98", 3, 6, 10, 6);
    fl("#a8a8b8", 5, 4, 6, 4);
    fl("#cfcfe0", 5, 5, 3, 2);
  } else if (c === "P") {
    fl("rgba(0,0,0,.25)", 3, 14, 10, 2);
    fl("#8a5a2b", 7, 7, 2, 9);
    fl("#6b4220", 8, 7, 1, 9);
    fl("#2f9e57", 2, 3, 12, 3);
    fl("#2f9e57", 4, 1, 8, 2);
    fl("#2f9e57", 1, 5, 4, 2);
    fl("#2f9e57", 11, 5, 4, 2);
    fl("#5fd078", 4, 3, 4, 1);
    fl("#6b3a1c", 6, 6, 2, 2);
  } else if (c === "Q") {
    if (up !== "Q") {
      fl("#b4b2d2", 1, 0, 4, 5);
      fl("#b4b2d2", 8, 0, 4, 5);
      fl("#b4b2d2", 0, 5, 16, 11);
    } else fl("#b4b2d2", 0, 0, 16, 16);
    fl("#8e8cae", 0, 8, 16, 1);
    fl("#8e8cae", (x + y) % 2 ? 4 : 10, 0, 1, 8);
    fl("#8e8cae", (x + y) % 2 ? 10 : 4, 9, 1, 7);
    if (dn !== "Q") fl("#7a789a", 0, 14, 16, 2);
  } else if (c === "U") {
    if (up !== "U") {
      fl("#2f4fa8", 0, 0, 16, 16);
      fl("#1f3578", 0, 11, 16, 5);
      fl("#4a6ad0", 2, 3, 5, 3);
      fl("#4a6ad0", 9, 6, 5, 3);
      fl("#e2b84a", 0, 10, 16, 1);
    } else {
      fl("#e8e1cf", 0, 0, 16, 16);
      if (dn !== "U") fl("#b8b09a", 0, 12, 16, 4);
      else if ((x + y) % 2) {
        fl("#e2b84a", 3, 2, 10, 1);
        fl("#2f4fa8", 4, 3, 8, 9);
        fl("#bfe0ff", 5, 4, 3, 3);
      }
    }
  } else if (c === "Z") {
    fl("#b8b09a", 2, 13, 12, 3);
    fl("#e8e1cf", 4, 2, 8, 12);
    fl("#fff", 4, 2, 3, 12);
    fl("#b8b09a", 10, 2, 2, 12);
    fl("#e2b84a", 2, 0, 12, 3);
  } else if (c === "H") {
    fl("#b8902a", 0, 0, 16, 16);
    fl("#e2b84a", 1, 0, 14, 14);
    fl("#a8222f", 2, 6, 12, 8);
    fl("#d2284d", 2, 6, 12, 2);
    fl("#fff6c0", 3, 1, 3, 3);
  } else if (c === "c") {
    fl("#a8222f", 0, 0, 16, 16);
    if ((x + y) % 2) fl("#c0303f", 4, 4, 8, 8);
    if (g[y]?.[x - 1] !== "c") fl("#e2b84a", 0, 0, 2, 16);
    if (g[y]?.[x + 1] !== "c") fl("#e2b84a", 14, 0, 2, 16);
  } else if (c === ",") {
    const s = th === "s";
    fl(s ? "#b8935a" : "#8a6a40", 0, 0, 16, 16);
    fl(s ? "#a07c46" : "#6b4f2e", 3, 4, 2, 2);
    fl(s ? "#a07c46" : "#6b4f2e", 10, 10, 3, 2);
    fl(s ? "#cdab72" : "#a38458", 8, 3, 3, 1);
  }
}
function mini2(id) {
  const m = MP[id];
  if (m.mc) return m.mc;
  const c = document.createElement("canvas"),
    k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d"),
    BG = {
      h: "#2c6a3c",
      v: "#3f8f4e",
      k: "#8d8aa8",
      t: "#c9a86a",
      d: "#2a2640",
      i: "#a8743c",
      s: "#dfbf78",
      f: "#1d4a2c",
      r: "#a9a7c4",
      n: "#c0b79f",
    },
    col = {
      "#": "#4a4868",
      w: "#2a6fd6",
      B: "#b8472f",
      E: "#6b3a1c",
      T: "#1d6e3a",
      r: "#8886a8",
      b: "#c28a4a",
      L: "#ffd166",
      f: "#5aa8ff",
      S: "#d2284d",
      M: "#6a6784",
      C: "#3f8f4e",
      R: "#8a8a98",
      P: "#2f9e57",
      Q: "#c8c6e0",
      U: "#2f4fa8",
      D: "#5a3a22",
      Z: "#e8e1cf",
      H: "#e2b84a",
      c: "#a8222f",
      ",": "#a9854f",
    };
  m.g.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      k.fillStyle = col[ch] || BG[m.bm ? m.bm[y][x] : m.th] || "#3d3a5c";
      k.fillRect(x, y, 1, 1);
    }),
  );
  return (m.mc = c);
}
function drawMini(mw, mh, CX, CY, fx, fy, t) {
  const S = Math.min(1, 84 / mw),
    w = mw * S,
    h = mh * S,
    ox = Math.round(VW - w - 4),
    oy = 4;
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#000";
  ctx.fillRect(ox - 2, oy - 2, w + 4, h + 4);
  ctx.globalAlpha = 0.92;
  const sm = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mini2(mp), ox, oy, w, h);
  ctx.imageSmoothingEnabled = sm;
  if (mp === "O") {
    ctx.globalAlpha = 1;
    TELES.forEach((e) => {
      ctx.fillStyle = F.tp[e.wp] ? "#7ef0c8" : "#8a87b8";
      ctx.fillRect(
        Math.round(ox + e.x * S) - 1,
        Math.round(oy + e.y * S) - 1,
        3,
        3,
      );
    });
    ctx.fillStyle = "#ff6b8b";
    RV.list.forEach((r) =>
      ctx.fillRect(Math.round(ox + r.x * S), Math.round(oy + r.y * S), 2, 2),
    );
  }
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.strokeRect(
    ox + (CX >> 4) * S + 0.5,
    oy + (CY >> 4) * S + 0.5,
    (VW / 16) * S,
    (VH / 16) * S,
  );
  ctx.globalAlpha = 1;
  ctx.fillStyle = (t / 250) % 2 < 1 ? "#ffd166" : "#fff";
  ctx.fillRect(Math.round(ox + fx * S) - 1, Math.round(oy + fy * S) - 1, 3, 3);
}

/* ---------- NPC & dialog ---------- */
const jagaLines = () =>
  F.q.raja >= 1
    ? ["Panggilan Raja sudah kami terima. Silakan masuk, Penjaga Angka."]
    : ri() >= 4
      ? [
          "Rank A! Raja memang menunggumu. Tapi ambil dulu misi 'Panggilan Raja' di Papan Quest Guild, baru kami izinkan masuk.",
        ]
      : [
          `Istana hanya terbuka bagi petualang Rank A ke atas atau yang dipanggil Raja. Rank-mu sekarang ${rk()}.`,
        ];
Object.assign(N, {
  jagaistana: () => dlg("Penjaga Istana", jagaLines()),
  gerbang: () =>
    dlg("Penjaga Gerbang", [
      "Selamat datang di Kota Kerajaan Aksioma! Perjalananmu pasti panjang.",
      "Sentuh Batu Teleportasi di alun-alun, supaya lain kali kamu bisa kembali ke sini dalam sekejap.",
    ]),
  dagang: () => shop(),
  nomad: () => shop(),
  tabib: () => {
    Pl.hp = mhp();
    Pl.fp = Math.max(Pl.fp, Math.round(mmp() / 2));
    SND.sfx("heal");
    hud();
    dlg("Tabib Kerajaan", [
      "Biar kuperiksa... lukamu sudah kuobati. HP dan Manamu pulih. Istirahatlah sejenak, Penjaga.",
    ]);
  },
  ranger: () =>
    dlg("Penjaga Hutan", [
      "Hutan Rimba Akar rawan bandit. Tiap kira-kira 20 langkah di hutan, ada 30% kemungkinan mereka menyergap.",
      "Pos ini aman, tidak ada monster yang berani mendekat. Bawa ramuan dan jangan kabur dari bandit: mereka merampas koinmu!",
      "Sentuh batu di sebelah sana untuk membuka titik teleportasi. Padang Pasir ada di timur.",
    ]),
  kuda: () =>
    dlg("Tukang Kuda", [
      "Kuda-kuda kerajaan hanya untuk bangsawan. Kamu? Jalan kaki saja, atau pakai Gulungan Teleportasi.",
      "Dari gerbang barat, jejak kafilah membawamu ke Padang Pasir dan Hutan Rimba. Jauh sekali!",
    ]),
  bangsawan: () =>
    dlg("Anak Bangsawan", [
      "Kakak petualang? Hebat! Katanya Kakak mengalahkan Naga Parabola sendirian.",
      "Aku sedang belajar pecahan. Kata Ibu Ratu, penyebut yang sama itu mempermudah segalanya.",
    ]),
  tamu: () =>
    dlg("Tamu Kerajaan", [
      "Aku datang dari seberang gurun untuk menghadiri jamuan istana. Kusangka kota ini lebih dekat!",
      "Hati-hati di gurun: Kalajengking Sudut, Mumi Variabel, dan Kobra Modulo menyerang tanpa aba-aba.",
    ]),
  pejabat: () =>
    dlg("Pejabat Kerajaan", [
      `Catatan kerajaan: Guild Penjaga Angka kini Rank ${rk()} dengan ${F.gp} GP.`,
      "Raja hanya memanggil petualang Rank A ke atas. Pertahankan nama baik Guild.",
    ]),
  pelayan: () =>
    dlg("Pelayan Istana", [
      "Selamat datang! Mohon jangan menyentuh vas di dekat Ruang Tahta. Itu peninggalan leluhur Raja.",
    ]),
  prajurit: () =>
    dlg("Prajurit Istana", [
      "Disiplin, setia, dan selalu waspada. Itu semboyan kami. Silakan menghadap Raja.",
    ]),
  ksatria: () =>
    dlg("Ksatria Kerajaan", [
      "Aku dilatih sejak kecil untuk melindungi Raja dan rakyat. Kalau kamu berniat jahat, urusannya denganku.",
    ]),
  ratu: () =>
    dlg("Ratu Kerajaan", [
      "Selamat datang, Penjaga Angka. Aku menyeimbangkan hati dan akal dalam kerajaan ini.",
      "Hitungan Numeria yang kacau membuat rakyat cemas. Kami berharap padamu.",
    ]),
  pangeran: () =>
    dlg("Pangeran Mahkota", [
      "Jadi kamu petualang dari Guild? Aku ingin sekali ikut bertarung, tapi Ayahanda melarangku.",
      "Kalau kelak aku jadi raja, aku ingin kerajaan ini sepandai kamu berhitung.",
    ]),
  putri: () => {
    if (!F.putriGift) {
      F.putriGift = 1;
      Pl.pot++;
      SND.sfx("chest");
      return dlg("Putri Kerajaan", [
        "Kamu yang dipanggil Ayahanda? Anggun sekali caramu berjalan di istana.",
        "Terimalah Ramuan HP ini. Kudapat dari taman istana. Semoga selamat di perjalanan pulang!",
      ]);
    }
    dlg("Putri Kerajaan", [
      "Rakyat sangat menyayangimu. Jangan lupa istirahat, ya.",
    ]);
  },
  raja: () => {
    if (F.q.raja === 1 && !F.raja) {
      F.raja = 1;
      SND.sfx("win");
      return dlg(
        "Raja Aksioma",
        [
          "Jadi inilah Penjaga Angka yang namanya terdengar sampai ke istana. Mendekatlah.",
          "Sang Nol memecahkan Kristal Aksioma. Hitungan di seluruh Numeria kacau, dan serpihan terakhir tersembunyi di Jurang Tak Hingga.",
          "Kerajaan menyiapkan pasukan, tapi hanya Penjaga Angka yang bisa menyentuh serpihan itu tanpa terbakar.",
          "Terimalah restu Kerajaan. Kembalilah ke Guild dan klaim hadiahmu di Papan Quest. Perjalanan berikutnya akan segera dimulai.",
        ],
        () => {
          hud();
          idle();
          say(
            "Kembali ke Papan Quest Guild untuk klaim hadiah 'Panggilan Raja'. Pakai Batu Teleportasi biar cepat!",
          );
        },
      );
    }
    if (F.raja)
      return dlg("Raja Aksioma", [
        "Kerajaan ini berutang budi padamu, Penjaga Angka. Pergilah, dunia menunggu.",
      ]);
    dlg("Raja Aksioma", ["Hm? Siapa yang mengizinkanmu masuk?"]);
  },
});
{
  const _eu = N.euclid;
  N.euclid = () => {
    if (ri() >= 4 && !F.q.raja && !F.rajaInfo) {
      F.rajaInfo = 1;
      return dlg("Guildmaster Euclid", [
        "Rank A! Kabar tentangmu sampai ke istana. Raja memanggilmu secara langsung.",
        "Ambil misi 'Panggilan Raja' di Papan Quest. Kota Kerajaan jauh di tenggara: keluar lewat gerbang selatan Kota Bangun, lewati Hutan Rimba, lalu seberangi Padang Pasir.",
        "Sentuh Batu Teleportasi di sepanjang jalan. Setelah ditemukan, kamu bisa kembali ke sini dengan cepat.",
      ]);
    }
    _eu();
  };
}
