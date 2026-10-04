import React, { useState } from 'react';
import { Bookmark, FileText, Sparkles, BookOpen, Clock, Flame, Image as ImageIcon } from 'lucide-react';
import { MemeItem, PDFDocument, Post, PostSong, User, WaveformComment, PostMood } from '../types';
import { MemeCollectorView } from './MemeCollectorView';
import { SavedPostsView } from './SavedPostsView';
import { PDFsLibraryView } from './PDFsLibraryView';

interface MemoriesLibraryCombinedViewProps {
  currentUser: User;
  allPosts: Post[];
  allPdfs: PDFDocument[];
  allUsers?: User[];
  initialSubView?: 'memes' | 'saved_poems' | 'library';
  onLike: (postId: string) => void;
  onDislike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick: (tag: string) => void;
  onOpenPdf: (doc: PDFDocument) => void;
  onShareToChat?: (postOrDoc: Post | PDFDocument | any) => void;
  onSharePost?: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onShareMemeToFeed?: (postData: { content: string; image?: string; hashtags: string[] }) => void;
  onToggleBookmarkPost: (postId: string, folderId?: string) => void;
  onCreateBookmarkFolder?: (folderName: string, postIdToSave?: string) => void;
  onToggleBookmarkDoc: (docId: string) => void;
  onToggleSaveSong?: (song: PostSong, postId?: string) => void;
  onAddWaveformComment?: (songId: string, comment: WaveformComment, postId?: string) => void;
  onNavigateToFeed: () => void;
  onInspectCompatibility?: (userId: string) => void;
  onOpenUploadPdf?: () => void;
  onCityClick?: (cityName: string) => void;
  onOpenReadingLink?: (link: any) => void;
  onClaimReadingPoints?: (post: Post, points: number, hashtag: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onRequestCreateQuoteCard?: (data: {
    quoteText: string;
    sourceTitle: string;
    sourceType: 'poetry' | 'pdf';
    sourceAuthor?: string;
    sourceAuthorAvatar?: string;
    sourceId?: string;
    sourceDoc?: PDFDocument;
  }) => void;
  onMoodClick?: (mood: PostMood) => void;
}

export const MemoriesLibraryCombinedView: React.FC<MemoriesLibraryCombinedViewProps> = ({
  currentUser,
  allPosts,
  allPdfs,
  allUsers = [],
  initialSubView = 'memes',
  onLike,
  onDislike,
  onAddComment,
  onHashtagClick,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onShareMemeToFeed,
  onToggleBookmarkPost,
  onCreateBookmarkFolder,
  onToggleBookmarkDoc,
  onToggleSaveSong,
  onAddWaveformComment,
  onNavigateToFeed,
  onInspectCompatibility,
  onCityClick,
  onOpenReadingLink,
  onClaimReadingPoints,
  onVotePoll,
  onRequestCreateQuoteCard,
  onMoodClick,
}) => {
  const [subView, setSubView] = useState<'memes' | 'saved_poems' | 'library'>(initialSubView || 'memes');

  const savedPostsCount = currentUser.savedPostIds?.length || 0;
  const savedDocsCount = currentUser.savedDocIds?.length || 0;
  const totalPdfCount = allPdfs.length;

  return (
    <div className="space-y-6">
      {/* Top Combined Hub Switcher Banner */}
      <div className="bg-black/70 backdrop-blur-md border border-pink-500/40 rounded-2xl p-4 sm:p-6 shadow-[0_0_15px_rgba(244,114,182,0.15),0_8px_25px_rgba(0,0,0,0.6)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-[0_0_8px_rgba(236,72,153,0.3)]">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Encrypted Archives & Creative Library</span>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Creative Vault & Library</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Explore your visual meme vault and studio, saved poems, and shared PDF manuscripts.
            </p>
          </div>

          {/* Subview Toggle Buttons */}
          <div className="flex items-center gap-2 bg-neutral-900/90 p-1.5 rounded-2xl border border-pink-500/30 shrink-0 overflow-x-auto">
            <button
              onClick={() => setSubView('memes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subView === 'memes'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-pink-300" />
              <span>Meme Creator</span>
            </button>

            <button
              onClick={() => setSubView('saved_poems')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subView === 'saved_poems'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-pink-300" />
              <span>Saved Poems</span>
              {savedPostsCount > 0 && (
                <span className="text-[10px] bg-pink-950 border border-pink-400/50 text-pink-200 px-1.5 py-0.5 rounded-full font-mono">
                  {savedPostsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubView('library')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                subView === 'library'
                  ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.6)]'
                  : 'text-slate-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-pink-300" />
              <span>PDF Library</span>
              <span className="text-[10px] bg-pink-950 border border-pink-400/50 text-pink-200 px-1.5 py-0.5 rounded-full font-mono">
                {totalPdfCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Subview Component Renders */}
      {subView === 'memes' && (
        <MemeCollectorView
          currentUser={currentUser}
          allPosts={allPosts}
          onShareToFeed={onShareMemeToFeed}
          onShareToChat={(meme) => {
            if (onShareToChat) {
              onShareToChat({
                id: `post_meme_${meme.id}`,
                authorId: currentUser.id,
                authorName: currentUser.name,
                authorHandle: currentUser.handle,
                authorAvatar: currentUser.avatar,
                timestamp: 'Just now',
                content: `${meme.title}\n${meme.caption || ''}`,
                hashtags: meme.tags,
                image: meme.url,
                likesCount: meme.likesCount,
                dislikesCount: 0,
                commentsCount: 0,
                likedBy: [],
                dislikedBy: [],
                comments: [],
              } as Post);
            }
          }}
          onHashtagClick={onHashtagClick}
        />
      )}

      {subView === 'saved_poems' && (
        <SavedPostsView
          currentUser={currentUser}
          allPosts={allPosts}
          allUsers={allUsers}
          onLike={onLike}
          onDislike={onDislike}
          onAddComment={onAddComment}
          onHashtagClick={onHashtagClick}
          onOpenPdf={onOpenPdf}
          onShareToChat={onShareToChat as (post: Post) => void}
          onSharePost={onSharePost}
          onToggleBookmarkPost={onToggleBookmarkPost}
          onCreateBookmarkFolder={onCreateBookmarkFolder}
          onToggleSaveSong={onToggleSaveSong}
          onAddWaveformComment={onAddWaveformComment}
          onNavigateToFeed={onNavigateToFeed}
          onInspectCompatibility={onInspectCompatibility}
          onCityClick={onCityClick}
          onOpenReadingLink={onOpenReadingLink}
          onClaimReadingPoints={onClaimReadingPoints}
          onVotePoll={onVotePoll}
          onRequestCreateQuoteCard={onRequestCreateQuoteCard}
          onMoodClick={onMoodClick}
        />
      )}

      {subView === 'library' && (
        <PDFsLibraryView
          documents={allPdfs}
          onOpenPdf={onOpenPdf}
          onShareToChat={onShareToChat as (doc: PDFDocument) => void}
          savedDocIds={currentUser.savedDocIds || []}
          onToggleBookmarkDoc={onToggleBookmarkDoc}
          onRequestCreateQuoteCard={onRequestCreateQuoteCard}
        />
      )}
    </div>
  );
};

