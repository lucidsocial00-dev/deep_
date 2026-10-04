import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, AudioWaveform, Volume2, VolumeX, RotateCcw, Sparkles, Activity, Layers } from 'lucide-react';
import { PostVoiceNote } from '../types';

interface VoicePostWaveformPlayerProps {
  voiceNote?: PostVoiceNote;
  postContent?: string;
  authorName?: string;
  authorAvatar?: string;
  postId?: string;
  isViralActive?: boolean;
  theme?: 'pink' | 'lime';
  compact?: boolean;
}

interface DetailedPoint {
  x: number;
  topPeak: number;
  bottomPeak: number;
  topRms: number;
  bottomRms: number;
  decibels: number;
  yTop: number;
  yBottom: number;
  yTopRms: number;
  yBottomRms: number;
}

// Build smooth Catmull-Rom cubic Bézier path for continuous wave contours
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

export const VoicePostWaveformPlayer: React.FC<VoicePostWaveformPlayerProps> = ({
  voiceNote,
  postContent = '',
  authorName = 'Voice Creator',
  postId = 'voice_preview',
  isViralActive = false,
  theme = 'pink',
  compact = false,
}) => {
  const isLime = theme === 'lime' || isViralActive;
  const uniqueId = useMemo(
    () => 'vp_' + postId.replace(/[^a-zA-Z0-9]/g, '_') + '_' + Math.random().toString(36).substring(2, 7),
    [postId]
  );

  // Toggle between smooth studio wave envelope and high-resolution formants
  const [waveStyle, setWaveStyle] = useState<'studio' | 'formants'>('studio');

  // Calculate realistic duration based on voice note or words in content (approx 130 words/min = 2.1 words/sec)
  const duration = useMemo(() => {
    if (voiceNote?.durationSeconds && voiceNote.durationSeconds > 0) {
      return voiceNote.durationSeconds;
    }
    const words = (voiceNote?.transcript || postContent || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(6, Math.min(60, Math.round(words / 2.2) || 12));
  }, [voiceNote?.durationSeconds, voiceNote?.transcript, postContent]);

  // Generate high-density acoustic points (160 points) for a rich, continuous detailed wave shape
  const detailedPoints: DetailedPoint[] = useMemo(() => {
    const rawPeaks = voiceNote?.waveformPeaks && voiceNote.waveformPeaks.length >= 10
      ? voiceNote.waveformPeaks
      : null;

    const sampleCount = 160;
    const seed = (postId || 'voice_track').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const result: DetailedPoint[] = [];

    const zeroAxisY = 60;
    const maxUpper = 52;
    const maxLower = 46;

    for (let i = 0; i < sampleCount; i++) {
      const ratio = i / (sampleCount - 1);
      const x = ratio * 1000;

      let basePeak = 0.45;
      if (rawPeaks) {
        const floatIdx = ratio * (rawPeaks.length - 1);
        const low = Math.floor(floatIdx);
        const high = Math.min(rawPeaks.length - 1, low + 1);
        const frac = floatIdx - low;
        basePeak = rawPeaks[low] * (1 - frac) + rawPeaks[high] * frac;
      } else {
        // Natural human speech cadence: syllable bursts, pauses, phoneme plosives
        const speechSyllables = Math.sin(ratio * Math.PI * 18);
        const sentenceBreaths = Math.sin(ratio * Math.PI * 3.5);
        const microPlosive = Math.sin(i * 11.23 + seed) * 0.18 + Math.cos(i * 6.71 + seed) * 0.12;
        basePeak = 0.28 + Math.abs(speechSyllables) * 0.38 * Math.max(0.2, sentenceBreaths) + Math.abs(microPlosive);
      }

      // Add speech formant harmonics for organic vocal realism
      const harmonic1 = Math.sin(i * 0.45 + seed) * 0.05;
      const harmonic2 = Math.cos(i * 1.32 + seed) * 0.035;
      const topPeak = Math.max(0.12, Math.min(0.98, Number((basePeak + harmonic1 + harmonic2).toFixed(3))));

      // Natural speech vocal cord asymmetry: bottom reflection oscillates at ~70-80%
      const asymmetry = 0.72 + Math.sin(i * 0.25 + seed) * 0.08;
      const bottomPeak = Math.max(0.09, Math.min(0.90, Number((topPeak * asymmetry).toFixed(3))));

      // Inner RMS core (dense perceived vocal energy)
      const topRms = Number((topPeak * 0.68).toFixed(3));
      const bottomRms = Number((bottomPeak * 0.64).toFixed(3));

      const decibels = Math.round(20 * Math.log10(Math.max(0.01, topPeak)) * 10) / 10;

      const yTop = zeroAxisY - topPeak * maxUpper;
      const yBottom = zeroAxisY + bottomPeak * maxLower;
      const yTopRms = zeroAxisY - topRms * (maxUpper * 0.82);
      const yBottomRms = zeroAxisY + bottomRms * (maxLower * 0.82);

      result.push({
        x,
        topPeak,
        bottomPeak,
        topRms,
        bottomRms,
        decibels,
        yTop,
        yBottom,
        yTopRms,
        yBottomRms,
      });
    }

    return result;
  }, [voiceNote?.waveformPeaks, postId]);

  // Construct smooth SVG path curves for the detailed wave shape
  const wavePaths = useMemo(() => {
    if (detailedPoints.length === 0) {
      return {
        outerFilledPath: '',
        rmsFilledPath: '',
        topOutlinePath: '',
        bottomOutlinePath: '',
        striaeLines: [],
      };
    }

    const zeroAxisY = 60;
    const topCoords: [number, number][] = detailedPoints.map((p) => [p.x, p.yTop]);
    const bottomCoords: [number, number][] = detailedPoints.map((p) => [p.x, p.yBottom]);
    const topRmsCoords: [number, number][] = detailedPoints.map((p) => [p.x, p.yTopRms]);
    const bottomRmsCoords: [number, number][] = detailedPoints.map((p) => [p.x, p.yBottomRms]);

    // Outer continuous wave envelope
    const topSmooth = buildSmoothSpline([[0, zeroAxisY], ...topCoords, [1000, zeroAxisY]]);
    const bottomSmoothReversed = buildSmoothSpline([
      [1000, zeroAxisY],
      ...bottomCoords.slice().reverse(),
      [0, zeroAxisY],
    ]);

    const outerFilledPath = `${topSmooth} L 1000 ${zeroAxisY} ${bottomSmoothReversed.replace(/^M [0-9.]+ [0-9.]+/, '')} Z`;

    // Inner RMS core envelope
    const topRmsSmooth = buildSmoothSpline([[0, zeroAxisY], ...topRmsCoords, [1000, zeroAxisY]]);
    const bottomRmsSmoothReversed = buildSmoothSpline([
      [1000, zeroAxisY],
      ...bottomRmsCoords.slice().reverse(),
      [0, zeroAxisY],
    ]);
    const rmsFilledPath = `${topRmsSmooth} L 1000 ${zeroAxisY} ${bottomRmsSmoothReversed.replace(/^M [0-9.]+ [0-9.]+/, '')} Z`;

    // Distinct top and bottom outline crests
    const topOutlinePath = buildSmoothSpline([[0, zeroAxisY], ...topCoords, [1000, zeroAxisY]]);
    const bottomOutlinePath = buildSmoothSpline([[0, zeroAxisY], ...bottomCoords, [1000, zeroAxisY]]);

    // High-resolution vertical timbre striae (spaced every 10px = 100 fine acoustic slices)
    const striaeLines: { x: number; y1: number; y2: number; peak: number }[] = [];
    for (let i = 0; i < detailedPoints.length; i += 2) {
      const p = detailedPoints[i];
      striaeLines.push({
        x: p.x,
        y1: p.yTop,
        y2: p.yBottom,
        peak: p.topPeak,
      });
    }

    return {
      outerFilledPath,
      rmsFilledPath,
      topOutlinePath,
      bottomOutlinePath,
      striaeLines,
    };
  }, [detailedPoints]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const formatTime = (secs: number) => {
    const s = Math.floor(Math.max(0, secs));
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    return `${mins}:${String(rem).padStart(2, '0')}`;
  };

  // Setup actual audio element if voiceNote has an audioUrl
  useEffect(() => {
    if (voiceNote?.audioUrl) {
      const audio = new Audio(voiceNote.audioUrl);
      audio.playbackRate = playbackRate;
      audio.muted = isMuted;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audioRef.current = audio;

      return () => {
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      };
    }
  }, [voiceNote?.audioUrl]);

  // Sync playback rate and muted state with audioRef
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.muted = isMuted;
    }
  }, [playbackRate, isMuted]);

  // Stop synthetic audio on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
      stopWebAudioPulse();
    };
  }, []);

  const startWebAudioPulse = () => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      // ignore
    }
  };

  const stopWebAudioPulse = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.05);
      }
      if (oscRef.current) {
        setTimeout(() => {
          try {
            oscRef.current?.stop();
            oscRef.current?.disconnect();
            oscRef.current = null;
          } catch {
            // ignore
          }
        }, 100);
      }
    } catch {
      // ignore
    }
  };

  // Playback loop for speech synthesis / synthetic playback
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    if (voiceNote?.audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
      return;
    }

    // Fallback: Web Speech API & Virtual Playhead Progression
    let lastTimestamp = performance.now();
    startWebAudioPulse();

    // Trigger SpeechSynthesis if available
    const spokenText = (voiceNote?.transcript || postContent || '').trim();
    if (window.speechSynthesis && spokenText && currentTime === 0) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = playbackRate;
        utterance.pitch = 1.05;
        synthUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis playback notice:', err);
      }
    }

    const step = (now: number) => {
      const deltaSecs = ((now - lastTimestamp) / 1000) * playbackRate;
      lastTimestamp = now;

      setCurrentTime((prev) => {
        const next = prev + deltaSecs;
        if (next >= duration) {
          setIsPlaying(false);
          stopWebAudioPulse();
          if (window.speechSynthesis) {
            try {
              window.speechSynthesis.cancel();
            } catch {
              // ignore
            }
          }
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      stopWebAudioPulse();
    };
  }, [isPlaying, duration, playbackRate, voiceNote?.audioUrl]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (window.speechSynthesis) {
        try {
          window.speechSynthesis.pause();
        } catch {
          // ignore
        }
      }
      stopWebAudioPulse();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        if (currentTime >= duration) {
          audioRef.current.currentTime = 0;
        }
        audioRef.current.play().catch(() => {});
      } else {
        if (window.speechSynthesis && window.speechSynthesis.paused) {
          try {
            window.speechSynthesis.resume();
          } catch {
            // ignore
          }
        }
      }
      setIsPlaying(true);
    }
  };

  const handleSeek = (progressPercent: number) => {
    const targetTime = Math.max(0, Math.min(duration, progressPercent * duration));
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    handleSeek(progress);
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, hoverX / rect.width));
    setHoverProgress(progress);
  };

  const handleWaveformMouseLeave = () => {
    setHoverProgress(null);
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
  };

  const progressRatio = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const playheadX = progressRatio * 1000;

  // Calculate hover dB and timestamp
  const hoverPointIndex = hoverProgress !== null
    ? Math.min(detailedPoints.length - 1, Math.max(0, Math.floor(hoverProgress * (detailedPoints.length - 1))))
    : null;
  const hoverDecibels = hoverPointIndex !== null ? detailedPoints[hoverPointIndex].decibels : null;

  return (
    <div
      className={`rounded-xl border transition-all select-none ${
        isLime
          ? 'bg-neutral-950/95 border-lime-500/40 hover:border-lime-400 shadow-[0_0_16px_rgba(163,230,53,0.18)]'
          : 'bg-neutral-950/95 border-pink-500/40 hover:border-pink-400 shadow-[0_0_16px_rgba(236,72,153,0.18)]'
      } ${compact ? 'p-2.5' : 'p-3.5'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Badge, Duration, Waveform Style Toggle, and Speed Toggle */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shadow-sm ${
              isLime
                ? 'bg-lime-950/80 text-lime-300 border-lime-500/40'
                : 'bg-pink-950/80 text-pink-300 border-pink-500/40'
            }`}
          >
            <AudioWaveform className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse text-white' : isLime ? 'text-lime-400' : 'text-pink-400'}`} />
            <span>Voice Post</span>
          </span>

          {isPlaying && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold animate-pulse ${
                isLime ? 'text-lime-400' : 'text-pink-400'
              }`}
            >
              <Volume2 className="w-3 h-3" />
              <span>Playing Audio</span>
            </span>
          )}

          {/* Detailed Wave Shape Tag */}
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 bg-neutral-900 border border-white/5">
            <Activity className="w-2.5 h-2.5 text-pink-400" />
            <span>High-Def Contour</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle between Detailed Studio Wave & High-Density Formant Bars */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWaveStyle(waveStyle === 'studio' ? 'formants' : 'studio');
            }}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border flex items-center gap-1 ${
              waveStyle === 'studio'
                ? isLime
                  ? 'bg-lime-900/60 border-lime-400/50 text-lime-200'
                  : 'bg-pink-900/60 border-pink-400/50 text-pink-200'
                : 'bg-neutral-900 border-neutral-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle waveform view: Continuous Studio Wave vs Formant Slices"
          >
            <Layers className="w-2.5 h-2.5" />
            <span className="hidden xs:inline">{waveStyle === 'studio' ? 'Contour' : 'Slices'}</span>
          </button>

          {/* Speed Toggle Button */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
              isLime
                ? 'bg-lime-950/60 hover:bg-lime-900 border-lime-500/30 text-lime-300'
                : 'bg-pink-950/60 hover:bg-pink-900 border-pink-500/30 text-pink-300'
            }`}
            title="Toggle playback speed (1x, 1.25x, 1.5x, 2x)"
          >
            {playbackRate}x
          </button>

          {/* Time Counter */}
          <span className="text-xs font-mono text-slate-400">
            <span className={isPlaying ? (isLime ? 'text-lime-300 font-bold' : 'text-pink-300 font-bold') : 'text-slate-200'}>
              {formatTime(currentTime)}
            </span>
            <span className="mx-1 text-slate-600">/</span>
            <span>{formatTime(duration)}</span>
          </span>
        </div>
      </div>

      {/* Main Player Row: Play Button + Detailed SVG Audio Waveform */}
      <div className="flex items-center gap-3">
        {/* Play / Pause Button with Neon Glow */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
            isPlaying
              ? isLime
                ? 'bg-lime-500 text-black shadow-[0_0_16px_rgba(163,230,53,0.8)] ring-2 ring-lime-300'
                : 'bg-pink-600 text-white shadow-[0_0_16px_rgba(236,72,153,0.8)] ring-2 ring-pink-400'
              : isLime
              ? 'bg-lime-950 hover:bg-lime-900 text-lime-300 border border-lime-500/50 hover:border-lime-400 hover:shadow-[0_0_12px_rgba(163,230,53,0.4)]'
              : 'bg-pink-950 hover:bg-pink-900 text-pink-300 border border-pink-500/50 hover:border-pink-400 hover:shadow-[0_0_12px_rgba(236,72,153,0.4)]'
          }`}
          title={isPlaying ? 'Pause Voice Post' : 'Play Voice Post (Detailed Waveform)'}
          aria-label={isPlaying ? 'Pause voice post' : 'Play voice post'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Detailed Continuous SVG Audio Waveform Canvas */}
        <div
          ref={waveformContainerRef}
          onClick={handleWaveformClick}
          onMouseMove={handleWaveformMouseMove}
          onMouseLeave={handleWaveformMouseLeave}
          className="relative flex-1 h-16 sm:h-20 bg-neutral-950/90 rounded-xl cursor-pointer overflow-hidden group/waveform border border-white/10 hover:border-pink-500/40 transition-colors shadow-inner"
          title="Click or drag to seek playback position"
        >
          {/* Decibel Reference Lines & Zero Axis */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1 z-0">
            {/* +6dB peak guideline */}
            <div className="w-full border-t border-dashed border-white/5 flex items-center justify-between text-[8px] font-mono text-slate-600 px-1">
              <span>+6dB</span>
              <span className="hidden sm:inline">PEAK</span>
            </div>
            {/* 0dB center line */}
            <div className="w-full border-t border-white/15 relative">
              <span className="absolute left-1 -top-2 text-[8px] font-mono text-slate-500">0dB</span>
            </div>
            {/* -6dB lower guide */}
            <div className="w-full border-t border-dashed border-white/5 flex items-center justify-between text-[8px] font-mono text-slate-600 px-1">
              <span>-6dB</span>
              <span className="hidden sm:inline">REF</span>
            </div>
          </div>

          {/* SVG Detailed Waveform Graphic */}
          <svg
            className={`w-full h-full relative z-10 ${isPlaying ? 'animate-pulse' : ''}`}
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Played Gradient */}
              <linearGradient id={`grad-played-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isLime ? '#bef264' : '#f472b6'} stopOpacity="0.95" />
                <stop offset="50%" stopColor={isLime ? '#84cc16' : '#ec4899'} stopOpacity="0.85" />
                <stop offset="100%" stopColor={isLime ? '#4d7c0f' : '#be185d'} stopOpacity="0.75" />
              </linearGradient>

              {/* Played Core RMS Highlight */}
              <linearGradient id={`grad-rms-played-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="50%" stopColor={isLime ? '#d9f99d' : '#fbcfe8'} stopOpacity="0.85" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
              </linearGradient>

              {/* Unplayed Gradient */}
              <linearGradient id={`grad-unplayed-${uniqueId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isLime ? '#3f6212' : '#831843'} stopOpacity="0.35" />
                <stop offset="50%" stopColor={isLime ? '#1a2e05' : '#500724'} stopOpacity="0.25" />
                <stop offset="100%" stopColor={isLime ? '#3f6212' : '#831843'} stopOpacity="0.30" />
              </linearGradient>

              {/* Glow Filter for Crest Outlines */}
              <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Clip path for the played (progressed) section */}
              <clipPath id={`clip-played-${uniqueId}`}>
                <rect x="0" y="0" width={playheadX} height="120" />
              </clipPath>

              {/* Clip path for the remaining unplayed section */}
              <clipPath id={`clip-unplayed-${uniqueId}`}>
                <rect x={playheadX} y="0" width={Math.max(0, 1000 - playheadX)} height="120" />
              </clipPath>
            </defs>

            {/* UNPLAYED WAVEFORM LAYER */}
            <g clipPath={`url(#clip-unplayed-${uniqueId})`}>
              {/* Outer Envelope Fill */}
              <path
                d={wavePaths.outerFilledPath}
                fill={`url(#grad-unplayed-${uniqueId})`}
                opacity="0.9"
              />

              {/* Inner RMS Energy Body */}
              <path
                d={wavePaths.rmsFilledPath}
                fill={isLime ? 'rgba(163,230,53,0.15)' : 'rgba(236,72,153,0.15)'}
              />

              {/* High-Resolution Formant Striae (Vertical Acoustic Ticks) */}
              {wavePaths.striaeLines.map((line, idx) => (
                <line
                  key={`unplayed-line-${idx}`}
                  x1={line.x}
                  y1={line.y1}
                  x2={line.x}
                  y2={line.y2}
                  stroke={isLime ? 'rgba(163,230,53,0.22)' : 'rgba(236,72,153,0.22)'}
                  strokeWidth="1.2"
                />
              ))}

              {/* Top & Bottom Crest Line Outlines */}
              <path
                d={wavePaths.topOutlinePath}
                fill="none"
                stroke={isLime ? 'rgba(163,230,53,0.45)' : 'rgba(236,72,153,0.45)'}
                strokeWidth="1.4"
              />
              <path
                d={wavePaths.bottomOutlinePath}
                fill="none"
                stroke={isLime ? 'rgba(163,230,53,0.35)' : 'rgba(236,72,153,0.35)'}
                strokeWidth="1.2"
              />
            </g>

            {/* PLAYED WAVEFORM LAYER (Glows vibrant neon with illuminated RMS core) */}
            <g clipPath={`url(#clip-played-${uniqueId})`}>
              {/* Glowing Outer Envelope */}
              <path
                d={wavePaths.outerFilledPath}
                fill={`url(#grad-played-${uniqueId})`}
                filter={`url(#glow-${uniqueId})`}
                opacity="0.9"
              />

              {/* Bright Luminous RMS Vocal Core */}
              <path
                d={wavePaths.rmsFilledPath}
                fill={`url(#grad-rms-played-${uniqueId})`}
                opacity="0.95"
              />

              {/* High-Resolution Formant Striae Highlights */}
              {wavePaths.striaeLines.map((line, idx) => (
                <line
                  key={`played-line-${idx}`}
                  x1={line.x}
                  y1={line.y1}
                  x2={line.x}
                  y2={line.y2}
                  stroke={isLime ? '#f7fee7' : '#ffffff'}
                  strokeWidth="1.4"
                  opacity={0.35 + line.peak * 0.45}
                />
              ))}

              {/* Neon Crest Outlines */}
              <path
                d={wavePaths.topOutlinePath}
                fill="none"
                stroke={isLime ? '#bef264' : '#ffffff'}
                strokeWidth="1.8"
                filter={`url(#glow-${uniqueId})`}
              />
              <path
                d={wavePaths.bottomOutlinePath}
                fill="none"
                stroke={isLime ? '#84cc16' : '#f472b6'}
                strokeWidth="1.4"
              />
            </g>

            {/* Zero-Axis Reference Line */}
            <line
              x1="0"
              y1="60"
              x2="1000"
              y2="60"
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          </svg>

          {/* Hover Seek Indicator Line & Floating Tag */}
          {hoverProgress !== null && (
            <div
              className={`absolute top-0 bottom-0 w-0.5 z-30 pointer-events-none ${
                isLime ? 'bg-lime-300 shadow-[0_0_8px_#bef264]' : 'bg-pink-300 shadow-[0_0_8px_#f472b6]'
              }`}
              style={{ left: `${hoverProgress * 100}%` }}
            >
              <div
                className={`absolute -top-1 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono text-black font-bold whitespace-nowrap shadow-md ${
                  isLime ? 'bg-lime-300' : 'bg-pink-300'
                }`}
              >
                {formatTime(hoverProgress * duration)}
                {hoverDecibels !== null && (
                  <span className="ml-1 opacity-80 font-normal">({hoverDecibels} dB)</span>
                )}
              </div>
            </div>
          )}

          {/* Precision Playhead Needle with Beacon */}
          <div
            className={`absolute top-0 bottom-0 w-0.5 z-20 pointer-events-none transition-all duration-75 ${
              isLime
                ? 'bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,1)]'
                : 'bg-pink-400 shadow-[0_0_12px_rgba(236,72,153,1)]'
            }`}
            style={{ left: `${progressRatio * 100}%` }}
          >
            {/* Top Playhead Beacon */}
            <div
              className={`absolute -top-1 -translate-x-1/2 w-2.5 h-2.5 rounded-full ring-2 ring-black ${
                isLime
                  ? 'bg-lime-300 shadow-[0_0_8px_#bef264]'
                  : 'bg-pink-200 shadow-[0_0_8px_#fbcfe8]'
              }`}
            />
            {/* Bottom Playhead Beacon */}
            <div
              className={`absolute -bottom-1 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                isLime ? 'bg-lime-400' : 'bg-pink-400'
              }`}
            />
          </div>
        </div>

        {/* Quick Restart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSeek(0);
          }}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer rounded-lg hover:bg-neutral-900"
          title="Restart voice note"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Voice Transcript / Excerpt Preview */}
      {(voiceNote?.transcript || postContent) && (
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-start gap-2 text-xs">
          <span
            className={`font-serif text-sm leading-none shrink-0 ${
              isLime ? 'text-lime-400/80' : 'text-pink-400/80'
            }`}
          >
            “
          </span>
          <p className="text-slate-300 italic text-[11px] line-clamp-2 leading-relaxed font-sans">
            {voiceNote?.transcript || postContent}
          </p>
        </div>
      )}
    </div>
  );
};
