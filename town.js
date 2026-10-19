/* ===== Numeria Quest — Penginapan (simpan game), petualang, dan warga yang hidup =====
   Dimuat setelah realm.js. Warga bisa mondar-mandir (pace), berkeliaran (wander), mengobrol berpasangan,
   menyapu, menempa, memancing, menyiram tanaman, membaca, bermain musik, minum, atau tidur. */

/* ---------- ubin baru: tempat tidur (e) & meja (m) ---------- */
{
  const _tx = tileX;
  tileX = function (c, X, Y, x, y, th, t) {
    const fl = (col, a, b, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(X + a, Y + b, w, h);
    };
    if (c === "e") {
      fl("rgba(0,0,0,.25)", 1, 14, 15, 2);
      fl("#6b4220", 0, 2, 16, 13);
      fl("#f4f1ea", 1, 3, 14, 11);
      fl("#fff", 2, 4, 5, 4);
      fl("#2f4fa8", 1, 8, 14, 6);
      fl("#4a6ad0", 1, 8, 14, 2);
    } else if (c === "m") {
      fl("rgba(0,0,0,.25)", 1, 14, 15, 2);
      fl("#6b4220", 2, 10, 2, 5);
      fl("#6b4220", 12, 10, 2, 5);
      fl("#b87a3a", 0, 4, 16, 8);
      fl("#d9a05a", 0, 4, 16, 2);
      fl("#f4ecd0", 4, 5, 3, 3);
      fl("#d8b04a", 10, 6, 3, 3);
    } else _tx(c, X, Y, x, y, th, t);
  };
}
MN.J = "Penginapan";
EN.J = [];

/* ---------- peta penginapan (18x10) ---------- */
mkm(
  "J",
  "i",
  [
    ["B", 3, 3, 3, 1],
    ["B", 7, 3, 3, 1],
    ["e", 13, 1],
    ["e", 15, 1],
    ["e", 15, 4],
    ["m", 4, 6],
    ["m", 9, 6],
    ["m", 14, 7],
    ["m", 12, 3],
  ],
  [[9, 9]],
  18,
  10,
);

/* ---------- pintu penginapan di luar (Desa Satuan, Kota Bangun, Kota Kerajaan) ---------- */
function setT(x, y, c) {
  const r = MP.O.g[y];
  MP.O.g[y] = r.slice(0, x) + c + r.slice(x + 1);
}
for (let x = 27; x <= 30; x++) {
  setT(x, 7, "B");
  setT(x, 8, "B");
}
setT(28, 8, "E");
[
  { x: 28, y: 8, land: [28, 9], name: "Penginapan Pondok Satu" },
  { x: 12, y: 14, land: [12, 15], name: "Penginapan Bulan Sabit" },
  { x: 192, y: 102, land: [192, 103], name: "Penginapan Mahkota Emas" },
].forEach((i) =>
  EN.O.push({
    t: "portal",
    x: i.x,
    y: i.y,
    to: "J",
    tx: 9,
    ty: 8,
    f: [0, -1],
    inn: i.land,
    innName: i.name,
    sign: 1,
  }),
);
{
  const _p = H.portal;
  H.portal = (e) => {
    if (e.inn) {
      F.inn = e.inn;
      F.innName = e.innName;
      MN.J = e.innName;
    }
    if (e.dyn) Object.assign(e, { tx: F.inn[0], ty: F.inn[1], f: [0, 1] });
    _p(e);
  };
}

