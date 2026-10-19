/* ===== Numeria Quest — lapisan antarmuka: Pengaturan, Misi, kontroler ===== */
const UIX = (() => {
  const q = (s) => document.querySelector(s),
    KEY = "nq-ui";
  let st = { ctl: "auto", tmr: true };
  try {
    st = { ...st, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {}
  };
  const coarse = () => matchMedia("(pointer: coarse)").matches;
  const ctl = () => (st.ctl === "auto" ? (coarse() ? "touch" : "kbd") : st.ctl);
  const api = { open: false };
  let padOn = null,
    lastFocus = null;

  /* ---------- kontroler ---------- */
  function applyCtl() {
    document.body.dataset.ctl = ctl();
    document
      .querySelectorAll('input[name="ctl"]')
      .forEach((r) => (r.checked = r.value === st.ctl));
    q("#ctlnote").textContent =
      st.ctl === "auto"
        ? `Terdeteksi otomatis: ${ctl() === "touch" ? "layar sentuh" : "keyboard"}.`
        : "";
    if (typeof idle === "function" && typeof W !== "undefined" && W.on && !busy)
      idle(); // segarkan teks petunjuk
  }
  api.hint = () =>
    ctl() === "touch"
      ? "Panah: gerak · A: bicara/buka · Tabrak musuh untuk bertarung"
      : "WASD/panah: gerak · Spasi: bicara · I: tas · T: teleport · M: misi · Esc: pengaturan";
  api.pad = (v) => {
    if (padOn === v) return;
    padOn = v;
    q("#pad").classList.toggle("off", !v);
    document.body.classList.toggle("pad-on", v);
  };

  /* ---------- overlay ---------- */
  function show(id) {
    hideAll();
    lastFocus = document.activeElement;
    api.open = true;
    if (typeof held !== "undefined") held = null;
    q("#ov").hidden = false;
    q(id).hidden = false;
    document.body.classList.add("modal-open");
    const f = q(id).querySelector("button, input");
    if (f) f.focus();
  }
  function hideAll() {
    q("#ov")
      .querySelectorAll(".modal")
      .forEach((m) => (m.hidden = true));
  }
  function close() {
    if (!api.open) return;
    api.open = false;
    hideAll();
    q("#ov").hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocus && lastFocus.isConnected && lastFocus.tagName !== "BODY")
      lastFocus.blur?.();
    document.activeElement?.blur?.();
  }
  api.close = close;

  api.settings = () =>
    api.open && !q("#mset").hidden ? close() : show("#mset");
  api.missions = () => {
    if (api.open && !q("#mmis").hidden) return close();
    renderMissions();
    show("#mmis");
  };

  /* ---------- misi ---------- */
  function renderMissions() {
    const box = q("#mlist");
    if (typeof QS === "undefined" || typeof F === "undefined" || !F.q) {
      box.innerHTML = '<div class="qm">Misi belum tersedia.</div>';
      return;
    }
    const done = claimed(),
      rows = QS.filter((m) => !m.on || m.on())
        .map((m) => {
          const s = F.q[m.id] || 0,
            e = EQ[m.it];
          let tag, cls;
          if (s === 3) ((tag = "Selesai"), (cls = "ok"));
          else if (s === 1 && m.chk())
            ((tag = "Siap diklaim di Papan Quest"), (cls = "ok"));
          else if (s === 1) ((tag = m.pr()), (cls = "wip"));
          else ((tag = "Belum diambil"), (cls = "qm"));
          return `<div class="irow"><div><b>${m.n}</b> ${s === 3 ? '<span class="ok">✔</span>' : ""}<br><small>${m.d}<br>Hadiah: ${m.coin} koin · ${e.n} · ${m.gp} GP</small></div><span class="mt ${cls}">${tag}</span></div>`;
        })
        .join("");
    box.innerHTML = `<div class="qm" style="margin-bottom:4px">Selesai ${done}/5 (minimal untuk Chapter 1). Ambil dan klaim misi di Papan Quest, Rumah Guild.</div>${rows}${
      F.party
        ? '<div class="qm" style="margin-top:8px">Misi Party bisa diulang dari Papan Quest untuk menaikkan rank.</div>'
        : ""
    }`;
  }

  /* ---------- pasang ---------- */
  function init() {
    q("#bset").onclick = api.settings;
    q("#bmis").onclick = api.missions;
    document
      .querySelectorAll("[data-close]")
      .forEach((b) => (b.onclick = close));
    q("#ov").addEventListener("pointerdown", (e) => {
      if (e.target === q("#ov")) close();
    });

    const tm = q("#tmr");
    tm.checked = st.tmr;
    tm.addEventListener("change", () => {
      st.tmr = tm.checked;
      save();
    });
    document.querySelectorAll('input[name="ctl"]').forEach((r) =>
      r.addEventListener("change", () => {
        st.ctl = r.value;
        save();
        applyCtl();
      }),
    );
    q("#bfs").onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    };
    q("#bfs").hidden = !document.documentElement.requestFullscreen;

    /* d-pad sentuh: geser jempol antar arah tetap berfungsi */
    const dp = q("#dpad");
    const pick = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY),
        b = el && el.closest("[data-d]");
      if (typeof held !== "undefined")
        held = b && !api.open ? b.dataset.d.split(",").map(Number) : null;
    };
    dp.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      dp.setPointerCapture(e.pointerId);
      pick(e);
    });
    dp.addEventListener("pointermove", (e) => {
      if (dp.hasPointerCapture(e.pointerId)) pick(e);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) =>
      dp.addEventListener(t, () => {
        if (typeof held !== "undefined") held = null;
      }),
    );
    q("#pa").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!api.open && typeof act === "function") act();
    });
    q("#pb").addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (!api.open && typeof inv === "function" && !busy) inv();
    });

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (api.open) {
        if (k === "escape") {
          e.preventDefault();
          close();
        } else if (k === "m" && !q("#mmis").hidden) {
          e.preventDefault();
          close();
        }
        return;
      }
      if (document.activeElement?.tagName === "INPUT") return;
      if (k === "escape" && !(typeof invOpen !== "undefined" && invOpen)) {
        e.preventDefault();
        api.settings();
      } else if (k === "m") {
        e.preventDefault();
        api.missions();
      }
    });
    matchMedia("(pointer: coarse)").addEventListener?.("change", applyCtl);
    applyCtl();
  }
  api.timerOn = () => q("#tmr").checked;
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
  return api;
})();
