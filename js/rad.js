// "Kako radi": klik na sliku stroja otvara animaciju principa rada
(() => {
  const targets = [...document.querySelectorAll('[data-rad]')];
  if (!targets.length) return;

  const W = 960, H = 540, TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = x => x * x * (3 - 2 * x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const rnd = (a, b) => a + Math.random() * (b - a);
  let c;

  // ---------- Pomoćne funkcije za crtanje ----------
  function glow(x, y, r, rgb, a) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.restore();
  }
  function label(txt, x, y, align = 'left', col = '#8a939c') {
    c.font = '500 13px "IBM Plex Mono", Consolas, monospace';
    c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle';
    c.fillText(txt.toUpperCase(), x, y);
  }
  function poly(pts, fill) {
    c.fillStyle = fill; c.beginPath();
    pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
    c.closePath(); c.fill();
  }
  function line(x1, y1, x2, y2, col, w) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function box(x, y, w, h, fill, stroke = '#59616b') {
    c.fillStyle = fill; c.fillRect(x, y, w, h);
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.strokeRect(x + .75, y + .75, w - 1.5, h - 1.5); }
  }
  // Isprekidani crveni okvir oko dijela koji radi u trenutnom koraku
  function focus(x, y, w, h) {
    c.save(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(228,23,32,.9)'; c.lineWidth = 1.5;
    c.strokeRect(x, y, w, h); c.restore();
  }
  function backdrop() {
    c.fillStyle = '#101317'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(140,180,210,.05)'; c.lineWidth = 1; c.beginPath();
    for (let x = 20; x < W; x += 40) { c.moveTo(x + .5, 0); c.lineTo(x + .5, H); }
    for (let y = 20; y < H; y += 40) { c.moveTo(0, y + .5); c.lineTo(W, y + .5); }
    c.stroke();
  }
  function polyLen(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return cum;
  }
  function pointAt(pts, cum, s) {
    let i = 1;
    while (i < cum.length - 1 && cum[i] < s) i++;
    const k = clamp((s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1));
    return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)];
  }
  function strokeTo(pts, cum, s) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    let i = 1;
    for (; i < pts.length && cum[i] <= s; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (i < pts.length) { const p = pointAt(pts, cum, s); c.lineTo(p[0], p[1]); }
    c.stroke();
  }
  const circlePts = (cx, cy, r) => Array.from({ length: 49 }, (_, i) => {
    const a = -Math.PI / 2 + i / 48 * TAU; return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  function roundRectPts(x, y, w, h, r) {
    const pts = [[x + r, y]];
    for (const [cx, cy, a0] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]])
      for (let i = 0; i <= 10; i++) { const a = a0 + i / 10 * Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  }

  // ---------- Iskre i dim ----------
  const P = [];
  function emit(x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = (o.dir ?? -Math.PI / 2) + (Math.random() - .5) * (o.spread ?? Math.PI);
      const v = (o.speed ?? 300) * rnd(.35, 1);
      P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: (o.life ?? .5) * rnd(.5, 1),
        g: o.g ?? 900, kind: o.kind || 'spark', r: o.r ?? 5 });
    }
  }
  function particles(dt) {
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life += dt;
      if (p.life >= p.max) { P.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (const p of P) if (p.kind === 'smoke') {
      const k = p.life / p.max;
      c.fillStyle = `rgba(150,160,172,${.2 * Math.sin(Math.PI * k)})`;
      c.beginPath(); c.arc(p.x, p.y, p.r * (1 + k * 2.5), 0, TAU); c.fill();
    }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const p of P) if (p.kind === 'spark') {
      const k = 1 - p.life / p.max;
      c.strokeStyle = `rgba(255,${150 + 100 * k | 0},${60 + 130 * k * k | 0},${Math.min(1, k * 1.5)})`;
      c.lineWidth = .8 + 1.4 * k;
      c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .025, p.y - p.vy * .025); c.stroke();
    }
    c.restore();
  }

  // ---------- Animacije ----------
  const ANIM = {};

  // Fiber laser, ploče: pogled odozgo, glava probija i reže otvore pa vanjsku konturu
  ANIM['laser-ploca'] = (() => {
    const shapes = [
      { pts: circlePts(390, 285, 36), hole: true },
      { pts: circlePts(570, 285, 36), hole: true },
      { pts: circlePts(480, 222, 15), hole: true },
      { pts: roundRectPts(300, 175, 360, 220, 46), hole: false },
    ];
    shapes.forEach(s => { s.cum = polyLen(s.pts); s.len = s.cum[s.cum.length - 1]; });
    const PARK = [790, 130], V = 280, ev = [];
    let T = 0, prev = PARK;
    for (const s of shapes) {
      ev.push({ k: 0, s, a: T, b: T += .55, from: prev, to: s.pts[0] });
      ev.push({ k: 1, s, a: T, b: T += .45 });
      ev.push({ k: 2, s, a: T, b: T += s.len / V });
      s.cut = ev[ev.length - 1];
      prev = s.pts[s.pts.length - 1];
    }
    ev.push({ k: 3, a: T, b: T += 2.6, from: prev, to: PARK });
    const outer = shapes[3];
    const fillShape = (pts, col) => poly(pts, col);
    return {
      dur: T, steps: ['Pozicioniranje glave', 'Probijanje lima', 'Rezanje konture', 'Gotov dio'],
      draw(t) {
        box(110, 80, 740, 400, '#1b1f24', null);
        c.fillStyle = '#252a30';
        for (let x = 124; x < 850; x += 28) c.fillRect(x, 80, 8, 400);
        const g = c.createLinearGradient(150, 110, 810, 450);
        g.addColorStop(0, '#a3abb3'); g.addColorStop(1, '#7b848d');
        c.fillStyle = g; c.fillRect(150, 110, 660, 340);
        c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 1; c.beginPath();
        for (let y = 114; y < 450; y += 5) { c.moveTo(150, y + .5); c.lineTo(810, y + .5); }
        c.stroke();

        const e = ev.find(v => t < v.b) || ev[ev.length - 1];
        const lift = e.k === 3 ? ease(seg(t, e.a, e.a + .8)) : 0;
        c.lineJoin = 'round';
        for (const s of shapes) {
          const done = t >= s.cut.b;
          if (s === outer && lift > 0) continue;
          if (done && s.hole) fillShape(s.pts, '#0d0f12');
          if (done || e === s.cut) {
            c.strokeStyle = '#15181c'; c.lineWidth = 3.5;
            strokeTo(s.pts, s.cum, done ? s.len : (t - e.a) * V);
          }
        }
        // Gotov dio se podigne iz lima
        if (lift > 0) {
          fillShape(outer.pts, 'rgba(0,0,0,.5)');
          c.save(); c.translate(-7 * lift, -12 * lift);
          const g2 = c.createLinearGradient(300, 175, 660, 395);
          g2.addColorStop(0, '#c3cad0'); g2.addColorStop(1, '#929ba4');
          fillShape(outer.pts, g2);
          for (const s of shapes) if (s.hole) fillShape(s.pts, '#2a2f35');
          c.restore();
          label('Gotov dio', 480, 430, 'center', '#e6ecf0');
        }
        // Užareni trag iza glave
        if (e.k === 2) {
          const s = e.s, now = (t - e.a) * V;
          for (let j = 0; j < 10; j++) {
            const a = Math.max(0, now - 60 + j * 6), b = Math.max(0, now - 54 + j * 6);
            const p1 = pointAt(s.pts, s.cum, a), p2 = pointAt(s.pts, s.cum, b);
            line(p1[0], p1[1], p2[0], p2[1], `rgba(255,${90 + j * 12},40,${j / 10})`, 3.5);
          }
        }

        let hp;
        if (e.k === 0) { const k = ease(seg(t, e.a, e.b)); hp = [lerp(e.from[0], e.to[0], k), lerp(e.from[1], e.to[1], k)]; }
        else if (e.k === 1) hp = e.s.pts[0];
        else if (e.k === 2) hp = pointAt(e.s.pts, e.s.cum, (t - e.a) * V);
        else { const k = ease(seg(t, e.a, e.a + 1)); hp = [lerp(e.from[0], e.to[0], k), lerp(e.from[1], e.to[1], k)]; }
        const [hx, hy] = hp;
        c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(hx + 9, hy + 12, 26, 0, TAU); c.fill();
        c.fillStyle = '#2a2f35'; c.beginPath(); c.arc(hx, hy, 24, 0, TAU); c.fill();
        c.strokeStyle = '#c9d0d6'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#14171b'; c.beginPath(); c.arc(hx, hy, 7, 0, TAU); c.fill();
        line(hx - 34, hy, hx - 27, hy, '#c9d0d6', 1.5); line(hx + 27, hy, hx + 34, hy, '#c9d0d6', 1.5);
        line(hx, hy - 34, hx, hy - 27, '#c9d0d6', 1.5); line(hx, hy + 27, hx, hy + 34, '#c9d0d6', 1.5);
        if (e.k === 1) {
          const k = seg(t, e.a, e.b);
          glow(hx, hy, 18 + 30 * k, '255,90,40', .5 + .4 * k); glow(hx, hy, 8, '255,245,235', 1);
          emit(hx, hy, 2, { spread: TAU, speed: 170, life: .2, g: 0 });
        } else if (e.k === 2) {
          glow(hx, hy, 34, '255,80,30', .55); glow(hx, hy, 9, '255,245,235', 1);
          emit(hx, hy, 3, { spread: TAU, speed: 240, life: .22, g: 0 });
        }
        label('Radni stol', 110, 500); label('Lim', 150, 96);
        label('Laserska glava', hx + 40, hy - 34);
        return e.k;
      },
    };
  })();

  // Fiber laser, cijevi: stezna glava drži cijev, cijev se okreće pod glavom i pomiče naprijed
  ANIM['laser-cijev'] = (() => {
    const HX = 560, CY = 300, R = 56, PITCH = 190;
    const phiAt = t => TAU * (seg(t, 1, 3.6) + seg(t, 4.6, 7.2));
    const cuts = [{ lx: 0, a: 1, b: 3.6, p0: 0 }, { lx: -PITCH, a: 4.6, b: 7.2, p0: TAU }];
    function cyl(x0, x1, dy, ang, phi) {
      const w = x1 - x0;
      if (w <= 0) return;
      c.save(); c.translate((x0 + x1) / 2, CY + dy); c.rotate(ang);
      const g = c.createLinearGradient(0, -R, 0, R);
      g.addColorStop(0, '#3d434a'); g.addColorStop(.28, '#cdd3d9'); g.addColorStop(.55, '#8d969f'); g.addColorStop(1, '#262a2f');
      c.fillStyle = g; c.fillRect(-w / 2, -R, w, 2 * R);
      c.strokeStyle = 'rgba(20,23,27,.28)'; c.lineWidth = 2; c.beginPath();
      for (let k = 0; k < 6; k++) {
        const s = phi + k * TAU / 6;
        if (Math.cos(s) > 0) { const y = R * Math.sin(s); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); }
      }
      c.stroke();
      c.fillStyle = '#2a2f35'; c.beginPath(); c.ellipse(w / 2, 0, 9, R, 0, 0, TAU); c.fill();
      c.fillStyle = '#0d0f12'; c.beginPath(); c.ellipse(w / 2, 0, 6, R - 7, 0, 0, TAU); c.fill();
      c.restore();
    }
    return {
      dur: 8.8, steps: ['Stezanje cijevi', 'Rotacija i rezanje', 'Pomak cijevi', 'Gotov komad'],
      draw(t) {
        const phi = phiAt(t);
        const shift = PITCH * ease(seg(t, 3.6, 4.6));
        const sx = lx => HX + lx + shift;
        // oslonac
        c.fillStyle = '#3a4047'; c.beginPath(); c.arc(330, CY + R + 15, 14, 0, TAU); c.fill();
        box(322, CY + R + 15, 16, 120, '#2a2f35', null);
        const end = t >= 7.2 ? -PITCH : t >= 3.6 ? 0 : 26;
        cyl(sx(-800), sx(end), 0, 0, phi);
        if (t >= 3.6 && t < 7.2) {      // otpadni prsten nakon prvog reza
          const f = t - 3.6, dy = 800 * f * f;
          if (dy < 400) cyl(HX, HX + 26, dy, f * 1.4, phi);
        }
        if (t >= 7.2) {                 // gotov komad pada
          const f = t - 7.2, dy = 700 * f * f;
          if (dy < 420) cyl(HX, HX + PITCH, dy, f * .5, phi);
        }
        // rez koji nastaje dok se cijev okreće
        for (const k of cuts) {
          if (t < k.a || t >= k.b) continue;
          c.strokeStyle = '#0d0f12'; c.lineWidth = 3; c.beginPath();
          let pen = false;
          for (let a = 0; a <= phi - k.p0; a += .04) {
            const s = -Math.PI / 2 + (phi - k.p0 - a);
            if (Math.cos(s) > .02) {
              const x = sx(k.lx) + 10 * Math.sin(2 * a), y = CY + R * Math.sin(s);
              pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true;
            } else pen = false;
          }
          c.stroke();
        }
        // stezna glava
        const gap = 26 * (1 - ease(seg(t, 0, .9)));
        box(40, CY - R - 52, 100, 2 * R + 104, '#2a2f35');
        box(60, CY - R - 24 - gap, 60, 22, '#59616b', null);
        box(60, CY + R + 2 + gap, 60, 22, '#59616b', null);
        // laserska glava
        line(HX, 0, HX, 90, '#2a2f35', 6);
        box(HX - 26, 90, 52, 110, '#2a2f35');
        poly([[HX - 16, 200], [HX + 16, 200], [HX + 5, CY - R - 10], [HX - 5, CY - R - 10]], '#b87333');
        const cutting = (t > 1 && t < 3.6) || (t > 4.6 && t < 7.2);
        if (cutting) {
          line(HX, CY - R - 10, HX, CY - R, 'rgba(255,120,90,.9)', 2);
          glow(HX, CY - R, 40, '255,80,30', .55); glow(HX, CY - R, 10, '255,245,235', 1);
          emit(HX, CY - R + 2, 3, { dir: -Math.PI / 2 + .7, spread: 1.6, speed: 300, life: .45, g: 1100 });
        }
        label('Stezna glava', 40, CY + R + 76); label('Laserska glava', HX + 40, 120); label('Cijev', 180, CY - R - 18);
        if (t < 1) return 0;
        if (t >= 7.2) return 3;
        if (t >= 3.6 && t < 4.6) return 2;
        return 1;
      },
    };
  })();

  // Ručno lasersko zavarivanje: kontakt, paljenje, wobble var uz dodatnu žicu
  ANIM.zavarivanje = (() => {
    const Y = 320, X0 = 170, X1 = 790;
    return {
      dur: 10, steps: ['Kontakt senzora', 'Paljenje lasera', 'Wobble zavarivanje', 'Gotov spoj'],
      draw(t) {
        const gb = c.createLinearGradient(0, 205, 0, Y);
        gb.addColorStop(0, '#5f676f'); gb.addColorStop(1, '#9aa2aa');
        poly([[150, 205], [810, 205], [850, Y - 3], [110, Y - 3]], gb);
        const gf = c.createLinearGradient(0, Y, 0, 440);
        gf.addColorStop(0, '#a6aeb6'); gf.addColorStop(1, '#737c85');
        poly([[110, Y + 3], [850, Y + 3], [884, 440], [76, 440]], gf);
        poly([[76, 440], [884, 440], [884, 458], [76, 458]], '#454b52');
        c.fillStyle = '#0d0f12'; c.fillRect(110, Y - 3, 740, 6);

        const hx = lerp(X0, X1, seg(t, 1.7, 8)), welding = t > 1.7 && t < 8;
        const cool = 1 - seg(t, 8, 9.5);
        if (hx > X0) { c.fillStyle = 'rgba(150,95,45,.18)'; c.fillRect(X0 - 4, Y - 13, hx - X0 + 4, 26); }
        for (let x = X0; x <= hx; x += 5) {
          const k = Math.exp(-(hx - x) / 55) * (welding ? 1 : cool);
          c.fillStyle = `rgb(${lerp(178, 255, k) | 0},${lerp(186, 150, k) | 0},${lerp(194, 60, k) | 0})`;
          c.beginPath(); c.ellipse(x, Y, 9, 6.5, 0, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(40,44,48,.45)'; c.lineWidth = 1;
          c.beginPath(); c.ellipse(x, Y, 9, 6.5, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
        }
        if (t > 1.2 && t < 8.2) line(hx - 150, 236, hx - 8, Y - 2, '#d0a35c', 3);
        // pištolj
        const gy = -70 * (1 - ease(seg(t, 0, 1.1)));
        c.save(); c.translate(hx, Y - 2 + gy); c.rotate(.5);
        poly([[-6, -26], [6, -26], [2.5, 0], [-2.5, 0]], '#c07a3e');
        box(-11, -110, 22, 84, '#2a2f35');
        c.fillStyle = '#e41720'; c.fillRect(-11, -62, 22, 6);
        box(-15, -230, 30, 120, '#1f2328');
        c.fillStyle = t > 1.1 ? '#2ee87a' : '#3a4047'; c.beginPath(); c.arc(18, -84, 4.5, 0, TAU); c.fill();
        c.restore();
        if (t > 1.2 && t < 1.7) {
          const k = seg(t, 1.2, 1.7);
          glow(hx, Y, 70 * k + 10, '150,180,255', .7); glow(hx, Y, 10, '255,255,255', 1);
        }
        if (welding) {
          const w = t * 38, wx = hx + 8 * Math.cos(w), wy = Y + 3.5 * Math.sin(w);
          glow(hx, Y, 70, '255,120,40', .45); glow(wx, wy, 22, '200,220,255', .9); glow(wx, wy, 7, '255,255,255', 1);
          if (Math.random() < .5) emit(hx, Y - 4, 1, { dir: -Math.PI / 2 - .6, spread: 1.4, speed: 300, life: .4, g: 1000 });
          if (Math.random() < .3) emit(hx, Y - 8, 1, { kind: 'smoke', dir: -Math.PI / 2, spread: .6, speed: 30, life: 1.6, g: -20, r: 5 });
        }
        if (t > 1.1 && t < 1.8) label('Kontakt ✓', hx + 60, Y - 150, 'left', '#2ee87a');
        label('Dodatna žica', Math.max(20, hx - 250), 222);
        if (t > 8) label('Uski var · minimalna zona topline', 480, 490, 'center', '#e6ecf0');
        return t < 1.2 ? 0 : t < 1.7 ? 1 : t < 8 ? 2 : 3;
      },
    };
  })();

  // Lasersko čišćenje: snop skenira površinu i skida hrđu do čistog metala
  ANIM.ciscenje = (() => {
    const X0 = 130, X1 = 830, Y0 = 140, Y1 = 430, B0 = 178, B1 = 392;
    let rust = null, wc = null, work = null, lastBx = X0;
    function makeRust() {
      rust = document.createElement('canvas'); rust.width = W; rust.height = H;
      const r = rust.getContext('2d');
      r.fillStyle = '#6e3a1c'; r.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      const cols = ['#8a4a22', '#a45a26', '#5a2e17', '#b8692c', '#4a2716', '#7f5a3a'];
      for (let i = 0; i < 900; i++) {
        const rr = rnd(2, 16);
        r.fillStyle = cols[i % 6]; r.globalAlpha = rnd(.25, .75);
        r.beginPath(); r.ellipse(rnd(X0, X1), rnd(Y0, Y1), rr, rr * rnd(.4, 1), rnd(0, 3), 0, TAU); r.fill();
      }
      work = document.createElement('canvas'); work.width = W; work.height = H;
      wc = work.getContext('2d');
    }
    return {
      dur: 10, steps: ['Hrđava površina', 'Skeniranje laserom', 'Čista površina'],
      reset() {
        if (!rust) makeRust();
        wc.globalCompositeOperation = 'source-over';
        wc.clearRect(0, 0, W, H); wc.drawImage(rust, 0, 0); lastBx = X0;
      },
      draw(t) {
        if (!rust) this.reset();
        const g = c.createLinearGradient(X0, Y0, X1, Y1);
        g.addColorStop(0, '#dde2e6'); g.addColorStop(1, '#98a1a9');
        c.fillStyle = g; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
        const bx = lerp(X0 + 12, X1 - 12, ease(seg(t, 1.2, 8)));
        if (bx > lastBx + .5) {
          wc.save(); wc.globalCompositeOperation = 'destination-out';
          wc.fillRect(lastBx, B0, bx - lastBx + 1, B1 - B0);
          for (let i = 0; i < 8; i++) {
            wc.beginPath(); wc.arc(rnd(lastBx, bx), Math.random() < .5 ? B0 : B1, rnd(2, 6), 0, TAU); wc.fill();
          }
          wc.restore(); lastBx = bx;
        }
        c.drawImage(work, 0, 0);
        c.strokeStyle = '#2a2f35'; c.lineWidth = 2; c.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);

        const scanning = t > 1.2 && t < 8;
        if (scanning) {
          c.strokeStyle = 'rgba(255,80,60,.18)'; c.lineWidth = 1; c.beginPath();
          c.moveTo(bx, 118); c.lineTo(bx, B0); c.moveTo(bx, 118); c.lineTo(bx, B1); c.stroke();
          c.save(); c.globalCompositeOperation = 'lighter';
          const lg = c.createLinearGradient(bx - 26, 0, bx + 26, 0);
          lg.addColorStop(0, 'rgba(255,80,40,0)'); lg.addColorStop(.5, 'rgba(255,80,40,.35)'); lg.addColorStop(1, 'rgba(255,80,40,0)');
          c.fillStyle = lg; c.fillRect(bx - 26, B0, 52, B1 - B0);
          c.restore();
          line(bx, B0, bx, B1, 'rgba(255,90,70,.95)', 2);
          const sy = B0 + (B1 - B0) * (.5 + .5 * Math.sin(t * 60));
          glow(bx, sy, 16, '255,240,230', 1);
          emit(bx, rnd(B0, B1), 2, { kind: 'smoke', dir: -Math.PI / 2 - .4, spread: 1, speed: 40, life: 1.2, g: -30, r: 4 });
          emit(bx, sy, 1, { dir: Math.PI, spread: 1.5, speed: 160, life: .2, g: 200 });
        }
        line(bx + 6, 40, bx + 60, 0, '#1f2328', 6);
        box(bx - 14, 40, 28, 70, '#2a2f35');
        c.fillStyle = '#14171b'; c.beginPath(); c.arc(bx, 112, 9, 0, TAU); c.fill();
        c.strokeStyle = scanning ? '#ff3b30' : '#59616b'; c.lineWidth = 2; c.stroke();
        label('Hrđa', X1 - 10, Y0 - 16, 'right');
        if (t > 3) label('Čisti metal', X0, Y1 + 22, 'left', '#e6ecf0');
        if (scanning) label('Skenirajući snop', bx + 24, 132);
        return t < 1.2 ? 0 : t < 8 ? 1 : 2;
      },
    };
  })();

  // Kutna preša: lim na graničnik, gornji alat ga utisne u matricu
  ANIM.presa = (() => {
    const CX = 480, DT = 395, SH = 389, L = 190;
    const punchY = t => t < 1.5 ? 300 : t < 3 ? lerp(300, SH, ease(seg(t, 1.5, 3)))
      : t < 5 ? lerp(SH, SH + 40, ease(seg(t, 3, 5))) : t < 6.5 ? lerp(SH + 40, 300, ease(seg(t, 5, 6.5))) : 300;
    return {
      dur: 8.5, steps: ['Lim na graničnik', 'Spuštanje alata', 'Savijanje', 'Povrat alata', 'Gotov kut'],
      draw(t) {
        const yP = punchY(t);
        const d = t < 3 ? 0 : t < 5 ? yP - SH : 40;
        const th = Math.atan2(d, 40);
        const xs = t < 1.5 ? lerp(20, CX - L, ease(seg(t, 0, 1.5))) : CX - L;
        box(200, 20, 40, 480, '#1f2328', null); box(720, 20, 40, 480, '#1f2328', null);
        box(300, 430, 360, 50, '#3a4047', null);
        poly([[340, DT], [440, DT], [480, DT + 40], [520, DT], [620, DT], [620, 430], [340, 430]], '#59616b');
        box(270, 10, 44, 60, '#2a2f35'); box(646, 10, 44, 60, '#2a2f35');
        c.fillStyle = '#c9d0d6'; c.fillRect(285, 70, 14, yP - 270); c.fillRect(661, 70, 14, yP - 270);
        box(250, yP - 200, 460, 60, '#3a4047');
        box(420, yP - 140, 120, 80, '#4a5057', null);
        poly([[440, yP - 60], [520, yP - 60], [486, yP - 8], [480, yP], [474, yP - 8]], '#8d969f');
        c.strokeStyle = '#c9d0d6'; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath();
        if (d <= 0) { c.moveTo(xs, SH + 3); c.lineTo(xs + 2 * L, SH + 3); }
        else {
          const cy = SH + 3 + d, dx = L * Math.cos(th), dy = L * Math.sin(th);
          c.moveTo(CX - dx, cy - dy); c.lineTo(CX, cy); c.lineTo(CX + dx, cy - dy);
        }
        c.stroke();
        const fx = CX + L + (t > 3 ? 16 * ease(seg(t, 3, 3.6)) : 0);
        c.fillStyle = '#e41720'; c.fillRect(fx, SH - 22, 10, 24);
        box(fx + 10, SH - 14, 70, 8, '#2a2f35', null);
        if (t > 6.5) {
          const a = ease(seg(t, 6.5, 7.2));
          c.strokeStyle = `rgba(228,23,32,${a})`; c.lineWidth = 2;
          c.beginPath(); c.arc(CX, SH + 43, 70, -Math.PI * .75, -Math.PI * .25); c.stroke();
          label('90°', CX, SH - 52, 'center', `rgba(230,236,240,${a})`);
        }
        label('Hidraulični cilindri', 324, 40); label('Gornji alat', 548, yP - 40);
        label('Matrica', 630, 450); label('Graničnik', CX + L - 20, SH - 44);
        return t < 1.5 ? 0 : t < 3 ? 1 : t < 5 ? 2 : t < 6.5 ? 3 : 4;
      },
    };
  })();

  // Panel bender: držač stegne lim, nož savije prirubnicu, manipulator okrene dio
  ANIM.panel = (() => {
    const EX = 500, Y = 354, FL = 140;
    let n = 0;
    return {
      dur: 6.4, steps: ['Prihvat i stezanje', 'Savijanje prirubnice', 'Povrat noža', 'Rotacija dijela'],
      reset(loop) { n = loop ? n + 1 : 0; },
      draw(t) {
        const bend = t < 1.2 ? 0 : t < 3.2 ? ease(seg(t, 1.2, 3.2)) * Math.PI / 2 : Math.PI / 2;
        const flange = t < 4.2 ? bend : 0;
        const blade = t < 3.2 ? bend : Math.PI / 2 * (1 - ease(seg(t, 3.2, 4.2)));
        const hy = t < 1.2 ? lerp(220, Y, ease(seg(t, 0, 1.2))) : t < 3.6 ? Y : lerp(Y, 220, ease(seg(t, 3.6, 4.4)));
        box(120, Y + 6, EX - 120, 90, '#3a4047', null);
        box(120, Y + 96, 740, 30, '#1f2328', null);
        box(360, hy - 126, EX - 358, 120, '#59616b', null);
        box(380, 30, 60, hy - 156 > 0 ? hy - 156 : 0, '#2a2f35', null);
        c.strokeStyle = '#c9d0d6'; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath();
        c.moveTo(150, Y + 3); c.lineTo(EX, Y + 3);
        c.lineTo(EX + FL * Math.cos(flange), Y + 3 - FL * Math.sin(flange)); c.stroke();
        const bx = EX + (FL - 12) * Math.cos(blade) + 14 * Math.sin(blade);
        const by = Y + 3 - (FL - 12) * Math.sin(blade) + 14 * Math.cos(blade);
        line(bx, by + 6, 860, by + 60, '#2a2f35', 12);
        c.save(); c.translate(bx, by); c.rotate(-blade);
        box(-34, 0, 68, 16, '#8d969f', null);
        c.restore();
        // pogled odozgo: koja je stranica savijena
        box(700, 40, 200, 180, '#14171b', '#2a2f35');
        const turn = t > 4.2 ? ease(seg(t, 4.2, 6.2)) : 0;
        const k = n % 4, rot = (k + turn) * Math.PI / 2;
        c.save(); c.translate(800, 128); c.rotate(-rot);
        c.fillStyle = '#8d969f'; c.fillRect(-45, -45, 90, 90);
        for (let s = 0; s < 4; s++) {
          const bent = s < k || (s === k && t > 3.2);
          if (!bent) continue;
          c.save(); c.rotate(s * Math.PI / 2);
          c.fillStyle = '#e41720'; c.fillRect(42, -45, 6, 90);
          c.restore();
        }
        c.restore();
        line(860, 128, 885, 128, '#e41720', 2);
        label(`Stranica ${k + 1} / 4`, 800, 205, 'center');
        label('Držač lima', 250, hy - 90); label('Nož za savijanje', 690, 470); label('Stol', 140, Y + 50);
        return t < 1.2 ? 0 : t < 3.2 ? 1 : t < 4.2 ? 2 : 3;
      },
    };
  })();

  // Vakuumski podizač: spusti se na paletu, uhvati gornji lim i prenese ga na stol lasera
  ANIM.vakuum = (() => {
    const SX = 290, TX = 710, STACK = 402, TABLE = 420;
    return {
      dur: 9, steps: ['Spuštanje na lim', 'Vakuum uključen', 'Podizanje i prijenos', 'Spuštanje na stol', 'Otpuštanje'],
      draw(t) {
        let lx = SX, py;
        if (t < 1.5) py = lerp(220, STACK, ease(seg(t, 0, 1.5)));
        else if (t < 2.5) py = STACK;
        else if (t < 4) py = lerp(STACK, 240, ease(seg(t, 2.5, 4)));
        else if (t < 6) { py = 240; lx = lerp(SX, TX, ease(seg(t, 4, 6))); }
        else if (t < 7.5) { lx = TX; py = lerp(240, TABLE, ease(seg(t, 6, 7.5))); }
        else { lx = TX; py = lerp(TABLE, 250, ease(seg(t, 7.8, 9))); }
        const vac = t >= 1.5 && t < 7.6, carry = t >= 2.5 && t < 7.5;
        box(60, 30, 840, 14, '#2a2f35', null);
        box(lx - 30, 44, 60, 18, '#3a4047', null);
        line(lx, 62, lx, py - 80, '#8d969f', 2);
        line(lx, py - 80, lx - 110, py - 56, '#59616b', 2); line(lx, py - 80, lx + 110, py - 56, '#59616b', 2);
        box(lx - 120, py - 56, 240, 16, '#e41720', null);
        for (const o of [-90, -30, 30, 90]) {
          box(lx + o - 3, py - 40, 6, 28, '#59616b', null);
          poly([[lx + o - 18, py], [lx + o + 18, py], [lx + o + 12, py - 12], [lx + o - 12, py - 12]], vac ? '#ff5a4f' : '#3a4047');
        }
        box(170, 452, 240, 18, '#6b4f33', null);
        const count = t >= 2.5 ? 5 : 6;
        for (let i = 0; i < count; i++) { c.fillStyle = i % 2 ? '#9aa3ab' : '#8a939c'; c.fillRect(180, 444 - i * 8, 220, 6); }
        if (carry) { c.fillStyle = '#b4bcc3'; c.fillRect(lx - 110, py, 220, 6); }
        if (t >= 7.5) { c.fillStyle = '#b4bcc3'; c.fillRect(TX - 110, TABLE, 220, 6); }
        box(580, TABLE + 6, 260, 12, '#3a4047', null);
        box(592, TABLE + 18, 12, 60, '#2a2f35', null); box(816, TABLE + 18, 12, 60, '#2a2f35', null);
        if (vac) label('Vakuum', lx + 130, py - 48, 'left', '#ff5a4f');
        label('Vacu-lift', lx - 120, py - 74);
        label('Paleta s limovima', 170, 490); label('Stol lasera', 580, 506);
        return t < 1.5 ? 0 : t < 2.5 ? 1 : t < 6 ? 2 : t < 7.5 ? 3 : 4;
      },
    };
  })();

  // Filterska jedinica: dim s reznog stola ide kanalom do uložaka, čist zrak izlazi kroz ventilator
  ANIM.filter = (() => {
    const path = [[330, 440], [520, 440], [520, 230], [600, 230]];
    const cum = polyLen(path), LEN = cum[cum.length - 1];
    const CART = [640, 690, 740, 790];
    let smoke = [], clean = [], dirt = [0, 0, 0, 0];
    return {
      dur: 9, steps: ['Odsis dima sa stola', 'Filtracija u ulošcima', 'Čist zrak van'],
      reset() { smoke = []; clean = []; dirt = [0, 0, 0, 0]; },
      draw(t, dt) {
        const hl = t < 3 ? 0 : t < 6 ? 1 : 2;
        c.lineCap = 'butt'; c.lineJoin = 'miter';
        c.strokeStyle = '#1f2328'; c.lineWidth = 40; c.beginPath();
        path.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
        c.strokeStyle = '#2a2f35'; c.lineWidth = 32; c.stroke();
        box(70, 400, 280, 60, '#2a2f35', null);
        c.fillStyle = '#8d969f'; c.fillRect(80, 394, 260, 6);
        const hx = 210 + 90 * Math.sin(t * 1.3);
        box(hx - 14, 300, 28, 60, '#3a4047', null);
        poly([[hx - 9, 360], [hx + 9, 360], [hx + 3, 388], [hx - 3, 388]], '#b87333');
        glow(hx, 394, 26, '255,80,30', .5); glow(hx, 394, 7, '255,245,235', 1);
        emit(hx, 396, 2, { dir: Math.PI / 2, spread: 1.2, speed: 200, life: .25, g: 600 });

        if (Math.random() < .85) smoke.push({ st: 0, age: 0, sx: hx, jx: rnd(-11, 11), jy: rnd(-11, 11), tg: Math.random() * 4 | 0, tx: rnd(-14, 14), ty: rnd(216, 394) });
        for (let i = smoke.length - 1; i >= 0; i--) {
          const p = smoke[i];
          p.age += dt;
          if (p.st === 0) {
            const k = clamp(p.age / .6);
            p.x = lerp(p.sx, 330, k) + p.jx * k; p.y = lerp(400, 440, k) + p.jy * k;
            if (k >= 1) { p.st = 1; p.s = 0; }
          } else if (p.st === 1) {
            p.s += 170 * dt;
            if (p.s >= LEN) { p.st = 2; p.age = 0; }
            else { const q = pointAt(path, cum, p.s); p.x = q[0] + p.jx; p.y = q[1] + p.jy; }
          } else {
            const k = clamp(p.age / .8);
            p.x = lerp(600, CART[p.tg] + p.tx, k); p.y = lerp(230 + p.jy, p.ty, k);
            if (k >= 1) { dirt[p.tg] = Math.min(.75, dirt[p.tg] + .0025); smoke.splice(i, 1); continue; }
          }
        }
        box(600, 150, 240, 320, '#1b1f24');
        for (let i = 0; i < 4; i++) {
          const x = CART[i], d = dirt[i];
          c.fillStyle = `rgb(${lerp(201, 92, d) | 0},${lerp(208, 82, d) | 0},${lerp(214, 70, d) | 0})`;
          c.fillRect(x - 18, 210, 36, 190);
          c.strokeStyle = 'rgba(20,23,27,.35)'; c.lineWidth = 1; c.beginPath();
          for (let px = x - 14; px < x + 18; px += 6) { c.moveTo(px + .5, 212); c.lineTo(px + .5, 398); }
          c.stroke();
        }
        c.fillStyle = 'rgba(120,108,96,.8)';
        for (const p of smoke) { c.beginPath(); c.arc(p.x, p.y, 3, 0, TAU); c.fill(); }
        box(690, 96, 100, 54, '#2a2f35');
        c.save(); c.translate(740, 123); c.rotate(t * 12);
        for (let b = 0; b < 4; b++) { c.rotate(Math.PI / 2); line(0, 0, 18, 0, '#8d969f', 5); }
        c.restore();
        if (Math.random() < .7) clean.push({ x: 740 + rnd(-16, 16), y: 94 });
        c.fillStyle = 'rgba(150,210,255,.75)';
        for (let i = clean.length - 1; i >= 0; i--) {
          const p = clean[i]; p.y -= 90 * dt;
          if (p.y < 14) { clean.splice(i, 1); continue; }
          c.beginPath(); c.arc(p.x, p.y, 2.5, 0, TAU); c.fill();
        }
        if (hl === 0) focus(60, 280, 560, 190); else if (hl === 1) focus(614, 198, 212, 214); else focus(680, 8, 120, 150);
        label('Rezni stol', 70, 488); label('Odsisni kanal', 360, 488);
        label('HV filteri', 620, 440); label('Siemens motor', 802, 114); label('i ventilator', 802, 134);
        return hl;
      },
    };
  })();

  // Kompresor: usis, vijčani kompresor, spremnik, sušač i filteri do čistog zraka za rez
  ANIM.kompresor = (() => {
    const Y = 300, FX = [630, 675, 720, 765, 810];
    let parts = [], drops = [];
    function rotor(x, y, rot, col) {
      c.fillStyle = col; c.beginPath();
      for (let a = 0; a <= TAU + .01; a += .08) {
        const r = 28 + 7 * Math.cos(5 * (a + rot));
        const px = x + r * Math.cos(a), py = y + r * Math.sin(a);
        a ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.fill();
    }
    return {
      dur: 10, steps: ['Usis i kompresija', 'Spremnik zraka', 'Sušenje', 'Filtracija u 6 stupnjeva', 'Suh i čist zrak'],
      reset() { parts = []; drops = []; },
      draw(t, dt) {
        const hl = Math.min(4, Math.floor(t / 2));
        line(40, Y, 900, Y, '#2a2f35', 18); line(40, Y, 900, Y, '#1b1f24', 12);
        if (Math.random() < .9) {
          const r = Math.random();
          parts.push({ x: 40, y: Y + rnd(-4, 4), k: r < .3 ? 'w' : r < .45 ? 'o' : 'a', die: Math.random() * 5 | 0 });
        }
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.x += 150 * dt;
          if (p.k === 'w' && p.x > 535) { drops.push({ x: rnd(505, 565), y: 382, v: 0 }); p.k = 'a'; }
          if (p.k === 'o' && p.x > FX[p.die]) p.k = 'a';
          if (p.x > 900) { parts.splice(i, 1); continue; }
          c.fillStyle = p.k === 'w' ? '#5aa9ff' : p.k === 'o' ? '#b07a3e' : p.x > 830 ? '#ffffff' : 'rgba(201,208,214,.6)';
          c.beginPath(); c.arc(p.x, p.y, p.k === 'a' ? 2.2 : 3, 0, TAU); c.fill();
        }
        box(40, 270, 30, 60, '#2a2f35');
        for (let y = 278; y < 326; y += 8) line(44, y, 66, y, '#59616b', 2);
        box(120, 210, 180, 180, '#1b1f24');
        rotor(182, Y, t * 6, '#8d969f'); rotor(240, Y, -t * 6 + .3, '#6d757d');
        const tg = c.createLinearGradient(340, 0, 440, 0);
        tg.addColorStop(0, '#3a4047'); tg.addColorStop(.4, '#8d969f'); tg.addColorStop(1, '#2a2f35');
        c.fillStyle = tg; c.beginPath();
        c.roundRect ? c.roundRect(340, 170, 100, 280, 44) : c.rect(340, 170, 100, 280);
        c.fill();
        line(390, 170, 390, 152, '#59616b', 4);
        c.fillStyle = '#e6ecf0'; c.beginPath(); c.arc(390, 136, 18, 0, TAU); c.fill();
        const na = -Math.PI * .75 + Math.PI * 1.5 * (.6 + .12 * Math.sin(t * 1.6));
        line(390, 136, 390 + 14 * Math.cos(na), 136 + 14 * Math.sin(na), '#e41720', 2);
        box(480, 220, 110, 160, '#1b1f24');
        line(535, 380, 535, 410, '#2a2f35', 6);
        c.fillStyle = '#5aa9ff';
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]; d.v += 600 * dt; d.y += d.v * dt;
          if (d.y > 480) { drops.splice(i, 1); continue; }
          c.beginPath(); c.arc(535 + (d.x - 535) * .1, d.y + 30, 3, 0, TAU); c.fill();
        }
        for (const x of FX) { box(x - 20, 240, 40, 14, '#3a4047', null); box(x - 15, 254, 30, 96, '#2a2f35'); }
        poly([[900, Y - 14], [922, Y], [900, Y + 14]], '#e6ecf0');
        const F = [[110, 200, 200, 200], [330, 110, 120, 350], [470, 210, 130, 180], [604, 230, 232, 130], [840, 266, 110, 68]];
        focus(...F[hl]);
        label('Usis', 40, 254); label('Vijčani kompresor', 120, 412); label('Spremnik', 340, 474);
        label('Sušač', 480, 400); label('5 filtera', 610, 380); label('Laser', 950, Y - 30, 'right', '#e6ecf0');
        return hl;
      },
    };
  })();

  // ---------- Prozor s animacijom ----------
  const dlg = document.createElement('dialog');
  dlg.className = 'rad';
  dlg.setAttribute('aria-labelledby', 'radT');
  dlg.innerHTML = `<div class="rad-head"><div><p class="eyebrow">Kako radi</p><h2 id="radT"></h2></div>
    <button type="button" class="rad-x" aria-label="Zatvori">×</button></div>
    <canvas width="${W * 2}" height="${H * 2}" role="img"></canvas>
    <ol class="rad-steps"></ol>
    <div class="rad-foot"><span>Pojednostavljen prikaz principa rada.</span>
    <div class="rad-ctl"><button type="button" class="rad-re">Ispočetka</button><button type="button" class="rad-pp">Pauza</button></div></div>`;
  document.body.appendChild(dlg);
  const cv = dlg.querySelector('canvas');
  c = cv.getContext('2d');
  const stepsEl = dlg.querySelector('.rad-steps'), ppBtn = dlg.querySelector('.rad-pp');
  let cur = null, t = 0, last = 0, raf = 0, paused = false, freezeT = null, stepLis = [];

  function open(key, name) {
    cur = ANIM[key];
    if (!cur) return;
    dlg.querySelector('#radT').textContent = name;
    cv.setAttribute('aria-label', `Animacija: ${name}. Koraci: ${cur.steps.join(', ')}.`);
    stepsEl.innerHTML = cur.steps.map(s => `<li>${s}</li>`).join('');
    stepLis = [...stepsEl.children];
    restart();
    if (!dlg.open) dlg.showModal();
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function restart() {
    P.length = 0; t = 0;
    if (cur.reset) cur.reset(false);
    paused = false; ppBtn.textContent = 'Pauza';
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    if (paused) return;
    if (freezeT !== null) t = freezeT;
    else {
      t += dt;
      if (t >= cur.dur) { t -= cur.dur; P.length = 0; if (cur.reset) cur.reset(true); }
    }
    c.setTransform(2, 0, 0, 2, 0, 0);
    backdrop();
    const s = cur.draw(t, dt);
    particles(dt);
    stepLis.forEach((li, i) => li.classList.toggle('on', i === s));
  }

  dlg.querySelector('.rad-x').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => cancelAnimationFrame(raf));
  ppBtn.addEventListener('click', () => { paused = !paused; ppBtn.textContent = paused ? 'Nastavi' : 'Pauza'; });
  dlg.querySelector('.rad-re').addEventListener('click', () => restart());

  const nameOf = el => (el.closest('.model')?.querySelector('h3') || document.querySelector('h1')).textContent.trim();
  for (const el of targets) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'rad-btn';
    btn.innerHTML = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>Kako radi';
    el.appendChild(btn);
    el.addEventListener('click', () => open(el.dataset.rad, nameOf(el)));
  }

  // Pregled jednog kadra: ?rad=presa&rt=4
  const q = new URLSearchParams(location.search);
  if (q.get('rad')) {
    const el = targets.find(e => e.dataset.rad === q.get('rad'));
    if (el) { open(el.dataset.rad, nameOf(el)); if (q.get('rt')) freezeT = +q.get('rt'); }
  }
})();
