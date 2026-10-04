import React from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Flame, Rocket, Layers, Activity } from 'lucide-react';
import { PostFirePowerUps } from '../types';

interface PostFireBadgesProps {
  firePowerUps?: PostFirePowerUps;
  onOpenFireMenu?: () => void;
  onOpenViralGraph?: () => void;
}

// Motion-framer variants for the badges container and individual badge items
const badgesContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const badgeItemVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.76,
    y: -8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 480,
      damping: 22,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.72,
    y: -6,
    filter: 'blur(4px)',
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  hover: {
    scale: 1.05,
    y: -1.5,
    transition: { type: 'spring', stiffness: 500, damping: 15 },
  },
  tap: {
    scale: 0.94,
    y: 0,
    transition: { type: 'spring', stiffness: 600, damping: 20 },
  },
};

export const PostFireBadges: React.FC<PostFireBadgesProps> = ({
  firePowerUps,
  onOpenFireMenu,
  onOpenViralGraph,
}) => {
  if (!firePowerUps) return null;

  const { boost, multiplier, viral } = firePowerUps;
  const isBoost = Boolean(boost?.active);
  const isMultiplier = Boolean(multiplier?.active && multiplier.cyclesRemaining > 0);
  const isViral = Boolean(viral?.active && !viral.fadedAway && viral.fadeAwayRemainingViews > 0);

  if (!isBoost && !isMultiplier && !isViral) return null;

  return (
    <motion.div
      variants={badgesContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="mb-2.5 flex items-center gap-1.5 flex-wrap text-[11px] font-mono select-none"
    >
      <AnimatePresence mode="popLayout">
        {/* 1. Post Boost Badge */}
        {isBoost && (
          <motion.button
            key="badge-boost"
            layout
            variants={badgeItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onOpenFireMenu}
            className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-950/90 to-orange-950/90 border border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:shadow-[0_0_18px_rgba(245,158,11,0.7)] hover:brightness-110 transition-colors cursor-pointer relative overflow-hidden"
            title={`Post Boost: Ranked top of feed (+${boost?.boostScore || 100} Priority Score)`}
          >
            {/* Subtle tactile shimmer flare */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-amber-300/15 to-transparent pointer-events-none" />
            <div className="flex items-center gap-0.5 text-amber-300">
              <Flame className="w-3 h-3 fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_#f59e0b]" />
              <Rocket className="w-3 h-3 text-amber-300" />
            </div>
            <span className="font-semibold">⚡ Boosted</span>
            <span className="text-[10px] text-amber-400/90 font-bold">+{boost?.boostScore || 100} Priority</span>
          </motion.button>
        )}

        {/* 2. Post Multiplier Badge */}
        {isMultiplier && (
          <motion.button
            key="badge-multiplier"
            layout
            variants={badgeItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            type="button"
            onClick={onOpenFireMenu}
            className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-950/90 to-indigo-950/90 border border-purple-400/80 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.35)] hover:shadow-[0_0_18px_rgba(168,85,247,0.6)] hover:brightness-110 transition-colors cursor-pointer relative overflow-hidden"
            title={`Post Multiplier: Multiplied lifespan across ${multiplier?.multiplierFactor}x feed cycles (${multiplier?.cyclesRemaining} cycles left)`}
          >
            <div className="flex items-center gap-0.5 text-purple-300">
              <Flame className="w-3 h-3 fill-purple-400 text-purple-400 drop-shadow-[0_0_5px_#a855f7]" />
              <Layers className="w-3 h-3 text-purple-300" />
            </div>
            <span className="font-semibold">{multiplier?.multiplierFactor}x Lifespan</span>
            <span className="text-[10px] text-purple-400/80">({multiplier?.cyclesRemaining} cycles left)</span>
          </motion.button>
        )}

        {/* 4. Viral Outbreak Badge */}
        {isViral && (
          <motion.div
            key="badge-viral-container"
            layout
            variants={badgeItemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="inline-flex items-center gap-1"
          >
            <motion.button
              whileHover="hover"
              whileTap="tap"
              variants={badgeItemVariants}
              type="button"
              onClick={onOpenViralGraph || onOpenFireMenu}
              className="group inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-lime-950/95 via-emerald-950/95 to-lime-950/95 border-2 border-lime-400 text-lime-200 shadow-[0_0_18px_rgba(163,230,53,0.6)] hover:shadow-[0_0_24px_rgba(163,230,53,0.85)] hover:brightness-110 transition-colors cursor-pointer relative overflow-hidden"
              title={`Viral Contagion: Spreads to profiles that view it (+25 pts per infection • ${viral?.totalInfections || 0} profiles infected = +${(viral?.totalInfections || 0) * 25} pts • Click to view D3 Spread Graph)`}
            >
              <div className="flex items-center gap-0.5 text-lime-300">
                <Flame className="w-3 h-3 fill-lime-400 text-lime-400 drop-shadow-[0_0_6px_#a3e635]" />
                <Activity className="w-3 h-3 text-lime-300" />
              </div>
              <span className="font-semibold text-lime-200">☣️ Viral Contagion</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-lime-900/80 text-lime-200 border border-lime-400/60 font-bold shadow-[0_0_8px_rgba(163,230,53,0.3)]">
                {viral?.totalInfections || 0} Infected (+{(viral?.totalInfections || 0) * 25} pts)
              </span>
            </motion.button>

            {onOpenViralGraph && (
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onOpenViralGraph}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-lime-950/90 border border-lime-400/80 text-lime-200 text-[10px] font-bold hover:bg-lime-900 hover:border-lime-300 shadow-[0_0_14px_rgba(163,230,53,0.5)] transition-all cursor-pointer"
                title="Open D3 Viral Spread Connection Graph"
              >
                <span>🕸️ Graph</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


