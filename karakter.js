/* ===== Numeria Quest — Desain karakter utama baru (3 job) =====
   Dimuat PALING AKHIR (setelah istana.js). Harus setelah world.js, karena world.js punya sistem
   pewarnaan perlengkapan (applyEq) yang menimpa palet sprite memakai huruf palet lama.
   Isi:
   - Pembawa Pedang : "Sejarang" (Royal Commander) — sprite battle 96x128, rambut hitam runcing + jepit emas,
                      jas & jubah navy berlist emas, selempang merah, pedang menyala api (digambar lewat kode)
   - Penyihir       : badan Sejarang 96x128 + jepit bintang emas, tongkat emas berkristal biru (digambar lewat kode)
   - Pemanah        : badan Sejarang 96x128 + kantung panah di punggung, busur emas-biru (digambar lewat kode)
   Cara kerja singkat:
   1. SP.hero  = sprite karakter di dunia (16x24, tampak depan)  -> berganti otomatis sesuai job
   2. SP.heroB = sprite karakter saat battle (32x36, menghadap kanan) -> berganti otomatis sesuai job
                 (SEMUA job: battle memakai sprite 96x128 — KRK_SEJ / KRK_MAG / KRK_ARC, lihat bagian "Sejarang" di bawah)
   3. heroB()  = fungsi gambar battle disalin dari script.js, bedanya posisi tangan (HAND) tiap job
                 bisa diatur, dan pedang punya api yang berkedip.
   Tidak ada file lain yang perlu diubah selain index.html (menambah satu baris script). */

/* data gambar: tiap huruf = satu warna di palet "p", titik (.) = kosong */
const KRK = {
  BATTLE: {
    sword: {
      p: {
        K: "#120e18",
        S: "#eab88f",
        s: "#c48a66",
        H: "#2b2533",
        h: "#4f4862",
        A: "#2c2b38",
        a: "#4a4960",
        Y: "#f4b83a",
        y: "#b87a1c",
        R: "#a02438",
        r: "#5e1424",
        E: "#ffffff",
        e: "#16121c",
        B: "#ff9a2a",
        b: "#ffe35a",
        G: "#f4b83a",
        L: "#3a2a2a",
        M: "#a02438",
      },
      m: [
        "..........KK...KHHHHhhhK........",
        ".........KHHKKKHHHHHHHHhK.......",
        "..........KHHHHHHhHHHHHHK.......",
        "..........KhHHHHHHSSSSSSHK......",
        ".........KHHHHHHHSSSSSSHHK......",
        "........KHHHHHHHSSSSSSEeeK......",
        ".........KKKHHHHSSSSSSEeeSK.....",
        "............KHKSSSSSSSEeeSK.....",
        ".............K.KSSSSSSSSSSK.....",
        "...............KSSSSSSssMMK.....",
        ".............KKAAASSSSsssK......",
        "............KYYaaYYYYYKKK.......",
        "...........KKAaaaAAAAaaaaKK.....",
        "..........KYYAaaaaaaAaaaaaYK....",
        "..........KYAAAaaaaAAaAAAKK.....",
        "...........KAAYYYYYYYYAAAAK.....",
        "...........KAAAAAAayaaAAAAAK....",
        "..........KAAAAAAAayaaaAAYYAK...",
        "..........KAAAAAAAayaYYAAYYYK...",
        "..........KAAAAAAAayaYYAAAYYYK..",
        "..........KaaAAAAAayaaaAKAAYYAK.",
        "..........KaaAAAAAayaaAAKKAAAAK.",
        "...........KKKAAAAAyAAAKK.KAAAK.",
        "............KYYYYYYYYYYYYK.KKK..",
        "............KyyyyyYYyyyyyK......",
        "............KAARRRRAAAAAK.......",
        "...........KaaaRRRRAAAAAK.......",
        "...........KaaaArrrAAYYYYK......",
        "...........KAAAArrrAAYaaYK......",
        "..........KAAAAAKKKAAYYYYKK.....",
        ".........KYYYYYYK..KYYYYYYYK....",
        ".........KLLLLLLLK.KLLLLLLLLK...",
        ".........KLLLLLLLK.KLLLLLLLLK...",
        ".........KLLLLLLLK.KLLLLLLLLLK..",
        ".........KLLLLLLLK.KLLLLLLLLLK..",
        "..........KKKKKKK...KKKKKKKKK...",
      ],
    },
    mage: {
      p: {
        K: "#120e18",
        S: "#e2b08c",
        s: "#b88460",
        H: "#1c1626",
        h: "#3a3050",
        C: "#2c2260",
        c: "#443a8c",
        R: "#2e2870",
        r: "#1c1850",
        P: "#5a46b0",
        Y: "#f4b83a",
        y: "#b87a1c",
        E: "#ffffff",
        e: "#16121c",
        G: "#2a2040",
        V: "#c06aff",
        L: "#1c1850",
        B: "#c99aff",
        b: "#8a5ae0",
        M: "#a02438",
      },
      m: [
        "...............KccccCKK.........",
        "..............KccccccccK........",
        "............KKrCcccYCCCCK.......",
        "...........KCrrCCCCYYGGCCK......",
        "..........KCrrrCCCCCGYYYCK......",
        ".........KCrrrrrCCCGGGHHYYK.....",
        ".........KCrrrrrCCCGGGEeeYK.....",
        "..........KCrrrrCCCGGGEeeYYK....",
        "..........KCrrrCCCCGGGGSSSYK....",
        "...........KrrCCCCCCssssSYYK....",
        "...........KKCCCCCCCsssssSK.....",
        "..........KYYYYCCCCCGssYYYYK....",
        "..........KYYYYYYYYYYYYYYYYK....",
        "..........KCCCCCCCCVCRRCCKK.....",
        "..........KCCCCCCCCGCRRRcCK.....",
        "...........KCCCCCCCCCRRRccK.....",
        "...........KYCyyyyyyyyRRRcK.....",
        "..........KCYRRRRYPPPYRRRRcK....",
        "..........KYrRRRRYPPPYRRRRRRK...",
        ".........KCYrRRRRYPPPYRRRRCCK...",
        ".........KCrrRRRRYGGGYcRCCCCK...",
        "........KCYrrYYYYYGVGYYYYYYYYK..",
        "........KCrrryyyyyGVGyyyyCCCK...",
        ".......KCYrrRRRRRYGGGYccRCKK....",
        ".......KCYrrRRRRRYPPPYccRRK.....",
        "......KCYrrrRRRRRYyyyYccRRK.....",
        "......KCYrrrRRRRRYyYyYccRRK.....",
        "......KYCCrrRRRRRYyyyYcccRK.....",
        ".....KCYCCrrRRRRRYPPPYcccRK.....",
        ".....KYYCCrrRRRRRYPPPYcccRK.....",
        "....KCYCCCCRRRRRRYPPPYcccRK.....",
        "....KYYCCCCRRRRRRYPPPYcccRRK....",
        "....KYCCCCCYYYYYYYYYYYYYYYYYK...",
        "...KYYCCCCcyyyyyyyyyyyyyyyyyK...",
        "...KYKKKKKcKLLLLLLLKKLLLLLLLLK..",
        "....K.....K.KKKKKKK..KKKKKKKK...",
      ],
    },
    archer: {
      p: {
        K: "#120e18",
        S: "#eab88f",
        s: "#c48a66",
        H: "#2b2533",
        h: "#4f4862",
        T: "#ece2c8",
        t: "#bfb394",
        V: "#8a2434",
        v: "#561422",
        N: "#3f8a4e",
        n: "#27573a",
        P: "#2f6040",
        p: "#1d4029",
        W: "#ece8dc",
        w: "#b4b0a0",
        L: "#7a4a24",
        l: "#4e2e14",
        E: "#ffffff",
        e: "#16121c",
        Q: "#a8783c",
        G: "#8a5a2b",
        B: "#ffd166",
        b: "#c9a050",
        M: "#a02438",
      },
      m: [
        "...........KK..KHHHHhhhK........",
        "..........KHHKKHHHHHHHHhK.......",
        "...........KHHHHHhHHHHHHK.......",
        "............KHHHHHSSSSSSHK......",
        "...........KHHHHHSSSSSSSSK......",
        ".........KKHHHHHSSSSSSEeeK......",
        "........KWVHHHHHSSSSSSEeeSK.....",
        "........KWWWWHWSSSSSSSEeeSK.....",
        "........KWWKQQQKSSSSSSSSSSK.....",
        ".........KQQQLQKSSSSSSssMK......",
        ".........KQlQLQKKKSSSSsssK......",
        ".........KQllQLQKKsTTTTTTK......",
        "..........KQlQTTTTssTTTTTKK.....",
        "..........KQlTQQVVVnnnnnnntK....",
        "..........KQTTTQQVVNNNNNNNTK....",
        "..........KlTTTNVQQVVvTTTTTTK...",
        "..........KlTTTNVVQQVvvTNNNNNK..",
        "...........KTTTNVVVVQQvvNNNNNK..",
        "...........KTTTNVVVVVQQvNNNNNK..",
        "...........KtTTNVVVVVvvQKKKKK...",
        "...........KtTTNVVVVVvvTK.......",
        "...........KtTTNVVVVVvvTK.......",
        "..........KQKlTNVVVVVvTKK.......",
        "...........KKLLLLLBBLLLLLK......",
        "............KllllllllllllK......",
        "............KPPPPPPPPPPPK.......",
        "...........KPPPPPPPPpppPK.......",
        "...........KPPPPPPPPpppPPK......",
        "...........KPPPPPPPPpppPPK......",
        "..........KwwwwwwwPPPPPPPKK.....",
        "..........KWWWWWWWKwwwwwwwWK....",
        "..........KWWWWWWWKWWWWWWWWK....",
        "..........KWWWWWWWKWWWWWWWWKK...",
        "..........KLLLLLLLKWWWWWLLLLLK..",
        "..........KLLLLLLLKLLLLLLLLLLK..",
        "...........KKKKKKK.KKKKKKKKKK...",
      ],
    },
  },
  DUNIA: {
    sword: {
      p: {
        K: "#0d0b16",
        S: "#f1c9a3",
        s: "#d6a07e",
        H: "#1d1b2b",
        h: "#3a3852",
        A: "#1f2558",
        a: "#2f3a82",
        Y: "#f4b83a",
        y: "#b87a1c",
        R: "#a42a3d",
        E: "#ffffff",
        e: "#16121c",
        B: "#ff9a2a",
        b: "#ffe35a",
        L: "#4a3830",
      },
      m: [
        "....KHHHHHHK..K.",
        "....KHHhHHhK.KBK",
        "...KHHSSSHHKKbK.",
        "...KHSSSSSSHHBK.",
        "...KSSSSSSSSKBK.",
        "..KHSSEeSeESKBbK",
        "...KSSeeSeeSKBbK",
        "....KSSSSSSKKBbK",
        "....KSSSsSSKKBbK",
        "...KYYYYYYYYYBbK",
        "...KaaAAAAAaaBbK",
        "..KAAaAaaaAaABbK",
        "..KAAAAYYYAAABbK",
        "..KAAAAaaaAAABK.",
        "..KAAAAaYaAAYYYK",
        "..KYYAAaaaAAKYK.",
        "..KYYAAaaaAAKYK.",
        "...KKYYYYYYYKK..",
        "....KAARRRAAK...",
        "....KAARRRAAK...",
        "....KAARRRAAK...",
        "....KAAAKAAAK...",
        "....KLLLKLLLK...",
        "....KLLLKLLLK...",
      ],
      f: [
        0,
        [
          "....KAARRRAAK...",
          "....KLLLKAAAK...",
          "....KLLLKLLLK...",
          "....KLLLKLLLK...",
        ],
        [
          "....KAARRRAAK...",
          "....KAAAKLLLK...",
          "....KLLLKLLLK...",
          "....KLLLKLLLK...",
        ],
      ],
      oy: 8,
    },
    mage: {
      p: {
        K: "#120e18",
        S: "#e2b08c",
        s: "#b88460",
        H: "#1c1626",
        C: "#2c2260",
        c: "#443a8c",
        R: "#2e2870",
        r: "#1c1850",
        P: "#5a46b0",
        Y: "#f4b83a",
        y: "#b87a1c",
        E: "#ffffff",
        e: "#16121c",
        G: "#2a2040",
        V: "#c06aff",
        L: "#1c1850",
        D: "#5a4a30",
      },
      m: [
        "....KKCCCCKK....",
        "...KCCCCCCCCK.K.",
        "...KCCCCCCCCKKVK",
        "..KCCCGGGGCCCVVV",
        "..KCCYYYYYYYCVEV",
        "..KCCGEeSeECCVVV",
        "..KCCGEeSeECCYYY",
        "..KCCGSSSSSCCCDK",
        "..KCCCsssssCCCDK",
        ".KYCCCCCCCCCCCDK",
        ".KCCCCCCCCCCCCDK",
        "..KRRCCCCCCCRRDK",
        "..KRRCCCCCCCRRDK",
        "..KRRyyyyyyyRRDK",
        "..KRRRRYPYRRRRDK",
        "..KRRRRYPYRRRRDK",
        "..KGGRRGGGRRRKDK",
        "..KGGYYGVGYYYKDK",
        "..KRYYYGGGYYYKDK",
        ".KRRRRRGGGRRRRDK",
        ".KRRRRRYPYRRRRDK",
        ".KYYYYYYYYYYYYDK",
        ".KyyyyyyyyyyyyDK",
        "..KKKLLKKLLKKKDK",
      ],
      f: [
        0,
        [
          ".KRRRRRYPYRRRRDK",
          ".KYYYYYYYYYYYYDK",
          ".KyyyyyyyyyyyyDK",
          "..KLLLKKKKKKKKDK",
        ],
        [
          ".KRRRRRYPYRRRRDK",
          ".KYYYYYYYYYYYYDK",
          ".KyyyyyyyyyyyyDK",
          "..KKKKKKKKLLLKDK",
        ],
      ],
      oy: 8,
    },
    archer: {
      p: {
        K: "#120e18",
        S: "#eab88f",
        s: "#c48a66",
        H: "#2b2533",
        h: "#4f4862",
        T: "#ece2c8",
        t: "#bfb394",
        V: "#8a2434",
        N: "#3f8a4e",
        P: "#2f6040",
        p: "#1d4029",
        W: "#ece8dc",
        w: "#b4b0a0",
        L: "#7a4a24",
        l: "#4e2e14",
        E: "#ffffff",
        e: "#16121c",
        Q: "#a8783c",
        B: "#ffd166",
      },
      m: [
        "....KHHHHHHK....",
        "....KHHhHHhK....",
        "...KHHSSSHHKK...",
        "...KHSSSSSSHHK..",
        "...KSSSSSSSSKK..",
        "..KHSSEeSeESKLK.",
        "..KKSSeeSeeSKLK.",
        ".KWVKSSSSSSK.KLK",
        ".KQKKSSSsSSK.KLK",
        "..K.KNNNNNNNKKLK",
        "...KKTTTTTTTKKLK",
        "..KTTTQVVVNTTTLK",
        "..KTTTNQVVNTTTLK",
        "..KTTTNVQVNTTTLK",
        "..KTTTNVVQNTTTLK",
        "..KNNTNVVVQTTTLK",
        "..KNNTNVVVNQKLK.",
        "...KKLLBBLLLKLK.",
        "....KLLBBLLLKK..",
        "....KWWWKWWWK...",
        "....KWWWKWWWK...",
        "....KPPPKPPPK...",
        "....KLLLKLLLK...",
        "....KLLLKLLLK...",
      ],
      f: [
        0,
        [
          "....KWWWKWWWK...",
          "....KLLLKPPPK...",
          "....KLLLKLLLK...",
          "....KLLLKLLLK...",
        ],
        [
          "....KWWWKWWWK...",
          "....KPPPKLLLK...",
          "....KLLLKLLLK...",
          "....KLLLKLLLK...",
        ],
      ],
      oy: 8,
    },
  },
};

