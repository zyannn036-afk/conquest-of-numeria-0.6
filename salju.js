/* ===== Numeria Quest — Dataran Salju (di antara Kota Himpunan dan Benua Iblis) =====
   Dimuat setelah east.js dan SEBELUM iblis.js (iblis.js membaca lebar dunia dan menggeser dirinya ke timur).
   Jalur: gerbang timur Kota Himpunan -> Pos Dataran Salju -> zig-zag di antara 3 punggung bukit
          -> Pos Gunung Es -> Raksasa Es menjaga celah terakhir -> lorong menuju Jurang Tak Hingga.
   Dunia dilebarkan 100 petak (480 -> 580). Wilayah: U Dataran Salju. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const S = 100, // lebar dataran salju (petak)
    X0 = 478, // kolom pertama dataran salju (tepat di luar gerbang timur Kota Himpunan)
    X1 = X0 + S - 1,
    WILD_P = 0.35; // peluang monster muncul tiap WILD_STEPS langkah

  Object.assign(MN, { U: "Dataran Salju" });
  Object.assign(TH, {
    a: { a: "#e8f0f8", b: "#dde8f2", w: "#2a5a8a", w2: "#7ab8e8", t: "#2c6a58", t2: "#eafff8" },
  });

  /* ---------- sprite monster ---------- */
  const YETI = [
    "................", "....KKKKKKKK....", "...KWWWWWWWWK...", "..KWWWWWWWWWWK..",
    "..KWWWWWWWWWWK..", "..KWKYWWWWYKWK..", "..KWWWWKKWWWWK..", "..KWWKRRRRKWWK..",
    "...KWWKKKKWWK...", ".KKWWWWWWWWWWKK.", "KWWKWWWbbWWWKWWK", "KWWKWWbbbbWWKWWK",
    ".KKKWWWWWWWWKKK.", "...KWWWKKWWWK...", "..KWWWK..KWWWK..", "..KKKKK..KKKKK..",
  ];
  const x2 = (m) =>
      m.flatMap((r) => {
        const d = [...r].map((c) => c + c).join("");
        return [d, d];
      }),
    addSp = (k, p, m, big) => {
      big = big || x2(m);
      SP[k] = { p, m, a: [m, m] };
      SP[k + "L"] = { p, m: big, a: [big, big] };
    };
  addSp("snowwolf", { K: "#10202e", G: "#c8d8ea", g: "#f4faff", D: "#8aa0bc", W: "#ffffff", R: "#4a90d8", Y: "#7cf0ff" }, SP.wolf.m, SP.wolfL.m);
  addSp("yeti", { K: "#1a2638", W: "#f4faff", b: "#b8d4ee", Y: "#ffe14d", R: "#d2284d" }, YETI);
  addSp("frostgiant", { K: "#0c1a3a", W: "#9ad0f0", b: "#5a98d0", Y: "#ff4040", R: "#ffffff" }, YETI);

  /* ---------- monster (indeks E dihitung otomatis) ---------- */
  const ALL = ["arit", "pecahan", "persen", "geom", "alj"],
    EI = {},
    mon = (key, o) => {
      EI[key] = E.length;
      E.push({ sp: key, d: [3, 5], s: 4, ...o });
    };
  mon("snowwolf", {
    n: "Serigala Salju Selisih", hp: 210, atk: 20, topics: ["arit", "persen"], weak: "persen", xp: 70, coin: 54,
    bg: ["#16283a", "#5a8ab8", "#102030", "#f0faff"],
    intro: "Serigala berbulu putih keluar dari badai salju. Setiap jejaknya mengurangi langkahmu!",
    win: "Serigala itu berlari kembali ke dalam pusaran salju.",
  });
  mon("yeti", {
    n: "Yeti Pecahan", hp: 240, atk: 22, topics: ["pecahan", "geom"], weak: "pecahan", xp: 82, coin: 62,
    bg: ["#1a2a3e", "#6a9ac8", "#12202e", "#ffffff"],
    intro: "Makhluk besar berbulu tebal menggeram. Bulunya terbelah-belah jadi pecahan yang tidak sederhana!",
    win: "Yeti itu mundur ke gua es sambil menggaruk kepala.",
  });
  mon("frostgiant", {
    n: "Raksasa Es Koefisien", hp: 420, atk: 26, topics: ALL, weak: "persen", d: [4, 5], xp: 210, coin: 280,
    bg: ["#0c1a3a", "#4a7ab8", "#08122a", "#d8f4ff"],
    intro: "Es di celah gunung retak! Raksasa Es Koefisien bangkit dan menutup satu-satunya jalan ke timur. Tidak ada jalan mundur!",
    win: "Raksasa itu pecah menjadi serpihan es. Jalan menuju Jurang Tak Hingga terbuka.",
  });

  /* ---------- musik ---------- */
  {
    const seq = (s, d = 1) =>
      s.trim().split(/\s+/).map((t) => {
        const [n, b] = t.split(":");
        return [n === "-" ? null : n, b ? +b : d];
      });
    SND.tracks.U = {
      bpm: 66,
      v: [
        { w: "triangle", g: 0.09, n: seq("E5:2 G5:1 B5:1 A5:2 F#5:1 E5:1 D5:2 F#5:2 E5:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("E2:4 C3:4 D3:4 B2:4") },
        { w: "square", g: 0.02, n: seq("B3 E4 G4 E4 G3 C4 E4 C4 A3 D4 F#4 D4 F#3 B3 D4 B3", 0.5) },
      ],
    };
  }

  /* ===================== MEMBANGUN DUNIA (480x123 -> 580x123) ===================== */
  const O = MP.O,
    WW = O.w + S,
    WH = O.h,
    g = O.g.map((r) => r.split("")),
    bm = O.bm,
    rnd = ((s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    })(20261018),
    inb = (x, y) => x > 0 && y > 0 && x < WW - 1 && y < WH - 1,
    rect = (x, y, w, h, c, th) => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const X = x + i,
            Y = y + j;
          if (X < 0 || Y < 0 || X >= WW || Y >= WH) continue;
          g[Y][X] = c;
          if (th) bm[Y][X] = th;
        }
    },
    carve = (pts, hw, mid) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) {
              const X = x + ii,
                Y = y + j;
              if (inb(X, Y) && g[Y][X] === "T") g[Y][X] = ".";
            }
          if (mid && inb(x, y) && g[y][x] === ".") g[y][x] = mid;
        }
      }
    },
    clr = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++)
          if (inb(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r && g[y][x] === "T") g[y][x] = ".";
    },
    ridge = (x0, x1, g0, g1) => {
      for (let y = 1; y < WH - 1; y++) if (y < g0 || y > g1) rect(x0, y, x1 - x0 + 1, 1, "M", "a");
    };

  // (1) perluas peta: buang tembok timur lama (x=479), isi 479..579
  for (let y = 0; y < WH; y++) {
    const edge = y === 0 || y === WH - 1;
    g[y].length = bm[y].length = edge ? O.w : O.w - 1;
    for (let x = g[y].length; x < WW; x++) {
      let c;
      if (edge || x === WW - 1) c = "#";
      else if (y <= 20 || y >= 100) c = "M";
      else c = rnd() < 0.12 ? "T" : ".";
      g[y].push(c);
      bm[y].push("a");
    }
  }

  // (2) buka gerbang timur Kota Himpunan (tembok x=477, baris jalan y=60..61)
  g[60][477] = g[61][477] = "r";
  bm[60][477] = bm[61][477] = "z";

  // (3) tiga punggung bukit zig-zag; Raksasa Es menjaga celah terakhir (1 petak)
  ridge(510, 511, 30, 34); // celah utara
  ridge(540, 541, 86, 90); // celah selatan
  ridge(566, 567, 60, 60); // celah sempit: dijaga Raksasa Es

  // (4) kolam es, pos istirahat, jejak jalan
  [[500, 42, 5, 3], [520, 62, 4, 3], [545, 70, 4, 3], [560, 40, 4, 3], [486, 80, 4, 3]].forEach(([a, b, w, h]) =>
    rect(a, b, w, h, "w", "a"),
  );
  clr(486, 65, 4); // Pos Dataran Salju
  clr(556, 65, 4); // Pos Gunung Es (sebelum Raksasa Es)
  clr(502, 46, 2); // tempat memancing
  carve([[X0, 60], [492, 60], [492, 30], [525, 30], [525, 88], [553, 88], [553, 60], [X1, 60]], 1, ",");

  /* ===================== ENTITAS ===================== */
  const targets = [],
    add = (e) => {
      if ("TCRPM".includes(g[e.y][e.x])) g[e.y][e.x] = ".";
      targets.push([e.x, e.y]);
      EN.O.push(e);
      return e;
    };
  [
    { t: "tele", wp: "U", x: 486, y: 63 },
    { t: "crystal", x: 486, y: 67 },
    { t: "tele", wp: "U2", x: 556, y: 63 },
    { t: "crystal", x: 556, y: 67 },
    ...[
      [484, 34], [484, 88], [498, 50], [500, 76], [516, 44], [518, 80], [532, 36],
      [534, 66], [546, 40], [548, 94], [560, 48], [562, 76], [572, 36], [574, 86],
    ].map(([x, y], i) => ({
      t: "chest", id: "s" + (i + 1), x, y, coin: 160 + i * 6, po: i % 2 ? 0 : 1, fp: i % 3 === 1 ? 1 : 0, sc: i % 5 === 4 ? 1 : 0,
    })),
  ].forEach((e) => {
    if (e.t === "chest") clr(e.x, e.y, 1);
    add(e);
  });
  // Raksasa Es menutup celah terakhir (ridge 566..567, celah y=60)
  add({ t: "foe", i: EI.frostgiant, x: 566, y: 60, sp: "frostgiant" });
  targets.pop(); // penjaga bukan titik yang harus dijangkau
  TELES.push(...EN.O.filter((e) => e.t === "tele" && ["U", "U2"].includes(e.wp)));
  WP.push({ id: "U", n: "Pos Dataran Salju" }, { id: "U2", n: "Pos Gunung Es" });

  // pastikan semua titik penting bisa dicapai: kalau terkurung pohon, buka jalan kecil ke wilayah yang terjangkau
  {
    const BLOCK = "#TwBDLfSEMCRPQUZHemGlk",
      HARD = "#MQwBEDLfSZUHCRPelkG",
      D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      free = (x, y) => inb(x, y) && !BLOCK.includes(g[y][x]),
      flood = () => {
        const seen = new Uint8Array(WW * WH),
          st = [[X0, 60]];
        seen[60 * WW + X0] = 1;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of D4) {
            const a = x + dx,
              b = y + dy;
            if (free(a, b) && !seen[b * WW + a]) {
              seen[b * WW + a] = 1;
              st.push([a, b]);
            }
          }
        }
        return seen;
      },
      clean = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1],
            n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
          for (let k = 0; k <= n; k++) {
            const x = Math.round(x0 + ((x1 - x0) * k) / n),
              y = Math.round(y0 + ((y1 - y0) * k) / n);
            if (!inb(x, y) || (HARD.includes(g[y][x]) && !(x === pts[0][0] && y === pts[0][1]))) return false;
          }
        }
        return true;
      };
    let seen = flood();
    const near = ([x, y]) => D4.some(([dx, dy]) => seen[(y + dy) * WW + (x + dx)]);
    targets.forEach((t) => {
      if (near(t)) return;
      const cand = [];
      for (let y = t[1] - 45; y <= t[1] + 45; y++)
        for (let x = t[0] - 45; x <= t[0] + 45; x++)
          if (inb(x, y) && seen[y * WW + x]) cand.push([Math.abs(x - t[0]) + Math.abs(y - t[1]), x, y]);
      cand.sort((a, b) => a[0] - b[0]);
      for (const [, x, y] of cand.slice(0, 400)) {
        const a = [t, [x, t[1]], [x, y]],
          b = [t, [t[0], y], [x, y]],
          route = clean(a) ? a : clean(b) ? b : null;
        if (route) {
          carve(route, 0, null);
          break;
        }
      }
      seen = flood();
      if (!near(t)) console.warn("Titik Dataran Salju belum terjangkau:", t);
    });
  }

  // selesai: tulis kembali ke peta dunia
  O.w = WW;
  O.g = g.map((r) => r.join(""));
  delete O.mc;

  /* ===================== PERILAKU ===================== */
  {
    const _reg = reg;
    reg = function (x, y) {
      return x >= X0 && x <= X1 ? "U" : _reg(x, y);
    };
    const _wild = wild;
    wild = function (x, y) {
      if (x < X0 || x > X1) return _wild(x, y);
      if (TELES.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 7)) return null;
      return { pool: [EI.snowwolf, EI.yeti], p: WILD_P };
    };
    // dekorasi: kilau salju
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th !== "a") return _bd(th, X, Y, x, y);
      if ((x * 5 + y * 9) % 9 === 0) {
        ctx.fillStyle = "rgba(120,160,200,.35)";
        ctx.fillRect(X + 3 + ((x * 3) % 8), Y + 8 + ((y * 5) % 5), 3, 1);
      }
      if ((x * 7 + y * 13) % 21 === 0) {
        ctx.globalAlpha = rm ? 0.8 : 0.5 + 0.4 * Math.sin(performance.now() / 600 + x * 3 + y);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(X + 4 + ((x * 3) % 7), Y + 3 + ((y * 5) % 6), 2, 2);
        ctx.globalAlpha = 1;
      }
    };
    // peta mini: salju, es, pohon pinus
    const _m2 = mini2;
    mini2 = function (id) {
      if (id !== "O") return _m2(id);
      const m = MP.O;
      if (m.mc) return m.mc;
      const c = _m2(id),
        k = c.getContext("2d"),
        COL = { w: "#7ab8e8", ",": "#b8c4d0", M: "#a8b8cc", T: "#2c6a58" };
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          if (x < X0 || x > X1 || m.bm[y][x] !== "a") return;
          const col = COL[ch] || (ch === "." ? "#e8f0f8" : null);
          if (col) {
            k.fillStyle = col;
            k.fillRect(x, y, 1, 1);
          }
        }),
      );
      return c;
    };
  }

  /* ===================== NPC & DIALOG ===================== */
  const wk2 = (i) => `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`,
    gn = (who, sp, [x, y], lines, fx, more) =>
      OCEAN_NPCS.push(["O", { t: "npc", id: "gen", d: [who, lines], sp, x, y, fx: fx || {}, ...more }]);

  /* --- Pos Dataran Salju --- */
  gn("Pengembara Beku", "kakek2", [483, 61], [
    "Brr! Dingin sekali. Di timur ada dataran salju yang luas, dan di ujungnya jalan menuju Benua Iblis.",
    "Jalannya berliku antara tiga punggung bukit. Ikuti jejak di salju, jangan menyimpang jauh.",
    wk2(EI.snowwolf),
  ], { face: 1 });
  gn("Pemburu Salju", "ranger", [489, 62], [
    "Pos ini hangat dan aman. Tidak ada monster yang berani mendekati batu teleportasinya.",
    wk2(EI.yeti),
  ], { face: -1 });
  gn("Nelayan Es", "nelayan", [502, 45], [
    "Lubang di es ini penuh ikan. Sesekali yeti datang minta bagian, tapi aku tidak pernah mau membaginya.",
  ], { act: "fish", face: -1 });
  gn("Anak Salju", "bocah", [488, 67], [
    "Kakak mau ke Benua Iblis? Kata Ayah, di sana semuanya merah dan panas. Beda sekali dengan di sini!",
  ], { wander: 3, face: 1 });

  /* --- Pos Gunung Es --- */
  gn("Penjaga Pos Gunung Es", "ksatria", [554, 61], [
    "Pos terakhir sebelum celah gunung. Di baliknya, Raksasa Es menutup jalan.",
    wk2(EI.frostgiant),
  ], { face: 1 });
  gn("Veteran Orion (Rank SS)", "pdekar", [558, 62], [
    "Raksasa Es itu tidak bisa dikalahkan dengan kekuatan saja. Ia menguji semua jenis soal.",
    "Isi penuh HP dan Manamu di kristal itu sebelum maju. Di seberangnya ada Jurang Tak Hingga.",
  ], { face: -1 });
})();
