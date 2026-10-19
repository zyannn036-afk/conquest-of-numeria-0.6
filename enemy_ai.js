/* ===== Numeria Quest — AI Musuh: State Machine Real-time =====
   Dimuat PALING AKHIR (setelah skill_fx.js). Tidak mengubah script.js: enemyStep, enemyDone, enemyAct dibungkus/diganti.
   Alur: Idle -> Chase -> Attack (aba-aba -> serang) -> Recover -> Chase -> ... terus-menerus sampai Dead.
   Nilai S.ph (dipakai script.js & jobs.js) dijaga kompatibel:
     0 Idle · 1 Chase · 2 Attack (aba-aba "!") · 3 Attack (serangan berjalan) · 4 Recover · 5 Stunned · 6 Dead
   Atur perilaku lewat ENEMY_AI di bawah. Per monster juga bisa lewat data: e.spd (kecepatan), e.rng (jarak tembak).
   TARGET MUSUH: musuh memilih sasaran TERDEKAT di antara pemain, Lyra, dan Selena (S.tid = "p" / id rekan).
   Rekan hanya ikut dipilih bila duo_lyra_selena.js terpasang (globalThis.DUOBT); tanpa itu perilaku sama seperti semula.
   Pukulan rekan = ringan (S.aiSoftDmg): tidak memotong aba-aba dan dorongannya kecil; arah dorongan menjauh dari penyerang (S.kdir). */
