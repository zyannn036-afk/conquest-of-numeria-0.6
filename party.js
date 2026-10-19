/* ===== Numeria Quest — Party bebas dengan petualang (Chapter 2) =====
   Dimuat paling akhir (setelah town.js dan dungeons.js).
   Di Chapter 2 pemain TIDAK otomatis digabung ke party. Para petualang menunggu di Rumah Guild
   dan bisa diajak sesuka hati (maks. MAXP orang), serta dikeluarkan lagi lewat Tas › Party.
   PM = anggota party yang sedang aktif (diubah di tempat, jadi script.js/world.js/dungeons.js tetap jalan).
   ROSTER = semua petualang yang bisa direkrut. Isi party disimpan di F.pm (indeks ROSTER) agar ikut tersimpan. */
const MAXP = 4; // pendamping maksimal (pemain + 4 = 5 orang)
const ROSTER = PM.splice(0); // Aria, Bram, Cleo, Dion jadi petualang biasa
Object.assign(ROSTER[0], {
  cr: 0.1,
  t: "Aku Aria, pendekar pedang. Kalau kamu mau, aku ikut menebas monster di sampingmu.",
});
Object.assign(ROSTER[1], {
  t: "Bram, sang tameng. Selama aku di depan, serangan musuh terasa jauh lebih ringan.",
});
Object.assign(ROSTER[2], {
  cr: 0.15,
  t: "Cleo, penyihir angka. Sihirku kadang meledak lebih besar dari yang kuduga.",
});
Object.assign(ROSTER[3], {
  heal: 15,
  t: "Dion, penyembuh. Aku tidak bisa bertarung, tapi selama aku di belakangmu, HP timmu akan terus pulih.",
});