/* ===== Sejarang — sprite battle Pembawa Pedang, 96x128 piksel, menghadap kanan =====
   Tanpa pedang: bilah/gagang digambar oleh heroB() di bawah supaya tetap bisa berubah warna
   (api, elemen, pelangi saat ulti) dan mengikuti pose tebasan. */
const KRK_SEJ = {
  p: {
    K: "#0d0b16",
    H: "#1d1b2b",
    h: "#3a3852",
    g: "#0f0d19",
    S: "#f1c9a3",
    s: "#d6a07e",
    W: "#ece4d2",
    w: "#b9b2a4",
    N: "#1f2558",
    n: "#2f3a82",
    d: "#121640",
    Y: "#f3b936",
    y: "#b9801c",
    z: "#ffe488",
    R: "#a42a3d",
    r: "#5f1727",
    B: "#4a3830",
    b: "#2e221e",
    L: "#3b2c2a",
    E: "#ffffff",
    e: "#14101c",
    G: "#2d5ce0",
  },
  m: [
    "...........................................K....................................................",
    "..........................................KHK...................................................",
    ".........................................KHHK...................................................",
    "...............................K.........KHHHK..................................................",
    "..............................KHK.......KHHHHK........K.........................................",
    "..............................KHHK.....KHHHHHHK.....KKHK........................................",
    "..............................KHHHKK..KHHHHHHHK....KHHHK........................................",
    ".............................KHHHHHHK.KHHHHHHHHK.KKHHHHHK.......................................",
    ".............................KHHHHHHHKHHHHhHHHHKKHHHHHHHK.......................................",
    ".............................KHHHHHHHHHHHhhhhHHHHHHHHHHHHKKK....................................",
    "........................K....KHHHHHHHHHHHhhhhhhHHHHHHHHHHKYYK...................................",
    ".......................KHKK.KHHHHHHHHHHHhhhhhhhhhHHHHHHHHHYYKKKKK...............................",
    ".......................KHHHKKHHhHHHHHHHhhhhhhhhhhhhHHHHHHHYYHHHHHK..............................",
    "......................KHHHHHHHhhhHHHHHhhhhhhhhhhhhHHHHHYYYzzYYYHHK..............................",
    "......................KHHHHHHHhhhhHHHHhhhhhhhhhhhhHHHHHYYYzzYYYHHHK.............................",
    ".....................KHHHHHHHhhhhhhhHhhhhhhhhhhhhHHHHHHHHHYYHHHHHHK.............................",
    ".....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHYYHHHHHHK.............................",
    "....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHYYHHHHHHHK............................",
    "....................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHHHhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHHHHHHHHHhhhhhHHHHHHHHHHHHHHHHHHHHKHHHHHHK.............................",
    "...................KHHHgHHHHHHHHHHHHhHHHHHHHHHHHHHHHHHHHHHHHHHHHHK..............................",
    "...................KHHHgggHHHHHHHHHHHHHHHHHHHHHHHHSSSHHHHHHHHHHHK...............................",
    "....................KHHggggHHHHHHHHHHHHHHHHHHHHHHHHSSSSHHHHHHHHHK...............................",
    "....................KHHggggggHHHHHHHHHHHHHHHHHHHHHHHSSSHSSSHHHHSK...............................",
    "....................KHHggggggggHHHHHHHHHHHHHHHHHHHHHHSHHSSSSSSHSSK..............................",
    "....................KHHHgggggggHHHHHHHHHHHHHHHHSHHHHHHHeeeeeeSSSSK..............................",
    "....................KHHHggggggggHHHHHHgggggggHsSSSHHHHSSSSSSSSSSSSK.............................",
    "....................KHHHggggggggHHHHHHgggggggHsSSSSHHHeeeeeeSSSSSSK.............................",
    "....................KHHHgggggggggHHHHHgggggggHsSSSSSHSEEEeeeSSSSSSK.............................",
    ".....................KHHgggggggggHHHHHgggggggHsSSSSSSSEEEeeeSSSSSK..............................",
    ".....................KHHgggggggggHHHHHgggggggssSSSSSSSEEEeeeSSSSSK..............................",
    "......................KHHgggggggggHHHHgggggggssSSSSSSSsssSSSSSSSSSK..............................",
    ".......................KHHggggggggHHHHgggggggsssSSSSSSSSSSSSSSSSSSSK..............................",
    "........................KHgggggggggHHHggggggHsssSSSSSSSSSSSSSSSSK...............................",
    "........................KHHggggggggHHHggggggssssSSSSSSSSSSSSSSSSK...............................",
    ".........................KHHggggggHHHHggggggKsssSSSSSSSSSSSSSSSSK...............................",
    "..........................KHHggggHHHHHggggggKSssSSSSSSSSSSSSSSSK................................",
    "..........................KHHgggHHHHHHggggggKKssSSSSSSSssssssSK.................................",
    "...........................KHHgHHHHHHHggggggK.KsSSSSSSSSSSSSSK..................................",
    "............................KHHHHHHHHHggggggK.KSSSSSSSSSSSSSK...................................",
    ".............................KHHHHHHHHggggggK.KsSSSSSSSSSSSK...................................",
    "..............................KKHHHHHHgggHKKK.KssssssSSSSSSSK..................................",
    "................................KHHHHHgHYYYKYKKssssssSSSYSSSKKYK................................",
    "..............................KKYKHHHHzYYYYYKYwwwwwWWWWWYYYzYYYKKKKKK...........................",
    "..........................KKKKYYYYzHzzzzYYYYKYwwwwwWWWWWYYYzzzzYYYYYYK..........................",
    ".........................KYYYYzzzzzzzzzzYYYYYwYwwwwWWWWWYYYYzzzzzzzYYK..........................",
    "........................KKYYYYYzzzzzzzzzzYYYYYYwwwwWWWWWYYYYzzzzzzzYYYK.........................",
    ".......................KYYYYYYYzzzzzzYYYYYYYYYYYwwwWWWWWYYYYYYYYYYYzYYK.........................",
    ".......................KYYYYYYYYzYYYYYYYYYYYYYYYwwwWWWWWWYYYYYYYYYYYYYYK........................",
    ".......................KYNYYYYYYYYYYYYYzzYYYYYrwYwwWWWWWWYYYYYYYYYYYYYYK........................",
    "......................KYYNYYYYyYYYYYYYYzzYYYYYrrYwwWWWWWWYYYYYYYzzYYYYYYK.......................",
    "......................KYNNYyyyyyyyyyYYYYYYYYYYrrrYwWWWWWWYYYYYYYzzYYYYYYK.......................",
    ".....................KYYddYYyyyyyzzyyyyyyYYYYrrrrYRNNNNNnyyyyyyyyyyyyyyyYK......................",
    ".....................KYNddYYYyyyyzzyyyyyyyYYYzrrrrRNNNNNnYYyyyyyyyyyyyyYK.......................",
    "....................KYYdddYYYYyyyyyyyyyyyyYYYzrrrrrRNNNNnYYYYYdddddNNNNNNK......................",
    "....................KYNdddddYYyyyyyyyyyyyyyYRRrrrrrRRNNNnnnnYYdddddNNNNNNK......................",
    "...................KYYNdndddddYyyyyyyyyyyyyyRRRrrrrrRNNNnnnnnndddddNNNNNNK......................",
    "...................KYNNdnddddddYyYYYYYYdNNNNdRRRrrrrrRNNNnnnnnnddddNNNNNNK......................",
    "..................KYYNddnddddddddYddddddNNNNdNRRrrrrrRRNNnnnnnzdddddNNNNNNK.....................",
    "..................KYNNdnnddddddddKddddddNNNNdNRRRzzrrrRNNnnnnnzdddddNNNNNNK.....................",
    ".................KYYNNdnnnddddddKdddddddNNNNdNNRRzzrrrrGGnnnnnndddddNNNNNNK.....................",
    ".................KYNNNdnnnddddddKdddddddNNNNdNNNRRrrrrrGGnnnnnndddddNNNNNNK.....................",
    "................KYYNNddnnnddddddKdddddddNNNNdNNNRRRrrrrrRnnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRrrrrrrRnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRRrrrrrRnnnnnnddddNNNNNNNK....................",
    "...............KYYNNddnnnnddddddddddddddNNNNdNNNNNRRRrzzrrRnnnnndddddNNNNNNKKKK.................",
    "...............KYYNNddnnnnndddddddddddddNNNNNdNNNNNRRrzzrrRRnnzzddYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNRRRrrrrrRnnzzndYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNNRRRrrrrrRnnnndyyyyyyyyyyyNNNK.K.............",
    "..............KYYNNddnnnnnndddddddddddddNNNNNdNNNNNNNRRrrrrrRRnnndNNNNNNNNNNNNNNKKBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNRRRrrzzrRnnnYNNNNNNBBBBBBBBBBBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNdRRrrzzRRRnnYNNNNNNBbbbbbbbbbbBK...........",
    "..............KYYNNdnnnnnnnddddddddddddddNNNNdNNNNNNNdRRRrRRRRRRnYNNNNNNBBBBBBBBBBBBK...........",
    "..............KYNNNdnnnnnndddddddddddddddNNNNdNNNNNNNdNRRRRRRRRRnYKKNNNNBBBBBBBBBBBBK...........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNdNNRRRRRRRRRYK.KKNBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNNNNRRRRRnnnnYK...KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNNNNNNNNNNNNNRnnnnnnnYbK..KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddLdddNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBBK..........",
    "............KYYNNNddnnnnnndddddddddLdNNNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBK...........",
    "............KYYNNNdnnnnnnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBBBBBBBBBBBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBbbbbbbbbbBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYYYYYyLLLLLLLLLLLLK.....KbbbbbbbbbBK...........",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRyyyyyyyyRRNNNNNNNNNNK.....KBKKKKKKKKK............",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRRRRRRRRRRRNNNNNNNNNNK......K.....................",
    "...........KYYNNNddnnyynnddddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNNyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNdyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNYKKK........................",
    "..........KYYNNNddnnnyynndddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNYYYKK......................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNRRRYYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRRYK....................",
    "..........KYYNNNddnnnyyndddddddddddddddNNNNNNRRRrrrrrrRRRRNNNNNNNNNNNNrrrrYK....................",
    "..........KYYNNdddnnnyydddddddddddYYdddNNNNNNRRRrrrrrrRRRRNNNNNNNNNYYYNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddNYYYYNNNNNRRRrrrrrrRRRRNNNNNYYYYNNNNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddKddNNYYYYNRRRrrrrrrRRRRNYYYYNNKrrrrrrrrRYK...................",
    ".........KYYNNNddnnnnnndddddddddddNKddddNNNNYYYYYYYYYYYYYYYNNNNNNKrrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnnddddddddddddNKdddNNNNNdRRRRRRRRRRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnndddddddddddNNKdddNNNNNddKKKKKKKKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnndddddddrddddNNKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNdnnnnndddddddrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnnnddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnddddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    ".......KYYNNNNddndddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnNKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrrRYK.................",
    "........KzYNNNdNNNNNNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KzYNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNNNNNrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNNNNNNNNNNrrrKddddNNNNNddKK....KYYYYYYYYYYYYYYRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNYYNNNNNNNNNNKdddddddddddKK....KYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYzNNNNNNNYYYYYYNNNNNBYYYYYYYYYYYYYYYYK...KBYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYYzNNNNYYYKKKYYYYNNBByyyyyyyyyyyyyyyyK...KByyyyyyyyyyyyyyBKKKKKKKKK...................",
    "..........KYzNYYYKKK...KKYYYNBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBBBBK.........................",
    "..........KYYYYKK........KYYBBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBhhhhKK.......................",
    "..........KYKKK...........KYBBBBBBBBBBBBBBBBBBBBK..KBBBBBBBBBBBBBBBBBBBBBK......................",
    "...........K...............KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "............................KKKKKKKKKKKKKKKKKKKK....KKKKKKKKKKKKKKKKKKKKKK......................",
    "................................................................................................",
  ],
};
/* ===== Penyihir & Pemanah — badan 96x128 sama dengan Sejarang (satu karakter, kostum sama seperti di referensi) =====
   Penyihir : jepit rambut berbentuk bintang. Pemanah : kantung panah berisi 3 anak panah di belakang bahu.
   Tongkat dan busur TIDAK ada di sprite: digambar lewat kode (krkSenjata) supaya ikut pose & bisa berkedip. */
