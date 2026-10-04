import React, { useState } from 'react';
import {
  X,
  Clock,
  Sparkles,
  Award,
  BookOpen,
  Link,
  Loader2,
  Check,
  TrendingUp,
  Hash,
  FileText,
  Zap,
  Globe,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { HashtagGroup, ReadingLink, User } from '../types';
import { estimateReadingTimeOfLink, getPointsBreakdown } from '../utils/readingEstimator';

interface ReadingEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReadingLink?: (link: ReadingLink) => void;
  onStartReading?: (link: ReadingLink) => void;
  defaultHashtag?: string;
  allHashtagGroups?: HashtagGroup[];
  currentUser: User;
}

const SAMPLE_LINKS = [
  {
    url: 'https://poetryfoundation.org/articles/modern-stanza-rhythm-and-silence',
    title: 'The Architecture of the Unsaid: Silence and Rhythm in Contemporary Stanzas',
    tag: 'Poetry',
    hint: '8 min read • 125 pts',
  },
  {
    url: 'https://eff.org/deeplinks/zero-knowledge-profile-vaults-and-client-side-aes',
    title: 'Zero-Knowledge Profile Vaults: Client-Side AES-256 for Sovereign Identity',
    tag: 'Encrypted',
    hint: '12 min read • 165 pts',
  },
  {
    url: 'https://theatlantic.com/magazine/archive/2026/the-psychology-of-mutual-dislikes',
    title: 'The Depth of Dislikes: Why Shared Aversions Forge Stronger Friendships',
    tag: 'Mates',
    hint: '9 min read • 135 pts',
  },
  {
    url: 'https://deep.network/manifesto/intentional-digital-presence-and-ambient-silence',
    title: 'The deep_ Manifesto: Exiting the Algorithmic Treadmill',
    tag: 'deep_',
    hint: '10 min read • 145 pts',
  },
  {
    url: 'https://kyotojournal.org/culture-and-craft/wabi-sabi-in-analog-technology',
    title: 'Wabi-Sabi in Modern Hardware: Kyoto Artisans',
    tag: 'Kyoto',
    hint: '7 min read • 95 pts',
  },
];

