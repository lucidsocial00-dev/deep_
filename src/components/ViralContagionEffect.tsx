import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Network, Eye, Zap, ChevronDown, ChevronUp, Clock, Sparkles, UserCheck, Flame } from 'lucide-react';
import { Post, User, ViralContagionEvent } from '../types';

interface ViralContagionEffectProps {
  isActive: boolean;
  totalInfections?: number;
  infectedNames?: string[];
  isHovered?: boolean;
  onOpenGraph?: () => void;
}

interface BorderParticle {
  id: string;
  side: 'top' | 'bottom' | 'left' | 'right' | 'corner';
  left?: string;
  top?: string;
  right?: string;
  bottom?: string;
  size: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
}

interface EntryBurstParticle {
  id: string;
  left: string;
  top: string;
  burstX: number;
  burstY: number;
  size: number;
  color: string;
  duration: number;
}

export const ViralContagionEffect: React.FC<ViralContagionEffectProps> = ({
  isActive,
  totalInfections = 0,
  infectedNames = [],
  isHovered = false,
  onOpenGraph,
}) => {
  const [showEntryBurst, setShowEntryBurst] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);

  // Trigger subtle contagion entry animation on mount or when viral state turns active
  useEffect(() => {
    if (!isActive) return;

    setShowEntryBurst(true);
    setHasEntered(true);

    const timer = setTimeout(() => {
      setShowEntryBurst(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, [isActive]);

  // Generate 24 burst particles for the initial contagion entry animation radiating from the 4 borders
  const entryBurstParticles = useMemo<EntryBurstParticle[]>(() => {
    if (!isActive) return [];

    const particles: EntryBurstParticle[] = [];
    const colors = ['#84cc16', '#a3e635', '#bef264', '#d9f99d', '#65a30d'];

    // Top border outward burst
    for (let i = 0; i < 6; i++) {
      const pct = 10 + i * 16;
      particles.push({
        id: `burst-t-${i}`,
        left: `${pct}%`,
        top: '0%',
        burstX: (Math.random() - 0.5) * 32,
        burstY: -(18 + Math.random() * 26),
        size: 3 + (i % 3) * 1.2,
        color: colors[i % colors.length],
        duration: 0.85 + Math.random() * 0.45,
      });
    }

    // Bottom border outward burst
    for (let i = 0; i < 6; i++) {
      const pct = 10 + i * 16;
      particles.push({
        id: `burst-b-${i}`,
        left: `${pct}%`,
        top: '100%',
        burstX: (Math.random() - 0.5) * 32,
        burstY: 18 + Math.random() * 26,
        size: 3 + (i % 3) * 1.2,
        color: colors[(i + 2) % colors.length],
        duration: 0.85 + Math.random() * 0.45,
      });
    }

    // Left border outward burst
    for (let i = 0; i < 6; i++) {
      const pct = 12 + i * 15;
      particles.push({
        id: `burst-l-${i}`,
        left: '0%',
        top: `${pct}%`,
        burstX: -(18 + Math.random() * 24),
        burstY: (Math.random() - 0.5) * 28,
        size: 2.8 + (i % 3) * 1.2,
        color: colors[(i + 1) % colors.length],
        duration: 0.85 + Math.random() * 0.45,
      });
    }

    // Right border outward burst
    for (let i = 0; i < 6; i++) {
      const pct = 12 + i * 15;
      particles.push({
        id: `burst-r-${i}`,
        left: '100%',
        top: `${pct}%`,
        burstX: 18 + Math.random() * 24,
        burstY: (Math.random() - 0.5) * 28,
        size: 2.8 + (i % 3) * 1.2,
        color: colors[(i + 3) % colors.length],
        duration: 0.85 + Math.random() * 0.45,
      });
    }

    return particles;
  }, [isActive]);

  // Continuous subtle green-tinted spores pulsing gently along the post border perimeter
  const ambientBorderParticles = useMemo<BorderParticle[]>(() => {
    if (!isActive) return [];

    const list: BorderParticle[] = [];
    const colors = ['#84cc16', '#a3e635', '#bef264', '#d9f99d', '#65a30d'];

    // Top border spores
    const topPositions = [14, 32, 50, 68, 86];
    topPositions.forEach((pos, idx) => {
      list.push({
        id: `amb-t-${idx}`,
        side: 'top',
        left: `${pos}%`,
        top: '-1px',
        size: 2.8 + (idx % 2) * 1.2,
        color: colors[idx % colors.length],
        driftX: ((idx % 3) - 1) * 7,
        driftY: -(12 + (idx % 3) * 5),
        duration: 2.2 + (idx % 3) * 0.5,
        delay: (idx * 0.38) % 2,
      });
    });

    // Bottom border spores
    const bottomPositions = [18, 36, 54, 72, 88];
    bottomPositions.forEach((pos, idx) => {
      list.push({
        id: `amb-b-${idx}`,
        side: 'bottom',
        left: `${pos}%`,
        bottom: '-1px',
        size: 2.8 + (idx % 2) * 1.2,
        color: colors[(idx + 2) % colors.length],
        driftX: ((idx % 3) - 1) * 7,
        driftY: 12 + (idx % 3) * 5,
        duration: 2.4 + (idx % 3) * 0.5,
        delay: (idx * 0.42) % 2.2,
      });
    });

    // Left border spores
    const leftPositions = [22, 45, 68, 85];
    leftPositions.forEach((pos, idx) => {
      list.push({
        id: `amb-l-${idx}`,
        side: 'left',
        left: '-1px',
        top: `${pos}%`,
        size: 2.5 + (idx % 2) * 1.2,
        color: colors[(idx + 1) % colors.length],
        driftX: -(10 + (idx % 2) * 6),
        driftY: ((idx % 3) - 1) * 6,
        duration: 2.3 + (idx % 2) * 0.6,
        delay: (idx * 0.45) % 2,
      });
    });

    // Right border spores
    const rightPositions = [20, 42, 65, 82];
    rightPositions.forEach((pos, idx) => {
      list.push({
        id: `amb-r-${idx}`,
        side: 'right',
        right: '-1px',
        top: `${pos}%`,
        size: 2.5 + (idx % 2) * 1.2,
        color: colors[(idx + 3) % colors.length],
        driftX: 10 + (idx % 2) * 6,
        driftY: ((idx % 3) - 1) * 6,
        duration: 2.5 + (idx % 2) * 0.5,
        delay: (idx * 0.5) % 2.1,
      });
    });

    return list;
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* 1. Subtle Outer Border Shockwave Rings on Contagion Entry */}
      {showEntryBurst && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl z-20 overflow-visible">
          {/* Wave 1: Primary green pulse ring */}
          <div className="absolute -inset-1 rounded-2xl border border-emerald-400/80 animate-contagion-shockwave pointer-events-none" />
          {/* Wave 2: Staggered secondary bio-ring */}
          <div
            className="absolute -inset-1 rounded-2xl border border-lime-400/70 animate-contagion-shockwave pointer-events-none"
            style={{ animationDelay: '0.22s' }}
          />
        </div>
      )}

      {/* 2. Initial Outward Entry Particle Burst radiating away from border */}
      {showEntryBurst && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl z-20 overflow-visible">
          {entryBurstParticles.map((p) => (
            <span
              key={p.id}
              style={
                {
                  left: p.left,
                  top: p.top,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 8px ${p.color}, 0 0 16px rgba(34, 197, 94, 0.7)`,
                  borderRadius: '50%',
                  '--burst-x': `${p.burstX}px`,
                  '--burst-y': `${p.burstY}px`,
                  '--burst-duration': `${p.duration}s`,
                } as React.CSSProperties
              }
              className="absolute -translate-x-1/2 -translate-y-1/2 animate-contagion-entry-burst pointer-events-none"
            />
          ))}
        </div>
      )}

      {/* 3. Continuous Green-Tinted Border Glow & Ambient Contagion Halo */}
      <div
        className={`absolute -inset-[1.5px] rounded-2xl border border-emerald-500/50 pointer-events-none z-10 transition-opacity duration-300 ${
          isHovered ? 'opacity-90' : 'opacity-70'
        } animate-contagion-border-pulse`}
      />

      {/* 4. Ongoing Green-Tinted Spores Pulsing from the Post Border */}
      <div className="absolute inset-0 pointer-events-none rounded-2xl z-20 overflow-visible">
        {ambientBorderParticles.map((spore) => (
          <span
            key={spore.id}
            style={
              {
                left: spore.left,
                top: spore.top,
                right: spore.right,
                bottom: spore.bottom,
                width: `${spore.size}px`,
                height: `${spore.size}px`,
                backgroundColor: spore.color,
                boxShadow: `0 0 7px ${spore.color}, 0 0 12px rgba(16, 185, 129, 0.6)`,
                borderRadius: '50%',
                '--drift-x': `${spore.driftX}px`,
                '--drift-y': `${spore.driftY}px`,
                '--spore-duration': `${spore.duration}s`,
                animationDelay: `${spore.delay}s`,
              } as React.CSSProperties
            }
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-contagion-spore-pulse pointer-events-none"
          />
        ))}
      </div>

      {/* 5. Subtle Corner Biohazard Accents */}
      <div className="absolute top-1.5 right-1.5 pointer-events-none z-10 flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
      </div>
    </>
  );
};

interface ContagionSpreadFeedBannerProps {
  post?: Post;
  infectedCount: number;
  infectedNames: string[];
  remainingViews?: number;
  contagionEvents?: ViralContagionEvent[];
  lastEvent?: ViralContagionEvent;
  onOpenGraph?: () => void;
  onTriggerView?: (viewer?: User) => void;
  allUsers?: User[];
  currentUser?: User;
}

/**
 * Compact, informative banner shown on viral posts on the feed,
 * highlighting that every time the post is viewed, it automatically spreads
 * to the feeds of everyone that the viewer knows, tracking contagion events.
 */
export const ContagionSpreadFeedBanner: React.FC<ContagionSpreadFeedBannerProps> = ({
  post,
  infectedCount,
  infectedNames,
  remainingViews,
  contagionEvents = [],
  lastEvent,
  onOpenGraph,
  onTriggerView,
  allUsers = [],
  currentUser,
}) => {
  const [showEventsLog, setShowEventsLog] = useState(false);
  const [selectedViewerId, setSelectedViewerId] = useState<string>(currentUser?.id || 'usr_me');

  const displayNames = infectedNames.slice(0, 3).join(', ');
  const remainingCount = infectedNames.length > 3 ? infectedNames.length - 3 : 0;
  const eventsList = contagionEvents.length > 0 ? contagionEvents : (lastEvent ? [lastEvent] : []);

  const handleSimulateSelectedView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onTriggerView) return;
    const targetViewer = allUsers.find((u) => u.id === selectedViewerId) || currentUser;
    onTriggerView(targetViewer);
  };

  return (
    <div className="mb-2.5 rounded-xl bg-gradient-to-r from-lime-950/95 via-black/90 to-lime-950/95 border-2 border-lime-400 text-[11px] text-lime-200 shadow-[0_0_20px_rgba(163,230,53,0.35)] overflow-hidden transition-all">
      {/* Main Banner Bar */}
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500 shadow-[0_0_10px_rgba(163,230,53,1)]" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-lime-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-lime-400 fill-lime-400 inline drop-shadow-[0_0_6px_#a3e635]" />
                <span>Viral Contagion Active:</span>
              </span>
              <span className="text-lime-100/90 font-medium">
                Spreads to feeds of everyone the viewer knows upon view
              </span>
            </div>

            {/* Infection summary and latest event */}
            <div className="flex items-center gap-2 flex-wrap text-[10px] text-slate-300 mt-0.5">
              <span className="text-lime-400 font-mono font-bold">
                ☣️ {infectedCount} hosts infected
              </span>
              {typeof remainingViews === 'number' && (
                <>
                  <span className="text-lime-600">•</span>
                  <span className="text-amber-300/90 font-mono">
                    {remainingViews} view{remainingViews === 1 ? '' : 's'} until fade-away
                  </span>
                </>
              )}
              {displayNames && (
                <>
                  <span className="text-lime-600">•</span>
                  <span className="text-lime-300/80 font-mono truncate max-w-xs">
                    ({displayNames}{remainingCount > 0 ? ` +${remainingCount}` : ''})
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick View Simulation Trigger */}
          {onTriggerView && (
            <div className="flex items-center gap-1 bg-black/70 p-0.5 rounded-lg border border-lime-500/40">
              <select
                aria-label="Select viewer for contagion simulation"
                value={selectedViewerId}
                onChange={(e) => setSelectedViewerId(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 text-lime-300 text-[10px] py-1 px-1.5 rounded border border-neutral-800 focus:outline-none cursor-pointer"
              >
                {currentUser && <option value={currentUser.id}>Viewer: You ({currentUser.handle})</option>}
                {allUsers
                  .filter((u) => u.id !== currentUser?.id)
                  .slice(0, 5)
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      Viewer: {u.name} ({u.handle})
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleSimulateSelectedView}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-lime-500 hover:bg-lime-400 text-black font-bold text-[10px] transition-colors cursor-pointer shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                title="Simulate this viewer reading the post, spreading it to everyone they know"
              >
                <Eye className="w-3 h-3" />
                <span>Simulate View</span>
              </button>
            </div>
          )}

          {/* Contagion Events Log Toggle */}
          {eventsList.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowEventsLog((prev) => !prev);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-lime-950/80 hover:bg-lime-900 border border-lime-500/50 text-lime-200 hover:text-white font-mono text-[10px] transition-colors cursor-pointer shadow-[0_0_8px_rgba(163,230,53,0.2)]"
              title="Toggle contagion events history"
            >
              <Zap className="w-3 h-3 text-lime-400 fill-lime-400" />
              <span>Events ({eventsList.length})</span>
              {showEventsLog ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Open D3 Connection Graph Modal */}
          {onOpenGraph && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenGraph();
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-lime-900/80 hover:bg-lime-800 border border-lime-400/70 text-lime-200 hover:text-white font-mono text-[10px] transition-colors cursor-pointer shadow-[0_0_10px_rgba(163,230,53,0.3)]"
              title="Inspect transmission graph"
            >
              <Network className="w-3 h-3 text-lime-400" />
              <span>Graph</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Contagion Events History Log */}
      {showEventsLog && eventsList.length > 0 && (
        <div className="border-t border-lime-500/40 bg-black/75 p-2.5 space-y-1.5 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1 border-b border-lime-500/20">
            <span className="flex items-center gap-1 text-lime-400 font-semibold">
              <Zap className="w-3 h-3 text-lime-400 fill-lime-400" />
              <span>Recorded Contagion Events Log</span>
            </span>
            <span className="text-lime-300/80">Earns +25 Spark Points per unique infection</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[10px]">
            {eventsList.map((ev, idx) => (
              <div
                key={ev.id || `ev_${idx}`}
                className="p-1.5 rounded-lg bg-neutral-900/85 border border-lime-500/30 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-lime-950 border border-lime-400/60 flex items-center justify-center shrink-0 text-[9px] font-mono text-lime-300">
                    #{eventsList.length - idx}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-200 font-semibold">
                        Viewed by {ev.viewerHandle || ev.viewerName}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{ev.timestamp}</span>
                    </div>
                    <div className="text-slate-400 truncate">
                      {ev.newInfectionsCount > 0 ? (
                        <span className="text-lime-300">
                          Spread to: {ev.infectedUserNames?.join(', ') || `${ev.newInfectionsCount} contacts`}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">
                          All contacts were already infected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  {ev.bountyPointsEarned > 0 ? (
                    <span className="text-lime-300 font-bold bg-lime-950/80 border border-lime-400/50 px-1.5 py-0.5 rounded text-[10px] shadow-[0_0_6px_rgba(163,230,53,0.3)]">
                      +{ev.bountyPointsEarned} pts
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[9px]">0 pts</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
