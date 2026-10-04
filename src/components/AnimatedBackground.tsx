import React, { useEffect, useRef } from 'react';

export const AnimatedBackground: React.FC = () => {
  const arrowBgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Convert cursor position to gentle tilt (-15px to +15px)
      targetX = ((e.clientX / innerWidth) - 0.5) * 30;
      targetY = ((e.clientY / innerHeight) - 0.5) * 30;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let lastTime = performance.now();
    let pulseTime = 0;

    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      pulseTime += delta * 1.2;

      // Gentle ambient floating motion
      const ambientX = Math.sin(pulseTime * 0.5) * 12;
      const ambientY = Math.cos(pulseTime * 0.7) * 10;

      // Smooth lerp
      currentX += (targetX + ambientX - currentX) * 0.05;
      currentY += (targetY + ambientY - currentY) * 0.05;

      if (arrowBgRef.current) {
        arrowBgRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1.05)`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-black select-none"
    >
      {/* Monochrome Perforated Metal Mesh & Neon Arrow Background */}
      <div
        ref={arrowBgRef}
        className="absolute -inset-10 bg-cover bg-center bg-no-repeat opacity-45 will-change-transform"
        style={{
          backgroundImage: `url('/monochrome_neon_arrow_bg.svg')`,
          filter: 'grayscale(100%) contrast(135%) brightness(95%)',
        }}
      />

      {/* Center Reading Focus Radial Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_20%,rgba(0,0,0,0.85)_80%)] pointer-events-none" />

      {/* Atmospheric High-Contrast Monochrome Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,transparent_50%,rgba(0,0,0,0.7)_100%)] pointer-events-none" />
    </div>
  );
};
