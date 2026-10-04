import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  X,
  Download,
  Sparkles,
  BookOpen,
  RefreshCw,
  Share2,
  Tag,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Eye,
  Quote,
} from 'lucide-react';
import { PDFDocument } from '../types';

interface PDFViewerModalProps {
  document: PDFDocument | null;
  onClose: () => void;
  onShareToChat?: (doc: PDFDocument) => void;
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'pdf';
    sourceDoc: PDFDocument;
    sourceAuthor?: string;
  }) => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  document,
  onClose,
  onShareToChat,
  onRequestCreateQuoteCard,
}) => {
  if (!document) return null;

  const [loadingAi, setLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary?: string;
    themes?: string[];
    haikuResponse?: string;
    rhythmTone?: string;
  } | null>(null);

  const [fontSize, setFontSize] = useState<number>(15);
  const [paperTheme, setPaperTheme] = useState<'slate' | 'pink' | 'dark'>('slate');
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Text selection handler for Quote Card creation
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
    const text = customText || selectedText || document.excerptText || document.fullText?.slice(0, 200) || '';
    if (onRequestCreateQuoteCard) {
      onRequestCreateQuoteCard({
        quoteText: text,
        sourceTitle: document.title,
        sourceType: 'pdf',
        sourceDoc: document,
        sourceAuthor: document.category ? `Vault • ${document.category}` : undefined,
      });
    }
    setSelectionCoords(null);
  };

  // Scroll Progress Calculator
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setScrollProgress(100);
    } else {
      const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
      setScrollProgress(Math.round(pct));
    }
  };

  useEffect(() => {
    // Reset scroll progress when document opens
    setScrollProgress(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [document?.id]);

  const handleAnalyzeDocument = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.title,
          textContent: document.fullText || document.excerptText,
          type: document.category,
        }),
      });

      const data = await res.json();
      setAiAnalysis(data);
    } catch (err) {
      console.error('Failed to analyze document:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDownload = () => {
    if (document.fileDataUrl) {
      const a = window.document.createElement('a');
      a.href = document.fileDataUrl;
      a.download = document.fileName;
      a.click();
    } else {
      const blob = new Blob([document.fullText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.fileName.replace('.pdf', '.txt');
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/50 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[0_0_40px_rgba(244,114,182,0.35),0_15px_40px_rgba(0,0,0,0.8)] overflow-hidden relative">
        
        {/* Top Visual Reading Progress Indicator Bar */}
        <div className="w-full bg-black/60 h-1.5 relative overflow-hidden border-b border-pink-500/20">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(236,72,153,0.8)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="p-4 border-b border-pink-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-500/40 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  {document.category} PDF
                </span>
                <span className="text-xs text-slate-400">{document.fileSize} • {document.totalPages} Pages</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm sm:text-base">{document.title}</h3>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {onRequestCreateQuoteCard && (
              <button
                onClick={() => handleLaunchQuoteCard()}
                title={selectedText ? 'Create Quote Card from selected text' : 'Create Quote Card from document'}
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-[0_0_12px_rgba(236,72,153,0.4)] border border-pink-400/50 cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {selectedText ? 'Quote Selection' : 'Create Quote Card'}
                </span>
                {selectedText && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-ping" />}
              </button>
            )}

            <button
              onClick={handleAnalyzeDocument}
              disabled={loadingAi}
              className="flex items-center gap-1.5 bg-pink-600/80 hover:bg-pink-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-pink-400/30 cursor-pointer"
            >
              {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-pink-200" />}
              <span className="hidden sm:inline">{aiAnalysis ? 'Re-Analyze' : 'AI Analysis & Haiku'}</span>
            </button>

            {onShareToChat && (
              <button
                onClick={() => {
                  onShareToChat(document);
                  onClose();
                }}
                className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-pink-300 px-3 py-1.5 rounded-xl text-xs font-semibold border border-pink-500/30 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-slate-200 rounded-xl border border-pink-500/30 transition-all"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-neutral-900 hover:bg-neutral-800 text-slate-400 hover:text-white rounded-xl border border-pink-500/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reader Customization Toolbar & Scroll Progress Percentage */}
        <div className="px-4 py-2 bg-black/60 border-b border-pink-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Reader Theme:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaperTheme('slate')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  paperTheme === 'slate' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Midnight
              </button>
              <button
                onClick={() => setPaperTheme('pink')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  paperTheme === 'pink' ? 'bg-pink-600 text-white font-bold shadow-[0_0_8px_rgba(244,114,182,0.4)]' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Light Pink
              </button>
            </div>
          </div>

          {/* Reading Progress Percentage Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-pink-500/30 font-mono text-[11px] text-pink-300">
              <BookOpen className="w-3 h-3 text-pink-400" />
              <span>{scrollProgress}% Read</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                className="p-1 hover:text-white bg-slate-800 rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] text-slate-300">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(22, fontSize + 1))}
                className="p-1 hover:text-white bg-slate-800 rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Analysis Drawer if generated */}
        {aiAnalysis && (
          <div className="bg-purple-950/40 border-b border-purple-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Literary Breakdown & Tone Analysis</span>
              </div>
              {aiAnalysis.rhythmTone && (
                <span className="text-[10px] bg-purple-500/20 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-500/30 font-semibold">
                  Tone: {aiAnalysis.rhythmTone}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              {aiAnalysis.summary}
            </p>

            {aiAnalysis.haikuResponse && (
              <div className="bg-purple-900/40 p-3 rounded-xl border border-purple-500/30 font-serif italic text-xs text-purple-200">
                <span className="text-[10px] uppercase font-sans font-bold text-purple-400 block mb-1">
                  AI Haiku Response:
                </span>
                {aiAnalysis.haikuResponse}
              </div>
            )}

            {aiAnalysis.themes && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {aiAnalysis.themes.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md border border-indigo-500/30 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Document Text / Preview Canvas */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          onMouseUp={handleTextSelection}
          onTouchEnd={handleTextSelection}
          onKeyUp={handleTextSelection}
          className={`flex-1 p-6 sm:p-8 overflow-y-auto leading-relaxed transition-all relative ${
            paperTheme === 'pink'
              ? 'bg-[#251b22] text-[#fce7f3] font-serif selection:bg-pink-500/30'
              : 'bg-slate-900 text-slate-200 font-serif selection:bg-pink-500/40'
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {document.fileDataUrl ? (
            <div className="space-y-4">
              <object
                data={document.fileDataUrl}
                type="application/pdf"
                className="w-full h-[550px] rounded-xl border border-slate-800"
              >
                <div className="p-6 bg-slate-950 rounded-xl text-center space-y-3">
                  <p className="text-xs text-slate-300">
                    PDF Document Loaded. Reading text excerpt below:
                  </p>
                  <pre className="text-left whitespace-pre-wrap font-serif text-sm bg-slate-900 p-4 rounded-xl border border-slate-800">
                    {document.fullText || document.excerptText}
                  </pre>
                </div>
              </object>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 select-text">
              <div className="text-center border-b border-slate-800/80 pb-6">
                <span className="text-xs font-sans uppercase tracking-widest text-indigo-400 font-bold">
                  {document.category}
                </span>
                <h1 className="text-2xl font-bold tracking-tight mt-1 text-slate-100">
                  {document.title}
                </h1>
                <p className="text-xs font-sans text-slate-400 mt-2">
                  Uploaded to VibePulse Vault • {document.uploadedAt}
                </p>
              </div>

              <div className="whitespace-pre-line leading-loose text-justify font-serif">
                {document.fullText || document.excerptText}
              </div>
            </div>
          )}
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
