import React, { useState } from 'react';
import { Smartphone, RotateCcw, Sparkles, Sliders, ShieldCheck, Check } from 'lucide-react';
import { useDeviceTilt } from '../hooks/useDeviceTilt';

export const AccelerometerHUD: React.FC = () => {
  const tilt = useDeviceTilt();
  const [isExpanded, setIsExpanded] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await tilt.requestPermission();
    if (granted) {
      setPermissionSuccess(true);
      setTimeout(() => setPermissionSuccess(false), 3000);
    }
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40">
      {/* Expanded Control Modal / Drawer */}
      {isExpanded && (
        <div className="mb-2 p-4 w-72 rounded-2xl bg-black/90 backdrop-blur-xl border border-pink-500/50 shadow-[0_0_25px_rgba(244,114,182,0.35)] text-xs text-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-pink-500/20 pb-2">
            <div className="flex items-center gap-1.5 font-space-mono font-bold text-pink-300">
              <Smartphone className="w-4 h-4 text-pink-400 animate-pulse" />
              <span>Card Accelerometer</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
            >
              ✕
            </button>
          </div>

          {/* Live Sensor Metrics */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-950/80 p-2.5 rounded-xl border border-pink-500/20 font-mono text-[11px]">
            <div>
              <div className="text-slate-500">Pitch (X)</div>
              <div className="font-bold text-pink-300">
                {tilt.rotateX > 0 ? `+${tilt.rotateX.toFixed(1)}` : tilt.rotateX.toFixed(1)}°
              </div>
            </div>
            <div>
              <div className="text-slate-500">Roll (Y)</div>
              <div className="font-bold text-pink-300">
                {tilt.rotateY > 0 ? `+${tilt.rotateY.toFixed(1)}` : tilt.rotateY.toFixed(1)}°
              </div>
            </div>
          </div>

          {/* Visual Mini 3D Preview Card */}
          <div className="flex flex-col items-center justify-center p-3 bg-neutral-950/60 rounded-xl border border-pink-500/20 overflow-hidden" style={{ perspective: '300px' }}>
            <div
              className="w-24 h-14 rounded-lg bg-gradient-to-br from-pink-600/80 via-purple-700/80 to-pink-900/90 border border-pink-300/60 shadow-[0_0_15px_rgba(244,114,182,0.5)] flex items-center justify-center text-[10px] font-mono text-white font-bold transition-transform duration-100"
              style={{
                transform: `rotateX(${tilt.rotateX.toFixed(1)}deg) rotateY(${tilt.rotateY.toFixed(1)}deg) translateZ(8px)`,
                transformStyle: 'preserve-3d',
              }}
            >
              deep_ card
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Tilt phone to rotate all post cards in 3D
            </p>
          </div>

          {/* iOS Permission Request if needed */}
          {tilt.needsPermission && (
            <button
              onClick={handleRequestPermission}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium shadow-[0_0_12px_rgba(236,72,153,0.5)] flex items-center justify-center gap-1.5"
            >
              {permissionSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Accelerometer Granted!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Enable Phone Motion</span>
                </>
              )}
            </button>
          )}

          {/* Calibrate and Simulation Controls */}
          <div className="space-y-2 pt-1 border-t border-pink-500/20">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={tilt.calibrate}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-pink-500/30 text-pink-300 text-[11px] flex items-center justify-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Calibrate Level</span>
              </button>

              <button
                onClick={() => tilt.setIsEnabled(!tilt.isEnabled)}
                className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium transition-all ${
                  tilt.isEnabled
                    ? 'bg-pink-950/80 border-pink-500 text-pink-300'
                    : 'bg-neutral-900 border-neutral-700 text-slate-500'
                }`}
              >
                {tilt.isEnabled ? 'Active' : 'Paused'}
              </button>
            </div>

            {/* Desktop Simulator Pad */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-pink-400" />
                  Virtual Phone Tilt
                </span>
                <span className="font-mono text-[10px] text-pink-400">Drag or Touch</span>
              </div>
              <div
                className="h-20 w-full rounded-xl bg-neutral-950 border border-pink-500/30 relative cursor-crosshair flex items-center justify-center overflow-hidden active:border-pink-400"
                onMouseMove={(e) => {
                  if (e.buttons !== 1) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
                  const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14;
                  tilt.setIsSimulating(true);
                  tilt.setSimulatedTilt(y, x);
                }}
                onMouseDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
                  const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14;
                  tilt.setIsSimulating(true);
                  tilt.setSimulatedTilt(y, x);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((touch.clientX - rect.left) / rect.width - 0.5) * 14;
                  const y = -((touch.clientY - rect.top) / rect.height - 0.5) * 14;
                  tilt.setIsSimulating(true);
                  tilt.setSimulatedTilt(y, x);
                }}
              >
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-pink-500/20" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-pink-500/20" />
                {/* Tilt Ball indicator */}
                <div
                  className="w-4 h-4 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)] absolute transition-transform duration-75"
                  style={{
                    transform: `translate(${((tilt.rotateY / 7) * 40).toFixed(1)}px, ${(-(tilt.rotateX / 7) * 30).toFixed(1)}px)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Pill Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/85 hover:bg-neutral-900 border border-pink-500/50 hover:border-pink-400 text-pink-300 text-xs font-mono shadow-[0_0_15px_rgba(244,114,182,0.35)] backdrop-blur-md transition-all active:scale-95 group cursor-pointer"
        title="Phone Accelerometer 3D Card Rotation"
      >
        <Smartphone className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Phone Gyro:</span>
        <span className="text-[11px] font-bold text-white">
          {tilt.rotateX > 0 ? `+${tilt.rotateX.toFixed(0)}` : tilt.rotateX.toFixed(0)}° / {tilt.rotateY > 0 ? `+${tilt.rotateY.toFixed(0)}` : tilt.rotateY.toFixed(0)}°
        </span>
        {tilt.hasSensorData && (
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
        )}
      </button>
    </div>
  );
};