export const ReadingEstimatorModal: React.FC<ReadingEstimatorModalProps> = ({
  isOpen,
  onClose,
  onSelectReadingLink,
  onStartReading,
  defaultHashtag = 'deep_',
  allHashtagGroups = [],
  currentUser,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>(defaultHashtag.replace(/^#+/, ''));
  const [customTitle, setCustomTitle] = useState('');
  const [textExcerpt, setTextExcerpt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedResult, setEstimatedResult] = useState<ReadingLink | null>(null);

  if (!isOpen) return null;

  const handleEstimate = async () => {
    if (!urlInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await estimateReadingTimeOfLink(
        urlInput.trim(),
        selectedTag,
        textExcerpt.trim() || undefined,
        customTitle.trim() || undefined
      );
      setEstimatedResult(result);
    } catch (err) {
      console.error('Failed to estimate link reading time:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySample = (sample: typeof SAMPLE_LINKS[0]) => {
    setUrlInput(sample.url);
    setSelectedTag(sample.tag);
    setCustomTitle(sample.title);
    // Trigger estimation immediately
    setIsLoading(true);
    estimateReadingTimeOfLink(sample.url, sample.tag, undefined, sample.title).then((res) => {
      setEstimatedResult(res);
      setIsLoading(false);
    });
  };

  const activePoints = estimatedResult
    ? getPointsBreakdown(estimatedResult.estimatedMinutes)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/40 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.3)] flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-neutral-900/70 border-b border-pink-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-950/80 border border-pink-500/50 flex items-center justify-center text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.4)]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Reading Time & Group Points Estimator</span>
                <span className="px-2 py-0.5 rounded-full bg-pink-950/90 text-pink-300 border border-pink-400/40 text-[10px] font-mono">
                  Smart Karma Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Estimate reading duration for any URL and calculate points rewarded to your hashtag stream.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* Rules & Formula Explanation Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-neutral-900 to-purple-950/40 border border-pink-500/30 flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-300 text-xs">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>Points Formula in #{selectedTag}</span>
                <span className="text-amber-300 font-mono text-[11px]">(The longer the read, the more points)</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                • <strong className="text-slate-200">10 Base Points</strong> for engaging with external literature.<br />
                • <strong className="text-pink-300">+10 Points per minute</strong> of estimated reading time.<br />
                • <strong className="text-amber-300">Longform Depth Bonus</strong>: +15 pts (4–7m), +35 pts (8–14m), +75 pts (15m+).
              </p>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-pink-400" />
                  Article / Document URL
                </span>
                <span className="text-[11px] text-slate-400">Works with any webpage or article</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/essay-or-article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEstimate()}
                  className="flex-1 bg-neutral-900 border border-pink-500/30 focus:border-pink-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <button
                  onClick={handleEstimate}
                  disabled={isLoading || !urlInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(236,72,153,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Estimating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Estimate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Target Hashtag Group Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-pink-400" />
                Target Hashtag Group (Where points will be awarded)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Poetry', 'Encrypted', 'deep_', 'Mates', 'Kyoto', 'Minimalism', 'Verse', 'Cipher'].map((tag) => {
                  const isSel = selectedTag.toLowerCase() === tag.toLowerCase();
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag);
                        if (estimatedResult) {
                          setEstimatedResult({
                            ...estimatedResult,
                            hashtag: tag,
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isSel
                          ? 'bg-pink-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-pink-400'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Samples Section */}
            <div>
              <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Or pick a curated sample link to test:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_LINKS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplySample(s)}
                    className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-slate-800 hover:border-pink-500/40 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-pink-400 mb-0.5">
                      <span className="font-semibold">#{s.tag}</span>
                      <span className="text-[10px] text-amber-300 font-mono">{s.hint}</span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-1 group-hover:text-pink-200 font-medium">
                      {s.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Estimation Result Presentation Card */}
          {estimatedResult && activePoints && (
            <div className="p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-pink-500/50 space-y-4 shadow-[0_4px_25px_rgba(236,72,153,0.15)] animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-pink-950 border border-pink-500/50 text-pink-300 font-bold text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-pink-400" />
                    {estimatedResult.readTimeFormatted}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({estimatedResult.wordCount.toLocaleString()} words)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>+{activePoints.total} Points in #{estimatedResult.hashtag}</span>
                </div>
              </div>

              {/* Title & Preview */}
              <div>
                <h4 className="text-sm font-bold text-white leading-snug mb-1">
                  {estimatedResult.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {estimatedResult.excerpt}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono truncate">
                  🔗 {estimatedResult.url}
                </div>
              </div>

              {/* Detailed Points Breakdown Formula */}
              <div className="p-3 rounded-xl bg-black/60 border border-pink-500/20 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-neutral-900/60">
                  <div className="text-[10px] text-slate-400">Base Reward</div>
                  <div className="text-xs font-bold text-white mt-0.5">+{activePoints.base} pts</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/60">
                  <div className="text-[10px] text-slate-400">Duration ({estimatedResult.estimatedMinutes}m × 10)</div>
                  <div className="text-xs font-bold text-pink-300 mt-0.5">+{activePoints.minutePoints} pts</div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-900/60">
                  <div className="text-[10px] text-slate-400">Depth Bonus</div>
                  <div className="text-xs font-bold text-amber-300 mt-0.5">+{activePoints.depthBonus} pts</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                {onSelectReadingLink && (
                  <button
                    onClick={() => {
                      onSelectReadingLink(estimatedResult);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-pink-400" />
                    <span>Attach to Post</span>
                  </button>
                )}

                {onStartReading && (
                  <button
                    onClick={() => {
                      onStartReading(estimatedResult);
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-pink-600 hover:from-pink-500 hover:to-fuchsia-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.5)] cursor-pointer flex items-center gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Start Reading & Earn +{activePoints.total} Pts</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
