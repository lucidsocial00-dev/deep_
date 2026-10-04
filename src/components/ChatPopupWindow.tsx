import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Lock,
  Send,
  Paperclip,
  FileText,
  ShieldCheck,
  CheckCheck,
  Zap,
  BookOpen,
  ChevronDown,
  Minus,
  X,
  ArrowLeft,
  Search,
  Maximize2,
  Minimize2,
  Users,
  Sparkles,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { ChatConversation, DirectMessage, PDFDocument, Post, ReadingLink, User as UserType, CompatibilityQuestion } from '../types';
import { calculateCompatibility } from '../utils/compatibility';
import { CURATED_GROUP_READINGS, extractUrlsFromText, estimateReadingFromUrl } from '../utils/readingEstimator';
import { CompatibilityQuestionCard } from './CompatibilityQuestionCard';
import { CompatibilityQuestionModal } from './CompatibilityQuestionModal';

interface ChatPopupWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  conversations: ChatConversation[];
  currentUser: UserType;
  allPdfs: PDFDocument[];
  allPosts?: Post[];
  activeChatId?: string | null;
  onSelectChat?: (chatId: string) => void;
  onOpenPdf: (doc: PDFDocument) => void;
  onOpenReadingLink?: (link: ReadingLink, chatContext?: { chatId: string; chatTitle: string }) => void;
  onSendMessage: (
    chatId: string,
    content: string,
    attachedDoc?: PDFDocument,
    compatibilityQuestion?: CompatibilityQuestion,
    attachedReadingLink?: ReadingLink
  ) => void;
  onAnswerCompatibilityQuestion?: (chatId: string, messageId: string, questionId: string, optionId: string, simulatePeer?: boolean) => void;
  onInspectCompatibility?: (userId: string) => void;
}