/* ---------- simpan / muat ---------- */
const SAVE_KEY = "nq-save-v1";
function readSave() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!d || d.v !== 1) return null;
    const rk2 = RK[RT.filter((t) => d.F.gp >= t).length - 1];
    d.info = `Lv${d.Pl.lv} · Rank ${rk2} · ${d.Pl.coin} koin · ${new Date(d.at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}`;
    return d;
  } catch (e) {
    return null;
  }
}
function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        v: 1,
        at: Date.now(),
        Pl,
        F,
        ST,
        lvl,
        Hh,
        wrongT,
        pos: F.inn || [px, py],
      }),
    );
    return true;
  } catch (e) {
    return false;
  }
}
function loadGame() {
  const d = readSave();
  if (!d) return false;
  newGame();
  Pl = d.Pl;
  ST = d.ST;
  lvl = d.lvl;
  Hh = d.Hh;
  wrongT = d.wrongT;
  Object.keys(F).forEach((k) => delete F[k]);
  Object.assign(F, d.F);
  RV.list = [];
  RV.cur = null;
  mp = "O";
  [px, py] = d.pos;
  face = [0, 1];
  mv = null;
  held = null;
  trail = [0, 1, 2, 3].map(() => [px, py]);
  fd = 12;
  zl = 150;
  W.on = true;
  mode = "world";
  applyEq();
  fixPl(); // lengkapi status/cooldown untuk save lama
  syncParty(); // bangun ulang party dari data save
  SND.music(zone());
  idle();
  say("Game dimuat. Selamat datang kembali, Penjaga Angka!");
  return true;
}
function innMenu(msg) {
  busy = true;
  const sv = readSave();
  say(msg || "Penjaga penginapan menyambutmu dengan ramah.");
  ui(
    `<div class="card"><b class="ok">${F.innName || "Penginapan"}</b> <span class="qm">Koin ${Pl.coin}</span>` +
      `<div class="irow"><div><b>Menginap</b><br><small>Pulihkan HP dan Mana sampai penuh · 20 koin</small></div><button class="b" id="in1" ${Pl.coin < 20 ? "disabled" : ""}>Menginap</button></div>` +
      `<div class="irow"><div><b>Simpan Game</b><br><small>${sv ? "Save terakhir: " + sv.info : "Belum ada save."}</small></div><button class="b" id="in2">Simpan</button></div>` +
      (sv
        ? `<div class="irow"><div><b>Muat Save</b><br><small>${sv.info}</small></div><button class="b g" id="in3">Muat</button></div>`
        : "") +
      `<div class="row" style="margin-top:8px"><button class="b g" id="in4">Tutup</button></div></div>`,
  );
  $("#in1").onclick = () => {
    Pl.coin -= 20;
    Pl.hp = mhp();
    Pl.fp = mmp();
    fd = 40;
    SND.sfx("heal");
    hud();
    innMenu("Kamu tidur nyenyak. HP dan Mana pulih penuh!");
  };
  $("#in2").onclick = () => {
    const ok = saveGame();
    SND.sfx(ok ? "quest" : "wrong");
    innMenu(
      ok
        ? "Game tersimpan! Kamu bisa melanjutkannya kapan saja."
        : "Gagal menyimpan (penyimpanan browser tidak tersedia).",
    );
  };
  if ($("#in3")) $("#in3").onclick = () => loadGame();
  $("#in4").onclick = idle;
}
N.penginap = () => innMenu();

