/* resolusi logis game: 480 x 270 (dunia) / 640 x 360 (arena battle)
   resolusi KELUARAN kanvas: 1280 x 720 (OUT_W x OUT_H). Semua kode gambar tetap memakai koordinat logis;
   SC = faktor skala logis -> piksel kanvas (dunia 2.667x, arena 2x), diatur oleh setBt() dan fit(). */
const OUT_W = 1280,
  OUT_H = 720;
let SC = OUT_W / 480;
let VW = 480, // lebar logis kanvas (dunia 480, arena battle 640)
  VH = 270,
  BDY = 0; // tinggi tambahan di atas garis 0 (arena battle diperluas ke atas supaya ada ruang lompat)
const GY = 180; // garis tanah arena battle (sisa bawah ditutup panel perintah)
const $ = (s) => document.querySelector(s),
  R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  P = (a) => a[R(0, a.length - 1)];
const gcd = (a, b) => (b ? gcd(b, a % b) : a),
  fr = (n, d) => {
    const g = gcd(Math.abs(n), d);
    n /= g;
    d /= g;
    return d === 1 ? "" + n : n + "/" + d;
  };
const rp = (n) => "Rp" + n.toLocaleString("id-ID"),
  clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mk = (t, val, expl, hint, show) => ({
  t,
  val,
  expl,
  hint,
  show: show ?? String(val),
});
const TN = {
  arit: "Aritmetika",
  pecahan: "Pecahan",
  persen: "Persen",
  geom: "Geometri",
  alj: "Aljabar",
};

/* ---------- Generator soal (template per topik, level 1-5) ---------- */
const G = {
  arit: (d) => {
    if (d == 1) {
      const a = R(3, 15),
        b = R(3, 15);
      return mk(
        `${a} + ${b} = ?`,
        a + b,
        `Jumlahkan: ${a} + ${b} = ${a + b}.`,
        "Hitung satuannya dulu.",
      );
    }
    if (d == 2) {
      const a = R(3, 12),
        b = R(3, 12);
      return mk(
        `${a} × ${b} = ?`,
        a * b,
        `${a} × ${b} = ${a * b}.`,
        "Ingat tabel perkalian.",
      );
    }
    if (d == 3) {
      const a = R(300, 900),
        b = R(120, 290);
      return R(0, 1)
        ? mk(
            `${a} − ${b} = ?`,
            a - b,
            `${a} − ${b} = ${a - b}.`,
            "Kurangi ratusan, lalu puluhan, lalu satuan.",
          )
        : mk(
            `${a} + ${b} = ?`,
            a + b,
            `${a} + ${b} = ${a + b}.`,
            "Jumlahkan ratusan, puluhan, lalu satuan.",
          );
    }
    if (d == 4) {
      const a = R(12, 25),
        b = R(11, 19);
      return mk(
        `${a} × ${b} = ?`,
        a * b,
        `${a} × ${b} = ${a}×10 + ${a}×${b - 10} = ${a * 10} + ${a * (b - 10)} = ${a * b}.`,
        `Pecah ${b} menjadi 10 + ${b - 10}.`,
      );
    }
    const a = R(5, 20),
      b = R(5, 20),
      c = R(3, 9),
      e = R(5, 30),
      v = (a + b) * c - e;
    return mk(
      `(${a} + ${b}) × ${c} − ${e} = ?`,
      v,
      `Kurung dulu: ${a + b}. Lalu × ${c} = ${(a + b) * c}. Lalu − ${e} = ${v}.`,
      "Kerjakan yang di dalam kurung lebih dulu.",
    );
  },
  pecahan: (d) => {
    const den = P([4, 5, 6, 8, 10]);
    if (d == 1) {
      const a = R(1, den - 2),
        b = R(1, den - a - 1);
      return mk(
        `${a}/${den} + ${b}/${den} = ?`,
        (a + b) / den,
        `Penyebut sama, jumlahkan pembilang: ${a}+${b}=${a + b}. Hasil ${fr(a + b, den)}.`,
        "Penyebut sama: jumlahkan pembilangnya saja. Tulis seperti 3/4.",
        fr(a + b, den),
      );
    }
    if (d == 2) {
      const a = R(3, den - 1),
        b = R(1, a - 1);
      return mk(
        `${a}/${den} − ${b}/${den} = ?`,
        (a - b) / den,
        `Kurangkan pembilang: ${a}−${b}=${a - b}. Hasil ${fr(a - b, den)}.`,
        "Penyebut sama: kurangkan pembilangnya. Sederhanakan jika bisa.",
        fr(a - b, den),
      );
    }
    if (d == 3) {
      const d1 = P([2, 3]),
        d2 = d1 * 2,
        a = R(1, d1 - 1),
        b = R(1, d2 - 1),
        n = 2 * a + b;
      return mk(
        `${a}/${d1} + ${b}/${d2} = ?`,
        n / d2,
        `Samakan penyebut: ${a}/${d1} = ${2 * a}/${d2}. Lalu ${2 * a}/${d2} + ${b}/${d2} = ${fr(n, d2)}.`,
        `Ubah ${a}/${d1} menjadi penyebut ${d2}.`,
        fr(n, d2),
      );
    }
    const n1 = R(1, 4),
      d1 = R(2, 5),
      n2 = R(1, 4),
      d2 = R(2, 5);
    if (d == 4)
      return mk(
        `${n1}/${d1} × ${n2}/${d2} = ?`,
        (n1 * n2) / (d1 * d2),
        `Kalikan pembilang (${n1 * n2}) dan penyebut (${d1 * d2}): ${fr(n1 * n2, d1 * d2)}.`,
        "Pembilang × pembilang, penyebut × penyebut.",
        fr(n1 * n2, d1 * d2),
      );
    return mk(
      `${n1}/${d1} ÷ ${n2}/${d2} = ?`,
      (n1 * d2) / (d1 * n2),
      `Bagi = kali kebalikan: ${n1}/${d1} × ${d2}/${n2} = ${fr(n1 * d2, d1 * n2)}.`,
      "Balik pecahan kedua, lalu kalikan.",
      fr(n1 * d2, d1 * n2),
    );
  },
  persen: (d) => {
    if (d == 1) {
      const p = P([10, 25, 50]),
        b = P([20, 40, 60, 80, 100, 200]);
      return mk(
        `${p}% dari ${b} = ?`,
        (p * b) / 100,
        `${p}% × ${b} = ${(p * b) / 100}.`,
        `${p}% sama dengan ${p}/100.`,
      );
    }
    if (d == 2) {
      const p = P([5, 15, 20, 30, 40]),
        b = R(1, 10) * 20;
      return mk(
        `${p}% dari ${b} = ?`,
        (p * b) / 100,
        `${p}/100 × ${b} = ${(p * b) / 100}.`,
        "Kalikan bilangan dengan persen/100.",
      );
    }
    if (d == 3) {
      const h = R(5, 20) * 10000,
        p = P([10, 20, 25, 30, 50]),
        v = (h * (100 - p)) / 100;
      return mk(
        `Harga ${rp(h)} didiskon ${p}%. Berapa harga akhir (Rp)?`,
        v,
        `Diskon = ${p}% × ${h} = ${(h * p) / 100}. Harga akhir = ${h} − ${(h * p) / 100} = ${v}.`,
        "Hitung diskon dulu, lalu kurangkan dari harga.",
      );
    }
    if (d == 4) {
      const a = R(1, 10) * 20,
        p = P([10, 25, 50]),
        b = (a * (100 + p)) / 100;
      return mk(
        `Harga naik dari ${a} menjadi ${b}. Berapa persen kenaikannya?`,
        p,
        `Kenaikan = ${b - a}. Persen = ${b - a}/${a} × 100 = ${p}%.`,
        "Persen naik = selisih ÷ harga awal × 100.",
      );
    }
    const h = R(1, 5) * 100000,
      m = (h * 8) / 10,
      v = (m * 9) / 10;
    return mk(
      `Harga ${rp(h)} diskon 20%, lalu diskon 10% lagi dari harga baru. Harga akhir (Rp)?`,
      v,
      `${h} × 0,8 = ${m}. Lalu × 0,9 = ${v}.`,
      "Diskon kedua dihitung dari harga setelah diskon pertama.",
    );
  },
  geom: (d) => {
    if (d == 1) {
      const s = R(3, 15);
      return mk(
        `Keliling persegi dengan sisi ${s} cm (cm)?`,
        4 * s,
        `Keliling = 4 × ${s} = ${4 * s}.`,
        "Keliling persegi = 4 × sisi.",
      );
    }
    if (d == 2) {
      const p = R(4, 15),
        l = R(3, 12);
      return mk(
        `Luas persegi panjang ${p} cm × ${l} cm (cm²)?`,
        p * l,
        `Luas = ${p} × ${l} = ${p * l}.`,
        "Luas = panjang × lebar.",
      );
    }
    if (d == 3) {
      const a = 2 * R(2, 10),
        t = R(3, 12);
      return mk(
        `Luas segitiga alas ${a} cm, tinggi ${t} cm (cm²)?`,
        (a * t) / 2,
        `Luas = ½ × ${a} × ${t} = ${(a * t) / 2}.`,
        "Luas segitiga = ½ × alas × tinggi.",
      );
    }
    if (d == 4) {
      const t = P([
        [3, 4, 5],
        [5, 12, 13],
        [8, 15, 17],
        [6, 8, 10],
        [9, 12, 15],
        [7, 24, 25],
      ]);
      return mk(
        `Segitiga siku-siku dengan sisi tegak ${t[0]} dan ${t[1]}. Panjang sisi miringnya?`,
        t[2],
        `${t[0]}² + ${t[1]}² = ${t[0] ** 2} + ${t[1] ** 2} = ${t[2] ** 2}, akarnya ${t[2]}.`,
        "Pythagoras: c² = a² + b².",
      );
    }
    const k = R(1, 3),
      r = 7 * k;
    return mk(
      `Luas lingkaran jari-jari ${r} cm, π = 22/7 (cm²)?`,
      (22 * r * r) / 7,
      `Luas = 22/7 × ${r} × ${r} = ${(22 * r * r) / 7}.`,
      "Luas lingkaran = π × r × r.",
    );
  },
  alj: (d) => {
    if (d == 1) {
      const a = R(2, 15),
        x = R(2, 20);
      return mk(
        `x + ${a} = ${x + a}. Nilai x?`,
        x,
        `x = ${x + a} − ${a} = ${x}.`,
        "Pindahkan angka ke ruas kanan.",
      );
    }
    if (d == 2) {
      const a = R(2, 9),
        x = R(2, 12);
      return mk(
        `${a}x = ${a * x}. Nilai x?`,
        x,
        `x = ${a * x} ÷ ${a} = ${x}.`,
        `Bagi kedua ruas dengan ${a}.`,
      );
    }
    if (d == 3) {
      const a = R(2, 6),
        x = R(1, 10),
        b = R(1, 15);
      return mk(
        `${a}x + ${b} = ${a * x + b}. Nilai x?`,
        x,
        `${a}x = ${a * x + b} − ${b} = ${a * x}, jadi x = ${x}.`,
        "Kurangi konstanta dulu, baru bagi.",
      );
    }
    if (d == 4) {
      const p = R(1, 6),
        q = R(1, 6);
      return mk(
        `x² − ${p + q}x + ${p * q} = 0. Akar terbesar?`,
        Math.max(p, q),
        `Faktorkan: (x − ${p})(x − ${q}) = 0. Akarnya ${p} dan ${q}.`,
        `Cari dua bilangan: jumlah ${p + q}, hasil kali ${p * q}.`,
      );
    }
    const x = R(3, 12),
      y = R(1, x - 1);
    return mk(
      `x + y = ${x + y} dan x − y = ${x - y}. Nilai x?`,
      x,
      `Jumlahkan kedua persamaan: 2x = ${2 * x}, jadi x = ${x}.`,
      "Jumlahkan kedua persamaan agar y hilang.",
    );
  },
};