const KRK_MAG = {
  p: KRK_SEJ.p,
  m: [
    "...........................................K....................................................",
    "..........................................KHK...................................................",
    ".........................................KHHK...................................................",
    "...............................K.........KHHHK..................................................",
    "..............................KHK.......KHHHHK........K.........................................",
    "..............................KHHK.....KHHHHHHK.....KKHK........................................",
    "..............................KHHHKK..KHHHHHHHK....KHHHK........................................",
    ".............................KHHHHHHK.KHHHHHHHHK.KKHHHHHK.......................................",
    ".............................KHHHHHHHKHHHHhHHHHKKHHHHHHHK.......................................",
    ".............................KHHHHHHHHHHHhhhhHHHHHHHHHHHHKKK....................................",
    "........................K....KHHHHHHHHHHHhhhhhhHHHHHHHHHHKYYK...................................",
    ".......................KHKK.KHHHHHHHHHHHhhhhhhhhhHHHHHHHHHYYKKKKK...............................",
    ".......................KHHHKKHHhHHHHHHHhhhhhhhhhhhhHHHHHHYzzYHHHHK..............................",
    "......................KHHHHHHHhhhHHHHHhhhhhhhhhhhhHHHHHYYzzzzYYHHK..............................",
    "......................KHHHHHHHhhhhHHHHhhhhhhhhhhhhHHHHHYYzzzzYYHHHK.............................",
    ".....................KHHHHHHHhhhhhhhHhhhhhhhhhhhhHHHHHHHHYzzYHHHHHK.............................",
    ".....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHYYHHHHHHK.............................",
    "....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHYYHHHHHHHK............................",
    "....................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHHHhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHHHHHHHHHhhhhhHHHHHHHHHHHHHHHHHHHHKHHHHHHK.............................",
    "...................KHHHgHHHHHHHHHHHHhHHHHHHHHHHHHHHHHHHHHHHHHHHHHK..............................",
    "...................KHHHgggHHHHHHHHHHHHHHHHHHHHHHHHSSSHHHHHHHHHHHK...............................",
    "....................KHHggggHHHHHHHHHHHHHHHHHHHHHHHHSSSSHHHHHHHHHK...............................",
    "....................KHHggggggHHHHHHHHHHHHHHHHHHHHHHHSSSHSSSHHHHSK...............................",
    "....................KHHggggggggHHHHHHHHHHHHHHHHHHHHHHSHHSSSSSSHSSK..............................",
    "....................KHHHgggggggHHHHHHHHHHHHHHHHSHHHHHHHeeeeeeSSSSK..............................",
    "....................KHHHggggggggHHHHHHgggggggHsSSSHHHHSSSSSSSSSSSSK.............................",
    "....................KHHHggggggggHHHHHHgggggggHsSSSSHHHeeeeeeSSSSSSK.............................",
    "....................KHHHgggggggggHHHHHgggggggHsSSSSSHSEEEeeeSSSSSSK.............................",
    ".....................KHHgggggggggHHHHHgggggggHsSSSSSSSEEEeeeSSSSSK..............................",
    ".....................KHHgggggggggHHHHHgggggggssSSSSSSSEEEeeeSSSSSK..............................",
    "......................KHHgggggggggHHHHgggggggssSSSSSSSsssSSSSSSSSSK.............................",
    ".......................KHHggggggggHHHHgggggggsssSSSSSSSSSSSSSSSSSSSK............................",
    "........................KHgggggggggHHHggggggHsssSSSSSSSSSSSSSSSSK...............................",
    "........................KHHggggggggHHHggggggssssSSSSSSSSSSSSSSSSK...............................",
    ".........................KHHggggggHHHHggggggKsssSSSSSSSSSSSSSSSSK...............................",
    "..........................KHHggggHHHHHggggggKSssSSSSSSSSSSSSSSSK................................",
    "..........................KHHgggHHHHHHggggggKKssSSSSSSSssssssSK.................................",
    "...........................KHHgHHHHHHHggggggK.KsSSSSSSSSSSSSSK..................................",
    "............................KHHHHHHHHHggggggK.KSSSSSSSSSSSSSK...................................",
    ".............................KHHHHHHHHggggggK.KsSSSSSSSSSSSK....................................",
    "..............................KKHHHHHHgggHKKK.KssssssSSSSSSSK...................................",
    "................................KHHHHHgHYYYKYKKssssssSSSYSSSKKYK................................",
    "..............................KKYKHHHHzYYYYYKYwwwwwWWWWWYYYzYYYKKKKKK...........................",
    "..........................KKKKYYYYzHzzzzYYYYKYwwwwwWWWWWYYYzzzzYYYYYYK..........................",
    ".........................KYYYYzzzzzzzzzzYYYYYwYwwwwWWWWWYYYYzzzzzzzYYK..........................",
    "........................KKYYYYYzzzzzzzzzzYYYYYYwwwwWWWWWYYYYzzzzzzzYYYK.........................",
    ".......................KYYYYYYYzzzzzzYYYYYYYYYYYwwwWWWWWYYYYYYYYYYYzYYK.........................",
    ".......................KYYYYYYYYzYYYYYYYYYYYYYYYwwwWWWWWWYYYYYYYYYYYYYYK........................",
    ".......................KYNYYYYYYYYYYYYYzzYYYYYrwYwwWWWWWWYYYYYYYYYYYYYYK........................",
    "......................KYYNYYYYyYYYYYYYYzzYYYYYrrYwwWWWWWWYYYYYYYzzYYYYYYK.......................",
    "......................KYNNYyyyyyyyyyYYYYYYYYYYrrrYwWWWWWWYYYYYYYzzYYYYYYK.......................",
    ".....................KYYddYYyyyyyzzyyyyyyYYYYrrrrYRNNNNNnyyyyyyyyyyyyyyyYK......................",
    ".....................KYNddYYYyyyyzzyyyyyyyYYYzrrrrRNNNNNnYYyyyyyyyyyyyyYK.......................",
    "....................KYYdddYYYYyyyyyyyyyyyyYYYzrrrrrRNNNNnYYYYYdddddNNNNNNK......................",
    "....................KYNdddddYYyyyyyyyyyyyyyYRRrrrrrRRNNNnnnnYYdddddNNNNNNK......................",
    "...................KYYNdndddddYyyyyyyyyyyyyyRRRrrrrrRNNNnnnnnndddddNNNNNNK......................",
    "...................KYNNdnddddddYyYYYYYYdNNNNdRRRrrrrrRNNNnnnnnnddddNNNNNNK......................",
    "..................KYYNddnddddddddYddddddNNNNdNRRrrrrrRRNNnnnnnzdddddNNNNNNK.....................",
    "..................KYNNdnnddddddddKddddddNNNNdNRRRzzrrrRNNnnnnnzdddddNNNNNNK.....................",
    ".................KYYNNdnnnddddddKdddddddNNNNdNNRRzzrrrrGGnnnnnndddddNNNNNNK.....................",
    ".................KYNNNdnnnddddddKdddddddNNNNdNNNRRrrrrrGGnnnnnndddddNNNNNNK.....................",
    "................KYYNNddnnnddddddKdddddddNNNNdNNNRRRrrrrrRnnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRrrrrrrRnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRRrrrrrRnnnnnnddddNNNNNNNK....................",
    "...............KYYNNddnnnnddddddddddddddNNNNdNNNNNRRRrzzrrRnnnnndddddNNNNNNKKKK.................",
    "...............KYYNNddnnnnndddddddddddddNNNNNdNNNNNRRrzzrrRRnnzzddYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNRRRrrrrrRnnzzndYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNNRRRrrrrrRnnnndyyyyyyyyyyyNNNK.K.............",
    "..............KYYNNddnnnnnndddddddddddddNNNNNdNNNNNNNRRrrrrrRRnnndNNNNNNNNNNNNNNKKBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNRRRrrzzrRnnnYNNNNNNBBBBBBBBBBBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNdRRrrzzRRRnnYNNNNNNBbbbbbbbbbbBK...........",
    "..............KYYNNdnnnnnnnddddddddddddddNNNNdNNNNNNNdRRRrRRRRRRnYNNNNNNBBBBBBBBBBBBK...........",
    "..............KYNNNdnnnnnndddddddddddddddNNNNdNNNNNNNdNRRRRRRRRRnYKKNNNNBBBBBBBBBBBBK...........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNdNNRRRRRRRRRYK.KKNBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNNNNRRRRRnnnnYK...KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNNNNNNNNNNNNNRnnnnnnnYbK..KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddLdddNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBBK..........",
    "............KYYNNNddnnnnnndddddddddLdNNNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBK...........",
    "............KYYNNNdnnnnnnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBBBBBBBBBBBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBbbbbbbbbbBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYYYYYyLLLLLLLLLLLLK.....KbbbbbbbbbBK...........",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRyyyyyyyyRRNNNNNNNNNNK.....KBKKKKKKKKK............",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRRRRRRRRRRRNNNNNNNNNNK......K.....................",
    "...........KYYNNNddnnyynnddddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNNyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNdyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNYKKK........................",
    "..........KYYNNNddnnnyynndddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNYYYKK......................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNRRRYYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRRYK....................",
    "..........KYYNNNddnnnyyndddddddddddddddNNNNNNRRRrrrrrrRRRRNNNNNNNNNNNNrrrrYK....................",
    "..........KYYNNdddnnnyydddddddddddYYdddNNNNNNRRRrrrrrrRRRRNNNNNNNNNYYYNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddNYYYYNNNNNRRRrrrrrrRRRRNNNNNYYYYNNNNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddKddNNYYYYNRRRrrrrrrRRRRNYYYYNNKrrrrrrrrRYK...................",
    ".........KYYNNNddnnnnnndddddddddddNKddddNNNNYYYYYYYYYYYYYYYNNNNNNKrrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnnddddddddddddNKdddNNNNNdRRRRRRRRRRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnndddddddddddNNKdddNNNNNddKKKKKKKKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnndddddddrddddNNKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNdnnnnndddddddrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnnnddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnddddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    ".......KYYNNNNddndddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnNKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrrRYK.................",
    "........KzYNNNdNNNNNNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KzYNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNNNNNrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNNNNNNNNNNrrrKddddNNNNNddKK....KYYYYYYYYYYYYYYRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNYYNNNNNNNNNNKdddddddddddKK....KYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYzNNNNNNNYYYYYYNNNNNBYYYYYYYYYYYYYYYYK...KBYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYYzNNNNYYYKKKYYYYNNBByyyyyyyyyyyyyyyyK...KByyyyyyyyyyyyyyBKKKKKKKKK...................",
    "..........KYzNYYYKKK...KKYYYNBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBBBBK.........................",
    "..........KYYYYKK........KYYBBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBhhhhKK.......................",
    "..........KYKKK...........KYBBBBBBBBBBBBBBBBBBBBK..KBBBBBBBBBBBBBBBBBBBBBK......................",
    "...........K...............KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "............................KKKKKKKKKKKKKKKKKKKK....KKKKKKKKKKKKKKKKKKKKKK......................",
    "................................................................................................",
  ],
};
const KRK_ARC = {
  p: KRK_SEJ.p,
  m: [
    "...........................................K....................................................",
    "..........................................KHK...................................................",
    ".........................................KHHK...................................................",
    "...............................K.........KHHHK..................................................",
    "..............................KHK.......KHHHHK........K.........................................",
    "..............................KHHK.....KHHHHHHK.....KKHK........................................",
    "..............................KHHHKK..KHHHHHHHK....KHHHK........................................",
    ".............................KHHHHHHK.KHHHHHHHHK.KKHHHHHK.......................................",
    ".............................KHHHHHHHKHHHHhHHHHKKHHHHHHHK.......................................",
    ".............................KHHHHHHHHHHHhhhhHHHHHHHHHHHHKKK....................................",
    "........................K....KHHHHHHHHHHHhhhhhhHHHHHHHHHHKYYK...................................",
    ".......................KHKK.KHHHHHHHHHHHhhhhhhhhhHHHHHHHHHYYKKKKK...............................",
    ".......................KHHHKKHHhHHHHHHHhhhhhhhhhhhhHHHHHHHYYHHHHHK..............................",
    "......................KHHHHHHHhhhHHHHHhhhhhhhhhhhhHHHHHYYYzzYYYHHK..............................",
    "......................KHHHHHHHhhhhHHHHhhhhhhhhhhhhHHHHHYYYzzYYYHHHK.............................",
    ".....................KHHHHHHHhhhhhhhHhhhhhhhhhhhhHHHHHHHHHYYHHHHHHK.............................",
    ".....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHYYHHHHHHK.............................",
    "....................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHYYHHHHHHHK............................",
    "....................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHHhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHHHHhhhhhhhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHhhhhhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHK...........................",
    "...................KHHHHHHHHHHHhhhhhhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHK............................",
    "...................KHHHYYYHHHHHHHHhhhhhHHHHHHHHHHHHHHHHHHHHKHHHHHHK.............................",
    "...................KHHHYzYHHHHHHHHHHhHHHHHHHHHHHHHHHHHHHHHHHHHHHHK..............................",
    "............KKKK...KHHHYYYHHHHHHYYYHHHHHHHHHHHHHHHSSSHHHHHHHHHHHK...............................",
    "............KYYYK...KHHYYYYHHHHHYzYHHHHHHHHHHHHHHHHSSSSHHHHHHHHHK...............................",
    "............KYzYYK..KHHYYYYggHHHYYYHHHHHHHHHHHHHHHHHSSSHSSSHHHHSK...............................",
    "............KYYYYKK.KHHYYYYggggbYYYHHHHHHHHHHHHHHHHHHSHHSSSSSSHSSK..............................",
    ".............YYYYYK.KHHHYYYggggYYYYHHHHHHHHHHHHSHHHHHHHeeeeeeSSSSK..............................",
    ".............KYYYYKKKHHHYYYggggYYYYHHHgggggggHsSSSHHHHSSSSSSSSSSSSK.............................",
    "..............YYYYYKKHHHYYYggggYYYHHHHgggggggHsSSSSHHHeeeeeeSSSSSSK.............................",
    "...............YYYYbKHHHgbbggggYYYHHHHgggggggHsSSSSSHSEEEeeeSSSSSSK.............................",
    "................YYYbbKHHgbbbggbbbHHHHHgggggggHsSSSSSSSEEEeeeSSSSSK..............................",
    "................KKbbbbHHgbbbggbbbHHHHHgggggggssSSSSSSSEEEeeeSSSSSK..............................",
    ".................KKbbbKHHgbbggbbggHHHHgggggggssSSSSSSSsssSSSSSSSSSK.............................",
    "..................KKbbbKHHbbggbbggHHHHgggggggsssSSSSSSSSSSSSSSSSSSSK............................",
    "...................KKbbbKHbbbgbbgggHHHggggggHsssSSSSSSSSSSSSSSSSK...............................",
    "....................KbbbbHbbbbbbgggHHHggggggssssSSSSSSSSSSSSSSSSK...............................",
    "....................KKbbbKHbbbbgggHHHHggggggKsssSSSSSSSSSSSSSSSSK...............................",
    ".....................KKbbbKbbbbggHHHHHggggggKSssSSSSSSSSSSSSSSSK................................",
    "......................KKbBBBBbbgHHHHHHggggggKKssSSSSSSSssssssSK.................................",
    "......................KKByyyBHgHHHHHHHggggggK.KsSSSSSSSSSSSSSK..................................",
    "......................KByBbByHHHHHHHHHggggggK.KSSSSSSSSSSSSSK...................................",
    ".....................KKBBbbBBKHHHHHHHHggggggK.KsSSSSSSSSSSSK....................................",
    ".....................KBBbbBBBKKKHHHHHHgggHKKK.KssssssSSSSSSSK...................................",
    "....................KKBBbBBBKK..KHHHHHgHYYYKYKKssssssSSSYSSSKKYK................................",
    "...................KKYYYYYBKK.KKYKHHHHzYYYYYKYwwwwwWWWWWYYYzYYYKKKKKK...........................",
    "...................KBBbbBBBKKKYYYYzHzzzzYYYYKYwwwwwWWWWWYYYzzzzYYYYYYK..........................",
    "..................KKBBbBBBYYYYzzzzzzzzzzYYYYYwYwwwwWWWWWYYYYzzzzzzzYYK..........................",
    ".................KKBBbbBBKYYYYYzzzzzzzzzzYYYYYYwwwwWWWWWYYYYzzzzzzzYYYK.........................",
    "................KKYYYYYBBYYYYYYzzzzzzYYYYYYYYYYYwwwWWWWWYYYYYYYYYYYzYYK.........................",
    "................KBBBbBBBYYYYYYYYzYYYYYYYYYYYYYYYwwwWWWWWWYYYYYYYYYYYYYYK........................",
    "...............KKBBbbBBKYNYYYYYYYYYYYYYzzYYYYYrwYwwWWWWWWYYYYYYYYYYYYYYK........................",
    "..............KKBBbbBBBYYNYYYYyYYYYYYYYzzYYYYYrrYwwWWWWWWYYYYYYYzzYYYYYYK.......................",
    "..............KBBBbBBBKYNNYyyyyyyyyyYYYYYYYYYYrrrYwWWWWWWYYYYYYYzzYYYYYYK.......................",
    ".............KKYYYYYBKYYddYYyyyyyzzyyyyyyYYYYrrrrYRNNNNNnyyyyyyyyyyyyyyyYK......................",
    "............KKBBbbBBKKYNddYYYyyyyzzyyyyyyyYYYzrrrrRNNNNNnYYyyyyyyyyyyyyYK.......................",
    "............KBBBbBBBKYYdddYYYYyyyyyyyyyyyyYYYzrrrrrRNNNNnYYYYYdddddNNNNNNK......................",
    "...........KKBBbbBBKKYNdddddYYyyyyyyyyyyyyyYRRrrrrrRRNNNnnnnYYdddddNNNNNNK......................",
    "..........KKBBbbBBKKYYNdndddddYyyyyyyyyyyyyyRRRrrrrrRNNNnnnnnndddddNNNNNNK......................",
    "..........KBBBbBBBKKYNNdnddddddYyYYYYYYdNNNNdRRRrrrrrRNNNnnnnnnddddNNNNNNK......................",
    "..........KBBbbBBKKYYNddnddddddddYddddddNNNNdNRRrrrrrRRNNnnnnnzdddddNNNNNNK.....................",
    "..........KBbbBBBKKYNNdnnddddddddKddddddNNNNdNRRRzzrrrRNNnnnnnzdddddNNNNNNK.....................",
    "..........KBbBBBKKYYNNdnnnddddddKdddddddNNNNdNNRRzzrrrrGGnnnnnndddddNNNNNNK.....................",
    "..........KBBBBKKKYNNNdnnnddddddKdddddddNNNNdNNNRRrrrrrGGnnnnnndddddNNNNNNK.....................",
    "..........KKKKKKKYYNNddnnnddddddKdddddddNNNNdNNNRRRrrrrrRnnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRrrrrrrRnnnnnnddddNNNNNNK.....................",
    "................KYYNNdnnnndddddKddddddddNNNNdNNNNRRRrrrrrRnnnnnnddddNNNNNNNK....................",
    "...............KYYNNddnnnnddddddddddddddNNNNdNNNNNRRRrzzrrRnnnnndddddNNNNNNKKKK.................",
    "...............KYYNNddnnnnndddddddddddddNNNNNdNNNNNRRrzzrrRRnnzzddYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNRRRrrrrrRnnzzndYYYYYYYYYYYYYK................",
    "...............KYYNNdnnnnnndddddddddddddNNNNNdNNNNNNRRRrrrrrRnnnndyyyyyyyyyyyNNNK.K.............",
    "..............KYYNNddnnnnnndddddddddddddNNNNNdNNNNNNNRRrrrrrRRnnndNNNNNNNNNNNNNNKKBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNRRRrrzzrRnnnYNNNNNNBBBBBBBBBBBK............",
    "..............KYYNNddnnnnnnddddddddddddddNNNNdNNNNNNNdRRrrzzRRRnnYNNNNNNBbbbbbbbbbbBK...........",
    "..............KYYNNdnnnnnnnddddddddddddddNNNNdNNNNNNNdRRRrRRRRRRnYNNNNNNBBBBBBBBBBBBK...........",
    "..............KYNNNdnnnnnndddddddddddddddNNNNdNNNNNNNdNRRRRRRRRRnYKKNNNNBBBBBBBBBBBBK...........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNdNNRRRRRRRRRYK.KKNBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNdNNNNNNNNNNRRRRRnnnnYK...KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddddddddNNNNNNNNNNNNNNNNRnnnnnnnYbK..KBBBBBBBBBBBBBBK..........",
    ".............KYYNNddnnnnnndddddddddLdddNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBBK..........",
    "............KYYNNNddnnnnnndddddddddLdNNNNNNNNNNNNNNNNNNNNNNNNNNNNNLK...KBBBBBBBBBBBBK...........",
    "............KYYNNNdnnnnnnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBBBBBBBBBBBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYLLYYyLLLLLLLLLLLLK....KBbbbbbbbbbBK...........",
    "............KYYNNddnnyynnndddddddddLLLLLLLLLLLLyYYYYYYyLLLLLLLLLLLLK.....KbbbbbbbbbBK...........",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRyyyyyyyyRRNNNNNNNNNNK.....KBKKKKKKKKK............",
    "...........KYYNNNddnnyynndddddddddddNNNNNNNNNNRRRRRRRRRRRNNNNNNNNNNK......K.....................",
    "...........KYYNNNddnnyynnddddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNNyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNK...........................",
    "...........KYYNNdyyyyyyyyyyddddddddddddddNNNNNRRRrrrrrRRRNNNNNNNNNNNYKKK........................",
    "..........KYYNNNddnnnyynndddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNYYYKK......................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNRRRYYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRYK.....................",
    "..........KYYNNNddnnnyynddddddddddddddddNNNNNNRRRrrrrrRRRNNNNNNNNNNNNNRRRRYK....................",
    "..........KYYNNNddnnnyyndddddddddddddddNNNNNNRRRrrrrrrRRRRNNNNNNNNNNNNrrrrYK....................",
    "..........KYYNNdddnnnyydddddddddddYYdddNNNNNNRRRrrrrrrRRRRNNNNNNNNNYYYNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddNYYYYNNNNNRRRrrrrrrRRRRNNNNNYYYYNNNNrrrYK....................",
    ".........KYYNNNddnnnnyyddddddddddddKddNNYYYYNRRRrrrrrrRRRRNYYYYNNKrrrrrrrrRYK...................",
    ".........KYYNNNddnnnnnndddddddddddNKddddNNNNYYYYYYYYYYYYYYYNNNNNNKrrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrYK...................",
    ".........KYYNNNddnnnnnddddddddddddNKdddddddddRRRrrrrrrRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnnddddddddddddNKdddNNNNNdRRRRRRRRRRRRRNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnnndddddddddddNNKdddNNNNNddKKKKKKKKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNddnnnndddddddrddddNNKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrRYK..................",
    "........KYYNNNNdnnnnndddddddrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnnnddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    "........KYYNNNddnnnddddddddrrrrrrrrKdddNNNNNddKK....KKddddNNNnnnnKRrrrrrrrrrRYK.................",
    ".......KYYNNNNddndddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnNKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddddddddrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKrrrrrrrrrRYK.................",
    ".......KYYNNNNddddddNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrrRYK.................",
    "........KzYNNNdNNNNNNNNNNrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KzYNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNrrrrrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    "........KYzNNNNNNNNNNNNNNNNNrrrrrrKddddNNNNNddKK.....KKdddNNNNnnnnKRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNNNNNNNNNNrrrKddddNNNNNddKK....KYYYYYYYYYYYYYYRrrrrrrrRYK..................",
    ".........KYzNNNNNNNNNNYYNNNNNNNNNNKdddddddddddKK....KYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYzNNNNNNNYYYYYYNNNNNBYYYYYYYYYYYYYYYYK...KBYYYYYYYYYYYYYYRRRRRRRRRYK..................",
    ".........KYYzNNNNYYYKKKYYYYNNBByyyyyyyyyyyyyyyyK...KByyyyyyyyyyyyyyBKKKKKKKKK...................",
    "..........KYzNYYYKKK...KKYYYNBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBBBBK.........................",
    "..........KYYYYKK........KYYBBBBBBBBBBBBBBBBBBBK...KBBBBBBBBBBBBBBBhhhhKK.......................",
    "..........KYKKK...........KYBBBBBBBBBBBBBBBBBBBBK..KBBBBBBBBBBBBBBBBBBBBBK......................",
    "...........K...............KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "...........................KBbbbbbbbbbbbbbbbbbbBK..KbbbbbbbbbbbbbbbbbbbbbbK.....................",
    "............................KKKKKKKKKKKKKKKKKKKK....KKKKKKKKKKKKKKKKKKKKKK......................",
    "................................................................................................",
  ],
};
/* sprite per job */
const KRK_SPR = { sword: KRK_SEJ, mage: KRK_MAG, archer: KRK_ARC };
/* true = tongkat/busur gaya referensi digambar oleh karakter.js; false = pakai jobWeapon() lama dari jobs.js */
const KRK_SENJATA_BARU = true;

