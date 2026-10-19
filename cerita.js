/* ===== Numeria Quest — Cerita NPC & Quest Rahasia =====
   Dimuat PALING AKHIR (setelah teleport.js), supaya membungkus H.npc versi terakhir.
   Cara kerja: setelah obrolan biasa dengan NPC bertanda cerita, muncul tombol untuk mendengar kisahnya.
   Kisah itu memicu quest rahasia yang tidak ada di Papan Quest; progres tampil di menu Misi (tombol M).
   - Desa Satuan: "Pecahan yang Terlupa" (Petani, Nelayan, Anak Desa, Rika) -> F.sec
   - Kota Bangun: "Jejak Sang Nol" (Kakek Penjual Peta memulai; 11 NPC menyimpan petunjuk, 8 dibutuhkan) -> F.kb
   - Kota Kerajaan: "Lagu yang Terlupa" (Pemain Musik memulai; 6 NPC kota, 4 nada dibutuhkan) -> F.lg
     lalu di Istana: "Rahasia Ruang Tahta" (Pelayan Istana; 6 NPC istana, 4 fakta dibutuhkan) -> F.rt
   - Kota Logaritma: "Kail Perak Sang Nelayan" (rantai 5 NPC + teka-teki pangkat; kota) -> F.lc
     lalu di Istana Logaritma: "Segel Vas Karang" (6 NPC istana + 3 soal logaritma) -> F.ly
   Menambah cerita NPC: tambahkan fungsi di STORY (kembalikan {label, lines, go} atau null),
   lalu tandai NPC-nya lewat TAG (Desa) atau tagK (Kota). Entitas t:"spot" = titik kilau yang bisa digali (punya use()). */