/* ---------- Pixel art (hero 16x24, hero battle 32x36, monster 16x16 dunia + 32x32 battle) ---------- */
const SP = {
  hero: {
    p: {
      K: "#1a1530",
      B: "#4a5be0",
      b: "#34318f",
      h: "#8c9bff",
      Y: "#ffd166",
      S: "#f4c9a1",
      s: "#d99f78",
      M: "#c2504a",
      C: "#2fcf9f",
      c: "#1f9c78",
      W: "#d9fff2",
      G: "#b8863b",
      L: "#6b4a35",
      E: "#ffffff",
    },
    m: [
      "....KKKKKKKK....",
      "..KKBBhhBBBBKK..",
      ".KBBBhBBBBBBBbK.",
      ".KBBBBBBBBBBBbK.",
      ".KbYYYYYYYYYYbK.",
      ".KbSSSSSSSSSSbK.",
      ".KSSEKSSSSEKSSK.",
      ".KSSEKSSSSEKSSK.",
      "..KsSSSSSSSSsK.Y",
      "...KSSSMMSSSK.YG",
      "....KKsSSsKK..KG",
      "...KKCCCCCCKK.KG",
      "..KCCCCWWCCCcKSG",
      ".KCCCCWWWWCCCcKG",
      ".KSCCCCWWCCCcKSG",
      ".KSCCCCCCCCCcK.G",
      "..KGGGGYYGGGGK.G",
      "..KbbbbbbbbbbK.G",
      "..KbbbbbbbbbbK.K",
      "...KbbbKKbbbK...",
      "...KbbbK.KbbK...",
      "...KbbbK.KbbK...",
      "..KLLLLK.KLLLK..",
      "..KKKKKK.KKKKK..",
    ],
    f: [
      0,
      [
        "...KbbbK.KbbbK..",
        "...KbbK..KbbK...",
        "..KLLLK..KLLLK..",
        "..KKKKK..KKKKK..",
      ],
      [
        "...KbbbK.KbbbK..",
        "....KbbK.KbbK...",
        "...KLLLK.KLLLK..",
        "...KKKKK.KKKKK..",
      ],
    ],
    oy: 8,
  },
  heroB: {
    p: {
      K: "#1a1530",
      B: "#4a5be0",
      b: "#34318f",
      h: "#8c9bff",
      Y: "#ffd166",
      S: "#f4c9a1",
      s: "#d99f78",
      M: "#c2504a",
      C: "#2fcf9f",
      c: "#1f9c78",
      W: "#d9fff2",
      R: "#c2504a",
      r: "#8e332f",
      T: "#b8863b",
      P: "#3d3a7a",
      p: "#5a56a8",
      L: "#6b4a35",
      l: "#4a3223",
      E: "#ffffff",
    },
    m: [
      "...................KhhK.........",
      ".............KKKKKKhhBhK........",
      "...........KKhhhhhhhBBbK........",
      "..........KhhhBBBBBBBBbK........",
      ".........KhhBBBBBBBBBBBhK.......",
      "..KKK...KhhBBBBBBBBBBBBBhK......",
      ".KhhhKKKhhBBBBBBBBBBBBBBbK......",
      "..KhBhhhhBBBBBBBBBBBBBBBbhK.....",
      "...KhBBBBBBBBBBBSSBBBBBbbK......",
      "....KhBYYYYYYYYYYYYYYYYYYYK.....",
      "..KKYYYYYYYYYYYYYYYYYYYYYYK.....",
      ".KYYYYYYYBBBBBSSSSSSKKKKKK......",
      "KYYYKhYYBBBBBBSSSSSSKSSSsK......",
      "YKKhhYYBBBBBBBSSSSSSSEKKsK......",
      "K.KhYBBBbbBBBBSsSSSSSEEKsKK.....",
      ".KYKKhbbbKhBBBBsSSSSSEEKKKsK....",
      "KYK..KKKhKKhbBBBSSSSSssK..K.....",
      ".K......K..KKhbbbSSSSsKKK.......",
      "...........KKKKKKSSSSsMMMK......",
      "..........KCCCCCCSSSSSCCK.......",
      ".........KRCCCCCCCCCCCCcK.......",
      "........KRRCCCCCCWWWWCCcK.......",
      ".......KRRRCCCCCCWWWWCCcK.......",
      "......KRRRRCCCCCWWWYWWCcK.......",
      ".....KRRRRRRCCCCWWYYYWCCCK......",
      "....KRRRRRRRCCCCCWWWWCCCcK......",
      "...KRRRRRRRRCCCCCWWWWCCCcK......",
      "..KRRRRRRRRRCCCCCCCCCCCCcK......",
      "..KRRRRRRRRRTTTTTTYYYTTTTK......",
      ".KRRRRRRRRrrTTTTTTYYYTTTTK......",
      ".KRRRRRRRrrKPPPPpKKPPPPPpK......",
      ".KRRRRRrrrKKPPPPpK.KPPPPpK......",
      ".KRRrrrrKK.KPPPPpK.KPPPPPPKKK...",
      "KRrrrKKK..KLLLLLLLKKLLLLLLLLLK..",
      "KRKKK.....KLLLLLLlKKLLLLLLLLlK..",
      ".K........KLllllllKKLllllllllK..",
    ],
  },
  slime: {
    p: { K: "#0f1f4a", G: "#4aa8ff", H: "#d2ecff", D: "#2b6fd6", W: "#fff" },
    m: [
      "................",
      "................",
      ".....KKKKKK.....",
      "...KKGGGGGGKK...",
      "..KGGHHGGGGGGK..",
      ".KGGHGGGGGGGGGK.",
      ".KGWWGGGGGWWGGK.",
      ".KGWKGGGGGWKGGK.",
      ".KGGGGGGGGGGGGK.",
      ".KGGGGKKKKGGGGK.",
      "KGGGGGGGGGGGGGGK",
      "KDGGGGGGGGGGGGDK",
      "KDDDDDDDDDDDDDDK",
      ".KKKKKKKKKKKKKK.",
      "................",
      "................",
    ],
    a: [
      [
        "................",
        "................",
        ".....KKKKKK.....",
        "...KKGGGGGGKK...",
        "..KGGHHGGGGGGK..",
        ".KGGHGGGGGGGGGK.",
        ".KGWWGGGGGWWGGK.",
        ".KGWKGGGGGWKGGK.",
        ".KGGGGGGGGGGGGK.",
        ".KGGGGKKKKGGGGK.",
        "KGGGGGGGGGGGGGGK",
        "KDGGGGGGGGGGGGDK",
        "KDDDDDDDDDDDDDDK",
        ".KKKKKKKKKKKKKK.",
        "................",
        "................",
      ],
      [
        "................",
        "................",
        "................",
        "....KKKKKKKK....",
        "..KKGGGGGGGGKK..",
        ".KGGHHGGGGGGGGK.",
        ".KGWWGGGGGWWGGK.",
        ".KGWKGGGGGWKGGK.",
        ".KGGGGGGGGGGGGK.",
        "KGGGGGKKKKGGGGGK",
        "KGGGGGGGGGGGGGGK",
        "KDGGGGGGGGGGGGDK",
        "KDDDDDDDDDDDDDDK",
        "KKKKKKKKKKKKKKKK",
        "................",
        "................",
      ],
    ],
  },
  fox: {
    p: { K: "#2a1830", O: "#f4f0f8", P: "#ffb3c1", W: "#ffffff" },
    m: [
      "..KK........KK..",
      ".KOOK......KOOK.",
      ".KOPOK....KOPOK.",
      ".KOOOKKKKKKOOOK.",
      ".KOOOOOOOOOOOOK.",
      "KOOKKOOOOOOKKOOK",
      "KOOOOOOOOOOOOOOK",
      "KOOWWWWWWWWWWOOK",
      ".KOWWWWKKWWWWOK.",
      ".KOOWWWWWWWWOOK.",
      "..KOOOWWWWOOOK..",
      "...KKOOOOOOKK...",
      "....KKKKKKKK....",
      "................",
      "................",
      "................",
    ],
    a: [
      [
        "..KK........KK..",
        ".KOOK......KOOK.",
        ".KOPOK....KOPOK.",
        ".KOOOKKKKKKOOOK.",
        ".KOOOOOOOOOOOOK.",
        "KOOKKOOOOOOKKOOK",
        "KOOOOOOOOOOOOOOK",
        "KOOWWWWWWWWWWOOK",
        ".KOWWWWKKWWWWOK.",
        ".KOOWWWWWWWWOOK.",
        "..KOOOWWWWOOOK..",
        "...KKOOOOOOKK...",
        "....KKKKKKKK....",
        "................",
        "................",
        "................",
      ],
      [
        "...KK......KK...",
        ".KOOK......KOOK.",
        ".KOPOK....KOPOK.",
        ".KOOOKKKKKKOOOK.",
        ".KOOOOOOOOOOOOK.",
        "KOOOOOOOOOOOOOOK",
        "KOOOOOOOOOOOOOOK",
        "KOOWWWWWWWWWWOOK",
        ".KOWWWWKKWWWWOK.",
        ".KOOWWWWWWWWOOK.",
        "..KOOOWWWWOOOK..",
        "...KKOOOOOOKK...",
        "....KKKKKKKK....",
        "................",
        "................",
        "................",
      ],
    ],
  },
  golem: {
    p: { K: "#161c18", S: "#8a9486", D: "#5d6a5a", Y: "#4fd8ff" },
    m: [
      "....KKKKKKKK....",
      "...KSSSSSSSSK...",
      "...KSYYSSYYSK...",
      "...KSYKSSKYSK...",
      "...KSSSSSSSSK...",
      "...KSSKKKKSSK...",
      ".KKKKSSSSSSKKKK.",
      "KSSSKSDSSDSKSSSK",
      "KSDSKSSSSSSKSDSK",
      "KSSSKSSDDSSKSSSK",
      ".KKKKSSSSSSKKKK.",
      "...KSSSSSSSSK...",
      "...KSSSKKSSSK...",
      "...KSSSK.KSSSK..",
      "..KKKKKK.KKKKKK.",
      "................",
    ],
    a: [
      [
        "....KKKKKKKK....",
        "...KSSSSSSSSK...",
        "...KSYYSSYYSK...",
        "...KSYKSSKYSK...",
        "...KSSSSSSSSK...",
        "...KSSKKKKSSK...",
        ".KKKKSSSSSSKKKK.",
        "KSSSKSDSSDSKSSSK",
        "KSDSKSSSSSSKSDSK",
        "KSSSKSSDDSSKSSSK",
        ".KKKKSSSSSSKKKK.",
        "...KSSSSSSSSK...",
        "...KSSSKKSSSK...",
        "...KSSSK.KSSSK..",
        "..KKKKKK.KKKKKK.",
        "................",
      ],
      [
        "....KKKKKKKK....",
        "...KSSSSSSSSK...",
        "...KSKKSSKKSK...",
        "...KSSSSSSSSK...",
        "...KSSSSSSSSK...",
        "...KSSKKKKSSK...",
        ".KKKKSSSSSSKKKK.",
        "KSSSKSDSSDSKSSSK",
        "KSDSKSSSSSSKSDSK",
        "KSSSKSSDDSSKSSSK",
        ".KKKKSSSSSSKKKK.",
        "...KSSSSSSSSK...",
        "...KSSSKKSSSK...",
        "...KSSSK.KSSSK..",
        "..KKKKKK.KKKKKK.",
        "................",
      ],
    ],
  },
  dragon: {
    p: { K: "#0e0610", P: "#7a1f2e", D: "#3a1a28", Y: "#ffe14d", W: "#fff" },
    m: [
      "..KK........KK..",
      ".KPPK......KPPK.",
      ".KPPPKKKKKKPPPK.",
      ".KPPPPPPPPPPPPK.",
      "KPPPYKPPPPKYPPPK",
      "KPPPPPPPPPPPPPPK",
      "KPPPPPPPPPPPPPPK",
      ".KPPWWWWWWWWPPK.",
      ".KPPWKWKKWKWPPK.",
      "..KPPWWWWWWPPK..",
      "KKKPPPPPPPPPPKKK",
      "KDDKPPPPPPPPKDDK",
      "KDDDKPPPPPPKDDDK",
      ".KDDKPPKKPPKDDK.",
      "..KKK.KKKK.KKK..",
      "................",
    ],
    a: [
      [
        "..KK........KK..",
        ".KPPK......KPPK.",
        ".KPPPKKKKKKPPPK.",
        ".KPPPPPPPPPPPPK.",
        "KPPPYKPPPPKYPPPK",
        "KPPPPPPPPPPPPPPK",
        "KPPPPPPPPPPPPPPK",
        ".KPPWWWWWWWWPPK.",
        ".KPPWKWKKWKWPPK.",
        "..KPPWWWWWWPPK..",
        "KKKPPPPPPPPPPKKK",
        "KDDKPPPPPPPPKDDK",
        "KDDDKPPPPPPKDDDK",
        ".KDDKPPKKPPKDDK.",
        "..KKK.KKKK.KKK..",
        "................",
      ],
      [
        "..KK........KK..",
        ".KPPK......KPPK.",
        ".KPPPKKKKKKPPPK.",
        ".KPPPPPPPPPPPPK.",
        "KPPPYKPPPPKYPPPK",
        "KPPPPPPPPPPPPPPK",
        "KPPPPPPPPPPPPPPK",
        ".KPPWWWWWWWWPPK.",
        ".KPPWKWKKWKWPPK.",
        "KDKPPWWWWWWPPKDK",
        "KDDKPPPPPPPPKDDK",
        ".KDKPPPPPPPPKDK.",
        "..KKKPPPPPPKKK..",
        ".KDDKPPKKPPKDDK.",
        "..KKK.KKKK.KKK..",
        "................",
      ],
    ],
  },
  slimeL: {
    p: {
      K: "#0f1f4a",
      G: "#4aa8ff",
      H: "#d2ecff",
      D: "#2b6fd6",
      d: "#1f55a8",
      W: "#ffffff",
      C: "#1a3f8a",
      M: "#0f1f4a",
      T: "#ff8aa0",
      X: "#a8d8ff",
    },
    m: [
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "................................",
      "............KKKKKKKK............",
      "..........KKHHHHHHHHKK..........",
      "........KKHHHGGGGGCCCHKK........",
      ".......KHHHGGGGGGGCGGGHHK.......",
      "......KHWWWWGXGGGGCGGGGGHK......",
      ".....KHHWWWWGGGGGGGCGGGGGHK.....",
      "....KHHGWWWWWGGGGGGWWWWGGGHK....",
      "....KHGGWWWWWGGGGGCWWWWGGGDK....",
      "...KHHGGWWWWWWGGGGWWWWWWGGGHK...",
      "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
      "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
      "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
      "...KHGGGGWWWWGGGGGGWWWWGGGGDK...",
      "...KHGGGGWWWWGGGGGGWWWWGGGGDK...",
      "...KHGGGGGGGGGGGGGGGGGGGGGGDK...",
      "..KHHGGGGGGGGGGGGGGGGGGGGGGGHK..",
      ".KHHGGGXGGGGMMGGGGMMMGGGGXGGGHK.",
      ".KHGGGGGGGGGGGMMMMMGGGGGGGGGGDK.",
      ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
      ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
      ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
      ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
      ".KHDDDDDDDDDDDDDDDDDDDDDDDDDDDK.",
      "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
    ],
    a: [
      [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "............KKKKKKKK............",
        "..........KKHHHHHHHHKK..........",
        "........KKHHHGGGGGCCCHKK........",
        ".......KHHHGGGGGGGCGGGHHK.......",
        "......KHWWWWGXGGGGCGGGGGHK......",
        ".....KHHWWWWGGGGGGGCGGGGGHK.....",
        "....KHHGWWWWWGGGGGGWWWWGGGHK....",
        "....KHGGWWWWWGGGGGCWWWWGGGDK....",
        "...KHHGGWWWWWWGGGGWWWWWWGGGHK...",
        "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
        "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
        "...KHGGGWKKWWWGGGGWKKWWWGGGDK...",
        "...KHGGGGWWWWGGGGGGWWWWGGGGDK...",
        "...KHGGGGWWWWGGGGGGWWWWGGGGDK...",
        "...KHGGGGGGGGGGGGGGGGGGGGGGDK...",
        "..KHHGGGGGGGGGGGGGGGGGGGGGGGHK..",
        ".KHHGGGXGGGGMMGGGGMMMGGGGXGGGHK.",
        ".KHGGGGGGGGGGGMMMMMGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHDDDDDDDDDDDDDDDDDDDDDDDDDDDK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
      ],
      [
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "...........KKKKKKKKKK...........",
        "........KKKHHHHHHHHHHKKK........",
        ".......KHHHHGGGGGGCCCHHHK.......",
        ".....KKHHGGGGGGGGGCGGGGGHKK.....",
        "....KHHHWWWWWXGGGGCWWWWGGHHK....",
        "...KHHGGWWWWWGGGGGGWWWWGGGGHK...",
        "...KHGGGWWWWWWGGGGWWWWWWGGGDK...",
        "..KHHGGGWKKWWWGGGGWKKWWWGGGGHK..",
        "..KHGGGGWKKWWWGGGGWKKWWWGGGGDK..",
        "..KHGGGGWKKWWWGGGGWKKWWWGGGGDK..",
        "..KHGGGGGWWWWGGGGGGWWWWGGGGDDK..",
        "..KKHGGGGWWWWGGGGGCWWWWGGGGDKK..",
        ".KHHHGGGGGGGGGGGGGGGGGGGGGGGHHK.",
        "KHHGGGGGGGGGGGGGGGGGGGGGGGGGGGHK",
        "KHGGGGGXGGGGMMGGGGMMMGGGGXGGGDDK",
        ".KHGGGGGGGGGGGMMMMMGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHDDDDDDDDDDDDDDDDDDDDDDDDDDDK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
      ],
      [
        "................................",
        "................................",
        "................................",
        "................................",
        ".............KKKKKK.............",
        "...........KKHHHHHHKK...........",
        ".........KKHHHGGGGCCCKK.........",
        "........KHHHGGGGGGCGGHHK........",
        ".......KWWWWGXGGGGCGGGGHK.......",
        "......KHWWWWGGGGGGGCGGGGHK......",
        "......KHWWGGGGGGGGGCCGGGDK......",
        ".....KHHKKKGGGGGGGCGGKKKKHK.....",
        ".....KHGGGKKKGGGGGCKKKGGGDK.....",
        "....KHHGGWWWWKGGGGCKWWWGGGHK....",
        "....KHGGWWWWWWGGGGWWWWWWGGDK....",
        "....KHGGWKKWWWGGGGWKKWWWGGDK....",
        "....KHGGWKKWWWGGGGWKKWWWGGDK....",
        "....KHGGWWWWWWGGGGWWWWWWGGDK....",
        "....KHGGGWWWWGGGGGGWWWWGGGDK....",
        "....KHGGGGGGGGGGGGGGGGGGGGDK....",
        "....KHGGGGGGGMMMMMMGGGGGGGDK....",
        "...KHHGGGGGGWWMMMMWWGGGGGGGHK...",
        "..KHHGGXGGGGMMMMMMMMGGGGGXGGHK..",
        "..KHGGGGGGGGMTTTTTTMGGGGGGGGDK..",
        ".KHHGGGGGGGGMTTTTTTMGGGGGGGGGHK.",
        ".KHGGGGGGGGGGMMMMMMGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHGGGGGGGGGGGGGGGGGGGGGGGGGGDK.",
        ".KHDDDDDDDDDDDDDDDDDDDDDDDDDDDK.",
        "..KKKKKKKKKKKKKKKKKKKKKKKKKKKK..",
      ],
    ],
  },
  foxL: {
    p: {
      K: "#2a1830",
      O: "#f4f0f8",
      o: "#cfc6dc",
      H: "#ffffff",
      W: "#ffffff",
      w: "#d8d0e6",
      P: "#ffb3c1",
      E: "#e0243c",
      R: "#c8283e",
      T: "#ff6b8b",
    },
    m: [
      "...K....................K.......",
      "..KHK..................KHK......",
      "..KHHK................KHoK......",
      "..KHOHK..............KHHoK......",
      "..KHPOHK..KKKKKKKK..KHHPoK......",
      ".KHHPPOHKKHHHHHHHHKKHHPPoK......",
      ".KHPPPPOHHHOORROOOHHHPPPPHKKKK..",
      ".KHPPPOOOOOOOROOOOOOOOPPPOWWWWK.",
      ".KHPPOOOOOOOOROOOOOOOOOPPOWWWWWK",
      ".KHoOKKKOOOOOROOOOOOKKKKOOWWWWWW",
      ".KHKHOOOKKKOOOROOKKKOOOOOOWWWWWw",
      "..KHHOOOOOOKOOOROKOOOOOOOWWWWWWw",
      "..KHOOEEWKEOOOOOOEKWEEOOOWWWWWWw",
      ".KKHOOEEKKEOOOOOOEKKEEOOOWWWWWWw",
      "KWKHOOEEKKEWWWWWWEKKEEOOOWWWWWWw",
      "KWWWWOOOOWWWWWWWWWWOOOWWWWWWWWWw",
      ".KWWWWWOWWWWWKKKWWWWOWWWWWWWWWWo",
      ".KWWwwOOWWWWWKKKWWWWOOWWWWWWWWOo",
      ".KWWwKHoWWWWWWWWWWWwoOOWWWOOOOoo",
      ".KWwwKKKHWWWKKWKKKWoKHOWWWOOOOoK",
      "..KWK..KHOWWWWKKWWOoKHOOWOOOOOoK",
      "...K..KHHOOWWWWWWOOOHHOOOOOOOooK",
      ".....KHHOOOWWWWWWOOOOOOOOOOOOoK.",
      ".....KHOOOWWWWWWWWOOOOOOOOOOooK.",
      ".....KHOOOWWWWWWWWOOOOOOOOOooK..",
      ".....KHOOOWWWWWWWWOOOOOOOOooK...",
      ".....KHOOOWWWWWWWWOOOOOOOooK....",
      ".....KHOOOOOWWWWOOOOOOOOooK.....",
      "......KHOOOOWWWWOOOOOOOooK......",
      "......KHOOOOWWWWOOOOooooK.......",
      "......KWWWWwwwwwWWWWwKKK........",
      "......KWwwwwKKKKWwwwwK..........",
    ],
    a: [
      [
        "...K....................K.......",
        "..KHK..................KHK......",
        "..KHHK................KHoK......",
        "..KHOHK..............KHHoK......",
        "..KHPOHK..KKKKKKKK..KHHPoK......",
        ".KHHPPOHKKHHHHHHHHKKHHPPoK......",
        ".KHPPPPOHHHOORROOOHHHPPPPHKKKK..",
        ".KHPPPOOOOOOOROOOOOOOOPPPOWWWWK.",
        ".KHPPOOOOOOOOROOOOOOOOOPPOWWWWWK",
        ".KHoOKKKOOOOOROOOOOOKKKKOOWWWWWW",
        ".KHKHOOOKKKOOOROOKKKOOOOOOWWWWWw",
        "..KHHOOOOOOKOOOROKOOOOOOOWWWWWWw",
        "..KHOOEEWKEOOOOOOEKWEEOOOWWWWWWw",
        ".KKHOOEEKKEOOOOOOEKKEEOOOWWWWWWw",
        "KWKHOOEEKKEWWWWWWEKKEEOOOWWWWWWw",
        "KWWWWOOOOWWWWWWWWWWOOOWWWWWWWWWw",
        ".KWWWWWOWWWWWKKKWWWWOWWWWWWWWWWo",
        ".KWWwwOOWWWWWKKKWWWWOOWWWWWWWWOo",
        ".KWWwKHoWWWWWWWWWWWwoOOWWWOOOOoo",
        ".KWwwKKKHWWWKKWKKKWoKHOWWWOOOOoK",
        "..KWK..KHOWWWWKKWWOoKHOOWOOOOOoK",
        "...K..KHHOOWWWWWWOOOHHOOOOOOOooK",
        ".....KHHOOOWWWWWWOOOOOOOOOOOOoK.",
        ".....KHOOOWWWWWWWWOOOOOOOOOOooK.",
        ".....KHOOOWWWWWWWWOOOOOOOOOooK..",
        ".....KHOOOWWWWWWWWOOOOOOOOooK...",
        ".....KHOOOWWWWWWWWOOOOOOOooK....",
        ".....KHOOOOOWWWWOOOOOOOOooK.....",
        "......KHOOOOWWWWOOOOOOOooK......",
        "......KHOOOOWWWWOOOOooooK.......",
        "......KWWWWwwwwwWWWWwKKK........",
        "......KWwwwwKKKKWwwwwK..........",
      ],
      [
        "..K.....................K.......",
        ".KHK...................KHK......",
        ".KHHK.................KHoK......",
        ".KHOHK...............KHHoK......",
        ".KHPOHK...KKKKKKKK..KHHPoK......",
        ".KHPPOHKKKHHHHHHHHKKHHPPoK......",
        ".KHPPPOHHHHOORROOOHHHPPPPHK.KKKK",
        ".KHPPPOOOOOOOROOOOOOOOPPPoKKWWWW",
        ".KHPPOOOOOOOOROOOOOOOOOPPoKWWWWw",
        ".KHoOKKKOOOOOROOOOOOKKKKoOWWWWWw",
        ".KHKHOOOKKKOOOROOKKKOOOoKHWWWWWw",
        "..KHHOOOOOOKOOOROKOOOOOOHKWWWWWw",
        "..KHOOEEWKEOOOOOOEKWEEOOOWWWWWWw",
        ".KKHOOEEKKEOOOOOOEKKEEOOOWWWWWWw",
        "KWKHOOEEKKEWWWWWWEKKEEOOOWWWWWWw",
        "KWWWWOOOOWWWWWWWWWWOOOWWWWWWWWWw",
        ".KWWWWWOWWWWWKKKWWWWOWWWWWWWWWWw",
        ".KWWwwOOWWWWWKKKWWWWOOWWWWOWWWWw",
        ".KWWwKHoWWWWWWWWWWWwooOWWWOOOOOo",
        ".KWwwKKKHWWWKKWKKKWoKKHWWWOOOOOo",
        "..KWK..KHOWWWWKKWWOoKKHOWOOOOOOo",
        "...K..KHHOOWWWWWWOOOHHHOOOOOOOoo",
        ".....KHHOOOWWWWWWOOOOOOOOOOOOooK",
        ".....KHOOOWWWWWWWWOOOOOOOOOOooK.",
        ".....KHOOOWWWWWWWWOOOOOOOOOOoK..",
        ".....KHOOOWWWWWWWWOOOOOOOOOooK..",
        ".....KHOOOWWWWWWWWOOOOOOOoooK...",
        ".....KHOOOOOWWWWOOOOOOOOooKK....",
        "......KHOOOOWWWWOOOOOOOooK......",
        "......KHOOOOWWWWOOOOooooK.......",
        "......KWWWWwwwwwWWWWwKKK........",
        "......KWwwwwKKKKWwwwwK..........",
      ],
      [
        "...K....................K.......",
        "..KHK..................KHK......",
        "..KHHK................KHoK......",
        "..KHOHK..............KHHoK......",
        "..KHPOHK............KHHPoK......",
        ".KHHPPOHK.KKKKKKKK.KHHPPoK......",
        ".KHPPPPOHKHHHHHHHHKHHPPPPHKKK...",
        ".KHPPPPPOHHOORROOOHHPPPPPOWWWK..",
        ".KHPPOOOOOOOOROOOOOOOOPPPOWWWWK.",
        ".KHoOOOOOOOOOROOOOOOOOOOOOWWWWHK",
        ".KHKHKKKOOOOOROOOOOOKKKKWOWWWWwK",
        "..KKHOOOKKKOOOROOKKKOOOOWWWWWWwK",
        "..KHHOOOOOOKOOOROKOOOOOOOWWWWWwK",
        "..KHOOTTWKTOOOOOOTKWTTOOOWWWWWwK",
        ".KKHOOTTKKTOOOOOOTKKTTOOOWWWWWwK",
        "KWKHOOTTKKTWWWWWWTKKTTOOOWWWWWwK",
        "KWWWWOOOOWWWWWWWWWWOOOWWWWWWWWoK",
        ".KWWWWWOWWWWWKKKWWWWOWWWWWWWWOoK",
        ".KWWwwOOWWWWWKKKWWWWOOWWWWOOOOoK",
        ".KWWwKHoWWWWWWWWWWWWOOOWWWOOOooK",
        ".KWwwKKKHWWKKKKKKWWOOOOWWWOOOoK.",
        "..KWK.KHHOWWKKKKKWOOOOOOWOOOOoK.",
        "...K.KHHOOOKTTTTKOOOOOOOOOOOooK.",
        ".....KHOOOWKKKKKKWOOOOOOOOOooK..",
        ".....KHOOOWWWWWWWWOOOOOOOOOoK...",
        ".....KHOOOWWWWWWWWOOOOOOOOooK...",
        ".....KHOOOWWWWWWWWOOOOOOOooK....",
        ".....KHOOOOOWWWWOOOOOOOOooK.....",
        "......KHOOOOWWWWOOOOOOOooK......",
        "......KHOOOOWWWWOOOOooooK.......",
        "......KWWWWwwwwwWWWWwKKK........",
        "......KWwwwwKKKKWwwwwK..........",
      ],
    ],
  },
  golemL: {
    p: {
      K: "#161c18",
      S: "#8a9486",
      s: "#aab4a2",
      D: "#5d6a5a",
      d: "#414c40",
      Y: "#4fd8ff",
      y: "#bff4ff",
      M: "#4aa86a",
      m: "#2f7a48",
      R: "#4fd8ff",
      r: "#1f7a9a",
    },
    m: [
      "...........KssssssssK...........",
      "..........KssSSSSSSSsK..........",
      "..........KsSSSSSSSSDK..........",
      "..........KsKKKSSKKKDK..........",
      "..........KsYYYSSYYYDK..........",
      "..........KsYYYSSYYYDK..........",
      "..........KsSSSSSSSSDK..........",
      "....KKKK..KsSSKSKSKSDK..KKKK....",
      "..KKssssKKKsSKKKKKKSDKKKssssKK..",
      ".KsMsSSSsMssSSSSSSSSSssssSSSssK.",
      ".KMSMSSSMmSSSSSSSSSSSSSSMMSSSDK.",
      ".KsmSSSSSKSSSSSSSSSSSSSSSSSSSDK.",
      ".KsSSSSSSKKSSSSSSSSSSSSSSSSSSDK.",
      ".KsSSSSSSSKSSSSddSSSSSSSSSSSSDK.",
      ".KsSSSSSSSKKSSdRRdSSSSSSSSSSSDK.",
      ".KsSSSSSSSKRRRRRYRdRRRSSSSSSSDK.",
      ".KsSSSSKSSKSSdRYRRdSSSSSKSSSSDK.",
      ".KsSSSSddddddSdRRdSSSSSSKSSSSDK.",
      ".KsSSSSKSSSSSSSddSSSSSSSKSddddK.",
      ".KsddddKSSSSSSSSSSSSddddddSSSDK.",
      ".KsSSSDKsSSSSSSSSSSSSSSDKsSSSDK.",
      ".KsSSSDKsSSSdSSSRSSSdSKKKsSSSDK.",
      "KssSSSSKsSSSdSSSRSSSdKKSKsSSSSsK",
      "ssSSSSSKSSSSdSDDRSSSdKSSKSSSSSSs",
      "sSSSSSSSSSSSSSDKKsSSSKSSSSSSSSSD",
      "sSSSSSSSSSSSSSDKKsSSSSSSSSSSSSSD",
      "sSSSSSSDDSdSSSDKKsSSSSdDSSSSSSDD",
      "KsSSSSSDKsdSSSDKKsSSSSdKsSSSSDDK",
      ".KsDDDDSssdSSSSsssSSSSdsDDDDDDK.",
      "..KKKKKsSSSSSSSSSSSSSSSSDKKKKK..",
      "......KsDSSSSDDDDDSSSSDDDK......",
      ".......KKsDDDDKKKKsDDDDKK.......",
    ],
    a: [
      [
        "...........KssssssssK...........",
        "..........KssSSSSSSSsK..........",
        "..........KsSSSSSSSSDK..........",
        "..........KsKKKSSKKKDK..........",
        "..........KsYYYSSYYYDK..........",
        "..........KsYYYSSYYYDK..........",
        "..........KsSSSSSSSSDK..........",
        "....KKKK..KsSSKSKSKSDK..KKKK....",
        "..KKssssKKKsSKKKKKKSDKKKssssKK..",
        ".KsMsSSSsMssSSSSSSSSSssssSSSssK.",
        ".KMSMSSSMmSSSSSSSSSSSSSSMMSSSDK.",
        ".KsmSSSSSKSSSSSSSSSSSSSSSSSSSDK.",
        ".KsSSSSSSKKSSSSSSSSSSSSSSSSSSDK.",
        ".KsSSSSSSSKSSSSddSSSSSSSSSSSSDK.",
        ".KsSSSSSSSKKSSdRRdSSSSSSSSSSSDK.",
        ".KsSSSSSSSKRRRRRYRdRRRSSSSSSSDK.",
        ".KsSSSSKSSKSSdRYRRdSSSSSKSSSSDK.",
        ".KsSSSSddddddSdRRdSSSSSSKSSSSDK.",
        ".KsSSSSKSSSSSSSddSSSSSSSKSddddK.",
        ".KsddddKSSSSSSSSSSSSddddddSSSDK.",
        ".KsSSSDKsSSSSSSSSSSSSSSDKsSSSDK.",
        ".KsSSSDKsSSSdSSSRSSSdSKKKsSSSDK.",
        "KssSSSSKsSSSdSSSRSSSdKKSKsSSSSsK",
        "ssSSSSSKSSSSdSDDRSSSdKSSKSSSSSSs",
        "sSSSSSSSSSSSSSDKKsSSSKSSSSSSSSSD",
        "sSSSSSSSSSSSSSDKKsSSSSSSSSSSSSSD",
        "sSSSSSSDDSdSSSDKKsSSSSdDSSSSSSDD",
        "KsSSSSSDKsdSSSDKKsSSSSdKsSSSSDDK",
        ".KsDDDDSssdSSSSsssSSSSdsDDDDDDK.",
        "..KKKKKsSSSSSSSSSSSSSSSSDKKKKK..",
        "......KsDSSSSDDDDDSSSSDDDK......",
        ".......KKsDDDDKKKKsDDDDKK.......",
      ],
      [
        "...........KssssssssK...........",
        "..........KssSSSSSSSsK..........",
        "..........KsSSSSSSSSDK..........",
        "..........KsKKKSSKKKDK..........",
        "..........KsyyySSyyyDK..........",
        "..........KsyyySSyyyDK..........",
        "....KKKK..KsSSSSSSSSDK..KKKK....",
        "..KKssssKKKsSSKSKSKSDKKKssssKK..",
        ".KsssSSSssKsSKKKKKKSDKsssSSSssK.",
        ".KsMSSSSSMssSSSSSSSSSssSSSSSSDK.",
        ".KMSMSSSMmSSSSSSSSSSSSSSMMSSSDK.",
        ".KsmSSSSSKSSSSSSSSSSSSSSSSSSSDK.",
        ".KsSSSSSSKKSSSSSSSSSSSSSSSSSSDK.",
        ".KsSSSSSSSKSSSSddSSSSSSSSSSSSDK.",
        ".KsSSSSSSSKKSSdrrdSSSSSSSSSSSDK.",
        ".KsSSSSKSSKrrrrrYrdrrrSSKSSSSDK.",
        ".KsSSSSKSSKSSdrYrrdSSSSSKSSSSDK.",
        ".KsSSSSddddddSdrrdSSSSSSKSddddK.",
        ".KsddddKSSSSSSSddSSSSSSSKSSSSDK.",
        ".KsSSSDKSSSSSSSSSSSSddddddSSSDK.",
        ".KsSSSDKsSSSSSSSSSSSSSSDKsSSSDK.",
        "KssSSSSKsSSSdSSSrSSSdSKKKsSSSSsK",
        "ssSSSSSKSSSSdSSSrSSSdKKSKSSSSSSs",
        "sSSSSSSSSSSSdSDDrSSSdKSSSSSSSSSD",
        "sSSSSSSSSSSSSSDKKsSSSKSSSSSSSSSD",
        "sSSSSSSDDSSSSSDKKsSSSSDDSSSSSSDD",
        "KsSSSSDDKsdSSSDKKsSSSSdKsSSSSDDK",
        ".KsDDDDKKsdSSSDKKsSSSSdKKsDDDDK.",
        "..KKKKKsssdSSSSsssSSSSdssKKKKK..",
        "......KsSSSSSSSSSSSSSSSSDK......",
        "......KsDSSSSDDDDDSSSSDDDK......",
        ".......KKsDDDDKKKKsDDDDKK.......",
      ],
      [
        "...........KssssssssK...........",
        "..........KssSSSSSSSsK..........",
        "..........KsSSSSSSSSDK..........",
        "..........KsKKKSSKKKDK..........",
        "....KKKK..KsYYYSSYYYDK..KKKK....",
        "..KKssssKKKsYYYSSYYYDKKKssssKK..",
        ".KsssSSSssKsSSSSSSSSDKsssSSSssK.",
        ".KsSSSSSSDKsSSKKKKSSDKsSSSSSSDK.",
        ".KsSSSSSSDKsSKKKKKKSDKsSSSSSSDK.",
        ".KsMSSSSSMssSSSSSSSSSssSSSSSSDK.",
        ".KMSMSSSMmSSSSSSSSSSSSSSMMSSSDK.",
        ".KsmSSSKSKSSSSSSSSSSSSSSKSSSSDK.",
        ".KsSSSSKSKKSSSSSSSSSSSSSKSSSSDK.",
        ".KsSSSSKSSKSSSSddSSSSSSSKSddddK.",
        ".KsddddKSSKKSSdRRdSSSSSSKSSSSDK.",
        ".KsSSSSKSSKRRRRRYRdRRRSSKSSSSDK.",
        ".KsSSSSKSSKSSdRYRRdSSSSSKSSSSDK.",
        "KssSSSSddddddSdRRdSSSSSSKSSSSSsK",
        "ssSSSSSKSSSSSSSddSSSSSSSKSSSSSSs",
        "sSSSSSSSSSSSSSSSSSSSddddddSSSSSD",
        "sSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSD",
        "sSSSSSSSSSSSdSSSRSSSdSKKSSSSSSDD",
        "KsSSSSDDSSSSdSSSRSSSdKKDDSSSSDDK",
        ".KsDDDDKsSSSdSDDRSSSdKDDKsDDDDK.",
        "..KKKKK.KsSSSSDKKsSSSKDK.KKKKK..",
        "........KsSSSSDKKsSSSSDK........",
        "........KsdSSSDKKsSSSSdK........",
        ".......KKsdSSSDKKsSSSSdKK.......",
        "......KsssdSSSSsssSSSSdssK......",
        "......KsSSSSSSSSSSSSSSSSDK......",
        "......KsDSSSSDDDDDSSSSDDDK......",
        ".......KKsDDDDKKKKsDDDDKK.......",
      ],
    ],
  },
  dragonL: {
    p: {
      K: "#0e0610",
      P: "#7a1f2e",
      p: "#b03a4c",
      D: "#3a1a28",
      d: "#241018",
      Y: "#ffe14d",
      W: "#ffffff",
      B: "#f0d0c8",
      b: "#d09890",
      F: "#ff8a2b",
      f: "#ffd166",
      H: "#e8d8d0",
      w: "#9a2a3c",
      N: "#1a0a14",
    },
    m: [
      ".....KHK.......KK......KKHK.....",
      "......KHKK....KDDK....KHHK......",
      "......KHHHK.KKDDDDKK.KHHHK......",
      "......KHHHKKpppPPPppKKHHHK......",
      ".K.....KHKpppPPPPPPPppKHK....KK.",
      "KDK.....KpKKPPPPPPPKKKpK....KDDK",
      "KwDK....KpPPKKPPPKKPPPDK...KDdK.",
      "KwDDK..KppPYKYKPPKYKYPPpK.KDDdK.",
      "wwwDK..KpPPYKYPPPPYKYPPDK.KDwwwK",
      "wwwwDK.KpPPYKYPPPPYKYPPDKKDwwwdK",
      "wwwwDDKKpPPPPPPPPPPPPPDDKDDwwwdK",
      "wwwwwDDKKpPPPPPPPPPPPPDKDDwwwwdK",
      "wwwwwwDKKpPPPPPPPPPPPDDKDwwwwddK",
      "KwDwwwwDKKpPPPKPPPKPDDKDwwwwDDK.",
      "KwwDwwwDDKKpPPPPPPPPDKDDwwwDdK..",
      ".KwdDDwwDwKpPPPPPPPPPwDwwDDddK..",
      "..KwKDDwwDKpKKKKKKKKKDwwDDDdK...",
      "...KKwDDwwppWPWPPPWPWPwDDdKK....",
      ".....KwDDPPPPPPPPPPPPPPDdK......",
      ".....KwwPPPPbbPPPPbbPPPPdK...K..",
      ".....KwwPPPPBBBBBBBBPPPDdK..KDK.",
      "......KwPPPBbbbbbbbbbPPDK.KKpDK.",
      "......KwPPPBBBBBBBBBBPPDKKppDDK.",
      ".......KpPPBbbbbbbbbbPPPpppDDK..",
      ".......KpPPBBBBBBBBBBPPPPPPDK...",
      ".......KpPPBbbbbbbbbbPPPPPDDK...",
      ".......KpPPPPBBBBBBPPPPPPDDK....",
      "......KppPPPPPbbbbPPPPPPPDK.....",
      ".....KppPPPPPPPBBPPPPPPPDDK.....",
      "......KpPPPPPPBBBBPPPPPDDK......",
      ".......KpDDDDDDDDDDDDDDDK.......",
      ".......KWKWKWKKKKKKWKWKWK.......",
    ],
    a: [
      [
        ".....KHK.......KK......KKHK.....",
        "......KHKK....KDDK....KHHK......",
        "......KHHHK.KKDDDDKK.KHHHK......",
        "......KHHHKKpppPPPppKKHHHK......",
        ".K.....KHKpppPPPPPPPppKHK....KK.",
        "KDK.....KpKKPPPPPPPKKKpK....KDDK",
        "KwDK....KpPPKKPPPKKPPPDK...KDdK.",
        "KwDDK..KppPYKYKPPKYKYPPpK.KDDdK.",
        "wwwDK..KpPPYKYPPPPYKYPPDK.KDwwwK",
        "wwwwDK.KpPPYKYPPPPYKYPPDKKDwwwdK",
        "wwwwDDKKpPPPPPPPPPPPPPDDKDDwwwdK",
        "wwwwwDDKKpPPPPPPPPPPPPDKDDwwwwdK",
        "wwwwwwDKKpPPPPPPPPPPPDDKDwwwwddK",
        "KwDwwwwDKKpPPPKPPPKPDDKDwwwwDDK.",
        "KwwDwwwDDKKpPPPPPPPPDKDDwwwDdK..",
        ".KwdDDwwDwKpPPPPPPPPPwDwwDDddK..",
        "..KwKDDwwDKpKKKKKKKKKDwwDDDdK...",
        "...KKwDDwwppWPWPPPWPWPwDDdKK....",
        ".....KwDDPPPPPPPPPPPPPPDdK......",
        ".....KwwPPPPbbPPPPbbPPPPdK...K..",
        ".....KwwPPPPBBBBBBBBPPPDdK..KDK.",
        "......KwPPPBbbbbbbbbbPPDK.KKpDK.",
        "......KwPPPBBBBBBBBBBPPDKKppDDK.",
        ".......KpPPBbbbbbbbbbPPPpppDDK..",
        ".......KpPPBBBBBBBBBBPPPPPPDK...",
        ".......KpPPBbbbbbbbbbPPPPPDDK...",
        ".......KpPPPPBBBBBBPPPPPPDDK....",
        "......KppPPPPPbbbbPPPPPPPDK.....",
        ".....KppPPPPPPPBBPPPPPPPDDK.....",
        "......KpPPPPPPBBBBPPPPPDDK......",
        ".......KpDDDDDDDDDDDDDDDK.......",
        ".......KWKWKWKKKKKKWKWKWK.......",
      ],
      [
        ".....KHK.......KK......KKHK.....",
        "......KHKK....KDDK....KHHK......",
        "......KHHHK.KKDDDDKK.KHHHK......",
        "......KHHHKKpppPPPppKKHHHK......",
        ".......KHKpppPPPPPPPppKHK.......",
        "........KpKKPPPPPPPKKKpK........",
        "........KpPPKKPPPKKPPPDK........",
        ".......KppPYKYKPPKYKYPPpK.......",
        ".......KpPPYKYPPPPYKYPPDK.......",
        ".K.....KpPPYKYPPPPYKYPPDK....K..",
        "KwK....KpPPPPPPPPPPPPPDDK...KwK.",
        "KDDKK...KpPPPPPPPPPPPPDK..KKDDDK",
        "KwDDwK..KpPPPPPPPPPPPDDK.KwDDdK.",
        "KwwwDDKK.KpPPPKPPPKPDDKKKDDwwdK.",
        "wwwwwDDwK.KpPPPPPPPPDKKwDDwwwwwK",
        "wwwwwwwDDKKpPPPPPPPPDKDDwwwwwwdK",
        "wwwwwwwwDDKpKKKKKKKKKDDwwwwwwwdK",
        "wwwwwwwwwwppWPWPPPWPWPwwwwwwwwdK",
        "wwwwwwwwwPPPPPPPPPPPPPPwwwwwwddK",
        "KwDDDDDDPPPPbbPPPPbbPPPPDDDDDDK.",
        ".KwwwwwwPPPPBBBBBBBBPPPPwwwddDK.",
        "..KwdDDDPPPBbbbbbbbbbPPPDDwdKDpK",
        "...KKDddPPPBBBBBBBBBBPPPdKDPpDDK",
        ".....KKKpPPBbbbbbbbbbPPPPppPDDK.",
        ".......KpPPBBBBBBBBBBPPPPPPDDK..",
        ".......KpPPBbbbbbbbbbPPPPPDDK...",
        ".......KpPPPPBBBBBBPPPPPPDDK....",
        "......KppPPPPPbbbbPPPPPPPDK.....",
        ".....KppPPPPPPPBBPPPPPPPDDK.....",
        "......KpPPPPPPBBBBPPPPPDDK......",
        ".......KpDDDDDDDDDDDDDDDK.......",
        ".......KWKWKWKKKKKKWKWKWK.......",
      ],
      [
        ".....KHK.......KK......KKHK.....",
        "......KHKK....KDDK....KHHK......",
        "......KHHHK.KKDDDDKK.KHHHK......",
        ".K....KHHHKKpppPPPppKKHHHK...KK.",
        "KDK....KHKpppPPPPPPPppKHK...KDDK",
        "KwDK....KpKKPPPPPPPKKKpK...KDDK.",
        "KwDDK...KpPPKKPPPKKPPPDK...KDdK.",
        "wwwDK..KppPYKYKPPKYKYPPpK.KDwwwK",
        "wwwwDK.KpPPYKYPPPPYKYPPDKKDDwwdK",
        "wwwwDDKKpPPYKYPPPPYKYPPDKwDwwwdK",
        "wwwwwDKKpPPPPPPPPPPPPPDDKDwwwwdK",
        "wwwwwwDKKpPPPPPPPPPPPPDKDDwwwddK",
        "KwDwwwDDKpPPPPPPPPPPPDDwDwwwDDK.",
        "KwwDwwwDKKpPPPKPPPKPDDKDwwwDdK..",
        ".KwdDwwwDKKpPNNNNNNPDKDDwwDddK..",
        "..KwKDwwDDKpWNWNNNWNWwDwwDDdK...",
        "...KKwDwwDKNNNFFFFNNNDwwDdKK....",
        ".....KDDwwpNNFffffFNNPwDDK......",
        ".....KwDDPPPNFffffFNPPPDdK......",
        ".....KwwPPPPbNFFFFNbPPPPdK...K..",
        ".....KwwPPPPBBBBBBBBPPPDdK..KDK.",
        "......KwPPPBbbbbbbbbbPPDK.KKpDK.",
        "......KwPPPBBBBBBBBBBPPDKKppDDK.",
        ".......KpPPBbbbbbbbbbPPPpppDDK..",
        ".......KpPPBBBBBBBBBBPPPPPPDK...",
        ".......KpPPBbbbbbbbbbPPPPPDDK...",
        ".......KpPPPPBBBBBBPPPPPPDDK....",
        "......KppPPPPPbbbbPPPPPPPDK.....",
        ".....KppPPPPPPPBBPPPPPPPDDK.....",
        "......KpPPPPPPBBBBPPPPPDDK......",
        ".......KpDDDDDDDDDDDDDDDK.......",
        ".......KWKWKWKKKKKKWKWKWK.......",
      ],
    ],
  },
};

