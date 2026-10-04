import React, { useState } from 'react';
import { FileText, BookOpen, Search, Filter, Sparkles, Share2, Bookmark, BookmarkCheck, Quote } from 'lucide-react';
import { PDFDocument } from '../types';

interface PDFsLibraryViewProps {
  documents: PDFDocument[];
  onOpenPdf: (doc: PDFDocument) => void;
  onShareToChat?: (doc: PDFDocument) => void;
  onOpenUpload?: () => void;
  savedDocIds?: string[];
  onToggleBookmarkDoc?: (docId: string) => void;
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceDoc?: PDFDocument;
  }) => void;
}

export const PDFsLibraryView: React.FC<PDFsLibraryViewProps> = ({
  documents,
  onOpenPdf,
  onShareToChat,
  onOpenUpload,
  savedDocIds = [],
  onToggleBookmarkDoc,
  onRequestCreateQuoteCard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterQuery, setFilterQuery] = useState('');

  const categories = ['All', 'Poetry', 'Research', 'Essay', 'Journal'];

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesQuery =
      doc.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      doc.excerptText.toLowerCase().includes(filterQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-black/70 backdrop-blur-md border border-pink-500/40 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(244,114,182,0.12),0_8px_25px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_6px_rgba(244,114,182,0.2)]">
                <FileText className="w-3.5 h-3.5 text-pink-300" /> PDF & Literary Vault
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Shared Documents & Poetry Library</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Access verse booklets, privacy manifestos, acoustic music scores, and community research papers shared across deep_.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/70 backdrop-blur-md p-4 rounded-2xl border border-pink-500/30 shadow-[0_0_12px_rgba(244,114,182,0.1),0_8px_25px_rgba(0,0,0,0.5)]">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white shadow-[0_0_8px_rgba(244,114,182,0.35)]'
                  : 'bg-neutral-900 text-slate-300 hover:bg-neutral-800 border border-pink-500/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
          />
        </div>

      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-400/10 via-pink-300/15 to-pink-500/10 blur-md opacity-30 group-hover:opacity-50 transition-all duration-300 pointer-events-none" />
            <div
              className="relative bg-black/75 backdrop-blur-md border border-pink-500/40 hover:border-pink-400 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 card-pink-glow h-full"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-950/60 text-pink-400 border border-pink-500/40 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                    {doc.category}
                  </span>
                </div>

                <h3 className="font-bold text-slate-100 text-base mb-1 group-hover:text-pink-300 transition-colors">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-400 mb-3 font-mono">
                  {doc.fileName} • {doc.fileSize} • {doc.totalPages} Pages
                </p>

                <div className="bg-neutral-900 p-3 rounded-xl border border-pink-500/20 mb-4 font-serif text-xs italic text-slate-300 line-clamp-3">
                  "{doc.excerptText}"
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-pink-500/20 gap-2">
                <button
                  onClick={() => onOpenPdf(doc)}
                  className="flex-1 bg-pink-600 hover:bg-pink-500 text-white py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(236,72,153,0.4)] border border-pink-400/50"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read in Reader</span>
                </button>

                {onRequestCreateQuoteCard && (
                  <button
                    onClick={() => onRequestCreateQuoteCard({
                      quoteText: doc.excerptText,
                      sourceTitle: doc.title,
                      sourceType: doc.category.toLowerCase() === 'poetry' ? 'poetry' : 'pdf',
                      sourceAuthor: 'Literature Vault',
                      sourceDoc: doc,
                    })}
                    className="p-2 bg-neutral-900 hover:bg-pink-950/70 text-pink-300 hover:text-pink-100 rounded-xl border border-pink-500/30 transition-all shadow-[0_0_6px_rgba(236,72,153,0.2)]"
                    title="Create Quote Card from this Document"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                )}

                {onToggleBookmarkDoc && (
                  <button
                    onClick={() => onToggleBookmarkDoc(doc.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      savedDocIds.includes(doc.id)
                        ? 'bg-pink-500/20 text-pink-300 border-pink-400/60 shadow-[0_0_8px_rgba(244,114,182,0.3)]'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-pink-300/80 hover:text-pink-200 border-pink-500/30'
                    }`}
                    title={savedDocIds.includes(doc.id) ? 'Bookmarked in Encrypted Vault' : 'Save PDF to Encrypted Storage'}
                  >
                    {savedDocIds.includes(doc.id) ? (
                      <BookmarkCheck className="w-4 h-4 fill-pink-400/30 text-pink-300" />
                    ) : (
                      <Bookmark className="w-4 h-4 text-pink-300" />
                    )}
                  </button>
                )}

                {onShareToChat && (
                  <button
                    onClick={() => onShareToChat(doc)}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 text-pink-400 hover:text-white rounded-xl border border-pink-500/30 transition-all shadow-[0_0_6px_rgba(236,72,153,0.2)]"
                    title="Share in Chat"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