/* ---------- sprite warga & petualang ---------- */
Object.assign(SP, {
  pria: mkRoyal(
    {
      A: "#d8b04a",
      a: "#b8902a",
      T: "#6b8a4a",
      t: "#4a6a30",
      V: "#d8c8a0",
      P: "#5a4630",
      p: "#3e3022",
    },
    { hat: "brim" },
  ),
  pria2: mkRoyal(
    {
      H: "#2a1c14",
      T: "#7a3a3a",
      t: "#5a2a2a",
      V: CRM,
      P: "#3a3a4a",
      p: "#262632",
    },
    {},
  ),
  wanita: mkRoyal(
    { H: "#6b3a26", h: "#8a5a3a", T: "#c05a6a", t: "#9a3a4a", V: WH },
    { long: 1, dress: 1 },
  ),
  ibu: mkRoyal(
    {
      H: "#3a2a1c",
      A: "#4a8a5a",
      a: "#2f6a3f",
      X: "#9cd8a0",
      T: "#d8b04a",
      t: "#b8902a",
      V: WH,
    },
    { hat: "scarf", dress: 1 },
  ),
  nelayan: mkRoyal(
    {
      A: "#3a6bd6",
      a: "#27489a",
      T: "#e8e4d8",
      t: "#b8b4a4",
      V: "#3a6bd6",
      P: "#4a5a6a",
      p: "#33404e",
    },
    { hat: "brim" },
  ),
  pandai: mkRoyal(
    {
      H: "#2a1c14",
      T: "#8a3a2a",
      t: "#5a2a1a",
      V: "#3a2a22",
      P: "#2a2a2a",
      p: "#1a1a1a",
      O: "#1a1a1a",
    },
    { beard: 1 },
  ),
  tukangsapu: mkRoyal(
    {
      A: "#c0703a",
      a: "#8a4a1a",
      X: "#ffd9a0",
      T: "#8a7a5a",
      t: "#6a5a3a",
      V: CRM,
    },
    { hat: "scarf" },
  ),
  bocah: mkRoyal(
    {
      H: "#8a5a2b",
      h: "#b07a44",
      T: "#e08a2f",
      t: "#b8641a",
      V: "#fff0c0",
      P: "#3a6bd6",
      p: "#27489a",
    },
    {},
  ),
  kakek2: mkRoyal(
    {
      H: "#e6e6e6",
      h: "#fff",
      T: "#7a6a5a",
      t: "#5a4a3a",
      V: "#c0b090",
      P: "#4a3a2a",
      p: "#33281f",
    },
    { beard: 1 },
  ),
  penginap: mkRoyal(
    { A: WH, X: WH, H: "#6b4226", T: "#7a4b2a", t: "#5a3a1a", V: WH },
    { hat: "mcap", dress: 1 },
  ),
  tukangkebun: mkRoyal(
    {
      A: "#4a8a5a",
      a: "#2f6a3f",
      T: "#6b8a4a",
      t: "#4a6a30",
      V: "#8a5a2b",
      P: "#4a3a2a",
    },
    { hat: "brim" },
  ),
  musisi: mkRoyal(
    {
      A: "#7a3fb5",
      a: "#512a80",
      T: "#a24dff",
      t: "#6a2bb5",
      V: "#ffd166",
      P: "#3a2a4a",
      p: "#261a36",
    },
    { hat: "brim" },
  ),
  pembaca: mkRoyal(
    { H: "#4a3322", T: "#3a4a6a", t: "#26324a", V: CRM, P: "#2a2a3a" },
    { glass: 1 },
  ),
  pdekar: mkRoyal(
    {
      H: "#5a3a22",
      T: "#aab3c6",
      t: "#6c748c",
      V: "#a8222f",
      R: "#a8222f",
      P: "#5a4a3a",
      p: "#3e3022",
    },
    { cape: 1 },
  ),
  pmage: mkRoyal(
    {
      A: "#7a3fb5",
      a: "#512a80",
      X: "#c99aff",
      H: "#b0a0d0",
      T: "#6a2bb5",
      t: "#4a1a85",
      V: "#e2b84a",
      P: "#3a2a5a",
    },
    { hat: "witch" },
  ),
  pmanah: mkRoyal(
    {
      A: "#3f7a4a",
      a: "#27503a",
      X: "#9cd8a0",
      H: "#5a3a22",
      T: "#6b8a4a",
      t: "#4a6a30",
      V: "#8a5a2b",
      P: "#4a3a2a",
    },
    { hat: "hood" },
  ),
  pencuri: mkRoyal(
    {
      A: "#3a3a46",
      a: "#222230",
      X: "#8a8aa0",
      H: "#1a1a22",
      T: "#2a2a36",
      t: "#1a1a24",
      V: "#8a2a3a",
      P: "#22222c",
      p: "#16161e",
    },
    { hat: "hood" },
  ),
  pendeta: mkRoyal(
    {
      A: WH,
      a: "#cfc7ad",
      X: "#fff",
      H: "#c8a060",
      T: WH,
      t: "#cfc7ad",
      V: "#e2b84a",
      P: "#e8e2d0",
      p: "#c8c0a8",
    },
    { hat: "scarf" },
  ),
  pveteran: mkRoyal(
    {
      A: "#9aa3b8",
      a: "#6c748c",
      H: "#8a8a8a",
      T: "#6a5a4a",
      t: "#4a3a2a",
      V: "#aab3c6",
      R: "#3a4a6a",
      P: "#4a4036",
    },
    { hat: "helm", beard: 1, cape: 1 },
  ),
});

/* ---------- warga yang hidup: gerak & aktivitas ---------- */
const SOLIDC = "#TwBDLfSEMCRPQUZHem";
function spawnNpc(map, e) {
  const g = MP[map].g,
    EL = EN[map],
    ok = (x, y) =>
      x > 0 &&
      y > 0 &&
      y < g.length - 1 &&
      x < g[0].length - 1 &&
      !SOLIDC.includes(g[y][x]) &&
      !EL.some((o) => o.x === x && o.y === y);
  let best = null;
  for (let r = 0; r <= 3 && !best; r++)
    for (let dy = -r; dy <= r && !best; dy++)
      for (let dx = -r; dx <= r && !best; dx++)
        if (
          Math.max(Math.abs(dx), Math.abs(dy)) === r &&
          ok(e.x + dx, e.y + dy)
        )
          best = [e.x + dx, e.y + dy];
  if (!best) return console.warn("NPC tidak muat", e.d && e.d[0], e.x, e.y);
  [e.x, e.y] = best;
  const f = e.fx || {};
  e.fx = Object.assign(
    {
      face: 1,
      ox: 0,
      oy: 0,
      tm: R(10, 80),
      go: 0,
      ph: R(0, 1),
      home: [e.x, e.y],
    },
    f,
  );
  EL.push(e);
}
const npc = (who, sp, x, y, lines, fx, more) => ({
  t: "npc",
  id: "gen",
  d: [who, lines],
  sp,
  x,
  y,
  fx,
  ...more,
});
const oV = (x, y) => [x + 13, y],
  oK = (x, y) => [x, y + 10],
  oR = (x, y) => [x + 145, y + 86];