(function () {
  const AI = {
    detect: 520, // Idle -> Chase bila jarak ke pemain <= angka ini (px)
    recover: [14, 26], // lama Recover setelah menyerang (frame)
    cooldown: [40, 80], // cooldown serangan, dihitung sejak serangan selesai (frame)
    knock: 3, // dorongan knockback dasar (px/frame awal)
    knockMax: 13,
    flinch: 10, // musuh berhenti sesaat saat dipukul ketika sedang mengejar (frame)
    stagger: 16, // lama Stunned saat aba-aba serangan dipotong pukulan keras (frame)
    staggerHp: 0.08, // pukulan >= 8% HP maksimum musuh memotong aba-aba serangan
    poise: 70, // setelah di-stagger, kebal stagger selama ini (frame) agar tidak stunlock
    stunPerTurn: 70, // 1 "sengat" petir (S.stun) = 70 frame Stunned
    margin: 60, // jarak minimum musuh dari tepi arena kiri/kanan (px)
    switchGap: 70, // musuh pindah target hanya bila target lain lebih dekat sedikitnya sejauh ini (px), agar tidak bolak-balik
    retarget: 45, // seberapa sering musuh menimbang ulang target saat mengejar (frame)
  };
  globalThis.ENEMY_AI = AI;

  const rnd = (r) => r[0] + Math.random() * (r[1] - r[0]);
  const eoMin = () => EHX() - (VW - AI.margin); // batas kanan musuh
  const eoMax = () => EHX() - AI.margin; // batas kiri musuh
  const setEo = (v) => (S.eo = Math.max(eoMin(), Math.min(eoMax(), v)));
  /* ----- target: pemain ("p") atau rekan duo (id) ----- koordinat ASLI (bukan cermin) */
  const BT = () => globalThis.DUOBT;
  const ex0 = () => EHX() - (S.eo || 0); // pusat musuh
  const dTo = (c) => Math.abs(ex0() - c.x) - 16 * S.e.s; // jarak tepi musuh ke target
  const cands = () => {
    const l = [{ id: "p", x: PMr }],
      b = BT();
    if (b) b.list().forEach((c) => l.push(c));
    return l;
  };
  function pickTarget(force) {
    const l = cands();
    let best = l[0];
    l.forEach((c) => {
      if (dTo(c) < dTo(best)) best = c;
    });
    const cur = l.find((c) => c.id === S.tid);
    if (cur && !force && dTo(cur) <= dTo(best) + AI.switchGap) best = cur; // tetap pada target lama bila selisih kecil
    S.tid = best.id;
    S.tchk = AI.retarget;
    return best;
  }
  const tgt = () => cands().find((c) => c.id === S.tid) || pickTarget(true);
  const side = () => (tgt().x >= ex0() ? 1 : -1); // +1 target di kanan musuh, -1 di kiri
  const telegraph = () => (typeof AC !== "undefined" && AC.telegraph) || 24;

  function goChase() {
    S.ph = 1;
    S.eb = true;
    pickTarget(false); // tentukan sasaran terdekat
  }
  function enterStun(frames) {
    S.ph = 5;
    S.sT = frames;
    S.tel = 0;
    S.eb = false;
    SND.sfx("tick");
  }
  function die() {
    S.ph = 6;
    S.eb = false;
    S.tel = 0;
    S.shots = 0;
    S.kv = 0;
    if (an.ep && an.ep.length) an.ep = []; // proyektil yang masih melayang dihentikan
  }
  /* reaksi saat musuh kehilangan HP: terdeteksi, terdorong, dan bisa terpotong aba-abanya.
     Pukulan Lyra/Selena (S.aiSoftDmg, diisi duo_lyra_selena.js) dianggap ringan: tidak memotong aba-aba & dorongannya kecil.
     Arah dorongan = menjauh dari PENYERANG (pemain atau rekan), bukan dari sasaran musuh. */
  function react(lost) {
    const e = S.e,
      soft = Math.min(lost, S.aiSoftDmg || 0),
      mine = lost - soft; // bagian damage dari pemain
    S.aiSoftDmg = 0;
    if (S.ph === 0) goChase(); // dipukul = langsung sadar
    S.kv = Math.min(AI.knockMax, AI.knock * (mine > 0 ? 1 : 0.4) + (lost / e.hp) * (mine > 0 ? 40 : 14));
    S.kdir = (mine > 0 || S.cfrom == null ? PMr : S.cfrom) >= ex0() ? 1 : -1;
    if (S.ph === 2 && mine >= e.hp * AI.staggerHp && (S.poise || 0) <= 0) {
      enterStun(AI.stagger); // aba-aba serangan dipotong
      S.poise = AI.poise;
    } else if (S.ph === 1 && mine > 0) S.flinch = AI.flinch;
  }

  const _done = enemyDone;
  enemyDone = function () {
    S.eb = false;
    S.ph = 4; // Recover
    S.rec = rnd(AI.recover);
    S.acd = rnd(AI.cooldown);
    void _done;
  };

  const _act = enemyAct;
  enemyAct = function () {
    if (!S || S.ehp <= 0 || S.dead) return enemyDone(); // musuh mati tidak boleh menyerang
    const b = BT();
    if (b && !(S.stun > 0)) {
      const t = tgt();
      if (t.id !== "p" && b.attack(t.id)) return; // sasaran = Lyra / Selena (damage ke HP mereka)
    }
    return _act();
  };

  enemyStep = function (dt) {
    if (!S || !S.e) return;
    if (S.ehp <= 0 || S.dead) return die(); // Dead: berhenti bergerak & menyerang
    if (mode === "x" || mode === "w") return;
    const e = S.e,
      T = enemyAtk(e),
      rg = T.t === "ranged",
      v = (e.spd || (rg ? 2.2 : 3)) * (S.freeze > 0 ? 0.5 : 1) * dt,
      goal = rg ? e.rng || (T.shot === "fire" ? 320 : 250) : MELEE.stop;
    S.eo = S.eo || 0;

    /* lacak HP untuk mendeteksi pukulan pemain (dan reset bila HP dipulihkan, mis. coba lagi) */
    if (S.aiHp === undefined) S.aiHp = S.ehp;
    const lost = S.aiHp - S.ehp;
    S.aiHp = S.ehp;
    if (lost > 0) react(lost);

    /* timer umum */
    if (S.ph !== 0) S.acd = Math.max(0, (S.acd || 0) - dt);
    S.poise = Math.max(0, (S.poise || 0) - dt);

    /* Knockback: dorongan menjauh dari pemain, meredam sendiri */
    if (S.kv > 0.1) {
      setEo(S.eo + (S.kdir || side()) * S.kv * dt); // menjauh dari penyerang
      S.kv *= Math.pow(0.82, dt);
    } else S.kv = 0;

    /* status sengatan petir (S.stun) -> Stunned, kecuali sedang di tengah serangan */
    if (S.stun > 0 && (S.ph === 1 || S.ph === 2 || S.ph === 4)) enterStun(S.stun * AI.stunPerTurn);

    const tg = tgt(),
      gap = Math.max(0, dTo(tg)); // jarak ke target saat ini (pemain atau rekan)
    switch (S.ph) {
      case 0: // Idle: belum mendeteksi pemain
        S.et -= dt;
        if (S.et <= 0 || gap <= AI.detect) goChase();
        break;

      case 1: // Chase: kejar pemain; serang bila jarak & cooldown terpenuhi
        if (S.flinch > 0) {
          S.flinch -= dt;
          break;
        }
        S.tchk = (S.tchk || 0) - dt;
        if (S.tchk <= 0) pickTarget(false); // timbang ulang: siapa yang paling dekat sekarang?
        if (gap > goal) setEo(S.eo - side() * Math.min(v, gap - goal)); // kejar ke arah pemain, kiri atau kanan
        else if (rg && gap < goal * 0.6) setEo(S.eo + side() * v * 0.6); // penembak menjaga jarak
        if (gap <= goal + 2 && (S.acd || 0) <= 0) {
          S.ph = 2;
          S.tel = telegraph();
          SND.sfx("tick");
        }
        break;

      case 2: // Attack (aba-aba): jarak dekat tetap melangkah pelan, lalu serang
        if (!rg && gap > goal) setEo(S.eo - side() * Math.min(v * 0.5, gap - goal));
        S.tel -= dt;
        if (S.tel <= 0) {
          S.tel = 0;
          S.ph = 3;
          enemyTurn(); // -> enemyAct -> enemyDone (masuk Recover)
        }
        break;

      case 3: // Attack (sedang menyerang): menunggu enemyDone dari enemyAct
        break;

      case 4: // Recover: selesaikan jeda serangan, lalu kejar lagi
        S.rec -= dt;
        if (S.rec <= 0) goChase();
        break;

      case 5: // Stunned: tidak bergerak & tidak menyerang sampai pulih
        S.sT -= dt;
        if (S.sT <= 0) {
          S.stun = 0;
          goChase();
          S.acd = Math.max(S.acd || 0, 20);
        }
        break;
    }
  };
})();
