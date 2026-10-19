/* ===== Numeria Quest — Job petualang =====
   Dimuat tepat setelah script.js (sebelum monsters.js). Menyediakan:
   - JOBS: Pendekar Pedang (depan), Penyihir (belakang), Pemanah (belakang)
   - skill tiap job (SKILLS/HITS diganti lewat applyJob), ikon pad, elemen baru (air, kegelapan, cahaya)
   - gambar senjata (tongkat / busur) dan seluruh animasi proyektil, dampak, dan ulti per job
   - UI pilih job (chooseJob) dan tab "Job" di Tas
   Pemain lama (save lama) otomatis menjadi Pendekar Pedang, jadi tidak ada yang berubah untuk mereka. */

/* ---------- ikon & elemen baru ---------- */
const ICO0 = { atk: ICO.atk, ult: ICO.ult }; // ikon asli Pendekar Pedang
Object.assign(ICO, {
  wat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1C8 8 5 11.5 5 15.5a7 7 0 0 0 14 0C19 11.5 16 8 12 1z"/></svg>',
  dark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 14.5A9 9 0 1 1 9.5 4a7.2 7.2 0 0 0 10.5 10.5z"/></svg>',
  holy: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M11 0h2v5h-2zM11 19h2v5h-2zM0 11h5v2H0zM19 11h5v2h-5zM3.5 2.1l1.4-1.4 3.5 3.5-1.4 1.4zM15.6 19.8l1.4-1.4 3.5 3.5-1.4 1.4zM2.1 20.5l3.5-3.5 1.4 1.4-3.5 3.5zM16.9 5.6l3.5-3.5 1.4 1.4-3.5 3.5z"/></svg>',
  shot: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="23,12 14,5 14,9.5 1,9.5 1,14.5 14,14.5 14,19"/></svg>',
  multi:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h19M17 8l4 4-4 4M3 4.5l15 5M3 19.5l15-5"/></svg>',
  giant: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="24,12 12,1 12,7.5 0,7.5 0,16.5 12,16.5 12,23"/></svg>',
});
const ICO_JOB = {
  mage: {
    atk: '<svg viewBox="0 0 24 24" fill="currentColor"><g transform="rotate(45 12 12)"><circle cx="12" cy="4.5" r="3.8"/><rect x="11" y="8.2" width="2" height="14.8"/></g></svg>',
    ult: '<svg viewBox="0 0 24 24"><g fill="#ffd166"><path d="M1 1l10 5-4.5 4.5zM1 9l8 2.5L6 14.5z"/></g><circle cx="16" cy="16" r="6.8" fill="#ff7a3a"/><circle cx="16" cy="16" r="4.2" fill="#ffd166"/></svg>',
  },
  archer: {
    atk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2c10 3 10 17 0 20M6 2v20M3 12h18M17 8l4 4-4 4"/></svg>',
    ult: '<svg viewBox="0 0 24 24" fill="none" stroke="#ffd166" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 1v15M2 12l3 4 3-4M12 6v17M9 19l3 4 3-4M19 1v15M16 12l3 4 3-4"/></svg>',
  },
};
Object.assign(EL, {
  water: { c: "#4db8ff", c2: "#ffffff" },
  dark: { c: "#a24dff", c2: "#ffffff" },
  holy: { c: "#fff2a8", c2: "#ffffff" },
});
/* animasi baru: cast/shoot = jarak jauh (berdiri di tempat); ultm/ulta = ulti penyihir/pemanah */
const ULTK = { ultm: 1, ulta: 1 },
  UH = { ultm: [30, 35, 40, 45, 50, 55, 64], ulta: [30, 35, 40, 45, 50, 55, 64] }; // frame tiap hit ulti
Object.assign(ATM, { cast: [18, 4, 14], shoot: [18, 4, 14], ultm: [26, 42, 20], ulta: [26, 42, 20] });
/* AP (frame sebelum hit pertama) skill jarak jauh = lama ancang-ancang (V.w) + lama terbang (V.fl) */
function atmOf(a, K) {
  const V = a.sk && a.sk.V;
  return V && (K === "cast" || K === "shoot") ? [V.w + V.fl, 6, 14] : ATM[K];
}

/* ---------- data job ---------- */
/* slot pad: [jari-jari, derajat, ukuran, tombol] — sama untuk semua job supaya tata letak pad konsisten */
const SLOT = {
  S1: [7.2, 176, 3.3, "2"], S2: [7.2, 150, 3.3, "3"], S3: [7.2, 124, 3.3, "4"], S4: [7.2, 98, 3.3, "8"],
  S5: [11.2, 172, 3, "5"], S6: [11.2, 150, 3, "6"], S7: [11.2, 128, 3, "7"],
};
const mkSk = (s, o) => ({ ...o, pos: SLOT[s].slice(0, 3), key: SLOT[s][3] }),
  HEALSK = mkSk("S4", { id: "heal", n: "Penyembuh", mp: 25, cd: 3, lv: 1, col: "#7ef0c8" }),
  ULTPOS = { pos: [10.8, 105, 3.5], key: "9" };
