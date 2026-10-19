/* ===== Numeria Quest — Istana Zodiak (Istana Raja Iblis Ophiuchus) =====
   Dimuat PALING AKHIR (setelah cerita.js). Tidak mengubah file lain, hanya membungkus fungsi yang ada.
   Cara masuk: kalahkan Raja Iblis Tak Hingga di Kastil Raja Iblis, bicara dengan Peri Cahaya di aula takhta,
   lalu masuki gerbang ungu yang muncul di dekatnya (di petak sekitar Peri).
   Isi:
   - 12 lantai (ZF1..ZF12), tiap lantai dijaga satu bintang zodiak, urut Aries -> Pisces:
       Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces.
     Lantai berbentuk ruang berliku (4 ruang + lorong bos) dengan tangga naik/turun, kristal simpan, 2 peti,
     dan 4 monster biasa (muncul lagi tiap masuk lantai, bisa dihindari).
   - Aula Raja Iblis Ophiuchus (ZT) di puncak: Ophiuchus, bos terakhir.
   - Sprite battle 96x128 (kunci berakhiran "B", data RLE di bagian Z96) dan sprite peta 32x32/16x16 (bagian ZSP).
   - Quest baru "Istana Zodiak" di Papan Quest (hadiah Pedang Ophiuchus).
   Data di F (ikut tersimpan): F.zodiakOpen (gerbang terbuka), F.zodiakOk (Ophiuchus kalah), F.done[indeks E], F.chest[id].
   Mengatur kekuatan: ubah rumus hp/atk pada bagian MONSTER. Mengatur ukuran lantai: FW / FH di PENGATURAN. */
(function () {
  /* ===================== SPRITE: generator pixel-art (murni, tidak bergantung game) ===================== */
  const ZSP = (() => {
    const N = 32;
    const G = () => Array.from({ length: N }, () => Array(N).fill("."));
    const put = (g, x, y, c) => {
      x = Math.round(x);
      y = Math.round(y);
      if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c;
    };
    const rc = (g, x, y, w, h, c) => {
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) put(g, x + i, y + j, c);
    };
    const el = (g, cx, cy, rx, ry, c) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / (rx + 0.45),
            dy = (y - cy) / (ry + 0.45);
          if (dx * dx + dy * dy <= 1) put(g, x, y, c);
        }
    };
    const ln = (g, x0, y0, x1, y1, c, t = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n,
          y = y0 + ((y1 - y0) * k) / n;
        for (let j = 0; j < t; j++)
          for (let i = 0; i < t; i++) put(g, x + i, y + j, c);
      }
    };
    const poly = (g, pts, c) => {
      const ys = pts.map((p) => p[1]),
        xs = pts.map((p) => p[0]);
      for (let y = Math.min(...ys); y <= Math.max(...ys); y++)
        for (let x = Math.min(...xs); x <= Math.max(...xs); x++) {
          let inside = false;
          for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const [xi, yi] = pts[i],
              [xj, yj] = pts[j];
            if (
              yi > y + 0.5 !== yj > y + 0.5 &&
              x + 0.5 < ((xj - xi) * (y + 0.5 - yi)) / (yj - yi) + xi
            )
              inside = !inside;
          }
          if (inside) put(g, x, y, c);
        }
    };
    // garis tepi gelap (K) di sekeliling semua piksel terisi
    const outline = (g) => {
      const o = g.map((r) => r.slice());
      for (let y = 0; y < N; y++)
        for (let x = 0; x < N; x++) {
          if (g[y][x] !== ".") continue;
          if (
            [
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ].some(([dx, dy]) => (g[y + dy]?.[x + dx] ?? ".") !== ".")
          )
            o[y][x] = "K";
        }
      return o.map((r) => r.join(""));
    };
    // versi dunia 16x16: tiap blok 2x2 diambil warna terbanyak
    const down = (rows) => {
      const out = [];
      for (let y = 0; y < N; y += 2) {
        let s = "";
        for (let x = 0; x < N; x += 2) {
          const c = [
              rows[y][x],
              rows[y][x + 1],
              rows[y + 1][x],
              rows[y + 1][x + 1],
            ].filter((v) => v !== "."),
            cnt = {};
          c.forEach((v) => (cnt[v] = (cnt[v] || 0) + 1));
          const nk = c.filter((v) => v !== "K");
          if (
            c.length >= 3 ||
            (c.length === 2 && nk.length) ||
            (c.length === 1 && nk.length)
          ) {
            const pool = nk.length ? nk : c;
            let b = pool[0];
            pool.forEach((v) => {
              if (
                pool.filter((q) => q === v).length >
                pool.filter((q) => q === b).length
              )
                b = v;
            });
            s += c.length >= 3 && nk.length < 2 ? "K" : b;
          } else s += c.length ? "K" : ".";
        }
        out.push(s);
      }
      return out;
    };
    // bingkai kedua: bagian atas turun 1 petak (napas)
    const breathe = (rows) => [
      ".".repeat(N),
      ...rows.slice(0, 19),
      ...rows.slice(20),
    ];

    const S = {};
    const def = (key, pal, draw) => {
      const g = G();
      draw(g);
      const m = outline(g);
      S[key] = {
        p: { K: "#0c0610", ...pal },
        big: m,
        big2: breathe(m),
        small: down(m),
        small2: down(breathe(m)),
      };
    };

    /* ===== SPRITE dari gambar referensi 12_bawahan_raja_iblisdan_raja_iblis.png =====
       Tiap sprite 32x32; huruf = warna di palet, "." = kosong, garis tepi K ditambahkan otomatis.
       Versi peta 16x16 dan bingkai napas dibuat otomatis. Mau ubah warna: edit palet (hex) tiap sprite. */
    const defRows = (key, pal, rows) => {
      const m = outline(rows.map((r) => r.split("")));
      S[key] = {
        p: { K: "#0c0610", ...pal },
        big: m,
        big2: breathe(m),
        small: down(m),
        small2: down(breathe(m)),
      };
    };

    /* ===== 1. ARIES: raksasa bertanduk emas, palu raksasa, jubah merah ===== */
    defRows(
      "zaries",
      {
        A: "#ebc396",
        B: "#bc7d68",
        C: "#97504a",
        D: "#c4212a",
        E: "#4f2736",
        F: "#830d21",
        G: "#42091c",
        H: "#10071a",
        J: "#05000f",
      },
      [
        "................................",
        "...........AA..DD..AA...........",
        "..........AAAADDDDAAAA..........",
        ".........AAAADDDDDAAAAA.........",
        ".....AA..AAADDDDDDDAAAA.........",
        "...AADDEEAAADDDDDDDDAAA.........",
        "..AAADDEEEAADFFDDFFDAA..........",
        "..AABDDEEEJJAFFDDEFEEE..........",
        "..ABBDDE.EJJAAAAAEEEEE..........",
        "..EEEDD..HHCAAAAAAEEEEH.........",
        "..EEEDD..CCCBAAAABBEECC.........",
        "..BEEFFJ.CCCBBBBBBEECCCH........",
        "....JJFJJCCBBBBBBEEECCCB........",
        "....JJJJCCBGGBBBEEEGGGBBB.......",
        ".....JJJCCGGGGBBBEGGGGEBB.......",
        ".....JJJCGGGGGDBBGGGGEEBB.......",
        ".....JJFFGGGGGDDDCGGGGEBH.......",
        ".....DDFFGGGGJDDDDCCGGEE........",
        ".....DDFFGGGDDDDDCCCGGEE........",
        ".....DDFFGGDEDDDDCCEGGEE........",
        ".....DDFGGDDBEEDDCCEEGGDD.......",
        ".....DDGGGDBBEEGGDEEEFGDDJ......",
        ".....DDGGGDDDGGGGGDDDFFGDD......",
        ".....DDGGGDDDGGGGGDDDFFFDDD.....",
        ".....DDGGGDDFFGGGFFDDFFFDDDDB...",
        ".....DDGGGGDFFGFFFFFDFFFFDDDD...",
        ".....DDDGGGEEFFFFFEEEFDFFFDDD...",
        ".....DDDGGGEEFFFFFFEEEDDFFDDD...",
        ".....DJD...EEE.FFFFJEEDD...DD...",
        ".....JJH..DDEE....JJJ.......D...",
        ".....J...HDDDH....JJDD..........",
        ".........JDDDJ....JJDD..........",
      ],
    );

    /* ===== 2. TAURUS: minotaur cokelat, kapak & perisai bulat ===== */
    defRows(
      "ztaurus",
      {
        A: "#e5b39b",
        B: "#a96e5d",
        C: "#834532",
        D: "#5d383a",
        E: "#442125",
        F: "#170c1e",
        G: "#0a0518",
        H: "#070113",
        J: "#02000c",
      },
      [
        "................................",
        "....................A...........",
        ".......A............AA..........",
        "......AA............AAJ.........",
        "......AAA....CDDG...AAJ.........",
        ".......AAAAADDDDAAAAAA..........",
        "......AAAAAADDDDAAAAAA..........",
        ".....AAAAAAADDDD.AAAA...........",
        "....AAABBAAFFDD..GAAC...........",
        "...GABBBBBJFDDDD..CCCC..........",
        "...AABBBBBJJJDDFFCCCCCC.........",
        "...AABBBBBJJJJDFFCCCCCCJ........",
        "...AABBBBBDDDDBBBCCCCCCC........",
        "...AAABBBBDDDDCBBBCCCCCCG.......",
        "...GAA..BDDDDCCCBBCCCCCDD.......",
        "....AA..DDDJCCCCCFFEECDDD.......",
        ".......GGGJJCCCCCFFFEAAADA......",
        "......GGGGJJJCCCEFFEEAAAAAG.....",
        "......FFGGJJCCEEEFFEAAAAAAA.....",
        "......FFFECCCCCECFFAAAAAAAAJ....",
        ".......CCCCCCCCCCCFAAAAABBAG....",
        ".......CDDCCCCCCCDDAAAAABBCG....",
        ".......DDDDCCCDC..FAAAAAACC.....",
        ".......EDDDCCCDDC.BBBBAACCJ.....",
        ".......EEDDCCCCCCHHBBBEEEC......",
        ".......EEEG.CCCCHHHBBEEEGG......",
        "......FEJED..CC.GGGDDEEG........",
        ".......JJDDD.C..GGDDDDDJ........",
        ".......JJDDDDGF.GGDDDDDJ........",
        ".......JJDDDD.....GDFD..........",
        ".......JJDJDD.....HHFF..........",
        ".........JJJH.....HBFC..........",
      ],
    );

    /* ===== 3. GEMINI: dua kembar (biru-putih & ungu-magenta) berdampingan ===== */
    defRows(
      "zgemini",
      {
        A: "#e8d0f4",
        B: "#b4a2ed",
        C: "#8d76c5",
        D: "#a82e84",
        E: "#3b3577",
        F: "#70136a",
        G: "#190c2e",
        H: "#090519",
        J: "#03000e",
      },
      [
        "................................",
        ".............BJ..HG.............",
        "............BBB.DDD.............",
        "...........CCBBHDDDEE...........",
        ".........ACCCCCHHDDEE.JD........",
        ".........AAACCCEHDDDDDDH........",
        ".........AAAACEEHHDDDDD.........",
        ".........GAAAEE...DDDDD.........",
        "...........AAA....DDDD..........",
        "..........AAAAA..DDDDD..........",
        ".........JAAAAAADDDDDDD.........",
        ".........BCCAAAADDDDEDD.........",
        ".........CCCBAAFDDDDEEE.........",
        "......AG.CCCBBBFFFDDDE..GG......",
        "......GCCCCCBBHHFFDDDDDDGG......",
        "......CCCCCBBHHHGGDDDDDDGG......",
        "......C...BBBHHHGGDDDDD..G......",
        ".......C..BBBBHEG..DDD..G.......",
        ".......B.BBBBEEEFF.DDDD.H.......",
        "........BBBBEEEEFFFDDDDD........",
        "........BBBAEEEEFF.JDDDD........",
        ".......BBBAEEEEEFF...DDED.......",
        "......CCBBAEEEEE.F.J.DDEED......",
        ".....CCAAAEEEEE..FFHHHDDEED.....",
        "....HCCEAEEEE.F..FFHHHHDDED.....",
        "....HCEEEECEE....FFFH..HDDDD....",
        "...JAEEEECCEE....FFF....HDDDJ...",
        "......EEEBBBH.....FFHH..HH......",
        ".....CEEEBB.......D..HHJ.GH.....",
        ".........JJ.......D..HH...J.....",
        "........J.........FF.HH.........",
        "........HJ........FF..GJ........",
      ],
    );

    /* ===== 4. CANCER: iblis kepiting merah, dua capit raksasa ===== */
    defRows(
      "zcancer",
      {
        A: "#d78675",
        C: "#ab2b3b",
        D: "#e61c2d",
        E: "#781a2e",
        F: "#930d23",
        G: "#1f091e",
        H: "#0a061a",
        J: "#04000d",
      },
      [
        ".................D..............",
        "............DDCCDDD.............",
        ".........AJDDDCCDDDDA...........",
        "..........DDDDCCCDDD............",
        "........DDDDHDCCHDDD.H..........",
        ".......DDDJJHHHHHHDDDDD.........",
        ".......DDDJJGGHHHGGDDDDH........",
        ".......DEEEHGGGGGGGEEEDD........",
        "......DDGEHHGGGEGGGEEEDD........",
        "......DDGGHHGEEEGGGGHEDDD.......",
        ".....ADDGGHHJEEDEGHHHHDDDJ......",
        ".....AAJGG.JJDDDDHHH.HGGGG......",
        ".....AJJJH..DDDDDDH.J.GGGG......",
        "....DDDJ.J.HDDDDDDD....GGDH.....",
        "...DDDDD...DDFFDDDDH...DDDDH....",
        "...DDDDDD.EEDDFDDDDD..DDDDDD....",
        "..DDDDDDDDEEEDDDHHDEDDDDDDDD....",
        "..DDDDDDDDGEEDDDHHEEEDDDDDDDH...",
        "..DDDDDDDDGGEDDDHHHEEDDDDDDDJ...",
        "..FDDDDDDGGG.D..DH.EDDDDDDDD....",
        "...DDDDDDGG.....D.E.DDDDDDDD....",
        "...DDDDDDGGG.D..DD..HDDDDDDJ....",
        "...JDDDDDGGGDD..DD.GHHDDDDD.....",
        "....DDD.GGGGGDD.DDGGGHH.DD......",
        ".....JJ.GGEEGGEEDGGGGGG.D.......",
        ".......JFFEEHEEEEG.GGGG.........",
        ".......JFFEEEDDEE...GDE.........",
        ".........FHH..DEJ...DD..........",
        ".........DDG..DD...EE...........",
        ".........DD....D...EEJ..........",
        ".........DD........HEJ..........",
        "................................",
      ],
    );

    /* ===== 5. LEO: ksatria bersurai api oranye, jubah merah ===== */
    defRows(
      "zleo",
      {
        A: "#fdb74d",
        B: "#e76c29",
        C: "#e73221",
        D: "#6b322f",
        E: "#a31320",
        F: "#260d1e",
        G: "#0c081d",
        H: "#080215",
        J: "#03000d",
      },
      [
        "................................",
        "................................",
        "...........DAAAD................",
        ".........DDAAAAAA...............",
        "......HBBBBBAAAAAH..............",
        ".......BBABBBAAAA...............",
        ".....BBAABAFFAAAA...............",
        ".....JBAAAAEFAAAAAG.............",
        ".....GGAAAEEEAAHAAA.............",
        ".....JCCCADE..HHHAA.............",
        ".....CCCCDDDD.HHHAAF............",
        ".....CCCCDDDDDAAGGG.............",
        "......CCEDDDDAAAGGGG............",
        "......EEEDDDDDADGGGF............",
        ".....EEEEDDDDDDDGGGB............",
        ".....CEEDDDDDDDDDBBF............",
        "....CCCDDDDDDDBBBDBEECC.........",
        "....CCCDDEDDDBBBBBDEEEC.........",
        "....CCCCEEED.BBBGBEEECCCCC......",
        "....CCCCEEE..BGGGDEECEECCCC.....",
        "....CBBBBJB..B.B.EEEECEEC.......",
        "....CBBBBBB..A...EEEECCEE.......",
        "....CCCBBBB..B.D.JJEEECCCC......",
        "....ACCBBBBBBB.DDD.EEECCCCCC....",
        "..AAAADBBBBAA..DDD..EEEECCCBB...",
        "...AADDDBBBAA..BBG..FECEECBBCF..",
        "...HADDGGBAAA..BBB...CCCCCB.....",
        "....DDDGGAAAA..BBA...CCCC.......",
        "....ADGAAAAAA..AAAA.AAC.........",
        ".....GGAAAA.AJ.AAAAAAAJF........",
        "........AAH..FD.HAAAJ...........",
        "........AD........E.............",
      ],
    );

    /* ===== 6. VIRGO: dewi hijau berjubah sulur, tongkat daun ===== */
    defRows(
      "zvirgo",
      {
        A: "#c6dc8f",
        B: "#88be88",
        C: "#778f6a",
        D: "#4b7260",
        E: "#3b4f4c",
        F: "#2f383e",
        G: "#161e2a",
        H: "#0a0518",
        J: "#01010b",
      },
      [
        "................................",
        "................................",
        "..............HH.H..............",
        "........H..H.BBAHH..............",
        "........BB..BBAAAJ......J.......",
        "..........A.BBAAA....HHBB.......",
        "..........CABAAAA...HHBBB.......",
        "........BCCCCAAAAH..HHBBBH......",
        ".......CCCCCCCAAAD..HHBBBH......",
        "......CCCCCCCCAADDD..HHHH.......",
        ".....HBBCCCCCAAAADDC..CCH.......",
        ".....BBBBCCCAAAAAADD..C.........",
        ".....BBBBAAAAAAAADHH.HH.........",
        ".....BB.EAAACCCBBBHHHHH.........",
        ".....DB..BBCCCCCCCCHHHJ.........",
        "......D.BBBCCCCCCCCCHH..........",
        "......HBBBBCCCCCCCCCHH..........",
        "........BBBAAAAAACBBBE..........",
        "....HE.HAAAFAAEEABBBBEE...H.....",
        "....HH.AAAFFFEEEAABBH..JHGHJ....",
        "......BBBBFFFEDDAAABHJ..........",
        ".....BBBBAAFFDDDDJAAJJJ.........",
        "....BBBAAA.JJDDDJJAAAJJJ........",
        "....HHAAA..JJJDDJJJAAAJJ........",
        "...HHHAA...JJJCCCJ..AAAJ.H......",
        "...BBBA....JJJCCCC..AAAAAE......",
        "...JBBB..F.FJJCCCC...BBAA.......",
        "....BBJ.FFFHHCDCCF...BBBA.......",
        "....HBBFFFHHHHCCCFFFBBBB........",
        ".....AA..FHHHHCCCFFFAABH........",
        "......AA..HCCCCCCFF.AA..........",
        "...........BC....BG..A..........",
      ],
    );

    /* ===== 7. LIBRA: malaikat bersayap & berhalo, memegang timbangan ===== */
    defRows(
      "zlibra",
      {
        A: "#f3e1ed",
        B: "#d6b2c1",
        C: "#ae7e8e",
        D: "#6b5583",
        E: "#492f4c",
        F: "#2e2243",
        G: "#150d25",
        H: "#080417",
        J: "#02000c",
      },
      [
        "................................",
        "..............GAC...............",
        ".............B...B..............",
        ".........EJ..C...C..HE..........",
        "........JF....EEJ....FF.........",
        ".............EEEGG..............",
        ".......HAA..EEEEGG..HAAG........",
        ".......AAAAAEEEBGG..AAAA........",
        ".......AAAAAGEBBBGGAABAA........",
        ".......AAACCCBBBBGGBBBAAA.......",
        "......GAAABCCGBBEEEBBAAAA.......",
        ".......AHBBBCCBBBEEBBBGGG.......",
        "......GHHHHBCCBBEEEBBBGGC.......",
        ".....EAHHHHCCDBDDDCCCBGGCC......",
        ".....BBHHHHHCDDDDDCCCHHCCC......",
        ".....JB.HHHHJCBCCC..HHH.CJ......",
        "....C...GG..CCCCCC...HHH..H.....",
        "....G..GG...JCCCCAG..JHJ..C.....",
        "...CCCGGGE..CCCCCAA..HJJJCCH....",
        "....CCCGGG.CCCCCCAAA.E.HHHH.....",
        ".....JCGGGGCBBC.CBBAAE..HH......",
        ".......E.JGGBB..BBBAAA..........",
        ".........GGGGB..JAAAAA..........",
        ".........JGGGD..CAAAAA..........",
        "......DAAAGGCC..CCABBJJ.........",
        "......EAAAADCC..CCABJJAA........",
        ".......AAADDDC..CCCAAAAAG.......",
        "......DAAADDDDDCCCDAAAAAA.......",
        "......AAADDDDDDDCDDDAAAABA......",
        ".....BAAJ.JDDDDDDDDDAAABBB......",
        ".....AA.....CC..D.....AA........",
        ".....A......CB..CE.....G........",
      ],
    );

    /* ===== 8. SCORPIO: ksatria kalajengking merah, ekor melengkung ===== */
    defRows(
      "zscorpio",
      {
        A: "#d46967",
        C: "#a12238",
        D: "#b5152f",
        E: "#3f132c",
        F: "#540922",
        G: "#10081d",
        H: "#080416",
        J: "#03000e",
      },
      [
        "................................",
        "...............DD...............",
        "............HHDDDDDD............",
        "...........HHHDDDDDDG...........",
        "..........DDGGDD..JGGGDD........",
        ".........DDDGGEEE...GGDD........",
        ".........DDDGGEEEA..GGDD........",
        "........CDD..GGEE.....DD........",
        "........DDD..GGEE......D........",
        "........DDD..AAAA...............",
        "........DDDDEAAAGGE.............",
        "........DDDEEAAAGGEE............",
        "........GGGEEAAAAAEE..DGG.......",
        "........GGGEEAADAAEE..GG........",
        "........GGEEEADDDAEE.GG.........",
        "........JJFFFGDDDG...DD.........",
        ".....DG.GGFFGGGGGGGGGDDG........",
        "......DDDD..GGGGGGGFGDDD........",
        ".......DDDD.GG...GFFFFFF........",
        "......EDDDGGGG...GFFFFFDH.......",
        ".......DDDGGG.G.J.E.FFFDD.......",
        ".......DDDGG.E.H.E...FFDDJ......",
        "......DDDDGG.E.G...JC..FJJ......",
        "......DDDDDGG.H.J.DDD..JJJ......",
        "......DDDDDGGGJ..JDDDDDDDD......",
        ".......DDD.GGG...GGDD.DDDD......",
        ".......DDD..GG..HGGD..DDDD......",
        ".......DDAG.GG...GDD.FDD........",
        "........DAGGG.....DD.GH.........",
        "........DDAGG.....J.............",
        ".........DAAH.....H.............",
        "..........A......JH.............",
      ],
    );

    /* ===== 9. SAGITTARIUS: sentaur biru-ungu, busur besar ===== */
    defRows(
      "zsagit",
      {
        A: "#bba1d1",
        B: "#7f65b7",
        C: "#66419a",
        D: "#3a3691",
        E: "#3a237a",
        F: "#261c5c",
        G: "#140e2f",
        H: "#090619",
        J: "#03000e",
      },
      [
        "................................",
        "................................",
        "..................BH............",
        "...........A......HBB...........",
        "..........AAA.......BC..........",
        "........AAABAAC......CC.........",
        ".......BAAABBAAAH.....CB........",
        "........BBBBAAAAA.....BB........",
        ".......BBBBBBAAAB.....BBB.......",
        "......DJBBJJAAAA......ABBG......",
        "......J.BBAJJAAAAH.....AGGA.....",
        "........AAAAJEEEAAAAAAAAG.......",
        "........AAAAEEEEAAAAAAAAA.......",
        ".......AAA.JEEEE..JC...AA.......",
        ".......AAA...EEE.......AA.......",
        "........AAA.EEEE.......AA.......",
        ".........GGGEEEEE......CH.......",
        "......JJDDDGEEEEDDDH..BB........",
        ".....BBJDDDDD..DDDDBBBC.........",
        "....BBDDDDDDD..DDDDDBB..........",
        "....BDDDDCDDDD.DDDDDB...........",
        "....BBBDDCCDDFFDDDDDD...........",
        "...BBBBBDDDDDFFFDDDDD...........",
        "...BBBB.HDDDJJJJDCCDD...........",
        "...ABBH...DJJJJHHCCDDDJ.........",
        "....AB....BBBBJHHDDDDDD.........",
        "....ABJ..HBBB..HDDDD.DD.........",
        "..........BBB.HG.DDC..BB........",
        "...........BBBG..DD...BB........",
        "...........BBHH..DD...BB........",
        "...........JJHHH.DD...BB........",
        "...........JHHH..FE...HG........",
      ],
    );

    /* ===== 10. CAPRICORN: penyihir ungu gelap berjubah, tentakel (di gambar berlabel SCORPIO kedua) ===== */
    defRows(
      "zcapri",
      {
        A: "#ae70ba",
        B: "#7b3fb6",
        C: "#5f2e9a",
        D: "#641e9e",
        E: "#2f1c68",
        F: "#3e0d67",
        G: "#120928",
        H: "#08041a",
        J: "#03010a",
      },
      [
        "................................",
        ".............G..BB..............",
        "...........GD.GBBBB.............",
        "..........GDDDHHADDDJ...........",
        "..........GGDDGEHDBBB...........",
        ".......GGCDDE.EEEGBBCCCG........",
        "......GGCCCDEE.EE...CCEH........",
        "........CCC..A.JEE.ECEE.........",
        "........CCC..G..E...GEEH........",
        "........EEEJJJCCHH....BB........",
        "........EEEEJJCCHHH...B.........",
        ".....BBBEEEEEECCCHHA..G.........",
        "....AABBEEEEEFECEDDA.JAJ........",
        "....ABBBEEEEFFFEECCD.AAJJ.......",
        "....BBB...EEE.FEECCC..AJJ.......",
        "....BBB..EEE..EEECCC..BBB.......",
        ".....B...E..EEEEECCCC.BBJ.......",
        ".....GG..B..EEEEEECCE.BB........",
        "....GGG.EG.GEEEEEEEEEB..........",
        "....EEEEEGG.EE.D.CCEEEB.........",
        ".....EEEEG..E....CCCCDD.........",
        "....GGEGEGGEE.H.EECCCD..........",
        ".....JGGGEEEEEHHEECCCDDD........",
        ".......GGCCBEE.HHECCCDEE........",
        "......HEEEFFEE..HFFFCEE.........",
        "........EFFFEDF..FFFFF..........",
        ".......EFFFEEDD.HFFFFFB..AA.....",
        ".....E.HFFFFE.F.HHFF..B..AA.....",
        ".....CC...FFF...JHH.......J.....",
        ".....JC....FF.....B.............",
        "......CB...BB....HC.............",
        "...........CB....HB.............",
      ],
    );

    /* ===== 11. AQUARIUS: roh air toska, rambut panjang, kendi biru ===== */
    defRows(
      "zaqua",
      {
        A: "#89d2ec",
        B: "#36c8fa",
        C: "#557cc8",
        D: "#296ecf",
        E: "#31368c",
        F: "#242d87",
        G: "#18276b",
        H: "#0c0a29",
        J: "#04020d",
      },
      [
        "............AAA.................",
        "........B..JAAAH................",
        "........BB.AAAAA................",
        "........BJCCAAAAA...............",
        "........JJCCAAAAAAA.............",
        ".....B..JJCCCAACAAA.............",
        "....JBH.JCCCACCEEAAA............",
        ".....BB.ACCCAACEEEACCAAH........",
        "........AACCAAAEEEEC............",
        ".....JJ.AAAAEEEEEECCB...........",
        "...BDDDDDDDEEEEJJAACBBH...JA....",
        "...BBDDDDDDEEEEEJAACCCCAAAAAA...",
        "..JBBBBBDDDEEEEECCEECCCCAACAAA..",
        "..JBBBBBDDDGEEECCCEEECCCAACCAJ..",
        "...DDBB..DGGEEFFCCCEGGCC.AAAC...",
        "....DDB..FFGFFFFDCCGGGG..AAH....",
        "....DDD..FFFFFFDDDCGGG..BA......",
        "...DDDD.FFFFFFFFDDDDG...B.......",
        "..BBDDDFFFFAFFEEEDDDD...BH......",
        "..BBJJBBFFAAAEEEEDDDD...........",
        "....BJBBHFBAAEEEEDDDDDD.........",
        "....BBBHB..ABAEEEFFDDDDBB.......",
        "...BBBBBB..JJBBEFFFDDDDDBBJ.....",
        "..BB.J.....JJBBJ.FFFDDDDDBB.....",
        "..B........AJBBBFFFFDCCDDBBB....",
        "..H....BFFFAABBBFFFFFCCDBBB.....",
        "..BBBJHFFFFABBBBFFFDDDDDBBB.....",
        "..BBBB..J.DAAJJFFFFDDDDJBBB.....",
        "..BBBBB.....AJJHHHBBJJJJBBB.....",
        "...BBBBB....JJHHHHBBBJJBBB......",
        "....BBBBB...DDH.BBBBBBBBB.......",
        "................................",
      ],
    );

    /* ===== 12. PISCES: roh laut biru, ekor air, tongkat trisula ===== */
    defRows(
      "zpisces",
      {
        A: "#9eddf3",
        B: "#59c3e9",
        C: "#6185cb",
        D: "#3975b2",
        E: "#3d3d84",
        F: "#28336b",
        G: "#161b3f",
        H: "#08081e",
        J: "#02000c",
      },
      [
        ".............A..................",
        "........BH..AA..................",
        ".......GHCBAAA..................",
        "...........AAA..................",
        "...........AAH....JBBBH.........",
        "..........AA.....BBBBBH.........",
        "......A..AA.....BBBDDBBHH.......",
        ".....BB..AA....BBBBDDDAHHJ......",
        "......A.AAH.JBBBBBDBB..BDD......",
        "......FFAH..BBBCBDDBB...DD......",
        ".......EAE.BBBBCCDDDBH...EA.....",
        "........EEEBBBBCJJDDHH...EE.....",
        "........HEEEBBHHJJJHHH...EE.....",
        ".........EEAAHHHAAAJH....DD.....",
        "......AJ.FEEAHHAAAAJH....DD.....",
        ".....BB..E.HDDHHAAAHH....DD.....",
        ".....BB..E..DDDBBAAAH....F......",
        ".....BBB.E..DDDBBAAAAH..........",
        ".....BBBBBBHAACCBAAAAAH.........",
        ".....ABBBBBHAACCCAAAABB.........",
        "......BBBBAAAAFFCCHHBBBA........",
        ".......BBDDDFFFFFHHHBBAA........",
        "........DDDDFFFFFFHHBBBA........",
        ".....B.ADDDFFFFF..BBBBBH........",
        ".....HAAJJJHFFFF..BBBBH.........",
        "......HJJJJEEEEFBBBBBH..........",
        "........JH..EE..CBBB...JBJ......",
        "............EE..CCBBB.BBBB......",
        ".....BJJC.JBHEHHCBBBBBBBB.......",
        ".....JJJCCCCBBHHCCBBBBBH........",
        "........H.CBBBHHE.JBH...........",
        "................................",
      ],
    );

    /* ===== RAJA IBLIS OPHIUCHUS: zirah hitam-ungu, mahkota emas, jubah ungu ===== */
    defRows(
      "zophi",
      {
        A: "#cb7c72",
        B: "#60307f",
        C: "#701ca5",
        D: "#2a194a",
        E: "#3f096e",
        F: "#140a27",
        G: "#0d071e",
        H: "#080318",
        J: "#04010c",
      },
      [
        "................................",
        ".........B............BC........",
        ".........BDJJAAAAAAC.BB.........",
        "...........JJAAAAAAC............",
        ".........GD...DAAA....HH........",
        ".........DDC..DDBB..HHDD........",
        "........EDDH.DDBBBEEHDDDC.......",
        ".......CC...HHDBBBEEDDDCCH......",
        "......CCC...HHDABBFEDDDJJE......",
        "........HE.DDDAAAFF.DDDJJ.......",
        "........J..FDDAAAAFG..DD........",
        "........BD.JFDAAAADD...DD.......",
        ".......DD..J...AAFDDD..DD.......",
        "......DDDFGJJ..EADDDDDDDDE......",
        "......HDF..GJJ.EEEHHH..DDD......",
        ".......F..GGJJJEEEEHH...DD......",
        ".......C..CCJJJEEHCEEH...C......",
        ".......G..CCCJJEHHCCEE...F......",
        ".......H..CCCCEE.CCCEE...C......",
        ".......AACCCC.CC..CCCE.AA.......",
        ".......AAACCH.CCJ.CCCEAAAF......",
        "........ACCC..CCC.JCEEDDA.......",
        ".......BBCCC.JCCC..CE.DDD.......",
        ".......ABBCG.HCCC..C..HBB.......",
        "........F.C...CCJJJC...B........",
        "..........CCB.CCJJJJC...........",
        ".........CCEECCCJJ..HF..........",
        "......C..CFEECCCCJ..HH...C......",
        ".....AC.CCFF.CCCCCHHHH..ACC.....",
        "......FCC....CCCC.....CCH.......",
        ".......C....FCCCC.....CE........",
        ".............C..C...............",
      ],
    );

    return S;
  })();

  /* ===================== PENGATURAN (mudah diubah) ===================== */
  const FW = 25, // lebar tiap lantai (petak)
    FH = 29, // tinggi tiap lantai
    CX = 12, // kolom tengah (tangga & bos)
    TW = 21, // aula takhta Ophiuchus
    TH_ = 19,
    MINIONS = true, // false = lantai tanpa monster biasa (hanya penjaga)
    ALL = ["arit", "pecahan", "persen", "geom", "alj"];

  /* ---------- tema warna per elemen ---------- */
  const ELM = {
    api: {
      th: "zf",
      acc: "#ff7a32",
      car: "#8a1c2a",
      bg: ["#3a0c08", "#a8321a", "#2a0806", "#ffb060"],
    },
    bumi: {
      th: "ze",
      acc: "#9ac060",
      car: "#2a6a3a",
      bg: ["#16240e", "#4a6a2a", "#101a0a", "#d0e890"],
    },
    udara: {
      th: "za",
      acc: "#cfc8ff",
      car: "#4a3a9a",
      bg: ["#1c1a48", "#6a64c0", "#14123a", "#e0dcff"],
    },
    air: {
      th: "zw",
      acc: "#7cd8ff",
      car: "#1a5a8a",
      bg: ["#081c3a", "#2a6ab0", "#06142c", "#a0e8ff"],
    },
  };
  const ACC = {
      zf: "#ff7a32",
      ze: "#9ac060",
      za: "#cfc8ff",
      zw: "#7cd8ff",
      zt: "#ffd24a",
    },
    CAR = {
      zf: "#8a1c2a",
      ze: "#2a6a3a",
      za: "#4a3a9a",
      zw: "#1a5a8a",
      zt: "#5a1a8a",
    };
  Object.assign(TH, {
    zf: {
      a: "#3a1c22",
      b: "#341820",
      w: "#1a0a10",
      w2: "#7a2a1a",
      t: "#7a2a3a",
      t2: "#ff7a32",
    },
    ze: {
      a: "#2c3826",
      b: "#273222",
      w: "#121a10",
      w2: "#4a6a34",
      t: "#3a5a2a",
      t2: "#9ac060",
    },
    za: {
      a: "#38345a",
      b: "#322e52",
      w: "#16142c",
      w2: "#6a62a8",
      t: "#5a54a0",
      t2: "#cfc8ff",
    },
    zw: {
      a: "#1a3248",
      b: "#162c40",
      w: "#08121e",
      w2: "#2a6a98",
      t: "#2a6a98",
      t2: "#7cd8ff",
    },
    zt: {
      a: "#201428",
      b: "#1b1022",
      w: "#0a0610",
      w2: "#6a3a98",
      t: "#6a3a98",
      t2: "#ffd24a",
    },
  });

  /* ---------- data 12 bintang zodiak (urutan lantai 1..12) ----------
     k = kunci sprite, n = nama bintang, t = nama lengkap bos, el = elemen, weak = soal kelemahan,
     at = tipe serangan (jarak dekat / jarak jauh + jenis tembakan) */
  const M_ = { atkT: "melee" },
    R_ = (shot, n2, shotCol) => ({ atkT: "ranged", shot, n2, shotCol });
  const SIGNS = [
    {
      k: "zaries",
      n: "Aries",
      t: "Aries Palu Faktorial",
      el: "api",
      weak: "geom",
      at: M_,
      intro:
        'Palu raksasa menghantam lantai hingga bergetar. Aries, penjaga pertama, mendengus: "Kamu kira angka sanggup menahan palu ini?"',
      win: "Palu Aries jatuh berdentang. Sang domba merah mengangguk dan membuka tangga ke lantai dua.",
      who: "Prajurit Pembelot",
      say: [
        "Selamat datang di Istana Zodiak. Dua belas bintang menjaga dua belas lantai, dan di puncaknya duduk Ophiuchus, bintang ketiga belas yang tidak diakui langit.",
        "Lantai ini dijaga Aries dengan palu faktorial. Pukulannya keras tapi lambat.",
      ],
    },
    {
      k: "ztaurus",
      n: "Taurus",
      t: "Taurus Kapak Pecahan",
      el: "bumi",
      weak: "pecahan",
      at: M_,
      intro:
        'Taurus menyeruduk lantai dengan kapak terangkat, sekokoh pecahan yang tidak bisa disederhanakan. "Lewati aku kalau bisa membagi dengan benar!"',
      win: "Kapak Taurus retak dua. Sang banteng mundur dan tangga ke lantai tiga terbuka.",
      who: "Tawanan Penambang",
      say: [
        "Taurus menjaga lantai ini. Perisainya kuat menahan tebasan, tapi ia benci pecahan yang rumit.",
        "Ia paling berbahaya kalau sudah menyeruduk. Jaga jarak dan lompat!",
      ],
    },
    {
      k: "zgemini",
      n: "Gemini",
      t: "Gemini Kembar Selisih",
      el: "udara",
      weak: "arit",
      at: R_("knife", 4, "#e8eef8"),
      intro:
        'Dua bayangan berkerudung muncul bersamaan dan saling bergandengan. "Satu soal, dua jawaban. Pilih yang benar!"',
      win: "Si kembar lenyap bersama bisikan terakhir. Tangga ke lantai empat terbuka.",
      who: "Pelayan Berbisik",
      say: [
        "Dua suara selalu berbicara bergantian di lantai ini. Itu Gemini, si kembar pemegang belati.",
        "Mereka menembakkan banyak belati sekaligus. Lompatlah tepat waktu.",
      ],
    },
    {
      k: "zcancer",
      n: "Cancer",
      t: "Cancer Capit Persen",
      el: "air",
      weak: "persen",
      at: M_,
      intro:
        "Capit raksasa menjepit udara. Cancer merayap menyamping dan menutup lorong, persen demi persen.",
      win: "Cancer meringkuk ke dalam cangkangnya. Tangga ke lantai lima terbuka.",
      who: "Koki Istana",
      say: [
        "Aku sudah sepuluh tahun memasak untuk Cancer, dan masih belum tahu cara membuka cangkangnya.",
        "Cangkangnya keras, tetapi ia goyah kalau dihadapkan dengan persen.",
      ],
    },
    {
      k: "zleo",
      n: "Leo",
      t: "Leo Pedang Eksponen",
      el: "api",
      weak: "alj",
      at: R_("fire", 3, "#ffb040"),
      intro:
        'Api menyala di sepanjang bilah pedang. Leo mengaum dan surai emasnya berkobar. "Hanya yang berani boleh lewat!"',
      win: "Api Leo padam menjadi bara. Sang singa menunduk dan menyingkir dari tangga.",
      who: "Prajurit Terluka",
      say: [
        "Pedang Leo melempar gelombang api. Jangan menunggu, ia menembak tiga kali berturut-turut.",
        "Singa itu bangga, tapi aljabar membuatnya kebingungan.",
      ],
    },
    {
      k: "zvirgo",
      n: "Virgo",
      t: "Virgo Sayap Himpunan",
      el: "bumi",
      weak: "pecahan",
      at: R_("feather", 3, "#c8e8a8"),
      intro:
        'Sayap Virgo mengembang, bulu-bulunya penuh himpunan yang saling bersilangan. "Murnikan jawabanmu, atau kembalilah."',
      win: "Virgo terbang ke langit-langit dan lenyap. Tangga ke lantai tujuh terbuka.",
      who: "Peri Tersesat",
      say: [
        "Virgo dulu penjaga taman. Sekarang tamannya layu dan ia hanya menyisakan bulu-bulu tajam.",
        "Sayapnya melepas bulu seperti hujan. Hindari satu per satu.",
      ],
    },
    {
      k: "zlibra",
      n: "Libra",
      t: "Libra Timbangan Rasio",
      el: "udara",
      weak: "geom",
      at: R_("dark", 2, "#7a5aff"),
      intro:
        'Sabit Libra berayun di atas timbangan yang goyah. "Setiap jawaban punya bobot. Semoga milikmu seimbang."',
      win: "Timbangan Libra berhenti bergoyang. Ia menunduk dan menghilang ke dalam jubahnya.",
      who: "Hakim Tua",
      say: [
        "Libra menimbang semua yang lewat. Yang timpang akan dipotong sabitnya.",
        "Bentuk dan bangun menjadi keseimbangannya yang paling rapuh.",
      ],
    },
    {
      k: "zscorpio",
      n: "Scorpio",
      t: "Scorpio Sengat Variabel",
      el: "air",
      weak: "alj",
      at: R_("venom", 3, "#ff6ae0"),
      intro:
        'Capit Scorpio menyala merah muda dan ekornya melengkung tinggi. "Satu sengatan variabel, dan kamu lupa semua jawaban."',
      win: "Ekor Scorpio terkulai. Capitnya padam dan tangga ke lantai sembilan terbuka.",
      who: "Tabib Ketakutan",
      say: [
        "Sengat Scorpio meninggalkan bisa merah muda yang menyesakkan. Hati-hati dengan ekornya.",
        "Ia lemah terhadap aljabar, karena variabelnya selalu berubah.",
      ],
    },
    {
      k: "zsagit",
      n: "Sagittarius",
      t: "Sagittarius Panah Peluang",
      el: "api",
      weak: "arit",
      at: R_("knife", 4, "#ffd0a0"),
      intro:
        'Anak panah Sagittarius membidik tepat ke dahimu. "Peluang meleset satu banding tak hingga," katanya sambil menarik tali busur.',
      win: "Busur Sagittarius patah. Sang sentaur berderap pergi dan membuka jalan ke atas.",
      who: "Pemburu Buron",
      say: [
        "Sagittarius menembak empat panah sekaligus. Mereka datang rendah, jadi lompat!",
        "Ia cepat, tapi hitungan dasar membuatnya ragu.",
      ],
    },
    {
      k: "zcapri",
      n: "Capricorn",
      t: "Capricorn Ular Akar",
      el: "bumi",
      weak: "persen",
      at: M_,
      intro:
        'Capricorn menegakkan tanduknya sementara ular di sisinya mendesis. "Akar-akar angka tumbuh di bawah kakiku."',
      win: "Ular Capricorn menyusut ke dalam bayangan. Tangga ke lantai sebelas terbuka.",
      who: "Pendaki Lelah",
      say: [
        "Capricorn sudah mendaki tangga istana ini lebih lama dari siapa pun. Ia tidak pernah letih.",
        "Ularnya mendesis tiap kali ada persen yang dijawab dengan tepat.",
      ],
    },
    {
      k: "zaqua",
      n: "Aquarius",
      t: "Aquarius Kendi Desimal",
      el: "udara",
      weak: "pecahan",
      at: R_("water", 3, "#4db8ff"),
      intro:
        'Air mengucur tanpa henti dari kendi Aquarius. "Satu tetes salah, dan desimalmu hanyut."',
      win: "Kendi Aquarius kering. Roh air itu menguap menjadi kabut dan tangga terbuka.",
      who: "Tukang Kebun",
      say: [
        "Aku menyiram taman istana dengan air dari kendi Aquarius. Ia tidak pernah kering.",
        "Pecahan membuat alirannya tersendat.",
      ],
    },
    {
      k: "zpisces",
      n: "Pisces",
      t: "Pisces Trisula Logaritma",
      el: "air",
      weak: "alj",
      at: R_("ice", 3, "#7cf0ff"),
      intro:
        'Dua trisula berkilat. Pisces bernyanyi dari balik gelombang: "Hanya logaritma yang tahu dalamnya lautan."',
      win: "Trisula Pisces jatuh. Nyanyiannya memudar dan tangga ke aula takhta terbuka. Dari atas terdengar tawa dingin.",
      who: "Penyair Istana",
      say: [
        "Lantai terakhir sebelum takhta. Pisces menyanyikan lagu pengantar bagi siapa pun yang naik.",
        "Di atasnya, Ophiuchus menunggu. Isi penuh HP dan Manamu di kristal sebelum maju.",
      ],
    },
  ];
  const OPHI = {
    intro:
      'Aula bergetar. Raja Iblis Ophiuchus bangkit dari takhtanya, ular hitam melingkar di bahunya. "Dua belas penjagaku jatuh, tapi akulah bintang ketiga belas yang tidak pernah ditulis. Hitung sampai habis, Penjaga Angka!"',
    win: "Ophiuchus runtuh. Ular hitamnya larut menjadi debu bintang dan mahkotanya pecah menjadi cahaya. Istana Zodiak menjadi sunyi.",
  };

  /* ===================== SPRITE ===================== */
  Object.keys(ZSP).forEach((k) => {
    const s = ZSP[k];
    SP[k] = { p: s.p, m: s.small, a: [s.small, s.small2] };
    SP[k + "L"] = { p: s.p, m: s.big, a: [s.big, s.big2] };
  });

  /* ===================== SPRITE BATTLE 96x128 (dari gambar referensi) =====================
     12 bintang zodiak + Raja Iblis Ophiuchus digambar ulang dari 12_bawahan_raja_iblisdan_raja_iblis.png:
     tiap sprite 96 piksel lebar x 128 piksel tinggi, maksimal 18 warna + garis tepi K, rata bawah.
     Kunci battle = kunci lama + "B" (zaries -> zariesB); sprite 32x32 lama tetap dipakai di peta.
     Data disimpan RLE: tiap baris dipisah "|", huruf = warna di palet "p", angka = jumlah pengulangan, "." = kosong.
     Mau ganti warna: edit hex di palet "p" tiap sprite. */
  const Z96 = {
    zaries: {
      p: {
        R: "#040513",
        U: "#00010c",
        S: "#070210",
        T: "#01020f",
        P: "#190b18",
        Q: "#110514",
        N: "#3a091a",
        D: "#654e56",
        A: "#d8af8b",
        B: "#a57565",
        J: "#841322",
        E: "#ba262b",
        C: "#ad5339",
        F: "#95242a",
        L: "#5d0f1f",
        G: "#612c30",
        M: "#400d1c",
        H: "#3c2d3c",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.33K4.24K4.31|.32KR2USK.8K6.8KRTSRK.30|.32KPQS2RK.5K2P4N2K2.4K3R3K3.29|.31KDA2PBABK.3KRTJECE3SRK.2KUA3QFA2RK.28|.29K3DA2NCA2K5R2LEC2E2QRK3RUA3NFABTK2.27|.27K2G2DBA2NMBA3PRFE4C2E2J2QUPQBA2BJLCBG3K.26|.26KUQLBA3BNJA4HUE4CA2CE3SUA5FJLA4GUK.25|.26KABJCA2BCNFA4HLE5A2CE3LQA5BL2BABG2MK2.24|.26KA2BA3C2PCA3U2E6C2E4FJBA2B3LMBCKG2CBRK.23|.24K2RA6BCKCBABUSJF2E4CEFE3FKDAC3NPC2KBA2BRK2.22|.23KMA2PLA3BDRQMC2UGJE3MPFE3JPNE2LSBC2U4BA4BCFRK.21|.12K5.5KRPA2NLBA2DUK2MGPKMEFEACMLE2FPLGFELMNGMK3UA4BJ3TK.21|.11KD5K.4KRPA2GFABDPK.2KRPLJEJCA2CME2MSBALJ2LMRTK.2KDA2BEFC2TK.21|.5K6UA5HK2.2KRPA6URK.2KRME3MFCGSMECNUCAPNFEJK2.4KA2FJBA2UK.21|.4KR2TR4B4APR2K3RPA6URK.2KRME2FLJEJMJECL2FCL2FEFK2.3KUBAC2A3TK.21|.4KU7K2FJPK2R6CBA4SK.3KSNFJLJ2NJE2CAE2F3JLE2FRK.2KTG2A5RK.21|.4KB7K2M2KD2H5R2NA4K2.2KUPEFJLJLUJE2C3EFJE2JE2LTK.KRUA4GA2RK.21|.3K2A5BDJF5DH5RTMA6K2SJF2L4N2JEF2GF2JLFL2JFJLPKDBCA5GK2.22|.K2A4BA3BJ2E2F2GH6UGA6TR2LEJUQJN2LJFLG3MJNJ2NJ2EFPRDACA5PK.23|KRHA9CEFGF2BH7KCBA2B2TU2NL2ML3MNJEF2JF2LPJ2LJ2M2QUGACBA3BK.24|KTPA2BA6CEPRNFAH3DH3PRDB2L2U5L6SJE6MU2J2L2U4TUFBA3K.25|KTPA2DA6E2SRPFAH3DH3PRGBCLMTU2PUML2NL2RLE6NURNJL2U3T2UGCBGCK.25|KTPA3B4ABE2L3FBD3K4U2K2R2K3RB2UNL3NULPQUQ2NLUHDGNPDHK4R2QRK.26|KTPA3B4ABE2ML2EBD2HK.2KU2KR4K2TB2UNLJLPULU5PLUHDGPQDHK.3KTURK.26|KTPAB3D2B3E2MKLEBH2K.K.KU2RTK3.KRDBGMD2MKQNMNP2SUQUHDBD2H2K7T2K.25|KUPBD5B3CEMQJEBH3KHK2T2RK.KHK2RKC2KD2GKPNLM3U2SUD2ADHR2KH3DK2RTK.25|KUQD7B2CFNQMEBH2K3.KT2K.KH2K2RKCGHD3KGL5KSP2B3DKR2K3GDK6.24|KTUD2H4D3CFMPLECK3HK.KU2PKB2HK2RG2QB2D4C5K2DB3DK.K2HD3BD3KU2K.23|KTQD9EFMKLECH2KHK.KU2PD3HK2RG2UB3D2B2C4H2B4DK4H2D6KU2K.23|KTRD2H3KHDHFCMPGBCK2.K.2KURHD2HK.KCG2BA3B2A4B2A6DRHC2K2H5K.K2TK.22|KTUD2H2K2HDHFCLQBC2K.5KR2PHDK.KGCGHA4B2A4B2A5BDUGC2K.KH4K.2KSK.22|KTUD2H2D5EC2DCEFK.6KRK5FGFDBA4BDBA3BDA4B2DPG3K9.KRK.22|KTUD2H2D5E2CBDFHK.6KQK.KG2CGSDBA5D2A2CK2A4B3DHRTC2GK.2KR2K2R2K.21|KTRD9E2CBCFK.7KTK2GC2GNUDBA5D2A2CH2A4B3DHU2C2GK3RH2PRTRK2.20|KTPB3D4KHGJBAFGDK.6KGCABTR2HDB3A5D3KA6B3D2URU2NG2C4DH2RT2K.19|KTPBDBD4KH2JFEFDHK.4K3G3KR3HD2B4A3HD2KA4B5D2S2KGMKNC4GK2RTRK.19|KTPBD2PUTUTUKNM3RS2K.2KU2SQSDG3UHD2B7A3CB7D2H2K2T2FC2G2MPKMUTK2.20|KUPBD2TUR5GFCGR4K3USQ2NCG3UHDB3DB4A3B7D3H2K2T2FC2GM2QL2QUK.21|.K2U6R4G2JGSUT2R4SB4C2FUPHD5B2DPG3P2D7H2D2T2C2B2C6FRK.20|.2KR3U5RTG3LU2T2R4TB4C3UPHG2D6SNMPRTD4H5D2QUC2B3CBC4TRK.19|.3K7QP2GM3TUP2H3S2C2B2CF2TKHGD3BDH2NM3P2KH2D6H2U2GFCB4C4P2K2.18|.8KUPG3TURKSHD2B2PHU2CBCG2KRSHCBCUPL2JCBCF2K2SB2AC2GTU4SC2B3CBCE2JU2K.17|.8KTPG3TUQK2HD2B3DSUC3G2KQRHDC2UMJF2CBCFEFGKDB2CFGT2U3QCB4C3EFLQRK.17|.8KTPK5U3NCBD2BDGLMG2R2K2QR2QRGFC2E2FE3C2GHKTR2SRTKNQSKFC3GMQPMC2MK.17|.8KTK6URK2C2D2B2DMLFJRUKNSR2S2G2C2E6C2GKRUTS4N3S2FC3GMSQMC2MK2.16|.8KTPG2HU2RK2RCBFB4C2L2RUP2NSTLGF2C2EFJFE2C5GMUSN7SUCFM2CA2BC2GRK.15|.8KTNG2HTUR2KRCBF2B2DCFL2RSP3T2GFC5FK2C8HRPN7S2CGSMCBADC2GRK.15|.8KTK4QKTR3C2F2D3C2PNQ2PN2STF2C4MK3C7GHQPN7U2MLG2CBABDCGTK.15|.8KUK.3K2T3GCGJGH2DC2T2N5QSG4C2RHB2T2G2C2FGHRQN6PUMKGD2KDA2BFMRK.15|.8KRK6RT2CGKGH4FGTRN5QSLG3CGTDB2PTKGC2FGMTSN3MN2PULGD3HBA2BCMRK.15|.9KTU2SJLPTLGK6L2MUSMN3RKMN3GTPBG3D2R2GC4KUQN5PTUH2D2HBAB2AHRK.15|.10K2UNJ2LRMKR3K.KL2NPN5RMGC3GRHBGH2K2H2C2A2BKSTN2M4SUHKD2HDAB3HRK.15|.11KULJ2LSMNRPMPK3LN6PUSPM2CK3DGH2K2H2CB2AKRUSPMLM3RUGHDH2DB2C2HTK.15|.11KTNCFMSM4LM3QRPN5U2H2K2GMQKD4K4PM2PKPKU2MLM4NTLGH2DBCEMK2.16|.11KTPC2MUM4LM5N6U2D2HPULK2D2BCRPLMU2DGKH2U2NLM4PRL2H2DB2GUK.17|.11KRPC2MSMNM2L2M2N7PSPD3PUJ2K2B2CPQJ2TUD2GHKU2NM2N4RKGHGDBDGUK.17|.11KUPG3T2PML3MN7QUD2HD2U2FEJKDBGJLF2TSUPBD2K2TN6R2HGCD3HUK.17|.11KMLG3T2NML3MN7PUD4BQUFEJFJDF5S3TBDBHKQN6R2HKC2D2HUK.17|.11KFEGKGUSM2LJLM2N5SKH2DBCU3JF4JF5U2H3B2D2HUPN4UTR2GACGRUK.17|.10KRFEJG2U2M2L3M2N4MQRH2CACUTUF7E2F2QUH2KB2D2HUPN3PU2T2HAC2TUK.17|.10KRJF4U2NML3M3N2M2QRHD2G3PUC2F7C2RUG2KC4DHM2NPSK3H2G3RTK.17|.10KRJF4U2M2L3M3N4SRHGDGD2PTA2E5F2BAKTD2K3C2D2HM2U2K.KH3GDSTK.17|.10KQE2FJ2U2M2L3M3N4TRK2C3DPTA2CFE3F2BAKRD5C2GH2PMQK3H5GTUK.17|.9KRQC2FJ2U2ML2JLM3N2RUTRFC2B2DPRG2CF2EFGHC2KRDB2D2K3R3MQKU2PH3K2TUK.17|.9KRQECFJ2U2ML4M2N3UPCF2ECB2DPUGC2F4G2C2K2DB2D2G4PTNK2U2SH3K2TUK.17|.9KRSECE2FU2NL2NM3N2PUNC4A2BDH2KRPCE2F3U2K2DBC2D2H3RUMNK2UPKH2U2QNK.17|.9KRQECE2FU2NL2N2M2N2PTMC5B2DH2KRPCE3FCTUK2D2C2DH3KRUNMPKUKH3SQL2RK.16|.9KRQECE2FU2MLMN2LMN3RLC6BD2H3KQGECKTK2H2D2C3D2K.K2RM4S2URLF2LRK.16|.9KRQECE2FU2MLMN2LNMN2RLC6BD2HK3RPG2R2K2H2D2C2BD2HK2.KM3NP2QPJ2FLNK2.15|.9KRQECE2FU2MLMN4M2NTMFC3BD5HK2TKNKR2K2H2D2C2B2CDH2KTL2MN3PLJ2F3URK.14|.9KRQECE2FU2ML2N5MNUNMC2B3D4HK2SPNMR2K2H2D2BCB2CDH3UMLMNM2NLJ2E2FU2K.14|.9KRQE3CFU2MLMN4MPRUKMDB4D5HKRPN2PKRH4DC4DH2K2UPL3M3LF4EL2K2.13|.9KRSE2C2FU2LM2N5RU2K4DB4D3HKSQN3PTH4D4P3SK2TNL3M3LMFEF2EFTRK.12|.9KRSE4FNTM3N4PSU2JE2FGD3BD2H2PQPN3PUPK3D3GNLE2JLQML4M4FE2F2JM2K.12|.9KRQE4FMTNLMN4TUSMJE4LKD3H2RUP2N4USK.KDH2KLJECEJK2NLJLM3NJE3FJF2RK.11|.9KRSE4FLTNLM2N3TUNJFC2E2JLH5SUPN5QSK3DH2GE3CE2LNPNL2M3NLFE2F2J4K2.9|.9KRSE4FLTNLMN4U2FECBCE4PRH3KPN8R2K3RLE2C2E3MUQL3M3NJE2F2JFE2PRK.8|.9KRSE4FLTNM2N4U2FEC3E2F2MPH2QRN9R2K3LJE3CE2FMUPJ2LM3NJFEF4E2MNK2.7|.9KRSE4FLTPNM2N3TUFEC3E2J2FLUTRPN3M4N2R4TLFE2CBCE2LUPJ3LM3NJE2FLGE4PSK.6|.9KRSE3F2LUPNM2NM2U2FEC3E2J2ELT2SQN3M4N2RTK2TLFE2C3E2JSNLJL3M3J2E2G2F2E2PTK.K3.2|.9KRSE2C2JLUPNM2NM2PRJEC3E2FJFJFMUSN2M6N2PUTLJ2E2CBCE2JLMLJ2L4ML2E2JG4L2JLKC3K.|.9KRSE2C2JLUQNM5PRLFEC2E3JF3LU2M9N2U2J3E2CBCEFJLM2J3L6E3JLGLTJELKAC2K.|.9KRTF2C2FJUQNM5NPNJ2CE2FJ5LNKNL2ML3M2NPML2J2F2ECEFJL3MJ5L2MLJ2EFLGLML2JLFK2.2|.9KRTJ2C2F2SQN2M6QLJF3JLJ3LJ2R2L2ML5PTF2LJ4FEF2MLJ2LJ6L2M2LF3L2JQRL2K.4|.9KRTJFC2F2SNMNM6QJ2FJ2MJ4NL2S2LM2L4MPQF2JLJ3F3JMLJ9L2M2LE2FJ3QRKUSK.3|.9KRSF2C2F2SNM2KM5PNMJ3MJ2L2KL2USM3L3M2QSJ3MKLJ5NLJ2FJ6L2M2LE3J3PTKUTK.3|.9KRTF6UNLMQNM3N2USML2MR2KG4U2M3L5QRK5T2LJMSTLJ2F2JL2J4M3E4FJLK2L2K.3|.9KT2J2F4SMLMSPN5U2TR5G5U2LM2L5QSK2GK.K2T2RKTLJ2F2JL2J4LMLE4FJ2K2J2RK.2|.9KT2J2F2E2SML2NPN6PTPH2GKF2EGLSL11K2LK2HGK2H2KL2JF3JL3J3ML2E3FJ2FKJ2TK.2|.9KT2JF3E2QNL3N3MN4TPH2GKF3K2SL10JR2MK2G2K2GHKL2JF4JMLJ3L3E3FJFG2LMTK.2|.9KR2F4E2Q3MLPNMN5UPG4K4UQML10PK2.KH3G3RL2JF5L2J3L2MFE2F3J2K2TK.2|.9KRTF4E2S2R4KQP2N3STG4K.KU2ML2M4L3JL3TK.KH2G3RJ4F4JSRPL2SUF7JL2FJK.|.9KTUF2C2FESU2SRK2U3QM2S2G4K.KU2ML4M3LJ2L2NUK.KHK2G2KJ4F4JQRQPLU2FEF5JLJFLTK|.10KTQ2HGP2U2K3.2K4S3RG4K2SU2SUSNJ2QPL2JL3NUK.K.KHGRLJ4F3JSK6PQP2NFEF4LUK|.10KTS2K2R2TUK.7KRU2TG2H2K2SRK2TSNJ2NQNML4MU2K.KH3SL2J5FJTR2K.2KU4RFE2F3LUK|.10KRPNG2LMQTK.8K2U2K4.KS2K.K2NML2MQ2NLJ2NTRK.2K2HRPNJL4JLK3.4K6LJF2ELUK|.10KTL2G2J2PRK.9KU2K.KHK2SRK.3K2NJLQU3NJPR2K.4KR3MRSRNJMK.11KRLFE2JUK|.10KTLG4JQTK.9KU2K.KPK2S2K.5KL2NRTU2MKR2K2.3KRSRK5PK.13KMLJEJUK|.10KRK2G2K2QKUK.7KTUPK3R2KR2K.5KR3K6TR3K.2KTUK.5K.15KUMEJUK|.10KTK2G2K.KS2K.7KRUPH2K2SR3K.6K3.5KR4K3TU2K.21KULEJUK|.11K.KG2K2UK2.7KTGCFG2K.K2M2K.14KR2K3GFGH2UK.21K2JFK.|.12KRG2K2UK.6K2G2C3F2GK.KLMUK.13KTUK2LCFD3PNK.21KTPK.|.11KTUK2.KTK.5KM2C5F2JK2L2MUK.13KUPMPF2CDBC2FNK2.20K2.2|.12KURK.KRK.4KRGC4F2GJ2K2L2MUK.13KUMJMGFC5F2PTK.23|.13KRK.K2.5KRGC2EF3L3RNL2MUK.13KUMJL2GC5F2QUK.23|.13KTRKRK6R2MFG2L3S3TR4TK6.2K7TML2MLF2EF4PUK.23|.14KRTU7TR3U3TSQ2TU7T3UTK2U7TML2M2GF6PRK.23|.15KU8T4U8TU11K2RT6RU2T4U3RQKSRK.23|.16K32.2K19.K2.24",
    },
    ztaurus: {
      p: {
        U: "#010008",
        T: "#02010f",
        A: "#deb59e",
        B: "#c09181",
        D: "#85666c",
        Q: "#060416",
        G: "#5e4143",
        M: "#271920",
        H: "#583532",
        F: "#714335",
        S: "#040210",
        L: "#422729",
        E: "#844c34",
        C: "#af7356",
        P: "#0a0513",
        R: "#050410",
        N: "#0f0916",
        J: "#552d26",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.21K.46K.27|.20KUK.44KTK.26|.19KA2BK.42KDABK2.24|.18KQA2BK.42KGABT2K.23|.18KUA3K.42KDABM2K.23|.16K2A2DH2K.43KHFA2DK.22|.15KQTA2GTK.44KSMA2DQK.21|.16KTA2GQK.44KTLA2DTK2.20|.15KB2A2GQK.44KQLA3BGTK.19|.14KMA2BAGQK.44KQLA3BHTK.19|.14KMA2BAGQK.44KQLA3BHUQK.18|.14KMA2ECHPK.19K7.18KTMA4GTK.19|.14KMA2FELTK.17K2STSRPR2K.2K.14KUMA4GTK.19|.14KMA2F2CBCK.11K2.2KSNM7K3RK2.11KDABA4GTK.19|.14KMA2EGBABTK.9KS2K2STHF5H2LP2KRQK.9KQDA2C2A2GTK.19|.14KMA2CEC2DRK3.5K3Q2K3TH2F4H2KPN2PQ2K3.6KSDA2C2B2LTK.19|.14KMB2EGU2LBGUTK.3KGABK2PSJ2H2FGH2LHK3U2DABLRK.4KBAB5C2LUK.19|.14KMC3EMUMA2U2TK.KQDA2K2PSJ2HGFGH2L2K.KU2A3LRQK4SBA2CBA2C2LTK.19|.15KLHEFL3DA3MK3A4CSKLH3GH4G2K3EBA5BKUBA5BCB2ELMK.20|.15KQTELMGLGA3MPTA4B2UTH2GFGLH3GFHLSBA2CB2ACRUBA6C3HTK.21|.13K3QSE2NGKGBA2JGA5BCUSH2G3HLHGHGL2PEB2C2BACDBA4BA2BC2FRK.21|.12KMLKQMCEKDLKBA6C2B2CMKLGH2GFH2GK6FEBCB3A4CA2B5FPK.21|.11KQGADQ2LKDADQECBA4C4JMKL2K2H3K2.2K.2KNEC2AB2A4B3A2BC2FK.22|.10KD2B2DK2RTBABL2B2A3BC3EMNKHACLKLKTUK2CK.KPKE2C3A2B3A4CHLK.23|.9KTA3G2KRU2BABHGA4B4CEUSKFABMK3U2NTACK2QPK2C3A3B2A2B2CURK.23|.7K2GA3BLK.K2PB3GDABA2C4FHK3FC2K6PKCEK.KPKNF2EB7FEFK2.24|.6KSRGA3BTK.2KMAB2GKCBAC3K2Q2KNK4L2J2K.K4.2KSU3TMC4BC2T2SK.25|.5KRDA2B2ABRK.2KMAD2GSC2BC2EKSQ2KPK.3KJ3K2USK.3KRU2T2MC4BC2Q2K.26|.5KTDB3A2BQK.2KND3LUM6S2K2.KPK.KLJH2K.K2.K2.2K3T2PM4LM2Q2K.26|.5KSDB2A3BTPK.KTG3U5T5K.KPSK2LJH3K2.2KPSK.3KT3R5STR3K.25|.3K2D2GEBAB2DTQK.KUHBET2K5PTK3PNK3JH5JK3PK.5KQPRSNM2KPL3K4.22|.2KQMA2GKBABD2TK.KS2ECERQK.2KRTK2RTRKRTKH3KJH2L2Q2K.4KT2QK2J2LHLE2JT2SPK.21|.2KQMA2GMBABD2URK2RUHE2TRK2.2KTNKUTKNRTKH2J3H2L2Q2K.5KSQK2J2LFEF3SUTQK2.20|.2KQMA2BA2BD5K2ND2B2DGURK.2KTSRK2PUMK3L2JMKL2Q2K.5K2QLJL2FE5F4JTK.19|.2KQMA4BCBD4SPMD2B2DGU2K.2KRSK.KRSLK3LJLK2LKQ3K.3KPKTL2J2FE6FLURQK.19|.2KUMA4BD7GHD2CD3HGNK.2KPK2PS2LJC2J3FEJ2MSQK.2K3.KJKHF4E2F3JM2LK3.17|.2KD2B2A2BD7GKD2C2D4NK.3KPKT2RJ2ACJHJB2J2LTSQK2Q2K.KJHF10H2F2SRTK.16|.KMA2B3ABD7G2D2C2D4LK2.2KURU2TJHBCFJFC2J2MTRQK2TK3LJF11HFJ2M2NK.16|KQMA2BDBAD7GD3C3ED4QRK.KU4TJ2FBC3HLH2MSP2K2L4JEF4E5FH2F2E4MK.15|KQMA2BDBAD6GD3ECBCED4T2K.KT3U2J2FBC3HLF2MRTSKQJL3JEF4E6F5E3NQK.14|KQMA2B2D7G2D3C2D2CD4TUK3LNTU2J2EC3E2FJ2NR3TRM2JH2F10E2F2HJHKLK2.15|KQMA2B2GKD5G2D3BCD2CD4U2N3FNU2TJHC2E2GDELK2PKT2PR2HF2H2FEF6E4HJ2PUK.16|KSMA2B2D7G2D3C2D2CDGD2UTRMJ2NMKPK2E2F4EMK2PNML2QMH2J2H4F5E2F2JL2M2K3.14|KTMA2B4DG5D4GEC2EG3DTSMFMQ2G2MK.K2F3KHMKRPE2HKQMH2FHFKJKF7K7NTUK.13|KTMA2B4DG5D3G2EC2G3D2TSJFLQPG2MNKLKECHLHQKPQCFK2TNH2FJFNPKF3EH2JK7ST2K.13|KTMA2B4D3G6D3BCHG3NSKHTPKG3LSK3F2HK2Q2LF2D2GHKSLH2F2JK3F2H2LJ3LJF2LPRK2.12|KTMA2B4D3G6D3BCG2D2T2NJU2G4LT2K2H2K4PLD5GLTLJ3E2LMSE3JLF2HJHF5NSK.11|KTMA2B4D4G5HED2CG3DSN3UK2G4L2TK4TQKLD6GKQNLJ2FE2JLF2E7HF3JLS2K.11|KTMA2B4D5G4MFD3KG3SLKU2K2LG5Q2K.KS2MGD5GK2QS2J3E2JFJHFE6F2EFJRPK.12|KSMDB6D4ML3NHGD2NM2KMJFT2K.KG4LK2.2KQ2G2D3G2HK5M2K2JMLHF2E2FLE2FJF3JNSK.11|.K2UMA2B3D4RQ4K4U4EF2STK.KH2G2KQ2K.KSQG2EFEGL2HGK.KPRK2STRK2H2JMULEFKMEHFMSK.11|.2KRMA2B3D4SQ4K.KLU4EJHS2K.KLG2LK5PTSLG5L3GK.KP2K2STSK2J3MUMEFKHGH2LSK.11|.2KQMA2B5LK4QTK2FHPRK2PKHT2SK.K2GHKT2E3T4HG3K4.3KQPSK13.KG3NRK2.10|.2KQMA2B5MQK.KQUK2EFNPK2G2KU2TK2GHKQSN2E3JLU3QK3LK.4KQRTPK2HLK.8KH3NRSTK.9|.2KQMABCB2AGNK.3K2.KFJNPL2HK.KU2TRK3PRE2CACFEH2LQPKG2K.3KRSTUTURK2LK8SN3TRSK.10|.2KQMBC2EA2GK.5K.KFLURLH2K.KS3RK2QKPEC2BCE4LSQPK7T7KLHL2Q2SQS2TU4TRK.10|.3K2LMCB2AGK.4KTK2F2U3MLK.2KQPRKLFCE3CBCFE3FJ2MK2T2R2ST2R2QS2K3MNR2KJ4L3M2NK2.9|.4KQUDB2ADK.4KQK2F2NU2TK.3KQ2SF3ECE3ACFJE3HMH2LPSKST2Q2KQS2K3STRTHJ8HMQPK.8|.5KTDECBGK.3K2QK2FHU2NTK2.2KPRTF3E5BCF2E2FL2HFHJL2QRSPQ3S4KN2M2F3J6HMQK3.7|.6KQT3K.3KTRP4RUMGUR2K2QKRUFHFH2E4FE4FKGFE2FJLP2K5ST2U2L2E2A2BDF2D3FHJLTUK.6|.6KQTQ2K.2K2UT2PN2RUTMKELK2Q2RUH2FJ2FEFJ2FE4LGF4HJPRK.3KRUP2MLJBA3BDFED3F2JLU2K2.5|.7K4.2KT2JHFHFH2JKPKEKR5UH5JKFEFK2E3LHF3JH2QPQK.KNPML2HB2A4BKE2K2BA2B2J2T2K.4|.13KQTJHFHF2H3RK2JMU2RU2J2H2J2KCBCEM3JH3JHKSPQSQ2K.KPL2FHA2B3ABKFELKBAB3F2NPK.4|.13KQTJ2H6LK.2KJKU4RNK4EC5SUS2P3R3PTS2PK.KPLKCEA2B5KFEK2DB4CEMPK.4|.12KQ2THJK6PK.2KFKUTJ3LK2JCEK2JECJKP2LJLMHEK4SPK2MLME2B7KJHK2DB4E2MNK2.3|.11KQ2RTJ2H2K4UK.2KJMRSFCE3SHCJKJMKC2K2PCBFKCFK.KT3QJLJBCEKDB5JHFLKA3BDMQF2T2K.2|.11KQSQSJ2H3FJKPK.K2JMRTNE2JFTLCMEBCKECFKPC2K2H2K2NU3SJL2B2CK2B2A2BJF2LKBA2DLK2F2RTK.2|.11KQ3PLJHFH2L2K.KPK2NRTFEJKMULCEKFMFBEFLSN2KQ3KPSRU2NJ2HA2C2LDBA2BJ3K2B3K2GDB2MTK.2|.11KTQKPLJH2K3LK3SKNP3NPMKU2LC2TU2BAEFLT2KHLQK.K3PUNJLJA2BCHGDA2BLJ2K2B2DKLCDB2MTK.2|.11KTQKQL2H2JHJLKQKTP4H2J2K2RMFC2E2C2JM2LNKH4K.KTUL3D2B4DGKD3KJ2K2D2LJCB4HLK2.|.11KTQK3JF4JLPTPK2T2LHFHFK.KU2C4EFUTMLMKEFH2K.KS2L2MB7GK2PK2LJK2D2KEDB4GMT2K|.11KTQ3KLF2HFJLKTK.KNMJHF2HK4S2C3LMTUMLMKF2K5QPJ2MB7CEHE2KL2K2DHMDB5GMT2K|.12K2T2K2QTSQRT2K.2KMJE2F2MQJ3LKTU2P2L2J2MQF4L2KQPJ2PA2C2B2AE2CA2K5CFEB4D2KMT2K|.13KT2K2QSP3S2K4LHEFH2MTJL2K3UTL4J2MTHF3HLKQSLJPA2C2B2ACECA2KJKM2BLKB4D2K2T2K|.14KQT4K3SQKSQLHJH4U2FHLJ2LK2J3LJELQPMEFGK2SUJLPM2G5MNC3A2EBAC2ENMG4NST2K|.15KST2UK.KT2KTSLH2F2H2UTF2J4K2J4FELK3EFGK2T2JLPK8TEC2A2CA2CE2U2K5NQTK|.16KQKUK.KT2SMFHF4JKQTEFLJFJ3F2LJFELK.KGHJ3QSLJSHFHGH2KJ2MNMCJKLCLULD6LPQSK|.17K2UK3TQSMHJFEHJK2QTEFLJF6LJFELK.2KH2J2S2L2SF3ED2GHJU2MBLK2CMUGD4B2FJQSK|.18KPKEJSQMLHFE2J2K2RTEFJ3F4HJ2FELK.2KH4QSL2PD3B4D2HL2CE3BMLGD5BF2STK|.17KQJFCJTUJ3FEFLJ3T2EFJ2LJF3J3FELQK2SJHK2QSL2PB5AB3DFHC2BCEGD2ED5F2T2K|.17KQJFCEU2J3H2J5UTEFJ4E2FJ3FELQK.KQKLKQPLJPAB2D3B3D3FCBCJKCDE2D4FJT2K|.17KRJE3NUJ3F2J5TUE2J3FE2J4FELQK.KQK3SPL2PA2DH2DB6KFCLK2GBE2D3GHJT2K|.17KSJ4NRLJ2F2J4KT2EFJ3FE2J4FELQK.2K.2KTPLJKGD2FD2B6PJEMRDB2EF3D2FJT2K|.16KSE2J2LMPJ8K2T2EFJ4EFJ4FELTK.6KPNK2E2D2BDKDCDB2R2KR2DB2DGH2DBHJKTK|.15KUTE3J2MRJ6LK.KTUE2J4FJ5FELSK.7KPK2E2B3DKEC2B2NK3PDB3DHLCAMTK2.|.15KUTECEJ2MPK2NLJLK.2KTUEFJ4F2J4E2LRTK.6KTUQE2B2DFCEHDB2KH2K2DB3DK2C2NUK.2|.15KUTC2EHJMST3QKLK.2KSTEFKJ3EFJ4E2LPSPK.4K2U2TCED2LECELDB2KH2KPDC2B2K2C2NTK.2|.16KRJ3HJNSK2QTQK.3KQTEFKJ3EFJ4E2JPSPK.3KQ2TUTC2EGCECD2B3KHJKSDBC3D2E2UTK.2|.16K2MJ4NTK.KT2K2.2KQTEFKJ3EFJ4ECJPSPK.3KTNLHQLFC5B5KJ2S2DB2C2DCLFKTK.2|.15KQSMJ2EJNTK2.KQKSK3TUEFL2J8FELPSQK.2KTGE3KM2EC3B6RMLS2D2BC2BDRQK2.3|.15KT2MJ2LJNSHLK.KSPST3UEFLJ8F3LRSRK2.KUK2ECFSRMJFE2D4BRMLP2D2BD2F2SQK.4|.15KT2NL4RQLGK.KSKSU4EFJ6F6MT4RK2UK2FCFSUNJFE2D5SKLK2D2B3JHQRK.4|.15KQKRTNK2PMB2K.2KUTK2TUE2JE2J2FE2JLFELU2T2RQK2.KLHE2HTUTK2ECD3KFEKPGD2HLR2K2.5|.15KQKQSMLKSMB2K.2KSK.KSUE2FE2JFJE2JLFELU2T2RK.2KL2GC2HTUTK2FED3KJER2G2HLMSTK.6|.14K4S2ML2U2C2K.KQPK.2K2MLE4JE3U2JELR3TRK.2KSL2E2HKS2KPK2HGK3JKPM2KQSQK.7|.13KTQK2STMLJU2C2K.KPRK.2KQ2NE4JE3U2LELP3TRPK2QSK2ECGSPQ2SPKL7K2PK2QTK.7|.14K2.KSTML2SUEDK.KR2K.2KR2TU2FEC2FKTUQKQPQRUKRSRT2K.K3P2RS2T2R2U6TQK.KTK.7|.13KSK.KT2MJLKSHEFK.KQK.3KQSU2JHF2LKT2K.KQR2U2K3U2RK4QSK3TU2T2Q3R2Q2K.KTK.7|.13KTSK2STMEJMT2LCJK2TRK.3K2TU2T5K2.2KPQRU2K.2KLUTP3SK4TU2K3Q2K4.2KTSK.6|.13KTSK2STMFJU3MFK.KNK3.3KSTSQ3P2K.3KP3TUK5HLNKQK2LHK2U2RK2QPK.5KTRK.6|.14KSQ3TMFJU3K5JL3K.2KRTRQ3K2.4KP3RT3PG2H2LECGLHGLTURK.KTPK.6KSK.6|.14KS2TQTMHJTU2PTD2FJL2H2K.KSTRKQ2K.5KP2QPSR2QG2HG2ECGLG2HSTPK.KTQK.6KPK.6|.14KTQ2RTMF2MT2QTGE2H2LH2K.KS2TK3.2K2.2KPQNQPQ2NL2GH2ECH4LPRQK.KTPK.6KRK2.5|.15KSK2TMF2MQKQSGF2H2L2K.KRQRSK.3KJFK.2KN2K2Q4KLHLD2L2HL2QPNK.KSQK.7KT2K.4|.15KSK2SLF2MQKQSG4HL2K.KQR3K3.KJFK.2KPNK2QRS2KLHLGDL2HL2S2K2.KSPK.7KT2K.4|.16K.KTMF2NRK2QTG4LK.KQPR3P2RK2E2K.KRP2K2PST3QKL2H3LGHS4KSQTSK.6KT2K.4|.18KUMF2NTK2RTG3LH2K2P3R5K2F2K.2KTUK2QST2UQKLG2H2L3SU3STK2UTK.5KT2K.4|.18KUMJ2PTK.KQTQ2L2K.KRSK4TKS2K2.3KU2TKSTSU2K2LKLKSK3TUTQTK.KQUK.K.3KT2K.4|.18KTMLJNQK.KQ4K2.2KUTK.2KTKS2K.4KU2TPRTKU2K2LK2QSTK2TUTKSK.KTUSKPK.2KT2K.4|.18KTMHJNQK4M2NK3.KU2K.3K2QSK2.3KRTKT2K2TUK.K3STK4TK.K.3KTSK2.2K2RTK.4|.18KTMHJST2QPKGHJKU2K2NUK.5K2QSK.KR2K.K2.2KUSKQU2K3SQK2.7KU2TK2PQRQK.4|.18KTMLJTU2RTKGH2KR2K2NSK.6KQ2K.KPK.6KTQK2TSK3P2QPK.6KT2SK2RQR2K.4|.18KTMLJTNB2C2B2L2K2ECEFTK.6K2.3K.7KSQ2K3A2BGKPT2K.6K3.2K2QK.5|.18KTMJ2RMABC2ABGHK2E2FETK.19KTQSK2LA3LKLT2K.13K.6|.18KTMJ2NMB2C2B2DGK2HFHLUK.18KQTL2MECBCBDE2MNQK.19|.18KTK3NMCE2B2E3KL4PUK.18KQTBCLCAE2B3CBGS2K.18|.18KTK.KRMCE2B2FE2QKL3RTK.18KQTC2LCBF2CBDEBGS2K.18|.18KTK3T2U3RU4T5R2K19QRTC2LECKFE2KHELT2K.18|.18KTS2KTUT5U4T8U14T2R2T2G2MHGKMHLKMLNT2K.18|.18KR2QTU6T13U10T6SR3TRQ6T4S2RK.18|.19K58.19",
    },
    zgemini: {
      p: {
        J: "#2f2d5e",
        S: "#04030e",
        T: "#03010e",
        R: "#060511",
        Q: "#060712",
        U: "#010005",
        E: "#6a6fb4",
        C: "#a495cf",
        P: "#180e29",
        N: "#461555",
        M: "#67175e",
        B: "#c3acde",
        H: "#3f4681",
        G: "#62487d",
        L: "#931a74",
        F: "#b3326e",
        D: "#9c77ad",
        A: "#dec5e2",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.40K.14K3.38|.37K3JK3.9K2STRK.37|.36KQUECJUSK.6K2S2K4.37|.36KP2E2JUK2.5KT2R2KN2MK.36|.35KUCBPS2HESK.4K2MRK2PNMK.36|.35KUB2PSQGEUK.3KPMLQ2K3M2K.35|.32K4JC2PSPHEBGK.KQMFMPKURK2LK7.29|.30K2U4GC2PSHKJBGRK2SMFL2NUSQKNRQ3S3K.28|.28K2UPE5JPK2GKNBCEK2SNL3NS2TSTRKPJ2KSK2.5K2.20|.21K2.4KSUE7JQHDEKJB2EK.K2SF3US3K2J4K3UK.3KS2K.19|.20KGEK.2KJH2E7JRJDGKJB2GK.2KRF3PS3KJM2NJ2K.K.K.2KP2K.19|.20KGBGK2QJE9HTH2J2E2CPK.K3ML2NK2N3LDGJNJK.KUK2QF2K.19|.20KGBGKQJE10JUH2PHEPQ2K2QUK2NLUTN3MNFGNK2.2KUSUPF2K.19|.19KQGDEG2HE11JHJ4USPK.K3.KNTPMLMN4K2MK3RQNMFLK.19|.20K2JB2CE4D2BCE5HKSTU2PEK.2KRK2QKMLDLNK2N2F2MNK2PL4K.19|.20K3DCE4CBAB2E5HJPTJE2HK.3K.2K.KLFLK.KLF3N2K.KM3K.20|.19KH2JKE4DA3B2DJ2C2E2HKJH2JK.5K4L2K.KLF5NK.KUTK2.20|.19KP2JPE3CA2D2BABH2BAEHJKJE4K2.2KU2RKMK.KL2F5MK2RUTRTK.19|.20K2SKE3DA2K2GFBE2DBK3HJE2HKQSK3T2RKNK2MFL3FLF2M3KR2SK.19|.21KQHE3D2ACK2MBCHGDHK2E2H2K2SUPN2K3NMK2F3KPKPF3LM2USK.20|.21KPHE3JUB2HGFB2D2EJKH2EJKJK2SKNK2NKN2MNF5PAF2L2M2SK.21|.21KE4HGF2ACA2B2ADEHQHJ2H2K.2KRSPN3K2F2L2F3D2F2M3NUK.21|.21KHEJESGDA5BA2DEH2JH2JK.2KQK3N2K.KLFLMF4DF2M2LMUK.21|.22K2GEQBA6BD2EHKH4RJK.2K.3K2.K2NL2MF3D2F2M2LMK.22|.23KG2QDA6BDCDQK2H2K3.9KR2NFM2F4DBFKL3MK.21|.23KHK2JA2DA3D2C2SK2H2K3.9KT2MFLMFD2FD3KLM3K.21|.24K.K2QA4DGDABSPJH5K.7KT3F2LMF2D2BMK2LMKMK.21|.25KJKPA3QPD2ABTJH3EHEJK.7KUTF2L2MLFDBMK2LK.KMK.20|.26K.KPQ2SPDCAB2PQK5HK.6KTN2LF3PSPQ2K.2K.3K.21|.29KU3PDBA3PK.5K.7KSN2LF3PRSU2K.28|.27K3PJKJDCA3HJK3.7K4NM2LF3PR2K2SK2.26|.26KUSKH2UJD2A2BE2GJPK.5KTR2LM3F4NKRUTU2SK.25|.24K2UG2J2KUJCDBC2G2D3UK.4KUT2MLM2F4MNKURMFPTK.24|.23KSRNBA2DGH2E2D3G2DGD2PK.2KNF3M3L2FLK3RPF4LTK.23|.23KU2GDB4KE4D2GKGH2CBK3UPF3MNML2M2N2KRF6NUK.22|.22KUD2GCBAF2K2GBCB2CKDCBABCSTNLF3LK2NLFLM2R2LF6UQK.21|.22KUD2GA3MJPK2DA4RDA3BAU2LF4LKRSF2LNMR2KF6TQK.21|.22KUD3AD2GE3K2BA3EGDB4U2F4LMK2MFLNK2JP2LF5TQK.21|.22KUED2F2JEC3J2D2A3G2DC3U2F4MK3MFNKGEJ2NRMF2M2TQK.21|.22KUEDF3HECBCEHPGADEG2D2C2U2LFLFMN3KNKGADJNK2NLMK2UQK.21|.22KUED3UEC2B3EHGADBAGJECBUML2M2NM3KNDA2DN3K2T2N2U2K.21|.12K3.7KPE3GUGC2B3E2HNGBADNGDCDM4P2M3K2D3MN3KTRKL2PK2.7K.13|.11KGBGK.5KSBDE2GQGHEC5EKGB2CGJDA2L2M2UPL3NKDGN6UTKN2JKRK.5KUK.12|.11KJBEK3.3KTBCE3PEH2EC2ECEQGB2CHJDA2L3MUPL3NKGNKN5PUKJNJKRK.4KQUK.12|.10KPDAEKHEK.2KUB2CE2PJGE3GECEJEBC2JPDBALM2NUPM3NM2KN2M3NQRKJ2K2TK.4KSFK.12|.10KPA2DKHERK.KUBACE2RUGE2H2CBEHB2CER2JC2MNKTU2N4MLM2NM3NSRK4QTK.3KSRF2K.11|.10KHB2G2KEK.2KJCBCEGKTG2HGEC2EDC3GKRKEGMK2RUTPN3MFLM5KTRK.2KPK.3K2RKLMSK.10|.9KCB2DC2K2.2KUEDE3RK3JC3K2CBC3TK2TDBNKT2KTUM2L2FLM2L2UTK3.KM2PK.KR2KN3KRK.9|.9KCB2EDCJK4UGE3JQK.KJC2BK2CBC3UK2UECNK2TKT2M2L4M2L2U2K2UK2F2PK3RK2N2K3.10|.9KEBGJHCB2U2SKPKGEJSK2QJC2GB4D2EURQUPKN2TK.K2M2LF5M2UTK2SKMF3PR2K.KUKF3K.9|.9KECGH2C3UGETKPJEJSK2RJE2HDB3D2EURQUTKMNTK.2KM2LF5M2TRK2RKF4RT2K5LF2K.9|.10KCEUTPH2THCDCBDGDTK2RT2SRTPHEJUT2SRGD2MPNRK.2KNMFMLMLM2TK.2KF4M2PK2R3KNTK.10|.10KCEUTSJHTHC2DADBDQKSUSRS3UJEPT4JGD2RTNTK.KUKMFPKP2KRT2K2MF4M2PSKT2RKNS2K.9|.10KE2JHU3JE2CECD3K2PJ2P2GNSJEPT3UGCD2R2KRK3UK2N3F2K2N2K2LF4M2RU2T2K.K3.10|.11K2E2U2K2TJE3D2EQ2PH3MD2HJRQ2K3E2D2KSURT2K2.KTLMF2M2FLK2MF2LNKRTRKSUK2RK.11|.12KE2U2K.K2P2ED2KQTPH3CDC2GTQK.2KJ2GDK6.K.KTL2M2L4MKNLFN2KSK3QUK2SK.11|.12KE2U2K.3K3EJKUGECEC2ECBGTPK.K2U2KGK.2KUK2RKRUL2M2F2L2MUTKPQTK2.3KT2UK.12|.12KJEJUK.6K3UE2C2EGDCBGUPK2UST2K2.2KRK.2KS2UL2MLF3L2TSK4.4KTK2TK.12|.12KJEHUK.7K2TEC3H2CBCGUR2KUPK3.2KSK2.3KU2L2MLF5TRK.7KTK2TK.12|.13KG2JK.6KTSGEDC2E2B2CJUK3JKHGQK.2K2FK.2KT2N2L3F5MSK.6KTK2TK.12|.13KPE2K.6KUQCE2B2E2B3PUK.KJKD2QK.KPNMK.3K2U2L2M2F4NUQK.6K2TSK.12|.13KPE2JK.4K2GDCEDB2E2BC2PUK.2K2DFMSK2NMK.5KUPL2M3L3NQK.5K4TK.13|.13KGB2GSK.2KU2HC2EB3EDBPUK2.2KJHFD2U3M2K.5KSPL2MNM3L2FMK.3KS2N2SK.13|.13KGC2GUK.2KU2GC6ECAPUK.3K3FDGU2RM2SK2.3KQNL3NM3L2MNK.3KTSN2TK.13|.14KPCHUK.2KECE3C6AJUK4UJ2GDHJUNM2K2TK.3KPL4M3L2F2RK.2K4USK.13|.14KPCDEJK2SDC2E2C5BAHSJ4UJ2FDGHUNM2K2TRK3QUL4N3MLF2RK.KSK.KUSK.13|.15KHGBJK2JC3E2C4BDGJPKJPKJ3G2E2PMNKN2K2Q3K2NML2M5L3K3SK.K3.14|.16KHBJQUJC2EHCBCDCADTK3JSTJH2J2G2N3KN2K2TRQK2TPL3M6L2UKRK2UK.15|.17KCPQJGE4C5ADUK.KPKJHGHJ2PJK5NK.KSK.KTPL4M7NSK.2K.16|.18KSPC3E3C4BADUK2U2H2G3H2JURK2N3K.KSK2T2PL5M6LU2K.18|.5K.12KPJC3DEGC3B2CGQK2U2J2HG2H2JTRK2N4K.K3T2RFL4MN3M3PK2.18|.4KHK.10KCB2C3EH2C3A2U2JK2U2J2G3H2PR3N6K2U2RK2TUL4MKN2ML3SK.17|.4KE2K.8KSDB2C3EH2C3ABU2JK2U2J2G3H2PSR2N6K2U2QK2TRL3M2KN2ML3UK.17|.4KHEK.7KC3BCE2C5B2GHPJ2KTUJ3G3H2PTRSK3N3K.KUSK.KTNL3M3N2ML3PK.16|.4KHEJK.5KTCBC2E3C5BAURJ3KSUHJ2G3H2PUS2K.KN3K.KUSK.2KTL4M2N2ML3PUK2.14|.5KH2K.4KPCB2DE4DC4A2U2H2J2QUHJ2G3H2PUR2K.KNMNK.KUSK.2KTL4M3N2ML4PUK.13|.5KH2K.3KU2B3EKE2C5BA2KPH2J2PUHJ2G4HJUK2.KN2M2NK2T2K.2KSUML5N3M2L2PUK.13|.6K2JK.2KUQBCEHJEC6BDGH4J2PUJ3G3JPUK.2KPN5K2T2K.2KRQNL6N5LF2PK.12|.7KJK.K2EC2E2RPEC2B2CBAGUH4J2TUJ3G3JPTK.KSRN5K2UTK.3K2MLFL4N5LF2U2K.11|.8K.KG2B2E2HQHEC4BADJKH4JPTUJ3HG2JPUK.KSTKN4K2U2K.4KN2L5N5ML2M2K.11|.9KTCB2CE2H2EC5BAGPKH2J2S2TUJ4GHJPTK.2KU2N4K2U2TK.4KUFL4MN5ML3SK2.9|.8KTGC3EHKE3CBC3BADK2H2J2SU3J7PK.3KTUNMFMK2TUTK.3KSUL6M2N3M2L4SK.8|.8KUCE5KEC3A2B2EURJ2H2J2U4KJ3FNRK.4KT2MF3K2S3TK.3KSU2MF2L3MN2J2ML3UK.8|.8KUDCEHEHJEC3A2BA2UK2JH2J2TUTSK2JNMNSK.4KS2MF3NKR2S2K.K2.KT2F3L4MN4ML2UK.8|.6K2EH6E2CBA4CP2JK.KG2K2S4KJ2N2KTSK.4KUPMLMNKR2SRK2MNKR2KNMF3L3MN4M3LK.7|.5KRJE2H3J2EC2BA4CTPJ2K2MGK2S3RJK2N3U2K.4KUTNM2NKSR2SK3PKR2KQUF3L4NK2N3L3K.6|.5KRPEH4E5BA3DEJHJ3H3KTUTSRJK.K2PU2K.4KU2K2MK3R3TRK3SRKQSM2L6MN4L2NK.6|.5KR2H5E5B2A2JH3J3H3U3TSRK.3KTUSK.4KUTK.K2NKQ2SURKR3QKQSUNL6M2N3M2PK.6|.4K2PJHE6C3B2GJ3H2J2H4UTU2K2.3KTKSK.5KSPK2N3MPKSUTRQRK2.K2UML9MN4PK.5|.3KSUH3EC3KPB3A2GTJH5EH3US2TK.5K.K.6KSM2KN3M2KST2RK2.5KSRNL3FLM2LN5UK.4|.4KPHECBDP2JCA2BG2J4H3E2H3UKSTK.14KUM3N4MTUKTRK.7KT2M2L3M3LN4UK.4|.3KPHECB2QRTGEABDKUJ3H4E2H3SKSUK.2K2.10KUNM2LKN3USK3.8KS2RSL3M3LMN3PNK.3|.2KUCB3JQUT2BA2DUJ5H3E2H3JRKSUK.KMFK.9KSPM2F2N3URK.K.9K2S3MFMS3PL4NSK.2|.K2DBCPJQU3TBA2CTJ4HE2HE2H4SKSUK.KMFK.9KSNML2MNM2URK2RK.9KSU2MFMSRSKMPQRKMK2.|KSPBGK2UK3U2BCGJ5E3HE3H4SKU3K.KGK.K.8K2NLFM4URK2RK.10K2SRPLK4ST3NFNRK|KTUTK.2K.2KSTBDGKJ4E2H2EC2H4TKU3K.KGK2UK.7KRSLFM2T2UTK.K2.10KR2SULK.3K5U3K|KR2K.6KRPCHJKJ2HE2H3E2CH3J2KU3K.2K2RUK.7KT2MLM2U4K2S2K.8K3RQRNRK.6KSRK.|.K2.7KJCH2JPJ2E4HCE3HKJ2T2S3K.3KSK.9KTM4U3T2RT2QK.6KUQKQRQU2K.7K2.2|.10KJEH2PU2E4H2CE2CHKH2U2KR2K.3KSK.9KTM4UTR3KT2K.6K2TQK2RKT2K.11|.9KJEHJPKHE2HJT2E3C2JTPQK2.KRK.4K.11K2MFLT2K3.KRSK3.2KUSRTS2K4UK.10|.9KJH3GPH3PTSTJKC3JR3K.2KRK.3K.12KULFLT2K.2KRT2KR2K.KS2TK2ST2K2RK2.9|.8KJEHJ3PK2JK2UTJTGC2PRK2.3KTK.2KTK.11KTNLMSTK.2KT3KRSTKT2RK.2K2SRK2RTK.8|.7KSPJRTSQK.KQK2SQJSJE2U2K.4KUK.KU2K.11KUPM2SUK.2KU2SKQTURSUK.5KTSR2TK.8|.7KR2S2T2K.3K.2KP2SJCEUSK.4KUK3T2K.11KUPM2U2K.2KU2SKRU2K3.7K2T3K.8|.6KUK6.8K2R2QUK2.5KUPJKU2K.11KSPLMU2K.3KTSRQU2K.11K2TUK.7|.6KUK.15K2TUK.6KSPJPU2K.11KUPFLU2K.3KTSQ2U2K.12KSUSK.6|.7K.13K2.2KRK.6KRK6SK.10KPM3PUK.3KUSK2USK.13K3.7|.20KS2K.2K.7KUK2GK2SRK.9KSM2LM2UK.2KSUK.2KS2K.22|.20KS2K.K2.6K2UK2DK2S2K.9KQM2LM2RK2.KSUK3.KSK.22|.19KUK2.KR2K.4KQU2K2JK.KSK.9KSM6UQK2S2RT2K.KUK.21|.17K3TK2.KS2K6SQPK2JK.KSK.9KUM6PRK.K3STK.KUK2.20|.13K.2KTSK2R2K2SU3S5H2KJ2K.KSK.6K4UM3KM2LRK.3KSTK3UTSK.19|.12KSK2TUT2KS2T2U6S2TH2J2K4UK.4K2QS3UM3KM2LRK.3KTU3TUS2K.19|.13K.KTU2TST3U6TST2K3QSQS2K.4KQ2S3TUSR2SK3RK.4K2U3TS2K.19|.16K18.3K5.6K11.3K.7K6.20",
    },
    zcancer: {
      p: {
        T: "#020211",
        S: "#040513",
        N: "#410d1b",
        M: "#691121",
        Q: "#060818",
        D: "#cf2f35",
        P: "#1b0816",
        G: "#bb1f2c",
        U: "#010109",
        R: "#050616",
        L: "#991325",
        H: "#a11e2b",
        C: "#974448",
        A: "#ce9b87",
        J: "#691e2d",
        B: "#b2605a",
        F: "#cd232e",
        E: "#543141",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.55K2.39|.39K2.13KTSK.38|.37K2NMK.3K5.4KN2K2.37|.36KQTD2QK3NM3PK.2KNDGUTK.36|.36KRTD2T2QPML3NQK2TPDHU2K2.35|.34K2HCAD2CJTL6M2NB2ABCGHPK.34|.33KQSGDAD2ACUMLH2GHLMPDBA2D2HRQK.33|.29K2.KJLNPMHGD2CPMHDH2GHLMDCD3FMPNTK.K.30|.26K3UTKMFGLUNLHG2PNLHDH3LFGP2LG2LUPLHMKQK4.26|.25KPA2UTKJG2LP3LH2PNL2H3LHG2NPL3MPNLGJPQRA2NK.25|.26K2BA2UNDFG2LP2U2J2DH2D2HL2M2NUTPNG2HGBA3KRK.26|.28KA2EPD2G2L3MUJCD2HD2GLMNMNUNL2GH3CA2BRK.27|.29KBAEP2LGL2MNKPEJLHL4K3PRPNMLMHC2UTK2.28|.30K2PU2N2PRQRQSAK2LH2KPA2KT3U2K2TUT3K.29|.26K.K3TSUSK2R2K4A2KJC2KEA2KT3R3QSU2TK.2K2.26|.24K2TKRTCABGK2RQKQ2K2CBNKCBEKNEK6Q2LDNK.2KSQK.25|.23KU2QKQ2CAD2MKRK.KSK2CMK2CBERSK2RTK.KR2HDNK.2KGMSK.24|.22KNM2TK3LGABMK2.2KTK.KE4CE2K2R2NK.KMLB2HK.2KLMN2K.23|.21KNHDJT2K2HGA2MK.K2T2K2.KE2CBCE2KQK2.KNL2A2HTK.KTPD2TK2.21|.20KPGDBHUTK2HGA3BKRSTKQSK2EB3A2EQK.2KTMLHA2GN2K2TND2HMNK.20|.19KNFGBAMU2K2HGLBA2PSK3UTK2E2CEBK2RK3J2P2CBG2M2TKR2G2BD2TK.19|.19KPG2BAMU2K2G2LDADHNPKRT2K2ECE2BEKQ3KE2P2BDFGNMTKT2G2AD2TK.19|.18KB2D3GHJKRSNMLNJDGMDJKU2KQEBA5UTK.K3PDGLM2NTRT2NLFD3NK.18|.17KUCAD2G2LJ2TU6DHMDMKSTK2BAT2QA2T2QK.K2TBHRTUT2U2NULGFD2NK.18|.17KNHBD2GL2J2TU3T2UCJ2HLER2K2E2Q2KB2T2K.KQTJHMRQS2TUM3LHGFDMRK.17|.17KMF2GJNL4NUK3QTUTEKJETQRPEKQ2K2TQK.2KU2K2R2K3SPGHGMSL3MTK.17|.17KNG2LMNLHLGNUK.2KT2SK2E2Q2RPENQRK2Q2K.K2UK.2K5RNLH2NUJL2NUK.17|.17KTSRK3MLMNPK.2K3QTK.K3S2QECE3PKRTKU2K.K.KE4CJUPNK4TK2.18|.17KTUTK.KJL2PSK3HJKTUK2R2KU2SPBCECEKTUKU2K2RKE5HNU2K2TK2S2RK.17|.16KPHNTK.2KN3E2J2DCK5SK.KT2PEB2E2TSK4PK3E2BE2HJPSRK2.KTNHJK.16|.15KUPDLT2K.KU2NE2H2DCK.KRTPEK6E2KRT2E3KRK.2KEC3J3TSK.KTUMDJRK.15|.14K2MHDHTSK.KSUKE2C3K.2K3EBE2K2.2K5E3A2PRK3EKD2CE3JNK2U2ND2JEK.14|.13KQRD3HUQK2UTK.KABE2K.KUKEBAB2CQK.K2UTKEBA3ERE2K3JD2CE2TNMNU2NGDBJTK.13|.13KTRD3HUK.KTRK2EB2EK4UKECA3BRQKE2TSE2BA3KTEK4C3E3TJMNSUNGDBCRK.13|.12K2D2G2DGNK.KSKRQK5SUTKECA3BE2PKE2KPEA5E2U2STRK3TRQRPM3PMF2DJTK.13|.11KT2D2H2F2GPK2ST2RQK2S5KECA2BCE2Q2EJQ2EA4BE2U2QSRQRKSRQTPL2MPMFG3CEK.12|.11KU2B2JMF3H2KSUK3.2K2SRK2EC2BCE4K4PEBABE4K3SK3.K5N2M2LFGCBAERK.11|.11KU2BENMF3D2NTUK3.3KS2PE4CE4KSK.K3E5BCK2SK.4KEK.KTUHF2GHCA2ETK.11|.11KECE2PNMG2HLNSK2E2K.2KU2K2CBE5PKPK2PK2E5BCK2TK2.2KE3K2TUMH2LNKBACEK2.10|.11KA2J2U2K3U3KE4K.2KU2SQK3EK2SUNDG2DMTRK4EK.KU2TK2E4K.KTU2PU2E2BA2ETK.9|.11KA2J2UTK3U3KE4K.K2U2RK2.KEUTU2MDFD2LP2K4EK3T3K.KE3K.KTU2TUTEKBA2ETK.9|.10KUA3BKRKU2H2NUK4.KT3UT3K2UJNM2LDA2DFGNUT2K3TS3R2K.K3TK2H3TRK2CB3QTK.9|.10KUA4T2RU2CLNUTRK.K2TK2T2UTQU2LGLMLFBADGFNUT2RK2TSK3SRK3QUSKHJKR2KTB2ECR2K.9|.10KTEB2CRT2K2E2K3SRKS3K.KTUPLMPHD2M2FD3FMNMGH2DKRK.2KTSKTU2K2ECEK2RQK2E3QTK.9|.9KQTUE3RSUK2E4PT3UK2.3KUNDGNGD2CNGD3FNMGFDFGQK.3KTU5K2E4K2RK2ENTRTK3.7|.9KEBNE3TSK.KE3K2TSUK.5KTNG2LHD2HNGD3GNMFD2FMNK.4K2U3K.KE5K3.KQ2EAKS2K.6|.8KTBAEQE2UTK2EC2K.2K2UK.5KSNLGFH2FGNFD4TMGD2G2LQK.4KU2K.KE4BE2TUKQ2KA2BTRK.6|.7K2TECP2E2TK2E4K.2K2UK.4K2SNLGFH2G2MGD3GPLFD2GHLRK2.3KUSK.2K2E2CEKTUKQREA2ERSK.6|.6KT2KPHLK2TQKE2KE2K.KU2K.4KT2RSNMLF2GHUMD2GLJD2FHLP2U2TK.3K2RK.3KECEK2SU2PA2K2STK.6|.5K2UTRND2K8E2K.KUTK.4KSTRP2NLGDFHPNF2HLPD2FL2UNMNTK.4KQK2.3KCEK2SU2QA2KT2UK2.5|.4KQND2GDABHLMPRT2K3.KUK2.5KPGD2JPNL2G2MLF2HLNLFGN2CD2LK3.4K2SK.3KNP2SEH2D2B2H2NTK.4|.5KNB2D2A2DL2PU3K.2KTUK.6KPGDBDNUMLH2MLD2HL2MGHU2BDFMJRQK.4KRK.3KTQR2JH2FDABD2MRK.4|.3K2JLD4B2DHLNM2LJK3TUK.4K3PLHDBHN5MLD2GN2M3PGFHJNPTRK.5K5MHGDNLG2F2BD3H2K2.3|.2KRND2HGD4BGHMLGD2TR2K2.4KHMU2PLJ4M2PUNMD2HPUNSPNH2NKNPU2K.5KSRQ2MF2GNHD2GFD6NTK.2|.2KQND2L2G2F2BGHMLGH2R3K.4KNLMU2STPKJPHFLMPUJHTPNMSPMLSPN3U2K.K.4K2R2MGH2MGD2G2F3GD2NUK.2|.2KQPD2MLF4G2H3L3M2NK.3KSNM3LMPK2NTLGL2NSTPSN2M2NMLPN4P2RKNK.2KTRM2LHLHLD4G4HD2NUK.2|.2KSPD2QNGF2D4GHM3GHMPK.2KMPUNH2D2JMNUP2GFHMSTMLDGLNTML2D2GHLTRMK.KPH2L2H3LHF2D3GH2BC2PTK.2|.2KTPB2KNJF2D4GLM3G4MK.KMNUNL2GCJ2MUP2GFGLPKMFDGP2SLHLD2GH2USK.2KPF2LML2GHLF3D2GLBAK2RSK.2|.K2N2B2CEKJFD4GLMNLG4NSK2NKPML2JKHDMU3MG3LGDF2HTKTMGHMLDGHN2K.2KNG4M2HLHGHGD2GLCAK2H2K2.|KSPFGK2ABKTDF2D2LM3GFDFGNU2KRSJGD2E2D2NU3MLGF2D2GLMTPU2G2NJGDG2LSK2RNG2D2MN2MGLMLD2GLK2.KD2NTK|KRNFGJ2ABQPF3G2LM3F2D2FMP2KQTKGDHE2D2NU3M2GF2D2GLJRPU2H2MLGDFGHRK2PMF2D2LMNMHLMLFDHMK3JGDNTK|KRNFGML2J2MG5M2HF3D2BF2LK2RKPKC2J3PTK2TRMGD2FLRSN2UTK2H2DG2PNMPNG2F2G4NML4F2B2U2CKFDNTK|KTNFGM2C2M2G3H2N2LGF3DBF2LRKQ2K2J5PTRKT2MGD2FLT2MNT2K2MLDH2RPMSNG5F2GM2L4F2BCT2K2GDNSK|KTNFGNJC2GHG3LMLHG2FA2DF3LT2K2.K2HDNUT2MLNUMGF3MTPL2QKQRGHJ3RPNSNG2D3F3G2MLG4BACJ3GDNTK|KTNFGNK2CDGHG2M2G3FDA2DFG2LU2K.KEJGDNUR2MLNUMLG3MRPHLQ2T2GLE4KNTMG2ABDF4GMLFGHGABHJ3FDNTK|KTPGHJ2KHGHNPLM2G2F3D2F2G2MU2K3JGHMNQ2RMHLTNMG2MNRPDHSQRTMN2C2EM2PMF2B3DG4LM4LGHJKHGF2NTK|KTPL2HLKHFGSUNM2F9G2MU2PULGDNRK3QLH2KTRG2T2QPDGT2K2U2ND2JL2PMGFDB3G4HMTNM2GMK2GF3NUK|KTPL2GHMG3NPNM2GF7G3MUPNMLH2K2.3KL3KR2JLK2QPLMTRK2U2NLJ2LHPMG2D2BDFG4LPM2LGL2HGF3NTK|KTPL4GHL3MTMHG3F4G2L2MKHGLJRTK.4KLHLK3M2K2QPLMTK.2KR4JHLPNL2FD3F2G3M3LHGLG3DHLPSK|KTPL4G2LHLMTMLHG2F3G3L2MK5QUK.4KLGJK.KM2KQTPHLUK2.2K2QREK2TNMLF7G2M3LHG5FGLPQK|.K2M2G2F2G2L3PUMLHG2D3GMSPK.2KRTUK.2K.KHDLK.2K3TUPHLTKEK.2KT3K2RUNLF7HS3NLHF2G3FLMK2.|.2KTNG2F3GL2MPUSUNGFD3GMT2K3TQK2.K2EK2HFLK.4KSUPHLTKE2K.KQTUK2RTNG2F6GT2SNL2F2G4NUK.2|.2KRNG2D2G3HPQ2U2NG2D3GMT2KTU2K.2KE2K.KJH2K.5K2NH2TKE3K.K2UK.KRLHGD3F2NPKQTNL2D2FDG2NUK.2|.2KRNGFDFG3HSK3UNG2D3GMT2KU3K.2KE2K.2K3.7KMGHTKE4K.KUK.KRMLHD3F2NRK2SNL2D4G2NUK.2|.2KTNG2F4GHUQK2SMFGFG2HMTRKU3K.3K2EK.11KJGHRKE3K.2KR2KQRM2LFDFGFNRK2QNHGD4FGNTK.2|.2KTNG2F4G2UK.KQMF4GHMT2RK2UK.5K.2K3.7KJGHTK2E2K.2KR2K2TNMLGDFG2NQK2QNLGD4FGNTK.2|.3KPNMGF4GSK.2K2NMF2HP2K3.KS2K3.4KNM2K.6KLDHTK.K2.3KT2K2QTUMLG2LP2K.KQNGFD2F2HLNTK.2|.4KUNG2FDF2PK.3KSNFGLU2K.3KS2E2PK.3KLGLK.6KHDHU2K.4K2T2RK2TUNLHGLUK.2KQNGFDF3MUK2.3|.4KUNG2FD2FPK2.2KUNG2LUTK.3KSPE2KTK.KTHGLK.5KJ2HLU2K.3KE2BJK.2KTMLHGLUK.2KUNGFD2F2MUK.4|.4KUNG2FD3GLRK.KUNGHLUTK2.KPE3K3SKTUHFHK.5KM2L2UTK.2KE3BHK.2KRMHLGLUK.2KUNFD3F2MUK.4|.4KUMG3FDFDMTK.KUNHM2TKR2K2PE2CBCK3STHFHK.5KNML2UTK4E3DCRK.2KMLMGLUK.2KTNFD3F2MUK.4|.5K2TJG2F2DNUK.KML2U2K.KRKU2K2D2CEK2STHFHEK.3KJ3L2UTQ2E2CBCJNUQK.KR2NGHNUK2UMFD2F2MPRK.5|.6KQMG2F3NUK.KML2T2K2QK2U2K2BDE2K2STHFHEK.4K3L2UTQKE2CBCJNURQK.KTNHLPUK2UMF3GFJRK.6|.7K2LG2FDFGPK.K2QK3RTKU2TK2E2K2R2S2HGLMJK.4KLFHUTSRK2E3JNPU2QK4TSK2RUMGF2GLP2K.7|.8KN2LFDFDPRK.KTK2MSTKU2TK.K2.2KRQSHGLM2K.4KLFGTSR2K2E3N3T2K2JK2TSK.KUMGDFGMUK.8|.9K2NMLF2HMK.2K2PMK3U2TEK5.K2TM4JK.3KEJLMRQK4E3SQTKRK2HJK3.2KMGFGLNPK.9|.10KTPLHGHNUK.K2NLK.KU2TKNJ3QK2TUN2MJ2K.2K2J2NMRKQKNK2E2T3KRK2HJK2.2KMG3LMUK.10|.11K2PS2P2UK2QPGHMK2STSENJRPTSKU2PN2J2EK2E2J2NMSK3NKRT2STUK2.KL2JUK.KN2P4K.11|.12KUTUTU2K2RPH2MNMK2NEJSRNK3U2PNMLJEK2E2LJNMRK.KNKRTSE2UK.2KLGLUSK2Q2R3K.12|.13K6QK2NL3M2TK2E2Q2RK.KTUKTNGLE5HJN2T2K.K2EK2JEUK.2KLGHTURK6.13|.18KQRPNL3M2UTKE2KQK.2KT2KSNG2E5HJN2U2K.3K2EBEUK.KJLFDR2QK.18|.18KRSGFL3M2UNE3KEK.KQK3TNG2E4JGMK2QUK.3KE2ABSK2ML4H2RK.18|.18KTSF2L5TMKE4K.KQK.KUNFGJE3JFMSKQUQK.2KE2ACUK2ML3JH2RK.18|.18KU2MNML2GLPMJE2K2.KRQK.KUNGHJE3JFMTK3RSK.KE2ACUNM2LN2ML2SK.18|.18KT2U2NMG2HPMJCEK.KRSQK2RUNGHLE3JFMS2K2RQK.2KEBCUNMLHPSP2NSK.18|.18KTSUTNMGH2PMJCEK.KSTSK2RUNGHLE3LFMSRK2RSK2.2KBCUM2LGPU2N2PK.18|.19K4LMNH2PMHE2K.KUK2.KQURKL2E2JL2MTSK.K2T2K.KE2TPLGHUTKR2K.19|.22KHMPGHPMJE2K2TUK.2KQTQKLGE2JL2MT2K.2KT2K.KE2TPGFGTSKR2K.19|.22KMNKM2PE3K2QTK.4K4LGE2J2N2K2.3KRTK.KE2P2GMNK2.K2.20|.22KTK2T2UCEK.KSTK.5KTUMHE2J2URK.4KRTUK.KE2PLRK.25|.23K.2K2PCEK.KTUK.5KTUMHE2J2TK.6KTUK3JHNMK.26|.27KNFGHK2NPK.5KQSLGE2GLTK.7KU2PDF2MRK.26|.27KNGH2JPNPRK.5K2LGJ2GLTK.7KU2NMLFJSK.26|.26KTK3JMNSUK.7KTND2MSK.7KTPLME4UK.26|.26KUPEK2J2UK.8KSPD2MRK.7KRPMJE4UK.26|.26KURK3EKSK.8KTPD2MK.9K4E4UK2.25|.25KS4TEK.K.10KPD2MK.8KTPEK2E4KUK.24|.24KTNMN3EK4.9KPH2NK.8KUSK2NJEJ3UK.24|.24KUJDHDHRKTUSK.9KPNK.9KUSRQHLKB2GUQK.23|.24KTHDHFHRKUSK.11KPK.10KQKPHLKCDHUK.24|.25K2QKNPS2UK.13K.12KTUR2SQPK2.25|.27K.K5.28K7.27",
    },
    zleo: {
      p: {
        J: "#503334",
        C: "#ed923f",
        H: "#7f3f2c",
        T: "#040111",
        B: "#f8ab4e",
        U: "#00010d",
        D: "#e9702e",
        R: "#090516",
        G: "#b23e25",
        S: "#050314",
        E: "#b46b39",
        P: "#36131a",
        Q: "#140c19",
        F: "#dc3f28",
        N: "#67131e",
        M: "#951723",
        A: "#fcc57d",
        L: "#b61e25",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.40K.55|.39KJK2.53|.39KCHJK2.51|.39KTCBU2K.50|.29K.4K6UC2DHK2.2K.46|.23K.4KRK4UGU5HB3HSK2HK.45|.22KUK.3KE2S2TUDCEU3HB3HUJPDQK2.43|.22KG2K.3KJG2JH2C3GUHDB3EUPDCPSK.42|.22KFHK3.K2U4JB2CDHGDB3EUPDBPSK.42|.18K.4KHFGNKSQNQUJHECB3DGDCBCEGDJHEK.42|.16K2SK.3K2HN2STQNPUP2GEB3DGDCB2CDCPHEK2.41|.15KR2DK.2KTSTPQHGECJPNEKNFDCB2GFB3CDHUPKSK.40|.15KNMDHK5TQ2HD2EHJECBEG2DB2F2B3CDHPJKSK.40|.15KSKUPD2HK2HD2CB3JQMGACUPFBADFCB2HREB2U2K.40|.15KSPKNFD2CB2CDC3FPQD2BCJPGC2DFB2CNRCBCUK.41|.16K2.KPNG2DB3CDEGHUHDGCJ2SJPHEBEU2EHD2QK.41|.18K2T2M2GFD5G2HG2HDJPS2UNGCEU2ENEGSK.41|.12K2.3KTUMLFDCB4D2GPUQNDGURJ4K3SKSHPUK.42|.10K2SHK.2KU2MLDC2BC3BCGPTRQE2TKJ4K2HPK3SUK.42|.9KTKGDK.K2EDB2C2DGDCD2EGH2PK2QK2B3EJK2CKQKU2K.42|.9KUND2QKSRCB3C2DG2DGMGDEGQKSTKHB3ABCB2K3U2K.42|.9KUPGFH2D5C2D2FNPGBC2HP2NP2NETSCA2BA2PTQDETK3.39|.9KSUMGD4F2CBDG3NPEBCD2EU3PHEPSKEA2KEPURD2PNJ2K2.37|.10K2U2MGD2B4D3M3GECBEGNPSQH2BH2EABJAPHNC2EKB2RHK.36|.11KU2N2D2B2D5G2HGBC2G2QSK2J2HEA6PH2C2EPH2TRK.36|.12K2UT2RG7D2C2G2MDCNHK2SJ2EA2HKETSPFCB3QU2K.37|.12K2U2T2G2HNFGDBC3G3D2M2NKTJ2EA3CBTQPGCBCBQUK.38|.11KTPG2C2M2D2C2DG3NMHPHFMNPMU2KHEJQRPTKNHGCA2BCUK.37|.10K2N2FGC2M2D4FG2HPN2UNGN2KNU2KJ2E3CSKPNGDB4TK3.35|.9KTD3KHN2M2CBCBDGNTU2RBPS3K2QK.KJE3KPQUKUPF2B2DES2K.34|.9KSD3K2PTNMB2C2DGNTU2QDEPSK.2K.2KSTU2K2R2KUQDFB4TQK.34|.8KTHK3SU2QEDE2DG2P2J3K2E2QK.5KQ2RU2KRSK2QP2HGEHNK2.34|.8KSK.K2STUGDCGMG3PQJ4KECJTK2.4KJKS2KT2K.KU3P2UK2SK.33|.9K.KUKTPEDFGM3NQUJE2CEJK2H2U2K4J3K3UQK.2KJE2NEK3.34|.11KUKTND2G3MP2UKHDECEJK2J2U4JKJ3K3UQK.KJECEK2QUK.34|.12KSF2NQPQHGNUH4CEJ2K2ECU2K3EAB2CU4HK.KCHKRSK2.35|.13KF2PSTSMGNUPHDE2HK4C2SK3SJECB2U4H2K.KJ2QUK.36|.12KG2QU2NMN2PSK6.KCBHPKJ2KHJKHEK3HEKNHK2JHKRK.36|.11KNFQSU2MLN2PRK3.2K3B2K3J2EK3HCPK2HBKJHK3JK2.37|.12K4U2MP2QR2H2CK2BC2JQK2J2E2AK2HCBCSE2JU2HE2HCK3.35|.15KU2P2TUSRBAC4EU3K2H2E2AK2EC3JBCJU2QNBCDEJPK2.33|.14KSPN3P2QUQJQ2KSUKU2K2JHEK2.KHBABEHJ2USTPJH2CEJHRK.32|.14KUPM3N2QUK3SK4U2K2J2K.2K2JDABJ2KJUS2PKNPDJSHPSK.31|.13KUPMLM2N2PRK.KJ2K2ST2K.K2SK2JCEKE2K2.KUK3.KNTK2SK2.32|.13KUPL2M2N2PQK2J3K2ST2K.K2RJCEK5EK3UK.3KNUK2TK.33|.12KSM2LMN4P2JE2HJKUQTSK2HE2HK2.KHJK2EHKSK.2KJENU2K.34|.12KRL2MN2MN3PHE2HJU2NQUK.K2H2K.K2H3K3R2K5ENU2K.34|.11KNML2N2MLNPKJE2HJTPN2QU2KSK3.KJC2E2JKRP2S3RKCHMNUK.33|.11KPM5L2N2K2H2J2UPN2PU2RSK.2K2JH4KQSP2S2TJ2UNLMQK.33|.11KPLM2LFM2TUK5SQN5U2K.2KHKJ3KJKUTN2QRPEJUNL2MSK.32|.10KPNFM2L2N2P2HPK3RPN5U2K2.2K8U2NPQK2EJRPMNMPK2.7K.23|.9KSNF2MLM2QUDEBEKTUPN6U3SK.KS2PE2GKU2PU2RK2E2S2KM2UTK7UK.22|.9KPNL2M4QUH2CEHJHPN5P2QJPK4HEB2EKQPHRTJ2KJEJSNM2P2UTNP3N2K.22|.9KL5M3QUCBK2GDBPQN3Q2HJC2U3EB2HJETHC2P2HEHJC2TNLM2NU2GF4MUK.21|.8K2L5M3PUECHKEDBRQN3PQJHE2P3DB2JSJPHC2PN2EHE3UPMLMNQ2NGF2HK2.22|.7KURFL3G2M2PTKHJH2K2UPN3QSRK2JCDBG2CHRJCHD2PQNHC2HEUPMLM4PS3TK.23|.7KUQFL3GM3PTHEH2K2UQPN2PQSK.KPE2CDG2EHGCHEHQTPND2HEQPML2M3NPN2PK2.22|.7KUQFL3M2L2PTE3HK2TN3PUK2.KSQ2PC2DHGCGBHSK2U2NMDECPN3L2M4LFPUSK4.18|.7KUQL2F2L4MNPJBEK2QN4SK.2KJH2QHDCENH2CHKH2JQN2GDCQPN2M2L6M7K2.16|.7KPNL2FDL4M2UJEHKQPN2PQK.2K2GK2U2EDCDGD2QUJHJQSM2E2UPM2NML9FLM2N2K2.14|.7KMLF4L4M2UJEKUPN3TUK3HGK.KSUEDC2DCDQUK3JQM2GEQ2LMN2L8F7QTK.13|.6KUL2F2D2L2M4UK3SPM2NSK2HGHJK.K4JDCBCQ2UTK4PNFBHPNM7L4F8L2K.12|.6KUL2F2CDFLM3LTSK.KPMN2USHJHJK.KTK3TDCBEUKU2PJK2RNGCGPNML2M6L2F5D2FLF2K2.10|.7KNMF2D2FM3P2H2K2PQN2QK6.2KUQHQKSHCQUP2TQJ3QPGHGN2ML2M6L4F3D2F4M2K.9|.7KRQL2D2GPMLTUC2HGPUPNUK.K.5KUPHQKUK3SHK2RQJ3NGUEHNML4M3L8D4F3LSK.8|.7KRQL2D2P4HE2HJHK2T2UK2JK.3K2TPEJK2.3KG2K3TKQNGEDN3ML3M5L2M5LFNG3MNK.8|.7KTQL2FMG2U2ECHJK2TKU3KNCEK.KJK2JDK.5KEHK.KUKUQNCEN3M2L2M4L3MP3NLFQS3KMQK.7|.7KN2PMN2F2MNJ2EHK.K2U2G2EBK.2KJK.KDK.5KGHK.KUSKQPHN5ML4M2L2M2U2SQNMK4.K2.8|.7KMNUMP2D2FMTSEK.K2S2QF2DAJK.2K.2KEK.4KSDHK.2KUK2QGM3N2MF2L4M4S6K.14|.7KPQ2NG2DF3NRK.KRS2G2DCEJQK.5KCK.4KSDEK.2KSK2TM5NML7M4R2K3.15|.7KU2PTGD3F2MPK2U3TFD2BESK.5KHBK.5KDEK.2KUK2UNM4NM2L7M3QSK.17|.8KUQUGD3F2PQKEKUNGFD3ESK.5KJBK.5KH2K.2KU2K2UM6L10MNUK.17|.8KURQGDFDF2QPJCKUMF2D2BCUK.5KJBK.5KH2K.2KU2K2TM3LM2L10MNQK2.16|.8KTQD3F4PKB2KRF2D2BD3K.4KSPEJK.3KJ2NK.2KU2K.KSPM2LMN2L3GL7PRK.15|.8K2ECDF4GK2H2K2F2D2CDFDHK.3KUPCK.4KJ3K.2KUTK.KSQM4N2L2FDGL6MNK5.11|.7KSHC2DFL2N2K.K3D2F2GF3DHUK.2KUPCK.4KJQK.3KTSK.KSUM5N3F3GF4M3TUTR2K3.8|.7KHECDFLFGPRK.K.KCDFGM2FD2NSK.K2UPCK.4KJQSK.K2JPSK.KTNM3N4MLF6L2MP2LF2GQ2K2.6|.6K2D3FL2FPSUK2HK2DF3GMGF2NRK2STUPCK.4KJQSK2J2BJSK.KSN2M4N2M2LF5L7F4NSK.5|.2K.2KTQBCDMLGNPQPK2CHKNF3G3F2DCK2T2UPCK.4KHPSK2J2CJSK.2KQPM2LM2NM2L5FL6F5MNK2.4|.KHK.KTQA2FNG2UNPMK2AESUD2F3DF2CBK.KU2PCK.4KGPTK.KJEJUK.2KUQM2L2M5L3ML4F5D3F2LPK.3|.KBK3SQABFGHU2NMPSKCKS2PNF3CDFCBK.KU2PEK.4KEPUK.KJ2QSK.2KSQNML2M9L4F6D2FDF2NK.2|KEBJTQJHABFDHUKRMK2.K2TST2F3CDFCBK2U3K2.5KEJUK.KJ2USK.3KQN2L4M2N2M4L2F7D4F2PUK.|KP2CQPA2D2BEPSKJK.2KPKU2TSDF5CBKU4K.6KEJTSK2JKU2K.4KRPLM3L2M7L2F7D2F3MQK.|.KUHTPA2D2AEK3HK.2K3U2S2D2F4CBU2TU2K.6KEJTSUK3U2K.4K2PM4L2M7L3F3D2FD3F3NK.|.2KDSPB2D2AJUK2BK.KUK.K2S2D3FD2CBT2U2TK.6KEJU2K2EDU2K.3KJKQSM3L4M7F4D4GRQRF2PK|.2KGKQECFDAJUK2EK2TUK4S2D5CB2TU4K.6KGPUQK2CEU2K.K.2K3SNM2L5M6F3D4FHSK3MQK|.2KUK2U2DCAJRSJHEK2S2N2KU2DCD2CB3QUT2UK.6KEH3US3UK.KJK.KJK2UM2L6M2NQ2MF2D4QK2.3K2.|.3KSU3DCAHR2J2KQK3N2KTUD3C2B3QUQU2K.6KGHKE2JS3K.KJK.2K.2KPML6M2NU2PNGFD2HQK.7|.3KUKSQC2FHK5SK2RHJKU2D3C2ACERUPU2K.5KPEK2HEGSKSK.2K.6KUL7MPSU4NHF2RK.8|.4K2SQACGPK2SJKSK2RJPSU2D3CBAJSK2PTUK.6KHK.KE2K2STK.9KQML6RT2K4SGFQK.8|.5KSQBCGPSKPK2SK4QSQPD3CBAHSK2NSUK.6KHK.KE2K2S2K.7K.KUML6QTK.4K2PK.9|.6KJAENTU2JK3S2KS2TEBCDBCBAHTK2NTUK.6KHK.KE2K2TUK.6KHK.KTNML5NK.6KTK.8|.7KP2KRSTKE2JS2KSRSEBC2B2A2HUPN2TUK.6KJK2.KHK2U2K.4K.2K2.2KR2PML3NK.6KTK.8|.7KTPKPTDJ3K3TSRSHBCB2A2HPUNMNQTK.7KSUK2H2KSK.4KEK.KJK2CEUKURMK2.8K.9|.6KSUPHJUEHJ2K.KS3PEBDB2A2U2QN3QSK2.4K2PRUK2HEKSK3.2KEK.KHQ2CEQK2SUK.19|.7KUHBETRAEK.2KJKSCBCBA4UQN3MPUTSK.2KUQLPUK.KC2SRUJK.KECK2PCDCBHK.K2.20|.7KTHCHK2AEK.KHNPTEB2A5UKN3MPU2K.3KUQHPUK.KBCSRPEK.KH3JPD4ENK.22|.8K2TUSKABHKPDGFTEACBA2RURK3UECJUK.3KUPBEU2K2B2QKDBK2S2KBHCB2QUHDSK.21|.10KUKTE2HKHG2HQEB2A3PRKRK2TE2PUK.K3QPDEU2K2ECPKDBH2P2HBGECBQUJEQK2.20|.11K2TBPSK3U2C2BA3UK3SK2STU2QJKJ2KDCHPUK.KJPDHGDB2C2BCBHS2K4HPNK.19|.13KEPK.3KUCBA4K2TU2K.KURQK3J3E2CPU2K4EKNGCE5DJK2.4KUNK.19|.13KTK.4KUCBA2JUK2TU2K.2K2MK2DCDJUK4U3K.K2SU3RU2TRK.7K2.20|.13KTK.4KUCA3JK.KSTUK.3KHK3PHK2.3KS2K3HJTU3KU2K2.30|.14K.4KJA4UK.3KSK.5K2UK3.5KSK2RK2JEPK2.K2.32|.19KJA2HQUK2.2KSK.4K2.K.5K2.KUK3.KJGPK2.35|.19KQAJKPNKJK2U2SK4S2K7S2K2U2SK.KHG3SK.34|.19KSUK2QPKP2KU20KU3K2PN2HPK.34|.20K2.2K2.K2.K20.K3.2K5.35",
    },
    zvirgo: {
      p: {
        R: "#060011",
        L: "#37504c",
        N: "#202c2f",
        D: "#75a47d",
        P: "#0f0e1a",
        M: "#323c3e",
        T: "#01000e",
        J: "#4d584e",
        U: "#000005",
        S: "#02020e",
        G: "#578167",
        F: "#66876a",
        Q: "#060412",
        B: "#9bbd86",
        H: "#4e6c5c",
        C: "#9ba975",
        A: "#b8d192",
        E: "#858862",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.34K.61|.33KRK.60|.32K2LK2.20K.38|.31KRNDLRK.18KRK.37|.31KPNDMTK.6K7.5K2.38|.31KJDNU2K.5KR4SL2K.3KDLK.37|.31KMDGNUK2.K4T4SK2.3KRGK.38|.32KNFMK2QKTSRMB4JTUK.3K5.36|.32KRGLK.K2QMHFB6DRK.3KLJRK.35|.21K4.8KHMK.2KSJB9MK2.KMHJK.36|.20KP2N2K.7KRF2K2MDCABDBA2BD2BLQKQBMK.37|.21KHD2LK2.5KSHLK2ND2B2A2DHDBDFLUQMHPK.22K2.13|.20KTPDFD2TK.4KRP2E3C2DBAEK2GDFMEAK3R2K.20KSRK.12|.19K2TPD2B2TK.4KR2TE2CACB2AK4HDLEAK3SK.20KUSRK.12|.18KRPHGNMKLJHK.K.2K2QPNHF2BDHEA2CEFD2CNSK2.14K2.3K3A2UK.12|.19K2B2TK2RDBK2RK.2KSR2H2D3EA5EBFKRSK.14KQRK.KRQRA2UK.12|.20KFJK.2KJ2H2K.3KR3GFCF2EBA2C2AEGKU2K.13K5.KRMGB2UK.12|.21K2.4KSBANK.3KR2ECEFMCKA2MUJHFKU2K.12KTS2U2K2RDABDUK.12|.28KD2MNK.K2R2E2DFECJA2JNCJHMUSK.12KRSFBDK2NFB2DUK.K.10|.28KR2GDMKR2QPMCDCA8KL2TK.12KRKRNB2HUD3GTRK2RK.9|.19K.9KRHGKUT2MK2D2CA8KL2RK.10K.K3RNB2JUD4UQR2K.10|.18KRK.2K.2K3QRPN2QULJKLFDEA7EKJHRK.K2.6KRKJGPUPBDFUFDHGLDHMK.10|.17KQK.2KQK2Q3R2S2QPF2KMKFDJCA6HKG2KQKMPK.5KSDA2G2U2BDSB2KGBAFGRK.9|.16K.K.2K2P2N4SUPNMGFKMK2GFGNA5EPUGHK3UTK.6KGD2FDP2MGFB2HGABLHQK3.7|.15KQK.2KTNB3ABAG2F2LKPL2SRGFHPEA4MU2HJK.2K2.8KUND2LHQKCA2D2LK4Q2RK.6|.16K.3KCDB4D2G2F2LKNLMU2GFLPE2CENU3HJK3.10KRND2MLQKE2FD2HK4NMSK.6|.18K2GB4D3FD2F2KLK2QU2GDFPCJM2TUPMLJNQ2K.8K2RKU2KMKL2NLHNK2FD3KQK.6|.17KNLEB2F2H2F2A2DFKQNHTUPD2GPCE3TRNL2KNQR2K.6KRQR7KLHLK2.KF2G2DNK.6|.16KMGB3DHJ2GDB3GHN2MLKRMFDHNE2C2NTKL4T2N2K.6K4NPRTK2L2MK5HLKGMK.6|.15KMAB2DF2H2GB3F2PUH3LJRJHFGKC2A2GHNQGFK2JHFUK.6KD2GHK2.KHLU2PL2T2R2K2.7|.14K2HB3F3HFBCD2F2PUH3JLKLHFGMC2A2FHMRHK2AH2GUK.5KDB2FK4NHLU2PL2T2RK.9|.13KTUDBDFDF2H2GF3GUF2HCAHM2K2F3A6LRK2MKC2F2NK.5K2ND2TRKGHMRKTFD2K2.10|.13KTJDABF4H3F3GUGFECEM3SLHNJA4CHNSUPM2E2DFPK.6KFMRTR2G2MK2RJD2LK.10|.12K2F2DFGF2LMNMHFG2M2H3J2ML2JGJQPJEA2K3N3L2JEH2LK3.5K3DLPFLKML2PLD2K.10|.11KQUD2FH2F2U3PLFGHQH3JMKJMUF2GKPUNBCK.KL2RPJ2EJHJMPHK.5KRD2GEJGHFDKRD2PK.9|.10KRPNDFJ2HG2QRNG2H2MRJHJ2LMJMQFD2MKUPDFK3H2N2JL2J3LJFHK.5KD2FEHG2FDKRG2K.10|.10KTFB2FJ2NT2QPD2FK2ULHJ2HL2SNHCBA2ESUL2T2B4GUNJ2MCNU2FNK.4KU2DADUJKQK2RK.11|.9K2RHB2FJ2NQ3ND2FK2SL2H3LKQMGC3ACDK5DB2AHUNLJMJNTQHPK.4KRSFBLU2K2.2K.12|.8KRQMDABFUTK2TFD3MKMU2TN2PHETLBC3A2FKM2ULBA3FUMNUN2PK4.4KRKMGFGUSK.16|.8KRPKFABFTK.2KGDF2K.KUTQK2E3TLDCACBAEKMJTHA3CEUMJMCQRK.K2.4KRKLFMLSK.17|.8KTJ2EBGFTK.2KFDJNK.2KH2CBAE2UMDFHG3JKM2JFDF2DMULE2DFURKLMK.4K2DFSLK.18|.8KTJ2EDH2TK.2KDFKUK.KQHFA3E2TLDFH2L3UM2LHGH2JNUJEC3TRML2K.5KF2PR2K.17|.8KTFE2FHJTK.2KF2K2.2KTHFA2BFHTMGFHMK3UJMK2L3MPUMECB2PQKMK.5KSG2NQK.18|.8KUDBFHLK2.3KFGK.2KUSFCABCNRK2PFGK.KLJC2LKNJMKT2PEB3NRK2.5KRPHPK2.19|.8KUDBFHJK.4KFK3.KUMB3C2NSKQTDGK2MGHC2HJLHNUT2PEBA2NRK3.4KRMJPK.20|.8KUDBF2TRK.3KMLM2KRCB3C2NUM2NSMFHL2D2EDFKJHNTK3LGFMJ2ENRK.2KSTEA2QK.19|.8KUDBFGQ2K.3KRNM2K2A2B2C2UPLMLUNFHLMD2C2FKH2NRK.KQNFPFE2JMQK2QTUBACU2K.18|.8KUD2FHK3.2K2QK2UNLJECAFMRFB2HUPDFDL2HGEHKHGMRK.KSNPKC2HFD2FKNC2NEAU2K.18|.8KUDFGHKLJK2RTK2U2NLMKEAJK2DB2HUND2FJM2KJKLHGMRK.KUKQJCEJDB2FK2A2KJAU2K.18|.8KUFHJHLJK.2K2.2KRNH2LM2E2DGB2LKMF3HMKBH2L2JMQK.KSKHFCEGD3HAFAEJCAUSK.18|.9KRJ2HDGK.KLK.3KMG2HLSEDBHB2MKLMH2MSLBCLK2M2K2.2KUFECEG2FHMA2K2BACUTK.18|.9KRLJHDGK3J2K.K2JFEGHUHDCHGNPL2M3RQLBEMQNJKMNK3QHECEK3Q2ACK2CABURK.18|.10K2RTF2MRK3.KRSEC2EJUJDFU3J3HJC2K5J2NDFBMTK2LECEKJ2UT2URKCNUK2.19|.11KRTDFMTQK.2KU2CBADJSGDGU3J2LF2A2K.3K2JKFDBPUKQJE2HMLJTSUTRMHR2K.20|.12K2JH2TQK.2KU2B2F2PFBDMSJH2FDK2EC2K.KECEMGDHJHRQJ2CEFEUQK2R2L2SRK.20|.13KJH2TK.2K2TUB2FHTFD2U2HGFB2SJFEACK2CACJGFJLHU2J2EJE2UQK.KRL2USK.20|.13KPMHMK3TKNPCBGPUNDGQG3DAGSFGKC2E3KFGM2C2FMJM2J2ECSK.2KPH2URK.20|.13KTJHLNRKT2MKD2GU2NDGUG2FCAHSDGHEC3EKHFMNBC2ECJ3HDCK2.KRSG2UTK.20|.14K2L3RK2NB2DFHU2PDFLH2DBGJSD2FE5FHGN2ACEC2MNH2DBHNK.KMLNK2.21|.16KGHQK2PB2DNPU3PUHJHDBNKQD2KECHE3LHNPB2DG2MSJHDCBMK2MJHTK.22|.16KFHK2SPBDFPTS2QU2ECFB2LKQD2KC4JRLHNUABFHG2UJH2FCNQRTJ2TK.22|.8K2.5K.K2.KSPD2LNTQ2UL2EC2B2FKQBDNEC3NKG2MUB2FHGHUL2HF2K2RTJ2UK.22|.7KRUK2.2KUK.4KHD2QUL2MGH2EA2EUK2RBDLMKCJK2DBJUB2D2H2DNSFECKQSUL2TK.22|.6KRNL2SK2.K.3K2NGFD2NK2MFHGB3EUQKTB2LK2ENKMDAJUB2DFGLDNRFEGKQU2L2TK.22|.6KSKMNPN2K.2K2T2HCA3EKMHGFDBC2LK3RACMJ3L2MEAJUNHDG3DH2EHK2QP4MNK2.13K3.4|.6KMNQKL3K.KUSUSA4CAJHF2D2BC2UK.KRC2MH2LHLMEAJU2PDFGHD2BJK.2KL2U2L2NRK2.10KRQ2K.3|.3K3MNP2NLMK3.K3UC2ACHBNHG2DB2ENK.2KTC2MJHG2L2EAJSUPGCFH2FDNK4LMURNML2MPK3.5K2QL4K.2|.2KRPLNT2L3R3SK.KTRKNA2UQPHG2BA2FK.3KTACL2HF2L2EAJK2RQACG2HFMTQ2ULMURK2M4SURK.3KR3FD2MRK.|.3KNLKTSL3R2K2.K3QNMA2NLPGF2BACFK6C2L2HF2L2EBJK2RTABG2HGF2NPUL2TRK.KPMN2P2K3.KPRKF2GLPK.|.4KRK3L2K3.2KRQ2KRPC2PUMGDBA2NKM3JLMC2L3FHL2FBJK2RTA2D2FUGD2FUL2SK.2KRSPH2MTSRKH2K2S3NDUK|.3K.K.2KP2K.5KQSUNUH2NUJB3A2NKM3HLMC2L3DHL2FBJK2TUABD2FUGD2FUM2K.4KRPH2KTU2KH2RK2Q2N2TK|.2KRK.4K2.5KRSG3H4GDB2AFNSK2MJHJMCEHLJH2L2CAEM2TQAB3CMPNDFTM2RK.4K4.K4SNK.2K5.|.2KRK.10K2SULG5HD3BAJRSK2MJHLMC2H5L2CACM2RPC2A2CFU2DFQK2SRK.7KRS2TRK.9|.K3.2K.6K2PD3F2G2F2DBDBCFMRSK2LH2LMECDH4L2GBEM2K2UJA3FGKLMK.KSRK.8K5.10|KURK.KQK.4KQTPD5FGD2B3ACU3SM2LH2L2FBDH2G2L2HCEMK.KUJA3FGHKRK2M2TK.23|.KPFK.K.4K2L2HD9B3CBU4KMJH2L2HCDL2H2L2JEFM2K2UNABAFGFJSKSNCHPK.4K.17|.KNDMK.4KQMGFD3HD2B4A3HURK2UKMH3L2NBDL2H2L3H2M3K2TUDAHLD2SKU2B2MNK2.KMK.16|.2KNK.4K2NHD3FGFDB5A2CERK.KUK2J3LMNBDLH3LJLGJL3K2QTA2DH2FK2U2B4ERK.K.17|.2KTK.3KQNB2DF2LMFDBA5CURK.2KRM3LM2KNBDH3GHJLRNL2HKMR2A2BF2GK2TUD2A2CU2K.18|.3K.3K2SNB2DF2LHDB2A5CR2K.2KRSNMLMK2NBCH2G2HJMSPL3K2TUB2AB2JK2PMF2DBFM2SK2.16|.6KQPB2FG2F2HCBAB4AMPK2.3KTUPLCH2LNBCH2GFHLMUK2MHNU4PA2BU3FDFHF2D2GUSRK.15|.6KRKD2FGHFDC2B7NQK.4KU2NEC2ELNBDH2GFHLMUK2LGHU4PBABTU2D9NPSK3.13|.6KTD3NQND2ABAB2AEU2Q2K.4KR2NJA2CNPBDH2G2H2MTPMJA2U2K2TUABK2TEB3D2FUJBDUST2K2.11|.5K2RFD2KRFD2B5ACU2SK.5KR2NJA2CNPBDHG3H2LRNMHACUTK2TPABK2TEB3D2FUNB2USK2R2K.10|.4KTR2DGK2HFDBABA2BMNRTK.7K2H2D2ENPBDHGFDGHMT2MJCFU2K2UPEBQKTCAB2D2JU2FHUSK.K4.9|.4KR2KHK3HD2BABA3SKQ2K.6KQKH2FDFNPBDHGF2GHMUTKLH2U2Q2K2U2K2NCAB2D2MUTFHSRK2M2NUK.8|.3K2TK.KL2SQJB5EJSQK2.7KRQMJFDJSNDFHG4H2USRMHJSQRK.KQRK2CB5PUKNL2FHK.KNQJK.8|.2KQRK2.KH2RQMB2A3EUR2K.4K3.KSNJ3LNRNDFHG5HUR2PHL3K.3K2.KCB5PUKL3GHK.2K2LTK2.6|.2KSNG2K2L2Q2NB2ABCETSK.4KM3K2J3ML2NRMDGLHG5TQ2KJL3K.3KRK2NCB4PUKL3FHTK.2KHDPRK.5|.2KUNFGLK3Q2NB2A2RTQK.5KM3K2J4M2RSNDGLHF2G3URK2FJL2K.2KSUK2UDB4PTKDL2GHTRK.KGBNRK.5|.2KRNFGHLQ2PUNDB3KRK.5K2MK4H3EM2NUNFGLHF2G3URK2MLJLK.2KQUKSUECAB2LPKH2KGHNTK.KGBNRK.5|.2KRLD2GHT2GH2D2KPRK.5KM3K2STCE2JM3UNFHLHFGJLGUK.2KHC2K.3K3Q2KNA2BAMKLMQHFAMK.KL2URK.5|.2KRLD2GFRPDFTFDTK2.2K.3KM3K2T2E3JL2MUNFGLHF2L2GUK.KJ2CEK.4KMK2.KB4NKM2RHFAMK.KL2KRK.5|.2KULD2HFTPD2QFDPK.2KMK.3KM2K2RTEJ2LM3UNFGLHFGL2GUK.KJ2C2K.4KMK.2KDB3PNMKRGFANK.KMT2K.6|.3KNMHD2TMD2KPNUK.3K.3KM2K.KSTL2J2K3UNFGLJFGJG2UK.KJ2FHK.4KRK.2KMNDBD2TKG2DAETK.K3.7|.4KUMDFUNDFKQSUK.5K2M3K.KU2M2J2K.KUNFGLJFGHDFTK2ME3HQK.2K2SK.2KQTDB2DTMG2DAETK.11|.4KUNDFG2D2HRSK.5KMKLMK.3K2UKMLK2T2NFGL2G2HDFTQKMFHJ2K.2KMPSK.KQRTDB2DUMD3AETK.11|.4KUNDF3D2BUSK.4KM2KJMK.3KQUM3K2TRNFGL2G2HDGUR2M4NK.3KNRK.KRSUDB2DTKD2BAETK.11|.4KUNDF2D3BUSK.4KM5K.4KUM3K2TRMDFL2G2JFGUR2M4TK.4KRK.2K2TDB3KFD2BAETK.11|.5KPH2D5USK.4KM5K.4KUQM2KTRKMHMLJFGL2GUR2PM3TK.4KSK.3KTDB3HD2BDJMK.12|.6K2LD5USK5JCJMKMK.4KUPM2KR2KL2SL2FGLJFTR2PM3PK.3K2TK2.2KTDB4D2BFT2K.12|.7KMD2FD2LR4TE2NM4K.4KU2MLKRPM2KTL2FGU2HK2TRM2LNK.K2U2KJEK.KRDB3D4CTRK.12|.6KRND5LS2RME3K2ME2JK.3KU2J2KRK3QUMLGHPTNK2U2KMHPK2M2URKE3K2QDB5DPUTRK.12|.6KQNF5JNUNE3FK2NC2ENK2.KS2L2KSK.2KUL2H2NTK.KU2KH2PN2M2UMP2JE2JQDB5DU2RK.13|.7K2TUHKHDAPE2K3.KRE3CJ2K2QRK3SK.K2MUH3NTK.KUTKC2E3M2PE2USQEQPCA2B3DUQK.14|.8KTPGLGDBNK2.4KSMECE3K2QRK3SK2MLK2JG2NTK3URKEC2E2M2NENUTKU2JCAB5UQK.14|.9K2PSMBA2TQK.4KUPC5EQRLHKTE3CEK2HFJME2JUSMHE2RPMNRPK3SUB2D3BCPK3.15|.10KR2NBABU2K.4KUPC6T2LJKTE2CEJK3J3E2HUSKMGFRPMNR2K.KU2BACDFU2RK.17|.11K2PFB2CEK.5K2EJC2EJKNF2KTE3NQJLK2E2J2MN2MJF3SK4.2KFDA2CMNK3.18|.12KRJB2ABTK.6KJE2KQMLD2LRTRQR2KLM2E2K3M2JHE2HUKMK.2KQB2A2DUSK.20|.13KJECA2TK.7K4RJGD2HMRK5L3JMK2QM2JE3FTKNK.2KRB3CHUK.21|.13KU2HA2TK.10KRJF4HTK.4KGHK2.KRL3FB2FKQUK.2KTB3NK2.22|.14K2MABTK.10KRJEF2GHSK2.3KG2K.2KTL2HFB2FK2QK.3KJFANK.23|.15KNABTK.10KRFEHFHJSRQK.3K2.3KRK2GFBDK2LSK.3KSPAMK.23|.15KDHJK.11KRFDGFGHK3.9KQK2GFCDK2LUK.4K2JD2K.22|.14KDCTQK.11KRN5MK.12K.KN4K2QSK.5KRFDK.22|.15K4.13K7.16K4.2K2.7K3.23",
    },
    zlibra: {
      p: {
        T: "#00000c",
        R: "#03010f",
        U: "#000004",
        C: "#d3a799",
        B: "#d2bdd0",
        A: "#e2d2e2",
        F: "#a46f63",
        L: "#4e364c",
        E: "#a88796",
        N: "#1c1424",
        Q: "#040210",
        S: "#03000e",
        P: "#060411",
        M: "#352d4a",
        J: "#5f4861",
        H: "#6d5878",
        G: "#7e6f96",
        D: "#ab9ec6",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.44K8.44|.43KTR2TUT3K.43|.43KC2BA3C2K.43|.40K3FC2A4C2LK3.40|.39KFC2FLKL6FC2EK.39|.28K2.8K2FC3K.K6C4K2.9K2.27|.27KT2K.6KNCFK3.8K4F2K.7KQRK.26|.26KST2K.6KNCFK.13KCFRK.6KS2K2.25|.25K2L2SK.6KNF2K.12KNF2RK.5KQPLMTK.24|.23K2T2L2TK.6KNF2K3.8K4F2K.6KQNJL3K2.22|.22KPQL2MLUK.7KF5K6.KF4LMK.6KQNL4S2K.21|.22KRMJLNU2K.8K2CF2JH5K2C2F2K2.8K4J2MRK.21|.21K.KMGLTUTK.9KNQFC3B2AFCF2K2.11KRNFJMK.K.20|.20KTK2MGMT2K.11K2L2PUP3NLK2.13KTPMJM2KPK.19|.20KUK.KGMPK.13KQTU6K.K.13KSKMLMK2PK.19|.20KTRKMLKPK.12KT2K7MKSK.12KSK4.2K2.19|.19KTK2M3KPK.8K.2K2SUK2MKMKM2STK2.11KTK.5KSK.18|.18KQK.2K4PK.7KHK2SKM7K6SK2.9KTK.2K2.2KRK.17|.17KPRK.KJ2LKPK.6K3.KUM7KM4KTSKQK.8KUTK2BDK.KTK.17|.17KR2K2GA2DKPK.5KT2K2TUKMH2LK2M3K3TRK2.9KUNG2A2GK2TK.17|.17KP2KHA3HKPRK.4KUPM2TMLHFEK.KJM5KTK.10KULA5MK2.18|.17KP2KA4HNPK2.4KUK4L2HJ2K.2KM5KNK.9K2TJA5NK.K2.16|.16KRK2EA5DNPSK.4KR2QRTML2HCK.KL2K3.K2.8KP2KLA6BKPTK.15|.15KR2K2GABA4DSTK2.3KR2K3MLKEBK2RFLK.K.KPK.7KRPKMA2BAB3URTK.15|.15KT2MJD3B2A2BJ2TUK.3KQ2KHLMKE2LK2L2QKMK2RPK.5KT2J2GA2DBD2BMNTK.15|.15KT2A2EFHG2BA4U2TK.2KRQMHJKFCNJLMSLNMJMKM2K.4KU3BA4EGDB2ADT2K.14|.15KRTBAE2DG2BA4E2LK.2KR2MJKQF2KE3HF2MJMK2PK.3KRDBDBA4GDBA3BUQK.14|.15KT2GHEABHJGB2A4GNK.K3NMKRNLHCECBC2K4RK3.K2UBA4BD3ABA2B2TQ2K.13|.15KTUJHB3GHGBA6BGKTK.KMKSNHC3B2C2K.2KTSRPKNEBA5B3DEGD2K2Q2SK.13|.14KPKUDB2A2D3GDB3A3BDEMK4TNC3B3CNK.2KRQ2PLB2A4BDEJGB2GBD3NRTK.13|.14KN2TDBDA2DBG2EB7D2MLNK.KMBC3B2CTK.K2PKSTLB2A5DGLJABGA3BNT2K.13|.14KMABAD7GHG4B2D3NTK.KNTNC2GC2JRK2NSK2GED2BADEG4MULGEA2ED2ETK.13|.14KMA2BEBD2BDBG6D3G2PTK4T2ECBCLPRNMNPK2G2EDBADG5JNKHDA2DEBDUK2.12|.13KTNA2B3N2JKGD2G7MUG2QRTK5NMLT2K3P3Q2MDG4DGDBD2K3D2B4DMTK.11|.13KUGABG3RQLMED2EG5HNUH2RTUK.KQPKL2KTK.K2QR2PNG5D2JED2GNQG2D2A3MTK.11|.12K2UEDBPU2TRDBDGDB2G4MU2KLNTK.KQJLJ3MKQKPKT2S3UNG2ED2JMLHD2RTR2KBA2JTK.11|.11KQK2NMNRT2KGDBD5EGJUM3KLF2QKQRJC2FHMTQPKTK3LFJMJG2D3GD2B2GUSK2NMHLRQK.10|.11KTK2PK2T3JDB2D3EDEGLUM4KFJK2RPFECEHMTRK2TK3LFJMG2D4GB2D3TSK4JNTRK.10|.12KTQK.KR2LDB2EGD3EHPKMJF2LK2JK2D2B2D4RLJNKM2FCFMK2TDED3NJD3GTKJK.K2TPK.10|.12KSPK.2K2HB2DG2D2ADGUNMJF2LKNLK3EB3D2HFLNK2M2F3M2QTD5TMD4MKLK.2KTKRK.9|.12KRTK.3KDBABUGD2BDGTK3JLPSNTRMKLGHEHKLFLPK2M2LM4U2D3EGLNMJBADQK.3KTK2.10|.12KT2K.K.KGELMTGD3EGMK.2K4SLDK2LK4LF2E2MUM4K4TD2EDGJ2RHGADRK.K3UK.11|.12KT2K2PK.KGK2TUED2G3K3MK4JDKLFK3J2HJDBMUK9JGD2GL2RHKD2QK2RPSUK.11|.12KTUTSTK3MKRT2D2G2NTF5QTD2GC2FJFKC2EGLHJMRK2TJF2RP2ND3UPKNK3PQRTSTUK.11|.12KLG4PSPK2Q2MDGMJNTNKLK2PUDEKC3KF4D2JMJMK.KUL3R2KJGD2SP2K.KPTPB2ADTK2.10|.10K3JB4U2TK2QPMDGSURUPLJMLSUDEGBC2FKFEGDBJSLGNK.K3MN3MJGHTQSUK2RF2BA3TKQK.9|.8K2FLFBEFCBN2LNQR4QPQTSJG2L2U2D2EDBCFPFDBD2NPJDNUKMH2L3RT3UT2S3T2CAEF3L2FK.9|.7KRLFLHBF2C2JC2KPST3RPQTMHG2L2U2DEGD2ELTMDBGHNSGDNTM2HGJLMRTU3T3SPTUACFJF2KNFQK3.6|.6KECJKECHF3CEC2K2T2L2MR2H5J2T2JH4M2FKGH2JMJG2NTKMHG3HST2RT2LNPLA2E3F2ND2MTEAMK.5|.5KUACLC3HCF2CA2BK.KML2MT2JH4J2T2SH4TNLNKMKM2J2UR2KMJG3HN2RKP2LNTJA2CE3FRB2NRCAMK.5|.6KN2LC3F4LEC2K2MJLJ2M2LFH3U2KR2HG3NL4HG2HJNRK3NMG2LFK2F3M4JC2PNML2EC3F2JNK.5|.6KQ2MFC2FSR2TLFLK.K2LJ2M2KNHG2U2KR2MLD2GHLH2ED2HJT2K.KUMGHF2K2FL2M5N2UTQ2NC3F2LTK.6|.7K3NF2LTPK2R2PK2.KM5K2FG2RTK2PTUD4NGBADG2LUTK.KTMHF3M2JMKMKM2NU2K4RF4K2PK.6|.8KCJT2FCNK.K2QKMK.K5.KFLK3.2KU2DBD2KHA2BDHMTK.3K2LFK2M4K2.KTRQK.3KFJR2MCLK.7|.7KLCJT2FCNK.2KRQK.K4MK.KFLK.4KU2DB2DKJBABDHMTK.3KPF2K2M2KMKPK3TRK.3KFJU2LCMK.7|.7KLCURQLCK.3KTRTKTUTK2.2KNRK.3KTUJHD3LGDBG3MSRK.3K2UMK4RTKTUK2TK.3KFJUTMCNK.7|.7KLCTRPJCK.3KT4U2RK2.K2T2K.3KRTH2D2GKJD2G2MP2QK2.3KUK.2K2T2RP2RT2K.2K2F2RQNCNK.7|.6KSKFK4FLK.2KT2SK2TRKRKSTK2.4KJFJFCHK.KJEHMJFCFLQK.3K2.KTK2PRLNRK2.2KRJ2K4FLRK.6|.6KTK2.4KHMK.KTRK3RQRTPTUK.4KPF2LC3K3F2LUFC3LRK.3KTKU2TK2PJNRK.3KTMRK.3KMT2K.5|.6KNKTK.3KFNTK.KQKHKR2K2ST2K.2K3NF2LC2FJ3F2J2F2EFLNK.3KTSTK2.KRJLRK.2K2NMTK.3KLN2K.5|.5KLFT2K.3KTNLK.KQKEKUK.2K3.2KP3ULKRC2JHCHJLC2F2LML2PK.3K3.3KTHFTK.KRTJMTK.2KPNFLRK.4|.5KLFRTK.2KP2NLK.KPNEKTK.7KP2TUMKTC2J2ELH2C2F3LT2RK.9KTHFTK.KPRJLTK.3KNFLK.5|.5KENK2.4KUF2K.2KTK2UK.7KTUGHLUMFH2C3JHFCLN2UK2SUK.8KULPTK.KTLFK2.5KF2RK.4|.4KREQK.5KUF2K2.KUK2TK.7KU2G2MUNJMJC3MKC2NPSRSPTUK.8KUMUTK.KULFQK.5KF2TK.4|.3KPLJK.K.3K2SKL2SK2UK2Q2K.6KFJG2MP2H2F7LM2LH2GJLK.8KTK2TK.KNLJK.K.3K2JLNK.4|.3KPFQK2RK.KPKPK2CPTKPK.K4.5KFL2MJP2F2CF2HCFLPLJGBABDG2K.7KQMK2.2KL2K3PK.KPK2NFLK.3|.K2N2FRPT2K.KSPK.KL2PUQK2M2PRK.2K3HJHG2KPF8LULJKEA2BDJK2.7KM2K.KNJPSPS2K2PTK.KCLK3.|KTNF2R2PK2.3K2.KQKJNUTSTM2RK.2KU2DG3HGQKC2EH3C2JUFCEKDAB3RUK.5KQPK.KFCFRUP5K2.K2QLCNSK|KT2FNRQRK9RQ2KTSRTLMUK.2KU2G3D2MPKC3GF2C2JUFCGJGD2BDU2K.5KR2K.KF2LU2T3S2RQKQK2LCNTK|.K2F3C2F8JF2LFRKPTMKS2K2TLG2H2DBNRKMJAF3BHNQJFDGHDB3EGTK.4KLK.KSNF3C2F7C2F2CNPK|.2KJFC3FC2F3C2JF2L2K2PTMKPTK2TGDGH2DBPSK2HACF2ANK2LFEGJDB4ETK.4KL2K2SKMFC5F5C2F3K2.|.3KNFC2FC2F3C2FJKTK.2K2MK2SK2SD2G3D2NTK.KBCF2BMK2F2EDHGDB2AEMK.4KL2K.K.KF2C5F4C2FLTK.2|.4KRFC4F6LRK.3KPUK2SK2TG3D2NUJLK3RC3K2.KRUDAKMJG2ABAEK.2KNJMK2MK.KNFC4F6TK2.3|.4KPF11LQK.2K.KTK2SK2TG3D2NULMQPKTC3K.2KTUDAHMHG2B3LK2.KNL2K.K.2KNF11TK.4|.5K2RT3U3T2QKPK.KTK2TM2STK2HG2D2MRG2PK3LFJK.2KSUDADGDBDGBALTSK2NLTK.5KTQSU2T6K.5|.6KTS2T6K.K.3K.KTL2T2KDG2D3KRG2K2TK4.3KTUDAD3BDHBAEMPK2NMUK.5KTKTRQRS2TRK.6|.7K9.K.6KRL2PTHDG2DG2HMG2K.KQK.2K.2KTUDAD5HB2AGHK2M2TK.2K.2KSK9.7|.16KRK3.3KTNMNUGDG3RUGD2GK.KQK.KQK2MTUD4GD2GJ2A3JRNLMK.KMK.KQK.15|.16KTKM2K.2KUPMNUHG4TUGD2GK.KRK.KTK2LT2D3JHDG2JLBA2JTNLNRK2MK.KQK.15|.15KTKM3K.2KRTMNUHGJ2HTPDBDGHK2RK.KUK2LPRNMHGHBD4BA2HUNMRK2L2K.2K2.15|.15KTK2MK.3KPTMKTJMJ2MPNDBDEFK2RK.KTK2LK3QJGEB2ABDBA2GTK2RK2LJK.2KRK.14|.14KTRMK2.4KPTK2QJMJ2LH2DAE2FK2PK.2K.KLFCNPHBD3A2D2A2EMNK2.KTNK.2KTK.14|.14KT2M2K.2K.KPTRK2J4KG2BAEFHK.K.5KLFCNPHABGMDBDGDB3JK.2KTK.2KMPSK.13|.14K3M2K3MK2RTRKPLJ3LG2BAEFHK.7KLFCNPGABGHMHG2DB3JK.K2RK.2KMTK.14|.13KTK.KMT2K2.KQUTKQGDJUNG2BADH2K.7KLJGHPGA2D2H2G2DB3JK2R2PK.K.K2.K2.12|.13KTK.2KT2K.2KTNRKPBAGUNG2DADH2K.7KLH3PGA2D2GHG2DB3HK2TQPK2MK2MKRTK.11|.13KPK.2KRK.2KTD2RK2D2HTPKMG3H2K.7KLH3PGA2BDG4DBA2JK.KQPK2LK2M2T2K.11|.13KNLK3TK.KT2BDRK2D2JSTKUHGH3K.7KNH3THAB2DHG3D2A2JK.KQK.KMK.KMT2K.11|.12KNMLKRK2.2KD2ADRK2H2MT3UKJH3K.8K2MF2JHDBDG2LNJEDBJRKGRK.KTK.2K2TK.11|.11KRNL2KTK.2KTA3DR2TK2U4LDELHK.9KFCFCMUGABD2MQMED2JUTENQK2TK.3KTPK.10|.11KQML2KRK.K2PEA2DQ2TK2TU3JB2MK.9KNFCFCNUGABD2MRNGD2JUTGJMK2RK.3KTK.11|.12KM2K.K3PQUBA2BLKMSTR3UGABF2K.7KQRF2JLPUGABD2EHTUL2NSTGDHK2RK.3KTK.11|.10K3M2QK2P3N2B4MNMTRQ2KTDABFNK2.6KRSF2JMU2EABD2G2U2MJMPTGDBMKTK.3KSK.11|.9KSM2N2K.KR2MB6DGKT2KMHFEBDJMKUK.5KRSF2HLKNMJEBD2GTUKMK3GD2BEUK.2K2RK.11|.9KTM2TUK.KT2LA2B5GQTUKMJF2CEHK2UK.5KRPE2F2LJSUGBD2EU2KTK3H2DBDU2K2TK2.12|.9KSK4.K2UNEB3AB3GRTUKMHEFE2F2LUK.5KLPKF3HJRTGB2D2MTNMKPTKRHB2D2TK2.K.12|.9KTK.3KTKULAB2AB2ABDQU2K2HEGJCF2LUK.5KJPMF2GHKRTGB2D2LRTMNTUPTHB4DTK2PK.11|.9KTK2.2KTKEB6A2BGMUPK2HGHF2G2JUK.4KUJLKLFEJRSTJGBD2GLM2NU2JNHB5HJKPK.11|.10KP2K.KU2B3CB3A2GJ2UM3LHJF2G3PRK.3KUJHKMECLTS2U2AB2D2GKPU2ENEB7NRK.11|.11K2.2K2TBABC2B2A2DJ2UM3LJ3H2GHSK2.3KTHJM2FCLUPMSUAB2D2GK2U2EHJB4DBDNPNK.10|.14KMKRB2DB4AELH2UJ2H2KJFH2JLNR2K.KQKHGJLF2NTMJMSLABD2GK2UPG3EDABDBDB2JK.10|.13KNHRTDEDB2A3GTHGUJH3KJ2HJHNM2RK.KPKHGHJF2PTJHJTUA2B2DGJG3HJG2ABA3BAMTK.9|.11K3HGM2HDB3A2DGLGHTJH3MLF2J2L2JTK3NMHGHFJFNMJ3N2B4DGHGHG2JG2B2D3B2EHK.9|.10KTUBDG4AB3A2LHG2HKH5KFJ2RJ2HR2QPMJKEF2NTMJMJ2LHTLA2D2K2HGDHGD5GB4UK.8|.10K2UD2HD2G2DABD2MHG2HRPH4PFJ2TJH2MNPLJ2KEF2NULJMJ4TLA2D2HJHD2G6D3BABNK2.7|.9KRDBGHJGHG2BA2PRHGHJHNTH4QLJHRJH3MSJH2KE3NUHJKJ2HJ2MLA3B3GEG4HGD4BA2NRK.6|.9KRD2GJMHMGDAB2K2M3HGMKH2GHPLJHTJH4JH3KEDBNTH2KJ3MJ2MA4B2D2G3KHMHD5BNQK.6|.9KRD2JM2KMBADGP2K2PMG2NUHG2HKF2HTJH3JH3NHGDBNTH2MKNJLJLPUDA2B2DEG7JHGD3NQK.6|.8KT2D2JM2K2A2LU2T2RKHGU2TSRHLKCAHTJH3MUMHUFHDBNKM3P2JQRT3MJDA2BDEG2D5LNHD2NTK.6|.9KEDGHGJKPEDLTQK3.KJRTR2KJNJFCF2J2HMNUPNUKJF2K7JKRT3KMGA2BD2EGDG4HLJLGJMK.6|.8KBD4BJR2U2K3.4KTK4.KLF2CFCMRQK3TUMK2F2P2K.3KRK6SMG2DA2B2DTU2T2UMUDA2MK.5|.8KBD5HQRK2.8K.5KNFEDGFMP2K.2K5JFNPK.3KTK.5K2U2DB4DMP2MKUTUEBAMK.5|.8KB2A2MQK3.16KNJDBGLK3.4KTLJDBJPK.4K.8K2PUPA3BT3K5U2B2K.4|.8KB2A2NK.19KMD2BDMK.6KTH2DBHK.16KQNA3BT2RK.3KQREDTK.3|.8KA2NTK.19KUL2J2GENK.5KULG2FEGK.16K2NLABNGK.5K3PK.4|.8KA2TQK.19KULNHJKDK.6KUHEJLEGK.17KRKJKHBJK.6KEK.4|.8KM2K2.20KLG2F2H2K.7KLFHGJ2NK.17K.K.KPK.7KMK.4|.9KSK.20KPJD2F2GK.8KLFGDL2NK.20KT2K.8K.5|.10K.22KMGJL3K.9KLMLMNK.22K2.15|.34K6.11K5.40",
    },
    zscorpio: {
      p: {
        U: "#010109",
        S: "#030410",
        N: "#090615",
        H: "#521629",
        C: "#bd2532",
        G: "#78172c",
        M: "#090918",
        P: "#040816",
        T: "#020210",
        Q: "#040613",
        R: "#040511",
        L: "#200918",
        F: "#92182c",
        E: "#b21a2d",
        D: "#6a263a",
        A: "#c66662",
        B: "#8b3442",
        J: "#5d0d21",
      },
      r: ".45K8.43|.44KU3S3USK.42|.40K.K3N8K.K6.35|.36K.K2NKNSHC6GKMKSP2S2PK.K.32|.35KUKTQ2NTRHC6HKMKUS5K2PK.31|.34KNSN4MRLGC6HKMRS3N2UM2PK2.30|.33KQFC2EFGK2DCA3CBC2GMNKGE2C3E2JPK.29|.31K3TEC4FKMDC4FC3FKN2HE2C4EHQ2K.28|.30KN2LHFEC2EGHN2GC3F4HNJGFECEF3GHMSUK.27|.29K2NMHF3EC2GJTNJC2EF4LRJF2EAEF2GDLQU2K.27|.28KQKNMKG3F3G2HLKDGF2GJLUSHGF6GLK2M2K3.K4.20|.26K.KJGTQ2K3GF3J3K2G4LU3LG6FGQK.K2U2PKQSN2K.19|.24K2NK2J2KQUK3GF2GJ3LPQ3PQTS2LJ3H2G3QNK.KSTQN3L2K2.18|.23KNSFC2GHKQT2QKJ2NMPNSQ3MK6QU4SQN2S2K.2K2LGEC2EPMK.17|.23KS2FC2DHKNQ2SK2HN2RSUPK3.6KSU2K2USRUSK4H2GEC2EPNK.17|.22KPLHFE3GK2NQNQ2RPNSU2SP2K.4K.2KPK.2K3SKQNMK3DE2CEG2LK.16|.21KSNC2F2EC2J2NM2S3KMSU3SQK3.KGK.2K.6K.KSQM2K2DFE2C2LSK.15|.20K2NLC2EFECEJ2LNKM2K2SNK3HK2Q2K2GK.12KSM2K.KGE2C2LNK.15|.19KP2E2A3BGF2G2HPDK6.KH2K.KMPKJK.11KUSMKMK2F2CACJHK.15|.19KSTECABABF3GLNPDFGPMK.3KHDK.KUKJK.10KU2MK.K.KFE2ACECMK.14|.19KUTJGH2B2FG2JLK3GLDK.K3HD2K.2KPLHK.K.7KU2PK4.KGDG2E2TUK.13|.19KU2K4F4GLUK.2KNHK2H2KD4K.KPTACKDK.6KU2PKPSQK.K2H2E2U2K.13|.19KU2KNK2GF2J2LSK3MNK3HG2H2D2K2HKHC2KDK.6KU2QNS2RNK3H2F2TUK.13|.19KLU4K3HNSK3LU2K2H2DG2K4.KFGECFK2.8K2PS4NQUTKGH2S2K.13|.18KGCFN3MNMN2RK.KJNUK.KB2DK.4K2CH2GK.12KMN4KULG3JN2K.13|.17KUJC2L4NM2NK.2KL2UK2GB2K3.2KLKFHKTK.13KMNRNMTLGF2GNMK.13|.16KHF2C2E2F2LN2K.4KUK2GCGK2GJK.KC2H3K.15K4TURNGFGQK.14|.16KHF2C3EF2LNSK.3K2SK3HK3LK.2KFEKH2K.19KNT2FEFTK.14|.15KT2F2C3EFGJLUK.2KMK2NPK3ABPK.KLQ2MK2NK.19KTNE2FTK.14|.16KLG2CE3FGLRK.4K3L2HK3BLDK2DA2LK2NK.19KTLE2FK.15|.16KTG3FE2FGRMK.4KMKLJLKLDHD2K2DB2LK3.2K.18KLCJLK.15|.16KUKHPJF2G2LK.3K.2K2PK3U2K4ABD2NKQNK2GK.17KHCLK.16|.16KUK3LG4NK.2KJK.2KPMKHUTK2DA2BDBK4.KD2K.16KLJK.17|.16KTK2N2QP2LNK.2KGK.2KMNDHSMK2BA2BA2LHK.3K4.16KQK.17|.16KQKMLHFEGJLK2.2K.3KMND2QLB2A4HNK3.4KDHK.16K.18|.16KMPLG2FCF2GPTK.2K.KMPQH2QHBDA4LNK2QK.4K2.36|.16KLHGF3EF2GPQK3MKQNHSK2ULB5DNTKMQK4.39|.15K2FE2F2EF2GJ2T2PMPLJGJRMK2LB2D3U2NKTU2HUSK.K.2K.33|.14KQLE3B2F2G2LU2K2PQHFCGLNHUTA2D3TUMKDLHFQMK2QK2AK.32|.14KTLE2FB2F2G2LU2KHK4C2FK2SLA2BD2Q2MKB2F2TMK.KMDAJK.31|.14KULF3B2F2GHKL2BAK4FC2K.KHBDBA2BHK2ACEHMK.K2QKBK.32|.14KTLF7LMK3A2CHDK2CFK.2KD2A3B2HMAC2MK.KHK2.K3.31|.14KULG3F4HNK.2KA2D2K.KJK2.KA8QJEGK.K2DBK.KTQK.7K2.5K3.13|.15KLH3F2GJLK.2K2BK3.KJ2KBK2DBA3B2HNK3.KHKFEK.KTK.7KSUK.3KPLHK.12|.15KTQSLG2J2UK.KDB2K.2KHFLBCK3NA3HRSLTK.2KDHG2DKMSK.7KU2K2.2KPC2K.12|.15KP2SLG2JKUHKCD3K.KGL2HBA2DRSA3KNRDAK2.KLHD3KQSK.6K2JLUNK2HJ2HK.12|.16KPRLG2JSD3BDK2.KGFU2LDBAC3K2HPKHA3NKQSK3DHSU2K.4KTNCEUS2KC2JK.4K.8|.16KDBKL2H2GD4K2.2KLSUHD2AC3HKHKHC3BK2NSK.KDHKUSK.5KLCESNSKFCLK.K.KNK.7|.15KNA2HTNH2KNPK2BCK2STH2BA7CNBC2A5NSK.2K5.5KHAC2LRSNKEJLKMKM2K.7|.15KNA2HQTN2RSRPSBFHKS2D2A8DSHEA5BNTK.KU3QK.5KPNB2Q2SMKGFHTNKNQK.7|.15KLA2DU2SL2HDHDK4NHD2A7BGJGFBA5USK.KUKMUK.5KPMH2MTQK.KGK4QNK.7|.15KFCABU2LBA2C3DKQT2D2B4A2D3C2EDB4ABU2K.2K3UK.5KMNTULUTMK.K.3KR2K.7|.14KNGC2BU2A4CA2DKSU2BDB2A2B2D2KECFKBKDB3U2K.KH3QK.4K2QMSUKU2PQK.K2.2K2.8|.14K2RHDHK2HBA3D2KTK3L2D2ABHLNMBFEB2DK2B2HU2K2H4K.4KQK4GK2UPK.KEGK.2K.8|.13KQS2B2HNRNMK2DHKRUK.KQTD2BTRNE4C2D2NM2DLT2K2H4K.4KSK.KF2GKUK.KFCEK.KGK.7|.14KSUD2HNR2MK5U2K.KQND2KNQLF4C2H3K3LQ2K3DH2K.2K.2K.KPF2GKUK.KE2K.KGCK.7|.14KSUB2HUSD2KQU2LHLK.2K2N2K2B2K3G2DKHCJSUSK3QNHK2.2KNK2.KU2HF2USK2GCJK.KBCFK.6|.14KTUDBHU2HFKRU2LJKNK.2KN2K2B2K.KDHDHDBDRSNK.KQNK.3KTU2SK2U2THFN2K.KEK.3KFJK.6|.6K2.5KTHGBDGLUFEGKU2J2HJLK.KRNK2HK2.2KCBK4PK2.2KPTK.4K4N3TNMGMNK.2K.5K2.7|.5KSNK.3KU2GFE3HUGEGK2UJ2HJLTK2S2K2HKMK.KC2K.2KM2K.2KQUK.6KTN2MKHMK2MK.7K.9|.5KL2K.4KUJFEC2HUD2HK2LJHKJL2SKSUN2K2NMKHG2HK.KPMK.3KUK.5K2LN2HF3JHNK.6KFK.8|.4KLCENK.4KHGA2CHLH2K2NH2K2J3K2RU2SKHDFCGCE2FK2Q2K.3KSUK.3KFCHLKHE3FGLK.5KGJK2.7|.4KLC2M2K.3KLJA2BHLK2.KLHK.KJ2HK2MT2QKH2GCFEFAFK2TU2K4SUK4FC2JKMHFE2FGNK.4KGDKP2K.6|.4KLEJ2HK.3KGFBAB2JK3NL2K.KJ2HKQMLH2NKM2HD4HKQU2TG2LKMSQM2PGECG2NHFE2FGLK.3KD2HQ2PK.6|.4KPFHG2K.3KGFD3F2TUK2NK.KDG2KP3C3LSU3NK4QSGFKC2HK2MTS3GF4L2FECFGJTK.KHK3TUTK.6|.4K2DLFGK.2K2GD3HFGTUK.KNK2JGK.KMPBC2ELU2K2DKMNPTG2KFEJK.K4MHG2F2L2FH2JGJK.3K2.KTU2K.6|.3KMKPQEFK.KQTK2NRSULT2K.2K.KJ2K2PMK2MLEJG2NPA2QTKMKNMLCJHK2N2K3PMH2LU2BABL2K.3KMK2N2K.7|.3KMK2PF2K.KQPKNH2LUSNSK2.2KPK2.KPK4MSTG2LPKDPQKMK3HCF2JHNK.3K2SU4FECNUK2.3K.2K2.8|.4K.2KLGK.KQ2HC2A2F2LTNQK.2K.2K2H2BDK2U2TQK2D2HK2QTMKHBCEGHK4.KMSU2LGJGJFELMK.5KHK.7|.7KMGFK2UTGC2A2E3CFTK.4KPQH2BKJ2UTK2.KD2HK.KTMKMKBFGH3PMK2NUSUJFHLHFELM2K.4KHK.7|.8KHFJNL2FC2BAE3CFQK2.2KNUTKHK2GDUTK.2KD2K.2KNK2NMJ3H2KPNKN2JEFJFJK2FELMK.6K.8|.9K2QNFE2FD3E3CGPTQK.KUK3DG2HLTQK.3K2.3KNUK3GEGH3N2KSJL2J2HJG3EGNUK.14|.11KTF4D3E2GJGQUTK.KUD2KF2BP2Q2K.7KMNTK.2KGJH4LKNJLSJ4G3EJSUK.14|.7K3.KRFG3HG2E2HLHTSK.K2TDBE3BM2QTK.7KN3K3D2LH5K2JN2HJ4GDFJL2K3.2K.9|.6KPJGK.K2HKJC2E3LU2TK.KP2G2ECGA2BMQTK.3K2.2KUQK2UBDR2K5USQMN2KHJ2HK3GELRNK2HK.8|.7KJGHKTK3HECE2CHP2QK.KPLJGEFK2ABPT2K.2KH2K.KTQK2TBDUSK.2K2SUQ2RSK2J2HK4FLPMK2LK.8|.8KTK.KTUDFA3C2JPMK.2KQLEF2K.2K4UK.2KD2K2PQ2K.KNG2LUK2U2NK3HLTQG2HF3DK5GFK.8|.7KP2K2TU2GEA3ECHTQK3NULF3K.5KUK2.KD2K2QPMK.KSNH2QKTUSK3LJHQMHJGC2EG2P2K4.9|.8K3T2LHFECBCE2JNL2SHLTLG2HTK.2K3PQMK2D2K2QPK.2K2QMKMK4QNJ3HK2HJGE3FG4TQK.9|.8KMK2TJF2EB3E2CJLJGJEJHTMQ2PK2H2K2SUK.K2U3K.2KDHK3M2K.KUNF2JK2NGJGFE2F2E3UTK.9|.8KNK2TJF2EBABEC2GTJFJEJHTMPQNK2DHK2SUK.2KU3K.2KDHK.KM2K.KULF2HK2NJ2GF2EF3E2URK.9|.9KN2QHGFEA2CE3FTHFE2BATMK4H2K.KQTK4USK.3KD2K.KN2K.2KNGFHK3HJ2GF5E2TRK.9|.6K2.2K3P2FEA2CE3FPKFC2A2N2QK2D2HK.2K2SU2SNK.4KD2K2NQNK.3KLFGJSUJ3G2FGBFEFTRK.9|.5KJLK.2KQMQGECACE3GPKGC2A2RSUK2H3K.3KS4NK.3K2D2K2NTQK.3KLE2JTUJ3G2FB2EG2TSK2.8|.5KJEK2.2KNTGFC3E2LUKTHE2ABU2SK2HDHK.3KS3QMK.2KDH2D2K2T2K.4KHCEK2NLJF3DGF2KCEUTK.7|.5KJCFLK3TUG2C5U2KULFEACUSNK2HDH2K.2KQS3NK.2KDH2D2K2U3K2.2KLCEK2TULF2G3DK2C2U2QK.6|.5KGEC2GHJ2HJEC3E2NRS2KFCB2TMK.KDGH2K.2KS2MQ2K.3KHD3K2U3KHK2.KEGK.K2LJ2G2DH2KBFU2SK.6|.5KFE2C3E2GLE3CE2NMQNKFCFKPK.2KGBHK.2KQS2KQSNK.3KD2K.KSU2J2GJK4.3KPH4K3.K2U2K.7|.5KGFECE3FGLE3CE2NQPMKGCGKNK.2KDHK.3KS3KQSRK.3KDHK3U3JG4M2K.4KS2H2K3.2KTUK.7|.5KPLC2E2FJULFEFCF2C2NK.K4P2K.2KHK.2KU2K2.KS2K.4K3P2U2SLGF3K2.5KU2K3F2K.KJLK.7|.5KPLC3F2JURF3CF2C2NK.3KPQSQK4HK.KU2K.2KS3K.4K2M2RPNKF4K.6KU2K.KD2HK2FGK.7|.5KPLC2E2FLU2HFEC5LK.2KQUNLHC2HK2.K2USK.3KSUMK.2KTJGFGHMKGF3GK.5KU2K.2KHK.KE2LK.6|.6KNC2ECFQTU2GC6QPK.KTULJFC2HK.KQ2SNK.3KPUMK.KU2FC4P2HF3ELK.4KRSK.K.K.2KCELK.6|.6KNC2E2FPQPQGC6TK.2KU2LJFACFK3Q3NK.4KSRK3U2GC4PSGF3EJK.4KQTK2DK.2K2E2NK.6|.7KFEFJ2HKPKGC2A2JLK.3KU2JF2CEC2HKQ2NK.5KSU2S2KDFE3FTK2GEGEGPK.3KRF5K2DGU2K.7|.7KLRJ2H2NQPHC2ACHM2K.2KT2GF2CE2CLMUTQK.5KSU3SDHFEFEGTK2GEJFJP2K.2KNF2GB2DHDGU2K.7|.8KTG3J2LTHC4HSMK.2KPQG2F5LSUNK.7KSU2SK2FE2HLQK2FCFH2MK.K2JGF2GB3D2GU2K.7|.8KTFE2GFGTHC4HUMK.2KPQJG4JHTU2MK.7KSUSNK2FEFPT2PKGC2LHTK2PNGF2GB3D2FGTUK.7|.8KQFC2F2JTHC4HSMK.2KQSKLD2H2KU3MK.7KQPQMK2GFGNU2K.KGEH2K.KPNGF5B2G3NSK.7|.9KEC3EGN2LJA2HURNK.KSKTSLDKQPKTUMK.7KPM2KPM3K2UTK.KJELK.2KQSHF3E2G3LJLRK.7|.9KL2FE2FHNRHA2HS3K3RNS2NKM3KMSMK.7KQMQKM3QLKUSK.KLFLK.2KTQHF2E3G2JH2JFGK.6|.9KMTGC2EFHRJCAHSNK2SRK2GFLMKQKJHSK.8KQPH3NKRUK3.3KGFQK.2KMLJ2G2FG2DUTECGK.6|.9KMTGC2EFGPDCAHMK.KN2K2FCHMKLJ3TMK.7KQ2H2J2LU2K2.4KJFNK.2KMLH2G2CG3UNFC2LK.5|.10KSEC2EFGPDCAHMK.KQNK2DBDLJCGKHUPK.6K2QPKHJ2HNK2GK.4KEGK.2KSLH2E3G3QNJFC2NK.4|.11KFEC2EFUDA2BK.2KSQK.K2GC2EK2U2TK.5KM2TQK2J3GKFEQK.3KFEK.KU2LJ2E2DG3QK3GJK.5|.12KJE3JUHA2GK.2KUNK.KGFECGK2U2TK.6KMS2K3MJG2E2TK.3KE2K.KU2LJ2EFHD2LK.KSK2.6|.11KQHFE2FUHA2FLK.KTSK.KGFCEK.KUNK.8KQPUQKMJ2C2GPK.3KGEK.KU2LGFG2L2HK.3K.8|.11KPLF2CFJKA2CFK.KQPK2HG3K.KS2K.10KPUSK2JGECGK.5KJK.KU2LF2JGLUSK.12|.12KLF2CE2HECA2MK2TK2JHFGK.KSUK.11KPUSK.KF2CFK.5KJK3U2LF2G2HTK.13|.12KPUJC3JF2A2TPK2.2KHFGK2NTK.12KNU2QK.KGCEK.4KJ2LUTULCLP2QK2.14|.12KPUJC3FG2A2TNK.3KDFGK2U2K.12KMUTQK.KDCFK.5K2LU2LJELMPSK.15|.12KPUJCECFG2A2TMK.2K2HFGKSUK.14K3QSK2HCGPK.6KQUG3K4.16|.12KMULEC3HJA2PK.2KQPHG2NUSK.16KS2NKLEGQK.5KMKQS2TK.19|.13KTLFC3HGA2PK.2KUSHGHU2PK.16KTUQMLEGTK.5K3U3TK.19|.14K2RFC2G2A2PK.2KUSKHLURK.17KSUSNKGHTK.4KN2K5.20|.14KMUGC2F2CAQMK.KUSK3UQK.17KQU2SK3SK.3KMR2K.24|.15KPJFE3CAHLK3QK.2KQ2K.17KS2URK.2K.5K3.25|.16KTUFC3A3KMSK.2K3QK.17KQS2K.K3.33|.17KUEC4A2LKNMK2MNMSK.17KSUSK2NM2K2.31|.18K2EC3A2LUSQK2MQSTK.17KSUTS2MK2MSK.30|.19KEC3A2NU2SK.KQT2K.17KU2SPNK.KS2K.30|.20KJ2CA2U3K.3KS2K.17KUSPNMK.KNSK2.29|.20KU2BA2U2K.4KPSPK.16KUSP2QK.2K2U2K.28|.20KTRBA2KQK.4KNSMK18S3R2K.3KS2K.28|.21K3UCK2.5KSUS3RP2M3P2M3P3M2S5QK.2KUSK.28|.24KBHK7TU21S5K4S2K.28|.24KQT8U2T2ST5U15SUT4S2K.28|.25K42.29",
    },
    zsagit: {
      p: {
        U: "#020104",
        T: "#04010d",
        C: "#93628b",
        E: "#774481",
        A: "#b7a1bf",
        N: "#221e52",
        B: "#937bab",
        S: "#05030e",
        J: "#472873",
        Q: "#070711",
        F: "#514186",
        R: "#07050f",
        D: "#595dac",
        H: "#373177",
        M: "#2d246a",
        P: "#0f0a1d",
        G: "#3d418e",
        L: "#342770",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.57K2.37|.56KUTK.36|.56KC2K.36|.56KEANK3.33|.56KCBE2TSK.32|.56KJ2BEN2K2.31|.57KNBC3SQK.30|.31K3.23KNEFC2URK2.29|.30KNB2K.23KQSECECETK.28|.31KABRK.22KQSEFCECU2K3.25|.30KND2N2K3.20K3TC3E3RSK.24|.31KRDABSRQK.20K2NE2CB2DUS2K.23|.28K4QKA2HDTK2.2K2.14KM2K3N2ME4K2.22|.27KSRQR3A4PTSK2Q2K2.12KGK.2KRSPE3JU2K.21|.24K3N3MHD2BA3D3K.K3QK.10KDJK.3K2SFE2JPNK3.19|.22K2QSRMD6BA4BDK.2KU3K.8KD2K.6KPEJF3TQSK.18|.10K2.3K.5KQ2P3HD6BA4BDK5QUK.7K2D2K.7KUNF3K2PK2.17|.9KNDK.KQK2.2KDHMBA2B3ABD3B7DHFJ2PSK.5KMBLK.9K3JE3C2UK.16|.8K2HDGKD3QK3BA2B7A3BD2GFAB4FJ2NTK.5KNBFK.10KQPE3CEQK.2K2.12|.7KPGHPTKD2GNDG2D7B6D4B3A2BDKD2NK.4KBDFK.12K2TFEJ2ERK2BCK.11|.7KQDNU2KR2KNGDGK2PMG2DB6D3BA5BQKB2FPK.2KNADK.15KF2J2EUSNBCK.11|.8KQK3.K3GNU2TS2P2NGD4B2D3BD2A2FKNGBABDFK.KND2K.15KPNJ2E2NUK2.12|.9K.6KNK4Q2RU2N2GD7B2A2BEKDABDBD2SK2HK2.16KSTLMC2JUK.13|.17K.4KQ3RU2HABG3HGDBA2JCKDACB3DSRAHK.17KSUL2C2JTK.13|.23K4PNDA2DG2H2DB2LNKMBACFBDBTKDK.19K2RMJECBK.13|.24K2SGD2B2CDGECGB2KCNEBFSPAD2HKQK.20KRMJFB2EK.12|.23KHD10ECHDC3BA2FNPD2GDGUK.20KQNJHCAJQK.11|.19K2.KGKD9BDHGBA6CANSFND2GTK.19KSPL2C2NSK.11|.18KU2K2DGKD4BA3DGKDBA8EK2HGD2NK.19KU2MLC2JUK2.10|.17KSPN2U2MD2A3D4GHTD2EA7PKGDMDHK.20KUPE5CPUK.9|.15K2NPNM2P2D2BA2BD4GNSD2NA7PQGDMGK.21KUNC2EFECPTK.9|.14KR2G4HD3AD5GDGNT2DGKCA5URKGDNK.22KUNC6NQK3.7|.10K5N2G4HDGDBD2GHG3HNT2GHJ2EA3ESK2MNPK.22KNEC6PQKN2K.6|.9KUSUMG5PU2PDG3U4SHMPUT2PE2PT2ST2PHTRU2K.20KNACGDC2EJTK2A2K.6|.9KH2MKHM2HNTSUHDGMNUPE3FK2T3PE3NPT3K2QPC2K3.19KCE2CBC3PK2FCLK.5|.6K4D2GSQK2QS2Q2GD2U3JA3EK2UT2PJCELJU3K3NA2BTUK.19K2CE2CB2JK.K2BAK4.|.5KNGNUNK3U2SK4M3PUNB4A3EABQ2PNK5UPHEA3B2CTK.19KRNM2JTK.2KCA2BDBJK|.4KRNGNURK.KU3K.KPM2NTUNBD2BA3EB2QP3K5UPHCA2CB2EUSK19TUPKNJUK3FCA2B2ANK|.4KRTUK3.3K3.3KPKRDB3D2BCBCETPRQL2HL3M2KUF4HMKRURQSTQP3Q3RS3R4JBECAE2NQKN2ECNK3.|.5K3.4K2.7KQRB5DBEC2JUQNPNJFE2FJNTUHFHFLK2NP2Q3KNABTR3S2RQRP2EADC2E2PSK4PK.4|.11KNSK.6KSTD2E2CAKPC2JUPH2NKFC3JM2KTPF2HEA4TQKDB2CJNP4N3CACFJ3CBNUK.3K.5|.12K2.7KNCA5KC4PMH2F2CKECKM2H3TF2C2A4EKSB2E2CB2ABA3B2ACKPFJA2JUK.9|.10K.9K2NA5BEB2C2QMHFAFEMECNHEG2HPF2C2A4BCSB2C2B3A5B2AEKRFJA2EUK.9|.9KTK.K.5KTQKN2MBFJNS2R2K2M2GDHGMKACLDBDFRNC4A2BCFDHCA4CDBD2BCEJQTE2C2QUK.9|.10K.KQK.4KRSC2EHFECJUSRSQ2K2GDLHKEC2MFCFMT2UNC2A3CJFNCA3F2D5HU2TRFBC2K2.10|.13K.4K2PNC4BC2NU4KSRK2HMHMKCKNM3KTU2PC3E2CPFHECB2F2DFD2BNU2TULE2CK.11|.17KU2A5BC2URKU3K2RPK6GKQK4S2K4U5F2JFD2LMK8U2NB2RK.11|.15K2U3CA6CK3SU2K.KQK3.KNHNST2K2QK.4KU4F3EF2K2.7KU2MC2K3.10|.14KTU2NBDC3B2CK.3KRTK.2KQRQKFGKHGPSR2K.6K3Q3CJTUK.8KNFC3B3K.9|.14KSUNEC3E2CBRK.3KU2K3Q2S2HGHNMHMSR2K.8KQ2SCAUSK.7KUNECACB2AK.9|.15KUA2CACF3K2.5K2TUQK2FHLMNJKM3QRK.9K7.7KPF2ECBC3EK.9|.15KUA2CECF2EJTK.5KU2RK2FHM2JCJMHLR2K.23KUJFE2BC2PUK.9|.15KTA2CGDF2EJK2.5KUSRK2HM3JCJMF2RSK.23KTJ2F2DFEPUK.9|.16KREBDF2CEPU2K.5KRTK.KNM3LM3JK2.25KTUJLMECPUK.9|.17KJCDFE2HMNRK.5KRTK2NKM7GNQK.24KU2LMNECNUK.9|.18KPBDUKML2K.K2.3KRTH2G2UMK4N4K.24KT2LE2JEPTK.9|.18KPBDUK2LHK2URK4UTMHG2UNK3MPUFADK.23KTPJECJKRSK.9|.19K2NUK.KH2KPC2ETK3NJM2DKQNJNKNJEDSK.22KQPJBAJSK2.10|.20KUTRK2H2FDBABU2K2NJPUDFQJAJNENUPNQK.21KQTJBAMTK.11|.21K2UK2NJCAE2CNPSRPNQUFHNA2CKETUPENK.K7.12K2N2FCBNTK.11|.23K2U2E2A3NENQR2NPTKMJE3MKQ2KMFRKQSUS4K.10KTUF2JEBNSK.11|.14K8.3KUE2A3K2QKQTLNRN2ML3MHSQK2FPTRU6K.K.8KU2J3ECNSK.11|.13KS3RS2U2K.3KEB2J2TL2K2M2K2TM2ECLNUSQ2KPD2NKG3HGNKQK.7KPE2F2LQK2.12|.13KU8K.3KCB2UKTM2KRLHK2UN2C2MPU4S2D2P2GD2G2HQ2SK.5KSPCED2MSK.13|.10K3TD8K2.2KP2NPK3NJLMNK.K3E2MKUSKP2KGHJEFD4HNMKQK2.3KJFACFJNRK.13|.9KS2QSD6BDU2K3R2UM4NJM2TK.3KJFNK2TUM3K2DBJD4H3KSUSK3QF2ACFTS2K.13|.8K3UTFDG2D3GLH2KTRKMLH2F2JEMKUK.4KN2K2SUM2LK2D2EHFD2G2HKPF2KQKPE4FK3.14|.7KS2B2D7G3MPTKM4C2JFJM2KUK.5K2.KTSHGH3LKCEFG2BDG2HKFDRFE2F2NTK.16|.8KRECBD5G2L2MSUM3L2C2EJL3NTK2.7KTUHG2H2M2BCFG2BCG2HK2PNC2EJDNSK.16|.6K2NMD3G3JG2LM2QUQM2H2F2EJL3MKTKCK.5KEU2LH2L3HFCJG2DFG2HK2NEC2EMHK2.17|.5KSUG3D2HGHLHL3MU2KJ2F3GH2L3PKPC2K.4KJEU2MLH2LHG3EMG4LNUPC4PK2.19|.5KNPMG2D2M2DGHL4UPMECFGH2L4MK2PC2K.4KJEU2M2H2LH2G2EJG3LKP2NC2EKUK.20|.4KUB2D4GHG2HLPRST2HLGF3JLMLMKM2K2C2K.4KECPUM2HG2H2G3FQPHUPD3E2TUK.21|.4KSB2D3G2D2GHQ5SLHGFJ2MHLM2LM2K2ECK.4KECPUM2HG2HLG4HRPB2CDEU2TK.22|.4KRD5G4MUK2ST2MLJFJHM2K2G3LK.KNCHK.K3JEUTMLH4LHG2NUC2B2CPQRSK.23|.4KSD4G2MHGNUK2TU2MLE2JHLMHG4MQK2NCHNKN2KJ2UTMLHL2MLH2GPTC3E2K2RQK.23|.4KUGD2FGMKG2PUK2SUPMHJEFHLMFG4KQK2NCN2K2NKE2PTMLHLM2KLH2P2C2ETPK3QK.23|.4KUG3D2SNGDK2.KU2H3E2HFCEG2HLNQK.KQKN2K2NKA2PTML3MK2L2KC3EUM2LRKS2K.22|.3K2UG3D2PND2K.2KRSH3JEHJCFG2LMNSK2.KN6KH2PTMLM3KMH2KC2PUNL3SK3.23|.2KUTQG3D2PND2K.2KSTLH3MLE2G2HM2KPTUK.K2N5K2T2MNM3LHUNCACKNH4RSK.24|.2KS3MG2D2SND2K.2KSUL2H2MHEFGLKN2KLTRQK3N5K2UTK2M2KHGUNAC2SHGHLHSQK.24|.KSPFDHG2D2GD2NK.2KTUM2LHJ2FGHK2LH2MNQS2QKN4K.KU2K.K2MG2NECPUPHGHLNUK.25|.KQND2HQMD5SK.2KSTM3LJH3MK2H3MNRSURK2N3K.KU2K.2KHG2ECKTUMG3LNUK.8K.16|KQD4HPHG2D3SK.3KSKM2LJLM2K2H4MNR2URK5.2KU2K4HG2ECMN2G2D2HNUK.7KRK.15|KSBABD4QDG2DPK.4KQSMLDFK3G4H3TSU3TNKNK2R3KPQLHG3FGHG2D3HNUK.7KMK.15|KUA2BDGDGRDG2DPK2.3KSTNGDGK2LG5H2TU4TN3K2Q3KPQL2G5EFGD2G2NRK.8K.16|KUD2B2D2G3PGD2KQK.2KTSK2M2KM2H3GH2LQU4TN3KHSRQPQ2NHG4FE2GD2GHNK.13K.12|KUD2BADG2D2KND2PSK.2KSU2K2MNML3H2KNBCKU3SKN2KHUS5NG3FEFE2G3HPUK.12KRK.11|KRD2B2D5QND2GK.3KUQSK2SKML3M2PBCB2NUTPKM3NU2SQ3NL2GF2G4H2MTPLK.2K2.7KQK.11|.KG2DB2D2G2KTUNLK.3KUK2.2K.KNM2U2NACABDTSQ2H2LTUSRK3PM2HG6HMPUNGFK2QRK.7K.12|.KH2DBD3GFKTRNMK.3KTK.4KUPK2U2JB2A2DNTQ2GJHTSK2.3KNMLHG5HMPUMGFJPRTK2.7K3.9|.KU2B3ADGDBK4.3KQK4.3KTUTU2GD2A3CTSKF2LT2SK.2KTUQMHG2CEM2U2MH2E3D2NUK.5KDBFK.8|.KU2B3ABGDBK.4K2QK2MLMK.2KT2RU2D3B2ACS2KF2JTU2SK.KU2M2G2DEJM2S2ML2FJEDFENK2.4KD2K.9|.2KUB3AB2DPRK.2KSK2.KLHLK.2KU2PGHFG2D3FSK2HDQK2U2K.2KUMLG2DFLNPQKML2H2GFE3NSK.2KLK3.9|.3KDB4ADUK4SUTK.KM3K.2KU2PGHJNFD2H2TK.KDK.KSUK.2KUMHG2FGHSR2QKM3H3EFDNUK.KLHPQTK.8|.4KDB3DMUKRQ2TK2.3K2MK.KTUPJGHFH2DGHU2K.2K.2KSUK4RKEG2HMHQ3S2NM3LGF2HPUQK2R2PH2K.8|.4KUDBD2NUKQU3K.6K.KSTUCBENUFHMGDPUK.5KQRKNTNK2CH3KRQ3TUTK3HF2HKU2K.2KQLDLUK.7|.4KUFDBDLUSK2UTK.6K2TR2PC3FRFH2FDPUK.5KQRK2QKMK2JH2KNPSRTU3TKMF2HNPUK.3K2DHUK.7|.5KTUDBDFSK2SRK.2K.2KSUKRNGDC3SRNFJUK2.5KQK2QSRPLM2KLJEJFNUK4TUTSD2BFUQK.4KGBDK.6|.6KQKD3PK2SQK.KRK.KSK2SNG2DCEHRKJPUK.3K.3K.KS3PM3RKE2JFMUK.3K2STKFBJU2K.5KDK.7|.7K.K2FPRKRTK.KSQK3.2KQKHFC2DPU2SUK.2KPK.2K.KQK2SM3K.KLHFMUK.5K3HBFDPK.6K.8|.10KQK2.KUK.2K2USK.2KSUH2FEDGHGNTK.2KQ2K2PKQK.2KM3K2L3JNUK.6KPLGDBNK.15|.11K.3KRQK.2KSK.4KULH2JFG2DGK.3KSTQ5K.2KM6LMPTK.7KTMHD2NK.15|.16KTK.2KSK.5KU2L2G3DNK.3KTQ2KTUK.3KTM3LMNKSK.9K2PGDNK.15|.16KTK.2KSK.5KU2LHDGD2PK.3KSK3TUK.3KTML3M2KQK.9KTQGDNK.15|.16KRSK.KRK2.4KUKLJDGD2PK.3KTK.KSUK.3KQKMH2LK.K.10KQ2LDCK2.14|.17KTK.2KS2K.4K2UPFBDGPK.2KSTK2TSK.5KS2HGHSK.11KTQJACQ2K.13|.17KUK.2KUSK.5KUTFBDLPQK.KU2K2S2K.5KS2H3TK.11KUQHF2NK.14|.17KUPK.KU2K.6K2PGBANSK2U2QK2SK.6KSUH3TK.10K2UHG3DFK.13|.17KSQK.KU2K.7KPGDANSK2U2K2QSK.6KRUH2GTK.8K2PNSGDGHD2K.13|.17KRUK.2KTSK.5KQUKNBNUKTUK2TSK.6KRK2NJFGK.7KTD3FECF2DCK.13|.17KSUK.2KTSK.5KSUKNDFNKTSK2SRK2.5KU2TQF2GRK.7KDF2LECFD2CK.13|.17KQUK.3KRK.5K2SKJF2DTS2K2R2KPK.4KT3KJH2KTK.7KRUCJPF3JK.13|.18KNK.4KSK.3KSRKFE3FUSQK3RKQRK.2KU2K2.KM3TK.8KPANTB2NRK.13|.17KTQK.4KSK.3KU2FE2KEFTRQ3KSQSRK.2KU2K.KM2L2TK.8KUAERCBJSK.13|.17KTUTK.3KSK.3KU2NRPEKLRQKQ2SUK3.3KU2K.KM2STUK.8KUC2SBAJSK.13|.18KTK2.3KSK.3KU2EUNCEN2K.KTU2K.5KUK3NM2KSTK.9KCEPC2K2.14|.19KSTK4SK.3KU2F2CACF2NK2RS2K.5KTS2NM5UK.9KQ2E2TK.15|.19KST2RS2TK.3KSTF2EC2J2NK.KR2K.5KTU2PNMKMKUK.9KQKE2K.16|.20K7.5K10.3K2.7K6.K.K.11K.K2.17",
    },
    zcapri: {
      p: {
        S: "#05040d",
        Q: "#060710",
        T: "#04020e",
        N: "#160b2f",
        R: "#05050d",
        P: "#0a0713",
        M: "#341260",
        D: "#79309a",
        F: "#782194",
        G: "#49217f",
        U: "#010104",
        L: "#591279",
        J: "#30205a",
        A: "#bb778f",
        B: "#824ba9",
        H: "#35207b",
        C: "#6d3d9a",
        E: "#382f76",
      },
      r: ".46K2.8K5.35|.45KSQK.6KQT4K.34|.41K.2K2STK.5K2N6K2.32|.40KQK2RPM2K.4KQSD3FDGRQK.31|.38K2U2S2QNM3K4PQKD5GKQTK.30|.37KSUKLK4J2MP3TUG2DADB2GH2K2.30|.36K3PF2K2.2KJ2PKPTUGFDADA2H3QRK2.28|.34K2U2NF3L2K.K4.K2NB2ABDF2H2GJPKUK.K2.24|.33KQPTRNF2LFDK2T2K.4KB3D2F2H2G2K2S2KURK.23|.32K2Q3TNGLF3GNUTK3.KMB2F2DFLMHG2K2SPKU2K2.22|.31KT2HG4MLFL3KTPQ2PKPNF2ADL3MKHMK2GFDB2MUK.21|.30KPUSG4BMLF2L2MTPTS2Q2PF2ALG3HKM2K2LDB3MSK.21|.29KTKJMH2C2BGM2GLM2S4QPQUL2ALGM3K5FDBABFDK.21|.28KTUQMH3B2A2GM5U3K5U3H2M3K.KPUD2FAB3HK.20|.28KSUPKMHGB2ABCKMJ2K2SPK.3KSPQNHKMK4FCD3C4GUK.19|.28KU2K.KHGCBDBCKJ2USK11T4J3LFDC7GUK.19|.22K2.2K3S2K.KHGCBDBDKEJSPK2PSU4K.KTST2J2MF2DC6DGUK.K4.3K.10|.21KNMK2U2TK7HGL2DFNK3TSK2J4K3TK3SNL2FLG6LJTQKN4K3DK.9|.20KSNDFGUSK.KPSQK2MH3DFTK.KRQJ8KSK.KSUJL2GH5K4J3MH2JMFBK.9|.15K5PTNGDBHGHK3TUTPM3HKP2K.KTKJ8NP2K2US2NLHMH4KPKJM3G2ELBL2HK2.7|.14KFA2NQK4B5CGEJ2TPK2U2K2L2K2J3K3J5CAJK3RTK6TPE2GLA2DAFKTK2FBDK.6|.14KLB2MUNJK2CB4D2GM2TKPKU2K2M2NK2JK.3KJ4CALK.2K3.5K2J2G2A2DAFKP2KDBDK.6|.15K3UJCBCGH4EA2DF2HKU2K2PKMK2.KJ2K.2KJ3AJ3NK.2KTK.4KG2FA2DCG4P2TBNK.7|.17KU2CB2CH4GCADF2GNUTK.K2U2K2J2K.3K2J4T3K.3KQK.3KF2A3G6PQPJK.8|.16KPU2CDBCH4GCADLF3UPK.2KU2K2J2K.2KP2J4NUSPK.2KSK.3KFA2FG7PTK2.9|.17K3UMGJ3H5G2L2GUK.3KTSK2JK.4K2CBGEJN2KSK.2K2.3KL2KMH5JKNSK.10|.19KSU2TP2H5G3LGUK.3KP2K.K3.4KNALEJ3NPK.2KQK.KPK2.KJ5K3SK.10|.20K2PTP2T2P2SHL3GUK.3KP2K2A2MK.2KUQTKJ2UKPK.4K3MJKPK4JK2EJ2KPK.9|.22K2P2S5NM2PTK.4KP2K2A2FK.KFLU2KJ2UK2.5KPKJMKPQSK.K.2K4PK.9|.24KPTK4SU3PK.5K3TA3K2JA2NK2JKUP2K.4KQPJTK2PTK2UK6PK2.8|.25KTK.K3PKUPK.6KT2K3.2KJ2K.KJ2SQPK.4KTS2P2KPSK2USJ2GC2U2SK.7|.24K2QK2M3H2UPK.4K.KTUK.2K.2K2.K2J2SK2.6K2QKTPKSUKQTJ2GFCUSTK.7|.23KUTHGC2DGH3KTK.2KSK2TUK.KTK.3KPJ3SK.9K.K3SUK5A2F2NSK.7|.23KUNG2CBDGH4SPK2TUK2TS2K2UK4P2J3RK.13K3.4KA2F2MUK.7|.22KMB2A3C2FGHM2UTK2USK2S3UK3CA2UTJ2K2QK.11KSK.4KJF4MTK.7|.21KQMB2A3CDL2M2JUSK2U2K2US3JK2BA2UTJ2K.KSK2.9KSK.4KJL2F2JQK.7|.21KUB3GC4LHM2KUTUSK2.2K2Q2P3K2PU2J2K.KTSRK.9KQK.2KU2FLF2TK.8|.22KD3GECEHM4K2PS2KPK3JP3K2.2KU2KJK.KUSQ2K2.8K.4K2LF2LK.9|.16K2.4KTUG3HJ3K4.KQ2KS2PJ2PQK6U2LFK2T2SQ4K.12KSLFSK.10|.15KUTK.3KU2KGEJKJ3MKJK.K3TSK2JSTE6U2LFMK3PKN3K2.11KQLFK.11|.13K3CFLK.3K2TUSUK2JMJH2JK2USK2.KJUTE4GEU2GFCJPK3HGEPQK.11K2NK.11|.12KP2SB2FK.5KSUTK3JKEH2K.KS2K4J2E4GEJUB2AGPK.KMH2J2K.10K2PK.12|.12KQ2UB2GK4.2KUSP4KSGH2JK.KUTP2KJ2E5J2KB2ACK.KM3HG2TK.8KSQPK.12|.10K2H3CBPTUPSQK.2K3P3TA2GH2JK2P2QPKH2EBABC2K2B2CK.2KMHG2A2LSK.7KSEJRK.11|.9KPSH2CB2U2NU3NK.K3P3UA2GEHJK3QP2KH2GA3C2P2B2CK.K2HG3A2LQK.6K3JGUK3.9|.9KUNHCBAC6B2K2J3USNA4CHJHJKPTGHM2CA3CGJ2E3K2HG3HGDFLQK.5KUQSUFBDUSK.8|.8KTJHCBABCH4CB3NJ3U2PABA2CEJHJKPTGHM2GA3G2K2EJEK2MG2A3G2HRPK.4KNTU2FBFU2K.8|.7K2JB3ABDH3G2H2DJTJ3K3MGCABC2H2K2MH2M2GA2CGHK2EGENKMG2A3GL2UQK.3KGBMU2MBDJ2K2.7|.5K2SULA2B2CHKMGCGM2KPQK4UK2MHGA3MHJMHG2KJMCAMK2A2C3GUCAG2H2L3KQK.2KQPB2TRNHB3TQK.6|.4KQSH2BA2B2CHKHNUNM2KPSK.KU2KP2HGA2MEMKH2G2K2G2JEK2A2C4TA2CM3L3MUK.2KSTB2UTNHCB2TQK.6|.4KQUH2B4C2HNT2UNDGNRUK2PU2K2PG2E2JNTM5K2EC2GK2A2CE3TA3EK2NM2NQK.KQKDB2CBH3B2CTRK.5|.4KSUCB2C3HGT2U2K2B2NU2PKPUK2.KD2E2JUSM4K2NKG2EK2C2K4PJ2ECK2T2QSK.3KTB3QCH3B3U2K2.4|.4KTUB3E3H2P2TPK.KU2K3PK3PK2LDAE2U2NM2KNRK2GEK2HB2K.2KTK2J2K2P3K.4KNBDLRH4B3HCKSK.3|.4KTUB3E2H2EKPK2.2KQK.3K.2KPQ2E4JUSPK2.KSK2MHMKBA2K.KU2SE3JK2QTK.4KMBDRK2H3B2AC2NSK.3|.4KTUB3C2H2NU2K.4K.7KQPE5JUTPKMK2SQMH2MKJFLJK2U3E4K2QK.5KNMJTK.KH2CB2C2TSK.3|.4KSUB3C2ENUTUK2.11K2J2E4NP4K.2KPNM2KM2J3KQTPKE3CE2PSK.4KPTQK.KNHGC2B3NUK.3|.4KU2CB2C2NS2H2JRK.9KS2J2C2E2SP2TPK.2KP2KQTM2K4SPK2RE2C3NUK.5K3.KPTHC3BA2NUK.3|.4KU2CB2C2NPSH2NRK.9KQSJ2CE3US4K.2KP2M2KM2K.2KSK.KSE2GC2NUK.9KSTNEC2BA2NSK.3|.5K2THB3JRNGFCRK.8K4J2E3JUSK2TUK2JM2F2LK2.2KUSK.2KJEJE2J2K.8KU5C2B2AJPK.3|.6KSGB3NRNFCGSK.7KP2J3KE3TURK2U2K.KM2F2LK.K.KU2K.2KUQJCJE3K.7KU2KU2CB4MPK.3|.7K2CBCJSNHJK2.7KPQGEJ2K2JNTSK.KS2K.KM2GLGMKJK2U2K.2KUSE3G2CK2.6KNEJN2B4DNQK.3|.7KQNC2E2UK2.9KQTG3K.KJUSK.2KP2K.2K2M2GMJ3KTS2K2PURQEGC2DNQK.4KJH4EB4PURK.3|.7KTNC2HEUK.10KTUG2EK.K4.4KPK.K3M3KNEJKQNTSQKURKE2CDFMQK.5KH2CB6TUSK.3|.8K2CB3CQK.9KSUJ2K.KQSK.3K3MK2A3K2A3KP2HG3K.K3RCDA2GEK2.4KS2HB4JUK3.4|.9KGDB2LPK.9KS2J2K.KRSK.2KP2M2KJA3K2A3KPNC4K2PK2UGBA2G2ESK.3KUQKB2CBJSPK.5|.10KSB3EK.8KUJFCJ2K4.2K6.KL3MKGA2K2CBC2EJSRK2SHGHMGCEK2.3KRUEB2C2NSK.6|.10KUJG2S2K.7KULB2K2P2K.2KU2K2MK.KHG5K2.KQEJ2EU2RK2RNM3DB2NQK.2KQUB2CH2UK.7|.11K6.7K2UGDCK2PQK.2KSUK.K4H4GEK4PJ4U2TK.KJHM2G3MK2.2KRUCBC2HUK.7|.11K2T2K3.5KT2KGFGK2PK.2KSK5JT2K2CA2DGM2JUJ3CEGMK.2K2H3MLMKTK.KJBCBJUNK.8|.10KQMD2TQ2K.4KQTKHCK2PK.3KSK2ECKJT2K2CA2DGM3UE3C2G2UK.2KHGNMLMNUK3HBGHNK2.9|.9KTULDFNT3K.3KQUPKEUSK.3KQ2KJEK2MT2K.KA2LK4UKE3C2GUK2.KH2RQL2KTQ2PGBNUK.11|.8KTFBDF2K4UK.KTUJKE3NK.2KSK2J2K2M2T2K.KJ4K.KQUCGHE4URK.KHTMB2LEU2Q2TK2.12|.7K2MFBDF2K.KU2SK2U2GKEGBK.3KRSK2JK2MHT2K3J3M2K2QTCGHE4URK.KUPFB2LJ3K3.14|.6KQNG2FCACGK.K2UTKUNG2J2EK.3KTK.2K2HJNQ2MJK3JHMNJK2J2GE4NK3TUJML2KH2EHNK.14|.5KPJKMH2GAC2GK.KS4G2E4K2.KSK.3KMHNRP2M2JK2MGH2EK2TUCE4HJS2PTGLU2KEHECGK.14|.5K2MKHMJGACGJK.KS3UE3JE2QPK2UTK.2KHGNSP2M3K2HLGE2K2TUCHEJEMEU2P2GFUT2E2HCDLK.13|.4KSLFJTK2J2GDCK2H2NQSEJ2K2C2KS2K2.3KGMK5M2K2GL2K2.2K2NHEJ2HMHNTKHMUNGH2E2F2K2.12|.3KQTLFNTK.KJGLK2H3JPSJ2KPKDBKU2K.4KGNSK.KTHMK2G2LK.3KPNG2J3MHMUQKPUNGH3JGDLUK.11|.4KL2MNK.3K2JGLH2JK2QK2.KJNJKSRK.3KMK3JK.KJK.2KGK.2K2.KNG3H5TPKPTUH5GFMTK.11|.3KMFMSRPK.3KJCACJK3PUTKM2TU2K2.3KMHK2J3KT2PK.KTPK2J2K.KTF2GH6T2PUJK2JHCFLNK.11|.2KQLBK4.K.2KJHCGK2PKNUPQNGU2K2.3KGLNK2J2K2TP2K3Q2K.K2.2KSUFG2H5UTKSEJKHJHML2GK.10|.3KFBTK.2KTK.2KM2GL2AEKT2Q2UKEJ2K.2KGMUNJ4K4TQK3.KJ2K.KPUNLCGH2G4K5HJ2MN2CK.10|.3KLFTK.KPS2K.KM2LBA3KPTP4EM2LK.KGU2J3K2.3KQPK.3KJ2K.2KT2F2GH2G4K.4K5NJK.10|.4K2PK3QTQPK2M2LB2A2K2TP4G2F2MK2GU2J3K2.2KPSQK2.2KJ3K3QTLFGH2G4QK2.KPK.2KLMK.10|.6K2MKS2Q2K2M2LBDCLKPTS2NHG2A2LGJT2K2J2E2K.KQUSQSK.KJ2AJ2KP2NLF2GH2G3U2K.K.2KFBLK2.9|.6K2MKU2SPKM6EK2QUTNG4A2L2GT2K2JE4K2SU4K.KJ2EJ2KP2SFDF2H3G2NK2.4KDAGKQK.8|.5KLFK.KUQK3M2K4.KPUJG3C2L2FDNTK.2KE2J2K2U5K.2KJ4KP3NMDFH4G2JRK2.3KLMLJQK.7|.4KTFDK.2KTSQTSTKPK.2KSUHGCDADGLB2U2K4J4K2US3TQK.KJ2K3P4NDFH3GHGHSKPK4PML2K2.7|.4KRFBK.2KS5TKP2K3N2G2CD3F2BDU2QTMKJ4K2S4P2K.2KJKJKS2QSNF2LGH4GCGUS2USULFLGSK.6|.5KLDK.3K4U2STP4G2HG2FDB3NT3U2BALJ2K2QUK3P2K.3KEFLUK2T3NB2GH4G3JUK3MF2G2EK.5|.5KLFK.6KU4SQPHG2H2GFDB3NP2TUPBAFKJ2KQTK.KPQK.3KEGCJK2T2QNB2GH5G2JK.2KJHGMEK.6|.6KNK.7K5NJHG3HFBGMDBK2PTUMDBF3LMT2K.KQSK5GCGAK2TKPNLF2GJNH2G3K2.K2JHGSQK.5|.6KTK.9KSUG6HDBNTLPK2PT2LF2BABF2UTK.2K2U2JLMC3AMK3P2QUBFQPH2G2FGSKQKMHGUK.6|.7K.10KS2HG4H2GDNTMK.2KT2LF2DABDFUPK.3KU2JGMFD2ALK.KP2SNBFK3MGFCGNK3JHKUK.6|.17KTK2HG2HMH2M2BNTK.2KT2L2A2FLGPTPK.3KS2K2MGA2MTUK.K2TQNLH2K2HGH3P5K2.7|.11K.4KP2K2G3HM3K2BLK2.2KP2GLDALGMUTPK.3KQ2K2MGFLJU2K.2KUPUG3K2JH2MHPKP2K.9|.10KJK.2KP3K2HGH2M3PLFKM2K.KP3GL2GMNU2K.4KP4KG2MKQUK.3K2UMLFGK2JM3NPK2.10|.11K.2KS2QPK2H4MH2TBLKM2K.KT3G3HQPUSK.4KP5G2MK2SK.4KUPD2FK2RNMJHSK.11|.13K2USTK.KH6KTBLM3K.KTUTHG3PKT2K3.2KP2K2QJMKP2TK.K4UNB2LK2QKJM2UK.11|.12KU2SUK.2KH5TPBFLM3K2UTNK3GHML2NKM2K.KP2K.KSQKF2ATKM4K2NLFMJK.K3P2K.10|.12KU2STK.2KHG4TPDFLM3K2U2M2K.K2ML2M2LMK.KTUK.KUNLDFAUKM5KUMFHK.4KSTK.10|.12KU2K2.2K2MH2N2KF2LM4K2UPLGK2JGDFLKMLMK.KU2K.2KFLA3UKM5KUNFGMK.3KHUPK.9|.12KSK.3KJM3NT2KDBM5K2UND2K2JMBDK2ML2K.KU2K.KMF2A3TKM5KTUMDMK.3KGUK.10|.12KSK2.2KM3HNSTKDBL3M2K2UNF2JMLF3PKML2K.KTUK3MLFA2DGKMLM3KQ2FLMK.2KMGNK.10|.11KSQTJK2M3UT2UTKF4LK2M2PM2H3F2G2K2ML2K.2K2TQK3GBALGNMLM3K3U2G2K.KGDGPK.9|.11KTP2MJKM3UTU3KF4LP2M2PMH4F2GHK2MLMK.3KPQK.KMFAFGM2LM3K.KU2GMK3F2GPK.9|.12KH2K3JN2U2ST2PF4MPKL3KH4F2MK.KML2K3.2KQK.KJLBG2NMLMKPSK2U3TKNMFDFK.10|.11KJH2K.2KS4QPQTSNDLKPNL3TPMHGF2NQK.KLK2TSK.KPK.KJHGLKPM3KSUK.K4Q2HFDMPK.9|.10KJH3K.2KUTSTQP2QSMDLM2L4TQJH2F2MTK.KMK2TQK.KQPK2JHGFP2M3KS2K2PK.KT2GFDNK.10|.9KUJ2HJK2.KUSK6QNFNM2L2MLUPJH2LFLK.2KM2K3.KPT2K.K2MFPQK3PK2.2K.3K2ULBNK.10|.9KUJ6KQSK.6K2T2M6UNLH3K2.3KM2K.3KTS3K.2KLP2Q2K2.2K.5KPUMBNK.10|.9KUNE2JMJUQK.8KPQK3M3UNLGH2PK.3KM2K.2K2TUSUQK.KLNSQK.3KPK.5KUNFNK.10|.9KUJLEJ3SQK.9K5M3TNF2GHPK.3KMK.2KQTK4UPK2DBNK.5K.6KQPK2.11|.9KRJBGEKJU2K.10KQT2KJMTNF2G2PK.3KMK.2KTUK.2KUTK2B2NK.12KQKUK.11|.9KRMBFJMJU2K.10KPQTK3QPJFGHPK.3KMK.2KU2K.2KSTK2FDNK.13K2TK.11|.10K2MNUM2U2K.11K2JK.KPTQELHTK.4K.2K2QTK.3KTK2L2PK.13KQTK.11|.11KMNUMH2NTK.10KJ2K.KPTQC2GPK.6KPTK2.4KUK2GLTK.12K.K2.12|.12KTUH3NTK.11K2.2K2J2ADLK.8K2P2K.4K.KF2DNK.10KPK.14|.12KUTMH2PUK.14KPUJ2F3LK.7KTP2K.6KLF2NK.10KT2K.13|.13K3H2NUQK.13KSUJ3L2JK.8K3.6K2GLFNPK.10K2.14|.13KPUH2L2SK.13KSUK3JKUK.15K2UKGH2GTK.26|.14KTJ2FDFK.12K2SUK3MNSK.14KTS2JG2HLUK.26|.15KSUFDFUK.10KTU2GEG2MJQK.14KT3JEGF2NK.26|.15KT2FBFUK.10KTU2G2FGJ2TK.14KTULJEGDFNK.26|.16K2N2K2.11KUNLMKGCLJPK.14KTUFJLFDF2K2.25|.17KTUTK.11KUNLMEC2FLPK.14KTNFJLFDF2LUK.24|.18K3.12KSNMKN2EJKPK.15K2NQNL3FK2.25|.34K3.K4.K.18K7.27",
    },
    zaqua: {
      p: {
        R: "#171d4b",
        J: "#434785",
        A: "#81cfe1",
        U: "#020004",
        L: "#324288",
        B: "#7da8c4",
        E: "#667ca8",
        C: "#38c2f9",
        M: "#2a3983",
        S: "#0c0919",
        T: "#08010b",
        D: "#3ca1e0",
        N: "#1f3d7d",
        P: "#1f2868",
        G: "#2c7fd2",
        F: "#4372b3",
        H: "#2d63ac",
        Q: "#22206b",
      },
      r: ".96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.96|.41K5.50|.39K2R3JAK.49|.25K.12KUJA5RK.48|.24KLK.10K2BEB2ABEK3.47|.23KC2K2.8KUBA3B4EBUK.46|.23KC2L2K.6KRB2A4BABELMK.46|.23KC2ACSK2.3KTRA2EBA4BJKMTK.45|.23KC4D2NK.2KSJA2BAB2AB2ERPSK2.44|.23KG2CA2C2SK.KPBA3BJB2E2BP3RTK.43|.23KG2CA3C2LK2REB2AEB4E3PK3.44|.24KTDA2SRAJTUSBEBJE2BFB2E2JKJTK.43|.24KUD2ASTRSUTJB3R2JB2EKNJEBESK2.42|.25KHDART2U2JBJE2ABEB2E2AJE2BEKTK5.37|.25KUJACGUT2EBEJ2E3B3E2JE2B3AB4TK2.35|.25KTSDG2H2EB2ESRE2B6JE2B3A5RJEK.34|.17K.3K4TU3HGDB3FLUSB8LFE2B7A2BK.34|.16KGK.KNDGRS2GDGJDB2EFJTS2B2EB3RNJ2EB2ABEUTR2SJK.33|.15KN2K.KH2FKSPGD2JBEBF2JKPUJB5SNPJ2EBAB3JU3K.34|.14KH2K2.KHNK.KUTHBE3F2JNKPTSB4USNPJNJE4ABJSK.35|.14KFDH2K.K2.2KT2EBEFEFJK2P2UTEJK2TRN2K2TRE2B2A2BUK.34|.13KP3D2UK.4KTJBFJFS2PSUP2USEJ3USKRTKPRUSJE2AE2K.34|.12KUPSUD2UK.4KTJBFJUM2QKTP2RPE2J2STKSUKQPTUJE2AE2K2.2K4.27|.12KSASUF2UK.5KJFHRMHFHNMKRE4BJ2RU2Q3M3RURB4TK2T4K5.22|.12KUDRSGDEK.3K.KBEJPLHFPM2SME4BE2RUPQM5JUREBEBJR6JEBEUK2.20|.13KJGPLD2K.2KJKJBFTJH2LNMLKJE2B4ETKPQ2M2JEJUTKJE2AB2EDB2A4B2FK2.18|.13KTGDH2LK.3KJBSNHE2JNHDK2JB5JNK.KQ2LJEJLMNTJ2S2RJ2FK2NLR2SKHCAK2.16|.13KTGDHN2K.3KTBR2HJEJNGDT2JB5HPK2SNMJE2JLMRUJ2U2TJ3K2PNK3THAFSRK.15|.14K2TK3.5K2SRPMP2GLKP2K2EB2PTRPKSDGQPJ4RU2EJTK4.2K2.3K3HADTK.2K.11|.15KTK.8KSTPMPNDNKMLNKHBFKJM2QKH2LMJPJ2RU2F2JK.12KHD2RK3NK.10|.15K5.6KSRLH2FS2KLF2KPLK2HFEQ2KRHLP2JPRTUF2EK2.12KTEASTHDJK.9|.14KUTSRUK.6KHD2PFURPJEFJPJRPF2HL2TSN2P4NMTF2BETK.K2.8KTERSTK3.10|.10K2.K2UHCHU2K.3K.KEB2FEURPLJHFLKLHF2LMEK2SLEFPM2P2JFB4KT2K.3K.4KJK3.13|.9KT2KTUSGDKRSK2.KRKBA3BJTK2Q2MHMUPNL2MQK.KUEBELJ2SNRLFBD2PU2K.2KPK.4K.16|.9KTPN3G3ADFKNK2SLB2A2BJSK2QKPQPRPS2P4K2TEB3NLNURLF2D2FNPJK4.10K6.6|.8KSHD3HG3A3DGLRLGH2A2BNT2K2.K2QJMKUK4.KS2FB4FUJLH2D5BAFT2K.8KT2URE2K.5|.8KRCGHGH2MHA3DG2HPH2FB2FPT2K4MQRQ2KTK.2KT3JB2ABEUJLH2F3D2BAFT2K3.4K3U3RA2TK2.3|.7KJHGH2CDKPGDHBA2GH3LH2BEK4UQ2M2EJM3K.KU2M2S2EB2A2RJ3HF2D2F2D3BS2K.2KEA9EUK.2|.7KC2H3CDKNG2HBA2G4LH2BEK2.KTQ2MQJPM3K2UTULMU2EB2A2KLJ2HF2B2F2ABD2U2TK3BA9FUK2.|.6KRD2G5KPHFH2KBADB2HNHPRKRK2TKQ3P2MQK3UPML2PREB2F2KPJ2H2F5D3B5A2BD6CA3DPUK|.6KPG2CDHNST2SA2FKHA4GMST2K2.KUKQ2LBJMK2QKURNL3RFB2PK2UJ3HF8B4DB2DGF2D3CA3CPTK|.6KPG2DGH2USK2A2DKHA2G3LPK2.2K2UKRMLEJMK2PKUSNJ2HRJBEKP2RJ3HF8DB4D3GF3D2C3A2NTK|.6KPG2D3HUA2PGCGKHCDGH2LMK.2KU3KRM2L2MK.K2USPH2FSRJKP2M2TUNRNL2F5DB5D2G2F2BD2C2A2NUK|.5KUPG2C2GHA4GMPRPHGHKM2LK3TPR2K2PJBJMPK.K3SJH2NS2KQPM2U2KURPRF5D4B4GF3DB2C2A2PUK|.5KURC4GLNA2CGQ3NGHNKQMLP2STM3K2TRBJKR2KRNRUJ4UTKQ2MLU2TURU2HF3LBHF2B5DF4A2C3PUK|.6K2D2CDGHNCACGHMNHGNRUKQ2MPRTKM2K2U2KSK3NJLNUPJ3RTKQPM2SUKUPR2NLFHT3F2BEB4D2F2A3CDNUK|.7KSRCDHNHC3D2G4T2K.KM2R2Q2STP4JKPLHKJEMPURH2FSTKP4UR2NFBT2FJKSU4EB2ABABF2BA2BUK2.|.7KURCDHNLC3D2G3KSK.2KPK2PL2SUKPFJRMLKPK2P2QURF3SUKP2QPUP2JB2SUJFJ2U3TLB2ABABF2BA2BUK.2|.8K2C2GNKC3G2DGK2SK.3KTP3KUTK3HFJPU3P2ML2NRF4TK2JQPK2JB2J3FEK2TK3JAB2ABDBA2RK2.3|.9KC2GN2C3G2CGK2TK.2K2UQPK2UTK3LFJKU2TP2ML3PHF3TK2JPQTK2J2EFJF2K2TK.KEA4BD2B2RK.4|.9KT2KG6DCNSK2.2KU2RL2K2T2QPK2HK.K2TRP2LH2USF3EURMPQRK2TKFEK2P2K2.KRA4BANFPUK.5|.10K3G3D2GDCNTK.3KU2RLMP2T2P2K.K.K2PTRMQLH2USF4USP3RTKSREPK2JNK.2KPA6KHRTK.5|.12KG4DGDGNUK.2KU2Q4KRH2K3.2KP3K2RQ2H3NPHJERSKP4K3PF2K3.2KFA4BR2K4.6|.12KG6DGPUK.2KUTQ4TRF2K2PK2P4K2TQ2H3MSUNESTKP2Q2UK2FD2K.4KFABAB2TK.10|.12KG8NUK.2KT2Q4TRFNSKQPKP4S2TPMLH2MSUPJURKP3QSP2KFK.4K2HCDJBK2.11|.8K.3KG8NTK.2KT2Q4UNBPRQ4PQK2PRUQ3ML2PUTU2ETKPKQ2KPK2.4KTNCADUK.13|.7KRK3TG8NK.3KTK2Q3UNBEQ4PQPK2P2TKPQ2M2PS2USERK3RQ2MK.K.3KSFCBFK.4K.9|.6K2CDTKTG8HK.3KQ2K3QKFBEQ3P2Q2TUP2KUSMKM2HG2L2JERKJEJS2K2HK.KRC3RK.4KHK.8|.5KFH2LK2TG8NK.2K2Q2K2QPLFBFPQ3PQ2TUP3U2MQM2HGHM2SERKE2JTK.2K.3KD2CRK.3KPGFK.7|.5KCDK2.2KG8NK.KUKQ2TQRPFDADLTQ5RKP3RTKML3HGH2LHK2EBEK.7KULCRK.2KD2K2.8|.5KCDTK.2KDG7NK.KUKQ2TQRPFDADLTQ5SKLP3TKQS2MHG2HM2K2PEJSK.7KLCRK2.KGHK.9|.5KC2K2.2KHG6HK.2KUK3QSTPFDA2LSQ4LKRLJP2KQ2STULHG3FTUNE2PK.8K2FCPK.K2.10|.5KC2UTK2URK5HNK.2KUK.KQSUPHDA2NRQ3MLKPLFP2TK3U2MH3G2U2P2BK.10KDCR2K.12|.5KHGHNU2LN2U2TLHLNK2.K.KQ2RUPHDA2FJRQ2MR2QJEP2UK.2KURPH2LHMNSUK.12K2NGK.12|.6KDCDPNG3U2TG3CSTK.KQ2MRUPHDA2D2TRM2TPQE2P2TK3STSRGHPQH3PUK.13KGK.12|.6KHGDGD3GTUTGDGDRTK.KQ2MSURJDA2BFSQM2UQ2JEP2SKQ2KS2PGHNKQ2G2PTK.13K.13|.7K2HD2GCDU3GD2RTFK.KQM2TSUKDA2BDFML2TP2JMPRTKQ3KTRH3KNQHG2UTK2.25|.9K2TKH2U3H2GN2HK.KM2NKSTKFDBD2FLMRKQPLP2STKQMQK3P2HLMQMLG3H2K3.22|.10KTRQMU2SGPKC2RK2MHMK.KTULD4GFT2KMEAK2T2KM3QK2U2H2MQM2HG4PU2K.21|.11K2Q2U2RGRFC2RK2MHLK.KT2HDBD2GFU2KB3EKT2KM3K3U2LHM4HNMH2NUTK4.18|.11K2GDTUPHC2DNK2QMH2K.2K2FB4DFU2FB5TUK2M4K2U3HGHG4H2KNKU2S2K.17|.9K2T2GDT2HGC2PK.2KNH2K.3KEB2ABD2U2FB5TUK2MQMQK2TU2G2HMHF2GD2G4D2TK4.13|.8KUHG2KHM3LR2K.3KGHRK.4KRBABD2U2FDBABEU2K2Q3M2K2T2K2HGH3F2G4BD2G2T3K.12|.6K3UGCGKNQNKFT2RK.2KHKSK.4KUBA2D2T2HD2AEKU2K2Q3M2K.K4H6FHFG2ACD2GUTUK2.11|.5KU2RCD5K2.KSKQ2K2GCNK.5KUFD3FT2RFDFJKT2K.K2Q2MQK.KTK3L3H6G3DC4HTK.10|.4K2TNHC4DGK.KTK2Q3KDCHK.5KTF2DGFT2KJFJ2ET2UK.KQ2MQK.KUK.KL2MH5FG3DCAC2HU2K.9|.3KUG2C3NRNK2.KUK.2KQKHNK2.K.4KTFDFHLMSRF2J3UT2K.KQ3MQK.K.3KMH4FHKP2LG3D4GUK.8|.3KUGC3DRUK.2KTUTK.2K2HNK.KQK.3KTFB2J2LTSF2JMRUT2K.KQ3MQK.4K2LH3F2K2U2RH2G3DC2UK2.7|.2KHGC3DNK2.3KUK2.4KHLK.KQK.3KTDB2F2LRPG2F3UT2K.KQ5K2.2KTKMH2F3HMRUSHMLGD2C2DGTK.6|.KTHC4GUK.3KUK.5K2GNK2Q2K.3KUBA2F2GHF2D2FHUTK.2KQ2MQ3PK.KUKPHF5HMUTPHKGD2A2CHUK.6|.KTNC4GK.3K3.5KPNHPK2Q2K.3KUDA2BEDH2FD3LT2K.3KQ2MQ3K.KUKPHF5HLRSPHKD3A2CDUK.6|.KSHC3UK.3KT2K.5KDGNPK2Q2K.3KUHGA3DHF2D3UK2UK.2KQ2HMQ2K.KTRGSHF5HJK3TD2C5UK.6|KLC5TK.3KUK.6KDGPK.KQMQK.2KULFBA2DFHFD2FUK2UK.KQ3H2Q2K.2KRH2F6J2K.KUD2C5UK.6|KNC2GC2TK.4K.5K.KCGK.2KQ4K.2KUGDA2DFHFD2K2.KU2K2Q4H3K.KQMH2S2NF3LK.KRGDC4G2UK.6|KNC2DCDTK.2K.5K2TKMCGK.2KQ4K.2KSHDA2DHRFD2K.3KTK2Q4M3QK2M3KMHL2HFLK3HC5DTK2.7|KNC2D3TK.KTK.K3QK3MDGPK.KQ4K.KQKR2A2DFSFD2K2.2K2.2KQ4L2KMKLMK2MLM2HGMUPGDC4H2TK.8|KNC2D3UK.KUK2Q4K.KMD2PQK2Q4K3Q2TRA2DFSFHFKQK2Q2K.KPNQ2L2HK2Q2P2SRH2MSNHDC4DGT2K.9|KLC2DC2GFK5T5K2SNLHMNQRUM2Q5S2A2DFSFHKQ2K2QMK3GHQ2MH3LMLD2G2LM2THD2CDKNR2K2.10|KHC6HU2KTU2T2KTU2KT2HLMU3M2Q5RSA2DFSFHKQ4M2Q2MGHQ2MHLGF3DG3LMKUD3G3PU2K.11|KLFDC4HRSK2T2R2K4.K2L2NTUK2PM3Q3SBADNSFHKQ5M4G2Q2ML2FG8HRKFDH2GDGHNK2.10|.KTHC2AC3PT3KC2K.2K.3KSMTK2STL3M3UNFAPSFHKQM2LR2M3G3QMKTUDAHG6HT4K2CDCDR2K.9|.KTHC6HUT2KC2K.KTK.2KSNTK.K3MRKM2TNHANSFHK2ML2R2M3G3TSTS2FDGLFG4HKUT2K.KC4DK2.8|.2KS2GC5DSUPHCDK.K2.3K3.5K2TRKT2GA2SLFKU2MLHPTK2LFDU2TQPNMFK2HGSK2.KU3K2C4DUTK.7|.3KUGDC5PRNHC2K3NK.3K3.6K3TSDA2PLHPU2PMRK2.2KNDS2RMP2LFSULHTK.2KUTRLKDC2DFUTK.7|.4KU2C2AC2DGNC3KRCDTK.KHGHK.6KRNFAD2JPNRTUTSK.5K3PHMTU2RD2NTK.K.KURDC5NUK2.8|.4KTUC6GNDCDR2CDTK.KGDHK.6KRNPD3JPMPK2HNK7FRNHMT3RD2FLK2RKPRNCDC4NTK.9|.5K2TURC5DC2DUGCDK.2K3.7KS2FD4SKPK.K2T2S2RTSGC3GK2G2UTKU3NC4A2C2DHK2.10|.6KT2RC8GUHC2SK2.10KU2FD4SKPK2.2KT2SPRSNC3GS2CLUT3SUHC7GUK.12|.7K2TS3C7NGCDKTK.10KSDGHFDNKNH2K.2K3GDG2C2FG3H2G2D2C8GS2K.13|.9KT2KGD4C2G2ACRSRK2.8KRDFNHF2TNF2K.K2HKC6GD6GC5D2CDN2UTK.13|.10K3U5NC7DUSK.6KTFG2CGFLK4.KTLC4A2C4A3C2AC3GU6K3.14|.12KTU4ND5C2DUTK.6KTH2GAF2HK.5KLD4A2C2D2CDC7HU3TU2K.16|.13K16.8K8.7K27.17",
    },
    zpisces: {
      p: {
        T: "#040009",
        N: "#263e67",
        A: "#9bdae5",
        P: "#202348",
        U: "#010004",
        L: "#345083",
        F: "#4f80b6",
        S: "#07000c",
        H: "#3b6699",
        Q: "#0b0c1a",
        D: "#539fc4",
        C: "#5cbbd4",
        R: "#07020e",
        G: "#4082ae",
        J: "#4d518d",
        E: "#7381b0",
        B: "#88b1d1",
        M: "#3a3871",
      },
      r: ".96|.42K2.52|.41KT2K.51|.39K2NAPUK.50|.20K6.11K2N2LAPUK.50|.19KLPFSPHK.9KTNA4QTK.50|.18KSDCDRNHK.9KTNA4QUK.50|.16K2HNDCDPNHK2.7KHFGA2FDU2K.50|.15KRLA2DFDJQR2SK.5KUGDGA2LKURK.50|.15KRNA2DFDPR4K3.3KUHGHA2HLSK.51|.15KNLKNLKJE2KSLFLJK.3KUFBEQH2UK.51|.14K2N2KNPRJ3HPBDFEK4SUEAMULHTK.51|.13KSGCHRQK2R2KEBEC2DFBEPF2D2NUQPK.52|.13KSLANSTK.K2RE2JND2B2EMC2D2MURK.53|.13KRQCPRTK.2KREJ2NC2B4CD3NUK.54|.14KRPK3.4KRK3HJP2MJGFHQTK.37K.17|.14KRK.8K.3K2TUPMNGHSPK.22K.2K2.7K3PK.16|.15K.12KT2E2JQ2NLSHEK.20KRK2NLK4.2KDFN2K.16|.28KU2EBMTKUNPCAQK.14K5SR2NGCNRT2K2LA2K2.17|.16K3.9KSTE2MKPKCAD2JRK.12KR5S2RNHDPR2SK3CGK.18|.12K4RPLK.7KP3J2K.K2DCFHURK.11K2Q2RU2QP3H2P6K3.19|.11KNL2R2PLNK.6KNA2JK.3KUHLRK2.11KRSC5A5C7PK4.17|.11KNCFR2QK2.6K2LA2EK.4K4.12KRU2C5A3C8AN2PHPK2.15|.10KTDCDK3.7KRNBA2BUK.18K2C4A2C5D2CDCA9PTK.14|.10KUC2DK.9KSTBA2BUK.17KRSA6C5D2CD3A3BAC2APT2K.13|.10KSHNPK.6K3NJEBEBK2.18KU2A3CA2C5DC2D3CA2B3C2NQRK3.11|.9KL2K3.6KQPQJHE2R2K.18KHBDA2C6DG2H2G4DC2NTPC5QR2K.10|.9KGCK.8KMABELE2K2.18KUGA2C8GH4DG3D3LTQD5P4K.9|.9KDAPK.2K.3KRPB3AE2RK.17KTGCA2C2BD2G6DG2HL2H3NURK2F3D2CLK.9|.8KPDANK.KRK.2KRPB3AE2QRK.16K2GCA2C2DGD2G5CDGH2LH3LURKLDF3DCLTK2.K2.4|.8KC3QK.KRK.2KRNB2EMEA2PK.15KSDA2C5BABD2HLHG5HNK2NH2RQPF2DC3ALSKGDK.3|.8KCDGR2K.K.4KLCFEJEA2PK.15KUCA2C5BABD2H2G7NK2LGJR2PF2C5PT2L2K.3|.7KUHSUN2K.6KD2FE5Q2K.14KUDA2C2D2CDJGD2H2L7KR2URQRSULMHF2DCPTRK2.4|.7KUHLNHLK.5K2EBEBEJMK3.5K10RUDCD2CD2LNLGD2G2HNKP2KR4K2RTUQLMJ2F2CPQK2.5|.8KHA2K2.5KQRPBEBNPTRK.5KT2P3LFHLUTUG2DC2GJU2D2G2D4SR2S2R2K.2K4U2LMHFLFBPRK.4|.8KFA2K.4K.KSQMEB2LPK2.5K2U2FDC2DFHURTGD2CAGHNUGDG2DC2DKU4K2.6KTUL2F2HF2PRK.4|.9KCDK.3KRKSE3JEBAQK.5KRUD6F4K3UGD4GNRKRKD3C2DNU2SK.7K2UTJ3D2GCGK.3|.10KJEK.2KQKUE3JHA2PK.5KSQFD2BF6PNT2D3G2HNSQCGD4CDLU2SK.8KTUL2MFDCACK.3|.9KSJEK2.2KRKEB2EFBAPK.4KPD2CACD4BDGHLU2QP2G3HUQCBD2GD4GUSK.9KRUPMJ2CAGUK.2|.9KRJN3K3E3JMEBLPK.5KPB2FDF3D5F2TR4KNK2LG2DGD4G2LRUK.10K4J2DCPUK.2|.10K2NP2R2ME3KPJ2NKRK.3KRQB2FHG3F2DBABDQR4KNK2LHGDGD2G6UK2.12KJ2DCPUK.2|.12KP2SE4PRQPKMNRK.2K2PLBDFJ2HGF2D2FEDL2KML2HPKL2GFHG8PKTK.11KMJFDHLK.2|.12KPKTE2K2RU2KJEMRK.KRTNBHGCEMH2LJC2DF2LPSG2L2HQU2GH4D3G3FS2K.10KR2J2LC2RK.|.13KREJPK.KTUPJEJRK.2KRNCGFBMEH2JMJCDF2LSUF2L2HP3H5D3G3DPRK.10KRSLJMC2SK.|.13KPEK2.2KQP2ME2K.4KNCFNJM2HJLQPGFHPHGQRQU2QL4H4G3D2G2NQK.11KUM3DCUK.|.14K2.4KQP2NJETK.3KNCDKEAEJ2MABD2FULNU6L5H3G3DCDHR2K.11KTM3HCURK|.20KQP2MLETK.2KTGDHKJE2J2LE3FGPHLQU5L5H3G3D3GSRK.12KM3LHTRK|.19KRP2NMLHQK.KHDGN2TML3JLM2LD2LPNLHLT2KR5H2LN2HGD2GRKRK.11KSQM3RK.|.19KRPMJML2MK.KNCNPNUNL2J2M3JD2LN2HG2LHR6H2LKNHG2DHK3.12KRPM3K2.|.19KRMJM2LJEK.KHGP2NUPNMJ2M3JD2QNLGFG3PT2R3HL2HLH4LKNK.13KPM2JG2K|.20KPJM2EA2RK.K2LRSTUEJM3EJQD2QK2L2HG3LKN3STHG2DPTS2PNK.13KPM2FCDK|.20KPJNMJB2QK2.KNRSTSUJE3PTQD2NR2LH5P2KR3THG2QRTS2R3K.11KRPM2DCDK|.20KQM4B2JNRK.K4RUQM2NQSQFG2R2QP4NUTS2RKNG3HLP2QTSK.12KSUMLFCDK|.21KNJ2MJEBJTK.5KU2TS2KRQGHGQ2R2TU2TU3NMK2HG3NPHNU2K.12KTUMLHCGK|.21KPM3JEBJUK.3K.KSR2QRK2QFHFR2SU8NMR2NG3LPLQU2K.13KUL2HDGK|.20KSM2NMRPBEJK.2KSKTMJEBEMK2JMQR2KLFDB2N2HCBFJMDB2GQUQK2.15KL2NUTK|.14K2.4KTMPK2SPEPBRK2RQKSJE4LK2EJRSTDCBA3PKNC2DPKDGBNU2K.17KJLPTRK|.13KPLK2.2KUPK.KQEJ2EH2K4NKLB2EHMPJK2SNECBA3BAJDFD3GLQ2U2K.17KJLMTK.|.12K2PADRK.KUSPK2QELF2E2KN3LKLA2JGHNKR2QB4A5ERQD2A2EUSLGUK.15KNH3UK.|.11KSUPADRK.KUSP2KQH3E2BMNL3KLBAJ2KN2PRSB3A6BTQGDA2PSRUPUK.14KRNLH2UK.|.11KG3NK2.3KSPMKEH3FLJQJB2EKLEALKEBH2LKEB2ABA2E2PSUHGDBD2PKLPK.14KSPH3UK.|.10KTC2GUK.4KSPMPRKN5RBABEPKJEKNJA2FLNKDB2A3JSU3NG2FBALPNK.14KRTPH3TK.|.8K2N2D3TK.4KRM2QK.K2PK2PHBE2DJK3HFABFLNPJEFA3FQU3NHG2F2LK2.15KRSQH3SK.|.7KTKCARK3.4KT2M2RK2QS2RSL3JLM5J2EMLN3SMJEA4LRNQK6.18KRQHJLSK.|.7KTKCAK.7KTQM2SK.KS2RUL4M5J3L3N3UJ3EA3DSLQK.2K2.3K.16KPH2LK.2|.7KDHCARK.6KTQM2UK2RK2RTLN2KN3P2ML3N4KSJM2EDC2DGHNQK2R2K.KRK.14KRPFH2K.2|.6KDC4TRK.5KTPM2UK.K.KSRUMLK4LKNKLMP2K3S2RHB3ACQKEJ2SR2K.2K.14KT2QF3K.2|.5KSHDCABUSK.5KSPM2UK.3KRKTQKMLH2L3NK6RKUTQMBA2BSK2J2QTRK.K.14KNTR2F3K.2|.5KSNGDC2LHK2.5K2M2K.5K.K3LH2B2L2N2PKR2PGC3PKBAFLRQJA3USK2PK.14K2SKFHK.3|.5KRPFDC2H2TSK.4KSPMJK.7KTH3BAHLN2PKUGC5PRFCGTSUPA2BU2TKNK.14KPN2S2K.3|.5KRPFDC2HJUSK.4KSPM2K.7KUJH2D2HLNP2KTGC5QUD2CUTUPA2BQALK3.K.13KPNS2K.3|.4KND2F2D2F3SK2.3KRPMPK.7KULM2G2H2N3PUGDC4DHDEPR2SA2E2LFEF2PKRK.11KJFHSRK.3|.3KRNC2FJDF4UTRK.2KRNMU2K.6KUN3G2LM2NMNUGD2C4GJAEJMQA2BTRUB2EQR2K.10KUHF2TRK.3|.3KRNC2FHF2D2GQ2K4.KPMQTK.K5Q2N3H2L2MN2KULHD2C3GEA7BKTUB3PQ2K3.8KUHFHTK.4|.3KTPC3GLGA2CDLST2RK2TPMTRKSTPLTNH2C2NPGFHSRTRQLKDC5B4A3BEHUB3EH2PTUK2.7KH2K2.5|.3KTPC3FLFA2C2PTR2K2STRN2LTU2QNULNPDCHPF2LT2NE2HQGC4FCB5AENKUBA2EH2P2DQSK.6KHGK.6|.3KSPC3DFCBAC2LNH2LKRQPHGHGFPTKNG2KFDJ2LHLKULEH2MLGDC2DBC3B3K2RFDC2A3DC2QRK.6KLHK.6|.4KL2FC2BAD5FD2GKRE2B2DFBFKPCG2PLJ3K4HBQTJ2QPD2C8FK2NDC3A3CGDTRK2.4KNSTK.6|.4KLHFBCB2D3HNHD2GK2E2D3HBJHKHA2PJ2EAEJK2LNQPJ2RPD3CBABD3BNK3GC3BABKLTRKRK.3KNUTK.6|.5KTQPFBC3DN2FC3DPMB2C2FH2NQ2PNJE2BE3PSPJ2E2JMP2G4EDA2H2PKHFC4D2FDHRK3.3KLPTK.7|.5KR2UFABC3MJBC2B2PMBCB2FH2KRQBELJBA2E2PQPEJE2J2PUG3HKBA2DGR2LC3D2F4HS2RK.2KNLPSK.K2.4|.5KRSUEA2C3MFABDB2PKDB3NPTKRPABJKEABE2PKNEJE2J2PUD2GLKMLH2GTRQFGHFDF2HN2QPRK4NLPK.KNLK.3|.6K3NP2D3CDBAB3FLD2H2PRTNJBE3KNB4JPQRJEB3E2PNGQRPBADGPRK2L2HFHLHF2AFUSN3K4.2KLNK.2|.9KR2GF2C2B6LGHK2QRSLJAEBEK2DB2EMPQTJMEBE3PSLR2MUMF2HNK2NL2FHNHF2C2UTN3K.KPK3LNK.2|.9KRTG2HCD4BEJK3PKQTSL2E3JKNFEBLNK2TU2LJE3MTSPE2T2FLFGH2KNLGF3H2CDQUK3.2KLHQK3.3|.10K2U4GF4K2J2MK2U3NL2HLMKNLH2LMK2U3NM2E2PU2BA2URK2GD3HMHKHDFKFC2PTK.4KHGRQK.4|.10KRU3TF2DF2K2J2MK2U3N2LHLNSKLJ2LR2KU3NM2NKRSUBA2URKRHD3HNLKLDFKHC2PTK2.4K2GDGK.3|.11K3RSP5KRP3K.K4N3KPKMKLMN2PKT2UP2KP2MRSBA2PKRSLGD3HLKHD2EFHFDEURK.4KHCLK.3|.14K2STSR5S2RK.3KRSKP3N2K3P5RSPKPNHLKJA2EKTUK2GD2GHKHDBABMLC2USK.5K3.4|.15KTUT2R7K3.2KRPN2PK3.2K3N3TPKP2H2P2A2EKUTQKGD2GLKHDCABMLC2USK.8K.3|.16K7R2JMNP2K2R2K2PK2P2K.3KG2LNK2P2N3KEAMQK4GD3GHCACABMLABUSK.7KHK.2|.20KR2UEJHJMP2UTRK3.KP3K.2KGDLNSRK4NKJEPRK.2KD4FHCAC2BM2ABTRK.5K2RLK.2|.8K.11KRQJEJH2M2NKR4K.2K5.KL2NK2STSN3K2MQK.3KD4FGCACACH2CBSRK.4KNH2K.3|.2K2.3KRK.10KSQH2GH2JLNK3U2K.3KP3K5RKSU2KNK.2K2.3K2D3FGC3A2C2D2CTRK.3KGC2GK.3|.KR2K.KTUK.5K2.3KRPH2GL2MN2PK2U2K.2KP2NPN2K3SKRTUK2.6K2RSD3F2C3A2CD3CURK.2KQLCLK.4|.KRQPK2GDK.3K2U2K3TLHF2HL2N3PU2KTUK.2KN2LN2UTK2.K3.7KSTNLD4CA2BDF2C2HPK2.K2DCNK2.5|KT2HARSGCK.2KSNADU2TULHD2HM2N2PRT2KU2RK2PNMLN2TURK.10KSP3LD3C2A3DEC3LSK.KNG3K.7|.KSGCNSKHK5GACDPQTNHD2HN2P2QS2K2SURK2P2NMNMQURK.7K3TUH2GFD3CBA3BED3HK.2KLGHK.8|.2KQDCGK3RSR2PA2CLNUSMHJL2NRU2SK.2K2RSK3N3FGHUSK.5KUTUH2G2FD3BAB4EF2U2K.4KHK.9|.3KDCHK2RT2UTPA2CN2UTMJ3LKPU2TRK.2KRTK.KN3BFHUSK.5KRSUH2G2FD3BAEFDBF2HUTK.5K.10|.3KD2QSPQU2GCDC3G3KPJ3MPKU3K.3KRTK.KNLA2GHQSRK.5KRPG4FD4EHF4HKUTK.16|.4K2RQCPU2CA2HGCA2DTSMJM2PU3TK.3KRSK3MLB2GHLU2K.4KRPHD2FGD2A2EH2DF2NTRK2.17|.6KQDPTUCBAHFCABDQ2SRK3U3QK.K2.KSRTKL2HEGHLU2K.3KH2F2D2FBD2BAF3EFHMRK.19|.7K3SRS2USUBA2BDHUTSTUGHLHMKMPK2RSNKMJMPGH3TK.2KUF2D5JF5DBURSK2.14K.5|.9KSRKRKSUBA2BFGUSRS2HGLHLKM2K2RTSKMJ2PGH3K.K2P2F2D4FNF6DUR2K.14KRK.4|.9KSRK3TPBABD2FSRKRK2NPK2MJLNKRU2K2MJPJNL2K2SUGF5D2LQHF4EFUR2K.8K.2K.KQDCK.3|.10K2.2KSU2QKP3KRK2.2K3UM4R2SU2K2MEKP3RKFHG3F4ENUT2U2K2QSK2.8KRK2TK2QC2K.3|.14KTU2SLPUTK2.6KPM4RKRUTK2MEKP3ULFGHGFH2FE2PUT2UTK.K2.8K2U3KS4QRK.3|.15K5TUSK2.7K2P2RKR2UT3K2.K4PFGHGFE2JP2QUQRK2.11KSGDGKRK2RNDQK.3|.20KRKRQK.7KLR2K5RTK.5KPG2FD2A2ETUGCDRK.12KUCA2NRKRSC2PTK.2|.21K2SRK.7KHTQP3K2RTK.5KPG2DCDB2ETUDCDRK2.11KUCA2NSQD2C2QUK.2|.7K2.14K2.9KRKN5SRK.4KNPFDC3HEL2GC3GH2K2.3K.K5QGC2FDFC2DGUK.3|.6KSTK.22K3NKTNM3SRK.3KPNPFDC2DNPLC4DHF2NRK3NKRQR3C2D2C4DUK2.4|.4K3STK3.3K.13K.KN5KNML2PRK2.3KNPF2GHLM2LD2C2GLH2PUN4QUQPQNC2D2CDC2DUK.5|.3KS3K2TU2K.KPK4.8KUKN3L2PTRLH3SQLK.KNLRLH4LJH3DCDKT2U2QK2RDC4AD3F2D2TK2.6|.3KSRSK2U3K.KNPS2RK3.4KU2QN2L2NUS2H4SPLK.KLJTLH4JH3GDCDKR2U2QPKRFC3A2D3F2D2SK.7|.3KS2LCDHP2K.KPKGC2FGHK.3KTUSQP2LHNHPH4TQMK.KFHNL2H4F2G2DC2L2NP2LH2GDC5D2GH2FK2.8|.3KR2NAC2BFSK2USCA2DFHK.K3U2TU2RGF4G2H2PUM2KSF3GUHF5H2DC2DH2FDC4D2C6U3TSK.8|.4K2LC4FK.KUSDCADG2NKNP2Q5PF3G4H2PTM2R2F4UH2GF3GHF2D2FHFD2C2DF3D4CU3SK.9|.6K2UCBCPK.K2TSRDC2A7F9GHDBPTM2PSF4TR2TQF2D2HMJBDCA3DC2PT2R3STUTSK.10|.6KRUC3PRK2R2K2DC2A2CA4F10HD2PUM3SJN3T3U2FD3HPMJLBA3C3NR5S2K3.11|.7K3C2NP2K5GHFC3ABD2F5D7FPUKPKRN2KSRK4FHFDFGHLJHEBG3FLQS3RK2.14|.8KU3FCGRK2R2STNC3A2DF2B3ABA2C3FLTUTPQSN2PT2K.2KRTFDF2HLH2QU2TU2D2GTSK.16|.9K2UFCDK.KR2STNC3A2DF2EA3CA2DC2FHS2TPR2NMNU2K.3KUFDF2HJH2PUSQRUCDCNK2.16|.11KPQ2K.2K3RQLK2LPL3DB2C2DFHQP2QK4PKLJM3K2.3K2Q5FALR2K8LK.15|.12K2RK.4KR2K.2K2N3DC2D3FLUR3K.KPK2LJLM2TSK.2KRSTUSTGACQRK.6KNLK.14|.14K.6K2.5K3PL3H3MK4.KRSRKQMP3K2.4K7HLK2.8K2.15|.31K8.6K3.K5.13K2.27",
    },
    zophi: {
      p: {
        S: "#05050f",
        H: "#2e1e4b",
        U: "#010107",
        N: "#090814",
        G: "#401e66",
        F: "#5a1d85",
        M: "#0f091c",
        Q: "#050516",
        T: "#04040b",
        D: "#3c3055",
        B: "#9d5969",
        R: "#060511",
        C: "#7f3786",
        E: "#8020ab",
        P: "#090514",
        A: "#e39b58",
        L: "#2e0c54",
        J: "#510d85",
      },
      r: ".18K.2K.54K3.17|.17KSK2HK2.6K.4K.5K2.5K.13K.12KSUNK.16|.17KSG2FMSK.2K.KGK.2KQK.3KTUK.3KTK.3K.7KUK.7K5F2HK.16|.17KSKG2DHK3NK3.3KBDK.2KRTK.3KTK.2KNK2.3K2CEK.5K2QMPGFG2MK.16|.17KNK2GD2HDMUT2K.2KMA2UK.KSK.3KGCK2.2K2UK.KB2E2K.4KSQDG3DK2NK.16|.17KNK2GD3HDCSTK.2KMA2Q2K2UK.2KNHFKUK.K2PK2UBAFGK.4KNDG2D2K3PK.16|.18KSTDK2D2GEUTK.K3H2BCQDAHK.KPABUTK2BAPNMABCGKFK.3KTB2CGDKTSK.17|.19KNTK.K2DFUSK2FE2UMABQMA2SK2QA2UNK2BAN2MABKRLELK.2KSGD4KUNK.17|.20KUK.2KDKPSK2E2JUTABD2A2QK2MA2URK2BAPDBABQHLEK.2KS2HD2HK4.18|.20KUK.2KD2KRK3SJ2U2CABA2QKHJA2DTUKA2KBACMQE2K2.KQK2D2K2S2K.19|.20KTK.2KD2KR2U2LELU2HABA2K3LA2DTUKBALB2CQSE2MNKQPK2DHK2UTK.19|.21K2.3K2.K5EK2UMA4BDBDBABDBKA2BAHLG2K4TK2.2K2.KT2K.19|.21KPK.6KDK.K.2K2A8FGBA7MK3.4K.6K3NK2.18|.19K3SK3.5K.6KB7DG2CB3A2BAK.13KUSK2R2K.17|.18KNSNKU3K2.10KLK2SK2G2DKDF2GK4.12K2U2N2R4K.16|.19KPNKUFEMTK2.8KLKUTG2DGD3F3K2DK.11KTME2NRT4K.16|.19KN2KUE2U2MGK.7KHK4GDGFC2FGHKD2K.10KMTME2NRT4K.16|.16K4PNKSE2L2FGK4.4KTUK4DGF2CH2KHKTK2.6K3CEL2EKNS2R2TK2.15|.15KS3KD4Q2E2GPTU2SK.4KUKMN2KG3MUT2HTUGHK.4KTSNRE3PMD6HRK.14|.15KS3DH3DQSE2LPU2NKNK.3KTH2A2KMQTMB2K2U2G2K.3K2Q3RE3SMD6HS2K.13|.14K3M2DH2K2MG3QK4.K6SDKA3KH2CABK2TULDK4N2K4GMQMHD2H2DH2T2K.13|.13KSND5HK.K2QN2K.4KU2TS3KPB3DFGCB2DK2U2HKN2KNK.4KNPH9MSK.13|.13KQNKD4HK.2KPNRK4.KUT5K5DCGFHK2.KUSQ2N2KPK6PK3DH2K3HDSK.13|.12KSK2.KD3KHK.KP2RSTURK5TUTK.2KDGCF2DK.2KSQKLH4KST3SUK.KH5K2E2K.K.11|.11K2HF2K2D2HKHK3Q2ST3K2H2KTRTK.K3DFBGDK3.KS2HL3H3S2TU3K.KH4K3E2K2TK.10|.10KUTE3UK2H2K3H2KSTU2TNK2G2MRK.KU2K2DBDHKTUK.KSHLKHKQK3NSK2.2KH4KFEJE2RTK2.9|.9KTMJE2JHK2HDHK.KHK6UNKHGDNK.KUSK2D3GKTUK.KSGHK2TSK2.K2.4KHD3KFEK2E3SRK.8|.8KNTLE2KJ3KH2K.KD2K.K2.KSRSH3SPK2PQDFCBCFKS2K2T2HGK2UTN2K.K2.2KH2D2K2JEK2EJ2T2K.8|.8KNTUFLGJE2K3.KHFGK2RNK2NTUK2HMRKMPQKC2E3SQ3KU2HK.KUT2RK2T2K2H2D2K3EJK2FJLT2K.8|.8K2TPK2GJF2GK.2KHG2K.K2DCNRSK2DHQKMP2MFE4SK2QKU2RK3UTK6.KHD2K2F2GLF2JLK5.7|.7KSLGKQNKJHLEK.K.KD2K.2KB2K2NK2D2SNQPK2GCE3RK2PNTSK2U2KH4DH2K2HDK3F2SULJLUSK2SNK.6|.7KSE2JFKS2QGJK2NK.K2.4KDK2RK2D2TP2SK.KC2ECNK.KSTSK2U2K2H2D3HK.K3H2TRTULJLUTLGMT2K.5|.6KFE2JL2K2NKJFGK2PK.6KDK.KRK4P2K.KA2DE2FGK2PSK2TSTK.KHDG2DHKQMG3URPKQUTUSKLFE2NK.4|.6KE2FKUSLK2.KFJLKT2K.K3.K2.2KUSK.2K2.KQA2BC2FGKTK2.KS2K.2K2G4DKQ2PGLFM2KU2TKQKNE3TNK.3|.6KF2SK4PK2RTLGKSK.KD3KPNK.KUSNK2MK2MA4MFGLRK.K2QNHK.KHKDGFGDHK4FJLPQUTK.K.K2EK3.4|.5KS2K2.2KT2KPSUMGT2K.KDCDKN2K2.K2PKHMK2BA4H2SPTK2HKNMD2K.KD5K2.2KFCLKPT3K.5K.7|.6K2.5KP2NTUS2NK.2KD3K2PNHKHKTK3SDA5BCQ2SK.K.K2DHK.KD2H2K.5KFKP2SPRK.13|.14K2U3TK2.4K4HDK2H2K2.KHB2A2B2A2BA2DK.3K.K2NK2D2K2.6K2USQPK2.14|.16KU2PK.7K2D2HK2DK.K2HA4E2BA2BADK.2KMK.KPSKHDK.2K5TS2QPNK.15|.16KUK2.7KNKD2BK.K.KSRMA2B2E2BA2L2K.2KBAK.2K2.K2.2KS3NPRNGF2RK.15|.15K2MK2.2K.5K2DHB2K2.2KUNDBA3BAB2G2K2.2KBK4DKHK.2KN4K3GJFMK2.14|.14KTMF2GK2NK3.2KUS2A2D2K.KU2NMA5B2QPTRK.2KSTUB2ABK.3K4.2KJ2FCUTK.13|.14KS2GK3.K2NTK2NURTD4K.KUSQMA5D2QNTUK.2KPMHD3K.10KJF3M2K2.12|.14KSTK.KHK3NSK2NKNMK3STK2SQ2MS2A2MT2RNRTK.KSKH2KDHK2.K2.7K2G4QSK2.10|.13K2D2K2D5K2.2KUA2K2.K2PNK4PQA2MTK4PK.KABK6DKD2K.8KTK2GEFNK.9|.12KNKD2H2D2KD2K4NMA2KDK.KRK3.2KPBANK.K3NK3ABK2QSK2D4K.8KTK2GF2SK.9|.10K.K2H3DBDK.K3DABA2H2B2K.2K2PQK.2K2P2K2G2KQKMK3B4K4D2K.9KNRSMK2.10|.7K3RKNK4D2K3.2KDB4M2BK.3K2T2K.K2.K2JG2LQ2K2.2KDB3KQB2D2K.2K.3K3N2KPK2.3K3.5|.6KNSKNSRNK.KDHQN2K2.KBDRN2K2.3KHMTK.KF2K3E2K2STK.2KNQDA2Q2ABD2K3RK.KD3K4Q2K.KPRSK.4|.5KP2NQGD2K.3K6BK2N2T2R2K2.3KMPK.KE2C2E3K2SUHK.2K3H2U2M2UKH2KD2KD2BABD2HK2QK.KPSK.4|.5KQNP2GDH2K3.3K2B2KN2RT4H2K.KHMNK.KE2B2E2FK2SUDHK.4KNU2TRU2H3D6A2D2H2KSNK5.4|.4KQMHFG2K2D2H2K.KPBDMPNT4K2DK.3K3.2KJ2BACK2.KSUKHK.4KNT4NR2T3KSK7D2GF2SU2R2K.3|.3KSTMHG2K.KD2H3K2SU3K2UT3K2D2K.3K3.KJ2FCGK.KN2SKHGK.4KRSTRK3RUTN3T2K4DH2GFQTK3.4|.4K9MHD2N2K4TPRUT3K.KHDK.KRS2K.K2GFK.3K2QKHG2K2.2KRT2RK.2KST2SR2NRSUTU2TMHDK.7|.5KSQKRST4D2RN2K.2K2NT2R2K2DG2K2T2UTK.2KF2LK.3KPKHGFKHK.KT3RK.3K2TK3NRSUT2UTRPDK2.6|.5KTNKTS2T2PTRTSK.5KNR3K2GD2K2U4K.K2F2LK2.K2PKHG2K2.2KT4K.5K.3KRSTSRTR2NDRNK.5|.6KRURNPRK2U2N2K.K.4K2N2K.K3GKU2T2K2LG2JL3KPSTK3DK.3KRT3K.9KTU2PHMK3QSNK.5|.6KSUSNK2LGU2SK.KNK6N2K2.2KFGUT2RK2GJG3LGTSTUK.2K.4KPRT2NK.8KU3KHCDK2STNK.5|.7K3NK2GKU2K.3K2N3PQP2KQK2.KLS2N2K2G5K2U4K.K3.2K2R5K.7K3NPKDFBK.K3.6|.9KNKMK2USK2.3KN2PST3KEM2K2GKN2RK2GLCBGK2U4K2E3K2NMRT3SRK.5KH2K2NPHUBDK.9|.8KL2K2PNK3DK.2KN2RTUL2E2GK3GLKNK4LCBGPQU4K2FE2FKLGLUT3RK.3K5.KN2SMKM2K.8|.7KUJ2QK3.2KHK.3KTU3J2EAF2GK6N2LG2JFMQL3TU2K2E2FG2LU2T2RK.2KD3K.3K3HKTRPK.7|.7KTL3K.5K.4KSU3LJE3BDK2PRK2MRKGL2GKH2GLQSTKHFEFG2DM2RSRK4D3K.5KDFHKPK2.6|.8KTNEFK.10KNTRMLE2B3K2TU3HK.KL2K2GQNQ2F3BCFBHKB2MNKPS2R2NK2.7KE2LRUTK.5|.8KRHEFK.11KP2MLEC2G2KNU4K8HQNQSF4C2BGLCGNMKPSTRK2.9KE2FTURK.5|.9K3HNK.10KMJF2BAG3K2U3KU2MDA2GKSK2QSM2LJCA2JFJFKNPST2K.10K3EJRK2.6|.9KFKPNK.10KLJE2CAGL2K2U2TKSTSGA2GTSK.KUQPLFCABEFJGMNST2UK.9KSPK2FGMK.6|.9KCDNK.10KNMJFCEFJ2LK2UTSK4GB2LUTK.KUS2LF2ABEFJGKRSRT2K.9KSTQKFJMK.6|.10KN2K.9KNUMJFBEFE2LT3SRK.2KGL3S2K.KUTSLF2A2EF2G2TSNRT2K.8KSTQLK3.7|.10KNRK.9KRUMJCBCE3LN2RN2K.2KGL2K2NK3SP2LF2BACFJGLKPNPT2K.8KRTKGK3.7|.9KTNSK.8KNU2J2EB2EJ2MRK3QK.2KL3K.KQN2KPRHGFEFBCJFL2PN3TUK.8K3JE2LK.6|.9KTSTK.8K2UPJ2EACFJ2MTKTNSK.3KL2K.KSN3PSL2FE2CEF2GLPN3T2K.8KQ2F2K2.7|.10KSTK.7KRQSHEFECACL2SURK2UK.2KB2L2K2USK2STKLJFEABEJGLK2ST3K.8KQ2SK.9|.9KQ2SK.4K.KNRSPLE4ACLKSUTK2UK.2KA2G2K2UTK2U2KLJE2ABEJL2K2T4K.8KS2NK.9|.9KQ2SK.2K2MK2STSGFE4BELKT2RK2UK.KLCBG2K2U2K2U2KLJE2ABEJL2K2T4K.3K3.2KS2K.K.8|.8KSQSABK2DA2MKNRULFJC3FES2TNK.KUK.KLB2FGK2USK.KNPMLE2C2E2JGK2R2PK.3KBA2K.KSK.KNK.7|.8KUSQADK2DA2DK3ULJLC5UPRK.2KUK2LGB2FGK2S2K.KNPK2E6JL3PRNK6B2K3AK.2K.8|.9KSQBA2KGA3BAUKJF2CB2CGP3K.2KUK2G2CBF2K2TUK.KNSPME6JL3Q2RNA4BLGB4CK.K.8|.9KSK2ABG2FBA3UJ3F2B2FLP2NK.2KUK2G3BF2K2U2K.KNS2ME3CJEJL3QRTNA5LGABC2FK2NK.7|.9KQPKB5A4UJ2F3B2FKP2NK.2KSKLGJCBF2K2U2K.2KP2ME2BAFJ2L3K2TMA4BD2A2BFK.KPK.7|.9KTSMA7BDUJ2CBF2EFUS2QK.2KQKGJ2A2F2K2U2K.3KPME2A2FJ2GK2.KRMA3KA6QK2R2K.7|.9KTUB3A6DUJECBE3FU3TK.2KSKGJ2A2F2LKS2K.3KPME2BAGJ2GK.2KRMA3KBA5SK2RK.8|.9KMPMK6HM2KJECBC3MUNK2.3KPKG2FE2F2K2SUK.3KTME2JC2FJGK.2KTRBDHK2M2QMBADK2.9|.9KSPK.2K4DMRKJ2B2CB2U2K.4K2NKG2FE3FK2SUK.3KUME2J2BDGLK4TSK3.K3NK2BHK.10|.8KRSK.2KDAD2HK2TJFD2GC2U2K.3KQ2K2GFECE2FK2SUK.3KUME2J2CDL5KT2KD2KDBK4UK.11|.8KUTK.KHBAD2K3TJFDGFJ2U2K.K.KS2K2GE2A2E2GKS2K.3KNSU2FEF2GL3K2TND4BABD2MUK.11|.8KT2K.K2DBDHKHK2LG2JFJ2USK2DK2U2K2GE2A2E2GKS2K.3KNSTUF4GL3K2PQD4BABD2HUSK.10|.8KUK.KBDAD2K2TK2GJ2E2LMNK.KDK2U2K2JE2A2E2LKS2K.4K2TUE2FGFGL2K.KD2RKDBABD3SUK.10|.8KUK.KD2BD2QKRK2GJ2E2LUPK2D3KUTK2FE2ABE2LKSUK.5KT2E2FGFGL2K2D3UTKBABD2KTUK.10|.8KTK2B2D4UT2K2LG2FEGUSK2D3KSUK2C3A2EFK2U2K.5KQSE2GDFGLK.2KHDT2KDACD2BMTK.10|.8KRK2ABD3HU3RK2LG2E2UTK2HDK2QSK2CB2A2FJK2U2K.5KQRE2K2HLK.2KU2K2TRDBCDBAMSK.10|.8KNK2B3D2KST2K.KLGE3TPK.K2.KS2K2CBCA2EFLKU2K.5KQRE2GDK2.3KU2K2SNDBD3BMNK.10|.9K.2KA2D2SK2PK.KLGE2P2NK.3KNSUK2GE2A2EFLKU2K.6K2Q2ECK.4KTNSTRNDADHCBUSK.10|.12KA2D2K.KMK.KL2E2PQMK.4K2SK2JE2A2EFLKU2K.4K4SUE2K.5KPT2N2DADLCBURK.10|.12KFBD2K.2K.2KJF2MPK2.7K.KFE2ABEFK2U2K2.2KFG2LU2E2GK.5K2TSKG3CHDK2.11|.11KHFB2DK.4KLE2GTRK.7K2.KFE2B2EFLKS2RNK.KEFJLU2E2K.7KU2NG3BSK.13|.12K2BHK.K.4K2E2UTK.6KT2K2FE2ABEFLKPSRNK3JK3U2E2K.8KQDGBHMK.14|.13KBHPKUK.3K2E2URK.2K2.2KT2K2E3ABJ2L2PRSRNQ2K2.KU2E2HK.7KMB3MTK.14|.12K.KHK2SK.2KFE2GUK.K2DGK.KS2K2E2BABFJL2PST2RSK2CK.KUFEF2K.6KPHMK2TK.14|.11KRK.K.KQK.2KFE2UTHKHDGFK.KSQK2FEA3CJL2PRT2R2KGEGK2U2E3K.6KU3K2TK.14|.11K2.4KQK.2KFE2U2HKD2GJK.KQ2K2FEA3CJLKPST2RSKGEGK2U2E3K.7KTK.KTK.14|.10KHJK.2K.K.2KE2LMT2K2DCG2K.KTK.KFCA3BCLKT2U2K2.K3.KR2MLE2K.7K.3KTK.13|.9KSE2K.KNK.3KE2KPRNPKDBG2K.KU2K2FCB4CK2U4K.2K2.2KNQMLE2K.12KTK.12|.8K2GF2K.2K.3KE3KN2PDG2DKGK.KU2K2C2A2BEFK2U4RK2JFK.2KQ2ME2FK.10K2GK2.11|.7KNSECDK.5KJE2FN3PG3HK2.2KU2KGC2A2BEFLKU4SK2E2GK.KSTULEFSK.8KNKES2K.10|.6K2HLCD2K.4KFJLK2N3PG2FGD2K.KUK2LC2A2BEFLKT4SK.KFH2K2TU2MGJLK.9K2FLGK2.9|.5KTMJ2GHK.5KFELNMN3QKGEFG2K.2K2LGE2A2BEFLKT2RP3K.KH2K2U5LEK.11KJEQNK.8|.5KSCJ2HK.6KE2LN3PRPK2FG3K.KQHLGE2A2BEFLKFGN2P2K.2K2.KTU2TSLEJK.10KGFG2K2.7|.4KMCEF2K.6KFELN3KNS2K2L2GHK2NQKLGFEA2E2FK2GFPNRSK.3K.KT3SPQREFK.8KDGJEFT2K.6|.4KUE2F2GK.4K2E2LN3K2PTQKLG2K2NSTSKGCEA2E2JK2FJN2PTK2.KHK2STS2PRLE2K.8KB2F3RTK.6|.3KHGECFGDK.3KF2LMK4.2KPRSKGK.KTHLK.KGJA2FJHK2E2PN2RN2K2HK2RS3T2MGJK.5K2.KBABFELHK2.5|.2KUGE2CD2BDK.2KFEUTK.6KSUKGK.KTGFGKL2GBCFT2K2E2TMKN2SNK3PS3R2TU2FEK.3KBGK.KBACEJ2LRK.4|.2KUGE2FG2BCK.2KFEUTK4.2K2PSKGK.KRGEGKLG2BCJMTK2E2SK.KN2K.KP2SPR2NRTUFEK.3KBDK3BABEJ2LTK.4|.3K2ML2MJFECK2FJLUTN2P2K2NMKRK2.KRUE2GTLJ4FGK2HE2GNK2Q2K.2K2TNK2QN2RQUK.3KB2DCL2FG2L2MU2K.3|.4KUKSUFJECKGEFTN2R2KNKNRN2TK.2KTUE2GNLJ2FJ3KNME2FNK2TSK.3KTK.2K2P2S2K5BAB2HP2K2U2K3.4|.5K5LHFCFEFK5.KP2K3TK.2KRSE2GRMLJFJ2K.KME2GK.2KTK.3KPK3.2K3SKGDB2F2BGMPQK4.7|.5KTULK3FC2FMHK.5K2.2KTPK.2K2E2GTK2GEJLK2PUE2GK.2KSNK.KPN2UTK.3KSF2CABFGQKQS2TSK.8|.6K4S2HE3SK.10KPK.3KE3GTSK2FGK2TM2E2LK.2KQSK.2KS2K2.5KHF2ABLGQ2KQ2RNK.8|.7KURT2UE2FUK.9KST2K.2KE3BHTNLFGKTUJFE2GK.2KNK.3KS2K.6KTJEABLKSTK5.9|.8K2UNTE3UK.9KSTRK.K2B3CLK3JGKQSJECBGK.2KNK.3KRSK.6KUF2ACLKSTK.13|.10KSTJE2UK.9KT2K.KSQA2FEJQNHG2KNKE2A2BK.KN2K.4KPTK.5KUE2J2Q2K2.14|.10KSTGE2UK.8K2QPK.KUSA2FEJQSQK2TNME2A2BK.KNQK.4KQTK.5KUE2G2Q2K.15|.11K3JEUK.7KN2K2.3KQA2MGEJSR2NSTME2CBAQK2SNK.5KSK.5KUE2MHK2.16|.13KUEK.8KSPK.4KNA2QLEJLKTK4E2JFBSK2TNK.5KSK.5KTE2Q2K.17|.14KMK.8KRK.5KSFEJKG2K.K.4KJCECQK.K3.5KSK.6KM2K2.18|.14KSK.9K2.K.K3UFEJK3.8KE2LTK.2KSK.4KSK.6KQK.20|.15K.10KNKMKN3UKEK.11KCEK2.3KQK.5K.8K.21|.27K.K.K4.K.13K2.6K.37",
    },
  };
  const BATTLE_ZOOM = 3, // pembesaran sprite battle: 1 = 96x128, 2 = 192x256, 3 = 288x384. Ubah juga s musuh = 3 * BATTLE_ZOOM
    Z96_W = 96,
    Z96_H = 128;
  Object.keys(Z96).forEach((k) => {
    const d = Z96[k],
      rows = d.r
        .split("|")
        .map((r) => r.replace(/(.)(\d*)/g, (_, c, n) => c.repeat(n ? +n : 1)));
    // bingkai napas: bagian atas turun 1 baris
    const alt = [".".repeat(Z96_W), ...rows.slice(0, 76), ...rows.slice(77)];
    const p = { K: "#0c0610", ...d.p };
    // kunci "B" = sprite battle 96x128 (nat: digambar apa adanya, 1 piksel sprite = 1 piksel layar)
    SP[k + "B"] = { p, m: rows, a: [rows, alt], nat: 1, z: BATTLE_ZOOM };
    SP[k + "BL"] = { p, m: rows, a: [rows, alt], nat: 1, z: BATTLE_ZOOM };
  });
  /* ===================== SPRITE PETA 48x64 (bos di peta, 3x4 petak) =====================
     Versi kecil dari sprite battle di atas, kunci berakhiran "M" (zaries -> zariesM). Format data sama dengan Z96. */
  const Z48 = {
    zaries: {
      p: {
        T: "#070614",
        U: "#03020e",
        S: "#210716",
        Q: "#2b0f1b",
        B: "#996f64",
        A: "#cba285",
        E: "#b2292a",
        C: "#a4513c",
        N: "#3e0e1c",
        J: "#891523",
        R: "#17101c",
        F: "#83292b",
        D: "#664d52",
        G: "#5a2e30",
        L: "#64101f",
        H: "#3c2c38",
        P: "#3f0a1a",
        M: "#4d0e1d",
      },
      r: ".48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.17K2.4K3.4K2.16|.16KTUK.2KSQ2K.2KT2K.15|.14K2BAB2K2TE3TK2BACBK2.13|.13KSCABCA2NE2AEJRA2BFABUK.12|.13KA3C2ADJE2CE2FA2CGBFCK.12|.6K3.3KB2A2KC2NJELEJFEGAGSCA2FK.11|.5KB2AK.KHACAGK2PJ2AGEQCJLTK2BAECQK.10|.3K3BA2K3HA2BTK2LEJEMEMCLELK2QACAHK.10|.2KDBDGLMDHR2DA2K3JLJPECEJEJLK2HA3HK.10|.KA4CE2FH3DA2BTJLP2MJF2L3JNC2A2DK.11|KRA5GNBHDHRCBGU2ML2PE3SMJSURFA2K.12|KRA4BL2BDHKUKQRKCQL2SMQMSHMHRKRQK.13|KRAB4FLBHK2U2K3CGDGSPSTRD2HK.K2UK.12|KTD3BCLMCHK2U2KHKGDBDGFLTHBDK3DK3.12|KTD2HD2FGCK.KUHDK2GDABAB4ATKD4KUK.11|KUDHD2C3EK.2KRK2FDA2BA2BA2BRFGK5.12|KUDHD2FC2GK.3K2CMDA3BADA2BDRG2K2RTK.11|KTB2DHGC2DK.K2F2THB2A2D2A3BDQTNGC2HTK.10|KTBHU2SG2T2KUTQFGHB4A2B3DHKUFCMSPUK.10|.KU4SFMU2T2CBCGRGDB2QGRD2H2DRFC4GK.10|.2K3THQTUDBHQC2GRGCHMFCFKGBCHUSCB2CENK.9|.4KTK2U2CB2HGFQSQHGE2CECGHNRTUGC2L2FGK.8|.4KTKQUKC2BDFLUSTQFCE3C2GUSPQ2GFMBC2UK.7|.4KTKRUTFCD2FPTSTGC2FKFC3TP2QS2G2ABCUK.7|.5K4RFGHG2TPQRNGFHBRMCFRSP2SND2A2CUK.7|.5KULMQT2KLNQPSQFCTDHKHCAKTP3THDB3UK.7|.6KFLQNMNSQP2UHRGKD2K2GHRTPMNSNGDCGK.8|.6KFGSPLMP3SRD2SJKBNJTGDRSP2SQGD2UK.8|.5KPGNUMLP4SHDHPEJFJ2THCDRP2QTGCDK.9|.5KJ2LTMLMP2QRGBRPE2JEFRHCBHQPSKRCGK.9|.5KLELUPLMP2QRDFG2AE3AQDKC2GPUKH3K.9|.4KTE2LUMLMPQTSEAGQCFEGCRBDG2RPKUH2K2.9|.4KUFEJUMPMPSMECADHUE2FTKBCDHRQKUH2UPK.8|.4KTE2JUMPMPSLC3DHKNEMKHDCDGKSMPUSJMK.8|.4KTE2JULP3SNC2BD2KTQTKHDCBDHTLP2LJERK.7|.4KTJEFUMP2NURKB3DHUNSRHDCDHKUMLMLJ3TK.6|.4KTJEFSMP2SULEFD3RSQSTKDGLE2PMLMPJEJLK.6|.4KTJEJSMNPTMECELH2USQ2SK2HE3JULMPLEJ2EK.5|.4KTLE2SPNPTJC2EJNRSP4TKME4UL2M2JEFEJK.4|.4KTJEFSPNPSLC2EJ2S2P4SKLEC2EPLJM2LEJFJMK2.2|.4KTLCFP6JE2J2LSM4SMJ2E2JLMJ2LMJELML2CK.|.4KTLE2PMP3QJ2LJL2TM2LMSJLJ3LJ5MPEJ2TSK.2|.4KULE2PLSP2STMNRG2UPMLMTK3MPTJ3LJLME2JKMPK.|.4KUMJEMLMP3SRHGF2SM2L2MRKGKHQLJ2L2JMJEJ2LQK.|.4KULJEMTPSP2QRG2K2PM2L3QKHG2QJ4MLMLE2JLMK.|.4KUPF2PUK2US2RG2KUQPLPL2MUK2GQJ4SKQPJ5MK|.5KUR2UK.2K2U2GK2UKTJPML2TK2GSLJ3TK3U2E3MK|.5KQLFNK.4KUK3UK2TLU2MTK.KT4MK.3K3LEMK|.5KRG2KUK.2KURKT2K.2K6TK2UK4.7KJLK|.6KNK.K.2KQFCFKNSK.5KUTKFGRK.10KLK|.6KTK.3KMC3FKLQK.5KUMFC3LK.10K.|.6KUK5GCF2MTNSK3.K3UL2FECFUK.11|.7KU9TU6KU4NPML2FUK.11|.8K16.K11.12",
    },
    ztaurus: {
      p: {
        C: "#b68877",
        E: "#83676b",
        P: "#1e131b",
        A: "#dbb4a3",
        D: "#a36e56",
        B: "#c79b89",
        U: "#02000c",
        F: "#7e503e",
        L: "#56312b",
        T: "#040310",
        S: "#070313",
        Q: "#130a15",
        J: "#593731",
        H: "#5d4143",
        M: "#482723",
        N: "#322127",
        G: "#71402c",
        R: "#090615",
      },
      r: ".48|.48|.48|.48|.10K.23K.13|.9KCK.21KEK.12|.9KC2K.19KC2PK.11|.8KAEK.21KEAK.11|.7KEAEK.21KEADK.10|.7KB2EK.9K3.9KEABUK.9|.7KBFLK.6K.KUTSK3.6KEA2UK.9|.7KBDCEK2.2K2SKQJH2MS2K2.3KEBCAUK.9|.7KCDTHFUK2E2KQLH2JLKUCEK3EB2CDUK.9|.7KLFNHBDKEABPMJHJ2HKEABEPABAC2LK.10|.6K2SDNKCBCABCNJH2JHJKDC4AB2C2PK.10|.5KNBSNE2HBABDFNKHJ2K4DCBA2BABDK.11|.4KHAEKUC2EA2C2GKCDK2UCGK2FDBCACFK.12|.3KHBAHK2BEMC2DKSK3L2K4U2MDC2NK.13|.2KUCBANK2H2UQ3TK.2KL2K2TK2USP3RK.13|.KPE2ACNK2GFUK2TKSK2LJL2KSK.KS2NQMNK2.11|.KPACBEHKPEDPK2STUSQL4PK.2KRKMG2LNMK.10|.KPA2E3M2E2HQK2SKTK2M2KQSK2.KMJF3GPSK.9|.KEBAE4HD2E2K.KSUMCLFDMTKTK2JG5JLTK.8|KPACBE3HED2E2PK2U2MD3LMTKNMLG2F3G4NK.7|KPACE5D4EPKPQUNFDFGPSURMJ2G4FGLK2.8|KQAC2E2HE2D2FEQ2MPNKHFHJKNMQL2J2G4KNKQK.7|KQAC2EH3ED2H2RMPH2SKFLKPFEN2JGMJG2MLMLPTK.6|KQACBE2H3E2H2SPUH2PK4JE2HRMLFMJFG5NTK.5|KQB3E2H2MEHN2MQKH3K.KPE3HKPNLMLGFGFG2NK.6|.KQABCENRSK2UPGQK2H2K2QPH2J2K2SKUKL2UGKHJTK.5|.KPAB2HK2UKLSKLSUK2P2DGPRNK2.KSTK.K5JNSK.5|.KPCDAK.2K2NULK2UTKRFCDFJSK4U3KLKS3U3K.5|.2KUCBK.K3MU2K2SPGDFDFGFMLQ2T2S2K2UTL4MSK.4|.3KQNK2USRQPNPKRQG2F2G3JFGMSK2TUPJDAEGEGLUK.3|.4K3UNJLMPMLUTQJL2F2LGJHJMSK2QNFCA2EGEBCLTK.2|.6KSLJ3PK3UQPKFD2GSP3QTSKPLDBCBKGKB2DQK.2|.5KSUL2JKUK2NSDGSDK2DKGDFK2UTMDFEBAHJKACKGUK.|.5KTSMJGLPK2QRMNUDKGDMPLRKSUQLBCJCAHLKBKFCQK.|.5KURKJ2LQKS2MLKUF4NPJ2K2UMFB2CKEKLKEGCBNK.|.6KSKN2PQK2MG2M2QGLPN2LFJKQLECB2FCK3JEC2LUK|.7KUTS3KPJGMPM2QPM3PH2KRMHDC2GACFDFE3KUK|.8KUK2UQMG2PNL7KHJNSNPK3NFCD2GNK2PSK|.9K2NRNGFLQMGLG2L3K2JLRNHE3HPDKFNE2CGSK|.8KQFGQLGLMPNGLG2L3K2NKQMECEB2F2BFEFE2GUK|.8KPGLSLGL2PMGLG2ML2K.K2QME3CBCJFNCF2EGUK|.7KUG2MQL3K2MGLGL2GLK.3K2FECJDCNKHBCJCPK.|.7KUG2LT2PK.KMGLG2LG2TK.2KUGEHDJBKJEC2KDRK.|.8KPLMUKTK3MGMG2LG2SK.KN2GD3CBHLNCDELUK.|.7KUPM2QHKSTUMGL3G2LTSKUJFQNFEC2NMNECFSK.2|.7KTQNKNDK2U2MG5LJU2RK2HGQNGDEKGKE2NK.3|.8KSPNMCKSK2NGFG3MJTUK2PHDQK2GFKJPNPSK.3|.7K2TPN2DKSK2SPLF2MQMSUSKUKFS4Q2PT2KSK.3|.6KTKTNLTMGKUK2UTPQTK2SUK3TS2K2U2KRK3TK.3|.7KSTNMUQK2MLK2TR2K.KSTUQHJGH2JUK2SK.2K.4|.7KSTNLUTHFJ2K2TK2.K2SRSQH2FH3SK2SK.3K.3|.8K2NGSKNHJK2STK.KGKRKSTQJH2JNTKS2K.2KUK.2|.9KNMUKRHJK2S2TK4TUTU2KH2JHU2TU2K.KUK.2|.9KPMUKS2K3UKUKSK2U3KUK2SK2UK3UK.KUK.2|.9KPNU2PJPUKUK2.KSKSK3UKUK2SK.3KUKT2K.2|.9KPN2CDEJKGNK.3K.K.2KS2KCDNSK.3K.K2.3|.9KQKLDCEFJ2QK.8KPHD2CDFSK.9|.10K2NGEHNPNTK10NEDFDFDUK.9|.9KTU18TQN2PNQPUK.9|.10K28.10",
    },
    zgemini: {
      p: {
        H: "#312f5b",
        C: "#9173a8",
        U: "#01010a",
        F: "#574d80",
        Q: "#140c24",
        N: "#440f3e",
        D: "#666baa",
        S: "#070310",
        J: "#931c73",
        T: "#04030d",
        L: "#701866",
        G: "#3e447d",
        B: "#9b8bc5",
        R: "#0d0616",
        E: "#a13766",
        M: "#4c1957",
        P: "#1d1b37",
        A: "#c5aed8",
      },
      r: ".48|.48|.48|.48|.48|.48|.48|.19K3.26|.18KHCUK.3K.K.19|.18KFH2K.2KQKNK.18|.16K2FDSFCK2JNTKLK3.15|.11K.2K2G2FGHQBGKJ2STR2QRK.3K.10|.10KDK2HD4QCKBK2NENSKM2K.2K2QK.9|.10KBKHD5QG2FK.KLNPML2MK2UL2K.9|.10KDAD3BD3PRPGKSKRJ2M2JLKMJLK.9|.10KHFDBA2CDBFKDFK4JLKJELK2QK.10|.10KQDBABCADBKHDFK2S2MKJ3ELNS2K.9|.11KD2MAEACDKG2K2PK2ME3FE2LQK.10|.11KDHA5DG3K.KMK2ELE4LK.11|.11KDQA4BPGK2.3K2SL2ECALJLK.10|.12K2FA2CASG2DK.3KUELEAEK2NK.10|.14KPSCACPK2GK2.KNE2RPK2.K.11|.13K2HUCABFPK3SKL2E2SKUSK.12|.12KNACHC5HK2NL3ELNQE2K.12|.11KPFACKCB2KCAKQE2NLELQE3LK.11|.11KFCAFDKA2FA2FNE2KNEKPNE2LK.11|.11KFCEBADFACFBFNELNKLCMHNEK.12|.6K2.3KFCQBA2FEAC3L2NLKEBM2TQMK.11|.5KDBK2.KBCHFDB2PABFAEN2JLFM3QKHQK.2K2.6|.5KCAG2K2ACPFDGBDADPBER2N2LML2SK2SK.KNEK.5|.4KB3K3HBFK2DBCABGKDKSUNLJL2NK3NK3MNK.5|.4KB2FBHKHDHK2BCA2BQTHNK2NJE2LQKTE2NSKPEK.5|.5KBPFHBD2FKTHPFDHSQFNQKNLE2MRK2E2NKSKLK.5|.5KFHUPDB2CKHPMPHUSFCNQKTKNEKNKE2LNUTK2.6|.6KDUK2HCHRFDCBSK2HFK2.K2L2EJLNEPK2TK.7|.6KFQK.K3DBDCBTKU2K2SK2TMLE2LSK2.KSTK.6|.6KFGK.2KQCBDB2UKPFK3.2KQJE3NK.2KS2K.6|.6KHDK.2KDBADBFK.KCNRMK.KUJL2JMK.2K2SK.6|.7KBQK2HB3CAUK2PFHQLK2.KJ2L2JNK2SNK.7|.7KFDK2ADB3ARHPHF2NMKSK2J2LMJ2K.K2.8|.8KCUHBDABARKP2GHFMKNKSKUJ2L3NK.10|.3K.5KPB2DB2ARKQGFGPK2NKTKUJ2LM2LUK.9|.2KFK.3KDB2CFBAPHKRGF2PSN3KUKUJ2LHLJUK.8|.2KDK.2KDB2CB2AFH2UHF3PTKN2KUK2NJLM2JLK.8|.2KGK.KHABDCB2AHGHQGF3PSKM2KTK2QJ2LMLJLK.7|.3K.2KFBGDBA2CG2HSH2FGUKQM2KUK.KLJ2LM2J2K.6|.5KCADGB3AHG2PUH2FHUKUNMKU2K2PJ2LM2LJMK.5|.4KGBDGDBA2FKG2RUH3PK2TNEKT2K.KNJ2LM2LJMK.4|.3K2GDGDBA2CPKFHRTKHNTK.KQELRSK.KSLJ3M4K.4|.2KSG3D2A3GH2GPUSK2NUK.KSM2RSTKS3LJ3LML2K.3|.2KPGD3BACHGHG2QUK.KTK.2KQKM2QUS2K2RJ4LM2QK.2|.2KGDBPCABGHG2DGQTK.K2.3KNMNMRKSK.2KSNJL3MQK.2|.KDBDQPABH2GFD2GQUK2EK.3KQLENRK2.4KUNJQ2JLNK.|KRCK3PAGHGDGBFGQU2KFK.4KL2NRK2.5KSMK3UMRK|.K2.2KGFKHD2FBFGPT2K2TK.3KNLNUSTK.3K2SQRK.K3.|.5KFHQGDGDBFPUKSK2SK.3KNLNS4K.KTS2K2.6|.4KG3H2TRHBHSK2SK3.5KJNK3USK2TK2SK2.5|.4KPQUK3PSDPK.KUKUK.4KULNK2UTST2K.2KSTK.4|.5K3.3K2SK.2KTHUK.4KUENK.KTSK2.4K2UK.3|.13K.3K5.4KQENK2T2KTK.6K.4|.10K.2K.2KUK.KSK.3KNL2SKTSK3.11|.9KSK2TK3PK.KTK.2K2NLMNK3SKTK.10|.8KUS2U4TH2K.K.2KTUQN2LK.KTU2TK.9|.9K10.6K6.3K4.10",
    },
    zcancer: {
      p: {
        Q: "#210e1b",
        N: "#50101e",
        H: "#951f2b",
        P: "#390d1a",
        L: "#951425",
        A: "#b68479",
        D: "#cd2e34",
        J: "#581f2c",
        G: "#b11f2c",
        M: "#6e1322",
        C: "#954145",
        S: "#090817",
        U: "#01030e",
        R: "#210815",
        F: "#c7212d",
        B: "#915755",
        E: "#5c2f3d",
        T: "#080412",
      },
      r: ".48|.48|.48|.48|.48|.48|.48|.48|.27K.20|.19K2.K3.KQK.19|.18KNHKPLNK2HQK2.17|.15K.KHADJLGHMCADHSK.16|.14KUKHRHFPLG3MHFN2MK2.14|.13KABMFMPNJG3HMPNMHBABK.13|.14KAEMGMNJDG2EJTNLHEBK.14|.13K.KQTS2KBAE2ABTUST2K.K.13|.11K2TKCDKSK3HBESK3QHMK2PK2.11|.10KMDRKGACK2UKJB2ESK2MACK2MGRK.10|.9KNGARKG2APKU2KB2K3JPDGNKND2PK.9|.9KD3JTNMH2GKUQA3UK2PDNPURLDGK.9|.8KNDGLHRU2SJHJSEQSBUK2PMU2RM2LGTK.8|.8KPHNMLNK2UTKESPEQK3UK3JNMN2MUK.8|.8KTUKJMTKHKUKTUQB2KU2K.KE2NK3TUK.8|.7KUDTK2UEHDK2UK5TKESK2C2EQSKUDUK.7|.7KD2SKUKEBEKUEABK4BABQK2DCJNPUGDK.7|.6KHFDNKT2K2SUKBABEP2EA2BQUSPQSPMRFDSK.6|.6KCHF2GU2K2T2EB2E2K2EAB2JTSK3RNMFCAUK.5|.5KB2PMFMUKEK2UKBE2QJ2KE2BKUK2E2KTLMKAEK.5|.5KA2QK2PUEK2U2TKPRND2MTK3UTK2QKNPUKA2UK.4|.5KEAPUQEUSKTKU2QPGMD2GR2KUK2TKUKHKSKBESK.4|.4KQPEQUKE2TUK.KUDMDMFDL2DHK.KU2K2E2K3SEK.4|.4KE3QKE2K2UK.KTLG2LD2NGDGNK.KUK2EBEUSKAUK.3|.3KUNHK3E2KUK.KUTNGFMLFMDGNPUK.K.2KBKU2AEUK.3|.2KPD2ALPUK3UK.KMDHNL2G2MGNCDMK.5KQTHDAFQK.2|.KQGD4MLHKTK.K2PHDNPRHDPN2GMRUK.3KMFMF2D3QK.|.KRDLFDFL3QK.KNMPSJMGNRP2N2P3TK.2KRMH2D2FGDQK.|.KSDNFD2GM2GHK2QPG2MTNGNPDMRLGDMSK2HL2G2FDGBKSK.|KRHBAND2GMLFGTSQH2CDURGFDGRTLMG2MKSGFM2GLDGK2FQK|KRFMCMFGMLFD2LKSMCJHUKNFDMPTPHG2NRLF2GNL2FCKEDRK|KRFJCHGL2GD3FRK3HR2NRF2PNPSLHJPRGD2FL2G2AJ2DQK|KRGMKGNLGFD2FGTK2GHUPLRL2RHNSN2EJRGADF2LMLDH2DRK|KSLGHGRNGF4GTNH2K2MLKPNSMPK2PH2PGD2F2GPMGLF2RK|KRL2GLMNLGF2GLK2NUK.KGK3UMPK.KSKRMFDF2LNLGF2LRK|.KPF2GLPRMFDFRK2SK2.KGK.KUM2EK2UKTMFDFGRSLF3PK.|.KRFDFLUKNFDFRKUK2EK.K.3KHMKEK4MGDFNKTLD2FRK.|.KRGFDHUKMF2HRK5.2K.3KGMKEK2SKPMFGNKSGD2FRK.|.2KRFDGK.KNFTK.KTEK.KHK.2KFPK2.KUKUNGMK2SFDFNK.2|.2KRGD2LK2PGTK2QEK3PGK.KNLPK3ECK2MLMK2UFD2PK.2|.3KMGFMK2LRK3UKDEKPGK.KJMPTQECNSKTPLUKMDFMK.3|.4KGF2PK4TU2KEKSPGMK.KGPTKE2NUK3RKTGFMPK.3|.4KRLFMK.KMKUTK4PLMK.KHNSKE2RSKHK3MFLPK.4|.5KRPNUKNLKUSJNSKTNMK2ENPK2SQSK2LMK2MNPK.5|.6K4SMLMRKJSK2UPGE2HNSK.KEJK2HGUK4.6|.9KQGL2RE2K2SKRFE2HNKUK2CBKMH2MK.9|.9KTMLGPMEK2SKTGE2GPKTK2CBPLM3K.9|.9KURMGPHEKTK2TGMEGQK3.KENLPUPK.9|.10K2M2PE2TUK2UKHELRK2UK2ERGRK2.10|.12K2QBKUK.2KRHERK.2KUKENPK.12|.13KMGKPK.2KPH2PK.2KUPFMK.13|.13KQKMTK.3KH2RK.2KRJEJK.13|.13KTSEK.4KMHK.3KSKE2K.13|.12KPM2KUK.3KNJK.3KSKMCJK.12|.12KJHMKUK.4K2.5KQNJMK.12|.13K3.K.13K4.13",
    },
    zleo: {
      p: {
        G: "#9f4425",
        J: "#603227",
        C: "#d97132",
        H: "#714632",
        P: "#47171c",
        S: "#1d0b17",
        T: "#0d0414",
        A: "#f1a559",
        B: "#da8540",
        R: "#26141b",
        E: "#a16539",
        M: "#961923",
        Q: "#311f22",
        D: "#d55f29",
        U: "#010211",
        F: "#d24327",
        N: "#6f151f",
        L: "#b92025",
      },
      r: ".48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.20K.27|.19KGK.26|.15K.K3JCK3.23|.12K.KHKPGSTABRGK.22|.11KGK3R2A2HCAHGEK.21|.8K2.2KMRPRQGA2DA2CPK.21|.7KRGK2URGBJGBGB3ACJQK.20|.8KSDCAB3PGAQGBCBPBHK.20|.9KSMFB2DJGDPSQCJPGJK.20|.5K4TMCA3CPSETHJKPKQK.21|.4KUDNRBABCGD2GPTKBABARSK2.20|.4KUNFC2BCFNGBDRTHQEA2RGHJK.19|.5K2PGB2D2GDBDPKJEA3JDBEQK.18|.6KTRG3CBCGCMNRHAEHRDAHTK.18|.5KJGCGCBDGNRJNPTKH2QRGBAHK.18|.4KQCHSNB2DJTJEUK3R2STUJBAJK.17|.5K2UQCG2NQH2EJK.KQRKUKUQPRK.17|.6KPG3PRHBEKEUK2E2KTK2BQK.18|.6KGPSMPQE2K2BRKQB2URJKHQUK.17|.6KNUNPSK4BJ2HEHBQBQJKEK2.17|.7KSPSTHE2HUKHEAKAEBQTEDHQK.16|.7KNMNSK4UK4EBEKSUKPJPK.16|.6KPM2NPJHJTUK2JCK4UK2JUK.17|.6KM2N2PE2QRSUKHK2EHKSK2EPSK.16|.5KPML2PK2JSP2UK3JH2TPTHSLNK.16|.5KML2NHETUPNPTUK2SEKURTKJPNSK4.12|.4KNL2MPEBGEPNP2GUQB2H3PHEQMNTNG2K.11|.4KML2MPH2EKSNSQE2DBQHDHPE2PM2NP2RK.11|.3KUML2MPHEKTP2TKUJBGDCHPSGEHNLMNMPK3.9|.3KTMFL2MRBKPNRK2HQJCGCRHQNDJNML6MK2.7|.3KMLF2M2SKUN2K2GK2QCAETK2NGHNM2L3F3LNK.6|.3KNLCFM2PKSNPQK3UJPBQRTJSG2PLM3L2F2DFLK.5|.3KTMDGNJEGPSTK.2KUHK3GKRQGEPMLM3L3FGLNK.4|.3KPNMGMJEKU2PDK.2KEK.KGK2UPGN2L2ML2PTNPK2.5|.3KPSNDFPK2UPDCJK.KBK.KEK2USM2NL4MNUK2.7|.4KTGD2NKSPFCEK.2KBK.KEK2UKNM2L5MTK.8|.4KRDF2MBJGDBCK.KUEK.KJK2UKRM3L5MK3.6|.4KBDFMK2GDFD2JK2UCK2Q2K2UK2NMNMF4LNTRK3.3|.K.KDCL2SK2D2FGFGKU2CK2JTKJHK2PM2NMLF2L3F2MTK.2|KEKUBCMRNKBTGF2DBKU2CK2GSKQJK2UNLM3L6D2FNK.|KEJ2BCGKPK2U2GD2BKU2K.KGSKQTK.KRM6L2F3D2GK.|.KJEBAUKEK2U2GD2BQU2K.KGSUKSK.KRNMLM4LF2D2GFMK|.KPJDAUKBK3UGDCAQU2K.KGPRHSK.2KSML3MNMFD2GK2PK|.2KUDATQJKPNUGCA2QTUK.KGHGQUK.3KPL3MPTNDFRK.K.|.3KBFK5RUDCAHKSUK.KHKEDUK.3KSML3UK2RMK.4|.3KEHURKSKUHBA2HKPUK.KHK2DUK.2K.KRNL2NK.K2.5|.3KUJSHJKU2HA3RN2UK.2KUKHTK.KHK2EUTPK.9|.3KUAQBHK2QA3ERN2UK.KPTKBJUK2EKEBEK2.10|.4KSUE2GFQA3TK2EPK3EJUBHCBTJEAPHJK.10|.5K2EK2TEA2EK3TUKQEDRKPGMAB3UK2PRK.9|.6KTK.KBAEKU2K2NKGK3UK2SUT2K2.2K2.10|.7K.KEAHK12UK2GK3.16|.9KJKQP2U12KJHK.17|.10K.K15.K2.18",
    },
    zvirgo: {
      p: {
        R: "#262a2d",
        T: "#090714",
        G: "#638166",
        U: "#03000e",
        M: "#435d51",
        J: "#4c6959",
        S: "#141921",
        N: "#464d43",
        C: "#8cb583",
        P: "#354c47",
        L: "#535f4e",
        B: "#b0bb80",
        A: "#bcce90",
        E: "#6c9875",
        H: "#547a63",
        Q: "#2e3d3d",
        F: "#807f5b",
        D: "#8d9c6f",
      },
      r: ".48|.48|.48|.48|.48|.48|.17K.30|.16KRK.29|.15KTGUK.2K3.2K2.19|.15KMJUK3U2SK2SGK.18|.11K.4KJK2TNC2GK.K2.19|.10KSK2.2KPK2LBCACEK2HK.10K.7|.10KQEJK.KTQLBCAKEHFKTK.9KUK.6|.9KQMGJK2.KTNFCGBDEDK2.7K.KHNK.6|.10KJK2JMK2UQFEDAD2KUK.6KUKTEMK.6|.11K.KLHPKTRDFBAF2QUK.5KTEKQCPK.6|.13K2QJUTKEBA3DMK.5K2UCJGEUTK.5|.11K2U4PGQEFA3QHTK.3KJCJUE2JCHUK.4|.10KGDCEH2SPTGQDALSPK.5KQEP2AEGKT2K.3|.8K2GCDE2CHRQUGPFNUQNUK.3KT2RSP2JKE2PK.3|.7KQDCEJECEP3SGMFBQ2MRQK.3KGQTKPTKQRJK.3|.7KHCEG2E2N2FLQJHBADTMG2MK.2KEGKMQUJRK2.4|.6KSE2G2JGHRGFNQMRA2DUSPDGK2.KHPTHQKJEK.5|.5KTG2JHUQGQMLNMQEKUDKMRPLMPMK.K2EFHGUEK.5|.5KNCJRTQEKSMLMUGBAQK2B2SPNQSNK.KTCUK3.6|.4KTGCRK2EHKUTNGTCB2KN2ABSN2TK2.KTJ2TK.8|.4KRFGSK2ETKPEADUEJ2QNJGHUFDNSPK.KERK.9|.4KNEJK.KGK2QDBLKJ2KQFKMKUGBLTK.2KJSK.9|.4KLEQK.KPK2DBDSR2HPGDJ2UKLDLNK3TBRK.9|.4KLENK.2KTMDBNMGUGJ2FKHUKUQF2GHKLBSK.9|.4KNJ2K.K2UML2FECSHGRFMJK.KNDGE2DBDSK.9|.5KNGK2MK2GHRCHMNPLTGRNJK2NDGKQFKASK.9|.6KJ2TK2NCGQESRNJBK2LNELKQDLPU2R2K.10|.6KMJK.KNCPH2RHCPGDKBJGJR2FGNK2QUK.10|.6KULRKTHEUN2HECQGDBFHQCF2LFGK2MTK.10|.7K2MKQCQUSRHCJHEFDLJRBGMQGDKRQK.11|.4K3.2K2QGS2PJBEKGELDKEKCGJQMGKTQK.11|.3KTPUK.K2HCNKHEBLKFGPNQBTCEHJL2T2QK2.6K2.2|.2K2RTPK2USA2BJECDK2F2MJPBTREHEGK2QTPRK2.3KTSK.|.KSQUPRUK2TFDRJEAHK2F2PGPBSUDGH2SUQUKQ2UK.KUEGUK|.2K3QK3UTRFTECDRQPF2PHPCKUDCHPEQ2K.KRMUKMKTSPK|.K.3K.K2SH2JECBTKPJLFMJMBPSGBDRHPRK.2K2U2TK4.|KUK.3KUGE2GECBNUKMJMCJ2MDPKUABHPKRUK.3K3.5|KSJK.2KJE3C2BDTUSMJQDM2PGPK2NAJ2KRESK.10|.KTK.KGEGECBADQK3P2RDMJMP3KUAEGKRCBUK.9|.2K.KJCEHDB3NK.KUMJSCJGJTKPU2FBHKMGCHTK2.7|.3KQCMGCBCDQK.2KUFBQCJGJTKDQUSCGTC2EMHU2K.6|.2KUMGKEB2CNUK.2KSGDRDHGJTQDQU2HNSBCEUEUKSK.5|.2K3QSEB2GUK.K.KRJGTEJGHSTJQUKUKFACMUMPK2SK.4|.KTJKMTGBDTK.KQK2PNPUEMGHRTNPK.K2NBCRKMHK2QPK.3|.KSEMKSGCRK.2KQKL3RUGPEHPK2LPK.KTDBLPJHRK2HK.3|.KRCHTEJNK.2KQK2NFNQTGPGMQK2DK.3K2BCQ2JDK2RK.3|.KSMESERSK.2KQK2RNLKTGMH2QKNFLK.K.KMCHQGBK.K.4|.2KSEJERUK.KNQK2TQNKUGPHGQSL2K.KUKU2CGMEBK.6|.2KSE3MK.KQ3K2URQKUGPH2QTQ2K.KUK3CE2C2K.6|.3K2E2MK3FQK.2KSQUKQPHP2TQ2K7C4UK.6|.3KSE2HUQDKNFK.KRJK2UPHSKUKPKRTSF2KC3QUK.6|.4KSJENFK2NF2K2SKUK2QHSKUKDFNQNUR2AC2UK.7|.5KTEBUK.KNBDFRJRF2KJLFRSGRQTK2RBE2SK.8|.6KNBFK.2KF2QJHSNRQPFKRQGLSK.KCARK2.9|.6KRFDK.3K2SG2QK3MK2RNDGK.2KBDK.11|.7KLDK.4KREGQK.2K.KSMCDRK.KLGK.11|.7KDRK.4KRLMQK.5KMHKRK.2KJK.11|.8K2.6K4.7K2.K.4K.12",
    },
    zlibra: {
      p: {
        M: "#5d3e46",
        J: "#715d78",
        G: "#9c6c62",
        D: "#c19990",
        F: "#a1808b",
        R: "#22192b",
        L: "#684f60",
        S: "#0e0a19",
        Q: "#332942",
        N: "#473e5b",
        P: "#3e3352",
        U: "#020109",
        T: "#030210",
        C: "#c7afc2",
        A: "#dccfe4",
        H: "#7c7094",
        E: "#9d8fb4",
        B: "#cebfda",
      },
      r: ".48|.48|.48|.48|.22K4.22|.21KMJGMK2.20|.19K2D2F2G2DK.19|.14K.3KG2K5GDGK.3K2.13|.13KRK.2KLGK.4K2GK.2KSRK.12|.12KQRK.3KG2K4G2MK.2KRNPK.11|.11KPNUK.4KGD3G2K2.4KQNSK.10|.10KULNUK.5KU3SK.6KSPKTK.9|.11KQK2.5KTKQK2UK.6K5.9|.10K2FK2.3K2SP2Q3KUK.4KUKJKTK.8|.9KTCAKTK.KTSRLGKPQ2UK.4KLA2K3.8|.9KHA2ESK.KUKSNFK6.3KTJA3QUK.7|.8KQECBAJRK.KTLKFM2SK2SK.KULEAC2LTK.7|.7KUHCEHA2ENK2ULRGF2GNK4RECAC2A2QK.7|.7KUPCBJCA2BEK3UFC2DK2UTLEABC2ECHSTK.6|.7KLEB2CHC2B2HRKTFDCPK3PCABCHJEB2JTK.6|.7KEBCHE2H2E2NRK2RFGTQTKLECHE2NJC2BNK.6|.6KTCENRE2CEHJSMUK2QMUK2TUNHE2HENPHBCUK.5|.7KNRUJBE3LQ2M2KRDGUTUKMNJE2HECSKNJUK.5|.6KTK2QBE3JRMLKMKECELPKPDPRHE2HCNK3UK.5|.6KUK2HEQC2JK2MUPKGEKGLKPNQSHEHQHBK.KUK.5|.6KU2K3UE2JMGK2HFGKGJERK4QEHRQCSKU2K.5|.5K2FENUKTEQSRMKLECDKGCQNK2MSRHJTUKRCAPK.5|.4KG2D2GLTU2T2LJQNE2DRCETHUPJNTU5AFGMGK2.3|.3KDGDG2C2KSMTNJ2PSJ2QMN4TQH2RU2QUAD2LERCQK.2|.3KSGDMRMGK2LPMJLKTPHJMHENTKTJGKGMQPLSRGDGMK.3|.4KGMLK2TK5GNK2UHCQBEPUK2LGP2K2RUK2GMGK.4|.4KLUDK2T2U2K2QK.KSHCMCENUK2MK3TUKUK2GUGRK.3|.4KMKGK2U4K2UK.KMFEKFJM2K.K.K2TRTK.KGKGRK.3|.3KSK.KMK2RKTKUK.KRGD2KGMDFSK.KUK2MTK2RSK2QK.3|.2KMQK.KRK2QGK.K.KTS2DGFLDGQRK.2K.KLSKUMUK2M2K.2|.2KGK.2KMK2UK.4KRHULGDLDRUKUK.3KRUKTGK.KGMK.2|.KSMK.2KRMUK3.3KLJSG4QMHEJK.4K3QK3.KMK.2|.KMRTK4MRUSQK.KNJHKGFGDUGHBCRK.2KQKM2UT2K2GMK.|KUGM6QRUSQK2RJH2TGDGDUDJEBNK.3K2M7G2SK|.KMD3GDGMK2SKUKJH3UKDGFKGEHB2QK.KMK2GD3GDGMK.|.2KMDG4K.2K4JEHSQKLCK2SBKHB2K2RQK.KGDG3MK.2|.3KU5K.2KQSKHE2NJK2MK2SAECHBRKRSK.KU5K.3|.4K7.KR2JH2NEHKTK.KTBE2HEBJQRK2.K5.4|.8KRQK2SRNJNPBHKTK2QUJHE3AJR2KPK.9|.7KSK2.KUKPN2HBFK2.KMGUECAEBEQK2QK.9|.7KSQK.KUKN3EBGK.2KMGTAEJHCBHK3.2K.7|.6KUK2UK2SKEJRHBJK.2KMJQACH2EBHKTK.KRK.6|.6KRK.K2QEKENUPHJK.3KJQB2H2EBHKTK3QUK.5|.5KUNQK3AEK2TUPJ2K.3KG2UAENPELQPKTK3.6|.5K2QK2TQACRSTUE2GK.2KTGLUACHTNQ2EKTK2TK.5|.4KUQRKTPCBCJTKLEFKUK.KUGMRJBESRK2EBTK.K.6|.4KUK3UHB3HUKLGFGUK.KRG2NSBCPR2TRBEK2.7|.5K.2KJB3AHTKJ2GHUK.KNMFSTHBHNSRPB2CJK.6|.7K2HBCBANSN2LJ2UK2SJPDTQRBCHKQHCBCEJK.5|.6KPQJCBAHJRJ2ML2PSKSHLGRNUABEJH2JB3ESK.4|.5KUEHECB2NHQJ2MLPJRSNHGSN3SBCH2EHE3BFK.4|.5KCHJHC2QJ2QLJQLQJ2PJF2SNPN2HABE2HJHEC2SK.3|.4KTEP2E2RU2JRQJKFQJ2PNJCSLKNQSHB2E2HEH2ERK.3|.4KHEHRL2K3QUKPGDLP2TRLGK3QK2RHCBE2JLQLHK.3|.4KBCHK3.3K2.KGELK5FK.2K.2K2QFBCSK2RE2K.2|.4KAEK.9KHENK.2KJCLK.6K2HAPK.K2HK.2|.4KEK.9KRMGJK.2KFLJK.8K2JK.2KJK.2|.5K.10KNGJK.3KMJMK.10K.4K.3|.17K3.5K3.20",
    },
    zscorpio: {
      p: {
        R: "#040512",
        N: "#0d0816",
        Q: "#040614",
        P: "#070715",
        C: "#b52431",
        E: "#a5192d",
        S: "#03040f",
        L: "#420d1f",
        F: "#88182c",
        J: "#680f23",
        D: "#742537",
        G: "#6e172a",
        M: "#230b19",
        H: "#451525",
        T: "#01030e",
        U: "#01010b",
        A: "#b75e5d",
        B: "#843240",
      },
      r: ".22K4.22|.19K3RN2RK4.18|.17K2QPRC3EKS3K2.16|.16KLFJKDC4NSJF2GK.15|.15KMFC2H2C2E2MHC3FQK.14|.14KPMFECJME2FJNFE2FGQSK.K.11|.12K2JMSKF2GHQL2TSJ3FPK2TKNK.10|.11KNCDKQ2KNQSK5TUSQSK3FCGK2.8|.10KNCECFMPSPRTSK2.2K6PK2ECFSK.7|.10KFABEFLHK2NKHKQK2.5KQK2FCEHK.7|.9KNEB2FJNKHK3HK2NBK.3KUK4BEJTK.6|.9KURKFJLK2PKHDH2KHCK.3KTS2QK2GHTK.6|.9KGUPN2K2MKHBK4F2K.4K2PRSLGLPK.6|.8KFCEGPK.KSKFKJK2CHK.7K2TNFHK.7|.7KNFC2FMK.2KNK2MK2NMK.9KSEJK.7|.7KQGFEGTK.2KLKMDKBAK.10KMEJK.7|.7KTKMJ2K.3KPHUKA3K.11KLK.8|.8KNLGHK2.K2NHLA3HK.12K.9|.8KJFEFLQKPMNKHB3UQK2.20|.7KFEBF2UK2LELKMBDMQDGMK.K.17|.7KJFBELKACKECK2DABKAFK.KHK.16|.7KLJEFMK2AHKJK2A3BHJK2BKQK.3K.2K2.7|.7KNMFHNKDK2LHBKHADSDK2HDKQK.2KMK2MFK.6|.7KNMJND2K2JLMBAEKNDAKP2KLUK.KTCS2CK.7|.7KB2NLM2BKSMA4G2A3QK2UK.2KMCNRFJK.6|.7KBAUHDBDKQDA4F2A3MK3.3KPMNQK2.7|.7KGBUA3DSTDBABDEFBKBNKH2K.3KMKTK2.7|.6KSMDN2KDQK2MDM2EC2HMHTKH2K.K.KFKUKCK.K.4|.6KUMDUDS2HK3PKBKD3BSK2NK.KSKULGPKEK2FK.3|.3K.2KLF2NEKNL2NKPKHK2CK3.KTK.2KNPMHK.K.K2.4|.2KGK.KLECLHKMHL2KSQKHDF2KQK2UK.KFMJEJK.2KGK.4|.2KEMK.KBAJK2LKJLKNMKGEB2QULKSK2E2HJCFMK2GHQK.3|.2KJFK2FD2GUK3GKPFCMUK3NFCFKUSJFGLEGMK.K2UK.3|.KPQEKQNM2S2K.2K2PKMLJNBQK2GEHPK3NUFGNK.3K.4|.2K2HKQHCAEGMK.KQGBLTK2DK.KMCGHK2SUJ2GFPK.KHK.3|.4KL2ECBC2LK.KNG2HTK.K.K3J2HPKMGJ2DFK.3K.4|.4K2LFDBELMK2HDEBPQK.K2NRKDLHLKM2J2GFMK.K.5|.3KGK3FCETQKQJEFAQTK2HKTKNDK3SQPKJHKFNKLK.4|.3KQKTHCACQK2TGFK3TK2DKQK2M2KUK2LQHFCGK2GK.4|.4K2MFB2CJLJLHMPK.KSK2UK.KMKPKTJ2KJFE3JTK.4|.3K2PMFCACFLEBHQKHK2SK2UK2HKP2K2FJKHJEFEJSK.4|.2KLK2QJCAEGKEADSKHK.KTSK.KDKQPK2JFTLJFBEJNK.4|.2KEGKSLC2EUTECMRKDHK2SQK2H2DKUK3EKTJFGDKGSK.3|.2KECE2GECFPQFCMK2DK2S3RK2DK2UJ2KJK2MHJK2MUK.3|.2KLCEFLECEFK3QK2GK2TK2SK.K3TJFJK.2KSKFK2MK.3|.2KNCEHSJC3K2SNLCK2TSK2SRK2JFHMEFK.KSUKHK2JK.3|.3KCEHQLC2EQKUMFCK2QK.2KSKUFCFQE2GK2SLK3FLK.3|.3KLJHNMC2QK2TLFC2QSK.2KT2HFEHKF2LK2MF2BDLUK.3|.3KTEFJMC2UK2QMG2LUTK.2KS2KFGTK2FLKPF2B2DLTK.3|.4KC2FNJAUPKSRMHQS2K.2KP3MHTK2JK2QJECFGLMK.3|.4KPC2GLAUK3JLPMLQK.2KQHLNUTK2FMK2LGFGHLCK.3|.5KC2EHANKSK2DF2MTK.2KQKJLKJK2F2KSMFEDHMCFK.2|.5KJE2MALKUK2FCKUTK.2KQK2JEGK.KCKULF2GLKNK.3|.5KMECJABKQKGFK4.4KTKJEJK.KJKULFLNK.K.4|.6KJCFEAQK.KFKTK.5KTQKEFK.KLUMFMNK.7|.6KLC2FAQK3GSK.7KQKFJK.2KTL2K2.8|.6KMFCFAK2ULHTK.7KTSHLK.2K2TK.10|.7KLC2AMKUK2SK.7KTUK2.2KRK2.11|.8KJC2APK.K2.8KS2K.K.2K.13|.9KC2AUSKQTK.7KTSPKSK.15|.9KLBAUK.KSK.7KSQPK2TK.14|.10K2AK.2KSK9S3K2SK.14|.11KHK.2KT11S2K2SK.14|.12K.4K13.2K.15",
    },
    zsagit: {
      p: {
        F: "#62406f",
        C: "#875a83",
        R: "#161333",
        D: "#57579c",
        E: "#7a4278",
        L: "#512b6e",
        B: "#747ec2",
        Q: "#241a4d",
        J: "#3c3673",
        T: "#06040f",
        G: "#52417a",
        P: "#292665",
        H: "#3e4184",
        N: "#312767",
        U: "#030209",
        S: "#0a0716",
        A: "#b7899b",
        M: "#3a2a6e",
      },
      r: ".48|.48|.48|.48|.28K2.18|.27KF2K.17|.27KC2RK.16|.16K.11KDELK.15|.15KBK.10KQFEFK.14|.15KDJK2.9K2FCLK2.12|.14K2RBJTK.10KLGL2K.11|.11K3QP2B2DK.2K.5K.2KRELQK.10|.5K4.KTQPB7K2TK.3KDK.2KRLDRK.9|.4KHD2HKDB7DB3GNTK.KDK.4K2E3K3.6|.3KQJUTKH2J2DB3DB4QBJK2DK.7KGLUFCK.5|.4K5RKS2RJB6FDB2JKJK.7KRLEUK.6|.9K.K2SPBDH2BF2AEBHGK.9KMCLK.6|.12KDB2D2C3ACRBDPK.9KQDAK.6|.9K3HDB3DJA4CJHDK.9KSFARK.5|.8KRNQDB2D2JNGA3FJHJK.9KQCE2K2.4|.5K3PHPHBDJ2HR2JEACTPQK.9KREC2FKDK.3|.3K2JP2MQTPHRQEGSUQERU2RQCK.9KC3EK2EK2.|.2KQPRKU2K2PRNBA2CGRNK2SFA2CK3.K7QGQK2ABCK|.2KSK2.K2.KSGB3AFR2JLMSQEGKUS2KGT5LECFTLEK2.|.3K.6KSDBAFCRN2ECFPQ2GA2CRBCMFLGCAF2CUK2.3|.10KJB2C2EKJDF3GDNCA3LBA4BAFQCAUK.4|.9KSC3EUTSKHMKAJGQSFA2FGA2D3JTRC2K.5|.8KUCA3RKUKSK3PK5U3G2DQK4TCK2.5|.7KTFC2AFK2UK2SRHN2T2K.K3RCUK.2KUEA3K.4|.7KQA2GFK.2KUSKMNFNRTK.4K3.3KLEC2QK.4|.8KCDGFUK.2KTKPNLMQK.11KRLGEUK.4|.9KDQJQK4RHQPKP2QK.10KUMLFK.5|.9KDSKJKFLKRJNKQRQBK.10KTGCK.6|.10KUKPC2FS2QMQAFNTQK5.5KRGATK.5|.7K6RA2JSTQRNFMQSHSTU3K.3KUNGETK.5|.6KU4K.KAQRPQNUNCQUTSDRH2NSK.2KREGSK.6|.5KTJB3RK2RQKN2SK2FQURQKD3HPSK3CANTK.6|.4KQJD3HMRQNG2LPUK.K3RM2DFD2HPGRLELK2.7|.3K2JCDH2MQRPJEFMNSK.2KR2HMNCHDH2KFCLQK.8|.2KRPD2MHM2SNEHJMNKQCK.KQSM2H2FH2RQCEK2.9|.2KJBDHDMSTRJGLMN2PKAK.KLSMHMH2RFCDQK.11|.2KPD2H2UKUQFGNJH2KRFK3R2M2PHPFCEKTK.11|.2KQDHQHK2UMEJEHJQKSNKQKFRMPKMECLPK2.12|.KUQH2QHK2TM2JEHPRUK2Q2KRSP2MQAFPMRK.12|.KPH2DHJK2UNMJGKNMRTKQ2K2UK2HFCQHMSK.12|KJBDMHDPK2UQM2PKHMRTK3.KTKMHCQMDHSK.12|KGBDHPDHK.KSHMKH3PU2RQKS2KMH2GD2HSK.12|KMB2D2PDTK2UKP2M2KCRUKQMUT2PHG2H2QK3.11|KNDBDHKQK.2K.KRPUEABTSMRTK2QMH3MUH2TK.4K.5|.KJB2D2K.3K2.KU2DCAQSHRUK2UQHEJR2JEDMK.2KDK.4|.KDB2DRK2.KNMK2UPGD2RKDKU2KUNHDQSPNJGEQK2NRK.4|.2KDBJK2UK.K3ULGJGDUK3T2K2EHJRSTQNHGRK2RJK.4|.2KQD2TKUK2.KTRC2RJ2TK.KTS2QNMLQSKUTPDQK.KHJK.3|.3K2DNKTKTKTKQHCJRTK.K.KSTQPKEHRK3TDFK.2K2.4|.5KSKUK2TK2UJGDJRK2SK2SKQPKNJSK.2KJDNK.7|.6K.K3TK.KTMD2RK2TKUK.KPNPSK.4KHQK.7|.8KTK2.3KPD2RK2TKUK.KRJQK.4KSLFK.7|.8KUK.K.3KD2SKUT2K.2KTHRK.4KTJGK.7|.8KTK2UK.2KRBRKUKTK.3KJPK.3KGND3K.6|.8KTK2TK.2K2GJUT3K.2KUNHK.3KJF2D2K.6|.9K2.KTK2TJEFUSKT2K2UK2PRK.3KARCTK.6|.8KU2K2TK2UQFLSKTUK.KUKNRUK.3KAKAK.7|.9KTK.K.KUGCELKTK.2KUSNPSK.3KSFK.8|.10K.5K5.K.4K5.5K2.9",
    },
    zcapri: {
      p: {
        T: "#06030e",
        Q: "#0d091b",
        S: "#07050f",
        J: "#271e5a",
        F: "#762191",
        L: "#581377",
        P: "#1d0d2c",
        U: "#020208",
        G: "#4d207c",
        D: "#722f90",
        A: "#9e678b",
        B: "#7a48a0",
        H: "#382075",
        R: "#080611",
        N: "#271353",
        M: "#3a1260",
        C: "#6d3c8f",
        E: "#392e74",
      },
      r: ".23K.4K3.17|.21K2TK.2KQ3K.16|.20KTSJK3TF3QK.15|.18K2LK3PQUGDABHRK.K.12|.17KUNFDK5B2DLH2K2TK.11|.16KNMHLFLRK2RFADGH2KLFNK.10|.15KPHGBL2MPT2SLAGHK3FALK.10|.14KUPHCACNMPTK2TUHMK2GFABPK.9|.11K4UKHDFDMTK6TUMFDCBDPK5.5|.8K3NFPTK2QKHBPKTNJ3QK2QLGH2NQNMHGFK2.3|.7KBDK2DB2DHQ3KMK2JKJ2EAK2QK3PEDA2NKBLK.2|.7KFPJCEGCAFMUK2NK3.KJECK.K.2KMDAD2NRBK.3|.8KUNBEHGCDFPK2UKJK.KJMPTK.3KDADG2NRK.4|.9KUQRNH2GLPK.K.K2.KDGEJK.2K4J2K2TK.4|.10K2RTSTNPK.KRKA2KLQKQK.2KRNPTK4QK.4|.12KTK2PTK.2KUPK2DK2PRK.KT3SKUJGPTK.3|.11KUNGDHMPK3U2K.K2J2K.3K4.K2AFQK.3|.11KFA2CGHQKUKU2K2ATNK.K.8KDFPK.3|.11KBCBCGNRUK3RQK2UNK2TK.7KF2K.4|.9K.KRGEJ2K2SKTJQK3UMKTS2K.6KFK.5|.7K2LK.KTUKJH2KTK2QE3UECRKHMK.5KMK.5|.6KNDMK2.KSRQCHK2SQHEAGEB2K2HGAK.3KQ2K.5|.5KJB2N3K3RPAGHKSPHCACKC2KHGCASK.2KPLK.5|.4KNEABEHB2J2UCA2HJKGMA2GKEMKGA2GUK.KNUFMK.4|.3KJA2BHMHNK3UKMA2HMGKGCKAC2QAG2LQK2QBPHBGK.3|.2KUCB2GQUQFUKTK2LGEUM2KGCKBCEPAEKPRK2GBDEB2UK.2|.2KUB2EHTK2PK.K.KGCEUNKTKGKBK2UE2KRK.KLFNEB2EQK.|.2KUB2EPUK.K.3KPE2JTQKSNHNLHTUE3QK.KP2KHCB2RK.|.2KUB2EQHPK.4KJE2URTK2QKMK2TKNECPK.2K3PCBAPK.|.3KNBCPFNK.3KJ2E2UKUK2GFK3UK2PE2K.3KU2EB2PK.|.4KE2PK2.3KPGMKPK.K.KMGMJKUKUTECGK.2KE2B2FRK.|.4KEBHK.4KQHK.K.2K.K2MAEKN2K2EDBNK.KJB3HUK.|.5KDBQK.3KMHK.2K2NKACKAKECGTKPDG2K.KUCBETK.2|.6K2UK.2KUBKQK2UK3H2GK2PE2UK2H2DPK2UBCJK.3|.5KPLSK.2KPGK2.2K.KRKA2HNUECGK.KHM2K2D2QK.4|.4KNF2K.K2TKEPK.3KJUK2CNKUE3JK2JMFPTJK2.5|.4KLD2K2UKTGEK.K.2KJRPKJMK2JE3K2TF2H2K.7|.3KMHECGKRTPE2PKUK2HNRNK2GHKUGE2NTPNREGFK.6|.2KNLK2GDKHQP3ASK.KGUKPK2GK.KJEJHNKPH2EFLK.5|.2KLQK.KHCJKTKMQK.KMK2.K.KPK.KPG2H2NTPH2GMK.5|.KLFK.K2JGCMUSN2K3MPJK.K3.K3PFGH2NK2HJNCK.4|.2KPK2TKNLBAKSRHDGKQPJK2S2K2JEKTLGHGHK.K2M2K.4|.3KNQTKNMDK2RMGAFMSKE2KU3KJEJRTF2HGPK.KBMK.4|.2KMFKT3K3THDBGFMK2J2KU2SK2EKR2MFH2GNK2QLGK.3|.2KLFK3UTR2NHGFBFPUBDJKTKRK.KCQTQLFH2GMUKL2EK.2|.3K2.3K2UNG2F3KRTFBFLTKTUKGC2KRNFGJHGK2JHTK.2|.9KUGH2GMPK2QFB2FTK2UNGADK2RL2KHFHK2MK.3|.8KRKGHM2FK.KRLAGQK.KSKHDPUK2TMGKH2QRK.4|.7KTRKH3NFMK2TMGNTK.KQ2NGKTK2UMFKQJPK.5|.6KU2K2H2NLFMK2PKHM2K3RK2PL2PN2PFHK4.5|.6KUK.KHNPFM2KULK2FL3KUK2FADPM2PNFK.KTK.4|.6KRK2JNTPFLMKTFHLFL3K4FADNLMKQLK2GK.5|.6KPJ2HU2PF2NM2H2FGKL2K2RK2FGMLMKTQK2FNK.4|.5KNHK2T2SRMFKL2SHFNKLKTK4G2PMRUK3PFNK.4|.5KJEK2UK3PNM3PHGMK2MK2T2K2FRK3.2KSFPK.4|.5KMEJSK.3KRKM2PLHK.KMK2TU2KFPK.5KMK.5|.5KFGJUK.4KTK2PFHK.2K2UK2UKBLK.5KUK.5|.5KMPHQK.5K.KTEMK.4K.2K2LK.6K2.6|.6KUHNK.7KMAFK.3KSK.2KFLK.4KSK.6|.7KNMQK.5KUK2MK.4K.2K2GHPK.4K.7|.7KQLFK.5KUMENK.6KTPHGMK.12|.8KMLK.4KUPGCMK.6KULGFLK.12|.9KUK.4KUMJGMK.6KTM2F2K.12|.10K.6K5.8K5.13",
    },
    zaqua: {
      p: {
        M: "#333b75",
        L: "#384f93",
        C: "#6b9bbc",
        G: "#406ca5",
        F: "#4b76ad",
        A: "#79bcd5",
        E: "#7b778e",
        D: "#3499d4",
        B: "#3bbcf4",
        N: "#20447a",
        S: "#171f4c",
        J: "#2962a6",
        U: "#07020c",
        T: "#111130",
        H: "#2b7dc9",
        P: "#20306c",
        R: "#25235e",
        Q: "#212479",
      },
      r: ".48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.48|.20K3.25|.12K.6KMLCK.24|.11KGK2.3KFA2CEK.23|.11KDBNK.KLA4LSK.22|.11KJBADK2CACACESK.22|.12KDAFLUFCE4MK.22|.12KJCTULE6CEK4.18|.11K2UGHLCLMEAE2FCA3EK.17|.8K.KGSTNHCFPTE2AMLCACMESK.16|.7KJK2JKTGCFGMSE3SMLFC2SK.17|.6KSJHK3UFGM2STRMT4SMC2K.2K.14|.6KGUGK.2KFMLNRME2LT2QPRMACK2UK4.10|.6KLJHK.KFL3N2LE3URQL2TLFCF2C3FK.9|.7KHNK.KLSEMFSEC2NKNLELRSRULK4GFK.8|.8K2.3KTNJSMLFGM2NLM2SUFK2.4K2GK.7|.7KTSK.2KJHNSLGM2FLRP4TF2K2.4KLTK.6|.5K2TJHSK3A2MKRNSPNPKUCFMSMC2UK3.2K2.K2.4|.4KJDHJA2HNJFAPUK2MRUK2UMACSLGC2AGUK.2K2ULK2.2|.3KDHJDNHA2HJ2CK2TQM2QK2S2EACMLFC3FSK2CACA2PK.|.3KJDHJTFGA3NSK2UQM2RKTM2LCGKLGFCFC2A2C2DBABTK|.3KJDHSFCBDAHLK3URL2K2UL2SFR3MLF2DCACDFCDBATK|.3KJBD2ADPNHKQ2UPSKE2RKSPGSTPMU2SLF3C3HFCBATK|.3KJDHJBDJHPUKQTKS2R2LMLTLNTRMT2NRGTUPCAC3AFK.|.4KDHNBD2JK3SPSUKLMT2MPNFPSMS2CMLGU2GA2C3PK.|.4KH2JBHBK.2KSMT2KGKU2PLPG2TMRKSFL2K3A2CFLK.2|.5K2HDHBUK2URMR2K3RUPLN2FRSRT2LK2.KCACGPK.3|.6KH4UK2TRSM2K2R2KSLJS2RKRS2GFK.KACK3.4|.4K.KH4K.KTQTGLQR2KRTQ3TSMKR2K2.KFCTK2.5|.3KHKUH4K.KRKPCFQRQURTRQJ2M2KETK.KNBGK2JK.4|.2KBHK2DH3K2T2SMACTQ2KMRKRQHJLKEK.3KFNK2DK.4|.2KBJK2NLJLK.K2TPCASQ2TLMK2UJ2HULK.4KDNK2.5|.3KDNJ2UJHNK2QTPCALQSREMK2USJQJSK.5KJK.6|.4KD3UJDSK2QT2CAFQSRMRKQS2JQ2HPK3.3K.7|.5KTQUNJHKQLKUFADNTLETKQ2KTJQNH2PUK.10|.5K2LUJBGKLJK2FACNSCAMKQ2KUSJ4LRSK3.7|.4KNHLPLPK2JPK2RA2LNCARKQ3KUJ2HFH2D2NUK.6|.3KSHDHKMKRKDK.KUFCLSF2TK2Q2K4LJ2HD3GPK.5|.2KJBHJ2K3RLBK.KUF2LTGLSUKQ3K.KLJ3NJDBHNK.4|.KJBDPK2UK.KHK2.KUC2GMHGSUKQ3K.KLG2JTSLHB2NK.3|.KHBNK.2K.KJ2KQK2UFACGD2SUK2Q3KUNGF2LTLHB2NK.3|KJB2UK.4KDPKQ2K2NA2FD2KUK2QLNKSL2GFLKPDB2NK.3|KHB2UK.K4HK2Q2K2PCALDFK4Q2LKQLNLJLKHB2JK.4|KHB2SK2S2TKHNQRQ2RSMANFLKQ2KLQLJQN2LQNB3NK.5|KDB2HUKU2KUKLQUQ4MAPGKQ4JQLJGH2JRH3PK2.5|KUDB2JUSBK2.KSK2NQ2SDPGKNPQ2HNSTDH2DLUK2BHNK.4|.KUB3NPDK3.K2.K3UDGJTSLSKJNUQLKLSK2UKB2JK.4|.2KTB3JBNBNKJHK.2KNADPS2K4SJSUHJK2TNB2DUK.4|.3KUHB3DHDK3.3KSD2TRK2USTB2LJTU2JB3DPK.5|.4KU2DB2HBPTK.3KMGFNLJK2HB2D2HD2B4NUK.6|.5K2U2NB3HUK.2KLDHLK3HBAB3AB3TU2K2.7|.7K8.4K4.3K13.9",
    },
    zpisces: {
      p: {
        N: "#2a496b",
        R: "#14152c",
        H: "#3d6995",
        D: "#4e9cbd",
        G: "#4081a7",
        F: "#4f7cad",
        A: "#93c6da",
        J: "#4f578a",
        C: "#749fc5",
        Q: "#22264c",
        T: "#07010e",
        L: "#385789",
        E: "#717ca7",
        M: "#3e4074",
        U: "#030008",
        B: "#61bbd2",
        S: "#0a0614",
        P: "#26345d",
      },
      r: ".48|.21K.26|.12K.6K2NK.25|.10K2RK.4KHDGK.25|.9KFDNK.3KNDAJK.25|.8KCDFQTK2.KLC2QK.25|.7KQ2KJEMFJK2NAQNK.25|.6KRDRK3EFC2EC2UK.26|.7KQK.3K2FMEFQK.16K2.9|.8K.5KRJQNREK.7K8BNK.8|.7K3.4KQEKHBGK.5K2U3QGU2KBK.9|.6KNSNK.2KMEK.KFK.5KTNB2AB2D2GK3.8|.5KLDK2.2KSA2UK.K.6KB2AB5A2B2RK.7|.5KNK.3K2JE2K.8KNAB3D4B2HBLNK.6|.4KLBK.2KJAFEK.8KNAB2D2GHG2D2UFD2NK.5|.4KGDK.2KPCAEK.8KBABD2G2DGH3RKF2DHK2.3|.4KDNK.2KHCEAMK.3K.2KHAB3CDH2GHNKNTMHDBP2K.2|.3KSDHK.2KECERK.3KUK3PDBDQG3HRST2KUQPHFMK.3|.4KAK.2KPJCEK.3KND2FRQGBGQHGD2NU2K.K2RMHFLK.2|.5KJK.KJEFEK.2KGBD3HRSHGHQBD3PTK.3KRMFAPK.|.5KNQKJE3QK.KNCDFDC2LT2K2LD3GHSK.4K2LBRK.|.6K2QERUJQK2UD2JH2C2FQHLP2GHG3LK.5KMHDK.|.6KPEK2RM2K2TDGMLMHFLP2QPNH2GD2GK.5KQMBK.|.7K2.KQPJK2RBKEJE2FPQU2RL2HG2DLSK.4KRMFTK|.9KSPMLK2GPRMJM2DN2HNT3HNHGHK.6KPMK.|.10KM2AK2NRUJMJPDKNHGLQ2RG2S2QK.5KPHDK|.10KM2AJK3USJMSDQRN2PSTRGNRSTK.5KPHBK|.11KMJCSK3SR2SHQS3R2MKHDPQK.6KPLGK|.7K2.KRQTEJKTKJCEKJTRBAEFCHDBSK.7KMPTK|.6KNDK2SKPJE2KNKCJMKTEA3EHDCSRK.7KL2UK|.5KLHNK2RPJLHMJEKCMEHQCA3PSGCHRPK.5KTNHUK|.5KGLK.KRQK2QRHELKJC2N2EA2RULD2K2.6KTNHUK|.4KD2K.2KRQKRTPLM3JLMPRJEACNUK2.9KMLK.|.3KDBLK.2KRQK3TQPN2PNPK2TEABQJRTK.7KSNFK.|.3KHBFK.3KMK.2K2LF2NPKPGBQALRE2URK.6KRPLK.|.2KNFDFPK.2KMK.3KMHGMPSDB2NCQSAEFJK2.5KMQK.2|.2KGF2DHUK.KPK5PNHP2RGDBGACEAMRCQTK.4KLPK.2|.KTGBLABHTK2Q2RSP2HFLHTQN2B2CA3ERACLSK.3KHK.3|.2KHBCB2DFGRJDFLHGLJ2KQJNMGB4CKFBA2BRK.2KQK.3|.2KLCB2DND2MECF2QAJE2JPQM2LDBAC2K2B2ANRK.KPSK.3|.2KTUABDMC2HCBFNTEJA2JQE2JRDGECHSD3FHRK3NK.K.2|.3K2QHDBA2CDHR2C2KFCEQPEAEP2QEFNKLFLFBUPNK3NK.|.5KQPHCEFMKURHFJLEMKUQJER2CSJF2MHDLDSK3HK2.2|.6KUQLMKPKURPLQKJPKURP2RPAT2GDHKDEDNSK.KDK.2|.7KU2T3SK2TRP2K3NSKQLKAKUKDGMDAMARK.2K2.2|.8K3TMJPRTK2Q2K2GNTQ2KETK2D2FA2LARK.2KNK.|.2K.K.5KRH2MPKUK3QK2RKUK.K2.KD3BADBRK.KDK.2|.KRKHK.K3SLFLP2U3KQNPK3UK.2K2ND2ABCBHK.KGK.3|KUDPDK2GBQTLFMQRUKUKQNMRTK2.2KQLHDBA2FGQK2GK.4|.KLDKT2LAGTPJMRUK.KUKPEGUK.2KRG2D2AFCHUK.2K.5|.2K2HUHBDBFSMPTUK3TKMAGRUK.KNDGCAF2HTK.9|.4KTPLPACNU2PNKPKTKMLHLK.KFD2FC2FJPK.6K2.2|.4KTK2SAEHT2K3MPTUM2L2K2HFDCQLF2QTK.3K3LGK.|.5K.KUTRUK2.KPMPSUKJKQRF5U3K3.2K2ST2RK.2|.8K3T2K.2KNSK2TK.KQGDCEUBNK.4KTGBTKBSK.|.4K.6K2.3K2QP2TK.KQDBDHGBGFK5PD2FBGK.2|.3KTK.2K.5K2PNQPLRK.KPGFLHDBHNTPQP2DBDB2K.3|.2KSKRK2QK3.KURPNRPHNPKLNLH3FBGRSLHB3DFBK.4|.2KQACMKUB2GK2U3GFGFNQPLFPF4CDHDBDB3DUTK.4|.3KPBGK2RDB2A2F3DF2JQP2HR3D2MFCABDSR3K2.5|.4KPLNK2QHBAD2C2ACDPSKRPTK2NDFLHPNLHSK2.7|.5KN2K2TQBDHFA2CHNRTQPMRK.KNP2CTKQDKNK.7|.6K2.2K5LD2FQTK4MPK.KTUKBPK3.K.8|.15K6.4K2.3K2.K2.13",
    },
    zophi: {
      p: {
        S: "#060510",
        H: "#3e2166",
        M: "#310f53",
        N: "#170e2a",
        U: "#02020a",
        B: "#95565f",
        G: "#571e7d",
        E: "#8423a4",
        J: "#2b203d",
        D: "#453350",
        R: "#070611",
        C: "#803a7f",
        T: "#05030e",
        L: "#521280",
        A: "#d38a57",
        F: "#6b1f8e",
        P: "#0f071e",
        Q: "#080813",
      },
      r: ".9K3.26K2.8|.8KSHMK3.3K.5K.5K2.3K3HNK.7|.8KSKH2NUK.KBK3.KGK.K3BEK.KNJHKNK.7|.9KSHDHMK3BGD2K2BUKBRBCHK2SBGDTK.8|.10KTKDNKELJBDAKNBTKAJANGK2SH2K2.9|.10KTK2JKULTBA2KMATKABCMFKPKDKTK.9|.10K3.K.K4A4CA4PK2.K.K2TK2.8|.9KS2UK2.5KNH5K3.4K2TRS2K.7|.9KQ2LMNK2.3K2H2CGHDK.3K2PL2ST2K.7|.8KTJ3L2RTK.KSK2H2NPUMK.KSNELJ4K.7|.8KNJ2NHMK2.K2QDAKJAKUJK2QK2HNJDHJQK.6|.7KJHDK2RQK3QT2K2DGDK2SPN2K2RKJ4MK.6|.5K2LKD2K2NST2K2TK3D3K2SM3STUKJ3KEK2.5|.4KTMEHKJK6NHRKUKD2JUK2MKSK3.KDJEGEHK.4|.4KSMHFLK2HK.KPTMNKRJE2HRKTK2UK2.KJDKFL2NK2.3|.4KLN2JLK.K.KD2K2HR2KCEGKSTKUKJDK2DKHQM2PMRK.2|.3KF2MK2LK2.3K2.K2RK2AEGKTKTK2JH2QNHSTP3HFK.2|.3KFK4NHSK.K2.KSK3A2DGK3QK.KH2JKH2RUK3EK.2|.4K.KTRUPK.KDNK.K.KBA2BJPK2JK2D2K2.K2RSK.2K.3|.7K2UK.3KD2K.KDA2EA2BK.K.KDK.K2SP2K.7|.8KMK.3KNBK.KPBA3DNK.K2BK.KQ2KLHK.7|.7KPHK2.2KTJDK2TJA2DJTK2QJDK2.K3LFJK2.5|.7KHKD2K3BK3RK2JATKSK2BK3DK.3K3HMK.4|.4K4D2K3BAB2K.K.2KJKMPK.KBDKD2K.2K2QNK.K.3|.3KRN2K3.K2DNRK.KPK2GKEKSK.KBDNDJK3DBK4RK.2|.3KJMHK2.KBDST2K.2K.KEBFKTJK.KSUTPJ3DADJ2NKSK.|.2KPHK2DJKSUT3KDK.K3LCK2RKHK.KTSKT2RTK2JM2UK.2|.3K2ST2NSK3S2K2DKT2K2GK4HK.KT2K5SUTSNK.3|.3KURPNUQK.K2QK.KMUTKH2MNTK2.2KTSK.3KU2JKQSK.2|.4KQK2UK.KQRSJK2MQRKHCKU2K4QS2K.2K.KRJBK2.3|.4KLK.KDK2STNE2K5HCP3UHEGHUTSK2DK.KPNPK.3|.4KNGK.K.2KTNFECKTQKHMKJN2HCGD2RSQNK.3KCPTK.2|.5KHK.4KPHCBHTUTUKAJNSJHCBGHQSTK.4KEMUK.2|.4KCPK.4KNFCGMTUKSCAPK2TMC2FMST2K.3KTKFK.3|.5KQK.3KQPFCFHSRK2HMK.KSMFBFHPQTK.3KTJK.4|.4KTSK.3KUMFBFMS2K2M2K2QRNLEFLMQSUK.3KHFK.3|.5KSK.K2RSGEBFPTK.KADK.KUTLC2LMTU2K.K.KSK.4|.4KSDK2AKSNFE2GTK.2KCLK3TQLECLMRSK3AK3.5|.4KTB2DA2DMLBCMRK.KHBFKUK2RME2FMNSDA2DB2K.5|.4KRKABA2JLFC2PQK.KHBGKUK2SMEBLM2TBA2DABK.5|.4KSJA3BPFBEGUTK3LAFHSK.KMEBL2K2DAKA2BK.5|.4KSQK3NTLB2DUK2SKGEFKSK.KMEGDK.KSK3QK.6|.4KUK2ADKUGDLMK3TKFAEFK.2KPMFGMKSND2ADPK.5|.4KUKB2JPKLFLPKDKUKEAEGK.2KTMEGHMKDNDADNK.5|.5KAD2PTKHL2UKDKUKCAFKUK.2KMEH2K2JUJBD2K.5|.6KBDPTKMFLRK3TKEAFLUK.2KMLDK.KT2NBD2K.5|.6KBJK2.KENPK.2K2EAFKUK.2K2MEK.2KSJBHDK.5|.6KD2K.KLFTK.3K2EBEHS2K2LNMEK.2KUMHDK.6|.6KCTUK.KEUK2.KUKEALHQS2K2UMEK.3KBDUK.6|.6K3SK2EMPKHK2TKCAFHPT2KFKSFEK.2KUK2.7|.5KLK.K2FLNPD2K.K2CABHU2K.K2SJEK.3K.2K.6|.4KHGK.2KELQNHDK2UGBAEKU2TKGK2RFLK.4KMK.5|.4KGDK.KFMQ2JGHK.KHBAFHT2SKGK2UNLK.4KHMK.4|.3KGHK.2KFPQSKLHK2NLCAEHKPRK2.KUTHFK.4KFMK.3|.2KC2DK.KLHQK2SKHKRSLCAFKENRSK.KS2PEK.2K2BGHUK.2|.KMEGBK2FLUK.KSPK2MLMGENKENKQK2S3TMEK2DK2AFHK.2|.2KMNFEKFNR2KR2K2TLHML2HKEGKSK2TK2RPK3B2D2MNTK.|.3KPKGCGK3.K3.KEHNL2KQEFK4RK.K2NGBCDNSK3.2|.4KTMEJK.4KSK2ECTHLKMFLK2SK2SK.KNFALSK2.5|.5KNEJK.3KT2KDAFPMHQLCBK3.KSK.2KECNK.7|.6KFHK.4K3JALMQKSFB2KRK.KSK.2KEMK.8|.6KJK.7KJBMLK.KLFBK2.3K.3KFSK.8|.7K.8KTEK2.3KEHK.9K2.9|.17K2.6K2.21",
    },
  };
  Object.keys(Z48).forEach((k) => {
    const d = Z48[k],
      rows = d.r
        .split("|")
        .map((r) => r.replace(/(.)(\d*)/g, (_, c, n) => c.repeat(n ? +n : 1))),
      alt = [".".repeat(48), ...rows.slice(0, 38), ...rows.slice(39)],
      p = { K: "#0c0610", ...d.p };
    SP[k + "M"] = { p, m: rows, a: [rows, alt], nat: 1 };
    SP[k + "ML"] = { p, m: rows, a: [rows, alt], nat: 1 };
  });

  // spr() lama menganggap sprite battle selalu 32x32 dikali skala e.s. Untuk sprite "nat" (96x128)
  // kita gambar di skala 1 dan rata-bawah/tengah pada kotak 32*s x 32*s milik musuh (e.s = 3 -> lebar 96).
  {
    const _spr = spr;
    spr = function (k, x, y, s, al, tint, fr, fl, mm) {
      const o = SP[k];
      if (!o || !o.nat) return _spr(k, x, y, s, al, tint, fr, fl, mm);
      const m = mm || o.m,
        z = o.z || 1,
        w = m[0].length * z,
        h = m.length * z;
      return _spr(
        k,
        x + (32 * s - w) / 2,
        y + 32 * s - h,
        z,
        al,
        tint,
        fr,
        fl,
        mm,
      );
    };
    // suara monster memakai kunci lama (zaries), bukan zariesB
    if (SND && SND.mon) {
      const _mon = SND.mon;
      SND.mon = function (k, ...a) {
        return _mon.call(
          SND,
          typeof k === "string" ? k.replace(/^(z[a-z]+)B$/, "$1") : k,
          ...a,
        );
      };
    }
  }

  /* ===================== MONSTER ===================== */
  const EI = { boss: [], oph: -1, minions: {} },
    BOSSES = new Set(),
    MT = [
      { sp: "dknight", pre: "Ksatria Iblis", hp: 1, atk: 1 },
      { sp: "gargoyle", pre: "Gargoyle", hp: 0.95, atk: 0.97 },
      { sp: "demon", pre: "Iblis", hp: 0.85, atk: 0.95 },
      { sp: "hound", pre: "Anjing Neraka", hp: 0.8, atk: 1.02 },
    ];
  SIGNS.forEach((sg, i) => {
    const f = i + 1;
    EI.boss.push(E.length);
    BOSSES.add(E.length);
    E.push({
      sp: sg.k + "B", // sprite battle 96x128
      n: sg.t,
      hp: Math.round(1000 + i * 85),
      atk: Math.round(40 + i * 1.7),
      topics: ALL,
      weak: sg.weak,
      d: [4, 5],
      s: 6, // 32*6 = 192 px lebar kotak musuh (sprite 96x128 diperbesar 2x)
      xp: 450 + i * 55,
      coin: 700 + i * 90,
      bg: ELM[sg.el].bg,
      intro: sg.intro,
      win: sg.win,
      ...sg.at,
    });
    EI.minions[f] = [];
    if (!MINIONS) return;
    const u = i / 11;
    for (let k = 0; k < 4; k++) {
      const m = MT[(f + k) % 4],
        b =
          E.find((e) => e.sp === m.sp) ||
          E.find((e) => e.sp === "demon") ||
          E[0];
      EI.minions[f].push(E.length);
      E.push({
        ...b,
        n: `${m.pre} ${sg.n}`,
        hp: Math.round(((620 + 520 * u) * m.hp) / 5) * 5,
        atk: Math.round((33 + 16 * u) * m.atk),
        xp: Math.round(130 + 150 * u),
        coin: Math.round(110 + 150 * u),
        d: [4, 5],
        bg: ELM[sg.el].bg,
        intro: `${m.pre} ${sg.n} menghadang di lantai ${f} Istana Zodiak. Jawab dengan benar untuk lolos!`,
        win: `${m.pre} ${sg.n} tumbang. Lorong di depan terbuka lagi.`,
      });
    }
  });
  EI.oph = E.length;
  BOSSES.add(E.length);
  E.push({
    sp: "zophiB", // sprite battle 96x128
    n: "Raja Iblis Ophiuchus",
    hp: 3200,
    atk: 68,
    topics: ALL,
    weak: "alj",
    d: [5, 5],
    s: 6,
    xp: 3000,
    coin: 6000,
    bg: ["#0c0418", "#4a1a8a", "#08020f", "#ffd24a"],
    intro: OPHI.intro,
    win: OPHI.win,
    ...R_("dark", 5, "#a24dff"),
  });

  /* ===================== PETA ===================== */
  const ID = (f) => "ZF" + f,
    FLR = {}; // id peta -> { f, foes }
  const grid = (w, h) => {
    const g = Array.from({ length: h }, () => Array(w).fill("."));
    for (let x = 0; x < w; x++) g[0][x] = g[h - 1][x] = "#";
    for (let y = 0; y < h; y++) g[y][0] = g[y][w - 1] = "#";
    return g;
  };
  const setc = (g, x, y, c) => {
    if (g[y] && g[y][x] === ".") g[y][x] = c;
  };

  // titik gerbang di aula takhta Kastil Raja Iblis (dekat Peri Cahaya)
  const dk = EN.O.find((e) => e.t === "foe" && E[e.i] && E[e.i].sp === "dking");
  let GX = 0,
    GY = 0;
  if (dk) {
    GX = dk.x + 2;
    GY = dk.y - 3;
    const r = MP.O.g[GY];
    MP.O.g[GY] = r.slice(0, GX) + "." + r.slice(GX + 1);
    EN.O.push({
      t: "portal",
      x: GX,
      y: GY,
      to: ID(1),
      tx: CX,
      ty: FH - 3,
      f: [0, -1],
      zgate: 1,
      on: () => !!F.zodiakOpen,
    });
  } else
    console.warn(
      "[istana] Raja Iblis lama tidak ditemukan; gerbang tidak dipasang.",
    );

  const chestAt = (id, x, y, f, o) => ({
    t: "chest",
    id,
    x,
    y,
    coin: 420 + f * 45,
    ...o,
  });

  SIGNS.forEach((sg, i) => {
    const f = i + 1,
      id = ID(f),
      w = FW,
      h = FH,
      g = grid(w, h),
      odd = f % 2 === 1,
      L = [2, 3, 4],
      Rr = [w - 5, w - 4, w - 3],
      wall = (y, gap) => {
        for (let x = 1; x < w - 1; x++) g[y][x] = gap.includes(x) ? "." : "#";
      };
    wall(22, odd ? L : Rr);
    wall(16, odd ? Rr : L);
    wall(10, odd ? L : Rr);
    wall(5, [CX]);
    for (let y = 1; y <= 4; y++)
      for (let x = 1; x < w - 1; x++) if (Math.abs(x - CX) >= 3) g[y][x] = "#";
    [
      [5, 24],
      [19, 24],
      [5, 26],
      [19, 26],
      [6, 18],
      [18, 18],
      [6, 20],
      [18, 20],
      [6, 12],
      [18, 12],
      [6, 14],
      [18, 14],
      [5, 7],
      [19, 7],
      [9, 8],
      [15, 8],
    ].forEach(([x, y]) => setc(g, x, y, "Y"));
    [
      [CX - 2, 6],
      [CX + 2, 6],
      [CX - 2, 2],
      [CX + 2, 2],
    ].forEach(([x, y]) => setc(g, x, y, "y"));
    for (let y = 1; y <= 27; y++)
      if ((y <= 5 || (y >= 6 && y <= 9) || y >= 23) && g[y][CX] === ".")
        g[y][CX] = "1";
    g[5][CX] = "1";

    const ents = [
      {
        t: "portal",
        x: CX,
        y: h - 2,
        stair: "dn",
        ...(f === 1
          ? { to: "O", tx: GX, ty: GY + 1, f: [0, 1] }
          : { to: ID(f - 1), tx: CX, ty: 2, f: [0, 1] }),
      },
      {
        t: "portal",
        x: CX,
        y: 1,
        stair: "up",
        ...(f === 12
          ? { to: "ZT", tx: 10, ty: TH_ - 3, f: [0, -1] }
          : { to: ID(f + 1), tx: CX, ty: h - 3, f: [0, -1] }),
      },
      { t: "crystal", x: 17, y: 7 },
      chestAt(`zc${f}a`, odd ? 23 : 1, 18, f, { po: 1, fp: f % 2 }),
      chestAt(`zc${f}b`, odd ? 1 : 23, 13, f, {
        po: 1,
        sc: f % 3 === 0 ? 1 : 0,
      }),
      { t: "npc", id: "zn" + f, x: CX + 3, y: 25, sp: "prajurit" },
      { t: "foe", i: EI.boss[i], x: CX, y: 5, sp: sg.k + "M", big: 1 },
    ];
    const mi = EI.minions[f];
    if (mi.length) {
      const spots = [
        [CX, 19],
        [8, 13],
        [16, 13],
        [CX, 7],
      ];
      mi.forEach((idx, k) =>
        ents.push({
          t: "foe",
          i: idx,
          x: spots[k][0],
          y: spots[k][1],
          sp: E[idx].sp,
        }),
      );
    }
    N["zn" + f] = () =>
      dlg(sg.who, [
        ...sg.say,
        `Penjaga lantai ini: ${sg.t}. Ia lemah terhadap ${TN[sg.weak]}.`,
      ]);

    MP[id] = { th: ELM[sg.el].th, w, h, g: g.map((r) => r.join("")) };
    EN[id] = ents;
    MN[id] = `Istana Zodiak · Lt.${f} ${sg.n}`;
    FLR[id] = { f, foes: mi.slice(), sg };
  });

  // aula takhta Ophiuchus
  {
    const w = TW,
      h = TH_,
      g = grid(w, h);
    [
      [3, 5],
      [17, 5],
      [3, 9],
      [17, 9],
      [3, 13],
      [17, 13],
      [7, 7],
      [13, 7],
    ].forEach(([x, y]) => setc(g, x, y, "Y"));
    [
      [8, 2],
      [12, 2],
      [2, 16],
      [18, 16],
      [6, 16],
      [14, 16],
    ].forEach(([x, y]) => setc(g, x, y, "y"));
    for (let y = 1; y <= 17; y++) if (g[y][10] === ".") g[y][10] = "1";
    MP.ZT = { th: "zt", w, h, g: g.map((r) => r.join("")) };
    EN.ZT = [
      {
        t: "portal",
        x: 10,
        y: h - 2,
        stair: "dn",
        to: ID(12),
        tx: CX,
        ty: 2,
        f: [0, 1],
      },
      { t: "crystal", x: 4, y: 15 },
      { t: "foe", i: EI.oph, x: 10, y: 4, sp: "zophiM", big: 1 },
      ...[
        [2, 2],
        [18, 2],
        [2, 8],
      ].map(([x, y], k) => ({
        ...chestAt("zt" + k, x, y, 12, { po: 1, fp: 1, sc: k === 2 ? 1 : 0 }),
        coin: 1500 + k * 500,
        on: () => !!F.done[EI.oph],
      })),
    ];
    MN.ZT = "Aula Raja Iblis Ophiuchus";
  }
  const ZMAP = (id) => id === "ZT" || !!FLR[id];

  /* ===================== TAMPILAN PETAK ===================== */
  TILEX += "Yy1";
  {
    const _tx = tileX;
    tileX = function (c, X, Y, x, y, th, t) {
      if (!"Yy1".includes(c) || !ACC[th]) return _tx(c, X, Y, x, y, th, t);
      const fl = (col, a, b, ww, hh) => {
          ctx.fillStyle = col;
          ctx.fillRect(X + a, Y + b, ww, hh);
        },
        ac = ACC[th];
      if (c === "Y") {
        fl("rgba(0,0,0,.3)", 1, 14, 15, 2);
        fl("#3e3a56", 2, 12, 12, 3);
        fl("#6e6a90", 4, 3, 8, 10);
        fl("#a8a4cc", 4, 3, 3, 10);
        fl("#4a4668", 10, 3, 2, 10);
        fl(ac, 3, 1, 10, 3);
        fl("rgba(255,255,255,.35)", 3, 1, 10, 1);
        fl(ac, 3, 12, 10, 1);
      } else if (c === "y") {
        fl("rgba(0,0,0,.3)", 3, 14, 11, 2);
        fl("#14101e", 5, 12, 6, 3);
        fl("#2a2638", 4, 9, 8, 4);
        fl("#4a4660", 3, 8, 10, 2);
        const k = rm ? 0 : Math.round(Math.sin(t / 110 + x * 2)),
          hh = 4 + k;
        ctx.globalAlpha = 0.18 + (rm ? 0 : 0.08 * Math.sin(t / 200 + x));
        fl(ac, -3, -3, 22, 22);
        ctx.globalAlpha = 1;
        fl(ac, 5, 8 - hh, 6, hh);
        fl("#fff3c0", 6, 8 - hh + 2, 4, hh - 2);
        fl(ac, 7, 8 - hh - 2, 2, 2);
      } else {
        fl(CAR[th], 2, 0, 12, 16);
        fl("#e2b84a", 2, 0, 1, 16);
        fl("#e2b84a", 13, 0, 1, 16);
        fl("rgba(0,0,0,.2)", 3, 0, 1, 16);
        fl("rgba(255,255,255,.12)", 5, (y % 2) * 8, 6, 3);
        fl("#e2b84a", 7, 4 + (y % 2) * 8, 2, 2);
      }
    };
    const _bd = baseDeco;
    baseDeco = function (th, X, Y, x, y) {
      if (!ACC[th]) return _bd(th, X, Y, x, y);
      ctx.fillStyle = "rgba(0,0,0,.12)";
      ctx.fillRect(X, Y + 15, 16, 1);
      ctx.fillRect(X + 15, Y, 1, 16);
      if ((x * 7 + y * 11) % 17 === 0) {
        ctx.globalAlpha = rm
          ? 0.5
          : 0.25 + 0.3 * Math.sin(performance.now() / 500 + x * 3 + y);
        ctx.fillStyle = ACC[th];
        ctx.fillRect(X + 4 + ((x * 3) % 7), Y + 5 + ((y * 5) % 6), 2, 2);
        ctx.globalAlpha = 1;
      }
    };
    const _solid = solid;
    solid = (x, y) =>
      _solid(x, y) ||
      (ZMAP(mp) && "Yy".includes((MP[mp].g[y] || "")[x] || " "));
  }

  /* ===== bos dan Ophiuchus digambar besar di peta; gerbang istana digambar khusus ===== */
  {
    const _ent = ent;
    ent = function (e, t, bob) {
      const X = e.x * 16,
        Y = e.y * 16 + OY;
      if (e.zgate) {
        ctx.globalAlpha = 0.16 + (rm ? 0 : 0.1 * Math.sin(t / 260));
        ctx.fillStyle = "#a24dff";
        ctx.fillRect(X - 4, Y - 4, 24, 24);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#0a0414";
        ctx.fillRect(X + 1, Y, 14, 16);
        ctx.fillStyle = "#e2b84a";
        ctx.fillRect(X, Y, 16, 2);
        ctx.fillRect(X, Y, 2, 16);
        ctx.fillRect(X + 14, Y, 2, 16);
        ctx.fillStyle = "#a24dff";
        for (let i = 0; i < 6; i++) {
          const a = (rm ? 0 : t / 320) + i * 1.05,
            r = 2 + (i % 3) * 1.7;
          ctx.fillRect(
            Math.round(X + 8 + Math.cos(a) * r * 1.5),
            Math.round(Y + 9 + Math.sin(a) * r * 2),
            2,
            2,
          );
        }
        ctx.fillStyle = "#ffd24a";
        ctx.fillRect(X + 7, Y + 7, 2, 2);
        return;
      }
      if (e.big && e.t === "foe") {
        const s = e.big,
          so = SP[e.sp + "L"],
          fm = so.a[rm ? 0 : (Math.floor(t / 420) + e.x) % 2];
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.3;
        ctx.fillRect(X - 6 * s, Y + 13, 12 + 16 * s, 3);
        ctx.globalAlpha = 1;
        spr(
          e.sp + "L",
          X + 8 - 16 * s,
          Y + 16 - 32 * s + bob,
          s,
          1,
          null,
          0,
          0,
          fm,
        );
        return;
      }
      _ent(e, t, bob);
    };
  }

  /* ===================== MUSIK ===================== */
  {
    const _m = SND.music;
    SND.music = function (n) {
      return _m.call(SND, n === "ZT" ? "boss" : FLR[n] ? "Z" : n);
    };
    const _st = start;
    start = function (i) {
      _st(i);
      if (BOSSES.has(i)) SND.music("boss");
    };
  }

  /* ===================== QUEST & CERITA ===================== */
  EQ.ophisword = {
    n: "Pedang Ophiuchus",
    s: "w",
    atk: 22,
    pen: 8,
    fist: "#c99aff",
    sw: "#efe0ff",
  };
  const nBoss = () => EI.boss.filter((i) => F.done[i]).length;
  QS.push({
    id: "zodiak",
    n: "Istana Zodiak",
    d: "Masuki gerbang di aula takhta Kastil Raja Iblis, naiki 12 lantai yang dijaga 12 bintang zodiak, lalu kalahkan Raja Iblis Ophiuchus di puncaknya.",
    gp: 400,
    coin: 6000,
    it: "ophisword",
    on: () => !!F.zodiakOpen,
    chk: () => F.zodiakOk,
    pr: () =>
      F.done[EI.oph]
        ? "Raja Iblis sudah kalah. Kembali ke Guild"
        : `Penjaga zodiak ${nBoss()}/12 dikalahkan`,
  });

  // Peri Cahaya membuka gerbang Istana Zodiak
  {
    const _peri = N.peri;
    const reveal = [
      "Tapi tunggu. Raja Iblis Tak Hingga hanyalah bayangan dari penguasa yang sebenarnya.",
      "Di balik aula ini terbuka gerbang menuju Istana Zodiak. Dua belas lantai dijaga dua belas bintang, dan di puncaknya duduk Ophiuchus, bintang ketiga belas yang dibuang dari langit.",
      "Gerbangnya sudah bercahaya di dekatku. Isi penuh HP dan Manamu, lalu naiklah, Penjaga Angka.",
    ];
    N.peri = () => {
      if (!F.iblisOk) {
        F.iblisOk = F.zodiakOpen = 1;
        SND.sfx("win");
        return dlg(
          "Peri Cahaya",
          [
            "Kamu mengalahkan Raja Iblis Tak Hingga! Sudah ratusan tahun angka-angka di benua ini terkurung di mahkotanya.",
            "Lihat, cahaya mulai kembali ke tanah ini. Terima kasih, Penjaga Angka.",
            ...reveal,
            "Setelah itu, kembalilah ke Guild dan klaim hadiahmu di Papan Quest.",
          ],
          () => {
            hud();
            idle();
            say(
              "Gerbang Istana Zodiak terbuka di aula takhta. Klaim juga hadiah 'Benua Iblis' di Papan Quest.",
            );
          },
        );
      }
      if (!F.zodiakOpen) {
        F.zodiakOpen = 1;
        SND.sfx("quest");
        return dlg("Peri Cahaya", reveal, () => {
          hud();
          idle();
          say("Gerbang Istana Zodiak terbuka di aula takhta, di dekat Peri.");
        });
      }
      if (F.zodiakOk)
        return dlg("Peri Cahaya", [
          "Ophiuchus sudah tiada. Bintang-bintang kembali ke tempatnya, dan angka-angka kembali bernyanyi.",
        ]);
      dlg("Peri Cahaya", [
        "Gerbang Istana Zodiak ada di dekat sini. Dua belas lantai, dua belas penjaga. Kristal di tiap lantai bisa memulihkanmu.",
      ]);
    };
  }

  /* ===================== PERILAKU ===================== */
  {
    // monster biasa muncul lagi tiap masuk lantai; info lantai
    const _p = H.portal;
    H.portal = (e) => {
      const m = FLR[e.to];
      if (m) m.foes.forEach((i) => delete F.done[i]);
      _p(e);
      if (m)
        say(
          `Istana Zodiak · Lantai ${m.f}/12. Penjaga: ${m.sg.t}. Lemah terhadap ${TN[m.sg.weak]}.`,
        );
      else if (e.to === "ZT")
        say(
          "Aula Raja Iblis Ophiuchus. Isi penuh HP dan Manamu di kristal sebelum maju.",
        );
    };
    // hadiah tambahan dari bos
    const _w = win;
    win = function () {
      _w();
      if (!S || !BOSSES.has(S.i)) return;
      const big = S.i === EI.oph;
      Pl.pot += big ? 5 : 2;
      Pl.fpot += big ? 3 : 1;
      const row = document.querySelector("#ui .card .row");
      if (row)
        row.insertAdjacentHTML(
          "beforebegin",
          `<div class="ok" style="margin-top:6px">Item jatuh: ${big ? 5 : 2} Ramuan HP, ${big ? 3 : 1} Ramuan Mana</div>`,
        );
    };
    // setelah Ophiuchus kalah
    const _bk = W.back;
    W.back = function (i) {
      _bk(i);
      if (i === EI.oph && !F.zodiakOk)
        dlg(
          "Peri Cahaya",
          [
            "Ophiuchus telah tumbang. Dua belas bintang kembali ke langit, dan bintang ketiga belas akhirnya dikenang, bukan dibuang.",
            "Terima kasih, Penjaga Angka. Kembalilah ke Guild dan klaim hadiah 'Istana Zodiak' di Papan Quest.",
          ],
          () => {
            F.zodiakOk = 1;
            SND.sfx("win");
            hud();
            idle();
            say(
              "Misi Istana Zodiak selesai. Klaim hadiahnya di Papan Quest Guild.",
            );
          },
        );
    };
  }
})();
