/* ===== Numeria Quest — Batu Teleportasi Wilayah Jauh =====
   Dimuat PALING AKHIR (setelah langit_laut.js). Tidak mengubah file lain.
   Menambah 1 batu teleportasi di tiap tempat ini:
     - Dunia Iblis (gerbang Kastil Raja Iblis)   - Kota Bawah Laut Aquaria
     - Kota Langit Aeria                         - Desa Elf Silvara
     - Pegunungan Naga (Pos Penunggang Naga)
   Cara pakai: berdiri di depan batu, tekan A (aksi). Batu menyala dan lokasinya tersimpan.
   Dari batu yang sudah menyala, pilih tujuan ke batu lain yang sudah pernah kamu sentuh.
   Data batu yang sudah menyala disimpan di F.ws (ikut tersimpan bersama save game). */
(function () {
  /* ---------- daftar batu (mudah diubah) ----------
     map  = id peta, near = titik perkiraan (batu dipasang di petak kosong terdekat)
     Untuk Dunia Iblis, x ditulis relatif terhadap tepi Benua Iblis (dijumlah SH di bawah). */
  const SH = (() => {
    const q = EN.O.find((e) => e.t === "tele" && e.wp === "Q"); // batu lama iblis.js di x=554+SH
    return q ? q.x - 554 : MP.O.w - 640;
  })();
  const SPOTS = [
    { id: "ws_iblis", map: "O", near: [587 + SH, 61], n: "Gerbang Kastil Raja Iblis" },
    { id: "ws_laut", map: "AQ", near: [53, 62], n: "Kota Bawah Laut Aquaria" },
    { id: "ws_langit", map: "AN", near: [47, 66], n: "Kota Langit Aeria" },
    { id: "ws_elf", map: "NE", near: [54, 35], n: "Desa Elf Silvara" },
    { id: "ws_naga", map: "NG", near: [50, 70], n: "Pos Pegunungan Naga" },
  ];

  /* ---------- cari petak kosong (bukan tembok, pohon, rumah, atau benda lain) ---------- */
  const free = (m, x, y) => {
    const g = MP[m];
    if (!g || x < 1 || y < 1 || x >= g.w - 1 || y >= g.h - 1) return false;
    if (!".,".includes(g.g[y][x])) return false; // hanya lantai/jalan biasa
    if (EN[m].some((e) => e.x === x && e.y === y)) return false;
    const keep = mp; // solid() membaca peta aktif, jadi pinjam sebentar
    mp = m;
    const s = solid(x, y);
    mp = keep;
    return !s;
  };
  // batu butuh 1 petak, dan 1 petak kosong di sebelahnya sebagai tempat muncul setelah teleportasi
  function place(s) {
    const [cx, cy] = s.near;
    for (let r = 0; r <= 8; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = cx + dx,
            y = cy + dy;
          if (!free(s.map, x, y)) continue;
          const a = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([ax, ay]) => [x + ax, y + ay]).find(([ax, ay]) => free(s.map, ax, ay));
          if (!a) continue;
          s.x = x;
          s.y = y;
          s.ax = a[0]; // tempat muncul
          s.ay = a[1];
          s.f = [x - a[0], y - a[1]]; // menghadap ke batu
          return true;
        }
    return false;
  }
  SPOTS.forEach((s) => {
    if (!MP[s.map]) return console.warn("[teleport] peta tidak ditemukan:", s.map);
    if (!place(s)) return console.warn("[teleport] tidak ada tempat untuk batu di", s.map);
    EN[s.map].push({ t: "wstone", id: s.id, x: s.x, y: s.y });
  });
  const live = SPOTS.filter((s) => s.x !== undefined); // hanya yang berhasil dipasang

  /* ---------- saat batu disentuh (tombol A) ---------- */
  H.wstone = function (e) {
    const L = F.ws || (F.ws = {}), // F.ws = daftar batu yang sudah menyala
      first = !L[e.id];
    L[e.id] = 1;
    SND.sfx("crystal");
    const dest = live.filter((s) => L[s.id] && s.id !== e.id);
    busy = true;
    say("Batu Teleportasi.");
    ui(
      `<div class="card"><b class="ok">Batu Teleportasi</b>` +
        `<div style="margin:6px 0 10px">${first ? "Batu ini menyala! Lokasi ini kini bisa dituju dari batu lain. " : ""}` +
        (dest.length ? "Pilih tujuan:" : "Belum ada batu lain yang menyala. Temukan batu di wilayah lain dulu.") +
        `</div>` +
        dest.map((s, i) => `<div class="irow"><div><b>${s.n}</b></div><button class="b" data-wt="${i}" type="button">Pergi</button></div>`).join("") +
        `<div class="row"><button class="b g" id="wtx" type="button">Tutup</button></div></div>`,
    );
    document.querySelectorAll("[data-wt]").forEach(
      (b) =>
        (b.onclick = () => {
          const s = dest[+b.dataset.wt];
          boat = false; // turun dari perahu, supaya bisa jalan kaki di tujuan
          RV.list.length = 0;
          RV.cur = null;
          busy = false;
          idle();
          go({ to: s.map, tx: s.ax, ty: s.ay, f: s.f });
        }),
    );
    $("#wtx").onclick = () => {
      busy = false;
      idle();
    };
    $("#wtx").focus();
  };

  /* ---------- gambar batu: batu gelap dengan rune, bersinar biru setelah menyala ---------- */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      if (e.t !== "wstone") return _ent(e, t, bob);
      const X = e.x * 16,
        Y = e.y * 16 + OY,
        on = F.ws && F.ws[e.id],
        glow = on ? "#7cf0ff" : "#6a6a88";
      if (on) {
        ctx.globalAlpha = rm ? 0.25 : 0.18 + 0.12 * Math.sin(t / 300);
        ctx.fillStyle = "#7cf0ff";
        ctx.fillRect(X - 2, Y - 3, 20, 20);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = "rgba(0,0,0,.3)";
      ctx.fillRect(X + 1, Y + 14, 14, 2);
      ctx.fillStyle = "#4a4860"; // badan batu
      ctx.fillRect(X + 3, Y + 3, 10, 12);
      ctx.fillRect(X + 5, Y + 1, 6, 2);
      ctx.fillStyle = "#6a6888"; // sisi terang
      ctx.fillRect(X + 3, Y + 3, 3, 12);
      ctx.fillStyle = glow; // rune di tengah
      ctx.fillRect(X + 7, Y + 4, 2, 7);
      ctx.fillRect(X + 5, Y + 6, 6, 2);
      ctx.fillRect(X + 6, Y + 11, 4, 1);
    };
  }

  /* ---------- area sekitar batu aman dari monster acak di peta dunia (seperti batu lama) ---------- */
  {
    const _wild = wild;
    wild = function (x, y) {
      if (mp === "O" && live.some((s) => s.map === "O" && Math.abs(s.x - x) + Math.abs(s.y - y) <= 7)) return null;
      return _wild(x, y);
    };
  }
})();