/* ---------- Data musuh ---------- */
const E = [
  {
    n: "Slime Retak",
    sp: "slime",
    hp: 60,
    atk: 8,
    topics: ["arit"],
    weak: "arit",
    d: [1, 3],
    s: 3,
    bg: ["#1d3b2f", "#2d5a3d", "#173d28", "#bfe8a3"],
    intro:
      "Desa Satuan diserang! Slime ini retak karena hitungan di tubuhnya kacau. Jawab benar untuk memukulnya.",
    win: "Serpihan Kristal Aksioma pertama kembali bersinar.",
  },
  {
    n: "Rubah Pecah-Pecah",
    sp: "fox",
    hp: 90,
    atk: 10,
    topics: ["pecahan", "persen"],
    weak: "pecahan",
    d: [1, 4],
    s: 3,
    bg: ["#2a1f4d", "#4b2f6e", "#2b1b45", "#ffd7a0"],
    intro:
      "Hutan Pecahan. Rubah ini terbelah jadi pecahan-pecahan. Pecahan lemah terhadap serangan pecahan!",
    win: "Rubah itu kembali utuh dan berlari pergi. Kristal kedua bersinar.",
  },
  {
    n: "Golem Segi Banyak",
    sp: "golem",
    hp: 130,
    atk: 14,
    topics: ["geom", "arit"],
    weak: "geom",
    d: [2, 5],
    s: 5,
    bg: ["#2c3550", "#44527a", "#222a42", "#d7e6ff"],
    intro:
      "Kota Bangun. Golem menjaga jembatan yang ukurannya salah. Geometri adalah kelemahannya.",
    win: "Jembatan kembali lurus. Tiga kristal sudah ditemukan.",
  },
  {
    n: "Naga Parabola",
    sp: "dragon",
    hp: 200,
    atk: 18,
    topics: ["alj", "geom", "pecahan", "persen"],
    weak: "alj",
    d: [3, 5],
    s: 5,
    bg: ["#2a0f3d", "#5a1a5e", "#190825", "#ff9ad8"],
    intro:
      "Boss pertama! Naga Parabola menyemburkan soal campuran. Di balik bayangannya, ada sosok bernama Sang Nol.",
    win: "Naga itu tenang. Sang Nol menatap dari kejauhan... (Bersambung)",
  },
];

/* ---------- Status pemain & skill ---------- */
/* Pertumbuhan atribut (di-nerf): atur di GROW. lv = tambahan per level, pt = tambahan per poin status.
   Dulu: HP 10/10, Mana 5/5, Kekuatan 2/2, Crit & Penetrasi 0,5/1,5, SP_LV 3. */
const GROW = {
    hp: { lv: 6, pt: 6 },
    mp: { lv: 3, pt: 3 },
    pw: { lv: 1.5, pt: 1.5 },
    cr: { lv: 0.3, pt: 1 },
    pe: { lv: 0.3, pt: 1 },
  },
  SP_LV = 2, // poin status yang didapat tiap naik level
  mhp = () => Math.round((100 + GROW.hp.lv * (Pl.lv - 1) + GROW.hp.pt * Pl.st.hp) * JM("hp")) + bon("hp"),
  mmp = () => Math.round((60 + GROW.mp.lv * (Pl.lv - 1) + GROW.mp.pt * Pl.st.mp) * JM("mp")) + bon("mp"),
  pwr = () => Math.round(12 + GROW.pw.lv * Pl.lv + Pl.atk + GROW.pw.pt * Pl.st.pw + bon("atk")),
  critC = () =>
    Math.min(75, 10 + JA("cr") + GROW.cr.lv * (Pl.lv - 1) + GROW.cr.pt * Pl.st.cr + bon("crit")),
  penC = () =>
    Math.min(75, 5 + JA("pe") + GROW.pe.lv * (Pl.lv - 1) + GROW.pe.pt * Pl.st.pe + bon("pen")),
  pc = (x) => +x.toFixed(1);
/* posisi: maju = damage kamu naik tapi damage yang diterima juga naik; mundur = sebaliknya */
const posF = () => clamp(an.mx, 0, 1),
  posAtk = () => 0.85 + 0.3 * posF(),
  posDef = () => (0.75 + 0.5 * posF()) * JM("rd"),
  posName = () => (posF() < 0.34 ? "Bertahan" : posF() < 0.67 ? "Seimbang" : "Agresif"),
  /* jumlah tebasan per serangan (damage dibagi ke tiap tebasan) dan jeda antar tebasan (frame) */
  HITS = { atk: 3, pow: 2, pen: 2, crt: 1, fire: 2, ice: 3, bolt: 1 },
  HG = 4;
