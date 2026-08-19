// Pure rendering helpers. Knows how to draw a generic "level" object and the
// themed board background. Kept separate from the physics engine.

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + r * amt)));
  g = Math.max(0, Math.min(255, Math.round(g + g * amt)));
  b = Math.max(0, Math.min(255, Math.round(b + b * amt)));
  return `rgb(${r},${g},${b})`;
}

export function drawBackground(ctx, theme, w, h) {
  const c = theme.canvas;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [stop, color] of c.bg) grad.addColorStop(stop, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (c.decor === 'stars') drawStars(ctx, w, h);
  else if (c.decor === 'sun') drawSun(ctx, w, h);
  else if (c.decor === 'arena') drawArena(ctx, w, h, c.grid);
  else if (c.decor === 'shelf') drawShelf(ctx, w, h);
}

let starCache = null;
function drawStars(ctx, w, h) {
  if (!starCache) {
    starCache = [];
    let seed = 1337;
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
    for (let i = 0; i < 60; i++) {
      starCache.push({ x: rand(), y: rand() * 0.75, r: 0.5 + rand() * 1.4, a: 0.2 + rand() * 0.6 });
    }
  }
  ctx.save();
  for (const s of starCache) {
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSun(ctx, w, h) {
  ctx.save();
  const cx = w * 0.5;
  const cy = h * 0.16;
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.42);
  grad.addColorStop(0, 'rgba(255,241,180,0.9)');
  grad.addColorStop(0.4, 'rgba(255,196,120,0.35)');
  grad.addColorStop(1, 'rgba(255,196,120,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h * 0.6);
  ctx.restore();
}

function drawArena(ctx, w, h, grid) {
  ctx.save();
  ctx.strokeStyle = grid || 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  const cx = w / 2;
  const cy = h * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();
  ctx.restore();
}

function drawShelf(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(232,121,249,0.12)';
  ctx.lineWidth = 3;
  for (let i = 1; i <= 3; i++) {
    const y = (h * i) / 4.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawDangerLine(ctx, theme, x0, x1, y, active) {
  ctx.save();
  ctx.setLineDash([7, 9]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = active ? theme.canvas.danger : theme.canvas.grid.replace(/[\d.]+\)$/, '0.5)');
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1, y);
  ctx.stroke();
  ctx.restore();
}

// Draw a level object centred at (x, y) with radius r, rotated by `angle`.
export function drawPiece(ctx, level, x, y, r, angle, theme) {
  ctx.save();
  ctx.translate(x, y);
  if (level.visual.type === 'ball') {
    drawBall(ctx, level, r, angle);
  } else {
    drawEmojiDisc(ctx, level, r, angle, theme.style.disc);
  }
  ctx.restore();
}

function drawEmojiDisc(ctx, level, r, angle, disc) {
  const color = level.visual.color;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  if (disc === 'neon') {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = r * 0.6;
    ctx.fillStyle = 'rgba(15,23,42,0.92)';
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = color;
    ctx.stroke();
  } else if (disc === 'frosted') {
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -0.35));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.stroke();
  } else {
    // glossy / warm
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.15, 0, 0, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.25, color);
    g.addColorStop(1, shade(color, disc === 'warm' ? -0.2 : -0.28));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.stroke();
  }

  ctx.rotate(angle);
  ctx.font = `${Math.round(r * 1.15)}px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(level.visual.glyph, 0, r * 0.06);
}

function drawBall(ctx, level, r, angle) {
  const { pattern, base, accent } = level.visual;
  ctx.rotate(angle);

  // Base sphere with soft shading for a 3D feel.
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.15, 0, 0, r);
  g.addColorStop(0, shade(base, 0.35));
  g.addColorStop(0.6, base);
  g.addColorStop(1, shade(base, -0.35));
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineWidth = Math.max(1.2, r * 0.05);
  ctx.strokeStyle = accent;
  ctx.fillStyle = accent;

  switch (pattern) {
    case 'pingpong':
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.quadraticCurveTo(0, r * 0.3, r, 0);
      ctx.stroke();
      break;
    case 'golf':
      ctx.globalAlpha = 0.35;
      for (let yy = -r; yy <= r; yy += r * 0.32) {
        for (let xx = -r; xx <= r; xx += r * 0.32) {
          if (xx * xx + yy * yy < r * r * 0.82) {
            ctx.beginPath();
            ctx.arc(xx, yy, r * 0.06, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      break;
    case 'billiard':
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.fillStyle = '#111827';
      ctx.font = `${Math.round(r * 0.6)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('8', 0, r * 0.04);
      break;
    case 'tennis':
    case 'volleyball':
      ctx.beginPath();
      ctx.arc(-r * 1.1, 0, r * 1.3, -0.9, 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 1.1, 0, r * 1.3, Math.PI - 0.9, Math.PI + 0.9);
      ctx.stroke();
      if (pattern === 'volleyball') {
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(0, r);
        ctx.stroke();
      }
      break;
    case 'baseball':
      ctx.strokeStyle = accent;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(dir * r * 1.15, 0, r * 1.35, dir === 1 ? Math.PI - 0.7 : -0.7, dir === 1 ? Math.PI + 0.7 : 0.7);
        ctx.stroke();
        for (let t = -0.55; t <= 0.55; t += 0.18) {
          const cx = dir * r * 1.15 + Math.cos(dir === 1 ? Math.PI + t : t) * r * 1.35;
          const cy = Math.sin(dir === 1 ? Math.PI + t : t) * r * 1.35;
          ctx.beginPath();
          ctx.moveTo(cx - r * 0.06, cy - r * 0.06);
          ctx.lineTo(cx + r * 0.06, cy + r * 0.06);
          ctx.stroke();
        }
      }
      break;
    case 'handball':
      ctx.fillStyle = accent;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, r, a, a + Math.PI / 6);
        ctx.closePath();
        if (i % 2 === 0) ctx.fill();
      }
      break;
    case 'soccer':
      ctx.fillStyle = accent;
      drawPentagon(ctx, 0, 0, r * 0.34);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r * 0.72;
        const py = Math.sin(a) * r * 0.72;
        drawPentagon(ctx, px, py, r * 0.2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      break;
    case 'basketball':
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.moveTo(-r, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-r * 1.2, 0, r * 1.35, -0.85, 0.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 1.2, 0, r * 1.35, Math.PI - 0.85, Math.PI + 0.85);
      ctx.stroke();
      break;
    case 'bowling':
      ctx.fillStyle = accent;
      for (const [dx, dy] of [[-r * 0.18, -r * 0.15], [r * 0.16, -r * 0.18], [-r * 0.02, r * 0.12]]) {
        ctx.beginPath();
        ctx.arc(dx, dy, r * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'trophy':
      ctx.fillStyle = accent;
      drawStar(ctx, 0, 0, 5, r * 0.5, r * 0.22);
      break;
    default:
      break;
  }
  ctx.restore();

  // Rim + highlight
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.36, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fill();
}

function drawPentagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, cx, cy, spikes, outer, inner) {
  ctx.beginPath();
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.closePath();
  ctx.fill();
}
