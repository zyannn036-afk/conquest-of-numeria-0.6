/* ===== Numeria Quest — Kerajaan Beast Ferakhan (kerajaan manusia binatang di utara) =====
   Dimuat PALING AKHIR (setelah kerajaan.js). Tidak mengubah file lain; semua dibungkus dari sini.
   Cara kerja singkat (mengikuti pola kerajaan.js):
   - Kerajaan ini adalah peta besar terpisah dengan id "BK" (bukan bagian dari peta dunia).
   - PINTU MASUK: "Gerbang Taring" di Altar Beast (peta "NB" = Hutan Beast Ferala), di balik punggung bukit
     yang dijaga Fenrix. Jadi pemain harus mengalahkan Fenrix dulu sebelum bisa masuk.
   - Isi kota (96 x 76 petak):
       * Istana Taring (dikelilingi sungai, ada jembatan kayu) dengan aula takhta, 6 peti harta, 2 kristal simpan
       * Plaza dengan patung Raja Singa, rumah-rumah kayu beratap jerami, 2 toko
       * Arena Taring (arena latihan petarung) di timur plaza
       * Kebun Wortel & Labu di barat plaza
       * Pohon Leluhur (daun emas) di timur laut, Kolam Bulan di barat laut
       * Batu Perjanjian di selatan (perjanjian tiga kerajaan: Elf, Drakonid, Beast)
   - Kerajaan ini AMAN: tidak ada monster acak. Pemulihan lewat kristal. Rajanya: Raja Singa Leonhart.
   - Warga bertelinga hewan dan berekor (dibuat dari mkRoyal + fungsi beast() di bawah).
   Bagian yang mudah diubah ada di blok "pengaturan" tepat di bawah ini. */