const JOBS = {
  sword: {
    id: "sword", n: "Pendekar Pedang", row: "front", hp: 1.1, mp: 0.9, unit: "tebasan", ultInfo: "7 tebasan pelangi",
    ultName: "Pedang Pelangi", ultSay: "PEDANG PELANGI!",
    d: "Pembawa pedang di barisan depan. Serangan biasa, Dash, dan Lompat berjarak dekat; Tebasan Kuat dan tebasan api/es/petir melepas gelombang jarak jauh. Ulti: Pedang Pelangi.",
    st: "Barisan depan · HP ×1,1 · Mana ×0,9",
    atk: { n: "Serang Biasa", mult: 1, k: "slash" },
    skills: SKILLS.slice(), // skill asli di script.js
    hits: { ...HITS },
  },
  mage: {
    id: "mage", n: "Penyihir", row: "back", hp: 0.85, mp: 1.4, rd: 0.85, unit: "peluru", ultInfo: "hujan 6 meteor + 1 meteor raksasa",
    ultName: "Meteor Arkana", ultSay: "METEOR ARKANA!",
    d: "Penyihir di barisan belakang. Sihir api, air, petir, kegelapan, cahaya, dan es. Mana besar, tapi HP rendah. Ulti: Meteor Arkana.",
    st: "Barisan belakang (damage diterima ×0,85) · HP ×0,85 · Mana ×1,4",
    atk: { n: "Peluru Sihir", mult: 0.95, k: "cast", col: "#c99aff", V: { t: "orb", w: 10, fl: 9 } },
    skills: [
      mkSk("S1", { id: "fire", n: "Bola Api", mp: 22, cd: 2, mult: 1.7, c: 10, p: 10, lv: 1, k: "cast", el: "fire", col: "#ff7a3a", V: { t: "fire", w: 12, fl: 9 }, fx: "Bola api besar, membakar musuh 2 giliran" }),
      mkSk("S2", { id: "wat", n: "Bola Air", mp: 22, cd: 2, mult: 1.5, c: 10, p: 10, lv: 2, k: "cast", el: "water", col: "#4db8ff", V: { t: "water", w: 12, fl: 10 }, fx: "Musuh basah: serangannya −25%, kena petir +40%" }),
      mkSk("S3", { id: "bolt", n: "Petir", mp: 25, cd: 3, mult: 1.5, c: 20, p: 10, lv: 3, k: "cast", el: "bolt", col: "#ffe14d", V: { t: "bolt", w: 12, fl: 6 }, fx: "Sambaran dari langit, 40% membuat musuh tersengat" }),
      HEALSK,
      mkSk("S5", { id: "dark", n: "Kegelapan", mp: 28, cd: 3, mult: 1.7, c: 10, p: 20, lv: 4, k: "cast", el: "dark", col: "#a24dff", V: { t: "dark", w: 14, fl: 11 }, fx: "Bola hampa: 25% damage menjadi HP-mu" }),
      mkSk("S6", { id: "holy", n: "Cahaya Suci", mp: 28, cd: 3, mult: 1.5, c: 10, p: 50, lv: 5, k: "cast", el: "holy", col: "#fff2a8", V: { t: "holy", w: 14, fl: 8 }, fx: "Pilar cahaya yang menembus pertahanan" }),
      mkSk("S7", { id: "ice", n: "Hujan Es", mp: 25, cd: 3, mult: 1.4, c: 10, p: 10, lv: 6, k: "cast", el: "ice", col: "#7cf0ff", V: { t: "ice", w: 12, fl: 9 }, fx: "Tiga pecahan es membekukan musuh" }),
      { id: "ult", n: "Meteor Arkana", mp: 0, cd: 0, mult: 6, lv: 1, k: "ultm", col: "#ff7a3a", ...ULTPOS },
    ],
    hits: { atk: 3, fire: 1, wat: 1, bolt: 1, dark: 1, holy: 1, ice: 3 },
  },
  archer: {
    id: "archer", n: "Pemanah", row: "back", hp: 0.95, mp: 1, cr: 8, pe: 5, rd: 0.85, unit: "anak panah", ultInfo: "hujan panah dari langit + panah raksasa",
    ultName: "Hujan Panah", ultSay: "HUJAN PANAH!",
    d: "Pemanah di barisan belakang. Panah kuat, panah sebar (banyak), panah raksasa, dan panah api/es/petir. Peluang Critical & Penetrasi lebih tinggi. Ulti: Hujan Panah.",
    st: "Barisan belakang (damage diterima ×0,85) · Critical +8% · Penetrasi +5%",
    atk: { n: "Tembak Cepat", mult: 1, k: "shoot", col: "#ffd166", V: { t: "arrow", w: 10, fl: 8 } },
    skills: [
      mkSk("S1", { id: "shot", n: "Panah Kuat", mp: 20, cd: 2, mult: 1.8, c: 15, p: 10, lv: 1, k: "shoot", col: "#ffd166", V: { t: "power", w: 16, fl: 8 }, fx: "Tarik penuh, satu panah berdaya besar" }),
      mkSk("S2", { id: "multi", n: "Panah Sebar", mp: 24, cd: 2, mult: 1.6, c: 10, p: 5, lv: 2, k: "shoot", col: "#ffe9a0", V: { t: "arrow", w: 12, fl: 8, sim: 1 }, fx: "Lima anak panah sekaligus menyebar" }),
      mkSk("S3", { id: "giant", n: "Panah Raksasa", mp: 30, cd: 3, mult: 2.5, c: 0, p: 30, lv: 3, k: "shoot", col: "#fff0b0", V: { t: "giant", w: 22, fl: 12 }, fx: "Anak panah membesar, menembus pertahanan" }),
      HEALSK,
      mkSk("S5", { id: "fire", n: "Panah Api", mp: 25, cd: 3, mult: 1.5, c: 10, p: 10, lv: 4, k: "shoot", el: "fire", col: "#ff7a3a", V: { t: "arrow", w: 12, fl: 8 }, fx: "Panah berapi, membakar 2 giliran" }),
      mkSk("S6", { id: "ice", n: "Panah Es", mp: 25, cd: 3, mult: 1.4, c: 10, p: 10, lv: 5, k: "shoot", el: "ice", col: "#7cf0ff", V: { t: "arrow", w: 12, fl: 8 }, fx: "Panah beku, damage musuh −40% (2 serangan)" }),
      mkSk("S7", { id: "bolt", n: "Panah Petir", mp: 25, cd: 3, mult: 1.4, c: 20, p: 10, lv: 6, k: "shoot", el: "bolt", col: "#ffe14d", V: { t: "arrow", w: 12, fl: 8 }, fx: "Panah bermuatan listrik, 40% menyengat" }),
      { id: "ult", n: "Hujan Panah", mp: 0, cd: 0, mult: 6, lv: 1, k: "ulta", col: "#ffd166", ...ULTPOS },
    ],
    hits: { atk: 2, shot: 1, multi: 5, giant: 1, fire: 2, ice: 2, bolt: 1 },
  },
};
const JOB = () => JOBS[Pl && Pl.job] || JOBS.sword,
  JM = (k) => JOB()[k] ?? 1, // pengali status job (hp, mp, rd = damage diterima)
  JA = (k) => JOB()[k] ?? 0, // bonus tambahan job (cr, pe)
  basicAtk = () => ({ id: "atk", mp: 0, cd: 0, c: 0, p: 0, lv: 1, ...JOB().atk });

function applyJob() {
  const J = JOB();
  SKILLS.splice(0, SKILLS.length, ...J.skills);
  Object.keys(HITS).forEach((k) => delete HITS[k]);
  Object.assign(HITS, J.hits);
  const ic = ICO_JOB[J.id] || {};
  ICO.atk = ic.atk || ICO0.atk;
  ICO.ult = ic.ult || ICO0.ult;
}
function setJob(id, full) {
  if (!JOBS[id]) return;
  Pl.job = id;
  applyJob();
  Pl.cd = {};
  if (full) {
    Pl.hp = mhp();
    Pl.fp = mmp();
  } else {
    Pl.hp = Math.min(Pl.hp, mhp());
    Pl.fp = Math.min(Pl.fp, mmp());
  }
  SND.sfx("equip");
  hud();
}
/* posisi pemain di arena: pedang maju ke garis depan, sihir/busur tetap di belakang */
/* Seberapa jauh job barisan BELAKANG (Penyihir & Pemanah) boleh bergerak ke kanan.
   0.45 = hanya sampai ~45% jarak (di arena lebar terlihat berhenti di tengah).
   1 = sama jauh dengan Pendekar Pedang. Ubah angka ini kalau mau lebih dekat/jauh. */
const BACK_RANGE = 1;
function jobBaseXr(sc) {
  // posisi ASLI pemain di layar
  const f = posF(),
    lo = 28,
    far = VW - 80 - lo; // batas kanan: sampai ujung layar (lebar sprite 80 + margin kiri yang sama)
  return JOB().row === "front" ? lo + f * (far - lo) : lo + f * (far - lo) * BACK_RANGE;
}
/* posisi pemain dalam koordinat kanonik (dicerminkan bila musuh ada di kiri pemain, lihat mirBegin di script.js) */
function jobBaseX(sc) {
  const r = jobBaseXr(sc);
  return MIRX ? VW - 80 - r : r;
}

