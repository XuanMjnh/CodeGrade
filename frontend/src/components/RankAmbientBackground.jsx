import React, { useEffect, useRef, useState } from 'react';

const PALETTES = {
  arcane: ['#4ee5c0', '#a88bfa', '#d8fff1'],
  bronze: ['#efa767', '#df744c', '#ffe1ae'],
  silver: ['#b6d8f2', '#7e9ed8', '#eff9ff'],
  gold: ['#ffd76d', '#dc9b43', '#fff1b7'],
  platinum: ['#62e2ba', '#51afb9', '#caffed'],
  diamond: ['#68dcff', '#8985ef', '#e0fbff'],
  master: ['#ffac64', '#cf78bc', '#ffe4b2'],
};

export default function RankAmbientBackground({ tone = 'arcane' }) {
  const canvasRef = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.CanvasRenderingContext2D === 'undefined') return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const colors = PALETTES[tone] || PALETTES.arcane;
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let width = 0,
      height = 0,
      frame = 0,
      running = false,
      elapsed = 0,
      previous = null;

    const glow = (x, y, radius, color, opacity) => {
      context.globalAlpha = opacity;
      const light = context.createRadialGradient(x, y, 0, x, y, radius);
      light.addColorStop(0, color);
      light.addColorStop(1, color + '00');
      context.fillStyle = light;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    const paint = (time) => {
      if (!width || !height) return;
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      const night = context.createLinearGradient(0, 0, width, height);
      night.addColorStop(0, '#102a2b');
      night.addColorStop(0.5, '#111f2d');
      night.addColorStop(1, '#281d35');
      context.fillStyle = night;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';

      const compact = width < 400 && height > 140;
      const radius = Math.max(height * 1.6, width * 0.28);
      glow(
        width * (0.22 + Math.sin(time * 0.48) * 0.16),
        height * (0.7 + Math.cos(time * 0.6) * 0.32),
        radius,
        colors[0],
        0.38,
      );
      glow(
        width * (0.76 + Math.cos(time * 0.35) * 0.18),
        height * (0.3 + Math.sin(time * 0.7) * 0.32),
        radius * 0.8,
        colors[1],
        0.33,
      );

      // Sweep energy across this rank's own surface.
      const sweepWidth = compact ? 70 : 160;
      const sweepX = ((time * (compact ? 48 : 150)) % (width + sweepWidth * 4)) - sweepWidth * 2;
      const sweep = context.createLinearGradient(sweepX - sweepWidth, 0, sweepX + sweepWidth, 0);
      sweep.addColorStop(0, colors[0] + '00');
      sweep.addColorStop(0.5, colors[0] + '80');
      sweep.addColorStop(1, colors[0] + '00');
      context.globalAlpha = 0.48;
      context.fillStyle = sweep;
      context.fillRect(sweepX - sweepWidth, 0, sweepWidth * 2, height);

      const sealX = compact ? width * 0.5 : width * 0.88;
      const sealY = compact ? height * 0.36 : height * 0.7;
      const sealRadius = compact ? width * 0.39 : Math.max(48, height * 0.8);
      context.save();
      context.translate(sealX, sealY);
      context.rotate(time * 0.23);
      context.strokeStyle = colors[2];
      context.lineWidth = 0.8;
      context.globalAlpha = 0.27;
      context.beginPath();
      context.arc(0, 0, sealRadius, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([3, 9]);
      context.beginPath();
      context.arc(0, 0, sealRadius * 0.83, 0, Math.PI * 2);
      context.stroke();
      context.setLineDash([]);
      for (let index = 0; index < 6; index++) {
        context.rotate(Math.PI / 3);
        context.beginPath();
        context.moveTo(-4, -sealRadius * 0.85);
        context.lineTo(0, -sealRadius * 0.97);
        context.lineTo(4, -sealRadius * 0.85);
        context.stroke();
      }
      context.rotate(-time * 0.51);
      context.beginPath();
      for (let index = 0; index <= 3; index++) {
        const angle = (index * Math.PI * 2) / 3 - Math.PI / 2;
        const x = Math.cos(angle) * sealRadius * 0.7,
          y = Math.sin(angle) * sealRadius * 0.7;
        if (!index) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.restore();

      for (let index = 0; index < 3; index++) {
        context.globalAlpha = 0.17 + index * 0.05;
        context.strokeStyle = colors[index % 2];
        context.lineWidth = index === 1 ? 1.2 : 0.6;
        context.beginPath();
        for (let x = 0; x <= width + 12; x += 12) {
          const y =
            height * (0.25 + index * 0.23) +
            Math.sin(x / 110 + time * (0.8 + index * 0.2)) * Math.min(height * 0.2, 22);
          if (!x) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }

      const particleCount = compact ? 14 : width < 400 ? 10 : 30;
      for (let index = 0; index < particleCount; index++) {
        const x = ((index * 97.37 + time * (8 + (index % 7))) % (width + 20)) - 10;
        const y = height - ((index * 37.71 + time * (12 + (index % 9))) % (height + 18));
        const size = index % 4 === 0 ? 2 : 1;
        context.globalAlpha = 0.35 + (Math.sin(time * 1.4 + index) + 1) * 0.22;
        context.fillStyle = colors[index % 3];
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();
        if (index % 5 === 0) {
          context.globalAlpha *= 0.45;
          context.fillRect(x - 4, y - 0.5, 8, 1);
          context.fillRect(x - 0.5, y - 4, 1, 8);
        }
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint(elapsed);
    };
    const tick = (now) => {
      if (!running) return;
      if (previous !== null) elapsed += Math.min((now - previous) / 1000, 0.05);
      previous = now;
      paint(elapsed);
      frame = window.requestAnimationFrame(tick);
    };
    const sync = () => {
      window.cancelAnimationFrame(frame);
      previous = null;
      running = !document.hidden && !preference?.matches;
      setAnimated(running);
      if (running) frame = window.requestAnimationFrame(tick);
      else paint(elapsed);
    };
    resize();
    sync();
    const observer = window.ResizeObserver ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    preference?.addEventListener?.('change', sync);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      preference?.removeEventListener?.('change', sync);
    };
  }, [tone]);

  return (
    <canvas
      ref={canvasRef}
      className="rank-ambient-background pointer-events-none absolute inset-0 h-full w-full bg-linear-to-br from-[#102a2b] via-[#111f2d] to-[#281d35]"
      aria-hidden="true"
      data-animated={animated}
    />
  );
}
