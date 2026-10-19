/* ===== Numeria Quest — NPC dari gambar referensi 96x128 =====
   Dimuat PALING AKHIR (setelah npc_pixel.js dan npc_sheet.js). Tidak mengubah file lain:
   - membungkus H.npc untuk tahu NPC mana yang diajak bicara,
   - NPC di peta dunia = sprite 24x32 hasil perkecilan langsung dari sprite 96x128 gambar referensi,
   - dialog = sprite 96x128 asli di samping teks,
   - sprite dipilih dari kunci peran NPC (e.sp) + nama NPC, jadi tiap NPC selalu tampil sama.
   Kunci yang tidak ada di gambar (elf, drakonid, dll.) tetap memakai sprite lamanya. */
(() => {
  if (typeof NPCIMG === "undefined" || typeof H === "undefined" || typeof dlg !== "function") {
    console.warn("[npc_apply] dilewati: NPCIMG / H / dlg tidak ditemukan");
    return;
  }
  const hash = (s) => {
      let h = 2166136261;
      for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
      return h >>> 0;
    },
    memo = new Map(),
    ALIAS = { kuno: "pedagangkuno", pedagangk: "pedagangkuno" };

  /* NPC bernama -> sprite khusus (cocok lewat nama di e.d[0] atau e.id) */
  const NAMED = [
    [/pedagang\s*kuno/i, "pedagangkuno"],
    [/seniman\s*jalanan/i, "seniman"],
  ];
  /* Raja & Ratu: atlas gambar tidak punya sel "raja"/"ratu" (hanya rajalaut/ratulaut), jadi dulu jatuh ke sprite lama
     SP.raja / SP.ratu (royals.js). Kunci sprite NPC (e.sp) -> preset NPCPX di npc_pixel.js (desain preset tidak diubah).
     Kalau NPC raja/ratu di istana.js / kerajaan.js memakai e.sp lain, tambahkan di sini: { kunciNPC: "raja" }. */
  const PXALIAS = { raja: "raja", ratu: "ratu" };
  const pxFor = (e) => {
    const k = e && e.t === "npc" && typeof NPCPX !== "undefined" ? PXALIAS[e.sp] : null;
    return k && NPCPX.PRESETS[k] ? k : null;
  };
  /* indeks sel di atlas, atau -1 kalau NPC ini tidak punya sprite di gambar */
  function cellFor(e) {
    if (!e) return -1;
    const who = (e.d && e.d[0]) || e.id || "";
    let key = null;
    for (const [re, k] of NAMED) if (re.test(who) || re.test(e.id || "")) key = k;
    if (!key) key = ALIAS[e.sp] || e.sp;
    if (!key || !NPCIMG.has(key)) return -1;
    const id = key + "|" + who;
    if (!memo.has(id)) memo.set(id, NPCIMG.pick(key, hash(id)));
    return memo.get(id);
  }

  /* ---------- NPC di peta dunia ---------- */
  if (typeof ent === "function") {
    const _ent = ent;
    ent = function (e, t, bob) {
      const pk = pxFor(e);
      if (e && e.t === "npc" && (pk || NPCIMG.ready)) {
        const i = pk ? -1 : cellFor(e);
        if (pk || i >= 0) {
          /* ukuran & posisi SAMA dengan hero (hero_pixel.js): 128 baris sprite = NPC_WORLD_H piksel peta, kaki di Y+16, tengah di X+8 */
          const X = e.x * 16,
            Y = e.y * 16 + OY,
            sc = typeof SC === "number" && SC > 0 ? SC : 1,
            q = (v) => Math.round(v * sc) / sc,
            K = typeof NPC_WORLD_H === "number" ? NPC_WORLD_H : 32,
            w = (K * 96) / 128,
            cx = q(X + 8),
            x0 = q(cx - w / 2),
            y0 = q(Y + 16 - K),
            sm = ctx.imageSmoothingEnabled,
            sq = ctx.imageSmoothingQuality;
          ctx.imageSmoothingEnabled = sc > 1.01; /* kanvas beresolusi tinggi: perkecil halus (seperti hero); 1:1 tetap tajam */
          ctx.imageSmoothingQuality = "high";
          ctx.save();
          if (e.face === -1) {
            ctx.translate(cx, 0);
            ctx.scale(-1, 1);
            ctx.translate(-cx, 0);
          }
          if (pk) ctx.drawImage(NPCPX.canvas(pk), x0, y0, q(x0 + w) - x0, q(y0 + K) - y0);
          else NPCIMG.big(ctx, i, x0, y0, q(x0 + w) - x0, q(y0 + K) - y0);
          ctx.restore();
          ctx.imageSmoothingEnabled = sm;
          ctx.imageSmoothingQuality = sq;
          if ((e.id === "euclid" && (!F.met || (claimed() >= 5 && !F.ch1))) || (e.id === "lyra" && !F.lyra)) mark(e, X, Y, bob, 16);
          return;
        }
      }
      return _ent(e, t, bob);
    };
  }
  console.log("[npc_apply] aktif: NPC dari gambar referensi 96x128");

  /* gaya potret dialog */
  const css = document.createElement("style");
  css.textContent =
    ".npcd{display:flex;gap:12px;align-items:flex-end}" +
    ".npcd canvas{flex:none;width:96px;height:128px;margin-bottom:-2px;filter:drop-shadow(0 2px 0 rgba(0,0,0,.4))}" +
    ".npct{flex:1;min-width:0}" +
    "@media (max-height:520px){.npcd canvas{width:72px;height:96px}}";
  document.head.appendChild(css);

  /* ingat siapa yang sedang diajak bicara sampai dialog selesai (idle) */
  let cur = null;
  const _npc = H.npc;
  H.npc = (e) => {
    cur = e;
    return _npc(e);
  };
  const _idle = idle;
  idle = function () {
    cur = null;
    return _idle.apply(this, arguments);
  };

  const _dlg = dlg;
  dlg = function (who, lines, cb) {
    /* NPC lama tanpa e.d (Euclid, Lyra, dst.): cocokkan lewat jarak ke pemain */
    const near = cur && !cur.d && Math.abs(px - cur.x) + Math.abs(py - cur.y) <= 1,
      talking = cur && ((cur.d && cur.d[0] === who) || near),
      pk = talking ? pxFor(cur) : null,
      ci = talking && !pk && NPCIMG.ready ? cellFor(cur) : -1;
    if (ci < 0 && !pk) return _dlg(who, lines, cb);
    busy = true;
    let i = 0;
    const paint = () => {
      const c = document.getElementById("npcp");
      if (!c) return;
      const r = c.getBoundingClientRect(),
        k = window.devicePixelRatio || 1,
        w = Math.max(1, Math.round(r.width * k)),
        h = Math.max(1, Math.round(r.height * k));
      c.width = w;
      c.height = h;
      const x = c.getContext("2d");
      x.imageSmoothingEnabled = w < (pk ? NPCPX.W : 96); /* diperbesar: piksel tajam; diperkecil: halus */
      x.imageSmoothingQuality = "high";
      if (pk) x.drawImage(NPCPX.canvas(pk), 0, 0, w, h);
      else NPCIMG.big(x, ci, 0, 0, w, h);
    };
    const show = () => {
      SND.sfx("talk");
      say(who + " berbicara...");
      ui(
        `<div class="card npcd"><canvas id="npcp" width="96" height="128"></canvas><div class="npct"><b class="ok">${who}</b><div style="margin:6px 0 10px">${lines[i]}</div><div class="row"><button class="b" id="dn">${i < lines.length - 1 ? "Lanjut" : "Tutup"}</button></div></div></div>`,
      );
      paint();
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
  };
})();
