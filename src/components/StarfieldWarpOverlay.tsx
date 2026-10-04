import React, { useEffect, useRef, useState } from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { getCityForHashtag } from '../utils/cityRegions';

export interface WarpSession {
  tag: string;
  id: number;
}

interface StarfieldWarpOverlayProps {
  warpSession: WarpSession | null;
  onWarpComplete: () => void;
}

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  color: string;
  size: number;
}

export const StarfieldWarpOverlay: React.FC<StarfieldWarpOverlayProps> = ({
  warpSession,
  onWarpComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayedTag, setDisplayedTag] = useState<string>('');
  const [streamCity, setStreamCity] = useState<string>('');
  const [warpProgress, setWarpProgress] = useState(0);
  const [animatingSessionId, setAnimatingSessionId] = useState<number | null>(null);

  // Stable ref for onWarpComplete callback
  const onWarpCompleteRef = useRef(onWarpComplete);
  useEffect(() => {
    onWarpCompleteRef.current = onWarpComplete;
  }, [onWarpComplete]);

  const activeTag = warpSession?.tag || null;
  const sessionId = warpSession?.id || null;

  useEffect(() => {
    if (!activeTag || !sessionId) {
      setAnimatingSessionId(null);
      setWarpProgress(0);
      return;
    }

    setAnimatingSessionId(sessionId);
    const clean = activeTag.replace(/^#+/, '');
    const locationInfo = getCityForHashtag(clean);
    setDisplayedTag(activeTag.startsWith('#') ? activeTag : `#${activeTag}`);
    setStreamCity(locationInfo.city || '');
    setWarpProgress(0.05);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isCompleted = false;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize 3D Starfield
    const numStars = 450;
    const stars: Star[] = [];
    const colors = [
      '#ffffff',
      '#f472b6', // pink-400
      '#ec4899', // pink-500
      '#fb7185', // rose-400
      '#38bdf8', // sky-400
      '#c084fc', // purple-400
      '#fbcfe8', // pink-200
    ];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000 + 1,
        prevZ: 1000,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 1.8 + 0.8,
      });
    }

    const startTime = performance.now();
    const duration = 1200; // ms

    const finishWarp = () => {
      if (isCompleted) return;
      isCompleted = true;
      setAnimatingSessionId(null);
      setWarpProgress(1);
      if (onWarpCompleteRef.current) {
        onWarpCompleteRef.current();
      }
    };

    // Safety fallback timer to guarantee warp completion
    const safetyTimer = setTimeout(() => {
      finishWarp();
    }, duration + 150);

    const render = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setWarpProgress(progress);

      let speed = 4;
      if (progress < 0.3) {
        speed = 4 + (progress / 0.3) * 55;
      } else if (progress < 0.75) {
        speed = 59 + Math.sin(progress * Math.PI * 8) * 6;
      } else {
        const easeOut = 1 - (progress - 0.75) / 0.25;
        speed = 4 + easeOut * 55;
      }

      const trailAlpha = progress < 0.2 ? 0.35 : progress < 0.8 ? 0.18 : 0.4;
      ctx.fillStyle = `rgba(0, 0, 0, ${trailAlpha})`;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      const coreFactor = Math.max(0.01, progress < 0.5 ? progress * 2 : Math.max(0, 1 - progress) * 2);
      const coreRadius = Math.max(1, Math.min(width, height) * 0.45 * coreFactor);

      const coreGradient = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        coreRadius
      );
      coreGradient.addColorStop(0, 'rgba(244, 114, 182, 0.25)');
      coreGradient.addColorStop(0.4, 'rgba(236, 72, 153, 0.12)');
      coreGradient.addColorStop(0.8, 'rgba(192, 132, 252, 0.05)');
      coreGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGradient;
      ctx.fillRect(0, 0, width, height);

      if (progress > 0.1 && progress < 0.85) {
        const ringProgress = (progress - 0.1) / 0.75;
        for (let r = 0; r < 3; r++) {
          const rProg = (ringProgress + r * 0.33) % 1;
          const radius = Math.max(0.1, rProg * Math.max(width, height) * 0.7);
          const ringAlpha = Math.max(0, Math.sin(rProg * Math.PI) * 0.4);

          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(244, 114, 182, ${ringAlpha})`;
          ctx.lineWidth = 1.5 + (1 - rProg) * 2;
          ctx.stroke();
        }
      }

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.prevZ = star.z;
        star.z -= speed;

        if (star.z <= 1) {
          star.z = 1000;
          star.prevZ = 1000;
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
        }

        const k = 400 / star.z;
        const px = star.x * k + cx;
        const py = star.y * k + cy;

        const prevK = 400 / star.prevZ;
        const prevPx = star.x * prevK + cx;
        const prevPy = star.y * prevK + cy;

        if (px < -50 || px > width + 50 || py < -50 || py > height + 50) {
          continue;
        }

        const size = Math.max(0.5, star.size * (1 - star.z / 1000) * (speed > 20 ? 1.4 : 1));
        const alpha = Math.min(1, Math.max(0.2, (1 - star.z / 1000) * 1.5));

        if (speed > 12) {
          const streakGrad = ctx.createLinearGradient(prevPx, prevPy, px, py);
          streakGrad.addColorStop(0, 'transparent');
          streakGrad.addColorStop(1, star.color);

          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = size * (speed > 35 ? 1.2 : 0.9);
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, size), 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        finishWarp();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(safetyTimer);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [sessionId, activeTag]);

  const isVisible = Boolean(animatingSessionId && activeTag);
  if (!isVisible && !activeTag) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] pointer-events-none transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
    >
      {/* Canvas for 3D Starfield Hyperspace Effect */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Central Holographic Warp HUD */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`flex flex-col items-center text-center transform transition-all duration-500 ${
            warpProgress > 0.1 && warpProgress < 0.85
              ? 'scale-105 opacity-100'
              : 'scale-90 opacity-0'
          }`}
        >
          {/* Pulsing Warp Portal Badge */}
          <div className="relative group">
            <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-pink-500/50 via-purple-500/40 to-sky-400/50 blur-xl animate-pulse" />
            
            <div className="relative px-6 py-4 rounded-2xl bg-black/85 border-2 border-pink-400 shadow-[0_0_35px_rgba(244,114,182,0.8)] backdrop-blur-lg flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-pink-400 text-xs font-mono font-bold tracking-widest uppercase">
                <Zap className="w-4 h-4 text-pink-300 fill-pink-400 animate-bounce" />
                <span className="text-pink-200 drop-shadow-[0_0_8px_rgba(244,114,182,0.9)]">
                  Stream Warp Portal
                </span>
                <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
              </div>

              {/* Tag Display */}
              <div className="text-2xl sm:text-3xl font-bold font-space-mono text-white tracking-tight drop-shadow-[0_0_16px_rgba(244,114,182,0.9)] flex flex-wrap items-center gap-2 justify-center">
                <span>{displayedTag}</span>
                <span className="text-pink-400 font-light text-lg">Stream</span>
                {streamCity && (
                  <span className="text-pink-300 font-mono text-lg font-normal">
                    ({streamCity})
                  </span>
                )}
              </div>

              {/* Sub-status */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300 pt-1">
                <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                <span>Entering stream & creator node...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
