import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  MessageSquare,
  Send,
  Sparkles,
  Heart,
  Clock,
  Volume2,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  FastForward,
  Rewind,
  Zap,
  Activity,
  Layers,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  Maximize2,
} from 'lucide-react';
import { PostSong, WaveformComment, User } from '../types';
import { musicAudioEngine } from '../utils/musicAudioEngine';
import {
  generateAccurateSongWaveform,
  generateWaveformSvgPaths,
  AccurateWaveformPoint,
} from '../utils/waveformAudioAnalyzer';

export type DetailedWaveformSlice = AccurateWaveformPoint;

export interface TrackWaveformProps {
  song: PostSong;
  currentUser: User;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onAddComment?: (songId: string, comment: WaveformComment) => void;
  compact?: boolean;
  theme?: 'sky' | 'purple' | 'pink' | 'emerald' | 'lime';
  className?: string;
}

const THEME_STYLES = {
  lime: {
    gradientPlayed: {
      stop0: '#a3e635',
      stop25: '#84cc16',
      stop50: '#65a30d',
      stop75: '#84cc16',
      stop100: '#a3e635',
    },
    gradientRmsPlayed: {
      stop0: '#f7fee7',
      stop50: '#bef264',
      stop100: '#f7fee7',
    },
    gradientPreview: {
      stop0: '#a3e635',
      stop50: '#d9f99d',
      stop100: '#a3e635',
    },
    playedStroke: '#a3e635',
    playedDropShadow: 'rgba(163, 230, 53, 0.5)',
    previewStroke: 'rgba(163, 230, 53, 0.9)',
    zeroAxisStroke: 'rgba(132, 204, 22, 0.45)',
    containerBorder: 'border-lime-500/35',
    accentText: 'text-lime-300',
    accentBadge: 'bg-lime-950/80 border-lime-500/40 text-lime-300',
    activityIcon: 'text-lime-400',
    zoomActiveBtn: 'bg-lime-900/80 text-lime-200 border border-lime-500/60 shadow-[0_0_10px_rgba(163,230,53,0.4)]',
    zoomIcon: 'text-lime-400',
    zoomBadge: 'bg-lime-500/30 text-lime-200 border-lime-400/50',
    zoomPillActive: 'bg-lime-500 text-black font-bold',
    modeBtnHover: 'hover:text-lime-300',
    precisionBanner: 'bg-lime-950/80 border-lime-500/40 text-lime-200',
    pingBg: 'bg-lime-400',
    pingDot: 'bg-lime-500',
    precisionText: 'text-lime-300',
    centerPlayheadBtn: 'text-lime-300 hover:text-white bg-lime-900/40 hover:bg-lime-900/80 border-lime-500/40',
    autoFollowActive: 'bg-lime-950/70 border-lime-500/50 text-lime-300',
    liveBanner: 'bg-lime-950/90 border-lime-400/60 shadow-[0_0_18px_rgba(163,230,53,0.4)]',
    liveAvatarRing: 'ring-lime-400',
    liveAuthor: 'text-lime-200',
    liveBadge: 'bg-lime-500/30 text-lime-300 border-lime-400/40',
    liveClose: 'text-lime-400',
    dbCenterLine: 'bg-lime-500/30',
    db0dBText: 'text-lime-400/70',
    playheadNeedle: 'bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,1)]',
    playheadDiamond: 'bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,1)]',
    seekLine: 'bg-gradient-to-b from-lime-200 via-lime-400 to-lime-500 shadow-[0_0_12px_rgba(163,230,53,1)]',
    seekBeaconTop: 'bg-lime-200 shadow-[0_0_12px_rgba(163,230,53,1)]',
    seekBeaconDot: 'bg-lime-500',
    seekBeaconBottom: 'bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,1)]',
    hoverBadgeForward: 'bg-neutral-950/95 border-lime-400 text-lime-100 shadow-[0_0_18px_rgba(163,230,53,0.6)]',
    hoverBadgeRewind: 'bg-neutral-950/95 border-lime-400 text-lime-100 shadow-[0_0_18px_rgba(163,230,53,0.6)]',
    hoverBadgeNormal: 'bg-neutral-950/95 border-lime-300 text-white',
    hoverBadgeForwardIcon: 'text-lime-400',
    hoverBadgeRewindIcon: 'text-lime-400',
    hoverBadgeNormalIcon: 'text-lime-300',
    hoverBadgeCaretForward: 'border-t-lime-400',
    hoverBadgeCaretRewind: 'border-t-lime-400',
    hoverBadgeCaretNormal: 'border-t-lime-300',
    markerLineActive: 'bg-gradient-to-b from-lime-200 via-lime-400 to-lime-500 shadow-[0_0_10px_rgba(163,230,53,1)] w-[2px]',
    markerLineNear: 'bg-lime-400/90 shadow-[0_0_8px_rgba(163,230,53,0.8)]',
    markerLineDefault: 'border-l border-dashed border-lime-400/40 group-hover/marker:border-solid group-hover/marker:border-lime-300',
    markerDotActive: 'bg-lime-400 border border-white shadow-[0_0_8px_rgba(163,230,53,1)]',
    markerDotDefault: 'bg-lime-400/70 group-hover/marker:bg-lime-300',
    markerCaretActive: 'border-b-lime-400',
    markerCaretDefault: 'border-b-lime-400/80 group-hover/marker:border-b-lime-400',
    markerAvatarActive: 'border-lime-400 ring-2 ring-lime-400/80 shadow-[0_0_14px_rgba(163,230,53,1)]',
    markerAvatarNear: 'border-lime-400 ring-1 ring-lime-400 animate-pulse',
    markerAvatarDefault: 'border-lime-400/80 group-hover/marker:border-lime-300 shadow-[0_0_8px_rgba(132,204,22,0.4)]',
    tooltipBorder: 'border-lime-500/70',
    tooltipAvatarRing: 'ring-lime-400',
    tooltipHandle: 'text-lime-300/80',
    tooltipTimeBadge: 'bg-lime-950 text-lime-300 border-lime-500/50',
    tooltipTimeIcon: 'text-lime-400',
    tooltipJumpBtn: 'bg-lime-900/70 hover:bg-lime-600/90 text-lime-100 hover:text-black border-lime-400/50 hover:border-lime-400',
    tooltipPlayIcon: 'text-lime-300',
    tooltipCaret: 'border-t-lime-500/70',
    jumpRipple: 'border-lime-400 bg-lime-500/30',
    jumpBadge: 'border-lime-400 text-lime-200 shadow-[0_0_14px_rgba(163,230,53,0.7)]',
    rulerStartDot: 'bg-lime-500/80',
    rulerCenterDiamond: 'border-lime-400/70 bg-lime-950',
    rulerCenterText: 'text-lime-400/90',
    rulerEndDot: 'bg-lime-400/80',
    playBtnActive: 'bg-lime-500 text-black shadow-[0_0_14px_rgba(163,230,53,0.7)]',
    playBtnDefault: 'bg-neutral-900 hover:bg-neutral-800 text-lime-300 border border-lime-500/50',
    playTimePlaying: 'text-lime-300 font-bold',
    playingBadge: 'text-lime-400 bg-lime-950/70 border border-lime-500/40',
    playingRadioIcon: 'text-lime-400',
    commentBtnOpen: 'bg-lime-500 text-black shadow-[0_0_12px_rgba(163,230,53,0.6)] font-bold',
    commentBtnClosed: 'bg-lime-950/70 hover:bg-lime-900 text-lime-300 border border-lime-500/40',
    commentBtnIcon: 'text-lime-400',
    composerBorder: 'border-lime-500/50',
    composerAvatarRing: 'ring-lime-400',
    composerTimeBadge: 'bg-lime-500/20 text-lime-300 border border-lime-500/40',
    composerSnapBtn: 'text-lime-400 hover:text-lime-300',
    composerPrecisionBtn: 'text-lime-300 hover:text-lime-100 bg-lime-950/70 hover:bg-lime-900/70 border border-lime-500/40',
    composerPrecisionIcon: 'text-lime-400',
    composerPrecisionPill: 'text-lime-300 bg-lime-900/50 border border-lime-500/40',
    quickReactionActive: 'bg-lime-500/30 text-lime-200 border border-lime-400 shadow-sm',
    composerInput: 'border-lime-500/40 focus:border-lime-400',
    composerSubmitBtn: 'bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold hover:from-lime-400 hover:to-emerald-400',
    drawerSubheader: 'text-lime-400',
    drawerCardPinned: 'bg-lime-950/70 border-lime-400 ring-1 ring-lime-400/60 shadow-[0_0_12px_rgba(163,230,53,0.35)]',
    drawerCardDefault: 'hover:bg-lime-950/30 border-neutral-800 hover:border-lime-500/40',
    drawerAvatarPinned: 'ring-2 ring-lime-400',
    drawerAvatarDefault: 'ring-1 ring-lime-500/40',
    drawerHandle: 'text-lime-300/80',
    drawerJumpPinned: 'bg-lime-500 text-black font-bold border border-lime-300',
    drawerJumpDefault: 'bg-lime-950 hover:bg-lime-900 border border-lime-500/50 text-lime-300 hover:text-lime-200',
    commentHex: '#a3e635',
  },
  sky: {
    gradientPlayed: {
      stop0: '#38bdf8',
      stop25: '#0ea5e9',
      stop50: '#0284c7',
      stop75: '#0ea5e9',
      stop100: '#38bdf8',
    },
    gradientRmsPlayed: {
      stop0: '#f0f9ff',
      stop50: '#7dd3fc',
      stop100: '#f0f9ff',
    },
    gradientPreview: {
      stop0: '#38bdf8',
      stop50: '#7dd3fc',
      stop100: '#38bdf8',
    },
    playedStroke: '#38bdf8',
    playedDropShadow: 'rgba(56, 189, 248, 0.4)',
    previewStroke: 'rgba(56, 189, 248, 0.85)',
    zeroAxisStroke: 'rgba(56, 189, 248, 0.35)',
    containerBorder: 'border-sky-500/25',
    accentText: 'text-sky-300',
    accentBadge: 'bg-sky-950/70 border-sky-500/30 text-sky-300',
    activityIcon: 'text-sky-400',
    zoomActiveBtn: 'bg-sky-900/80 text-sky-200 border border-sky-500/50 shadow-[0_0_8px_rgba(56,189,248,0.35)]',
    zoomIcon: 'text-sky-400',
    zoomBadge: 'bg-sky-500/30 text-sky-200 border-sky-400/40',
    zoomPillActive: 'bg-sky-600 text-white font-bold',
    modeBtnHover: 'hover:text-sky-300',
    precisionBanner: 'bg-sky-950/70 border-sky-500/30 text-sky-200',
    pingBg: 'bg-sky-400',
    pingDot: 'bg-sky-500',
    precisionText: 'text-sky-300',
    centerPlayheadBtn: 'text-sky-300 hover:text-white bg-sky-900/40 hover:bg-sky-900/80 border-sky-500/30',
    autoFollowActive: 'bg-sky-950/60 border-sky-500/40 text-sky-300',
    liveBanner: 'bg-sky-950/90 border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]',
    liveAvatarRing: 'ring-sky-400',
    liveAuthor: 'text-sky-200',
    liveBadge: 'bg-sky-500/30 text-sky-300 border-sky-400/30',
    liveClose: 'text-sky-400',
    dbCenterLine: 'bg-sky-500/20',
    db0dBText: 'text-sky-400/60',
    playheadNeedle: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]',
    playheadDiamond: 'bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,1)]',
    seekLine: 'bg-gradient-to-b from-sky-200 via-sky-400 to-sky-500 shadow-[0_0_10px_rgba(125,211,252,0.9)]',
    seekBeaconTop: 'bg-sky-200 shadow-[0_0_10px_rgba(125,211,252,1)]',
    seekBeaconDot: 'bg-sky-500',
    seekBeaconBottom: 'bg-sky-300 shadow-[0_0_8px_rgba(56,189,248,1)]',
    hoverBadgeForward: 'bg-neutral-950/95 border-sky-400 text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.5)]',
    hoverBadgeRewind: 'bg-neutral-950/95 border-cyan-400 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.5)]',
    hoverBadgeNormal: 'bg-neutral-950/95 border-sky-300 text-white',
    hoverBadgeForwardIcon: 'text-sky-400',
    hoverBadgeRewindIcon: 'text-cyan-400',
    hoverBadgeNormalIcon: 'text-sky-300',
    hoverBadgeCaretForward: 'border-t-sky-400',
    hoverBadgeCaretRewind: 'border-t-cyan-400',
    hoverBadgeCaretNormal: 'border-t-sky-300',
    markerLineActive: 'bg-gradient-to-b from-sky-200 via-sky-400 to-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.9)] w-[2px]',
    markerLineNear: 'bg-sky-400/90 shadow-[0_0_6px_rgba(56,189,248,0.7)]',
    markerLineDefault: 'border-l border-dashed border-sky-400/40 group-hover/marker:border-solid group-hover/marker:border-sky-300',
    markerDotActive: 'bg-sky-400 border border-white shadow-[0_0_6px_rgba(56,189,248,1)]',
    markerDotDefault: 'bg-sky-400/70 group-hover/marker:bg-sky-300',
    markerCaretActive: 'border-b-sky-400',
    markerCaretDefault: 'border-b-sky-400/80 group-hover/marker:border-b-sky-400',
    markerAvatarActive: 'border-sky-400 ring-2 ring-sky-400/70 shadow-[0_0_12px_rgba(56,189,248,0.95)]',
    markerAvatarNear: 'border-sky-400 ring-1 ring-sky-400 animate-pulse',
    markerAvatarDefault: 'border-sky-400/80 group-hover/marker:border-sky-300 shadow-[0_0_6px_rgba(14,165,233,0.35)]',
    tooltipBorder: 'border-sky-500/60',
    tooltipAvatarRing: 'ring-sky-400',
    tooltipHandle: 'text-sky-300/80',
    tooltipTimeBadge: 'bg-sky-950 text-sky-300 border-sky-500/40',
    tooltipTimeIcon: 'text-sky-400',
    tooltipJumpBtn: 'bg-sky-900/60 hover:bg-sky-600/80 text-sky-200 hover:text-white border-sky-400/40 hover:border-sky-400',
    tooltipPlayIcon: 'text-sky-300',
    tooltipCaret: 'border-t-sky-500/60',
    jumpRipple: 'border-sky-400 bg-sky-500/30',
    jumpBadge: 'border-sky-400 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    rulerStartDot: 'bg-sky-500/70',
    rulerCenterDiamond: 'border-sky-400/60 bg-sky-950',
    rulerCenterText: 'text-sky-400/90',
    rulerEndDot: 'bg-sky-400/70',
    playBtnActive: 'bg-sky-500 text-white shadow-[0_0_12px_rgba(56,189,248,0.5)]',
    playBtnDefault: 'bg-neutral-900 hover:bg-neutral-800 text-sky-300 border border-sky-500/40',
    playTimePlaying: 'text-sky-300 font-bold',
    playingBadge: 'text-sky-400 bg-sky-950/60 border border-sky-500/30',
    playingRadioIcon: 'text-sky-400',
    commentBtnOpen: 'bg-sky-600 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]',
    commentBtnClosed: 'bg-sky-950/70 hover:bg-sky-900 text-sky-300 border border-sky-500/30',
    commentBtnIcon: 'text-sky-400',
    composerBorder: 'border-sky-500/40',
    composerAvatarRing: 'ring-sky-400',
    composerTimeBadge: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
    composerSnapBtn: 'text-sky-400 hover:text-sky-300',
    composerPrecisionBtn: 'text-sky-300 hover:text-sky-100 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/30',
    composerPrecisionIcon: 'text-sky-400',
    composerPrecisionPill: 'text-sky-300 bg-sky-900/40 border border-sky-500/30',
    quickReactionActive: 'bg-sky-500/30 text-sky-200 border border-sky-400 shadow-sm',
    composerInput: 'border-sky-500/30 focus:border-sky-400',
    composerSubmitBtn: 'bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400',
    drawerSubheader: 'text-sky-400',
    drawerCardPinned: 'bg-sky-950/70 border-sky-400 ring-1 ring-sky-400/50 shadow-[0_0_10px_rgba(56,189,248,0.3)]',
    drawerCardDefault: 'hover:bg-sky-950/30 border-neutral-800 hover:border-sky-500/40',
    drawerAvatarPinned: 'ring-2 ring-sky-400',
    drawerAvatarDefault: 'ring-1 ring-sky-500/40',
    drawerHandle: 'text-sky-300/80',
    drawerJumpPinned: 'bg-sky-600 text-white border border-sky-300',
    drawerJumpDefault: 'bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 hover:text-sky-200',
    commentHex: '#38bdf8',
  },
  purple: {
    gradientPlayed: {
      stop0: '#d946ef',
      stop25: '#ec4899',
      stop50: '#8b5cf6',
      stop75: '#ec4899',
      stop100: '#d946ef',
    },
    gradientRmsPlayed: {
      stop0: '#fdf4ff',
      stop50: '#f472b6',
      stop100: '#fdf4ff',
    },
    gradientPreview: {
      stop0: '#c084fc',
      stop50: '#f472b6',
      stop100: '#c084fc',
    },
    playedStroke: '#f472b6',
    playedDropShadow: 'rgba(236,72,153,0.4)',
    previewStroke: 'rgba(236, 72, 153, 0.85)',
    zeroAxisStroke: 'rgba(168, 85, 247, 0.35)',
    containerBorder: 'border-purple-500/25',
    accentText: 'text-purple-300',
    accentBadge: 'bg-purple-950/70 border-purple-500/30 text-purple-300',
    activityIcon: 'text-pink-400',
    zoomActiveBtn: 'bg-purple-900/80 text-purple-200 border border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.35)]',
    zoomIcon: 'text-purple-400',
    zoomBadge: 'bg-pink-500/30 text-pink-200 border-pink-400/40',
    zoomPillActive: 'bg-purple-600 text-white font-bold',
    modeBtnHover: 'hover:text-purple-300',
    precisionBanner: 'bg-purple-950/70 border-purple-500/30 text-purple-200',
    pingBg: 'bg-pink-400',
    pingDot: 'bg-pink-500',
    precisionText: 'text-pink-300',
    centerPlayheadBtn: 'text-purple-300 hover:text-white bg-purple-900/40 hover:bg-purple-900/80 border-purple-500/30',
    autoFollowActive: 'bg-pink-950/60 border-pink-500/40 text-pink-300',
    liveBanner: 'bg-purple-950/90 border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
    liveAvatarRing: 'ring-purple-400',
    liveAuthor: 'text-purple-200',
    liveBadge: 'bg-purple-500/30 text-purple-300 border-purple-400/30',
    liveClose: 'text-purple-400',
    dbCenterLine: 'bg-purple-500/20',
    db0dBText: 'text-purple-400/60',
    playheadNeedle: 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.9)]',
    playheadDiamond: 'bg-pink-400 shadow-[0_0_6px_rgba(244,114,182,1)]',
    seekLine: 'bg-gradient-to-b from-purple-200 via-pink-400 to-purple-400 shadow-[0_0_10px_rgba(216,180,254,0.9)]',
    seekBeaconTop: 'bg-purple-200 shadow-[0_0_10px_rgba(216,180,254,1)]',
    seekBeaconDot: 'bg-pink-500',
    seekBeaconBottom: 'bg-purple-300 shadow-[0_0_8px_rgba(168,85,247,1)]',
    hoverBadgeForward: 'bg-neutral-950/95 border-purple-400 text-purple-100 shadow-[0_0_16px_rgba(168,85,247,0.5)]',
    hoverBadgeRewind: 'bg-neutral-950/95 border-pink-400 text-pink-100 shadow-[0_0_16px_rgba(244,114,182,0.5)]',
    hoverBadgeNormal: 'bg-neutral-950/95 border-purple-300 text-white',
    hoverBadgeForwardIcon: 'text-purple-400',
    hoverBadgeRewindIcon: 'text-pink-400',
    hoverBadgeNormalIcon: 'text-purple-300',
    hoverBadgeCaretForward: 'border-t-purple-400',
    hoverBadgeCaretRewind: 'border-t-pink-400',
    hoverBadgeCaretNormal: 'border-t-purple-300',
    markerLineActive: 'bg-gradient-to-b from-purple-200 via-pink-400 to-purple-400 shadow-[0_0_8px_rgba(244,114,182,0.9)] w-[2px]',
    markerLineNear: 'bg-pink-400/90 shadow-[0_0_6px_rgba(244,114,182,0.7)]',
    markerLineDefault: 'border-l border-dashed border-purple-400/40 group-hover/marker:border-solid group-hover/marker:border-pink-300',
    markerDotActive: 'bg-pink-400 border border-white shadow-[0_0_6px_rgba(244,114,182,1)]',
    markerDotDefault: 'bg-purple-400/70 group-hover/marker:bg-pink-300',
    markerCaretActive: 'border-b-pink-400',
    markerCaretDefault: 'border-b-purple-400/80 group-hover/marker:border-b-pink-400',
    markerAvatarActive: 'border-pink-400 ring-2 ring-pink-400/70 shadow-[0_0_12px_rgba(244,114,182,0.95)]',
    markerAvatarNear: 'border-pink-400 ring-1 ring-pink-400 animate-pulse',
    markerAvatarDefault: 'border-purple-400/80 group-hover/marker:border-pink-300 shadow-[0_0_6px_rgba(168,85,247,0.35)]',
    tooltipBorder: 'border-purple-500/60',
    tooltipAvatarRing: 'ring-purple-400',
    tooltipHandle: 'text-purple-300/80',
    tooltipTimeBadge: 'bg-purple-950 text-pink-300 border-purple-500/40',
    tooltipTimeIcon: 'text-pink-400',
    tooltipJumpBtn: 'bg-purple-900/60 hover:bg-pink-600/80 text-purple-200 hover:text-white border-purple-400/40 hover:border-pink-400',
    tooltipPlayIcon: 'text-pink-300',
    tooltipCaret: 'border-t-purple-500/60',
    jumpRipple: 'border-pink-400 bg-pink-500/30',
    jumpBadge: 'border-pink-400 text-pink-200 shadow-[0_0_12px_rgba(244,114,182,0.6)]',
    rulerStartDot: 'bg-purple-500/70',
    rulerCenterDiamond: 'border-purple-400/60 bg-purple-950',
    rulerCenterText: 'text-purple-400/90',
    rulerEndDot: 'bg-pink-500/70',
    playBtnActive: 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]',
    playBtnDefault: 'bg-neutral-900 hover:bg-neutral-800 text-purple-300 border border-purple-500/40',
    playTimePlaying: 'text-pink-300 font-bold',
    playingBadge: 'text-purple-400 bg-purple-950/60 border border-purple-500/30',
    playingRadioIcon: 'text-pink-400',
    commentBtnOpen: 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]',
    commentBtnClosed: 'bg-purple-950/70 hover:bg-purple-900 text-purple-300 border border-purple-500/30',
    commentBtnIcon: 'text-pink-400',
    composerBorder: 'border-purple-500/40',
    composerAvatarRing: 'ring-purple-400',
    composerTimeBadge: 'bg-purple-500/20 text-pink-300 border border-purple-500/40',
    composerSnapBtn: 'text-purple-400 hover:text-purple-300',
    composerPrecisionBtn: 'text-pink-300 hover:text-pink-100 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/30',
    composerPrecisionIcon: 'text-pink-400',
    composerPrecisionPill: 'text-purple-300 bg-purple-900/40 border border-purple-500/30',
    quickReactionActive: 'bg-pink-500/30 text-pink-200 border border-pink-400 shadow-sm',
    composerInput: 'border-purple-500/30 focus:border-pink-400',
    composerSubmitBtn: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500',
    drawerSubheader: 'text-purple-400',
    drawerCardPinned: 'bg-purple-950/70 border-pink-400 ring-1 ring-pink-400/50 shadow-[0_0_10px_rgba(244,114,182,0.3)]',
    drawerCardDefault: 'hover:bg-purple-950/30 border-neutral-800 hover:border-purple-500/40',
    drawerAvatarPinned: 'ring-2 ring-pink-400',
    drawerAvatarDefault: 'ring-1 ring-purple-500/40',
    drawerHandle: 'text-purple-300/80',
    drawerJumpPinned: 'bg-pink-600 text-white border border-pink-300',
    drawerJumpDefault: 'bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-purple-200',
    commentHex: '#c084fc',
  },
  pink: {
    gradientPlayed: {
      stop0: '#f43f5e',
      stop25: '#ec4899',
      stop50: '#f472b6',
      stop75: '#ec4899',
      stop100: '#f43f5e',
    },
    gradientRmsPlayed: {
      stop0: '#fff1f2',
      stop50: '#fda4af',
      stop100: '#fff1f2',
    },
    gradientPreview: {
      stop0: '#fb7185',
      stop50: '#f472b6',
      stop100: '#fb7185',
    },
    playedStroke: '#f43f5e',
    playedDropShadow: 'rgba(244,63,94,0.4)',
    previewStroke: 'rgba(244, 63, 94, 0.85)',
    zeroAxisStroke: 'rgba(244, 63, 94, 0.35)',
    containerBorder: 'border-pink-500/25',
    accentText: 'text-pink-300',
    accentBadge: 'bg-pink-950/70 border-pink-500/30 text-pink-300',
    activityIcon: 'text-rose-400',
    zoomActiveBtn: 'bg-pink-900/80 text-pink-200 border border-pink-500/50 shadow-[0_0_8px_rgba(244,63,94,0.35)]',
    zoomIcon: 'text-rose-400',
    zoomBadge: 'bg-rose-500/30 text-rose-200 border-rose-400/40',
    zoomPillActive: 'bg-pink-600 text-white font-bold',
    modeBtnHover: 'hover:text-pink-300',
    precisionBanner: 'bg-pink-950/70 border-pink-500/30 text-pink-200',
    pingBg: 'bg-rose-400',
    pingDot: 'bg-rose-500',
    precisionText: 'text-rose-300',
    centerPlayheadBtn: 'text-pink-300 hover:text-white bg-pink-900/40 hover:bg-pink-900/80 border-pink-500/30',
    autoFollowActive: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
    liveBanner: 'bg-pink-950/90 border-pink-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    liveAvatarRing: 'ring-pink-400',
    liveAuthor: 'text-pink-200',
    liveBadge: 'bg-pink-500/30 text-pink-300 border-pink-400/30',
    liveClose: 'text-pink-400',
    dbCenterLine: 'bg-pink-500/20',
    db0dBText: 'text-pink-400/60',
    playheadNeedle: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]',
    playheadDiamond: 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,1)]',
    seekLine: 'bg-gradient-to-b from-pink-200 via-rose-400 to-pink-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]',
    seekBeaconTop: 'bg-pink-200 shadow-[0_0_10px_rgba(251,113,133,1)]',
    seekBeaconDot: 'bg-rose-500',
    seekBeaconBottom: 'bg-pink-300 shadow-[0_0_8px_rgba(244,63,94,1)]',
    hoverBadgeForward: 'bg-neutral-950/95 border-pink-400 text-pink-100 shadow-[0_0_16px_rgba(244,63,94,0.5)]',
    hoverBadgeRewind: 'bg-neutral-950/95 border-rose-400 text-rose-100 shadow-[0_0_16px_rgba(251,113,133,0.5)]',
    hoverBadgeNormal: 'bg-neutral-950/95 border-pink-300 text-white',
    hoverBadgeForwardIcon: 'text-pink-400',
    hoverBadgeRewindIcon: 'text-rose-400',
    hoverBadgeNormalIcon: 'text-pink-300',
    hoverBadgeCaretForward: 'border-t-pink-400',
    hoverBadgeCaretRewind: 'border-t-rose-400',
    hoverBadgeCaretNormal: 'border-t-pink-300',
    markerLineActive: 'bg-gradient-to-b from-pink-200 via-rose-400 to-pink-400 shadow-[0_0_8px_rgba(251,113,133,0.9)] w-[2px]',
    markerLineNear: 'bg-rose-400/90 shadow-[0_0_6px_rgba(251,113,133,0.7)]',
    markerLineDefault: 'border-l border-dashed border-pink-400/40 group-hover/marker:border-solid group-hover/marker:border-rose-300',
    markerDotActive: 'bg-rose-400 border border-white shadow-[0_0_6px_rgba(251,113,133,1)]',
    markerDotDefault: 'bg-pink-400/70 group-hover/marker:bg-rose-300',
    markerCaretActive: 'border-b-rose-400',
    markerCaretDefault: 'border-b-pink-400/80 group-hover/marker:border-b-rose-400',
    markerAvatarActive: 'border-rose-400 ring-2 ring-rose-400/70 shadow-[0_0_12px_rgba(251,113,133,0.95)]',
    markerAvatarNear: 'border-rose-400 ring-1 ring-rose-400 animate-pulse',
    markerAvatarDefault: 'border-pink-400/80 group-hover/marker:border-rose-300 shadow-[0_0_6px_rgba(244,63,94,0.35)]',
    tooltipBorder: 'border-pink-500/60',
    tooltipAvatarRing: 'ring-pink-400',
    tooltipHandle: 'text-pink-300/80',
    tooltipTimeBadge: 'bg-pink-950 text-rose-300 border-pink-500/40',
    tooltipTimeIcon: 'text-rose-400',
    tooltipJumpBtn: 'bg-pink-900/60 hover:bg-rose-600/80 text-pink-200 hover:text-white border-pink-400/40 hover:border-rose-400',
    tooltipPlayIcon: 'text-rose-300',
    tooltipCaret: 'border-t-pink-500/60',
    jumpRipple: 'border-rose-400 bg-rose-500/30',
    jumpBadge: 'border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(251,113,133,0.6)]',
    rulerStartDot: 'bg-pink-500/70',
    rulerCenterDiamond: 'border-pink-400/60 bg-pink-950',
    rulerCenterText: 'text-pink-400/90',
    rulerEndDot: 'bg-rose-500/70',
    playBtnActive: 'bg-pink-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]',
    playBtnDefault: 'bg-neutral-900 hover:bg-neutral-800 text-pink-300 border border-pink-500/40',
    playTimePlaying: 'text-rose-300 font-bold',
    playingBadge: 'text-pink-400 bg-pink-950/60 border border-pink-500/30',
    playingRadioIcon: 'text-rose-400',
    commentBtnOpen: 'bg-rose-600 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]',
    commentBtnClosed: 'bg-pink-950/70 hover:bg-pink-900 text-pink-300 border border-pink-500/30',
    commentBtnIcon: 'text-rose-400',
    composerBorder: 'border-pink-500/40',
    composerAvatarRing: 'ring-pink-400',
    composerTimeBadge: 'bg-pink-500/20 text-rose-300 border border-pink-500/40',
    composerSnapBtn: 'text-pink-400 hover:text-pink-300',
    composerPrecisionBtn: 'text-rose-300 hover:text-rose-100 bg-pink-950/60 hover:bg-pink-900/60 border border-pink-500/30',
    composerPrecisionIcon: 'text-rose-400',
    composerPrecisionPill: 'text-pink-300 bg-pink-900/40 border border-pink-500/30',
    quickReactionActive: 'bg-rose-500/30 text-rose-200 border border-rose-400 shadow-sm',
    composerInput: 'border-pink-500/30 focus:border-rose-400',
    composerSubmitBtn: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
    drawerSubheader: 'text-pink-400',
    drawerCardPinned: 'bg-pink-950/70 border-rose-400 ring-1 ring-rose-400/50 shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    drawerCardDefault: 'hover:bg-pink-950/30 border-neutral-800 hover:border-pink-500/40',
    drawerAvatarPinned: 'ring-2 ring-rose-400',
    drawerAvatarDefault: 'ring-1 ring-pink-500/40',
    drawerHandle: 'text-pink-300/80',
    drawerJumpPinned: 'bg-rose-600 text-white border border-rose-300',
    drawerJumpDefault: 'bg-pink-950 hover:bg-pink-900 border border-pink-500/40 text-pink-300 hover:text-pink-200',
    commentHex: '#f472b6',
  },
  emerald: {
    gradientPlayed: {
      stop0: '#10b981',
      stop25: '#059669',
      stop50: '#047857',
      stop75: '#059669',
      stop100: '#10b981',
    },
    gradientRmsPlayed: {
      stop0: '#ecfdf5',
      stop50: '#6ee7b7',
      stop100: '#ecfdf5',
    },
    gradientPreview: {
      stop0: '#34d399',
      stop50: '#6ee7b7',
      stop100: '#34d399',
    },
    playedStroke: '#34d399',
    playedDropShadow: 'rgba(52, 211, 153, 0.4)',
    previewStroke: 'rgba(52, 211, 153, 0.85)',
    zeroAxisStroke: 'rgba(16, 185, 129, 0.35)',
    containerBorder: 'border-emerald-500/25',
    accentText: 'text-emerald-300',
    accentBadge: 'bg-emerald-950/70 border-emerald-500/30 text-emerald-300',
    activityIcon: 'text-emerald-400',
    zoomActiveBtn: 'bg-emerald-900/80 text-emerald-200 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.35)]',
    zoomIcon: 'text-emerald-400',
    zoomBadge: 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40',
    zoomPillActive: 'bg-emerald-600 text-white font-bold',
    modeBtnHover: 'hover:text-emerald-300',
    precisionBanner: 'bg-emerald-950/70 border-emerald-500/30 text-emerald-200',
    pingBg: 'bg-emerald-400',
    pingDot: 'bg-emerald-500',
    precisionText: 'text-emerald-300',
    centerPlayheadBtn: 'text-emerald-300 hover:text-white bg-emerald-900/40 hover:bg-emerald-900/80 border-emerald-500/30',
    autoFollowActive: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
    liveBanner: 'bg-emerald-950/90 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    liveAvatarRing: 'ring-emerald-400',
    liveAuthor: 'text-emerald-200',
    liveBadge: 'bg-emerald-500/30 text-emerald-300 border-emerald-400/30',
    liveClose: 'text-emerald-400',
    dbCenterLine: 'bg-emerald-500/20',
    db0dBText: 'text-emerald-400/60',
    playheadNeedle: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
    playheadDiamond: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,1)]',
    seekLine: 'bg-gradient-to-b from-emerald-200 via-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(110,231,183,0.9)]',
    seekBeaconTop: 'bg-emerald-200 shadow-[0_0_10px_rgba(110,231,183,1)]',
    seekBeaconDot: 'bg-emerald-500',
    seekBeaconBottom: 'bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,1)]',
    hoverBadgeForward: 'bg-neutral-950/95 border-emerald-400 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.5)]',
    hoverBadgeRewind: 'bg-neutral-950/95 border-teal-400 text-teal-100 shadow-[0_0_16px_rgba(45,212,191,0.5)]',
    hoverBadgeNormal: 'bg-neutral-950/95 border-emerald-300 text-white',
    hoverBadgeForwardIcon: 'text-emerald-400',
    hoverBadgeRewindIcon: 'text-teal-400',
    hoverBadgeNormalIcon: 'text-emerald-300',
    hoverBadgeCaretForward: 'border-t-emerald-400',
    hoverBadgeCaretRewind: 'border-t-teal-400',
    hoverBadgeCaretNormal: 'border-t-emerald-300',
    markerLineActive: 'bg-gradient-to-b from-emerald-200 via-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.9)] w-[2px]',
    markerLineNear: 'bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.7)]',
    markerLineDefault: 'border-l border-dashed border-emerald-400/40 group-hover/marker:border-solid group-hover/marker:border-emerald-300',
    markerDotActive: 'bg-emerald-400 border border-white shadow-[0_0_6px_rgba(52,211,153,1)]',
    markerDotDefault: 'bg-emerald-400/70 group-hover/marker:bg-emerald-300',
    markerCaretActive: 'border-b-emerald-400',
    markerCaretDefault: 'border-b-emerald-400/80 group-hover/marker:border-b-emerald-400',
    markerAvatarActive: 'border-emerald-400 ring-2 ring-emerald-400/70 shadow-[0_0_12px_rgba(52,211,153,0.95)]',
    markerAvatarNear: 'border-emerald-400 ring-1 ring-emerald-400 animate-pulse',
    markerAvatarDefault: 'border-emerald-400/80 group-hover/marker:border-emerald-300 shadow-[0_0_6px_rgba(16,185,129,0.35)]',
    tooltipBorder: 'border-emerald-500/60',
    tooltipAvatarRing: 'ring-emerald-400',
    tooltipHandle: 'text-emerald-300/80',
    tooltipTimeBadge: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
    tooltipTimeIcon: 'text-emerald-400',
    tooltipJumpBtn: 'bg-emerald-900/60 hover:bg-emerald-600/80 text-emerald-200 hover:text-white border-emerald-400/40 hover:border-emerald-400',
    tooltipPlayIcon: 'text-emerald-300',
    tooltipCaret: 'border-t-emerald-500/60',
    jumpRipple: 'border-emerald-400 bg-emerald-500/30',
    jumpBadge: 'border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.6)]',
    rulerStartDot: 'bg-emerald-500/70',
    rulerCenterDiamond: 'border-emerald-400/60 bg-emerald-950',
    rulerCenterText: 'text-emerald-400/90',
    rulerEndDot: 'bg-emerald-400/70',
    playBtnActive: 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]',
    playBtnDefault: 'bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-emerald-500/40',
    playTimePlaying: 'text-emerald-300 font-bold',
    playingBadge: 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30',
    playingRadioIcon: 'text-emerald-400',
    commentBtnOpen: 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    commentBtnClosed: 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30',
    commentBtnIcon: 'text-emerald-400',
    composerBorder: 'border-emerald-500/40',
    composerAvatarRing: 'ring-emerald-400',
    composerTimeBadge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    composerSnapBtn: 'text-emerald-400 hover:text-emerald-300',
    composerPrecisionBtn: 'text-emerald-300 hover:text-emerald-100 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30',
    composerPrecisionIcon: 'text-emerald-400',
    composerPrecisionPill: 'text-emerald-300 bg-emerald-900/40 border border-emerald-500/30',
    quickReactionActive: 'bg-emerald-500/30 text-emerald-200 border border-emerald-400 shadow-sm',
    composerInput: 'border-emerald-500/30 focus:border-emerald-400',
    composerSubmitBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    drawerSubheader: 'text-emerald-400',
    drawerCardPinned: 'bg-emerald-950/70 border-emerald-400 ring-1 ring-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    drawerCardDefault: 'hover:bg-emerald-950/30 border-neutral-800 hover:border-emerald-500/40',
    drawerAvatarPinned: 'ring-2 ring-emerald-400',
    drawerAvatarDefault: 'ring-1 ring-emerald-500/40',
    drawerHandle: 'text-emerald-300/80',
    drawerJumpPinned: 'bg-emerald-600 text-white border border-emerald-300',
    drawerJumpDefault: 'bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200',
    commentHex: '#34d399',
  },
};