/* skala gambar per satuan "hs" (battle memanggil hs=5): 0.2 = 96x128 apa adanya, 0.3 = 144x192, 0.4 = 192x256 */
const KRK_SEJ_SKALA = 0.3;
/* sel tangan kanan (kolom,baris) di grid 96x128 — tempat gagang pedang menempel */
const KRK_SEJ_TANGAN = [78, 80];
/* sel tangan per job (kolom,baris) — geser kalau senjata terlihat kurang pas di tangan */
const KRK_TANGAN = { sword: [78, 80], mage: [78, 80], archer: [78, 80] };
/* panjang bilah dibanding pedang lama (pedang di referensi besar) */
const KRK_SEJ_PANJANG = 1.7;

/* sprite di-cache sekali ke kanvas kecil, jadi tiap frame cukup 1x drawImage (bukan 12 ribu fillRect) */
const krkSejCv = {};
function krkSprKanvas(job, putih) {
  const key = job + (putih ? "w" : "n");
  if (krkSejCv[key]) return krkSejCv[key];
  const D = KRK_SPR[job] || KRK_SEJ;
  const cv0 = document.createElement("canvas");
  cv0.width = 96;
  cv0.height = 128;
  const c = cv0.getContext("2d");
  D.m.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === ".") continue;
      c.fillStyle = D.p[ch];
      c.fillRect(i, j, 1, 1);
    }
  });
  if (putih) {
    c.globalCompositeOperation = "source-in"; // kilat putih saat terkena serangan
    c.fillStyle = "#fff";
    c.fillRect(0, 0, 96, 128);
  }
  return (krkSejCv[key] = cv0);
}
const krkSejKanvas = (putih) => krkSprKanvas("sword", putih); // nama lama tetap dipakai