(function () {
  /* ---------- status ---------- */
  const sec = () => F.sec || (F.sec = { st: 0, sh: {}, ank: 0, rik: 0 }),
    kb = () => F.kb || (F.kb = { st: 0, cl: {}, h: {} }),
    nsh = () => Object.keys(sec().sh).length,
    lg = () => F.lg || (F.lg = { st: 0, nd: {}, h: {} }),
    rt = () => F.rt || (F.rt = { st: 0, cl: {} }),
    ncl = () => Object.keys(kb().cl).length,
    nnd = () => Object.keys(lg().nd).length,
    nfk = () => Object.keys(rt().cl).length,
    REQ = 8, // petunjuk minimal di Kota Bangun
    REQL = 4, // nada minimal di Kota Kerajaan
    REQR = 4, // fakta minimal di Istana
    REQY = 4; // petunjuk segel minimal di Istana Logaritma
  const lc = () => F.lc || (F.lc = { st: 0 }),
    ly = () => F.ly || (F.ly = { st: 0, cl: {} }),
    nly = () => Object.keys(ly().cl).length,
    segel = (k) => {
      ly().cl[k] = 1;
      SND.sfx("quest");
      return `Petunjuk segel bertambah (${nly()}/${REQY}${nly() > REQY ? "+" : ""}).`;
    };
  const give = (k) => {
      sec().sh[k] = 1;
      SND.sfx("quest");
      return `Kamu menerima Pecahan Aksioma (${nsh()}/3).`;
    },
    clue = (k) => {
      kb().cl[k] = 1;
      SND.sfx("quest");
      return `Petunjuk Nolan bertambah (${ncl()}/${REQ}${ncl() > REQ ? "+" : ""}).`;
    },
    nada = (k) => {
      lg().nd[k] = 1;
      SND.sfx("quest");
      return `Nada lagu bertambah (${nnd()}/${REQL}${nnd() > REQL ? "+" : ""}).`;
    },
    fakta = (k) => {
      rt().cl[k] = 1;
      SND.sfx("quest");
      return `Catatan sejarah bertambah (${nfk()}/${REQR}${nfk() > REQR ? "+" : ""}).`;
    };

  /* ---------- tandai NPC ---------- */
  const TAG = {
    Petani: "petani",
    "Nelayan Desa": "nelayan",
    "Anak Desa": "anak",
    "Rika (Petualang Rank D)": "rika",
  };
  EN.O.forEach((e) => {
    if (e.t === "npc" && e.d && TAG[e.d[0]] && e.x >= 13 && e.x < 33 && e.y < 11) e.story = TAG[e.d[0]];
  });
  /* Kota Bangun: petak x 0..43, y 10..41 pada peta besar */
  const inK = (e) => e.x < 44 && e.y >= 10 && e.y < 42,
    tagK = (key, f) => EN.O.forEach((e) => e.t === "npc" && inK(e) && f(e) && (e.story = key));
  const byName = (n) => (e) => e.d && e.d[0] === n,
    byId = (i) => (e) => e.id === i;
  tagK("kakek", byId("kakek"));
  tagK("penjaga", byId("penjaga"));
  tagK("seniman", byId("seniman"));
  tagK("pandai", byName("Pandai Besi"));
  tagK("sapu", byName("Tukang Sapu"));
  tagK("pembaca", byName("Pembaca Buku"));
  tagK("kebun", byName("Tukang Kebun"));
  tagK("anakK", byName("Anak Kota"));
  tagK("mira", byName("Mira (Penyihir Rank C)"));
  tagK("taro", byName("Taro (Pemanah Rank C)"));
  tagK("dax", byName("Dax (Pendekar Rank B)"));
  tagK("nyx", byName("Nyx (Pencuri Rank B)"));
  tagK("warga", byName("Warga Kota"));

  /* Kota Kerajaan: petak x 145..199, y 86..121 pada peta besar; Istana = peta "N" */
  const inR = (e) => e.x >= 145 && e.x < 200 && e.y >= 86 && e.y < 122,
    tagR = (key, f) => EN.O.forEach((e) => e.t === "npc" && inR(e) && f(e) && (e.story = key)),
    tagN = (key, f) => EN.N.forEach((e) => e.t === "npc" && f(e) && (e.story = key));
  tagR("musik", byName("Pemain Musik"));
  tagR("pandaiR", byName("Pandai Besi Istana"));
  tagR("kebunR", byName("Tukang Kebun Istana"));
  tagR("pelayanR", byName("Pelayan Kota"));
  tagR("anakB", byName("Anak Bangsawan"));
  tagR("tamuR", byId("tamu"));
  tagR("kudaR", byId("kuda"));
  ["Bangsawati", "Bangsawan", "Ksatria Patroli", "Prajurit Patroli"].forEach((n) => tagR("gosipR", byName(n)));
  tagN("pelayanN", byId("pelayan"));
  tagN("ratuN", byId("ratu"));
  tagN("pangeranN", byId("pangeran"));
  tagN("putriN", byId("putri"));
  tagN("pejabatN", byId("pejabat"));
  tagN("tabibN", byId("tabib"));
  tagN("ksatriaN", byId("ksatria"));

  /* Kota Logaritma: petak x 288..337, y 44..77; Istana Logaritma = peta "Y" */
  const inL = (e) => e.x >= 288 && e.x < 338 && e.y >= 44 && e.y < 78,
    tagL = (key, f) => EN.O.forEach((e) => e.t === "npc" && inL(e) && f(e) && (e.story = key)),
    tagY = (key, f) => (EN.Y || []).forEach((e) => e.t === "npc" && f(e) && (e.story = key));
  tagL("nelayanK", byName("Nelayan Kanal"));
  tagL("anakL", byName("Anak Kota"));
  tagL("bangsawatiL", byName("Bangsawati"));
  tagL("pembacaL", byName("Pembaca Buku"));
  tagL("kecapi", byName("Pemain Kecapi"));
  ["Penjaga Gerbang", "Tukang Kebun Kota", "Marina (Penyihir Rank S)", "Triton (Pendekar Rank S)", "Veteran Naru (Rank S)"].forEach((n) =>
    tagL("gosipL", byName(n)),
  );
  tagY("penasihat", byName("Penasihat Kerajaan"));
  tagY("putriM", byName("Putri Mutiara"));
  tagY("ksatriaB", byName("Ksatria Bahari"));
  tagY("prajuritY", byName("Prajurit Istana"));
  tagY("pelayanY", byName("Pelayan Istana"));
  tagY("tamuY", byName("Tamu Kerajaan"));
  tagY("tabibY", byId("tabib"));

  /* ---------- titik rahasia ---------- */
  const spots = [
    /* Desa Satuan: pojok kiri atas */
    {
      id: "batu", x: 14, y: 1,
      on: () => sec().st === 1 && sec().ank && !sec().sh.anak,
      use() {
        SND.sfx("chest");
        dlg("Batu Berkilau", ["Tanah di sini baru digali. Ada pecahan kristal yang masih bersinar!", give("anak")]);
      },
    },
    /* Kota Bangun: sudut utara dekat pohon (Tukang Kebun) */
    {
      id: "kebun", x: 20, y: 13,
      on: () => kb().st === 1 && kb().h.kebun && !kb().cl.kebun,
      use() {
        SND.sfx("chest");
        dlg("Kotak Besi Kecil", [
          "Di bawah akar pohon ada kotak besi kecil berkarat. Isinya selembar gulungan.",
          'Tulisan tangan rapi: "Tanamlah angka di tanah yang jujur. Tanah tidak pernah salah menghitung."',
          clue("kebun"),
        ]);
      },
    },
    /* pojok kanan atas (Anak Kota) */
    {
      id: "kristalkecil", x: 42, y: 11,
      on: () => kb().st === 1 && kb().h.anak && !kb().cl.anak,
      use() {
        SND.sfx("chest");
        dlg("Kristal Kecil", [
          "Di pojok ini ada kristal kecil yang memantulkan gambar jembatan, lengkap dengan angka nol di bawah tiap tiangnya.",
          clue("anak"),
        ]);
      },
    },
    /* tengah jalan selatan (Taro) */
    {
      id: "batutanda", x: 22, y: 40,
      on: () => kb().st === 1 && kb().h.taro && !kb().cl.taro,
      use() {
        SND.sfx("chest");
        dlg("Batu Bertanda", [
          "Batu di tengah jalan ini tertanam rapi dan diukir lingkaran kecil, tanda yang sama seperti di jembatan.",
          "Di bawahnya terselip catatan: \"Semua jalan di kota ini berawal dari nol.\"",
          clue("taro"),
        ]);
      },
    },
    /* akhir quest Kota Bangun: pojok kiri bawah */
    {
      id: "petibiru", x: 1, y: 40,
      on: () => kb().st === 2,
      use() {
        SND.sfx("chest");
        const k = kb();
        k.st = 3;
        Pl.coin += 300;
        Pl.atk += 2;
        Pl.hb++;
        F.gp = (F.gp || 0) + 25;
        hud();
        dlg("Peti Cetak Biru", [
          "Tanah di pojok ini selalu lembab. Kamu menggali dan menemukan peti kayu berisi gulungan cetak biru jembatan.",
          'Di halaman terakhir tertulis: "Kalau kamu membaca ini, angka belum benar-benar patah. Cari aku di tempat nol berada, di Dungeon Sang Nol."',
          "Hadiah: 300 koin, +2 Serangan permanen, 1 Batu Petunjuk, +25 GP.",
          "Quest rahasia selesai: Jejak Sang Nol!",
        ]);
      },
    },
    /* Kota Kerajaan: belakang kandang kuda (Tukang Kuda) */
    {
      id: "lonceng", x: 197, y: 111,
      on: () => lg().st === 1 && lg().h.kuda && !lg().nd.kuda,
      use() {
        SND.sfx("chest");
        dlg("Lonceng Kuda", [
          "Di rumput belakang kandang ada lonceng kuda emas yang tertutup lumut. Saat kamu menggoyangnya, dentingnya berirama jernih.",
          nada("kuda"),
        ]);
      },
    },
    /* Istana: pojok kanan atas aula tahta (akhir quest Ruang Tahta) */
    {
      map: "N", id: "lemari", x: 22, y: 1,
      on: () => rt().st === 2,
      use() {
        SND.sfx("chest");
        const q = rt();
        q.st = 3;
        Pl.coin += 500;
        Pl.sp = (Pl.sp || 0) + 3;
        Pl.pot += 3;
        F.gp = (F.gp || 0) + 30;
        hud();
        dlg("Lemari Rahasia", [
          "Di sudut aula ada lemari tua. Saat kamu menggumamkan lagu istana, pintunya berderit terbuka sendiri.",
          'Di dalamnya ada surat Nolan untuk Raja terdahulu: "Kristal retak bukan karena aku. Hitungan upeti dibulatkan ke atas bertahun-tahun, dan kristal menanggung selisihnya. Aku akan memperbaikinya dari nol."',
          "Surat itu disegel dan tak pernah dikirim. Rupanya Nolan tidak berniat memecahkan Kristal Aksioma. Dia mencoba memperbaikinya, dan gagal.",
          "Hadiah: 500 koin, +3 Poin Status, 3 Ramuan HP, +30 GP.",
          "Quest rahasia selesai: Rahasia Ruang Tahta!",
        ]);
      },
    },
    /* Kota Logaritma: tiang keenam di tepi kanal, utara jembatan (akhir rantai Kail Perak) */
    {
      id: "tiang6", x: 295, y: 54,
      on: () => lc().st === 6,
      use() {
        SND.sfx("chest");
        lc().st = 7;
        Pl.coin += 220;
        Pl.sp = (Pl.sp || 0) + 1;
        Pl.hb++;
        F.gp = (F.gp || 0) + 20;
        hud();
        dlg("Kotak di Tiang Keenam", [
          "Di bawah tiang keenam ada kotak kecil kedap air. Isinya selembar catatan lapuk dan sebuah kompas rusak.",
          'Catatan itu tulisan tangan kakek nelayan: "Pemuda berjubah lusuh itu menyeberang bersamaku ke ujung samudra. Sepanjang jalan dia menghitung gelombang dengan logaritma, dan berbisik bahwa nol adalah kegagalannya."',
          "Hadiah: 220 koin, +1 Poin Status, 1 Batu Petunjuk, +20 GP.",
          "Quest rahasia selesai: Kail Perak Sang Nelayan!",
        ]);
      },
    },
    /* Istana Logaritma: vas karang pusaka (akhir quest Segel Vas Karang) */
    {
      map: "Y", id: "vas", x: 21, y: 3,
      on: () => ly().st === 2,
      use() {
        SND.sfx("chest");
        ly().st = 3;
        Pl.coin += 600;
        Pl.sp = (Pl.sp || 0) + 3;
        Pl.fpot += 3;
        F.gp = (F.gp || 0) + 40;
        hud();
        dlg("Vas Karang Pusaka", [
          "Segel di vas karang itu berdengung, lalu terbuka. Di dalamnya ada gulungan: separuh peta menuju Jurang Tak Hingga.",
          'Terselip catatan Nolan yang sudah lama: "Aku gagal di pertanyaan terakhir karena kupikir nol adalah ketiadaan. Ternyata nol adalah jawaban dari asal semua hitungan."',
          "Hadiah: 600 koin, +3 Poin Status, 3 Ramuan Mana, +40 GP.",
          "Quest rahasia selesai: Segel Vas Karang!",
        ]);
      },
    },
  ];
  spots.forEach((o) => EN[o.map || "O"].push({ t: "spot", ...o }));
  H.spot = (e) => e.use(e);

  /* ---------- isi cerita ---------- */
  const GOSIP = [
    "Katanya arsitek jembatan kota ini punya banyak teman: Pandai Besi, Tukang Sapu, sampai Pembaca Buku di alun-alun.",
    "Aku dengar Penjaga Kota dan Seniman Jalanan sering ngobrol soal arsitek itu. Namanya Nolan, kan?",
    "Pendekar dan Pencuri di dekat alun-alun selatan itu kelihatannya tahu rahasia jembatan. Tanyakan saja, tapi siapkan koin.",
  ];
  const STORY = {
    /* ===== Desa Satuan ===== */
    petani() {
      const s = sec();
      if (s.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Zzz... eh? Kamu memperhatikanku tidur dari tadi, ya? Duduklah sebentar, Nak.",
            "Tiga puluh tahun lalu aku bukan petani. Aku Penjaga Kristal Aksioma, penjaga termuda di Guild Penjaga Angka.",
            "Malam Sang Nol memecahkan kristal itu, aku sempat menyelamatkan tiga Pecahan Aksioma. Di dalamnya masih tersisa hitungan yang benar.",
            "Aku takut Sang Nol memburunya, jadi kutitipkan ketiganya ke orang desa tanpa mereka tahu. Sekarang aku sudah lupa siapa saja yang kutitipi.",
            "Tolong carikan. Coba tanya Nelayan, Anak Desa, dan Rika si petualang. Kembalilah padaku kalau sudah kamu kumpulkan.",
          ],
          go() {
            s.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Pecahan yang Terlupa. Pantau di menu Misi."];
          },
        };
      if (s.st === 1) {
        if (nsh() >= 3)
          return {
            label: "Serahkan tiga pecahan",
            lines: [
              "Tiga pecahan... masih hangat! Terima kasih, Nak. Kamu tidak tahu betapa lamanya aku mencarinya.",
              "Dengar, Sang Nol dulu muridku. Namanya Nolan. Dia tidak jahat, dia hanya tidak tahan melihat hitungan yang tidak pernah genap.",
              "Kalau kamu bertemu dengannya, ingatkan bahwa nol bukan ketiadaan. Nol adalah tempat semua hitungan bermula.",
            ],
            go() {
              s.st = 2;
              Pl.coin += 150;
              Pl.pot += 3;
              Pl.fpot += 2;
              F.gp = (F.gp || 0) + 10;
              hud();
              SND.sfx("chest");
              return ["Hadiah: 150 koin, 3 Ramuan HP, 2 Ramuan Mana, +10 GP.", "Quest rahasia selesai: Pecahan yang Terlupa!"];
            },
          };
        const todo = [];
        if (!s.sh.nelayan) todo.push("Nelayan Desa");
        if (!s.sh.anak) todo.push("Anak Desa");
        if (!s.sh.rika) todo.push("Rika");
        return { label: "Tanya soal pecahan", lines: [`Baru ${nsh()} dari 3 pecahan. Yang belum: ${todo.join(", ")}.`] };
      }
      return null;
    },
    nelayan() {
      const s = sec();
      if (s.st !== 1 || s.sh.nelayan) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Ssst, kamu mau dengar? Sepuluh tahun lalu seekor ikan bulat menyambar umpanku, dan di perutnya ada batu bercahaya.",
          "Batunya berdenyut seperti sedang berhitung. Kusimpan di kotak umpan, sebab ikan jadi lebih jinak kalau dekat batu itu.",
          "Pak Petani mencarinya? Rupanya dulu dia yang menjatuhkannya ke kolam. Ambillah, ikan di sini toh tetap datang.",
        ],
        go: () => [give("nelayan")],
      };
    },
    anak() {
      const s = sec();
      if (s.st !== 1 || s.sh.anak) return null;
      if (!s.ank)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Kak, aku punya rahasia! Dulu aku mengejar kupu-kupu dan menemukan batu bersinar di bawah pohon.",
            "Aku takut Ibu marah kalau kubawa pulang, jadi kukubur di pojok kiri atas desa, dekat pohon besar.",
            "Kakak boleh ambil, tapi jangan bilang Ibu ya!",
          ],
          go() {
            s.ank = 1;
            return ["Petunjuk: cari kilau di pojok kiri atas Desa Satuan, lalu tekan Spasi di depannya."];
          },
        };
      return { label: "Tanya lagi", lines: ["Di pojok kiri atas desa, dekat pohon besar! Cari yang berkilau, Kak."] };
    },
    rika() {
      const s = sec();
      if (s.st !== 1 || s.sh.rika) return null;
      const slimeDown = !!F.done[0];
      if (!s.rik)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Kamu mau tahu kenapa aku masih Rank D? Karena aku menyimpan sesuatu yang bukan milikku.",
            "Ayahku pedagang. Seorang penjaga tua pernah membayar utangnya dengan liontin berhias pecahan kristal, dan liontin itu jatuh ke tanganku. Aku tidak berani menjualnya.",
            slimeDown
              ? "Kamu sudah mengalahkan Slime Retak di desa, jadi kamu pantas menerimanya. Ini, bawalah."
              : "Aku mau menyerahkannya, tapi malu: aku sendiri belum berani melawan Slime Retak di desa ini. Kalahkan dia, lalu temui aku lagi.",
          ],
          go() {
            s.rik = 1;
            return slimeDown ? [give("rika")] : ["Syarat dari Rika: kalahkan Slime Retak di Desa Satuan."];
          },
        };
      if (slimeDown)
        return {
          label: "Ambil liontin",
          lines: ["Slime itu sudah kalah? Kamu memang bisa diandalkan. Ini liontinnya, jaga baik-baik."],
          go: () => [give("rika")],
        };
      return { label: "Tanya lagi", lines: ["Liontinnya kuberikan setelah Slime Retak di desa ini kalah. Aku percaya padamu!"] };
    },

    /* ===== Kota Bangun: pemberi quest ===== */
    kakek() {
      const k = kb();
      if (k.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Duduk sini, Nak. Jembatan yang kamu lihat itu dirancang seorang arsitek muda bernama Nolan, murid seorang Penjaga Kristal.",
            "Orang bilang dia menghilang saat Kristal Aksioma pecah. Tapi aku yakin dia tidak kabur. Dia menyembunyikan cetak biru di kota ini.",
            `Hampir semua warga menyimpan secuil ingatan tentang Nolan, tanpa sadar penting. Kumpulkan sedikitnya ${REQ} petunjuk, lalu temui aku lagi.`,
            "Beberapa petunjuk perlu bantuan: ramuan, koin, atau keberanian. Dan beberapa tersembunyi di tanah yang berkilau.",
          ],
          go() {
            k.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Jejak Sang Nol. Pantau di menu Misi."];
          },
        };
      if (k.st === 1) {
        if (ncl() >= REQ)
          return {
            label: "Serahkan petunjuk",
            lines: [
              "Paku bertanda nol, sisi patung yang kosong, tinta yang hanya terlihat saat basah, tanda tangan di dada golem...",
              "Nolan tidak menghilang. Dia menyegel cetak biru berisi cara menyusun kembali angka yang pecah, lalu menguburnya di tempat yang jujur.",
              "Pojok kiri bawah kota ini tanahnya selalu lembab walau tak pernah hujan. Gali di sana, Nak. Kilaunya akan menuntunmu.",
            ],
            go() {
              k.st = 2;
              SND.sfx("quest");
              return ["Petunjuk akhir: cari kilau di pojok kiri bawah Kota Bangun."];
            },
          };
        return { label: "Tanya soal petunjuk", lines: [`Baru ${ncl()} dari ${REQ} petunjuk. Tanya warga satu per satu, jangan ada yang terlewat!`] };
      }
      if (k.st === 2) return { label: "Tanya lagi", lines: ["Gali di pojok kiri bawah kota, Nak. Di sana tanahnya selalu lembab."] };
      return null;
    },

    /* ===== Kota Bangun: sumber petunjuk ===== */
    pandai() {
      if (kb().st !== 1 || kb().cl.pandai) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Jembatan kota? Semua paku sambungannya aku yang tempa, pesanan seorang arsitek muda bernama Nolan.",
          "Dia menolak paku biasa. Tiap paku harus kuberi tanda lingkaran kecil di kepalanya, tanda nol. Katanya, nol itu pegangan paling kuat.",
        ],
        go: () => [clue("pandai")],
      };
    },
    sapu() {
      if (kb().st !== 1 || kb().cl.sapu) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Tiap pagi kusapu debu pecahan kristal di jalan ini. Anehnya debunya selalu menumpuk membentuk garis lurus menuju jembatan.",
          "Nolan dulu sering ikut menyapu di sini. Katanya, jalan yang bersih membuat hitungan lebih jernih.",
        ],
        go: () => [clue("sapu")],
      };
    },
    pembaca() {
      if (kb().st !== 1 || kb().cl.pembaca) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Buku tua ini catatan harian si arsitek jembatan. Kalimat terakhirnya: kalau angka bisa pecah, aku akan menyusunnya lagi dari nol.",
          "Halaman sesudahnya disobek. Entah oleh siapa, tapi robekannya rapi sekali, seperti sengaja.",
        ],
        go: () => [clue("pembaca")],
      };
    },
    seniman() {
      if (kb().st !== 1 || kb().cl.seniman) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Patung di alun-alun ini pahatan Nolan. Semua sisinya melambangkan bentuk geometri, tapi ada satu sisi yang sengaja dibiarkan kosong.",
          'Dulu kutanya kenapa. Dia menjawab, "Sisi kosong itu untuk bentuk yang belum ditemukan."',
        ],
        go: () => [clue("seniman")],
      };
    },
    penjaga() {
      if (kb().st !== 1 || kb().cl.penjaga) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Tiap sore Nolan berdiri di tengah jembatan sambil menghitung langkah orang yang lewat. Dia berhenti tepat sehari sebelum Kristal pecah.",
          'Sebelum pergi dia menitip pesan padaku: "Kalau jembatan ini rubuh, cari aku di tempat angka bermula."',
        ],
        go: () => [clue("penjaga")],
      };
    },
    mira() {
      const k = kb();
      if (k.st !== 1 || k.cl.mira) return null;
      if (Pl.fpot < 1)
        return {
          label: "Tanya lagi",
          lines: [
            "Aku mencium sisa sihir pelacak di jembatan. Aku bisa membaca jejaknya, tapi butuh satu Ramuan Mana.",
            "Belilah di toko, lalu temui aku lagi.",
          ],
        };
      return {
        label: "Berikan Ramuan Mana",
        lines: [
          "Aku mencium sisa sihir pelacak di jembatan. Kalau kamu beri aku satu Ramuan Mana, aku bisa membaca jejaknya.",
          "Terima kasih! Nah... jejak sihirnya milik Nolan. Dia menyegel sesuatu memakai mantra yang hanya bisa dibuka dengan kata nol.",
        ],
        go() {
          Pl.fpot--;
          hud();
          return ["Ramuan Mana −1.", clue("mira")];
        },
      };
    },
    nyx() {
      const k = kb();
      if (k.st !== 1 || k.cl.nyx) return null;
      if (Pl.coin < 30)
        return {
          label: "Tanya lagi",
          lines: ["Hmph. Kamu mau tahu soal arsitek itu? Informasi mahal. Datang lagi kalau koinmu cukup 30."],
        };
      return {
        label: "Bayar 30 koin",
        lines: [
          "Hmph. Kamu bertanya soal arsitek itu? Informasi mahal. Tiga puluh koin, dan mulutku terbuka.",
          "Baik. Dulu aku menyelinap ke rumahnya dan mencuri gulungan kosong. Ternyata kosong karena dia menulis dengan tinta yang hanya terlihat saat basah.",
          "Jangan bilang siapa-siapa aku pernah mencuri, ya.",
        ],
        go() {
          Pl.coin -= 30;
          SND.sfx("coin");
          hud();
          return ["Koin −30.", clue("nyx")];
        },
      };
    },
    dax() {
      const k = kb();
      if (k.st !== 1 || k.cl.dax) return null;
      if (!F.done[2])
        return {
          label: "Tanya lagi",
          lines: ["Kamu tanya soal jembatan? Kalahkan dulu Golem di sana. Aku baru percaya kamu cukup kuat menanggung ceritanya."],
        };
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kamu sudah mengalahkan Golem di jembatan? Kalau begitu kamu layak tahu: Golem itu dibangun dari batu jembatan yang retak.",
          "Waktu kami periksa, di dadanya ada ukiran kecil: tanda tangan Nolan. Dia membuat jembatan itu, dan jembatan itu hidup karena kristal pecah.",
        ],
        go: () => [clue("dax")],
      };
    },
    kebun() {
      const k = kb();
      if (k.st !== 1 || k.cl.kebun) return null;
      if (!k.h.kebun)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Ada akar pohon di sudut kebun ujung jalan utara yang tumbuh sampai membengkokkan batu. Dulu Nolan menanam sesuatu di bawahnya.",
            "Katanya, biar tanah ikut berhitung. Aku tidak berani menggalinya, nanti pohonnya marah.",
          ],
          go() {
            k.h.kebun = 1;
            return ["Petunjuk: cari kilau di dekat pohon di ujung jalan utara kota, lalu tekan Spasi di depannya."];
          },
        };
      return { label: "Tanya lagi", lines: ["Di dekat pohon ujung jalan utara kota. Cari yang berkilau."] };
    },
    anakK() {
      const k = kb();
      if (k.st !== 1 || k.cl.anak) return null;
      if (!k.h.anak)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Kak, aku pernah lihat kristal kecil di pojok kanan atas kota! Kalau disinari, ada gambar jembatan di dalamnya.",
            "Aku tidak berani mengambilnya. Kakak saja!",
          ],
          go() {
            k.h.anak = 1;
            return ["Petunjuk: cari kilau di pojok kanan atas Kota Bangun, lalu tekan Spasi di depannya."];
          },
        };
      return { label: "Tanya lagi", lines: ["Pojok kanan atas kota, Kak! Cari yang berkilau."] };
    },
    taro() {
      const k = kb();
      if (k.st !== 1 || k.cl.taro) return null;
      if (!k.h.taro)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Waktu aku lewat jalan selatan kota, ada batu bertanda yang tertanam tepat di tengah jalan. Tandanya mirip lingkaran di jembatan.",
            "Pemanah pandai membaca jejak, jadi aku curiga itu bukan sembarang batu. Coba kamu periksa.",
          ],
          go() {
            k.h.taro = 1;
            return ["Petunjuk: cari kilau di ujung selatan jalan utama Kota Bangun, lalu tekan Spasi di depannya."];
          },
        };
      return { label: "Tanya lagi", lines: ["Di ujung selatan jalan utama kota. Cari yang berkilau."] };
    },
    warga(e) {
      if (kb().st !== 1) return null;
      return { label: "Tanya soal arsitek jembatan", lines: [GOSIP[Math.abs(e.x + e.y) % GOSIP.length]] };
    },

    /* ===== Kota Kerajaan: Lagu yang Terlupa ===== */
    musik() {
      const q = lg();
      if (q.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "La la la... ini satu-satunya lagu yang kuhafal. Padahal kata kakekku, lagu istana yang asli punya banyak bagian.",
            "Bagian-bagiannya tersebar sebagai bunyi di kota ini: dentang palu, desir air, sapuan sapu, tawa anak kecil, sampai denting lonceng kuda.",
            `Kumpulkan sedikitnya ${REQL} nada, lalu temui aku. Akan kumainkan lagu itu utuh.`,
          ],
          go() {
            q.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Lagu yang Terlupa. Pantau di menu Misi."];
          },
        };
      if (q.st === 1) {
        if (nnd() >= REQL)
          return {
            label: "Mainkan lagu bersama",
            lines: [
              "Dentang palu, desir air, sapuan sapu... dan ini lonceng kudanya! Dengarkan!",
              "Astaga, lagunya utuh! Indah sekali. Dan sekarang aku ingat pesan kakekku.",
              "Lagu ini bukan sekadar hiburan. Nadanya dipakai untuk membuka lemari rahasia di Istana. Pelayan Istana pasti tahu lebih banyak, kalau kamu diizinkan masuk.",
            ],
            go() {
              q.st = 2;
              Pl.coin += 120;
              Pl.fpot += 3;
              F.gp = (F.gp || 0) + 15;
              hud();
              SND.sfx("chest");
              return ["Hadiah: 120 koin, 3 Ramuan Mana, +15 GP.", "Quest rahasia selesai: Lagu yang Terlupa! Cerita berlanjut di Istana."];
            },
          };
        return { label: "Tanya soal nada", lines: [`Baru ${nnd()} dari ${REQL} nada. Dengarkan bunyi-bunyi di kota, Kak.`] };
      }
      return null;
    },
    pandaiR() {
      if (lg().st !== 1 || lg().nd.pandai) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Tang, ting, tang! Ayunan palu yang benar punya irama tetap. Pandai besi sebelumku mengajarkannya turun-temurun.",
          "Irama itu katanya diambil dari lagu istana. Dengarkan sendiri: tang, ting, tang, tang!",
        ],
        go: () => [nada("pandai")],
      };
    },
    kebunR() {
      if (lg().st !== 1 || lg().nd.kebun) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Aku menyiram tanaman selalu dengan hitungan tertentu: satu, dua, tiga, jeda. Pohon tumbuh lebih bagus kalau disirami berirama.",
          "Kata kakek Raja, irama siraman itu bagian dari lagu istana. Aku cuma mengikuti kebiasaan.",
        ],
        go: () => [nada("kebun")],
      };
    },
    pelayanR() {
      if (lg().st !== 1 || lg().nd.pelayan) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Aku menyapu halaman dengan sapuan panjang, sapuan pendek, sapuan panjang. Sudah begitu sejak aku kecil.",
          "Ibuku bilang itu nada lagu lama. Dia sering menyenandungkannya sambil menyapu.",
        ],
        go: () => [nada("pelayan")],
      };
    },
    anakB() {
      if (lg().st !== 1 || lg().nd.anakb) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kak, aku punya lagu rahasia! Nenek mengajariku. Dengar ya: la-la-lan, la-la-lan, la la lan!",
          "Kata Nenek, lagu itu nggak boleh hilang. Kakak ingat-ingat, ya!",
        ],
        go: () => [nada("anakb")],
      };
    },
    tamuR() {
      const q = lg();
      if (q.st !== 1 || q.nd.tamu) return null;
      if (Pl.pot < 1)
        return {
          label: "Tanya lagi",
          lines: ["Aku masih lelah dari gurun. Kalau ada satu Ramuan HP, aku mau bernyanyi untukmu."],
        };
      return {
        label: "Berikan Ramuan HP",
        lines: [
          "Aku masih lelah dari gurun. Kalau kamu beri aku satu Ramuan HP, aku mau menyanyikan lagu kafilah kami.",
          "Ah, segar! Dengarkan: lagu kafilah kami punya bagian yang sama dengan lagu istana, cuma lebih lambat.",
        ],
        go() {
          Pl.pot--;
          hud();
          return ["Ramuan HP −1.", nada("tamu")];
        },
      };
    },
    kudaR() {
      const q = lg();
      if (q.st !== 1 || q.nd.kuda) return null;
      if (!q.h.kuda)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Dulu tiap kuda kerajaan memakai lonceng emas yang berdenting berirama. Satu lonceng hilang di rumput belakang kandang, kata orang.",
            "Aku tidak berani mencarinya, bangsawan bisa marah. Kamu coba saja.",
          ],
          go() {
            q.h.kuda = 1;
            return ["Petunjuk: cari kilau di rumput belakang kandang kuda, sisi kanan kota, lalu tekan Spasi di depannya."];
          },
        };
      return { label: "Tanya lagi", lines: ["Belakang kandang, sisi kanan kota. Cari yang berkilau."] };
    },
    gosipR(e) {
      if (lg().st !== 1) return null;
      const L = [
        "Katanya Pemain Musik dekat alun-alun sedang mengumpulkan nada. Tanyakan pada Pandai Besi Istana dan Tukang Kebun Istana.",
        "Pelayan Kota dan anak-anak bangsawan sering bersenandung lagu aneh. Mungkin itu yang dicari si Pemain Musik.",
        "Tamu dari gurun dan Tukang Kuda juga punya bunyi-bunyian sendiri. Entah apa hubungannya dengan lagu istana.",
      ];
      return { label: "Tanya soal lagu", lines: [L[Math.abs(e.x + e.y) % L.length]] };
    },

    /* ===== Istana: Rahasia Ruang Tahta (butuh Lagu yang Terlupa selesai) ===== */
    pelayanN() {
      const q = rt();
      if (lg().st < 2) return null;
      if (q.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Kamu menyenandungkan lagu istana? Aneh, lagu itu sudah lama tidak dinyanyikan di sini.",
            "Di aula tahta ada lemari rahasia di pojok kanan atas. Ia hanya terbuka untuk lagu itu, tapi aku tidak tahu kenapa lemari itu dikunci sejak dulu.",
            `Tanyakan pada Ratu, Pangeran, Putri, Pejabat, Tabib, dan Ksatria. Catat sedikitnya ${REQR} potongan sejarah, lalu kembali padaku.`,
          ],
          go() {
            q.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Rahasia Ruang Tahta. Pantau di menu Misi."];
          },
        };
      if (q.st === 1) {
        if (nfk() >= REQR)
          return {
            label: "Ceritakan temuanmu",
            lines: [
              "Hitungan upeti dibulatkan ke atas, kristal yang menanggung selisihnya, dan surat Nolan yang dilarang dibaca...",
              "Jadi lemari itu dikunci bukan karena isinya berharga, tapi karena memalukan. Pergilah, buka lemarinya. Lagu itu pasti menuntunmu.",
            ],
            go() {
              q.st = 2;
              SND.sfx("quest");
              return ["Petunjuk akhir: cari kilau di pojok kanan atas aula tahta, lalu tekan Spasi di depannya."];
            },
          };
        return { label: "Tanya soal catatan", lines: [`Baru ${nfk()} dari ${REQR} catatan sejarah. Tanya Ratu, Pangeran, Putri, Pejabat, Tabib, atau Ksatria.`] };
      }
      if (q.st === 2) return { label: "Tanya lagi", lines: ["Lemari itu di pojok kanan atas aula tahta. Cari yang berkilau."] };
      return null;
    },
    ratuN() {
      if (rt().st !== 1 || rt().cl.ratu) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kristal Aksioma dipasang oleh kakek Raja. Aku pernah membuka buku besar upeti peninggalannya.",
          "Setiap tahun jumlahnya dibulatkan ke atas, hanya selisih kecil. Tapi selisih kecil, bertahun-tahun, bisa jadi retakan besar.",
        ],
        go: () => [fakta("ratu")],
      };
    },
    pangeranN() {
      if (rt().st !== 1 || rt().cl.pangeran) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Ayahanda melarangku membuka lemari tua di aula tahta. Katanya isinya hanya debu, tapi aku pernah melihat segel arsitek Nolan di sana.",
          "Segelnya bergambar lingkaran. Kenapa surat arsitek jembatan ada di istana, ya?",
        ],
        go: () => [fakta("pangeran")],
      };
    },
    putriN() {
      if (rt().st !== 1 || rt().cl.putri) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Waktu kecil aku menemukan surat di taman: kertas lama, tulisan rapi. Isinya peringatan bahwa kristal itu sudah retak sebelum disentuh siapa pun.",
          "Aku menunjukkannya pada Ayahanda, dan beliau menyuruhku melupakannya. Aku tidak pernah lupa.",
        ],
        go: () => [fakta("putri")],
      };
    },
    pejabatN() {
      if (rt().st !== 1 || rt().cl.pejabat) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Catatan kerajaan itu rapi, tapi ada satu halaman yang jumlahnya tidak pernah cocok. Selisihnya satu koin per kantong upeti.",
          "Satu koin per kantong tampak sepele. Dikali seluruh kerajaan, puluhan tahun... pantas hitungan Numeria kacau.",
        ],
        go: () => [fakta("pejabat")],
      };
    },
    tabibN() {
      if (rt().st !== 1 || rt().cl.tabib) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Almarhum kakek Raja sakit hatinya sampai akhir hayat. Dalam demamnya dia hanya menggumam: bulatkan ke atas, bulatkan ke atas.",
          "Aku mengobatinya, tapi sakit seperti itu tidak bisa diobati ramuan. Itu rasa bersalah.",
        ],
        go: () => [fakta("tabib")],
      };
    },
    ksatriaN() {
      if (rt().st !== 1 || rt().cl.ksatria) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Seorang prajurit tua pernah dihukum karena menyebut surat arsitek itu di depan umum. Aku masih muda waktu itu.",
          "Sejak itu tak ada yang berani membicarakannya. Tapi kami semua tahu lemari di pojok itu tidak berisi pedang atau emas.",
        ],
        go: () => [fakta("ksatria")],
      };
    },

    /* ===== Kota Logaritma: Kail Perak Sang Nelayan (rantai) ===== */
    nelayanK() {
      const q = lc();
      if (q.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Ikan di kanal ini jinak karena kail perak warisan kakekku. Tapi kail itu hilang tiga hari lalu.",
            "Terakhir kulihat di tangan anak-anak yang bermain di alun-alun. Bisa tolong tanyakan pada Anak Kota?",
          ],
          go() {
            q.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Kail Perak Sang Nelayan. Pantau di menu Misi."];
          },
        };
      if (q.st === 5)
        return {
          label: "Serahkan kail",
          lines: [
            "Kailku! Dan angka enam, katamu? Enam... tiang keenam di tepi kanal, dihitung dari jembatan ke utara!",
            "Kakekku pernah mengantar pemuda berjubah lusuh ke ujung samudra. Mungkin dia meninggalkan sesuatu di tiang itu.",
          ],
          go() {
            q.st = 6;
            SND.sfx("quest");
            return ["Petunjuk akhir: cari kilau di tepi kanal, enam petak ke utara dari jembatan kanal, lalu tekan Spasi di depannya."];
          },
        };
      if (q.st === 6) return { label: "Tanya lagi", lines: ["Tiang keenam dari jembatan ke utara, di tepi kanal. Cari yang berkilau."] };
      return null;
    },
    anakL() {
      const q = lc();
      if (q.st !== 1) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kail perak? Aku tukar sama Bangsawati! Dia kasih permen kerang. Dia suka benda yang mengilap.",
          "Jangan bilang Pak Nelayan, ya. Eh, tapi boleh deh. Aku sudah kenyang permen.",
        ],
        go() {
          q.st = 2;
          return ["Petunjuk: kail itu sekarang ada pada Bangsawati."];
        },
      };
    },
    bangsawatiL() {
      const q = lc();
      if (q.st !== 2) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kail perak itu? Cantik, ya. Tapi di kepalanya ada ukiran angka yang membuatku pusing, jadi kuberikan pada Pembaca Buku.",
          "Dia bilang akan menerjemahkan ukirannya. Kasihan, sudah dua hari dia berkeringat dingin.",
        ],
        go() {
          q.st = 3;
          return ["Petunjuk: kail itu sekarang ada pada Pembaca Buku."];
        },
      };
    },
    pembacaL() {
      const q = lc();
      if (q.st !== 3) return null;
      return {
        label: "Pecahkan ukiran",
        lines: [
          "Kail itu! Aku sudah dua hari mencoba memecahkan ukirannya. Bunyinya: dua dipangkatkan x sama dengan 64.",
          "Bantu aku menghitungnya. Berapa nilai x?",
        ],
        qs: [{ q: "2 dipangkatkan x = 64. Berapa nilai x?", opts: ["4", "5", "6", "8"], a: 2, tip: "Coba kalikan 2 berulang: 2, 4, 8, 16, 32, 64." }],
        ok: [
          "Enam! Tentu saja, dua kali lipat enam kali sama dengan enam puluh empat. Ukiran itu tidak sekadar hiasan.",
          "Kail ini sudah kupinjamkan pada Pemain Kecapi. Dia mengira kail ini penala nada. Katakan padanya bahwa jawabannya enam.",
        ],
        go() {
          q.st = 4;
          return ["Petunjuk: kail itu sekarang ada pada Pemain Kecapi."];
        },
      };
    },
    kecapi() {
      const q = lc();
      if (q.st !== 4) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Kail ini punya nada jernih sekali, jadi kupakai menyetel kecapi. Pembaca Buku bilang angkanya enam?",
          "Pantas, kecapiku punya enam dawai dan kail ini memunculkan nada dasar keenam. Ambil, kembalikan pada Pak Nelayan.",
        ],
        go() {
          q.st = 5;
          return ["Kamu menerima Kail Perak. Kembalilah pada Nelayan Kanal."];
        },
      };
    },
    gosipL() {
      const q = lc();
      const HINT = [
        null,
        "Kail perak Nelayan Kanal? Anak-anak suka mengambil benda mengilap. Coba tanya Anak Kota di alun-alun.",
        "Bangsawati suka benda mengilap. Mungkin dia yang menerima kail itu.",
        "Pembaca Buku di dekat taman sering menerjemahkan ukiran dan tulisan lama.",
        "Pemain Kecapi di alun-alun menyetel nada dengan benda-benda aneh.",
        "Bawa kail itu kembali ke Nelayan Kanal, di tepi kanal sebelah barat.",
        "Tiang keenam dari jembatan, ke arah utara. Nelayan Kanal pasti memberi tahu kalau ditanya.",
      ];
      if (q.st < 1 || q.st > 6) return null;
      return { label: "Tanya soal kail perak", lines: [HINT[q.st]] };
    },

    /* ===== Istana Logaritma: Segel Vas Karang (butuh Kail Perak selesai) ===== */
    penasihat() {
      const q = ly();
      if (lc().st < 7) return null;
      if (q.st === 0)
        return {
          label: "Dengarkan ceritanya",
          lines: [
            "Kamu yang menemukan catatan nelayan di tiang keenam? Kabar menyebar cepat. Kalau begitu kamu layak tahu soal vas karang di dekat singgasana.",
            "Vas itu menyimpan separuh peta menuju Jurang Tak Hingga. Segelnya hanya terbuka bagi yang menjawab tiga pertanyaan logaritma, dan tak seorang pun lulus selama puluhan tahun.",
            `Tanyai penghuni istana tentang segel itu. Kumpulkan sedikitnya ${REQY} petunjuk, lalu temui aku untuk menghadapi pertanyaannya.`,
          ],
          go() {
            q.st = 1;
            SND.sfx("quest");
            return ["Quest rahasia dimulai: Segel Vas Karang. Pantau di menu Misi."];
          },
        };
      if (q.st === 1) {
        if (nly() >= REQY)
          return {
            label: "Hadapi pertanyaan segel",
            lines: [
              "Petunjukmu cukup. Sekarang hadapi segelnya. Aku yang membacakan, kamu yang menjawab. Tiga pertanyaan, dan kamu boleh mencoba lagi bila salah.",
            ],
            qs: [
              { q: "log₁₀ 1000 = ?", opts: ["2", "3", "4", "10"], a: 1, tip: "Sepuluh dipangkatkan berapa agar menjadi 1000?" },
              { q: "log₃ 81 = ?", opts: ["3", "4", "9", "27"], a: 1, tip: "Tiga dipangkatkan berapa agar menjadi 81? 3, 9, 27, 81." },
              { q: "log₇ 1 = ?", opts: ["0", "1", "7", "Tidak ada"], a: 0, tip: "Bilangan apa pun dipangkatkan nol hasilnya satu." },
            ],
            ok: [
              "Ketiganya benar! Segelnya berdengung... lemari dan vas itu merespons. Jawaban terakhir itu yang dulu menggagalkan pemuda berjubah lusuh.",
              "Pergilah ke vas karang di dekat singgasana. Sekarang vas itu akan terbuka untukmu.",
            ],
            go() {
              q.st = 2;
              SND.sfx("quest");
              return ["Petunjuk akhir: cari kilau di dekat vas karang, pojok kanan atas aula singgasana, lalu tekan Spasi di depannya."];
            },
          };
        return { label: "Tanya soal petunjuk", lines: [`Baru ${nly()} dari ${REQY} petunjuk segel. Tanya Putri, Ksatria, Prajurit, Pelayan, Tamu, atau Tabib.`] };
      }
      if (q.st === 2) return { label: "Tanya lagi", lines: ["Vas karang di dekat singgasana, pojok kanan atas aula. Cari yang berkilau."] };
      return null;
    },
    putriM() {
      if (ly().st !== 1 || ly().cl.putri) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Waktu kecil aku sering melihat vas karang itu berdengung kalau malam. Kata Ayahanda, itu segel angka.",
          "Kalau dengungnya makin pelan, katanya ada yang sedang menjawab pertanyaan di tempat jauh.",
        ],
        go: () => [segel("putri")],
      };
    },
    ksatriaB() {
      if (ly().st !== 1 || ly().cl.ksatria) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Segel vas itu hanya mengenali pertanyaan logaritma. Kata orang tua kami, logaritma adalah pertanyaan yang dibalik: pangkat berapa?",
          "Misalnya, dua dipangkatkan berapa jadi delapan? Itu logaritma. Aku sendiri lebih pandai memegang pedang.",
        ],
        go: () => [segel("ksatria")],
      };
    },
    prajuritY() {
      if (ly().st !== 1 || ly().cl.prajurit) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Dulu ada pemuda berjubah lusuh yang minta membuka vas itu. Penasihat mengizinkannya mencoba.",
          "Dia menjawab dua pertanyaan pertama dengan benar, tapi gagal di pertanyaan terakhir. Pergi dengan wajah pucat.",
        ],
        go: () => [segel("prajurit")],
      };
    },
    pelayanY() {
      if (ly().st !== 1 || ly().cl.pelayan) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Tiap pagi kubersihkan vas karang ini. Dan tiap pagi ia berdengung pelan, seperti sedang menghitung sesuatu.",
          "Kadang kutempelkan telinga ke vas itu. Dengungnya terdengar seperti angka nol berulang-ulang.",
        ],
        go: () => [segel("pelayan")],
      };
    },
    tamuY() {
      if (ly().st !== 1 || ly().cl.tamu) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Aku datang dari Aksioma. Di sana ada vas serupa di istana Raja. Dua vas, dua separuh peta, kata orang.",
          "Orang Aksioma tidak pernah bisa membuka vas mereka. Mungkin vas di sini bisa menjawab sebagian teka-tekinya.",
        ],
        go: () => [segel("tamu")],
      };
    },
    tabibY() {
      if (ly().st !== 1 || ly().cl.tabib) return null;
      return {
        label: "Dengarkan ceritanya",
        lines: [
          "Aku pernah mengobati pemuda berjubah lusuh yang pingsan setelah menghadapi segel vas. Dia menggumam terus.",
          "Katanya: logaritma dari satu, bukan satu, bukan satu... lalu dia tertawa getir. Aku tidak mengerti artinya.",
        ],
        go: () => [segel("tabib")],
      };
    },
  };
  const story = (e) => (e.story && STORY[e.story] ? STORY[e.story](e) : null);

  /* ---------- interaksi: obrolan biasa, lalu tawaran cerita ---------- */
  function quiz(who, s, i) {
    busy = true;
    const Q = s.qs[i];
    say(`${who}: pertanyaan ${i + 1} dari ${s.qs.length}.`);
    ui(
      `<div class="card"><b class="ok">${who}</b><div style="margin:6px 0 10px">${Q.q}</div><div class="row">${Q.opts
        .map((o, j) => `<button class="b" data-qa="${j}">${o}</button>`)
        .join("")}</div><div class="row" style="margin-top:8px"><button class="b g" id="qx">Nanti saja</button></div></div>`,
    );
    $("#qx").onclick = idle;
    document.querySelectorAll("[data-qa]").forEach(
      (b) =>
        (b.onclick = () => {
          if (+b.dataset.qa !== Q.a) {
            SND.sfx("bump");
            return dlg(who, ["Belum tepat. " + (Q.tip || "Coba hitung lagi."), "Mau coba lagi?"], () => quiz(who, s, i));
          }
          SND.sfx("quest");
          if (i + 1 < s.qs.length) return dlg(who, ["Benar!"], () => quiz(who, s, i + 1));
          const extra = s.go ? s.go() : [];
          hud();
          dlg(who, [...(s.ok || []), ...extra]);
        }),
    );
    const f = document.querySelector("[data-qa]");
    if (f) f.focus();
  }
  function offer(who, s) {
    busy = true;
    say(`${who} sepertinya punya cerita.`);
    ui(
      `<div class="card"><b class="ok">${who}</b><div class="qm" style="margin:4px 0">${s.go ? "Sepertinya ada kisah yang ingin dia ceritakan." : "Kamu bisa menanyakan hal tadi lagi."}</div><div class="row" style="margin-top:8px"><button class="b" id="sty">${s.label}</button><button class="b g" id="stn">Nanti saja</button></div></div>`,
    );
    $("#stn").onclick = idle;
    $("#sty").onclick = () => {
      if (s.qs) return dlg(who, s.lines, () => quiz(who, s, 0));
      const extra = s.go ? s.go() : [];
      hud();
      dlg(who, [...s.lines, ...extra]);
    };
    $("#sty").focus();
  }
  /* obrolan asli NPC (termasuk hadiah bawaan town.js) tetap jalan; tawaran cerita disisipkan di akhir dlg-nya */
  const _npc = H.npc;
  H.npc = (e) => {
    const s = e.story ? story(e) : null;
    if (!s) return _npc(e);
    const _d = dlg;
    dlg = (w, l, cb) => {
      dlg = _d;
      _d(w, l, () => {
        if (cb) cb();
        offer(w, s);
      });
    };
    try {
      _npc(e);
    } finally {
      dlg = _d;
    }
  };

  /* ---------- tampilan: tanda "!" di NPC, kilau di titik rahasia ---------- */
  const _ent = ent;
  ent = function (e, t, bob) {
    const X = e.x * 16,
      Y = e.y * 16 + OY;
    if (e.t === "spot") {
      ctx.globalAlpha = rm ? 0.8 : 0.5 + 0.4 * Math.sin(t / 220);
      ctx.fillStyle = "#fff6b0";
      ctx.fillRect(X + 7, Y + 5, 2, 7);
      ctx.fillRect(X + 4, Y + 8, 8, 2);
      ctx.globalAlpha = 1;
      return;
    }
    _ent(e, t, bob);
    if (e.story) {
      const s = story(e);
      if (s && s.go) mark(e, X, Y, bob, 8);
    }
  };

  /* ---------- menu Misi: bagian Misi Rahasia (muncul setelah ditemukan) ---------- */
  const row = (judul, selesai, tag, det, hadiah) =>
    `<div class="irow"><div><b>${judul}</b> ${selesai ? '<span class="ok">✔</span>' : ""}<br><small>${det}<br>Hadiah: ${hadiah}</small></div>${tag}</div>`;
  function secretHtml() {
    const s = F.sec,
      k = F.kb;
    let h = "";
    if (s && s.st) {
      const done = s.st === 2,
        mk = (b) => (b ? "✔" : "·");
      h += row(
        "Pecahan yang Terlupa",
        done,
        done ? '<span class="mt ok">Selesai</span>' : `<span class="mt wip">${nsh()}/3 pecahan</span>`,
        done
          ? "Ketiga pecahan sudah diserahkan kepada Petani di Desa Satuan."
          : `Kumpulkan tiga Pecahan Aksioma yang dititipkan Petani. Nelayan ${mk(s.sh.nelayan)} Anak Desa ${mk(s.sh.anak)} Rika ${mk(s.sh.rika)}. ${nsh() >= 3 ? "Serahkan ke Petani!" : ""}`,
        "150 koin · Ramuan · 10 GP",
      );
    }
    if (k && k.st) {
      const done = k.st === 3;
      let tag, det;
      if (done) {
        tag = '<span class="mt ok">Selesai</span>';
        det = "Cetak biru Nolan sudah ditemukan di Kota Bangun.";
      } else if (k.st === 2) {
        tag = '<span class="mt wip">Gali di pojok kiri bawah</span>';
        det = "Cari kilau di pojok kiri bawah Kota Bangun dan tekan Spasi di depannya.";
      } else {
        tag = `<span class="mt wip">${ncl()}/${REQ} petunjuk</span>`;
        det = `Kumpulkan petunjuk tentang arsitek Nolan dari warga Kota Bangun (minimal ${REQ}). ${ncl() >= REQ ? "Temui Kakek Penjual Peta!" : "Ada warga yang minta ramuan, koin, atau menunggu Golem dikalahkan."}`;
      }
      h += row("Jejak Sang Nol", done, tag, det, "300 koin · +2 Serangan · Batu Petunjuk · 25 GP");
    }
    const g = F.lg,
      r = F.rt;
    if (g && g.st) {
      const done = g.st >= 2;
      h += row(
        "Lagu yang Terlupa",
        done,
        done ? '<span class="mt ok">Selesai</span>' : `<span class="mt wip">${nnd()}/${REQL} nada</span>`,
        done
          ? "Lagu istana sudah dimainkan utuh oleh Pemain Musik di Kota Kerajaan."
          : `Kumpulkan nada lagu istana dari warga Kota Kerajaan (minimal ${REQL}). ${nnd() >= REQL ? "Temui Pemain Musik!" : "Ada yang minta Ramuan HP, ada yang menunjukkan kilau di belakang kandang."}`,
        "120 koin · 3 Ramuan Mana · 15 GP",
      );
    }
    if (r && r.st) {
      const done = r.st === 3;
      let tag, det;
      if (done) {
        tag = '<span class="mt ok">Selesai</span>';
        det = "Rahasia lemari di Istana sudah terungkap.";
      } else if (r.st === 2) {
        tag = '<span class="mt wip">Buka lemari rahasia</span>';
        det = "Cari kilau di pojok kanan atas aula tahta Istana dan tekan Spasi di depannya.";
      } else {
        tag = `<span class="mt wip">${nfk()}/${REQR} catatan</span>`;
        det = `Tanya Ratu, Pangeran, Putri, Pejabat, Tabib, dan Ksatria di Istana (minimal ${REQR}). ${nfk() >= REQR ? "Temui Pelayan Istana!" : ""}`;
      }
      h += row("Rahasia Ruang Tahta", done, tag, det, "500 koin · 3 Poin Status · 3 Ramuan HP · 30 GP");
    }
    const c = F.lc,
      y = F.ly;
    if (c && c.st) {
      const done = c.st === 7,
        L = ["", "Tanya Anak Kota", "Temui Bangsawati", "Temui Pembaca Buku", "Temui Pemain Kecapi", "Kembalikan kail ke Nelayan Kanal", "Cari tiang keenam di tepi kanal"];
      h += row(
        "Kail Perak Sang Nelayan",
        done,
        done ? '<span class="mt ok">Selesai</span>' : `<span class="mt wip">Tahap ${c.st}/6</span>`,
        done ? "Kotak di tiang keenam sudah ditemukan di Kota Logaritma." : `Rantai penelusuran kail perak milik Nelayan Kanal. Langkah berikut: ${L[c.st]}.`,
        "220 koin · 1 Poin Status · Batu Petunjuk · 20 GP",
      );
    }
    if (y && y.st) {
      const done = y.st === 3;
      let tag, det;
      if (done) {
        tag = '<span class="mt ok">Selesai</span>';
        det = "Segel vas karang di Istana Logaritma sudah terbuka.";
      } else if (y.st === 2) {
        tag = '<span class="mt wip">Buka vas karang</span>';
        det = "Cari kilau di dekat vas karang, pojok kanan atas aula singgasana, dan tekan Spasi di depannya.";
      } else {
        tag = `<span class="mt wip">${nly()}/${REQY} petunjuk</span>`;
        det = `Tanya penghuni Istana Logaritma tentang segel vas (minimal ${REQY}). ${nly() >= REQY ? "Temui Penasihat Kerajaan untuk menghadapi tiga pertanyaannya!" : ""}`;
      }
      h += row("Segel Vas Karang", done, tag, det, "600 koin · 3 Poin Status · 3 Ramuan Mana · 40 GP");
    }
    return h ? `<div class="qm" style="margin:10px 0 4px">Misi Rahasia</div>${h}` : "";
  }
  const _mis = UIX.missions;
  UIX.missions = function () {
    const wasOpen = UIX.open && !document.querySelector("#mmis").hidden;
    _mis();
    if (!wasOpen) document.querySelector("#mlist").insertAdjacentHTML("beforeend", secretHtml());
  };
  const bm = document.querySelector("#bmis");
  if (bm) bm.onclick = UIX.missions;
})();
