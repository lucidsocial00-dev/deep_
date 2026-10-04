import React, { useEffect, useRef } from 'react';

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Dot grid parameters matching theme
    const spacing = 24; // 24px grid spacing
    const dotRadius = 1.0; // 1px radius for crisp dots
    let offsetX = 0;
    let offsetY = 0;
    const speed = 0.35; // Pixels per frame for smooth subtle motion

    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 16.67; // Normalize to ~60fps
      lastTime = time;

      // Increment offsets for continuous diagonal pan
      offsetX = (offsetX + speed * delta) % spacing;
      offsetY = (offsetY + speed * delta) % spacing;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      // Draw crisp dot grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();

      const startX = -spacing + offsetX;
      const startY = -spacing + offsetY;

      for (let x = startX; x < width + spacing; x += spacing) {
        for (let y = startY; y < height + spacing; y += spacing) {
          ctx.moveTo(x + dotRadius, y);
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        }
      }

      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-black"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full will-change-transform opacity-90"
      />
    </div>
  );
};