function splitDmg(total, n) {
  if (n <= 1) return [Math.max(1, total)];
  const w = Array.from({ length: n }, (_, i) => (i === n - 1 ? 1.5 : 1) * (0.85 + Math.random() * 0.3)),
    sum = w.reduce((a, b) => a + b, 0),
    out = w.map((x) => Math.max(1, Math.round((total * x) / sum)));
  out[n - 1] = Math.max(1, total - out.slice(0, -1).reduce((a, b) => a + b, 0));
  return out;
}
/* angka damage besar + penghitung combo (gaya hack & slash) */
function hitNum(d, c, o = {}) {
  const hc = an.hc && an.hc.l > 0 ? an.hc : (an.hc = { n: 0, d: 0, l: 0, pop: 0 });
  hc.n++;
  hc.d += d;
  hc.l = 150;
  hc.pop = 8;
  an.fl.push({
    x: ecx() + R(-34, 34),
    y: 118 + R(-20, 14),
    t: d + (o.crit ? "!" : ""),
    c,
    l: 60,
    s: o.crit ? 1.8 : o.last ? 1.25 : 0.85,
    vx: (Math.random() - 0.5) * 0.9,
  });
}
const bx0 = (sc) => EHX() - 16 * sc - 100, // posisi serang (hxT) untuk skala musuh sc
  ULT_X = 6, // total damage Pedang Pelangi = kekuatan x ULT_X (menembus pertahanan)
  ULT_MAX = 100, // energi ulti penuh (tersimpan di Pl.ult, ikut save, terkumpul lintas pertempuran)
  EL = { slash: { c: "#ffd166", c2: "#ffffff" }, fire: { c: "#ff7a3a", c2: "#ffd166" }, ice: { c: "#7cf0ff", c2: "#ffffff" }, bolt: { c: "#ffe14d", c2: "#ffffff" } },
  /* durasi animasi per jenis serangan: [mendekat, tahan, kembali] (frame) */
  ATM = { slash: [7, 5, 18], dash: [4, 4, 12], jump: [13, 5, 16], elem: [18, 4, 14], ult: [26, 42, 20] },
  ULT_HF = [27, 32, 37, 42, 47, 52, 60]; // frame tiap tebasan ulti
/* skill: mp = biaya Mana, cd = cooldown (giliran), mult = pengali damage,
   c / p = tambahan peluang Critical / Penetrasi (poin persen) di atas statusmu, lv = level buka */
const SKILLS = [
    /* k = jenis animasi (slash/dash/jump/elem/ult), el = elemen, col = warna, pos = [jari-jari em, derajat, ukuran em], key = tombol keyboard */
    { id: "pow", n: "Tebasan Kuat", mp: 20, cd: 2, mult: 1.8, c: 15, p: 10, lv: 1, k: "elem", el: "slash", col: "#ffd166", pos: [7.2, 176, 3.3], key: "2", fx: "Gelombang tebasan jarak jauh" },
    { id: "pen", n: "Dash Tembus", mp: 20, cd: 2, mult: 1.3, c: 0, p: 40, lv: 3, k: "dash", col: "#b8e0ff", pos: [7.2, 150, 3.3], key: "3", fx: "Menerjang menembus musuh" },
    { id: "crt", n: "Lompat Dash", mp: 25, cd: 3, mult: 1.5, c: 40, p: 0, lv: 5, k: "jump", col: "#e0b8ff", pos: [7.2, 124, 3.3], key: "4", fx: "Melompat lalu menebas dari atas" },
    { id: "heal", n: "Penyembuh", mp: 25, cd: 3, lv: 1, col: "#7ef0c8", pos: [7.2, 98, 3.3], key: "8" },
    { id: "fire", n: "Tebasan Api", mp: 25, cd: 3, mult: 1.5, c: 10, p: 10, lv: 2, k: "elem", el: "fire", col: "#ff7a3a", pos: [11.2, 172, 3], key: "5", fx: "Membakar musuh 2 giliran" },
    { id: "ice", n: "Tebasan Es", mp: 25, cd: 3, mult: 1.4, c: 10, p: 10, lv: 4, k: "elem", el: "ice", col: "#7cf0ff", pos: [11.2, 150, 3], key: "6", fx: "Membekukan: damage musuh −40% (2 serangan)" },
    { id: "bolt", n: "Tebasan Petir", mp: 25, cd: 3, mult: 1.4, c: 20, p: 10, lv: 6, k: "elem", el: "bolt", col: "#ffe14d", pos: [11.2, 128, 3], key: "7", fx: "40% membuat musuh tersengat (lewat 1 giliran)" },
    { id: "ult", n: "Pedang Pelangi", mp: 0, cd: 0, mult: 6, lv: 1, k: "ult", col: "#ff7ad9", pos: [10.8, 105, 3.5], key: "9" },
  ],
  skill = (id) => SKILLS.find((k) => k.id === id) || basicAtk(),
  chanceOf = (id) => {
    const k = skill(id);
    return { c: Math.min(90, critC() + k.c), p: Math.min(90, penC() + k.p) };
  };
function fixPl() {
  // melengkapi data pemain (save lama belum punya status/cooldown/job)
  if (!Pl.job || !JOBS[Pl.job]) Pl.job = "sword";
  applyJob();
  Pl.st = { pw: 0, cr: 0, pe: 0, hp: 0, mp: 0, ...(Pl.st || {}) };
  if (Pl.sp == null) Pl.sp = Math.max(0, Pl.lv - 1) * SP_LV;
  if (typeof Pl.ult !== "number") Pl.ult = 0; // energi ulti (save lama belum punya)
  Pl.cd = {};
  Pl.hp = Math.min(Pl.hp, mhp());
  Pl.fp = Math.min(Pl.fp, mmp());
}
function statUp(k) {
  if (!Pl.sp || !(k in Pl.st)) return;
  Pl.sp--;
  Pl.st[k]++;
  if (k === "hp") Pl.hp += GROW.hp.pt;
  if (k === "mp") Pl.fp += GROW.mp.pt;
  Pl.hp = Math.min(Pl.hp, mhp());
  Pl.fp = Math.min(Pl.fp, mmp());
}
function statTab() {
  const rows = [
    ["pw", "Kekuatan", pwr(), "+" + GROW.pw.pt + " damage dasar"],
    ["hp", "HP maks", mhp(), "+" + GROW.hp.pt + " HP maks"],
    ["mp", "Mana maks", mmp(), "+" + GROW.mp.pt + " Mana maks"],
    ["cr", "Peluang Critical", pc(critC()) + "%", "+" + GROW.cr.pt + "%"],
    ["pe", "Peluang Penetrasi", pc(penC()) + "%", "+" + GROW.pe.pt + "%"],
  ];
  return (
    `<div class="qm" style="margin-bottom:4px">Poin tersisa: <b class="${Pl.sp ? "ok" : ""}">${Pl.sp}</b> · tiap level +${SP_LV} poin. Critical ×${CRIT_X} damage. Penetrasi ×${PEN_X} dan menembus pertahanan musuh. Peluang maksimal 75%.</div>` +
    rows
      .map(
        ([k, n, v, d]) =>
          `<div class="irow"><div><b>${n}: ${v}</b><br><small>Tiap poin ${d} · sudah dialokasikan ${Pl.st[k]}</small></div><button class="b" data-s="${k}" ${Pl.sp ? "" : "disabled"}>+</button></div>`,
      )
      .join("")
  );
}

/* ---------- State ---------- */
let cv = $("#c"),
  ctx = cv.getContext("2d"),
  rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
