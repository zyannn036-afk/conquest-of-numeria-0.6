/* ===== Numeria Quest — NPC Kerajaan (mengikuti Royal Kingdom Character Concept Sheet) =====
   Dimuat setelah world.js. Memakai badan dasar NB + aksesori kepala NH milik world.js,
   ditambah opsi: mahkota, rambut panjang, gaun, janggut, kacamata, tombak. Warna utama: biru tua, putih, emas. */
Object.assign(NH, {
  crown: [
    "...KAKAKKAKAK...",
    "...KAAAXXAAAK...",
    "..KHHHHHHHHHHK..",
    "..KHSSSSSSSSHK..",
  ],
  tiara: [
    "....KKKAAKKK....",
    "...KHHAXXAHHK...",
    "..KHHHHHHHHHHK..",
    "..KHSSSSSSSSHK..",
  ],
  circ: [
    "....KKKKKKKK....",
    "...KHHhHHHHHK...",
    "..KHAAAXAAAAHK..",
    "..KHSSSSSSSSHK..",
  ],
  mcap: [
    "....KKKKKKKK....",
    "...KXXXXXXXXK...",
    "..KHXXXXXXXXHK..",
    "..KHSSSSSSSSHK..",
  ],
  bow: [
    "....KKKKKKKK....",
    "...KHHhHHHHHK...",
    "..KHHHRRHHHHHK..",
    "..KHSSSSSSSSHK..",
  ],
});
Object.assign(NP, { L: "#7a5a3a", l: "#e6ebf5", G: "#e2b84a", g: "#b8902a" });
const SKIRT = [
  "..KTTTTttTTTTK..",
  ".KTTTTTttTTTTTK.",
  ".KTTTTTVVTTTTTK.",
  "KTTTTTTVVTTTTTTK",
  "KTtTTTTVVTTTTtTK",
  "KTTtTTTVVTTTtTTK",
  "KKKKKKKKKKKKKKKK",
];
function mkRoyal(o, c = {}) {
  const b = mkNpc(o, c.hat, c.cape),
    m = b.m.map((r) => r.split(""));
  if (c.beard) {
    m[7] = "...KHHHMMHHHK...".split("");
    m[8] = "....KKHHHHKK....".split("");
  }
  if (c.glass) m[5] = "..KHaEaSSaEaHK..".split("");
  if (c.long)
    for (let j = 8; j <= 16; j++) {
      if (m[j][2] === "K") m[j][2] = "H";
      if (m[j][13] === "K") m[j][13] = "H";
      if (m[j][1] === "." || m[j][1] === "K") m[j][1] = j % 3 ? "H" : "h";
      if (m[j][14] === "." || m[j][14] === "K") m[j][14] = j % 3 ? "H" : "h";
    }
  if (c.dress) SKIRT.forEach((r, i) => (m[17 + i] = r.split("")));
  if (c.spear) {
    m[2][15] = "l";
    for (let j = 3; j <= 22; j++) m[j][15] = "L";
  }
  return { p: b.p, m: m.map((r) => r.join("")), oy: 8 };
}
const NAVY = "#2f4fa8",
  NAVD = "#1f3578",
  WH = "#f4f1ea",
  CRM = "#e8e1cf";