/* ---------- UI: pilih job & tab Job ---------- */
function jobCard(id) {
  const J = JOBS[id],
    cur = Pl.job === id;
  return `<div class="irow"><canvas class="pv" width="84" height="84" data-jp="${id}"></canvas><div><b>${J.n}</b> ${cur ? '<span class="ok">dipakai</span>' : ""}<br><small>${J.d}</small><br><small class="qm">${J.st}</small></div><button class="b ${cur ? "g" : ""}" data-j="${id}">${cur ? "Dipakai" : "Pilih"}</button></div>`;
}
function jobPreviews() {
  document.querySelectorAll("canvas[data-jp]").forEach((cv2) => {
    const o = ctx,
      oj = Pl.job;
    ctx = cv2.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    Pl.job = cv2.dataset.jp;
    try {
      heroB(6, 8, 0, null);
    } finally {
      Pl.job = oj;
      ctx = o;
    }
  });
}
function jobTab() {
  const J = JOB();
  return (
    `<div class="qm" style="margin-bottom:4px">Job menentukan senjata, skill, dan posisi barisan. Pedang di depan; sihir & busur di belakang (damage diterima lebih kecil). Boleh ganti kapan saja di luar pertempuran.</div>` +
    Object.keys(JOBS).map(jobCard).join("") +
    `<div class="qm" style="margin-top:6px">Barisan kamu: <b>${J.row === "front" ? "Depan" : "Belakang"}</b>. Rekan party menyesuaikan role masing-masing (lihat tab Party).</div>`
  );
}
function changeJob(id) {
  if (id === Pl.job) return;
  setJob(id, false);
  say(`Job berganti menjadi ${JOBS[id].n}. Skill & senjata ikut berubah.`);
  inv(3);
}
function chooseJob(first) {
  busy = true;
  say("Pilih job petualangmu. Job menentukan senjata, skill, dan posisimu di barisan.");
  ui(
    `<div class="card"><b class="ok">Pilih Job</b><div class="qm" style="margin:4px 0 6px">${first ? "Kamu bisa menggantinya kapan saja lewat Tas › Job." : ""}</div>${Object.keys(JOBS).map(jobCard).join("")}</div>`,
  );
  jobPreviews();
  document.querySelectorAll("[data-j]").forEach(
    (b) =>
      (b.onclick = () => {
        setJob(b.dataset.j, true);
        idle();
        say(`Kamu kini seorang ${JOB().n}! Desa Satuan. Rumah Guild ada di kanan atas: masuk lewat pintunya dan temui Guildmaster.`);
      }),
  );
}

/* ---------- senjata di tangan pemain (menggantikan pedang) ---------- */
function jLn(x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}
function jDot(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, 6.283);
  ctx.fill();
}
function jGlow(x, y, r, c1, c2) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, r);
  g.addColorStop(0, c2);
  g.addColorStop(0.5, c1);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}