export const ChatPopupWindow: React.FC<ChatPopupWindowProps> = ({
  isOpen,
  onClose,
  onToggleOpen,
  conversations,
  currentUser,
  allPdfs,
  allPosts = [],
  activeChatId: externalActiveChatId,
  onSelectChat,
  onOpenPdf,
  onOpenReadingLink,
  onSendMessage,
  onAnswerCompatibilityQuestion,
  onInspectCompatibility,
}) => {
  const [internalActiveChatId, setInternalActiveChatId] = useState<string>(
    conversations[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'chat' | 'list'>('chat');
  const [isExpandedSize, setIsExpandedSize] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedPdfToAttach, setSelectedPdfToAttach] = useState<PDFDocument | null>(null);
  const [selectedReadingLinkToAttach, setSelectedReadingLinkToAttach] = useState<ReadingLink | null>(null);
  const [showPdfPicker, setShowPdfPicker] = useState(false);
  const [showReadingPicker, setShowReadingPicker] = useState(false);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync external activeChatId if provided
  useEffect(() => {
    if (externalActiveChatId) {
      setInternalActiveChatId(externalActiveChatId);
      setViewMode('chat');
    }
  }, [externalActiveChatId]);

  const activeChat = useMemo(() => {
    return conversations.find((c) => c.id === internalActiveChatId) || conversations[0];
  }, [conversations, internalActiveChatId]);

  // Total unread count across all conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [conversations]);

  // Filtered conversations for list view search
  const filteredConversations = useMemo(() => {
    if (!chatSearchQuery.trim()) return conversations;
    const q = chatSearchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participant.name.toLowerCase().includes(q) ||
        c.participant.handle.toLowerCase().includes(q) ||
        c.lastMessage.content.toLowerCase().includes(q)
    );
  }, [conversations, chatSearchQuery]);

  // Active participant compatibility score
  const activeCompatibility = useMemo(() => {
    if (!activeChat?.participant) return null;
    return calculateCompatibility(currentUser, activeChat.participant, allPosts);
  }, [currentUser, activeChat?.participant, allPosts]);

  // Auto scroll to bottom of messages when chat opens or message sent
  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, viewMode, activeChat?.lastMessage, activeChat?.messages?.length]);

  const handleSelectConversation = (chatId: string) => {
    setInternalActiveChatId(chatId);
    if (onSelectChat) onSelectChat(chatId);
    setViewMode('chat');
    setShowPdfPicker(false);
    setShowReadingPicker(false);
    setSelectedPdfToAttach(null);
    setSelectedReadingLinkToAttach(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() && !selectedPdfToAttach && !selectedReadingLinkToAttach) return;
    if (!activeChat) return;

    onSendMessage(
      activeChat.id,
      messageInput.trim(),
      selectedPdfToAttach || undefined,
      undefined,
      selectedReadingLinkToAttach || undefined
    );
    setMessageInput('');
    setSelectedPdfToAttach(null);
    setSelectedReadingLinkToAttach(null);
    setShowPdfPicker(false);
    setShowReadingPicker(false);
  };

  const handleSendQuestion = (question: CompatibilityQuestion) => {
    if (!activeChat) return;
    onSendMessage(activeChat.id, '', undefined, question);
  };

  const chatMessages: DirectMessage[] =
    activeChat?.messages || (activeChat?.lastMessage ? [activeChat.lastMessage] : []);

  // If pop-up is closed, render the floating bottom-right launcher button
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
        <button
          onClick={onToggleOpen}
          className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-950/90 hover:bg-neutral-900 border border-pink-500/50 hover:border-pink-400 text-slate-100 shadow-[0_0_20px_rgba(236,72,153,0.35)] hover:shadow-[0_0_30px_rgba(236,72,153,0.55)] transition-all duration-300 cursor-pointer active:scale-95"
          title="Open Encrypted Chat (Bottom Right)"
        >
          {/* Subtle Cyber Glow Ring */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500/30 to-cyan-500/30 blur opacity-40 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center gap-2">
            <div className="relative">
              <div className="w-7 h-7 rounded-xl bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-pink-300">
                <MessageSquare className="w-4 h-4 text-pink-400" />
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-neutral-950 absolute -top-0.5 -right-0.5 animate-pulse" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-space-mono text-xs font-bold text-slate-100">Chat</span>
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" />
                  E2EE
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {conversations.length} {conversations.length === 1 ? 'contact' : 'contacts'}
              </span>
            </div>

            {totalUnreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-pink-500 text-white font-bold text-[10px] rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-bounce">
                {totalUnreadCount}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  // Open Pop-Up Window in Bottom-Right Corner
  return (
    <div
      className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col bg-neutral-950/85 backdrop-blur-2xl border border-pink-500/60 rounded-2xl shadow-[0_0_35px_rgba(236,72,153,0.35)] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5 ${
        isExpandedSize
          ? 'w-[calc(100vw-32px)] sm:w-[480px] md:w-[540px] h-[600px] max-h-[90vh]'
          : 'w-[calc(100vw-32px)] sm:w-[380px] md:w-[420px] h-[520px] max-h-[85vh]'
      }`}
    >
      {/* Top Cyber Accent Strip */}
      <div className="h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shrink-0" />

      {/* Pop-up Window Header */}
      <div className="px-3.5 py-2.5 bg-neutral-900/75 border-b border-pink-500/30 flex items-center justify-between gap-2 shrink-0">
        {viewMode === 'chat' && activeChat ? (
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => setViewMode('list')}
              title="All Conversations"
              className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-pink-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="relative shrink-0">
              <img
                src={activeChat.participant.avatar}
                alt={activeChat.participant.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-pink-500/50"
              />
              <span className="w-2 h-2 rounded-full bg-sky-400 ring-2 ring-neutral-900 absolute -bottom-0.5 -right-0.5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs text-slate-100 truncate">{activeChat.participant.name}</h4>
                {activeCompatibility && (
                  <button
                    onClick={() => onInspectCompatibility && onInspectCompatibility(activeChat.participant.id)}
                    title="View Compatibility Score"
                    className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-pink-950/70 border border-pink-400/40 text-[9px] text-pink-300 font-mono font-bold hover:border-pink-300"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-pink-400 fill-pink-400" />
                    {activeCompatibility.matchPercentage}%
                  </button>
                )}
              </div>
              <p className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span className="truncate">AES-256-GCM Direct Session</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-pink-300 shrink-0">
              <MessageSquare className="w-4 h-4 text-pink-400" />
            </div>
            <div className="min-w-0">
              <h4 className="font-space-mono font-bold text-xs text-slate-100 truncate">Encrypted Messages</h4>
              <p className="text-[10px] text-slate-400 font-mono">Zero-Knowledge Peer Sessions</p>
            </div>
          </div>
        )}

        {/* Window Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {viewMode === 'chat' && (
            <button
              onClick={() => setViewMode('list')}
              title="Switch Conversation"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-neutral-800 text-[10px] flex items-center gap-1 px-1.5"
            >
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Chats</span>
            </button>
          )}

          <button
            onClick={() => setIsExpandedSize(!isExpandedSize)}
            title={isExpandedSize ? 'Compact Window' : 'Expand Window'}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-neutral-800 transition-colors hidden sm:block"
          >
            {isExpandedSize ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleOpen}
            title="Minimize to bottom-right corner"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-neutral-800 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            title="Close Pop-up"
            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pop-up Window Body */}
      <div className="flex-1 flex flex-col min-h-0 bg-neutral-950/80">
        
        {/* VIEW 1: CONVERSATION LIST */}
        {viewMode === 'list' ? (
          <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-pink-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search encrypted chats or contacts..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full bg-neutral-900 border border-pink-500/30 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 divide-y divide-neutral-900/60 pr-1 custom-scrollbar">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No conversations found.
                </div>
              ) : (
                filteredConversations.map((chat) => {
                  const isActive = chat.id === activeChat?.id;
                  const comp = calculateCompatibility(currentUser, chat.participant, allPosts);
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectConversation(chat.id)}
                      className={`pt-1.5 pb-1.5 px-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-pink-950/40 border border-pink-500/40 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
                          : 'hover:bg-neutral-900/80 border border-transparent'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={chat.participant.avatar}
                          alt={chat.participant.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-neutral-950 absolute -bottom-0.5 -right-0.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-semibold text-xs text-slate-100 truncate">
                            {chat.participant.name}
                          </h4>
                          <span className="text-[10px] text-pink-400 font-mono font-bold shrink-0 ml-1">
                            {comp.matchPercentage}% match
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {chat.lastMessage.content}
                        </p>
                      </div>

                      {chat.unreadCount > 0 && (
                        <span className="w-4 h-4 bg-pink-500 text-white font-bold text-[9px] rounded-full flex items-center justify-center shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE CHAT TIMELINE */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {/* E2EE Info banner */}
              <div className="text-center my-1">
                <span className="text-[9px] text-slate-500 bg-neutral-900/80 px-2.5 py-1 rounded-full border border-pink-500/20 inline-flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  E2EE active with {activeChat.participant.name}
                </span>
              </div>

              {/* Render all messages */}
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 max-w-[88%] ${
                      isMe ? 'ml-auto justify-end' : ''
                    }`}
                  >
                    {!isMe && (
                      <img
                        src={activeChat.participant.avatar}
                        alt={activeChat.participant.name}
                        className="w-6 h-6 rounded-lg object-cover shrink-0 mt-0.5"
                      />
                    )}

                    <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      {msg.compatibilityQuestion ? (
                        <div className="w-full">
                          <CompatibilityQuestionCard
                            question={msg.compatibilityQuestion}
                            currentUser={currentUser}
                            participant={activeChat.participant}
                            isSenderMe={isMe}
                            onAnswerQuestion={(qId, optId, simulate) => {
                              if (onAnswerCompatibilityQuestion) {
                                onAnswerCompatibilityQuestion(
                                  activeChat.id,
                                  msg.id,
                                  qId,
                                  optId,
                                  simulate
                                );
                              }
                            }}
                            onSimulatePartnerAnswer={(qId) => {
                              if (onAnswerCompatibilityQuestion) {
                                onAnswerCompatibilityQuestion(
                                  activeChat.id,
                                  msg.id,
                                  qId,
                                  msg.compatibilityQuestion?.senderAnswer || 'opt_raw_vulnerability',
                                  true
                                );
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div
                          className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-pink-600 text-white rounded-tr-none'
                              : 'bg-neutral-900/90 text-slate-100 rounded-tl-none border border-pink-500/30'
                          }`}
                        >
                          <p>{msg.content}</p>

                          {msg.attachedDocument && (
                            <div className="mt-2 pt-2 border-t border-pink-500/20 flex items-center justify-between gap-2 bg-neutral-950/60 p-1.5 rounded-lg">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-200 text-[10px] truncate">
                                    {msg.attachedDocument.title}
                                  </p>
                                  <span className="text-[8px] text-slate-400">
                                    {msg.attachedDocument.category} PDF
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => onOpenPdf(msg.attachedDocument!)}
                                className="bg-pink-600 hover:bg-pink-500 text-white px-2 py-0.5 rounded text-[9px] font-semibold flex items-center gap-0.5 shrink-0 cursor-pointer"
                              >
                                <BookOpen className="w-2.5 h-2.5" />
                                <span>View</span>
                              </button>
                            </div>
                          )}

                          {/* Attached Reading Link Card */}
                          {msg.attachedReadingLink && (
                            <div className="mt-2 pt-2 border-t border-pink-500/20 bg-neutral-950/80 p-2 rounded-xl space-y-1.5 border border-pink-500/30">
                              <div className="flex items-center justify-between text-[9px]">
                                <span className="text-pink-400 font-semibold truncate max-w-[120px]">
                                  {msg.attachedReadingLink.domain}
                                </span>
                                <span className="text-amber-300 font-bold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30">
                                  +{msg.attachedReadingLink.readingPoints} pts
                                </span>
                              </div>
                              <p className="font-bold text-slate-100 text-[11px] line-clamp-2 leading-tight">
                                {msg.attachedReadingLink.title}
                              </p>
                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[9px] text-slate-400">
                                  {msg.attachedReadingLink.readTimeFormatted}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenReadingLink?.(msg.attachedReadingLink!, {
                                      chatId: activeChat.id,
                                      chatTitle: activeChat.participant.name,
                                    })
                                  }
                                  className="bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                >
                                  <BookOpen className="w-2.5 h-2.5" />
                                  <span>Read (+{msg.attachedReadingLink.readingPoints} pts)</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Detected URL in text if no explicit attached reading link */}
                          {!msg.attachedReadingLink && (() => {
                            const urls = extractUrlsFromText(msg.content);
                            if (!urls || urls.length === 0) return null;
                            const detected = estimateReadingFromUrl(urls[0], 'Poetry');
                            return (
                              <div className="mt-2 pt-2 border-t border-pink-500/20 bg-neutral-950/80 p-2 rounded-xl space-y-1.5 border border-pink-500/30">
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="text-pink-400 font-semibold truncate max-w-[120px]">
                                    {detected.domain}
                                  </span>
                                  <span className="text-amber-300 font-bold bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/30">
                                    +{detected.readingPoints} pts
                                  </span>
                                </div>
                                <p className="font-bold text-slate-100 text-[11px] line-clamp-2 leading-tight">
                                  {detected.title}
                                </p>
                                <div className="flex items-center justify-between pt-0.5">
                                  <span className="text-[9px] text-slate-400">
                                    {detected.readTimeFormatted}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenReadingLink?.(detected, {
                                        chatId: activeChat.id,
                                        chatTitle: activeChat.participant.name,
                                      })
                                    }
                                    className="bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                  >
                                    <BookOpen className="w-2.5 h-2.5" />
                                    <span>Read (+{detected.readingPoints} pts)</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()}

                          <div
                            className={`flex items-center gap-1 text-[8px] mt-1 ${
                              isMe ? 'justify-end text-pink-200' : 'justify-end text-slate-500'
                            }`}
                          >
                            <span>{msg.timestamp}</span>
                            {isMe && <CheckCheck className="w-3 h-3 text-pink-200" />}
                          </div>
                        </div>
                      )}
                    </div>

                    {isMe && (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-6 h-6 rounded-lg object-cover shrink-0 mt-0.5 ring-1 ring-pink-400"
                      />
                    )}
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Attached PDF Preview in composer */}
            {selectedPdfToAttach && (
              <div className="px-3 py-1.5 bg-pink-950/80 border-t border-pink-500/40 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-pink-300 text-[11px] truncate">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    PDF Attached: <strong>{selectedPdfToAttach.title}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPdfToAttach(null)}
                  className="text-slate-400 hover:text-rose-400 font-bold ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Attached Reading Link Preview in composer */}
            {selectedReadingLinkToAttach && (
              <div className="px-3 py-1.5 bg-pink-950/80 border-t border-pink-500/40 flex items-center justify-between text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-pink-300 text-[11px] truncate">
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                  <span className="truncate">
                    Reading: <strong>{selectedReadingLinkToAttach.title}</strong> (+{selectedReadingLinkToAttach.readingPoints} pts)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReadingLinkToAttach(null)}
                  className="text-slate-400 hover:text-rose-400 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Reading Link Picker Drawer inside pop-up */}
            {showReadingPicker && (
              <div className="p-2.5 bg-neutral-900 border-t border-pink-500/30 space-y-1.5 max-h-36 overflow-y-auto shrink-0 custom-scrollbar">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Compass className="w-3 h-3" /> Attach Reading (+Points):
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReadingPicker(false)}
                    className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {Object.entries(CURATED_GROUP_READINGS).flatMap(([tag, links]) =>
                    links.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedReadingLinkToAttach(item);
                          setShowReadingPicker(false);
                        }}
                        className="bg-neutral-950/80 p-2 rounded-lg border border-pink-500/20 hover:border-pink-400 cursor-pointer text-[11px] flex items-center justify-between transition-colors gap-1.5"
                      >
                        <div className="truncate pr-1 min-w-0">
                          <p className="font-semibold text-slate-200 truncate">{item.title}</p>
                          <span className="text-[9px] text-pink-400">
                            #{tag} • {item.readTimeFormatted}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                          +{item.readingPoints} pts
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PDF Attachment Picker Drawer inside pop-up */}
            {showPdfPicker && (
              <div className="p-2.5 bg-neutral-900 border-t border-pink-500/30 space-y-1.5 max-h-36 overflow-y-auto shrink-0 custom-scrollbar">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Attach PDF or Poetry:
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {allPdfs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedPdfToAttach(doc);
                        setShowPdfPicker(false);
                      }}
                      className="bg-neutral-950/80 p-1.5 rounded-lg border border-pink-500/20 hover:border-pink-400 cursor-pointer text-[11px] flex items-center justify-between transition-colors"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-200 truncate">{doc.title}</p>
                        <span className="text-[9px] text-pink-400">{doc.category}</span>
                      </div>
                      <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Composer Input Form */}
            <form
              onSubmit={handleSend}
              className="p-2.5 border-t border-pink-500/30 bg-neutral-900/75 flex items-center gap-1.5 shrink-0"
            >
              <button
                type="button"
                onClick={() => {
                  setShowPdfPicker(!showPdfPicker);
                  setShowReadingPicker(false);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  selectedPdfToAttach
                    ? 'bg-pink-600 text-white border-pink-400'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-slate-300 border-pink-500/30'
                }`}
                title="Attach PDF"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>

              {/* Reading Link Picker Button */}
              <button
                type="button"
                onClick={() => {
                  setShowReadingPicker(!showReadingPicker);
                  setShowPdfPicker(false);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                  selectedReadingLinkToAttach
                    ? 'bg-pink-600 text-white border-pink-400'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-pink-400 border-pink-500/30'
                }`}
                title="Attach Reading Link (+points)"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>

              {/* Quick Ask Compatibility Question Button */}
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(true)}
                className="p-1.5 rounded-xl bg-pink-950/70 hover:bg-pink-900 border border-pink-500/50 text-pink-300 transition-all hover:scale-105 cursor-pointer"
                title="Send Compatibility Question"
              >
                <Zap className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
              </button>

              <input
                type="text"
                placeholder={`Encrypted message to ${activeChat.participant.name}...`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-neutral-950 border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-400"
              />

              <button
                type="submit"
                disabled={!messageInput.trim() && !selectedPdfToAttach && !selectedReadingLinkToAttach}
                className="bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-[0_0_10px_rgba(236,72,153,0.4)] cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Compatibility Question Modal in Popup Window */}
      {activeChat && (
        <CompatibilityQuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          participant={activeChat.participant}
          onSendQuestion={handleSendQuestion}
        />
      )}
    </div>
  );
};
