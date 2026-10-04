import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  FileText,
  Users,
  FolderHeart,
  Image as ImageIcon,
  Bookmark,
  ChevronDown,
  Check,
  Sparkles,
  SlidersHorizontal,
  Layers,
  Smile,
  Music,
  Moon,
  ShieldAlert,
  Feather,
  BookOpen,
} from 'lucide-react';

export type FeedFilterMode = 'all' | 'poetry' | 'literature' | 'music' | 'friends' | 'groups' | 'media' | 'mood' | 'adult_swim';

export interface FeedViewOption {
  id: FeedFilterMode | 'meme_collector' | 'meme_creator' | 'memories_library' | 'music_library';
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number | string;
  countLabel?: string;
  colorScheme: 'pink' | 'cyan' | 'purple' | 'amber' | 'emerald' | 'rose';
  isExternalNavigation?: boolean;
}

interface FeedViewsDropdownProps {
  currentMode: FeedFilterMode;
  onSelectMode: (mode: FeedFilterMode) => void;
  selectedHashtagFilter?: string | null;
  onClearHashtagFilter?: () => void;
  onNavigateToTab?: (tab: 'meme_collector' | 'meme_creator' | 'memories_library' | 'hashtags' | 'music_library') => void;
  selectedMoodFilter?: string | null;
  onSelectMoodFilter?: (mood: string | null) => void;
  onOpenFriendMoodPage?: (mood: { emoji: string; label: string }) => void;
  availableMoods?: { emoji: string; label: string; count: number }[];
  isAdultVerified?: boolean;
  counts: {
    all: number;
    poetry: number;
    literature?: number;
    music?: number;
    friends: number;
    groups: number;
    media?: number;
    mood?: number;
    adult_swim?: number;
    cities?: number;
    saved?: number;
  };
  variant?: 'sidebar' | 'toolbar' | 'compact';
  className?: string;
}