(function () {
  /* ---------- pengaturan yang mudah diubah ---------- */
  const BEAST_GATE = [96, 34], // petak gerbang di Altar Beast (peta NB); altar ada di x 86..97
    MW = 96, // lebar kerajaan (petak)
    MH = 76, // tinggi kerajaan
    CX = 48; // kolom tengah (jalan utama & takhta)

  /* ---------- nama wilayah & tema warna ---------- */
  Object.assign(MN, { BK: "Kerajaan Beast Ferakhan" });
  // a/b = warna lantai (kotak-kotak), w/w2 = tembok tepi, t/t2 = pohon
  Object.assign(TH, { bk: { a: "#6a9a4a", b: "#659444", w: "#1a2a12", w2: "#2c4220", t: "#3a6a28", t2: "#8acc5a" } });
  const isBK = (id) => id === "BK";

  /* ---------- bantu: nama monster & kelemahannya untuk dialog warga ---------- */
  const wk = (sp) => {
    const i = E.findIndex((m) => m.sp === sp);
    return i < 0 ? "" : `${E[i].n} lemah terhadap ${TN[E[i].weak]}.`;
  };

  /* ---------- sprite warga: manusia binatang (telinga hewan + ekor) ---------- */
  // Telinga & ekor hanya ditaruh di petak KOSONG ("."), jadi aman walau sprite memakai mahkota/helm.
  // Kode huruf: f = bulu telinga/ujung ekor, j = bagian dalam telinga, F = bulu ekor
  const EARS = {
    point: [[0, 3, "f"], [1, 2, "f"], [1, 3, "j"], [0, 12, "f"], [1, 13, "f"], [1, 12, "j"]], // kucing, rubah, serigala
    long: [[0, 3, "f"], [0, 4, "f"], [1, 3, "f"], [1, 4, "j"], [0, 11, "f"], [0, 12, "f"], [1, 12, "f"], [1, 11, "j"]], // kelinci
    round: [[0, 2, "f"], [0, 3, "f"], [1, 2, "f"], [1, 3, "j"], [0, 12, "f"], [0, 13, "f"], [1, 13, "f"], [1, 12, "j"]], // singa, beruang
  };
  function beast(sp, o = {}) {
    if (!sp) return sp;
    const m = sp.m.map((r) => r.split("")),
      set = (j, c, ch) => m[j] && m[j][c] === "." && (m[j][c] = ch);
    EARS[o.ear || "point"].forEach(([j, c, ch]) => set(j, c, ch));
    // ekor: baris 14-19 (kelinci: ekor bulat pendek di baris 15-16)
    (o.puff ? [15, 16] : [14, 15, 16, 17, 18, 19]).forEach((r, i) => {
      if (m[r] && m[r][14] === ".") {
        m[r][14] = i === 0 ? "f" : "F"; // ujung atas lebih terang
        if (m[r][15] === ".") m[r][15] = "K";
      }
    });
    sp.p = { f: o.fur, j: o.inner || "#f0a0b0", F: o.tail || o.fur, ...sp.p };
    sp.m = m.map((r) => r.join(""));
    return sp;
  }
  const mk = (pal, opt) => {
    try {
      return mkRoyal(pal, opt || {});
    } catch (e) {
      console.warn("[kerajaan_beast] mkRoyal tidak tersedia:", e && e.message);
      return null;
    }
  };
  // warna kulit/bulu wajah tiap jenis hewan (S = kulit, s = bayangan, E = mata)
  const FUR = {
    serigala: { S: "#c8c0b8", s: "#9a928a", E: "#ffd24d" },
    rubah: { S: "#f0b078", s: "#c8804a", E: "#7a3a1a" },
    kucing: { S: "#f0d0a0", s: "#c8a070", E: "#5ad88a" },
    kelinci: { S: "#fff0f0", s: "#e8c8d0", E: "#ff6a8a" },
    beruang: { S: "#b88a5a", s: "#8a5a30", E: "#2a1a0e" },
    singa: { S: "#f0c070", s: "#c8903a", E: "#7a4a10" },
    macan: { S: "#f0a850", s: "#c8782a", E: "#3a2210" },
  };
  const defs = {
    // ---- keluarga kerajaan ----
    bkKing: () => beast(mk({ H: "#e8a838", h: "#ffd070", A: "#e2b84a", a: "#a8782a", X: "#ff7a32", T: "#7a1c1c", t: "#4a1010", V: "#e2b84a", R: "#7a1c1c", ...FUR.singa }, { hat: "crown", cape: 1, long: 1 }), { ear: "round", fur: "#e8a838", inner: "#7a4a10", tail: "#c8782a" }),
    bkQueen: () => beast(mk({ H: "#e8892a", h: "#ffc070", A: "#e2b84a", a: "#a8782a", X: "#ff7a32", T: "#2f7a4a", t: "#1f5a38", V: "#ffe9b8", ...FUR.macan }, { hat: "tiara", long: 1, dress: 1 }), { ear: "point", fur: "#e8892a", inner: "#ffd0a0", tail: "#c8681a" }),
    bkPrince: () => beast(mk({ H: "#8a90a8", h: "#c8ccd8", T: "#5a6a8a", t: "#3a4868", V: "#e2b84a", P: "#3a3a4a", p: "#242430", ...FUR.serigala }, {}), { ear: "point", fur: "#8a90a8", inner: "#d8dce8", tail: "#6a7088" }),
    bkGeneral: () => beast(mk({ H: "#5e3a1c", A: "#8a8a92", a: "#5a5a62", X: "#e2b84a", T: "#7a1c1c", t: "#4a1010", V: "#e2b84a", P: "#4a3a2a", p: "#2e241a", R: "#7a1c1c", ...FUR.beruang }, { hat: "helm", cape: 1, spear: 1 }), { ear: "round", fur: "#8a5a30", inner: "#c89a6a", tail: "#6a4220" }),
    bkGuard: () => beast(mk({ H: "#8a90a8", A: "#a8a8b0", a: "#6a6a74", X: "#e2b84a", T: "#7a4a1c", t: "#4a2a10", V: "#e2b84a", P: "#4a4a54", p: "#2a2a32", O: "#3a2a1a", ...FUR.serigala }, { hat: "helm", spear: 1 }), { ear: "point", fur: "#9a9ca8", inner: "#d8dce8", tail: "#7a7c88" }),
    bkSage: () => beast(mk({ H: "#f4f0e8", M: "#ffffff", T: "#8a4a1c", t: "#5a2e10", V: "#e2b84a", P: "#3a2a1a", p: "#241810", ...FUR.rubah }, { beard: 1 }), { ear: "point", fur: "#e8742a", inner: "#ffe0c0", tail: "#d8641a" }),
    // ---- warga ----
    bkHealer: () => beast(mk({ H: "#ffffff", h: "#f4f4f4", T: "#f0fff4", t: "#c0e0c8", V: "#59d0a0", ...FUR.kelinci }, { long: 1 }), { ear: "long", fur: "#ffffff", inner: "#ffb0c0", tail: "#ffffff", puff: 1 }),
    bkShaman: () => beast(mk({ H: "#d0b0ff", T: "#6a3aa0", t: "#4a2a80", V: "#e8d0ff", P: "#3a2a50", p: "#241a38", ...FUR.kucing }, { long: 1 }), { ear: "point", fur: "#9a6ad0", inner: "#e8d0ff", tail: "#7a4ab0" }),
    bkRanger: () => beast(mk({ H: "#e8742a", h: "#ffb27a", T: "#3f6a3a", t: "#2a4a26", V: "#d8c070", P: "#5a4a2a", p: "#3a2e1a", R: "#3f6a3a", ...FUR.rubah }, { cape: 1 }), { ear: "point", fur: "#e8742a", inner: "#ffe0c0", tail: "#d8641a" }),
    bkHunter: () => beast(mk({ H: "#5a6a8a", h: "#8a96b0", T: "#4a5a3a", t: "#2e3a24", V: "#e2b84a", P: "#3a3a4a", p: "#242430", R: "#4a5a3a", ...FUR.serigala }, { cape: 1 }), { ear: "point", fur: "#6a7088", inner: "#c8ccd8", tail: "#505870" }),
    bkMerchantR: () => beast(mk({ H: "#f4f4f4", h: "#ffffff", T: "#f0d0e0", t: "#c8a0b8", V: "#7a4b2a", P: "#8a6a7a", p: "#5a4a5a", ...FUR.kelinci }, {}), { ear: "long", fur: "#f4f4f4", inner: "#ffb0c0", tail: "#ffffff", puff: 1 }),
    bkMerchantC: () => beast(mk({ H: "#e8a060", h: "#ffd0a0", T: "#d85a8a", t: "#a8305a", V: "#fff0f0", P: "#5a3a4a", p: "#3a2430", ...FUR.kucing }, {}), { ear: "point", fur: "#e8a060", inner: "#ffd0b0", tail: "#c88040" }),
    bkBard: () => beast(mk({ H: "#ffc8e0", h: "#fff0f8", T: "#f0d0f0", t: "#c8a0c8", V: "#e2b84a", P: "#6a4a6a", p: "#483048", ...FUR.kucing }, { long: 1 }), { ear: "point", fur: "#f0a0c0", inner: "#fff0f8", tail: "#d880a0" }),
    bkKidCat: () => beast(mk({ H: "#e8a060", h: "#ffd0a0", T: "#bfe8c8", t: "#8ac8a0", V: "#ffffff", P: "#8a6a4a", p: "#5a4630", ...FUR.kucing }, {}), { ear: "point", fur: "#e8a060", inner: "#ffd0b0", tail: "#c88040" }),
    bkKidRabbit: () => beast(mk({ H: "#f4f4f4", h: "#ffffff", T: "#ffe0a0", t: "#d8b870", V: "#ffffff", P: "#8a6a7a", p: "#5a4a5a", ...FUR.kelinci }, {}), { ear: "long", fur: "#ffffff", inner: "#ffb0c0", tail: "#ffffff", puff: 1 }),
    bkKidWolf: () => beast(mk({ H: "#8a90a8", h: "#c8ccd8", T: "#e08a4a", t: "#a85a2a", V: "#fff0d0", P: "#4a3030", p: "#2e1e1e", ...FUR.serigala }, {}), { ear: "point", fur: "#8a90a8", inner: "#d8dce8", tail: "#6a7088" }),
    bkSmith: () => beast(mk({ H: "#3a2210", A: "#6a5048", T: "#4a3430", t: "#2e201e", V: "#e2a040", P: "#2e2020", p: "#1a1212", ...FUR.beruang }, { hat: "scarf" }), { ear: "round", fur: "#8a5a30", inner: "#c89a6a", tail: "#6a4220" }),
    bkFarmer: () => beast(mk({ H: "#e8d0a0", h: "#fff0c8", T: "#8ac86a", t: "#5a9a40", V: "#e8d8a0", P: "#5a4a2a", p: "#3a2e1a", ...FUR.kelinci }, {}), { ear: "long", fur: "#e8d0a0", inner: "#ffb0c0", tail: "#f4ecd0", puff: 1 }),
    bkTrainer: () => beast(mk({ H: "#e8892a", h: "#ffc070", A: "#d8c8a0", a: "#a89870", X: "#e2b84a", T: "#a82a1a", t: "#701810", V: "#ffe9b8", P: "#3a2a1a", p: "#241810", ...FUR.macan }, { cape: 1 }), { ear: "point", fur: "#e8892a", inner: "#ffd0a0", tail: "#c8681a" }),
    bkElder: () => beast(mk({ H: "#e8e8e8", h: "#ffffff", M: "#ffffff", T: "#6a4a2a", t: "#4a3018", V: "#e2b84a", P: "#3a2a1a", p: "#241a10", ...FUR.serigala }, { beard: 1, cape: 1 }), { ear: "point", fur: "#d0d0d8", inner: "#ffffff", tail: "#b0b0b8" }),
    bkPriest: () => beast(mk({ H: "#fff4d0", h: "#ffffff", T: "#e8c050", t: "#b88a20", V: "#8a1c2a", P: "#8a6a20", p: "#5a4410", ...FUR.rubah }, { long: 1 }), { ear: "point", fur: "#f4b060", inner: "#fff0d0", tail: "#e89a40" }),
  };
  Object.keys(defs).forEach((k) => {
    const s = defs[k]();
    SP[k] = s || SP.pria || SP[Object.keys(SP)[0]]; // kalau mkRoyal tidak ada, pakai sprite warga biasa
  });

  /* ---------- petak (tile) kerajaan ---------- */
  // Petak memakai huruf yang sama dengan kerajaan.js (1234567890%&), tapi digambar berbeda khusus tema "bk":
  // 2 tembok istana kayu, 3 tiang totem, 4 karpet kulit macan, 5 takhta singa, 6 rumah kayu beratap jerami,
  // 7 obor, 8 daun emas Pohon Leluhur, 1 batang Pohon Leluhur, 9 sungai (tidak bisa dilewati),
  // 0 jembatan kayu (bisa dilewati), % patung singa, & kebun wortel/labu. Jalan (,) digambar khusus.
  const BT = ",1234567890%&", // huruf yang digambar ulang untuk tema bk
    BSOLID = "12356789%&"; // 4 (karpet) dan 0 (jembatan) bisa dilewati
  TILEX += ","; // jaga-jaga: pastikan jalan (,) ikut digambar lewat tileX
  {
    const _tx = tileX;
    tileX = function (c, X, Y, x, y, th, t) {
      if (th !== "bk" || !BT.includes(c)) return _tx(c, X, Y, x, y, th, t);
      const g = MP[mp].g,
        at = (i, j) => (g[j] || "")[i],
        up = at(x, y - 1),
        dn = at(x, y + 1),
        lf = at(x - 1, y),
        rt = at(x + 1, y),
        fl = (col, a, b, w, h) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, w, h);
        },
        flr = () => fl((x + y) & 1 ? TH.bk.a : TH.bk.b, 0, 0, 16, 16), // lantai rumput
        pulse = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t / 300 + x * 2 + y);
      if (c === ",") {
        // jalan tanah dengan jejak kaki hewan sesekali
        fl("#c9a468", 0, 0, 16, 16);
        fl("#b88f52", (x + y) % 2 ? 0 : 8, 0, 1, 16);
        fl("#b88f52", 0, (x + y) % 2 ? 8 : 0, 16, 1);
        fl("#9a7640", ((x * 5) % 10) + 2, ((y * 7) % 10) + 2, 2, 2);
        if ((x * 3 + y * 5) % 11 === 0) {
          [[4, 8], [7, 6], [10, 8]].forEach(([a, b]) => fl("#8a6a38", a, b, 2, 2));
          fl("#8a6a38", 6, 10, 4, 3);
        }
      } else if (c === "2") {
        // tembok istana: kayu tebal, atap merah dengan taring putih
        const top = up !== "2";
        fl("#a8784a", 0, 0, 16, 16);
        let y0 = 0;
        if (top) {
          fl("#7a2a2a", 0, 0, 16, 7);
          fl("#b04a3a", 0, 1, 16, 1);
          fl("#b04a3a", 0, 4, 16, 1);
          fl("#e2b84a", 0, 6, 16, 1);
          [1, 7, 13].forEach((i) => fl("#f4ecd0", i, 0, 2, 3)); // taring di atap
          y0 = 7;
        }
        fl("#6a4a2a", 0, y0 + 4, 16, 1);
        fl("#6a4a2a", 0, y0 + 9, 16, 1);
        fl("#6a4a2a", x % 2 ? 4 : 10, y0, 1, 4);
        fl("#6a4a2a", x % 2 ? 10 : 4, y0 + 5, 1, 4);
        if ((up === "2" && dn === "2" && y % 3 === 1) || (top && x % 4 === 1)) {
          const wy = top ? 9 : 3; // jendela bercahaya hangat
          fl("#2a1a0e", 6, wy, 4, 7);
          ctx.globalAlpha = 0.5 + 0.4 * pulse;
          fl("#ffd890", 7, wy + 1, 2, 5);
          ctx.globalAlpha = 1;
        }
        if (dn !== "2") fl("#6a4a2a", 0, 13, 16, 3);
        if (lf !== "2") fl("#6a4a2a", 0, y0, 1, 16 - y0);
        if (rt !== "2") fl("#6a4a2a", 15, y0, 1, 16 - y0);
      } else if (c === "3") {
        // tiang totem berukir wajah hewan
        flr();
        fl("rgba(0,0,0,.25)", 2, 14, 12, 2);
        fl("#5a3a1c", 3, 12, 10, 3);
        fl("#8a5a30", 5, 2, 6, 11);
        fl("#a8743c", 5, 2, 2, 11);
        fl("#5a3a1c", 9, 2, 2, 11);
        fl("#e2b84a", 4, 0, 8, 3);
        ctx.globalAlpha = 0.6 + 0.4 * pulse;
        fl("#fff6d0", 6, 5, 1, 2);
        fl("#fff6d0", 9, 5, 1, 2);
        ctx.globalAlpha = 1;
        fl("#d83a2a", 6, 9, 4, 1);
      } else if (c === "4") {
        // karpet kulit macan (garis hitam), tepi emas
        fl("#d8842a", 0, 0, 16, 16);
        if (lf !== "4") fl("#e2b84a", 0, 0, 2, 16);
        if (rt !== "4") fl("#e2b84a", 14, 0, 2, 16);
        fl("#3a2210", 4 + ((x + y) % 2) * 4, 2, 2, 5);
        fl("#3a2210", 6 - ((x + y) % 2) * 4, 9, 2, 5);
      } else if (c === "5") {
        // takhta kayu dengan surai singa emas
        flr();
        fl("rgba(0,0,0,.25)", 1, 14, 14, 2);
        fl("#5a3a1c", 3, 0, 10, 11);
        fl("#e8a838", 2, 0, 12, 3);
        fl("#e8a838", 1, 2, 2, 7);
        fl("#e8a838", 13, 2, 2, 7);
        fl("#8a1c1c", 5, 3, 6, 8);
        ctx.globalAlpha = 0.5 + 0.4 * pulse;
        fl("#fff0b0", 7, 5, 2, 2);
        ctx.globalAlpha = 1;
        fl("#7a5a3a", 1, 10, 14, 4);
        fl("#e2b84a", 1, 14, 14, 2);
      } else if (c === "6") {
        if (up !== "6") {
          // atap jerami
          fl("#c8a050", 0, 0, 16, 16);
          for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) fl("#e2c078", i * 4 + (j % 2) * 2 - 1, j * 4 + 1, 3, 2);
          fl("#8a6a30", 0, 14, 16, 2);
          fl("#e2c078", 0, 0, 16, 1);
        } else {
          // dinding papan kayu
          fl("#9a7048", 0, 0, 16, 16);
          fl("#6a4a2a", 0, 0, 1, 16);
          fl("#6a4a2a", 15, 0, 1, 16);
          fl("#7a5632", 5, 0, 1, 16);
          fl("#7a5632", 10, 0, 1, 16);
          if ((x + y) % 2 && dn === "6") {
            fl("#6a4a2a", 4, 3, 8, 7);
            ctx.globalAlpha = 0.6 + 0.4 * pulse;
            fl("#ffd890", 5, 4, 6, 5);
            ctx.globalAlpha = 1;
          }
          if (dn !== "6") fl("#6a4a2a", 0, 13, 16, 3);
        }
      } else if (c === "7") {
        // obor tegak dengan api bergoyang
        flr();
        fl("rgba(0,0,0,.25)", 3, 14, 10, 2);
        fl("#6a4a2a", 7, 6, 2, 9);
        fl("#3a2a1a", 5, 5, 6, 3);
        const h = rm ? 5 : 4 + Math.round(2 * Math.sin(t / 110 + x * 3));
        ctx.globalAlpha = 0.2 + 0.15 * pulse;
        fl("#ffb35a", 1, -4, 14, 14);
        ctx.globalAlpha = 1;
        fl("#ff6a22", 5, 5 - h, 6, h);
        fl("#ffd24a", 6, 5 - h + 2, 4, h - 2);
      } else if (c === "8") {
        // daun emas Pohon Leluhur
        fl("#d88a20", 0, 0, 16, 16);
        for (let k = 0; k < 4; k++) fl(k % 2 ? "#f8c850" : "#b86a14", (x * 7 + k * 5 + y * 3) % 13, (y * 5 + k * 7 + x) % 13, 3, 2);
        if (up !== "8") fl("#f8c850", 0, 0, 16, 2);
        if (lf !== "8" && lf !== "1") fl("#b86a14", 0, 0, 2, 16);
        if (rt !== "8" && rt !== "1") fl("#b86a14", 14, 0, 2, 16);
        if (dn !== "8" && dn !== "1") fl("#b86a14", 0, 14, 16, 2);
        ctx.globalAlpha = 0.4 + 0.4 * pulse;
        fl("#fff6b0", ((x * 5 + y * 3) % 12) + 1, ((y * 7 + x) % 12) + 1, 2, 2);
        ctx.globalAlpha = 1;
      } else if (c === "1") {
        // batang Pohon Leluhur
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
        // sungai: air biru dengan riak bergerak
        const edge = (n) => n !== "9" && n !== "0";
        fl("#2a6fd6", 0, 0, 16, 16);
        const w = rm ? 0 : Math.sin(t / 400 + x * 1.7 + y * 1.1);
        fl("#6ab0ff", 1 + Math.round(w * 2), 3, 7, 1);
        fl("#6ab0ff", 7 - Math.round(w * 2), 10, 7, 1);
        if (edge(up)) fl("#1a4a96", 0, 0, 16, 2);
        if (edge(dn)) fl("#1a4a96", 0, 14, 16, 2);
        if (edge(lf)) fl("#1a4a96", 0, 0, 2, 16);
        if (edge(rt)) fl("#1a4a96", 14, 0, 2, 16);
      } else if (c === "0") {
        // jembatan kayu dengan pagar di sisi sungai
        fl("#8a5a30", 0, 0, 16, 16);
        for (let j = 0; j < 16; j += 4) fl("#5a3a1c", 0, j + 3, 16, 1);
        if (lf === "9") fl("#5a3a1c", 0, 0, 2, 16);
        if (rt === "9") fl("#5a3a1c", 14, 0, 2, 16);
        if (up === "9") fl("#5a3a1c", 0, 0, 16, 2);
        if (dn === "9") fl("#5a3a1c", 0, 14, 16, 2);
      } else if (c === "%") {
        // patung singa dari batu
        flr();
        fl("rgba(0,0,0,.25)", 2, 14, 13, 2);
        fl("#7a7a80", 2, 12, 12, 4);
        fl("#a8a8b0", 4, 6, 8, 7);
        fl("#8a8a92", 3, 2, 2, 7);
        fl("#8a8a92", 11, 2, 2, 7);
        fl("#c8c8d0", 5, 2, 6, 5);
        fl("#c8c8d0", 5, 1, 2, 2);
        fl("#c8c8d0", 9, 1, 2, 2);
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        fl("#ffb020", 6, 4, 1, 1);
        fl("#ffb020", 9, 4, 1, 1);
        ctx.globalAlpha = 1;
      } else if (c === "&") {
        // kebun: tanah bergaris, wortel atau labu
        fl("#5a3a1e", 0, 0, 16, 16);
        fl("#4a2e16", 0, 3, 16, 2);
        fl("#4a2e16", 0, 9, 16, 2);
        if ((x + y) % 2) {
          for (let i = 0; i < 4; i++) {
            fl("#4aa83a", 1 + i * 4, 1, 3, 3);
            fl("#e88a2a", 2 + i * 4, 4, 1, 2);
            fl("#4aa83a", 1 + i * 4, 8, 3, 3);
            fl("#e88a2a", 2 + i * 4, 11, 1, 2);
          }
        } else {
          [[2, 2], [9, 3], [4, 9], [11, 10]].forEach(([a, b]) => {
            fl("#e8782a", a, b, 4, 4); // labu
            fl("#3a7a2a", a + 1, b - 1, 1, 1);
          });
        }
      }
    };
    // lantai: rumput, bunga liar (Ferakhan)
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (th === "bk") {
        if ((x * 7 + y * 13) % 23 === 0) {
          ctx.fillStyle = "#3d7a2a";
          ctx.fillRect(X + 7, Y + 8, 1, 4);
          ctx.fillStyle = ["#ffe9a0", "#ffb070", "#ffffff", "#ffd0e0"][(x + y) % 4];
          ctx.fillRect(X + 6, Y + 6, 3, 3);
        } else if ((x * 5 + y * 9) % 7 === 0) {
          ctx.fillStyle = "#4a8a30";
          ctx.fillRect(X + 3 + ((x * 3) % 8), Y + 9, 1, 3);
          ctx.fillRect(X + 4 + ((x * 3) % 8), Y + 10, 1, 2);
        }
      } else _bd(th, X, Y, x, y);
    };
    // petak yang tidak bisa dilewati (hanya di Ferakhan)
    const _solid = solid;
    solid = (x, y) => _solid(x, y) || (isBK(mp) && BSOLID.includes((MP[mp].g[y] || "")[x] || " "));
  }

  /* ---------- musik sintetis (nada:lama), irama ala genderang suku ---------- */
  {
    const seq = (s, d = 1) =>
      s.trim().split(/\s+/).map((t) => {
        const [n, b] = t.split(":");
        return [n === "-" ? null : n, b ? +b : d];
      });
    SND.tracks.BK = {
      bpm: 100,
      v: [
        { w: "triangle", g: 0.1, n: seq("D4:1 F4:1 G4:2 A4:1 G4:1 F4:2 D4:1 F4:1 A4:2 C5:2 A4:1 G4:1") },
        { w: "triangle", g: 0.13, n: seq("D2:2 D2:2 A2:2 A2:2 C3:2 C3:2 G2:2 G2:2") },
        { w: "square", g: 0.022, n: seq("D3 A3 D4 A3 C3 G3 C4 G3 A#2 F3 A#3 F3 C3 G3 C4 G3", 0.5) },
      ],
    };
  }

  /* ---------- alat bantu membuat peta ---------- */
  const SOLIDALL = "#TwBDLfSEMCRPQUZHemGlk" + BSOLID,
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
    forest = (g, p, r) => g.forEach((row, y) => row.forEach((c, x) => c === "." && inb(g, x, y) && r() < p && (row[x] = "T"))),
    // buang pohon di persegi; keep = peluang pohon tetap berdiri (0 = semua pohon dibuang)
    thin = (g, r, x0, y0, x1, y1, keep) => {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (inb(g, x, y) && g[y][x] === "T" && r() >= keep) g[y][x] = ".";
    },
    // jalan: garis lurus antar titik, selebar 2*hw+1 petak (over = petak yang boleh ditimpa)
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
      if (!near(t)) console.warn(`[kerajaan_beast] ${tag}: titik belum terjangkau`, t);
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
    // cari petak kosong terdekat dari titik yang diminta (radius 0..4)
    for (let r = 0; r <= 4 && !best; r++)
      for (let dy = -r; dy <= r && !best; dy++)
        for (let dx = -r; dx <= r && !best; dx++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(e.x + dx, e.y + dy)) best = [e.x + dx, e.y + dy];
    if (!best) return console.warn("[kerajaan_beast] NPC tidak muat", e.d && e.d[0], e.x, e.y);
    [e.x, e.y] = best;
    e.fx = Object.assign({ face: 1, ox: 0, oy: 0, tm: R(10, 80), go: 0, ph: R(0, 1), home: [e.x, e.y] }, e.fx || {});
    EL.push(e);
  }
  const gn = (map, who, sp, [x, y], lines, fx, more) =>
      spawn(map, { t: "npc", id: "gen", d: [who, lines.filter(Boolean)], sp, x, y, fx: fx || {}, ...more }),
    merchant = (map, sp, [x, y]) => spawn(map, { t: "npc", id: "toko", sp, x, y, fx: {} }); // id "toko" = buka toko

  /* ---------- tata letak kota (sama dengan kerajaan Elf & Drakonid agar konsisten) ---------- */
  const PX0 = 33, // cincin tembok istana
    PX1 = 63,
    PY0 = 7,
    PY1 = 30,
    PLAZA_Y = 35, // plaza: 21 x 11 petak di bawah istana
    ROWS = [49, 56, 63], // baris rumah (jalan ada 3 petak di bawah tiap baris)
    HW = [9, 16, 23, 30], // rumah sisi barat
    HE = [62, 69, 76, 83]; // rumah sisi timur

  // istana: cincin tembok, 4 menara, gerbang selatan, karpet ke takhta, tiang totem
  function palace(g) {
    ring(g, PX0, PY0, PX1, PY1, "2");
    [[PX0 - 1, PY0 - 1], [PX1 - 3, PY0 - 1], [PX0 - 1, PY1 - 3], [PX1 - 3, PY1 - 3]].forEach(([x, y]) => box(g, x, y, 5, 5, "2"));
    [CX - 1, CX, CX + 1].forEach((x) => put(g, x, PY1, "4")); // pintu gerbang istana
    put(g, CX - 2, PY1, "3");
    put(g, CX + 2, PY1, "3");
    box(g, CX - 1, PY0 + 3, 3, PY1 - PY0 - 3, "4"); // karpet dari gerbang ke takhta
    box(g, CX - 5, PY0 + 1, 11, 3, "4"); // panggung takhta
    put(g, CX, PY0 + 1, "5"); // takhta
    [PY0 + 6, PY0 + 10, PY0 + 14, PY0 + 18, PY0 + 22].forEach((y) => {
      put(g, CX - 3, y, "3");
      put(g, CX + 3, y, "3");
    });
  }
  // plaza + deretan rumah + jalan
  function city(g) {
    carve(g, [[CX, PY1 + 1], [CX, MH - 5]], 1, ",", "T.M"); // jalan utama
    box(g, CX - 10, PLAZA_Y, 21, 11, ","); // plaza
    ROWS.forEach((y) => {
      carve(g, [[6, y + 3], [MW - 7, y + 3]], 0, ",", "T."); // jalan di depan rumah
      [...HW, ...HE].forEach((x) => house(g, x, y));
    });
  }

  /* ===================== KERAJAAN BEAST FERAKHAN (96x76) ===================== */
  {
    const r = rng(7733),
      g = grid(MW, MH, ".");
    forest(g, 0.34, r);
    border(g);
    thin(g, r, 28, 2, 68, PLAZA_Y - 1, 0); // halaman istana bebas pohon
    thin(g, r, 4, PLAZA_Y, MW - 5, MH - 5, 0.12); // kota: pohon jarang
    thin(g, r, 62, 4, 84, 20, 0); // halaman Pohon Leluhur
    thin(g, r, 3, 4, 22, 17, 0); // sekitar Kolam Bulan
    box(g, 6, 7, 12, 7, "w"); // Kolam Bulan
    // Pohon Leluhur: tajuk membulat + batang
    for (let y = 8; y <= 12; y++) {
      const ins = y === 8 || y === 12 ? 2 : y === 9 || y === 11 ? 1 : 0;
      for (let x = 68 + ins; x <= 78 - ins; x++) put(g, x, y, "8");
    }
    box(g, 72, 13, 3, 2, "1");
    // Kebun Wortel & Labu di barat plaza (dua petak ladang, jalan tanah di antaranya)
    thin(g, r, 4, 34, 28, 47, 0);
    box(g, 7, 36, 17, 3, "&");
    box(g, 7, 42, 17, 3, "&");
    carve(g, [[CX - 10, 40], [6, 40]], 0, ",", "T.M");
    // sungai mengelilingi istana, jembatan kayu di selatan
    box(g, PX0 - 3, PY0 - 3, PX1 - PX0 + 7, PY1 - PY0 + 7, "9");
    box(g, PX0 - 1, PY0 - 1, PX1 - PX0 + 3, PY1 - PY0 + 3, ".");
    box(g, CX - 1, PY1 + 2, 3, 2, "0");
    city(g);
    carve(g, [[CX, MH - 5], [CX, MH - 2]], 1, ",", "T."); // jalan sampai gerbang selatan
    palace(g);
    // taman istana: kolam kecil dan obor
    [[40, 22], [56, 22]].forEach(([x, y]) => put(g, x, y, "f"));
    [[37, 12], [59, 12], [37, 26], [59, 26]].forEach(([x, y]) => put(g, x, y, "7"));
    // plaza: patung Raja Singa di tengah, totem, obor
    put(g, CX, PLAZA_Y + 5, "%");
    [[CX - 5, PLAZA_Y + 2], [CX + 5, PLAZA_Y + 2], [CX - 5, PLAZA_Y + 8], [CX + 5, PLAZA_Y + 8]].forEach(([x, y]) => put(g, x, y, "3"));
    [[CX - 10, PLAZA_Y], [CX + 10, PLAZA_Y], [CX - 10, PLAZA_Y + 10], [CX + 10, PLAZA_Y + 10]].forEach(([x, y]) => put(g, x, y, "7"));
    // Arena Taring: halaman bertembok di timur plaza, 6 totem latihan, obor di sudut
    ring(g, 70, 36, 88, 46, "2");
    put(g, 70, 40, ".");
    put(g, 70, 41, ".");
    carve(g, [[59, 40], [69, 40]], 0, ",", "T.M");
    box(g, 71, 37, 17, 9, ".");
    [[76, 39], [80, 39], [84, 39], [76, 43], [80, 43], [84, 43]].forEach(([x, y]) => put(g, x, y, "3"));
    [[72, 37], [86, 37], [72, 45], [86, 45]].forEach(([x, y]) => put(g, x, y, "7"));
    // Batu Perjanjian di ujung selatan jalan utama (tiga kerajaan bersahabat)
    put(g, CX, MH - 5, "%");
    put(g, CX - 2, MH - 5, "3");
    put(g, CX + 2, MH - 5, "3");
    put(g, CX - 2, MH - 7, "7");
    put(g, CX + 2, MH - 7, "7");
    g[MH - 1][CX] = "D"; // gerbang selatan (ke Altar Beast)

    const cs = [[36, 11], [60, 11], [36, 18], [60, 18], [36, 25], [60, 25]], // peti harta di ruang istana
      cr = [[CX - 10, 19], [CX + 10, 19]], // kristal simpan di halaman istana
      npcs = [
        [CX, PY0 + 3], [CX - 3, PY0 + 3], [CX + 3, PY0 + 3], [CX - 5, PY0 + 5], [CX + 5, PY0 + 5], [CX - 3, PY1 - 1], [CX + 3, PY1 - 1],
        [38, 20], [34, 22], [52, 24], [CX - 3, MH - 8], [41, 52], [55, 52], [28, 52], [62, 52], [CX + 2, PLAZA_Y + 8], [CX - 6, PLAZA_Y + 5],
        [CX + 6, PLAZA_Y + 5], [9, 15], [73, 16], [78, 59], [22, 59], [CX, PLAZA_Y + 3], [78, 41], [86, 41], [12, 41], [20, 39], [CX, MH - 8],
      ];
    [...cs, ...cr, ...npcs].forEach(([x, y]) => thin(g, () => 1, x - 1, y - 1, x + 1, y + 1, 0)); // bersihkan pohon di sekitar titik penting
    ensure(g, [CX, MH - 3], [...cs, ...cr, ...npcs, [CX, MH - 2]], "Ferakhan");
    MP.BK = { th: "bk", w: MW, h: MH, g: g.map((row) => row.join("")) };
    EN.BK = [
      pt(CX, MH - 1, "NB", BEAST_GATE[0] - 1, BEAST_GATE[1], [-1, 0]),
      ...cs.map((p, i) => chest("bk" + (i + 1), p, i + 8)),
      ...cr.map(([x, y]) => ({ t: "crystal", x, y })),
    ];
    const e = gn.bind(null, "BK");
    // --- aula takhta ---
    e("Raja Singa Leonhart Surai Emas", "bkKing", [CX, PY0 + 3], [
      "Selamat datang di Ferakhan, ibu kota para manusia binatang. Aku Leonhart, Raja Singa, pemimpin seluruh suku di utara.",
      "Serigala, macan, kucing, rubah, kelinci, beruang... kami berbeda-beda, tapi kami satu kawanan. Itu aturan pertama kerajaan ini.",
      "Kepala suku Garrok dari Desa Ferala itu sepupuku. Dia bilang ada Penjaga Angka yang berhasil melewati Fenrix. Aku ingin melihatnya sendiri.",
      "Fenrix bukan musuh kami. Dia penjaga altar yang menguji siapa saja yang lewat. Hanya yang pandai membagi yang dia hormati.",
      "Raja Valdorin dari Elvandor dan Raja Pyrrhos dari Pyraxis adalah sahabatku. Tiga raja, tiga kerajaan, satu perjanjian. Kamu bisa membacanya di Batu Perjanjian, di selatan kota.",
    ], { face: 1 });
    e("Ratu Macan Kyara", "bkQueen", [CX - 3, PY0 + 3], [
      "Kristal di halaman istana ditanam dari batu pertama yang ditemukan leluhur kami. Sentuhlah kalau tubuhmu lelah, ia memulihkan HP dan Mana sepenuhnya.",
      "Anak-anak Ferakhan belajar berhitung sambil berlari. Setiap loncatan dihitung, setiap langkah dicatat. Ajaklah mereka bermain di plaza.",
    ], { face: 1 });
    e("Pangeran Lupin", "bkPrince", [CX + 3, PY0 + 3], [
      "Aku baru bisa melolong kecil, belum bisa melolong besar. Kata Ayah, lolongan besar datang kalau sudah pandai perkalian.",
      "Serigala hijau di hutan itu sepupu jauhku, tapi mereka nakal sekali. " + wk("forestwolf"),
    ], { wander: 2 });
    e("Jenderal Beruang Brogar", "bkGeneral", [CX - 5, PY0 + 5], [
      "Pasukan Ferakhan menjaga seluruh hutan utara dari gerbang selatan sampai altar. Kami kuat, tapi kami tidak suka berkelahi tanpa alasan.",
      wk("bear"),
      wk("tiger"),
    ], { face: 1 });
    e("Tetua Rubah Kitsura", "bkSage", [CX + 5, PY0 + 5], [
      "Ekorku dulu sembilan, sekarang tinggal satu. Sisanya hilang karena salah menghitung hari. Pelajaran: selalu periksa ulang hitunganmu.",
      "Fenrix Alfa Pembagi menjaga altar sejak sebelum kerajaan ini berdiri. " + wk("fenrix"),
    ], { face: -1 });
    e("Pengawal Takhta Garu", "bkGuard", [CX - 3, PY1 - 1], [
      "Aula takhta terbuka untuk tamu yang sopan. Silakan masuk, tapi jangan tarik ekor siapa pun.",
    ], { face: 1 });
    e("Pengawal Takhta Rakka", "bkGuard", [CX + 3, PY1 - 1], [
      "Karpet itu dari kulit macan tua yang sudah pensiun. Beliau sendiri yang menghadiahkannya. Katanya.",
    ], { face: -1 });
    // --- halaman istana ---
    e("Tabib Istana Lilya", "bkHealer", [38, 20], [
      "Kristal di dekat sini bisa memulihkan HP dan Mana sepenuhnya. Isi dulu sebelum menjelajah lagi.",
      wk("glowshroom"),
    ], { face: 1 });
    e("Dukun Roh Miara", "bkShaman", [34, 22], [
      "Roh hutan sering membisikkan angka kepadaku. Kemarin mereka berbisik tujuh kali tujuh, tapi aku lupa hasilnya. Maaf.",
    ], { wander: 3 });
    e("Pelayan Istana Rufi", "bkKidWolf", [52, 24], [
      "Kata Ibu, aku boleh jadi pengawal takhta kalau sudah bisa melolong tiga kali berturut-turut tanpa serak!",
    ], { wander: 3 });
    // --- kota ---
    e("Penjaga Gerbang Selatan Ruud", "bkGuard", [CX - 3, MH - 8], [
      "Dari sini jalan lurus ke utara menuju istana. Ke selatan, Gerbang Taring membawamu kembali ke Altar Beast di Hutan Ferala.",
      "Hutan di luar sana penuh serigala dan macan tutul. Hati-hati kalau kamu pergi sendirian.",
    ], { face: 1 });
    merchant("BK", "bkMerchantR", [41, 52]);
    merchant("BK", "bkMerchantC", [55, 52]);
    e("Penyimpan Kisah Ninelle", "bkSage", [28, 52], [
      "Balai Kisah kami menyimpan semua cerita dari tiap suku. Ada kisah tentang serigala yang belajar berhitung dan jadi raja. Katanya itu kisah nyata.",
      wk("pixie"),
    ], { wander: 2 });
    e("Kapten Pemburu Fang", "bkHunter", [62, 52], [
      "Beruang itu lamban kalau kamu tahu celahnya, dan macan tutul itu licin kalau kamu tidak tahu pola totolnya.",
      wk("bear"),
      wk("tiger"),
    ], { wander: 2 });
    e("Penyanyi Kucing Sora", "bkBard", [CX + 2, PLAZA_Y + 8], [
      "Lagu ini tentang seekor kucing yang menghitung bintang. Belum selesai, bintangnya masih banyak.",
    ], { act: "music", face: -1 });
    e("Pengrajin Totem Brum", "bkSmith", [CX - 6, PLAZA_Y + 5], [
      "Tiap totem di plaza diukir satu wajah hewan. Kalau kamu hitung semuanya, jumlahnya selalu genap. Aku sengaja.",
    ], { face: 1 });
    e("Anak Kucing Pipi", "bkKidCat", [CX + 6, PLAZA_Y + 5], [
      "Kakak manusia, telingamu bulat dan tidak punya ekor! Boleh aku pegang?",
    ], { wander: 4 });
    e("Nelayan Pak Dodo", "nelayan", [9, 15], [
      "Aku manusia, tapi sudah dua puluh tahun tinggal di Ferakhan. Ikan di Kolam Bulan ini besar-besar kalau bulan purnama.",
    ], { act: "fish", face: 1 });
    e("Penjaga Pohon Leluhur Haldor", "bkElder", [73, 16], [
      "Pohon ini ditanam oleh leluhur pertama kami. Daunnya berubah emas setiap musim gugur, dan tidak pernah rontok.",
      "Kata orang, akarnya menyambung ke Pohon Dunia di Elvandor. Mungkin itu sebabnya kami dan elf selalu akur.",
    ], { face: -1 });
    e("Pandai Besi Beruang Grunt", "bkSmith", [78, 59], [
      "Besi dari pegunungan keras, tapi kuku beruang lebih keras lagi. Percaya atau tidak, aku menempa dengan tangan kosong. Hampir.",
      "Kenalanku Pandai Sisik Ember di Pyraxis juga hebat. Dia menempa dengan api biru, aku dengan api biasa.",
    ], { face: -1 });
    e("Pemburu Rubah Fennel", "bkRanger", [22, 59], [
      "Aku baru pulang dari Hutan Elf. Elf di sana sopan dan ramah, tapi mereka tidak mau mengakui kalau jamur ungu itu menggemaskan.",
      wk("glowshroom"),
    ], { face: 1 });
    e("Anak Kelinci Bibi", "bkKidRabbit", [CX, PLAZA_Y + 3], [
      "Aku mau jadi tabib, tapi aku juga mau jadi pelari tercepat. Bisa dua-duanya tidak ya?",
    ], { wander: 4 });
    // --- Arena Taring ---
    e("Pelatih Arena Tigrar", "bkTrainer", [78, 41], [
      "Selamat datang di Arena Taring. Di sini petarung muda berlatih sebelum menjaga hutan. Berlatih itu penting, apalagi soal pembagian.",
      "Totem di arena ini punya tujuh angka tersembunyi. Kalau semuanya ketemu, kamu dapat... ya, rasa puas saja.",
    ], { face: 1 });
    e("Petarung Muda Ursa", "bkGeneral", [86, 41], [
      "Aku sudah menang seratus kali di arena ini! ...Kecuali melawan Pelatih Tigrar. Dia tidak pernah kalah.",
    ], { wander: 2 });
    // --- Kebun Wortel & Labu ---
    e("Petani Wortel Karo", "bkFarmer", [12, 41], [
      "Wortel kami tumbuh paling cepat di seluruh utara. Rahasianya: setiap benih ditanam dengan jarak yang dihitung cermat.",
      "Kalau kamu butuh bekal, ke pedagang di plaza saja. Kebun ini cuma untuk kami, maaf.",
    ], { wander: 2 });
    e("Anak Serigala Rufi II", "bkKidWolf", [20, 39], [
      "Aku menjaga labu dari burung! Tapi burungnya tidak pernah datang. Mungkin takut padaku.",
    ], { wander: 3 });
    // --- Batu Perjanjian ---
    e("Juru Kunci Batu Perjanjian Nyala", "bkPriest", [CX, MH - 8], [
      "Ini Batu Perjanjian. Di sini Raja Leonhart, Raja Valdorin, dan Raja Pyrrhos bersumpah untuk selalu saling membantu.",
      "Batu ini diukir tiga bahasa: bahasa hutan, bahasa naga, dan bahasa para binatang. Kalau kamu bisa membaca ketiganya, kamu pasti Penjaga Angka sejati.",
    ], { face: 1 });
  }

  /* ===================== PINTU MASUK: GERBANG TARING DI ALTAR BEAST (peta NB) ===================== */
  {
    const G = MP.NB,
      [gx, gy] = BEAST_GATE,
      set = (x, y, c) => (G.g[y] = G.g[y].slice(0, x) + c + G.g[y].slice(x + 1)); // ubah 1 huruf di peta (peta berupa teks per baris)
    if (G) {
      // tembok bukit di sisi timur altar; hanya 1 celah di baris gerbang
      for (let y = gy - 5; y <= gy + 5; y++) if (y !== gy) set(gx, y, "M");
      set(gx, gy, ",");
      delete G.mc; // gambar peta mini dibuat ulang
      EN.NB.push(pt(gx, gy, "BK", CX, MH - 3, [0, -1], { kind: "arch", th: "bk" }));
      spawnNpc("NB", {
        t: "npc", id: "gen", sp: "bkGuard", x: gx - 2, y: gy - 2,
        d: ["Penjaga Gerbang Taring Brann", [
          "Di balik gerbang ini ada Ferakhan, ibu kota para manusia binatang. Hanya yang melewati Fenrix yang bisa sampai di sini.",
          "Isi HP dan Mana dulu di kristal sebelum masuk. Di dalam kota semuanya damai.",
        ]],
        fx: { face: 1 },
      });
      spawnNpc("NB", {
        t: "npc", id: "gen", sp: "bkRanger", x: gx - 2, y: gy + 2,
        d: ["Penjaga Gerbang Taring Sera", [
          "Raja Leonhart suka sekali menerima tamu. Dia bilang cerita dari luar hutan itu seperti madu: manis dan bikin ketagihan.",
        ]],
        fx: { face: 1 },
      });
    } else console.warn("[kerajaan_beast] peta NB tidak ditemukan; Gerbang Taring tidak dipasang.");
  }

  /* ---------- pesan masuk kerajaan ---------- */
  {
    const _hp = H.portal;
    H.portal = (e) => {
      _hp(e);
      if (e.to === "BK") say("Kerajaan Beast Ferakhan. Aman: tidak ada monster di sini. Kristal di halaman istana memulihkan HP dan Mana.");
    };
  }

  /* ---------- gambar gerbang: lengkung kayu dengan taring dan telinga ---------- */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      if (e.kind !== "arch" || e.th !== "bk") return _ent(e, t, bob);
      const X = e.x * 16,
        Y = e.y * 16 + OY,
        p = rm ? 0.5 : 0.5 + 0.5 * Math.sin(t / 300),
        fl = (col, a, b, w, h) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, w, h);
        };
      ctx.globalAlpha = 0.18 + 0.18 * p;
      fl("#ffc060", -3, -10, 22, 28);
      ctx.globalAlpha = 1;
      fl("rgba(0,0,0,.3)", 0, 14, 16, 2);
      fl("#6a4a2a", -2, -6, 4, 21); // tiang kiri
      fl("#6a4a2a", 14, -6, 4, 21);
      fl("#8a5a30", -2, -6, 1, 21);
      fl("#5a3a1c", -3, -9, 22, 5); // lengkung atas
      fl("#8a5a30", -3, -12, 4, 4); // telinga di ujung lengkung
      fl("#8a5a30", 15, -12, 4, 4);
      fl("#e2b84a", -3, -5, 22, 1);
      fl("#f4ecd0", 2, -4, 2, 4); // taring menggantung
      fl("#f4ecd0", 12, -4, 2, 4);
      ctx.globalAlpha = 0.3 + 0.3 * p;
      fl("#ffb35a", 2, -4, 12, 18);
      ctx.globalAlpha = 1;
      fl("#ffd24a", 6, 6 - Math.round(3 * p), 4, 4);
    };
  }

  /* ---------- suasana: daun emas beterbangan di Ferakhan ---------- */
  {
    const _wd = W.draw;
    W.draw = function (t) {
      _wd(t);
      if (!isBK(mp) || rm) return;
      ctx.save();
      for (let i = 0; i < 12; i++) {
        const x = (((i * 67 + Math.sin(t / 600 + i) * 10 - t * 0.01 * (1 + (i % 3))) % VW) + VW) % VW | 0,
          y = ((i * 47 + Math.sin(t / 500 + i * 2) * 4 + t * 0.012 * (1 + (i % 2))) % VH) | 0;
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t / 300 + i);
        ctx.fillStyle = i % 2 ? "#f8c850" : "#e8902a";
        ctx.fillRect(x, y, 2, 1);
      }
      ctx.restore();
    };
  }

  /* ---------- peta mini ---------- */
  {
    const _m2 = mini2,
      BG = "#6a9a4a",
      COL = { "#": "#1a2a12", T: "#2a5a1c", M: "#5a5870", w: "#2a6fd6", f: "#5aa8ff", ",": "#c9a468", 2: "#a8784a", 3: "#8a5a30", 4: "#d8842a", 5: "#e8a838", 6: "#c8a050", 7: "#ffb35a", 8: "#d88a20", 1: "#6a4a2a", 9: "#2a6fd6", 0: "#8a5a30", "%": "#a8a8b0", "&": "#5a3a1e", E: "#6b3a1c", D: "#e2b84a", L: "#ffd166" };
    mini2 = function (id) {
      if (!isBK(id)) return _m2(id);
      const m = MP[id];
      if (m.mc) return m.mc;
      const c = document.createElement("canvas"),
        k = (c.width = m.w) && (c.height = m.h) && c.getContext("2d");
      m.g.forEach((row, y) =>
        [...row].forEach((ch, x) => {
          k.fillStyle = COL[ch] || BG;
          k.fillRect(x, y, 1, 1);
        }),
      );
      return (m.mc = c);
    };
  }
})();