/* posisi tangan (dalam petak sprite, kolom,baris) tempat senjata menempel.
   Geser angkanya kalau senjata terlihat kurang pas di tangan. */
const KRK_HAND = { sword: [28, 21], mage: [26, 20], archer: [27, 17] };

/* job yang sedang dipakai (aman dipanggil sebelum Pl dibuat) */
const krkJob = () =>
  typeof Pl !== "undefined" && Pl && KRK.BATTLE[Pl.job] ? Pl.job : "sword";

/* ganti SP.hero dan SP.heroB menjadi "getter": setiap kali game membaca SP.hero,
   yang keluar otomatis sprite milik job yang sedang aktif */
Object.defineProperty(SP, "hero", {
  get: () => KRK.DUNIA[krkJob()],
  set() {},
  configurable: true,
  enumerable: true,
});
Object.defineProperty(SP, "heroB", {
  get: () => KRK.BATTLE[krkJob()],
  set() {},
  configurable: true,
  enumerable: true,
});

/* ----- lindungi palet baru dari applyEq() di world.js -----
   applyEq() memasang palet lama + warna perlengkapan ke SP.hero.p dan SP.heroB.p.
   Palet lama tidak punya huruf rambut/mata kita (H, h, e, dst), jadi warnanya rusak.
   Solusi: setelah applyEq() jalan, kembalikan palet asli tiap job. */
