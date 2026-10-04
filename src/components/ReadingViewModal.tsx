import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Share2,
  Maximize2,
  Minimize2,
  Zap,
  TrendingUp,
  Hash,
  Globe,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Flame,
  Quote,
} from 'lucide-react';
import { ReadingLink, User } from '../types';
import { getPointsBreakdown } from '../utils/readingEstimator';

interface ReadingViewModalProps {
  readingLink: ReadingLink | null;
  currentUser: User;
  onClose: () => void;
  onClaimPoints?: (readingLink: ReadingLink, minutesSpent: number) => void;
  onCompleteReading?: (readingLink: ReadingLink, minutesSpent: number) => void;
  isAlreadyCompleted?: boolean;
  onShareToChat?: (postOrDoc: any) => void;
  sourceScreen?: 'chat' | 'feed' | 'group' | 'saved' | null;
  sourceChatTitle?: string;
  onBackToChat?: () => void;
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
  }) => void;
}

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface FloatingPointsNotification {
  id: string;
  points: number;
  label: string;
  sublabel: string;
  type: 'complete' | 'claimed';
  hashtag: string;
  breakdown: {
    base: number;
    minutePoints: number;
    depthBonus: number;
    total: number;
  };
}

export const ReadingViewModal: React.FC<ReadingViewModalProps> = ({
  readingLink,
  currentUser,
  onClose,
  onClaimPoints,
  onCompleteReading,
  isAlreadyCompleted = false,
  onShareToChat,
  sourceScreen,
  sourceChatTitle,
  onBackToChat,
  onRequestCreateQuoteCard,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isReadingActive, setIsReadingActive] = useState(true);
  const [hasClaimed, setHasClaimed] = useState(isAlreadyCompleted);
  const [claimedAnimation, setClaimedAnimation] = useState(false);
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  // Text Selection Quote Card State
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const handleTextSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionCoords(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length >= 3) {
      setSelectedText(text);
      try {
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionCoords({
          x: Math.max(20, Math.min(window.innerWidth - 100, rect.left + rect.width / 2)),
          y: Math.max(30, rect.top - 12),
        });
      } catch {
        setSelectionCoords(null);
      }
    } else {
      setSelectionCoords(null);
    }
  };

  const handleLaunchQuoteCard = (customText?: string) => {
    if (!readingLink) return;
    const text = customText || selectedText || readingLink.excerpt || readingLink.title;
    if (onRequestCreateQuoteCard) {
      onRequestCreateQuoteCard({
        quoteText: text,
        sourceTitle: readingLink.title,
        sourceType: readingLink.domain.toLowerCase().includes('poetry') ? 'poetry' : 'pdf',
        sourceAuthor: readingLink.domain,
      });
    }
    setSelectionCoords(null);
    setSelectedText('');
  };

  const handleCloseOrBack = () => {
    if (onBackToChat) {
      onBackToChat();
    } else {
      onClose();
    }
  };

  // Floating +Points notification queue for Framer Motion animation
  const [floatingPointsList, setFloatingPointsList] = useState<FloatingPointsNotification[]>([]);

  // Scroll progress state for the top progress bar and completion cues
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [showCompletionCue, setShowCompletionCue] = useState(false);
  const hasAutoAwardedRef = useRef(isAlreadyCompleted);

  useEffect(() => {
    hasAutoAwardedRef.current = isAlreadyCompleted;
  }, [isAlreadyCompleted]);

  useEffect(() => {
    if (!readingLink) return;
    setSecondsElapsed(0);
    setHasClaimed(isAlreadyCompleted);
    hasAutoAwardedRef.current = isAlreadyCompleted;
    setScrollProgress(0);
    setHasReachedEnd(false);
    setShowCompletionCue(false);

    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }

    const interval = setInterval(() => {
      if (isReadingActive) {
        setSecondsElapsed((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [readingLink, isReadingActive, isAlreadyCompleted]);

  // Automatically award points when the user completes/reads the link
  const autoAwardPoints = () => {
    if (hasAutoAwardedRef.current || hasClaimed) return;
    hasAutoAwardedRef.current = true;
    setHasClaimed(true);
    setClaimedAnimation(true);

    triggerFloatingPoints('claimed');

    // Generate burst celebration particles
    const colors = ['#f472b6', '#ec4899', '#f59e0b', '#fbbf24', '#38bdf8', '#c084fc', '#ffffff', '#34d399'];
    const newParticles: ConfettiParticle[] = Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * 2 * Math.PI;
      const distance = 45 + Math.random() * 55;
      return {
        id: Date.now() + i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
        color: colors[i % colors.length],
        size: 4 + Math.random() * 5,
        rotation: Math.random() * 360,
      };
    });
    setParticles(newParticles);

    const minutesSpent = Math.max(1, Math.ceil(secondsElapsed / 60));
    if (onCompleteReading) {
      onCompleteReading(readingLink, minutesSpent);
    }
    if (onClaimPoints) {
      onClaimPoints(readingLink, minutesSpent);
    }

    setTimeout(() => {
      setClaimedAnimation(false);
    }, 3500);
  };

  // Scroll listener to calculate real-time reading scroll percentage
  const handleScrollProgress = () => {
    const el = contentScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollableDistance = scrollHeight - clientHeight;

    if (scrollableDistance <= 12) {
      // Content fits entirely in viewport
      setScrollProgress(100);
      if (!hasReachedEnd) {
        setHasReachedEnd(true);
        autoAwardPoints();
      }
      return;
    }

    const rawPercent = (scrollTop / scrollableDistance) * 100;
    const clampedPercent = Math.min(100, Math.max(0, Math.round(rawPercent)));
    setScrollProgress(clampedPercent);

    if (clampedPercent >= 90 && !hasReachedEnd) {
      setHasReachedEnd(true);
      setShowCompletionCue(true);
      autoAwardPoints();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleScrollProgress();
    }, 150);

    const el = contentScrollRef.current;
    if (!el) return () => clearTimeout(timer);

    el.addEventListener('scroll', handleScrollProgress, { passive: true });
    window.addEventListener('resize', handleScrollProgress);

    return () => {
      clearTimeout(timer);
      el.removeEventListener('scroll', handleScrollProgress);
      window.removeEventListener('resize', handleScrollProgress);
    };
  }, [fontSize, readingLink]);

  // Auto-dismiss completion cue toast after delay
  useEffect(() => {
    if (showCompletionCue) {
      const dismissTimer = setTimeout(() => {
        setShowCompletionCue(false);
      }, 4500);
      return () => clearTimeout(dismissTimer);
    }
  }, [showCompletionCue]);

  if (!readingLink) return null;

  const targetMinutes = readingLink.estimatedMinutes;
  const targetSeconds = targetMinutes * 60;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const cleanTag = readingLink.hashtag.replace(/^#+/, '');
  const breakdown = getPointsBreakdown(readingLink.estimatedMinutes);

  // Trigger floating "+Points" notification animation with Framer Motion
  const triggerFloatingPoints = (type: 'complete' | 'claimed') => {
    if (!readingLink) return;
    const pts = readingLink.readingPoints || breakdown.total;
    const notifId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const newNotif: FloatingPointsNotification = {
      id: notifId,
      points: pts,
      label: `+${pts} Points Added`,
      sublabel: `Automatically added to #${cleanTag} Intellectual Points`,
      type,
      hashtag: cleanTag,
      breakdown,
    };

    setFloatingPointsList((prev) => [...prev, newNotif]);

    setTimeout(() => {
      setFloatingPointsList((prev) => prev.filter((item) => item.id !== notifId));
    }, 3600);
  };

  const handleClaim = () => {
    autoAwardPoints();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xl animate-in fade-in duration-200">
      
      {/* Floating "+Points" Notification Animation (Framer Motion) */}
      <div 
        id="floating-points-overlay"
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-60 overflow-visible"
      >
        <AnimatePresence>
          {floatingPointsList.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ 
                opacity: 0, 
                y: 80, 
                scale: 0.45, 
                filter: 'blur(10px)',
              }}
              animate={{
                opacity: [0, 1, 1, 1, 0.9, 0],
                y: [70, 0, -90, -180, -280, -360],
                scale: [0.45, 1.18, 1.06, 1.02, 0.98, 0.85],
                filter: ['blur(8px)', 'blur(0px)', 'blur(0px)', 'blur(0px)', 'blur(2px)', 'blur(8px)'],
              }}
              exit={{ 
                opacity: 0, 
                y: -400, 
                scale: 0.75,
                filter: 'blur(10px)',
              }}
              transition={{
                type: 'keyframes',
                duration: 3.4,
                times: [0, 0.12, 0.35, 0.65, 0.88, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute flex flex-col items-center select-none"
            >
              {/* Expanding Shockwave Ripple Halo */}
              <motion.div
                initial={{ scale: 0.4, opacity: 0.9 }}
                animate={{ scale: [0.4, 1.8, 2.6], opacity: [0.9, 0.4, 0] }}
                transition={{ type: 'keyframes', duration: 1.8, ease: 'easeOut' }}
                className="absolute -inset-10 rounded-full bg-gradient-to-r from-amber-400/50 via-pink-500/40 to-emerald-400/50 blur-2xl pointer-events-none"
              />

              {/* Orbiting Sparkle Stars */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.2], y: [-10, -50], x: [-20, -60] }}
                transition={{ type: 'keyframes', duration: 2.2, delay: 0.1 }}
                className="absolute -top-4 -left-6 text-amber-300 pointer-events-none"
              >
                <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_#fbbf24]" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.2], y: [-10, -55], x: [20, 65] }}
                transition={{ type: 'keyframes', duration: 2.4, delay: 0.15 }}
                className="absolute -top-3 -right-6 text-emerald-300 pointer-events-none"
              >
                <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_#34d399]" />
              </motion.div>

              {/* Primary Floating +Points Card */}
              <div className="relative px-7 py-4 rounded-3xl bg-neutral-950/95 border-2 border-amber-400/90 shadow-[0_0_50px_rgba(251,191,36,0.7),0_0_30px_rgba(236,72,153,0.4),inset_0_0_20px_rgba(251,191,36,0.2)] flex flex-col items-center gap-1.5 backdrop-blur-2xl">
                
                {/* Upper Completion Status Pill */}
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-extrabold text-amber-300/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Points Added Automatically!</span>
                </div>

                {/* Hero +Points Value & Icon */}
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-pink-500/30 border border-amber-400/70 flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.7)] shrink-0">
                    <Award className="w-6 h-6 text-amber-300 animate-bounce" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_18px_rgba(251,191,36,0.9)]">
                      +{notif.points}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-white tracking-wide drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]">
                      POINTS
                    </span>
                  </div>
                </div>

                {/* Subtitle / Channel destination pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow-[0_0_15px_rgba(52,211,153,0.35)] mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{notif.sublabel}</span>
                </div>

                {/* Left Mini Trailing Badge: Duration Points */}
                <motion.div
                  initial={{ opacity: 0, x: 0, y: 10, scale: 0.6 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0], 
                    x: [-10, -90, -110], 
                    y: [0, -35, -70], 
                    scale: [0.6, 1, 0.95, 0.75] 
                  }}
                  transition={{ duration: 2.8, delay: 0.1, ease: 'easeOut' }}
                  className="absolute -left-14 top-3 px-3 py-1 rounded-full bg-neutral-900/95 border border-pink-500/60 text-[11px] font-bold text-pink-300 shadow-[0_0_16px_rgba(236,72,153,0.45)] flex items-center gap-1.5 whitespace-nowrap pointer-events-none"
                >
                  <Clock className="w-3 h-3 text-pink-400" />
                  <span>+{notif.breakdown.minutePoints} Duration</span>
                </motion.div>

                {/* Right Mini Trailing Badge: Base & Bonus */}
                <motion.div
                  initial={{ opacity: 0, x: 0, y: 10, scale: 0.6 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0], 
                    x: [10, 90, 110], 
                    y: [0, -30, -65], 
                    scale: [0.6, 1, 0.95, 0.75] 
                  }}
                  transition={{ duration: 2.8, delay: 0.18, ease: 'easeOut' }}
                  className="absolute -right-14 top-3 px-3 py-1 rounded-full bg-neutral-900/95 border border-amber-500/60 text-[11px] font-bold text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.45)] flex items-center gap-1.5 whitespace-nowrap pointer-events-none"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>+{notif.breakdown.base + notif.breakdown.depthBonus} Base & Bonus</span>
                </motion.div>

              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/40 rounded-3xl w-full max-w-3xl overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.3)] flex flex-col max-h-[95vh]">
        
        {/* Top Control & Reading Progress Header */}
        <div className="bg-neutral-900/70 border-b border-pink-500/30 px-5 py-3.5 flex items-center justify-between gap-3 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
              hasReachedEnd 
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400' 
                : 'bg-pink-950/80 border-pink-500/50 text-pink-400'
            }`}>
              {hasReachedEnd ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {readingLink.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-pink-950 border border-pink-400/40 text-pink-300 font-bold text-[10px]">
                  #{cleanTag}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-pink-300">
                  <Clock className="w-3 h-3 text-pink-400" />
                  Elapsed: {formatTime(secondsElapsed)} / {targetMinutes}m target
                </span>
                <span>•</span>
                <span className="text-amber-300 font-semibold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  +{readingLink.readingPoints} pts reward
                </span>
                <span className="hidden sm:inline">•</span>
                {/* Scroll completion tracker badge in header */}
                <span className={`hidden sm:inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border transition-all duration-300 ${
                  hasReachedEnd
                    ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)] font-semibold'
                    : 'bg-neutral-950/90 border-pink-500/30 text-pink-300'
                }`}>
                  {hasReachedEnd ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>100% Read • Complete</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3 h-3 text-pink-400" />
                      <span>{scrollProgress}% Read</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {onBackToChat && (
              <button
                onClick={onBackToChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-pointer hover:scale-105 active:scale-95 border border-indigo-400/60"
                title={`Return to ${sourceChatTitle ? `${sourceChatTitle} Chat` : 'Chat'}`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Back to {sourceChatTitle ? `${sourceChatTitle}` : 'Chat'}</span>
                <span className="xs:hidden">Back</span>
              </button>
            )}

            <div className="hidden sm:flex items-center bg-neutral-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-0.5 rounded-lg ${fontSize === 'normal' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Default font size"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-0.5 rounded-lg text-sm ${fontSize === 'large' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Larger font size"
              >
                A+
              </button>
            </div>

            <a
              href={readingLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Open source article in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Source</span>
            </a>

            <button
              onClick={handleCloseOrBack}
              className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={onBackToChat ? "Return to Chat" : "Close modal"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scroll Progress Bar at the top of the Reading View */}
        <div 
          className="w-full bg-neutral-900/95 h-1.5 sm:h-2 relative overflow-hidden shrink-0 border-b border-white/5"
          role="progressbar"
          aria-valuenow={scrollProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Track subtle glow */}
          <div className="absolute inset-0 bg-neutral-950" />

          {/* Glowing Animated Progress Fill */}
          <div
            className={`h-full transition-all duration-100 ease-out relative ${
              hasReachedEnd
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-lime-300 shadow-[0_0_18px_rgba(52,211,153,0.95)]'
                : 'bg-gradient-to-r from-pink-500 via-fuchsia-500 to-amber-400 shadow-[0_0_14px_rgba(236,72,153,0.7)]'
            }`}
            style={{ width: `${scrollProgress}%` }}
          >
            {/* Glowing lead beacon edge while actively scrolling */}
            {scrollProgress > 2 && scrollProgress < 100 && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_#ffffff,0_0_15px_#ec4899] -mr-1 animate-pulse" />
            )}

            {/* Shimmer sweep effect when completed */}
            {hasReachedEnd && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            )}
          </div>
        </div>

        {/* Satisfying completion notification banner when reaching the end */}
        {showCompletionCue && (
          <div className="bg-gradient-to-r from-emerald-950/95 via-neutral-900/95 to-teal-950/95 border-b border-emerald-500/50 px-4 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-300 shadow-[0_4px_25px_rgba(52,211,153,0.25)] shrink-0">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
              </div>
              <span className="font-semibold text-white">
                Reading Complete! <span className="text-emerald-300">100% finished</span> — <strong className="text-amber-300">+{readingLink.readingPoints} points</strong> automatically added to <span className="text-emerald-300">#{cleanTag}</span>!
              </span>
            </div>
            <button
              onClick={() => setShowCompletionCue(false)}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Reading Article Body with Scroll Container Ref */}
        <div 
          ref={contentScrollRef}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200 scroll-smooth select-text relative"
        >
          
          {/* Article Header Card */}
          <div className="p-5 rounded-2xl bg-neutral-900/80 border border-pink-500/30 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-pink-400 font-mono">
                <Globe className="w-3.5 h-3.5" />
                {readingLink.domain}
              </span>
              <span className="text-amber-300 font-bold">
                +{readingLink.readingPoints} points in #{cleanTag} Stream
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {readingLink.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
              <span>⏱️ Estimated {readingLink.estimatedMinutes} min read</span>
              <span>•</span>
              <span>~{readingLink.wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-pink-500/30 text-pink-300">
                {readingLink.difficulty}
              </span>
            </div>
          </div>

          {/* Core Essay / Reading Content */}
          <div className={`space-y-4 leading-relaxed font-sans ${fontSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}>
            <p className="text-pink-100 font-medium italic border-l-2 border-pink-500 pl-4 py-1">
              "{readingLink.excerpt}"
            </p>

            <p className="text-slate-300">
              In our hyper-accelerated digital landscape, deep reading and intentional contemplation are revolutionary acts. When we engage with sustained thought, we step away from transactional engagement metrics and step toward genuine cognitive depth.
            </p>

            <h2 className="text-lg font-bold text-white pt-2">
              1. The Value of Attentive Silence
            </h2>

            <p className="text-slate-300">
              Every hashtag stream on the deep_ network serves as a focused focal point for thoughtful individuals. Rather than counting superficial clicks, our community measures intellectual commitment through dedicated reading duration. As you spend time with this material, your earned standing directly elevates the #{cleanTag} circle.
            </p>

            <h2 className="text-lg font-bold text-white pt-2">
              2. Structural Depth in #{cleanTag}
            </h2>

            <p className="text-slate-300">
              By grounding discussions in longform literature and foundational essays, contributors across #{cleanTag} build shared intellectual frameworks. Whether parsing intricate verse, verifying cryptographic proofs, or exploring philosophical aesthetics, authentic knowledge requires unhurried immersion.
            </p>

            <h2 className="text-lg font-bold text-white pt-2">
              3. Cognitive Restitution and Sustained Attention
            </h2>

            <p className="text-slate-300">
              Modern research in cognitive psychology repeatedly validates that uninterrupted reading activates neural pathways associated with empathy, deductive reasoning, and critical synthesis. Rather than scattering mental reserves across ephemeral feeds, deliberate reading restores mental bandwidth and clarifies perspective.
            </p>

            <h2 className="text-lg font-bold text-white pt-2">
              4. Elevating the Collective Knowledge Commons
            </h2>

            <p className="text-slate-300">
              Your engagement here is not simply private consumption—it directly influences the standing of #{cleanTag} in our collective index. As more members commit time to verified literature, this channel's intellectual authority compounds, curating higher quality perspectives for every participant.
            </p>

            {/* Key Takeaways Box */}
            <div className="p-4 rounded-xl bg-neutral-900/90 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Key Discussion Takeaways</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
                <li>Deep immersion builds resilient mental models superior to short-form summaries.</li>
                <li>Verified reading time earns verifiable reputation points in #{cleanTag}.</li>
                <li>Shared literary references provide common vocabulary for community debates.</li>
              </ul>
            </div>

            {/* Full Publication Source Banner */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 truncate">
                Full publication: <strong className="text-slate-200">{readingLink.url}</strong>
              </span>
              <a
                href={readingLink.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => autoAwardPoints()}
                className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-semibold flex items-center gap-1.5 shrink-0 transition-all hover:scale-105"
              >
                <span>Read on {readingLink.domain}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Satisfying Completion Card at End of Reading */}
            <div 
              className={`p-5 rounded-2xl border transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                hasReachedEnd || hasClaimed
                  ? 'bg-gradient-to-r from-emerald-950/70 via-neutral-900/90 to-teal-950/70 border-emerald-500/60 shadow-[0_0_30px_rgba(52,211,153,0.25)]'
                  : 'bg-neutral-900/60 border-neutral-800/80'
              }`}
            >
              <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
                <div 
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                    hasReachedEnd || hasClaimed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_16px_rgba(52,211,153,0.4)]'
                      : 'bg-neutral-800 text-slate-500 border border-neutral-700'
                  }`}
                >
                  {hasReachedEnd || hasClaimed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{hasReachedEnd || hasClaimed ? '🎉 Reading Goal Completed!' : 'Keep scrolling to finish reading'}</span>
                    <span 
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                        hasReachedEnd || hasClaimed
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-neutral-800 text-slate-400 border-neutral-700'
                      }`}
                    >
                      {scrollProgress}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {hasReachedEnd || hasClaimed
                      ? `Congratulations! You've finished reading this longform text. +${readingLink.readingPoints} intellectual points have been automatically added to #${cleanTag}!`
                      : `Scroll through to reach 100% — +${readingLink.readingPoints} intellectual points are credited automatically.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(hasReachedEnd || hasClaimed) && (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(52,211,153,0.3)] shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>+{readingLink.readingPoints} Pts Added</span>
                  </div>
                )}

                {onBackToChat && (
                  <button
                    onClick={onBackToChat}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 text-xs font-bold transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.4)] shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Chat</span>
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sticky Status Bar */}
        <div className="bg-neutral-900 border-t border-pink-500/30 p-4 px-6 flex items-center justify-between gap-4 shrink-0 relative overflow-hidden">
          
          {/* Particles when points awarded */}
          {claimedAnimation && particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none rounded-full animate-out fade-out zoom-out"
              style={{
                left: `calc(50% + ${p.x}px)`,
                top: `calc(50% + ${p.y}px)`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
            />
          ))}

          {/* Left summary */}
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                Reading Intellectual Reward:
              </span>
              <span className="text-amber-300 font-bold font-mono">
                +{readingLink.readingPoints} pts in #{cleanTag}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hasClaimed
                ? `Automatically credited to your #${cleanTag} balance.`
                : `Points are automatically credited upon completing this reading.`}
            </p>
          </div>

          {/* Right Action: Status & Close */}
          <div className="flex items-center gap-3">
            {hasClaimed ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-xs shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>+{readingLink.readingPoints} Pts Added</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                <span>Reading in progress ({scrollProgress}%)</span>
              </div>
            )}

            {onBackToChat ? (
              <button
                onClick={onBackToChat}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Chat</span>
              </button>
            ) : (
              <button
                onClick={handleCloseOrBack}
                className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 border border-neutral-700"
              >
                {hasClaimed ? 'Done' : 'Close'}
              </button>
            )}
          </div>

        </div>

        {/* Floating Quick Quote Card Tooltip on Selected Text */}
        {selectionCoords && selectedText && onRequestCreateQuoteCard && (
          <div
            style={{ left: `${selectionCoords.x}px`, top: `${selectionCoords.y}px` }}
            className="fixed z-50 -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          >
            <button
              onClick={() => handleLaunchQuoteCard()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(236,72,153,0.6)] border border-pink-300 transition-all hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span>Create Quote Card</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