const jPt = (x, y, vx, vy, l, c) => {
  if (!rm && an.pt.length < 110) an.pt.push({ x, y, vx, vy, l, c });
};
function jobWeapon(job, fx, fy, a, k, r, fl) {
  const bc = globalThis.bladeC;
  let tip;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (job === "mage") {
    // tongkat sihir dengan permata di ujungnya; permata berwarna elemen saat merapal
    const ang = -1.2 + 0.75 * a,
      dx = Math.cos(ang),
      dy = Math.sin(ang),
      x0 = fx - dx * 12 * k,
      y0 = fy - dy * 12 * k,
      x1 = fx + dx * 40 * k,
      y1 = fy + dy * 40 * k,
      oc = fl ? "#fff" : bc || "#b98cff",
      pulse = 1 + 0.12 * Math.sin(Date.now() / 110);
    ctx.strokeStyle = "#140f1c";
    ctx.lineWidth = 5.4 * k;
    jLn(x0, y0, x1, y1);
    ctx.strokeStyle = fl ? "#fff" : "#8a5a2b";
    ctx.lineWidth = 3 * k;
    jLn(x0, y0, x1, y1);
    ctx.strokeStyle = fl ? "#fff" : "#e2b84a";
    ctx.lineWidth = 2 * k;
    jLn(x1 - dx * 6 * k, y1 - dy * 6 * k, x1 - dx * 10 * k, y1 - dy * 10 * k);
    ctx.shadowColor = oc;
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#140f1c";
    jDot(x1, y1, r(7.6) * pulse);
    ctx.fillStyle = oc;
    jDot(x1, y1, r(5.6) * pulse);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    jDot(x1 - r(1.6), y1 - r(1.6), r(2));
    tip = [Math.round(x1), Math.round(y1)];
  } else {
    // busur: tali ditarik saat pose negatif, anak panah terpasang sampai dilepas
    const A = an && an.a,
      pull = Math.max(0, -a) * 16 * k,
      L = 27 * k,
      bx = fx - 2 * k,
      nx = bx - 3 * k - pull,
      hide = !!(A && A.k === "ulta" && A.t >= 16),
      bow = () => {
        ctx.beginPath();
        ctx.moveTo(bx - 3 * k, fy - L);
        ctx.quadraticCurveTo(bx + 16 * k, fy, bx - 3 * k, fy + L);
      };
    ctx.strokeStyle = "#140f1c";
    ctx.lineWidth = 5.4 * k;
    bow();
    ctx.stroke();
    ctx.strokeStyle = fl ? "#fff" : "#b06a2b";
    ctx.lineWidth = 3 * k;
    bow();
    ctx.stroke();
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = Math.max(1, 1.2 * k);
    ctx.beginPath();
    ctx.moveTo(bx - 3 * k, fy - L);
    ctx.lineTo(nx, fy);
    ctx.lineTo(bx - 3 * k, fy + L);
    ctx.stroke();
    if (!hide && a < 0.3) {
      const hc = fl ? "#fff" : bc || "#dfe6f2";
      ctx.strokeStyle = "#c9a050";
      ctx.lineWidth = Math.max(1.5, 1.7 * k);
      jLn(nx, fy, nx + 34 * k, fy);
      ctx.fillStyle = hc;
      if (bc) {
        ctx.shadowColor = bc;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(nx + 44 * k, fy);
      ctx.lineTo(nx + 33 * k, fy - 4.5 * k);
      ctx.lineTo(nx + 33 * k, fy + 4.5 * k);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f4f1ea";
      ctx.fillRect(nx - 1 * k, fy - 4 * k, 7 * k, 2 * k);
      ctx.fillRect(nx - 1 * k, fy + 2 * k, 7 * k, 2 * k);
    }
    tip = [Math.round(bx + 12 * k), Math.round(fy)];
  }
  // tangan
  ctx.fillStyle = "#140f1c";
  ctx.fillRect(fx - r(6), fy - r(6), r(12), r(12));
  ctx.fillStyle = SP.heroB.p.G;
  ctx.fillRect(fx - r(4), fy - r(4), r(8), r(8));
  ctx.fillStyle = "#fff";
  ctx.fillRect(fx - r(4), fy - r(4), r(4), r(2));
  ctx.restore();
  return [tip[0], tip[1], fx, fy];
}

/* ---------- bentuk proyektil (dipakai pemain & NPC) ---------- */
function jArrow(sc, shaft, head, glw) {
  const L = 24 * sc;
  if (glw) {
    ctx.shadowColor = glw;
    ctx.shadowBlur = 8 + 3 * sc;
  }
  ctx.strokeStyle = shaft;
  ctx.lineWidth = Math.max(1.5, 1.8 * sc);
  jLn(-L, 0, 2 * sc, 0);
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.moveTo(11 * sc, 0);
  ctx.lineTo(1 * sc, -4.2 * sc);
  ctx.lineTo(1 * sc, 4.2 * sc);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f4f1ea";
  [-1, 1].forEach((g) => {
    ctx.beginPath();
    ctx.moveTo(-L, 0);
    ctx.lineTo(-L - 4 * sc, g * 4 * sc);
    ctx.lineTo(-L + 6 * sc, g * 1 * sc);
    ctx.closePath();
    ctx.fill();
  });
}
/* type: orb|fire|water|dark|ice (sihir) · arrow|power|giant (panah, o.el = api/es/petir) */
function projShape(type, x, y, ang, tn, o = {}) {
  const el = o.el,
    ca = Math.cos(ang),
    sa = Math.sin(ang);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  if (type === "orb") {
    ctx.shadowColor = o.col || "#c99aff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#a24dff";
    jDot(0, 0, 6.5);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e6ccff";
    jDot(0, 0, 4);
    ctx.fillStyle = "#fff";
    jDot(-1, -1, 2);
    jPt(x - ca * 6, y - sa * 6 + R(-3, 3), -ca, -sa * 0.5, 18, "#c99aff");
  } else if (type === "fire") {
    const f = Math.sin(tn * 0.9);
    ctx.shadowColor = "#ff7a3a";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ff4d1a";
    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(-36 - f * 4, 0);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff9a3d";
    ctx.beginPath();
    ctx.moveTo(-4, -5);
    ctx.lineTo(-24 - f * 3, 0);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff7a3a";
    jDot(0, 0, 11);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffb347";
    jDot(0, 0, 8);
    ctx.fillStyle = "#fff3b0";
    jDot(1, 0, 4.5);
    jPt(x - ca * 8, y - sa * 8 + R(-6, 6), -1 - Math.random() * 2, -Math.random() * 1.5, 22, P(["#ff4d1a", "#ff9a3d", "#ffd166"]));
  } else if (type === "water") {
    const w = Math.sin(tn * 0.7);
    ctx.shadowColor = "#4db8ff";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#2f8fe0";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 + w * 2, 9 - w * 1.5, 0, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#7fd0ff";
    ctx.beginPath();
    ctx.ellipse(-1, -1, 7 + w, 5.5, 0, 0, 6.283);
    ctx.fill();
    ctx.fillStyle = "#fff";
    jDot(-3, -3, 2);
    jPt(x - ca * 8, y - sa * 8 + R(-5, 5), -1.4, R(-3, 3) / 10, 22, P(["#7fd0ff", "#ffffff", "#4db8ff"]));
  } else if (type === "dark") {
    ctx.shadowColor = "#a24dff";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#a24dff";
    jDot(0, 0, 12);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0a0014";
    jDot(0, 0, 9.5);
    ctx.fillStyle = "#c99aff";
    for (let j = 0; j < 5; j++) {
      const g = tn * 0.45 + j * 1.257;
      ctx.fillRect(Math.cos(g) * 16 - 1.5, Math.sin(g) * 16 - 1.5, 3, 3);
    }
    jPt(x - ca * 8, y - sa * 8 + R(-6, 6), -1, R(-8, 8) / 10, 24, P(["#a24dff", "#4a1a7a", "#c99aff"]));
  } else if (type === "ice") {
    ctx.shadowColor = "#7cf0ff";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#7cf0ff";
    ctx.beginPath();
    ctx.moveTo(-16, 0);
    ctx.lineTo(0, -5.5);
    ctx.lineTo(16, 0);
    ctx.lineTo(0, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(0, -2.2);
    ctx.lineTo(10, 0);
    ctx.lineTo(0, 2.2);
    ctx.closePath();
    ctx.fill();
    jPt(x - ca * 10, y - sa * 10, -ca, R(-5, 5) / 10, 18, P(["#7cf0ff", "#ffffff", "#b8e8ff"]));
  } else if (type === "rock") {
    ctx.rotate(tn * 0.3 - ang);
    ctx.fillStyle = "#3a3030";
    jDot(0, 0, 12);
    ctx.fillStyle = "#8a7e6e";
    jDot(0, 0, 10);
    ctx.fillStyle = "#b8ac98";
    jDot(-3, -3, 4);
    ctx.fillStyle = "#5e5446";
    jDot(4, 3, 3);
    jPt(x, y + R(-6, 6), R(-10, 10) / 10, R(-10, 10) / 10, 18, P(["#8a7e6e", "#b8ac98"]));
  } else if (type === "venom") {
    const w = Math.sin(tn * 0.8);
    ctx.shadowColor = "#6fd04a";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#3f9a2a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 + w * 2, 7 - w, 0, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#b8ff8a";
    jDot(-2, -2, 2.5);
    jPt(x - ca * 8, y - sa * 8 + 3, -ca, 0.6, 22, P(["#6fd04a", "#3f9a2a"]));
  } else if (type === "spore") {
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "#c06bff";
    jDot(0, 0, 9);
    ctx.fillStyle = "#ff9ad8";
    jDot(-6, 3, 6);
    jDot(5, -4, 5);
    ctx.fillStyle = "#ffffff";
    jDot(-2, -2, 2);
    ctx.globalAlpha = 1;
    jPt(x - ca * 8, y - sa * 8 + R(-6, 6), -ca * 0.5, -0.4, 26, P(["#c06bff", "#ff9ad8"]));
  } else if (type === "feather") {
    ctx.rotate(tn * 0.2);
    ctx.fillStyle = "#e8e0c8";
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.quadraticCurveTo(0, -8, 14, 0);
    ctx.quadraticCurveTo(0, 8, -14, 0);
    ctx.fill();
    ctx.strokeStyle = "#a89870";
    ctx.lineWidth = 1.5;
    jLn(-14, 0, 14, 0);
    jPt(x - ca * 10, y - sa * 10, -ca * 2, R(-5, 5) / 10, 16, "#ffffff");
  } else if (type === "ink") {
    ctx.shadowColor = "#6a3aff";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#2a1a5a";
    jDot(0, 0, 12);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#0e0620";
    jDot(0, 0, 9);
    ctx.fillStyle = "#7a5aff";
    jDot(-3, -3, 2.5);
    jPt(x - ca * 10, y - sa * 10 + R(-5, 5), -ca, R(-6, 6) / 10, 24, P(["#2a1a5a", "#6a3aff"]));
  } else if (type === "knife") {
    ctx.rotate(tn * 0.5 - ang);
    ctx.fillStyle = "#e8eef8";
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-2, -4);
    ctx.lineTo(-2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8a5a2b";
    ctx.fillRect(-10, -2, 8, 4);
    ctx.fillStyle = "#c9a050";
    ctx.fillRect(-3, -5, 2, 10);
    jPt(x, y, R(-6, 6) / 10, R(-6, 6) / 10, 12, "#ffffff");
  } else {
    // panah
    const big = type === "giant",
      pw = type === "power",
      sc = big ? 3.2 : pw ? 1.35 : 1,
      HC = { fire: "#ff9a3d", ice: "#7cf0ff", bolt: "#ffe14d" },
      gl = big ? "#ffe9a0" : pw ? "#ffd166" : el ? EL[el].c : null;
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = big ? 4 : 1.2;
    jLn(-24 * sc - (big ? 30 : 20), 0, -24 * sc, 0);
    ctx.globalAlpha = 1;
    if (big) {
      ctx.strokeStyle = "rgba(255,233,160,.55)";
      ctx.lineWidth = 3;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        ctx.ellipse(-66 - j * 26, 0, 5 + j * 3, 20 + j * 8, 0, 0, 6.283);
        ctx.stroke();
      }
    }
    if (el === "fire") {
      ctx.fillStyle = "#ff7a3a";
      ctx.shadowColor = "#ff7a3a";
      ctx.shadowBlur = 14;
      jDot(6, 0, 8);
      ctx.fillStyle = "#ffd166";
      jDot(7, 0, 4.5);
      ctx.shadowBlur = 0;
      jPt(x - ca * 14, y - sa * 14 + R(-4, 4), -ca - Math.random(), -Math.random() * 1.5, 22, P(["#ff4d1a", "#ff9a3d", "#ffd166"]));
    } else if (el === "ice") {
      jPt(x - ca * 14, y - sa * 14 + R(-4, 4), -ca, R(-6, 6) / 10, 20, P(["#7cf0ff", "#ffffff", "#b8e8ff"]));
    } else if (el === "bolt") {
      ctx.strokeStyle = "#ffe14d";
      ctx.lineWidth = 2;
      for (let j = 0; j < 2; j++) {
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        for (let s2 = 1; s2 <= 5; s2++) ctx.lineTo(-24 + s2 * 6, R(-6, 6));
        ctx.stroke();
      }
    }
    jArrow(sc, big ? "#e8c15a" : pw ? "#ffd166" : "#c9a050", big || pw ? "#ffffff" : HC[el] || "#dfe6f2", gl);
    if (big || pw) jPt(x - ca * 20, y - sa * 20 + R(-6, 6), -ca * 2, R(-8, 8) / 10, 24, P(["#ffe9a0", "#ffd166", "#ffffff"]));
  }
  ctx.restore();
}
function jMeteor(x, y, dx, dy, rr) {
  const d = Math.hypot(dx, dy) || 1,
    ux = dx / d,
    uy = dy / d,
    nx = -uy,
    ny = ux,
    len = rr * 6;
  ctx.save();
  ctx.shadowColor = "#ff7a3a";
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(x, y, x - ux * len, y - uy * len);
  g.addColorStop(0, "rgba(255,170,60,.95)");
  g.addColorStop(1, "rgba(255,70,20,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x + nx * rr, y + ny * rr);
  ctx.lineTo(x - ux * len, y - uy * len);
  ctx.lineTo(x - nx * rr, y - ny * rr);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#ff4d1a";
  jDot(x, y, rr);
  ctx.fillStyle = "#ff9a3d";
  jDot(x, y, rr * 0.72);
  ctx.fillStyle = "#ffe9a0";
  jDot(x - ux * rr * 0.1, y - uy * rr * 0.1, rr * 0.4);
  ctx.fillStyle = "#5a2a1a";
  jDot(x + nx * rr * 0.4, y + ny * rr * 0.4, rr * 0.22);
  ctx.restore();
  jPt(x - ux * rr, y - uy * rr + R(-4, 4), -ux * 2, -uy + Math.random() - 0.5, 24, P(["#ff4d1a", "#ff9a3d", "#ffd166"]));
}

/* ---------- animasi serangan jarak jauh (dipanggil tiap frame dari draw) ---------- */
function jobFrame(a, K, fx, fy, hx, hy) {
  const tn = a.t,
    fresh = a._lt !== tn; // hit-stop menahan a.t: jangan munculkan efek dua kali
  a._lt = tn;
  if (ULTK[K]) return K === "ultm" ? ultMage(a, tn, fresh, fx, fy, hx) : ultArcher(a, tn, fresh, fx, fy, hx);
  const V = a.sk && a.sk.V;
  if (!V || (K !== "cast" && K !== "shoot")) return;
  const n = a.n || 1,
    W = V.w,
    FL = V.fl,
    el = a.sk.el || V.el;
  a.o = a.o || [];
  a.tg =
    a.tg ||
    Array.from({ length: n }, (_, i) => ({ x: 340 + (i % 2) * 10, y: 152 + (V.sim ? (i - (n - 1) / 2) * 11 : ((i % 3) - 1) * 8) }));
  if (tn <= W && !rm) {
    // energi terkumpul di ujung tongkat / anak panah
    const u = Math.min(1, tn / W),
      c = el ? EL[el].c : a.sk.col || "#c99aff",
      big = V.t === "giant";
    jGlow(fx, fy, (big ? 10 : 6) + (big ? 18 : 12) * u, c, "#ffffff");
    for (let j = 0; j < (big ? 6 : 3); j++) {
      const g = tn * 0.4 + j * (6.283 / (big ? 6 : 3)),
        rr = 6 + 30 * (1 - u);
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(fx + Math.cos(g) * rr), Math.round(fy + Math.sin(g) * rr), 3, 3);
    }
  }
  for (let i = 0; i < n; i++) {
    const L = V.sim ? W + 1 : W + 1 + i * HG,
      len = V.sim ? FL + i * HG : FL,
      T = a.tg[i];
    if (tn === L && fresh) {
      a.o[i] = { x: fx, y: fy };
      const c = el ? EL[el].c : a.sk.col || "#fff";
      for (let j = 0; j < 5; j++) jPt(fx, fy, R(0, 40) / 10, R(-25, 25) / 10, 16, c);
    }
    if (V.t === "bolt") {
      if (tn === L + len - 3 && fresh) slashFx("#ffe14d", "z", T.x, T.y + 10, 1, 0, 0);
      if (tn >= L + len - 3 && tn <= L + len - 1 && !rm) {
        ctx.fillStyle = "rgba(255,255,200,.22)";
        ctx.fillRect(0, 0, VW, VH);
      }
    } else if (V.t === "holy") {
      // bola cahaya terbentuk di atas musuh, lalu pilar cahaya turun
      if (tn >= L && tn <= L + len - 6) {
        const u = (tn - L) / (len - 6);
        jGlow(T.x, 56, 8 + 18 * u, "#ffe680", "#ffffff");
        ctx.fillStyle = "#ffffff";
        jDot(T.x, 56, 3 + 5 * u);
      }
      if (tn === L + len - 6 && fresh) slashFx("#fff2a8", "h", T.x, T.y, 1.1, 0, 0);
    } else if (tn >= L && tn <= L + len) {
      const o = a.o[i] || { x: fx, y: fy },
        k = (tn - L) / len,
        t = V.t,
        cx = (o.x + T.x) / 2;
      let cy;
      if (t === "orb") cy = (o.y + T.y) / 2 + (n > 1 ? (i - (n - 1) / 2) * 60 : 0);
      else if (t === "fire" || t === "water" || t === "dark") cy = Math.min(o.y, T.y) - 26;
      else if (t === "ice") cy = (o.y + T.y) / 2 + (i - (n - 1) / 2) * 22;
      else if (V.sim) cy = Math.min(o.y, T.y) - (6 + (n - 1 - i) * (48 / Math.max(1, n - 1)));
      else cy = Math.min(o.y, T.y) - (t === "giant" ? 6 : 20);
      const q = (u) => ({
          x: (1 - u) * (1 - u) * o.x + 2 * (1 - u) * u * cx + u * u * T.x,
          y: (1 - u) * (1 - u) * o.y + 2 * (1 - u) * u * cy + u * u * T.y,
        }),
        p = q(k),
        p1 = q(Math.max(0, k - 0.04)),
        p2 = q(Math.min(1, k + 0.04));
      projShape(t, p.x, p.y, Math.atan2(p2.y - p1.y, p2.x - p1.x), tn, { el, col: a.sk.col });
    }
  }
}
/* hit antara (bukan hit terakhir) skill jarak jauh */
function jobMini(sk2, col, i) {
  const X = ecx(),
    Y = 150 + R(-14, 14),
    t = sk2.V.t;
  slashFx(col, "r", X + R(-8, 8), Y, 0.3, 0, 0, 0);
  if (t === "arrow" || t === "power" || t === "giant") slashFx("#ffffff", "p", X, Y, 0.55, 0, i % 2 ? 0.12 : -0.12, 0);
}
/* dampak hit terakhir; true = sudah ditangani */
function jobImpact(act, r, col) {
  const s2 = skill(act),
    V = s2.V,
    el = s2.el,
    t = V.t,
    X = ecx(),
    Y = 150;
  if (el === "fire" || el === "ice" || el === "bolt") {
    elemHit(el, col);
    if (el === "bolt" && t !== "bolt") slashFx("#ffe14d", "z", X, Y + 10, 1, 0, 0);
  } else if (el === "water") {
    slashFx("#bfe8ff", "w", X, Y, 1.1, 0, 0);
    slashFx("#4db8ff", "r", X, Y + 20, 0.9, 0, 0, -1);
    for (let i = 0; i < 14; i++) jPt(X + R(-24, 24), Y + R(-10, 20), R(-30, 30) / 10, -Math.random() * 4 - 1, 28, P(["#4db8ff", "#7fd0ff", "#ffffff"]));
  } else if (el === "dark") {
    slashFx("#a24dff", "v", X, Y, 1.15, 0, 0);
    for (let i = 0; i < 14; i++) jPt(X + R(-30, 30), Y + R(-30, 30), R(-20, 20) / 10, R(-20, 20) / 10, 26, P(["#a24dff", "#4a1a7a", "#c99aff"]));
  } else if (el === "holy") {
    slashFx("#ffffff", "r", X, Y + 20, 1, 0, 0);
    slashFx("#fff2a8", "c", X, Y, 1.2, 0, 0.4, -1);
    for (let i = 0; i < 14; i++) jPt(X + R(-26, 26), Y + R(0, 30), R(-8, 8) / 10, -Math.random() * 3 - 1.5, 30, P(["#fff2a8", "#ffffff", "#ffe680"]));
  } else if (t === "orb") {
    slashFx(col, "c", X, Y, 0.9, 0, 0.2);
    slashFx("#ffffff", "r", X, Y, 0.5, 0, 0, -1);
  } else if (t === "giant") {
    slashFx(col, "p", X, Y, 2, 0, -0.05);
    slashFx("#ffffff", "p", X, Y - 6, 1.5, 0, 0.1, -2);
    slashFx("#ffe9a0", "r", X, Y + 10, 1.5, 0, 0, -1);
    slashFx("#ffffff", "c", X, Y, 1.5, 0, -0.7, -3);
  } else if (t === "power") {
    slashFx(col, "p", X, Y, 1.35, 0, -0.1);
    slashFx("#ffffff", "p", X, Y - 6, 1, 0, 0.15, -2);
    slashFx(col, "c", X, Y, 1.1, 0, 0.5, -1);
  } else {
    slashFx(col, "p", X, Y, 1, 0, -0.08);
    slashFx("#ffffff", "r", X, Y, 0.5, 0, 0, -1);
  }
  if (r.crit) slashFx("#fff", "c", X, Y, 1.2, 1, 0.7, -2);
  return true;
}

/* ---------- ulti ---------- */
function jobUlt() {
  mode = "r";
  lockPad(true);
  const J = JOB(),
    mage = Pl.job === "mage",
    total = Math.max(7, Math.round(pwr() * ULT_X * (1 + Math.min(0.5, 0.1 * Math.max(0, Pl.combo - 1))))),
    part = (i) => Math.round(total * (i === 6 ? 0.4 : 0.1)),
    COLS = mage
      ? ["#ff7a3a", "#ffd166", "#ff4d6d", "#ff9a3d", "#ffb27a", "#ff6a2a", "#ffffff"]
      : ["#ffe9a0", "#ffd166", "#fff0b0", "#ffe9a0", "#ffd166", "#fff0b0", "#ffffff"];
  Pl.ult = 0;
  bars();
  say(J.ultSay);
  an.a = {
    t: 0,
    w: 0,
    k: mage ? "ultm" : "ulta",
    hi: 0,
    sk: skill("ult"),
    cb: (i) => {
      const e = S.e,
        d = part(i),
        col = COLS[i],
        X = ecx(),
        Y = 150,
        last = i === 6;
      S.ehp -= d;
      SND.sfx("hit");
      SND.mon(e.sp, "hurt");
      an.se = last ? 26 : 12;
      an.fx = last ? 6 : 2;
      burst(X, Y + 15, col);
      burst(X, Y, "#fff");
      if (mage) {
        slashFx("#ff7a3a", "f", X + R(-14, 14), 190, last ? 1.6 : 0.9, 0, 0);
        slashFx("#ffd166", "r", X, Y + 20, last ? 1.6 : 0.7, 0, 0, -1);
        if (last) {
          slashFx("#ffffff", "c", X, Y, 1.7, 0, -0.8);
          slashFx("#ffffff", "c", X, Y, 1.7, 1, 0.8, -2);
        }
      } else {
        slashFx(col, "p", X, Y + R(-10, 10), last ? 2 : 0.9, 0, (i - 3) * 0.12);
        slashFx("#ffffff", "r", X, Y + 8, last ? 1.4 : 0.45);
        if (last) slashFx("#ffe9a0", "r", X, Y + 22, 1.7, 0, 0, -2);
      }
      hitNum(d, col, { crit: last, last });
      an.hs = last ? 8 : 2;
      bars();
      if (last) {
        say(`${J.ultName}! Total ${total} damage.`);
        if (S.ehp <= 0) setTimeout(win, 1000);
        else actDone();
      }
    },
  };
}
function ultMage(a, tn, fresh, fx, fy, hx) {
  if (rm) return;
  const cx = hx + 40,
    cy = GY - 6;
  if (tn <= 86) {
    // lingkaran sihir di tanah
    const e = Math.min(1, tn / 14),
      fd = tn > 70 ? Math.max(0, 1 - (tn - 70) / 16) : 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, 0.28);
    ctx.globalAlpha = 0.85 * fd;
    ctx.strokeStyle = "#ff9a3d";
    ctx.shadowColor = "#ff7a3a";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 70 * e, 0, 6.283);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 52 * e, 0, 6.283);
    ctx.stroke();
    ctx.rotate(tn * 0.07);
    ctx.beginPath();
    for (let j = 0; j <= 5; j++) {
      const g = j * 2.513;
      ctx[j ? "lineTo" : "moveTo"](Math.cos(g) * 50 * e, Math.sin(g) * 50 * e);
    }
    ctx.stroke();
    ctx.fillStyle = "#ffd166";
    for (let j = 0; j < 8; j++) ctx.fillRect(Math.cos(j * 0.785) * 62 * e - 2, Math.sin(j * 0.785) * 62 * e - 2, 4, 4);
    ctx.restore();
  }
  if (tn <= 30) {
    const u = Math.min(1, tn / 22);
    jGlow(fx, fy, 8 + 18 * u, "#ff7a3a", "#ffe9a0");
    for (let j = 0; j < 6; j++) {
      const g = tn * 0.35 + j * 1.05,
        rr = 8 + 44 * (1 - tn / 30);
      ctx.fillStyle = j % 2 ? "#ffd166" : "#ff7a3a";
      ctx.fillRect(Math.round(fx + Math.cos(g) * rr), Math.round(fy + Math.sin(g) * rr), 4, 4);
    }
  }
  UH.ultm.forEach((hf, i) => {
    const big = i === 6,
      dur = big ? 16 : 10,
      st = hf - dur;
    if (tn < st || tn > hf) return;
    const u = (tn - st) / dur,
      tx = big ? ecx() : 336 + (((i * 37) % 5) - 2) * 12,
      ty = 150 + (i % 2 ? 8 : -8),
      sx = tx + (big ? 190 : 170),
      sy = -40;
    jMeteor(sx + (tx - sx) * u, sy + (ty - sy) * u, tx - sx, ty - sy, big ? 24 : 12);
  });
}
function ultArcher(a, tn, fresh, fx, fy, hx) {
  if (rm) return;
  if (tn >= 8 && tn <= 70) {
    // bidikan di musuh
    const e = Math.min(1, (tn - 8) / 12),
      fd = tn > 62 ? Math.max(0, 1 - (tn - 62) / 8) : 1;
    ctx.save();
    ctx.translate(ecx(), 150);
    ctx.globalAlpha = 0.9 * fd;
    ctx.strokeStyle = "#ffd166";
    ctx.shadowColor = "#ffd166";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 46 * e, 0, 6.283);
    ctx.stroke();
    ctx.rotate(tn * 0.06);
    for (let j = 0; j < 4; j++) {
      ctx.rotate(1.5708);
      jLn(46 * e + 4, 0, 46 * e + 16, 0);
    }
    ctx.restore();
  }
  if (tn <= 20) {
    const u = Math.min(1, tn / 16);
    jGlow(fx, fy, 8 + 14 * u, "#ffd166", "#ffffff");
  }
  if (tn >= 16 && tn <= 26) {
    // satu anak panah melesat lurus ke langit
    const u = (tn - 16) / 10;
    if (tn === 16 && fresh) for (let j = 0; j < 8; j++) jPt(fx, fy, R(-20, 30) / 10, R(-30, 10) / 10, 20, "#ffe9a0");
    ctx.save();
    ctx.translate(fx + 6 * u, fy + (-60 - fy) * u);
    ctx.rotate(-1.45);
    jArrow(1.3, "#ffd166", "#ffffff", "#ffd166");
    ctx.restore();
  }
  UH.ulta.forEach((hf, i) => {
    if (i < 6) {
      const dur = 9,
        st = hf - dur;
      if (tn < st || tn > hf) return;
      const u = (tn - st) / dur;
      for (let j = 0; j < 5; j++) {
        const tx = 336 + (j - 2) * 14 + (((i * 13) % 7) - 3) * 3,
          ty = 148 + (((j + i) % 3) - 1) * 10,
          sx = tx + 70 + j * 6,
          sy = -30 - (j % 2) * 14;
        projShape("arrow", sx + (tx - sx) * u, sy + (ty - sy) * u, Math.atan2(ty - sy, tx - sx), tn, { col: "#ffd166" });
      }
    } else {
      const dur = 16,
        st = hf - dur;
      if (tn < st || tn > hf) return;
      const u = (tn - st) / dur,
        tx = ecx(),
        ty = 150,
        sx = tx + 110,
        sy = -70;
      projShape("giant", sx + (tx - sx) * u, sy + (ty - sy) * u, Math.atan2(ty - sy, tx - sx), tn, {});
    }
  });
}

