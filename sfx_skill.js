/* ===== Numeria Quest — suara efek skill =====
   Pasang di index.html PALING AKHIR (setelah skill_fx.js / hud_kecil.js):
     <script src="sfx_skill.js"></script>
   Taruh semua berkas .mp3 suara di folder  sfx/  (sejajar dengan index.html), atau ubah BASE di bawah.

   Cara kerja: tiap efek skill yang masuk antrean an.sf (efek hero, Lyra, Selena, semua dari skill_fx.js) dipantau.
   Begitu sebuah efek MULAI tampil (t >= 0), suara yang cocok dengan jenis efeknya (kind) diputar sekali.
   Tidak ada file lain yang diubah. Serang Biasa pedang hero diputar lewat pembungkus hitFx; Serang Biasa Lyra lewat satu baris di strikeL (duo_lyra_selena.js).
   Suara teleport Lyra memerlukan SATU baris tambahan di duo_lyra_selena.js (sudah disiapkan filenya).

   Suara mengikuti centang "Efek suara" di Pengaturan. Ubah tabel MAP / SOUND di bawah untuk mengganti pasangan suara. */
(() => {
  const BASE = "sfx/"; // folder berkas suara
  const MASTER = 0.8; // volume umum (0..1)

  /* nama pendek -> berkas, volume, jeda minimal antar pemutaran suara yang sama (ms) */
  const SOUND = {
    basic: { f: "bassoic_attack_pedang_lyra_hero.mp3", v: 0.9, gap: 80 }, // Serang Biasa pedang: hero (job pedang) & Lyra
    slash: { f: "slash.mp3", v: 0.9, gap: 150 },
    excalibur: { f: "excalibur.mp3", v: 1, gap: 7000 }, // sekali per ulti
    explosion: { f: "explosion.mp3", v: 1, gap: 2800 },
    fire: { f: "fire_ball.mp3", v: 0.9, gap: 350 },
    ice: { f: "ice.mp3", v: 0.9, gap: 450 },
    bolt: { f: "petir.mp3", v: 0.9, gap: 300 },
    hole: { f: "sihir_kegelapan_blackhole.mp3", v: 1, gap: 4500 },
    holy: { f: "sihir_cahaya_hero.mp3", v: 1, gap: 2500 }, // sihir cahaya hero penyihir
    teleport: { f: "teleport_after_dash_lyra.mp3", v: 1, gap: 300 },
  };

  /* jenis efek skill_fx.js (kind) -> suara. Efek yang tidak tercantum di sini tidak berbunyi. */
  const MAP = {
    // Pendekar Pedang
    sxh: "slash", // Tebasan Kuat
    sxd: "slash", // Dash Tembus (juga dipakai Lyra)
    sxj: "slash", // Lompat Dash
    sxe: "excalibur", // ulti Excalibur
    sxb: "excalibur",
    sxf: "fire", // tebasan api
    sxl: "bolt", // tebasan petir
    sxi: "ice", // pedang es
    // Pemanah
    axf: "fire", // panah api
    axm: "fire",
    axl: "bolt", // panah petir / petir menyambar
    axu: "explosion", // ulti pemanah
    // Penyihir (hero & Selena)
    mxf: "fire", // Bola Api
    mxb: "bolt", // Sinar Petir
    mxi: "ice", // Hujan Es
    mxu: "explosion", // ulti Explosion
    mxh: "hole", // Black Hole (Kegelapan) — hero penyihir
    mxs: "holy", // Sihir Cahaya (pedang surgawi) — hero penyihir
  };

  /* ---------- pemutar ---------- */
  const pool = {}; // nama -> { els: [Audio...], last: waktu terakhir }
  const get = (n) => {
    const s = SOUND[n];
    if (!s) return null;
    if (!pool[n]) {
      pool[n] = { els: [], last: -1e9 };
      for (let i = 0; i < 2; i++) {
        const a = new Audio(BASE + s.f);
        a.preload = "auto";
        a.addEventListener("error", () =>
          console.warn(
            "[sfx_skill] gagal memuat " +
              BASE +
              s.f +
              " (cek nama berkas & folder)",
          ),
        );
        pool[n].els.push(a);
      }
    }
    return pool[n];
  };
  const enabled = () => {
    try {
      if (document.hidden) return false;
      const cb = document.getElementById("snd");
      if (cb && cb.checked === false) return false;
      if (typeof SND !== "undefined" && SND.on && SND.on.sfx === false)
        return false;
    } catch (e) {}
    return true;
  };
  function play(n, vol) {
    if (!enabled()) return;
    const p = get(n),
      s = SOUND[n];
    if (!p) return;
    const now = performance.now();
    if (now - p.last < s.gap) return;
    p.last = now;
    let a = p.els.find((e) => e.paused || e.ended);
    if (!a) a = p.els[0]; // semua sedang bunyi: ulang yang paling lama
    try {
      a.currentTime = 0;
    } catch (e) {}
    a.volume = Math.max(0, Math.min(1, MASTER * s.v * (vol == null ? 1 : vol)));
    const r = a.play();
    if (r && r.catch) r.catch(() => {});
  }

  /* ---------- pantau efek skill baru di an.sf ---------- */
  const seen = new WeakSet();
  function scan() {
    try {
      const list = typeof an !== "undefined" && an && an.sf;
      if (list && list.length)
        for (let i = 0; i < list.length; i++) {
          const f = list[i];
          if (!f || seen.has(f) || !(f.t >= 0)) continue;
          seen.add(f);
          const n = MAP[f.kind];
          if (n) play(n);
        }
    } catch (e) {}
    requestAnimationFrame(scan);
  }
  requestAnimationFrame(scan);

  /* ---------- Serang Biasa pedang hero ----------
     Jalur utama: jobFrame (dipanggil tiap frame animasi, a.sk = skill yang dipakai). Begitu ayunan Serang Biasa (id "atk") MULAI,
     suara diputar sekali. Jalur cadangan: hitFx act "atk" (hanya jika jalur utama belum berbunyi dalam 700 ms terakhir). */
  const isSwordHero = () => {
    try {
      return (
        typeof Pl === "undefined" || !Pl || (Pl.job || "sword") === "sword"
      );
    } catch (e) {
      return true;
    }
  };
  const lastBasic = () => (pool.basic ? pool.basic.last : -1e9);
  if (typeof jobFrame === "function") {
    const _jf = jobFrame;
    const mem = new WeakMap(); // a -> { sk, t } terakhir terlihat
    jobFrame = function (a) {
      try {
        if (a && a.sk && a.sk.id === "atk" && isSwordHero()) {
          const m = mem.get(a);
          const t = a.t || 0;
          if (!m || m.sk !== a.sk || t < m.t) play("basic"); // ayunan baru dimulai
          mem.set(a, { sk: a.sk, t });
        }
      } catch (e) {}
      return _jf.apply(this, arguments);
    };
  }
  if (typeof hitFx === "function") {
    const _hf = hitFx;
    hitFx = function (act) {
      try {
        if (
          act === "atk" &&
          isSwordHero() &&
          performance.now() - lastBasic() > 700
        )
          play("basic");
      } catch (e) {}
      return _hf.apply(this, arguments);
    };
  }

  /* muat berkas lebih awal (setelah interaksi pertama) supaya tidak tersendat saat pertama kali dipakai */
  const preload = () => Object.keys(SOUND).forEach(get);
  ["pointerdown", "keydown", "touchstart"].forEach((e) =>
    document.addEventListener(e, preload, { once: true, passive: true }),
  );

  /* alat: SFXSK.play("fire"), SFXSK.map.sxh = "ice" dari konsol untuk mencoba */
  globalThis.SFXSK = { play, map: MAP, sound: SOUND };
  console.log("[sfx_skill] aktif: suara skill (folder " + BASE + ")");
})();
