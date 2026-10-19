/* ===== Numeria Quest — Kesulitan: level lebih susah naik + monster lebih kuat =====
   Pasang di index.html PALING AKHIR (setelah duo_lyra_selena.js):
     <script src="kesulitan.js"></script>
   Tidak mengubah script.js: win() dan start() dibungkus. Semua angka ada di DIFF di bawah (1 = bawaan lama).

   LEVEL LEBIH SUSAH
   - Aslinya naik level butuh XP = level x 30. Sekarang butuh XP x (xp.mul + xp.ramp x (level-1)) dari itu:
       Lv1 x1,5 · Lv3 x1,9 · Lv5 x2,3 · Lv10 x3,3   (dengan nilai bawaan di bawah).
   - Cara kerjanya: XP yang didapat dari musuh dikecilkan sebesar kebalikan pengali itu, jadi bar XP & ambang "level x 30"
     di UI tetap konsisten, hanya angka "+XP" yang tampil lebih kecil. Rekan (Lyra & Selena) memakai skala yang sama (XP_HARD).
   - XP dari sumber lain (mis. hadiah misi guild yang langsung menambah Pl.xp) tidak ikut diperkecil.

   MONSTER LEBIH KUAT (dihitung ulang tiap battle dari angka dasar monster, ikut level hero)
   - HP   = dasar x hp.mul x (1 + hp.perLv x (level hero - 1))
   - ATK  = dasar x atk.mul + atk.perLv x (level hero - 1)
            (tambahan per level penting: damage musuh ke hero aslinya dikurangi level hero, jadi di level tinggi monster
             lama nyaris tidak melukai)
   - Kecepatan jalan x spd, jeda antar serangan x cooldown & recover (lebih agresif), aba-aba serangan x telegraph (lebih singkat). */
(function () {
  const DIFF = {
    xp: { mul: 1.5, ramp: 0.2 },
    hp: { mul: 1.5, perLv: 0.1 },
    atk: { mul: 1.4, perLv: 1.7 }, // damage ke hero = atk - level hero, jadi perLv harus > 1 agar monster tetap menyakitkan di level tinggi
    spd: 1.15, // kecepatan jalan musuh
    cooldown: 0.7, // jeda serangan (makin kecil = makin sering menyerang)
    telegraph: 0.8, // lama tanda "!" sebelum menyerang (makin kecil = makin sulit dihindari)
  };
  globalThis.DIFF = DIFF;

  /* skala XP per level penerima: 1 / pengali kesulitan */
  const xpMul = (lv) => DIFF.xp.mul + DIFF.xp.ramp * Math.max(0, lv - 1);
  globalThis.XP_HARD = { mul: xpMul, scale: (lv) => 1 / xpMul(lv) };

  /* ----- XP hero ----- */
  if (typeof win === "function") {
    const _win = win;
    win = function () {
      const e = typeof S !== "undefined" && S && S.e;
      if (!e || typeof e.xp !== "number" || typeof Pl === "undefined") return _win.apply(this, arguments);
      const o = e.xp;
      e.xp = Math.max(1, Math.round(o * XP_HARD.scale(Pl.lv)));
      try {
        return _win.apply(this, arguments);
      } finally {
        e.xp = o; // kembalikan angka asli (rekan menghitung skalanya sendiri)
      }
    };
  } else console.warn("[kesulitan] win() tidak ditemukan: XP tidak diperberat");

  /* ----- monster ----- */
  if (typeof start === "function" && typeof E !== "undefined") {
    const _start = start;
    start = function (i) {
      const e = E[i];
      if (e && typeof e.hp === "number" && typeof e.atk === "number") {
        // angka dasar disimpan sekali; bila file lain mengubahnya setelah kita (hp/atk beda dari hasil kita), ambil ulang
        let b = e._base;
        if (!b || e.hp !== b.hpA || e.atk !== b.atkA) b = e._base = { hp: e.hp, atk: e.atk, spd: e.spd };
        const lv = (typeof Pl !== "undefined" && Pl.lv) || 1;
        e.hp = b.hpA = Math.round(b.hp * DIFF.hp.mul * (1 + DIFF.hp.perLv * (lv - 1)));
        e.atk = b.atkA = Math.round(b.atk * DIFF.atk.mul + DIFF.atk.perLv * (lv - 1));
        if (DIFF.spd !== 1) {
          const rg = typeof enemyAtk === "function" && enemyAtk(e).t === "ranged";
          e.spd = +((b.spd || (rg ? 2.2 : 3)) * DIFF.spd).toFixed(2);
        }
      }
      return _start.apply(this, arguments);
    };
  } else console.warn("[kesulitan] start() / E tidak ditemukan: monster tidak diperkuat");

  /* ----- agresivitas AI (enemy_ai.js) ----- */
  if (globalThis.ENEMY_AI) {
    const A = ENEMY_AI;
    if (!A._hard) {
      A.cooldown = A.cooldown.map((v) => Math.round(v * DIFF.cooldown));
      A.recover = A.recover.map((v) => Math.round(v * DIFF.cooldown));
      A._hard = 1;
    }
  }
  if (typeof AC !== "undefined" && AC && typeof AC.telegraph === "number" && !AC._hard) {
    AC.telegraph = Math.max(10, Math.round(AC.telegraph * DIFF.telegraph));
    AC._hard = 1;
  }
  console.info("[kesulitan] aktif: XP x" + DIFF.xp.mul + "+, HP x" + DIFF.hp.mul + ", ATK x" + DIFF.atk.mul);
})();