/* petualang tambahan: pal = palet sprite NPC, o = warna efek serangan */
[
  {
    n: "Eko",
    r: "Pemanah",
    atk: 3,
    def: 0,
    cr: 0.2,
    sp: "m4",
    d: "Pemanah jitu · ikut menyerang",
    t: "Eko, pemanah. Anak panahku jarang meleset dari titik lemah musuh.",
    o: { B: "#3f7a4a", h: "#9cd8a0" },
    pal: {
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
    hat: "hood",
  },
  {
    n: "Fira",
    r: "Penyihir Api",
    atk: 5,
    def: 0,
    cr: 0.1,
    sp: "m5",
    d: "Sihir api kuat · ikut menyerang",
    t: "Fira, penyihir api. Aku suka ledakan besar, semoga lawanmu tahan panas.",
    o: { B: "#e8743a", h: "#ffb27a" },
    pal: {
      H: "#e8743a",
      h: "#ffb27a",
      A: "#a8222f",
      a: "#6a1520",
      X: "#ffd166",
      T: "#a8222f",
      t: "#6a1520",
      V: "#f4f1ea",
      P: "#3a2530",
      p: "#241520",
    },
    hat: "witch",
  },
  {
    n: "Gani",
    r: "Penjaga",
    atk: 1,
    def: 4,
    sp: "m6",
    d: "+4 Pertahanan · ikut menyerang",
    t: "Gani, mantan penjaga gerbang yang bosan. Aku bisa jadi tembok hidupmu.",
    o: { B: "#c9a050", h: "#ffe9a0" },
    pal: {
      H: "#3a2a1c",
      A: "#c9a050",
      a: "#8a6a20",
      T: "#8a6a3a",
      t: "#5e4a24",
      V: "#dfe6f2",
      P: "#3a3030",
      p: "#2a2020",
      O: "#4a3a2a",
    },
    hat: "helm",
    cape: true,
  },
  {
    n: "Hana",
    r: "Tabib",
    atk: 0,
    def: 1,
    heal: 10,
    sp: "m7",
    d: "+1 Pertahanan · ikut menyerang · pulihkan 10 HP tiap menang",
    t: "Hana, tabib keliling. Aku tidak menyerang siapa pun, tapi ramuanku menjaga timmu tetap berdiri.",
    o: { B: "#5fb08a", h: "#c8f0dc" },
    pal: {
      H: "#2a1c14",
      A: "#5fb08a",
      a: "#3a7a5a",
      X: "#ffffff",
      T: "#e9f4ee",
      t: "#b8d0c4",
      V: "#5fb08a",
      P: "#e8e2d0",
      p: "#c8c0a8",
    },
    hat: "scarf",
  },
].forEach((a) => {
  SP[a.sp] = mkNpc(a.pal, a.hat, a.cape);
  delete a.pal;
  delete a.hat;
  delete a.cape;
  ROSTER.push(a);
});

/* ROLE & BARISAN: depan = petarung jarak dekat, belakang = sihir / busur / penyembuh.
   role: sword, tank (maju menebas) · mage, archer (menembak dari belakang) · healer (TIDAK menyerang, hanya memulihkan tim) */
[
  {
    role: "sword",
    row: "front",
    d: "Pendekar · barisan depan · menebas tiap giliran (kekuatan +3)",
  },
  {
    role: "tank",
    row: "front",
    d: "Tameng · barisan depan · +3 Pertahanan · ikut menyerang",
  },
  {
    role: "mage",
    row: "back",
    d: "Penyihir · barisan belakang · sihir jarak jauh (kekuatan +4)",
  },
  {
    role: "healer",
    row: "back",
    hl: 0.14,
    d: "Penyembuh · barisan belakang · tidak menyerang · pulihkan 14% HP maks tiap giliran",
  },
  {
    role: "archer",
    row: "back",
    d: "Pemanah jitu · barisan belakang · memanah dari jauh",
  },
  {
    role: "mage",
    row: "back",
    d: "Penyihir Api · barisan belakang · bola api jarak jauh",
  },
  {
    role: "tank",
    row: "front",
    d: "+4 Pertahanan · barisan depan · ikut menyerang",
  },
  {
    role: "healer",
    row: "back",
    hl: 0.1,
    hm: 4,
    d: "Tabib · barisan belakang · tidak menyerang · pulihkan 10% HP + 4 Mana tiap giliran",
  },
].forEach((o, i) => Object.assign(ROSTER[i], o));

/* petualang berdiri di aula Rumah Guild (peta "I") setelah Chapter 1 selesai; hilang dari aula saat ikut party */
const ADV_SPOT = [
  [3, 5],
  [5, 7],
  [7, 5],
  [11, 5],
  [12, 8],
  [16, 5],
  [16, 8],
  [4, 9],
];
ROSTER.forEach((m, i) => {
  m.id = "adv" + i;
  EN.I.push({
    t: "npc",
    id: m.id,
    x: ADV_SPOT[i][0],
    y: ADV_SPOT[i][1],
    sp: m.sp,
    on: () => !!F.ch2 && !PM.includes(m),
  });
  N[m.id] = () => meet(m);
});

function syncParty() {
  if (!Array.isArray(F.pm)) F.pm = F.party ? [0, 1, 2, 3] : []; // save lama: keempat anggota lama tetap ikut
  PM.length = 0;
  F.pm.forEach((i) => ROSTER[i] && PM.push(ROSTER[i]));
  F.party = PM.length ? 1 : 0;
}
function saveParty() {
  F.pm = PM.map((m) => ROSTER.indexOf(m));
  F.party = PM.length ? 1 : 0;
}
function meet(m) {
  dlg(m.n, [m.t, `${m.r} · ${m.d}`], () => offer(m));
}
function offer(m) {
  busy = true;
  const full = PM.length >= MAXP;
  say(`${m.n} menunggu jawabanmu.`);
  ui(
    `<div class="card"><b class="ok">${m.n}</b> · ${m.r} <span class="qm">(${rowName(m.row)})</span><div class="qm">Party sekarang ${PM.length + 1} dari ${MAXP + 1} orang.${full ? " Party sudah penuh. Keluarkan seseorang lewat Tas › Party." : ""}</div><div class="row" style="margin-top:8px"><button class="b" id="advy" ${full ? "disabled" : ""}>Ajak ke party</button><button class="b g" id="advn">Tidak dulu</button></div></div>`,
  );
  $("#advn").onclick = idle;
  $("#advy").onclick = () => {
    PM.push(m);
    saveParty();
    trail = [0, 1, 2, 3].map(() => [px, py]);
    SND.sfx("quest");
    hud();
    dlg(m.n, [`${m.n} bergabung! Party kini ${PM.length + 1} orang.`]);
  };
  if (!full) $("#advy").focus();
}
function kickMember(i) {
  const m = PM[i];
  if (!m) return;
  PM.splice(i, 1);
  saveParty();
  SND.sfx("equip");
  hud();
  inv(4);
  say(`${m.n} kembali ke Rumah Guild.`);
}
const ROLEIC = { sword: "⚔", tank: "⛨", mage: "✦", archer: "➶", healer: "✚" },
  rowName = (r) => (r === "front" ? "Depan" : "Belakang");
function partyTab() {
  const J = JOB(),
    all = [{ n: "Kamu", row: J.row }].concat(PM),
    names = (r) =>
      all
        .filter((m) => m.row === r)
        .map((m) => m.n)
        .join(", ") || "-";
  return (
    `<div class="qm" style="margin-bottom:4px">Formasi · Depan: <b>${names("front")}</b> · Belakang: <b>${names("back")}</b></div>` +
    `<div class="irow"><span class="ic">★</span><div><b>Kamu (${J.n})</b> <span class="qm">(${rowName(J.row)})</span><br><small>Pemimpin party · ${PM.length + 1}/${MAXP + 1} orang</small></div></div>` +
    PM.map(
      (m, i) =>
        `<div class="irow"><span class="ic">${ROLEIC[m.role] || "☻"}</span><div><b>${m.n}</b> · ${m.r} <span class="qm">(${rowName(m.row)})</span><br><small>${m.d}${m.cr ? ` · Kritis ${Math.round(m.cr * 100)}%` : ""}</small></div><button class="b g" data-k="${i}">Keluarkan</button></div>`,
    ).join("") +
    (PM.length
      ? ""
      : `<div class="qm" style="margin-top:6px">Kamu masih sendirian. Temui para petualang di Rumah Guild dan ajak siapa pun yang kamu mau (maksimal ${MAXP}).</div>`)
  );
}

/* ===== FORMASI & AKSI PARTY =====
   Tabel slot: [x kiri sprite, offset kaki dari garis tanah]. Ubah angka di sini untuk menggeser formasi.
   Kunci luar = barisan pemain (pedang = front, sihir/busur = back); kunci dalam = barisan rekan. */
const FM = {
  front: {
    front: [
      [64, 2],
      [30, -3],
      [2, 3],
      [96, -4],
    ], // rekan depan berdiri sejajar di samping-belakang pemain
    back: [
      [4, -18],
      [40, -22],
      [74, -18],
      [22, -28],
    ], // rekan belakang lebih jauh (lebih tinggi di layar)
  },
  back: {
    front: [
      [176, 2],
      [146, -6],
      [116, 2],
      [200, -8],
    ], // rekan depan berdiri di depan pemain
    back: [
      [2, -14],
      [30, -20],
      [2, 2],
      [34, 2],
    ],
  },
};
function fmUnits(tt, bx) {
  const T = FM[JOB().row],
    cnt = { front: 0, back: 0 },
    A = an.al;
  return PM.map((m) => {
    const row = m.row || "front",
      k = cnt[row]++,
      sl = T[row][Math.min(k, T[row].length - 1)];
    let dx = 0,
      dy = 0;
    if (A && A.m === m) {
      A.t++;
      const u = Math.min(1, A.t / 18);
      if (A.k === "melee")
        dx = Math.round(
          Math.sin(u * Math.PI) * Math.max(0, Math.min(110, bx - 52 - sl[0])),
        );
      else dy = -Math.round(Math.sin(u * Math.PI) * 9);
      if (A.t >= 18) an.al = null;
    }
    return {
      m,
      x: sl[0] + dx,
      y: GY - 48 + sl[1] + dy + (rm ? 0 : Math.round(Math.sin(tt / 320 + k))),
      back: row === "back",
    };
  });
}
const fmSpr = (p) => spr(p.m.sp, p.x, p.y, 3);
/* proyektil NPC (sihir/panah) dan efek penyembuhan */
function fmFx(pp) {
  an.np = (an.np || []).filter((n) => n.t <= n.dur + 2);
  const pxc = PMID(),
    pyc = GY - 70;
  an.np.forEach((n) => {
    n.t++;
    if (n.t < 0 || n.t > n.dur) return;
    const u = pp.find((q) => q.m === n.m);
    if (!u) return;
    const k = n.t / n.dur,
      ox = u.x + 40,
      oy = u.y + 16;
    if (n.type === "heal") {
      const x = ox + (pxc - ox) * k,
        y = oy + (pyc - oy) * k - Math.sin(k * Math.PI) * 30;
      ctx.save();
      jGlow(x, y, 14, "#5fe0a8", "#ffffff");
      ctx.restore();
      ctx.fillStyle = "#c8ffe4";
      ctx.fillRect(Math.round(x) - 1, Math.round(y) - 4, 3, 9);
      ctx.fillRect(Math.round(x) - 4, Math.round(y) - 1, 9, 3);
      if (k > 0.7)
        [{ x: pxc, y: pyc }]
          .concat(pp.map((q) => ({ x: q.x + 24, y: q.y + 20 })))
          .forEach((q, j) => {
            const z = (k - 0.7) / 0.3;
            ctx.globalAlpha = 1 - z * 0.8;
            ctx.fillStyle = "#7ef0c8";
            const yy = Math.round(q.y - z * 22 - (j % 2) * 6);
            ctx.fillRect(Math.round(q.x) - 1, yy - 4, 3, 9);
            ctx.fillRect(Math.round(q.x) - 4, yy - 1, 9, 3);
            ctx.globalAlpha = 1;
          });
    } else {
      const T = { x: ecx() - 10, y: 152 },
        cy = Math.min(oy, T.y) - 22,
        cx = (ox + T.x) / 2,
        q = (z) => ({
          x: (1 - z) * (1 - z) * ox + 2 * (1 - z) * z * cx + z * z * T.x,
          y: (1 - z) * (1 - z) * oy + 2 * (1 - z) * z * cy + z * z * T.y,
        }),
        p = q(k),
        p1 = q(Math.max(0, k - 0.05)),
        p2 = q(Math.min(1, k + 0.05));
      projShape(n.type, p.x, p.y, Math.atan2(p2.y - p1.y, p2.x - p1.x), n.t, {
        col: n.col,
        el: n.el,
      });
    }
  });
}
/* giliran party setelah serangan pemain: depan dulu, lalu belakang */
function fmAttack(done) {
  const order = PM.slice().sort(
    (a, b) => (a.row === "front" ? 0 : 1) - (b.row === "front" ? 0 : 1),
  );
  let i = 0;
  const next = () => {
    if (i >= order.length) return setTimeout(done, 300);
    const m = order[i++];
    if (m.role === "healer") return healTurn(m, next);
    const ranged = m.role === "mage" || m.role === "archer";
    an.al = { m, t: 0, k: ranged ? "cast" : "melee" };
    SND.sfx("whoosh");
    if (ranged) {
      const fire = m.o.B === "#e8743a";
      an.np = an.np || [];
      an.np.push({
        m,
        t: -5,
        dur: 14,
        type: m.role === "archer" ? "arrow" : fire ? "fire" : "orb",
        col: m.o.h,
      });
    }
    setTimeout(
      () => {
        const kr = Math.random() < (m.cr || 0),
          dmg = Math.max(
            1,
            Math.round(
              (3 + Math.floor(Pl.lv / 2) + m.atk) *
                (0.9 + Math.random() * 0.2) *
                (kr ? 1.5 : 1),
            ),
          );
        S.ehp -= dmg;
        SND.sfx("hit");
        SND.mon(S.e.sp, "hurt");
        an.se = 8;
        burst(ecx(), 165, m.o.B);
        slashFx(m.o.h, ranged ? "r" : "c", ecx(), 150, ranged ? 0.45 : 0.7);
        hitNum(dmg, m.o.h, { crit: kr });
        say(
          `${m.n} (${m.r}) ikut menyerang! ${dmg} damage${kr ? " (kritis!)" : ""}`,
        );
        bars();
        if (S.ehp <= 0) return setTimeout(win, 800);
        setTimeout(next, 450);
      },
      ranged ? 320 : 160,
    );
  };
  next();
}
/* penyembuh: tidak punya serangan, hanya memulihkan HP (dan Mana) tim */
function healTurn(m, next) {
  const amt = Math.round(mhp() * (m.hl || 0.1)),
    need = Pl.hp < mhp() || (m.hm && Pl.fp < mmp());
  if (!need) return setTimeout(next, 150);
  an.al = { m, t: 0, k: "heal" };
  an.np = an.np || [];
  an.np.push({ m, t: -6, dur: 16, type: "heal" });
  SND.sfx("heal");
  setTimeout(() => {
    const h = Math.min(amt, mhp() - Pl.hp);
    Pl.hp = Math.min(mhp(), Pl.hp + amt);
    if (m.hm) Pl.fp = Math.min(mmp(), Pl.fp + m.hm);
    if (h > 0) flo(`+${h} HP`, "h", "#7ef0c8");
    burst(PCX, 150, "#7ef0c8");
    say(
      `${m.n} (${m.r}) memulihkan tim! ${h > 0 ? "+" + h + " HP" : ""}${m.hm ? ` · +${m.hm} Mana` : ""}`,
    );
    bars();
    setTimeout(next, 500);
  }, 340);
}

/* Kapten Lyra tidak lagi memaksa pemain bergabung */
N.lyra = () => {
  if (F.lyra)
    return dlg(
      "Kapten Lyra",
      F.party
        ? [
            `Party kita Rank ${rk()} (${F.gp} GP). Ambil Misi Party di papan quest untuk naik rank.`,
            "Urutan rank: E, D, C, B, A, S, SS, lalu SSS.",
          ]
        : [
            "Kamu bebas memilih rekan. Para petualang di aula ini siap diajak, maksimal empat orang.",
            "Setelah punya party, Misi Party di papan quest bisa diulang untuk menaikkan rank.",
          ],
    );
  dlg(
    "Kapten Lyra",
    [
      "Aku Lyra dari Serikat Pelita. Kabar tentangmu sampai ke kami.",
      "Aku tidak akan memaksamu masuk party siapa pun. Di aula ini ada beberapa petualang lepas yang bisa kamu ajak sesuka hati, sampai empat orang.",
      "Pilih rekan yang cocok dengan gayamu. Party baru mulai dari Rank E dan bisa naik sampai SSS lewat Misi Party.",
    ],
    () => {
      F.lyra = 1;
      SND.sfx("quest");
      hud();
      idle();
    },
  );
};

/* game baru: party kosong */
{
  const _wi = W.init;
  W.init = function () {
    _wi();
    syncParty();
  };
}

/* pilih job saat game baru (save lama tetap Pendekar Pedang) */
{
  const b = $("#ct2");
  if (b) b.onclick = () => chooseJob(true);
  else chooseJob(true);
}
