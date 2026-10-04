import React, { useEffect, useRef, useState } from 'react';
import { Lock, Unlock, Shield, Key, Sparkles } from 'lucide-react';

interface PixelatedVaultPhotoProps {
  src: string;
  alt?: string;
  isPixelated: boolean;
  className?: string;
  pixelSize?: number; // Size of pixel blocks (default: 16)
  showOverlay?: boolean;
  onUnlockClick?: () => void;
  aspectRatio?: string;
}

export const PixelatedVaultPhoto: React.FC<PixelatedVaultPhotoProps> = ({
  src,
  alt = 'Encrypted Photo',
  isPixelated,
  className = 'w-full h-full object-cover',
  pixelSize = 16,
  showOverlay = true,
  onUnlockClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Generate genuine pixelated mosaic on canvas
  useEffect(() => {
    if (!isPixelated) {
      setCanvasReady(false);
      return;
    }

    let isMounted = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (!isMounted) return;
      setImageLoaded(true);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Desired pixel resolution
      const w = canvas.width || 320;
      const h = canvas.height || 240;

      // Downscale factor
      const numBlocksX = Math.max(8, Math.floor(w / pixelSize));
      const numBlocksY = Math.max(6, Math.floor(h / pixelSize));

      // Offscreen canvas for downsampling
      const offCanvas = document.createElement('canvas');
      offCanvas.width = numBlocksX;
      offCanvas.height = numBlocksY;
      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        // Draw small
        offCtx.drawImage(img, 0, 0, numBlocksX, numBlocksY);

        // Turn off smoothing for authentic pixelated stretch
        ctx.imageSmoothingEnabled = false;
        (ctx as any).mozImageSmoothingEnabled = false;
        (ctx as any).webkitImageSmoothingEnabled = false;
        (ctx as any).msImageSmoothingEnabled = false;

        // Upscale back onto main canvas
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(offCanvas, 0, 0, numBlocksX, numBlocksY, 0, 0, w, h);

        // Add cyber tint & scanlines
        ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
        ctx.fillRect(0, 0, w, h);

        setCanvasReady(true);
      }
    };

    img.onerror = () => {
      // If CORS or loading error, fallback is handled via CSS
      if (isMounted) {
        setCanvasReady(false);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [src, isPixelated, pixelSize]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-neutral-950 flex items-center justify-center">
      {/* 1. ORIGINAL IMAGE (Visible when unlocked, or underneath pixel effect) */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className={`${className} transition-all duration-500 ${
          isPixelated
            ? 'opacity-40 filter blur-md scale-105 contrast-125'
            : 'opacity-100 filter-none scale-100'
        }`}
        style={
          isPixelated
            ? {
                imageRendering: 'pixelated',
              }
            : undefined
        }
      />

      {/* 2. AUTHENTIC PIXELATION CANVAS (When Locked) */}
      {isPixelated && (
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            canvasReady ? 'opacity-95' : 'opacity-0'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
      )}

      {/* 3. CSS MOSAIC GRID OVERLAY & SCANLINES (Guarantee pixelated texture) */}
      {isPixelated && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${pixelSize}px ${pixelSize}px`,
          }}
        />
      )}

      {/* 4. ENCRYPTION BADGE / UNLOCK PROMPT OVERLAY */}
      {isPixelated && showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/60 flex flex-col items-center justify-center p-4 text-center transition-all duration-300">
          <div className="bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 p-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md mb-2 group-hover:scale-110 transition-transform">
            <Lock className="w-5 h-5 text-cyan-300 animate-pulse" />
          </div>

          <span className="text-xs font-bold text-cyan-200 tracking-wider uppercase font-mono shadow-sm">
            Encrypted Vault Photo
          </span>
          <span className="text-[10px] text-cyan-400/80 font-mono mt-0.5">
            AES-256 Pixelated
          </span>

          {onUnlockClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlockClick();
              }}
              className="mt-3 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all flex items-center gap-1.5 pointer-events-auto"
            >
              <Key className="w-3 h-3 text-cyan-100" />
              <span>Unlock Vault</span>
            </button>
          )}
        </div>
      )}

      {/* 5. UNLOCKED DECRYPTED CHIP (Brief subtle watermark when unlocked) */}
      {!isPixelated && (
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="bg-cyan-950/80 backdrop-blur-md border border-cyan-400/50 text-cyan-300 text-[9px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
            <Unlock className="w-2.5 h-2.5" /> Decrypted
          </span>
        </div>
      )}
    </div>
  );
};
