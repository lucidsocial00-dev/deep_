import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Quote,
  Feather,
  FileText,
  Send,
  Type,
  Palette,
  Hash,
  Check,
} from 'lucide-react';
import { QuoteCardData, QuoteCardBackground, PDFDocument, User } from '../types';
import { QuoteCardPreview } from './QuoteCardPreview';

interface CreateQuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuoteText: string;
  sourceTitle: string;
  sourceType: 'poetry' | 'pdf';
  sourceAuthor?: string;
  sourceAuthorAvatar?: string;
  sourceId?: string;
  sourceDoc?: PDFDocument;
  currentUser: User;
  onShareAsPost: (payload: {
    quoteCard: QuoteCardData;
    caption: string;
    hashtags: string[];
  }) => void;
}

const BACKGROUND_OPTIONS: {
  id: QuoteCardBackground;
  label: string;
  description: string;
  previewClass: string;
}[] = [
  {
    id: 'neon',
    label: 'Cyber Neon',
    description: 'Electric pink & cyan glow with dark slate grid',
    previewClass: 'from-pink-900 via-neutral-900 to-cyan-900 border-pink-400',
  },
  {
    id: 'aurora',
    label: 'Aurora Borealis',
    description: 'Ethereal teal, indigo, and violet celestial ribbons',
    previewClass: 'from-teal-900 via-indigo-900 to-purple-900 border-teal-400',
  },
  {
    id: 'parchment',
    label: 'Antique Parchment',
    description: 'Warm literary papyrus with gilded bronze accents',
    previewClass: 'from-amber-950 via-stone-900 to-amber-900 border-amber-500',
  },
  {
    id: 'noir',
    label: 'Midnight Noir',
    description: 'Minimalist matte obsidian with crisp silver type',
    previewClass: 'from-neutral-900 via-neutral-950 to-neutral-900 border-slate-500',
  },
  {
    id: 'emerald',
    label: 'Mystic Emerald',
    description: 'Deep forest jade with contemplative bioluminescence',
    previewClass: 'from-emerald-950 via-neutral-950 to-teal-950 border-emerald-400',
  },
  {
    id: 'sunset',
    label: 'Velvet Sunset',
    description: 'Rose dusk, violet twilight, and amber horizon',
    previewClass: 'from-rose-950 via-purple-950 to-amber-950 border-rose-400',
  },
];

export const CreateQuoteCardModal: React.FC<CreateQuoteCardModalProps> = ({
  isOpen,
  onClose,
  initialQuoteText,
  sourceTitle,
  sourceType,
  sourceAuthor,
  sourceAuthorAvatar,
  sourceId,
  sourceDoc,
  currentUser,
  onShareAsPost,
}) => {
  if (!isOpen) return null;

  const [quoteText, setQuoteText] = useState(initialQuoteText);
  const [visualBackground, setVisualBackground] = useState<QuoteCardBackground>(
    sourceType === 'poetry' ? 'parchment' : 'neon'
  );
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [caption, setCaption] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([
    '#QuoteCard',
    sourceType === 'poetry' ? '#Poetry' : '#Literature',
  ]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Update quoteText if initial changes
  useEffect(() => {
    setQuoteText(initialQuoteText);
  }, [initialQuoteText]);

  // Constructed live Quote Card object
  const liveQuoteCard: QuoteCardData = {
    id: 'quote_' + Date.now(),
    quoteText: quoteText.trim() || 'Highlight a phrase to quote...',
    sourceTitle: sourceTitle || 'Untitled Source',
    sourceType,
    sourceAuthor: sourceAuthor || currentUser.name,
    sourceAuthorAvatar,
    sourceId,
    sourceDoc,
    visualBackground,
    fontStyle,
    annotation: caption.trim() || undefined,
    createdAt: 'Just now',
  };

  const handleToggleTag = (tag: string) => {
    setSelectedHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    let tag = customTagInput.trim();
    if (!tag) return;
    if (!tag.startsWith('#')) tag = '#' + tag;
    if (!selectedHashtags.includes(tag)) {
      setSelectedHashtags((prev) => [...prev, tag]);
    }
    setCustomTagInput('');
  };

  const handlePublish = () => {
    if (!quoteText.trim()) return;
    onShareAsPost({
      quoteCard: liveQuoteCard,
      caption: caption.trim(),
      hashtags: selectedHashtags,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-neutral-950 border border-pink-500/60 rounded-2xl shadow-[0_0_40px_rgba(236,72,153,0.35)] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cyber Accent Header Strip */}
        <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400" />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-neutral-900/80 border-b border-pink-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-600/30 border border-pink-400/50 flex items-center justify-center text-pink-300">
              <Quote className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h3 className="font-space-mono font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Create Quote Card</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-400/40 text-pink-300">
                  +15 pts
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Turn selected excerpt into a beautifully styled visual card post
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Live Quote Card Preview */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Live Visual Preview</span>
            </label>

            <QuoteCardPreview quoteCard={liveQuoteCard} interactive={false} />
          </div>

          {/* Section 2: Visual Background Style Presets */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>Special Visual Background</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BACKGROUND_OPTIONS.map((opt) => {
                const isSelected = visualBackground === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisualBackground(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      isSelected
                        ? 'border-pink-400 ring-2 ring-pink-500/40 shadow-[0_0_15px_rgba(236,72,153,0.3)] bg-neutral-900'
                        : 'border-neutral-800 hover:border-slate-700 bg-neutral-900/50'
                    }`}
                  >
                    <div
                      className={`w-full h-7 rounded-lg bg-gradient-to-r mb-2 border ${opt.previewClass}`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-100">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Typography & Quote Content Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-pink-400" />
                <span>Quote Excerpt & Typography</span>
              </label>

              {/* Typography style switches */}
              <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-lg border border-pink-500/20">
                <button
                  type="button"
                  onClick={() => setFontStyle('serif')}
                  className={`px-2 py-0.5 rounded text-[11px] font-serif transition-colors ${
                    fontStyle === 'serif'
                      ? 'bg-pink-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Serif
                </button>
                <button
                  type="button"
                  onClick={() => setFontStyle('sans')}
                  className={`px-2 py-0.5 rounded text-[11px] font-sans transition-colors ${
                    fontStyle === 'sans'
                      ? 'bg-pink-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sans
                </button>
                <button
                  type="button"
                  onClick={() => setFontStyle('mono')}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    fontStyle === 'mono'
                      ? 'bg-pink-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              rows={3}
              placeholder="Selected excerpt text..."
              className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-3 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400 font-serif"
            />
          </div>

          {/* Section 4: Accompanying Post Caption & Reflection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5 text-pink-400" />
              <span>Personal Reflection / Thoughts (Optional)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              placeholder="What made these lines resonate with you? Share your commentary..."
              className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl p-3 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
          </div>

          {/* Section 5: Hashtag Badges */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-pink-400" />
              <span>Hashtag Streams</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              {['#QuoteCard', '#Poetry', '#Literature', '#Verse', '#PDFVault', '#Reflections'].map(
                (tag) => {
                  const isChecked = selectedHashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] border font-mono transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.4)]'
                          : 'bg-neutral-900 text-slate-400 border-pink-500/20 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                }
              )}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-neutral-900/80 border-t border-pink-500/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={!quoteText.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Quote Card (+15 pts)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