/* ===== ACTION COMBAT (real-time) =====
   Tidak ada lagi giliran: pemain boleh menyerang terus-menerus, cooldown & Mana berjalan real-time,
   musuh dan party menyerang sendiri sesuai timer. Musuh berkedip + "!" sebelum menyerang: tekan S / Shift
   (atau tombol ⏪) untuk menghindar. Soal matematika (Critical/Penetrasi) menjeda semuanya. */
const AC = {
  cdFrames: 150, // 1 satuan cooldown = 150 frame (2,5 detik)
  manaRegen: 0.025, // Mana per frame (≈1,5/detik)
  telegraph: 30, // aba-aba serangan musuh (frame)
  dodgeFrames: 26, // lama kebal saat menghindar
  dodgeCd: 70, // jeda menghindar berikutnya
  partyGap: 130, // jeda antar giliran serangan party (frame)
};
ICO.dodge =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5l-7 7 7 7M20 5l-7 7 7 7"/></svg>';
function doDodge() {
  if (!S || W.on || (mode !== "m" && mode !== "r")) return;
  if (Pl.dg > 0 || Pl.dgc > 0) return SND.sfx("wrong");
  Pl.dg = AC.dodgeFrames;
  Pl.dgc = AC.dodgeCd;
  SND.sfx("whoosh");
  burst(100, 170, "#7cf0ff");
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Shift" && !e.repeat && S && !W.on && !UIX.open) doDodge();
});
/* perbarui pad tanpa membangun ulang (supaya klik tidak hilang) */
function padTick() {
  const sk2 = $("#sk");
  if (!sk2 || sk2.hidden) return;
  sk2.querySelectorAll(".sb[data-a]").forEach((b) => {
    const id = b.dataset.a,
      k = SKILLS.find((x) => x.id === id);
    if (id === "dodge") return b.classList.toggle("off", Pl.dgc > 0);
    if (!k) return;
    const cd = Pl.cd[id] || 0,
      lock = Pl.lv < k.lv,
      u = id === "ult",
      rdy = u && Pl.ult >= ULT_MAX,
      off = lock || cd > 0 || Pl.fp < k.mp || (u && !rdy);
    b.classList.toggle("off", off);
    b.classList.toggle("rdy", !!rdy);
    if (off) b.setAttribute("aria-disabled", "true");
    else b.removeAttribute("aria-disabled");
    b.style.setProperty("--cd", u ? 1 - Math.min(ULT_MAX, Pl.ult) / ULT_MAX : cd ? Math.min(1, cd / k.cd) : 0);
    let c = b.querySelector(".cdn");
    if (cd > 0 && !lock) {
      if (!c) {
        c = document.createElement("span");
        c.className = "cdn";
        b.appendChild(c);
      }
      c.textContent = Math.ceil(cd);
    } else if (c) c.remove();
    const mc = b.querySelector(".mc");
    if (u && mc) mc.textContent = Math.floor(Pl.ult) + "%";
  });
}
/* dipanggil tiap frame dari draw() saat battle */
function acTick(t) {
  const dt = Math.min(3, (t - (an.lt || t)) / 16.7);
  an.lt = t;
  if (!S || (mode !== "m" && mode !== "r")) return;
  if (S.pend && !an.a && mode === "r" && S.ehp > 0) {
    S.pend = false;
    mode = "m";
    menu();
  }
  Object.keys(Pl.cd).forEach((k) => {
    if (Pl.cd[k] > 0) Pl.cd[k] = Math.max(0, Pl.cd[k] - dt / AC.cdFrames);
  });
  Pl.fp = Math.min(mmp(), Pl.fp + dt * AC.manaRegen);
  Pl.dg = Math.max(0, (Pl.dg || 0) - dt);
  Pl.dgc = Math.max(0, (Pl.dgc || 0) - dt);
  if (S.ehp <= 0 || S.dead) return;
  enemyStep(dt); // musuh: tunggu → berjalan mendekat → aba-aba → serang → mundur
  if (F.party && PM.length && !S.pvol) {
    S.pt -= dt;
    if (S.pt <= 0) {
      S.pvol = true;
      partyAttack(() => {
        S.pvol = false;
        S.pt = AC.partyGap;
      });
    }
  }
  an.pk = (an.pk || 0) + dt;
  if (an.pk >= 5) {
    an.pk = 0;
    padTick();
    const sig = Math.floor(Pl.fp);
    if (sig !== an.fs) {
      an.fs = sig;
      bars();
    }
  }
}

