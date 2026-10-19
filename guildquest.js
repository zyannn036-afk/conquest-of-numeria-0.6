/* ===== Numeria Quest — Misi Guild Acak (muncul setelah Chapter 1 selesai) =====
   Dimuat paling akhir (setelah party.js). Tidak mengubah world.js: board() dan UIX.missions() dibungkus.
   Papan Quest punya SLOTS misi acak. Jenis misi:
   - "hunt": kalahkan monster X sebanyak N kali (hitungan jalan dari pertarungan di mana pun, atau tombol Berburu di papan)
   - "quiz": jawab benar N soal topik tertentu saat bertarung
   Monster yang muncul menyesuaikan Rank guild. Misi yang diklaim langsung diganti misi acak baru.
   Isi misi disimpan di F.rq (ikut tersimpan bersama save game). Tombol Segarkan mengacak ulang misi yang belum diambil. */
(function () {
  const SLOTS = 3,
    HOT = 0.2, // peluang "Misi Mendesak" (hadiah x1,5)
    esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);

  /* monster yang boleh jadi target sesuai rank: E0-2 selalu; D: serigala/bandit/goblin; C: gurun; B: naga */
  const pool = () => {
    const r = ri(),
      a = [0, 1, 2];
    if (r >= 1) a.push(4, 5, 6);
    if (r >= 2) a.push(7, 8, 9);
    if (r >= 3) a.push(3);
    return a.filter((i) => E[i]);
  };
  const key = (m) => m.k + ":" + m.t;
  const monstersOf = (tp) =>
    pool()
      .filter((i) => (E[i].topics || []).includes(tp))
      .map((i) => E[i].n.split(" ")[0]);

  function gen(avoid) {
    const hot = Math.random() < HOT,
      x = hot ? 1.5 : 1,
      r = (v) => Math.max(1, Math.round(v * x));
    {
      const ids = pool().filter((i) => !avoid.includes("hunt:" + i)),
        i = P(ids.length ? ids : pool()),
        e = E[i],
        n = i === 3 ? 1 : R(2, 4);
      return { k: "hunt", t: i, n, p: 0, s: 0, hot, gp: r(Math.max(8, Math.round(e.xp * 0.6)) * n), coin: r(e.coin * n), xp: r(e.xp * 0.5 * n) };
    }
  }
  function ensure() {
    if (!F.ch1) return false;
    if (!Array.isArray(F.rq)) F.rq = [];
    F.rq = F.rq.filter((m) => m.k === "hunt"); // misi kuis lama dibuang
    while (F.rq.length < SLOTS) F.rq.push(gen(F.rq.map(key)));
    return true;
  }
  const title = (m) => (m.k === "hunt" ? `Basmi ${E[m.t].n.split(" ")[0]}` : `Latihan ${TN[m.t]}`),
    desc = (m) =>
      m.k === "hunt"
        ? `Kalahkan ${E[m.t].n} sebanyak ${m.n} kali.`
        : `Jawab benar ${m.n} soal ${TN[m.t]} saat bertarung (soal muncul saat Critical / Penetrasi). Monster dengan soal ini: ${monstersOf(m.t).join(", ") || "-"}.`;

  /* ---------- progres ---------- */
  const _def = W.defeated;
  W.defeated = function (i) {
    _def(i);
    (F.rq || []).forEach((m) => {
      if (m.s === 1 && m.k === "hunt" && m.t === i && m.p < m.n) m.p++;
    });
  };
  const _rec = record;
  record = function (tp, ok) {
    _rec(tp, ok);
    if (ok)
      (F.rq || []).forEach((m) => {
        if (m.s === 1 && m.k === "quiz" && m.t === tp && m.p < m.n) m.p++;
      });
  };

  /* ---------- klaim ---------- */
  function claimRq(idx) {
    const m = F.rq[idx];
    if (!m || m.s !== 1 || m.p < m.n) return;
    SND.sfx("quest");
    Pl.coin += m.coin;
    Pl.xp += m.xp;
    let up = "";
    while (Pl.xp >= Pl.lv * 30) {
      Pl.xp -= Pl.lv * 30;
      Pl.lv++;
      Pl.sp += SP_LV;
      up = ` Naik ke Level ${Pl.lv}! +${SP_LV} poin status.`;
    }
    if (up) {
      Pl.hp = mhp();
      Pl.fp = mmp();
    }
    const r = gain(m.gp),
      L = [`Misi "${title(m)}" selesai! +${m.coin} koin, +${m.xp} XP, +${m.gp} GP.${up}`];
    if (r) L.push(r);
    F.rq.splice(idx, 1);
    ensure();
    hud();
    dlg("Resepsionis Guild", L, () => board());
  }

  /* ---------- tampilan di Papan Quest ---------- */
  const row = (m, i) => {
    const done = m.s === 1 && m.p >= m.n,
      act =
        m.s === 0
          ? `<button class="b" data-rqa="${i}">Ambil</button>`
          : done
            ? `<button class="b" data-rqc="${i}">Klaim</button>`
            : `<small>${m.p}/${m.n}</small>${m.k === "hunt" ? `<button class="b g" data-rqg="${i}">Berburu</button>` : ""}`;
    return `<div class="irow"><div><b>${esc(title(m))}</b> ${m.hot ? '<span class="ok">★ Mendesak</span>' : ""}${m.s === 1 ? `<span class="qm"> ${m.p}/${m.n}</span>` : ""}<br><small>${esc(desc(m))}<br>Hadiah: ${m.coin} koin · ${m.xp} XP · ${m.gp} GP</small></div>${act}</div>`;
  };
  const _board = board;
  board = function () {
    _board();
    if (!ensure()) return;
    const card = document.querySelector("#ui .card"),
      close = document.querySelector("#bx"),
      tail = close && close.parentElement;
    if (!card || !tail) return;
    const box = document.createElement("div");
    box.innerHTML = `<div class="qm" style="margin:10px 0 4px">Misi Acak Guild <button class="b g" id="rqr" type="button" style="margin-left:6px">Segarkan</button></div>${F.rq.map(row).join("")}`;
    card.insertBefore(box, tail);
    box.querySelectorAll("[data-rqa]").forEach(
      (b) =>
        (b.onclick = () => {
          F.rq[+b.dataset.rqa].s = 1;
          SND.sfx("bag");
          board();
        }),
    );
    box.querySelectorAll("[data-rqc]").forEach((b) => (b.onclick = () => claimRq(+b.dataset.rqc)));
    box.querySelectorAll("[data-rqg]").forEach(
      (b) =>
        (b.onclick = () => {
          const m = F.rq[+b.dataset.rqg];
          busy = false;
          W.on = false;
          start(m.t); // sama seperti Misi Party: langsung bertarung dari papan
        }),
    );
    $("#rqr").onclick = () => {
      // acak ulang misi yang belum diambil
      const keep = F.rq.filter((m) => m.s === 1);
      F.rq = keep;
      ensure();
      SND.sfx("bag");
      board();
    };
    if (!F.rqSeen) {
      F.rqSeen = 1;
      say("Misi acak guild kini muncul di papan! Selesaikan untuk koin, XP, dan GP rank.");
    }
  };
  H.board = board; // H menyimpan rujukan lama ke board()

  /* ---------- daftar Misi (tombol ☰ / M) ---------- */
  const _mis = UIX.missions;
  UIX.missions = function () {
    _mis();
    const box = document.querySelector("#mlist"),
      pane = document.querySelector("#mmis");
    if (!box || !pane || pane.hidden || !ensure()) return;
    const act = F.rq.filter((m) => m.s === 1);
    box.insertAdjacentHTML(
      "beforeend",
      `<div class="qm" style="margin:10px 0 4px">Misi Acak Guild · ${act.length ? "sedang dikerjakan" : "belum ada yang diambil (ambil di Papan Quest)"}</div>` +
        act
          .map(
            (m) =>
              `<div class="irow"><div><b>${esc(title(m))}</b><br><small>${esc(desc(m))}<br>Hadiah: ${m.coin} koin · ${m.xp} XP · ${m.gp} GP</small></div><span class="mt ${m.p >= m.n ? "ok" : "wip"}">${m.p >= m.n ? "Siap diklaim di Papan Quest" : m.p + "/" + m.n}</span></div>`,
          )
          .join(""),
    );
  };
})();
