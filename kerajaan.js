/* ===== Numeria Quest — Kerajaan Elf Elvandor & Kerajaan Drakonid Pyraxis (manusia setengah naga) =====
   Dimuat PALING AKHIR (setelah rubah.js). Tidak mengubah file lain; semua dibungkus dari sini.
   Cara kerja singkat (mengikuti pola utara.js / langit_laut.js):
   - Dua kerajaan = dua peta besar terpisah (id "EK" dan "DK"), bukan bagian dari peta dunia.
   - KERAJAAN ELF ELVANDOR (EK): pintunya "Gerbang Pohon" di tembok pohon sebelah barat Desa Elf Silvara
       (peta "NE", lihat ELF_GATE). Isi: istana elf berpilar dengan aula takhta (bisa dimasuki), plaza air mancur,
       Pohon Dunia, 3 baris rumah elf, toko, kristal simpan, 6 peti harta di ruang istana. Raja: Valdorin.
   - KERAJAAN DRAKONID PYRAXIS (DK): pintunya "Gerbang Sisik" di ujung terowongan batu di timur Pos Penunggang Naga
       (peta "NG", lihat DRAGON_GATE; terowongan hanya 7 petak sehingga aman dari monster acak).
       Isi: benteng naga dikelilingi parit lava (jembatan obsidian), aula takhta, plaza dengan patung naga,
       rumah batu warga Drakonid, Sarang Telur Naga, Altar Leluhur Zerath, toko, kristal simpan, 6 peti harta. Raja: Pyrrhos.
   - Kedua kerajaan AMAN: tidak ada monster acak. Pemulihan lewat kristal.
   - Warga elf bertelinga runcing; warga Drakonid bertanduk, bersayap kecil, berekor, bermata kuning (dibuat dari mkRoyal).
   Bagian yang mudah diubah ada di blok "pengaturan" tepat di bawah ini. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const ELF_GATE = [33, 34], // petak celah di tembok pohon barat Desa Elf (peta NE); desa ada di x >= 34
    DRAGON_GATE = [70, 72], // petak gerbang di ujung terowongan timur Pos Penunggang Naga (peta NG)
    TUNNEL_X = [63, 69], // terowongan batu dari pos (x=62) ke gerbang
    MW = 96, // lebar kedua kerajaan (petak)
    MH = 76, // tinggi kedua kerajaan
    CX = 48; // kolom tengah (jalan utama & takhta)

  /* ---------- nama wilayah & tema warna ---------- */
  Object.assign(MN, { EK: "Kerajaan Elf Elvandor", DK: "Kerajaan Drakonid Pyraxis" });
  Object.assign(TH, {
    ek: { a: "#4c9c6c", b: "#479466", w: "#10301f", w2: "#1c4a30", t: "#1f8a5a", t2: "#9af0c0" },
    dk: { a: "#6a4a46", b: "#644440", w: "#2a1418", w2: "#4a2a2a", t: "#5a3a2a", t2: "#d0804a" },
  });
  const KING = (id) => id === "EK" || id === "DK";

  /* ---------- bantu: nama monster & kelemahannya untuk dialog warga ---------- */
  const wk = (sp) => {
    const i = E.findIndex((m) => m.sp === sp);
    return i < 0 ? "" : `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`;
  };

  /* ---------- sprite warga: elf (telinga runcing) & Drakonid (tanduk, sayap kecil, ekor) ---------- */
  // baris telinga elf (baris 4-5 diganti), huruf mengikuti palet NPC (H=rambut, K=garis, S=kulit, E=mata)
  const EAR = {
    elf: [
      [4, "KSKHSSSSSSSSHKSK"],
      [5, ".KKHSESSSSESHKK."],
    ],
    elfHelm: [[5, "KSKHSESSSSESHKSK"]],
  };
  function elf(sp, ear = "elf") {
    if (!sp) return sp;
    const m = sp.m.map((r) => r.split(""));
    EAR[ear].forEach(([i, s]) => m[i] && (m[i] = s.split("")));
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  // sayap kecil ala kelelawar (W/w), tanduk (f), ekor bersisik (F/f)
  const WING = { 5: [0], 6: [0, 1], 7: [0, 1], 8: [0, 1, 2, 3], 9: [0, 1, 2], 10: [0, 1], 11: [0], 12: [0], 13: [0], 14: [0] };
  function drakonid(sp, o = {}) {
    if (!sp) return sp;
    const m = sp.m.map((r) => r.split("")),
      set = (j, c, ch) => m[j] && m[j][c] === "." && (m[j][c] = ch);
    [[0, 3], [0, 12], [0, 2], [0, 13], [1, 2], [1, 13]].forEach(([j, c]) => set(j, c, "f")); // tanduk
    Object.entries(WING).forEach(([j, cols]) =>
      cols.forEach((c) => {
        const ch = j % 2 ? "W" : "w";
        set(+j, c, ch);
        set(+j, 15 - c, ch);
      }),
    );
    for (let r = 14; r <= 19; r++)
      if (m[r] && m[r][14] === ".") {
        m[r][14] = r === 14 ? "f" : "F"; // ekor, ujung atas lebih terang
        if (m[r][15] === ".") m[r][15] = "K";
      }
    sp.p = { W: "#7a1c1c", w: "#a8382a", F: "#a82a2a", f: "#f0e0b0", ...sp.p };
    if (o.wing) sp.p.W = o.wing;
    if (o.wing2) sp.p.w = o.wing2;
    if (o.scale) sp.p.F = o.scale;
    if (o.horn) sp.p.f = o.horn;
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  const mk = (pal, opt) => {
    try {
      return mkRoyal(pal, opt || {});
    } catch (e) {
      console.warn("[kerajaan] mkRoyal tidak tersedia:", e && e.message);
      return null;
    }
  };
  // kulit Drakonid: bara (merah-perunggu), giok (hijau), abu (kelabu-ungu), emas
  const SK = {
    bara: { S: "#e09a78", s: "#b8704f", E: "#ffb020" },
    giok: { S: "#8fc8a0", s: "#5f9a74", E: "#ffe14d" },
    abu: { S: "#b8b0c8", s: "#8a82a0", E: "#ff7a32" },
    emas: { S: "#e8c870", s: "#b8983c", E: "#ff5a32" },
  };
  const defs = {
    // ---- elf ----
    ekKing: () => elf(mk({ H: "#f4f4d0", h: "#ffffff", A: "#e2b84a", a: "#b8902a", X: "#7cf0c8", T: "#2f8a5a", t: "#1f5a38", V: "#f0e8b0", R: "#2f8a5a", E: "#3a8a5a" }, { hat: "crown", cape: 1, long: 1 })),
    ekQueen: () => elf(mk({ H: "#f8f0b0", h: "#fffbd0", A: "#e2b84a", a: "#b8902a", X: "#7cf0c8", T: "#f0fff0", t: "#c8e8d0", V: "#3f9a6a", E: "#3a8a5a" }, { hat: "tiara", long: 1, dress: 1 })),
    ekGeneral: () => elf(mk({ H: "#e8e0a0", A: "#e8f0e0", a: "#98b0a0", X: "#e2b84a", T: "#2f8a5a", t: "#1f5a38", V: "#e2b84a", P: "#c8d8c8", p: "#98a898", R: "#2f8a5a" }, { hat: "helm", cape: 1, spear: 1 }), "elfHelm"),
    ekGuard: () => elf(mk({ H: "#e8e0a0", A: "#f0f6ee", a: "#a8c0b0", X: "#e2b84a", T: "#3f9a6a", t: "#2a6a46", V: "#e2b84a", P: "#d8e4d8", p: "#a8b8a8", O: "#4a4a3a" }, { hat: "helm", spear: 1 }), "elfHelm"),
    ekSage: () => elf(mk({ H: "#f4f4f4", M: "#ffffff", T: "#3f7a5a", t: "#2a5a3a", V: "#e2b84a", P: "#3a4a3a", p: "#2a3a2a" }, { beard: 1 })),
    ekHealer: () => elf(mk({ H: "#c8f0d8", A: "#ffffff", a: "#d0e8d8", X: "#e2b84a", T: "#f0fff4", t: "#c0e0c8", V: "#59d0a0" }, { hat: "hood" })),
    ekMage: () => elf(mk({ H: "#d0b0ff", A: "#6a3aa0", X: "#ffe14d", T: "#6a3aa0", t: "#4a2a80", V: "#e8d0ff", P: "#3a2a50", p: "#241a38" }, { hat: "witch" })),
    ekRanger: () => elf(mk({ H: "#d8e8a0", A: "#2f7a4a", a: "#1f5a38", X: "#9cf0b0", T: "#3f8a56", t: "#2a6040", V: "#d8c070", P: "#5a4a2a", p: "#3a2e1a", O: "#3a2a1a", R: "#2f7a4a" }, { hat: "hood", cape: 1 })),
    ekMerchant: () => elf(mk({ H: "#c8f0a0", A: "#e8f8d0", X: "#ffffff", T: "#8ac86a", t: "#5a9a40", V: "#7a4b2a", P: "#3b3030", p: "#2a2020" }, { hat: "scarf" })),
    ekBard: () => elf(mk({ H: "#ffc8e0", h: "#fff0f8", T: "#f0d0f0", t: "#c8a0c8", V: "#e2b84a", P: "#6a4a6a", p: "#483048" }, { long: 1 })),
    ekKid: () => elf(mk({ H: "#ffe9a0", h: "#fff8d0", T: "#bfe8c8", t: "#8ac8a0", V: "#ffffff", P: "#8a6a4a", p: "#5a4630" }, {})),
    ekGardener: () => elf(mk({ H: "#a8c870", A: "#8a6a3a", T: "#6a9a4a", t: "#487430", V: "#e8d8a0", P: "#5a4a2a", p: "#3a2e1a" }, { hat: "scarf" })),
    // ---- Drakonid ----
    dkKing: () => drakonid(mk({ H: "#2a1a1a", h: "#4a2a2a", M: "#2a1a1a", A: "#e2b84a", a: "#a8782a", X: "#ff7a32", T: "#8a1c2a", t: "#5a1018", V: "#e2b84a", R: "#8a1c2a", ...SK.bara }, { hat: "crown", cape: 1, beard: 1 }), { scale: "#a82a2a", horn: "#f0e0b0" }),
    dkQueen: () => drakonid(mk({ H: "#3a1a14", h: "#6a3a2a", A: "#e2b84a", a: "#a8782a", X: "#ff7a32", T: "#a02a2a", t: "#701818", V: "#ffd890", E: "#ffb020", ...SK.bara }, { hat: "tiara", long: 1, dress: 1 }), { scale: "#b83a2a", horn: "#ffe9b8" }),
    dkPrince: () => drakonid(mk({ H: "#4a2018", h: "#7a3a28", T: "#c8502a", t: "#8a2e18", V: "#ffd890", P: "#4a2a2a", p: "#2e1a1a", ...SK.bara }, {}), { scale: "#c84a2a", horn: "#fff0c8" }),
    dkGeneral: () => drakonid(mk({ H: "#1a1214", A: "#4a3a3a", a: "#2a2022", X: "#ff7a32", T: "#8a1c2a", t: "#5a1018", V: "#e2a040", P: "#3a2a2a", p: "#241a1a", R: "#6a1018", ...SK.abu }, { hat: "helm", cape: 1, spear: 1 }), { scale: "#5a4a68", horn: "#d8d0e0", wing: "#3a2a44", wing2: "#5a4a68" }),
    dkGuard: () => drakonid(mk({ H: "#1a1214", A: "#5a4040", a: "#34262a", X: "#ff7a32", T: "#7a2020", t: "#4a1414", V: "#e2a040", P: "#3a2a2a", p: "#241a1a", O: "#2a2020", ...SK.giok }, { hat: "helm", spear: 1 }), { scale: "#3a7a58", horn: "#e8e0c0", wing: "#2a5a40", wing2: "#4a8a68" }),
    dkElder: () => drakonid(mk({ H: "#e8e0d0", M: "#f4f0e8", T: "#6a2a1a", t: "#4a1a0e", V: "#e2a040", P: "#3a2018", p: "#241410", ...SK.emas }, { beard: 1 }), { scale: "#a88a30", horn: "#fff4d0", wing: "#8a6a20", wing2: "#c8a840" }),
    dkSmith: () => drakonid(mk({ H: "#1a1214", A: "#6a5048", T: "#4a3430", t: "#2e201e", V: "#e2a040", P: "#2e2020", p: "#1a1212", ...SK.abu }, { hat: "scarf" }), { scale: "#5a4a68", horn: "#d8d0e0", wing: "#3a2a44", wing2: "#5a4a68" }),
    dkMerchant: () => drakonid(mk({ H: "#c8502a", A: "#f4a050", X: "#ffffff", T: "#d8742a", t: "#984a18", V: "#ffe9c8", P: "#3a2a2a", p: "#241a1a", ...SK.emas }, { hat: "scarf" }), { scale: "#c88a30", horn: "#fff0c8", wing: "#8a5a18", wing2: "#d89a30" }),
    dkMage: () => drakonid(mk({ H: "#ff8a3a", A: "#8a1c1c", X: "#ffe14d", T: "#a82a1a", t: "#701810", V: "#ffd890", P: "#3a1a14", p: "#24100c", ...SK.bara }, { hat: "hood" }), { scale: "#d84a2a", horn: "#ffe9b8" }),
    dkRider: () => drakonid(mk({ H: "#1a1214", A: "#6a4a3a", a: "#3e2a22", X: "#7cf0ff", T: "#2a5a6a", t: "#1a3a48", V: "#e2a040", P: "#3a2a2a", p: "#241a1a", R: "#2a5a6a", ...SK.giok }, { hat: "helm", cape: 1 }), { scale: "#3a7a58", horn: "#e8e0c0", wing: "#2a5a40", wing2: "#4a8a68" }),
    dkKid: () => drakonid(mk({ H: "#4a2018", h: "#7a3a28", T: "#e08a4a", t: "#a85a2a", V: "#fff0d0", P: "#4a3030", p: "#2e1e1e", ...SK.bara }, {}), { scale: "#d85a2a", horn: "#fff0c8" }),
    dkPriest: () => drakonid(mk({ H: "#f0e8c0", A: "#fff4d0", a: "#d8c890", X: "#ff7a32", T: "#e8c050", t: "#b88a20", V: "#8a1c2a", P: "#8a6a20", p: "#5a4410", ...SK.emas }, { hat: "hood", long: 1 }), { scale: "#c8a030", horn: "#fff8d8", wing: "#a88820", wing2: "#e8c850" }),
  };
  Object.keys(defs).forEach((k) => {
    const s = defs[k]();
    SP[k] = s || SP.pria || SP[Object.keys(SP)[0]]; // kalau mkRoyal tidak ada, pakai sprite warga biasa
  });

  /* ---------- petak baru ----------
     Dipakai di kedua kerajaan (warna mengikuti tema; ek = elf, dk = drakonid):
     2 tembok istana, 3 pilar, 4 karpet (bisa dilewati), 5 takhta, 6 rumah, 7 lampu kristal / perapian,
     8 tajuk Pohon Dunia (ek), 1 batang Pohon Dunia (ek), 9 lava (dk), 0 jembatan obsidian (dk, bisa dilewati),
     % patung (pahlawan elf / naga), & sarang telur naga (dk). Jalan (,) digambar khusus. */
  const NEW = "1234567890%&",
    MYSOLID = "12356789%&"; // 4 (karpet) dan 0 (jembatan) bisa dilewati
  TILEX += NEW;
  {
    const _tx = tileX;
    tileX = function (c, X, Y, x, y, th, t) {
      if ((th !== "ek" && th !== "dk") || !(NEW + ",").includes(c)) return _tx(c, X, Y, x, y, th, t);
      const g = MP[mp].g,
        at = (i, j) => (g[j] || "")[i],
        up = at(x, y - 1),
        dn = at(x, y + 1),
        lf = at(x - 1, y),
        rt = at(x + 1, y),
        el = th === "ek",
        fl = (col, a, b, w, h) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, w, h);
        },
        flr = () => fl((x + y) & 1 ? TH[th].a : TH[th].b, 0, 0, 16, 16),
        pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t / 300 + x * 2 + y);
      if (c === ",") {
        if (el) {
          fl("#dce8d4", 0, 0, 16, 16);
          fl("#c8d8c0", (x + y) % 2 ? 0 : 8, 0, 1, 16);
          fl("#c8d8c0", 0, (x + y) % 2 ? 8 : 0, 16, 1);
          fl("#7ac8a0", ((x * 5) % 10) + 2, ((y * 7) % 10) + 2, 3, 2);
        } else {
          fl("#4a3030", 0, 0, 16, 16);
          fl("#3a2222", (x + y) % 2 ? 0 : 8, 0, 1, 16);
          fl("#3a2222", 0, (x + y) % 2 ? 8 : 0, 16, 1);
          if ((x * 3 + y * 7) % 5 === 0) {
            ctx.globalAlpha = 0.5 + 0.4 * pulse;
            fl("#e0561e", ((x * 5) % 9) + 2, ((y * 3) % 9) + 3, 4, 1);
            ctx.globalAlpha = 1;
          }
        }
      } else if (c === "2") {
        const top = up !== "2",
          stone = el ? "#e6eee8" : "#6a3a3e",
          dark = el ? "#b4c6ba" : "#4a262a",
          cap = el ? "#2f8a5a" : "#8a1c1c",
          capL = el ? "#5ac88a" : "#e0562a",
          gold = el ? "#e2b84a" : "#e8a838",
          glow = el ? "#9af0c0" : "#ff9a3a";
        fl(stone, 0, 0, 16, 16);
        let y0 = 0;
        if (top) {
          fl(cap, 0, 0, 16, 7);
          fl(capL, 0, 1, 16, 1);
          fl(capL, 0, 4, 16, 1);
          fl(gold, 0, 6, 16, 1);
          if (!el) [1, 7, 13].forEach((i) => fl("#c8381e", i, 0, 2, 3)); // duri naga di atap
          y0 = 7;
        }
        fl(dark, 0, y0 + 4, 16, 1);
        fl(dark, 0, y0 + 9, 16, 1);
        fl(dark, (x % 2 ? 4 : 10), y0, 1, 4);
        fl(dark, (x % 2 ? 10 : 4), y0 + 5, 1, 4);
        if ((up === "2" && dn === "2" && y % 3 === 1) || (top && x % 4 === 1)) {
          const wy = top ? 9 : 3;
          fl(el ? "#1b3a2a" : "#2a1014", 6, wy, 4, 7);
          ctx.globalAlpha = 0.5 + 0.4 * pulse;
          fl(glow, 7, wy + 1, 2, 5);
          ctx.globalAlpha = 1;
        }
        if (dn !== "2") fl(dark, 0, 13, 16, 3);
        if (lf !== "2") fl(dark, 0, y0, 1, 16 - y0);
        if (rt !== "2") fl(dark, 15, y0, 1, 16 - y0);
      } else if (c === "3") {
        flr();
        fl("rgba(0,0,0,.25)", 2, 14, 12, 2);
        fl(el ? "#b4c6ba" : "#1a1216", 3, 12, 10, 3);
        fl(el ? "#f2f6f0" : "#2e2228", 5, 3, 6, 10);
        fl(el ? "#ffffff" : "#4a3a40", 5, 3, 2, 10);
        fl(el ? "#c8d8c8" : "#1a1216", 9, 3, 2, 10);
        fl(el ? "#e2b84a" : "#e8a838", 3, 0, 10, 3);
        fl(el ? "#e2b84a" : "#e8a838", 3, 12, 10, 1);
        if (!el) {
          ctx.globalAlpha = 0.4 + 0.4 * pulse;
          fl("#ff7a32", 7, 5, 2, 6);
          ctx.globalAlpha = 1;
        }
      } else if (c === "4") {
        fl(el ? "#2f8a5a" : "#8a1c2a", 0, 0, 16, 16);
        if (lf !== "4") fl(el ? "#e2b84a" : "#e8a838", 0, 0, 2, 16);
        if (rt !== "4") fl(el ? "#e2b84a" : "#e8a838", 14, 0, 2, 16);
        if ((x + y) % 2) fl(el ? "#4fb87a" : "#b0303c", 5, 5, 6, 6);
        fl(el ? "#e2b84a" : "#e8a838", 7, 7, 2, 2);
      } else if (c === "5") {
        flr();
        fl("rgba(0,0,0,.25)", 1, 14, 14, 2);
        if (el) {
          fl("#e8f4e0", 3, 0, 10, 11);
          fl("#e2b84a", 3, 0, 10, 2);
          fl("#2f8a5a", 5, 3, 6, 8);
          fl("#7cf0c8", 7, 5, 2, 2);
          fl("#f0f8e8", 1, 10, 14, 4);
          fl("#e2b84a", 1, 14, 14, 2);
          fl("#c8d8c8", 1, 8, 2, 4);
          fl("#c8d8c8", 13, 8, 2, 4);
        } else {
          fl("#2a1a22", 3, 0, 10, 11);
          fl("#e8d8b0", 2, 0, 2, 4);
          fl("#e8d8b0", 12, 0, 2, 4);
          fl("#8a1c2a", 5, 3, 6, 8);
          ctx.globalAlpha = 0.5 + 0.4 * pulse;
          fl("#ff7a32", 7, 5, 2, 2);
          ctx.globalAlpha = 1;
          fl("#3a2a30", 1, 10, 14, 4);
          fl("#e8a838", 1, 14, 14, 2);
        }
      } else if (c === "6") {
        if (up !== "6") {
          // atap
          if (el) {
            fl("#2f8a5a", 0, 0, 16, 16);
            for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) fl("#4fb87a", i * 4 + (j % 2) * 2 - 1, j * 4 + 1, 3, 2);
            fl("#1a5a38", 0, 14, 16, 2);
            fl("#e2b84a", 0, 0, 16, 1);
          } else {
            fl("#4a2a2a", 0, 0, 16, 16);
            for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) fl("#6a3a3a", i * 4 + (j % 2) * 2 - 1, j * 4 + 2, 3, 2);
            [2, 8, 13].forEach((i) => fl("#c8381e", i, 0, 2, 3));
            fl("#2a1414", 0, 14, 16, 2);
          }
        } else {
          fl(el ? "#f4ecd0" : "#5a4040", 0, 0, 16, 16);
          fl(el ? "#8a6a3a" : "#34262a", 0, 0, 1, 16);
          fl(el ? "#8a6a3a" : "#34262a", 15, 0, 1, 16);
          if ((x + y) % 2 && dn === "6") {
            fl(el ? "#8a6a3a" : "#34262a", 4, 3, 8, 7);
            ctx.globalAlpha = el ? 1 : 0.6 + 0.4 * pulse;
            fl(el ? "#7ab0e8" : "#ff9a3a", 5, 4, 6, 5);
            ctx.globalAlpha = 1;
            fl(el ? "#e8f4ff" : "#ffd890", 6, 5, 2, 2);
          }
          if (dn !== "6") fl(el ? "#c8b890" : "#34262a", 0, 13, 16, 3);
        }
      } else if (c === "7") {
        flr();
        if (el) {
          fl("rgba(0,0,0,.25)", 3, 14, 10, 2);
          fl("#8a6a3a", 7, 6, 2, 9);
          ctx.globalAlpha = 0.2 + 0.2 * pulse;
          fl("#9af0c0", 2, -2, 12, 12);
          ctx.globalAlpha = 1;
          fl("#9af0c0", 5, 1, 6, 6);
          fl("#e8fff0", 6, 2, 2, 3);
        } else {
          fl("rgba(0,0,0,.3)", 2, 14, 12, 2);
          fl("#5a4040", 2, 8, 12, 2);
          fl("#3a2a2a", 3, 10, 10, 4);
          const h = rm ? 5 : 4 + Math.round(2 * Math.sin(t / 110 + x * 3));
          ctx.globalAlpha = 0.2 + 0.15 * pulse;
          fl("#ff7a32", 0, -3, 16, 14);
          ctx.globalAlpha = 1;
          fl("#ff6a22", 5, 8 - h, 6, h);
          fl("#ffd24a", 6, 8 - h + 2, 4, h - 2);
        }
      } else if (c === "8") {
        fl("#2a8a52", 0, 0, 16, 16);
        for (let k = 0; k < 4; k++) fl(k % 2 ? "#4fc880" : "#1f6a3e", (x * 7 + k * 5 + y * 3) % 13, (y * 5 + k * 7 + x) % 13, 3, 2);
        if (up !== "8") fl("#4fc880", 0, 0, 16, 2);
        if (lf !== "8" && lf !== "1") fl("#1f6a3e", 0, 0, 2, 16);
        if (rt !== "8" && rt !== "1") fl("#1f6a3e", 14, 0, 2, 16);
        if (dn !== "8" && dn !== "1") fl("#1f6a3e", 0, 14, 16, 2);
        ctx.globalAlpha = 0.4 + 0.4 * pulse;
        fl("#fff6b0", ((x * 5 + y * 3) % 12) + 1, ((y * 7 + x) % 12) + 1, 2, 2);
        ctx.globalAlpha = 1;
      } else if (c === "1") {
        flr();
        fl("#6a4a2a", 3, 0, 10, 16);
        fl("#8a6a3a", 3, 0, 3, 16);
        fl("#4a3018", 10, 0, 3, 16);
        if (up === "8") fl("rgba(0,0,0,.3)", 3, 0, 10, 3);
        if (dn !== "1") {
          fl("#6a4a2a", 0, 12, 16, 4);
          fl("#8a6a3a", 0, 12, 5, 2);
        }
      } else if (c === "9") {
        const edge = (n) => n !== "9" && n !== "0";
        fl("#c8321a", 0, 0, 16, 16);
        const w = rm ? 0 : Math.sin(t / 400 + x * 1.7 + y * 1.1);
        fl("#ff7a22", 1 + Math.round(w * 2), 3, 7, 2);
        fl("#ff7a22", 7 - Math.round(w * 2), 10, 7, 2);
        if ((x * 5 + y * 7) % 4 === 0) {
          ctx.globalAlpha = 0.5 + 0.5 * pulse;
          fl("#ffd24a", ((x * 3) % 11) + 2, ((y * 5) % 11) + 2, 2, 2);
          ctx.globalAlpha = 1;
        }
        if (edge(up)) fl("#2a1414", 0, 0, 16, 2);
        if (edge(dn)) fl("#2a1414", 0, 14, 16, 2);
        if (edge(lf)) fl("#2a1414", 0, 0, 2, 16);
        if (edge(rt)) fl("#2a1414", 14, 0, 2, 16);
      } else if (c === "0") {
        fl("#2a2430", 0, 0, 16, 16);
        for (let j = 0; j < 16; j += 4) fl("#3a3444", 0, j + 3, 16, 1);
        if (lf === "9") fl("#e8a838", 0, 0, 2, 16);
        if (rt === "9") fl("#e8a838", 14, 0, 2, 16);
        if (up === "9") fl("#e8a838", 0, 0, 16, 2);
        if (dn === "9") fl("#e8a838", 0, 14, 16, 2);
        fl("rgba(255,120,40,.12)", 0, 0, 16, 16);
      } else if (c === "%") {
        flr();
        fl("rgba(0,0,0,.25)", 2, 14, 13, 2);
        if (el) {
          fl("#c8d4c8", 3, 12, 10, 4);
          fl("#e8f0e8", 5, 5, 6, 8);
          fl("#f4f8f4", 6, 1, 4, 4);
          fl("#7a9a7a", 12, 2, 1, 10);
          fl("#4fb87a", 4, 11, 3, 1);
          fl("#ffffff", 5, 5, 2, 7);
        } else {
          fl("#3a2a2a", 2, 12, 12, 4);
          fl("#5a4040", 4, 6, 8, 7);
          fl("#6a4a4a", 0, 3, 4, 8);
          fl("#6a4a4a", 12, 3, 4, 8);
          fl("#7a5a5a", 6, 1, 5, 6);
          fl("#e8d8b0", 5, 0, 1, 3);
          fl("#e8d8b0", 10, 0, 1, 3);
          ctx.globalAlpha = 0.5 + 0.5 * pulse;
          fl("#ff7a32", 9, 3, 1, 1);
          ctx.globalAlpha = 1;
          fl("#4a3030", 11, 12, 4, 2);
        }
      } else if (c === "&") {
        flr();
        fl("rgba(0,0,0,.25)", 1, 14, 14, 2);
        fl("#7a5a2a", 1, 9, 14, 6);
        fl("#9a7a3a", 3, 10, 10, 2);
        const C = [["#e86a4a", "#ffb090"], ["#4ac8a8", "#b0fff0"], ["#e8c040", "#fff0a0"]][(x + y) % 3];
        ctx.globalAlpha = 0.15 + 0.2 * pulse;
        fl(C[1], 1, 0, 14, 14);
        ctx.globalAlpha = 1;
        fl(C[0], 6, 3, 5, 9);
        fl(C[0], 5, 5, 7, 5);
        fl(C[1], 6, 4, 2, 2);
      }
    };
    // lantai: bunga & kunang-kunang (Elvandor), retakan & bara (Pyraxis)
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th === "ek") {
        if ((x * 7 + y * 13) % 23 === 0) {
          ctx.fillStyle = "#3d8a5a";
          ctx.fillRect(X + 7, Y + 8, 1, 4);
          ctx.fillStyle = ["#ffe9f0", "#ffd24d", "#ffb0d0", "#cfe8ff"][(x + y) % 4];
          ctx.fillRect(X + 6, Y + 6, 3, 3);
        } else if ((x * 5 + y * 9) % 7 === 0) {
          ctx.fillStyle = "#3d8a5a";
          ctx.fillRect(X + 3 + ((x * 3) % 8), Y + 9, 1, 3);
          ctx.fillRect(X + 4 + ((x * 3) % 8), Y + 10, 1, 2);
        }
      } else if (th === "dk") {
        if ((x * 5 + y * 9) % 9 === 0) {
          ctx.fillStyle = "rgba(20,8,8,.5)";
          ctx.fillRect(X + 3 + ((x * 3) % 8), Y + 7 + ((y * 5) % 5), 5, 1);
        }
        if ((x * 7 + y * 13) % 19 === 0) {
          ctx.globalAlpha = rm ? 0.6 : 0.3 + 0.5 * Math.sin(performance.now() / 500 + x * 3 + y);
          ctx.fillStyle = "#ff8a3a";
          ctx.fillRect(X + 4 + ((x * 3) % 7), Y + 4 + ((y * 5) % 6), 2, 2);
          ctx.globalAlpha = 1;
        }
      } else _bd(th, X, Y, x, y);
    };
    // petak yang tidak bisa dilewati (hanya di dua kerajaan ini)
    const _solid = solid;
    solid = (x, y) => _solid(x, y) || (KING(mp) && MYSOLID.includes((MP[mp].g[y] || "")[x] || " "));
  }

  /* ---------- musik sintetis (nada:lama) ---------- */
  {
    const seq = (s, d = 1) =>
      s.trim().split(/\s+/).map((t) => {
        const [n, b] = t.split(":");
        return [n === "-" ? null : n, b ? +b : d];
      });
    SND.tracks.EK = {
      bpm: 78,
      v: [
        { w: "triangle", g: 0.09, n: seq("E5:2 G5:1 A5:1 B5:2 A5:1 G5:1 E5:2 D5:2 E5:3 -:1") },
        { w: "triangle", g: 0.12, n: seq("C3:4 G2:4 A2:4 E2:4") },
        { w: "square", g: 0.02, n: seq("G4 C5 E5 C5 B3 D5 G4 D5 A4 C5 E5 C5 G4 B4 D5 B4", 0.5) },
      ],
    };
    SND.tracks.DK = {
      bpm: 92,
      v: [
        { w: "triangle", g: 0.1, n: seq("D4:2 F4:1 A4:1 D5:2 C5:1 A4:1 G4:2 A4:2 F4:3 -:1") },
        { w: "triangle", g: 0.13, n: seq("D2:2 D2:2 A#1:2 A#1:2 F2:2 F2:2 G2:2 A2:2") },
        { w: "square", g: 0.025, n: seq("D3 A3 D4 A3 A#2 F3 A#3 F3 F3 C4 F4 C4 G3 D4 G4 D4", 0.5) },
      ],
    };
  }

  /* ---------- alat bantu membuat peta ---------- */
  const SOLIDALL = "#TwBDLfSEMCRPQUZHemGlk" + MYSOLID,
    rng = (s) => () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    grid = (w, h, c) => [...Array(h)].map(() => Array(w).fill(c)),
    inb = (g, x, y) => x > 0 && y > 0 && y < g.length - 1 && x < g[0].length - 1,
    put = (g, x, y, c) => inb(g, x, y) && (g[y][x] = c),
    box = (g, x, y, w, h, c) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
    },
    ring = (g, x0, y0, x1, y1, c) => {
      for (let x = x0; x <= x1; x++) (put(g, x, y0, c), put(g, x, y1, c));
      for (let y = y0; y <= y1; y++) (put(g, x0, y, c), put(g, x1, y, c));
    },
    border = (g) => {
      const h = g.length,
        w = g[0].length;
      for (let x = 0; x < w; x++) g[0][x] = g[h - 1][x] = "#";
      for (let y = 0; y < h; y++) g[y][0] = g[y][w - 1] = "#";
    },
    forest = (g, p, r) =>
      g.forEach((row, y) => row.forEach((c, x) => c === "." && inb(g, x, y) && r() < p && (row[x] = "T"))),
    // buang pohon di persegi; keep = peluang pohon tetap berdiri
    thin = (g, r, x0, y0, x1, y1, keep) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(g, x, y) && g[y][x] === "T" && r() >= keep) g[y][x] = ".";
    },
    carve = (g, pts, hw, c = ".", over = "T.") => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i],
          [x1, y1] = pts[i + 1],
          n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
        for (let k = 0; k <= n; k++) {
          const x = Math.round(x0 + ((x1 - x0) * k) / n),
            y = Math.round(y0 + ((y1 - y0) * k) / n);
          for (let j = -hw; j <= hw; j++)
            for (let ii = -hw; ii <= hw; ii++) if (inb(g, x + ii, y + j) && over.includes(g[y + j][x + ii])) g[y + j][x + ii] = c;
        }
      }
    },
    house = (g, x, y) => {
      box(g, x, y, 4, 3, "6");
      put(g, x + 1, y + 2, "E"); // pintu
    },
    pt = (x, y, to, tx, ty, f, more) => ({ t: "portal", x, y, to, tx, ty, f, ...more }),
    chest = (id, [x, y], i) => ({ t: "chest", id, x, y, coin: 300 + i * 18, po: i % 2 ? 0 : 1, fp: i % 3 === 1 ? 1 : 0, sc: i % 5 === 4 ? 1 : 0 });

  // pastikan semua titik penting bisa dijangkau dari titik awal; kalau terkurung, buka jalan lewat pohon
  function ensure(g, start, targets, tag) {
    const w = g[0].length,
      h = g.length,
      D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]],
      flood = () => {
        const seen = new Uint8Array(w * h),
          st = [start];
        seen[start[1] * w + start[0]] = 1;
        while (st.length) {
          const [x, y] = st.pop();
          for (const [dx, dy] of D4) {
            const a = x + dx,
              b = y + dy;
            if (inb(g, a, b) && !SOLIDALL.includes(g[b][a]) && !seen[b * w + a]) {
              seen[b * w + a] = 1;
              st.push([a, b]);
            }
          }
        }
        return seen;
      },
      route = (a, b, first) => {
        const pts = first === "x" ? [a, [b[0], a[1]], b] : [a, [a[0], b[1]], b];
        for (let i = 0; i < 2; i++) {
          const [x0, y0] = pts[i],
            [x1, y1] = pts[i + 1],
            n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
          for (let k = 0; k <= n; k++) {
            const x = Math.round(x0 + ((x1 - x0) * k) / n),
              y = Math.round(y0 + ((y1 - y0) * k) / n);
            if (!inb(g, x, y) || !"T.,M".includes(g[y][x])) return null;
          }
        }
        return pts;
      };
    let seen = flood();
    const near = ([x, y]) => [[0, 0], ...D4].some(([dx, dy]) => seen[(y + dy) * w + x + dx]);
    targets.forEach((t) => {
      if (near(t)) return;
      let best = null,
        bd = 1e9;
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const d = Math.abs(x - t[0]) + Math.abs(y - t[1]);
          if (seen[y * w + x] && d < bd) ((bd = d), (best = [x, y]));
        }
      const r = best && (route(t, best, "x") || route(t, best, "y"));
      if (r) carve(g, r, 0, ".", "T.M");
      seen = flood();
      if (!near(t)) console.warn(`[kerajaan] ${tag}: titik belum terjangkau`, t);
    });
  }

  /* ---------- NPC (spawn sendiri: spawnNpc milik town.js tidak tahu petak baru yang solid) ---------- */
  function spawn(map, e) {
    const g = MP[map].g,
      EL = EN[map],
      ok = (x, y) =>
        x > 0 &&
        y > 0 &&
        y < g.length - 1 &&
        x < g[0].length - 1 &&
        !SOLIDALL.includes(g[y][x]) &&
        g[y][x] !== "0" &&
        !EL.some((o) => o.x === x && o.y === y);
    let best = null;
    for (let r = 0; r <= 4 && !best; r++)
      for (let dy = -r; dy <= r && !best; dy++)
        for (let dx = -r; dx <= r && !best; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(e.x + dx, e.y + dy)) best = [e.x + dx, e.y + dy];
    if (!best) return console.warn("[kerajaan] NPC tidak muat", e.d && e.d[0], e.x, e.y);
    [e.x, e.y] = best;
    e.fx = Object.assign({ face: 1, ox: 0, oy: 0, tm: R(10, 80), go: 0, ph: R(0, 1), home: [e.x, e.y] }, e.fx || {});
    EL.push(e);
  }
  const gn = (map, who, sp, [x, y], lines, fx, more) =>
      spawn(map, { t: "npc", id: "gen", d: [who, lines.filter(Boolean)], sp, x, y, fx: fx || {}, ...more }),
    merchant = (map, sp, [x, y]) => spawn(map, { t: "npc", id: "toko", sp, x, y, fx: {} });

  /* ---------- tata letak bersama kedua kerajaan ---------- */
  const PX0 = 33, // cincin tembok istana
    PX1 = 63,
    PY0 = 7,
    PY1 = 30,
    PLAZA_Y = 35, // plaza: 21 x 11 petak di bawah istana
    ROWS = [49, 56, 63], // baris rumah (jalan ada 3 petak di bawah tiap baris)
    HW = [9, 16, 23, 30], // rumah sisi barat
    HE = [62, 69, 76, 83]; // rumah sisi timur

  // istana: cincin tembok, 4 menara, gerbang selatan, karpet ke takhta, pilar
  function palace(g) {
    ring(g, PX0, PY0, PX1, PY1, "2");
    [[PX0 - 1, PY0 - 1], [PX1 - 3, PY0 - 1], [PX0 - 1, PY1 - 3], [PX1 - 3, PY1 - 3]].forEach(([x, y]) => box(g, x, y, 5, 5, "2"));
    [CX - 1, CX, CX + 1].forEach((x) => put(g, x, PY1, "4"));
    put(g, CX - 2, PY1, "3");
    put(g, CX + 2, PY1, "3");
    box(g, CX - 1, PY0 + 3, 3, PY1 - PY0 - 3, "4"); // karpet dari gerbang ke takhta
    box(g, CX - 5, PY0 + 1, 11, 3, "4"); // panggung takhta
    put(g, CX, PY0 + 1, "5");
    [PY0 + 6, PY0 + 10, PY0 + 14, PY0 + 18, PY0 + 22].forEach((y) => {
      put(g, CX - 3, y, "3");
      put(g, CX + 3, y, "3");
    });
  }
  // plaza + deretan rumah + jalan
  function city(g, houseRows) {
    carve(g, [[CX, PY1 + 1], [CX, MH - 5]], 1, ",", "T.M"); // jalan utama
    box(g, CX - 10, PLAZA_Y, 21, 11, ",");
    ROWS.forEach((y) => {
      carve(g, [[6, y + 3], [MW - 7, y + 3]], 0, ",", "T."); // jalan di depan rumah
      [...HW, ...HE].forEach((x) => houseRows(g, x, y));
    });
  }

  /* ===================== 1) KERAJAAN ELF ELVANDOR (96x76) ===================== */
  {
    const r = rng(8801),
      g = grid(MW, MH, ".");
    forest(g, 0.3, r);
    border(g);
    thin(g, r, 28, 2, 68, PLAZA_Y - 1, 0); // halaman istana bebas pohon
    thin(g, r, 4, PLAZA_Y, MW - 5, MH - 5, 0.12); // kota: pohon jarang
    thin(g, r, 62, 4, 84, 20, 0); // halaman Pohon Dunia
    thin(g, r, 3, 4, 20, 16, 0); // telaga barat laut
    box(g, 6, 7, 12, 7, "w"); // telaga
    box(g, 82, 36, 9, 7, "w"); // kolam timur
    thin(g, r, 80, 34, 92, 45, 0);
    box(g, 82, 36, 9, 7, "w");
    // Pohon Dunia: tajuk membulat + batang
    for (let y = 8; y <= 12; y++) {
      const ins = y === 8 || y === 12 ? 2 : y === 9 || y === 11 ? 1 : 0;
      for (let x = 68 + ins; x <= 78 - ins; x++) put(g, x, y, "8");
    }
    box(g, 72, 13, 3, 2, "1");
    city(g, house);
    carve(g, [[CX, MH - 5], [CX, MH - 2]], 1, ",", "T."); // jalan sampai gerbang selatan
    palace(g);
    // taman istana
    [[40, 22], [56, 22], [40, 14], [56, 14]].forEach(([x, y]) => put(g, x, y, "f"));
    [[37, 12], [59, 12], [37, 26], [59, 26]].forEach(([x, y]) => put(g, x, y, "7"));
    // plaza: air mancur, patung pahlawan, lampu
    put(g, CX, PLAZA_Y + 5, "f");
    [[CX - 5, PLAZA_Y + 2], [CX + 5, PLAZA_Y + 2], [CX - 5, PLAZA_Y + 8], [CX + 5, PLAZA_Y + 8]].forEach(([x, y]) => put(g, x, y, "%"));
    [[CX - 10, PLAZA_Y], [CX + 10, PLAZA_Y], [CX - 10, PLAZA_Y + 10], [CX + 10, PLAZA_Y + 10]].forEach(([x, y]) => put(g, x, y, "7"));
    g[MH - 1][CX] = "D"; // gerbang selatan (ke Hutan Elf Silvara)
    const cs = [[36, 11], [60, 11], [36, 18], [60, 18], [36, 25], [60, 25]],
      cr = [[CX - 10, 19], [CX + 10, 19]],
      npcs = [
        [CX, PY0 + 3], [CX - 3, PY0 + 3], [CX + 3, PY0 + 3], [CX - 5, PY0 + 5], [CX + 5, PY0 + 5], [CX - 3, PY1 - 1], [CX + 3, PY1 - 1],
        [38, 20], [34, 22], [52, 24], [CX - 3, MH - 8], [41, 52], [55, 52], [28, 52], [62, 52], [CX + 2, PLAZA_Y + 8], [CX - 6, PLAZA_Y + 5],
        [CX + 6, PLAZA_Y + 5], [9, 15], [73, 16], [78, 59], [22, 59], [CX, PLAZA_Y + 3], [86, 44],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => thin(g, () => 1, x - 1, y - 1, x + 1, y + 1, 0));
    ensure(g, [CX, MH - 3], [...cs, ...cr, ...npcs, [CX, MH - 2]], "Elvandor");
    MP.EK = { th: "ek", w: MW, h: MH, g: g.map((row) => row.join("")) };
    EN.EK = [
      pt(CX, MH - 1, "NE", ELF_GATE[0] + 1, ELF_GATE[1], [1, 0]),
      ...cs.map((p, i) => chest("ek" + (i + 1), p, i + 4)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    const e = gn.bind(null, "EK");
    // --- aula takhta ---
    e("Raja Elf Valdorin Daun Perak", "ekKing", [CX, PY0 + 3], [
      "Selamat datang di Elvandor, ibu kota para elf. Sudah lama sekali tidak ada manusia yang melewati Gerbang Pohon kami.",
      "Adikku Aelwyn memimpin Desa Silvara di tepi hutan. Dia yang mengirim kabar bahwa seorang Penjaga Angka sedang berkeliling.",
      "Setiap cabang Pohon Dunia tumbuh menurut deret bilangan. Itu sebabnya kerajaan kami menghormati orang yang pandai berhitung.",
      "Di Pegunungan Naga ada kerajaan saudara kami, Pyraxis. Rajanya, Pyrrhos, sahabat lamaku. Setengah naga, tapi hatinya selembut daun.",
    ], { face: 1 });
    e("Ratu Elf Sylvanelle", "ekQueen", [CX - 3, PY0 + 3], [
      "Kristal di halaman istana ditanam dari biji Pohon Dunia. Sentuhlah kalau tubuhmu lelah, ia akan memulihkanmu.",
      "Anak-anak kami belajar berhitung sambil menghitung kelopak bunga. Kamu boleh mengobrol dengan mereka di plaza.",
    ], { face: 1 });
    e("Penasihat Agung Ilvaren", "ekSage", [CX + 3, PY0 + 3], [
      "Umurku lima ratus tahun, dan aku masih menghitung cincin tahun Pohon Dunia setiap pagi.",
      "Di selatan ada Hutan Elf, tempat Ent Kuno menjaga jalan ke utara. Hutan Beast di timur dihuni sahabat kami, para manusia binatang.",
      wk("entkuno"),
    ], { face: -1 });
    e("Jenderal Pemanah Faelwen", "ekGeneral", [CX - 5, PY0 + 5], [
      "Pemanah Elvandor menjaga seluruh Hutan Silvara. Kami jarang meleset, kecuali soal pecahan.",
      wk("pixie"),
      wk("spiritfox"),
    ], { face: 1 });
    e("Pengawal Takhta Thalion", "ekGuard", [CX + 5, PY0 + 5], ["Berdiri tegak seharian itu melelahkan, tapi menghitung ubin lantai membantu."], { face: -1 });
    e("Pengawal Gerbang Istana Eru", "ekGuard", [CX - 3, PY1 - 1], ["Aula takhta terbuka untuk tamu baik hati. Silakan masuk, dan jangan injak karpetnya dengan sepatu berlumpur."], { face: 1 });
    e("Pengawal Gerbang Istana Mael", "ekGuard", [CX + 3, PY1 - 1], ["Karpet itu ditenun dari serat daun perak. Satu helainya lebih berharga dari satu peti koin."], { face: -1 });
    // --- halaman istana ---
    e("Tabib Istana Mirelle", "ekHealer", [38, 20], [
      "Kristal di dekat sini bisa memulihkan HP dan Mana sepenuhnya. Isi dulu sebelum menjelajah.",
      wk("glowshroom"),
    ], { face: 1 });
    e("Juru Taman Elara", "ekGardener", [34, 22], ["Bunga di taman ini mekar sesuai bilangan genap dan ganjil bergantian. Cantik, bukan?"], { wander: 3 });
    e("Pelayan Istana Nuri", "ekKid", [52, 24], ["Kata Ibu, aku boleh jadi penjaga gerbang kalau sudah hafal tabel perkalian sampai dua belas!"], { wander: 3 });
    // --- kota ---
    e("Penjaga Gerbang Selatan Haldir", "ekGuard", [CX - 3, MH - 8], [
      "Dari sini jalan lurus ke utara menuju istana. Ke selatan, Gerbang Pohon membawamu kembali ke Hutan Elf Silvara.",
      "Hutan di luar sana penuh peri jahil. Peri kecil itu gemar mengacaukan angka.",
    ], { face: 1 });
    merchant("EK", "ekMerchant", [41, 52]);
    merchant("EK", "ekMerchant", [55, 52]);
    e("Pustakawan Eluned", "ekSage", [28, 52], [
      "Perpustakaan Agung kami menyimpan setiap soal yang pernah diajukan di Numeria. Sayang, tidak ada jawabannya, kamu harus menghitung sendiri.",
      wk("lightowl"),
    ], { wander: 2 });
    e("Kapten Pemanah Sylra", "ekRanger", [62, 52], [
      "Rubah perak di hutan itu licin. Sudut geraknya berpola, jadi pelajari geometri sebelum menghadapinya.",
      "Aku pernah menembak daun jatuh dari seratus langkah. Daunnya memang tidak melawan.",
    ], { wander: 2 });
    e("Penyanyi Elf Thessaly", "ekBard", [CX + 2, PLAZA_Y + 8], [
      "Lagu ini tentang sebuah pohon yang menumbuhkan satu cabang baru tiap bilangan prima. Belum selesai, pohonnya masih tumbuh.",
    ], { act: "music", face: -1 });
    e("Pengrajin Busur Haelen", "ekRanger", [CX - 6, PLAZA_Y + 5], [
      "Busurku dari kayu Pohon Dunia yang gugur sendiri. Kami tidak pernah menebang pohon hidup.",
    ], { face: 1 });
    e("Anak Elf Pip", "ekKid", [CX + 6, PLAZA_Y + 5], ["Kakak manusia! Telingamu bulat, lucu sekali! Boleh kupegang?"], { wander: 4 });
    e("Nelayan Elf Marwen", "nelayan", [9, 15], [
      "Ikan di telaga ini bercahaya perak waktu bulan purnama. Kalau kamu sabar, mereka akan datang sendiri.",
    ], { act: "fish", face: 1 });
    e("Penjaga Pohon Dunia Aldaron", "ekSage", [73, 16], [
      "Pohon ini sudah ada sebelum elf pertama lahir. Kalau kamu diam di bawahnya, daunnya berbisik hitungan.",
      "Ada yang bilang akarnya menjalar sampai ke Pegunungan Naga. Mungkin itu sebabnya naga dan elf berteman.",
    ], { face: -1 });
    e("Pandai Perak Eruwen", "pandai", [78, 59], [
      "Perak elf ditempa dingin, bukan dipanaskan. Aneh? Kami memang suka membuat orang bingung.",
    ], { face: -1 });
    e("Pemburu Kerajaan Caelum II", "ekRanger", [22, 59], [
      "Aku baru pulang dari Pegunungan Naga. Pos Penunggang Naga punya terowongan batu ke Pyraxis, kota para Drakonid. Mereka ramah, asal kamu tidak menghina Zerath.",
    ], { face: 1 });
    e("Anak Elf Nia", "ekKid", [CX, PLAZA_Y + 3], ["Aku mau jadi pemanah! Atau penyihir. Atau penjaga angka seperti Kakak!"], { wander: 4 });
    e("Penyihir Elf Nyssa", "ekMage", [86, 44], [
      "Kolam ini kuberi mantra penjernih. Airnya sebening kaca, tapi jangan diminum, rasanya seperti bunga.",
    ], { wander: 2 });
    // --- penjaga di gerbang luar (peta NE) dipasang di blok di bawah ---
  }

  /* ===================== 2) KERAJAAN DRAKONID PYRAXIS (96x76) ===================== */
  {
    const r = rng(9917),
      g = grid(MW, MH, "M");
    // kaldera: persegi dengan sudut dipangkas
    for (let y = 4; y <= MH - 5; y++)
      for (let x = 4; x <= MW - 5; x++) {
        const dx = Math.min(x - 4, MW - 5 - x),
          dy = Math.min(y - 4, MH - 5 - y);
        if (dx < 8 && dy < 8 && dx + dy < 8) continue;
        g[y][x] = ".";
      }
    border(g);
    // batu menjorok di tepi kaldera
    for (let i = 0; i < 26; i++) {
      const side = i % 4,
        t = 8 + Math.floor(r() * 72),
        d = 4 + Math.floor(r() * 3),
        [cx, cy] = side === 0 ? [t, d] : side === 1 ? [t, MH - 1 - d] : side === 2 ? [d, 10 + (t % 56)] : [MW - 1 - d, 10 + (t % 56)];
      for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4 + (i % 2)) put(g, cx + x, cy + y, "M");
    }
    // kolam lava hias
    box(g, 8, 9, 10, 6, "9");
    box(g, 78, 9, 10, 6, "9");
    box(g, 6, 68, 10, 3, "9");
    // parit lava mengelilingi benteng, jembatan obsidian di selatan
    box(g, PX0 - 3, PY0 - 3, PX1 - PX0 + 7, PY1 - PY0 + 7, "9");
    box(g, PX0 - 1, PY0 - 1, PX1 - PX0 + 3, PY1 - PY0 + 3, ".");
    box(g, CX - 1, PY1 + 2, 3, 2, "0");
    city(g, house);
    palace(g);
    carve(g, [[1, 40], [CX - 10, 40]], 1, ",", "M.T"); // terowongan batu dari gerbang barat menuju plaza
    // patung naga, perapian, patung di istana
    [[CX - 6, 14], [CX + 6, 14], [CX - 6, 22], [CX + 6, 22]].forEach(([x, y]) => put(g, x, y, "%"));
    [[37, 12], [59, 12], [37, 26], [59, 26], [CX - 2, PY1 + 4], [CX + 2, PY1 + 4]].forEach(([x, y]) => put(g, x, y, "7"));
    put(g, CX, PLAZA_Y + 5, "%");
    [[CX - 10, PLAZA_Y], [CX + 10, PLAZA_Y], [CX - 10, PLAZA_Y + 10], [CX + 10, PLAZA_Y + 10]].forEach(([x, y]) => put(g, x, y, "7"));
    // Sarang Telur Naga: halaman bertembok di timur plaza
    ring(g, 70, 36, 88, 46, "2");
    put(g, 70, 40, ".");
    put(g, 70, 41, ".");
    carve(g, [[59, 40], [69, 40]], 0, ",", "T.M");
    box(g, 71, 37, 17, 9, ".");
    [[74, 39], [78, 38], [82, 39], [75, 43], [80, 42], [84, 43]].forEach(([x, y]) => put(g, x, y, "&"));
    [[72, 37], [86, 37], [72, 45], [86, 45]].forEach(([x, y]) => put(g, x, y, "7"));
    // Altar Leluhur Zerath di ujung selatan jalan utama
    put(g, CX, MH - 5, "%");
    put(g, CX - 2, MH - 5, "3");
    put(g, CX + 2, MH - 5, "3");
    put(g, CX - 2, MH - 7, "7");
    put(g, CX + 2, MH - 7, "7");
    g[40][0] = "D"; // gerbang barat (ke terowongan Pos Penunggang Naga)
    const cs = [[36, 11], [60, 11], [36, 18], [60, 18], [36, 25], [60, 25]],
      cr = [[CX - 10, 19], [CX + 10, 19]],
      npcs = [
        [CX, PY0 + 3], [CX - 3, PY0 + 3], [CX + 3, PY0 + 3], [CX - 5, PY0 + 5], [CX + 5, PY0 + 5], [CX - 3, PY1 - 1], [CX + 3, PY1 - 1],
        [38, 20], [34, 22], [52, 24], [4, 41], [41, 52], [55, 52], [28, 52], [62, 52], [CX + 2, PLAZA_Y + 8], [CX - 6, PLAZA_Y + 5],
        [CX + 6, PLAZA_Y + 5], [78, 41], [86, 41], [78, 59], [22, 59], [CX, PLAZA_Y + 3], [CX, MH - 8], [20, 66],
      ];
    ensure(g, [3, 40], [...cs, ...cr, ...npcs, [CX, MH - 6]], "Pyraxis");
    MP.DK = { th: "dk", w: MW, h: MH, g: g.map((row) => row.join("")) };
    EN.DK = [
      pt(0, 40, "NG", DRAGON_GATE[0] - 1, DRAGON_GATE[1], [-1, 0]),
      ...cs.map((p, i) => chest("dk" + (i + 1), p, i + 6)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    const e = gn.bind(null, "DK");
    // --- aula takhta ---
    e("Raja Drakonid Pyrrhos Sisik Api", "dkKing", [CX, PY0 + 3], [
      "Selamat datang di Pyraxis, kerajaan para Drakonid. Kami lahir dari darah naga dan darah manusia, dan kami bangga pada keduanya.",
      "Leluhur kami adalah Zerath, Naga Emas penjaga puncak gunung. Dulu ia bijaksana. Kini amarah membuatnya menolak siapa pun, termasuk keturunannya sendiri.",
      "Kalau kamu harus melawan Zerath, lakukanlah dengan hormat. Kami tidak ingin ia hancur, hanya sadar kembali.",
      "Elf Elvandor di barat sahabat kami sejak Perang Api. Raja Valdorin selalu mengirim kayu harum untuk tungku kami.",
    ], { face: 1 });
    e("Ratu Drakonid Ignara", "dkQueen", [CX - 3, PY0 + 3], [
      "Telur-telur di Sarang Telur menetas setiap kelipatan tujuh hari. Kami menghitung harinya dengan cermat, satu hari terlambat bisa gawat.",
      "Kristal di halaman benteng menyala dari bara paling pertama kerajaan ini. Ia akan memulihkan tubuhmu.",
    ], { face: 1 });
    e("Pangeran Kaelith", "dkPrince", [CX + 3, PY0 + 3], [
      "Aku baru bisa menyemburkan asap, belum api. Kata Ayah, api datang kalau sudah pandai pembagian.",
      "Kamu manusia biasa tapi bisa mengalahkan wyvern? Keren! Ajari aku, ya!",
    ], { wander: 2 });
    e("Panglima Vorkas", "dkGeneral", [CX - 5, PY0 + 5], [
      "Pasukan Drakonid menjaga seluruh Pegunungan Naga dari jalur bawah sampai puncak.",
      wk("wyvern"),
      wk("lavagolem"),
      wk("stormeagle"),
    ], { face: 1 });
    e("Pengawal Takhta Draxar", "dkGuard", [CX + 5, PY0 + 5], ["Tombakku ditempa dari sisik ekor kakekku. Beliau tidak keberatan. Katanya."], { face: -1 });
    e("Penjaga Jembatan Obsidian Korr", "dkGuard", [CX - 3, PY1 - 1], ["Jembatan di depan benteng dilapisi kaca hitam. Jangan tergelincir ke parit, lavanya tidak punya rasa humor."], { face: 1 });
    e("Penjaga Jembatan Obsidian Zara", "dkGuard", [CX + 3, PY1 - 1], ["Manusia boleh masuk kalau membawa niat baik dan kepala dingin. Di sini panasnya sudah cukup."], { face: -1 });
    // --- halaman benteng ---
    e("Tabib Api Vessa", "dkMage", [38, 20], [
      "Kristal ini memulihkan HP dan Mana sepenuhnya. Sisik pun bisa beregenerasi kalau diberi waktu.",
      wk("lavagolem"),
    ], { face: 1 });
    e("Juru Masak Naga Brakka", "dkMerchant", [34, 22], ["Sup lava?! Bukan, itu sup tomat. Tapi kami memang suka yang pedas."], { wander: 3 });
    e("Bocah Drakonid Ember", "dkKid", [52, 24], ["Lihat, lihat! Aku bisa bikin asap dari hidung! Bagus, kan?"], { wander: 4 });
    // --- kota ---
    merchant("DK", "dkMerchant", [41, 52]);
    merchant("DK", "dkMerchant", [55, 52]);
    e("Penjaga Gerbang Terowongan Dorrak", "dkGuard", [4, 41], [
      "Di balik gerbang ini terowongan menuju Pos Penunggang Naga. Jarang ada manusia yang pulang-pergi tanpa nyasar.",
      "Kalau berpapasan dengan Zerath, ingat, ia leluhur kami. Hormati, tapi jangan mengalah.",
    ], { face: 1 });
    e("Pandai Sisik Ember", "dkSmith", [28, 52], [
      "Sisik yang rontok dari ekor kami adalah baja terbaik. Tapi hanya Drakonid yang tahan menempanya di api biru.",
      "Kenalanku, Pandai Besi Brunhild di pos pegunungan, belajar menempa dari kakekku. Salam untuknya, ya.",
    ], { face: 1 });
    e("Penunggang Naga Kharn", "dkRider", [62, 52], [
      "Aku menunggangi wyvern sejak umur sepuluh. Satu pelajaran: jangan pernah lupa pegangan, kecuali kamu mau belajar terbang sendiri.",
      "Elang petir di pegunungan itu cepat. Peluang kena sambarannya kecil, tapi sakitnya besar.",
    ], { wander: 2 });
    e("Penabuh Genderang Rhogar", "dkRider", [CX + 2, PLAZA_Y + 8], [
      "Dum, dum, dum! Satu pukulan untuk tiap bilangan genap. Kalau salah hitung, seluruh barisan genderang kacau!",
    ], { act: "music", face: -1 });
    e("Penjaga Patung Naga Varun", "dkGuard", [CX - 6, PLAZA_Y + 5], [
      "Patung di tengah plaza ini menggambarkan Zerath saat masih bersahabat dengan kami. Lihat, matanya bersinar kalau malam.",
    ], { face: 1 });
    e("Bocah Drakonid Zira", "dkKid", [CX + 6, PLAZA_Y + 5], ["Kakak manusia! Kamu nggak punya ekor? Pasti susah menjaga keseimbangan."], { wander: 4 });
    e("Penjaga Sarang Mirrha", "dkElder", [78, 41], [
      "Ssst, jangan keras-keras. Telur yang merah menetas jadi penyembur api, yang hijau jadi penerbang, yang kuning jadi penjaga harta.",
      "Setiap telur mendengar suara berhitung dari orang tuanya. Itu sebabnya anak Drakonid cepat belajar matematika.",
    ], { face: 1 });
    e("Pengasuh Telur Hesta", "dkKid", [86, 41], ["Aku bertugas menghitung telur tiap pagi. Hari ini ada enam. Semoga tidak ada yang kabur."], { wander: 3 });
    e("Tetua Vhalor", "dkElder", [78, 59], [
      "Dulu manusia pertama menolong seekor naga yang terluka. Dari rasa terima kasih itu lahirlah kami, Drakonid.",
      "Karena itu kami selalu terbuka bagi manusia yang baik. Tapi hati-hati dengan Gargoyle di jalur gunung. Mereka batu, jadi tidak bisa diajak bicara.",
      wk("gargoyle2"),
    ], { face: -1 });
    e("Penyihir Bara Sorrel", "dkMage", [22, 59], [
      "Aku mempelajari sihir api hasil pembagian: setiap bara dibagi rata ke seluruh tungku kota.",
      "Elang petir dan wyvern muda sering memanggil kami minta tolong. Padahal mereka yang mulai.",
    ], { wander: 2 });
    e("Bocah Pengamat Arlo", "dkKid", [CX, PLAZA_Y + 3], ["Aku tidak takut lava! ...Eh, sedikit takut. Tapi cuma sedikit."], { wander: 4 });
    e("Pendeta Leluhur Aurelia", "dkPriest", [CX, MH - 8], [
      "Ini Altar Leluhur Zerath. Setiap Drakonid datang ke sini untuk berterima kasih kepada Naga Emas yang pertama.",
      "Kalau suatu hari kamu berhasil menyadarkannya, datanglah ke sini dan ceritakan. Kami akan menyalakan seribu obor untukmu.",
    ], { face: 1 });
    e("Juru Tambang Gorra", "dkSmith", [20, 66], [
      "Aku menambang batu merah di kolam lava barat daya. Panasnya luar biasa, tapi batunya jadi bahan golem magma kalau lengah.",
      wk("lavagolem"),
    ], { wander: 2 });
  }

  /* ===================== PINTU MASUK DI DUNIA LUAR ===================== */
  // (1) Gerbang Pohon: celah di tembok pohon barat Desa Elf Silvara (peta NE)
  {
    const G = MP.NE,
      [gx, gy] = ELF_GATE,
      set = (x, y, c) => (G.g[y] = G.g[y].slice(0, x) + c + G.g[y].slice(x + 1));
    if (G) {
      for (let y = gy - 5; y <= gy + 5; y++) set(gx, y, "T"); // tembok pohon sepanjang celah
      for (let x = gx - 3; x < gx; x++) set(x, gy, "."); // jalan keluar sisi barat
      set(gx, gy, ",");
      set(gx + 1, gy, ",");
      delete G.mc;
      EN.NE.push(pt(gx, gy, "EK", CX, MH - 3, [0, -1], { kind: "arch", th: "ek" }));
      gn("NE", "Penjaga Gerbang Pohon Aranel", "ekGuard", [gx + 2, gy - 2], [
        "Di balik gerbang ini ada Elvandor, ibu kota para elf. Tamu yang berniat baik dipersilakan.",
        "Jangan lupa isi HP dan Mana di kristal desa sebelum masuk. Di dalam kota semuanya damai.",
      ], { face: -1 });
      gn("NE", "Penjaga Gerbang Pohon Belen", "ekGuard", [gx + 2, gy + 2], [
        "Raja Valdorin kakak dari Ratu Aelwyn. Dia sering menanyakan kabar desa ini lewat burung hantu.",
      ], { face: -1 });
    } else console.warn("[kerajaan] peta NE tidak ditemukan; Gerbang Pohon tidak dipasang.");
  }
  // (2) Gerbang Sisik: ujung terowongan batu di timur Pos Penunggang Naga (peta NG)
  {
    const G = MP.NG,
      [gx, gy] = DRAGON_GATE,
      set = (x, y, c) => (G.g[y] = G.g[y].slice(0, x) + c + G.g[y].slice(x + 1));
    if (G) {
      for (let x = TUNNEL_X[0]; x <= gx; x++) for (let y = gy - 1; y <= gy + 1; y++) set(x, y, ",");
      delete G.mc;
      EN.NG.push(pt(gx, gy, "DK", 2, 40, [1, 0], { kind: "arch", th: "dk" }));
      gn("NG", "Penjaga Terowongan Drakonid Sorn", "dkGuard", [TUNNEL_X[0] + 3, gy - 1], [
        "Terowongan ini menuju Pyraxis, kota kami. Jalannya lurus, tidak ada monster di dalamnya.",
        "Manusia yang baik boleh bertamu. Raja Pyrrhos senang mendengar kisah dari dunia luar.",
      ], { face: 1 });
    } else console.warn("[kerajaan] peta NG tidak ditemukan; Gerbang Sisik tidak dipasang.");
  }

  /* ---------- pesan masuk kerajaan ---------- */
  {
    const _hp = H.portal;
    H.portal = (e) => {
      _hp(e);
      if (e.to === "EK") say("Kerajaan Elf Elvandor. Aman: tidak ada monster di sini. Kristal di halaman istana memulihkan HP dan Mana.");
      else if (e.to === "DK") say("Kerajaan Drakonid Pyraxis. Aman: tidak ada monster di sini. Kristal di halaman benteng memulihkan HP dan Mana.");
    };
  }

  /* ---------- gambar gerbang: lengkung pohon bercahaya (elf) / lengkung batu bernyala (drakonid) ---------- */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      if (e.kind !== "arch") return _ent(e, t, bob);
      const X = e.x * 16,
        Y = e.y * 16 + OY,
        el = e.th === "ek",
        p = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t / 300),
        fl = (col, a, b, w, h) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, w, h);
        };
      ctx.globalAlpha = 0.18 + 0.18 * p;
      fl(el ? "#9af0c0" : "#ff7a32", -3, -10, 22, 28);
      ctx.globalAlpha = 1;
      fl("rgba(0,0,0,.3)", 0, 14, 16, 2);
      if (el) {
        fl("#e8f0e0", -2, -6, 4, 21); // tiang kiri
        fl("#e8f0e0", 14, -6, 4, 21);
        fl("#ffffff", -2, -6, 1, 21);
        fl("#e8f0e0", -2, -8, 20, 4); // lengkung atas
        fl("#2f8a5a", 0, -10, 16, 3); // daun
        fl("#4fc880", 2, -11, 3, 2);
        fl("#4fc880", 9, -11, 3, 2);
        fl("#e2b84a", -2, -4, 20, 1);
        ctx.globalAlpha = 0.3 + 0.3 * p;
        fl("#7cf0c8", 2, -4, 12, 18);
        ctx.globalAlpha = 1;
      } else {
        fl("#3a2a2e", -2, -6, 4, 21);
        fl("#3a2a2e", 14, -6, 4, 21);
        fl("#5a4046", -2, -6, 1, 21);
        fl("#4a3238", -3, -9, 22, 5);
        fl("#e8d8b0", -3, -13, 2, 5); // tanduk
        fl("#e8d8b0", 17, -13, 2, 5);
        fl("#e8a838", -3, -5, 22, 1);
        ctx.globalAlpha = 0.35 + 0.35 * p;
        fl("#ff7a32", 2, -4, 12, 18);
        ctx.globalAlpha = 1;
        fl("#ffd24a", 6, 6 - Math.round(3 * p), 4, 4);
      }
    };
  }

  /* ---------- suasana: kunang-kunang di Elvandor, bara beterbangan di Pyraxis ---------- */
  {
    const _wd = W.draw;
    W.draw = function (t) {
      _wd(t);
      if ((mp !== "EK" && mp !== "DK") || rm) return;
      ctx.save();
      for (let i = 0; i < 14; i++) {
        const el = mp === "EK",
          x = ((i * 79 + Math.sin(t / 700 + i) * 8 + (el ? t * 0.006 * (1 + (i % 3)) : 0)) % VW + VW) % VW | 0,
          y = el ? ((i * 53 + Math.sin(t / 500 + i * 2) * 6 + t * 0.004) % VH) | 0 : VH - ((t * 0.03 * (1 + (i % 3)) + i * 41) % (VH + 10)) | 0;
        ctx.globalAlpha = 0.3 + 0.4 * Math.sin(t / 250 + i);
        ctx.fillStyle = el ? "#fff6b0" : "#ff9a3a";
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.restore();
    };
  }

  /* ---------- peta mini ---------- */
  {
    const _m2 = mini2,
      BG = { ek: "#4c9c6c", dk: "#6a4a46" },
      COLS = {
        ek: { "#": "#10301f", T: "#1a6a40", w: "#2a6fd6", f: "#5aa8ff", ",": "#dce8d4", 2: "#e6eee8", 3: "#f2f6f0", 4: "#2f8a5a", 5: "#e2b84a", 6: "#4fb87a", 7: "#9af0c0", 8: "#2a8a52", 1: "#6a4a2a", "%": "#e8f0e8", E: "#6b3a1c", D: "#e2b84a", L: "#ffd166" },
        dk: { "#": "#1a0a0e", M: "#4a2a2a", 9: "#ff6a22", 0: "#2a2430", ",": "#4a3030", 2: "#6a3a3e", 3: "#2e2228", 4: "#8a1c2a", 5: "#e8a838", 6: "#4a2a2a", 7: "#ff9a3a", "%": "#7a5a5a", "&": "#e8c040", E: "#6b3a1c", D: "#e2b84a", T: "#5a3a2a" },
      };
    mini2 = function (id) {
      if (!KING(id)) return _m2(id);
      const m = MP[id];
      if (m.mc) return m.mc;
      const c = document.createElement("canvas"),
        k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d"),
        C = COLS[m.th];
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          k.fillStyle = C[ch] || BG[m.th];
          k.fillRect(x, y, 1, 1);
        }),
      );
      return (m.mc = c);
    };
  }
})();
