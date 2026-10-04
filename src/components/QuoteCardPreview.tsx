import React, { useState } from 'react';
import {
  Quote,
  Sparkles,
  BookOpen,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Feather,
} from 'lucide-react';
import { QuoteCardData, PDFDocument } from '../types';

interface QuoteCardPreviewProps {
  quoteCard: QuoteCardData;
  onOpenPdf?: (doc: PDFDocument) => void;
  interactive?: boolean;
  className?: string;
}

export const QuoteCardPreview: React.FC<QuoteCardPreviewProps> = ({
  quoteCard,
  onOpenPdf,
  interactive = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `"${quoteCard.quoteText}" — ${quoteCard.sourceAuthor || quoteCard.sourceTitle}`;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Background style presets
  const getThemeStyles = () => {
    switch (quoteCard.visualBackground) {
      case 'neon':
        return {
          wrapper:
            'bg-gradient-to-br from-neutral-950 via-slate-950 to-cyan-950 border-pink-500/60 shadow-[0_0_25px_rgba(236,72,153,0.3),inset_0_0_20px_rgba(6,182,212,0.1)] text-cyan-50',
          quoteMark: 'text-pink-400/80',
          accentBorder: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400',
          badge: 'bg-pink-950/70 border-pink-500/40 text-pink-300',
          tag: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/50',
          textClass: 'text-slate-100',
          authorClass: 'text-pink-300',
        };
      case 'aurora':
        return {
          wrapper:
            'bg-gradient-to-br from-slate-950 via-indigo-950/80 to-teal-950 border-teal-400/50 shadow-[0_0_25px_rgba(45,212,191,0.25),inset_0_0_25px_rgba(99,102,241,0.15)] text-teal-50',
          quoteMark: 'text-teal-400/80',
          accentBorder: 'bg-gradient-to-r from-teal-400 via-indigo-500 to-purple-400',
          badge: 'bg-teal-950/70 border-teal-400/40 text-teal-300',
          tag: 'border-indigo-500/40 text-indigo-300 bg-indigo-950/50',
          textClass: 'text-teal-50',
          authorClass: 'text-teal-300',
        };
      case 'parchment':
        return {
          wrapper:
            'bg-gradient-to-br from-[#1c1713] via-[#241e18] to-[#18130f] border-amber-600/50 shadow-[0_0_22px_rgba(217,119,6,0.25),inset_0_0_20px_rgba(180,83,9,0.15)] text-amber-100',
          quoteMark: 'text-amber-500/80',
          accentBorder: 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700',
          badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
          tag: 'border-amber-600/40 text-amber-300 bg-amber-950/40',
          textClass: 'text-amber-100',
          authorClass: 'text-amber-300',
        };
      case 'noir':
        return {
          wrapper:
            'bg-gradient-to-b from-neutral-900 to-neutral-950 border-slate-700/80 shadow-[0_4px_25px_rgba(0,0,0,0.9),inset_0_0_15px_rgba(255,255,255,0.05)] text-slate-100',
          quoteMark: 'text-slate-500',
          accentBorder: 'bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600',
          badge: 'bg-neutral-800 border-slate-600 text-slate-200',
          tag: 'border-slate-700 text-slate-300 bg-neutral-900',
          textClass: 'text-white',
          authorClass: 'text-slate-300',
        };
      case 'emerald':
        return {
          wrapper:
            'bg-gradient-to-br from-emerald-950/90 via-neutral-950 to-teal-950 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.25),inset_0_0_20px_rgba(16,185,129,0.1)] text-emerald-50',
          quoteMark: 'text-emerald-400/80',
          accentBorder: 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500',
          badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          tag: 'border-emerald-600/40 text-emerald-300 bg-emerald-950/50',
          textClass: 'text-emerald-50',
          authorClass: 'text-emerald-300',
        };
      case 'sunset':
      default:
        return {
          wrapper:
            'bg-gradient-to-br from-rose-950/90 via-purple-950/80 to-amber-950/80 border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.3),inset_0_0_20px_rgba(244,63,94,0.15)] text-rose-50',
          quoteMark: 'text-rose-400/80',
          accentBorder: 'bg-gradient-to-r from-rose-500 via-purple-500 to-amber-500',
          badge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
          tag: 'border-rose-500/40 text-rose-300 bg-rose-950/50',
          textClass: 'text-rose-50',
          authorClass: 'text-rose-300',
        };
    }
  };

  const theme = getThemeStyles();

  const fontClass =
    quoteCard.fontStyle === 'mono'
      ? 'font-mono'
      : quoteCard.fontStyle === 'sans'
      ? 'font-sans'
      : 'font-serif';

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 ${theme.wrapper} ${className}`}
    >
      {/* Visual Accent Top Bar */}
      <div className={`h-1.5 w-full ${theme.accentBorder}`} />

      <div className="p-5 sm:p-6 relative">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between gap-3 mb-3.5 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badge}`}
            >
              {quoteCard.sourceType === 'poetry' ? (
                <>
                  <Feather className="w-3 h-3 text-pink-400" />
                  <span>Poetry Verse</span>
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3 text-cyan-400" />
                  <span>PDF Excerpt</span>
                </>
              )}
            </span>

            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${theme.tag}`}
            >
              Quote Card
            </span>
          </div>

          {interactive && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyQuote}
                title="Copy quote text"
                className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-[10px] text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span className="text-[10px] hidden sm:inline">Copy</span>
                  </>
                )}
              </button>

              {quoteCard.sourceDoc && onOpenPdf && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quoteCard.sourceDoc) onOpenPdf(quoteCard.sourceDoc);
                  }}
                  title={`Open original PDF: ${quoteCard.sourceTitle}`}
                  className="p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-cyan-300 hover:text-cyan-100 transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span className="text-[10px] hidden sm:inline">Read Source</span>
                  <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Large Decorative Quote Icon & Content */}
        <div className="relative pl-6 sm:pl-7 pr-2 py-1">
          <Quote
            className={`w-7 h-7 sm:w-8 sm:h-8 absolute -left-1 sm:left-0 -top-1 opacity-60 ${theme.quoteMark} transform -scale-x-100`}
          />

          <blockquote
            className={`text-sm sm:text-base md:text-lg leading-relaxed italic ${fontClass} ${theme.textClass} tracking-wide whitespace-pre-line`}
          >
            "{quoteCard.quoteText}"
          </blockquote>
        </div>

        {/* Attribution & Citation Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {quoteCard.sourceAuthorAvatar ? (
              <img
                src={quoteCard.sourceAuthorAvatar}
                alt={quoteCard.sourceAuthor || 'Author'}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-white/20"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                {(quoteCard.sourceAuthor || quoteCard.sourceTitle || 'Q')[0]}
              </div>
            )}

            <div className="min-w-0 truncate">
              {quoteCard.sourceAuthor && (
                <span className={`font-semibold ${theme.authorClass} mr-1.5`}>
                  — {quoteCard.sourceAuthor}
                </span>
              )}
              <span className="text-white/60 font-mono text-[11px] truncate">
                in <span className="underline decoration-white/20">{quoteCard.sourceTitle}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-white/50 font-mono">
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Curated Verse</span>
          </div>
        </div>
      </div>
    </div>
  );
};
