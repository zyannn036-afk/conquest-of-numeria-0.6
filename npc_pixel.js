/* ===== Numeria Quest — sprite NPC 144x192 (resolusi tinggi, gaya hero_pixel) =====
   Dimuat setelah hero_pixel.js. Tidak mengubah sprite lama (SP.*) — ini sistem tambahan.
   v2: kanvas 144x192 (sebelumnya 96x128), tinggi tubuh ~180 baris dengan proporsi seperti hero,
       shading 5 nada (sorot / dasar / bayangan / bayangan dalam), garis tepi selektif, rambut & wajah lebih detail.

   Pakai (API sama seperti sebelumnya):
     NPCPX.canvas("kakek")            -> <canvas> NPCPX.W x NPCPX.H (frame 0), di-cache
     NPCPX.canvas("kakek", 1)         -> frame 1 (napas / idle)
     NPCPX.draw(ctx, "kakek", x, y, skala, balik, frame)   // (x,y) = pojok kiri-atas
     NPCPX.vary("petani", 7)          -> spec varian (warna kulit/rambut/baju diacak, peran tetap)
     NPCPX.register("tabib", {...spec})   // tambah NPC baru
   Baru: NPCPX.W / NPCPX.H dipakai kode lain (jangan di-hardcode). Preset baru: "pedagangkuno", "seniman" (didesain ulang). */