/* ===== TIPE SERANGAN MONSTER =====
   t: "melee" = menerjang ke pemain · "ranged" = diam di tempat dan menembak (shot = jenis proyektil, n = jumlah tembakan).
   Kunci = nama sprite dasar (varian dungeon "slime_api" otomatis memakai "slime"). Monster baru yang tidak
   terdaftar = jarak dekat. Bisa juga diatur langsung di data monster: atkT: "ranged", shot: "rock", n: 2. */
const ATK_T = {
  slime: { t: "melee" }, fox: { t: "melee" }, wolf: { t: "melee" }, goblin: { t: "melee" }, mummy: { t: "melee" },
  crab: { t: "melee" }, shark: { t: "melee" }, ent: { t: "melee" },
  golem: { t: "ranged", shot: "rock", n: 1, col: "#b8ac98" },
  dragon: { t: "ranged", shot: "fire", n: 3, col: "#ff7a3a" },
  bandit: { t: "ranged", shot: "knife", n: 2, col: "#e8eef8" },
  scorpion: { t: "ranged", shot: "venom", n: 1, col: "#6fd04a" },
  cobra: { t: "ranged", shot: "venom", n: 2, col: "#6fd04a" },
  jelly: { t: "ranged", shot: "water", n: 1, col: "#4db8ff" },
  kraken: { t: "ranged", shot: "ink", n: 2, col: "#7a5aff" },
  shroom: { t: "ranged", shot: "spore", n: 1, col: "#c06bff" },
  owl: { t: "ranged", shot: "feather", n: 2, col: "#e8e0c8" },
};
function enemyAtk(e) {
  if (e.atkT === "ranged") return { t: "ranged", shot: e.shot || "orb", n: e.n2 || 1, col: e.shotCol };
  if (e.atkT === "melee") return { t: "melee" };
  return ATK_T[String(e.sp).split("_")[0]] || { t: "melee" };
}
/* tembakan musuh melaju lurus ke arah pemain (rendah, setinggi kaki-lutut) dan bisa DILOMPATI.
   p.v = kecepatan px/frame, p.h = tinggi lompat minimal untuk lolos, p.land(ev) dipanggil saat tembakan kena / lolos.
   Aba-aba: bola energi membesar di depan musuh. */