Object.assign(SP, {
  raja: mkRoyal(
    {
      H: "#dcdcdc",
      h: "#ffffff",
      A: "#e2b84a",
      a: "#b8902a",
      X: "#ff6b6b",
      T: "#23284a",
      t: "#161a36",
      V: "#e2b84a",
      Y: "#e2b84a",
      P: "#2a2a3a",
      p: "#1a1a28",
      R: NAVY,
    },
    { hat: "crown", beard: 1, cape: 1 },
  ),
  ratu: mkRoyal(
    {
      H: "#e6e2f0",
      h: "#ffffff",
      A: "#e2b84a",
      a: "#b8902a",
      X: "#6fa8ff",
      T: WH,
      t: "#cfc7ad",
      V: NAVY,
      E: "#8a6ad6",
    },
    { hat: "tiara", long: 1, dress: 1 },
  ),
  pangeran: mkRoyal(
    {
      H: "#d8d8ee",
      h: "#ffffff",
      A: "#e2b84a",
      X: "#d2284d",
      E: "#d2284d",
      T: NAVY,
      t: NAVD,
      V: WH,
      Y: "#e2b84a",
      P: WH,
      p: "#cfc7ad",
      O: "#3a3a4a",
      R: NAVD,
    },
    { hat: "circ", cape: 1 },
  ),
  putri: mkRoyal(
    {
      H: "#f0d58a",
      h: "#fff0b8",
      A: "#e2b84a",
      a: "#b8902a",
      X: "#6fa8ff",
      T: WH,
      t: "#d8d2bc",
      V: NAVY,
      E: "#c88a2a",
    },
    { hat: "tiara", long: 1, dress: 1 },
  ),
  ksatria: mkRoyal(
    {
      H: "#5a3a22",
      T: "#aab3c6",
      t: "#6c748c",
      V: NAVY,
      Y: "#e2b84a",
      P: "#8a93a8",
      p: "#5d6278",
      O: "#4a4a58",
      R: NAVY,
    },
    { cape: 1 },
  ),
  prajurit: mkRoyal(
    {
      H: "#3a2a1c",
      A: "#b8c0d0",
      a: "#7c869c",
      T: NAVY,
      t: NAVD,
      V: "#dfe6f2",
      P: "#c8d0e0",
      p: "#9aa3b8",
      O: "#4a4a58",
    },
    { hat: "helm", spear: 1 },
  ),
  gerbang: mkRoyal(
    {
      H: "#3a2a1c",
      A: "#9aa3b8",
      a: "#6c748c",
      T: "#5a6aa0",
      t: "#3a4878",
      V: "#dfe6f2",
      P: "#7c869c",
      p: "#5d6278",
      O: "#3a3a46",
    },
    { hat: "helm", spear: 1 },
  ),
  pejabat: mkRoyal(
    {
      H: "#4a3322",
      T: "#23202e",
      t: "#15131e",
      V: CRM,
      Y: "#e2b84a",
      P: "#1f1c2a",
      p: "#141220",
    },
    { glass: 1 },
  ),
  pelayan: mkRoyal(
    { H: "#6b4226", X: WH, T: "#2c2836", t: "#1c1824", V: WH },
    { hat: "mcap", dress: 1 },
  ),
  tabib: mkRoyal(
    {
      H: "#d8d8d8",
      A: WH,
      a: "#cfc7ad",
      X: "#fff",
      T: WH,
      t: "#cfc7ad",
      V: NAVY,
      P: "#e8e2d0",
      p: "#c8c0a8",
    },
    { hat: "hood" },
  ),
  kuda: mkRoyal(
    {
      H: "#4a3322",
      A: "#6b4a35",
      a: "#4a3223",
      T: "#d8c8a0",
      t: "#b8a888",
      V: "#7a4b2a",
      P: "#4a3a2a",
      p: "#33281f",
      O: "#3a2a1a",
    },
    { hat: "brim" },
  ),
  dagang: mkRoyal(
    {
      H: "#3a2a1c",
      A: "#e08a2f",
      a: "#b8641a",
      X: "#ffd9a0",
      T: "#8a5a2b",
      t: "#5e3a1a",
      V: "#e2b84a",
      P: "#3b3030",
      p: "#2a2020",
    },
    { hat: "scarf" },
  ),
  bangsawan: mkRoyal(
    { H: "#8a5a2b", h: "#b07a44", R: "#d2284d", T: NAVY, t: NAVD, V: WH },
    { hat: "bow", dress: 1 },
  ),
  tamu: mkRoyal(
    {
      H: "#2a1c2a",
      T: "#2a2d3e",
      t: "#1a1c2a",
      V: "#cfc7ad",
      Y: "#e2b84a",
      P: "#2a2a3a",
      p: "#1a1a28",
    },
    {},
  ),
  ranger: mkRoyal(
    {
      H: "#5a3a22",
      A: "#3f7a4a",
      a: "#27503a",
      X: "#9cd8a0",
      T: "#6b8a4a",
      t: "#4a6a30",
      V: "#8a5a2b",
      P: "#4a3a2a",
      p: "#33281f",
    },
    { hat: "hood" },
  ),
  nomad: mkRoyal(
    {
      H: "#2a1c14",
      A: WH,
      a: "#cfc7ad",
      X: "#fff",
      T: "#c9a050",
      t: "#9a7a30",
      V: "#8a5a2b",
      P: "#e8dcc0",
      p: "#c8b890",
      O: "#6b4a35",
    },
    { hat: "scarf" },
  ),
});