const adv = (who, sp, [x, y], lines, fx, more) =>
  npc(who, sp, x, y, lines, fx, more);
const wk = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`;
[
  /* --- Desa Satuan --- */
  npc(
    "Penduduk Desa",
    "pria",
    ...oV(4, 5),
    [
      "Aku jalan pagi tiap hari. Desa ini tenang, kecuali kalau Slime muncul.",
      "Kalau mau cari penginapan, ada pondok di sebelah kanan, dekat Rumah Guild.",
    ],
    { pace: [...oV(4, 5), ...oV(12, 5)] },
  ),
  npc(
    "Nelayan Desa",
    "nelayan",
    ...oV(6, 3),
    [
      "Ssst, jangan berisik, nanti ikannya kabur! Kolam kecil ini penuh ikan bulat.",
      "Dapat satu ikan sehari saja sudah cukup bagiku.",
    ],
    { act: "fish", face: -1 },
  ),
  npc(
    "Penduduk Desa",
    "wanita",
    ...oV(10, 3),
    [
      "Katanya Guild butuh banyak petualang. Anakku ingin ikut, tapi dia masih kecil.",
    ],
    { act: "talk", face: 1, ph: 0 },
  ),
  npc(
    "Penduduk Desa",
    "pria2",
    ...oV(11, 3),
    ["Hitung-hitungan sekarang kacau. Harga sayur naik turun tak karuan!"],
    { act: "talk", face: -1, ph: 1 },
  ),
  npc(
    "Anak Desa",
    "bocah",
    ...oV(9, 8),
    [
      "Aku lari-lari terus! Kakak mau coba kejar aku?",
      "Kata Ibu, jangan dekat-dekat Slime.",
    ],
    { wander: 3, face: 1 },
  ),
  npc(
    "Petani",
    "kakek2",
    ...oV(5, 9),
    ["Zzz... hm? Oh, aku cuma memejamkan mata sebentar..."],
    { act: "sleep" },
  ),
  adv(
    "Rika (Petualang Rank D)",
    "pdekar",
    oV(18, 8),
    [
      "Aku Rika, baru Rank D. Penginapan di sini murah: 20 koin sudah bisa pulih penuh.",
      "Jangan lupa simpan game di penginapan sebelum berjalan jauh!",
    ],
    {},
  ),
  /* --- Kota Bangun --- */
  npc(
    "Pandai Besi",
    "pandai",
    24,
    13,
    [
      "Tang! Tang! Besi panas harus dipukul selagi merah.",
      "Aku sudah menempa perlengkapan separuh Guild. Pedang bagus butuh sabar.",
    ],
    { act: "hammer", face: -1 },
  ),
  npc(
    "Tukang Sapu",
    "tukangsapu",
    9,
    17,
    [
      "Tiap pagi kusapu jalanan ini. Debu pecahan Kristal Aksioma ada di mana-mana.",
    ],
    { act: "sweep", face: 1 },
  ),
  npc(
    "Warga Kota",
    "pria",
    23,
    17,
    [
      "Aku jalan-jalan sambil menghitung langkah. Seratus, seratus satu...",
      "Nah, sudah lupa lagi. Ulang dari awal!",
    ],
    { pace: [23, 17, 23, 21] },
  ),
  npc(
    "Warga Kota",
    "ibu",
    18,
    17,
    ["Katanya penginapan Bulan Sabit paling nyaman se-kota. Kasurnya empuk!"],
    { act: "talk", face: 1, ph: 0 },
  ),
  npc(
    "Warga Kota",
    "pria2",
    19,
    17,
    ["Betul! Pemiliknya juga ramah. Kamu bisa simpan petualanganmu di sana."],
    { act: "talk", face: -1, ph: 1 },
  ),
  npc(
    "Pembaca Buku",
    "pembaca",
    31,
    17,
    ["Ssst... aku sedang membaca soal pecahan. Seru, lho!"],
    { act: "read", face: -1 },
  ),
  npc("Anak Kota", "bocah", 33, 16, ["Kejar aku, kejar aku!"], {
    wander: 3,
    face: -1,
  }),
  npc(
    "Kakek Kota",
    "kakek2",
    15,
    37,
    ["Hoaaam... zzz... jembatan... lurus..."],
    { act: "sleep" },
  ),
  npc(
    "Tukang Kebun",
    "tukangkebun",
    18,
    13,
    ["Tanaman ini haus. Kalau dirawat, pohonnya rimbun dan teduh."],
    { act: "water", face: 1 },
  ),
  adv(
    "Mira (Penyihir Rank C)",
    "pmage",
    [17, 21],
    [
      wk(0),
      "Ilmu sihir itu sama dengan aljabar: cari yang tidak diketahui, lalu 'bum'!",
    ],
    {},
    { gift: "fpot" },
  ),
  adv(
    "Taro (Pemanah Rank C)",
    "pmanah",
    [27, 21],
    [
      "Dari gerbang selatan kota, jalan ke Hutan Rimba. Bandit di sana mengincar koin.",
      "Kalau bertemu bandit, lebih baik lawan daripada kabur.",
    ],
    {},
  ),
  adv(
    "Dax (Pendekar Rank B)",
    "pdekar",
    [29, 22],
    ["Kami baru kembali dari Padang Pasir. Panasnya bukan main!", wk(7)],
    { act: "talk", face: 1, ph: 0 },
  ),
  adv(
    "Nyx (Pencuri Rank B)",
    "pencuri",
    [30, 22],
    ["Hmph. Bandit hutan itu amatir. Mereka merampas koin tanpa gaya.", wk(8)],
    { act: "talk", face: -1, ph: 1 },
  ),
  /* --- Kota Kerajaan --- */
  npc(
    "Ksatria Patroli",
    "ksatria",
    ...oR(26, 11),
    ["Patroli rutin. Kota Kerajaan aman selama kami berjaga."],
    { pace: [...oR(26, 11), ...oR(26, 16)] },
  ),
  npc(
    "Prajurit Patroli",
    "prajurit",
    ...oR(29, 16),
    ["Patroli! Jangan membuat keributan di dekat Istana."],
    { pace: [...oR(29, 16), ...oR(29, 11)] },
  ),
  npc(
    "Bangsawati",
    "wanita",
    ...oR(22, 25),
    ["Gaun baru dari penjahit istana. Bagaimana menurutmu?"],
    { act: "talk", face: 1, ph: 0 },
  ),
  npc(
    "Bangsawan",
    "pria2",
    ...oR(23, 25),
    ["Pesta kerajaan minggu depan. Tamu datang dari seberang gurun."],
    { act: "talk", face: -1, ph: 1 },
  ),
  npc(
    "Pelayan Kota",
    "pelayan",
    ...oR(27, 13),
    ["Halaman Istana harus bersih sebelum Raja lewat."],
    { act: "sweep", face: 1 },
  ),
  npc(
    "Tukang Kebun Istana",
    "tukangkebun",
    ...oR(24, 11),
    ["Pohon-pohon di avenue ini ditanam kakek Raja."],
    { act: "water", face: -1 },
  ),
  npc(
    "Pandai Besi Istana",
    "pandai",
    ...oR(8, 20),
    ["Baju zirah ksatria selalu aku yang menempa. Tang! Tang!"],
    { act: "hammer", face: 1 },
  ),
  npc(
    "Pemain Musik",
    "musisi",
    ...oR(25, 21),
    [
      "La la la... lagu ini dimainkan setiap kali Raja masuk aula.",
      "Mau lagu lain? Aku hanya hafal yang ini.",
    ],
    { act: "music", face: 1 },
  ),
  npc(
    "Anak Bangsawan",
    "bocah",
    ...oR(31, 20),
    ["Kakak petualang! Mau main kejar-kejaran?"],
    { wander: 3 },
  ),
  adv(
    "Lena (Pendeta Rank A)",
    "pendeta",
    oR(5, 22),
    [
      "Aku Lena, penyembuh di party Rank A. Perjalanan ke kota ini memang melelahkan.",
    ],
    { act: "talk", face: 1, ph: 0 },
  ),
  adv(
    "Gareth (Pendekar Rank A)",
    "pdekar",
    oR(6, 22),
    [
      "Kami mengawal pedagang melewati gurun. Kobra dan mumi di sana bukan main-main.",
    ],
    { act: "talk", face: -1, ph: 1 },
  ),
  adv(
    "Veteran Orm (Rank S)",
    "pveteran",
    oR(10, 25),
    [
      "Dulu aku menantang Naga Parabola sendirian. Hampir tidak selamat!",
      "Satu nasihat: simpan game di penginapan sebelum bertarung besar.",
    ],
    {},
    { gift: "pot" },
  ),
  /* --- Oasis & Pos Hutan --- */
  npc(
    "Nelayan Oasis",
    "nelayan",
    96,
    37,
    ["Ikan di oasis ini cuma satu jenis, tapi besar-besar!"],
    { act: "fish", face: 1 },
  ),
  adv(
    "Sera (Pendeta Rank C)",
    "pendeta",
    [103, 31],
    [
      "Oasis ini aman untuk beristirahat. Sentuh batu teleportasi biar perjalananmu lebih mudah.",
    ],
    {},
  ),
  adv(
    "Brom (Veteran Rank B)",
    "pveteran",
    [60, 70],
    [
      "Aku bertahan di Pos Rimba ini. Bandit tidak berani mendekat ke batu teleportasi.",
      wk(4),
    ],
    {},
  ),
  /* --- di dalam penginapan --- */
].forEach((e) => spawnNpc("O", e));
[
  { t: "npc", id: "penginap", sp: "penginap", x: 6, y: 3, fx: { face: 1 } },
  npc(
    "Rika (Petualang)",
    "pdekar",
    3,
    6,
    ["Sup di sini enak sekali. Pemiliknya sampai hafal pesananku."],
    { act: "drink", face: 1 },
  ),
  npc(
    "Mira (Penyihir)",
    "pmage",
    10,
    6,
    ["Aku sedang menyusun mantra sambil minum teh herbal."],
    { act: "drink", face: -1 },
  ),
  npc(
    "Bard Lio",
    "musisi",
    7,
    7,
    ["Lagu tentang Kristal Aksioma, mau dengar? Ada tiga puluh bait!"],
    { act: "music", face: 1 },
  ),
  npc(
    "Veteran Orm",
    "pveteran",
    13,
    7,
    ["Kasur penginapan ini lebih lembut dari tempat tidurku sendiri."],
    { act: "drink", face: -1 },
  ),
  npc(
    "Petualang Lelah",
    "pendeta",
    13,
    1,
    ["Zzz... jangan bangunkan... masih sepuluh menit lagi..."],
    { act: "sleep" },
  ),
].forEach((e) => spawnNpc("J", e));
/* warga tambahan dari ocean.js (pelabuhan, pulau, kota seberang laut) */
(typeof OCEAN_NPCS !== "undefined" ? OCEAN_NPCS : []).forEach(([m, e]) => spawnNpc(m, e));
EN.J.push({
  t: "portal",
  x: 9,
  y: 9,
  to: "O",
  tx: 0,
  ty: 0,
  dyn: 1,
  f: [0, 1],
});

/* ---------- interaksi dengan warga ---------- */
H.npc = (e) => {
  if (e.fx) e.fx.face = px >= e.x ? 1 : -1;
  if (!e.d) return N[e.id]();
  let L = e.d[1];
  if (Array.isArray(L[0])) L = P(L);
  if (e.gift) {
    F.gift = F.gift || {};
    const k = e.d[0] + e.x;
    if (!F.gift[k]) {
      F.gift[k] = 1;
      e.gift === "pot" ? Pl.pot++ : Pl.fpot++;
      SND.sfx("chest");
      L = [
        ...L,
        `Ini, ambil ${e.gift === "pot" ? "Ramuan HP" : "Ramuan Mana"} dariku. Jaga dirimu!`,
      ];
    }
  }
  dlg(e.d[0], L);
};

/* ---------- pergerakan warga ---------- */
function nfree(x, y, self) {
  return (
    x > 0 &&
    y > 0 &&
    x < MP[mp].w - 1 &&
    y < MP[mp].h - 1 &&
    !solid(x, y) &&
    !(x === px && y === py) &&
    !(mv && x === px + mv.dx && y === py + mv.dy) &&
    !EN[mp].some((o) => o !== self && o.x === x && o.y === y && !gone(o)) &&
    !(mp === "O" && RV.list.some((r) => r.x === x && r.y === y))
  );
}
function updNpcs() {
  if (busy || UIX.open) return;
  for (const e of EN[mp]) {
    const f = e.fx;
    if (!f) continue;
    f.ox = Math.abs(f.ox) < 0.5 ? 0 : f.ox * 0.75;
    f.oy = Math.abs(f.oy) < 0.5 ? 0 : f.oy * 0.75;
    if (!(f.pace || f.wander)) continue;
    if (mp === "O" && Math.abs(e.x - px) + Math.abs(e.y - py) > 40) continue;
    if (--f.tm > 0) continue;
    let dx = 0,
      dy = 0;
    if (f.pace) {
      const [ax, ay, bx, by] = f.pace,
        tx = f.go ? bx : ax,
        ty = f.go ? by : ay;
      if (e.x === tx && e.y === ty) {
        f.go ^= 1;
        f.tm = R(60, 150);
        continue;
      }
      dx = Math.sign(tx - e.x);
      dy = dx ? 0 : Math.sign(ty - e.y);
      if (!nfree(e.x + dx, e.y + dy, e)) {
        f.tm = 20;
        continue;
      }
      f.tm = 16;
    } else {
      [dx, dy] = P([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [0, 0],
      ]);
      const nx = e.x + dx,
        ny = e.y + dy;
      if (
        (!dx && !dy) ||
        Math.abs(nx - f.home[0]) > f.wander ||
        Math.abs(ny - f.home[1]) > f.wander ||
        !nfree(nx, ny, e)
      ) {
        f.tm = R(30, 100);
        continue;
      }
      f.tm = R(0, 3) ? R(14, 40) : R(60, 140);
    }
    e.x += dx;
    e.y += dy;
    f.ox = -dx * 16;
    f.oy = -dy * 16;
    if (dx) f.face = dx;
  }
}
{
  const _wd = W.draw;
  W.draw = function (t) {
    updNpcs();
    _wd(t);
  };
}

/* ---------- gambar warga, aktivitas, dan papan penginapan ---------- */
const ln = (x0, y0, x1, y1, c) => {
  ctx.fillStyle = c;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++)
    ctx.fillRect(
      Math.round(x0 + ((x1 - x0) * i) / n),
      Math.round(y0 + ((y1 - y0) * i) / n),
      1,
      1,
    );
};
function drawLive(e, t, bob) {
  const f = e.fx,
    X = e.x * 16 + f.ox,
    Y = e.y * 16 + OY + f.oy,
    d = f.face < 0 ? -1 : 1,
    moving = Math.abs(f.ox) + Math.abs(f.oy) > 1,
    hop = moving && !rm ? -Math.round(Math.abs(Math.sin(t / 90)) * 2) : 0,
    px1 = (col, a, b, w, h) => {
      ctx.fillStyle = col;
      ctx.fillRect(Math.round(X + a), Math.round(Y + b), w, h);
    };
  ctx.fillStyle = "#000";
  ctx.globalAlpha = 0.3;
  ctx.fillRect(X + 3, Y + 14, 10, 2);
  ctx.globalAlpha = 1;
  spr(e.sp, X, Y + hop, 1, 1, null, 0, d < 0 ? 1 : 0);
  const a = f.act,
    still = rm ? 0 : 1;
  if (a === "talk") {
    if ((Math.floor(t / 1400) + f.ph) % 2 === 0) {
      px1("#fff", 4, -14, 14, 9);
      px1("#fff", 8, -5, 3, 2);
      ctx.fillStyle = "#1a1530";
      for (let i = 0; i <= Math.floor(t / 250) % 3; i++)
        ctx.fillRect(X + 6 + i * 4, Y - 10, 2, 2);
    }
  } else if (a === "sweep") {
    const sw = Math.round(Math.sin(t / 180) * 3 * still),
      bx = 8 + d * 8 + sw;
    px1("#8a5a2b", bx, 3, 1, 12);
    px1("#c8a050", bx - 2, 14, 5, 2);
    if (sw > 1) px1("rgba(200,180,150,.6)", bx - 4 * d, 13, 2, 1);
  } else if (a === "hammer") {
    const dn = t % 600 < 300;
    px1("#5a5a6a", 8 + d * 9, 11, 7, 4);
    px1("#8a8a9a", 8 + d * 9, 10, 7, 1);
    px1("#8a5a2b", 8 + d * 5, dn ? 7 : 1, 2, 6);
    px1("#aab3c6", 7 + d * 5, dn ? 6 : 0, 4, 3);
    if (dn && t % 600 < 120) {
      px1("#ffd166", 8 + d * 9 + 1, 8, 1, 1);
      px1("#ff9a3a", 8 + d * 9 + 4, 7, 1, 1);
    }
  } else if (a === "fish") {
    const bb = Math.round(Math.sin(t / 300) * still);
    ln(X + 8 + d * 3, Y + 6, X + 8 + d * 14, Y - 3, "#8a5a2b");
    ln(
      X + 8 + d * 14,
      Y - 3,
      X + 8 + d * 34,
      Y + 13 + bb,
      "rgba(255,255,255,.7)",
    );
    px1("#d2284d", 8 + d * 34 - 1, 12 + bb, 3, 3);
    px1("#fff", 8 + d * 34, 11 + bb, 1, 1);
  } else if (a === "water") {
    const dr = Math.floor(t / 120) % 4;
    px1("#4a8aff", 8 + d * 9, 7, 5, 4);
    px1("#8cc0ff", 8 + d * 9, 7, 5, 1);
    px1("#8cc0ff", 8 + d * 13 + (d > 0 ? 1 : -1), 9 + dr, 1, 1);
    px1("#8cc0ff", 8 + d * 14, 11 + dr, 1, 1);
  } else if (a === "sleep") {
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 2; i++) {
      const p = ((t / 90 + i * 20) % 40) / 40;
      ctx.globalAlpha = 1 - p;
      ctx.fillText("Z", X + 12 + p * 4 + i * 3, Y - 2 - p * 12);
    }
    ctx.globalAlpha = 1;
  } else if (a === "read") {
    const pg = Math.floor(t / 1800) % 2;
    px1("#8a2a3a", 4, 9, 8, 5);
    px1("#f4f1ea", 5, 10, 3, 3);
    px1("#f4f1ea", 8, 10, pg ? 3 : 2, 3);
  } else if (a === "music") {
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i < 2; i++) {
      const p = ((t / 80 + i * 18) % 36) / 36;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = i ? "#ffd166" : "#7ef0c8";
      ctx.fillText(
        "♪",
        X + 6 + i * 8 + Math.sin(t / 200 + i) * 2,
        Y - 2 - p * 14,
      );
    }
    ctx.globalAlpha = 1;
  } else if (a === "drink") {
    const up = Math.floor(t / 1500) % 3 === 0;
    px1("#d8b04a", 9 + d * 2, up ? 5 : 10, 3, 4);
    px1("#fff", 9 + d * 2, up ? 5 : 10, 3, 1);
  }
}
function drawSign(e) {
  const X = e.x * 16,
    Y = e.y * 16 + OY;
  ctx.fillStyle = "#4a2f18";
  ctx.fillRect(X + 1, Y - 8, 14, 8);
  ctx.fillStyle = "#b87a3a";
  ctx.fillRect(X + 2, Y - 7, 12, 6);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(X + 4, Y - 6, 4, 4);
  ctx.fillStyle = "#b87a3a";
  ctx.fillRect(X + 6, Y - 6, 3, 4);
  ctx.fillStyle = "#1a1530";
  ctx.fillRect(X + 10, Y - 5, 1, 3);
  ctx.fillRect(X + 12, Y - 5, 1, 3);
  ctx.fillRect(X + 10, Y - 5, 3, 1);
}
{
  const _e3 = ent;
  ent = function (e, t, bob) {
    if (e.t === "npc" && e.fx) return drawLive(e, t, bob);
    _e3(e, t, bob);
    if (e.t === "portal" && e.sign) drawSign(e);
  };
}

/* ---------- mulai game (dengan opsi lanjutkan save) ---------- */
newGame();
requestAnimationFrame(draw);
{
  const sv = readSave();
  if (sv) {
    busy = true;
    say("Ada petualangan yang tersimpan.");
    ui(
      `<div class="card"><b class="ok">Numeria Quest</b><div class="qm" style="margin:6px 0">Save ditemukan: ${sv.info}</div><div class="row"><button class="b" id="ct1">Lanjutkan</button><button class="b g" id="ct2">Game baru</button></div></div>`,
    );
    $("#ct1").onclick = () => loadGame();
    $("#ct2").onclick = idle;
    $("#ct1").focus();
  }
}