const KRK_ASLI = {};
["DUNIA", "BATTLE"].forEach((g) => {
  KRK_ASLI[g] = {};
  Object.keys(KRK[g]).forEach((j) => (KRK_ASLI[g][j] = { ...KRK[g][j].p }));
});
const krkPulih = () =>
  Object.keys(KRK_ASLI).forEach((g) =>
    Object.keys(KRK_ASLI[g]).forEach(
      (j) => (KRK[g][j].p = { ...KRK_ASLI[g][j] }),
    ),
  );
{
  const _applyEq = applyEq;
  applyEq = function () {
    _applyEq();
    krkPulih();
  };
  krkPulih();
}

/* gambar karakter battle. Parameter sama seperti heroB() asli di script.js:
   x,y = posisi, a = pose (<0 ancang-ancang, >0 menebas), col = cahaya aura, hs = ukuran piksel */
const krkHeroBLama = function (x, y, a, col, hs = 3) {
  const job = krkJob(),
    k = hs / 3,
    q = (v) => Math.round(v / 2) * 2,
    r = (v) => Math.round(v * k),
    ln = Math.round(a * 4 * k),
    fl = an.sp > 6, // berkedip putih saat terkena serangan
    [hx, hy] = KRK_HAND[job];
  spr("heroB", x + ln, y, hs, 1, fl ? "#fff" : null);
  if (typeof HAT !== "undefined" && HAT && typeof hatDraw === "function")
    hatDraw(x + ln + 11 * hs, y, hs, 0); // topi digeser ke kepala baru (kepala ada di kolom ~14-25)
  // posisi tangan: a<0 = ancang-ancang, a>0 = menebas ke depan
  const fx = q(x + ln + hx * hs + a * (a < 0 ? 10 : 20) * k),
    fy = q(y + hy * hs - a * 6 * k),
    ang = -1.35 + 0.95 * a, // arah bilah pedang
    cx = Math.cos(ang),
    cy = Math.sin(ang),
    st = 3.2 * k,
    edge =
      globalThis.fistC && globalThis.fistC !== "#ffd166"
        ? globalThis.fistC
        : SP.heroB.p.b,
    each = (f) => {
      for (let i = 0; i <= 10; i++)
        f(Math.round(fx + cx * i * st), Math.round(fy + cy * i * st), i);
    };
  if (col) {
    const z = (8 + Math.max(0, -a) * 8) * k;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.22 + 0.2 * Math.sin(Date.now() / 130);
    ctx.fillRect(fx - z - 3, fy - z - 3, 2 * z + 6, 2 * z + 6);
    ctx.globalAlpha = 1;
  }
  // penyihir & pemanah: senjata digambar oleh jobWeapon() di jobs.js
  if (job !== "sword") return jobWeapon(job, fx, fy, a, k, r, fl);

  /* ----- pedang api (Pembawa Pedang) ----- */
  each((X, Y) => {
    ctx.fillStyle = "#140f1c";
    ctx.fillRect(X - r(3), Y - r(3), r(6), r(6));
  }); // garis tepi bilah
  const rb = globalThis.RB,
    bc = globalThis.bladeC,
    hue = (i, o = 0) =>
      `hsl(${(i * 34 + o + Date.now() / 3) % 360},100%,${o ? 48 : 62}%)`;
  each((X, Y, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i) : bc || SP.heroB.p.B;
    ctx.fillRect(X - r(2), Y - r(2), r(4), r(4));
  }); // bilah api (pelangi saat ulti, warna elemen saat tebasan elemen)
  each((X, Y, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i, 180) : bc ? "#fff" : edge;
    ctx.fillRect(X - r(1), Y, r(2), r(2));
  }); // inti panas
  // lidah api kecil yang berkedip di sepanjang bilah (dimatikan saat ulti / elemen / mode kurangi gerak)
  if (!fl && !rb && !bc && !rm) {
    const t = Date.now() / 90;
    each((X, Y, i) => {
      if (i % 2) return;
      const h = r(3 + 2 * Math.sin(t + i * 1.7));
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = i % 4 ? "#ffb02e" : "#ff6a1a";
      ctx.fillRect(X - r(3) + (i % 4 ? r(2) : 0), Y - r(4) - h, r(2), h);
      ctx.globalAlpha = 1;
    });
  }
  ctx.fillStyle = "#140f1c";
  ctx.fillRect(fx - r(6), fy - r(6), r(12), r(12)); // tangan + gagang
  ctx.fillStyle = SP.heroB.p.G;
  ctx.fillRect(fx - r(4), fy - r(4), r(8), r(8));
  ctx.fillStyle = "#fff";
  ctx.fillRect(fx - r(4), fy - r(4), r(4), r(2));
  return [Math.round(fx + cx * 10 * st), Math.round(fy + cy * 10 * st), fx, fy]; // ujung pedang + tangan
};