function enemyShots(ex, ey, w) {
  if (!S || !S.e) return;
  const T = enemyAtk(S.e),
    ox = ex + w * 0.15,
    oy = ey + w * 0.5,
    ty = GY - 44,
    pm = PMID();
  if (T.t === "ranged" && S.tel > 0 && !rm) {
    const u = 1 - S.tel / AC.telegraph;
    jGlow(ox, oy, 6 + 16 * u, T.col || "#ff6b8b", "#ffffff");
  }
  an.ep = (an.ep || []).filter((p) => !p.dead);
  an.ep.forEach((p) => {
    p.t++;
    if (p.t < 0) return;
    if (p.x0 == null) {
      p.x0 = ox;
      p.y0 = oy;
      p.x = ox;
      p.y = oy;
      p.span = Math.max(80, ox - pm);
    }
    p.px = p.x;
    p.py = p.y;
    p.x = p.x0 - p.t * p.v;
    p.y = p.y0 + (ty - p.y0) * clamp((p.x0 - p.x) / (p.span * 0.45), 0, 1);
    if (p.x <= pm + 14 && p.x >= pm - 18) {
      // proyektil melewati tubuh pemain: lolos bila sedang menghindar (Shift) atau cukup tinggi di udara
      p.ev = Pl.dg > 0 ? "HINDAR!" : an.jy >= p.h ? "LOMPAT!" : null;
      if (!p.ev) {
        p.dead = true;
        return p.land(null);
      }
    } else if (p.x < pm - 18) {
      p.dead = true;
      return p.land(p.ev || "MELESET!");
    }
    projShape(p.type, p.x, p.y, Math.atan2(p.y - p.py, p.x - p.px), p.t, { col: p.col });
  });
}
