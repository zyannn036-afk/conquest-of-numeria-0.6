/* ===== Numeria Quest — monster tambahan (Serigala, Bandit, Goblin, Kalajengking, Mumi, Kobra) =====
   Dimuat setelah script.js (butuh SP dan E) dan sebelum world.js.
   Sprite 16x16 ditulis tangan; versi battle 32x32 dibuat otomatis (skala 2x + frame napas/serang). */
(function () {
  const ART = {
    goblin: {
      pal: {
        K: "#16281a",
        G: "#6fbf4a",
        g: "#4e9a34",
        Y: "#ffe14d",
        W: "#ffffff",
        B: "#8a5a2b",
        b: "#5e3a1a",
        L: "#c08040",
        R: "#d2284d",
      },
      m: [
        "................",
        "....KKKKKKKK....",
        "...KGGGGGGGGK.bb",
        "..KGGGGGGGGGGKLL",
        "KKGGGGGGGGGGGGKL",
        "KGGYKGGGGGGKYYKL",
        "KGGGGGGGGGGGGGGL",
        ".KGGGWKWWKWGGGKL",
        "..KGGGGGGGGGGK.L",
        "...KKBBBBBBKK..L",
        "..KBBBBBBBBBBK.L",
        ".KGBBBbbbbBBBGGG",
        ".KGBBBBbbBBBBGG.",
        "..KKbbbbbbbbKK..",
        "..KGGGKKKKGGGK..",
        "..KKKKK..KKKKK..",
      ],
    },
    wolf: {
      pal: {
        K: "#171320",
        G: "#7d8296",
        g: "#aeb3c6",
        D: "#545a6e",
        W: "#ffffff",
        R: "#d2284d",
        Y: "#ffd166",
      },
      m: [
        "..K..........K..",
        ".KGK........KGK.",
        ".KGGK......KGGK.",
        ".KGGGKKKKKKGGGK.",
        "KGGGGGGggGGGGGGK",
        "KGGYKGggggGKYGGK",
        "KGGGGGGggGGGGGGK",
        ".KGGGDDDDDDGGGK.",
        "..KgggDDDDgggK..",
        "..KggWWRRWWggK..",
        "...KgWKRRKWgK...",
        "..KGGGKKKKGGGK..",
        ".KGGGGGGGGGGGGK.",
        "KGGDGGGGGGGGDGGK",
        "KGGKGGDDDDGGKGGK",
        "KKK.KKKKKKKK.KKK",
      ],
    },
    bandit: {
      pal: {
        K: "#1a1420",
        M: "#8a2a3a",
        m: "#5e1a28",
        S: "#f1c9a5",
        C: "#4a3d60",
        c: "#2e2540",
        L: "#8a5a2b",
        Y: "#ffd166",
        D: "#d4dae8",
        B: "#d8b04a",
        P: "#3a3040",
      },
      m: [
        "................",
        "....KKKKKKKK....",
        "...KMMMMMMMMK...",
        "..KMMMMMMMMMMK..",
        "..KMSSSSSSSSMK..",
        "..KSKSSSSSSKSK..",
        "..KMMMMmmMMMMK..",
        "...KKCCCCCCKKD..",
        "..KCCCCCCCCCCD..",
        ".KCCLLLLLLLLKDBB",
        ".KCCCLYYYYLCCKBB",
        ".KSCCCLLLLCCCSSB",
        "..KCCCCCCCCCCKBB",
        "..KPPPPPPPPPPK..",
        "..KPPPPKKPPPPK..",
        "..KKKKKKKKKKKK..",
      ],
    },
    mummy: {
      pal: {
        K: "#2a2030",
        W: "#e8e0c8",
        w: "#c0b490",
        D: "#8a7e5e",
        Y: "#7cf0c8",
        G: "#4a4a5a",
        R: "#a8222f",
      },
      m: [
        "................",
        "....KKKKKKKK....",
        "...KWWWWWWWWK...",
        "..KWwWWWWWWwWK..",
        "..KWWWWWWWWWWK..",
        "..KDYKWWWWKYDK..",
        "..KWWWWwwWWWWK..",
        "...KWWWWWWWWK...",
        "..KKWwWWWWwWKK..",
        ".KWWWWwWWwWWWWK.",
        "KWwWWWWWWWWWWwWK",
        "KWWWKWWwwWWKWWWK",
        "KWwWKWWWWWWKWwWK",
        ".KWWKWWwwWWKWWK.",
        "..KWWKWWWWKWWK..",
        "..KKKKKKKKKKKK..",
      ],
    },
    cobra: {
      pal: {
        K: "#10281a",
        G: "#3fae5a",
        g: "#7ee08a",
        D: "#27743c",
        Y: "#ffe14d",
        R: "#d2284d",
        W: "#ffffff",
        B: "#2a5a3a",
      },
      m: [
        "....KKKKKKKK....",
        "..KKGGGGGGGGKK..",
        "..KGGggGGggGGK..",
        ".KGGGGGGGGGGGGK.",
        ".KGYKGGGGGGKYGK.",
        ".KGGGGGGGGGGGGK.",
        "..KGGWGGGGWGGK..",
        "..KKGGGRRGGGKK..",
        "...KGDGRRGDGK...",
        "...KGGgRRgGGK...",
        "..KGGDGGGGDGGK..",
        "..KGgGGDDGGgGK..",
        ".KGGGGGGGGGGGGK.",
        ".KGGDGGGGGGDGGK.",
        "..KKGGGGGGGGKK..",
        "....KKKKKKKK....",
      ],
    },
    scorpion: {
      pal: {
        K: "#2a1810",
        S: "#c9792a",
        s: "#eba656",
        D: "#8a4a18",
        Y: "#ff4040",
        W: "#ffffff",
      },
      m: [
        "................",
        "...........KKK..",
        "..........KSSsK.",
        ".........KSKKSK.",
        "........KSK.KSK.",
        "........KSK..KK.",
        "KKK.....KSK.....",
        "KSsK....KSsK....",
        "KSSsKKKKKSSSK...",
        ".KSSKSSSSSSSsK..",
        "..KKSSYSSYSSSK..",
        "..KSSSSsSSsSSDK.",
        ".KKSSDSSSSSDDK..",
        "KSK.KDK.KDK.KSK.",
        "K.K.K.K.K.K..KK.",
        "................",
      ],
    },
  };
  const blank = (r) => /^\.*$/.test(r);
  const nBlank = (m, fromEnd) => {
    let n = 0;
    for (let i = 0; i < m.length; i++) {
      if (blank(m[fromEnd ? m.length - 1 - i : i])) n++;
      else break;
    }
    return n;
  };
  // geser sprite k baris: bawah kosong -> turun, atas kosong -> naik, selain itu tetap
  const shift = (m, k, up) => {
    const w = ".".repeat(m[0].length);
    if (up && nBlank(m, 0) >= k) return m.slice(k).concat(Array(k).fill(w));
    if (!up && nBlank(m, 1) >= k)
      return Array(k)
        .fill(w)
        .concat(m.slice(0, m.length - k));
    return m;
  };
  const x2 = (m) =>
    m.flatMap((r) => {
      const d = [...r].map((c) => c + c).join("");
      return [d, d];
    });
  Object.entries(ART).forEach(([k, o]) => {
    const big = x2(o.m);
    SP[k] = { p: o.pal, m: o.m, a: [o.m, shift(o.m, 1, 0)] };
    SP[k + "L"] = {
      p: o.pal,
      m: big,
      a: [big, shift(big, 2, 0), shift(big, 2, 1)],
    };
  });
  const mon = (o) => E.push(o);
  /* indeks E: 4 Serigala, 5 Bandit, 6 Goblin, 7 Kalajengking, 8 Mumi, 9 Kobra */
  mon({
    n: "Serigala Desimal",
    sp: "wolf",
    hp: 100,
    atk: 11,
    topics: ["persen", "arit"],
    weak: "persen",
    d: [1, 4],
    s: 4,
    xp: 22,
    coin: 14,
    bg: ["#16202e", "#2a3d52", "#1c2a3a", "#cfe6ff"],
    intro:
      "Seekor serigala mengaum di tengah jalan. Bulunya penuh angka desimal yang acak!",
    win: "Serigala itu mengendus, lalu berlari kembali ke semak-semak.",
  });
  mon({
    n: "Bandit Hutan",
    sp: "bandit",
    hp: 85,
    atk: 12,
    topics: ["arit", "persen", "pecahan"],
    weak: "arit",
    d: [1, 4],
    s: 4,
    xp: 26,
    coin: 40,
    bg: ["#1d2a1f", "#2f4a33", "#17261a", "#ffe9a0"],
    intro:
      'Bandit menghadang! "Serahkan koinmu!" Hitung lebih cepat darinya untuk lolos.',
    win: "Bandit itu kabur sambil menjatuhkan sekantong koin.",
  });
  mon({
    n: "Goblin Pengurang",
    sp: "goblin",
    hp: 80,
    atk: 10,
    topics: ["arit", "alj"],
    weak: "arit",
    d: [1, 3],
    s: 3,
    xp: 18,
    coin: 16,
    bg: ["#2a2f1c", "#4a5a2c", "#222a16", "#e8ffb0"],
    intro:
      "Goblin kecil ini suka mengurangi apa saja, termasuk koinmu. Jawab dengan benar!",
    win: "Goblin itu menggerutu dan kabur membawa gadanya.",
  });
  mon({
    n: "Kalajengking Sudut",
    sp: "scorpion",
    hp: 140,
    atk: 15,
    topics: ["geom", "arit"],
    weak: "geom",
    d: [2, 5],
    s: 4,
    xp: 38,
    coin: 30,
    bg: ["#4a2a3a", "#e08a4a", "#b4783a", "#ffe9b0"],
    intro:
      "Kalajengking pasir menegakkan ekornya. Setiap sudutnya setajam sengat!",
    win: "Kalajengking itu mengubur diri di balik pasir.",
  });
  mon({
    n: "Mumi Variabel",
    sp: "mummy",
    hp: 170,
    atk: 16,
    topics: ["alj", "pecahan"],
    weak: "pecahan",
    d: [2, 5],
    s: 4,
    xp: 48,
    coin: 38,
    bg: ["#2a1f3d", "#8a5a6e", "#9a6a3a", "#fff0c0"],
    intro:
      "Mumi bangkit dari pasir. Perbannya adalah pecahan yang belum disederhanakan!",
    win: "Perban mumi itu terurai. Hanya debu yang tersisa.",
  });
  mon({
    n: "Kobra Modulo",
    sp: "cobra",
    hp: 150,
    atk: 17,
    topics: ["alj", "persen"],
    weak: "alj",
    d: [2, 5],
    s: 4,
    xp: 44,
    coin: 34,
    bg: ["#3a1f2a", "#d0703a", "#a8683a", "#ffe0a0"],
    intro:
      "Kobra melebarkan tudungnya. Sisa pembagian ular ini tidak pernah berhenti!",
    win: "Kobra itu mendesis pelan lalu menghilang di antara bukit pasir.",
  });
})();
