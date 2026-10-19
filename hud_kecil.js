/* ===== Numeria Quest — HUD kecil (bar HP / Mana / Ultimate pojok kiri) =====
   Pasang di index.html PALING AKHIR (setelah obrolan_party.js):
     <script src="hud_kecil.js"></script>

   - Mengecilkan panel kiri atas (.hb.pl): bar hero + baris Lyra & Selena yang muncul saat battle (#duoh).
   - Tombol menu (Pengaturan / Misi / Rekan) otomatis turun mengikuti tinggi panel, jadi tidak menumpuk lagi.
   - Pemain bisa memilih ukuran di Pengaturan > Tampilan HUD (Otomatis / Kecil / Sedang / Normal).
   Tidak mengubah file lain. Angka skala ada di ZOOM di bawah (1 = ukuran asli). */
(() => {
  const ZOOM = { kecil: 0.5, sedang: 0.68, normal: 1 };
  const AUTO = { sempit: 0.5, lebar: 0.75, batas: 1100 }; // Otomatis: layar < batas px = sempit (HP)
  const KEY = "nq_hud_ukuran";

  let pref = "otomatis";
  try {
    pref = localStorage.getItem(KEY) || "otomatis";
  } catch (e) {}

  const hud = () => document.querySelector(".hb.pl"),
    menu = () => document.querySelector(".menu"),
    cv = () => document.getElementById("c");
  const scaleNow = () => {
    if (ZOOM[pref]) return ZOOM[pref];
    const c = cv(),
      w = c ? c.getBoundingClientRect().width : window.innerWidth;
    return w < AUTO.batas ? AUTO.sempit : AUTO.lebar;
  };

  function apply() {
    const h = hud();
    if (!h) return;
    const z = scaleNow();
    h.style.transformOrigin = "top left";
    h.style.transform = z === 1 ? "" : `scale(${z})`;
  }

  /* tombol menu turun tepat di bawah panel (panel tumbuh saat baris rekan muncul di battle) */
  function fit() {
    const h = hud(),
      m = menu();
    if (!h || !m) return;
    const pos = getComputedStyle(m).position;
    if (pos === "static") return;
    const hb = h.getBoundingClientRect();
    let top;
    if (pos === "fixed") top = hb.bottom + 6;
    else {
      const op = m.offsetParent || document.body,
        pr = op.getBoundingClientRect(),
        sy = op.offsetHeight ? pr.height / op.offsetHeight : 1;
      top = (hb.bottom - pr.top) / (sy || 1) + 6;
    }
    m.style.top = Math.max(0, Math.round(top)) + "px";
    m.style.bottom = "auto";
  }
  const refresh = () => {
    apply();
    fit();
  };

  /* pantau perubahan tinggi panel (baris rekan muncul / hilang), ukuran layar, dan elemen yang baru dibuat */
  let ro = null,
    watched = null;
  function watch() {
    const h = hud();
    if (h && h !== watched && "ResizeObserver" in window) {
      if (ro) ro.disconnect();
      ro = new ResizeObserver(refresh);
      ro.observe(h);
      watched = h;
    }
  }
  setInterval(() => {
    watch();
    refresh();
  }, 600);
  window.addEventListener("resize", refresh);
  window.addEventListener("orientationchange", () => setTimeout(refresh, 200));
  watch();
  refresh();

  /* opsi di menu Pengaturan */
  try {
    const ms = document.getElementById("mset");
    if (ms) {
      const fs = document.createElement("fieldset");
      fs.innerHTML =
        '<legend>Tampilan HUD</legend><label class="sw">Ukuran bar HP / Mana <select id="hudz"><option value="otomatis">Otomatis</option><option value="kecil">Kecil</option><option value="sedang">Sedang</option><option value="normal">Normal</option></select></label>';
      ms.insertBefore(fs, ms.querySelector(".row.end") || null);
      const sel = fs.querySelector("select");
      sel.value = pref;
      sel.onchange = () => {
        pref = sel.value;
        try {
          localStorage.setItem(KEY, pref);
        } catch (e) {}
        refresh();
      };
    }
  } catch (e) {}

  console.log("[hud_kecil] aktif: HUD pojok kiri diperkecil");
})();