/* fillRect "menempel" ke grid piksel kanvas: skala 2.667x tidak boleh menimbulkan garis celah antar petak.
   Supaya ringan (ribuan fillRect per frame), matriks transform dilacak sendiri dalam angka JS biasa
   (tanpa getTransform / DOMMatrix) dan tiap fillRect hanya memanggil fillRect asli SATU kali dengan koordinat yang sudah
   dibulatkan ke piksel kanvas. Kanvas kecil (peta mini, pratinjau) tidak punya skala -> langsung jalur asli. */
{
  const P = CanvasRenderingContext2D.prototype,
    _fr = P.fillRect,
    _sv = P.save,
    _rs = P.restore,
    _tr = P.translate,
    _sc = P.scale,
    _ro = P.rotate,
    _st = P.setTransform,
    _rt = P.resetTransform,
    _tf = P.transform,
    M = (c) => c.__m || ((c.__s = []), (c.__m = [1, 0, 0, 1, 0, 0]));
  P.save = function () {
    M(this);
    this.__s.push(this.__m.slice());
    return _sv.call(this);
  };
  P.restore = function () {
    if (this.__s && this.__s.length) this.__m = this.__s.pop();
    return _rs.call(this);
  };
  P.translate = function (x, y) {
    const m = M(this);
    m[4] += m[0] * x + m[2] * y;
    m[5] += m[1] * x + m[3] * y;
    return _tr.call(this, x, y);
  };
  P.scale = function (x, y) {
    const m = M(this);
    m[0] *= x;
    m[1] *= x;
    m[2] *= y;
    m[3] *= y;
    return _sc.call(this, x, y);
  };
  P.rotate = function (r) {
    const m = M(this),
      c = Math.cos(r),
      s = Math.sin(r),
      a = m[0],
      b = m[1],
      cc = m[2],
      d = m[3];
    m[0] = a * c + cc * s;
    m[1] = b * c + d * s;
    m[2] = -a * s + cc * c;
    m[3] = -b * s + d * c;
    return _ro.call(this, r);
  };
  P.transform = function (a, b, c, d, e, f) {
    const m = M(this),
      a0 = m[0],
      b0 = m[1],
      c0 = m[2],
      d0 = m[3];
    m[0] = a0 * a + c0 * b;
    m[1] = b0 * a + d0 * b;
    m[2] = a0 * c + c0 * d;
    m[3] = b0 * c + d0 * d;
    m[4] += a0 * e + c0 * f;
    m[5] += b0 * e + d0 * f;
    return _tf.call(this, a, b, c, d, e, f);
  };
  P.setTransform = function (a, b, c, d, e, f) {
    const m = M(this);
    if (typeof a === "object" && a) {
      m[0] = a.a;
      m[1] = a.b;
      m[2] = a.c;
      m[3] = a.d;
      m[4] = a.e;
      m[5] = a.f;
    } else {
      m[0] = a;
      m[1] = b;
      m[2] = c;
      m[3] = d;
      m[4] = e;
      m[5] = f;
    }
    return _st.apply(this, arguments);
  };
  P.resetTransform = function () {
    this.__m = [1, 0, 0, 1, 0, 0];
    return _rt.call(this);
  };
  P.fillRect = function (x, y, w, h) {
    const m = this.__m;
    if (!m) return _fr.call(this, x, y, w, h);
    const a = m[0],
      d = m[3];
    if (m[1] || m[2] || (a === 1 && d === 1)) return _fr.call(this, x, y, w, h);
    const e = m[4],
      f = m[5];
    let x0 = Math.round(x * a + e),
      x1 = Math.round((x + w) * a + e),
      y0 = Math.round(y * d + f),
      y1 = Math.round((y + h) * d + f);
    if (x1 === x0 && w) x1 = x0 + (a * w < 0 ? -1 : 1); // elemen tipis tetap tampil minimal 1 piksel
    if (y1 === y0 && h) y1 = y0 + (d * h < 0 ? -1 : 1);
    return _fr.call(this, (x0 - e) / a, (y0 - f) / d, (x1 - x0) / a, (y1 - y0) / d);
  };
}
/* pasang ulang skala dasar tiap frame (jaga-jaga bila ada save/restore yang tidak seimbang) */
function fit() {
  ctx.__s = []; // kanvas baru di-resize / frame baru: tumpukan save() kosong
  ctx.setTransform(SC, 0, 0, SC, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
let Pl,
  S,
  ST,
  lvl,
  Hh,
  wrongT,
  mode,
  cur,
  timer,
  left = 0,
  ts = 1,
  an = {
    se: 0,
    sp: 0,
    fl: [],
    pt: [],
    ch: [],
    T: 0,
    wt: 0,
    pa: 0,
    a: null,
    lg: 0,
    fx: 0,
    sf: [],
    eh: null,
    ph: null,
    mx: 0.12, // posisi pemain di arena: 0 = paling belakang, 1 = paling depan
    hs: 0, // hit-stop (frame beku saat serangan mendarat)
    hc: null, // penghitung combo hit ala hack & slash
    pl: "",
  };
const say = (t) => ($("#pi").textContent = t),
  ui = (h) => {
    $("#ui").innerHTML = h;
  };
function nextD(h, c) {
  const l = h.slice(-4);
  if (l.length < 3) return c;
  const r = l.filter(Boolean).length / l.length;
  return r >= 0.85 ? Math.min(5, c + 1) : r <= 0.4 ? Math.max(1, c - 1) : c;
}
function parse(s) {
  s = String(s).trim().replace(",", ".").replace(/\s/g, "");
  if (/^-?\d+\/\d+$/.test(s)) {
    const [a, b] = s.split("/").map(Number);
    return b ? a / b : NaN;
  }
  return /^-?\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}
function newGame() {
  Pl = {
    hp: 100,
    fp: 60,
    sp: 0,
    st: { pw: 0, cr: 0, pe: 0, hp: 0, mp: 0 },
    cd: {},
    ult: 0,
    combo: 0,
    max: 0,
    hints: 2,
    lv: 1,
    xp: 0,
    coin: 0,
    pot: 1,
    fpot: 0,
    hb: 0,
    atk: 0,
    pn: 0,
    gl: 0,
    eq: {},
    own: {},
    job: "sword",
  };
  applyJob();
  ST = {};
  lvl = {};
  Hh = {};
  wrongT = [];
  W.init();
}
function start(i) {
  const e = E[i];
  S = { i, e, ehp: e.hp, dead: 0, et: 150, pt: 160, tel: 0, eb: false, pvol: false, pend: false, eo: 0, ph: 0, shots: 0, vh: false };
  MIRX = false; // arena mulai tanpa cermin
  Pl.dg = 0;
  Pl.dgc = 0;
  an.jy = an.jv = an.jn = 0; // lompat
  an.lt = 0;
  an.a = null;
  an.wt = 0;
  an.pa = 0;
  an.ch = [];
  an.np = [];
  an.ep = [];
  an.rc = 0;
  an.lg = 0;
  an.sf = [];
  an.eh = null;
  an.ph = null;
  an.mx = 0.12;
  an.hs = 0;
  an.hc = null;
  qd = null;
  qc = 0;
  ts = 1;
  Pl.hints = 2 + Pl.hb;
  Pl.combo = 0;
  Pl.cd = {};
  bars();
  SND.music(i === 3 ? "boss" : "battle");
  SND.sfx("start");
  SND.mon(e.sp, "appear");
  say(`${e.intro} ${enemyAtk(e).t === "ranged" ? "[Penyerang jarak jauh: hindari tembakannya!]" : "[Penyerang jarak dekat]"}`);
  ui(
    `<div class="row" style="margin-top:8px"><button class="b" id="go">Mulai battle</button>${i < 3 ? '<button class="b g" id="fl">Kabur</button>' : ""}</div>`,
  );
  $("#go").onclick = menu;
  $("#go").focus();
  if ($("#fl")) $("#fl").onclick = () => W.back(null);
  mode = "i";
  renderPad();
  lockPad(true);
}
function bars() {
  const e = S.e;
  $("#php").style.width = (Pl.hp / mhp()) * 100 + "%";
  $("#pfp").style.width = (Pl.fp / mmp()) * 100 + "%";
  $("#pn").textContent =
    `${JOB().n} Lv${Pl.lv} — HP ${Pl.hp}/${mhp()}, Mana ${Pl.fp}/${mmp()}`;
  $("#cb").textContent = Pl.combo > 1 ? `Combo ×${Pl.combo}` : "";
  $("#ehp").style.width = (S.ehp / e.hp) * 100 + "%";
  $("#en").textContent = `${e.n} — HP ${Math.max(0, S.ehp)}`;
  $("#ch").textContent = "";
  // elemen opsional: jangan sampai start() crash bila tidak ada di index.html
  const pu = $("#pult");
  if (pu) pu.style.width = clamp(Pl.ult || 0, 0, ULT_MAX) + "%";
  const avl = $("#avl"),
    trkf = $("#trkf");
  if (avl) avl.textContent = Pl.lv;
  if (trkf) trkf.style.width = clamp((1 - S.ehp / e.hp) * 100, 0, 100) + "%";
}
/* ===== Sistem battle: serangan dasar + skill, peluang Critical & Penetrasi acak =====
   Alur: pilih aksi -> undi Critical/Penetrasi -> bila muncul, soal matematika tampil.
   Jawaban BENAR = bonus aktif. SALAH/waktu habis = serangan tetap mendarat, tapi sebagai serangan biasa. */
const CRIT_X = 2, // pengali damage saat Critical berhasil
  PEN_X = 1.25, // pengali damage saat Penetrasi berhasil (selain mengabaikan pertahanan musuh)
  DEF_K = 0.4; // pertahanan musuh = atk musuh x DEF_K (diabaikan oleh Penetrasi)
/* ikon vektor untuk pad aksi (warna mengikuti currentColor) */
const ICO = {
  atk: '<svg viewBox="0 0 24 24" fill="currentColor"><g transform="rotate(45 12 12)"><polygon points="12,0 14,3 14,15 10,15 10,3"/><rect x="6" y="15" width="12" height="2.4"/><rect x="11" y="17.4" width="2" height="5"/></g></svg>',
  pow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M4 3l16 18M10 2l12 14M1 9l12 13"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="23,1 23,12 19,8 4,22 2,20 16,5 12,1"/></svg>',
  crt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 0v6M12 18v6M0 12h6M18 12h6"/></svg>',
  heal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z"/></svg>',
  pot: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2h6v2h-1v5l5 9a2.4 2.4 0 0 1-2.1 3.5H7.1A2.4 2.4 0 0 1 5 18l5-9V4H9z"/></svg>',
};
Object.assign(ICO, {
  pen: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 5l9 7-9 7zM10 5l9 7-9 7z"/><rect x="20.4" y="4" width="2.6" height="16"/></svg>',
  crt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l7 9h-4.5v6h-5v-6H5z"/><rect x="3" y="19" width="18" height="3"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1c1 4.5 6.5 6.5 6.5 12.5a6.5 6.5 0 0 1-13 0c0-3 1.8-4.6 3-6.8.6 2 1.6 3 2.6 3C10.8 7.2 10 4 12 1z"/></svg>',
  ice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M12 1v22M2.5 6.5l19 11M2.5 17.5l19-11M8.5 3l3.5 3 3.5-3M8.5 21l3.5-3 3.5 3"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="14,0 3,14 10,14 8,24 21,8 13.5,8"/></svg>',
  ult: '<svg viewBox="0 0 24 24"><defs><linearGradient id="rbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff4d6d"/><stop offset=".25" stop-color="#ffd166"/><stop offset=".5" stop-color="#5fe08a"/><stop offset=".75" stop-color="#4db8ff"/><stop offset="1" stop-color="#c06bff"/></linearGradient></defs><g transform="rotate(45 12 12)" fill="url(#rbg)"><polygon points="12,0 14.5,3 14.5,15 9.5,15 9.5,3"/><rect x="5.5" y="15" width="13" height="2.6"/><rect x="10.8" y="17.6" width="2.4" height="5"/></g></svg>',
});
ICO.fpot = ICO.pot;
let qc = 0; // jumlah antrean Serang Biasa (spam klik, maks 4)
let qd = null; // aksi yang diantre saat animasi berjalan (dijalankan otomatis di giliran berikutnya)
function hideSk() {
  qd = null;
  qc = 0;
  const k = $("#sk");
  if (!k || k.hidden) return;
  k.hidden = true;
  k.innerHTML = "";
  k.classList.remove("busy");
  document.body.classList.remove("sk-on");
}
function lockPad(v) {
  const k = $("#sk");
  if (k) k.classList.toggle("busy", v);
}
function padInfo(id) {
  if (id === "pot") return `<b>Ramuan HP</b> · pulihkan 40 HP · ×${Pl.pot}`;
  if (id === "fpot") return `<b>Ramuan Mana</b> · +40 Mana, tanpa memakai giliran · ×${Pl.fpot}`;
  const k = skill(id),
    c = chanceOf(id),
    cd = Pl.cd[id] || 0;
  if (id === "atk")
    return `<b>${k.n}</b> · ${HITS.atk} ${JOB().unit} · posisi ${posName()}<br>Damage kamu ×${pc(posAtk())} · diterima ×${pc(posDef())} · Critical ${pc(c.c)}% · Penetrasi ${pc(c.p)}% · ${document.body.dataset.ctl === "touch" ? "◀ ▶" : "A/D"}: maju/mundur`;
  if (id === "ult") {
    const u = Math.floor(Pl.ult);
    return u >= ULT_MAX
      ? `<b>${k.n}</b> · SIAP!<br>${JOB().ultInfo}, damage total ×${k.mult}, menembus pertahanan`
      : `<b>${k.n}</b> · energi ${u}%<br>Isi dengan menyerang & terkena serangan. Energi tersimpan antar pertempuran.`;
  }
  if (Pl.lv < k.lv) return `<b>${k.n}</b> · terbuka di Lv${k.lv}`;
  const meta = [k.mp ? k.mp + " MP" : "", k.mult > 1 ? "×" + k.mult : "", k.cd ? "CD " + k.cd : ""].filter(Boolean).join(" · ");
  return id === "heal"
    ? `<b>${k.n}</b> · ${meta}<br>Pulihkan 30% HP maks${cd > 0 ? ` · siap ${Math.ceil(cd * 2.5)} detik lagi` : ""}`
    : `<b>${k.n}</b>${meta ? " · " + meta : ""}<br>${k.fx ? k.fx + " · " : ""}Critical ${pc(c.c)}% · Penetrasi ${pc(c.p)}%${cd > 0 ? ` · siap ${Math.ceil(cd * 2.5)} detik lagi` : ""}`;
}
/* menggambar ulang pad (selalu tampil selama battle). used = tombol yang baru ditekan (efek denyut) */
function renderPad(used) {
  const sk = $("#sk");
  if (!sk || !S) return;
  const CX = 16.4, // pusat tombol Serang Biasa (em dari kiri / bawah pad)
    CY = 3.8,
    pos = (r, deg, sz) => {
      const a = (deg * Math.PI) / 180;
      return `left:${(CX + r * Math.cos(a) - sz / 2).toFixed(2)}em;bottom:${(CY + r * Math.sin(a) - sz / 2).toFixed(2)}em;width:${sz}em;height:${sz}em`;
    },
    cls = (id, x = "") => `sb${x}${id === used ? " fire" : ""}${id === qd ? " qd" : ""}`;
  let h = `<div class="ski" id="ski">${padInfo("atk")}</div>`;
  h += `<button type="button" class="${cls("atk", " big")}" data-a="atk" data-k="1" aria-label="Serang Biasa" style="left:${CX - 3.2}em;bottom:${CY - 3.2}em;width:6.4em;height:6.4em">${ICO.atk}<i class="kk">1</i>${qd === "atk" && qc > 1 ? `<i class="qn">×${qc}</i>` : ""}</button>`;
  SKILLS.forEach((k) => {
    const u = k.id === "ult",
      cd = Pl.cd[k.id] || 0,
      lock = Pl.lv < k.lv,
      nomp = Pl.fp < k.mp,
      rdy = u && Pl.ult >= ULT_MAX,
      off = lock || cd > 0 || nomp || (u && !rdy),
      ring = u ? 1 - Math.min(ULT_MAX, Pl.ult) / ULT_MAX : cd ? Math.min(1, cd / k.cd) : 0,
      badge = lock ? `<span class="lk">Lv${k.lv}</span>` : u ? `<span class="mc">${Math.floor(Pl.ult)}%</span>` : `<span class="mc">${k.mp}</span>`;
    h += `<button type="button" class="${cls(k.id, (off ? " off" : "") + (rdy ? " rdy" : ""))}" data-a="${k.id}" data-k="${k.key}" aria-label="${k.n}" ${off ? 'aria-disabled="true"' : ""} style="${pos(...k.pos)};--cd:${ring};--ic:${k.col}">${ICO[k.id]}<i class="kk">${k.key}</i>${badge}${cd > 0 && !lock ? `<span class="cdn">${Math.ceil(cd)}</span>` : ""}</button>`;
  });
  h += `<button type="button" class="${cls("dodge", " pot")}" data-a="dodge" data-k="s" aria-label="Menghindar" style="${pos(15.2, 116, 2.7)}">${ICO.dodge}<i class="kk">S</i></button>`;
  if (Pl.pot)
    h += `<button type="button" class="${cls("pot", " pot")}" data-a="pot" data-k="q" aria-label="Ramuan HP" style="${pos(15.2, 168, 2.7)}">${ICO.pot}<i class="kk">Q</i><span class="mc">${Pl.pot}</span></button>`;
  if (Pl.fpot)
    h += `<button type="button" class="${cls("fpot", " pot")}" data-a="fpot" data-k="w" aria-label="Ramuan Mana" style="${pos(15.2, 142, 2.7)}">${ICO.fpot}<i class="kk">W</i><span class="mc" style="background:var(--mana)">${Pl.fpot}</span></button>`;
  sk.innerHTML = h;
  sk.hidden = false;
  document.body.classList.add("sk-on");
  const strip = $("#ski");
  sk.querySelectorAll(".sb").forEach((b) => {
    const id = b.dataset.a,
      show = () => (strip.innerHTML = padInfo(id)),
      reset = () => (strip.innerHTML = padInfo("atk"));
    b.addEventListener("mouseenter", show);
    b.addEventListener("focus", show);
    b.addEventListener("pointerdown", show);
    b.addEventListener("mouseleave", reset);
    b.addEventListener("blur", reset);
    b.onclick = () => padAct(id);
  });
}
/* satu pintu untuk semua tombol pad: langsung jalan saat giliran pemain,
   diantre saat animasi/giliran musuh (gaya hack & slash), diabaikan saat soal tampil */
function padAct(id) {
  if (!S || W.on) return;
  if (id === "dodge") return doDodge();
  if (mode === "i") menu();
  const b = $(`#sk [data-a="${id}"]`);
  if (!b) return;
  if (mode === "r") {
    if (Pl.lv < skill(id).lv || (id === "ult" && Pl.ult < ULT_MAX)) return SND.sfx("wrong");
    if (id === "atk") {
      qc = Math.min(4, (qd === "atk" ? qc : 0) + 1); // spam klik menumpuk
      qd = "atk";
    } else {
      qd = qd === id ? null : id;
      qc = 0;
    }
    SND.sfx("tick");
    return renderPad();
  }
  if (mode !== "m" || b.classList.contains("off")) return SND.sfx("wrong");
  b.blur();
  qd = null;
  qc = 0;
  lockPad(true);
  if (id === "pot") usePot();
  else if (id === "fpot") useF();
  else if (id === "heal") doHeal();
  else if (id === "ult") doUlt();
  else attack(id);
  renderPad(id);
}
function menu() {
  /* aksi real-time: menu() juga dipanggil di tengah pertarungan (mis. setelah musuh menyerang).
     Saat sudah "live" (mode m/r) jangan reset mode atau bangun ulang pad. */
  const live = mode === "m" || mode === "r";
  if (mode !== "r") mode = "m";
  bars();
  if (!live) {
    say(`Action combat! Tombol 1–9 menyerang, ${document.body.dataset.ctl === "touch" ? "◀ ▶" : "A/D"} maju/mundur, ${document.body.dataset.ctl === "touch" ? "tombol ⏪" : "S / Shift"} menghindar saat musuh berkedip. Lompat (bisa 2×): ${document.body.dataset.ctl === "touch" ? "tombol ▲" : "Spasi / ↑"}.`);
    ui("");
    renderPad();
    lockPad(false);
  } else if (mode === "m") lockPad(false);
  if (qd && mode === "m") {
    const id = qd,
      n = qc;
    qd = null;
    qc = 0;
    setTimeout(() => {
      if (mode !== "m") return;
      padAct(id);
      if (id === "atk" && n > 1 && mode === "r") {
        qd = "atk"; // sisa antrean lanjut
        qc = n - 1;
        renderPad();
      }
    }, 60);
  }
}
/* skill penyembuh: langsung berhasil, tanpa soal */
function doHeal() {
  mode = "r";
  lockPad(true);
  const k = skill("heal"),
    amt = Math.round(mhp() * 0.3);
  Pl.fp = Math.max(0, Pl.fp - k.mp);
  Pl.cd.heal = k.cd;
  Pl.hp = Math.min(mhp(), Pl.hp + amt);
  SND.sfx("heal");
  flo(`+${amt} HP`, "h", "#7ef0c8");
  burst(PCX, 165, "#7ef0c8");
  say(`Penyembuh! Kamu pulih ${amt} HP.`);
  bars();
  ui("");
  setTimeout(actDone, 450);
}
/* energi ulti: terkumpul dari menyerang, terkena serangan, dan menang; TIDAK direset antar pertempuran */
function gainUlt(n) {
  const b = Pl.ult || 0;
  Pl.ult = Math.min(ULT_MAX, b + n);
  if (b < ULT_MAX && Pl.ult >= ULT_MAX) {
    SND.sfx("quest");
    flo("ULTI SIAP!", "h", "#ff7ad9");
  }
}
/* ulti: Pedang Pelangi, 7 tebasan berwarna pelangi, tanpa soal */
function doUlt() {
  if (Pl.job !== "sword") return jobUlt();
  mode = "r";
  lockPad(true);
  const total = Math.max(7, Math.round(pwr() * ULT_X * (1 + Math.min(0.5, 0.1 * Math.max(0, Pl.combo - 1))))),
    part = (i) => Math.round(total * (i === 6 ? 0.4 : 0.1));
  Pl.ult = 0;
  bars();
  say("PEDANG PELANGI!");
  an.a = {
    t: 0,
    w: 0,
    k: "ult",
    hi: 0,
    cb: (i) => {
      const e = S.e,
        d = part(i),
        hue = [0, 30, 55, 125, 200, 250, 300][i],
        col = `hsl(${hue},100%,62%)`,
        X = ecx(),
        Y = 150;
      S.ehp -= d;
      SND.sfx("hit");
      SND.mon(e.sp, "hurt");
      an.se = i === 6 ? 24 : 10;
      an.fx = i === 6 ? 6 : 3;
      burst(X, Y + 15, col);
      burst(X, Y, "#fff");
      slashFx(col, "c", X, Y + (i % 2 ? -12 : 10), 1.1 + i * 0.05, i % 2, (i - 3) * 0.5, 0);
      slashFx("#ffffff", "p", X, Y, 1 + i * 0.08, 0, (i - 3) * 0.28, -2);
      if (i === 6) {
        for (let j = 0; j < 7; j++) slashFx(`hsl(${j * 51},100%,60%)`, "r", X, Y, 0.5 + j * 0.18, 0, 0, -j * 2);
        slashFx("#ffffff", "c", X, Y, 1.7, 0, -0.8);
        slashFx("#ffffff", "c", X, Y, 1.7, 1, 0.8, -2);
      }
      hitNum(d, col, { crit: i === 6, last: i === 6 });
      an.hs = i === 6 ? 8 : 2;
      bars();
      if (i === 6) {
        say(`Pedang Pelangi! Total ${total} damage.`);
        if (S.ehp <= 0) setTimeout(win, 1000);
        else actDone();
      }
    },
  };
}
/* efek status elemen setelah tebasan elemen mendarat; mengembalikan teks tambahan untuk pesan */
function applyEl(el, tot) {
  if (el === "water") {
    S.wet = 2;
    return " · musuh basah (serangannya melemah, rentan petir)!";
  }
  if (el === "dark") {
    const h = Math.max(1, Math.round((tot || 0) * 0.25));
    Pl.hp = Math.min(mhp(), Pl.hp + h);
    flo("+" + h + " HP", "h", "#c99aff");
    burst(PCX, 165, "#a24dff");
    bars();
    return ` · menyerap ${h} HP`;
  }
  if (el === "holy") return " · cahaya menembus pertahanan!";
  if (el === "fire") {
    S.burn = { n: 2, d: Math.max(2, Math.round(pwr() * 0.35)) };
    return " · musuh terbakar!";
  }
  if (el === "ice") {
    S.freeze = 2;
    return " · musuh membeku, serangannya melemah!";
  }
  if (el === "bolt" && Math.random() < 0.4) {
    S.stun = 1;
    return " · musuh tersengat, tak bisa bergerak!";
  }
  return "";
}
/* undi Critical & Penetrasi (masing-masing acak), lalu soal bila ada yang muncul */
function attack(act) {
  mode = "r";
  lockPad(true);
  const k = skill(act),
    c = chanceOf(act);
  Pl.fp = Math.max(0, Pl.fp - k.mp);
  if (k.cd) Pl.cd[act] = k.cd; // 1 satuan = 2,5 detik (berjalan real-time)
  const r = { crit: Math.random() * 100 < c.c, pen: Math.random() * 100 < c.p };
  bars();
  if (!r.crit && !r.pen) return strike(act, r, null);
  // tanpa soal: Critical/Penetrasi langsung aktif, dan menambah combo
  SND.sfx("correct");
  Pl.combo++;
  Pl.max = Math.max(Pl.max, Pl.combo);
  strike(act, r, null);
}
/* sekali per ronde (dipanggil di enemyTurn): cooldown turun, Mana pulih sedikit */
function tickRound() {
  Object.keys(Pl.cd).forEach((k) => {
    if (Pl.cd[k] > 0) Pl.cd[k]--;
  });
  Pl.fp = Math.min(mmp(), Pl.fp + 3);
}
function mkQ(act, r) {
  const e = S.e;
  const tp =
    wrongT.length && Math.random() < 0.25 ? wrongT.shift() : P(e.topics);
  const base = clamp(lvl[tp] ?? e.d[0], e.d[0], e.d[1]),
    d = Math.min(
      5,
      base + (act !== "atk" ? 1 : 0) + (r && r.crit && r.pen ? 1 : 0),
    ),
    q = G[tp](d);
  q.tp = tp;
  q.d = d;
  if (d <= 2 && !q.show.includes("/")) {
    const v = q.val,
      s = new Set([v]);
    while (s.size < 4) {
      const o = v + P([-10, -2, -1, 1, 2, 10, R(3, 9), -R(3, 9)]);
      if (o >= 0 && o !== v) s.add(o);
    }
    q.opts = [...s].sort(() => Math.random() - 0.5);
  }
  return q;
}
const rollName = (r) =>
  r.crit && r.pen
    ? "CRITICAL + PENETRASI"
    : r.crit
      ? "CRITICAL"
      : "PENETRASI";
function ask(act, r) {
  mode = "q";
  const q = mkQ(act, r);
  cur = { q, act, r, used: 0 };
  say(`${rollName(r)}! Jawab dengan benar agar serangan istimewa ini kena.`);
  const body = q.opts
    ? `<div class="opts">${q.opts.map((o, i) => `<button class="b" data-o="${o}">${i + 1}. ${o}</button>`).join("")}</div>`
    : `<div class="ar"><input class="in" id="ans" inputmode="${q.show.includes("/") ? "text" : "decimal"}" autocomplete="off" placeholder="${q.show.includes("/") ? "Jawaban, mis. 3/4" : "Jawaban"}"><button class="b g" id="kb" type="button" aria-label="Ganti jenis keyboard">⌨</button><button class="b" id="sub">Jawab</button></div>`;
  ui(
    `<div class="card"><div class="qm"><b class="ok">⚡ ${rollName(r)}!</b> · ${TN[q.tp]} · Level ${q.d}${act !== "atk" ? " · " + skill(act).n : ""}</div><div class="qt">${q.t}</div>${body}<div class="tm" id="tw"><i id="tb"></i></div><div class="row hr"><button class="b g" id="hint" ${Pl.hints ? "" : "disabled"}>Petunjuk (${Pl.hints})</button><div id="hh" class="qm"></div></div></div>`,
  );
  document
    .querySelectorAll("[data-o]")
    .forEach((b) => (b.onclick = () => answer(b.dataset.o)));
  const inp = $("#ans");
  if (inp) {
    inp.focus();
    inp.onkeydown = (e) => {
      if (e.key === "Enter") answer(inp.value);
    };
    $("#sub").onclick = () => answer(inp.value);
    // tombol ⌨: ganti keyboard angka <-> keyboard huruf (untuk mengetik pecahan seperti 3/4 di Android)
    $("#kb").onclick = () => {
      inp.inputMode = inp.inputMode === "text" ? "decimal" : "text";
      inp.blur(); // lepas mana lalu mana lagi agar Android memuat ulang keyboard
      inp.focus();
    };
  }
  $("#hint").onclick = hint;
  startTimer(15 + 5 * q.d);
}
function hint() {
  if (mode !== "q" || !Pl.hints) return;
  Pl.hints--;
  SND.sfx("hint");
  cur.used++;
  $("#hh").textContent = "Petunjuk: " + cur.q.hint;
  $("#hint").textContent = `Petunjuk (${Pl.hints})`;
  if (!Pl.hints) $("#hint").disabled = true;
  if (cur.q.opts) {
    const w = [...document.querySelectorAll("[data-o]")].filter(
      (b) => +b.dataset.o !== cur.q.val && !b.disabled,
    );
    if (w.length > 1) {
      const b = P(w);
      b.disabled = true;
    }
  }
}
let tk = 0;
function startTimer(sec) {
  clearInterval(timer);
  left = 0;
  if (!$("#tmr").checked) {
    $("#tw").style.display = "none";
    return;
  }
  let t0 = Date.now(),
    last = t0;
  left = 1;
  timer = setInterval(() => {
    const now = Date.now();
    if (UIX.open) {
      t0 += now - last; // timer berhenti selama Pengaturan/Misi terbuka
      last = now;
      return;
    }
    last = now;
    left = 1 - (now - t0) / (sec * 1000);
    if (left < 0.3 && left > 0 && ++tk % 6 === 0) SND.sfx("tick");
    const b = $("#tb");
    if (b) b.style.width = Math.max(0, left * 100) + "%";
    if (left <= 0) {
      clearInterval(timer);
      answer(null, true);
    }
  }, 100);
}
function record(tp, ok) {
  ST[tp] = ST[tp] || { ok: 0, n: 0 };
  ST[tp].n++;
  if (ok) ST[tp].ok++;
  Hh[tp] = (Hh[tp] || []).concat(ok);
  const c = lvl[tp] ?? S.e.d[0],
    n = nextD(Hh[tp], c);
  if (n !== c) Hh[tp] = [];
  lvl[tp] = n;
  if (!ok && !wrongT.includes(tp) && wrongT.length < 3) wrongT.push(tp);
}
function answer(u, to) {
  if (mode !== "q") return;
  mode = "r";
  clearInterval(timer);
  const { q, act, r } = cur;
  const ok = !to && Math.abs(parse(u) - q.val) < 1e-6;
  record(q.tp, ok);
  ts = 1;
  if (ok) {
    SND.sfx("correct");
    Pl.combo++;
    Pl.max = Math.max(Pl.max, Pl.combo);
    ui("");
    strike(act, r, q);
  } else {
    an.wt = 0;
    SND.sfx("wrong");
    burst(90, 170, "#8a88a8");
    Pl.combo = 0;
    Pl.fp = Math.max(0, Pl.fp - 5);
    bars();
    say(
      `${to ? "Waktu habis!" : "Belum tepat."} ${rollName(r)} gagal, serangan jadi biasa.`,
    );
    ui(
      `<div class="card"><b class="no">${to ? "Waktu habis." : "Belum tepat."}</b> Jawaban: <b>${q.show}</b><br>${q.expl}<br><span class="no">${rollName(r)} gagal.</span> Seranganmu tetap mendarat sebagai serangan biasa.<div class="row" style="margin-top:8px"><button class="b" id="nx">Lanjut</button></div></div>`,
    );
    $("#nx").onclick = () => {
      ui("");
      strike(act, { crit: false, pen: false }, null);
    };
    $("#nx").focus();
  }
}
/* eksekusi serangan. r = {crit, pen} yang SUDAH lolos soal (atau false semua). q = soal bila ada */
function strike(act, r, q) {
  mode = "r";
  const e = S.e,
    special = r.crit || r.pen,
    wk = q && q.tp === e.weak ? 1.3 : 1,
    wb = skill(act).el === "bolt" && S.wet > 0 ? 1.4 : 1, // petir ×1,4 pada musuh yang basah
    cb = 1 + Math.min(0.5, 0.1 * Math.max(0, Pl.combo - 1)),
    def = Math.round(e.atk * DEF_K),
    raw =
      pwr() *
      (skill(act).mult || 1) *
      cb *
      wk *
      wb *
      (r.crit ? CRIT_X : 1) *
      (r.pen ? PEN_X : 1) *
      posAtk(),
    dmg = Math.max(1, Math.round(raw) - (r.pen ? 0 : def));
  if (swordBasic(act) && eGap() > SWORD_REACH) {
    // musuh di luar jangkauan: hero hanya mengayun, tanpa damage
    Pl.combo = 0;
    an.hc = null;
    say("Serangan meleset — musuh di luar jangkauan! Dekati dulu musuhnya.");
    an.a = {
      t: 0,
      w: -Math.min(1, an.wt / 30),
      k: "slash",
      sk: skill(act),
      n: 1,
      sw: 1,
      cb: () => {
        SND.sfx("whoosh");
        flo("TERLALU JAUH", "h", "#ffd166");
        actDone();
      },
    };
    return;
  }
  // MP: serangan biasa mengisi mana, jawaban benar memberi bonus
  Pl.fp = Math.min(mmp(), Pl.fp + (act === "atk" ? 10 : 0) + (special ? 5 : 0));
  gainUlt((act === "atk" ? 6 : 9) + (special ? 4 : 0));
  bars();
  const sk = skill(act),
    col = sk.el ? sk.col : r.crit ? "#ff9a3d" : r.pen ? "#7cf0ff" : sk.col || "#ffd166",
    tag = special ? rollName(r) + "! " : "";
  say(act === "atk" ? "Serangan!" : skill(act).n + "!");
  const parts = splitDmg(dmg, HITS[act] || 1),
    tot = parts.reduce((x, y) => x + y, 0);
  an.a = {
    t: 0,
    w: -Math.min(1, an.wt / 30),
    k: sk.k || "slash",
    el: sk.el,
    sk,
    n: parts.length,
    cb: (i) => {
      const d = parts[i],
        last = i === parts.length - 1;
      S.ehp -= d;
      SND.sfx("hit");
      SND.mon(e.sp, "hurt");
      an.se = special || last ? 20 : 12;
      an.fx = last ? (special ? 5 : 2) : 0;
      an.hs = (last ? 5 : 2) + (special && last ? 2 : 0); // hit-stop
      burst(ecx(), 165, col);
      burst(ecx(), 165, "#fff");
      if (special && last) burst(ecx(), 150, col);
      hitNum(d, last ? col : "#ffffff", { crit: last && r.crit, last });
      if (!last) {
        if (sk.V) jobMini(sk, col, i);
        else slashFx(i % 2 ? "#ffffff" : col, "c", ecx(), 150 + R(-14, 14), 0.8, i % 2, i % 2 ? 0.55 : -0.55, 0);
      } else {
        hitFx(act, r, col);
        const efx = sk.el ? applyEl(sk.el, tot) : "";
        say(
          `${tag}${tot} damage${parts.length > 1 ? ` (${parts.length} ${JOB().unit})` : ""}${wk > 1 ? " (kena kelemahan!)" : ""}${wb > 1 ? " (tersambar saat basah!)" : ""}${r.pen ? ` · pertahanan ${def} ditembus` : ""}${Pl.combo > 1 ? ` · combo ×${Pl.combo}` : ""}${efx}`,
        );
      }
      bars();
      if (last) {
        if (S.ehp <= 0) setTimeout(win, 900);
        else actDone();
      }
    },
  };
}
/* anggota party beraksi setelah serangan pemain: petarung menyerang, penyembuh memulihkan tim
   (logika & animasi ada di party.js: fmAttack) */
function partyAttack(done) {
  if (!F.party) return done();
  fmAttack(done);
}
/* ===== ARENA LEBAR · GERAK MUSUH · LOMPAT =====
   - Arena battle 640x360 (dunia tetap 480x270): lebih banyak ruang untuk bergerak dan melompat.
   - Musuh JARAK DEKAT berjalan mendekati pemain dulu, baru menebas. Musuh JARAK JAUH mendekat sampai jarak tembak
     (e.rng, bawaan 250 px; 320 px untuk api) lalu menembakkan proyektil yang benar-benar melaju ke arah pemain.
   - Pemain bisa LOMPAT (maks. 2x di udara). Pemain yang cukup tinggi (JUMP.clr) tidak terkena tebasan / proyektil.
   - Bisa diatur per monster lewat data: e.spd (kecepatan jalan, px/frame) dan e.rng (jarak tembak, px). */
let PCX = 102; // titik kaki pemain (diperbarui tiap frame di draw)
/* CERMIN ARENA: semua kode battle (hero, skill, efek, proyektil, musuh) ditulis dengan anggapan musuh ada di KANAN pemain.
   Bila musuh ada di kiri pemain (pemain lari melewati musuh), arena digambar dalam ruang "kanonik" yang dicerminkan
   (x kanonik = VW - x asli) lalu seluruh gambar dibalik horizontal di draw(). Hasilnya hero, skill, efek, dan musuh
   otomatis menghadap ke kiri. MIRX = mode cermin aktif. PMr = tengah badan pemain pada koordinat ASLI (dipakai AI musuh). */
let MIRX = false,
  PMr = 136;
const PMID = () => PCX + 34, // tengah badan pemain
  EHX = () => VW - 132, // pusat musuh di posisi awal (kanvas 480 -> 348, arena 640 -> 508)
  ecx = () => (MIRX ? VW : 0) + (MIRX ? -1 : 1) * (EHX() - ((S && S.eo) || 0)), // pusat musuh saat ini, koordinat kanonik (S.eo = jarak yang sudah ditempuh ke kiri)
  eGap = () => Math.abs(ecx() - PMID()) - 16 * S.e.s, // jarak tepi musuh ke tengah badan pemain (selalu positif, pemain di kiri maupun kanan musuh)
  MELEE = { stop: 46, hit: 96 }, // musuh berhenti di jarak 46; tebasan masih kena sampai jarak 96
  JUMP = { g: 0.62, v1: 8.2, v2: 7.4, clr: 26 }; // gravitasi, kecepatan lompatan ke-1 & ke-2, tinggi minimal untuk lolos
/* JANGKAUAN SERANG BIASA (khusus Pendekar Pedang): jarak dari tengah badan hero ke tepi musuh (px).
   Serang Biasa hanya memberi damage bila musuh ada di dalam jangkauan saat tombol ditekan; di luar itu hero hanya mengayun (meleset).
   Ubah SWORD_REACH untuk memperlebar / mempersempit. Lingkaran tipis di tanah menunjukkan jangkauannya. */
const SWORD_REACH = 190,
  swordBasic = (act) => act === "atk" && (Pl.job || "sword") === "sword";
const MIRHYS = 14; // musuh harus melewati pemain sejauh ini (px) sebelum arena berbalik
function mirFlip(on) {
  MIRX = on;
  // partikel & angka yang masih hidup ikut dicerminkan agar tetap di tempat semula di layar
  const fx = (o) => o && typeof o.x === "number" && (o.x = VW - o.x);
  (an.pt || []).forEach((p) => (fx(p), (p.vx = -(p.vx || 0))));
  (an.fl || []).forEach((p) => (fx(p), (p.vx = -(p.vx || 0))));
  (an.ch || []).forEach(fx);
  (an.sf || []).forEach((f) => (fx(f), (f.flip = f.flip ? 0 : 1)));
}
/* dipanggil di draw() setelah latar digambar: putuskan arah hadap, lalu balik kanvas bila musuh di kiri pemain */
function mirBegin(sc) {
  const locked = an.a || (an.ep && an.ep.length) || S.ph === 2 || S.ph === 3 || S.shots > 0 || an.lg > 0 || an.rc > 0 || mode === "q";
  if (!locked) {
    const dx = EHX() - ((S && S.eo) || 0) - (jobBaseXr(sc) + 40), // + = musuh di kanan pemain
      want = dx < -MIRHYS ? true : dx > MIRHYS ? false : MIRX;
    if (want !== MIRX) mirFlip(want);
  }
  if (MIRX) {
    ctx.translate(VW, 0);
    ctx.scale(-1, 1);
  }
}
{
  // teks tidak boleh ikut terbalik: balikkan lagi di titiknya sendiri bila matriks sedang dicerminkan
  const P = CanvasRenderingContext2D.prototype;
  ["fillText", "strokeText"].forEach((n) => {
    const o = P[n];
    P[n] = function (t, x, y, mw) {
      const m = this.__m;
      if (!m || m[0] >= 0) return o.call(this, t, x, y, mw);
      this.save();
      this.translate(x, y);
      this.scale(-1, 1);
      try {
        o.call(this, t, 0, 0, mw);
      } finally {
        this.restore();
      }
    };
  });
}
function doJump() {
  if (!S || W.on || UIX.open || (mode !== "m" && mode !== "r")) return;
  if ((an.jn || 0) >= 2) return;
  an.jv = an.jn ? JUMP.v2 : JUMP.v1;
  an.jn = (an.jn || 0) + 1;
  SND.sfx("whoosh");
  if (!rm)
    for (let i = 0; i < 8; i++)
      an.pt.push({ x: PCX + 34 + R(-14, 14), y: GY - 4 - (an.jy || 0), vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 1.2, l: 18, c: an.jn === 2 ? "#7cf0ff" : "#ffe9b0" });
}
function jumpTick(k) {
  if (!(an.jy > 0 || an.jv > 0)) {
    an.jy = 0;
    an.jv = 0;
    return;
  }
  an.jv -= JUMP.g * k;
  an.jy += an.jv * k;
  if (an.jy <= 0) {
    an.jy = 0;
    an.jv = 0;
    an.jn = 0;
  }
}
/* fase musuh (S.ph): 0 menunggu · 1 berjalan mendekat · 2 aba-aba "!" · 3 menyerang · 4 mundur ke posisi awal */
function enemyStep(dt) {
  const e = S.e,
    T = enemyAtk(e),
    rg = T.t === "ranged",
    v = (e.spd || (rg ? 2.2 : 3)) * (S.freeze > 0 ? 0.5 : 1) * dt,
    goal = rg ? e.rng || (T.shot === "fire" ? 320 : 250) : MELEE.stop;
  S.eo = S.eo || 0;
  if (S.ph === 0) {
    S.et -= dt;
    if (S.et <= 0) {
      S.ph = 1;
      S.eb = true;
    }
  } else if (S.ph === 1) {
    const gap = eGap();
    if (gap > goal) S.eo += Math.min(v, gap - goal);
    else {
      S.ph = 2;
      S.tel = AC.telegraph;
      SND.sfx("tick");
    }
  } else if (S.ph === 2) {
    if (!rg && eGap() > goal) S.eo += Math.min(v * 0.5, eGap() - goal); // jarak dekat tetap melangkah pelan saat aba-aba
    S.tel -= dt;
    if (S.tel <= 0) {
      S.tel = 0;
      S.ph = 3;
      enemyTurn();
    }
  } else if (S.ph === 4) {
    S.eo = Math.max(0, S.eo - v * 1.2);
    if (S.eo <= 0) {
      S.ph = 0;
      S.et = R(40, 90); // jeda ke serangan berikutnya (frame)
    }
  }
}
/* musuh menyerang real-time: enemyStep (dipanggil dari acTick di jobs.js) mengatur jalan, aba-aba, serangan, lalu mundur */
function enemyDone() {
  S.eb = false;
  S.ph = 4; // mundur ke posisi awal
}
function enemyTurn() {
  const b = S.burn;
  if (b && b.n > 0) {
    b.n--;
    S.ehp -= b.d;
    SND.sfx("hit");
    burst(ecx(), 165, "#ff7a3a");
    flo("BAKAR -" + b.d, "e", "#ff7a3a");
    bars();
    if (S.ehp <= 0) return setTimeout(win, 900);
  }
  enemyAct();
}
function enemyAct() {
  const e = S.e;
  if (S.stun > 0) {
    S.stun--;
    SND.sfx("tick");
    burst(ecx(), 160, "#ffe14d");
    flo("TERSENGAT", "e", "#ffe14d");
    say(`${e.n} masih tersengat petir dan tidak bisa menyerang!`);
    enemyDone();
    return menu();
  }
  const fz = (S.freeze > 0 ? 0.6 : 1) * (S.wet > 0 ? 0.75 : 1),
    d = Math.max(1, Math.round((R(e.atk - 2, e.atk + 2) - Pl.lv + 1 - bon("def")) * fz * posDef())),
    T = enemyAtk(e), // jarak dekat (menebas) atau jarak jauh (menembak)
    rg = T.t === "ranged",
    n = rg ? T.n || 1 : 1,
    per = Math.max(1, Math.round(d * (n === 1 ? 1 : 1.3 / n)));
  if (S.freeze > 0) S.freeze--;
  if (S.wet > 0) S.wet--;
  an.wt = 0;
  SND.mon(e.sp, "atk");
  say(rg ? `${e.n} menembakkan serangan!` : `${e.n} menyerang!`);
  S.shots = n;
  S.vh = false;
  const finish = () => {
    enemyDone();
    if (mode === "m" || mode === "r") menu();
  };
  /* satu serangan mendarat. ev = alasan lolos ("HINDAR!", "LOMPAT!", "MELESET!"), null = kena */
  const land = (ev) => {
    if (mode === "w" || mode === "x" || Pl.hp <= 0) return;
    const last = --S.shots <= 0;
    if (ev) {
      flo(ev, "h", "#7cf0ff");
      if (last) {
        if (!S.vh) say(ev === "MELESET!" ? `Serangan ${e.n} meleset!` : `Kamu menghindari serangan ${e.n}!`);
        finish();
      }
      return;
    }
    S.vh = true;
    Pl.hp = Math.max(0, Pl.hp - per);
    gainUlt(7);
    an.hc = null; // combo putus saat terkena serangan
    an.sp = 12;
    an.fx = 2;
    SND.sfx("hurt");
    burst(PCX, 170, "#ff6b8b");
    slashFx("#ff6b8b", "c", PCX - 2, 150, 0.9, 1);
    if (rg) slashFx(T.col || "#ff6b8b", "r", PCX, 150, 0.6);
    flo("-" + per, "h", "#ff6b8b");
    say(`${e.n} ${rg ? "menembak" : "menyerang"}! −${per} HP${fz < 1 ? " (melemah)" : ""}`);
    bars();
    if (!Pl.hp) return setTimeout(lose, 700);
    if (last) finish();
  };
  if (rg) {
    // proyektil melaju lurus ke arah pemain; kena/tidaknya ditentukan di enemyShots (jobs.js)
    an.rc = 14;
    an.ep = an.ep || [];
    for (let i = 0; i < n; i++) an.ep.push({ t: -i * 12, type: T.shot, col: T.col, v: 5.5, h: JUMP.clr, land });
  } else {
    an.lg = 18; // tebasan di tempat setelah musuh sampai di depan pemain
    setTimeout(() => land(eGap() > MELEE.hit ? "MELESET!" : Pl.dg > 0 ? "HINDAR!" : an.jy >= JUMP.clr ? "LOMPAT!" : null), 170);
  }
}
/* aksi pemain selesai: siap menerima aksi berikutnya begitu animasi selesai */
function actDone() {
  if (S && S.ehp > 0) S.pend = true;
}
function lose() {
  if (mode === "x") return;
  mode = "x";
  S.eb = S.pend = S.pvol = false;
  S.tel = 0;
  S.et = 160;
  S.pt = 150;
  S.ph = 0;
  S.eo = 0;
  S.shots = 0;
  an.ep = [];
  Pl.dg = 0;
  hideSk();
  SND.music(null);
  SND.sfx("lose");
  say(
    "Kamu terjatuh... tapi tidak apa-apa. Belajar dari soal tadi, lalu coba lagi.",
  );
  Pl.hp = mhp();
  Pl.cd = {};
  Pl.combo = 0;
  S.ehp = S.e.hp;
  bars();
  ui(
    `<div class="card"><div class="row"><button class="b" id="rt">Coba lagi</button><button class="b g" id="rm2">Kembali ke peta</button></div></div>`,
  );
  $("#rt").onclick = () => {
    SND.music(S.i === 3 ? "boss" : "battle");
    menu();
  };
  $("#rm2").onclick = () => W.back(null);
}
function win() {
  if (mode === "w") return;
  mode = "w";
  hideSk();
  SND.music(null);
  SND.sfx("win");
  SND.mon(S.e.sp, "die");
  S.dead = performance.now();
  say(S.e.win);
  const e = S.e;
  Pl.xp += e.xp;
  Pl.coin += e.coin;
  gainUlt(15); // bonus energi ulti, terbawa ke pertempuran berikutnya
  let up = "";
  while (Pl.xp >= Pl.lv * 30) {
    Pl.xp -= Pl.lv * 30;
    Pl.lv++;
    Pl.sp += SP_LV;
    up += ` Naik ke Level ${Pl.lv}! +${SP_LV} poin status.`;
  }
  if (up) {
    Pl.hp = mhp();
    Pl.fp = mmp();
    up += " HP & Mana pulih. Bagikan poin di Tas (I) › Status.";
  }
  if (up) setTimeout(() => SND.sfx("level"), 1300);
  W.defeated(S.i);
  ui(
    `<div class="card"><b class="ok">${e.n} dikalahkan!</b> +${e.xp} XP, +${e.coin} koin.${up}<div class="row" style="margin-top:8px"><button class="b" id="nx">Lanjut</button></div></div>`,
  );
  $("#nx").onclick = () => W.back(S.i);
  $("#nx").focus();
}
function flo(t, w, c) {
  an.fl.push({ x: w === "h" ? PCX + 3 : ecx() - 3, y: w === "h" ? 100 : 128, t, c, l: 60 });
}

/* ---------- Render canvas ---------- */
function spr(k, x, y, s, al = 1, tint, fr = 0, fl = 0, mm) {
  const o = SP[k],
    m =
      mm ||
      (fr && o.f && o.f[fr]
        ? o.m.slice(0, o.m.length - o.f[fr].length).concat(o.f[fr])
        : o.m),
    n = m[0].length;
  y -= (o.oy || 0) * s;
  ctx.globalAlpha = al;
  m.forEach((r, j) => {
    for (let i = 0; i < n; i++) {
      const ii = fl ? n - 1 - i : i,
        c = r[ii];
      if (c === "." || c === undefined) continue;
      const X = x + i * s,
        Y = y + j * s;
      ctx.fillStyle = tint || o.p[c];
      ctx.fillRect(X, Y, s, s);
      if (s >= 3 && o.m.length <= 16 && !tint && c !== "K") {
        const u = m[j - 1]?.[ii],
          d = m[j + 1]?.[ii],
          h = Math.ceil(s / 3);
        if (!u || u === "." || u === "K") {
          ctx.fillStyle = "rgba(255,255,255,.28)";
          ctx.fillRect(X, Y, s, h);
        }
        if (!d || d === "." || d === "K") {
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.fillRect(X, Y + s - h, s, h);
        }
      }
    }
  });
  ctx.globalAlpha = 1;
}
function burst(x, y, c) {
  if (rm) return;
  for (let i = 0; i < 16; i++)
    an.pt.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 4.5 - 1.5,
      l: 30,
      c,
    });
}
/* ===== Tampilan battle ala hack & slash: langit senja, siluet, tebasan bercahaya ===== */
const SIL = false, // false = sprite berwarna asli (tanpa siluet)
  SIL_DARK = "#0d0916",
  silA = document.createElement("canvas"),
  rimA = document.createElement("canvas");