export const TrackWaveform: React.FC<TrackWaveformProps> = ({
  song,
  currentUser,
  isPlaying: propIsPlaying,
  onTogglePlay,
  onAddComment,
  compact = false,
  theme = 'pink',
  className = '',
}) => {
  const ts = THEME_STYLES[theme] || THEME_STYLES.pink;
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const waveformScrollRef = useRef<HTMLDivElement>(null);

  // Visualization mode: detailed studio dual-axis (mirrored with RMS core) vs transient peaks
  const [waveMode, setWaveMode] = useState<'studio' | 'transient'>('studio');

  // Waveform horizontal zoom expansion level (1x = standard, 1.75x, 2.5x, 4x)
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [autoFollowPlayhead, setAutoFollowPlayhead] = useState(true);

  // Derive duration in seconds from song
  const durationSeconds = useMemo(() => {
    if (song.durationSeconds && song.durationSeconds > 0) return song.durationSeconds;
    if (song.duration) {
      const parts = song.duration.split(':').map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    return 180; // default 3 minutes
  }, [song.durationSeconds, song.duration]);

  // Playback state synchronized with audio engine
  const [engineState, setEngineState] = useState<{
    currentTime: number;
    isPlaying: boolean;
    trackId: string | null;
  }>({
    currentTime: musicAudioEngine.getCurrentTime(song.id),
    isPlaying: musicAudioEngine.isPlayingTrack(song.id),
    trackId: musicAudioEngine.getActiveTrackId(),
  });

  useEffect(() => {
    const unsub = musicAudioEngine.subscribe((state) => {
      if (state.trackId === song.id) {
        setEngineState({
          currentTime: state.currentTime,
          isPlaying: state.isPlaying,
          trackId: state.trackId,
        });
      } else if (engineState.isPlaying && state.trackId !== song.id) {
        setEngineState((prev) => ({ ...prev, isPlaying: false }));
      }
    });
    return unsub;
  }, [song.id, engineState.isPlaying]);

  const isThisTrackPlaying = propIsPlaying !== undefined ? propIsPlaying : engineState.isPlaying;
  const currentPlaybackTime = engineState.trackId === song.id ? engineState.currentTime : 0;
  const progressRatio = Math.min(1, Math.max(0, currentPlaybackTime / durationSeconds));

  // Audio frequency data for reactive bounce
  const [visualizerData, setVisualizerData] = useState<number[]>([15, 25, 20, 30, 22, 18, 26, 14]);
  useEffect(() => {
    let animId: number;
    if (isThisTrackPlaying) {
      const tick = () => {
        setVisualizerData(musicAudioEngine.getVisualizerData());
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isThisTrackPlaying]);

  // Stable unique ID for SVG gradients and clip paths
  const waveformId = useMemo(
    () => `wf_${(song.id || 'track').replace(/[^a-zA-Z0-9_-]/g, '_')}_${Math.random().toString(36).substring(2, 7)}`,
    [song.id]
  );

  // High-resolution acoustic point density scaling dynamically with horizontal zoomLevel
  const basePointCount = compact ? 380 : 540;
  const pointCount = useMemo(() => {
    return Math.round(basePointCount * (zoomLevel > 1 ? Math.min(2.5, 1 + (zoomLevel - 1) * 0.7) : 1));
  }, [basePointCount, zoomLevel]);

  // Continuous accurate acoustic waveform calculated directly from song data
  const waveformPoints = useMemo(() => {
    return generateAccurateSongWaveform(song, pointCount);
  }, [song, pointCount]);

  // Continuous SVG vector paths with live frequency modulation when playing
  const svgPaths = useMemo(() => {
    return generateWaveformSvgPaths(
      waveformPoints,
      1000,
      100,
      waveMode,
      isThisTrackPlaying ? { playheadRatio: progressRatio, visualizerData } : undefined
    );
  }, [waveformPoints, waveMode, isThisTrackPlaying, progressRatio, visualizerData]);

  // Local comments state so newly posted comments instantly appear
  const [localComments, setLocalComments] = useState<WaveformComment[]>(song.waveformComments || []);

  useEffect(() => {
    if (song.waveformComments) {
      setLocalComments(song.waveformComments);
    }
  }, [song.waveformComments]);

  // Waveform interactive hover & scrubbing
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPositionRatio, setHoverPositionRatio] = useState<number | null>(null);
  const [activeCommentPin, setActiveCommentPin] = useState<WaveformComment | null>(null);
  const [showCommentsList, setShowCommentsList] = useState(false);
  const [jumpFeedback, setJumpFeedback] = useState<{ time: number; ratio: number } | null>(null);

  // Nearest acoustic point to cursor for real decibel & transient readout
  const hoveredPoint = useMemo(() => {
    if (hoverPositionRatio === null || waveformPoints.length === 0) return null;
    const idx = Math.min(
      waveformPoints.length - 1,
      Math.max(0, Math.round(hoverPositionRatio * (waveformPoints.length - 1)))
    );
    return waveformPoints[idx];
  }, [hoverPositionRatio, waveformPoints]);

  // New comment composer state
  const [targetCommentTime, setTargetCommentTime] = useState<number>(0);
  const [commentInput, setCommentInput] = useState('');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  // Real-time live popped comment as song passes its timestamp
  const [realtimePoppedComment, setRealtimePoppedComment] = useState<WaveformComment | null>(null);

  useEffect(() => {
    if (!isThisTrackPlaying) {
      setRealtimePoppedComment(null);
      return;
    }
    // Check if any comment is within 1.2 seconds of current time
    const matched = localComments.find(
      (c) => Math.abs(c.timestampSeconds - currentPlaybackTime) < 1.4
    );
    if (matched && matched.id !== realtimePoppedComment?.id) {
      setRealtimePoppedComment(matched);
      const timer = setTimeout(() => {
        setRealtimePoppedComment((prev) => (prev?.id === matched.id ? null : prev));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [currentPlaybackTime, isThisTrackPlaying, localComments, realtimePoppedComment?.id]);

  // Center horizontal scroll on a target ratio (e.g. playhead or target comment pin)
  const centerScrollOnRatio = (ratio: number) => {
    if (!waveformScrollRef.current || zoomLevel <= 1) return;
    const scrollEl = waveformScrollRef.current;
    const targetX = ratio * scrollEl.scrollWidth;
    const clientWidth = scrollEl.clientWidth;
    scrollEl.scrollTo({
      left: Math.max(0, targetX - clientWidth / 2),
      behavior: 'smooth',
    });
  };

  // Center around target comment time or playhead when zoom level changes
  useEffect(() => {
    if (zoomLevel > 1) {
      const centerRatio = targetCommentTime > 0
        ? targetCommentTime / durationSeconds
        : progressRatio;
      const timer = setTimeout(() => {
        centerScrollOnRatio(centerRatio);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [zoomLevel]);

  // Auto-follow playhead during playback when zoomed
  useEffect(() => {
    if (zoomLevel > 1 && autoFollowPlayhead && isThisTrackPlaying && waveformScrollRef.current) {
      const scrollEl = waveformScrollRef.current;
      const targetX = progressRatio * scrollEl.scrollWidth;
      const clientLeft = scrollEl.scrollLeft;
      const clientWidth = scrollEl.clientWidth;

      // Keep playhead within the visible comfortable window (20% to 80%)
      if (targetX > clientLeft + clientWidth * 0.78 || targetX < clientLeft + clientWidth * 0.15) {
        scrollEl.scrollTo({
          left: Math.max(0, targetX - clientWidth * 0.35),
          behavior: 'smooth',
        });
      }
    }
  }, [currentPlaybackTime, isThisTrackPlaying, zoomLevel, autoFollowPlayhead, progressRatio]);

  // Quick toggle between 1x, 2x, 3.5x
  const handleToggleZoom = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else if (zoomLevel < 3) {
      setZoomLevel(3.5);
    } else {
      setZoomLevel(1);
    }
  };

  const handleWaveformMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const time = Math.round(ratio * durationSeconds);
    setHoverPositionRatio(ratio);
    setHoverTime(time);
  };

  const handleWaveformMouseLeave = () => {
    setHoverTime(null);
    setHoverPositionRatio(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!waveformRef.current || e.touches.length === 0) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const time = Math.round(ratio * durationSeconds);
    setHoverPositionRatio(ratio);
    setHoverTime(time);
  };

  const handleTouchEnd = () => {
    if (hoverPositionRatio !== null) {
      const seekSeconds = Math.round(hoverPositionRatio * durationSeconds);
      musicAudioEngine.seek(seekSeconds, song.id);
      if (!isThisTrackPlaying) {
        musicAudioEngine.playPreset(song.synthPreset || 'ambient_calm', song.id, durationSeconds);
      }
      setTargetCommentTime(seekSeconds);
      setJumpFeedback({ time: seekSeconds, ratio: hoverPositionRatio });
      setTimeout(() => setJumpFeedback(null), 850);
    }
    setHoverTime(null);
    setHoverPositionRatio(null);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const seekSeconds = Math.round(ratio * durationSeconds);

    // Seek audio engine
    musicAudioEngine.seek(seekSeconds, song.id);
    if (!isThisTrackPlaying) {
      musicAudioEngine.playPreset(song.synthPreset || 'ambient_calm', song.id, durationSeconds);
    }

    // Set composer target time to clicked position
    setTargetCommentTime(seekSeconds);

    // Provide visual confirmation of jump
    setJumpFeedback({ time: seekSeconds, ratio });
    setTimeout(() => setJumpFeedback(null), 850);
  };

  const handleSeekToComment = (comment: WaveformComment) => {
    musicAudioEngine.seek(comment.timestampSeconds, song.id);
    if (!isThisTrackPlaying) {
      musicAudioEngine.playPreset(song.synthPreset || 'ambient_calm', song.id, durationSeconds);
    }
    setActiveCommentPin(comment);
    setTimeout(() => setActiveCommentPin(null), 3000);
  };

  const handleOpenComposerAtCurrentTime = () => {
    const timeToPin = isThisTrackPlaying ? Math.round(currentPlaybackTime) : (hoverTime ?? 0);
    setTargetCommentTime(timeToPin);
    setIsComposerOpen(true);
  };

  const handleSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commentInput.trim();
    if (!trimmed && !selectedEmoji) return;

    const fullContent = selectedEmoji ? `${selectedEmoji} ${trimmed}`.trim() : trimmed;

    const newComment: WaveformComment = {
      id: `wf_comm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorHandle: currentUser.handle,
      authorAvatar: currentUser.avatar,
      timestampSeconds: targetCommentTime,
      content: fullContent,
      createdAt: 'Just now',
      color: ts.commentHex,
    };

    const updated = [...localComments, newComment].sort((a, b) => a.timestampSeconds - b.timestampSeconds);
    setLocalComments(updated);
    setCommentInput('');
    setSelectedEmoji(null);
    setIsComposerOpen(false);

    // Call parent handler to persist in posts / user library
    if (onAddComment) {
      onAddComment(song.id, newComment);
    }
  };

  const formatSeconds = (sec: number) => {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const quickReactions = ['🔥 Fire', '✨ Ethereal', '🎧 Clean', '🕯️ Poetry', '⚡ Drop'];

  return (
    <div
      ref={containerRef}
      id="track-waveform-container"
      className={`waveform-container rounded-xl border ${ts.containerBorder} bg-neutral-950/85 p-3 sm:p-4 transition-all duration-200 shadow-md ${className}`}
    >
      {/* Waveform Detail Studio Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-1 text-[11px] border-b border-neutral-800/80 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${ts.accentBadge} font-mono text-[10px]`}>
            <Activity className={`w-3 h-3 ${ts.activityIcon}`} />
            <span className={`font-semibold ${ts.accentText}`}>Accurate Waveform</span>
            <span className="opacity-60">•</span>
            <span className="text-slate-400">
              {song.synthPreset ? song.synthPreset.replace('_', ' ') : 'Acoustic PCM'}
              {song.bpm ? ` (${song.bpm} BPM)` : ''}
            </span>
          </div>

          {song.genre && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] text-slate-400 font-mono">
              {song.genre}
            </span>
          )}
        </div>

        {/* Visualization & Zoom Scale Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Zoom Button to expand horizontal scale */}
          <div className="flex items-center gap-1 bg-neutral-900/90 rounded-md border border-neutral-800 p-0.5">
            <button
              id="waveform-zoom-btn"
              onClick={handleToggleZoom}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                zoomLevel > 1
                  ? ts.zoomActiveBtn
                  : `text-slate-400 ${ts.modeBtnHover} hover:bg-neutral-800`
              }`}
              title="Expand horizontal scale of the waveform for precise comment placement"
            >
              {zoomLevel > 1 ? (
                <ZoomOut className={`w-3 h-3 ${ts.zoomIcon} shrink-0`} />
              ) : (
                <ZoomIn className={`w-3 h-3 ${ts.zoomIcon} shrink-0`} />
              )}
              <span className="font-semibold">Zoom</span>
              {zoomLevel > 1 && (
                <span className={`text-[9px] px-1 py-0.2 rounded ${ts.zoomBadge}`}>
                  {zoomLevel}x
                </span>
              )}
            </button>

            {/* Multi-Level Zoom Selector Pills */}
            <div className="flex items-center gap-0.5 border-l border-neutral-800/80 pl-1">
              {[1, 1.75, 2.5, 4].map((level) => (
                <button
                  key={level}
                  onClick={() => setZoomLevel(level)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                    zoomLevel === level
                      ? `${ts.zoomPillActive} shadow-xs`
                      : 'text-neutral-400 hover:text-slate-200 hover:bg-neutral-800'
                  }`}
                  title={`Scale ${level}x`}
                >
                  {level}x
                </button>
              ))}
            </div>
          </div>

          {/* Visualization Detail Mode Switcher */}
          <button
            onClick={() => setWaveMode(waveMode === 'studio' ? 'transient' : 'studio')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 ${ts.modeBtnHover} bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer`}
            title="Toggle between Studio Mirrored Dual-Axis and Transient Density waveform modes"
          >
            <Layers className={`w-3 h-3 ${ts.activityIcon}`} />
            <span className="hidden sm:inline">{waveMode === 'studio' ? 'Dual-Axis' : 'Transient'}</span>
          </button>
        </div>
      </div>

      {/* Precision Zoom Active Indicator & Helper Toolbar */}
      {zoomLevel > 1 && (
        <div className={`mb-2 px-2.5 py-1 rounded-lg ${ts.precisionBanner} flex items-center justify-between text-[10px] font-mono animate-in fade-in duration-150 flex-wrap gap-1.5`}>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${ts.pingBg} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${ts.pingDot}`}></span>
            </span>
            <span className={`font-semibold ${ts.precisionText}`}>{zoomLevel}x Horizontal Timeline Scale</span>
            <span className="text-neutral-500 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">
              Scroll horizontally or click to pinpoint comments
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => centerScrollOnRatio(progressRatio)}
              className={`flex items-center gap-1 text-[10px] ${ts.centerPlayheadBtn} px-2 py-0.5 rounded transition-colors cursor-pointer`}
              title="Center view on current playback position"
            >
              <LocateFixed className={`w-3 h-3 ${ts.activityIcon}`} />
              <span>Center Playhead</span>
            </button>
            <button
              onClick={() => setAutoFollowPlayhead(!autoFollowPlayhead)}
              className={`px-1.5 py-0.5 rounded text-[9px] transition-colors cursor-pointer border ${
                autoFollowPlayhead
                  ? ts.autoFollowActive
                  : 'bg-neutral-900 border-neutral-800 text-slate-500'
              }`}
              title="Auto-scroll with playhead during playback"
            >
              Auto-Follow: {autoFollowPlayhead ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`text-[10px] text-slate-400 ${ts.modeBtnHover} px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer`}
              title="Reset zoom to standard 1x scale"
            >
              Reset 1x
            </button>
          </div>
        </div>
      )}

      {/* Live Popped Comment Banner (SoundCloud style popup as playhead passes) */}
      {realtimePoppedComment && (
        <div className={`mb-2.5 animate-in fade-in slide-in-from-top-2 duration-300 ${ts.liveBanner} rounded-lg px-3 py-1.5 flex items-center gap-2.5`}>
          <img
            src={realtimePoppedComment.authorAvatar}
            alt={realtimePoppedComment.authorName}
            className={`w-5 h-5 rounded-full object-cover ${ts.liveAvatarRing} ring-1 shrink-0`}
          />
          <div className="min-w-0 flex-1 text-xs">
            <span className={`font-semibold ${ts.liveAuthor} mr-1.5`}>{realtimePoppedComment.authorName}:</span>
            <span className="text-slate-200 italic font-sans">{realtimePoppedComment.content}</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${ts.liveBadge} shrink-0`}>
            {formatSeconds(realtimePoppedComment.timestampSeconds)}
          </span>
          <button
            onClick={() => setRealtimePoppedComment(null)}
            className={`${ts.liveClose} hover:text-white p-0.5 cursor-pointer`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Scrollable Waveform Stage Container */}
      <div
        ref={waveformScrollRef}
        className={`waveform-scroll-area relative select-none rounded-lg transition-all ${
          zoomLevel > 1 ? 'overflow-x-auto pb-2 cursor-crosshair' : 'overflow-visible'
        }`}
      >
        <div
          className="relative pt-10 sm:pt-11 pb-1 transition-[width] duration-150"
          style={{
            width: zoomLevel > 1 ? `${zoomLevel * 100}%` : '100%',
            minWidth: '100%',
          }}
        >
          {/* Waveform Continuous Graphic Container */}
          <div
            ref={waveformRef}
            onMouseMove={handleWaveformMouseMove}
            onMouseLeave={handleWaveformMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleWaveformClick}
            className="relative h-20 sm:h-24 w-full flex items-center justify-between cursor-pointer select-none group py-1"
          >
          {/* Studio Decibel Graticule Reference Lines */}
          <div className="absolute left-0 right-0 top-[18%] h-[1px] border-t border-dashed border-neutral-800/80 pointer-events-none z-0" />
          <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] ${ts.dbCenterLine} pointer-events-none z-1`} />
          <div className="absolute left-0 right-0 top-[82%] h-[1px] border-t border-dashed border-neutral-800/80 pointer-events-none z-0" />

          {/* Micro dB indicators */}
          <span className="absolute left-1 top-[14%] text-[8px] font-mono text-neutral-600 pointer-events-none select-none">+3dB</span>
          <span className={`absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono ${ts.db0dBText} pointer-events-none select-none`}>0dB</span>
          <span className="absolute left-1 top-[80%] text-[8px] font-mono text-neutral-600 pointer-events-none select-none">-3dB</span>

          {/* Continuous Vector Audio Waveform (Accurate to song data, continuous curve instead of bars) */}
          <svg
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
            className="w-full h-full pointer-events-none z-10 overflow-visible"
          >
            <defs>
              {/* Played Waveform Gradient */}
              <linearGradient id={`wf-played-${waveformId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ts.gradientPlayed.stop0} stopOpacity="0.95" />
                <stop offset="25%" stopColor={ts.gradientPlayed.stop25} stopOpacity="0.92" />
                <stop offset="50%" stopColor={ts.gradientPlayed.stop50} stopOpacity="0.88" />
                <stop offset="75%" stopColor={ts.gradientPlayed.stop75} stopOpacity="0.92" />
                <stop offset="100%" stopColor={ts.gradientPlayed.stop100} stopOpacity="0.95" />
              </linearGradient>

              {/* Played RMS Core Glow Gradient */}
              <linearGradient id={`wf-rms-played-${waveformId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ts.gradientRmsPlayed.stop0} stopOpacity="0.9" />
                <stop offset="50%" stopColor={ts.gradientRmsPlayed.stop50} stopOpacity="0.95" />
                <stop offset="100%" stopColor={ts.gradientRmsPlayed.stop100} stopOpacity="0.9" />
              </linearGradient>

              {/* Unplayed Waveform Gradient */}
              <linearGradient id={`wf-unplayed-${waveformId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" stopOpacity="0.55" />
                <stop offset="50%" stopColor="#1e293b" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#475569" stopOpacity="0.55" />
              </linearGradient>

              {/* Unplayed RMS Core Gradient */}
              <linearGradient id={`wf-rms-unplayed-${waveformId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#334155" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.45" />
              </linearGradient>

              {/* Seek Preview Segment Gradient */}
              <linearGradient id={`wf-preview-${waveformId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ts.gradientPreview.stop0} stopOpacity="0.7" />
                <stop offset="50%" stopColor={ts.gradientPreview.stop50} stopOpacity="0.6" />
                <stop offset="100%" stopColor={ts.gradientPreview.stop100} stopOpacity="0.7" />
              </linearGradient>

              {/* Played Clip Path */}
              <clipPath id={`clip-played-${waveformId}`}>
                <rect x="0" y="0" width={progressRatio * 1000} height="100" />
              </clipPath>

              {/* Unplayed Clip Path */}
              <clipPath id={`clip-unplayed-${waveformId}`}>
                <rect x={progressRatio * 1000} y="0" width={Math.max(0, (1 - progressRatio) * 1000)} height="100" />
              </clipPath>

              {/* Hover Seek Preview Clip Path */}
              {hoverPositionRatio !== null && (
                <clipPath id={`clip-preview-${waveformId}`}>
                  <rect
                    x={Math.min(progressRatio, hoverPositionRatio) * 1000}
                    y="0"
                    width={Math.abs(hoverPositionRatio - progressRatio) * 1000}
                    height="100"
                  />
                </clipPath>
              )}
            </defs>

            {/* UNPLAYED WAVEFORM LAYER */}
            <g clipPath={`url(#clip-unplayed-${waveformId})`}>
              {/* Outer Acoustic Peak Contour Fill */}
              <path
                d={svgPaths.outerPath}
                fill={`url(#wf-unplayed-${waveformId})`}
                stroke="rgba(148, 163, 184, 0.5)"
                strokeWidth="1"
                className="transition-all duration-75"
              />
              {/* Inner RMS Loudness Body */}
              {waveMode === 'studio' && (
                <path
                  d={svgPaths.rmsPath}
                  fill={`url(#wf-rms-unplayed-${waveformId})`}
                  className="transition-all duration-75"
                />
              )}
            </g>

            {/* SEEK PREVIEW HIGHLIGHT LAYER (Soft translucent preview between playhead and cursor) */}
            {hoverPositionRatio !== null && (
              <g clipPath={`url(#clip-preview-${waveformId})`}>
                <path
                  d={svgPaths.outerPath}
                  fill={`url(#wf-preview-${waveformId})`}
                  stroke={ts.previewStroke}
                  strokeWidth="1.2"
                  strokeDasharray="4 2"
                  className="animate-seek-preview-soft"
                />
                {waveMode === 'studio' && (
                  <path
                    d={svgPaths.rmsPath}
                    fill="rgba(255, 255, 255, 0.25)"
                  />
                )}
              </g>
            )}

            {/* PLAYED WAVEFORM LAYER */}
            <g clipPath={`url(#clip-played-${waveformId})`}>
              {/* Outer Vibrant Peak Contour Fill */}
              <path
                d={svgPaths.outerPath}
                fill={`url(#wf-played-${waveformId})`}
                stroke={ts.playedStroke}
                strokeWidth="1.2"
                style={{ filter: `drop-shadow(0 0 6px ${ts.playedDropShadow})` }}
                className="transition-all duration-75"
              />
              {/* Inner Luminous RMS Loudness Core */}
              {waveMode === 'studio' && (
                <path
                  d={svgPaths.rmsPath}
                  fill={`url(#wf-rms-played-${waveformId})`}
                  className="transition-all duration-75 filter drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]"
                />
              )}
            </g>

            {/* Center Zero-Crossing Baseline Axis */}
            <line
              x1="0"
              y1={svgPaths.zeroAxisY}
              x2="1000"
              y2={svgPaths.zeroAxisY}
              stroke={ts.zeroAxisStroke}
              strokeWidth="0.8"
            />
          </svg>

          {/* Real-time Playhead Scrubber Needle */}
          <div
            style={{ left: `${progressRatio * 100}%` }}
            className={`absolute top-0 bottom-0 w-0.5 ${ts.playheadNeedle} pointer-events-none transition-all duration-100 z-15`}
          >
            {/* Playhead Diamond Head */}
            <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 ${ts.playheadDiamond} border border-white`} />
          </div>

          {/* Vertical 'Seek-Line' Following the Cursor with Subtle 'Seek-Preview' Animation */}
          {hoverPositionRatio !== null && (
            <div
              style={{ left: `${hoverPositionRatio * 100}%` }}
              className="absolute top-0 bottom-0 pointer-events-none z-50 transition-transform duration-75"
            >
              {/* Subtle Animated Glowing Vertical Seek-Line */}
              <div className={`absolute top-0 bottom-0 -left-[1px] w-[2px] ${ts.seekLine} animate-seek-line`} />

              {/* Top Seek-Line Beacon Node */}
              <div className={`absolute -top-1.5 left-0 -translate-x-1/2 w-3 h-3 rounded-full ${ts.seekBeaconTop} border-2 border-white flex items-center justify-center animate-seek-line`}>
                <div className={`w-1 h-1 rounded-full ${ts.seekBeaconDot}`} />
              </div>

              {/* Bottom Seek-Line Beacon Arrowhead */}
              <div className={`absolute -bottom-1 left-0 -translate-x-1/2 w-2 h-2 rotate-45 ${ts.seekBeaconBottom} border border-white`} />

              {/* Temporary Timestamp Marker Badge (smartly clamped so it remains visible within waveform bounds) */}
              {(() => {
                const deltaSec = hoverTime !== null ? hoverTime - Math.round(currentPlaybackTime) : 0;
                const isForward = deltaSec > 0;
                const isRewind = deltaSec < 0;
                const deltaText = deltaSec === 0 ? 'Current' : isForward ? `+${deltaSec}s` : `${deltaSec}s`;

                return (
                  <div
                    className={`absolute -top-8 whitespace-nowrap z-50 pointer-events-none transition-all ${
                      hoverPositionRatio < 0.14
                        ? 'left-0 translate-x-0'
                        : hoverPositionRatio > 0.86
                        ? 'right-0 translate-x-0'
                        : 'left-1/2 -translate-x-1/2'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md border text-[11px] font-mono animate-in fade-in zoom-in-95 duration-100 ${
                        isForward
                          ? ts.hoverBadgeForward
                          : isRewind
                          ? ts.hoverBadgeRewind
                          : ts.hoverBadgeNormal
                      }`}
                    >
                      <span className="flex items-center gap-1 font-bold">
                        {isForward ? (
                          <FastForward className={`w-3 h-3 ${ts.hoverBadgeForwardIcon}`} />
                        ) : isRewind ? (
                          <Rewind className={`w-3 h-3 ${ts.hoverBadgeRewindIcon}`} />
                        ) : (
                          <Zap className={`w-3 h-3 ${ts.hoverBadgeNormalIcon}`} />
                        )}
                        <span>Jump to {formatSeconds(hoverTime ?? 0)}</span>
                      </span>

                      {hoveredPoint && (
                        <span className={`text-[10px] ${ts.accentText} font-mono`}>
                          {hoveredPoint.decibels}dB
                        </span>
                      )}

                      {hoveredPoint?.isTransient && (
                        <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${ts.zoomBadge}`}>
                          Beat
                        </span>
                      )}

                      {deltaSec !== 0 && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            isForward
                              ? ts.zoomBadge
                              : ts.zoomBadge
                          }`}
                        >
                          {deltaText}
                        </span>
                      )}
                    </div>

                    {/* Downward indicator caret pointing directly at the laser guideline */}
                    <div
                      className={`w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] ${
                        isForward ? ts.hoverBadgeCaretForward : isRewind ? ts.hoverBadgeCaretRewind : ts.hoverBadgeCaretNormal
                      } ${
                        hoverPositionRatio < 0.14
                          ? 'ml-3'
                          : hoverPositionRatio > 0.86
                          ? 'ml-auto mr-3'
                          : 'mx-auto'
                      } -mt-[1px]`}
                    />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Interactive Timed Comment Markers directly on the Waveform */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {localComments.map((comment) => {
              const pinPercent = Math.min(99, Math.max(1, (comment.timestampSeconds / durationSeconds) * 100));
              const isNearPlayhead = Math.abs(comment.timestampSeconds - currentPlaybackTime) < 1.5 && isThisTrackPlaying;
              const isHovered = activeCommentPin?.id === comment.id;

              return (
                <div
                  key={comment.id}
                  id={`waveform-marker-${comment.id}`}
                  style={{ left: `${pinPercent}%` }}
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setActiveCommentPin(comment);
                    setHoverPositionRatio(null);
                  }}
                  onMouseMove={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseLeave={() => {
                    setActiveCommentPin((prev) => (prev?.id === comment.id ? null : prev));
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSeekToComment(comment);
                  }}
                  className={`absolute top-0 bottom-0 -translate-x-1/2 w-7 flex flex-col items-center justify-end pointer-events-auto cursor-pointer group/marker ${
                    isHovered ? 'z-50' : 'z-30'
                  }`}
                  aria-label={`Comment by ${comment.authorName} at ${formatSeconds(comment.timestampSeconds)}`}
                >
                  {/* Full-Height Vertical Guideline spanning the Waveform */}
                  <div
                    className={`absolute top-0 bottom-5 w-[1.5px] -translate-x-1/2 left-1/2 transition-all duration-150 pointer-events-none ${
                      isHovered
                        ? `${ts.markerGuidelineHover} w-[2px]`
                        : isNearPlayhead
                        ? ts.markerGuidelinePlayhead
                        : ts.markerGuidelineNormal
                    }`}
                  />

                  {/* Top Axis Beacon Dot */}
                  <div
                    className={`absolute top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 transition-all duration-150 pointer-events-none ${
                      isHovered || isNearPlayhead
                        ? `${ts.markerDotHover} scale-125`
                        : ts.markerDotNormal
                    }`}
                  />

                  {/* Interactive Marker Node on Waveform (Micro Upward Caret + Circular Avatar) */}
                  <div
                    className={`relative mb-0.5 flex flex-col items-center transition-all duration-200 ${
                      isHovered
                        ? 'scale-125'
                        : isNearPlayhead
                        ? 'scale-110'
                        : 'group-hover/marker:scale-115'
                    }`}
                  >
                    {/* Micro Caret Arrow pointing up into audio peaks */}
                    <div
                      className={`w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[4px] -mb-[1px] transition-colors ${
                        isHovered || isNearPlayhead
                          ? ts.markerCaretHover
                          : ts.markerCaretNormal
                      }`}
                    />

                    {/* Circular Avatar / Marker Badge */}
                    <div
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full overflow-hidden border-2 bg-neutral-950 transition-all duration-200 shadow-md flex items-center justify-center ${
                        isHovered
                          ? ts.markerAvatarHover
                          : isNearPlayhead
                          ? ts.markerAvatarPlayhead
                          : ts.markerAvatarNormal
                      }`}
                      title={`${comment.authorName} (${formatSeconds(comment.timestampSeconds)}): "${comment.content}"`}
                    >
                      <img
                        src={comment.authorAvatar}
                        alt={comment.authorName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Floating Comment Preview Tooltip on Hover */}
                  {isHovered && (
                    <div
                      role="tooltip"
                      className={`absolute bottom-full mb-2 w-60 sm:w-64 bg-neutral-950/95 border ${ts.tooltipBorder} rounded-xl p-3 shadow-2xl z-50 text-left pointer-events-auto backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
                        pinPercent < 18
                          ? 'left-0 translate-x-0'
                          : pinPercent > 82
                          ? 'right-0 translate-x-0'
                          : 'left-1/2 -translate-x-1/2'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Header: Author Avatar, Name, Handle, Timestamp Badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.authorName}
                            className={`w-5 h-5 rounded-full object-cover ring-1 ${ts.tooltipRing} shrink-0`}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-100 truncate leading-tight">
                              {comment.authorName}
                            </div>
                            <div className={`text-[9px] ${ts.tooltipHandle} font-mono truncate leading-tight`}>
                              {comment.authorHandle}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${ts.tooltipTimeBadge} flex items-center gap-1 shadow-sm`}>
                            <Clock className={`w-2.5 h-2.5 ${ts.tooltipClockIcon}`} />
                            {formatSeconds(comment.timestampSeconds)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCommentPin(null);
                            }}
                            className="p-0.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Close preview"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Comment Body Preview */}
                      <p className="text-xs text-slate-200 font-sans leading-relaxed break-words bg-neutral-900/80 rounded-lg p-2 border border-neutral-800/80 text-left">
                        "{comment.content}"
                      </p>

                      {/* Card Footer with Quick Jump Action & Relative Time */}
                      <div className="mt-2 pt-1.5 border-t border-neutral-800/90 flex items-center justify-between text-[10px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeekToComment(comment);
                          }}
                          className={`font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${ts.tooltipJumpBtn} px-2 py-1 rounded-md shadow-sm active:scale-95`}
                        >
                          <Play className={`w-2.5 h-2.5 fill-current ${ts.tooltipPlayIcon}`} />
                          <span>Jump to {formatSeconds(comment.timestampSeconds)}</span>
                        </button>

                        <span className="text-[9px] text-slate-400">{comment.createdAt}</span>
                      </div>

                      {/* Downward Caret Arrow pointing directly at the waveform marker */}
                      <div
                        className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] ${ts.tooltipCaret} absolute -bottom-[6px] ${
                          pinPercent < 18
                            ? 'left-4'
                            : pinPercent > 82
                            ? 'right-4'
                            : 'left-1/2 -translate-x-1/2'
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Instantaneous Click Confirmation Feedback */}
          {jumpFeedback && (
            <div
              style={{ left: `${jumpFeedback.ratio * 100}%` }}
              className="absolute top-0 bottom-0 pointer-events-none z-50 flex items-center justify-center -translate-x-1/2"
            >
              <div className={`w-6 h-6 rounded-full border-2 ${ts.jumpFeedbackRing} ${ts.jumpFeedbackDot} animate-ping absolute`} />
              <div className={`absolute top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full ${ts.jumpFeedbackBadge} whitespace-nowrap backdrop-blur-sm animate-in fade-in zoom-in-95 duration-150`}>
                ✓ Jumped to {formatSeconds(jumpFeedback.time)}
              </div>
            </div>
          )}
        </div>

        {/* Time Axis Ruler & Ticks across the bottom of the waveform */}
        <div className="relative w-full flex items-center justify-between pt-1.5 px-0.5 text-[9px] font-mono text-neutral-500 select-none border-t border-neutral-800/60">
          <div className="flex items-center gap-1 text-slate-400">
            <span className={`w-1 h-1 rounded-full ${ts.rulerDotStart}`} />
            <span>0:00</span>
          </div>
          {zoomLevel > 1.5 && (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>{formatSeconds(durationSeconds * 0.125)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-neutral-500">
            <span>{formatSeconds(durationSeconds * 0.25)}</span>
          </div>
          {zoomLevel > 1.5 && (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>{formatSeconds(durationSeconds * 0.375)}</span>
            </div>
          )}
          <div className={`flex items-center gap-1 font-semibold ${ts.rulerCenterDiamond}`}>
            <span className={`w-1.5 h-1.5 rotate-45 border ${ts.rulerCenterBorder} ${ts.rulerCenterBg}`} />
            <span>{formatSeconds(durationSeconds * 0.5)}</span>
          </div>
          {zoomLevel > 1.5 && (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>{formatSeconds(durationSeconds * 0.625)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-neutral-500">
            <span>{formatSeconds(durationSeconds * 0.75)}</span>
          </div>
          {zoomLevel > 1.5 && (
            <div className="flex items-center gap-1 text-neutral-500">
              <span>{formatSeconds(durationSeconds * 0.875)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-slate-400">
            <span>{formatSeconds(durationSeconds)}</span>
            <span className={`w-1 h-1 rounded-full ${ts.rulerDotEnd}`} />
          </div>
        </div>
      </div>
    </div>

      {/* Playback Stats & Action Controls */}
      <div className="mt-2 flex items-center justify-between text-xs flex-wrap gap-2 pt-1 border-t border-neutral-800/80">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isThisTrackPlaying
                  ? ts.playBtnActive
                  : ts.playBtnInactive
              }`}
            >
              {isThisTrackPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isThisTrackPlaying ? 'Pause' : 'Play'}</span>
            </button>
          )}

          {/* Time Display */}
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
            <span className={isThisTrackPlaying ? ts.timePlayingHighlight : 'text-slate-300'}>
              {formatSeconds(currentPlaybackTime)}
            </span>
            <span className="text-slate-600">/</span>
            <span>{formatSeconds(durationSeconds)}</span>
          </div>

          {isThisTrackPlaying && (
            <span className={`hidden sm:flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${ts.playingBadge} animate-pulse`}>
              <Radio className={`w-3 h-3 ${ts.playingRadioIcon}`} />
              <span>Playing</span>
            </span>
          )}
        </div>

        {/* Comment on Waveform Action & Comments Drawer Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isComposerOpen) {
                handleOpenComposerAtCurrentTime();
              } else {
                setIsComposerOpen(false);
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isComposerOpen
                ? ts.commentBtnOpen
                : ts.commentBtnClosed
            }`}
            title="Drop a comment pinned to the current song timestamp"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${ts.commentBtnIcon}`} />
            <span>
              {isComposerOpen ? 'Close Composer' : `Comment at ${formatSeconds(currentPlaybackTime || targetCommentTime)}`}
            </span>
          </button>

          {localComments.length > 0 && (
            <button
              onClick={() => setShowCommentsList(!showCommentsList)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
            >
              <span>{localComments.length} {localComments.length === 1 ? 'Comment' : 'Comments'}</span>
              {showCommentsList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Inline Waveform Comment Composer */}
      {isComposerOpen && (
        <form
          onSubmit={handleSubmitComment}
          className={`mt-3 p-3 rounded-xl bg-neutral-900/90 border ${ts.composerBorder} animate-in fade-in slide-in-from-top-2 duration-200`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className={`w-5 h-5 rounded-full object-cover ring-1 ${ts.composerRing}`}
              />
              <span className="text-xs font-semibold text-slate-200">
                Drop comment pinned at:
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${ts.composerBadge}`}>
                📍 {formatSeconds(targetCommentTime)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Snap to current playhead button */}
              {isThisTrackPlaying && (
                <button
                  type="button"
                  onClick={() => setTargetCommentTime(Math.round(currentPlaybackTime))}
                  className={`text-[10px] font-mono ${ts.composerSnapText} flex items-center gap-1 cursor-pointer`}
                >
                  <Clock className="w-3 h-3" />
                  <span>Snap to Now ({formatSeconds(currentPlaybackTime)})</span>
                </button>
              )}

              {/* Precision Zoom action inside comment composer */}
              {zoomLevel === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setZoomLevel(2.5);
                    setTimeout(() => centerScrollOnRatio(targetCommentTime / durationSeconds), 60);
                  }}
                  className={`text-[10px] font-mono ${ts.composerZoomBtn} px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors`}
                  title="Expand horizontal scale to position this comment with higher precision"
                >
                  <ZoomIn className={`w-3 h-3 ${ts.composerZoomIcon}`} />
                  <span>Precision Zoom</span>
                </button>
              ) : (
                <span className={`text-[10px] font-mono ${ts.composerZoomActive} px-1.5 py-0.5 rounded border`}>
                  🔍 {zoomLevel}x Zoom
                </span>
              )}
            </div>
          </div>

          {/* Quick Reaction Pills */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
            {quickReactions.map((emojiTag) => (
              <button
                key={emojiTag}
                type="button"
                onClick={() => {
                  setSelectedEmoji(selectedEmoji === emojiTag ? null : emojiTag);
                  if (!commentInput) {
                    setCommentInput(emojiTag);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedEmoji === emojiTag
                    ? ts.quickReactionActive
                    : 'bg-black/40 text-slate-300 hover:text-white border border-neutral-700'
                }`}
              >
                {emojiTag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`Share your thought at ${formatSeconds(targetCommentTime)}... (e.g. "That bassline is unreal")`}
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs bg-black/60 border ${ts.composerBorder} text-slate-100 placeholder-slate-500 focus:outline-none ${ts.inputFocus}`}
              autoFocus
            />
            <button
              type="submit"
              disabled={!commentInput.trim() && !selectedEmoji}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${ts.submitPostBtn} text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1 shadow-md`}
            >
              <Send className="w-3 h-3" />
              <span>Post</span>
            </button>
          </div>
        </form>
      )}

      {/* Expandable Timed Comments Drawer */}
      {showCommentsList && localComments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2 max-h-56 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
            <span>Waveform Comments ({localComments.length})</span>
            <span className={`text-[10px] ${ts.commentsCountText}`}>Click time to jump & play</span>
          </div>
          {localComments
            .slice()
            .sort((a, b) => a.timestampSeconds - b.timestampSeconds)
            .map((comment) => {
              const isPinned = activeCommentPin?.id === comment.id;
              return (
                <div
                  key={comment.id}
                  onClick={() => handleSeekToComment(comment)}
                  onMouseEnter={() => setActiveCommentPin(comment)}
                  onMouseLeave={() => setActiveCommentPin((prev) => (prev?.id === comment.id ? null : prev))}
                  className={`group p-2 rounded-lg border transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                    isPinned
                      ? ts.commentItemPinned
                      : ts.commentItemNormal
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className={`w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 transition-all ${
                        isPinned ? ts.commentAvatarRingPinned : ts.commentAvatarRingNormal
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-200">{comment.authorName}</span>
                        <span className={`text-[10px] ${ts.commentHandle} font-mono`}>{comment.authorHandle}</span>
                        <span className="text-[10px] text-slate-500">• {comment.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeekToComment(comment);
                    }}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all shadow-sm cursor-pointer ${
                      isPinned
                        ? ts.commentPlayBtnPinned
                        : ts.commentPlayBtnNormal
                    }`}
                    title="Jump to this comment in the track"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>{formatSeconds(comment.timestampSeconds)}</span>
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};
