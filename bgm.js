/* ===== Numeria Quest — musik latar dari berkas MP3 =====
   Dimuat tepat setelah audio.js. Membungkus SND.music/SND.setMus: zona yang terdaftar di TRACK
   memutar berkas (loop, fade), zona/battle lain tetap memakai musik sintetis audio.js. */
(function () {
  const VOL = 0.5, // volume musik berkas (0..1)
    FADE = 600, // lama fade masuk/keluar (ms)
    FILE = {
      hutan: "music/hutan.mp3",
      kota_awal: "music/kota_awal.mp3",
      kota_kerajaan: "music/kota_kerajaan.mp3",
    },
    /* kode zona -> berkas. Desa Satuan (V) & Kota Bangun (K) memakai musik kota awal;
       Hutan Pecahan (H), Hutan Rimba (F), Pesisir Logaritma (C) memakai musik hutan;
       Kota Kerajaan (R), Istana (N), Kota Logaritma (L), Istana Logaritma (Y) memakai musik kota kerajaan;
       Padang Himpunan (W) & Hutan Peluang (E) memakai musik hutan; Kota Himpunan (X) memakai musik kota awal. */
    TRACK = {
      V: "kota_awal", K: "kota_awal",
      H: "hutan", F: "hutan", C: "hutan",
      R: "kota_kerajaan", N: "kota_kerajaan", L: "kota_kerajaan", Y: "kota_kerajaan",
      W: "hutan", E: "hutan", X: "kota_awal",
    },
    au = {}; // cache elemen Audio per berkas
  let cur = null, // kunci berkas yang sedang diputar
    pending = null; // kunci yang menunggu interaksi pengguna (autoplay diblokir)
  const orig = { music: SND.music, setMus: SND.setMus };
  const get = (k) => {
    if (!au[k]) {
      const a = new Audio(FILE[k]);
      a.loop = true;
      a.preload = "auto";
      a.volume = 0;
      au[k] = a;
    }
    return au[k];
  };
  const musicOn = () => SND.on.mus !== false;
  function fade(a, to, done) {
    clearInterval(a._f);
    const from = a.volume,
      t0 = performance.now();
    a._f = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / FADE);
      a.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) {
        clearInterval(a._f);
        done && done();
      }
    }, 40);
  }
  function stopFile() {
    pending = null;
    if (!cur) return;
    const a = au[cur];
    cur = null;
    fade(a, 0, () => a.pause()); // posisi lagu tersimpan; lanjut dari sini saat kembali
  }
  function startFile(k) {
    const a = get(k);
    cur = k;
    pending = null;
    if (!musicOn()) return;
    a.volume = 0;
    const p = a.play();
    if (p && p.then)
      p.then(() => cur === k && fade(a, VOL)).catch(() => {
        if (cur === k) pending = k; // diputar saat ada interaksi pertama
      });
    else fade(a, VOL);
  }
  SND.music = function (n) {
    const k = n && TRACK[n];
    if (k) {
      orig.music(null); // hentikan musik sintetis
      if (cur === k) return; // zona berbeda tapi lagu sama: lanjut tanpa putus
      if (cur) stopFile();
      return startFile(k);
    }
    stopFile();
    orig.music(n);
  };
  SND.setMus = function (v) {
    orig.setMus(v);
    if (!cur) return;
    const a = au[cur];
    if (v) startFile(cur);
    else fade(a, 0, () => a.pause());
  };
  const unlock = () => {
    if (pending && musicOn()) startFile(pending);
  };
  ["pointerdown", "keydown", "touchstart"].forEach((e) =>
    document.addEventListener(e, unlock, { passive: true }),
  );
  document.addEventListener("visibilitychange", () => {
    if (!cur) return;
    const a = au[cur];
    if (document.hidden) a.pause();
    else if (musicOn()) a.play().catch(() => (pending = cur));
  });
})();
