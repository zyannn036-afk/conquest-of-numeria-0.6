/* ===== Numeria Quest — Suara (WebAudio, sintetis, tanpa file audio) =====
   SND.sfx(nama)        efek suara
   SND.mon(sprite, jenis)  suara monster: appear | atk | hurt | die
   SND.music(nama|null) musik latar: village forest city quiet dungeon guild battle boss
*/
const SND = (() => {
  let ac = null,
    master,
    sfxG,
    musG,
    nbuf,
    want = null,
    cur = null,
    timer = null,
    stepFlip = 0,
    lastBump = 0;
  const on = { sfx: true, mus: true };
  try {
    const s = JSON.parse(localStorage.getItem("nq-snd") || "{}");
    if (s.sfx === false) on.sfx = false;
    if (s.mus === false) on.mus = false;
  } catch (e) {}
  const save = () => {
    try {
      localStorage.setItem("nq-snd", JSON.stringify(on));
    } catch (e) {}
  };

  /* ---------- dasar ---------- */
  function ensure() {
    if (ac) {
      if (ac.state === "suspended") ac.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = 0.8;
    master.connect(ac.destination);
    sfxG = ac.createGain();
    sfxG.gain.value = on.sfx ? 1 : 0;
    sfxG.connect(master);
    musG = ac.createGain();
    musG.gain.value = on.mus ? 1 : 0;
    musG.connect(master);
    // buffer noise 1 detik
    nbuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = nbuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (want) play(want);
    return true;
  }
  const ok = () => ac && ac.state !== "closed";

  // nada: f0 -> f1 (slide), durasi d, delay t
  function tn(f0, d, type = "square", vol = 0.2, f1, t = 0, out) {
    if (!ok()) return;
    const t0 = ac.currentTime + t,
      o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.01, d / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g);
    g.connect(out || sfxG);
    o.start(t0);
    o.stop(t0 + d + 0.03);
  }
  // noise: filter tipe, f0 -> f1
  function ns(d, vol = 0.2, type = "lowpass", f0 = 1000, f1, t = 0) {
    if (!ok()) return;
    const t0 = ac.currentTime + t,
      s = ac.createBufferSource(),
      fl = ac.createBiquadFilter(),
      g = ac.createGain();
    s.buffer = nbuf;
    s.loop = true;
    fl.type = type;
    fl.frequency.setValueAtTime(f0, t0);
    if (f1) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.01, d / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    s.connect(fl);
    fl.connect(g);
    g.connect(sfxG);
    s.start(t0);
    s.stop(t0 + d + 0.03);
  }
  const arp = (fs, step, type = "square", vol = 0.16, len = 1.6) =>
    fs.forEach((f, i) => tn(f, step * len, type, vol, 0, i * step));
  // getaran (vibrato) sederhana: beberapa nada kecil bergantian
  const wob = (f, d, type, vol, n = 6, depth = 0.06) => {
    for (let i = 0; i < n; i++)
      tn(
        f * (1 + (i % 2 ? depth : -depth)),
        (d / n) * 1.4,
        type,
        vol,
        0,
        (d / n) * i,
      );
  };

  /* ---------- efek suara ---------- */
  const X = {
    click: () => tn(740, 0.05, "square", 0.1, 990),
    step: () => {
      stepFlip ^= 1;
      ns(0.035, 0.08, "bandpass", stepFlip ? 900 : 700, 400);
    },
    bump: () => tn(130, 0.07, "square", 0.12, 90),
    talk: () => tn(480 + Math.random() * 120, 0.05, "square", 0.08),
    portal: () => arp([392, 523, 659, 784, 1047], 0.06, "triangle", 0.16),
    chest: () => {
      ns(0.08, 0.1, "highpass", 2000);
      arp([523, 659, 784, 1047, 1319, 1568], 0.06, "square", 0.12);
    },
    herb: () => {
      tn(620, 0.09, "triangle", 0.2, 980);
      tn(1180, 0.1, "sine", 0.12, 0, 0.07);
    },
    crystal: () =>
      arp(
        [523, 659, 784, 1047, 784, 1047, 1319, 1568],
        0.075,
        "sine",
        0.18,
        2.2,
      ),
    bag: () => {
      ns(0.06, 0.12, "lowpass", 1200, 400);
      tn(300, 0.06, "triangle", 0.15, 460, 0.03);
    },
    coin: () => {
      tn(988, 0.07, "square", 0.12);
      tn(1319, 0.16, "square", 0.12, 0, 0.07);
    },
    quest: () => arp([523, 659, 784, 659, 784, 1047], 0.09, "square", 0.13),
    equip: () => {
      ns(0.05, 0.12, "highpass", 3000);
      tn(220, 0.08, "square", 0.12, 330, 0.03);
    },
    potion: () => {
      for (let i = 0; i < 3; i++)
        tn(500 - i * 70, 0.07, "sine", 0.2, 380 - i * 60, i * 0.08);
    },
    start: () => {
      ns(0.35, 0.18, "bandpass", 300, 3000);
      tn(160, 0.4, "sawtooth", 0.14, 700);
      arp([220, 330, 440], 0.1, "square", 0.1);
    },
    hint: () => arp([880, 1175], 0.07, "sine", 0.16),
    tick: () => tn(1400, 0.03, "square", 0.08),
    correct: () => arp([659, 880, 1319], 0.07, "square", 0.14),
    wrong: () => {
      tn(220, 0.28, "sawtooth", 0.16, 110);
      tn(207, 0.28, "square", 0.08, 100, 0.02);
    },
    whoosh: () => ns(0.14, 0.2, "bandpass", 500, 3500),
    hit: () => {
      ns(0.16, 0.34, "lowpass", 3000, 200);
      tn(190, 0.18, "square", 0.3, 45);
      tn(900, 0.05, "square", 0.12, 200);
    },
    hurt: () => {
      ns(0.18, 0.3, "lowpass", 2200, 150);
      tn(150, 0.24, "sawtooth", 0.2, 55);
    },
    heal: () => arp([523, 659, 784, 1047, 1319], 0.07, "sine", 0.2, 2.2),
    win: () => {
      arp([523, 523, 523, 659, 784, 1047], 0.12, "square", 0.14, 1.3);
      arp([262, 330, 392, 523], 0.2, "triangle", 0.14, 1.5);
    },
    level: () =>
      arp([392, 523, 659, 784, 1047, 1319, 1568], 0.07, "triangle", 0.2, 1.8),
    lose: () => arp([392, 349, 330, 262, 196], 0.22, "triangle", 0.2, 1.4),
  };

  /* ---------- suara monster ---------- */
  const M = {
    slime: {
      appear: () => {
        wob(260, 0.2, "sine", 0.28, 6, 0.18);
        wob(200, 0.18, "sine", 0.22, 6, 0.18);
      },
      atk: () => {
        tn(420, 0.22, "sine", 0.28, 120);
        ns(0.2, 0.12, "bandpass", 1500, 500);
      },
      hurt: () => {
        tn(520, 0.14, "square", 0.14, 240);
        wob(300, 0.15, "sine", 0.2, 4, 0.2);
      },
      die: () => {
        tn(360, 0.5, "sine", 0.3, 60);
        wob(200, 0.4, "sine", 0.2, 8, 0.2);
      },
    },
    fox: {
      appear: () => {
        tn(900, 0.09, "square", 0.14, 1500);
        tn(1000, 0.09, "square", 0.14, 1700, 0.13);
      },
      atk: () => {
        tn(700, 0.12, "sawtooth", 0.18, 1400);
        tn(500, 0.2, "sawtooth", 0.18, 250, 0.1);
        ns(0.2, 0.08, "highpass", 3000, 1500, 0.1);
      },
      hurt: () => tn(1500, 0.2, "sawtooth", 0.16, 500),
      die: () => {
        tn(1400, 0.5, "sawtooth", 0.14, 250);
        tn(900, 0.4, "square", 0.08, 200, 0.1);
      },
    },
    golem: {
      appear: () => {
        ns(0.6, 0.3, "lowpass", 220, 80);
        tn(60, 0.55, "square", 0.22, 40);
        tn(90, 0.5, "sawtooth", 0.1, 50, 0.1);
      },
      atk: () => {
        tn(80, 0.3, "square", 0.3, 28);
        ns(0.3, 0.3, "lowpass", 400, 60, 0.12);
        ns(0.12, 0.2, "highpass", 3000, 800, 0.14);
      },
      hurt: () => {
        ns(0.14, 0.34, "highpass", 2500, 700);
        tn(110, 0.2, "square", 0.2, 50);
      },
      die: () => {
        ns(0.9, 0.34, "lowpass", 800, 60);
        tn(90, 0.9, "sawtooth", 0.2, 30);
        ns(0.15, 0.25, "highpass", 3500, 900, 0.4);
      },
    },
    dragon: {
      appear: () => {
        wob(95, 0.9, "sawtooth", 0.3, 18, 0.05);
        tn(180, 0.9, "sawtooth", 0.14, 70);
        ns(0.9, 0.2, "bandpass", 500, 160);
      },
      atk: () => {
        ns(0.55, 0.36, "lowpass", 2600, 300);
        tn(130, 0.5, "sawtooth", 0.2, 55);
        ns(0.4, 0.18, "bandpass", 1200, 400, 0.1);
      },
      hurt: () => {
        tn(280, 0.35, "sawtooth", 0.22, 90);
        ns(0.25, 0.18, "bandpass", 700, 300);
      },
      die: () => {
        wob(140, 1.1, "sawtooth", 0.26, 20, 0.07);
        tn(260, 1.2, "sawtooth", 0.14, 40);
        ns(1.1, 0.22, "lowpass", 1500, 100);
      },
    },
    wolf: {
      appear: () => {
        tn(300, 0.5, "sawtooth", 0.2, 700);
        tn(700, 0.5, "sawtooth", 0.14, 330, 0.4);
      },
      atk: () => {
        ns(0.15, 0.2, "bandpass", 1200, 600);
        tn(260, 0.2, "sawtooth", 0.2, 130);
      },
      hurt: () => {
        tn(900, 0.2, "sawtooth", 0.18, 300);
      },
      die: () => {
        tn(700, 0.7, "sawtooth", 0.16, 160);
      },
    },
    bandit: {
      appear: () => {
        tn(220, 0.15, "square", 0.16, 330);
        tn(330, 0.15, "square", 0.16, 440, 0.15);
      },
      atk: () => {
        ns(0.14, 0.22, "bandpass", 2500, 900);
        tn(300, 0.15, "square", 0.16, 150, 0.05);
      },
      hurt: () => {
        tn(400, 0.18, "square", 0.16, 200);
      },
      die: () => {
        tn(300, 0.5, "square", 0.16, 70);
      },
    },
    goblin: {
      appear: () => {
        tn(500, 0.1, "square", 0.14, 800);
        tn(650, 0.1, "square", 0.14, 950, 0.12);
      },
      atk: () => {
        tn(800, 0.1, "sawtooth", 0.16, 400);
        ns(0.12, 0.15, "highpass", 3000);
      },
      hurt: () => {
        tn(1000, 0.15, "square", 0.14, 400);
      },
      die: () => {
        tn(900, 0.4, "square", 0.14, 150);
      },
    },
    scorpion: {
      appear: () => {
        ns(0.4, 0.18, "highpass", 3500, 1500);
      },
      atk: () => {
        ns(0.2, 0.2, "highpass", 4000, 1000);
        tn(1200, 0.1, "square", 0.1, 600, 0.05);
      },
      hurt: () => {
        ns(0.15, 0.2, "bandpass", 3000, 1000);
      },
      die: () => {
        ns(0.6, 0.2, "highpass", 3500, 500);
      },
    },
    mummy: {
      appear: () => {
        wob(110, 0.8, "sawtooth", 0.2, 5, 0.1);
        ns(0.7, 0.1, "lowpass", 600, 200);
      },
      atk: () => {
        tn(120, 0.3, "sawtooth", 0.22, 60);
        ns(0.25, 0.2, "lowpass", 900, 200);
      },
      hurt: () => {
        tn(180, 0.2, "sawtooth", 0.18, 90);
      },
      die: () => {
        ns(0.9, 0.2, "lowpass", 1200, 100);
        tn(150, 0.8, "sawtooth", 0.14, 40);
      },
    },
    cobra: {
      appear: () => {
        ns(0.6, 0.16, "bandpass", 5000, 3000);
      },
      atk: () => {
        ns(0.3, 0.24, "highpass", 4500, 2500);
        tn(600, 0.15, "sawtooth", 0.12, 200, 0.1);
      },
      hurt: () => {
        ns(0.2, 0.2, "bandpass", 4000, 1500);
      },
      die: () => {
        ns(0.7, 0.18, "bandpass", 4500, 800);
      },
    },
  };

  /* ---------- musik (sequencer kecil) ---------- */
  const NM = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const fq = (n) => {
    const m = /^([A-G])([#b]?)(\d)$/.exec(n);
    if (!m) return 0;
    const s =
      NM[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) + (+m[3] - 4) * 12;
    return 440 * Math.pow(2, (s - 9) / 12);
  };
  // "C5:1 E5:.5 -:.5" -> [[nada, beat], ...]
  const seq = (str, def = 1) =>
    str
      .trim()
      .split(/\s+/)
      .map((t) => {
        const [n, b] = t.split(":");
        return [n === "-" ? null : n, b ? +b : def];
      });
  // pola 8th-note: "A4 A4 C5 ..." tiap nada 0.5 beat
  const e8 = (str) => seq(str, 0.5);
  const T = {
    village: {
      bpm: 112,
      v: [
        {
          w: "square",
          g: 0.05,
          n: seq(
            "E5:.5 G5:.5 C6:1 G5:.5 E5:.5 G5:1 F5:.5 A5:.5 C6:1 A5:.5 F5:.5 A5:1 G5:.5 B5:.5 D6:1 B5:.5 G5:.5 B5:1 C6:1.5 G5:.5 E5:2",
          ),
        },
        {
          w: "triangle",
          g: 0.12,
          n: seq("C3 G3 C3 G3 F2 C3 F2 C3 G2 D3 G2 D3 C3 G3 C3 -"),
        },
        {
          w: "square",
          g: 0.025,
          n: e8(
            "C4 E4 G4 E4 C4 E4 G4 E4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3 C4 E4 G4 E4 C4 E4 G4 E4",
          ),
        },
      ],
    },
    forest: {
      bpm: 88,
      v: [
        {
          w: "triangle",
          g: 0.1,
          n: seq("A4 C5 E5 C5 G4 B4 D5 B4 F4 A4 C5 A4 E4 G#4 B4 E5"),
        },
        {
          w: "sine",
          g: 0.16,
          n: seq("A2:2 E3:2 G2:2 D3:2 F2:2 C3:2 E2:2 B2:2"),
        },
        {
          w: "square",
          g: 0.02,
          n: e8(
            "E5 - - - D5 - - - C5 - - - B4 - - - A4 - - - G4 - - - F4 - - - E4 - - -",
          ),
        },
      ],
    },
    city: {
      bpm: 124,
      v: [
        {
          w: "square",
          g: 0.05,
          n: seq(
            "G5:.5 E5:.5 G5:.5 C6:.5 B5:1 G5:1 A5:.5 F5:.5 A5:.5 D6:.5 C6:1 A5:1 G5:.5 E5:.5 G5:.5 C6:.5 E6:1 D6:1 C6:2 G5:1 -:1",
          ),
        },
        {
          w: "triangle",
          g: 0.13,
          n: seq(
            "C3:.5 E3:.5 G3:.5 E3:.5 C3:.5 E3:.5 G3:.5 E3:.5 F2:.5 A2:.5 C3:.5 A2:.5 F2:.5 A2:.5 C3:.5 A2:.5 G2:.5 B2:.5 D3:.5 B2:.5 G2:.5 B2:.5 D3:.5 B2:.5 C3:1 G2:1 C3:2",
          ),
        },
        {
          w: "square",
          g: 0.02,
          n: seq(
            "-:.5 E4:.5 -:.5 E4:.5 -:.5 E4:.5 -:.5 E4:.5 -:.5 F4:.5 -:.5 F4:.5 -:.5 F4:.5 -:.5 F4:.5 -:.5 D4:.5 -:.5 D4:.5 -:.5 D4:.5 -:.5 D4:.5 -:.5 E4:.5 -:.5 E4:.5 -:4",
          ),
        },
      ],
    },
    quiet: {
      bpm: 76,
      v: [
        {
          w: "triangle",
          g: 0.11,
          n: seq("D5:1 F#5:1 A5:2 G5:1 F#5:1 E5:2 F#5:1 A5:1 B5:2 A5:3 -:1"),
        },
        { w: "sine", g: 0.18, n: seq("D3:4 A2:4 G2:4 A2:4") },
        {
          w: "sine",
          g: 0.05,
          n: seq("F#4:2 A4:2 E4:2 G4:2 D4:2 F#4:2 E4:2 C#4:2"),
        },
      ],
    },
    dungeon: {
      bpm: 80,
      v: [
        {
          w: "square",
          g: 0.04,
          n: seq("D4:1 -:1 F4:1 E4:1 D4:1 -:1 A3:2 Bb3:1 -:1 C4:1 D4:1 A3:4"),
        },
        { w: "sawtooth", g: 0.06, n: seq("D2:4 D2:4 Bb1:4 A1:4") },
        {
          w: "triangle",
          g: 0.09,
          n: e8(
            "D3 - D3 - D3 - D3 - D3 - D3 - D3 - D3 - Bb2 - Bb2 - Bb2 - Bb2 - A2 - A2 - A2 - A2 -",
          ),
        },
      ],
    },
    guild: {
      bpm: 100,
      v: [
        {
          w: "triangle",
          g: 0.12,
          n: seq(
            "A4:1 C5:1 F5:1 C5:1 G4:1 Bb4:1 D5:1 Bb4:1 A4:1 C5:1 F5:1 A5:1 G5:2 F5:2",
          ),
        },
        {
          w: "sine",
          g: 0.17,
          n: seq("F2:2 C3:2 G2:2 D3:2 F2:2 C3:2 C3:2 F2:2"),
        },
        {
          w: "square",
          g: 0.02,
          n: e8(
            "F4 A4 C5 A4 F4 A4 C5 A4 G4 Bb4 D5 Bb4 G4 Bb4 D5 Bb4 F4 A4 C5 A4 F4 A4 C5 A4 E4 G4 C5 G4 F4 A4 C5 A4",
          ),
        },
      ],
    },
    battle: {
      bpm: 150,
      v: [
        {
          w: "square",
          g: 0.05,
          n: e8(
            "A4 A4 C5 A4 E5 A4 D5 C5 G4 G4 B4 G4 D5 G4 C5 B4 F4 F4 A4 F4 C5 F4 B4 A4 E4 E4 G#4 E4 B4 E4 A4 G#4",
          ),
        },
        {
          w: "triangle",
          g: 0.14,
          n: e8(
            "A2 A3 A2 A3 A2 A3 A2 A3 G2 G3 G2 G3 G2 G3 G2 G3 F2 F3 F2 F3 F2 F3 F2 F3 E2 E3 E2 E3 E2 E3 E2 E3",
          ),
        },
        {
          w: "square",
          g: 0.02,
          n: seq(
            "A5:.5 -:.5 E5:.5 -:.5 A5:.5 -:.5 E5:.5 -:.5 G5:.5 -:.5 D5:.5 -:.5 G5:.5 -:.5 D5:.5 -:.5 F5:.5 -:.5 C5:.5 -:.5 F5:.5 -:.5 C5:.5 -:.5 E5:.5 -:.5 B4:.5 -:.5 E5:.5 -:.5 B4:.5 -:.5",
          ),
        },
      ],
    },
    boss: {
      bpm: 164,
      v: [
        {
          w: "sawtooth",
          g: 0.045,
          n: e8(
            "D5 D5 F5 D5 A5 D5 G5 F5 C5 C5 Eb5 C5 G5 C5 F5 Eb5 Bb4 Bb4 D5 Bb4 F5 Bb4 Eb5 D5 A4 A4 C#5 A4 E5 A4 D5 C#5",
          ),
        },
        {
          w: "triangle",
          g: 0.15,
          n: e8(
            "D2 D3 D2 D3 D2 D3 D2 D3 C2 C3 C2 C3 C2 C3 C2 C3 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 Bb1 Bb2 A1 A2 A1 A2 A1 A2 A1 A2",
          ),
        },
        {
          w: "square",
          g: 0.03,
          n: seq(
            "D4:.5 D4:.5 -:.5 D4:.5 F4:.5 D4:.5 -:.5 D4:.5 C4:.5 C4:.5 -:.5 C4:.5 Eb4:.5 C4:.5 -:.5 C4:.5 Bb3:.5 Bb3:.5 -:.5 Bb3:.5 D4:.5 Bb3:.5 -:.5 Bb3:.5 A3:.5 A3:.5 -:.5 A3:.5 C#4:.5 A3:.5 -:.5 A3:.5",
          ),
        },
      ],
    },
    desert: {
      bpm: 92,
      v: [
        {
          w: "square",
          g: 0.05,
          n: seq(
            "D4:1 Eb4:.5 F#4:.5 G4:1 F#4:.5 Eb4:.5 D4:1 A4:1 Bb4:.5 A4:.5 G4:1 F#4:1 Eb4:.5 D4:.5 D4:2 -:4",
          ),
        },
        {
          w: "triangle",
          g: 0.12,
          n: seq("D2:2 A2:2 D2:2 A2:2 Bb1:2 F2:2 A1:2 A2:2"),
        },
        {
          w: "square",
          g: 0.02,
          n: e8("D3 A3 D4 A3 D3 A3 D4 A3 Bb2 F3 Bb3 F3 A2 E3 A3 E3"),
        },
      ],
    },
    royal: {
      bpm: 104,
      v: [
        {
          w: "square",
          g: 0.05,
          n: seq(
            "C5:1 G4:.5 C5:.5 E5:1 G5:1 F5:.5 E5:.5 D5:1 C5:1 D5:.5 E5:.5 F5:1 E5:1 D5:.5 C5:.5 D5:1 G4:2 -:2",
          ),
        },
        {
          w: "triangle",
          g: 0.12,
          n: seq("C3:2 G2:2 A2:2 E3:2 F2:2 C3:2 G2:2 G2:2"),
        },
        {
          w: "square",
          g: 0.025,
          n: e8(
            "C4 E4 G4 E4 C4 E4 G4 E4 A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3",
          ),
        },
      ],
    },
    throne: {
      bpm: 70,
      v: [
        {
          w: "triangle",
          g: 0.09,
          n: seq("G4:2 C5:2 E5:3 D5:1 C5:2 B4:2 G4:3 -:1"),
        },
        { w: "triangle", g: 0.12, n: seq("C3:4 G2:4 A2:4 G2:4") },
        { w: "square", g: 0.02, n: seq("C4:4 B3:4 A3:4 B3:4") },
      ],
    },
  };
  const mapTrack = {
    F: "forest",
    P: "desert",
    R: "royal",
    N: "throne",
    J: "guild",
    V: "village",
    H: "forest",
    K: "city",
    T: "quiet",
    D: "dungeon",
    I: "guild",
  };

  function tick() {
    if (!cur || !ok()) return;
    const sp = 60 / cur.t.bpm;
    cur.v.forEach((v) => {
      while (v.next < ac.currentTime + 0.35) {
        const [n, b] = v.n[v.i % v.n.length];
        if (n) {
          const f = fq(n),
            d = Math.max(0.05, b * sp * 0.9);
          if (f)
            tn(f, d, v.w, v.g, 0, Math.max(0, v.next - ac.currentTime), cur.g);
        }
        v.next += b * sp;
        v.i++;
      }
    });
  }
  function stopMus() {
    clearInterval(timer);
    timer = null;
    if (cur && ok()) {
      const g = cur.g,
        t = ac.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + 0.4);
      setTimeout(() => g.disconnect(), 600);
    }
    cur = null;
  }
  function play(name) {
    if (!ok()) return;
    stopMus();
    const t = T[name];
    if (!t) return;
    const g = ac.createGain();
    g.gain.value = 0.0001;
    g.gain.linearRampToValueAtTime(1, ac.currentTime + 0.5);
    g.connect(musG);
    const t0 = ac.currentTime + 0.08;
    cur = { name, t, g, v: t.v.map((v) => ({ ...v, i: 0, next: t0 })) };
    tick();
    timer = setInterval(tick, 90);
  }

  /* ---------- API ---------- */
  const api = {
    on,
    sfx(n) {
      if (!ok() || !on.sfx) return;
      if (n === "bump") {
        const t = Date.now();
        if (t - lastBump < 250) return;
        lastBump = t;
      }
      X[n] && X[n]();
    },
    mon(sp, k) {
      if (!ok() || !on.sfx) return;
      M[sp] && M[sp][k] && M[sp][k]();
    },
    music(n) {
      if (n && T[n] === undefined && mapTrack[n]) n = mapTrack[n];
      want = n;
      if (!ok()) return;
      if (!n) return stopMus();
      if (!cur || cur.name !== n) play(n);
    },
    setSfx(v) {
      on.sfx = !!v;
      if (ac) sfxG.gain.value = v ? 1 : 0;
      save();
    },
    setMus(v) {
      on.mus = !!v;
      if (ac) musG.gain.value = v ? 1 : 0;
      save();
    },
    tracks: T,
  };

  /* ---------- pasang ke halaman ---------- */
  if (typeof document !== "undefined" && document.addEventListener) {
    const unlock = () => ensure();
    ["pointerdown", "keydown", "touchstart"].forEach((e) =>
      document.addEventListener(e, unlock, { passive: true }),
    );
    // klik tombol game -> bunyi klik
    document.addEventListener("click", (e) => {
      const b = e.target && e.target.closest && e.target.closest(".b");
      if (b && !b.disabled) api.sfx("click");
    });
    const bind = () => {
      const s = document.querySelector("#snd"),
        m = document.querySelector("#mus");
      if (s) {
        s.checked = on.sfx;
        s.onchange = () => {
          api.setSfx(s.checked);
          s.blur();
        };
      }
      if (m) {
        m.checked = on.mus;
        m.onchange = () => {
          api.setMus(m.checked);
          m.blur();
        };
      }
      // kotak centang Timer juga harus melepas fokus, supaya tombol gerak tetap jalan
      const tm = document.querySelector("#tmr");
      if (tm) tm.addEventListener("change", () => tm.blur());
    };
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", bind);
    else bind();
    document.addEventListener("visibilitychange", () => {
      if (!ac) return;
      if (document.hidden) ac.suspend();
      else ac.resume();
    });
  }
  return api;
})();
