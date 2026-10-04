import React from 'react';
import {
  Feather,
  BookOpen,
  Sparkles,
  Sun,
  ShieldCheck,
  Compass,
  Key,
  MapPin,
  Award,
  Globe,
  Infinity as InfinityIcon,
  Lock,
  Crown,
  Zap,
} from 'lucide-react';
import { MilestoneBadge } from '../types';

interface BadgeVisualIconProps {
  badge: MilestoneBadge;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLockedOverlay?: boolean;
  className?: string;
  animate?: boolean;
}

export const BadgeVisualIcon: React.FC<BadgeVisualIconProps> = ({
  badge,
  size = 'md',
  showLockedOverlay = true,
  className = '',
  animate = true,
}) => {
  const isUnlocked = badge.isUnlocked;

  // Sizing definitions
  const dimensions = {
    sm: { box: 36, icon: 16, border: 1.5, text: 'text-[9px]' },
    md: { box: 54, icon: 24, border: 2, text: 'text-[11px]' },
    lg: { box: 76, icon: 32, border: 2.5, text: 'text-sm' },
    xl: { box: 104, icon: 44, border: 3, text: 'text-lg' },
  }[size];

  // Rarity color configurations
  const rarityConfig = {
    common: {
      border: 'border-cyan-500/40',
      ring: 'ring-cyan-500/30',
      shadow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]',
      gradient: 'from-cyan-950 via-slate-900 to-cyan-900',
      accentText: 'text-cyan-300',
    },
    rare: {
      border: 'border-emerald-500/50',
      ring: 'ring-emerald-500/30',
      shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.35)]',
      gradient: 'from-emerald-950 via-teal-950 to-neutral-900',
      accentText: 'text-emerald-300',
    },
    epic: {
      border: 'border-fuchsia-500/60',
      ring: 'ring-pink-500/40',
      shadow: 'shadow-[0_0_20px_rgba(217,70,239,0.45)]',
      gradient: 'from-pink-950 via-purple-950 to-fuchsia-950',
      accentText: 'text-fuchsia-300',
    },
    legendary: {
      border: 'border-amber-400/80',
      ring: 'ring-amber-400/50',
      shadow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      gradient: 'from-amber-950 via-yellow-950 to-amber-900',
      accentText: 'text-amber-300',
    },
    mythic: {
      border: 'border-rose-400/80',
      ring: 'ring-fuchsia-500/50',
      shadow: 'shadow-[0_0_30px_rgba(244,63,94,0.55)]',
      gradient: 'from-rose-950 via-purple-950 to-amber-950',
      accentText: 'text-rose-300',
    },
  }[badge.rarity];

  // Helper to render the core Lucide icon
  const renderIcon = () => {
    const iconProps = {
      size: dimensions.icon,
      className: `transition-transform duration-300 ${
        isUnlocked ? 'drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]' : 'text-slate-600'
      }`,
    };

    switch (badge.iconName) {
      case 'Feather':
        return <Feather {...iconProps} className={`${iconProps.className} text-amber-300`} />;
      case 'BookOpen':
        return <BookOpen {...iconProps} className={`${iconProps.className} text-pink-300`} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} className={`${iconProps.className} text-cyan-300`} />;
      case 'Sun':
        return <Sun {...iconProps} className={`${iconProps.className} text-amber-400`} />;
      case 'ShieldCheck':
        return <ShieldCheck {...iconProps} className={`${iconProps.className} text-emerald-300`} />;
      case 'Compass':
        return <Compass {...iconProps} className={`${iconProps.className} text-purple-300`} />;
      case 'Key':
        return <Key {...iconProps} className={`${iconProps.className} text-cyan-400`} />;
      case 'MapPin':
        return <MapPin {...iconProps} className={`${iconProps.className} text-rose-300`} />;
      case 'Award':
        return <Award {...iconProps} className={`${iconProps.className} text-emerald-300`} />;
      case 'Globe':
        return <Globe {...iconProps} className={`${iconProps.className} text-fuchsia-300`} />;
      case 'Infinity':
        return <InfinityIcon {...iconProps} className={`${iconProps.className} text-amber-300`} />;
      case 'Crown':
        return <Crown {...iconProps} className={`${iconProps.className} text-amber-300`} />;
      case 'Zap':
        return <Zap {...iconProps} className={`${iconProps.className} text-yellow-300`} />;
      default:
        return <Award {...iconProps} className={`${iconProps.className} text-pink-300`} />;
    }
  };

  // Circular progress for locked state or subtle halo for unlocked
  const circleRadius = dimensions.box / 2 - 4;
  const circumference = 2 * Math.PI * circleRadius;
  const progressPercent = Math.min(100, Math.max(0, badge.progressPercent || 0));
  const strokeOffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: dimensions.box, height: dimensions.box }}
    >
      {/* Dynamic Background Aura for Unlocked Badges */}
      {isUnlocked && (
        <div
          className={`absolute inset-0 rounded-2xl blur-md opacity-70 pointer-events-none transition-opacity duration-300 ${
            animate ? 'animate-pulse' : ''
          }`}
          style={{
            background: `radial-gradient(circle, ${badge.glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* SVG Progress Ring (Active or Locked tracking) */}
      <svg
        width={dimensions.box}
        height={dimensions.box}
        className="absolute inset-0 pointer-events-none -rotate-90"
      >
        <circle
          cx={dimensions.box / 2}
          cy={dimensions.box / 2}
          r={circleRadius}
          fill="none"
          stroke={isUnlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)'}
          strokeWidth={dimensions.border}
        />
        <circle
          cx={dimensions.box / 2}
          cy={dimensions.box / 2}
          r={circleRadius}
          fill="none"
          stroke={isUnlocked ? badge.gradientFrom : 'rgba(236, 72, 153, 0.35)'}
          strokeWidth={dimensions.border}
          strokeDasharray={circumference}
          strokeDashoffset={isUnlocked ? 0 : strokeOffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: isUnlocked ? `drop-shadow(0 0 3px ${badge.glowColor})` : undefined,
          }}
        />
      </svg>

      {/* Inner Badge Container */}
      <div
        className={`relative rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isUnlocked
            ? `bg-gradient-to-br ${rarityConfig.gradient} border ${rarityConfig.border} ${rarityConfig.shadow} ring-1 ${rarityConfig.ring}`
            : 'bg-neutral-950/90 border border-neutral-800/80 shadow-inner'
        }`}
        style={{
          width: dimensions.box - 10,
          height: dimensions.box - 10,
        }}
      >
        {/* Shimmer Light Flare for Unlocked */}
        {isUnlocked && (
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-white/20 rounded-full blur-sm pointer-events-none transform rotate-45" />
        )}

        {/* Special SVG Embellishments per category */}
        {isUnlocked && badge.category === 'streams' && (
          <div className="absolute inset-0 border border-amber-400/20 rounded-lg pointer-events-none scale-90" />
        )}
        {isUnlocked && badge.category === 'milestones' && (
          <div className="absolute inset-0 border border-fuchsia-400/20 rounded-lg pointer-events-none scale-90 rotate-45" />
        )}

        {/* Center Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {renderIcon()}
        </div>

        {/* Locked Padlock Overlay */}
        {!isUnlocked && showLockedOverlay && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] flex items-center justify-center z-20">
            <Lock className="w-3.5 h-3.5 text-neutral-400/90 drop-shadow-sm" />
          </div>
        )}

        {/* Special symbol pip at top-right or bottom-right for large sizes */}
        {(size === 'lg' || size === 'xl') && (
          <span className="absolute bottom-1 right-1 text-xs select-none opacity-80 filter drop-shadow">
            {badge.badgeSymbol}
          </span>
        )}
      </div>

      {/* Rarity Star / Indicator Pip */}
      {isUnlocked && (
        <div
          className="absolute -top-1 -right-1 z-30 flex items-center justify-center rounded-full bg-neutral-950 border shadow-[0_0_8px_rgba(0,0,0,0.8)]"
          style={{
            borderColor: badge.gradientFrom,
            width: size === 'sm' ? 14 : 18,
            height: size === 'sm' ? 14 : 18,
            fontSize: size === 'sm' ? '8px' : '10px',
          }}
          title={`${badge.rarity.toUpperCase()} Badge`}
        >
          <span className="leading-none">{badge.badgeSymbol}</span>
        </div>
      )}
    </div>
  );
};
