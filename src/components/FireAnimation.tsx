import React, { useMemo } from 'react';
import { motion, type Variants } from 'motion/react';
import { Flame, Sparkles, Zap, Rocket, Layers, Activity } from 'lucide-react';
import { PostFirePowerUps } from '../types';

interface FirePostAuraProps {
  firePowerUps?: PostFirePowerUps;
  isHovered?: boolean;
}

/**
 * Rising glowing particles / embers for cards with active power-ups (fire animation removed)
 */
export const FirePostAura: React.FC<FirePostAuraProps> = ({
  firePowerUps,
  isHovered = false,
}) => {
  if (!firePowerUps) return null;

  const isBoost = Boolean(firePowerUps.boost?.active);
  const isGlow = Boolean(firePowerUps.glow?.active);
  const isMultiplier = Boolean(
    firePowerUps.multiplier?.active && firePowerUps.multiplier.cyclesRemaining > 0
  );
  const isViral = Boolean(
    firePowerUps.viral?.active && !firePowerUps.viral.fadedAway
  );

  const hasActiveFire = isBoost || isGlow || isMultiplier || isViral;
  if (!hasActiveFire) return null;

  // Statically generate or memoize realistic glowing particle sparks
  const embers = useMemo(() => {
    const list = [];
    const count = isGlow ? 18 : isHovered ? 15 : 12;
    for (let i = 0; i < count; i++) {
      const leftPercent = 4 + (i * 92) / count + ((i * 17) % 7) - 3;
      const size = 2 + (i % 3) * 1.5;
      const height = -(70 + (i % 5) * 25);
      const drift = ((i % 4) - 1.5) * 20;
      const duration = 2.0 + (i % 4) * 0.45;
      const delay = (i * 0.2) % 2.5;

      let color = '#fbbf24';
      if (isViral) {
        color = i % 3 === 0 ? '#bef264' : i % 3 === 1 ? '#a3e635' : '#84cc16';
      } else if (isMultiplier) {
        color = i % 3 === 0 ? '#c084fc' : i % 3 === 1 ? '#e879f9' : '#fbbf24';
      } else if (isBoost) {
        color = i % 3 === 0 ? '#fde047' : i % 3 === 1 ? '#fbbf24' : '#38bdf8';
      } else {
        color =
          i % 4 === 0
            ? '#fef08a' // Yellow core
            : i % 4 === 1
            ? '#fbbf24' // Warm gold
            : i % 4 === 2
            ? '#fb923c' // Warm orange
            : '#f59e0b'; // Amber
      }

      list.push({
        id: i,
        leftPercent,
        size,
        height,
        drift,
        duration,
        delay,
        color,
      });
    }
    return list;
  }, [isGlow, isHovered, isViral, isMultiplier, isBoost]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10">
      {/* 1. Subtle Ambient Particle Aura Glow */}
      <div
        className={`absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t transition-opacity duration-300 pointer-events-none ${
          isGlow
            ? 'from-amber-500/15 to-transparent opacity-80'
            : isBoost
            ? 'from-amber-400/12 to-transparent opacity-70'
            : isMultiplier
            ? 'from-purple-500/15 to-transparent opacity-70'
            : isViral
            ? 'from-lime-500/20 to-transparent opacity-85'
            : 'from-amber-500/10 to-transparent opacity-60'
        }`}
      />

      {/* 2. Rising Glowing Spark / Ember Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {embers.map((ember) => (
          <span
            key={ember.id}
            style={
              {
                left: `${ember.leftPercent}%`,
                bottom: '8px',
                width: `${ember.size}px`,
                height: `${ember.size}px`,
                backgroundColor: ember.color,
                boxShadow: `0 0 8px ${ember.color}, 0 0 14px ${ember.color}`,
                borderRadius: '50%',
                '--ember-height': `${ember.height}px`,
                '--ember-drift': `${ember.drift}px`,
                '--ember-duration': `${ember.duration}s`,
                animationDelay: `${ember.delay}s`,
              } as React.CSSProperties
            }
            className="absolute animate-ember"
          />
        ))}
      </div>
    </div>
  );
};

interface FireIgnitionBurstProps {
  powerUpType: 'boost' | 'glow' | 'multiplier' | 'viral';
  title?: string;
  badge?: string;
  onAnimationEnd?: () => void;
}

// Motion-framer variants for tactile ignition burst
const ignitionContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.15 },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    filter: 'blur(8px)',
    transition: { duration: 0.28, ease: 'easeIn' },
  },
};

const celebrationBadgeVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.65,
    y: 18,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    scale: [0.65, 1.08, 0.98, 1],
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 460,
      damping: 22,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.85,
    y: -14,
    filter: 'blur(6px)',
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const ignitionShockwaveVariants: Variants = {
  initial: { scale: 0.45, opacity: 0.9 },
  animate: {
    scale: 1.5,
    opacity: 0,
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

/**
 * Explosive Fire Blast Animation triggered when applying a power-up
 */
export const FireIgnitionBurst: React.FC<FireIgnitionBurstProps> = ({
  powerUpType,
  title,
  badge,
}) => {
  // Generate 24 radial burst embers
  const sparks = useMemo(() => {
    const list = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count + (Math.random() * 0.2 - 0.1);
      const dist = 70 + Math.random() * 85;
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist - 25; // Slight upward bias
      const size = 3 + Math.random() * 4;
      const duration = 0.65 + Math.random() * 0.35;
      const color =
        i % 4 === 0
          ? '#fef08a' // Core light
          : i % 4 === 1
          ? '#fbbf24' // Gold
          : i % 4 === 2
          ? '#f97316' // Orange
          : '#ef4444'; // Red flare

      list.push({ id: i, x, y, size, duration, color });
    }
    return list;
  }, []);

  const icon =
    powerUpType === 'boost' ? (
      <Rocket className="w-4 h-4 text-amber-300" />
    ) : powerUpType === 'glow' ? (
      <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
    ) : powerUpType === 'multiplier' ? (
      <Layers className="w-4 h-4 text-purple-300" />
    ) : (
      <Activity className="w-4 h-4 text-rose-300" />
    );

  const displayTitle =
    title ||
    (powerUpType === 'boost'
      ? 'Feed Priority Boost Activated!'
      : powerUpType === 'glow'
      ? 'Radiant Aura Activated!'
      : powerUpType === 'multiplier'
      ? 'Feed Lifespan Multiplied!'
      : 'Viral Contagion Unleashed!');

  return (
    <motion.div
      variants={ignitionContainerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 overflow-visible"
    >
      {/* Expanding Soft Shockwave Ring */}
      <motion.div
        variants={ignitionShockwaveVariants}
        initial="initial"
        animate="animate"
        className="absolute w-44 h-44 rounded-full border border-amber-400/70"
      />
      <motion.div
        variants={ignitionShockwaveVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.12 }}
        className="absolute w-32 h-32 rounded-full border border-amber-300/50"
      />

      {/* Exploding Radial Particle Sparks */}
      {sparks.map((spark) => (
        <span
          key={spark.id}
          style={
            {
              width: `${spark.size}px`,
              height: `${spark.size}px`,
              backgroundColor: spark.color,
              boxShadow: `0 0 10px ${spark.color}, 0 0 18px ${spark.color}`,
              borderRadius: '50%',
              '--burst-x': `${spark.x}px`,
              '--burst-y': `${spark.y}px`,
              '--burst-duration': `${spark.duration}s`,
            } as React.CSSProperties
          }
          className="absolute animate-fire-burst-particle"
        />
      ))}

      {/* Floating Celebratory Badge */}
      <motion.div
        variants={celebrationBadgeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-4 py-2 rounded-2xl bg-neutral-950/95 border border-amber-400/80 text-amber-200 text-xs font-bold font-mono shadow-[0_0_25px_rgba(245,158,11,0.5),0_10px_25px_rgba(0,0,0,0.9)] flex items-center gap-2 pointer-events-none z-50"
      >
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/60 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-amber-300 font-extrabold flex items-center gap-1">
            <span>✨ POWER-UP ACTIVATED</span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-200 border border-amber-400/50">
                {badge}
              </span>
            )}
          </span>
          <span className="text-[11px] text-slate-200">{displayTitle}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Animated micro-sparks rising from the Fire Power-Up button when active
 */
export const FireButtonEmbers: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      <span
        style={{
          left: '25%',
          bottom: '2px',
          width: '3px',
          height: '3px',
          backgroundColor: '#fef08a',
          boxShadow: '0 0 6px #f59e0b',
          borderRadius: '50%',
          '--ember-height': '-24px',
          '--ember-drift': '-4px',
          '--ember-duration': '1.3s',
        } as React.CSSProperties}
        className="absolute animate-ember"
      />
      <span
        style={{
          left: '60%',
          bottom: '2px',
          width: '2.5px',
          height: '2.5px',
          backgroundColor: '#fb923c',
          boxShadow: '0 0 6px #ea580c',
          borderRadius: '50%',
          '--ember-height': '-28px',
          '--ember-drift': '5px',
          '--ember-duration': '1.5s',
          animationDelay: '0.4s',
        } as React.CSSProperties}
        className="absolute animate-ember"
      />
      <span
        style={{
          left: '80%',
          bottom: '3px',
          width: '2px',
          height: '2px',
          backgroundColor: '#ef4444',
          boxShadow: '0 0 5px #dc2626',
          borderRadius: '50%',
          '--ember-height': '-22px',
          '--ember-drift': '2px',
          '--ember-duration': '1.1s',
          animationDelay: '0.7s',
        } as React.CSSProperties}
        className="absolute animate-ember"
      />
    </div>
  );
};