/* ===== Senjata gaya referensi, digambar lewat kode (ikut pose, bisa berkedip/berubah warna) =====
   Penyihir : tongkat emas bertahta kristal biru + empat duri emas, berdenyut & dikelilingi percikan
   Pemanah  : busur emas berlist biru, tali putih; saat ancang-ancang (a<0) tali ditarik & anak panah biru menyala
   Parameter: job, (fx,fy) = posisi tangan, a = pose (<0 ancang-ancang, >0 menebas), k = skala (hs/3), fl = kilat putih
   Mengembalikan [ujungX, ujungY, tanganX, tanganY] — sama seperti heroB() lama, dipakai untuk titik keluar sihir/panah. */
function krkSenjata(job, fx, fy, a, k, fl) {
  const R = (v) => Math.max(1, Math.round(v * k)),
    INK = "#140f1c",
    rb = globalThis.RB, // pelangi saat ulti
    bc = globalThis.bladeC, // warna elemen saat serangan elemen
    t = Date.now(),
    still = typeof rm !== "undefined" && rm, // mode kurangi gerak
    hue = (i, o = 0) =>
      `hsl(${(i * 34 + o + t / 3) % 360},100%,${o ? 48 : 62}%)`,
    aa = Math.max(-1.2, Math.min(1.2, a)),
    GOLD = fl ? "#fff" : "#f3b936",
    GOLD_D = fl ? "#fff" : "#b9801c",
    GOLD_L = fl ? "#fff" : "#ffe488",
    BLUE = fl ? "#fff" : "#2d5ce0",
    box = (X, Y, w, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(X - w / 2), Math.round(Y - w / 2), w, w);
    },
    disc = (X, Y, rad, c) => {
      ctx.fillStyle = c;
      for (let dy = -rad; dy <= rad; dy += 2) {
        const w = Math.round(Math.sqrt(Math.max(0, rad * rad - dy * dy)));
        ctx.fillRect(Math.round(X - w), Math.round(Y + dy - 1), 2 * w, 2);
      }
    },
    line = (p0, p1, w, c) => {
      const n = Math.max(
        2,
        Math.ceil(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2),
      );
      for (let i = 0; i <= n; i++)
        box(
          p0[0] + ((p1[0] - p0[0]) * i) / n,
          p0[1] + ((p1[1] - p0[1]) * i) / n,
          w,
          c,
        );
    },
    hand = () => {
      box(fx, fy, R(12), INK);
      box(fx, fy, R(8), fl ? "#fff" : "#4a3830");
      ctx.fillStyle = fl ? "#fff" : "#6a5244";
      ctx.fillRect(Math.round(fx - R(4)), Math.round(fy - R(4)), R(4), R(2));
    };

  /* ---------- tongkat penyihir ---------- */
  if (job === "mage") {
    const ang = -1.5 + 0.3 * Math.abs(aa), // condong ke depan saat ancang-ancang / menebas, tidak menutupi wajah
      cx = Math.cos(ang),
      cy = Math.sin(ang),
      nx = -cy,
      ny = cx,
      at = (u, v = 0) => [
        fx + (cx * u + nx * v) * k,
        fy + (cy * u + ny * v) * k,
      ],
      U0 = -26, // ujung bawah
      UO = 56, // pusat kristal
      shaft = [];
    for (let u = U0; u <= UO - 6; u += 1.4) shaft.push(at(u));
    shaft.forEach((p) => box(p[0], p[1], R(5), INK)); // garis tepi batang
    shaft.forEach((p) => box(p[0], p[1], R(3), GOLD));
    for (let u = U0; u <= UO - 6; u += 1.4) {
      const p = at(u, -1);
      box(p[0], p[1], R(1), GOLD_L); // kilap batang
    }
    [-22, -2, 20, 40].forEach((u) => {
      // cincin emas di batang
      const p = at(u);
      box(p[0], p[1], R(8), INK);
      box(p[0], p[1], R(6), GOLD_D);
      box(p[0], p[1], R(4), GOLD);
    });
    // kristal + bingkai
    const o = at(UO),
      r0 = R(7),
      main = rb ? hue(0) : bc || BLUE,
      dark = fl ? "#fff" : rb ? hue(3, 180) : bc || "#1a2f8f";
    if (!still && !fl) {
      ctx.globalAlpha = 0.16 + 0.1 * Math.sin(t / 160); // cahaya berdenyut
      disc(o[0], o[1], R(17), rb ? hue(1) : bc || "#5aa0ff");
      ctx.globalAlpha = 1;
    }
    // duri emas empat arah (atas panjang, samping sedang, bawah pendek)
    [0, 1, 2, 3].forEach((idx) => {
      const du = idx === 0 ? 1 : idx === 3 ? -1 : 0,
        dv = idx === 1 ? 1 : idx === 2 ? -1 : 0,
        len = idx === 0 ? 11 : idx === 3 ? 6 : 8;
      for (let s = 0; s <= len; s += 1.2) {
        const w = Math.max(1, Math.round((R(4) * (len - s)) / len + 1)),
          p = at(UO + du * (8 + s), dv * (8 + s));
        box(p[0], p[1], w + 2, INK);
      }
      for (let s = 0; s <= len; s += 1.2) {
        const w = Math.max(1, Math.round((R(4) * (len - s)) / len)),
          p = at(UO + du * (8 + s), dv * (8 + s));
        box(p[0], p[1], w, s > len * 0.6 ? GOLD_L : GOLD);
      }
    });
    disc(o[0], o[1], r0 + R(3), INK);
    disc(o[0], o[1], r0 + R(1.5), GOLD);
    disc(o[0], o[1], r0 + R(0.5), GOLD_D);
    disc(o[0], o[1], r0 - R(0.5), dark);
    disc(o[0] - R(1), o[1] - R(1), r0 - R(2.5), main);
    box(o[0] - R(3), o[1] - R(3), R(3), fl ? "#fff" : "#d4e4ff"); // pantulan
    // percikan kecil mengitari kristal
    if (!still && !fl)
      for (let j = 0; j < 3; j++) {
        const q = t / 380 + j * 2.1,
          rr = R(15) + R(3) * Math.sin(t / 210 + j),
          X = o[0] + Math.cos(q) * rr,
          Y = o[1] + Math.sin(q) * rr * 0.8;
        box(X, Y, R(2.4), rb ? hue(j * 3) : bc || "#bcd4ff");
        box(X, Y, R(1), "#fff");
      }
    hand();
    return [Math.round(o[0]), Math.round(o[1]), fx, fy];
  }

  /* ---------- busur pemanah ---------- */
  const ang = -1.5 + 0.12 * aa,
    cx = Math.cos(ang),
    cy = Math.sin(ang),
    nx = -cy, // arah depan (kanan)
    ny = cx,
    at = (u, v = 0) => [fx + (cx * u + nx * v) * k, fy + (cy * u + ny * v) * k],
    L = 40, // setengah tinggi busur
    bend = (tt) =>
      15 * (1 - tt * tt) - 15 + Math.max(0, Math.abs(tt) - 0.8) * 46, // lengkung + ujung melentik
    draw = Math.max(0, -aa), // seberapa jauh tali ditarik (0..1.2)
    nockV = bend(1) - 16 * draw,
    top = at(L, bend(1)),
    bot = at(-L, bend(1)),
    nock = at(0, nockV),
    pts = [];
  for (let tt = -1; tt <= 1.001; tt += 0.045)
    pts.push([tt, at(tt * L, bend(tt))]);
  pts.forEach(([tt, p]) => box(p[0], p[1], R(7), INK)); // garis tepi
  pts.forEach(([tt, p]) => {
    const g = Math.abs(tt) < 0.13;
    box(p[0], p[1], R(5), g ? (fl ? "#fff" : "#4a3830") : GOLD);
  });
  pts.forEach(([tt, p]) => {
    const q = at(tt * L, bend(tt) - 2);
    if (Math.abs(tt) > 0.18 && Math.abs(tt) < 0.86)
      box(q[0], q[1], R(2.4), BLUE); // list biru di sisi dalam
    else if (Math.abs(tt) <= 0.13) box(p[0], p[1], R(1.5), GOLD_L);
    else box(p[0] + R(0.5), p[1] - R(0.5), R(1), GOLD_L);
  });
  // tali (putih kebiruan)
  line(top, nock, R(1.6), fl ? "#fff" : "#e8eef8");
  line(nock, bot, R(1.6), fl ? "#fff" : "#e8eef8");
  let tip = at(0, 24);
  if (draw > 0.05) {
    // anak panah yang sedang ditarik
    const a0 = nock,
      a1 = at(0, 30);
    line(a0, a1, R(4.4), INK);
    line(a0, a1, R(2.4), fl ? "#fff" : "#e8eef8");
    const f0 = at(0, nockV + 2),
      f1 = at(0, nockV + 8);
    line(f0, f1, R(5), INK); // bulu panah
    line(f0, f1, R(3), GOLD);
    const hc = rb ? hue(0) : bc || "#5aa0ff";
    if (!still && !fl) {
      ctx.globalAlpha = 0.2 + 0.14 * Math.sin(t / 110);
      disc(a1[0], a1[1], R(10), hc);
      ctx.globalAlpha = 1;
    }
    box(a1[0], a1[1], R(7), INK);
    box(a1[0], a1[1], R(5), fl ? "#fff" : hc);
    box(a1[0] + R(1), a1[1], R(2), "#fff");
    tip = a1;
    // tangan penarik tali
    box(nock[0], nock[1], R(9), INK);
    box(nock[0], nock[1], R(6), fl ? "#fff" : "#4a3830");
  }
  hand();
  return [Math.round(tip[0]), Math.round(tip[1]), fx, fy];
}