export const FeedViewsDropdown: React.FC<FeedViewsDropdownProps> = ({
  currentMode,
  onSelectMode,
  selectedHashtagFilter,
  onClearHashtagFilter,
  onNavigateToTab,
  selectedMoodFilter,
  onSelectMoodFilter,
  onOpenFriendMoodPage,
  availableMoods,
  isAdultVerified = false,
  counts,
  variant = 'sidebar',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const feedOptions: FeedViewOption[] = [
    {
      id: 'all',
      label: 'Global Stream',
      shortLabel: 'Global',
      description: 'All public posts, thoughts & poetry across deep_',
      icon: Globe,
      count: counts.all,
      countLabel: 'posts',
      colorScheme: 'pink',
    },
    {
      id: 'poetry',
      label: 'Poetry Mode',
      shortLabel: 'Poetry',
      description: 'Exclusive feed of stanzas, verses, haikus & poetic cadence',
      icon: Feather,
      count: counts.poetry,
      countLabel: 'poems',
      colorScheme: 'pink',
    },
    {
      id: 'literature',
      label: 'Literature Mode',
      shortLabel: 'Literature',
      description: 'PDF manuscripts, books, reading links & long-form articles',
      icon: BookOpen,
      count: counts.literature ?? 0,
      countLabel: 'works',
      colorScheme: 'pink',
    },
    {
      id: 'music',
      label: 'Music & Soundtracks',
      shortLabel: 'Music Feed',
      description: 'Stream posts featuring ambient soundtracks, tapes & musical scores',
      icon: Music,
      count: counts.music ?? 0,
      countLabel: 'tracks',
      colorScheme: 'pink',
    },
    {
      id: 'friends',
      label: 'Friends & Mates Only',
      shortLabel: 'Friends',
      description: 'Activity stream from your connected circle & inner ring',
      icon: Users,
      count: counts.friends,
      countLabel: 'mates',
      colorScheme: 'pink',
    },
    {
      id: 'groups',
      label: 'Streams & Circles',
      shortLabel: 'Streams',
      description: 'Curated feeds from community hashtags you joined',
      icon: FolderHeart,
      count: counts.groups,
      countLabel: 'streams',
      colorScheme: 'pink',
    },
    {
      id: 'media',
      label: 'Visual Media & Photos',
      shortLabel: 'Photos',
      description: 'Photography, generative art & visual showcases',
      icon: ImageIcon,
      count: counts.media ?? 0,
      countLabel: 'photos',
      colorScheme: 'cyan',
    },
    {
      id: 'mood',
      label: 'Vibrational search',
      shortLabel: 'Vibrations',
      description: 'Filter stream by emotional depth, mood & frequency',
      icon: Smile,
      count: counts.mood ?? 0,
      countLabel: 'vibes',
      colorScheme: 'purple',
    },
    {
      id: 'adult_swim',
      label: '[adult swim] (18+)',
      shortLabel: 'Adult Swim',
      description: 'Late-night uncensored thoughts, raw poetry stanzas & nocturnal vibes (18+)',
      icon: Moon,
      count: counts.adult_swim ?? 0,
      countLabel: 'posts',
      colorScheme: 'rose',
    },
  ];

  const externalViews: FeedViewOption[] = [
    {
      id: 'music_library',
      label: 'Music Library',
      shortLabel: 'Music Library',
      description: 'Your saved acoustic songs, audio links, equalizer & playlist',
      icon: Music,
      count: counts.music ?? 0,
      countLabel: 'tracks',
      colorScheme: 'pink',
      isExternalNavigation: true,
    },
    {
      id: 'memories_library',
      label: 'Meme collector & Library',
      shortLabel: 'Memes & Library',
      description: 'Bookmarked memes, poetry, citations & reading links',
      icon: Bookmark,
      count: counts.saved ?? 0,
      colorScheme: 'pink',
      isExternalNavigation: true,
    },
  ];

  const activeOption =
    feedOptions.find((opt) => opt.id === currentMode) || feedOptions[0];
  const ActiveIcon = activeOption.icon;

  const handleSelect = (option: FeedViewOption) => {
    if (option.isExternalNavigation) {
      if (onNavigateToTab) {
        onNavigateToTab(option.id as any);
      }
    } else {
      onSelectMode(option.id as FeedFilterMode);
      if (onClearHashtagFilter) {
        onClearHashtagFilter();
      }
    }
    setIsOpen(false);
  };

  // Color styles mapping
  const getBadgeStyle = (scheme: 'pink' | 'cyan' | 'purple' | 'amber' | 'emerald' | 'sky' | 'rose') => {
    if (scheme === 'emerald') {
      return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
    }
    if (scheme === 'cyan') {
      return 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300';
    }
    if (scheme === 'sky') {
      return 'bg-sky-950/80 border-sky-500/40 text-sky-300';
    }
    if (scheme === 'purple') {
      return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
    }
    if (scheme === 'rose') {
      return 'bg-rose-950/80 border-rose-500/40 text-rose-300';
    }
    return 'bg-pink-950/80 border-pink-500/40 text-pink-300';
  };

  // TOOLBAR / TOP-OF-FEED VARIANT
  if (variant === 'toolbar' || variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
            isOpen
              ? 'bg-neutral-900 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.35)]'
              : 'bg-black/80 hover:bg-neutral-900/90 text-slate-200 border-pink-500/30 hover:border-pink-500/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-pink-950/80 border border-pink-500/40 text-pink-400">
              <ActiveIcon className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold tracking-tight">
              {variant === 'compact' ? activeOption.shortLabel : activeOption.label}
            </span>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${getBadgeStyle(
              activeOption.colorScheme
            )}`}
          >
            {activeOption.count}
          </span>

          <ChevronDown
            className={`w-4 h-4 text-pink-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-pink-300' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu Popup */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-neutral-950/85 backdrop-blur-2xl border border-pink-500/50 rounded-2xl p-2 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(236,72,153,0.25)] z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-3 py-2 border-b border-pink-500/20 mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-400 font-mono uppercase tracking-wider">
                <SlidersHorizontal className="w-3 h-3 text-pink-400" />
                <span>Feed View Filter</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {feedOptions.length} views
              </span>
            </div>

            <div className="space-y-1">
              {feedOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected =
                  currentMode === opt.id && !selectedHashtagFilter;

                const isAdultSwim = opt.id === 'adult_swim';

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? isAdultSwim
                          ? 'bg-rose-600 text-white font-bold shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                          : 'bg-pink-600 text-white font-bold shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                        : isAdultSwim
                        ? 'text-slate-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-rose-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-neutral-900 border border-transparent hover:border-pink-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`p-1.5 rounded-lg border mt-0.5 ${
                          isSelected
                            ? 'bg-white/20 border-white/40 text-white'
                            : isAdultSwim
                            ? 'bg-neutral-900 border-rose-500/30 text-rose-400 group-hover:border-rose-500/60 group-hover:text-rose-300'
                            : 'bg-neutral-900 border-pink-500/20 text-pink-400 group-hover:border-pink-500/50 group-hover:text-pink-300'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{opt.label}</span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          {isAdultSwim && !isAdultVerified && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                              Gate
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[10px] leading-tight line-clamp-1 mt-0.5 ${
                            isSelected ? 'text-white/90' : 'text-slate-400'
                          }`}
                        >
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border shrink-0 ml-2 ${
                        isSelected
                          ? 'bg-white/20 border-white/40 text-white'
                          : getBadgeStyle(opt.colorScheme)
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* External App Navigation Shortcuts */}
            <div className="pt-2 mt-2 border-t border-pink-500/20 space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Explore Alternative Views
              </div>
              {externalViews.map((opt) => {
                const Icon = opt.icon;
                const isMusicLib = opt.id === 'music_library';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between text-slate-300 hover:text-white hover:bg-neutral-900/90 border border-transparent group cursor-pointer ${
                      isMusicLib ? 'hover:border-pink-500/40' : 'hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1 rounded-lg bg-neutral-900 border ${
                          isMusicLib
                            ? 'border-pink-500/40 text-pink-400 group-hover:border-pink-400'
                            : 'border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span
                        className={`font-medium text-slate-200 ${
                          isMusicLib ? 'group-hover:text-pink-300' : 'group-hover:text-cyan-300'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        isMusicLib
                          ? 'bg-pink-950/80 border-pink-500/40 text-pink-300'
                          : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT SIDEBAR VARIANT
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="absolute -inset-0.5 rounded-2xl bg-pink-400/10 blur-md opacity-25 pointer-events-none" />
      <div className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 rounded-2xl p-3.5 card-pink-glow">
        
        {/* Header with Title and Dropdown Toggle */}
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span>Feed Views Menu</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {feedOptions.length} channels
          </span>
        </div>

        {/* The Dropdown Trigger Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full text-left p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border ${
            isOpen
              ? 'bg-neutral-900 border-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
              : 'bg-neutral-900/90 text-slate-200 border-pink-500/30 hover:border-pink-500/60 hover:bg-neutral-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-pink-950/80 border border-pink-500/50 text-pink-400">
              <ActiveIcon className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-slate-100 flex items-center gap-1.5">
                <span>{activeOption.label}</span>
                {currentMode === 'mood' && selectedMoodFilter ? (
                  <span className="text-[10px] text-purple-300 font-semibold px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/40">
                    {selectedMoodFilter}
                  </span>
                ) : (
                  <span className="text-[9px] text-pink-400 uppercase font-mono px-1 py-0.2 rounded bg-pink-950/80 border border-pink-500/30">
                    Active
                  </span>
                )}
              </p>
              <p className="text-[10px] text-slate-400 font-normal line-clamp-1">
                {activeOption.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${getBadgeStyle(
                activeOption.colorScheme
              )}`}
            >
              {activeOption.count}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-pink-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-pink-300' : ''
              }`}
            />
          </div>
        </button>

        {/* Quick Mood/Vibration Depth Pills in Sidebar */}
        {currentMode === 'mood' && availableMoods && availableMoods.length > 0 && !isOpen && (
          <div className="mt-2.5 pt-2 border-t border-purple-500/30 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono mb-1.5 px-0.5">
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-purple-300">
                <Smile className="w-3 h-3 text-purple-400" /> Vibe Depth
              </span>
              {selectedMoodFilter && (
                <button
                  type="button"
                  onClick={() => onSelectMoodFilter?.(null)}
                  className="text-pink-400 hover:text-pink-300 text-[10px] underline cursor-pointer"
                >
                  All Vibes
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => onSelectMoodFilter?.(null)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer border ${
                  !selectedMoodFilter
                    ? 'bg-neutral-800 text-white font-bold border-neutral-700'
                    : 'bg-neutral-900 text-slate-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                All ({counts.mood ?? 0})
              </button>
              {availableMoods.map((m) => {
                const isSelected = selectedMoodFilter?.toLowerCase() === m.label.toLowerCase();
                return (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => {
                      if (onOpenFriendMoodPage) {
                        onOpenFriendMoodPage({ emoji: m.emoji, label: m.label });
                      } else {
                        onSelectMoodFilter?.(isSelected ? null : m.label);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-pink-700 text-white font-bold border-pink-600'
                        : 'bg-neutral-900 text-slate-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{m.label}</span>
                    <span className="text-[9px] opacity-70">({m.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Dropdown Options Popup List */}
        {isOpen && (
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-pink-500/20 animate-in fade-in duration-150">
            <div className="px-1.5 py-1 text-[10px] font-bold text-pink-400/80 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Switch Feed Stream</span>
              <span>Select View ↓</span>
            </div>

            {feedOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected =
                currentMode === opt.id && !selectedHashtagFilter;
              const isAdultSwim = opt.id === 'adult_swim';

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? isAdultSwim
                        ? 'bg-rose-600 text-white font-bold shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                        : 'bg-pink-600 text-white font-bold shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                      : isAdultSwim
                      ? 'bg-rose-950/20 text-slate-300 hover:bg-neutral-900 hover:text-white border border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-neutral-900/60 text-slate-300 hover:bg-neutral-900 hover:text-white border border-pink-500/20 hover:border-pink-500/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-1 rounded-lg border ${
                        isSelected
                          ? 'bg-white/20 border-white/40 text-white'
                          : isAdultSwim
                          ? 'bg-black/60 border-rose-500/40 text-rose-400 group-hover:text-rose-300'
                          : 'bg-black/60 border-pink-500/30 text-pink-400 group-hover:text-pink-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold">{opt.label}</span>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        {isAdultSwim && !isAdultVerified && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                            Gate
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] line-clamp-1 ${
                          isSelected ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {opt.description}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono border shrink-0 ml-2 ${
                      isSelected
                        ? 'bg-white/20 border-white/40 text-white'
                        : getBadgeStyle(opt.colorScheme)
                    }`}
                  >
                    {opt.count}
                  </span>
                </button>
              );
            })}

            {/* Quick Links Section */}
            <div className="pt-2 border-t border-pink-500/20 space-y-1">
              <div className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Map & Library Tabs
              </div>
              {externalViews.map((opt) => {
                const Icon = opt.icon;
                const isMusicLib = opt.id === 'music_library';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between bg-neutral-900/40 text-slate-300 hover:text-white hover:bg-neutral-900 border border-transparent group cursor-pointer ${
                      isMusicLib ? 'hover:border-pink-500/40' : 'hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`p-1 rounded-lg bg-neutral-900 border ${
                          isMusicLib
                            ? 'border-pink-500/40 text-pink-400 group-hover:border-pink-400'
                            : 'border-cyan-500/30 text-cyan-400 group-hover:border-cyan-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      <span
                        className={`font-medium text-slate-200 ${
                          isMusicLib ? 'group-hover:text-pink-300' : 'group-hover:text-cyan-300'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        isMusicLib
                          ? 'bg-pink-950/80 border-pink-500/40 text-pink-300'
                          : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
