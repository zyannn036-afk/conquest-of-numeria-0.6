/* ===== Numeria Quest — Obrolan Party (Lloyd, Lyra, Selena) =====
   Pasang di index.html PALING AKHIR (setelah duo_lyra_selena.js / kesulitan.js):
     <script src="obrolan_party.js"></script>

   Yang dilakukan file ini (tidak mengubah file lain, hanya membungkus fungsi yang ada):
   - Gelembung obrolan (non-blocking, muncul di atas layar) saat party Lyra + Selena sudah bergabung (F.duo).
   - Obrolan MASUK WILAYAH (zone()), obrolan SANTAI acak saat berjalan, obrolan BATTLE (awal, musuh setengah,
     musuh hampir kalah, HP Lloyd rendah, menang, kalah) yang menyesuaikan jenis monster / bos.
   - NPC ikut menanggapi party: NPC bergambar (e.d) menambah 1 kalimat untuk party saat pertama diajak bicara,
     lalu Lloyd/Lyra/Selena menyahut lewat gelembung. Ada juga komentar singkat setelah bicara dengan NPC.
   - Ada opsi "Obrolan party" di menu Pengaturan untuk mematikan semuanya.

   Kepribadian:  LYRA = blak-blakan, cerewet, ngeselin.  SELENA = tenang, lembut, penyayang.
                 LLOYD = konyol, kekanak-kanakan, mudah teralihkan, adu bacot dengan Lyra, salah tingkah di depan Selena,
                         tapi sesekali dewasa dan berani (dan asal ngomong).
   Kode pembicara dalam teks:  L = Lloyd, Y = Lyra, S = Selena.   Penanda dalam teks: {e} nama musuh, {z} nama wilayah.

   Atur kecepatan obrolan di blok PENGATURAN di bawah. */