/* heroB baru: SEMUA job memakai sprite 96x128 (Sejarang / Penyihir / Pemanah); senjata digambar lewat kode */
heroB = function (x, y, a, col, hs = 3) {
  const job = krkJob();
  const k = hs / 3,
    s = hs * KRK_SEJ_SKALA,
    q = (v) => Math.round(v / 2) * 2,
    r = (v) => Math.round(v * k),
    ln = Math.round(a * 4 * k),
    fl = an.sp > 6, // berkedip putih saat terkena serangan
    // badan sejajar dengan posisi lama (tengah badan ~ kolom 20 petak lama, telapak kaki di dasar petak lama)
    X = x + ln + Math.round(20 * hs - 47 * s),
    Y = y + Math.round(36 * hs - 128 * s),
    W2 = Math.round(96 * s),
    H2 = Math.round(128 * s);
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(krkSprKanvas(job, fl), X, Y, W2, H2);
  ctx.imageSmoothingEnabled = smooth;
  if (typeof HAT !== "undefined" && HAT && typeof hatDraw === "function")
    hatDraw(X + Math.round(46 * s - 8 * hs), Y + 3, hs, 0); // topi di kepala
  // posisi tangan: a<0 = ancang-ancang, a>0 = menebas ke depan
  const th = KRK_TANGAN[job] || KRK_SEJ_TANGAN,
    fx = q(X + th[0] * s + a * (a < 0 ? 10 : 20) * k),
    fy = q(Y + th[1] * s - a * 6 * k),
    ang = -1.35 + 0.95 * a, // arah bilah pedang
    cx = Math.cos(ang),
    cy = Math.sin(ang),
    st = 3.2 * k * KRK_SEJ_PANJANG,
    edge =
      globalThis.fistC && globalThis.fistC !== "#ffd166"
        ? globalThis.fistC
        : SP.heroB.p.b,
    each = (f) => {
      for (let i = 0; i <= 10; i++)
        f(Math.round(fx + cx * i * st), Math.round(fy + cy * i * st), i);
    };
  if (col) {
    const z = (8 + Math.max(0, -a) * 8) * k;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.22 + 0.2 * Math.sin(Date.now() / 130);
    ctx.fillRect(fx - z - 3, fy - z - 3, 2 * z + 6, 2 * z + 6);
    ctx.globalAlpha = 1;
  }

  // penyihir & pemanah: tongkat / busur gaya referensi (atau jobWeapon() lama di jobs.js bila KRK_SENJATA_BARU = false)
  if (job !== "sword")
    return KRK_SENJATA_BARU
      ? krkSenjata(job, fx, fy, a, k, fl)
      : jobWeapon(job, fx, fy, a, k, r, fl);

  /* ----- pedang api besar (Pembawa Pedang) ----- */
  const rb = globalThis.RB,
    bc = globalThis.bladeC,
    hue = (i, o = 0) =>
      `hsl(${(i * 34 + o + Date.now() / 3) % 360},100%,${o ? 48 : 62}%)`;
  each((X2, Y2) => {
    ctx.fillStyle = "#140f1c";
    ctx.fillRect(X2 - r(3.5), Y2 - r(3.5), r(7), r(7));
  }); // garis tepi bilah
  each((X2, Y2, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i) : bc || SP.heroB.p.B;
    ctx.fillRect(X2 - r(2.5), Y2 - r(2.5), r(5), r(5));
  }); // bilah api (pelangi saat ulti, warna elemen saat tebasan elemen)
  each((X2, Y2, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i, 180) : bc ? "#fff" : edge;
    ctx.fillRect(X2 - r(1), Y2, r(2), r(2));
  }); // inti panas
  // lidah api kecil yang berkedip di sepanjang bilah (dimatikan saat ulti / elemen / mode kurangi gerak)
  if (!fl && !rb && !bc && !rm) {
    const t = Date.now() / 90;
    each((X2, Y2, i) => {
      if (i % 2) return;
      const h = r(3 + 2 * Math.sin(t + i * 1.7));
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = i % 4 ? "#ffb02e" : "#ff6a1a";
      ctx.fillRect(X2 - r(3) + (i % 4 ? r(2) : 0), Y2 - r(4) - h, r(2), h);
      ctx.globalAlpha = 1;
    });
  }
  // gagang: pelindung emas bersilang + permata biru + ujung gagang (seperti pedang di referensi)
  const px = -cy, // arah tegak lurus bilah
    py = cx,
    gx = fx + cx * 1.2 * st,
    gy = fy + cy * 1.2 * st,
    box = (X2, Y2, w, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(
        Math.round(X2 - w / 2),
        Math.round(Y2 - w / 2),
        Math.round(w),
        Math.round(w),
      );
    };
  for (let j = -5; j <= 5; j++)
    box(gx + px * j * r(2.2), gy + py * j * r(2.2), r(6), "#140f1c"); // garis tepi pelindung
  for (let j = -5; j <= 5; j++)
    box(
      gx + px * j * r(2.2),
      gy + py * j * r(2.2),
      r(4),
      Math.abs(j) > 3 ? "#b9801c" : "#f3b936",
    );
  box(gx, gy, r(6), "#140f1c");
  box(gx, gy, r(4), fl ? "#fff" : "#2d5ce0"); // permata biru
  for (let i = 1; i <= 3; i++)
    box(fx - cx * i * r(3), fy - cy * i * r(3), r(6), "#140f1c"); // gagang
  for (let i = 1; i <= 3; i++)
    box(
      fx - cx * i * r(3),
      fy - cy * i * r(3),
      r(4),
      i === 3 ? "#f3b936" : "#4a3830",
    );
  ctx.fillStyle = "#140f1c";
  ctx.fillRect(fx - r(6), fy - r(6), r(12), r(12)); // tangan
  ctx.fillStyle = "#4a3830";
  ctx.fillRect(fx - r(4), fy - r(4), r(8), r(8));
  ctx.fillStyle = "#fff";
  ctx.fillRect(fx - r(4), fy - r(4), r(4), r(2));
  return [Math.round(fx + cx * 10 * st), Math.round(fy + cy * 10 * st), fx, fy]; // ujung pedang + tangan
};

/* ----- gambar pratinjau di layar "Pilih Job" dan tab Job -----
   Ketiga job memakai sprite 96x128 diperkecil muat ke kanvas pratinjau, lengkap dengan senjata statis. */
jobPreviews = function () {
  document.querySelectorAll("canvas[data-jp]").forEach((cv2) => {
    const o = ctx,
      oj = Pl.job;
    ctx = cv2.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv2.width, cv2.height);
    Pl.job = cv2.dataset.jp;
    try {
      const job = cv2.dataset.jp,
        sc = Math.min((cv2.width - 4) / 96, (cv2.height - 4) / 128),
        x0 = (cv2.width - 96 * sc) / 2,
        y0 = (cv2.height - 128 * sc) / 2,
        th = KRK_TANGAN[job] || KRK_SEJ_TANGAN,
        bx = x0 + th[0] * sc,
        by = y0 + th[1] * sc;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(krkSprKanvas(job, false), x0, y0, 96 * sc, 128 * sc);
      if (job === "sword") {
        for (let i = 0; i <= 18; i++) {
          const px = bx + Math.cos(-1.35) * i * sc * 3.2,
            py = by + Math.sin(-1.35) * i * sc * 3.2;
          ctx.fillStyle = "#140f1c";
          ctx.fillRect(px - sc * 2.6, py - sc * 2.6, sc * 5.2, sc * 5.2);
          ctx.fillStyle = "#ff9a2a";
          ctx.fillRect(px - sc * 1.8, py - sc * 1.8, sc * 3.6, sc * 3.6);
          ctx.fillStyle = "#ffe35a";
          ctx.fillRect(px - sc * 0.7, py - sc * 0.7, sc * 1.4, sc * 1.4);
        }
        ctx.fillStyle = "#f3b936";
        ctx.fillRect(bx - sc * 5, by - sc * 4, sc * 10, sc * 2.4);
      } else if (KRK_SENJATA_BARU)
        krkSenjata(job, bx, by, job === "archer" ? -0.6 : 0, sc / 0.9, false);
      else
        spr(
          "hero",
          Math.round((cv2.width - 16 * 3) / 2),
          Math.round((cv2.height - 24 * 3) / 2) + 8 * 3,
          3,
        );
    } finally {
      Pl.job = oj;
      ctx = o;
    }
  });
};
/* layar pilih job awal sudah digambar sebelum file ini dimuat (party.js memanggil chooseJob saat load),
   jadi gambar ulang sekarang */
jobPreviews();

/* ===== Karakter di DUNIA memakai sprite baru 96x128 (sama dengan battle) =====
   Dulu dunia memakai KRK.DUNIA (16x24, tampak depan). Sekarang setiap spr("hero", ...) digambar
   dari sprite 96x128 milik job yang aktif, diperkecil agar tingginya sama dengan sprite lama
   (24 petak) dan kaki tetap di titik yang sama, jadi tidak perlu mengubah world.js.
   Atur ukuran lewat KRK_DUNIA_SKALA: 1 = sama dengan sprite lama, 1.2 = 20% lebih besar. */
const KRK_DUNIA_SKALA = 1;
{
  const _spr = spr;
  spr = function (k, x, y, s, al = 1, tint, fr = 0, fl = 0, mm) {
    if (k !== "hero" || mm) return _spr(k, x, y, s, al, tint, fr, fl, mm);
    const job = krkJob(),
      f = ((24 * s) / 128) * KRK_DUNIA_SKALA, // skala: 128 baris sprite baru = 24 petak sprite lama
      W = Math.round(96 * f),
      H = Math.round(128 * f),
      // sprite lama: baris pertama di y - 8*s (oy), tengah badan di x + 8*s; kaki di dasar
      bob = fr ? -Math.round(s * 0.6) : 0, // langkah: tubuh naik sedikit
      X = Math.round(x + 8 * s - 46 * f),
      Y = Math.round(y - 8 * s + 24 * s - H + bob);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = al;
    ctx.save();
    if (fl) {
      ctx.translate(X + W / 2, 0); // balik kiri-kanan di sekitar tengah sprite
      ctx.scale(-1, 1);
      ctx.translate(-(X + W / 2), 0);
    }
    ctx.drawImage(krkSprKanvas(job, !!tint), X, Y, W, H);
    ctx.restore();
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = sm;
  };
}