silA.width = rimA.width = VW;
silA.height = rimA.height = VH;
const silX = silA.getContext("2d"),
  rimX = rimA.getContext("2d");
/* gambar fn() ke kanvas sementara, ubah jadi siluet gelap + garis tepi bercahaya, lalu tempel ke layar */
function sil(fn, rim, dark = SIL_DARK) {
  if (!SIL) return fn();
  const main = ctx;
  silX.clearRect(0, 0, VW, VH);
  ctx = silX;
  try {
    fn();
  } finally {
    ctx = main;
  }
  silX.globalCompositeOperation = "source-atop";
  silX.fillStyle = dark;
  silX.fillRect(0, 0, VW, VH);
  silX.globalCompositeOperation = "source-over";
  if (rim) {
    rimX.clearRect(0, 0, VW, VH);
    rimX.drawImage(silA, 0, 0);
    rimX.globalCompositeOperation = "source-in";
    rimX.fillStyle = rim;
    rimX.fillRect(0, 0, VW, VH);
    rimX.globalCompositeOperation = "source-over";
    ctx.save();
    ctx.shadowColor = rim;
    ctx.shadowBlur = (9) * SC;
    ctx.drawImage(rimA, 0, -1);
    ctx.restore();
    ctx.drawImage(rimA, -1, 0);
    ctx.drawImage(rimA, 1, 0);
  }
  ctx.drawImage(silA, 0, 0);
}
function pagoda(x, base, u, col) {
  ctx.fillStyle = col;
  let y = base;
  for (let i = 0; i < 4; i++) {
    const bw = (18 - i * 3) * u,
      ew = bw + 9 * u,
      top = y - 10 * u;
    ctx.fillRect(x - bw / 2, top + 2 * u, bw, 8 * u);
    ctx.fillRect(x - ew / 2, top, ew, 2 * u);
    ctx.fillRect(x - ew / 2 - u, top - u, 2 * u, u);
    ctx.fillRect(x + ew / 2 - u, top - u, 2 * u, u);
    y = top;
  }
  ctx.fillRect(x - u / 2, y - 9 * u, u, 9 * u);
}
function hut(x, base, w, h, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x, base - h, w, h);
  for (let i = 0; i < h / 2; i++) ctx.fillRect(x - 3 + i, base - h - i * 1.5, w + 6 - i * 2, 2);
}
function scene(b, t, sd) {
  const H = GY, // tinggi langit; lantai dari GY sampai dasar kanvas
    g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#43255a");
  g.addColorStop(0.4, "#a8506c");
  g.addColorStop(0.78, "#f2a45c");
  g.addColorStop(1, "#ffe0a8");
  ctx.fillStyle = g;
  ctx.fillRect(0, -BDY, VW, H + BDY);
  ctx.globalAlpha = 0.2; // warna khas zona musuh
  ctx.fillStyle = b[0];
  ctx.fillRect(0, -BDY, VW, H + BDY);
  ctx.globalAlpha = 1;
  const sx0 = VW - 128,
    sy0 = H - 44,
    rg = ctx.createRadialGradient(sx0, sy0, 6, sx0, sy0, 200);
  rg.addColorStop(0, "rgba(255,244,210,.95)");
  rg.addColorStop(0.25, "rgba(255,200,130,.5)");
  rg.addColorStop(1, "rgba(255,160,100,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, -BDY, VW, H + BDY);
  ctx.fillStyle = "#fff3cf";
  for (let dy = -26; dy <= 26; dy += 2) {
    const w = Math.round(Math.sqrt(676 - dy * dy) * 2);
    ctx.fillRect(sx0 - w / 2, sy0 + dy, w, 2);
  }
  ctx.fillStyle = "#ffd0c0"; // awan tipis
  ctx.globalAlpha = 0.28;
  for (let k = 0; k < 4; k++) {
    const x = (((rm ? 0 : t * 0.008) * (k + 1) + k * 150) % 580) - 70,
      y = 26 + k * 24;
    ctx.fillRect(Math.round(x + 14), y, 46, 4);
    ctx.fillRect(Math.round(x), y + 4, 78, 4);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#7a3a60"; // bukit jauh
  ctx.globalAlpha = 0.5;
  for (let x = 0; x < VW; x += 6) {
    const top = Math.round(H - 6 - (46 + 22 * Math.sin(x * 0.02 + sd) + 12 * Math.sin(x * 0.055 + sd * 2)));
    ctx.fillRect(x, top, 6, H - top);
  }
  ctx.globalAlpha = 0.9; // siluet kota & pagoda
  const far = "#55294f",
    px = 70 + ((sd * 37) % 50);
  ctx.fillRect(0, H - 22, VW, 22);
  for (let x = 0; x < VW; x += 12) ctx.fillRect(x, H - 25, 7, 3);
  pagoda(px, H - 20, 1.9, far);
  pagoda(px + 150 + ((sd * 13) % 30), H - 20, 1.15, far);
  hut(px + 62, H - 18, 22, 12, far);
  hut(px - 52, H - 18, 18, 10, far);
  hut(px + 232, H - 18, 26, 14, far);
  if (VW > 480) {
    pagoda(px + 330, H - 20, 1.5, far); // arena lebar: tambah siluet di sisi kanan
    hut(px + 408, H - 18, 22, 12, far);
  }
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "#2b1633"; // bukit dekat
  for (let x = 0; x < VW; x += 6) {
    const top = Math.round(H - (12 + 9 * Math.sin(x * 0.04 + sd * 3)));
    ctx.fillRect(x, top, 6, H - top);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffe2b0"; // bara melayang
  for (let k = 0; k < 22; k++) {
    ctx.globalAlpha = rm ? 0.4 : 0.2 + 0.5 * Math.abs(Math.sin(t / 700 + k));
    const x = ((k * 71 + (rm ? 0 : t * 0.012) * (1 + (k % 3))) % (VW + 20)) - 10,
      y = 40 + ((k * 37) % 130) - (rm ? 0 : (t * 0.006 * (1 + (k % 2))) % 30);
    ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  ctx.globalAlpha = 1;
  const mg = ctx.createLinearGradient(0, H - 26, 0, H);
  mg.addColorStop(0, "rgba(255,190,140,0)");
  mg.addColorStop(1, "rgba(255,190,140,.3)");
  ctx.fillStyle = mg;
  ctx.fillRect(0, H - 26, VW, 26);
  ctx.fillStyle = "#0a0710"; // lantai gelap
  ctx.fillRect(0, H, VW, VH - H);
  ctx.fillStyle = "#ffbe78";
  ctx.globalAlpha = 0.45;
  ctx.fillRect(0, H, VW, 2);
  ctx.globalAlpha = 0.1;
  for (let x = 0; x < VW; x += 40) ctx.fillRect(x, H + 8, 18, 2);
  ctx.globalAlpha = 1;
}
/* ---------- efek tebasan ---------- */
function slashFx(col, kind, x, y, big = 1, flip = 0, rot = (Math.random() - 0.5) * 0.5, delay = 0) {
  if (rm) return;
  an.sf.push({ t: delay, col, kind, x, y, big, flip, rot });
}
function elemHit(el, col) {
  const X = ecx();
  if (el === "fire") {
    slashFx(col, "f", X, 190, 1.2, 0, 0);
    slashFx("#ffd166", "c", X, 150, 1.1, 0, -0.3);
    for (let i = 0; i < 16; i++)
      an.pt.push({ x: X + R(-20, 20), y: 175, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 5 - 2, l: 30, c: P(["#ff4d1a", "#ff9a3d", "#ffd166"]) });
  } else if (el === "ice") {
    slashFx("#bff6ff", "i", X, 155, 1.2, 0, 0);
    slashFx(col, "c", X, 150, 1, 0, 0.3);
    for (let i = 0; i < 12; i++) an.pt.push({ x: X + R(-20, 20), y: 150 + R(-20, 20), vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 3, l: 30, c: P(["#7cf0ff", "#ffffff", "#b8e8ff"]) });
  } else if (el === "slash") {
    slashFx(col, "c", X, 150, 1.4, 0, -0.5);
    slashFx("#ffffff", "c", X, 150, 1.05, 1, 0.5, -3);
    for (let i = 0; i < 10; i++) an.pt.push({ x: X + R(-18, 18), y: 150 + R(-26, 26), vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4, l: 22, c: P(["#ffd166", "#ffffff"]) });
  } else {
    slashFx("#ffe14d", "r", X, 150, 0.7, 0, 0);
    for (let i = 0; i < 14; i++) an.pt.push({ x: X + R(-14, 14), y: 150 + R(-30, 30), vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 5, l: 24, c: P(["#ffe14d", "#ffffff"]) });
  }
}
function hitFx(act, r, col) {
  const X = ecx(),
    Y = 150,
    sk = skill(act);
  if (sk.V && jobImpact(act, r, col)) return;
  if (sk.k === "elem") {
    elemHit(sk.el, col);
    if (r.crit) slashFx("#fff", "c", X, Y, 1.2, 1, 0.7, -2);
    return;
  }
  if (sk.k === "dash") {
    slashFx(col, "p", X, Y, 1.35, 0, -0.1);
    slashFx("#ffffff", "p", X, Y - 8, 1, 0, 0.14, -3);
    if (r.crit) slashFx("#ff9a3d", "c", X, Y, 1.35, 0, -0.8);
    return;
  }
  if (sk.k === "jump") {
    slashFx(col, "c", X, Y - 10, 1.45, 0, 0.9);
    slashFx("#ffffff", "p", X, Y, 1.2, 0, 0.85, -2);
    slashFx(col, "c", X, Y, 1, 1, -0.5, -4);
    slashFx(col, "r", X, Y + 25, 0.8, 0, 0, -2);
    return;
  }
  if (r.pen) slashFx(col, "p", X, Y, 1.1);
  if (r.crit) {
    slashFx(col, "c", X, Y, 1.35, 0, -0.8);
    slashFx("#ffffff", "c", X, Y, 1.1, 1, 0.8, -3);
  } else if (act === "pow") {
    slashFx(col, "c", X, Y, 1.25);
    slashFx("#ffffff", "c", X, Y + 6, 0.8, 0, 0.5, -4);
  } else if (!r.pen) slashFx(col, "c", X, Y, 0.95);
}
function drawSlash(s) {
  if (s.t < 0) return;
  const k = s.t / 16;
  ctx.save();
  ctx.translate(s.x, s.y);
  if (s.flip) ctx.scale(-1, 1);
  ctx.rotate(s.rot);
  ctx.globalAlpha = Math.max(0, 1 - k * k);
  ctx.shadowColor = s.col;
  ctx.shadowBlur = (18) * SC;
  if (s.kind === "f") {
    // pilar api: lidah api naik dari tanah
    const h = 95 * s.big * Math.min(1, k * 3.2) * (1 - k * 0.45);
    for (let n = 0; n < 2; n++)
      for (let i = -3; i <= 3; i++) {
        const sc = n ? 0.55 : 1,
          wv = (10 * s.big * (1 - Math.abs(i) / 4.2) + 4) * sc,
          hh = h * sc * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.9 + s.t * 0.8))),
          bx = i * 11 * s.big;
        ctx.fillStyle = n ? "#ffe9a0" : s.col;
        ctx.beginPath();
        ctx.moveTo(bx - wv, 0);
        ctx.quadraticCurveTo(bx - wv * 0.4, -hh * 0.5, bx, -hh);
        ctx.quadraticCurveTo(bx + wv * 0.4, -hh * 0.5, bx + wv, 0);
        ctx.closePath();
        ctx.fill();
      }
  } else if (s.kind === "i") {
    // pecahan kristal es memancar keluar
    const e = 1 - (1 - Math.min(1, k * 2)) ** 2;
    for (let i = 0; i < 9; i++) {
      const an2 = (i / 9) * 6.283 + 0.3,
        d = 14 + 70 * s.big * e,
        z = 9 * s.big * (1 - k * 0.6) * (i % 2 ? 0.7 : 1);
      ctx.save();
      ctx.translate(Math.cos(an2) * d, Math.sin(an2) * d);
      ctx.rotate(an2);
      ctx.fillStyle = s.col;
      ctx.beginPath();
      ctx.moveTo(-z * 1.6, 0);
      ctx.lineTo(0, -z * 0.55);
      ctx.lineTo(z * 1.6, 0);
      ctx.lineTo(0, z * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (s.kind === "r") {
    // cincin gelombang
    const e = 1 - (1 - Math.min(1, k * 1.8)) ** 2;
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 6 * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(0, 0, 8 + 90 * s.big * e, 0, 6.283);
    ctx.stroke();
  } else if (s.kind === "z") {
    // sambaran petir dari langit
    const seg = 8,
      yT = -s.y;
    for (let w = 0; w < 2; w++) {
      ctx.strokeStyle = w ? "#ffffff" : s.col;
      ctx.lineWidth = w ? 2 : 7;
      ctx.beginPath();
      ctx.moveTo(0, yT);
      for (let i = 1; i < seg; i++) ctx.lineTo((Math.random() - 0.5) * 34, yT + (-yT * i) / seg);
      ctx.lineTo(0, 0);
      ctx.stroke();
    }
  } else if (s.kind === "p") {
    const len = 140 * s.big * Math.min(1, k * 3.5),
      th = (7 * (1 - k) + 1) * s.big;
    ctx.fillStyle = s.col;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -th);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, th);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(0, -th * 0.4);
    ctx.lineTo(len, 0);
    ctx.lineTo(0, th * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (s.kind === "h") {
    // pilar cahaya suci turun dari langit
    const wd = 46 * s.big * (1 - k * 0.65),
      yT = -s.y,
      g = ctx.createLinearGradient(0, yT, 0, 20);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, s.col);
    g.addColorStop(1, "#ffffff");
    ctx.fillStyle = g;
    ctx.fillRect(-wd / 2, yT, wd, -yT + 20);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-wd * 0.17, yT, wd * 0.34, -yT + 20);
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(0, 18, 14 + 46 * s.big * Math.min(1, k * 2), 5 + 14 * Math.min(1, k * 2), 0, 0, 6.283);
    ctx.stroke();
  } else if (s.kind === "v") {
    // pusaran kegelapan yang menelan musuh
    const rr = 34 * s.big * Math.sin(Math.min(1, k * 1.25) * 2.9 + 0.2);
    ctx.fillStyle = "rgba(14,0,30,.85)";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(2, rr), 0, 6.283);
    ctx.fill();
    ctx.strokeStyle = s.col;
    ctx.lineWidth = 4 * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(3, rr + 7), 0, 6.283);
    ctx.stroke();
    ctx.fillStyle = s.col;
    for (let j = 0; j < 10; j++) {
      const ag = j * 0.628 + k * 9,
        dd = (16 + 80 * (1 - k)) * s.big * (0.6 + (j % 3) * 0.2);
      ctx.fillRect(Math.round(Math.cos(ag) * dd), Math.round(Math.sin(ag) * dd), 5, 5);
    }
  } else if (s.kind === "w") {
    // percikan air membentuk mahkota
    const e = Math.min(1, k * 1.6);
    ctx.fillStyle = s.col;
    for (let j = 0; j < 9; j++) {
      const ag = Math.PI + (j / 8) * Math.PI,
        vx = Math.cos(ag) * 60 * s.big * e,
        vy = Math.sin(ag) * 70 * s.big * e + 60 * s.big * e * e * 0.8;
      ctx.beginPath();
      ctx.arc(vx, vy, 5 * (1 - k * 0.6), 0, 6.283);
      ctx.fill();
    }
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(0, 24, 10 + 52 * s.big * e, 4 + 12 * e, 0, 0, 6.283);
    ctx.stroke();
  } else {
    const R = 58 * s.big,
      e = 1 - (1 - Math.min(1, k * 2.4)) ** 2,
      a0 = -2.2,
      a1 = a0 + 3.5 * e,
      mid = (a0 + a1) / 2,
      crescent = (rad) => {
        ctx.beginPath();
        ctx.arc(0, 0, R, a0, a1);
        ctx.quadraticCurveTo(Math.cos(mid) * R * rad, Math.sin(mid) * R * rad, Math.cos(a0) * R, Math.sin(a0) * R);
        ctx.closePath();
        ctx.fill();
      };
    ctx.fillStyle = s.col;
    crescent(0.4);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    crescent(0.7);
  }
  ctx.restore();
}
/* bar HP melayang di atas karakter */
function floatBar(cx, y, wd, f, c1, c2, name, nc, sub) {
  const x = Math.round(cx - wd / 2);
  ctx.save();
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(8,4,16,.9)";
  if (name) {
    ctx.font = 'bold 10px "Pixelify Sans",monospace';
    ctx.strokeText(name, cx, y - 5);
    ctx.fillStyle = nc;
    ctx.fillText(name, cx, y - 5);
  }
  ctx.fillStyle = "rgba(8,4,16,.8)";
  ctx.fillRect(x - 2, y - 2, wd + 4, 9);
  ctx.fillStyle = "#3a1630";
  ctx.fillRect(x, y, wd, 5);
  const gr = ctx.createLinearGradient(x, 0, x + wd, 0);
  gr.addColorStop(0, c1);
  gr.addColorStop(1, c2);
  ctx.fillStyle = gr;
  ctx.fillRect(x, y, Math.round(wd * f), 5);
  ctx.fillStyle = "rgba(255,255,255,.35)";
  ctx.fillRect(x, y, Math.round(wd * f), 1);
  if (sub) {
    ctx.font = '9px "Pixelify Sans",monospace';
    ctx.strokeText(sub, cx, y + 17);
    ctx.fillStyle = "#ffd9a0";
    ctx.fillText(sub, cx, y + 17);
  }
  ctx.restore();
}
function heroB(x, y, a, col, hs = 3) {
  const k = hs / 3, // 3 = ukuran asli; battle layar penuh memakai skala lebih besar
    q = (v) => Math.round(v / 2) * 2,
    r = (v) => Math.round(v * k),
    ln = Math.round(a * 4 * k),
    fl = an.sp > 6; // berkedip putih saat terkena serangan
  spr("heroB", x + ln, y, hs, 1, fl ? "#fff" : null);
  HAT && hatDraw(x + ln, y, hs, 0);
  // posisi tangan; a<0 = ancang-ancang, a>0 = menebas ke depan
  const fx = q(x + ln + 42 * k + a * (a < 0 ? 10 : 20) * k),
    fy = q(y + 42 * k - a * 6 * k),
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
  if (Pl && Pl.job && Pl.job !== "sword") return jobWeapon(Pl.job, fx, fy, a, k, r, fl);
  each((X, Y) => {
    ctx.fillStyle = "#140f1c";
    ctx.fillRect(X - r(3), Y - r(3), r(6), r(6));
  }); // garis tepi bilah
  const rb = globalThis.RB,
    bc = globalThis.bladeC,
    hue = (i, o = 0) => `hsl(${(i * 34 + o + Date.now() / 3) % 360},100%,${o ? 48 : 62}%)`;
  each((X, Y, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i) : bc || SP.heroB.p.B;
    ctx.fillRect(X - r(2), Y - r(2), r(4), r(4));
  }); // bilah perak (pelangi saat ulti, berwarna elemen saat tebasan elemen)
  each((X, Y, i) => {
    ctx.fillStyle = fl ? "#fff" : rb ? hue(i, 180) : bc ? "#fff" : edge;
    ctx.fillRect(X - r(1), Y, r(2), r(2));
  }); // sisi merah
  ctx.fillStyle = "#140f1c";
  ctx.fillRect(fx - r(6), fy - r(6), r(12), r(12)); // pegangan + tangan
  ctx.fillStyle = SP.heroB.p.G;
  ctx.fillRect(fx - r(4), fy - r(4), r(8), r(8));
  ctx.fillStyle = "#fff";
  ctx.fillRect(fx - r(4), fy - r(4), r(4), r(2));
  return [Math.round(fx + cx * 10 * st), Math.round(fy + cy * 10 * st), fx, fy]; // ujung pedang + tangan
}
let btOn = false;
function setBt(v) {
  if (v === btOn) return;
  btOn = v;
  document.body.classList.toggle("bt", v); // tampilan HUD khusus battle
  /* arena battle diperluas jadi 640x360 (lebih leluasa bergerak & melompat); dunia kembali 480x270 */
  VW = v ? 640 : 480;
  VH = v ? 300 : 270; // tinggi logis di bawah garis 0; tinggi kanvas = VH + BDY
  BDY = v ? 60 : 0;
  SC = OUT_W / VW; // dunia 480 -> 2.667x, arena 640 -> 2x (tinggi 360 -> 720)
  cv.width = OUT_W;
  cv.height = OUT_H;
  silA.width = rimA.width = VW;
  silA.height = rimA.height = VH + BDY;
  fit();
}
function draw(t) {
  if (W.on) {
    if (btOn) hideSk();
    setBt(false);
    fit();
    try {
      W.draw(t);
    } catch (err) {
      console.error(err); // jangan sampai game membeku
    }
    UIX.pad(!busy);
    requestAnimationFrame(draw);
    return;
  }
  UIX.pad(false);
  const e = S?.e;
  setBt(!!e);
  fit();
  if (e) {
    const qa = mode === "q" && cur && cur.act !== "heal";
    ts += ((qa ? 0.2 : 1) - ts) * 0.12;
    const frozen = an.hs > 0; // hit-stop: animasi beku sesaat saat serangan mendarat
    if (frozen) an.hs--;
    const canMv = (mode === "m" || mode === "r" || mode === "i") && !an.a && !UIX.open;
    if (canMv && bmove) an.mx = clamp(an.mx + bmove * 0.02, 0, 1);
    an.T += frozen ? 0 : ts;
    acTick(t); // timer real-time: cooldown, mana, serangan musuh & party
    jumpTick(frozen ? 0 : ts); // fisika lompat
    const tt = an.T * 16.7;
    if (qa) an.wt += ts;
    else if (!an.a) an.wt = Math.max(0, an.wt - 2);
    const sh = an.se > 6 && !rm;
    if (sh) {
      ctx.save();
      ctx.translate(R(-3, 3), R(-3, 3));
    }
    ctx.save();
    ctx.translate(0, BDY); // arena diperluas ke atas (ruang lompat)
    scene(e.bg, tt, S.i + 1);
    mirBegin(e.s); // musuh di kiri pemain -> balik arena (hero, skill & efek menghadap kiri)
    const bob = rm ? 0 : Math.round(Math.sin(tt / 280) * 3),
      s = e.s,
      w = 32 * s,
      baseX = Math.round(jobBaseX(e.s)),
      ey = GY - w,
      bx = ecx() - w / 2,
      ex =
        bx +
        (an.rc > 0 ? Math.round(Math.sin((an.rc / 14) * Math.PI) * 9) : 0) -
        (an.lg > 0 ? Math.round(Math.sin((an.lg / 18) * Math.PI) * 16) : 0) + // hentakan kecil saat menebas (musuh sudah berjalan ke depan pemain)
        (an.se > 0 ? Math.min(an.se, 10) * 1.5 : 0),
      shE = an.se > 0 && !rm ? (an.se % 2 ? 4 : -4) : 0,
      shP = an.sp > 0 && !rm ? (an.sp % 2 ? 4 : -4) : 0,
      hxT = an.a && an.a.sw ? baseX + 26 : Math.max(bx - 100, baseX), // jangan mundur bila musuh sudah dekat; ayunan meleset hanya maju sedikit
      a = an.a;
    let hx = baseX - (an.sp > 0 ? Math.min(an.sp, 10) * 1.5 : 0) + shP - (Pl.dg > 0 ? Math.round(Math.sin(Math.PI * (1 - Pl.dg / 26)) * 22) : 0),
      pose;
    let hyo = 0; // offset vertikal (lompat)
    const K = a ? a.k || "slash" : "",
      RG = !!a && (K === "cast" || K === "shoot") && !!(a.sk && a.sk.V), // job jarak jauh: berdiri di tempat
      stay = K === "elem" ? 26 : RG || ULTK[K] ? 6 : 0;
    if (a) {
      if (!frozen) a.t++;
      if (a.x0 == null) a.x0 = baseX;
      if (a.hn == null) a.hn = 0;
      const x0 = a.x0,
        [AP, HD0, RT] = atmOf(a, K),
        HD = K === "ult" || ULTK[K] ? HD0 : Math.max(HD0, ((a.n || 1) - 1) * HG + 4),
        tn = a.t,
        hue = (Date.now() / 6) % 360,
        fire = () => {
          while (a.hn < a.n && tn >= AP + 1 + a.hn * HG) {
            a.lh = tn;
            a.cb(a.hn++);
          }
        };
      if (tn === 1 && !a.snd) {
        a.snd = 1;
        SND.sfx(K === "ult" || ULTK[K] ? "quest" : "whoosh");
      }
      if (tn <= AP) {
        const k = tn / AP,
          ez = 1 - (1 - k) * (1 - k);
        if (K === "elem") {
          // ancang-ancang, ayun, lalu gelombang elemen meluncur ke musuh
          hx = x0 + Math.round(26 * Math.min(1, tn / 9));
          pose = tn <= 9 ? a.w + (-0.9 - a.w) * (tn / 9) : -0.9 + 1.9 * Math.min(1, (tn - 9) / 3);
          if (tn === 10) a.pj = { x: a.tx || 130, y: a.ty || 150 };
        } else if (K === "ult") {
          // mengumpulkan energi pelangi (melayang), lalu menerjang
          if (tn <= 22) {
            hx = x0;
            hyo = -Math.round(Math.min(1, tn / 12) * 14);
            pose = -0.9;
          } else {
            hx = x0 + Math.round((hxT - x0) * ((tn - 22) / 4));
            hyo = -Math.round(14 * (1 - (tn - 22) / 4));
            pose = 0.4;
          }
          if (!rm) {
            ctx.fillStyle = `rgba(10,5,30,${0.4 * Math.min(1, tn / 10)})`;
            ctx.fillRect(0, -BDY, VW, VH + BDY);
          }
        } else if (RG) {
          // sihir / panah: tidak maju, hanya ancang-ancang lalu melepaskan
          const W0 = a.sk.V.w;
          hx = x0 + Math.round(6 * Math.min(1, tn / 8));
          pose =
            K === "shoot"
              ? tn <= W0 ? a.w + (-1 - a.w) * (tn / W0) : 0.8
              : tn <= W0 ? a.w + (-0.9 - a.w) * (tn / W0) : -0.9 + 1.9 * Math.min(1, (tn - W0) / 3);
        } else if (ULTK[K]) {
          hx = x0 + 6;
          hyo = -Math.round(Math.min(1, tn / 12) * (K === "ultm" ? 14 : 8));
          pose = K === "ultm" ? -0.9 : -1;
          if (!rm) {
            ctx.fillStyle = K === "ultm" ? `rgba(40,8,0,${0.4 * Math.min(1, tn / 10)})` : `rgba(6,18,40,${0.4 * Math.min(1, tn / 10)})`;
            ctx.fillRect(0, -BDY, VW, VH + BDY);
          }
        } else if (K === "jump") {
          hx = x0 + Math.round((hxT - x0) * ez);
          hyo = -Math.round(Math.sin(k * Math.PI) * 78);
          pose = -0.9 + 1.9 * Math.max(0, (k - 0.45) / 0.55);
        } else {
          hx = x0 + Math.round((hxT - x0) * ez);
          pose = a.w + (1 - a.w) * Math.min(1, tn / (K === "dash" ? 2 : 3));
          if (!rm && K === "dash" && typeof SKFX !== "undefined" && a.sk && a.sk.id === "pen" && (Pl.job || "sword") === "sword")
            SKFX.dashTrail(hx + 45, GY - 55, tn); // efek katalog: garis kecepatan merah (skill_fx.js)
          else if (!rm)
            for (let i = 0; i < 6; i++) {
              const l = (K === "dash" ? 90 : 45) + ((i * 10) % 30);
              ctx.fillStyle = K === "dash" ? "rgba(184,224,255,.6)" : "rgba(255,225,245,.55)";
              ctx.fillRect(hx + 45 - l, GY - 90 + i * 14, l, 2);
            }
        }
      } else if (tn <= AP + HD) {
        if (K === "ult") {
          hx = hxT;
          while (a.hi < ULT_HF.length && tn >= ULT_HF[a.hi]) {
            a.lh = tn;
            a.cb(a.hi++);
          }
          const since = tn - (a.lh || 0);
          pose = since < 3 ? 1 : -0.35;
          hyo = -Math.round(Math.sin((((tn - 27) % 5) / 5) * Math.PI) * 12);
          if (!rm) {
            if (typeof ultCol === "function" && ultCol(0) && typeof SKFX !== "undefined") SKFX.ultBg(); // Excalibur: kilau hangat (skill_fx.js)
            else {
              ctx.globalAlpha = 0.16;
              for (let i = 0; i < 7; i++) {
                ctx.fillStyle = `hsl(${(i * 51 + hue) % 360},100%,60%)`;
                ctx.fillRect(0, (i * GY) / 7, VW, GY / 7 + 1);
              }
              ctx.globalAlpha = 1;
            }
          }
        } else if (ULTK[K]) {
          hx = x0 + 6;
          while (a.hi < UH[K].length && tn >= UH[K][a.hi]) {
            a.lh = tn;
            a.cb(a.hi++);
          }
          const since = tn - (a.lh || 0);
          pose = K === "ultm" ? (since < 3 ? 1 : -0.4) : since < 2 ? 0.8 : -0.8;
          hyo = -Math.round(6 + Math.sin(tn * 0.3) * 3);
          if (!rm) {
            ctx.fillStyle = K === "ultm" ? "rgba(40,8,0,.34)" : "rgba(6,18,40,.32)";
            ctx.fillRect(0, -BDY, VW, VH + BDY);
          }
        } else {
          hx = stay ? x0 + stay : hxT;
          fire();
          const since = tn - (a.lh || 0);
          // tebasan beruntun: bilah mengayun bolak-balik di antara tiap hit
          pose = a.n > 1 && a.hn < a.n && since >= 2 ? -0.25 : 1;
        }
      } else {
        const k = Math.min(1, (tn - AP - HD) / RT),
          xr = stay ? x0 + stay : hxT;
        if (K !== "ult" && !ULTK[K]) fire(); // jaga-jaga bila ada hit tersisa
        hx = Math.round(xr - (xr - x0) * k);
        pose = 1 - k;
        if (K === "jump") hyo = -Math.round(Math.sin(k * Math.PI) * 20);
        if (k >= 1) {
          an.a = null;
          an.pa = 0;
        }
      }
    } else {
      an.pa += ((qa ? -Math.min(1, an.wt / 30) : 0) - an.pa) * 0.25;
      pose = an.pa + (qa && an.wt >= 30 && !rm ? Math.sin(t / 35) * 0.04 : 0);
    }
    const hy = GY - 120 + (rm ? 0 : Math.round(Math.sin(tt / 320) * 2));
    hyo -= Math.round(an.jy || 0); // tinggi lompat
    PCX = hx + 6; // posisi pemain untuk efek & serangan musuh
    PMr = MIRX ? VW - (PCX + 34) : PCX + 34; // tengah badan pemain, koordinat asli
    const hueN = (typeof ultHue === "function" && ultHue()) || (Date.now() / 6) % 360, // ultHue(): emas Excalibur (skill_fx.js)
      rdyU = Pl.ult >= ULT_MAX && !a && mode === "m",
      fc = qa
        ? skill(cur.act).col || "#7ef0c8"
        : a && K === "ult"
          ? `hsl(${hueN},100%,65%)`
          : a && a.el
            ? EL[a.el].c
            : rdyU
              ? `hsl(${hueN},100%,65%)`
              : null,
      al = S.dead ? Math.max(0, 1 - (t - S.dead) / 700) : 1,
      ML = SP[e.sp + "L"].a,
      fi = rm ? 0 : an.lg > 0 || an.rc > 0 ? 2 : S.ph === 1 || S.ph === 4 ? Math.floor(tt / 150) % 2 : Math.floor(tt / (e.sp === "dragon" ? 260 : 380)) % 2,
      flE = an.se > 6 || (S.tel > 0 && Math.floor(S.tel / 4) % 2 === 0), // berkedip = aba-aba serangan musuh
      flP = an.sp > 6;
    // bayangan di tanah (mengecil saat pemain melompat)
    if (!rm) {
      const jk = Math.max(0.45, 1 - (an.jy || 0) / 140);
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.beginPath();
      ctx.ellipse(hx + 40, GY + 3, 34 * jk, 6 * jk, 0, 0, 6.283);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ex + w / 2, GY + 3, w * 0.42, 6, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }
    // lingkaran jangkauan Serang Biasa (Pendekar Pedang): menyala bila musuh sudah di dalam jangkauan
    if (!rm && !S.dead && (Pl.job || "sword") === "sword" && (mode === "m" || mode === "r") && !a) {
      const inR = eGap() <= SWORD_REACH;
      ctx.save();
      ctx.globalAlpha = inR ? 0.5 : 0.22;
      ctx.strokeStyle = inR ? "#ffd166" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.beginPath();
      ctx.ellipse(hx + 40, GY + 3, SWORD_REACH, 16, 0, 0, 6.283);
      ctx.stroke();
      ctx.restore();
    }
    // musuh
    sil(
      () => spr(e.sp + "L", ex + shE, ey + bob, s, al, !SIL && flE ? "#fff" : null, 0, 0, ML[fi]),
      "#ff6b8b",
      flE ? "#fff" : SIL_DARK,
    );
    if (S.tel > 0 && !S.dead) {
      ctx.save();
      ctx.font = 'bold 30px "Pixelify Sans",monospace';
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#000";
      ctx.fillStyle = "#ff4d6d";
      ctx.strokeText("!", ex + w / 2, ey + bob - 6);
      ctx.fillText("!", ex + w / 2, ey + bob - 6);
      ctx.restore();
    }
    if (!rm && !S.dead) {
      if (S.burn && S.burn.n > 0 && Math.random() < 0.5 && an.pt.length < 90)
        an.pt.push({ x: ex + R(8, w - 8), y: ey + bob + w - R(0, w * 0.6), vx: (Math.random() - 0.5) * 1.2, vy: -Math.random() * 2.2, l: 22, c: P(["#ff4d1a", "#ff9a3d", "#ffd166"]) });
      if (S.stun > 0 && Math.random() < 0.4 && an.pt.length < 90)
        an.pt.push({ x: ex + R(0, w), y: ey + bob + R(0, w), vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, l: 12, c: "#ffe14d" });
      if (S.freeze > 0) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = "#7cf0ff";
        [[0.1, 0.9], [0.55, 0.95], [0.85, 0.45], [0.2, 0.3]].forEach(([qx, qy], i) => {
          const cx = ex + w * qx,
            cy = ey + bob + w * qy,
            z = 7 + (i % 2) * 4;
          ctx.beginPath();
          ctx.moveTo(cx, cy - z * 1.5);
          ctx.lineTo(cx + z * 0.6, cy);
          ctx.lineTo(cx, cy + z * 0.5);
          ctx.lineTo(cx - z * 0.6, cy);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();
      }
    }
    // anggota party: formasi depan / belakang sesuai role
    const pp = F.party ? fmUnits(tt, bx) : [];
    if (pp.length) sil(() => pp.filter((p) => p.back).forEach(fmSpr), "#8fd0ff");
    // pemain
    let tip;
    if (a && (K === "dash" || K === "jump" || (K === "ult" && a.t > 22 && a.t < 34)) && !rm) {
      a.g = a.g || [];
      a.g.forEach((g, i) => {
        ctx.save();
        ctx.globalAlpha = 0.1 + 0.07 * i;
        heroB(g.x, hy + g.y, g.p, null, 5);
        ctx.restore();
      });
      a.g.push({ x: hx, y: hyo, p: pose });
      if (a.g.length > 5) a.g.shift();
    }
    globalThis.RB = a && K === "ult" && a.t > 3 && !(typeof ultCol === "function" && ultCol(0)) ? 1 : 0;
    globalThis.bladeC = a && a.el ? EL[a.el].c : a && K === "ult" && a.t > 3 && typeof ultCol === "function" && ultCol(0) ? "#ffcf6a" : null;
    sil(() => (tip = heroB(hx, hy + hyo, pose, SIL ? null : fc, 5)), "#e9a8ff", flP ? "#fff" : SIL_DARK);
    globalThis.RB = 0;
    globalThis.bladeC = null;
    if (pp.length) sil(() => pp.filter((p) => !p.back).forEach(fmSpr), "#8fd0ff");
    if (Pl.dg > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(124,240,255,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(hx + 40, hy + hyo + 62, 46, 68, 0, 0, 6.283);
      ctx.stroke();
      ctx.restore();
    }
    const [fx, fy, hxd, hyd] = tip;
    if (a) {
      a.tx = fx;
      a.ty = fy;
    }
    if (a) jobFrame(a, K, fx, fy, hx, hy + hyo); // animasi sihir / panah / ulti job
    if (pp.length) fmFx(pp); // efek serangan & penyembuhan anggota party
    enemyShots(ex, ey + bob, w); // tembakan musuh jarak jauh
    // cahaya di ujung pedang: pelangi (ulti), warna elemen, atau saat ulti siap
    if (!rm && (a && (K === "ult" || a.el) || rdyU)) {
      const gc = a && a.el ? EL[a.el].c : `hsl(${hueN},100%,65%)`;
      ctx.save();
      ctx.fillStyle = gc;
      [26, 17, 9].forEach((rr) => {
        ctx.globalAlpha = 0.14 + 0.05 * Math.sin(Date.now() / 90);
        ctx.beginPath();
        ctx.arc(fx, fy, rr, 0, 6.283);
        ctx.fill();
      });
      ctx.restore();
    }
    if (a && K === "ult" && !rm) {
      // aura pelangi: partikel melingkar saat mengumpulkan energi, percikan saat menebas
      if (a.t <= 22)
        for (let j = 0; j < 7; j++) {
          const ang = a.t * 0.35 + j * 0.9,
            rr = 8 + 46 * (1 - a.t / 22);
          ctx.fillStyle = (typeof ultCol === "function" && ultCol(j)) || `hsl(${(j * 51 + hueN) % 360},100%,62%)`;
          ctx.fillRect(Math.round(fx + Math.cos(ang) * rr), Math.round(fy + Math.sin(ang) * rr), 4, 4);
        }
      else if (an.pt.length < 90)
        for (let j = 0; j < 2; j++)
          an.pt.push({ x: fx, y: fy, vx: (Math.random() - 0.3) * 4, vy: (Math.random() - 0.7) * 4, l: 24, c: (typeof ultCol === "function" && ultCol(R(0, 3))) || `hsl(${R(0, 359)},100%,62%)` });
    }
    // gelombang / sambaran elemen yang meluncur ke musuh
    if (a && a.el && !rm && !(a.sk && a.sk.V)) {
      const tn = a.t;
      if (a.el === "bolt") {
        if (tn === 14) slashFx("#ffe14d", "z", ecx(), 160, 1, 0, 0);
        if (tn >= 14 && tn <= 16) {
          ctx.fillStyle = "rgba(255,255,200,.22)";
          ctx.fillRect(0, -BDY, VW, VH + BDY);
        }
      } else if (a.pj && tn >= 10 && tn <= 18) {
        const k = (tn - 10) / 8,
          x = a.pj.x + (326 - a.pj.x) * k,
          y = a.pj.y + (150 - a.pj.y) * k;
        if (a.el === "slash") {
          if (typeof SKFX !== "undefined" && (Pl.job || "sword") === "sword") SKFX.wave(x, y, tn); // efek katalog: gelombang sabit merah (skill_fx.js)
          else {
            drawSlash({ t: 4, kind: "c", col: "#ffd166", x, y, big: 1.25, flip: 0, rot: 0 });
            for (let j = 0; j < 2; j++) an.pt.push({ x: x - 10, y: y + R(-20, 20), vx: -1 - Math.random() * 2, vy: -Math.random() * 1.5, l: 16, c: P(["#ffd166", "#ffffff"]) });
          }
        } else if (a.el === "fire") {
          drawSlash({ t: 5, kind: "c", col: "#ff6a2a", x, y, big: 0.85, flip: 0, rot: 0 });
          for (let j = 0; j < 3; j++) an.pt.push({ x: x - 10, y: y + R(-18, 18), vx: -1 - Math.random() * 2, vy: -Math.random() * 2, l: 18, c: P(["#ff4d1a", "#ff9a3d", "#ffd166"]) });
        } else {
          ctx.save();
          ctx.shadowColor = "#7cf0ff";
          ctx.shadowBlur = (12) * SC;
          for (let j = 0; j < 3; j++) {
            const sx = x - j * 15,
              sy = y + (j - 1) * 11;
            ctx.fillStyle = j ? "#7cf0ff" : "#ffffff";
            ctx.beginPath();
            ctx.moveTo(sx - 12, sy);
            ctx.lineTo(sx, sy - 5);
            ctx.lineTo(sx + 12, sy);
            ctx.lineTo(sx, sy + 5);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }
    if (SIL) {
      // bilah pedang bercahaya + cahaya pengisian
      const gc = fc || (a ? "#ff7ad9" : "#b98cff");
      ctx.save();
      ctx.strokeStyle = gc;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.shadowColor = gc;
      ctx.shadowBlur = (a ? 14 : 8) * SC;
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      ctx.moveTo(hxd, hyd);
      ctx.lineTo(fx, fy);
      ctx.stroke();
      ctx.restore();
      if (fc) {
        const g = ctx.createRadialGradient(fx, fy, 2, fx, fy, 42);
        g.addColorStop(0, fc);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalAlpha = 0.3 + 0.15 * Math.sin(Date.now() / 130);
        ctx.fillStyle = g;
        ctx.fillRect(fx - 42, fy - 42, 84, 84);
        ctx.globalAlpha = 1;
      }
    }
    if (qa && !rm && Math.random() < 0.3 && an.ch.length < 26) {
      const g = Math.random() * 6.28;
      an.ch.push({ x: fx + Math.cos(g) * 54, y: fy + Math.sin(g) * 54, l: 60 });
    }
    an.ch = an.ch.filter((p) => p.l > 0);
    an.ch.forEach((p) => {
      const v = 0.06 * Math.max(ts, 0.3);
      p.x += (fx - p.x) * v;
      p.y += (fy - p.y) * v;
      p.l--;
      ctx.fillStyle = fc || "#fff";
      ctx.globalAlpha = Math.min(1, p.l / 20);
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2);
    });
    ctx.globalAlpha = 1;
    // tebasan bercahaya
    an.sf = an.sf.filter((f) => f.t < 18);
    an.sf.forEach((f) => {
      drawSlash(f);
      f.t++;
    });
    // bar HP melayang (halus)
    an.eh = an.eh == null ? S.ehp : an.eh + (S.ehp - an.eh) * 0.18;
    an.ph = an.ph == null ? Pl.hp : an.ph + (Pl.hp - an.ph) * 0.18;
    if (!S.dead) {
      const nm = ($("#en").textContent || e.n).split(" — HP")[0];
      floatBar(
        ecx(),
        Math.max(44, ey + bob - 10),
        76,
        clamp(an.eh / e.hp, 0, 1),
        "#ff3d8a",
        "#ff8fc0",
        nm,
        $("#en").style.color || "#ffe6f0",
        $("#ch").textContent,
      );
    }
    floatBar(hx + 50, Math.max(44, hy - 10), 64, clamp(an.ph / mhp(), 0, 1), "#0fd6a0", "#9ff5d8", "Lv" + Pl.lv, "#e9d4ff", "");
    const pnm = posName();
    if (pnm !== an.pl) {
      an.pl = pnm;
      const st = $("#ski");
      if (st && (mode === "m" || mode === "r")) st.innerHTML = padInfo("atk");
    }
    const sk = Math.max(0, (1 - ts) / 0.8);
    if (sk > 0.02) {
      ctx.fillStyle = `rgba(40,70,170,${0.2 * sk})`;
      ctx.fillRect(0, -BDY, VW, VH + BDY);
      const g = ctx.createRadialGradient(VW / 2, (VH - BDY) / 2, 140, VW / 2, (VH - BDY) / 2, 420);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${0.55 * sk})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, -BDY, VW, VH + BDY);
    }
    an.pt = an.pt.filter((p) => p.l > 0);
    an.pt.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.l--;
      ctx.globalAlpha = p.l / 30;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 4, 4);
    });
    ctx.globalAlpha = 1;
    if (an.fx > 0) {
      ctx.fillStyle = `rgba(255,255,255,${an.fx * 0.18})`;
      ctx.fillRect(0, -BDY, VW, VH + BDY);
      an.fx--;
    }
    ctx.font = 'bold 24px "Pixelify Sans",monospace';
    ctx.textAlign = "center";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#000";
    an.fl = an.fl.filter((f) => f.l > 0);
    an.fl.forEach((f) => {
      const y = f.y - (60 - f.l) * 0.9,
        z = (f.s || 1) * (1 + Math.max(0, f.l - 50) * 0.06); // membesar sekejap saat muncul
      f.x += f.vx || 0;
      ctx.font = `bold ${Math.round(24 * z)}px "Pixelify Sans",monospace`;
      ctx.globalAlpha = Math.min(1, f.l / 14);
      ctx.strokeText(f.t, f.x, y);
      ctx.fillStyle = f.c;
      ctx.fillText(f.t, f.x, y);
      f.l--;
    });
    ctx.globalAlpha = 1;
    // penghitung combo di kanan atas
    const hc = an.hc;
    if (hc) {
      if (hc.l <= 0) an.hc = null;
      else {
        hc.l--;
        if (hc.pop > 0) hc.pop--;
        if (hc.n > 1) {
          ctx.save();
          ctx.textAlign = "right";
          ctx.globalAlpha = Math.min(1, hc.l / 30);
          ctx.lineWidth = 5;
          ctx.font = `bold ${Math.round(22 + Math.min(14, hc.n) + hc.pop * 1.4)}px "Pixelify Sans",monospace`;
          ctx.strokeText(hc.n + " HIT", VW - 12, 52);
          ctx.fillStyle = hc.n >= 10 ? "#ff9a3d" : "#ffe14d";
          ctx.fillText(hc.n + " HIT", VW - 12, 52);
          ctx.font = 'bold 13px "Pixelify Sans",monospace';
          ctx.strokeText(hc.d + " damage", VW - 12, 70);
          ctx.fillStyle = "#ffffff";
          ctx.fillText(hc.d + " damage", VW - 12, 70);
          ctx.restore();
        }
      }
    }
    if (sk > 0.02) {
      const h = Math.round(21 * sk);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, -BDY, VW, h);
      ctx.fillRect(0, VH - h, VW, h);
      if (sk > 0.5) {
        ctx.font = 'bold 14px "Pixelify Sans",monospace';
        ctx.fillStyle = fc;
        ctx.fillText("SLOW-MO · JAWAB SEKARANG!", VW / 2, h + 36 - BDY);
      }
    }
    ctx.restore(); // akhir translasi arena
    if (sh) ctx.restore();
    if (an.se > 0) an.se--;
    if (an.sp > 0) an.sp--;
    if (an.lg > 0) an.lg--;
    if (an.rc > 0) an.rc--;
  }
  requestAnimationFrame(draw);
}
document.addEventListener("keydown", (e) => {
  if (UIX.open || e.ctrlKey || e.metaKey || e.altKey) return;
  const inInput = document.activeElement.tagName === "INPUT";
  if (mode === "q" && /^[1-4]$/.test(e.key) && !inInput) {
    const b = document.querySelectorAll("[data-o]")[+e.key - 1];
    if (b && !b.disabled) {
      e.preventDefault();
      b.click();
    }
  }
  // menu aksi battle: angka memilih tombol sesuai urutan
  if ((mode === "m" || mode === "r") && /^[1-9qws]$/i.test(e.key) && !inInput) {
    const b = document.querySelector(`#sk [data-k="${e.key.toLowerCase()}"]`);
    if (b) {
      e.preventDefault();
      b.click();
    }
  }
  if (mode === "q" && e.key.toLowerCase() === "h" && !inInput) {
    e.preventDefault();
    hint();
  }
});