const NPCPX = (() => {
  const W = 144,
    H = 192,
    CX = 72,
    GY = 186; /* garis pijak kaki */

  /* ---------- warna ---------- */
  const hx = (h) => {
    h = h.replace("#", "");
    if (h.length === 3) h = [...h].map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const rgb = (c) => (typeof c === "string" ? hx(c) : c);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const lite = (c, t) => mix(rgb(c), [255, 238, 205], t);
  const dk = (c, t) => mix(rgb(c), [26, 14, 52], t);
  const OUT = [22, 14, 32];
  const tones = (c) => [dk(c, 0.5), dk(c, 0.25), rgb(c), lite(c, 0.2), lite(c, 0.45)];

  /* palet umum (dipakai variasi) */
  const SKIN = ["#f0c8a8", "#e8b890", "#d49a6a", "#b87a50", "#8a5a3a"];
  const HAIR = ["#2a1c14", "#4a3322", "#6b3a26", "#a8742e", "#d8b04a", "#c05a3a", "#6a4a8a"];
  const GREY = ["#e6e6e6", "#cfcfd8", "#b8b8c4"];
  const CLOTH = ["#4f8a4f", "#3a5fa8", "#2f4a86", "#b8403a", "#7a4a9a", "#8a5a3a", "#3a8a8a", "#d87a9a", "#e8dcc0", "#6a6a7a", "#c8883a"];
  const BOTT = ["#7a5a3a", "#4a4a5a", "#3a4a6a", "#5a4a3a", "#2f4a86", "#4a3a2a"];
  const LIGHT = ["#f4efe0", "#e8dcc0", "#d8e4f0"];

  /* ---------- bentuk dasar (mask) ---------- */
  const ell = (cx, cy, rx, ry) => ({ x0: cx - rx, y0: cy - ry, x1: cx + rx, y1: cy + ry, f: (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 });
  const cap = (ax, ay, bx, by, ra, rb = ra) => {
    const dx = bx - ax,
      dy = by - ay,
      l2 = dx * dx + dy * dy || 1,
      m = Math.max(ra, rb);
    return {
      x0: Math.min(ax, bx) - m, y0: Math.min(ay, by) - m, x1: Math.max(ax, bx) + m, y1: Math.max(ay, by) + m,
      f: (x, y) => {
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)),
          r = ra + (rb - ra) * t,
          ex = ax + dx * t - x,
          ey = ay + dy * t - y;
        return ex * ex + ey * ey <= r * r;
      },
    };
  };
  const poly = (pts) => {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
    const oy = Math.floor(y0),
      rows = [];
    for (let iy = oy; iy <= Math.ceil(y1); iy++) {
      const yy = iy + 0.5,
        xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i],
          [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + ((yy - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      rows[iy - oy] = xs;
    }
    return {
      x0, y0, x1, y1,
      f: (x, y) => {
        const xs = rows[Math.floor(y) - oy];
        if (!xs) return false;
        let n = 0;
        for (let i = 0; i < xs.length; i++) if (xs[i] <= x) n++;
        return n & 1;
      },
    };
  };
  const rr = (x, y, w, h, r = 2) => ({
    x0: x, y0: y, x1: x + w, y1: y + h,
    f: (px, py) => {
      if (px < x || py < y || px > x + w || py > y + h) return false;
      const cx = px < x + r ? x + r : px > x + w - r ? x + w - r : px,
        cy = py < y + r ? y + r : py > y + h - r ? y + h - r : py;
      return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
    },
  });
  /* kurva Catmull-Rom */
  const spl = (p, closed = false, n = 6) => {
    const o = [],
      N = p.length,
      g = (i) => (closed ? p[(i + N) % N] : p[Math.max(0, Math.min(N - 1, i))]);
    for (let i = 0; i < (closed ? N : N - 1); i++) {
      const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        o.push([
          0.5 * (2 * b[0] + (-a[0] + c[0]) * t + (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 + (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
          0.5 * (2 * b[1] + (-a[1] + c[1]) * t + (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 + (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3),
        ]);
      }
    }
    if (!closed) o.push(p[N - 1]);
    return o;
  };
  /* bentuk simetris: pts = sisi kanan [dx,y] dari atas ke bawah (dihaluskan), dicerminkan ke kiri */
  const sym = (cx, pts, smooth = true) => {
    const r = smooth ? spl(pts, false, 5) : pts,
      l = r.slice().reverse().map(([x, y]) => [cx - x, y]);
    return poly([...r.map(([x, y]) => [cx + x, y]), ...l]);
  };
  /* interpolasi kubik Hermite (lebar badan terhadap y) */
  const interp = (K, y) => {
    if (y <= K[0][0]) return K[0][1];
    if (y >= K[K.length - 1][0]) return K[K.length - 1][1];
    let i = 0;
    while (K[i + 1][0] < y) i++;
    const [y0, v0] = K[i], [y1, v1] = K[i + 1],
      pm = K[i - 1] || K[i], pn = K[i + 2] || K[i + 1],
      m0 = (v1 - (pm[1])) / (y1 - pm[0]) * (y1 - y0),
      m1 = (pn[1] - v0) / (pn[0] - y0) * (y1 - y0),
      t = (y - y0) / (y1 - y0), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * v0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * v1 + (t3 - t2) * m1;
  };

  /* ---------- tipe badan ---------- */
  const BODY = {
    m: { sc: 1.0, hsc: 1.0, sh: 25, wa: 17, hp: 19, lg: 9.5, ar: 5.8 },
    f: { sc: 0.96, hsc: 0.98, sh: 20, wa: 13.5, hp: 18, lg: 8.6, ar: 4.8 },
    old: { sc: 0.92, hsc: 1.0, sh: 22, wa: 18, hp: 18.5, lg: 8.6, ar: 5.2, stoop: 4 },
    kid: { sc: 0.66, hsc: 1.14, sh: 17, wa: 14.5, hp: 15, lg: 7.2, ar: 4.4 },
  };

  /* ---------- mesin gambar (buffer piksel murni, tanpa DOM) ---------- */
  function render(S0, frame) {
    const S = withGear(S0),
      d = new Uint8ClampedArray(W * H * 4),
      ids = new Uint16Array(W * H),
      nl = [0],
      by = frame ? 1 : 0;
    let nid = 0;

    /* ----- primitif piksel ----- */
    const put = (x, y, c, a = 1, keep = true) => {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = (y * W + x) * 4;
      if (a < 1 && d[i + 3]) {
        d[i] = d[i] + (c[0] - d[i]) * a; d[i + 1] = d[i + 1] + (c[1] - d[i + 1]) * a; d[i + 2] = d[i + 2] + (c[2] - d[i + 2]) * a;
      } else {
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
        if (!keep || !ids[y * W + x]) ids[y * W + x] = nid || 1;
      }
    };
    /* titik/kotak detail: tidak membuat garis tepi */
    const dot = (x, y, col, w = 1, h = 1, a = 1) => {
      const c = rgb(col);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const X = Math.round(x + i), Y = Math.round(y + j);
        if (X >= 0 && Y >= 0 && X < W && Y < H && d[(Y * W + X) * 4 + 3]) put(X, Y, c, a);
      }
    };
    const line = (x0, y0, x1, y1, col, t = 1, a = 1) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let k = 0; k <= n; k++) dot(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), col, t, t, a);
    };
    const stroke = (x0, y0, x1, y1, w, c) => fill(cap(x0, y0, x1, y1, w / 2, w / 2), c, { flat: true });
    const glows = [];
    /* isi bentuk dengan shading cahaya kiri-atas */
    const fill = (sh, c, o = {}) => {
      const x0 = Math.max(0, Math.floor(sh.x0)), y0 = Math.max(0, Math.floor(sh.y0)),
        x1 = Math.min(W - 1, Math.ceil(sh.x1)), y1 = Math.min(H - 1, Math.ceil(sh.y1));
      if (x1 < x0 || y1 < y0) return;
      const bw = x1 - x0 + 3, bh = y1 - y0 + 3, m = new Uint8Array(bw * bh);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (sh.f(x + 0.5, y + 0.5)) m[(y - y0 + 1) * bw + (x - x0 + 1)] = 1;
      const inn = (x, y) => {
        const i = x - x0 + 1, j = y - y0 + 1;
        return i >= 0 && j >= 0 && i < bw && j < bh && m[j * bw + i] === 1;
      };
      const T = o.flat ? null : tones(c), base = rgb(c),
        k = o.k || Math.max(2, Math.min(4, Math.round(Math.min(sh.x1 - sh.x0, sh.y1 - sh.y0) / 6.5)));
      if (!o.over) { nid++; if (o.nl) nl[nid] = 1; }
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        if (!inn(x, y)) continue;
        let t = 2;
        if (T) {
          const a = inn(x - k, y - k), b = inn(x + k, y + k);
          if (!a && b) t = 3;
          else if (!b && a) { t = 1; if (o.deep !== false && !inn(x + 2, y + 2)) t = 0; }
          if (o.dith && t === 2) {
            if (!inn(x + k + 2, y + k + 2) && ((x + y) & 1) === 0) t = 1;
            else if (!inn(x - k - 2, y - k - 2) && ((x + y) & 1) === 0) t = 3;
          }
          if (o.shine && t === 3 && !inn(x - 2, y - 2)) t = 4;
        }
        let col = T ? T[t] : base;
        if (o.tex) { const q = o.tex(x, y, t); if (q) col = rgb(q); }
        put(x, y, col, o.a == null ? 1 : o.a, !!o.over);
      }
    };

    /* ----- tata letak ----- */
    const B = BODY[S.body || "m"],
      fat = S.fat || 1,
      sc = B.sc, hs = B.hsc,
      fem = S.body === "f" || !!S.fem,
      kid = S.body === "kid",
      old = S.body === "old",
      bt = 10 * sc,
      ankle = GY - bt + 1,
      knee = ankle - 34 * sc,
      hip = knee - 36 * sc,
      sy0 = hip - 54 * sc + (B.stoop || 0),
      sy = sy0 + by,
      chin = sy - 5 * sc,
      hy = chin - 18.6 * hs,
      shw = B.sh * fat, waw = B.wa * fat, hpw = B.hp * fat, lgw = B.lg * (fat > 1 ? 1.06 : 1),
      waistY = sy + (hip - sy) * 0.8,
      hemY = S.hemY != null ? S.hemY : hip + 13 * sc,
      skin = S.skin || SKIN[1],
      hair = S.hair || "#4a3322",
      boots = S.boots || "#5a3a22",
      bott = S.bottom || "#5a4a3a",
      top = S.top || "#4f8a4f",
      eyc = S.eyes || "#5a3a2a";
    /* lebar badan terhadap y */
    const bK = [
      [sy - 4, 4.5], [sy - 1, 11], [sy + 2, shw - 4], [sy + 6, shw - 0.5], [sy + 18, shw - 2.5],
      [sy + (hip - sy) * 0.5, waw + (fem ? 2.2 : 3)], [waistY, waw], [hip - 2, hpw - 1], [hip + 4, hpw], [hemY, hpw + 1.5],
    ];
    const hw = (y) => interp(bK, y);
    const skirtLen = S.skirtLen || 26;
    const lc = (sg) => CX + sg * (lgw * 0.55 + 1.5); /* pusat kaki */

    /* tangan: IK 2-segmen (bahu -> siku -> tangan), siku mengarah keluar */
    const ua = 27 * sc, fa = 25 * sc;
    const shoulder = (sg) => [CX + sg * (shw - 3.5), sy + 7];
    const armPts = (sg, hnd) => {
      const s = shoulder(sg);
      let dx = hnd[0] - s[0], dy = hnd[1] - s[1], dd = Math.hypot(dx, dy);
      const mx = ua + fa - 0.6;
      if (dd > mx) { dx *= mx / dd; dy *= mx / dd; dd = mx; hnd = [s[0] + dx, s[1] + dy]; }
      const a = (ua * ua - fa * fa + dd * dd) / (2 * dd), hgt = Math.sqrt(Math.max(0, ua * ua - a * a)),
        ex = s[0] + (dx * a) / dd, ey = s[1] + (dy * a) / dd;
      let nx = -dy / dd, ny = dx / dd;
      if (nx * sg < 0) { nx = -nx; ny = -ny; } /* keluar */
      return [s, [ex + nx * hgt, ey + ny * hgt], hnd];
    };
    const handDef = (sg) => [CX + sg * (shw + 1.5), sy + 7 + Math.sqrt(((ua + fa) * 0.985) ** 2 - 25)];
    const P = S.prop, pc = S.propCol;
    const twoHand = P === "staff" || P === "fork" || P === "axe" || P === "hammer" || P === "spear";
    let RH = handDef(1), LH = handDef(-1);
    if (P === "fork" || P === "axe" || P === "hammer" || P === "staff" || P === "spear" || P === "sword" || P === "cane" || P === "dagger") RH = [CX + shw + 4, sy + 7 + 47 * sc];
    if (P === "lantern") RH = [CX + shw + 3, sy + 7 + 42 * sc];
    if (P === "rod") RH = [CX + shw + 5, sy + 7 + 40 * sc];
    if (P === "brush") RH = [CX + shw + 5, sy + 7 + 30 * sc];
    if (P === "scroll") RH = [CX + shw + 3, sy + 7 + 42 * sc];
    if (P === "book") LH = [CX - shw + 3, sy + 7 + 38 * sc];
    if (P === "bow") LH = [CX - shw - 10, sy + 24 * sc];
    if (P === "shield") LH = [CX - shw - 3, sy + 34 * sc];
    if (P === "basket" || P === "bread") LH = [CX - shw - 3, sy + 7 + (ua + fa) * 0.93];
    if (S.palette) LH = [CX - shw - 2, sy + 7 + 40 * sc];
    if (S.lantern2) LH = [CX - shw - 5, waistY - 2];
    RH[1] += by; LH[1] += by;

    const ink = (c, t = 0.35) => dk(c, t);

    /* ===== 1. lapisan belakang ===== */
    /* jubah */
    if (S.cape) {
      const c = S.cape, wob = 0;
      fill(poly(spl([[CX - 13, sy - 2], [CX - shw - 4, sy + 8], [CX - shw - 9, sy + 60], [CX - shw - 13, GY - 18], [CX - shw - 8, GY - 8], [CX, GY - 12], [CX + shw + 8, GY - 8], [CX + shw + 13, GY - 18], [CX + shw + 9, sy + 60], [CX + shw + 4, sy + 8], [CX + 13, sy - 2]], true, 5)), c, { dith: true });
      if (S.capeTrim) line(CX - shw - 11, GY - 12, CX + shw + 11, GY - 12, S.capeTrim, 2);
      for (let i = -3; i <= 3; i++) line(CX + i * 11, sy + 40, CX + i * 12, GY - 14, dk(c, 0.3), 1, 0.7);
    }
    /* ransel / barang dagangan */
    if (S.pack === "wares") {
      const pk = "#8a6a3a";
      /* karpet gulung di atas bahu */
      fill(rr(CX - 28, sy - 12, 56, 14, 6), "#a8362f", { dith: true });
      line(CX - 22, sy - 10, CX - 22, sy + 0, "#e8c04a", 2); line(CX + 22, sy - 10, CX + 22, sy + 0, "#e8c04a", 2);
      for (let i = 0; i < 4; i++) dot(CX - 18 + i * 12, sy - 8, "#e8c04a", 4, 2);
      fill(ell(CX - 28, sy - 5, 4, 7), "#d8584a");
      fill(ell(CX + 28, sy - 5, 4, 7), "#d8584a");
      /* guci kecil kiri, tabung gulungan kanan */
      fill(poly(spl([[CX - 36, sy + 4], [CX - 40, sy + 18], [CX - 36, sy + 34], [CX - 26, sy + 34], [CX - 22, sy + 18], [CX - 26, sy + 4]], true, 4)), "#c8783a", { dith: true });
      fill(rr(CX - 34, sy + 1, 10, 5, 2), "#8a4a22");
      line(CX - 38, sy + 16, CX - 24, sy + 16, "#e8c04a", 2);
      fill(rr(CX + 30, sy - 22, 6, 36, 2), "#e8dcc0");
      fill(rr(CX + 36, sy - 14, 6, 30, 2), "#d8c8a0");
      dot(CX + 30, sy - 8, "#b8362f", 6, 2); dot(CX + 36, sy, "#b8362f", 6, 2);
      /* kotak peti punggung */
      fill(rr(CX - 24, sy + 4, 48, 56, 5), pk, { dith: true });
      for (let i = 0; i < 6; i++) line(CX - 22, sy + 10 + i * 9, CX + 22, sy + 10 + i * 9, dk(pk, 0.35), 1, 0.7);
      line(CX - 14, sy + 4, CX - 14, sy + 60, "#4a3220", 2); line(CX + 14, sy + 4, CX + 14, sy + 60, "#4a3220", 2);
    } else if (S.pack) {
      fill(rr(CX - shw - 5, sy + 2, shw * 2 + 10, 52, 8), S.pack, { dith: true });
      fill(rr(CX - shw + 1, sy - 8, shw * 2 - 2, 14, 6), dk(S.pack, 0.15));
      line(CX - shw + 5, sy + 6, CX - shw + 5, sy + 46, dk(S.pack, 0.35), 1);
    }
    /* rambut belakang */
    const hxr = 14 * hs;
    if (S.hs === "long") {
      const L2 = (S.hairLen || 44) * hs;
      fill(poly(spl([[CX - 17 * hs, hy - 8], [CX - 20 * hs, hy + 12], [CX - 22 * hs, hy + L2 * 0.6], [CX - 15 * hs, hy + L2], [CX - 5, hy + L2 - 2], [CX + 5, hy + L2 - 2], [CX + 15 * hs, hy + L2], [CX + 22 * hs, hy + L2 * 0.6], [CX + 20 * hs, hy + 12], [CX + 17 * hs, hy - 8], [CX, hy - 22 * hs]], true, 5)), hair, { shine: true });
    }
    if (S.hs === "pony") {
      const px0 = CX + 12 * hs;
      fill(poly(spl([[px0, hy - 9], [px0 + 11, hy - 4], [px0 + 17, hy + 14], [px0 + 13, hy + 38], [px0 + 5, hy + 46], [px0 + 5, hy + 28], [px0 + 1, hy + 8]], true, 4)), hair, { shine: true });
    }
    if (S.hs === "bun") fill(ell(CX, hy - 24 * hs, 9, 8), hair, { shine: true });

    /* ===== 2. kaki & sepatu ===== */
    const dressSkirt = S.dress && !S.robe,
      curl = S.curl;
    for (const sg of [-1, 1]) {
      const x = lc(sg),
        r0 = lgw * (S.baggy ? 1.3 : 1), r1 = lgw * (S.baggy ? 1.22 : 0.82), r2 = lgw * (S.baggy ? 0.74 : 0.6);
      if (dressSkirt) {
        const sock = S.sock || skin;
        fill(cap(x, hip + 10, x, ankle, r1 - 1, r2 + 0.5), sock, { dith: true });
      } else {
        fill(cap(x, hip + 2, x - sg * 0.5, knee, r0, r1), bott, { dith: true });
        fill(cap(x - sg * 0.5, knee - 1, x, ankle + 1, r1, r2), bott, { dith: true });
        /* lipatan lutut & celana */
        line(x - r1 + 2, knee + 1, x + r1 - 3, knee + 3, dk(bott, 0.32), 1, 0.9);
        line(x - r1 + 4, knee - 8, x - r1 + 7, knee - 3, dk(bott, 0.22), 1, 0.8);
        if (S.baggy) line(x - r2 - 1, ankle - 4, x + r2 + 1, ankle - 4, S.sash || "#b8362f", 2);
      }
      /* sepatu */
      const toe = S.curl ? 12 : 8, sw = r2 + 1.8;
      const m2 = (dx, y) => [x + sg * dx, y];
      const bpts = [
        m2(-sw, ankle - 12 * sc), m2(sw, ankle - 12 * sc), m2(sw + 0.5, ankle - 3), m2(sw + toe * 0.55, GY - (curl ? 9 : 7) * sc), m2(sw + toe, GY - (curl ? 11 : 4) * sc),
        m2(sw + toe - (curl ? 3 : -0.5), GY), m2(-sw - 0.5, GY), m2(-sw - 1, ankle - 4),
      ];
      fill(poly(spl(bpts, true, 3)), boots, { shine: true, dith: true });
      const fx0 = Math.min(x - sg * (sw + 0.5), x + sg * (sw + toe + 0.5)), fw = sw + toe + sw + 1;
      dot(fx0, GY - 2, dk(boots, 0.62), fw, 2);
      dot(fx0, GY - 3, lite(boots, 0.12), fw, 1, 0.5);
      if (S.cuffBoot !== false) line(x - sw + 1, ankle - 11 * sc, x + sw - 1, ankle - 11 * sc, lite(boots, 0.28), 1);
    }

    /* ===== 3. badan ===== */
    const torsoPts = () => {
      const o = [];
      for (let y = sy - 4; y <= hemY; y += 2) o.push([hw(y), y]);
      return o;
    };
    const tp = torsoPts();
    const torsoShape = () => {
      const r = tp.map(([w, y]) => [CX + w, y]), l = tp.slice().reverse().map(([w, y]) => [CX - w, y]);
      return poly([...r, ...l]);
    };
    /* baju dalam kelihatan di leher */
    const inner = S.inner || lite(top, 0.55);

    /* rok / jubah panjang di belakang badan agar tidak menutup pinggang */
    const lowerGarment = () => {
      if (!S.dress) return;
      const y0 = waistY - 2,
        len = S.robe ? ankle - 2 - y0 : Math.min(skirtLen * sc + 10, ankle - 20 - y0),
        yb = y0 + len,
        fl = S.robe ? 16 : kid ? 10 : 14,
        wide = (y) => hw(Math.min(y, hemY)) + ((y - y0) / len) ** 1.3 * fl;
      const R = [], Lh = [];
      for (let y = y0; y <= yb; y += 2) { R.push([CX + wide(y) + Math.sin(y * 0.5) * 0.0, y]); Lh.push([CX - wide(y), y]); }
      /* bagian bawah bergelombang */
      const hemWave = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; hemWave.push([CX + wide(yb) - t * wide(yb) * 2, yb + (i % 2 ? 2 : 0)]); }
      fill(poly([...R, ...hemWave, ...Lh.reverse()]), bott, { dith: true });
      /* lipatan kain */
      for (let i = -3; i <= 3; i++) {
        const sx = CX + i * (wide(yb) / 3.4);
        line(CX + i * 4, y0 + 12, sx, yb - 1, dk(bott, 0.28), 1, 0.75);
        line(CX + i * 4 - 2, y0 + 14, sx - 3, yb - 4, lite(bott, 0.18), 1, 0.55);
      }
      if (S.trim) { line(CX - wide(yb) + 1, yb - 3, CX + wide(yb) - 1, yb - 3, S.trim, 2); for (let i = 0; i < 10; i++) dot(CX - wide(yb) + 4 + i * (wide(yb) * 2 - 8) / 10, yb - 7, S.trim, 2, 2); }
    };
    /* jaket panjang terbuka (pedagang kuno) */
    const coatLong = S.coat;
    lowerGarment();

    /* torso */
    fill(torsoShape(), top, { dith: true });
    /* baju dalam & leher-V */
    if (!S.plate && !S.shawl) {
      fill(poly([[CX - 7, sy - 4], [CX + 7, sy - 4], [CX + 3, sy + 12], [CX, sy + 17], [CX - 3, sy + 12]]), inner, { over: false });
      fill(poly([[CX - 8, sy - 3], [CX - 3, sy - 3], [CX, sy + 12], [CX - 1, sy + 12]]), dk(top, 0.15), { over: true, flat: true });
    }
    /* lipatan dada & perut */
    for (const sg of [-1, 1]) {
      line(CX + sg * 11, sy + 14, CX + sg * 8, sy + 36, dk(top, 0.28), 1, 0.7);
      line(CX + sg * 13, waistY - 12, CX + sg * 9, waistY, dk(top, 0.25), 1, 0.7);
    }
    if (S.plate) {
      const pl = S.plate, sm = S.plateSm;
      fill(poly(spl([[CX - shw + 6, sy + 4], [CX, sy + 1], [CX + shw - 6, sy + 4], [CX + waw + 2, sy + 28], [CX + waw - 2, waistY - 2], [CX, waistY + 2], [CX - waw + 2, waistY - 2], [CX - waw - 2, sy + 28]], true, 5)), pl, { shine: !sm, dith: sm });
      line(CX, sy + 5, CX, waistY, lite(pl, 0.35), 1);
      line(CX - waw + 4, sy + 24, CX + waw - 4, sy + 24, dk(pl, 0.3), 1, 0.8);
      if (sm) for (let i = 0; i < 6; i++) { dot(CX - 11 + i * 4, sy + 10, dk(pl, 0.4), 1, 1); }
      else { dot(CX - 12, sy + 9, "#f0e0a0", 2, 2); dot(CX + 10, sy + 9, "#f0e0a0", 2, 2); }
    }
    if (S.vest) {
      for (const sg of [-1, 1]) {
        const a = [], b = [];
        for (let y = sy + 1; y <= hemY - 3; y += 2) { a.push([CX + sg * (hw(y) - 0.5), y]); b.push([CX + sg * (4 + (y - sy) * 0.18), y]); }
        fill(poly([...a, ...b.reverse()]), S.vest, { dith: true });
      }
    }
    if (S.bib) {
      fill(poly([[CX - 9, sy + 2], [CX - 6, sy + 2], [CX - 6, sy + 18], [CX + 6, sy + 18], [CX + 6, sy + 2], [CX + 9, sy + 2], [CX + 11, sy + 20], [CX + 11, waistY + 8], [CX - 11, waistY + 8], [CX - 11, sy + 20]]), S.bib, { dith: true });
      dot(CX - 8, sy + 16, "#e8c84a", 3, 3); dot(CX + 5, sy + 16, "#e8c84a", 3, 3);
      fill(rr(CX - 6, sy + 28, 12, 9, 1), dk(S.bib, 0.15), { over: true });
    }
    if (S.apron) {
      const ln = (S.dress ? skirtLen * 0.85 : 30) * sc,
        ay = sy + 14;
      fill(poly([[CX - 8, sy + 1], [CX - 5, sy + 1], [CX - 7, ay], [CX + 7, ay], [CX + 5, sy + 1], [CX + 8, sy + 1], [CX + 12, ay + 3], [CX + 14, waistY + ln - 14], [CX - 14, waistY + ln - 14], [CX - 12, ay + 3]]), S.apron, { dith: true });
      fill(rr(CX - 7, ay + 12, 14, 9, 1), dk(S.apron, 0.12), { over: true });
      line(CX - 7, ay + 12, CX + 7, ay + 12, dk(S.apron, 0.3), 1);
    }
    /* percikan cat */
    if (S.splat) {
      const r = rng(41), cols = S.splat;
      for (let i = 0; i < 30; i++) {
        const sx = CX - 20 + r() * 40, sy2 = sy + 12 + r() * (waistY - sy - 8), c = cols[(r() * cols.length) | 0], s = 2 + ((r() * 3) | 0);
        if (d[((sy2 | 0) * W + (sx | 0)) * 4 + 3]) dot(sx, sy2, c, s, s);
      }
    }
    if (coatLong) {
      /* jaket panjang: dua panel menutupi sisi, bagian depan terbuka menampakkan baju dalam */
      const yb = knee + 10;
      for (const sg of [-1, 1]) {
        const a = [], b = [];
        for (let y = sy; y <= yb; y += 2) {
          a.push([CX + sg * (hw(Math.min(y, hemY)) + (y > hemY ? (y - hemY) * 0.22 : 0) - 0.3), y]);
          b.push([CX + sg * (5 + Math.max(0, (y - waistY)) * 0.35), y]);
        }
        fill(poly([...a, ...b.reverse()]), S.coat, { dith: true });
        const x2 = CX + sg * (hw(hemY) + (yb - hemY) * 0.22);
        if (S.trim) { line(CX + sg * 5 + sg * (yb - waistY) * 0.35, yb - 1, x2, yb - 1, S.trim, 2); line(CX + sg * 5, sy + 2, CX + sg * (5 + (yb - waistY) * 0.35), yb, S.trim, 1); }
      }
    }
    if (S.belt) {
      fill(rr(CX - hw(waistY) - 0.5, waistY - 3, hw(waistY) * 2 + 1, 6, 1), S.belt, { dith: true });
      fill(rr(CX - 3, waistY - 3, 6, 6, 1), "#e8c84a", { shine: true });
      dot(CX - 1, waistY - 1, dk("#e8c84a", 0.4), 2, 2);
    }
    if (S.sash) {
      /* selendang pinggang lebar + simpul + ujung */
      fill(poly([[CX - hw(waistY) - 1, waistY - 7], [CX + hw(waistY) + 1, waistY - 7], [CX + hw(waistY) + 2, waistY + 7], [CX - hw(waistY) - 2, waistY + 7]]), S.sash, { dith: true });
      for (let i = 0; i < 7; i++) line(CX - 18 + i * 6, waistY - 6, CX - 15 + i * 6, waistY + 6, dk(S.sash, 0.3), 1, 0.7);
      fill(poly([[CX + 6, waistY + 4], [CX + 15, waistY + 24], [CX + 9, waistY + 25], [CX + 3, waistY + 8]]), S.sash);
      fill(poly([[CX + 2, waistY + 5], [CX + 6, waistY + 26], [CX - 1, waistY + 24], [CX - 3, waistY + 8]]), dk(S.sash, 0.12));
      dot(CX + 5, waistY + 25, "#e8c04a", 2, 1); dot(CX + 10, waistY + 24, "#e8c04a", 2, 1);
      fill(ell(CX + 2, waistY, 5, 5), lite(S.sash, 0.08));
    }
    if (S.pouch) {
      const px0 = CX - hw(waistY) - 2;
      fill(poly(spl([[px0 - 2, waistY + 6], [px0 - 6, waistY + 16], [px0 + 1, waistY + 24], [px0 + 9, waistY + 16], [px0 + 5, waistY + 6]], true, 4)), "#7a4a22", { dith: true });
      line(px0 - 1, waistY + 7, px0 + 5, waistY + 7, "#e8c04a", 2);
      dot(px0 + 1, waistY + 14, "#e8c04a", 3, 3);
    }
    if (S.buttons) for (let k = 0; k < 4; k++) { dot(CX - 1, sy + 10 + k * 10, "#f0d060", 3, 3); dot(CX, sy + 10 + k * 10, "#fff4b0", 1, 1); }
    if (S.epaulet) {
      for (const sg of [-1, 1]) {
        fill(poly([[CX + sg * (shw - 14), sy - 1], [CX + sg * (shw + 1), sy + 3], [CX + sg * (shw + 1), sy + 9], [CX + sg * (shw - 14), sy + 4]]), "#e8c84a", { shine: true });
        for (let i = 0; i < 5; i++) dot(CX + sg * (shw - 13 + i * 3) - (sg < 0 ? 1 : 0), sy + 9, "#c8a030", 1, 4);
      }
    }
    if (S.shawl) {
      fill(poly(spl([[CX - 12, sy - 4], [CX - shw - 6, sy + 6], [CX - shw - 4, sy + 24], [CX, sy + 34], [CX + shw + 4, sy + 24], [CX + shw + 6, sy + 6], [CX + 12, sy - 4], [CX, sy + 8]], true, 5)), S.shawl, { dith: true });
      for (let i = -4; i <= 4; i++) line(CX + i * 5, sy + 20 + Math.abs(i) * -1.2 + 8, CX + i * 6, sy + 33 - Math.abs(i) * 1.8, dk(S.shawl, 0.35), 1);
    }
    if (S.collar) {
      fill(poly(spl([[CX - 10, sy - 5], [CX + 10, sy - 5], [CX + 12, sy + 3], [CX, sy + 8], [CX - 12, sy + 3]], true, 4)), S.collar, { dith: true });
      fill(poly([[CX - 3, sy + 4], [CX + 3, sy + 4], [CX + 7, sy + 22], [CX - 2, sy + 18]]), dk(S.collar, 0.1));
    }
    if (S.cape) {
      /* kancing jubah di bahu + rantai */
      dot(CX - 12, sy + 2, "#ffd166", 5, 4); dot(CX + 7, sy + 2, "#ffd166", 5, 4);
      line(CX - 8, sy + 5, CX + 8, sy + 5, "#e8c040", 1);
    }
    if (S.bag) {
      line(CX + shw - 5, sy + 1, CX - hw(waistY) + 5, waistY + 6, dk(S.bag, 0.2), 4);
      fill(rr(CX - hw(waistY) - 8, waistY + 2, 24, 20, 3), S.bag, { dith: true });
      fill(rr(CX - hw(waistY) - 8, waistY + 2, 24, 7, 3), dk(S.bag, 0.18));
      dot(CX - hw(waistY) + 2, waistY + 8, "#e8c84a", 3, 3);
    }

    /* ===== 4. lengan & properti ===== */
    const sleeve = S.sleeve || top,
      shortSl = !!S.short,
      ar = B.ar * (fat > 1 ? 1.1 : 1) * (kid ? 1 : 1);
    const drawArm = (sg, hnd, front) => {
      const [s, e, h] = armPts(sg, hnd);
      /* bahu */
      fill(ell(s[0], s[1] - 1, ar + 1.4, ar + 1.4), sleeve, { dith: true });
      const mid = shortSl ? [(s[0] + e[0]) / 2, (s[1] + e[1]) / 2] : e;
      fill(cap(s[0], s[1], e[0], e[1], ar + 0.6, ar), sleeve, { dith: true });
      if (shortSl) {
        fill(cap(mid[0], mid[1], e[0], e[1], ar - 0.3, ar - 0.4), skin);
        fill(cap(s[0], s[1], mid[0], mid[1], ar + 0.6, ar + 0.2), sleeve, { dith: true });
        fill(cap(e[0], e[1], h[0], h[1], ar - 0.6, ar - 1.4), skin);
      } else {
        fill(cap(e[0], e[1], h[0], h[1], ar, ar - 1.1), sleeve, { dith: true });
        const wx = h[0] + (e[0] - h[0]) * 0.18, wy = h[1] + (e[1] - h[1]) * 0.18;
        fill(cap(wx, wy, h[0], h[1], ar - 0.6, ar - 1.0), S.cuff || dk(sleeve, 0.18), { dith: true });
      }
      if (S.plate && !S.plateSm) fill(ell(s[0] + sg * 1, s[1] - 1, ar + 4.5, ar + 3.6), S.plate, { shine: true });
      else if (S.plate) fill(ell(s[0] + sg, s[1] - 1, ar + 3.4, ar + 2.8), dk(S.plate, 0.22), { dith: true });
      if (S.epaulet && false) {}
      return [s, e, h];
    };
    const handShape = (h, sg, fist) => {
      fill(ell(h[0], h[1] + 2.2, fist ? 4.8 : 4.4, fist ? 4.8 : 5), skin, { shine: false });
      if (!fist) dot(h[0] + sg * -2.5, h[1] + 3, dk(skin, 0.3), 1, 4, 0.7);
      if (fist) { for (let i = 0; i < 3; i++) dot(h[0] - 3 + i * 3, h[1] + 3, dk(skin, 0.32), 1, 3, 0.8); }
    };

    /* properti di belakang tangan */
    const rX = RH[0], rY = RH[1], lX = LH[0], lY = LH[1];
    const wood = (x0, y0, x1, y1, w, c = "#8a6a3a") => fill(cap(x0, y0, x1, y1, w / 2, w / 2), c, { dith: true, deep: true });
    const GROUND = GY - 2;
    if (P === "fork") {
      wood(rX, GROUND, rX, 26, 4, "#8a6a3a");
      fill(rr(rX - 9, 22, 18, 5, 2), "#a8b2c2", { shine: true });
      for (const o2 of [-8, -1.5, 5]) fill(poly([[rX + o2, 24], [rX + o2 + 3.5, 24], [rX + o2 + 3, 4], [rX + o2 + 1.7, 0], [rX + o2 + 0.5, 4]]), "#c0c8d4", { shine: true, k: 2 });
    } else if (P === "axe") {
      wood(rX, GROUND, rX, 42, 4, "#7a5a32");
      fill(poly(spl([[rX + 2, 38], [rX + 6, 36], [rX + 18, 32], [rX + 22, 46], [rX + 18, 60], [rX + 6, 56], [rX + 2, 54]], true, 5)), "#9aa4b4", { shine: true });
      line(rX + 19, 36, rX + 20, 56, "#eef4ff", 1);
      fill(rr(rX - 3, 40, 6, 12, 1), "#6a6a78");
    } else if (P === "hammer") {
      wood(rX, GROUND, rX, 56, 4, "#7a5a32");
      fill(rr(rX - 14, 42, 28, 16, 3), "#6a6a78", { shine: true });
      line(rX - 12, 44, rX + 12, 44, "#b0b0c0", 1); fill(rr(rX - 16, 44, 4, 12, 1), "#4a4a58");
    } else if (P === "rod") {
      wood(rX, rY + 2, rX + 36, 8, 3.4, "#7a5a32");
      stroke(rX + 36, 9, rX + 36, 70, 1.2, "#d8dce4");
      fill(ell(rX + 36, 70, 3.2, 5), "#d2403a"); dot(rX + 35, 74, "#f4efe0", 3, 3);
      fill(rr(rX - 6, rY - 3, 7, 9, 2), "#2a2a2a");
    } else if (P === "spear") {
      wood(rX, GROUND, rX, 30, 4, "#8a6a3a");
      fill(poly(spl([[rX, 2], [rX + 5, 14], [rX + 4, 26], [rX - 4, 26], [rX - 5, 14]], true, 4)), "#cfd8e8", { shine: true, k: 2 });
      line(rX, 5, rX, 24, "#ffffff", 1, 0.8);
      fill(rr(rX - 6, 26, 12, 3, 1), "#d8b04a");
      fill(poly([[rX - 5, 30], [rX + 5, 30], [rX + 7, 44], [rX, 40], [rX - 7, 44]]), "#c8383a");
    } else if (P === "staff") {
      wood(rX, GROUND, rX, 24, 4, "#6a4a2a");
      const oc = pc || "#6ac8ff";
      ctxGlow(rX, 16, 18, oc);
      fill(poly(spl([[rX - 9, 8], [rX - 6, 22], [rX, 26], [rX + 6, 22], [rX + 9, 8], [rX + 6, 24], [rX, 29], [rX - 6, 24]], true, 4)), "#8a6a3a", { dith: true });
      fill(ell(rX, 15, 8, 8), oc, { shine: true });
      dot(rX - 4, 10, "#ffffff", 3, 3); dot(rX - 5, 13, "#ffffff", 1, 1, 0.7);
    } else if (P === "sword") {
      const sc2 = S.swordCol || "#cfd8e8", vio = sc2 === "#d9a0ff";
      fill(poly([[rX - 4, 70], [rX + 4, 70], [rX + 4, 14], [rX, 3], [rX - 4, 14]]), sc2, { shine: true, k: 2, deep: false });
      line(rX, 16, rX, 66, lite(sc2, 0.5), 1);
      fill(rr(rX - 11, 70, 22, 5, 2), vio ? "#a24dff" : "#d8b04a", { shine: true });
      fill(rr(rX - 2, 75, 5, 16, 1), "#5a3a22", { dith: true });
      fill(ell(rX, 93, 3.5, 3.5), vio ? "#a24dff" : "#d8b04a", { shine: true });
    } else if (P === "brush") {
      wood(rX + 1, rY + 3, rX + 20, rY - 40, 4, "#7a5a32");
      fill(poly([[rX + 18, rY - 38], [rX + 22, rY - 40], [rX + 27, rY - 54], [rX + 22, rY - 50]]), "#cfd0d4");
      fill(poly([[rX + 22, rY - 50], [rX + 27, rY - 54], [rX + 29, rY - 66], [rX + 23, rY - 62]]), pc || "#ff9ac1", { shine: true });
      dot(rX + 23, rY - 48, pc || "#ff9ac1", 2, 5);
    } else if (P === "dagger") {
      fill(poly([[rX - 3, rY - 2], [rX + 3, rY - 2], [rX + 3, rY - 22], [rX, rY - 30], [rX - 3, rY - 22]]), "#cfd8e8", { shine: true, k: 2 });
      fill(rr(rX - 7, rY - 3, 14, 4, 1), "#d8b04a");
    } else if (P === "cane") {
      wood(rX, GROUND, rX, rY - 6, 3.6, "#6a4a2a");
      fill(poly(spl([[rX - 6, rY - 8], [rX - 6, rY - 14], [rX, rY - 17], [rX + 5, rY - 12], [rX + 3, rY - 6], [rX + 1, rY - 10], [rX, rY - 12], [rX - 3, rY - 9]], true, 4)), "#6a4a2a", { dith: true, k: 2 });
    } else if (P === "scroll") {
      fill(rr(rX - 4, rY - 22, 8, 40, 3), "#e8dcc0", { dith: true });
      fill(rr(rX - 6, rY - 24, 12, 5, 2), "#7a4a22"); fill(rr(rX - 6, rY + 12, 12, 5, 2), "#7a4a22");
      line(rX - 3, rY - 12, rX + 3, rY - 12, "#a89878", 1); line(rX - 3, rY - 6, rX + 3, rY - 6, "#a89878", 1);
      dot(rX - 4, rY - 2, "#b8362f", 8, 3);
    } else if (P === "lantern") {
      /* lentera kuno: tali -> lentera menggantung dari tongkat pendek */
      const lx = rX + 4, ly = rY + 10;
      ctxGlow(lx, ly + 14, 30, pc || "#ffd36a");
      stroke(rX, rY, rX, ly - 6, 2, "#3a2a1a");
      fill(rr(lx - 8, ly - 4, 16, 4, 1), "#8a6a2a", { shine: true });
      fill(rr(lx - 7, ly, 14, 24, 3), pc || "#ffd36a", { shine: true });
      dot(lx - 4, ly + 4, "#fff6c0", 8, 14, 0.8);
      line(lx - 3, ly + 4, lx - 3, ly + 22, "#8a6a2a", 1); line(lx + 3, ly + 4, lx + 3, ly + 22, "#8a6a2a", 1);
      fill(rr(lx - 8, ly + 24, 16, 4, 1), "#8a6a2a", { shine: true });
      fill(poly([[lx - 3, ly - 8], [lx + 3, ly - 8], [lx, ly - 13]]), "#8a6a2a");
    }
    function ctxGlow(x, y, r, c) { glows.push([x, y, r, rgb(c)]); }
    /* busur, perisai, keranjang, buku, palet di sisi kiri */
    if (P === "bow") {
      const bx0 = lX - 4;
      const pts = [];
      for (let j = -40; j <= 40; j += 2) pts.push([bx0 - 8 * Math.cos((j / 40) * 1.4) + 8, lY + j * 1.05]);
      for (let i = 0; i < pts.length - 1; i++) fill(cap(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], 2, 2), "#8a5a32", { flat: true, over: i > 0 });
      stroke(pts[0][0] + 1, pts[0][1], pts[pts.length - 1][0] + 1, pts[pts.length - 1][1], 1.2, "#f0e8d8");
      fill(rr(bx0 - 1, lY - 5, 5, 11, 1), "#4a3222");
    }
    /* lengan kiri lalu kanan (tangan terakhir) */
    const AL = drawArm(-1, LH, true), AR = drawArm(1, RH, true);
    if (P === "shield") {
      const sx = lX - 4, c = pc || "#3a5fa8";
      fill(poly(spl([[sx - 17, sy + 6], [sx + 17, sy + 6], [sx + 17, sy + 38], [sx, sy + 62], [sx - 17, sy + 38]], true, 5)), c, { shine: true, dith: true });
      fill(poly(spl([[sx - 13, sy + 10], [sx + 13, sy + 10], [sx + 13, sy + 36], [sx, sy + 56], [sx - 13, sy + 36]], true, 5)), lite(c, 0.12), { over: true, flat: true, a: 0.5 });
      line(sx, sy + 10, sx, sy + 56, "#f0e0a0", 3); line(sx - 13, sy + 26, sx + 13, sy + 26, "#f0e0a0", 3);
      fill(ell(sx, sy + 26, 4, 4), "#d8b04a", { shine: true });
    }
    if (P === "basket" || P === "bread") {
      const bc = P === "bread" ? "#c8985a" : "#b8863b", hy2 = lY + 14;
      fill(poly(spl([[lX - 18, hy2 - 2], [lX + 18, hy2 - 2], [lX + 14, hy2 + 16], [lX - 14, hy2 + 16]], true, 4)), bc, { dith: true });
      for (let i = 0; i < 4; i++) line(lX - 15 + i * 2, hy2 + 3 + i * 3, lX + 15 - i * 2, hy2 + 3 + i * 3, dk(bc, 0.3), 1, 0.8);
      const items = P === "bread" ? ["#e0b068", "#d89a50", "#e8c078", "#d8a058"] : ["#d2503a", "#5aa84a", "#e8963a", "#c8383a"];
      items.forEach((c, i) => fill(ell(lX - 11 + i * 7.5, hy2 - 4 - (i % 2) * 2, 4.6, P === "bread" ? 3.4 : 4.6), c, { shine: true }));
      line(lX - 17, hy2 - 3, lX - 6, hy2 - 17, dk(bc, 0.1), 2); line(lX + 17, hy2 - 3, lX + 6, hy2 - 17, dk(bc, 0.1), 2); line(lX - 6, hy2 - 17, lX + 6, hy2 - 17, dk(bc, 0.1), 2);
    }
    if (P === "book") {
      const bc = pc || "#7a3a5a";
      fill(rr(lX - 11, lY - 22, 23, 30, 2), bc, { dith: true, shine: true });
      fill(rr(lX - 9, lY - 20, 19, 3, 1), lite(bc, 0.15), { over: true, flat: true });
      dot(lX - 3, lY - 11, "#e8c84a", 7, 7); dot(lX - 1, lY - 9, dk("#e8c84a", 0.4), 3, 3);
      fill(rr(lX - 10, lY + 6, 22, 2, 0), "#f0e8d0");
    }
    if (S.palette) {
      const px0 = lX - 1, py0 = lY - 6;
      fill(poly(spl([[px0 - 12, py0], [px0 + 4, py0 - 7], [px0 + 17, py0 + 2], [px0 + 14, py0 + 16], [px0, py0 + 20], [px0 - 11, py0 + 14]], true, 5)), "#c8985a", { shine: true, dith: true });
      ["#ff5a8a", "#ffd166", "#5ac8ff", "#7aff9a", "#a24dff"].forEach((c, i) => fill(ell(px0 - 6 + (i % 3) * 8 + (i > 2 ? 4 : 0), py0 + 3 + (i > 2 ? 9 : 0), 3.4, 2.8), c, { shine: true, k: 2 }));
      fill(ell(px0 + 8, py0 + 13, 2, 2), "#3a2a22", { flat: true });
    }
    /* tangan */
    const fistL = ["bow", "shield", "basket", "bread", "book"].includes(P) || !!S.palette,
      fistR = ["fork", "axe", "hammer", "rod", "spear", "staff", "sword", "brush", "dagger", "cane", "scroll", "lantern"].includes(P);
    handShape(AL[2], -1, fistL); handShape(AR[2], 1, fistR);
    if (P === "shield") handShape([LH[0] - 6, sy + 30], -1, true);

    /* ===== 5. leher & kepala ===== */
    fill(rr(CX - 4.6, chin - 6, 9.2, 13, 3), dk(skin, 0.1), { flat: true });
    fill(rr(CX - 4.6, chin + 1, 9.2, 5, 1), dk(skin, 0.3), { over: true, flat: true });
    /* telinga */
    const fwx = (y) => 14 * hs;
    for (const sg of [-1, 1]) {
      fill(ell(CX + sg * (13.8 * hs + 1), hy + 3, 3.2 * hs, 5 * hs), dk(skin, 0.05));
      dot(CX + sg * (13.8 * hs + 1) - 1, hy + 2, dk(skin, 0.3), 2, 4, 0.8);
    }
    /* wajah */
    const jaw = fem ? 0.9 : old ? 1.02 : kid ? 1.04 : 1.0,
      fx = (v) => v * hs;
    const faceR = [
      [0, hy - 18.6 * hs], [fx(8.4), hy - 17.6 * hs], [fx(12.9), hy - 12 * hs], [fx(14.1), hy - 3 * hs], [fx(13.2 * jaw), hy + 5 * hs],
      [fx(10.8 * jaw), hy + 12 * hs], [fx(6.4 * jaw), hy + 16.8 * hs], [0, hy + 18.8 * hs],
    ];
    fill(sym(CX, faceR.map(([x, y]) => [x, y])), skin, { k: 3 });
    /* bayangan di bawah poni / dagu */
    fill(rr(CX - 11 * hs, hy - 3 * hs, 22 * hs, 3, 1), dk(skin, 0.12), { over: true, flat: true, a: 0.6 });
    /* mata */
    const ey = hy + (kid ? 3 : 2) * hs,
      ex = (kid ? 7.2 : 6.4) * hs;
    for (const sg of [-1, 1]) {
      const cx = CX + sg * ex;
      const big = kid ? 1.15 : 1;
      const eh = old ? 5 : Math.round(7 * big), ew = old ? 5 : Math.round(5 * big);
      /* putih mata */
      dot(cx - ew / 2 - 1, ey + 1, lite(skin, 0.45), ew + 2, eh - 1);
      /* iris */
      dot(cx - ew / 2, ey + 1, dk(eyc, 0.45), ew, Math.max(2, (eh / 3) | 0));
      dot(cx - ew / 2, ey + 1 + Math.max(2, (eh / 3) | 0), eyc, ew, Math.max(1, (eh / 3) | 0));
      dot(cx - ew / 2, ey + 1 + 2 * Math.max(1, (eh / 3) | 0) + (eh > 5 ? 0 : 0), lite(eyc, 0.3), ew, eh - 1 - 2 * Math.max(1, (eh / 3) | 0));
      /* pupil */
      dot(cx - 1, ey + 2, "#1a1020", 2, Math.max(2, eh - 4));
      /* kilau */
      dot(cx - ew / 2, ey + 1, "#ffffff", 2, 2); dot(cx + ew / 2 - 1, ey + eh - 2, "#ffffff", 1, 1, 0.8);
      /* garis kelopak atas (tebal, memanjang ke luar) */
      dot(cx - ew / 2 - 1, ey, "#2a1a28", ew + 2, 1);
      dot(cx - ew / 2 - 1 + (sg > 0 ? ew + 1 : -1), ey + 1, "#2a1a28", 1, 1);
      dot(cx - ew / 2 - 1, ey + 0, "#2a1a28", ew + 2, 1);
      if (fem || kid) { dot(cx + sg * (ew / 2 + 1) - (sg < 0 ? 0 : 0), ey - 1, "#2a1a28", 1, 1); }
      /* alis */
      const bw = ew + 3, bc = dk(S.beardCol && !fem ? S.beardCol : hair, 0.1);
      const byy = ey - (fem || kid ? 4 : 5) + (old ? 1 : 0);
      for (let i = 0; i < bw; i++) dot(cx - bw / 2 + i, byy + (sg > 0 ? (i > bw * 0.6 ? 1 : 0) : (i < bw * 0.4 ? 1 : 0)) - (old ? 0 : 0), bc, 1, fem || kid ? 1 : 2);
    }
    if (S.glass) {
      for (const sg of [-1, 1]) {
        const cx = CX + sg * ex;
        for (let a2 = 0; a2 < 20; a2++) { const t = (a2 / 20) * 6.283; dot(cx + Math.cos(t) * 6.2, ey + 3.4 + Math.sin(t) * 5.6, "#3a2a3a", 1, 1); }
        dot(cx - 5, ey + 0, "#ffffff", 2, 1, 0.5);
      }
      dot(CX - ex + 6, ey + 2, "#3a2a3a", 2 * ex - 12, 1);
    }
    /* hidung */
    dot(CX - 1, ey + 8, dk(skin, 0.22), 2, 3);
    dot(CX - 2, ey + 11, dk(skin, 0.32), 1, 1); dot(CX + 1, ey + 11, dk(skin, 0.32), 1, 1);
    dot(CX - 1, ey + 7, lite(skin, 0.25), 1, 2);
    /* mulut */
    const my = ey + 15 * (kid ? 0.9 : 1);
    dot(CX - 3, my, "#8a3a42", 6, 1);
    dot(CX - 4, my - 1, "#8a3a42", 1, 1); dot(CX + 3, my - 1, "#8a3a42", 1, 1);
    dot(CX - 2, my + 1, mix(rgb(skin), [200, 90, 90], 0.55), 4, 1);
    if (fem || kid) { const bl = [224, 110, 110]; for (const sg of [-1, 1]) for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) if ((i + j) % 2 === 0 || j === 1) dot(CX + sg * 9 * hs - 3 + i, ey + 8 + j, bl, 1, 1, 0.35); }
    /* kerutan (tua) */
    if (old) {
      const wc = dk(skin, 0.24);
      line(CX - 8, hy - 8, CX + 8, hy - 8, wc, 1, 0.8); line(CX - 6, hy - 5, CX + 6, hy - 5, wc, 1, 0.55);
      for (const sg of [-1, 1]) {
        line(CX + sg * 10.5, ey + 2, CX + sg * 13, ey + 1, wc, 1); line(CX + sg * 10.5, ey + 4, CX + sg * 13, ey + 5, wc, 1);
        line(CX + sg * 4, ey + 9, CX + sg * 7, ey + 14, wc, 1, 0.8);
      }
    }
    if (S.old2) dot(CX - 12, ey + 3, dk(skin, 0.2), 3, 1);

    /* ===== 6. janggut / kumis ===== */
    if (S.beard) {
      const bc = S.beardCol || hair;
      if (S.beard === "full") {
        fill(poly(spl([[CX - 14.2 * hs, hy + 2], [CX - 14 * hs, hy + 11], [CX - 11 * hs, hy + 22 * hs], [CX - 5, hy + 33], [CX, hy + 36], [CX + 5, hy + 33], [CX + 11 * hs, hy + 22 * hs], [CX + 14 * hs, hy + 11], [CX + 14.2 * hs, hy + 2], [CX + 11 * hs, hy + 9], [CX + 6, hy + 12], [CX, hy + 11], [CX - 6, hy + 12], [CX - 11 * hs, hy + 9]], true, 4)), bc, { shine: true });
        for (let i = -4; i <= 4; i++) line(CX + i * 2.6, hy + 16, CX + i * 3, hy + 31 - Math.abs(i), dk(bc, 0.28), 1, 0.7);
        fill(poly(spl([[CX - 11, hy + 10], [CX - 3, hy + 8.5], [CX, hy + 10], [CX + 3, hy + 8.5], [CX + 11, hy + 10], [CX + 8, hy + 14], [CX, hy + 13], [CX - 8, hy + 14]], true, 4)), lite(bc, 0.1), { shine: true, k: 2 });
        dot(CX - 3, my, "#8a3a42", 6, 1);
      } else if (S.beard === "stache") {
        fill(poly(spl([[CX - 13, hy + 12], [CX - 5, hy + 8.4], [CX, hy + 10], [CX + 5, hy + 8.4], [CX + 13, hy + 12], [CX + 8, hy + 14.5], [CX, hy + 12.5], [CX - 8, hy + 14.5]], true, 4)), bc, { shine: true, k: 2 });
      } else if (S.beard === "goatee") {
        fill(poly(spl([[CX - 8, hy + 10], [CX + 8, hy + 10], [CX + 5, hy + 16], [CX + 4, hy + 27], [CX, hy + 31], [CX - 4, hy + 27], [CX - 5, hy + 16]], true, 4)), bc, { shine: true, k: 2 });
      }
    }

    /* ===== 7. rambut depan ===== */
    const hsn = S.hs || "short";
    if (hsn !== "none" && !(S.hat && S.hat.t === "wizard" && false)) {
      const hh = hair, top0 = hy - 19.5 * hs;
      /* tutup kepala */
      const outer = spl([[CX - 15.6 * hs, hy + 1], [CX - 16.2 * hs, hy - 9 * hs], [CX - 11 * hs, hy - 18.5 * hs], [CX, hy - 22 * hs], [CX + 11 * hs, hy - 18.5 * hs], [CX + 16.2 * hs, hy - 9 * hs], [CX + 15.6 * hs, hy + 1]], false, 6);
      const style = hsn === "wild" ? 1 : 0;
      const fr = [
        [CX + 13 * hs, hy + 1], [CX + 12.6 * hs, hy - 5 * hs], [CX + 8 * hs, hy - 8.5 * hs], [CX + 3, hy - 6 * hs], [CX - 1, hy - 9.5 * hs],
        [CX - 5, hy - 6 * hs], [CX - 9 * hs, hy - 9 * hs], [CX - 12.5 * hs, hy - 5 * hs], [CX - 13 * hs, hy + 1],
      ];
      fill(poly([...outer, ...fr]), hh, { shine: true, k: 3 });
      /* sisi rambut di depan telinga */
      for (const sg of [-1, 1]) fill(poly([[CX + sg * 13 * hs, hy - 6], [CX + sg * 16.6 * hs, hy - 3], [CX + sg * 16.4 * hs, hy + (hsn === "wild" ? 14 : 6)], [CX + sg * 13.6 * hs, hy + (hsn === "wild" ? 8 : 3)]]), hh, { shine: true, k: 2 });
      /* helai poni */
      for (let i = -3; i <= 3; i++) line(CX + i * 3.2, hy - 17 * hs, CX + i * 3.6 + (i > 0 ? 1 : -1), hy - 8 * hs, dk(hh, 0.3), 1, 0.65);
      line(CX - 10 * hs, hy - 14 * hs, CX - 2, hy - 20 * hs, lite(hh, 0.35), 1, 0.85);
      line(CX + 2, hy - 20.5 * hs, CX + 9 * hs, hy - 16 * hs, lite(hh, 0.25), 1, 0.7);
      if (hsn === "spiky") for (const [dx, h2] of [[-9, 9], [-3, 12], [3, 12], [9, 9]]) fill(poly([[CX + dx - 4, hy - 17 * hs], [CX + dx + 4, hy - 17 * hs], [CX + dx + (dx < 0 ? -1.5 : 1.5), hy - 17 * hs - h2]]), hh, { shine: true, k: 2 });
      if (hsn === "wild") for (const sg of [-1, 1]) {
        fill(poly(spl([[CX + sg * 14, hy - 12], [CX + sg * 20, hy - 8], [CX + sg * 24, hy + 2], [CX + sg * 22, hy + 14], [CX + sg * 19, hy + 20], [CX + sg * 17, hy + 10], [CX + sg * 15, hy + 2]], true, 4)), hh, { shine: true, k: 2 });
        for (let i = 0; i < 4; i++) line(CX + sg * (17 + i), hy - 4 + i * 4, CX + sg * (20 + i * 0.5), hy + 6 + i * 3, dk(hh, 0.3), 1, 0.6);
      }
      if (hsn === "pony") dot(CX + 12 * hs - 1, hy - 9, "#d8503a", 5, 4);
      if (hsn === "braid") {
        const bx = CX + 10 * hs, st = hy + 6;
        for (let i = 0; i < 6; i++) fill(ell(bx + (i % 2 ? 1.2 : -1.2) + 2, st + 8 + i * 6.4, 4.4, 4.6), hh, { shine: true, k: 2 });
        dot(bx - 1, st + 8 + 6 * 6.4 - 2, "#d8503a", 6, 3);
      }
      if (hsn === "long") for (const sg of [-1, 1]) fill(poly(spl([[CX + sg * 14 * hs, hy - 2], [CX + sg * 19 * hs, hy + 8], [CX + sg * 22 * hs, hy + 28], [CX + sg * 17 * hs, hy + 38], [CX + sg * 11 * hs, hy + 22]], true, 4)), hh, { shine: true, k: 2 });
    }

    /* ===== 8. topi ===== */
    const Ht = S.hat;
    if (Ht) {
      const hc = Ht.col || "#c9a45c", ty = hy - (Ht.t === "turban" ? 17 : 14) * hs;
      if (Ht.t === "brim") {
        fill(ell(CX, ty + 5, 26 * hs, 6 * hs), dk(hc, 0.05), { dith: true, shine: true });
        fill(poly(spl([[CX - 15 * hs, ty + 4], [CX - 13 * hs, ty - 8], [CX, ty - 14], [CX + 13 * hs, ty - 8], [CX + 15 * hs, ty + 4]], true, 5)), hc, { dith: true, shine: true });
        fill(rr(CX - 15 * hs, ty - 1, 30 * hs, 5, 1), Ht.band || "#8a4a2a", { over: true });
        for (let i = 0; i < 9; i++) line(CX - 22 + i * 5.5, ty + 5, CX - 20 + i * 5.2, ty + 8, dk(hc, 0.25), 1, 0.7);
      } else if (Ht.t === "cap") {
        fill(poly(spl([[CX - 16 * hs, ty + 6], [CX - 14 * hs, ty - 8], [CX, ty - 13], [CX + 14 * hs, ty - 8], [CX + 16 * hs, ty + 6]], true, 5)), hc, { dith: true, shine: true });
        fill(poly(spl([[CX - 18 * hs, ty + 6], [CX + 18 * hs, ty + 6], [CX + 22 * hs, ty + 11], [CX - 22 * hs, ty + 11]], true, 4)), dk(hc, 0.3), { shine: true, k: 2 });
        fill(ell(CX, ty - 1, 4, 4.4), "#f0d060", { shine: true, k: 2 }); dot(CX - 1, ty - 2, "#a8801a", 2, 2);
      } else if (Ht.t === "cap2") {
        fill(poly(spl([[CX - 16 * hs, ty + 5], [CX - 14 * hs, ty - 9], [CX, ty - 14], [CX + 14 * hs, ty - 9], [CX + 16 * hs, ty + 5]], true, 5)), hc, { dith: true, shine: true });
        fill(poly(spl([[CX - 17 * hs, ty + 6], [CX + 17 * hs, ty + 6], [CX + 12 * hs, ty + 10], [CX - 12 * hs, ty + 10]], true, 4)), dk(hc, 0.28), { shine: true, k: 2 });
        if (Ht.feather) { fill(poly(spl([[CX + 8, ty - 4], [CX + 22, ty - 18], [CX + 28, ty - 30], [CX + 18, ty - 24], [CX + 10, ty - 12]], true, 4)), "#f0ebe0", { k: 2 }); line(CX + 9, ty - 5, CX + 26, ty - 28, "#c8c0b0", 1); }
      } else if (Ht.t === "helm") {
        fill(poly(spl([[CX - 16 * hs, ty + 8], [CX - 15 * hs, ty - 8], [CX, ty - 16], [CX + 15 * hs, ty - 8], [CX + 16 * hs, ty + 8]], true, 5)), hc, { shine: true });
        fill(rr(CX - 17 * hs, ty + 2, 34 * hs, 5, 1), "#d8b04a", { shine: true, k: 2 });
        fill(rr(CX - 2, ty + 6, 4, 15, 1), lite(hc, 0.1), { shine: true, k: 2 });
        fill(poly(spl([[CX - 3, ty - 14], [CX + 3, ty - 14], [CX + 7, ty - 26], [CX, ty - 30], [CX - 7, ty - 24]], true, 4)), "#f4efe0", { k: 2 });
      } else if (Ht.t === "crown") {
        fill(poly([[CX - 15 * hs, ty + 7], [CX - 15 * hs, ty - 6], [CX - 10 * hs, ty - 1], [CX - 5, ty - 13], [CX, ty - 3], [CX + 5, ty - 13], [CX + 10 * hs, ty - 1], [CX + 15 * hs, ty - 6], [CX + 15 * hs, ty + 7]]), "#ffd166", { shine: true, k: 2 });
        fill(ell(CX, ty + 2, 3, 3), "#d2284d", { shine: true, k: 2 }); dot(CX - 11, ty + 3, "#3ab0ff", 2, 2); dot(CX + 9, ty + 3, "#3ab0ff", 2, 2);
      } else if (Ht.t === "tiara") {
        /* tiara ratu / putri: pita emas tipis dengan puncak tengah + permata */
        fill(poly([[CX - 15 * hs, ty + 7], [CX - 15 * hs, ty + 2], [CX - 9 * hs, ty + 4], [CX - 5, ty - 4], [CX - 2, ty + 2], [CX, ty - 9], [CX + 2, ty + 2], [CX + 5, ty - 4], [CX + 9 * hs, ty + 4], [CX + 15 * hs, ty + 2], [CX + 15 * hs, ty + 7]]), hc, { shine: true, k: 2 });
        fill(ell(CX, ty + 3, 2.6, 2.8), Ht.gem || "#3ab0ff", { shine: true, k: 2 }); dot(CX - 1, ty + 1, "#ffffff", 1, 1);
        dot(CX - 5, ty - 4, Ht.gem2 || "#ffffff", 2, 2); dot(CX + 4, ty - 4, Ht.gem2 || "#ffffff", 2, 2);
      } else if (Ht.t === "bandana") {
        fill(poly(spl([[CX - 16 * hs, ty + 8], [CX - 14 * hs, ty - 8], [CX, ty - 13], [CX + 14 * hs, ty - 8], [CX + 16 * hs, ty + 8], [CX, ty + 1]], true, 5)), hc, { dith: true, shine: true });
        fill(poly([[CX + 14 * hs, ty + 2], [CX + 26, ty + 10], [CX + 21, ty + 20], [CX + 15, ty + 10]]), dk(hc, 0.12), { k: 2 });
      } else if (Ht.t === "beret") {
        fill(poly(spl([[CX - 18 * hs, ty + 8], [CX - 20 * hs, ty - 6], [CX - 6, ty - 15], [CX + 14, ty - 14], [CX + 22 * hs, ty - 4], [CX + 17 * hs, ty + 8]], true, 5)), hc, { dith: true, shine: true });
        fill(rr(CX - 17 * hs, ty + 4, 33 * hs, 4, 1), dk(hc, 0.25), { k: 2 });
        fill(rr(CX - 2, ty - 20, 4, 6, 1), dk(hc, 0.35), { k: 2 });
      } else if (Ht.t === "wizard") {
        fill(ell(CX, ty + 7, 27 * hs, 6 * hs), dk(hc, 0.08), { dith: true, shine: true });
        fill(poly(spl([[CX - 15 * hs, ty + 7], [CX - 12 * hs, ty - 8], [CX - 5, ty - 25], [CX + 6, ty - 38], [CX + 20, ty - 44], [CX + 14, ty - 32], [CX + 8, ty - 18], [CX + 13 * hs, ty - 6], [CX + 15 * hs, ty + 7]], true, 5)), hc, { dith: true, shine: true });
        fill(rr(CX - 14 * hs, ty + 1, 28 * hs, 6, 1), Ht.band || "#d8b04a", { over: true, k: 2 });
        dot(CX - 1, ty - 14, "#ffe27a", 4, 4); dot(CX - 2, ty - 13, "#ffe27a", 6, 2); dot(CX, ty - 15, "#ffe27a", 2, 6);
      } else if (Ht.t === "scarf") {
        fill(poly(spl([[CX - 16.5 * hs, ty + 9], [CX - 15 * hs, ty - 8], [CX, ty - 14], [CX + 15 * hs, ty - 8], [CX + 16.5 * hs, ty + 9], [CX, ty + 3]], true, 5)), hc, { dith: true, shine: true });
        fill(poly(spl([[CX + 14 * hs, ty + 4], [CX + 25, ty + 8], [CX + 24, ty + 20], [CX + 16, ty + 14]], true, 3)), dk(hc, 0.22), { k: 2 });
        for (let k = 0; k < 6; k++) dot(CX - 11 + k * 5, ty - 5 + (k % 2) * 5, lite(hc, 0.55), 2, 2);
      } else if (Ht.t === "turban") {
        /* sorban berlapis + permata + bulu */
        fill(poly(spl([[CX - 18 * hs, ty + 10], [CX - 20 * hs, ty - 6], [CX - 9, ty - 20], [CX + 6, ty - 22], [CX + 18 * hs, ty - 12], [CX + 19 * hs, ty + 10], [CX, ty + 5]], true, 5)), hc, { dith: true, shine: true });
        for (let i = 0; i < 5; i++) line(CX - 19 * hs + i * 2, ty + 6 - i * 4, CX + 18 * hs - i * 2, ty - 6 - i * 3, dk(hc, 0.32), 1, 0.9);
        for (let i = 0; i < 4; i++) line(CX - 18 * hs + i * 3, ty + 8 - i * 4.5, CX + 12 * hs - i * 2, ty - 2 - i * 4, lite(hc, 0.22), 1, 0.65);
        fill(poly(spl([[CX - 18 * hs, ty + 10], [CX + 19 * hs, ty + 10], [CX + 19 * hs, ty + 6], [CX - 18 * hs, ty + 6]], true, 3)), dk(hc, 0.2), { k: 2 });
        fill(ell(CX - 1, ty + 1, 5, 5.4), Ht.gem || "#46d6c8", { shine: true, k: 2 }); dot(CX - 3, ty - 2, "#ffffff", 2, 2);
        fill(ell(CX - 1, ty + 1, 7.4, 7.6), "#e8c04a", { over: false, k: 2 }); fill(ell(CX - 1, ty + 1, 5, 5.4), Ht.gem || "#46d6c8", { shine: true, k: 2 }); dot(CX - 3, ty - 2, "#ffffff", 2, 2);
        fill(poly(spl([[CX + 2, ty - 6], [CX + 14, ty - 22], [CX + 22, ty - 36], [CX + 14, ty - 32], [CX + 4, ty - 18]], true, 4)), "#e8dcc0", { k: 2 });
        line(CX + 3, ty - 7, CX + 19, ty - 33, "#b8a888", 1);
      } else if (Ht.t === "headband") {
        fill(rr(CX - 15 * hs, ty + 4, 30 * hs, 5, 1), hc, { dith: true });
      }
    }

    /* ===== 9. kontur + bayangan tanah ===== */
    const out = new Uint8ClampedArray(d);
    const isN = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3]) {
        const idp = ids[y * W + x];
        if (nl[idp]) continue;
        let edge = false;
        for (const [a, b] of isN) {
          const X = x + a, Y2 = y + b;
          if (X < 0 || Y2 < 0 || X >= W || Y2 >= H) continue;
          const q = Y2 * W + X;
          if (d[q * 4 + 3] && ids[q] < idp && ids[q] > 0) { edge = true; break; }
        }
        if (edge) {
          const c = mix(dk([d[i], d[i + 1], d[i + 2]], 0.55), OUT, 0.3);
          out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2];
        }
        continue;
      }
      const nb = isN.some(([a, b]) => {
        const X = x + a, Y2 = y + b;
        return X >= 0 && Y2 >= 0 && X < W && Y2 < H && d[(Y2 * W + X) * 4 + 3];
      });
      if (nb) {
        out[i] = OUT[0]; out[i + 1] = OUT[1]; out[i + 2] = OUT[2]; out[i + 3] = 255;
      } else if (!S.noShadow && ((x - CX) / (kid ? 26 : 34)) ** 2 + ((y - (GY + 1)) / 5.5) ** 2 <= 1) {
        out[i + 3] = 70;
      }
    }
    /* cahaya lembut (orb tongkat, lentera) di atas semuanya */
    for (const [gx, gy, gr, gc] of glows)
      for (let yy = Math.max(0, Math.floor(gy - gr)); yy <= Math.min(H - 1, gy + gr); yy++)
        for (let xx = Math.max(0, Math.floor(gx - gr)); xx <= Math.min(W - 1, gx + gr); xx++) {
          const dd = Math.hypot(xx - gx, yy - gy) / gr;
          if (dd >= 1) continue;
          const a = (1 - dd) ** 2.4 * 0.45, i = (yy * W + xx) * 4;
          if (out[i + 3] === 0) { out[i] = gc[0]; out[i + 1] = gc[1]; out[i + 2] = gc[2]; out[i + 3] = Math.round(a * 110); }
          else { const b2 = a * 0.35; out[i] += (gc[0] - out[i]) * b2; out[i + 1] += (gc[1] - out[i + 1]) * b2; out[i + 2] += (gc[2] - out[i + 2]) * b2; }
        }
    return out;
  }

  /* ---------- perlengkapan (kunci sama dengan EQ di world.js, jadi MC & NPC memakai item yang sama) ----------
   gear = {h:"cap|helm|crown", b:"leather|iron", c:"bluecape|goldcape", w:"wood|gold|star"}  (sama dengan Pl.eq)
   Contoh pakai untuk MC:  NPCPX.render({...spec, gear: Pl.eq}, 0) */
  const RK = ["E", "D", "C", "B", "A", "S", "SS", "SSS"],
    GEAR_RANK = [
      {},
      { h: "cap", w: "wood" },
      { h: "cap", b: "leather", w: "wood" },
      { h: "helm", b: "leather", w: "wood" },
      { h: "helm", b: "iron", w: "gold" },
      { h: "helm", b: "iron", c: "bluecape", w: "gold" },
      { h: "helm", b: "iron", c: "goldcape", w: "star" },
      { h: "crown", b: "iron", c: "goldcape", w: "star" },
    ],
    gearFor = (r) => GEAR_RANK[typeof r === "string" ? Math.max(0, RK.indexOf(r)) : Math.max(0, Math.min(7, r | 0))];
  function withGear(S) {
    const g = S.gear;
    if (!g) return S;
    const s = { ...S },
      no = S.noGear || [],
      wiz = S.hat && S.hat.t === "wizard";
    if (g.h && !wiz && !no.includes("h"))
      s.hat = g.h === "helm" ? { t: "helm", col: "#9aa3b8" } : g.h === "crown" ? { t: "crown", col: "#ffd166" } : { t: "cap2", col: "#8a5a2b", feather: true };
    if (g.b && !S.robe && !no.includes("b")) {
      s.plate = g.b === "iron" ? "#9aa3b8" : "#a0703a";
      s.plateSm = g.b === "leather" ? 1 : 0;
    }
    if (g.c && !no.includes("c")) {
      s.cape = g.c === "goldcape" ? "#e0b040" : "#3a6bd6";
      s.capeTrim = g.c === "goldcape" ? "#a67c1a" : "#27489a";
    }
    if (g.w && S.prop === "sword" && !no.includes("w")) s.swordCol = { wood: "#b87a3a", gold: "#ffd166", star: "#d9a0ff" }[g.w];
    return s;
  }

  /* ---------- preset sesuai sheet ---------- */
  const PRESETS = {};
  const reg = (key, label, group, spec) => (PRESETS[key] = { label, group, spec });

  reg("petani", "Petani", "NPC Desa", { body: "m", skin: SKIN[1], hair: "#4a3322", hat: { t: "brim", col: "#c9a45c", band: "#8a4a2a" }, top: "#4f8a4f", bottom: "#7a5a3a", boots: "#5a3a22", belt: "#4a3322", prop: "fork" });
  reg("petaniw", "Petani (Wanita)", "NPC Desa", { body: "f", skin: SKIN[4], hair: "#8a5a2e", hs: "braid", hat: { t: "brim", col: "#d8b868", band: "#4a6aa8" }, top: "#e8e0d0", dress: true, bottom: "#4a6aa8", apron: "#f4efe0", boots: "#6a4a2e", sock: "#e8dcc0" });
  reg("tukangkayu", "Tukang Kayu", "NPC Desa", { body: "m", skin: SKIN[1], hair: "#5a3a22", beard: "full", beardCol: "#4a2e1a", hat: { t: "brim", col: "#a8864a", band: "#6a4a2a" }, top: "#3a5f8a", vest: "#7a5a3a", bottom: "#5a4a3a", boots: "#4a3222", belt: "#3a2a1a", prop: "axe" });
  reg("tukangbesi", "Tukang Besi", "NPC Desa", { body: "m", skin: SKIN[2], hair: "#2a1c14", beard: "full", beardCol: "#3a2a1c", top: "#7a5a3a", short: true, apron: "#3a3036", bottom: "#3a3a44", boots: "#2a2228", prop: "hammer" });
  reg("pedagang", "Pedagang", "NPC Desa", { body: "m", skin: SKIN[0], hair: "#6a4a2a", hat: { t: "brim", col: "#b8964a", band: "#3a5fa8" }, top: "#3a5a9a", vest: "#6a4a2a", pack: "#8a6a3a", bottom: "#4a4a5a", boots: "#5a3a22", belt: "#3a2a1a" });
  reg("warga", "Warga Desa", "NPC Desa", { body: "m", skin: SKIN[0], hair: "#4a3322", top: "#e8dcc0", bib: "#4a6aa8", bottom: "#4a6aa8", boots: "#5a3a22" });

  reg("pospria", "Petugas Pos (Pria)", "Kantor Pos", { lock: ["top", "bottom", "hat", "bag"], body: "m", skin: SKIN[0], hair: "#3a2a1c", hat: { t: "cap", col: "#2f4a86" }, top: "#3a5fa8", bottom: "#2f4a86", boots: "#2a2a3a", belt: "#5a3a22", buttons: true, epaulet: true, bag: "#8a5a2e" });
  reg("poswanita", "Petugas Pos (Wanita)", "Kantor Pos", { lock: ["top", "bottom", "hat", "vest", "bag"], body: "f", skin: SKIN[4], hair: "#7a3a26", hs: "pony", hat: { t: "beret", col: "#c8383a" }, top: "#e8e0d0", vest: "#c8383a", dress: true, bottom: "#2f4a86", boots: "#5a3a22", sock: "#e8dcc0", bag: "#8a5a2e" });

  reg("kakek", "Kakek (Laki-laki)", "Kakek-Kakek", { body: "old", skin: SKIN[0], hair: "#e6e6e6", hs: "wild", beard: "full", beardCol: "#f0f0f0", top: "#8a6a4a", vest: "#6a3a2a", bottom: "#4a3a2a", boots: "#3a2a1c", prop: "cane" });
  reg("nenek", "Nenek (Perempuan)", "Kakek-Kakek", { body: "old", fem: true, skin: SKIN[0], hair: "#e6e6e6", hs: "bun", top: "#a8586a", dress: true, robe: true, bottom: "#a8586a", boots: "#3a2a1c", shawl: "#7a4a9a", prop: "cane" });

  reg("mancing1", "Bapak Mancing (1)", "Pemancing", { body: "m", skin: SKIN[1], hair: "#4a3322", hat: { t: "brim", col: "#b89a4a", band: "#4a6a3a" }, top: "#4a7a4a", vest: "#8a7a4a", bottom: "#5a5a4a", boots: "#4a3a2a", prop: "rod" });
  reg("mancing2", "Bapak Mancing (2)", "Pemancing", { body: "m", skin: SKIN[2], hair: "#4a3322", beard: "stache", beardCol: "#4a3322", hat: { t: "cap2", col: "#3a5fa8" }, top: "#5a7a9a", vest: "#4a5a6a", bottom: "#3a4a5a", boots: "#2a3a44", prop: "rod" });

  reg("ibu", "Ibu Rumah Tangga", "Ibu-Ibu", { body: "f", skin: SKIN[4], hair: "#6a3a26", hs: "long", top: "#4a8a5a", dress: true, bottom: "#4a8a5a", apron: "#f0ebe0", boots: "#5a3a22", sock: "#e8dcc0" });
  reg("sayur", "Penjual Sayur", "Ibu-Ibu", { body: "f", skin: SKIN[3], hair: "#2a1c14", hat: { t: "scarf", col: "#e08a3a" }, top: "#e8dcc0", dress: true, bottom: "#3a5fa8", apron: "#f0ebe0", boots: "#5a3a22", sock: "#e8dcc0", prop: "basket" });
  reg("roti", "Pembuat Roti", "Ibu-Ibu", { body: "f", skin: SKIN[4], hair: "#6a3a26", hat: { t: "scarf", col: "#f0ebe0" }, top: "#c88a5a", dress: true, bottom: "#c8785a", apron: "#f4efe0", boots: "#5a3a22", sock: "#e8dcc0", prop: "bread" });

  reg("anaklaki", "Anak Laki-laki", "Anak-Anak", { body: "kid", skin: SKIN[1], hair: "#4a3322", hs: "spiky", top: "#4a7ac8", bottom: "#4a5a8a", boots: "#5a3a22" });
  reg("anakperempuan", "Anak Perempuan", "Anak-Anak", { body: "kid", skin: SKIN[4], hair: "#8a4a2a", hs: "pony", top: "#d8506a", dress: true, skirtLen: 14, bottom: "#d8506a", boots: "#5a3a22", sock: "#f0ebe0" });

  reg("pedangm", "Petualang Pedang (Pria)", "Petualang", { body: "m", skin: SKIN[1], hair: "#2a1c2c", top: "#2f3a5a", vest: "#5a4a3a", bottom: "#3a3a4a", boots: "#2a2228", belt: "#5a3a22", prop: "sword" });
  reg("pedangw", "Petualang Pedang (Wanita)", "Petualang", { body: "f", skin: SKIN[3], hair: "#6a3a26", hs: "pony", top: "#8a5aa0", dress: true, skirtLen: 18, bottom: "#7a4a90", boots: "#4a2a3a", sock: "#c8a07a", belt: "#5a3a22", prop: "sword" });
  reg("tombakm", "Petualang Tombak (Pria)", "Petualang", { body: "m", skin: SKIN[1], hair: "#4a3322", top: "#c8c0b0", vest: "#6a5a3a", bottom: "#5a4a3a", boots: "#4a3222", cape: "#8a3a3a", belt: "#3a2a1a", prop: "spear" });
  reg("tombakw", "Petualang Tombak (Wanita)", "Petualang", { body: "f", skin: SKIN[4], hair: "#6a3a26", hs: "pony", top: "#4a8a9a", dress: true, skirtLen: 18, bottom: "#3a7a8a", boots: "#4a3222", sock: "#d8b890", belt: "#3a2a1a", prop: "spear" });
  reg("tankm", "Petualang Perisai (Pria)", "Petualang", { body: "m", skin: SKIN[0], hair: "#8a8aa0", top: "#3a4a6a", plate: "#aab4c6", bottom: "#3a4a6a", boots: "#3a3a4a", belt: "#5a3a22", prop: "shield", propCol: "#3a5fa8" });
  reg("tankw", "Petualang Perisai (Wanita)", "Petualang", { body: "f", skin: SKIN[4], hair: "#c8504a", hs: "pony", top: "#8a4a3a", plate: "#c8d0e0", dress: true, skirtLen: 18, bottom: "#a85a4a", boots: "#4a3222", sock: "#d8b890", prop: "shield", propCol: "#4a7ac8" });
  reg("magem", "Petualang Tongkat Sihir (Pria)", "Petualang", { body: "m", skin: SKIN[0], hair: "#2a1c2c", hat: { t: "wizard", col: "#2f4a9a" }, top: "#2f4a9a", dress: true, robe: true, bottom: "#2f4a9a", boots: "#3a2a1c", shawl: "#c8a84a", trim: "#d8b04a", prop: "staff", propCol: "#6ac8ff" });
  reg("magew", "Petualang Tongkat Sihir (Wanita)", "Petualang", { body: "f", skin: SKIN[4], hair: "#6a3a8a", hs: "long", hat: { t: "wizard", col: "#7a3a9a" }, top: "#7a3a9a", dress: true, robe: true, bottom: "#7a3a9a", boots: "#3a2a1c", trim: "#d8b04a", prop: "staff", propCol: "#ff8ac8" });
  reg("wizardm", "Petualang Buku Sihir (Pria)", "Petualang", { body: "m", skin: SKIN[2], hair: "#2a1c14", hat: { t: "wizard", col: "#2f4a8a" }, top: "#2f4a8a", dress: true, robe: true, bottom: "#2f4a8a", boots: "#3a2a1c", belt: "#d8b04a", trim: "#d8b04a", prop: "book", propCol: "#7a2a3a" });
  reg("wizardw", "Petualang Buku Sihir (Wanita)", "Petualang", { body: "f", skin: SKIN[4], hair: "#a8742e", hs: "long", hat: { t: "wizard", col: "#3a4a9a" }, top: "#3a4a9a", dress: true, robe: true, bottom: "#3a4a9a", boots: "#3a2a1c", belt: "#d8b04a", trim: "#d8b04a", prop: "book", propCol: "#c8403a" });

  reg("pemanah", "Petualang Pemanah", "Petualang", { body: "m", skin: SKIN[1], hair: "#6b3a26", top: "#4a7a4a", vest: "#6a4a2a", bottom: "#5a4a3a", boots: "#4a3222", belt: "#3a2a1a", prop: "bow", noGear: ["w"] });
  reg("pencuri", "Petualang Pencuri", "Petualang", { body: "m", skin: SKIN[0], hair: "#2a1c2c", hat: { t: "bandana", col: "#4a2a5a" }, top: "#3a3a4a", bottom: "#2a2a38", boots: "#1a1a24", belt: "#6a4a2a", prop: "dagger", noGear: ["h", "c"] });
  reg("pendeta", "Petualang Pendeta", "Petualang", { body: "f", skin: SKIN[4], hair: "#c8904a", hs: "long", top: "#f0ebe0", dress: true, robe: true, bottom: "#f0ebe0", boots: "#c8a85a", shawl: "#d8b04a", trim: "#d8b04a", prop: "staff", propCol: "#fff0a0", noGear: ["h", "b", "w"] });
  reg("veteran", "Petualang Veteran", "Petualang", { body: "old", skin: SKIN[2], hair: "#b8b8c4", beard: "stache", beardCol: "#b8b8c4", top: "#5a4a3a", bottom: "#3a3a4a", boots: "#2a2228", belt: "#5a3a22", prop: "sword" });

  /* tokoh bernama: kunci preset = kunci sprite lama (euclid, lyra, fib, toko, tetua, seniman, penginap); fixed = tidak diacak */
  reg("euclid", "Guildmaster Euclid", "Tokoh Utama", { fixed: true, body: "old", skin: SKIN[1], hair: "#e6e6e6", hs: "wild", beard: "full", beardCol: "#f0f0f0", top: "#6a4bc6", dress: true, robe: true, bottom: "#5a3ba8", boots: "#2a2228", shawl: "#d8b04a", trim: "#d8b04a", belt: "#d8b04a", prop: "staff", propCol: "#c99aff" });
  reg("lyra", "Kapten Lyra", "Tokoh Utama", { fixed: true, body: "f", skin: SKIN[3], hair: "#2a2a5a", hs: "pony", hat: { t: "cap", col: "#1a1a3a" }, top: "#2a2a5a", dress: true, skirtLen: 18, bottom: "#1a1a3a", boots: "#1a1a24", sock: "#c8a07a", buttons: true, epaulet: true, belt: "#d8b04a", cape: "#1a1a3a", capeTrim: "#d8b04a", prop: "sword", swordCol: "#cfd8e8" });
  reg("fib", "Nona Fibonacci", "Tokoh Utama", { fixed: true, body: "f", skin: SKIN[1], hair: "#8a3a5a", hs: "bun", glass: true, top: "#e0476a", dress: true, bottom: "#f08ab0", apron: "#f4efe0", boots: "#5a3a22", sock: "#f0ebe0", prop: "book", propCol: "#e8c84a" });
  reg("toko", "Pemilik Toko", "Tokoh Utama", { fixed: true, body: "m", skin: SKIN[2], hair: "#4a3322", beard: "stache", beardCol: "#4a3322", hat: { t: "cap2", col: "#c0763a" }, top: "#e08a2f", apron: "#f0e8d0", bottom: "#5a4a3a", boots: "#4a3222", belt: "#3a2a1a", bag: "#8a5a2e" });
  reg("tetua", "Tetua Desa Sunyi", "Tokoh Utama", { fixed: true, body: "old", skin: SKIN[2], hair: "#e6e6e6", hs: "wild", beard: "full", beardCol: "#e6e6e6", top: "#d8d8d8", dress: true, robe: true, bottom: "#c8c8c8", boots: "#4a3a2a", shawl: "#8a5a2b", prop: "cane" });
  reg("seniman", "Seniman Jalanan", "Tokoh Utama", { fixed: true, body: "m", skin: SKIN[0], hair: "#2a1c14", hs: "short", beard: "stache", beardCol: "#2a1c14", hat: { t: "beret", col: "#a24dff" }, top: "#4a3a52", sleeve: "#d8d0c0", short: false, cuff: "#ff9ac1", collar: "#ff9ac1", apron: "#e6dfcf", splat: ["#ff5a8a", "#ffd166", "#5ac8ff", "#7aff9a", "#a24dff"], bottom: "#4a3a4a", boots: "#2a2228", belt: "#7a4a22", palette: true, prop: "brush", propCol: "#ff7aae", eyes: "#3a5a8a" });
  reg("pedagangkuno", "Pedagang Kuno", "Tokoh Utama", { fixed: true, body: "m", fat: 1.12, skin: SKIN[2], hair: "#2a2220", hs: "short", beard: "full", beardCol: "#3a3230", hat: { t: "turban", col: "#b8362f", gem: "#46d6c8" }, top: "#e8dcc0", inner: "#f4ead0", coat: "#2f7a78", trim: "#e8c04a", sash: "#b8362f", pouch: true, bottom: "#6a4a3a", baggy: true, boots: "#7a4a2a", curl: true, pack: "wares", prop: "lantern", propCol: "#ffd36a", sleeve: "#2f7a78", cuff: "#e8c04a", eyes: "#4a3020" });
  reg("penginap", "Penjaga Penginapan", "Tokoh Utama", { fixed: true, body: "f", skin: SKIN[4], hair: "#6b4226", hat: { t: "scarf", col: "#f0ebe0" }, top: "#7a4b2a", dress: true, bottom: "#7a4b2a", apron: "#f4efe0", boots: "#4a3222", sock: "#e8dcc0" });

  /* keluarga kerajaan (Royal Kingdom Concept Sheet): biru tua, putih, emas. fixed = tidak diacak */
  reg("raja", "Raja", "Kerajaan", { fixed: true, body: "m", fat: 1.1, skin: SKIN[1], hair: "#dcdcdc", hs: "short", beard: "full", beardCol: "#f2f2f2", hat: { t: "crown", col: "#ffd166" }, top: "#23284a", dress: true, robe: true, bottom: "#1f2650", boots: "#2a2a3a", shawl: "#f4f1ea", trim: "#e2b84a", belt: "#e2b84a", cape: "#2f4fa8", capeTrim: "#e2b84a", prop: "staff", propCol: "#ffd166", eyes: "#3a4a6a" });
  reg("ratu", "Ratu", "Kerajaan", { fixed: true, body: "f", skin: SKIN[0], hair: "#e6e2f0", hs: "long", hat: { t: "tiara", col: "#e2b84a", gem: "#6fa8ff" }, top: "#f4f1ea", dress: true, robe: true, bottom: "#f4f1ea", boots: "#e2b84a", shawl: "#2f4fa8", trim: "#2f4fa8", belt: "#e2b84a", cape: "#2f4fa8", capeTrim: "#e2b84a", eyes: "#6a4ab0" });
  reg("pangeran", "Pangeran", "Kerajaan", { fixed: true, body: "m", skin: SKIN[0], hair: "#d8d8ee", hs: "short", hat: { t: "headband", col: "#e2b84a" }, top: "#2f4fa8", vest: "#f4f1ea", bottom: "#f4f1ea", boots: "#3a3a4a", belt: "#e2b84a", cape: "#1f3578", capeTrim: "#e2b84a", epaulet: true, buttons: true, eyes: "#d2284d" });
  reg("putri", "Putri", "Kerajaan", { fixed: true, body: "f", skin: SKIN[0], hair: "#f0d58a", hs: "long", hat: { t: "tiara", col: "#e2b84a", gem: "#6fa8ff" }, top: "#f4f1ea", dress: true, skirtLen: 42, bottom: "#f4f1ea", boots: "#e2b84a", sock: "#f0ebe0", shawl: "#2f4fa8", trim: "#2f4fa8", belt: "#2f4fa8", eyes: "#c88a2a" });

  /* NPC lama (kunci SP) -> preset baru, untuk dipasang bertahap */
  const ALIAS = { kuno: "pedagangkuno", pedagangk: "pedagangkuno",  pria: "petani", pria2: "warga", wanita: "petaniw", ibu: "ibu", nelayan: "mancing1", pandai: "tukangbesi", bocah: "anaklaki", kakek2: "kakek", pos: "pospria", pdekar: "pedangm", ksatria: "tankm", ranger: "pemanah", anak: "anaklaki", pmage: "magem", pmanah: "pemanah", pencuri: "pencuri", pendeta: "pendeta", pveteran: "veteran", penjaga: "tankm", tukangsapu: "warga", tukangkebun: "petani", musisi: "warga", pembaca: "warga",  };

  /* ---------- variasi ---------- */
  const rng = (s) => () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const specOf = (k) => (typeof k === "string" ? (PRESETS[k] || PRESETS[ALIAS[k]] || PRESETS.warga).spec : k);
  /* peran (prop, topi, jenis badan) tetap; warna & potongan rambut diacak.
     opsi: {keep:["skin","hair","top",...]} untuk menahan bagian tertentu */
  function vary(key, seed, opt = {}) {
    const b = specOf(key);
    if (b.fixed) return { ...b };
    const r = rng(seed * 7919 + 13),
      pick = (a) => a[(r() * a.length) | 0],
      keep = [...(opt.keep || []), ...(b.lock || [])],
      s = { ...b },
      kp = (k) => keep.includes(k);
    if (!kp("skin")) s.skin = pick(SKIN);
    if (!kp("hair") && b.hs !== "none") s.hair = b.body === "old" ? pick(GREY) : pick(HAIR);
    if (!kp("hs") && b.hs && b.hs !== "wild" && !b.hat) s.hs = pick(b.body === "m" ? ["short", "short", "spiky"] : ["long", "pony", "braid", "bun"]);
    if (!kp("top")) {
      s.top = pick(CLOTH);
      if (s.robe && s.dress) s.bottom = s.top;
      else if (s.dress) s.bottom = pick(CLOTH);
    }
    if (!kp("bottom") && !s.dress && s.bottom) s.bottom = pick(BOTT);
    if (b.hat && !kp("hat")) s.hat = { ...b.hat, col: b.hat.t === "wizard" ? s.top : pick(CLOTH) };
    if (b.vest && !kp("vest")) s.vest = pick(BOTT);
    if (b.apron && !kp("apron")) s.apron = pick(LIGHT);
    if (b.bib && !kp("bib")) s.bib = pick(CLOTH);
    if (b.shawl && !kp("shawl")) s.shawl = pick(CLOTH);
    if (b.beard && b.body === "m" && !kp("hair")) s.beardCol = s.hair;
    if (b.sock) s.sock = r() < 0.5 ? skinSock(s.skin) : "#e8dcc0";
    return s;
  }
  const skinSock = (c) => c;

  /* ---------- kanvas + cache ---------- */
  const cache = new Map();
  function canvas(k, frame = 0) {
    const s = specOf(k),
      id = JSON.stringify(s) + "|" + frame;
    if (cache.has(id)) return cache.get(id);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    c.getContext("2d").putImageData(new ImageData(render(s, frame), W, H), 0, 0);
    if (cache.size > 300) cache.clear();
    cache.set(id, c);
    return c;
  }
  function draw(ctx, k, x, y, scale = 1, flip = false, frame = 0) {
    const c = canvas(k, frame),
      was = ctx.imageSmoothingEnabled,
      wq = ctx.imageSmoothingQuality;
    /* skala bulat -> piksel tajam; skala pecahan/kecil -> perkecil halus (seperti hero_pixel) */
    ctx.imageSmoothingEnabled = scale < 1 && Math.abs(scale - Math.round(scale)) > 0.01;
    ctx.imageSmoothingQuality = "high";
    if (flip) {
      ctx.save();
      ctx.translate(x + W * scale, y);
      ctx.scale(-1, 1);
      ctx.drawImage(c, 0, 0, W * scale, H * scale);
      ctx.restore();
    } else ctx.drawImage(c, x, y, W * scale, H * scale);
    ctx.imageSmoothingEnabled = was;
    ctx.imageSmoothingQuality = wq;
  }

  return {
    W, H, PRESETS, ALIAS, SKIN, HAIR, CLOTH,
    render, canvas, draw, vary, gearFor, RK,
    dress: (k, rank) => ({ ...specOf(k), gear: gearFor(rank) }),
    register: (key, spec, label, group) => reg(key, label || key, group || "Lainnya", spec),
    has: (k) => !!(PRESETS[k] || PRESETS[ALIAS[k]]),
  };
})();
if (typeof module !== "undefined") module.exports = NPCPX;
