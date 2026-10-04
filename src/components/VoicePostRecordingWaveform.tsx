import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Square,
  Check,
  Trash2,
  Radio,
  Volume2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface VoicePostRecordingWaveformProps {
  isRecording: boolean;
  recordingSeconds: number;
  liveTranscript?: string;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

function buildSmoothSpline(points: [number, number][], isClosed: boolean = false): string {
  if (points.length < 2) return '';
  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  if (isClosed) path += ' Z';
  return path;
}

export const VoicePostRecordingWaveform: React.FC<VoicePostRecordingWaveformProps> = ({
  isRecording,
  recordingSeconds,
  liveTranscript,
  onStopRecording,
  onCancelRecording,
}) => {
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    Array.from({ length: 48 }, (_, i) => 0.15 + Math.sin(i * 0.3) * 0.1)
  );
  const [audioLevel, setAudioLevel] = useState<number>(35);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const wavePaths = useMemo(() => {
    if (frequencies.length < 4) return { outerPath: '', rmsPath: '', topOutline: '', bottomOutline: '' };
    const sampleCount = frequencies.length;
    const zeroAxisY = 50;
    const maxUpper = 42;
    const maxLower = 38;

    const topCoords: [number, number][] = [];
    const bottomCoords: [number, number][] = [];
    const topRmsCoords: [number, number][] = [];
    const bottomRmsCoords: [number, number][] = [];

    for (let i = 0; i < sampleCount; i++) {
      const x = (i / (sampleCount - 1)) * 1000;
      const peak = frequencies[i];
      const topY = zeroAxisY - peak * maxUpper;
      const bottomY = zeroAxisY + peak * 0.78 * maxLower;
      const topRmsY = zeroAxisY - peak * 0.65 * maxUpper;
      const bottomRmsY = zeroAxisY + peak * 0.52 * maxLower;

      topCoords.push([x, topY]);
      bottomCoords.push([x, bottomY]);
      topRmsCoords.push([x, topRmsY]);
      bottomRmsCoords.push([x, bottomRmsY]);
    }

    const topSmooth = buildSmoothSpline([[0, zeroAxisY], ...topCoords, [1000, zeroAxisY]]);
    const bottomSmooth = buildSmoothSpline([[1000, zeroAxisY], ...bottomCoords.slice().reverse(), [0, zeroAxisY]]);
    const outerPath = `${topSmooth} L 1000 ${zeroAxisY} ${bottomSmooth.replace(/^M [0-9.]+ [0-9.]+/, '')} Z`;

    const topRmsSmooth = buildSmoothSpline([[0, zeroAxisY], ...topRmsCoords, [1000, zeroAxisY]]);
    const bottomRmsSmooth = buildSmoothSpline([[1000, zeroAxisY], ...bottomRmsCoords.slice().reverse(), [0, zeroAxisY]]);
    const rmsPath = `${topRmsSmooth} L 1000 ${zeroAxisY} ${bottomRmsSmooth.replace(/^M [0-9.]+ [0-9.]+/, '')} Z`;

    const topOutline = buildSmoothSpline([[0, zeroAxisY], ...topCoords, [1000, zeroAxisY]]);
    const bottomOutline = buildSmoothSpline([[0, zeroAxisY], ...bottomCoords, [1000, zeroAxisY]]);

    return { outerPath, rmsPath, topOutline, bottomOutline };
  }, [frequencies]);

  // Attempt real mic frequency capture; fallback gracefully to rhythmic speech simulation
  useEffect(() => {
    if (!isRecording) return;

    let isStreamActive = true;

    async function initAudioStream() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isStreamActive) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;

          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.75;
            source.connect(analyser);
            analyserRef.current = analyser;
          }
        }
      } catch (err) {
        // User denied mic or not supported, purely visual simulation will drive the waveform
        console.info('Live AudioContext input optional, utilizing synthetic voice frequency generator:', err);
      }
    }

    initAudioStream();

    let step = 0;
    const updateWaveform = () => {
      step += 0.08;

      if (analyserRef.current) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Map analyser data to 36 mirrored visual bars
        const barCount = 36;
        const newFreqs: number[] = [];
        let totalEnergy = 0;

        for (let i = 0; i < barCount; i++) {
          // Sample across lower and middle vocal formant ranges (100Hz - 3400Hz)
          const dataIndex = Math.floor((i / barCount) * (bufferLength * 0.7));
          const val = (dataArray[dataIndex] || 0) / 255;
          totalEnergy += val;

          // Apply slight center-weighted bell curve boost for aesthetics
          const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
          const amplified = Math.min(1.0, Math.max(0.12, val * (0.8 + centerFactor * 0.6)));
          newFreqs.push(amplified);
        }

        const avgLevel = Math.round((totalEnergy / barCount) * 100);
        setAudioLevel(Math.max(15, Math.min(98, avgLevel * 1.5)));
        setFrequencies(newFreqs);
      } else {
        // High-fidelity speech vocal simulation
        const barCount = 36;
        const newFreqs: number[] = [];
        let totalEnergy = 0;

        for (let i = 0; i < barCount; i++) {
          const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
          const vocalModulation =
            Math.sin(step * 2.5 + i * 0.35) * 0.3 +
            Math.cos(step * 1.8 - i * 0.25) * 0.2 +
            Math.sin(step * 4.2 + i * 0.8) * 0.15;

          const amplitude = Math.max(
            0.12,
            Math.min(0.96, (0.55 + vocalModulation) * (1 - distFromCenter * 0.45))
          );

          totalEnergy += amplitude;
          newFreqs.push(amplitude);
        }

        setAudioLevel(Math.round((totalEnergy / barCount) * 100));
        setFrequencies(newFreqs);
      }

      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = requestAnimationFrame(updateWaveform);

    return () => {
      isStreamActive = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 450, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border-2 border-pink-500/80 bg-neutral-950/95 p-4 shadow-[0_0_35px_rgba(236,72,153,0.35),0_12px_30px_rgba(0,0,0,0.85)] backdrop-blur-xl"
    >
      {/* Ambient reactive background glow */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-cyan-500/20 blur-3xl" />

      {/* Moving iridescent light scan line */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-pink-400/15 to-transparent skew-x-12"
      />

      {/* Top Header: Recording Status & Live Metrics */}
      <div className="relative z-10 flex items-center justify-between gap-3 border-b border-pink-500/25 pb-3">
        <div className="flex items-center gap-2.5">
          {/* Pulsing REC Beacon */}
          <div className="flex items-center gap-1.5 rounded-full border border-pink-500/50 bg-pink-950/80 px-2.5 py-1 text-xs font-mono font-bold text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.5)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
            </span>
            <span className="tracking-wider">REC</span>
            <span className="text-white ml-1">{formatTimer(recordingSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-pink-300/90">
            <Radio className="h-3 w-3 text-pink-400 animate-pulse" />
            <span>Voice Post Waveform Recording</span>
          </div>
        </div>

        {/* Audio Sensitivity Meter */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-400 flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-pink-400" />
            <span className="hidden xs:inline">Input:</span>
          </span>
          <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-900 border border-pink-500/30">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 via-fuchsia-400 to-cyan-400 rounded-full"
              style={{ width: `${audioLevel}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <span className="text-pink-300 font-bold">{audioLevel}%</span>
        </div>
      </div>

      {/* Center: Dynamic Animated Audio Waveform Display with Detailed Continuous Wave Shape */}
      <div className="relative z-10 my-4 flex h-28 items-center justify-center rounded-xl border border-pink-500/40 bg-black/80 px-3 py-2 shadow-inner overflow-hidden">
        {/* Horizontal Center Axis Guideline */}
        <div className="pointer-events-none absolute inset-x-2 h-0.5 bg-gradient-to-r from-pink-500/20 via-pink-400/40 to-pink-500/20 rounded-full" />

        {/* Detailed SVG Continuous Wave Shape */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="rec-wave-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="rec-rms-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fbcfe8" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
            <filter id="rec-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Filled Wave Envelope */}
          <path d={wavePaths.outerPath} fill="url(#rec-wave-fill)" filter="url(#rec-glow)" opacity="0.8" />
          {/* Inner Vocal Core */}
          <path d={wavePaths.rmsPath} fill="url(#rec-rms-fill)" opacity="0.85" />
          {/* Continuous Outlines */}
          <path d={wavePaths.topOutline} fill="none" stroke="#ffffff" strokeWidth="1.8" filter="url(#rec-glow)" />
          <path d={wavePaths.bottomOutline} fill="none" stroke="#f472b6" strokeWidth="1.4" />
        </svg>

        {/* Layered Vertical Micro-Formants */}
        <div className="flex h-full w-full items-center justify-between gap-0.5 sm:gap-1 px-1 relative z-10 pointer-events-none">
          {frequencies.map((freq, index) => {
            const isCenter = Math.abs(index - frequencies.length / 2) < 4;
            const barHeightPct = Math.max(12, Math.round(freq * 100));

            return (
              <div key={index} className="flex flex-1 flex-col items-center justify-center h-full">
                <div
                  className={`w-full max-w-[3px] rounded-t-sm transition-all duration-75 ${
                    isCenter ? 'bg-white shadow-[0_0_8px_#ffffff]' : 'bg-pink-300 opacity-70'
                  }`}
                  style={{ height: `${barHeightPct / 2}%` }}
                />
                <div
                  className={`w-full max-w-[3px] rounded-b-sm transition-all duration-75 ${
                    isCenter ? 'bg-pink-200' : 'bg-pink-400 opacity-60'
                  }`}
                  style={{ height: `${(barHeightPct / 2) * 0.78}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Live Overlay Badge: Audio Verse Frequency */}
        <div className="pointer-events-none absolute top-1.5 right-2.5 flex items-center gap-1 font-mono text-[9px] text-pink-300/80 bg-black/75 px-2 py-0.5 rounded-full border border-pink-500/30 shadow-sm z-20">
          <Sparkles className="w-2.5 h-2.5 text-pink-400 animate-pulse" />
          <span>Real-time Waveform Contour</span>
        </div>
      </div>

      {/* Live Recognized Transcription Stanza Preview */}
      {liveTranscript && (
        <div className="relative z-10 mb-3 rounded-xl border border-pink-500/20 bg-pink-950/20 p-2.5 text-xs text-slate-200">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-pink-300 font-bold mb-1">
            <Mic className="h-3 w-3 text-pink-400" />
            <span>Transcribed Vocal Stanza:</span>
          </div>
          <p className="italic leading-relaxed text-pink-100 font-serif">
            "{liveTranscript}"
          </p>
        </div>
      )}

      {/* Footer Controls: Done/Attach vs Cancel */}
      <div className="relative z-10 flex items-center justify-between gap-3 pt-1">
        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Voice stanzas automatically populate your status update
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancelRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-red-500/60 bg-neutral-900/90 hover:bg-red-950/40 text-slate-300 hover:text-red-300 text-xs font-mono font-medium transition-all cursor-pointer active:scale-95"
            title="Cancel and discard voice recording"
          >
            <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-400" />
            <span>Discard</span>
          </button>

          <button
            type="button"
            onClick={onStopRecording}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-indigo-600 hover:brightness-110 active:scale-95 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-400/80"
            title="Finish voice recording and attach voice post"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Finish Recording</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