/* tombol jeda di pojok kanan atas (tampil saat battle) membuka Pengaturan */
if ($("#bpz")) $("#bpz").onclick = () => UIX.settings();

/* ---------- gerak maju/mundur saat battle: A/D, ←/→, atau tombol ◀ ▶ (layar sentuh) ---------- */
let bmove = 0;
const bkeys = {};
const setMove = () => (bmove = (bkeys[1] ? 1 : 0) - (bkeys[-1] ? 1 : 0));
{
  const MV = { arrowleft: -1, a: -1, arrowright: 1, d: 1 };
  document.addEventListener("keydown", (e) => {
    const m = MV[e.key.toLowerCase()];
    if (!m || !S || W.on || UIX.open || e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.activeElement?.tagName === "INPUT") return;
    if (mode !== "m" && mode !== "r" && mode !== "i") return;
    e.preventDefault();
    bkeys[m] = 1;
    setMove();
  });
  document.addEventListener("keyup", (e) => {
    const m = MV[e.key.toLowerCase()];
    if (!m) return;
    delete bkeys[m];
    setMove();
  });
  addEventListener("blur", () => {
    bkeys[1] = bkeys[-1] = 0;
    setMove();
  });
  document.querySelectorAll("#bmv [data-m]").forEach((b) => {
    const m = +b.dataset.m,
      off = () => {
        bkeys[m] = 0;
        setMove();
      };
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      b.setPointerCapture?.(e.pointerId);
      bkeys[m] = 1;
      setMove();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => b.addEventListener(t, off));
  });
}

/* ---------- lompat (maks. 2x di udara): Spasi, ↑, J, atau tombol ▲ (layar sentuh) ---------- */
{
  const isJ = (e) => e.key === " " || e.key === "ArrowUp" || e.key.toLowerCase() === "j",
    live = () => S && !W.on && !UIX.open && (mode === "m" || mode === "r");
  document.addEventListener("keydown", (e) => {
    if (!isJ(e) || e.ctrlKey || e.metaKey || e.altKey || !live()) return;
    if (document.activeElement?.tagName === "INPUT") return;
    e.preventDefault();
    if (!e.repeat) doJump();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === " " && live()) e.preventDefault(); // cegah Spasi "mengklik" tombol yang sedang fokus
  });
  const jb = $("#bjp");
  if (jb)
    jb.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      doJump();
    });
}