(() => {
  if (typeof F === "undefined" || typeof PM === "undefined" || typeof zone !== "function" || typeof MN === "undefined") {
    console.warn("[obrolan_party] dilewati: F / PM / zone / MN tidak ditemukan");
    return;
  }

  /* ---------- PENGATURAN ---------- */
  /* ukuran gelembung (tidak terkait resolusi game). Bisa diganti pemain di Pengaturan > Party > Ukuran gelembung.
     Otomatis = lebih kecil di layar sempit (HP). Angka lebih kecil = gelembung lebih kecil. */
  const SIZES = { kecil: { sc: 0.34, w: 0.15 }, sedang: { sc: 0.46, w: 0.18 }, besar: { sc: 0.66, w: 0.22 } };
  const SIZE_KEY = "nq_obrolan_ukuran";
  const AMB_FIRST = [14000, 24000]; // obrolan santai pertama setelah masuk wilayah (ms)
  const AMB_MIN = 42000, // jeda obrolan santai berikutnya (ms)
    AMB_MAX = 85000;
  const ZONE_COOLDOWN = 15000; // jangan komentar wilayah kalau baru saja ada obrolan (ms)
  const BATTLE_GAP = 9000; // jeda minimal antar komentar di tengah battle (ms)
  const KEY = "nq_obrolan";
  let sizePref = "otomatis";
  try {
    sizePref = localStorage.getItem(SIZE_KEY) || "otomatis";
  } catch (e) {}
  const sizeNow = (w) => SIZES[sizePref] || (w < 1100 ? SIZES.kecil : SIZES.sedang);

  /* ---------- dasar ---------- */
  const NM = { L: "Lloyd", Y: "Lyra", S: "Selena" };
  let enabled = true;
  try {
    enabled = localStorage.getItem(KEY) !== "0";
  } catch (e) {}
  const on = () => enabled;
  const here = (c) => c === "L" || (!!F.duo && Array.isArray(PM) && PM.some((m) => m && m.n === NM[c]));
  const duoOn = () => here("Y") || here("S");
  const rnd = (a, b) => (Array.isArray(a) ? a[0] + Math.random() * (a[1] - a[0]) : a + Math.random() * (b - a));
  const X = (...a) => a.map((s) => [s[0], s.slice(3)]); // "L: teks" -> ["L","teks"]
  const bags = {};
  const pick = (key, arr) => {
    let b = bags[key];
    if (!b || !b.length) b = bags[key] = arr.map((_, i) => i).sort(() => Math.random() - 0.5);
    return arr[b.pop()];
  };
  const st = () => {
    if (!F.obr) F.obr = {};
    F.obr.z = F.obr.z || {};
    F.obr.n = F.obr.n || {};
    return F.obr;
  };
  const fill = (t, s) => t.replace(/\{(\w+)\}/g, (m, k) => (s && s[k]) || (k === "e" ? "monster itu" : k === "z" ? "tempat ini" : "")).replace(/Lloyd/g, HERO);

  /* ---------- gelembung: potret + ekor, mengikuti posisi karakter di layar (mode peta) ----------
     Di peta: gelembung kiri/kanan/atas kepala, ekornya menunjuk karakter yang bicara.
     Di battle / layar menang-kalah: gelembung ditumpuk di bagian atas kanvas (tanpa ekor). */
  const HERO = "Lyoid"; // nama hero yang tampil (semua kata "Lloyd" di teks diganti ini); ubah ke "Lloyd" kalau mau
  NM.L = HERO;
  const FACE = {
    L: "data:image/png;base64,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",
    Y: "data:image/png;base64,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",
    S: "data:image/png;base64,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",
  };
  const COL = { L: "#f0b84a", Y: "#ff5a8a", S: "#b890ff" }; // warna bingkai & nama
  const layer = document.createElement("div");
  layer.id = "obr";
  layer.setAttribute("aria-live", "polite");
  document.body.appendChild(layer);
  const css = document.createElement("style");
  css.textContent =
    `#obr{position:fixed;inset:0;z-index:60;pointer-events:none;overflow:hidden}` +
    `#obr .ob{position:absolute;left:0;top:0;display:flex;align-items:stretch;max-width:var(--mw,420px);font:600 var(--fs,16px)/1.3 "Pixelify Sans",system-ui,sans-serif;color:#f6f2ea;background:rgba(18,16,34,.95);border:2px solid var(--c,#9aa);border-radius:5px;box-shadow:0 2px 0 rgba(0,0,0,.5);opacity:0;transition:opacity .15s}` +
    `#obr .ob.in{opacity:1}` +
    `#obr .ob img{flex:none;width:2.5em;object-fit:cover;object-position:center top;image-rendering:pixelated;background:linear-gradient(#2c2848,#1b1830);border-right:2px solid var(--c,#9aa)}` +
    `#obr .ob .t{padding:.3em .6em .35em;display:flex;flex-direction:column;justify-content:center;min-width:0}` +
    `#obr .ob b{color:var(--c,#9aa);font-size:1.05em}` +
    `#obr .ob::after{content:"";position:absolute;width:0;height:0;display:none}` +
    `#obr .ob.pl::after{display:block;left:calc(-.75em - 2px);top:50%;margin-top:-.5em;border-top:.5em solid transparent;border-bottom:.5em solid transparent;border-right:.75em solid var(--c)}` +
    `#obr .ob.pr::after{display:block;right:calc(-.75em - 2px);top:50%;margin-top:-.5em;border-top:.5em solid transparent;border-bottom:.5em solid transparent;border-left:.75em solid var(--c)}` +
    `#obr .ob.pb::after{display:block;left:50%;bottom:calc(-.75em - 2px);margin-left:-.5em;border-left:.5em solid transparent;border-right:.5em solid transparent;border-top:.75em solid var(--c)}`;
  document.head.appendChild(css);

  const slots = {}; // kode pembicara -> { el, until, seq }
  let seq = 0,
    raf = 0,
    lastT = 0;
  const BATTLE_MODES = ["m", "r", "q", "w", "x"];
  const cvEl = () => document.getElementById("c");
  /* posisi kepala tiap anggota di layar (px viewport); meniru rumus kamera drawWorld di world.js */
  function anchors(r) {
    try {
      if (typeof MP === "undefined" || !MP[mp] || BATTLE_MODES.includes(mode)) return null;
      const cvv = cvEl(),
        k = SC * (r.width / cvv.width),
        fx = mv ? px + (mv.dx * mv.t) / 8 : px,
        fy = mv ? py + (mv.dy * mv.t) / 8 : py,
        mw = MP[mp].w,
        mh = MP[mp].h,
        CX = mw * 16 <= VW ? -Math.floor((VW - mw * 16) / 2) : clamp(Math.round(fx * 16 + 8 - VW / 2), 0, mw * 16 - VW),
        CY = mh * 16 + OY <= VH ? -Math.floor((VH - mh * 16 - OY) / 2) : clamp(Math.round(fy * 16 + OY + 8 - VH / 2), 0, mh * 16 + OY - VH),
        K = typeof NPC_WORLD_H === "number" ? NPC_WORLD_H : 32,
        pt = (x, y) => [r.left + (x * 16 + 8 - CX) * k, r.top + (y * 16 + OY + 16 - K - CY) * k];
      const A = { L: pt(fx, fy) };
      PM.forEach((m, i) => {
        const c = m && m.n === "Lyra" ? "Y" : m && m.n === "Selena" ? "S" : null;
        if (!c) return;
        const a = trail[i] || [px, py],
          b = i ? trail[i - 1] || [px, py] : [px, py],
          kk = mv ? mv.t / 8 : 0;
        A[c] = pt(a[0] + (b[0] - a[0]) * kk, a[1] + (b[1] - a[1]) * kk);
      });
      A.k = k * K; // tinggi sprite di layar (px)
      return A;
    } catch (e) {
      return null;
    }
  }
  function place() {
    const cv = cvEl();
    if (!cv) return;
    const r = cv.getBoundingClientRect(),
      sz = sizeNow(r.width),
      fs = Math.max(6.5, Math.min(20, (r.width / 1280) * 17 * sz.sc));
    layer.style.setProperty("--fs", fs + "px");
    layer.style.setProperty("--mw", Math.round(r.width * sz.w) + "px");
    const A = anchors(r),
      order = A ? ["L", "Y", "S"].filter((c) => A[c]).sort((a, b) => A[a][0] - A[b][0]) : [],
      list = Object.keys(slots).sort((a, b) => slots[a].seq - slots[b].seq);
    let dockY = r.top + r.height * 0.15;
    list.forEach((c) => {
      const el = slots[c].el,
        w = el.offsetWidth,
        h = el.offsetHeight,
        gap = fs * 1.1;
      let x,
        y,
        cls = "";
      if (A && A[c]) {
        const [ax, ay] = A[c],
          rank = order.indexOf(c),
          side = order.length < 2 ? "right" : rank === 0 ? "left" : rank === order.length - 1 ? "right" : "top",
          mid = ay + A.k * 0.14;
        if (side === "left") {
          x = ax - gap - w;
          y = mid - h / 2;
          cls = "pr";
        } else if (side === "right") {
          x = ax + gap;
          y = mid - h / 2;
          cls = "pl";
        } else {
          x = ax - w / 2;
          y = ay - h - fs * 2.6;
          cls = "pb";
        }
      } else {
        x = r.left + r.width / 2 - w / 2;
        y = dockY;
        dockY += h + 8;
      }
      x = Math.max(r.left + 4, Math.min(r.right - w - 4, x));
      y = Math.max(r.top + 4, Math.min(r.bottom - h - 4, y));
      el.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
      el.classList.remove("pl", "pr", "pb");
      if (cls) el.classList.add(cls);
    });
  }
  function frame() {
    raf = 0;
    const now = performance.now(),
      dt = now - lastT;
    lastT = now;
    if (!Object.keys(slots).length) return;
    const bl = blocked();
    layer.style.display = bl ? "none" : "";
    if (bl) Object.values(slots).forEach((s) => (s.until += dt)); // dialog terbuka: waktu tayang berhenti
    else {
      Object.keys(slots).forEach((c) => {
        const s = slots[c];
        if (now >= s.until) {
          const el = s.el;
          el.classList.remove("in");
          setTimeout(() => el.remove(), 200);
          delete slots[c];
        }
      });
      place();
    }
    if (Object.keys(slots).length) raf = requestAnimationFrame(frame);
  }
  const hide = () => {
    Object.keys(slots).forEach((c) => {
      slots[c].el.remove();
      delete slots[c];
    });
  };
  const show = (c, t, ms) => {
    if (slots[c]) slots[c].el.remove();
    const el = document.createElement("div");
    el.className = "ob";
    el.style.setProperty("--c", COL[c]);
    el.innerHTML = `<img alt="" src="${FACE[c]}"><div class="t"><b></b><span></span></div>`;
    el.querySelector("b").textContent = NM[c];
    el.querySelector("span").textContent = t;
    layer.appendChild(el);
    slots[c] = { el, until: performance.now() + ms, seq: ++seq };
    if (!raf) {
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    }
    place();
    requestAnimationFrame(() => el.classList.add("in"));
  };

  /* ---------- antrean obrolan ---------- */
  let q = [],
    playing = false,
    lastEnd = 0;
  const blocked = () => {
    try {
      if (document.hidden) return true;
      if (typeof busy !== "undefined" && busy) return true;
      const ov = document.getElementById("ov");
      return !!(ov && !ov.hidden);
    } catch (e) {
      return false;
    }
  };
  const dur = (t) => Math.max(2600, Math.min(7500, 2000 + t.length * 55)); // lama satu gelembung tampil
  function pump() {
    if (playing) return;
    const it = q.shift();
    if (!it) return;
    if (it.ok && !it.ok()) {
      pump();
      return;
    }
    playing = true;
    let i = 0;
    const next = () => {
      if (!on()) {
        playing = false;
        q = [];
        hide();
        return;
      }
      if (it.ok && !it.ok()) {
        playing = false;
        setTimeout(pump, 200);
        return;
      }
      if (i >= it.ls.length) {
        playing = false;
        lastEnd = performance.now();
        setTimeout(pump, 500);
        return;
      }
      if (blocked()) {
        setTimeout(next, 500);
        return;
      }
      const [c, t] = it.ls[i++];
      show(c, t, dur(t));
      setTimeout(next, Math.max(1500, dur(t) * 0.62)); // gelembung berikutnya muncul sebelum yang lama hilang (saling tumpang)
    };
    next();
  }
  /* prio: 0 santai (hanya kalau sepi), 1 kejadian, 2 NPC / menang / kalah */
  function talk(x, prio, sub, ok) {
    if (!on() || !duoOn() || !x) return false;
    const ls = x.filter((l) => here(l[0])).map((l) => [l[0], fill(l[1], sub)]);
    if (ls.length < 2) return false;
    if (prio > 0) q = q.filter((it) => it.p > 0);
    else if (q.length || playing) return false;
    q.push({ ls, p: prio, ok });
    pump();
    return true;
  }

  /* ===================================================================================
     ISI OBROLAN
     =================================================================================== */

  /* ---------- masuk wilayah (kunci = kode zone()) ---------- */
  const ZONE = {
    V: X(
      "L: Desa Satuan! Tempat semuanya dimulai. Aku masih ingat pertama kali ke sini, aku nyasar dua kali.",
      "Y: Dua kali, di desa yang jalan utamanya cuma satu. Itu bakat, sih.",
      "S: Desa yang tenang. Rasanya seperti pulang. Boleh kita mampir sebentar?",
      "L: B-boleh banget! Mampir berapa lama pun boleh! Kalau Selena yang minta.",
      "Y: Dan dia mulai lagi.",
    ),
    H: X(
      "Y: Hutan. Banyak pohon, banyak semak, banyak tempat sembunyi. Aku suka. Monsternya juga pasti suka.",
      "S: Udaranya sejuk. Dengarkan, ada burung bernyanyi di atas sana.",
      "L: Hutan Pecahan... pecahan apanya, sih? Pohonnya yang pecah? Apa ada yang lagi diet?",
      "Y: Itu pecahan matematika, Lloyd. Bukan pecahan kaca.",
      "L: Aku tahu itu! Cuma ngetes kalian.",
      "S: Tentu saja, Lloyd.",
    ),
    K: X(
      "L: Kota! Banyak toko, banyak makanan, banyak—",
      "Y: Jangan habiskan uang tim buat jajan.",
      "L: Siapa bilang aku mau jajan?! Aku cuma mau... melihat-lihat jajanan.",
      "S: Kita isi perbekalan dulu, ya. Satu camilan saja boleh, Lloyd.",
      "L: Selena baik banget... Lyra, lihat? Beda sama kamu.",
      "Y: Aku bukan ibumu. Dia juga bukan.",
    ),
    T: X(
      "S: Desanya sepi sekali. Rasanya semua orang sedang menahan napas.",
      "Y: Sunyi itu bagus. Tapi sunyi yang kayak gini, aku nggak suka.",
      "L: Wah, serem ya? Nggak, aku nggak takut! Aku jalan dekat Selena karena... jalannya sempit.",
      "Y: Jalannya selebar lapangan, Lloyd.",
    ),
    D: X(
      "Y: Dungeon. Gelap, lembap, penuh jebakan. Jalan di belakangku, Lloyd, jangan sentuh apa pun.",
      "L: Aku nggak bakal—eh, itu tombol apa?",
      "Y: LLOYD.",
      "S: Aku akan menerangi jalan kita. Tetap dekat, ya.",
      "L: Dekat... Selena... siap! Aku di sebelahmu! Dekat banget!",
      "Y: Astaga.",
    ),
    I: X(
      "L: Rumah Guild! Aroma sup dan kertas misi lama. Ini baru namanya rumah!",
      "Y: Itu aroma keringat petualang, bocah.",
      "S: Dulu aku dan Lyra sering duduk di pojok sana, menghitung uang receh buat makan malam.",
      "Y: Jangan buka masa lalu, Selena.",
      "L: Hehe, Lyra pernah miskin! Aku mau dengar ceritanya!",
      "Y: Aku bisa melempar belati ke arahmu dalam tiga detik.",
    ),
    O: X(
      "Y: Dataran terbuka lagi. Nggak ada tembok, nggak ada atap, cuma rumput dan Lloyd yang bakal nyasar.",
      "L: Hei! Sense of direction-ku itu... eh... unik!",
      "S: Unik itu cara sopan bilang 'sering muter-muter', ya, Lloyd. Tapi tenang, kita jalan bareng kok.",
      "L: A-ayo jalan! Cuaca hari ini bagus banget, ya! Banget!",
      "Y: Mukamu merah. Cuaca bukan penyebabnya.",
    ),
    F: X(
      "Y: Akar-akar ini bakal bikin orang tersandung. Terutama orang yang jalan sambil lihat langit, Lloyd.",
      "L: Aku nggak lihat langit, aku lihat—aduh! Akarnya salah tempat!",
      "S: Sini, kubantu berdiri. Pelan-pelan, ya.",
      "L: T-terima kasih... akarnya memang jahat.",
    ),
    P: X(
      "L: Panas! Pasirnya masuk sepatu! Kenapa pasirnya ada di mana-mana?!",
      "Y: Itu namanya padang pasir.",
      "S: Minumlah dulu, Lloyd. Airku cukup untuk kita bertiga.",
      "L: Selena... kamu penyelamat hidupku.",
      "Y: Kamu baru jalan lima menit.",
    ),
    R: X(
      "S: Kota kerajaan... megah sekali. Lihat menara-menaranya.",
      "L: Wah, besar! Banyak orang! Banyak penjaga. Aku nggak bikin masalah, kan?",
      "Y: Belum. Bedanya kita, aku tahu batas. Kamu nggak tahu ada batas.",
      "L: Itu fitnah!",
    ),
    N: X(
      "Y: Lantai marmer, lampu kristal, penjaga di mana-mana. Jangan bicara kalau nggak ditanya, Lloyd.",
      "L: Aku? Aku orangnya sopan banget!",
      "S: Selama kita jujur dan santun, Raja pasti mau mendengar. Tarik napas dulu, ya.",
      "L: ...Kalau aku salah ngomong, Selena yang bantu jelasin, ya?",
      "Y: Kalau kamu salah ngomong, aku pura-pura nggak kenal.",
    ),
    W: X(
      "L: Padang rumput luas! Cocok buat lari! Atau tiduran! Atau—",
      "Y: Atau jadi sasaran monster yang nggak kelihatan. Waspada.",
      "S: Anginnya lembut. Sayang kalau tidak dinikmati sebentar.",
    ),
    E: X(
      "Y: Hutan ini bikin merinding. Setiap jalan kelihatan sama.",
      "L: Hutan Peluang... jadi ini hutan keberuntungan? Aku pasti beruntung, kan, Selena?",
      "S: Keberuntungan datang pada yang waspada, Lloyd. Tapi aku yakin kamu baik-baik saja.",
      "L: Dia yakin! Dengar itu, Lyra? DIA YAKIN!",
      "Y: Aku dengar. Seluruh hutan dengar.",
    ),
    X: X(
      "S: Kota Himpunan... ramai tapi tertata rapi. Pasti banyak kelompok berkumpul di sini.",
      "L: Himpunan! Berarti kota buat orang-orang yang suka ngumpul? Kita cocok, dong!",
      "Y: Himpunan itu soal kelompok, bukan soal nongkrong.",
      "L: Sama aja! Kelompok yang nongkrong!",
    ),
    U: X(
      "L: Brrr! D-dingin! Salju! Lihat, aku bisa bikin malaikat salju!",
      "Y: Jangan berbaring, nanti beku. Aku nggak mau seret kamu.",
      "S: Pakai syal ini, Lloyd. Badanmu sudah menggigil.",
      "L: Syal... Selena... hangat... wangi bunga... eh, maksudku makasih!",
      "Y: Awas ingusmu.",
    ),
    B: X(
      "L: Wah... dalam banget. Kalau jatuh, kapan sampainya, ya?",
      "Y: Nggak sampai-sampai. Namanya juga 'tak hingga'. Jenius.",
      "S: Jangan terlalu dekat tepinya, ya. Aku takut membayangkannya.",
      "L: Selena takut? Tenang! Aku di sini! Aku ikut gemetar, tapi aku di sini!",
    ),
    Q: X(
      "Y: Panas, bau belerang, tanah retak. Selamat datang di neraka, tempat Lloyd bakal merengek.",
      "L: Aku nggak merengek! Aku mengungkapkan ketidaknyamanan secara terbuka!",
      "S: Tetap rapat dan hati-hati. Dari sini, setiap langkah bisa jadi yang menentukan.",
    ),
    Z: X(
      "S: Jadi ini kastilnya... Auranya berat sekali. Tarik napas dulu, semuanya.",
      "Y: Dari sini nggak ada jalan pulang. Tapi aku nggak pernah suka pulang dengan tangan kosong.",
      "L: Kita pasti bisa. Kita bertiga. ...Dan aku janji nggak ngomong asal.",
      "Y: Janji yang paling nggak bisa dipercaya.",
      "L: Kali ini beneran! ...Mungkin.",
    ),
    S: X(
      "L: Lautan! Ombak! Aku mau jadi bajak laut!",
      "Y: Kamu mabuk di perahu sungai.",
      "L: Itu karena perahunya goyang!",
      "Y: Itu namanya perahu.",
      "S: Kalau mual, bilang saja, ya. Aku punya obat penenang perut.",
    ),
    G: X(
      "Y: Bau ikan, tali tambang, pelaut yang ribut. Aku suka tempat sibuk begini. Gampang menghilang.",
      "L: Aku mau ikan bakar! Ikan bakar!",
      "S: Setelah mengurus perbekalan, ya. Satu tusuk untuk satu orang.",
      "L: Satu?! ...Oke. Karena Selena yang bilang.",
    ),
    M: X(
      "S: Pulau kecil yang tenang. Cocok untuk istirahat sebentar.",
      "L: Pantai! Pasir! Kelapa! Boleh berenang?",
      "Y: Ada kraken di sekitar sini, bocah.",
      "L: Aku berenangnya pelan-pelan. Dengan sopan.",
    ),
    C: X(
      "Y: Pesisirnya berkabut. Jarak pandang jelek. Bagus buat sembunyi, jelek buat berjaga.",
      "L: Aku mencium bau kepiting bakar! Eh, bukan, itu sepatuku.",
      "S: Lloyd... ganti kaus kaki kalau ada waktu, ya.",
    ),
    L: X(
      "S: Kota di tepi laut... indah sekali. Lihat kapal-kapal itu.",
      "L: Kota ini wangi makanan! Kerajaan tepi laut pasti punya seafood kelas raja!",
      "Y: Dompet kita, Lloyd.",
      "L: Dompet kita bisa menunggu! Perutku nggak bisa!",
    ),
    Y: X(
      "Y: Istana lagi. Aku hafal prosedurnya: diam, tunduk, bilang 'Yang Mulia'. Lloyd, itu bagianmu juga.",
      "L: 'Yang Mulia'... 'Yang Mulia'... Aku latihan dulu. Yang Mulia, bolehkah hamba makan?",
      "S: Lloyd, tolong... jangan di depan raja.",
    ),
    NE: X(
      "S: Hutan ini hidup. Mana mengalir di setiap pohon. Indah sekali.",
      "L: Elf! Beneran ada elf! Telinganya runcing! Aku mau pegang!",
      "Y: Pegang telinga elf, urusan jadi panjang. Pilih dengan bijak.",
    ),
    NG: X(
      "Y: Udara tipis, tebing curam, bau belerang di mana-mana. Naga pasti dekat.",
      "L: Naga! Aku mau naik! Aku mau ngobrol sama naga! Aku mau—",
      "S: Lloyd, tolong. Naga bukan hewan peliharaan.",
    ),
    NB: X(
      "L: Hutan penuh telinga dan ekor! Aku mau lihat manusia setengah hewan!",
      "Y: Kamu kedengaran kayak pengintai mesum.",
      "L: Aku penasaran yang sehat!",
      "S: Mereka bangga dengan jati diri mereka. Kita hormati, ya.",
    ),
    EK: X(
      "S: Kerajaan elf... bangunannya menyatu dengan pohon. Aku belum pernah melihat yang seindah ini.",
      "Y: Dan penduduknya cantik-cantik. Lloyd, jangan ngiler.",
      "L: Aku? Nggak! Selena jauh lebih—eh! Maksudku, aku nggak lihat siapa-siapa!",
      "S: ...Terima kasih, Lloyd.",
      "Y: Ya ampun, dia keceplosan.",
    ),
    DK: X(
      "Y: Panas dan penuh baja. Kayaknya aku bakal betah.",
      "L: Mereka bersisik! Keren banget! Boleh minta satu sisik?",
      "S: Jangan mencabut sisik siapa pun, Lloyd.",
    ),
    BK: X(
      "S: Kerajaannya ramai dan hangat. Semua orang kelihatan akrab.",
      "L: Mereka punya ekor, Selena! Ekor! Lyra, kamu mau punya ekor?",
      "Y: Kalau aku punya ekor, aku pakai buat menyabet kepalamu.",
    ),
    AN: X(
      "L: Kita di atas awan! Di atas AWAN! Aku bisa lompat dan—",
      "Y: Jatuh. Itu yang bakal terjadi.",
      "S: Pemandangannya luar biasa. Dunia kelihatan begitu kecil dari sini...",
    ),
    AQ: X(
      "L: Kita bernapas di bawah laut! Ikan lewat! Itu hiu, kan? Hiu?",
      "Y: Jangan tunjuk-tunjuk.",
      "S: Gelembung cahaya itu cantik. Seperti bintang yang tenggelam.",
      "L: Selena yang cantik... ehm, maksudku bintang-bintangnya cantik.",
      "Y: Kamu ketahuan lagi.",
    ),
  };
  /* wilayah yang belum punya obrolan khusus */
  const NEWPLACE = [
    X("L: {z}! Tempat baru! Aku bertaruh ada makanan enak di sini.", "Y: Kamu selalu bertaruh soal makanan.", "S: Mari kita jelajahi pelan-pelan dan saling menjaga."),
    X("Y: {z}. Tetap rapat dan buka mata. Tempat baru itu selalu ada kejutannya.", "L: Kejutan bagus, kan?", "Y: Biasanya nggak."),
    X("S: Jadi ini {z}. Rasanya berbeda dari tempat-tempat sebelumnya.", "L: Berbeda tapi seru! Aku siap!", "Y: Kamu siap sejak kapan?"),
  ];

  /* ---------- obrolan santai khusus wilayah ---------- */
  const ZAMB = {
    O: [
      X("L: Dataran ini luas banget. Aku bisa lari dari ujung ke ujung!", "Y: Dan nyasar di tengah.", "L: Itu bagian dari petualangan!"),
      X("S: Rumputnya bergoyang indah. Sayang kalau kita hanya lewat begitu saja.", "L: Kita bisa duduk! Kita bisa tidur! Kita bisa—", "Y: Kita bisa lanjut jalan."),
    ],
    H: [X("L: Ada suara aneh dari semak itu! Monster?!", "Y: Tupai.", "L: Tupai monster!", "S: Tupai kecil yang ketakutan, Lloyd.")],
    D: [
      X("L: Aku dengar sesuatu menetes...", "Y: Air. Tenang.", "L: Aku tenang! Cuma tadi... melompat. Secara strategis."),
      X("S: Cahaya di sini redup sekali. Pegang tanganku kalau kamu mau, Lloyd.", "L: Pegang... tangan... Selena... aku... a-aku baik-baik saja!", "Y: Dia mati kutu."),
    ],
    U: [X("L: Hidungku beku! Hidungku masih ada nggak?!", "Y: Masih. Sayangnya.", "S: Lloyd, pakai penutup telinga. Jangan sampai sakit.")],
    P: [X("L: Aku melihat air! Oase! Oase!", "Y: Fatamorgana.", "L: ...Aku tahu. Aku cuma memastikan.")],
    S: [X("L: Ikan lompat! Ikan lompat! Aku mau tangkap!", "Y: Kamu jatuh ke laut, aku nggak nolong.", "S: Aku akan menolongmu, Lloyd. Tapi tolong jangan jatuh.")],
    Q: [X("Y: Tanah ini panas banget sampai sol sepatuku mau meleleh.", "L: Aku bisa panggang roti di sini!", "S: Tolong jangan mencoba, Lloyd.")],
    Z: [X("L: Kalau kita menang di sini... kita jadi pahlawan, kan?", "S: Kita akan jadi orang yang selamat. Itu sudah cukup bagiku.", "Y: Pahlawan atau bukan, aku mau bayaran.")],
  };

  /* ---------- obrolan santai umum ---------- */
  const AMB = [
    X("L: Aku lapar.", "Y: Kamu baru makan.", "L: Itu tadi! Sekarang beda!", "S: Aku punya roti. Kita bagi dua, ya.", "L: Selena... roti terenak sedunia...", "Y: Itu roti kering dari kemarin."),
    X("S: Aku jadi ingat Mr. Alan. Dia pernah bilang, sihir bukan soal kekuatan, tapi aliran mana.", "L: Dia juga bilang aku jangan eksperimen sendirian. Aku nggak menurut.", "S: Dan kamu hampir membakar kandang ayam.", "L: Ayamnya selamat! ...Sebagian.", "Y: Aku nggak mau tahu 'sebagian'-nya."),
    X("Y: Lloyd, dash petirmu itu. Kalau berhenti di titik yang salah, kamu jadi sasaran empuk.", "L: Aku selalu berhenti di titik yang benar!", "Y: Kemarin kamu berhenti tepat di depan musuh.", "L: Itu... strategi mendekat.", "S: Lyra benar. Tapi aku suka caramu mencoba hal baru, Lloyd.", "L: ...Lyra, ajarin aku lagi. Pelan-pelan. Selena bilang bagus soalnya.", "Y: Motivasimu menyedihkan. Tapi oke, aku ajarin."),
    X("L: Hari ini aku mau pakai pedang. Eh, busur? Eh, sihir? Gimana ya...", "Y: Pilih satu. Musuhnya nggak nunggu.", "L: Aku pilih ketiganya!", "S: Itu memang kekuatanmu, Lloyd. Tapi pilih yang pas untuk situasinya, ya."),
    X("Y: Selena, ingat waktu kita pertama lawan slime dan kamu pingsan?", "S: Aku tidak pingsan. Aku... beristirahat sebentar.", "Y: Di tengah pertarungan.", "L: Hahaha! Selena pernah pingsan!", "S: Lloyd...", "L: ...Maaf. Aku nggak ketawa. Aku batuk."),
    X("L: Eh, lihat! Kupu-kupu! Warnanya biru!", "Y: Fokus.", "L: Tapi itu biru banget!", "Y: Fokus, atau kulempar belati ke dekat kakimu."),
    X("S: Kamu kelihatan lelah, Lloyd. Mau istirahat sebentar?", "L: A-aku nggak lelah! Cuma tadi kena angin.", "Y: Angin yang bikin mukamu merah?", "L: ANGIN PANAS."),
    X("L: Aku punya lelucon baru. Kenapa slime nggak pernah menang debat?", "Y: Nggak mau tahu.", "L: Karena argumennya meleleh!", "Y: ...", "S: Hehe, lucu kok, Lloyd.", "L: DENGAR ITU? LUCU!", "Y: Selena itu kasihan, bukan geli."),
    X("Y: Dompet kita tipis. Kita butuh misi yang bayarannya lumayan.", "L: Atau kita jual jubah Lyra?", "Y: Aku jual kamu di pasar. Harganya nggak tinggi.", "S: Kita cari misi lagi, ya. Pasti cukup, kok."),
    X("L: Aku ngantuk. Istirahat dong.", "Y: Kita baru jalan.", "L: Tapi kakiku mau protes!", "S: Kalau Lloyd lelah, kita rehat di tempat aman. Tidak apa-apa."),
    X("L: Selena, sihir cahaya sama gelapmu... kok bisa nggak bentrok?", "S: Cahaya dan kegelapan bukan musuh, Lloyd. Keduanya alat. Tergantung kebutuhan.", "L: Wah... dalam. Selena pintar banget...", "Y: Itu ajaran Mr. Alan. Kamu juga diajari, kan?", "L: ...Aku ketiduran waktu itu."),
    X("Y: Aku jauh lebih cepat dari kamu, Lloyd.", "L: Dash petirku juga cepat!", "Y: Cepat nabrak pohon.", "L: Itu... pohonnya yang tiba-tiba ada!"),
    X("S: Kalian berdua, tolong jangan memaksakan diri. Kalau ada yang terluka, bilang padaku, ya.", "Y: Aku nggak apa-apa. Lloyd yang suka sok kuat.", "L: Aku nggak sok! Aku kuat! ...Kecuali bagian lututku."),
    X("S: Langitnya cerah sekali hari ini.", "L: Iya, cerah kayak... senyum Selena.", "Y: ...", "Y: Bagus, Lloyd. Itu puisi paling memalukan yang pernah kudengar.", "L: ITU PUJIAN TULUS!"),
    X("L: Kita naik rank kapan, ya? Aku mau jadi Rank SS! Terkenal! Dikejar fans!", "Y: Dikejar penagih utang, lebih mungkin.", "S: Pelan-pelan saja. Yang penting kita aman dan saling menjaga."),
    X("L: Ayo tebak-tebakan! Aku mikirin satu hewan. Dia berkaki empat, berbulu, dan...", "Y: Anjing.", "L: BELUM SELESAI!", "Y: Anjing.", "L: ...Iya, anjing."),
    X("L: Lyra, tadi kamu nyuruh Selena duduk di tempat aman, ya? Kamu perhatian!", "Y: Itu strategi. Penyihir yang cedera nggak berguna.", "S: Terima kasih, Lyra. Aku tahu kamu peduli.", "Y: Jangan salah paham."),
    X("L: ...Kalian tahu, kadang aku mikir. Dunia ini luas. Dan kita masih kecil.", "Y: Wah, Lloyd lagi filosofis.", "L: Aku serius! Tapi selama kita bertiga, aku yakin kita bisa lewatin apa pun.", "S: ...Iya. Aku juga yakin begitu.", "Y: ...Cih. Jangan bikin aku jadi sentimental."),
    X("L: Mr. Alan dulu bilang, 'Mana itu seperti uang, jangan dihabiskan buat hal bodoh.'", "S: Dan kamu menghabiskannya untuk membuat bola api berbentuk bebek.", "L: Itu bebek yang bagus!", "Y: Aku mulai paham kenapa gurumu pusing."),
    X("S: Lyra, kamu masih ingat misi pertama kita? Hujan deras, kita basah kuyup, dan kamu mengomel sepanjang jalan.", "Y: Itu kenyataan. Kamu yang memaksa lanjut padahal licin.", "S: Dan kita berhasil, kan?", "Y: ...Iya, berhasil.", "L: Aku mau ikut cerita! Aku mau misi pertama bareng kalian juga!", "Y: Kamu telat. Itu hak istimewa kami."),
    X("Y: Kalau malam ini Lloyd yang masak, aku makan di luar.", "L: Masakanku enak!", "S: Aku ingat kamu pernah memasak sup... yang warnanya biru.", "L: Itu bumbu spesial!", "Y: Itu jamur yang salah."),
    X("L: La la la~ ♪", "Y: Berhenti.", "L: Aku bahkan belum selesai nada pertama!", "S: Suaramu... bersemangat, Lloyd.", "L: DENGAR, 'bersemangat'!", "Y: Itu kata sopan buat 'berisik'."),
    X("L: Kalau ada monster gede, aku maju paling depan!", "Y: Bagus, aku di belakang.", "L: ...Eh, Lyra juga di depan dong.", "Y: Aku assassin. Aku di samping. Atau belakang. Atau atas."),
    X("S: Aku suka mengumpulkan bunga liar untuk dikeringkan. Kalau ada yang menarik, kabari aku, ya.", "L: Aku carikan yang paling cantik! Lihat, ini! Bunga! ...Atau rumput?", "Y: Itu gulma.", "S: Terima kasih, Lloyd. Akan kusimpan.", "L: Dia simpan... dia simpan gulmaku..."),
    X("Y: Teleportasi belatiku butuh hitungan jarak yang pas. Bukan asal lempar.", "L: Aku bisa belajar! Lempar belati, terus—ZAP—pindah!", "Y: Dan kamu bakal mendarat di semak berduri.", "L: ...Aku latihan pakai bola dulu."),
    X("S: Lloyd, dash petirmu mengingatkanku pada cara Mr. Alan mengajar. Cepat, tapi tetap terkendali.", "L: Selena memuji aku... AKU...", "Y: Kamu 'cepat', bukan 'terkendali'. Jangan geer.", "L: Terkendali sebagian!"),
  ];

  /* ---------- battle: umum ---------- */
  const B_INTRO = [
    X("L: Itu {e}! Aku maju duluan!", "Y: Kamu selalu maju duluan dan selalu minta tolong belakangan.", "S: Aku siap membantu. Hati-hati, Lloyd."),
    X("Y: {e}. Cepat selesaikan, aku nggak mau berlama-lama.", "L: Santai aja, Lyra! Ini mah gampang!", "S: Jangan meremehkan lawan, ya."),
    X("S: Ada {e} di depan. Tetap rapat, ya.", "L: Selena di belakangku, aman!", "Y: Selena justru yang bakal menjagamu."),
    X("L: Siapa yang takut sama {e}? Bukan aku!", "Y: Lututmu gemetar.", "L: Itu... angin!"),
    X("Y: Aku ambil sisi kiri. Lloyd, sisi kanan. Selena, dukung dari belakang.", "L: Siap, komandan!", "Y: Jangan panggil aku komandan."),
    X("L: Ayo! Tiga petualang melawan {e}! Kedengarannya keren banget!", "S: Dan kedengarannya akan berakhir baik. Mari kita buktikan."),
  ];
  const B_MID = [
    X("Y: Sudah setengah jalan! Jangan lengah!", "L: Aku nggak lengah! Aku lagi merencanakan sesuatu!"),
    X("S: Dia mulai melemah. Terus tekan, tapi hati-hati."),
    X("L: Rasain ini, {e}!", "Y: Jangan teriak-teriak. Kamu bikin musuh tahu posisi kita."),
    X("L: Selena, lihat aku tadi? Keren, kan?!", "S: Fokus dulu, Lloyd... tapi iya, tadi bagus.", "L: DIA BILANG BAGUS!"),
    X("Y: Sedikit lagi. Jangan sampai dia kabur.", "L: Tenang, aku punya jurus rahasia!", "Y: Kamu selalu bilang begitu dan nggak pernah ada."),
  ];
  const B_NEAR = [
    X("Y: Habisi dia, Lloyd!", "L: Siap! Kuserahkan pada... aku!"),
    X("S: Satu dorongan terakhir! Kamu pasti bisa!"),
    X("L: Satu serangan lagi! Ayo, Lyra!", "Y: Aku sudah selesai dari tadi. Kamu yang lamban."),
    X("Y: Dia goyah. Habisi sekarang atau dia pulih.", "L: Jangan atur-atur! Aku mau habisi!"),
  ];
  const B_HURT = [
    X("S: Lloyd, lukamu parah! Mundur sebentar, aku coba memulihkanmu!", "L: Aku nggak apa-apa! (nggak apa-apa!)", "Y: Jelas-jelas apa-apa."),
    X("Y: Heh, bocah, kalau kamu tumbang aku nggak mau seret.", "L: Aku nggak mau tumbang... aku belum sempat ngajak Selena makan.", "Y: ...Apa?", "S: Hah?", "L: BUKAN APA-APA!"),
    X("S: Tolong jangan memaksakan diri, Lloyd. Minum ramuan dulu, ya.", "L: Selena khawatir... jadi aku harus bertahan!"),
    X("Y: Lloyd! Mundur!", "L: Nggak! Aku masih... aduh.", "S: Bertahanlah, aku di sini."),
  ];
  const B_WIN = [
    X("L: Menang! Hahaha! Tiga lawan satu!", "Y: Itu memang bagiannya.", "S: Syukurlah semuanya selamat."),
    X("Y: Selesai. Bagus. Ayo lanjut.", "L: Nggak ada selebrasi?!", "Y: Nggak."),
    X("L: Aku yang menang! Aku!", "Y: Aku yang memotong separuh nyawanya.", "L: Tapi aku yang bergaya!"),
    X("S: Kalian berdua hebat. Aku bangga.", "L: ...Selena bangga padaku...", "Y: Padaku juga, kan, Selena?", "S: Tentu, pada kalian berdua."),
    X("L: {e} sudah kalah! Siapa selanjutnya?!", "Y: Kamu istirahat dulu. Ngos-ngosan gitu."),
    X("S: Syukurlah tidak ada yang terluka parah. Tetap hati-hati, ya."),
    X("L: Pose kemenangan! *pose*", "Y: Jangan bergaya, ada yang memperhatikan.", "L: Justru itu tujuannya!"),
    X("Y: Lumayan. Kerja sama kita makin rapi.", "L: Wah, Lyra muji!", "Y: Aku cuma bilang 'lumayan'.", "S: Itu pujian terbesar dari Lyra, Lloyd."),
    X("L: Loot! Ada yang jatuh nggak?", "Y: Kamu masih mikirin loot?", "S: Kita periksa dulu, ya."),
    X("L: Kita tim paling keren se-Numeria!", "Y: Setuju. Tapi bukan karena kamu."),
  ];
  const B_WIN_HURT = [
    X("S: Lloyd, duduk. Biar kuobati.", "L: A-aku bisa sendiri—aduh!", "Y: Dia pasrah. Bagus."),
    X("Y: Kamu terlalu nekat. Lain kali jangan pamer.", "L: Aku nggak pamer! Aku mengamankan tim!", "S: Terima kasih, Lloyd. Tapi lain kali jangan sampai begini, ya."),
  ];
  const B_LOSE = [
    X("S: Lloyd! Kamu tidak apa-apa? Tolong bangun...", "L: ...Aku nggak kalah. Aku tiduran strategis.", "Y: Kalau ketawa nggak sakit, aku ketawa."),
    X("Y: Kita salah hitung. Lain kali pakai otak, Lloyd.", "L: Aku pakai! Ototnya aja yang nggak cukup."),
    X("S: Tidak apa-apa. Kita bisa coba lagi. Kalah bukan akhir segalanya."),
    X("L: Aduh... sakit... Selena, boleh pegangin tanganku?", "Y: Berdiri sendiri, bocah.", "S: Sini, aku bantu."),
  ];

  /* ---------- battle: per jenis monster (cocokkan nama / kunci sprite, huruf kecil) ---------- */
  const CAT = [
    [/slime|lendir/, X("L: Slime! Gampang! Tusuk sampai meletus!", "Y: Jangan tusuk sembarangan, kena lendirnya nanti.", "L: Nggak masalah— aduh, kena! Bau!", "S: Nanti kubersihkan dengan sihir, ya, Lloyd.")],
    [/yeti|salju|snow/, X("L: Yeti! Aku mau foto!", "Y: Nggak ada kamera, bocah.", "S: Bulunya tebal sekali. Api mungkin jadi kelemahannya.")],
    [/serigala|wolf|hound|fenrix/, X("Y: Serigala. Mereka berburu berkelompok. Jangan terpisah.", "S: Mata mereka kelaparan... kasihan, tapi kita juga harus bertahan.", "L: Aku suka anjing!", "Y: Itu serigala.", "L: Serigala yang kayak anjing!")],
    [/kobra|cobra|ular|snake/, X("Y: Ular. Berbisa. Jangan kena gigitannya.", "L: Ular itu licin dan menjijikkan!", "S: Mereka hanya membela diri, Lloyd. Tapi tetap, hati-hati.")],
    [/mumi|mummy/, X("L: Mumi?! Aku nggak suka yang bergerak padahal nggak hidup!", "Y: Kamu takut mayat?", "L: Aku... waspada terhadap mayat.", "S: Tenang, Lloyd. Cahaya bisa menenangkan mereka.")],
    [/kalajengking|scorpion/, X("Y: Ekornya beracun. Hindari dari belakang.", "L: Kalajengking! Aku pernah lihat di buku!", "Y: Di buku, mereka nggak ngejar kamu.")],
    [/bandit|bajak|perampok/, X("Y: Bandit. Akhirnya, sesuatu yang kukenal. Biar aku yang urus.", "L: Kamu kelihatan senang banget, Lyra.", "Y: Mereka mengambil yang bukan hak mereka. Aku benci itu.", "S: Lyra, tolong jangan berlebihan, ya.")],
    [/jamur|shroom|mushroom/, X("L: Jamur raksasa! Bisa dimakan nggak?", "Y: Jangan. Ingat sup biru.", "L: ...Iya, iya.", "S: Jamur ini beracun, Lloyd. Jangan dimakan, ya.")],
    [/rubah|fox/, X("S: Rubah... cantik sekali. Sayang kita harus bertarung.", "Y: Cantik tapi berbisa. Jangan terlena.", "L: Aku nggak terlena! Aku terpesona... sedikit.")],
    [/golem/, X("L: Golem! Besar! Keras! Aku suka!", "Y: Pukulanmu nggak bakal tembus. Tunggu celah.", "S: Mari kita cari titik lemahnya bersama.")],
    [/naga|dragon|wyvern|drakon/, X("Y: Naga. Naga beneran. Kita punya masalah besar.", "L: Atau peluang besar! Aku mau naik!", "S: Ini bukan saatnya bercanda, Lloyd. Napasnya bisa membakar kita.")],
    [/kraken|leviathan|hiu|shark|kepiting|crab|belut|eel|ubur|jelly|ikan|lanternfish/, X("L: Monster laut! Seperti di dongeng!", "Y: Dongeng yang biasanya berakhir buruk buat pelautnya.", "S: Hati-hati dengan tentakel dan capitnya. Jangan terlalu dekat.")],
    [/iblis|demon|imp|gargoyle|garg|dknight|fallen|lava/, X("Y: Iblis. Mereka licik. Jangan percaya kata-katanya.", "L: Aku nggak bakal tertipu!", "Y: Kamu pernah beli 'peta harta karun' seharga lima koin.", "L: ITU PETA ASLI!", "S: Fokus, kalian.")],
    [/\bent\b|pohon|akar/, X("L: Pohon yang bisa jalan! Aku nggak mau menebang... tapi mau.", "Y: Dia bakal menebangmu duluan.", "S: Mereka menjaga hutan. Kita hanya perlu menenangkan mereka.")],
    [/beruang|bear|harimau|tiger/, X("S: Binatang buas. Kuat sekali.", "L: Beruang! Madu!", "Y: Dia bukan yang kamu bayangkan.")],
    [/burung|elang|eagle|owl|bird|angin|wind|pixie|cloud/, X("Y: Dia gesit. Aku tahu cara menghadapinya. Lloyd, jangan melompat sembarangan.", "L: Aku nggak melompat! Aku mengambil ancang-ancang!")],
    [/hantu|spirit|patung|seraph|statue|petir|thunder|storm/, X("S: Auranya... bukan monster biasa. Tetap waspada.", "Y: Aku nggak suka yang nggak bisa kusentuh.", "L: Aku juga! Tapi aku berani! ...Sedikit.")],
  ];

  /* ---------- battle: bos ---------- */
  const BOSS = [
    [/kraken/, X("L: Itu... itu kraken! Besarnya sebesar rumah!", "Y: Sebesar kapal, bocah.", "S: Semuanya, tetap bersama. Jangan sampai terseret ke laut.")],
    [/frostgiant|raksasa es/, X("Y: Raksasa es menutup celah. Nggak ada jalan lain.", "L: Kalau kita menang, kita jadi legenda!", "S: Kalau kita menang, kita masih hidup. Itu sudah cukup.")],
    [/dking|zerath|raja iblis|demon king/, X("S: Kegelapan sepekat ini... aku bisa merasakannya sampai ke tulang.", "Y: Ini dia. Yang terakhir.", "L: Kita sudah sejauh ini. Selena, Lyra... jangan ada yang gugur, ya.", "Y: ...Itu Lloyd yang ngomong? Aku kaget.", "S: Kita akan baik-baik saja. Bersama.")],
    [/leviathan/, X("Y: Leviathan. Makhluk dari cerita pelaut tua.", "L: Kalau ini mimpi, bangunin aku sekarang!", "S: Ini nyata, Lloyd. Karena itu kita harus saling menjaga.")],
  ];
  const BOSS_GEN = [
    X("Y: Auranya beda. Ini bukan monster biasa.", "L: Bos! Akhirnya bos!", "S: Tolong jaga formasi. Jangan ada yang terpisah."),
    X("S: Tarik napas, semuanya. Ini akan berat.", "L: Kalau berat, aku angkat! Kan aku kuat!", "Y: Bukan 'berat' yang itu, Lloyd."),
  ];

  /* ---------- NPC: kalimat NPC ke party + sahutan party (hanya pertama kali, kalau Lyra & Selena ikut) ---------- */
  const NPC_ROLE = [
    [/ksatria|prajurit|gerbang|penjaga|pdekar|veteran/, [
      { npc: "Tiga petualang, ya? Jaga ketertiban selama berada di sini.", react: X("Y: Ketertiban itu hal yang paling nggak cocok buat Lloyd.", "L: Aku tertib! Aku selalu tertib!", "S: Kami akan berhati-hati, Pak.") },
      { npc: "Nona berjubah ungu itu penyihir, ya? Jarang kulihat penyihir seanggun itu.", react: X("S: Eh... saya? Terima kasih.", "L: Dia memang... bersinar...", "Y: Lloyd, tutup mulutmu.") },
    ]],
    [/pedagang|dagang|toko|penjual/, [
      { npc: "Kalian bertiga cocok jadi pelanggan setia. Silakan lihat-lihat!", react: X("Y: Lloyd, jangan beli apa pun yang bercahaya.", "L: Tapi yang bercahaya itu keren!", "S: Kita beli yang perlu saja, ya.") },
      { npc: "Nona penyihir itu cantik sekali, Tuan. Hati-hati, nanti keduluan orang.", react: X("L: A-a-apa?! Nggak! Kita cuma rekan!", "Y: Mukamu merah kayak apel.", "S: Ara... (tersenyum)") },
    ]],
    [/nelayan|pemancing/, [
      { npc: "Nona-nona, mau kupancingkan ikan? Pemuda itu kelihatan nggak sabaran.", react: X("L: Aku sabar!", "Y: Kamu nggak bisa nunggu air mendidih.", "S: Memancing itu menenangkan, Lloyd. Nanti kita coba sebentar.") },
      { npc: "Hati-hati dekat air. Yang paling berisik biasanya ditarik duluan.", react: X("Y: Lloyd, dengar itu.", "L: Kenapa lihat aku?!") },
    ]],
    [/bocah|anak/, [
      { npc: "Kakak-kakak petualang, ya? Keren! Kakak yang cowok kelihatan seumuran aku!", react: X("L: Aku bukan anak kecil!", "Y: Dia sendiri nggak bisa membantah.", "S: Kakak ini orang baik kok, Dik.") },
      { npc: "Kakak penyihir cantik banget! Aku mau jadi kayak Kakak!", react: X("S: Terima kasih, Dik. Belajar yang rajin, ya.", "L: (Aku setuju seratus persen.)", "Y: Aku dengar itu, Lloyd.") },
    ]],
    [/kakek|nenek|tetua|sesepuh|tua/, [
      { npc: "Dulu aku juga berkelana bertiga. Satu penyihir, satu pemberani, satu yang cerewet.", react: X("Y: Cerewetnya pasti Lloyd.", "L: Itu kamu!", "Y: Aku 'blak-blakan'. Bedanya jauh.", "S: Beliau menilai kita dengan tepat, ya.") },
      { npc: "Anak muda, jaga teman-temanmu. Perjalanan panjang paling berat kalau dijalani sendirian.", react: X("L: ...Pasti, Kek.", "S: ...Lloyd.", "Y: Jangan sok bijak. (pelan) ...Tapi benar.") },
    ]],
    [/tabib|penyembuh|dokter/, [
      { npc: "Luka sekecil apa pun jangan dibiarkan. Petualang yang sehat adalah petualang yang bertahan.", react: X("S: Beliau benar. Lloyd, jangan sembunyikan lukamu.", "L: Aku nggak punya luka! (menyembunyikan lecet)", "Y: Aku lihat lecetmu.") },
    ]],
    [/raja|ratu|pangeran|putri|bangsawan|istana/, [
      { npc: "Para petualang, kerajaan ini berutang budi pada keberanian kalian.", react: X("Y: Berutang budi itu bagus. Kita minta bayaran?", "L: Lyra! Di depan raja!", "S: Maaf, dia bercanda.", "Y: Setengah.") },
      { npc: "Aku merasakan ikatan di antara kalian bertiga. Itu lebih berharga dari emas.", react: X("S: Terima kasih atas kata-kata Anda.", "L: Ikatan... kita... bertiga... (terharu)", "Y: Nggak usah nangis.") },
    ]],
    [/pejabat|pelayan|tamu|menteri/, [
      { npc: "Semoga kunjungan kalian menyenangkan. Mohon jangan membuat keributan.", react: X("Y: Itu pesan buat Lloyd.", "L: Kenapa selalu aku?", "S: Kami akan menjaga sikap.") },
    ]],
    [/ranger|nomad|petualang|pengembara|pemburu/, [
      { npc: "Tiga orang dengan kemampuan seimbang. Pasti kalian sudah banyak pengalaman.", react: X("Y: Mungkin. Selena dan aku, ya.", "L: Hei! Aku juga!", "S: Lloyd juga hebat, kok.") },
      { npc: "Jangan terlalu percaya diri. Banyak petualang hebat jatuh karena itu.", react: X("Y: Lloyd, itu kamu.", "L: Itu juga kamu, Lyra!", "S: Kita semua perlu berhati-hati.") },
    ]],
    [/seniman|pelukis|artis/, [
      { npc: "Wajah-wajah kalian menarik sekali. Boleh kulukis?", react: X("L: Lukis aku paling gagah!", "Y: Lukis dia paling konyol.", "S: Aku... malu... tapi boleh juga.") },
    ]],
  ];
  const NPC_GEN = [
    { npc: "Kalian bertiga kelihatan akrab sekali. Semoga perjalanan kalian lancar!", react: X("L: Terima kasih!", "Y: Dia ngomongnya ke Selena, bukan ke kamu.", "S: Terima kasih. Semoga Anda juga.") },
    { npc: "Hati-hati di jalan, ya. Dunia ini luas dan tidak selalu ramah.", react: X("S: Kami akan berhati-hati.", "Y: Dengar, Lloyd?", "L: Aku dengar!") },
    { npc: "Salam, para petualang!", react: X("L: Halo! Aku petualang terkenal! ...Belum, sih.", "Y: Belum, dan nggak akan kalau begini terus.") },
    { npc: "Oh, kalian anggota guild? Bagus, kami butuh orang seperti kalian.", react: X("Y: Selalu ada yang butuh kita. Jarang ada yang bayar tepat waktu.", "S: Kita bantu semampu kita, ya.") },
  ];
  const NPC_AFTER = [
    X("Y: Orangnya aneh, tapi informasinya lumayan."),
    X("L: Dia ramah banget! Tapi aku lupa dia ngomong apa.", "Y: Kamu lupa karena lagi lihat Selena."),
    X("S: Semua orang punya cerita, ya. Menarik..."),
    X("L: Tadi dia lihatin kita terus.", "Y: Karena kamu berisik."),
  ];
  /* kalau perlu: NPC tertentu bisa diberi sahutan khusus, cocokkan lewat nama NPC (huruf kecil) */
  const NPC_NAMED = [
    // [/nama npc/, { npc: "kalimat NPC", react: X("L: ...", "Y: ...") }],
  ];

  /* ===================================================================================
     TAMBAHAN: dungeon, monster tertentu, topik santai, NPC
     =================================================================================== */

  /* ---------- dungeon (kunci = id dungeon: MP[zona].dng) ---------- */
  const ELEM = { D: "biasa", DA: "kayu", DP: "api", DK: "air", DL: "kayu", DB: "api", DI: "es", DR: "air", DX: "biasa", DM: "api", DE: "es" };
  const DUNG = {
    DA: X(
      "Y: Akar menjalar di dinding. Seperti gua ini bernapas. Aku nggak suka.",
      "S: Aku bisa merasakan mana tanaman di sini. Lemah, tapi... seperti berbisik.",
      "L: Gua yang berbisik! Dia bisikin apa? 'Pergi dari sini'? 'Aku lapar'?",
      "Y: 'Pergi dari sini' kedengarannya paling masuk akal.",
      "S: Jangan injak akar yang menjuntai, Lloyd. Bisa jadi bukan akar biasa.",
      "L: Aku nggak injak—AAH, kakiku nyangkut!",
    ),
    DP: X(
      "Y: Makam, pasir, jebakan. Tiga hal yang bikin aku gatal pengin buka semuanya.",
      "S: Hormati yang beristirahat di sini. Jangan ambil apa pun tanpa izin.",
      "L: Tapi kalau ada harta karun? Satu aja... koin kecil...",
      "Y: Kutukan firaun itu nyata, bocah.",
      "L: ...Aku taruh balik tanganku.",
    ),
    DK: X(
      "S: Gua yang tergenang air... lantainya licin sekali. Hati-hati, ya.",
      "L: Aku bisa jalan di atas air! Lihat—",
      "Y: Kamu jatuh.",
      "L: ...Aku basah. Secara resmi.",
      "S: Nanti kukeringkan dengan sihir, Lloyd. Janji.",
    ),
    DL: X(
      "L: Liang Peluang... berarti di dalam semuanya serba mungkin? Mungkin ada harta! Mungkin ada monster! Mungkin dua-duanya!",
      "Y: Biasanya dua-duanya.",
      "S: Tulisan di dinding ini kuno sekali. Seperti catatan perhitungan kemungkinan.",
      "L: Aku selalu menang kalau lempar koin!",
      "Y: Dua kali dari seratus.",
    ),
    DB: X(
      "L: Panas! Kawahnya kecil tapi panasnya nggak kecil!",
      "Y: 'Kecil' itu cuma nama. Jangan percaya.",
      "S: Minum dulu sebelum masuk lebih dalam. Kehabisan cairan di tempat begini berbahaya.",
      "L: Selena selalu ingetin aku minum...",
      "Y: Karena kamu lupa.",
    ),
    DI: X(
      "S: Kristal-kristal esnya memantulkan cahaya... cantik sekali.",
      "L: Cantik! Seperti... seperti... (melihat Selena) ...seperti kristal.",
      "Y: Dia hampir bilang sesuatu yang memalukan.",
      "L: Aku bilang 'kristal'! Itu nggak memalukan!",
      "S: Lantainya licin. Pelan-pelan melangkah, ya.",
    ),
    DR: X(
      "Y: Dalam, gelap, berair. Kalau ada yang terseret arus, jangan harap aku nyebur.",
      "L: Aku nyebur! Aku jago renang!",
      "S: Lloyd, tolong jangan. Arusnya bisa menarikmu ke dasar.",
      "L: ...Aku jago renang di kolam. Yang dangkal.",
    ),
    DX: X(
      "L: Tambang! Ada emas nggak? Berlian? Batu bara?",
      "Y: Kemungkinan besar cuma batu dan monster.",
      "S: Lorong ini kelihatan tidak stabil. Pegang erat lampunya, ya.",
      "L: Kalau runtuh, aku lindungin Selena!",
      "Y: Kalau runtuh, kita semua tertimpa, bocah.",
    ),
    DM: X(
      "Y: Bau belerangnya pekat. Ini bukan tempat buat main-main.",
      "S: Magma di bawah kita... mananya liar sekali. Kita harus benar-benar waspada.",
      "L: Jantung Magma... jantungnya Numeria? Kalau kita rusak, dunia meledak?",
      "Y: Jangan bikin aku tambah stres.",
      "L: Aku nggak bakal merusak! ...Kecuali kepepet.",
    ),
    DE: X(
      "S: Istana yang membeku sempurna... seperti waktu berhenti di sini.",
      "Y: Nol mutlak. Nggak ada yang bisa hidup lama di sini. Cepat selesaikan, cepat keluar.",
      "L: Aku nggak mau jadi patung es! Selena, pegang tanganku biar nggak beku!",
      "S: Tanganku juga dingin, Lloyd... tapi baik.",
      "L: ...",
      "Y: Dia beneran beku. Bukan karena es.",
    ),
  };
  const DUNG_GEN = [
    X("L: Dungeon baru! Siap-siap, harta, aku datang!", "Y: Dan monster, jebakan, dan sakit kaki.", "S: Tetap rapat dan saling jaga, ya."),
    X("Y: Dari sini kita pelan-pelan. Jalan dulu di depan, nanti kuberi tanda.", "L: Aku mau jalan di depan!", "Y: Kamu terlalu berisik buat itu."),
  ];
  const DEEP = [
    X("Y: Lantai makin dalam, musuh makin ngeselin.", "S: Tapi kita juga makin kuat. Selama saling menjaga, tidak apa-apa.", "L: Dan makin dekat ke hartanya!"),
    X("L: Turun lagi! Berapa lantai lagi, ya?", "Y: Sampai bosnya ketemu. Jangan tanya terus.", "L: Aku cuma antusias!"),
    X("S: Udaranya terasa berbeda di lantai ini. Lebih berat.", "Y: Siap-siap. Biasanya semakin ke bawah, semakin besar yang menunggu.", "L: Aku sudah siap! ...Kayaknya."),
    X("L: Lantai berikutnya! Aku punya firasat bagus!", "Y: Firasatmu terakhir kali bilang 'peti ini aman'.", "L: Itu... firasat yang sedikit meleset."),
    X("S: Kita belum terlalu lelah, tapi jangan memaksakan diri. Kalau perlu, kita mundur dulu.", "L: Mundur itu bukan gayaku!", "Y: Mundur itu gaya semua orang yang masih hidup."),
  ];
  const DAMB = [
    X("L: Aku nginjek lantai yang bunyi 'klik'.", "Y: Jangan gerak.", "L: Aku nggak gerak!", "S: Mundur pelan-pelan...", "L: Eh, itu cuma batu kecil.", "Y: Aku mau pukul dia."),
    X("S: Tetap dekat, ya. Aku tambah cahayanya sedikit.", "L: Makasih, Selena! Kamu seperti... lampu!", "Y: Itu pujian paling nggak romantis yang pernah ada."),
    X("L: Peti! Peti! Boleh kubuka?", "Y: Periksa jebakan dulu.", "L: Sudah! Aku lihat dari jauh!", "Y: Dari jauh itu bukan memeriksa."),
    X("L: HALO!!!", "Y: Berhenti.", "L: Dia jawab! 'Halo' balik!", "S: Itu gema, Lloyd."),
    X("Y: Kamu dengar? Ada yang bergerak.", "S: Arah kiri, agak jauh. Dua atau tiga.", "L: Siap! Aku punya rencana!", "Y: Rencanamu 'maju'.", "L: Itu rencana yang bagus!"),
    X("Y: Aku jalan duluan lima langkah. Kalau nggak ada suara, kalian ikut.", "L: Aku mau ikut jalan duluan!", "Y: Kamu berbunyi seperti kuali jatuh."),
    X("S: Manaku masih cukup. Tapi simpan tenagamu untuk yang lebih dalam, ya.", "L: Selena mikirin kita semua... aku terharu.", "Y: Jangan nangis di dungeon, suaranya menggema."),
    X("L: Dungeon itu sebenarnya rumah monster, kan? Kita ini tamu nggak diundang.", "Y: Tamu yang bawa belati.", "S: Dan tidak ada yang mengundang kita... tapi ada orang yang membutuhkan hasilnya."),
    X("L: Perutku bunyi. Tadi nggak bawa bekal.", "Y: Aku bawa. Tapi nggak bagi-bagi.", "S: Aku bawa dua. Ini, Lloyd.", "L: Selena... penyelamatku. Lagi."),
  ];
  const ELAMB = {
    api: [
      X("L: Aku keringetan tiga ember.", "Y: Bau.", "S: Minum, Lloyd. Jangan sampai kehabisan cairan."),
      X("Y: Hati-hati, ada lantai yang bergelembung.", "L: Aku suka yang bergelembung!", "Y: Itu lava."),
    ],
    kayu: [
      X("S: Tanaman di sini tumbuh liar tapi masih hidup. Indah.", "L: Rumput ini nempel di bajuku!", "Y: Itu duri."),
      X("L: Aku dengar sesuatu merayap di dinding.", "Y: Akar.", "L: Akar yang... suka merayap?"),
    ],
    air: [
      X("L: Tetesannya bunyi terus. Tik. Tik. Tik.", "Y: Berhenti menirukan.", "L: Tik. Tik. Tik."),
      X("S: Lantainya licin. Siapa pun yang terpeleset, jangan malu bilang.", "L: Aku nggak terpeleset!", "Y: Kamu terpeleset di langkah pertama."),
    ],
    es: [
      X("L: Hidungku beku. Rasanya nggak ada.", "Y: Masih ada. Sayangnya.", "S: Lloyd, pakai syalnya."),
      X("S: Kristal esnya berkilau. Tapi dinginnya makin menusuk, ya.", "L: Pegang tanganku, Selena! Biar hangat!", "S: Tanganmu juga dingin, Lloyd.", "L: ...Aku butuh dipeluk."),
    ],
    biasa: [
      X("L: Dungeon biasa-biasa saja, ya. Nggak ada es, nggak ada api.", "Y: Yang 'biasa' justru yang paling jahat.", "L: Kenapa?", "Y: Karena kamu lengah."),
    ],
  };

  /* ---------- obrolan santai saat HP Lloyd rendah (di peta) ---------- */
  const AMB_HURT = [
    X("S: Lloyd, wajahmu pucat. Mau kupulihkan sebentar?", "L: Nggak apa-apa... aduh.", "Y: Dia bohong."),
    X("Y: Kamu pincang. Jangan sembunyikan.", "L: Aku pincang gaya!", "S: Duduk dulu. Biar kulihat."),
    X("S: Kita istirahat dulu di tempat aman, ya. Luka kecil bisa jadi besar.", "L: Selena khawatir lagi... aku jadi merasa nggak enak.", "S: Bukan nggak enak. Aku hanya ingin kamu baik-baik saja."),
    X("Y: Heh, kalau kamu pingsan di tengah jalan, kutinggal.", "L: Kamu nggak tega!", "Y: Tega."),
  ];

  /* ---------- tambahan obrolan santai umum ---------- */
  AMB.push(
    X("L: Kenapa monster di sini namanya aneh-aneh? Slime Retak, Yeti Pecahan...", "Y: Karena yang bikin dunia ini suka matematika.", "L: Aku benci matematika.", "S: Padahal kamu menghitung damage dengan baik, Lloyd.", "L: Itu bukan matematika, itu insting!"),
    X("L: Pi itu siapa sih sebenarnya? Selalu muncul ngasih tahu.", "Y: Pemandu. Jangan tanya terlalu dalam.", "S: Dia membantu kita. Itu sudah cukup."),
    X("L: Kalau punya hewan peliharaan, aku mau slime.", "Y: Dia bakal lengket di kasurmu.", "S: Aku lebih suka rubah kecil.", "L: Aku juga! ...Rubah! Aku ganti: rubah!"),
    X("S: Semalam aku bermimpi kita bertiga berlayar di laut yang tenang.", "L: Aku mimpi makan roti sebesar rumah!", "Y: Aku mimpi tidur tanpa suara Lloyd."),
    X("Y: Belatiku mulai tumpul. Nanti kuasah.", "L: Aku bisa kasih pedangku!", "Y: Pedang bukan belati, bocah."),
    X("S: Mr. Alan punya perpustakaan besar. Aku masih ingat bau kertasnya.", "L: Aku ingat tempat sembunyi permennya.", "S: Dan kamu ketahuan.", "L: Itu kesalahan sekali!", "S: Tiga kali, Lloyd."),
    X("L: Aku latihan busur akhir-akhir ini. Targetku... pohon itu!", "Y: Kamu kena pohon sebelahnya.", "L: Itu pohon sebelah yang aku mau!"),
    X("Y: Siapa yang jaga malam ini? Bukan Lloyd.", "L: Aku bisa!", "Y: Kamu ngorok pas jaga.", "S: Aku saja yang jaga, kalian tidur."),
    X("L: Lyra, kamu pernah takut nggak?", "Y: Pernah. Waktu pertama kali sendirian. Tapi itu dulu.", "S: ...Sekarang kita bersama.", "L: Lyra jawab serius?! Aku harus nyatat ini."),
    X("L: Aku lebih keren dari Lyra!", "Y: Kamu lebih berisik.", "L: Itu bagian dari kerennya!"),
    X("L: Aku mau nama julukan! 'Lloyd si Petir Tiga Senjata!'", "Y: 'Lloyd si Berisik'.", "S: 'Lloyd yang baik hati'.", "L: Aku pilih punya Selena."),
    X("S: Kalau ada waktu, aku mau masak sup hangat untuk kalian.", "L: Aku bantu!", "Y: Jangan biarkan dia dekat panci."),
    X("L: Lihat bekas luka ini. Keren, kan?", "Y: Itu bekas digigit anjing.", "L: Anjing yang besar!"),
    X("L: Kalau punya sejuta koin, aku beli... pedang? busur? roti?", "Y: Pikirkan dulu sebelum jawab.", "L: Roti! ...Semuanya roti!"),
    X("S: Bintang malam di sini indah. Mr. Alan dulu mengajari kami nama-nama rasi.", "L: Yang itu 'Bintang Besar'.", "Y: Itu lampu kapal.", "L: ...Itu bintang yang menyamar."),
    X("L: Eh, ada kucing!", "Y: Dia pergi ke arah barat.", "L: Ikuti!", "Y: Jangan—aduh, dia sudah hilang."),
    X("Y: Aku nggak suka ketinggian. Jangan bilang siapa-siapa.", "L: AKU DENGAR! Lyra takut tinggi!", "Y: Satu kata lagi dan kutarik pengakuanku."),
    X("S: Lloyd, jaga sikap di depan orang lain, ya. Kita mewakili guild.", "L: Siap! Aku sopan!", "Y: Terakhir kali kamu 'sopan', kamu minta traktir."),
    X("L: Kalau kita bikin nama party... 'Tiga Petir Cahaya'?", "Y: Aku nggak pakai cahaya.", "S: Aku juga tidak pakai petir.", "L: ...'Tiga Orang'.", "Y: Lumayan. Paling jujur."),
    X("S: Terima kasih kalian sudah menemaniku.", "L: Hah?", "S: Aku senang bisa bertemu lagi denganmu, Lloyd.", "L: ...", "Y: Dia hang."),
    X("Y: Kalau kamu dash terus berhenti, tahan napas dua detik. Itu kunci kontrol.", "L: Dua detik... satu... dua... aduh.", "Y: Bukan sampai pingsan!"),
    X("S: Aku punya firasat buruk.", "L: Firasatmu pernah salah?", "S: Sering. Tapi tetap, hati-hati.", "Y: Itu bukan jawaban yang menenangkan."),
    X("L: Aku bosan.", "Y: Baru lima menit.", "L: Lima menit itu lama!"),
    X("L: Petanya terbalik, ya?", "Y: Kamu pegang terbalik.", "L: Dunia yang terbalik!"),
    X("Y: Selena, kalau aku sembunyi di semak, kamu bilang ke Lloyd aku di sebelah mana.", "S: Aku tidak akan bohong padanya.", "L: Selena jujur banget. Aku suka.", "Y: Dia selalu suka semuanya."),
    X("L: Aku baru sadar, Selena pakai tongkat yang ada kristal birunya. Itu keren!", "S: Terima kasih, Lloyd. Ini hadiah dari seseorang yang berharga.", "L: Siapa?!", "Y: Dia jadi penasaran. Lucu."),
    X("Y: Kalau kamu mau latihan petir, jangan di dekat kandang kuda.", "L: Kenapa?", "Y: Aku punya pengalaman buruk.", "S: Dia pernah membuat satu kuda berdiri rambutnya."),
    X("L: Misi yang paling aku suka itu yang bayarannya besar dan monsternya kecil!", "Y: Misi itu nggak ada.", "L: Aku bakal bikin guildnya!"),
    X("S: Setiap kali kita menang, aku selalu bersyukur kalian semua selamat.", "Y: Itu hal kecil. Jangan sedih-sedih.", "L: Aku juga bersyukur! Terutama aku selamat!"),
  );

  /* ---------- tambahan battle umum ---------- */
  B_INTRO.push(
    X("L: Haha! {e}! Kamu salah memilih lawan hari ini!", "Y: Kalimat itu selalu diikuti dengan Lloyd minta tolong."),
    X("S: Hati-hati, {e} kelihatan serius. Kita atur posisi dulu.", "Y: Aku di belakang dia. Lloyd, kamu umpan.", "L: Hei, kenapa selalu aku yang jadi umpan?!"),
    X("Y: {e}. Tiga detik buat memutuskan rencana. Satu... dua...", "L: Serang!", "Y: ...Itu rencananya?"),
    X("L: Aku belum sarapan. Cepat habisi {e} biar aku bisa makan!", "S: Fokus dulu, Lloyd. Lalu kita makan bersama."),
    X("Y: Lloyd, jangan pakai ketiga senjata sekaligus. Pilih satu.", "L: Aku mau coba pedang! Terus busur! Terus sihir!", "Y: Itu 'sekaligus'."),
    X("S: Aku akan jaga dari belakang. Kalian berdua jangan terlalu jauh.", "Y: Lloyd yang terlalu jauh.", "L: Aku cuma antusias!"),
  );
  B_MID.push(
    X("L: Hei, {e}! Kamu mulai goyah!", "Y: Dia belum tumbang. Jangan jumawa."),
    X("Y: Jangan lengah! Setengah jalan itu paling berbahaya!", "L: Aku nggak lengah! Aku lagi... mengatur napas."),
    X("S: Dia masih berbahaya. Jangan terlalu dekat.", "L: Aku nggak dekat! Aku... agak dekat."),
    X("L: Lyra, gantian! Aku mau coba dash petirnya!", "Y: Waktunya salah, tunggu celah!", "L: Aku nggak sabar!"),
    X("S: Kamu hebat, Lloyd. Terus seperti itu, tapi hati-hati dengan sisi kirimu.", "L: Selena merhatiin sisi kiriku! Dia merhatiin aku!", "Y: Dia merhatiin semua orang, bodoh."),
  );
  B_NEAR.push(
    X("L: Satu serangan lagi! Lyra, jangan sabotase aku!", "Y: Aku nggak pernah sabotase. Aku justru menyelamatkan kamu terus."),
    X("S: Dia hampir tumbang. Habisi dengan cepat dan rapi.", "L: Rapi? Aku nggak bisa 'rapi'.", "Y: Itu masalahnya."),
    X("Y: Habisi sekarang atau dia lari!", "L: Siap!", "Y: Kenapa kamu teriak 'siap' tapi nggak gerak?"),
  );
  B_HURT.push(
    X("S: Lloyd! Minum ramuan sekarang, jangan ditunda!", "L: Tapi aku masih bisa—", "S: Lloyd.", "L: ...Baik."),
    X("Y: Mundur, bocah. Aku yang maju.", "L: Aku nggak mundur!", "Y: Kamu berdarah.", "L: ...Aku mundur sedikit. Strategis."),
    X("L: Aduh... sakit... tapi aku nggak boleh jatuh... Selena lihat...", "S: Aku lihat, Lloyd. Bertahanlah, aku di sini."),
    X("Y: Kamu tuh ya! Selalu sok jagoan!", "L: Aku jagoan! Cuma... lagi kurang beruntung!"),
  );
  B_WIN.push(
    X("L: Menang! Menang! Traktir roti, siapa yang mau?", "Y: Yang kalah nggak bayar.", "S: Kita rayakan nanti. Sekarang pastikan semuanya aman."),
    X("Y: Jangan pasang tampang sombong, Lloyd.", "L: Aku nggak sombong! Aku... percaya diri secara terbuka!"),
    X("S: Terima kasih, kalian berdua. Kita bekerja sama dengan baik.", "L: Aku yang paling keren! Kan?", "Y: Aku, Lloyd. Aku."),
    X("L: Rasain! Berani-beraninya!", "Y: Dia sudah kalah. Berhenti bicara pada mayat."),
    X("Y: Cepat, ambil lootnya. Sebelum yang lain datang.", "L: Aku yang ambil! Aku yang ambil!", "S: Pelan-pelan, Lloyd. Jangan tersandung."),
    X("S: Kita menang tanpa korban. Itu yang paling penting.", "Y: Bagian 'tanpa korban' itu karena aku.", "L: Dan karena aku bertahan!"),
    X("L: Aku mau mandi. Bau monster menempel di bajuku.", "Y: Bau kamu sudah begitu dari kemarin.", "L: Itu... bau pahlawan!"),
    X("Y: Lumayan. Tapi kamu masih lambat di tengah.", "L: Lambat? Aku efisien!", "S: Lloyd, Lyra cuma bilang agar kita makin baik."),
  );
  B_LOSE.push(
    X("Y: Sial. Kita harus menyusun ulang strategi.", "L: Aku punya strategi! Namanya 'jangan kalah'!", "S: Itu bukan strategi, Lloyd. Tapi aku mengerti maksudmu."),
    X("S: Semuanya baik-baik saja? Syukurlah tidak ada yang... terlalu parah.", "L: Aku masih bisa—aduh.", "Y: Kamu diam saja."),
    X("L: Kita kalah... hiks... aku nggak mau nangis...", "Y: Kamu sudah nangis.", "S: Tidak apa-apa, Lloyd. Kita coba lagi."),
  );

  /* ---------- obrolan per monster tertentu (kunci = nama / sprite, huruf kecil; diperiksa SEBELUM kategori umum) ---------- */
  const MON = [
    [/imp faktorial/, X("L: Imp kecil! Lucu!", "Y: Dia bawa garpu, bocah.", "S: Mereka nakal dan cepat. Jangan lengah.")],
    [/anjing neraka/, X("Y: Anjing neraka. Gigitannya bikin nyeri sampai ke tulang.", "L: Anjing! Boleh dielus?", "S: Jangan, Lloyd. Napasnya api.")],
    [/iblis tanduk/, X("L: Tanduknya keren!", "Y: Tanduk itu buat menyeruduk. Jangan di depan.", "S: Kita serang dari samping, ya.")],
    [/gargoyle/, X("L: Patung yang hidup! Aku benci ini!", "Y: Kamu benci semua yang bisa gerak sendiri.", "S: Mereka berat tapi lambat. Manfaatkan itu.")],
    [/ksatria iblis/, X("Y: Ksatria. Berbaju besi dan berbau dendam.", "L: Duel satu lawan satu!", "Y: Ini tiga lawan satu, bodoh.", "S: Jangan terpancing gertakannya.")],
    [/jamur statistik/, X("L: Jamur lagi! Bisa dimakan?", "Y: Jangan.", "L: Aku nggak mau! ...Mungkin sedikit.", "S: Lloyd.")],
    [/burung hantu|hantu modus/, X("S: Burung hantu... matanya besar sekali.", "L: Dia lihatin aku!", "Y: Karena kamu lihatin dia.")],
    [/ent tua|ent kuno/, X("L: Pohon tua yang marah! Aku minta maaf, Pak Pohon!", "Y: Dia nggak dengar. Dia mau menimpukmu.", "S: Mari bersikap sopan dan tenang. Mereka lamban tapi kuat.")],
    [/peri pembulat/, X("S: Peri kecil bercahaya... cantik sekali.", "L: Cantik? Dia mau nyerang kita!", "Y: Peri itu menyebalkan. Jatuhkan dengan cepat.")],
    [/rubah roh bulan/, X("S: Roh rubah... ekornya bercahaya seperti bulan.", "L: Selena suka rubah! Aku jaga rubah ini— eh, aku mau pukul dia.", "Y: Pilih salah satu.")],
    [/hantu cahaya/, X("Y: Aku nggak suka yang nggak bisa dipukul.", "S: Cahaya bisa melawan balik. Serahkan padaku.", "L: Aku dukung dari belakang!")],
    [/jamur bercahaya/, X("L: Jamur yang menyala! Keren!", "Y: Racun juga menyala.", "S: Dan sering lebih mematikan.")],
    [/serigala taring/, X("Y: Taringnya panjang. Jangan terlalu dekat.", "L: Aku sudah dekat!", "Y: Kenapa nggak bilang dari tadi?!")],
    [/macan tutul/, X("Y: Macan tutul. Gesit. Pasti nyerang dari samping. Aku di kiri.", "L: Aku di... tengah!", "S: Aku di belakang, aman.")],
    [/beruang hutan/, X("L: Beruang! Madu!", "S: Dia kelihatan kelaparan. Sayang sekali...", "Y: Jangan kasihan. Cakarnya besar.", "L: Aku kasihan sedikit. Tapi cakarnya besar.")],
    [/fenrix/, X("Y: Fenrix. Serigala raksasa. Ini bukan monster biasa.", "L: Anjing terbesar yang pernah kulihat!", "S: Tolong serius, Lloyd.")],
    [/wyvern/, X("Y: Wyvern muda. Belum dewasa, tapi cukup buat menghancurkan atap.", "L: Naga kecil! Boleh pelihara?", "S: Dia nggak bakal mau, Lloyd.")],
    [/golem magma/, X("L: Batu panas! Panas!", "Y: Jangan sentuh dengan tangan kosong.", "S: Es akan membuatnya retak. Biar kucoba.")],
    [/elang petir/, X("Y: Elang petir. Cepat dan menyambar. Itu spesialisasiku juga!", "L: Wah, dia saingan Lyra!", "Y: Aku bukan saingan siapa-siapa. Aku yang lebih cepat.")],
    [/hiu/, X("Y: Hiu. Cepat dan lapar.", "L: Aku suka hiu! Mereka lucu!", "Y: Ya, sampai menggigit kakimu.")],
    [/ubur/, X("S: Ubur-ubur... sentuhannya menyengat. Hindari tentakelnya.", "L: Aku nggak mau disengat!", "Y: Maka jangan dekat.")],
    [/kepiting/, X("L: Kepiting! Makan malam!", "Y: Itu monster, bukan makan malam.", "L: Monster yang bisa dimakan!")],
    [/merpati awan/, X("L: Merpati! Aku kasih remah roti!", "Y: Itu merpati monster.", "L: Merpati monster juga mau roti.")],
    [/roh angin/, X("S: Roh angin... bergerak tak terduga. Tetap waspada.", "Y: Aku suka yang cepat. Tapi yang ini ngeselin.")],
    [/golem petir/, X("Y: Petir! Aku dan kamu punya keahlian di sini, Lloyd.", "L: Kita lawan petir pakai petir!", "Y: Bisa jadi bumerang. Hati-hati.")],
    [/patung penjaga/, X("S: Patung suci... mereka melindungi tempat ini. Kita cuma lewat, tapi mereka menolak.", "L: Maaf, Pak Patung!")],
    [/belut listrik/, X("Y: Listrik lawan petirku? Menarik.", "L: Aku kesetrum sih biasa... aduh!", "Y: Belum juga mulai!")],
    [/ikan lentera/, X("L: Ikan menyala! Cantik!", "Y: Itu umpan. Di belakangnya biasanya ada mulut besar.")],
    [/slime retak/, X("L: Slime Retak! Retaknya bisa kutambal!", "Y: Kamu nggak bisa menambal slime.")],
    [/rubah pecah/, X("L: Rubah Pecah-Pecah! Namanya lucu.", "Y: Rubah ini suka mencuri. Jaga dompet.", "L: Dompetku tipis, dia kecewa nanti!")],
    [/golem segi banyak/, X("L: Golem Segi Banyak! Sisinya berapa?", "Y: Hitung sendiri.", "S: Fokus ke sendi-sendinya.")],
    [/serigala salju/, X("Y: Serigala salju. Putih, cepat, dan sulit dilihat.", "S: Dinginnya menembus mantel. Tolong cepat selesaikan.")],
    [/yeti pecahan/, X("L: Yeti! Aku bawa tali buat naik ke pundaknya!", "Y: Kamu itu aneh.", "S: Hati-hati dengan pukulannya.")],
    [/goblin/, X("L: Goblin! Kecil-kecil!", "Y: Jangan remehkan. Mereka rame-rame dan licik.", "S: Jaga tas kita.")],
  ];
  BOSS.unshift(
    [/naga emas|zerath tak/, X("Y: Naga emas... legenda yang kita dengar di guild.", "S: Manaku bergetar. Besar sekali.", "L: Aku... aku nggak takut!", "Y: Suaramu gemetar.", "L: Itu resonansi!")],
    [/nolzael|malaikat jatuh/, X("S: Malaikat yang jatuh... auranya sedih sekaligus mengerikan.", "Y: Siap-siap. Ini bos.", "L: Cahaya dan kegelapan sekaligus? Selena, bantu!", "S: Aku akan berusaha.")],
    [/naga parabola/, X("L: Naga! Naga beneran! Aku mau—", "Y: Jangan mau apa pun!", "S: Ini bos serius pertama kita. Tetap bersama.")],
    [/raja goblin/, X("Y: Raja Goblin. Banyak anak buah, banyak bau.", "L: Bau? Aku nggak mencium apa-apa!", "Y: Hidungmu rusak.", "S: Fokus ke rajanya dulu.")],
    [/firaun/, X("S: Firaun... penjaga makam terakhir. Hormati dia sebelum kita mulai.", "L: Maaf, Firaun! Kami cuma lewat!", "Y: Dia nggak mau dengar.")],
    [/raja kepiting/, X("L: Raja Kepiting! Pasti dagingnya raksasa!", "Y: Bukan itu poinnya!", "S: Capitnya bisa memotong tulang. Jangan dekat.")],
    [/ent purba/, X("S: Pohon yang sangat tua... mananya dalam sekali.", "Y: Dia nggak bakal senang kita ke sini.", "L: Aku minta maaf dulu! ...Maaf, Pak Pohon!")],
  );

  /* ---------- komentar saat menang untuk jenis tertentu (40% kemungkinan) ---------- */
  const VWIN = [
    [/slime/, X("L: Bajuku penuh lendir!", "S: Nanti kubersihkan dengan sihir air.", "Y: Dan jangan dekat-dekat aku.")],
    [/serigala|wolf|fenrix|anjing/, X("S: Maafkan kami, Serigala. Kami hanya bertahan.", "Y: Dia yang nyerang duluan.", "L: Tapi kasihan juga...")],
    [/ular|kobra|cobra/, X("Y: Racunnya mengerikan. Tapi kena? Nggak.", "L: Aku kena sedikit—", "S: Lloyd! Sini, kuberi penawar!")],
    [/bandit|perampok|bajak/, X("Y: Dompet mereka lebih tebal dari dompet kita.", "L: Lyra!", "S: Jangan ambil, Lyra. Itu bukan hak kita.", "Y: ...Hanya melihat.")],
    [/jamur|shroom/, X("L: Aku boleh makan sedikit?", "Y: Jangan.", "S: Jangan.", "L: ...Dua suara, satu kata. Baik.")],
    [/hiu|kepiting|ubur|kraken|belut|ikan/, X("L: Aku lapar lagi... bakar aja yang ini!", "S: Tolong jangan, Lloyd.", "Y: Dia serius, kan?")],
    [/iblis|imp|demon|gargoyle|ksatria iblis/, X("Y: Satu iblis lagi jadi debu.", "S: Aura gelapnya masih terasa. Kita jangan berlama-lama.", "L: Aku siap lawan seribu!", "Y: Satu saja kamu ngos-ngosan.")],
    [/\bent\b|pohon/, X("S: Maafkan kami, penjaga hutan.", "L: Dia jatuh... pelan-pelan banget.", "Y: Itu dramatis, bukan pelan.")],
    [/naga|dragon|wyvern/, X("L: Aku mengalahkan naga! AKU MENGALAHKAN NAGA!", "Y: Kita, bocah.", "S: Kita semua. Terima kasih, teman-teman.")],
    [/golem|patung/, X("L: Tanganku sakit memukul batu...", "Y: Itu salahmu sendiri.", "S: Sini, kuberi sedikit pemulihan.")],
    [/goblin/, X("Y: Barang kita aman?", "L: Aman! Aku... eh, dompetku mana?!", "Y: Aku sudah selamatkan tadi. Bayar utangmu nanti.")],
    [/hantu|spirit/, X("L: Syukurlah dia pergi... aku nggak suka yang tembus pandang.", "Y: Kamu gemetar.", "L: Aku... kedinginan!")],
  ];

  /* ---------- NPC: tambahan pasangan kalimat & peran baru ---------- */
  const addPairs = (src, arr) => {
    const r = NPC_ROLE.find(([re]) => re.source.startsWith(src));
    if (r) r[1].push(...arr);
  };
  addPairs("ksatria", [
    { npc: "Ada laporan monster di luar tembok. Kalian petualang, kan? Mohon bantu bila bertemu.", react: X("Y: Selalu begitu. Dikasih kerjaan gratis.", "L: Itu namanya pahlawan!", "S: Kami akan melihat apa yang bisa kami lakukan.") },
    { npc: "Pemuda itu... kenapa wajahnya merah? Demam?", react: X("L: Aku sehat!", "Y: Dia sehat. Cuma salah tingkah.", "L: LYRA!") },
    { npc: "Dua gadis dan satu pemuda. Pemuda itu pasti pembawa barang, ya?", react: X("L: Aku pemimpin!", "Y: Pembawa barang, ya.", "S: Dia pemimpin, kok.") },
  ]);
  addPairs("pedagang", [
    { npc: "Dagangan murah untuk Nona-nona cantik! Kalau pemuda itu... harga biasa.", react: X("Y: Aku suka tokonya.", "L: Hei! Diskriminasi!", "S: Maafkan dia, ya.") },
    { npc: "Petualang selalu butuh perbekalan. Jangan lupa ramuan!", react: X("S: Kita memang butuh ramuan lagi.", "Y: Dan berhenti menghabiskannya buat gaya, Lloyd.", "L: Aku nggak gaya!") },
    { npc: "Tuan, jangan pegang dagangannya kalau tidak mau beli!", react: X("L: Aku cuma lihat!", "Y: Kamu pegang tiga barang.", "L: ...Tiga barang yang cuma dilihat.") },
  ]);
  addPairs("nelayan", [
    { npc: "Ikan hari ini besar-besar. Tapi yang paling besar tetap cerita nelayan lain.", react: X("L: Aku mau ikan besar!", "Y: Kamu tertipu cerita nelayan.") },
    { npc: "Mau coba umpan ini? Bisa dimakan juga, tapi rasanya aneh.", react: X("L: Boleh coba?", "S: Jangan, Lloyd!", "Y: Dia sudah makan.", "S: Lloyd!!") },
  ]);
  addPairs("bocah", [
    { npc: "Kakak berdua cantik-cantik! Kakak yang cowok kayak pengawal!", react: X("Y: 'Pengawal.' Aku suka.", "L: Pengawal?! Aku pemimpin!") },
    { npc: "Aku lihat Kakak tadi bertarung! Yang pakai petir keren banget!", react: X("L: Hehe, itu aku!", "Y: Dia ngomong soal petir. Mungkin soal aku.", "L: Hei!") },
    { npc: "Kak, kapan aku bisa jadi petualang?", react: X("S: Kalau sudah besar dan siap, ya.", "L: Aku bisa ajari!", "Y: Kamu aja belum cukup besar.") },
  ]);
  addPairs("kakek", [
    { npc: "Dulu aku punya pedang sehebat itu. Sekarang cuma tongkat.", react: X("L: Kakek pasti hebat dulu!", "Y: Setiap kakek bilang begitu.", "S: Pasti, Kek.") },
    { npc: "Jangan terlalu terburu-buru. Dunia tidak lari.", react: X("Y: Dengar, Lloyd.", "L: Aku jalan pelan! Aku pelan banget!") },
  ]);
  addPairs("tabib", [
    { npc: "Ramuan buatanku pahit, tapi manjur.", react: X("L: Pahit? Aku nggak suka pahit.", "Y: Kamu suka yang manis dan merugikan.") },
    { npc: "Penyihir muda, jaga manamu. Yang kehabisan mana gampang jatuh sakit.", react: X("S: Terima kasih nasihatnya, Bu.", "L: Selena, kalau capek bilang!", "Y: Dia lebih perhatian ke Selena daripada ke dirinya sendiri.") },
  ]);
  addPairs("raja", [
    { npc: "Raja kami menghargai petualang yang jujur. Berhati-hatilah dengan kata-kata kalian.", react: X("Y: Itu nasihat buat Lloyd.", "L: Aku jujur banget!", "Y: Terlalu jujur.") },
    { npc: "Pemuda itu sepertinya sedang jatuh cinta. Cara dia menatap Nona penyihir...", react: X("L: A-APA?! Aku cuma...", "Y: Satu istana tahu.", "S: ...Ara. Lloyd, kamu baik-baik saja?", "L: Aku baik! Baik banget!") },
  ]);
  addPairs("pejabat", [
    { npc: "Kalau butuh sesuatu, silakan bilang. Tapi tolong, jangan yang berisik.", react: X("Y: Itu buat Lloyd.", "L: Aku bisa diam!", "Y: Dia berbisik 'aku bisa diam' dengan suara keras.") },
  ]);
  addPairs("ranger", [
    { npc: "Dengar-dengar ada monster besar di wilayah selanjutnya. Siapkan ramuan.", react: X("S: Terima kasih informasinya.", "Y: Detailnya bayar?", "L: Lyra!") },
    { npc: "Kalian tim yang bagus. Aku bisa lihat dari cara kalian berbaris.", react: X("L: Dia lihat!", "Y: Aku yang menyuruh berbaris.", "S: Terima kasih.") },
  ]);
  addPairs("seniman", [
    { npc: "Wajah pemuda itu lucu. Seperti anak anjing yang bingung.", react: X("Y: PFFT.", "L: HEI!", "S: Lyra, jangan tertawa... pff.") },
  ]);
  NPC_ROLE.unshift(
    [/\belf\b|peri/, [
      { npc: "Manusia? Jarang ada yang bisa masuk sejauh ini ke wilayah kami.", react: X("L: Wah, telinganya runcing! Boleh pegang?", "Y: Lloyd.", "S: Maafkan dia. Kami datang dengan damai.") },
      { npc: "Gadis berjubah ungu itu punya aliran mana yang halus. Kami menghargainya.", react: X("S: Terima kasih... saya tersanjung.", "L: Dengar itu, Lyra?! Selena dipuji elf!", "Y: Aku dengar. Mereka juga bilang kamu berisik.") },
    ]],
    [/drakonid|pyraxis/, [
      { npc: "Kalian berani datang ke tanah naga tanpa pengawal. Menarik.", react: X("Y: Kami punya pengawal. Namanya Lloyd.", "L: Aku pengawal! Pengawal... yang ribut.") },
      { npc: "Sisik naga lebih keras dari baja. Jangan coba-coba mencabutnya.", react: X("L: Aku nggak ada niat! (menyembunyikan tangan)", "S: Lloyd...") },
    ]],
    [/beast|ferakhan|ferala/, [
      { npc: "Bau kalian... campuran. Manusia, ya? Kami tidak benci manusia, selama sopan.", react: X("S: Kami akan menjaga sopan santun. Terima kasih.", "L: Aku sopan! Lihat? Aku nggak pegang ekormu!", "Y: Karena dia belum sempat.") },
      { npc: "Gadis berkerudung itu bergerak tanpa suara. Kamu pemburu?", react: X("Y: ...Kira-kira begitu.", "L: Lyra dipuji! Padahal sering nginjek kakiku.", "Y: Itu kecelakaan. Hampir semuanya.") },
    ]],
    [/pandai|besi|smith|tempa/, [
      { npc: "Senjata kalian layak diasah. Terutama belati itu, mata pisaunya bagus.", react: X("Y: Hmph. Setidaknya ada yang tahu.", "L: Pedangku juga bagus! Cuma... agak tumpul.", "S: Kita bawa ke dia nanti, ya.") },
      { npc: "Pemuda itu bawa tiga senjata? Aku suka semangatnya, tapi berat itu soal.", react: X("L: Berat itu gaya!", "Y: Berat itu bahu pegal.", "S: Kalau pegal, bilang, Lloyd.") },
    ]],
    [/penginapan|inn|pemilik kamar/, [
      { npc: "Butuh kamar? Aku bisa siapkan dua. Satu untuk Nona-nona, satu untuk... dia.", react: X("L: Aku nggak mau sendirian!", "Y: Dengan Lloyd sekamar aku nggak tidur.", "S: Dua saja cukup. Terima kasih.") },
      { npc: "Sarapan gratis untuk yang menginap. Tapi pemuda itu, jangan habiskan semuanya.", react: X("L: Aku nggak makan banyak!", "Y: Tadi malam kamu makan dua porsi.", "L: Itu... untuk Selena.", "S: Aku tidak memesan.") },
    ]],
    [/resepsionis|petugas guild|pegawai guild|penerima misi/, [
      { npc: "Tim baru, ya? Daftarkan nama party kalian kalau mau naik rank lebih cepat.", react: X("L: 'Tiga Petir Cahaya'!", "Y: Nggak.", "S: Kita pikirkan lagi, ya.") },
      { npc: "Misi bayarannya rendah, tapi penyelesaiannya menjamin reputasi.", react: X("Y: Reputasi nggak bisa dimakan.", "L: Tapi bikin keren!", "S: Kita ambil yang masuk akal.") },
    ]],
    [/petani|tani|peternak/, [
      { npc: "Tolong, kalau bertemu monster di ladang, usir mereka! Tanamanku hampir habis.", react: X("S: Kami akan membantu semampunya.", "L: Aku jago usir monster!", "Y: Dia lebih sering diusir.") },
      { npc: "Kalian bertiga lapar? Ini, ambil sayur seadanya.", react: X("L: Makasih, Pak! Kalian orang baik!", "Y: Kamu terima semua.", "S: Terima kasih banyak, Pak.") },
    ]],
    [/pendeta|biarawan|suster|imam/, [
      { npc: "Semoga cahaya melindungi langkah kalian.", react: X("S: Terima kasih, Pendeta. Semoga cahaya melindungi Anda juga.", "L: Cahaya! Selena pakai cahaya juga!", "Y: Dia bukan pendeta, bocah.") },
      { npc: "Pemuda itu tampak lelah. Duduklah sebentar, aku doakan kesehatanmu.", react: X("L: Aku nggak lelah! ...Sedikit.", "S: Duduk sebentar, Lloyd. Tidak apa-apa.", "Y: Dia selalu begitu kalau Selena yang menyuruh.") },
    ]],
    [/kapten|pelaut|pelayar|nahkoda/, [
      { npc: "Lautan hari ini tenang, tapi jangan percaya. Dia suka berubah mendadak.", react: X("L: Seperti Lyra!", "Y: Kamu mau diceburkan ke laut?") },
      { npc: "Kalau mau berlayar, naik kapal ini. Tapi kalau mabuk laut, ember di sana.", react: X("L: Aku nggak mabuk!", "Y: Tadi kamu pucat cuma lihat dermaga.", "S: Aku bawa obat, ya.") },
    ]],
    [/koki|juru masak|pembuat roti|tukang roti/, [
      { npc: "Sup ini resep keluarga! Cicipi sedikit, tidak usah bayar.", react: X("L: Enak banget! Aku mau tambah!", "Y: Dia tidak tahu malu.", "S: Terima kasih, Bu. Enak sekali.") },
      { npc: "Pemuda itu tampak seperti habis kelaparan seminggu.", react: X("L: Aku lapar tiap lima menit!", "Y: Itu bukan kelaparan, itu masalah.") },
    ]],
    [/penyihir|mage|guru sihir|cendekia/, [
      { npc: "Aliran mana si Nona rapi. Pasti punya guru yang bagus.", react: X("S: Terima kasih. Guru kami memang luar biasa.", "L: Mr. Alan!", "Y: Jangan bahas dia, Lloyd.") },
      { npc: "Pemuda itu pakai petir dengan tiga senjata? Jarang, tapi berbahaya kalau tidak dikendalikan.", react: X("L: Aku kendalikan! Sebagian!", "Y: Sebagian.", "S: Dia sedang belajar. Kami membantu.") },
    ]],
  );
  NPC_GEN.push(
    { npc: "Kalian bertiga mau ke mana? Hati-hati, jalannya berbahaya.", react: X("L: Kami mau jadi pahlawan!", "Y: Kami mau selesaikan misi dan dibayar.", "S: Kami hanya ingin menolong.") },
    { npc: "Aku pernah melihat petualang sebelum kalian. Tidak semuanya pulang.", react: X("S: ...Kami akan berhati-hati.", "L: Aku nggak takut! (suara kecil) ...Sedikit.") },
    { npc: "Pemuda itu bawa tiga senjata? Apa nggak berat?", react: X("L: Berat tapi keren!", "Y: Bukan keren, itu nggak efisien.", "S: Dia memang serba bisa.") },
    { npc: "Wah, dua gadis cantik dan satu pemuda. Rombongan yang ramai!", react: X("L: Rombongan yang ramai!", "Y: Gara-gara kamu.") },
    { npc: "Aku sering melihat kalian lewat. Kalian makin kuat saja.", react: X("L: Hehe, makasih!", "Y: Itu karena aku.", "S: Karena kita bekerja sama.") },
    { npc: "Kalau ada waktu, mampirlah ke rumahku. Anak-anakku suka cerita petualang.", react: X("L: Aku mau cerita soal Naga!", "Y: Cerita yang sebenarnya, bukan versimu.") },
    { npc: "Hati-hati dengan tikus di gudang. Mereka lebih galak dari monster.", react: X("Y: Itu kerjaan buat Lloyd.", "L: Aku takut tikus! ...Eh. Maksudku, waspada!") },
    { npc: "Wah, kalian kelihatan akrab. Sudah berapa lama bersama?", react: X("S: Aku dan Lyra sudah cukup lama. Lloyd baru bergabung.", "L: Baru, tapi sudah jadi tim inti!", "Y: Tim inti keributan.") },
  );
  NPC_AFTER.push(
    X("Y: Kita buang waktu.", "L: Kita kenalan!", "Y: Itu buang waktu."),
    X("S: Beliau ramah sekali, ya.", "L: Selena juga ramah!", "S: ...Terima kasih, Lloyd."),
    X("L: Tadi dia bilang apa soal aku?", "Y: Pura-pura nggak dengar saja."),
    X("Y: Informasinya basi.", "L: Tapi orangnya baik!"),
    X("S: Menarik. Aku jadi ingin tahu lebih banyak soal tempat ini."),
    X("L: Aku lapar lagi.", "Y: Tiap abis ngobrol kamu lapar."),
    X("Y: Orang di sini kebanyakan curiga.", "S: Wajar, Lyra. Kita pendatang."),
    X("L: Kalau kita bantu dia, dapat hadiah nggak?", "Y: Kamu selalu tanya hadiah.", "L: Dompet kita tipis!"),
    X("S: Semoga urusannya lancar, ya. Kita doakan dia."),
    X("L: Orang tadi lucu!", "Y: Kamu yang lucu."),
  );
  /* NPC bernama (cocok lewat nama NPC) — dari salju.js */
  NPC_NAMED.push(
    [/veteran orion/, { npc: "Kalian bertiga... Aku pernah di posisi kalian. Jaga satu sama lain, itu rahasia bertahan hidup.", react: X("L: Pasti, Pak Orion!", "Y: Rahasia bertahan hidup: bawa ramuan.", "S: Terima kasih, Pak. Kami akan saling menjaga.") }],
    [/anak salju/, { npc: "Kakak penyihir! Rambutnya kayak salju! Aku mau main sama Kakak!", react: X("S: Maaf ya, Dik. Kami sedang buru-buru.", "L: Aku main sama kamu!", "Y: Kita nggak ada waktu, Lloyd.") }],
    [/pengembara beku/, { npc: "Tiga pengembara lagi... kalian satu-satunya yang kelihatan hangat di sini.", react: X("L: Itu karena Selena kasih syal!", "Y: Dan karena kamu makan banyak.") }],
    [/nelayan es/, { npc: "Hati-hati, yeti suka mencuri ikan. Pemuda itu mirip yeti kecil.", react: X("L: HEI!", "Y: PFFT.", "S: Hehe... maaf, Lloyd.") }],
    [/penjaga pos gunung es/, { npc: "Raksasa Es di depan sangat berbahaya. Tapi kalian bertiga terlihat seimbang. Itu bagus.", react: X("Y: Seimbang karena aku.", "L: Karena aku!", "S: Karena kita bersama.") }],
  );

  /* ===================================================================================
     PEMICU
     =================================================================================== */
  const inBattle = () => {
    try {
      return typeof S !== "undefined" && !!S && !!S.e && ["m", "r", "q"].includes(mode) && !S.dead;
    } catch (e) {
      return false;
    }
  };
  const hpRatio = () => {
    try {
      return Pl.hp / mhp();
    } catch (e) {
      return 1;
    }
  };
  const isBoss = (e) => {
    try {
      return S.i === 3 || e.hp >= 380 || BOSS.some(([re]) => re.test(`${e.sp} ${e.n}`.toLowerCase()));
    } catch (er) {
      return false;
    }
  };

  /* --- wilayah & santai & battle (dipantau tiap 0,5 detik) --- */
  let lastZ = null,
    nextAmb = 0,
    bS = null,
    bf = {},
    lastBL = 0;
  /* dungeon: id dungeon dari MP[zona].dng, nomor lantai dari akhiran id zona */
  function dungOf(z) {
    try {
      const m = MP[z];
      if (m && m.dng) return { id: m.dng, f: parseInt(String(z).slice(String(m.dng).length), 10) || 1 };
    } catch (e) {}
    return null;
  }
  function zoneEnter(z, now) {
    if (now - lastEnd < ZONE_COOLDOWN) return;
    const s = st(),
      dg = dungOf(z),
      name = MN[z];
    let x = null,
      mark = z;
    if (dg) {
      const k = "dg:" + dg.id;
      if (!s.z[k]) {
        x = DUNG[dg.id] || (dg.id === "D" ? ZONE.D : null) || pick("dunggen", DUNG_GEN);
        mark = k;
      } else if (dg.f >= 2 && !s.z[z]) x = pick("deep", DEEP);
      else if (Math.random() < 0.3) x = pick("damb", DAMB);
      if (x && talk(x, 1, { z: name }, () => !inBattle())) {
        s.z[mark] = 1;
        s.z[z] = 1;
      }
      return;
    }
    const n = s.z[z] || 0;
    if (!n) x = ZONE[z] || pick("newplace", NEWPLACE);
    else if (Math.random() < 0.3) x = ZAMB[z] ? pick("zamb" + z, ZAMB[z]) : null;
    if (x && talk(x, 1, { z: name }, () => !inBattle())) s.z[z] = n + 1;
  }
  function ambient(z) {
    const dg = dungOf(z);
    let x;
    if (dg) {
      const el = ELEM[dg.id],
        ep = ELAMB[el];
      if (ep && Math.random() < 0.45) x = pick("el" + el, ep);
      else if (dg.id === "D" && ZAMB.D && Math.random() < 0.3) x = pick("zambD", ZAMB.D);
      else x = pick("damb", DAMB);
    } else if (hpRatio() < 0.5 && Math.random() < 0.5) x = pick("ahurt", AMB_HURT);
    else {
      const zp = ZAMB[z];
      x = zp && Math.random() < 0.35 ? pick("zamb" + z, zp) : pick("amb", AMB);
    }
    talk(x, 0, { z: MN[z] });
  }
  function battleTick(now) {
    if (S !== bS) {
      bS = S;
      bf = {};
      lastBL = now;
    }
    if (now - lastBL < BATTLE_GAP) return;
    const e = S.e,
      r = S.ehp / e.hp,
      ok = () => S === bS && inBattle(),
      fire = (x, key) => {
        bf[key] = 1;
        if (talk(x, 1, { e: e.n }, ok)) lastBL = now;
      };
    if (!bf.hurt && hpRatio() < 0.3) fire(pick("bhurt", B_HURT), "hurt");
    else if (!bf.near && r <= 0.2) fire(pick("bnear", B_NEAR), "near");
    else if (!bf.mid && r <= 0.5 && r > 0.2) fire(pick("bmid", B_MID), "mid");
  }
  function mapTick(now) {
    const z = zone();
    if (lastZ === null) {
      lastZ = z;
      nextAmb = now + rnd(AMB_FIRST);
      return;
    }
    if (z !== lastZ) {
      lastZ = z;
      zoneEnter(z, now);
      nextAmb = Math.max(nextAmb, now + rnd(AMB_FIRST));
      return;
    }
    if (now >= nextAmb) {
      nextAmb = now + rnd(AMB_MIN, AMB_MAX);
      ambient(z);
    }
  }
  function tick() {
    try {
      if (!on() || typeof Pl === "undefined" || !Pl || !duoOn()) {
        lastZ = null;
        return;
      }
      const now = performance.now();
      if (inBattle()) {
        battleTick(now);
        return;
      }
      if (typeof mode !== "undefined" && (mode === "w" || mode === "x")) return;
      if (blocked()) return;
      mapTick(now);
    } catch (e) {}
  }
  setInterval(tick, 500);

  /* --- awal battle, menang, kalah: bungkus start / win / lose --- */
  function battleIntro(e) {
    const key = `${e.sp} ${e.n}`.toLowerCase();
    let x;
    if (isBoss(e)) {
      const b = BOSS.find(([re]) => re.test(key));
      x = b ? b[1] : pick("bossgen", BOSS_GEN);
    } else {
      const m = MON.find(([re]) => re.test(key)),
        c = CAT.find(([re]) => re.test(key));
      x = m && Math.random() < 0.85 ? m[1] : c && Math.random() < 0.65 ? c[1] : pick("bintro", B_INTRO);
    }
    talk(x, 1, { e: e.n }, () => typeof S !== "undefined" && S && S.e === e);
  }
  if (typeof start === "function") {
    const _start = start;
    start = function (i) {
      const r = _start.apply(this, arguments);
      try {
        if (on() && duoOn() && E[i]) setTimeout(() => battleIntro(E[i]), 500);
      } catch (e) {}
      return r;
    };
  }
  if (typeof win === "function") {
    const _win = win;
    win = function () {
      const was = typeof mode !== "undefined" ? mode : null;
      const hurt = hpRatio() < 0.45;
      const en = typeof S !== "undefined" && S && S.e ? S.e.n : "",
        wkey = typeof S !== "undefined" && S && S.e ? `${S.e.sp} ${S.e.n}`.toLowerCase() : "";
      const r = _win.apply(this, arguments);
      try {
        if (was !== "w" && on() && duoOn())
          setTimeout(() => {
            const sp = Math.random() < 0.4 ? VWIN.find(([re]) => re.test(wkey)) : null;
            talk(sp ? sp[1] : hurt && Math.random() < 0.6 ? pick("bwinh", B_WIN_HURT) : pick("bwin", B_WIN), 2, { e: en });
          }, 1200);
      } catch (e) {}
      return r;
    };
  }
  if (typeof lose === "function") {
    const _lose = lose;
    lose = function () {
      const was = typeof mode !== "undefined" ? mode : null;
      const r = _lose.apply(this, arguments);
      try {
        if (was !== "x" && on() && duoOn()) setTimeout(() => talk(pick("blose", B_LOSE), 2, {}), 1000);
      } catch (e) {}
      return r;
    };
  }

  /* --- NPC: tambah kalimat NPC untuk party + sahutan sesudah dialog --- */
  let curNpc = null,
    pending = null;
  const npcKey = (e, who) => (e.id || "") + "|" + who;
  function npcPair(e, who) {
    if (!(here("Y") && here("S"))) return null; // kalimat NPC menyebut "kalian bertiga"
    const key = `${e.sp || ""} ${who}`.toLowerCase();
    const nm = NPC_NAMED.find(([re]) => re.test(key));
    if (nm) return nm[1];
    const role = NPC_ROLE.find(([re]) => re.test(key));
    return role ? pick("npcr" + role[0], role[1]) : pick("npcgen", NPC_GEN);
  }
  if (typeof H !== "undefined" && H && typeof H.npc === "function") {
    const _npc = H.npc;
    H.npc = function (e) {
      curNpc = e;
      pending = null;
      if (e) e._obTalk = 0;
      return _npc.apply(this, arguments);
    };
  }
  if (typeof dlg === "function") {
    const _dlg = dlg;
    dlg = function (who, lines, cb) {
      try {
        const e = curNpc;
        if (e && e.d && e.d[0] === who && on() && duoOn() && Array.isArray(lines) && lines.every((s) => typeof s === "string")) {
          e._obTalk = 1;
          const k = npcKey(e, who);
          if (!st().n[k]) {
            const pr = npcPair(e, who);
            if (pr) {
              pending = { k, pr, who };
              lines = lines.concat([pr.npc]);
            }
          }
        }
      } catch (er) {}
      return _dlg.call(this, who, lines, cb);
    };
  }
  if (typeof idle === "function") {
    const _idle = idle;
    idle = function () {
      const r = _idle.apply(this, arguments);
      try {
        const e = curNpc,
          p = pending;
        if (e && e._obTalk) {
          e._obTalk = 0;
          curNpc = null;
          pending = null;
          if (p) {
            st().n[p.k] = 1;
            setTimeout(() => talk(p.pr.react, 2, { n: p.who }), 500);
          } else if (Math.random() < 0.28) setTimeout(() => talk(pick("npcafter", NPC_AFTER), 1, {}), 500);
        }
      } catch (er) {}
      return r;
    };
  }

  /* --- opsi di menu Pengaturan --- */
  try {
    const ms = document.getElementById("mset");
    if (ms) {
      const fs = document.createElement("fieldset");
      fs.innerHTML = '<legend>Party</legend><label class="sw"><input type="checkbox" id="obrc" /> Obrolan party</label><label class="sw">Ukuran gelembung <select id="obrs"><option value="otomatis">Otomatis</option><option value="kecil">Kecil</option><option value="sedang">Sedang</option><option value="besar">Besar</option></select></label>';
      const row = ms.querySelector(".row.end");
      ms.insertBefore(fs, row || null);
      const sel = fs.querySelector("select");
      sel.value = sizePref;
      sel.onchange = () => {
        sizePref = sel.value;
        try {
          localStorage.setItem(SIZE_KEY, sizePref);
        } catch (e) {}
        if (Object.keys(slots).length) place();
      };
      const c = fs.querySelector("input");
      c.checked = enabled;
      c.onchange = () => {
        enabled = c.checked;
        try {
          localStorage.setItem(KEY, enabled ? "1" : "0");
        } catch (e) {}
        if (!enabled) {
          q = [];
          hide();
        }
      };
    }
  } catch (e) {}

  /* alat uji di konsol: OBROLAN.zona("U"), OBROLAN.santai(), OBROLAN.battle(indeksMusuh) */
  globalThis.OBROLAN = {
    talk,
    zona: (z) => talk(ZONE[z] || pick("newplace", NEWPLACE), 2, { z: MN[z] }),
    santai: () => talk(pick("amb", AMB), 2, {}),
    battle: (i) => E[i] && battleIntro(E[i]),
    npc: () => talk(pick("npcgen", NPC_GEN).react, 2, {}),
  };
  console.log("[obrolan_party] aktif: obrolan Lloyd, Lyra, Selena");
})();
