import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Eye,
  EyeOff,
  Save,
  Fingerprint,
  Check,
  AlertTriangle,
  FileText,
  Share2,
  BookOpen,
  Key,
  Camera,
  Image as ImageIcon,
  VolumeX,
  Volume2,
  UserX,
  UserCheck,
  Clock,
  Sparkles,
  Search,
  X,
  PlusCircle,
  Plus,
  Feather,
  Heart,
  MessageSquare,
  Zap,
  ThumbsDown,
  UserPlus,
  Users,
  Globe,
  Trash2,
  ExternalLink,
  Trophy,
  TrendingUp,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { DecryptedVaultData, HashtagGroup, HashtagTrend, PDFDocument, Post, SavedBookmark, User, PostMood } from '../types';
import { decryptProfileVault, encryptProfileVault } from '../utils/crypto';
import { calculateCompatibility } from '../utils/compatibility';
import { ProfilePhotosSection } from './ProfilePhotosSection';
import { PostCard } from './PostCard';
import { UploadProfilePhotoModal } from './UploadProfilePhotoModal';
import { BadgesVaultSection } from './BadgesVaultSection';
import { BadgeVisualIcon } from './BadgeVisualIcon';
import { calculateUserBadges } from '../utils/badgeMilestones';

interface EncryptedProfileViewProps {
  currentUser: User;
  allPosts?: Post[];
  allPdfs?: PDFDocument[];
  allUsers?: User[];
  allTrends?: HashtagTrend[];
  onUpdateProfileVault: (updatedUser: User) => void;
  onOpenPdf?: (doc: PDFDocument) => void;
  onShareToChat?: (item: Post | PDFDocument) => void;
  onSharePost?: (post: Post, method: 'feed' | 'chat' | 'copy' | 'sms') => void;
  onToggleBookmarkPost?: (postId: string, folderId?: string) => void;
  onCreateBookmarkFolder?: (folderName: string, postIdToSave?: string) => void;
  onToggleBookmarkDoc?: (docId: string) => void;
  onUnmuteUser?: (userId: string, userName?: string) => void;
  onMuteUser?: (userId: string, userName: string, userHandle: string) => void;
  onLikePost?: (postId: string) => void;
  onDislikePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onHashtagClick?: (tag: string) => void;
  onInspectCompatibility?: (userId: string) => void;
  onStartChat?: (user: User) => void;
  onAddFriend?: (userId: string, userName: string) => void;
  onToggleJoinGroup?: (tag: string) => void;
  onOpenGroupDetail?: (group: HashtagGroup) => void;
  onCityClick?: (cityName: string) => void;
  onVotePoll?: (postId: string, optionId: string) => void;
  onApplyFirePowerUp?: (
    postId: string,
    powerUpType: 'boost' | 'glow' | 'multiplier' | 'viral',
    cost: number,
    params?: {
      boostScore?: number;
      multiplierFactor?: number;
      totalCycles?: number;
    },
    groupTag?: string
  ) => void;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onViralPostViewed?: (postId: string, viewerUser?: User) => void;
  onAdvanceFeedCycle?: () => void;
  onClaimFreeSparks?: () => void;
  onOpenFindFriendsTab?: () => void;
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

export const EncryptedProfileView: React.FC<EncryptedProfileViewProps> = ({
  currentUser,
  allPosts = [],
  allPdfs = [],
  allUsers = [],
  allTrends = [],
  onUpdateProfileVault,
  onOpenPdf,
  onShareToChat,
  onSharePost,
  onToggleBookmarkPost,
  onCreateBookmarkFolder,
  onToggleBookmarkDoc,
  onUnmuteUser,
  onMuteUser,
  onLikePost,
  onDislikePost,
  onAddComment,
  onHashtagClick,
  onInspectCompatibility,
  onStartChat,
  onAddFriend,
  onToggleJoinGroup,
  onOpenGroupDetail,
  onCityClick,
  onVotePoll,
  onApplyFirePowerUp,
  onSimulateInfectNextProfile,
  onViralPostViewed,
  onAdvanceFeedCycle,
  onClaimFreeSparks,
  onOpenFindFriendsTab,
  onRequestCreateQuoteCard,
  onMoodClick,
}) => {
  // Timeline is default tab on the profile page
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'photos' | 'compatibility' | 'vault' | 'muted' | 'badges'>('timeline');
  const [vaultInnerTab, setVaultInnerTab] = useState<'cipher' | 'badges'>('cipher');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'poetry' | 'media' | 'pdf'>('all');
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('');
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLocked, setIsLocked] = useState(currentUser.vaultLocked);
  const [decryptedData, setDecryptedData] = useState<DecryptedVaultData | null>(
    currentUser.vaultLocked ? null : currentUser.decryptedData || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync isLocked when currentUser.vaultLocked updates
  React.useEffect(() => {
    setIsLocked(currentUser.vaultLocked);
    if (!currentUser.vaultLocked && currentUser.decryptedData) {
      setDecryptedData(currentUser.decryptedData);
    }
  }, [currentUser.vaultLocked, currentUser.decryptedData]);

  // Editable fields when unlocked
  const [editNotes, setEditNotes] = useState(decryptedData?.privateNotes || '');
  const [editInterests, setEditInterests] = useState(
    decryptedData?.secretInterests?.join(', ') || ''
  );
  const [editLocation, setEditLocation] = useState(decryptedData?.privateLocation || '');
  const [editEmail, setEditEmail] = useState(decryptedData?.contactEmail || '');

  // User timeline posts calculation
  const userTimelinePosts = React.useMemo(() => {
    return allPosts.filter(
      (p) =>
        p.authorId === currentUser.id ||
        p.authorHandle === currentUser.handle ||
        p.authorName === currentUser.name
    );
  }, [allPosts, currentUser.id, currentUser.handle, currentUser.name]);

  const filteredTimelinePosts = React.useMemo(() => {
    return userTimelinePosts.filter((post) => {
      // Type filter
      if (timelineFilter === 'poetry' && !post.poetryFormatted) return false;
      if (timelineFilter === 'pdf' && !post.document) return false;
      if (timelineFilter === 'media' && !post.image) return false;

      // Search query
      if (timelineSearchQuery.trim()) {
        const q = timelineSearchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesTags = post.hashtags.some((t) => t.toLowerCase().includes(q));
        const matchesPdf = post.document?.title?.toLowerCase().includes(q);
        return matchesContent || matchesTags || matchesPdf;
      }
      return true;
    });
  }, [userTimelinePosts, timelineFilter, timelineSearchQuery]);

  const totalLikesReceived = React.useMemo(() => {
    return userTimelinePosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);
  }, [userTimelinePosts]);

  const totalPoetryCount = React.useMemo(() => {
    return userTimelinePosts.filter((p) => p.poetryFormatted).length;
  }, [userTimelinePosts]);

  // Compute live badges for the user
  const userBadges = React.useMemo(() => {
    return calculateUserBadges(currentUser, allUsers, allPosts);
  }, [currentUser, allUsers, allPosts]);

  const unlockedBadgesCount = React.useMemo(() => {
    return userBadges.filter((b) => b.isUnlocked).length;
  }, [userBadges]);

  const featuredBadge = React.useMemo(() => {
    if (currentUser.featuredBadgeId) {
      return userBadges.find((b) => b.id === currentUser.featuredBadgeId);
    }
    // Default to the highest unlocked badge
    return userBadges.find((b) => b.isUnlocked && (b.rarity === 'legendary' || b.rarity === 'epic'));
  }, [userBadges, currentUser.featuredBadgeId]);

  // Check if this profile has caught a viral post contagion
  const activeContagions = React.useMemo(() => {
    return allPosts.filter(
      (p) =>
        p.firePowerUps?.viral?.active &&
        !p.firePowerUps.viral.fadedAway &&
        p.firePowerUps.viral.infectedProfileIds.includes(currentUser.id)
    );
  }, [allPosts, currentUser.id]);

  const handleDirectUnlock = async (key: string): Promise<boolean> => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedKey = (key || '').trim();
    if (!trimmedKey) {
      setErrorMsg('Please enter your vault master key passphrase.');
      return false;
    }

    try {
      let data: DecryptedVaultData | null = null;
      if (currentUser.encryptedVault) {
        data = await decryptProfileVault(currentUser.encryptedVault, trimmedKey);
      } else if (currentUser.decryptedData) {
        data = currentUser.decryptedData;
      } else {
        data = await decryptProfileVault({} as any, trimmedKey);
      }

      if (data) {
        setDecryptedData(data);
        setEditNotes(data.privateNotes);
        setEditInterests(data.secretInterests.join(', '));
        setEditLocation(data.privateLocation);
        setEditEmail(data.contactEmail);
        setIsLocked(false);
        setPassphrase(trimmedKey);
        setSuccessMsg('Profile vault decrypted successfully! Photos and private notes unlocked.');

        if (onUpdateProfileVault) {
          onUpdateProfileVault({
            ...currentUser,
            vaultLocked: false,
            decryptedData: data,
          });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to decrypt vault. (Try password: vibe2026)');
      return false;
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleDirectUnlock(passphrase);
  };

  const handleLockVault = () => {
    setIsLocked(true);
    setDecryptedData(null);
    setPassphrase('');
    setSuccessMsg('Profile vault re-encrypted. Decrypted keys purged from memory.');
    if (onUpdateProfileVault) {
      onUpdateProfileVault({
        ...currentUser,
        vaultLocked: true,
      });
    }
  };

  const handleSaveAndEncrypt = async () => {
    if (!passphrase) {
      setErrorMsg('Passphrase required to encrypt updated vault payload.');
      return;
    }

    try {
      const updatedVaultData: DecryptedVaultData = {
        privateNotes: editNotes,
        secretInterests: editInterests.split(',').map((s) => s.trim()).filter(Boolean),
        privateLocation: editLocation,
        contactEmail: editEmail,
        emergencyKeyHash: 'sha256-updated-' + Date.now(),
        savedBookmarks: decryptedData?.savedBookmarks || [],
      };

      const { vault } = await encryptProfileVault(updatedVaultData, passphrase);

      const updatedUser: User = {
        ...currentUser,
        vaultLocked: false,
        encryptedVault: vault,
        decryptedData: updatedVaultData,
      };

      onUpdateProfileVault(updatedUser);
      setDecryptedData(updatedVaultData);
      setSuccessMsg('Changes re-encrypted with AES-256-GCM and saved to local profile vault!');
    } catch (err: any) {
      setErrorMsg('Failed to encrypt profile payload: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-pink-950/80 via-neutral-900/80 to-rose-950/80 backdrop-blur-md border border-pink-500/35 hover:border-pink-400/60 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ease-out transform-gpu hover:scale-[1.01] shadow-[0_0_20px_rgba(244,114,182,0.18),0_8px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_0_30px_rgba(244,114,182,0.3),0_16px_40px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Interactive Profile Photo with Upload Trigger */}
            <div
              onClick={() => setIsUploadPhotoModalOpen(true)}
              className="relative group/avatar cursor-pointer shrink-0"
              title="Click to upload or change profile photo"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-pink-500/50 shadow-xl group-hover/avatar:ring-pink-400 group-hover/avatar:scale-105 transition-all duration-300"
              />
              <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                <Camera className="w-5 h-5 text-pink-300 animate-pulse" />
                <span className="text-[9px] font-bold mt-0.5 text-pink-200 uppercase tracking-tight">Change</span>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-slate-100">{currentUser.name}</h2>
                <span className="text-xs text-slate-400 font-medium">{currentUser.handle}</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-950/80 border border-pink-400/50 text-pink-200 text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(244,114,182,0.3)]">
                  <span className="text-white">Encrypted Profile</span>
                </span>
                {featuredBadge && (
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('badges')}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/70 hover:bg-amber-900 border border-amber-400/50 text-amber-200 text-[10px] font-mono font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)] transition-all cursor-pointer group/feat"
                    title={`Equipped Badge: ${featuredBadge.title} - Click to view Badges`}
                  >
                    <span>{featuredBadge.badgeSymbol}</span>
                    <span className="truncate max-w-[150px]">{featuredBadge.title}</span>
                  </button>
                )}
                {activeContagions.length > 0 && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-400/70 text-rose-200 text-[10px] font-mono font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse"
                    title="This profile has been infected by a Viral Post outbreak! It will spread to profiles viewing it until it fades away."
                  >
                    <span>☣️</span>
                    <span>Viral Contagion Active ({activeContagions.length})</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-300 max-w-md">{currentUser.bio}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('timeline')}
                  className={`inline-flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    activeSubTab === 'timeline' ? 'text-pink-300 font-bold' : 'text-slate-400 hover:text-pink-300'
                  }`}
                >
                  <span>📝 {userTimelinePosts.length} Timeline Posts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab(activeSubTab === 'photos' ? 'timeline' : 'photos')}
                  className={`inline-flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                    activeSubTab === 'photos' ? 'text-pink-300 font-bold' : 'text-slate-400 hover:text-pink-300'
                  }`}
                >
                  <span>📷 {currentUser.photos?.length || 0} Captures</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab(activeSubTab === 'badges' ? 'timeline' : 'badges')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all hover:scale-[1.02] ${
                    activeSubTab === 'badges'
                      ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold'
                      : 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/30 text-amber-300'
                  }`}
                  title="Click to explore unlocked Badges & Milestones"
                >
                  <Trophy className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>🎖️ {unlockedBadgesCount}/{userBadges.length} Badges</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab(activeSubTab === 'vault' ? 'timeline' : 'vault')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium cursor-pointer transition-all hover:scale-[1.02] ${
                    activeSubTab === 'vault'
                      ? 'bg-pink-500 text-black border-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.5)] font-bold'
                      : 'bg-pink-950/40 hover:bg-pink-900/60 border-pink-500/30 text-pink-300'
                  }`}
                  title="Click to view AES-256 Vault & Cipher Keys"
                >
                  <ShieldCheck className="w-3 h-3 text-pink-400" />
                  <span>🔐 AES Vault</span>
                </button>
                {currentUser.location && (
                  onCityClick ? (
                    <button
                      type="button"
                      onClick={() => onCityClick(currentUser.location)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-pink-300 bg-pink-950/70 hover:bg-pink-900 border border-pink-500/40 hover:border-pink-300 px-2.5 py-0.5 rounded-full hover:text-white transition-all cursor-pointer active:scale-95 group/loctag"
                      title={`Filter feed by location tag: ${currentUser.location}`}
                    >
                      <MapPin className="w-3 h-3 text-pink-400 group-hover/loctag:text-pink-300 transition-colors shrink-0" />
                      <span>{currentUser.location}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-pink-300 bg-pink-950/70 border border-pink-500/40 px-2.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3 text-pink-400 shrink-0" />
                      <span>{currentUser.location}</span>
                    </span>
                  )
                )}
                <span>📅 Joined {currentUser.joinDate}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'vault' ? 'timeline' : 'vault')}
              className="flex items-center gap-2 group/vaultbtn cursor-pointer transition-transform hover:scale-[1.02]"
              title="Click to toggle AES Vault view"
            >
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  isLocked
                    ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-[0_0_10px_rgba(244,114,182,0.2)] group-hover/vaultbtn:border-pink-400'
                    : 'bg-pink-500/20 text-pink-300 border-pink-500/30 shadow-[0_0_10px_rgba(244,114,182,0.2)] group-hover/vaultbtn:border-pink-400'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4 text-pink-300" /> : <Unlock className="w-4 h-4 text-pink-400" />}
                <span>{isLocked ? 'Vault Encrypted' : 'Vault Decrypted'}</span>
              </div>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              Cipher: AES-256-GCM / PBKDF2
            </span>
          </div>
        </div>
      </div>

      {/* Badges & Milestones Vault Strip */}
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-md opacity-60 pointer-events-none" />
        <div className="relative bg-black/85 backdrop-blur-md border border-amber-500/35 rounded-2xl p-4 sm:p-5 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.12),0_8px_25px_rgba(0,0,0,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <Trophy className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-100 font-space-mono tracking-tight">
                    Vault Badges & Reading Milestones
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold">
                    {unlockedBadgesCount} / {userBadges.length} Unlocked
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Special visual emblems unlocked upon reaching reading ranks, stream leaderboards, and cipher archives
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubTab(activeSubTab === 'badges' ? 'timeline' : 'badges')}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] ${
                activeSubTab === 'badges'
                  ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)] font-bold'
                  : 'bg-neutral-900/90 hover:bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
              title="Open full Badges Vault"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{activeSubTab === 'badges' ? 'Viewing Badges' : 'Open Badges Vault'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Featured Milestone Badges Preview Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {/* 1. Top 10 Reader in #Poetry */}
            {(() => {
              const b = userBadges.find((x) => x.id === 'badge_top10_poetry');
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveSubTab('badges')}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-amber-500/35 hover:border-amber-400/70 transition-all cursor-pointer flex items-center gap-3 group/b hover:scale-[1.01]"
                >
                  <BadgeVisualIcon badge={b} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono uppercase font-bold text-amber-400">#Poetry Top 10</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 border border-amber-400/40 text-amber-300 font-mono">
                        {b.isUnlocked ? '✓ Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate group-hover/b:text-amber-300 transition-colors">
                      {b.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {b.unlockedReason || b.requirementText}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. 1000 Total Reading Points */}
            {(() => {
              const b = userBadges.find((x) => x.id === 'badge_1000_pts');
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveSubTab('badges')}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-pink-500/35 hover:border-pink-400/70 transition-all cursor-pointer flex items-center gap-3 group/b hover:scale-[1.01]"
                >
                  <BadgeVisualIcon badge={b} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono uppercase font-bold text-pink-400">1000 Pts Milestone</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-950 border border-pink-400/40 text-pink-300 font-mono">
                        {b.isUnlocked ? '✓ Unlocked' : `${b.progressPercent}%`}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate group-hover/b:text-pink-300 transition-colors">
                      {b.title}
                    </p>
                    <div className="w-full bg-neutral-900 rounded-full h-1 overflow-hidden mt-1 border border-neutral-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500"
                        style={{ width: `${b.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Top 10 Reader in #Encrypted */}
            {(() => {
              const b = userBadges.find((x) => x.id === 'badge_top10_encrypted') || userBadges[3];
              if (!b) return null;
              return (
                <div
                  key={b.id}
                  onClick={() => setActiveSubTab('badges')}
                  className="p-3 rounded-xl bg-neutral-950/80 border border-cyan-500/35 hover:border-cyan-400/70 transition-all cursor-pointer flex items-center gap-3 group/b hover:scale-[1.01]"
                >
                  <BadgeVisualIcon badge={b} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] font-mono uppercase font-bold text-cyan-400">#Encrypted Top 10</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-mono">
                        {b.isUnlocked ? '✓ Unlocked' : 'Locked'}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white truncate group-hover/b:text-cyan-300 transition-colors">
                      {b.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono block truncate">
                      {b.unlockedReason || b.requirementText}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Return to Timeline Banner when in Sub-view */}
      {activeSubTab !== 'timeline' && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className="text-xs font-semibold text-pink-300 hover:text-white bg-pink-950/70 hover:bg-pink-900/90 border border-pink-500/40 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(236,72,153,0.2)]"
          >
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span>← Back to Profile Timeline</span>
          </button>
          <span className="text-xs font-mono text-slate-400 capitalize px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-pink-500/20">
            Viewing {activeSubTab}
          </span>
        </div>
      )}

      {/* Notifications */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 p-4 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 0: TIMELINE (DEFAULT) */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-5">
          {/* Timeline Action & Search Bar */}
          <div className="bg-black/75 backdrop-blur-md border border-pink-500/30 rounded-xl p-3.5 space-y-3 shadow-[0_0_18px_rgba(244,114,182,0.15),0_6px_20px_rgba(0,0,0,0.5)]">
            
            {/* Top Row: Search + Quick Post */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search your timeline verses, tags, or publications..."
                  value={timelineSearchQuery}
                  onChange={(e) => setTimelineSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950/90 border border-pink-500/40 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500/60 font-mono"
                />
                {timelineSearchQuery && (
                  <button
                    onClick={() => setTimelineSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Filter Pills & Metrics */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-pink-500/20 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setTimelineFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                    timelineFilter === 'all'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30'
                  }`}
                >
                  All ({userTimelinePosts.length})
                </button>
                <button
                  onClick={() => setTimelineFilter('poetry')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${
                    timelineFilter === 'poetry'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30'
                  }`}
                >
                  <Feather className="w-3 h-3 text-pink-300" />
                  <span>Poetry ({totalPoetryCount})</span>
                </button>
                <button
                  onClick={() => setTimelineFilter('media')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${
                    timelineFilter === 'media'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30'
                  }`}
                >
                  <ImageIcon className="w-3 h-3 text-pink-300" />
                  <span>Visual ({userTimelinePosts.filter((p) => p.image).length})</span>
                </button>
                <button
                  onClick={() => setTimelineFilter('pdf')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1 ${
                    timelineFilter === 'pdf'
                      ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_8px_rgba(236,72,153,0.5)]'
                      : 'bg-neutral-900/90 text-slate-300 hover:bg-neutral-800 border-pink-500/30'
                  }`}
                >
                  <FileText className="w-3 h-3 text-cyan-300" />
                  <span>PDFs ({userTimelinePosts.filter((p) => p.document).length})</span>
                </button>
              </div>

              {/* Engagement Summary */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-pink-300">
                  <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
                  <span>{totalLikesReceived} Likes</span>
                </span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Authentic Feed</span>
                </span>
              </div>
            </div>

          </div>

          {/* Timeline Post Stream */}
          {filteredTimelinePosts.length > 0 ? (
            <div className="space-y-4">
              {filteredTimelinePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onLike={onLikePost || (() => {})}
                  onDislike={onDislikePost || (() => {})}
                  onAddComment={onAddComment || (() => {})}
                  onHashtagClick={onHashtagClick || (() => {})}
                  onOpenHashtagGroup={(tag) => {
                    if (onHashtagClick) onHashtagClick(tag);
                  }}
                  onOpenPdf={onOpenPdf || (() => {})}
                  onShareToChat={onShareToChat}
                  onSharePost={onSharePost}
                  onToggleBookmark={onToggleBookmarkPost}
                  isBookmarked={(currentUser.savedPostIds || []).includes(post.id)}
                  onCityClick={onCityClick}
                  onInspectCompatibility={onInspectCompatibility}
                  onApplyFirePowerUp={onApplyFirePowerUp}
                  onSimulateInfectNextProfile={onSimulateInfectNextProfile}
                  onViralPostViewed={onViralPostViewed}
                  onAdvanceFeedCycle={onAdvanceFeedCycle}
                  onClaimFreeSparks={onClaimFreeSparks}
                  allUsers={allUsers}
                  onRequestCreateQuoteCard={onRequestCreateQuoteCard}
                  onMoodClick={onMoodClick}
                />
              ))}
            </div>
          ) : (
            <div className="bg-black/60 backdrop-blur-md border border-pink-500/30 rounded-2xl p-10 text-center space-y-4 shadow-[0_0_15px_rgba(236,72,153,0.15)]">
              <Clock className="w-12 h-12 text-pink-400 mx-auto opacity-70" />
              <h3 className="font-bold text-slate-200 text-base">
                {timelineSearchQuery ? 'No Matching Timeline Posts' : 'No Posts in Your Timeline Yet'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {timelineSearchQuery
                  ? `No posts matched "${timelineSearchQuery}". Try adjusting your keywords or clearing the search.`
                  : 'Your personal timeline is ready. Share a stanza, publish an excerpt, or release a PDF paper.'}
              </p>
              {timelineSearchQuery && (
                <button
                  onClick={() => setTimelineSearchQuery('')}
                  className="px-4 py-1.5 rounded-xl bg-neutral-900 border border-pink-500/40 text-xs text-pink-300 font-semibold hover:bg-neutral-800"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: PHOTOS */}
      {activeSubTab === 'photos' && (
        <ProfilePhotosSection
          currentUser={currentUser}
          onUpdateUser={onUpdateProfileVault}
          isVaultLocked={isLocked}
          onUnlockVault={handleDirectUnlock}
          onCityClick={onCityClick}
          onToggleLockVault={() => {
            if (isLocked) {
              handleDirectUnlock('vibe2026');
            } else {
              handleLockVault();
            }
          }}
        />
      )}

      {/* TAB: FRIEND COMPATIBILITY & DEPTH SCORE */}
      {activeSubTab === 'compatibility' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-pink-950/80 via-black to-cyan-950/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-6 shadow-[0_0_20px_rgba(236,72,153,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500/30 to-cyan-500/30 border border-pink-400/50 text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.3)]">
                  <Zap className="w-5 h-5 fill-pink-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <span>Friend Compatibility & Depth Score</span>
                    <span className="text-xs font-mono font-bold text-pink-300 bg-pink-950/70 border border-pink-500/40 px-2.5 py-0.5 rounded-full">
                      Live Matching Engine
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl">
                    Compatibility percentages calculate shared affinity across mutual likes, shared dislikes, poetic depth score, and active hashtag overlap.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Friends List with Compatibility Percent */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400 fill-pink-500/30" />
                <span>Connected Friends ({currentUser.friends.length})</span>
              </h4>
            </div>

            {currentUser.friends.length === 0 ? (
              <div className="bg-black/60 backdrop-blur-md border border-pink-500/30 rounded-2xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="text-slate-200 font-bold text-sm">No Friends Connected Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add friends from suggested profiles below to unlock live compatibility percentages and synergy breakdowns!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentUser.friends.map((friendId) => {
                  const friendObj = allUsers.find((u) => u.id === friendId) || {
                    id: friendId,
                    name: 'Friend',
                    handle: `@user_${friendId}`,
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                    bio: 'Friend on Vibe Verse.',
                    location: 'Earth',
                    verified: true,
                    joinDate: '',
                    likedPostIds: [],
                    dislikedPostIds: [],
                    friends: [],
                    vaultLocked: true,
                  };

                  const comp = calculateCompatibility(currentUser, friendObj, allPosts);
                  const viralPostsSpreadCount = allPosts.filter(
                    (p) =>
                      p.firePowerUps?.viral?.active &&
                      !p.firePowerUps.viral.fadedAway &&
                      (p.firePowerUps.viral.infectedProfileIds?.includes(friendId) ||
                        (friendObj.handle && p.firePowerUps.viral.infectedProfileNames?.includes(friendObj.handle)))
                  ).length;

                  return (
                    <div key={friendId} className="relative group">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-pink-500/20 via-cyan-500/20 to-pink-500/20 blur-md opacity-30 group-hover:opacity-70 transition-all duration-300 pointer-events-none" />
                      <div className="relative bg-black/80 backdrop-blur-md border border-pink-500/30 hover:border-pink-500/60 rounded-2xl p-5 space-y-4 transition-all duration-300 card-pink-glow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={friendObj.avatar}
                              alt={friendObj.name}
                              className="w-12 h-12 rounded-xl object-cover ring-2 ring-pink-500/40 shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-100 text-sm truncate">{friendObj.name}</h4>
                              <p className="text-xs text-pink-300/80 font-mono">{friendObj.handle}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{friendObj.bio}</p>
                            </div>
                          </div>

                          {/* Big Compatibility Percent Badge */}
                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-pink-950 via-neutral-900 to-cyan-950 border border-pink-400/60 text-pink-200 font-bold font-mono text-sm shadow-[0_0_12px_rgba(244,114,182,0.3)]">
                              <Zap className="w-4 h-4 text-pink-400 fill-pink-400" />
                              <span>{comp.matchPercentage}%</span>
                            </div>
                            <span className="text-[10px] text-pink-300/80 font-medium mt-1 text-right line-clamp-1 max-w-[120px]">
                              {comp.aiVibeTitle}
                            </span>
                          </div>
                        </div>

                        {/* Synergy metric chips */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-pink-500/20 text-xs">
                          <div className="flex items-center gap-1.5 bg-neutral-900/70 px-2.5 py-1.5 rounded-lg border border-pink-500/20 text-slate-300">
                            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
                            <span className="text-[11px]"><strong className="text-pink-300">{comp.mutualLikesCount}</strong> Shared Likes</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-neutral-900/70 px-2.5 py-1.5 rounded-lg border border-pink-500/20 text-slate-300">
                            <ThumbsDown className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px]"><strong className="text-purple-300">{comp.mutualDislikesCount}</strong> Mutual Dislikes</span>
                          </div>
                        </div>

                        {/* Viral Contagion Spread Status */}
                        {viralPostsSpreadCount > 0 && (
                          <div className="px-2.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-medium">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.9)]" />
                              <span>Viral Outbreak in Feed</span>
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/70 text-emerald-200 border border-emerald-500/40">
                              {viralPostsSpreadCount} viral post{viralPostsSpreadCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => onInspectCompatibility && onInspectCompatibility(friendId)}
                            className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(236,72,153,0.3)] transition-all cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>View Breakdown</span>
                          </button>
                          {onStartChat && (
                            <button
                              onClick={() => onStartChat(friendObj)}
                              className="py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-cyan-500/40 text-cyan-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>DM</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* High Depth Score Suggestions from Network */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Recommended Compatibility Matches in the Verse</span>
              </h4>
              {onOpenFindFriendsTab && (
                <button
                  onClick={onOpenFindFriendsTab}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-pink-600/30 to-cyan-600/30 hover:from-pink-600/50 hover:to-cyan-600/50 border border-pink-500/40 text-pink-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-white" />
                  <span>Open Find Friends Tab</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allUsers
                .filter((u) => u.id !== currentUser.id && !currentUser.friends.includes(u.id))
                .map((userObj) => {
                  const comp = calculateCompatibility(currentUser, userObj, allPosts);
                  return (
                    <div key={userObj.id} className="relative bg-black/70 backdrop-blur-md border border-slate-800 hover:border-pink-500/40 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={userObj.avatar}
                          alt={userObj.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <h5 className="font-bold text-slate-100 text-xs truncate">{userObj.name}</h5>
                          <p className="text-[11px] text-slate-400 font-mono">{userObj.handle}</p>
                          <span className="text-[10px] text-pink-300 font-medium mt-0.5 block">{comp.aiVibeTitle}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onInspectCompatibility && onInspectCompatibility(userObj.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-950/70 border border-pink-400/50 text-pink-200 text-xs font-mono font-bold hover:bg-pink-900/80 transition-all cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-pink-400 fill-pink-400" />
                          <span>{comp.matchPercentage}%</span>
                        </button>
                        {onAddFriend && (
                          <button
                            onClick={() => onAddFriend(userObj.id, userObj.name)}
                            className="p-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 hover:text-white transition-all cursor-pointer"
                            title={`Connect with ${userObj.name}`}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER KEYS & ENCRYPTED VAULT FORM */}
      {activeSubTab === 'vault' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Vault Inner Tab Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-neutral-950/90 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setVaultInnerTab('cipher')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vaultInnerTab === 'cipher'
                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>AES-256 Storage & Keys</span>
              </button>
              <button
                type="button"
                onClick={() => setVaultInnerTab('badges')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  vaultInnerTab === 'badges'
                    ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)] font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Vault Badges & Milestones ({unlockedBadgesCount}/{userBadges.length})</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline pr-2">
              Vault Cipher: AES-256-GCM / PBKDF2
            </span>
          </div>

          {vaultInnerTab === 'badges' ? (
            <BadgesVaultSection
              currentUser={currentUser}
              allUsers={allUsers}
              allPosts={allPosts}
              onUpdateUser={onUpdateProfileVault}
              onOpenStreamModal={(tag) => {
                if (tag && onHashtagClick) {
                  onHashtagClick(tag);
                }
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Cipher Metadata & Key Entry */}
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-6 space-y-5 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-slate-100 text-sm">Encrypted Storage Details</h3>
              </div>
              <span className="text-[10px] bg-slate-900 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-mono">
                Web Crypto Native
              </span>
            </div>

            {/* Cipher Spec Cards */}
            <div className="space-y-3 font-mono text-[11px]">
              <div className="bg-neutral-950/80 backdrop-blur-sm p-3 rounded-xl border border-cyan-500/30 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">
                  Key Fingerprint:
                </span>
                <span className="text-cyan-400 font-bold tracking-wider">
                  {currentUser.encryptedVault?.keyFingerprint || 'A84F-9C1D-E280'}
                </span>
              </div>

              <div className="bg-neutral-950/80 backdrop-blur-sm p-3 rounded-xl border border-cyan-500/30 space-y-1">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">
                  Ciphertext Hex Preview:
                </span>
                <p className="text-slate-400 break-all line-clamp-2">
                  {currentUser.encryptedVault?.ciphertext || '3a8f91b72e0c4d5a1b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-neutral-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-cyan-500/30">
                  <span className="text-slate-500 block">IV (Initialization Vector):</span>
                  <span className="text-slate-300 break-all">{currentUser.encryptedVault?.iv || 'a1b2c3d4e5f6'}</span>
                </div>
                <div className="bg-neutral-950/80 backdrop-blur-sm p-2.5 rounded-xl border border-cyan-500/30">
                  <span className="text-slate-500 block">PBKDF2 Salt:</span>
                  <span className="text-slate-300 break-all">{currentUser.encryptedVault?.salt.slice(0, 12)}...</span>
                </div>
              </div>
            </div>

            {/* Passphrase Entry Form */}
            <form onSubmit={handleUnlockVault} className="space-y-3 pt-2 border-t border-cyan-500/20">
              <label className="block text-xs font-semibold text-slate-300">
                Master Key Passphrase:
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  placeholder="Enter passphrase (e.g. test phrase, vibe2026)"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full bg-black/70 border border-cyan-500/40 rounded-xl pl-3 pr-10 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Quick test phrase chips */}
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
                <span>Test phrase:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPassphrase('test phrase');
                    handleDirectUnlock('test phrase');
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
                >
                  "test phrase"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPassphrase('vibe2026');
                    handleDirectUnlock('vibe2026');
                  }}
                  className="px-2 py-0.5 rounded bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors cursor-pointer"
                >
                  "vibe2026"
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {isLocked ? (
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/20 border border-cyan-400/50"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Decrypt Profile Vault</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLockVault}
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-slate-200 border border-cyan-500/30 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Vault</span>
                  </button>
                )}
              </div>
            </form>

          </div>

          {/* Right Column: Decrypted Data Form */}
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                Private Profile Vault Payload
              </h3>
              <span className="text-[10px] text-slate-400">
                {isLocked ? '🔒 Encrypted Payload' : '🔓 Decrypted in Memory'}
              </span>
            </div>

            {!isLocked && decryptedData ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Private Creative Notes & Poetry Drafts:
                  </label>
                  <textarea
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-cyan-500/30 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Secret Interests & Topics (Comma separated):
                  </label>
                  <input
                    type="text"
                    value={editInterests}
                    onChange={(e) => setEditInterests(e.target.value)}
                    className="w-full bg-neutral-950/80 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Encrypted Location Coordinates:
                    </label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Private Contact Email:
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-neutral-950/80 border border-cyan-500/30 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSaveAndEncrypt()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md border border-cyan-400/50"
                >
                  <Save className="w-4 h-4" />
                  <span>Re-Encrypt & Save Vault Payload</span>
                </button>
              </div>
            ) : (
              <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-8 text-center space-y-3">
                <Lock className="w-10 h-10 text-pink-300 mx-auto opacity-80" />
                <h4 className="font-semibold text-slate-200 text-sm">Profile Vault Encrypted</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your private notes, secret interests, location coordinates, and saved bookmarks are encrypted client-side using AES-256-GCM.
                </p>
                <p className="text-[11px] text-cyan-400 font-mono">
                  Enter your master passphrase on the left to decrypt.
                </p>
              </div>
            )}

          </div>

            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 6: FULL BADGES & MILESTONES SECTION */}
      {activeSubTab === 'badges' && (
        <div className="animate-in fade-in duration-200">
          <BadgesVaultSection
            currentUser={currentUser}
            allUsers={allUsers}
            allPosts={allPosts}
            onUpdateUser={onUpdateProfileVault}
            onOpenStreamModal={(tag) => {
              if (tag && onHashtagClick) {
                onHashtagClick(tag);
              }
            }}
          />
        </div>
      )}

      {/* SUB-VIEW 5: MUTED ACCOUNTS MANAGEMENT */}
      {activeSubTab === 'muted' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-400/20 to-rose-500/20 blur-md opacity-50 pointer-events-none" />
            <div className="relative bg-black/80 backdrop-blur-md border border-rose-500/40 p-6 rounded-2xl shadow-[0_0_20px_rgba(244,63,94,0.15)]">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-rose-500/20 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-5 h-5 text-rose-400" />
                    <h3 className="font-bold text-base text-rose-200 font-space-mono">Muted Feed Filter</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Posts, verses, documents, and reposts from these users are hidden from your main feed, hashtag streams, and friend suggestions.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900/80 border border-rose-500/30 text-xs font-mono text-rose-300">
                  <UserX className="w-3.5 h-3.5 text-rose-400" />
                  <span>{(currentUser.mutedUserIds || []).length} Muted</span>
                </div>
              </div>

              {(currentUser.mutedUserIds || []).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(currentUser.mutedUserIds || []).map((mutedId) => {
                    const user = allUsers.find((u) => u.id === mutedId);
                    const userPostsCount = allPosts.filter((p) => p.authorId === mutedId).length;

                    return (
                      <div
                        key={mutedId}
                        className="p-4 rounded-xl bg-neutral-950/70 border border-rose-500/30 flex items-center justify-between gap-3 hover:border-rose-500/60 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                            alt={user?.name || mutedId}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-rose-500/40 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-xs text-slate-200 truncate">
                              {user?.name || `User (${mutedId})`}
                            </h4>
                            <p className="text-[11px] text-rose-300/80 font-mono truncate">
                              {user?.handle || `@user_${mutedId}`}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {userPostsCount} {userPostsCount === 1 ? 'post' : 'posts'} hidden from feed
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => onUnmuteUser && onUnmuteUser(mutedId, user?.name)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950/60 border border-rose-500/40 hover:border-rose-400 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Unmute</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 space-y-3 bg-neutral-950/40 rounded-xl border border-dashed border-rose-500/20 p-6">
                  <Volume2 className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="font-semibold text-slate-300 text-xs">No users currently muted</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    You haven't muted anyone yet. To mute someone and remove their posts from your feed, tap the three dots (<span className="text-pink-400 font-mono">···</span>) on any post card and select "Mute".
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Upload & Change Profile Photo Modal */}
      {isUploadPhotoModalOpen && (
        <UploadProfilePhotoModal
          currentUser={currentUser}
          isOpen={isUploadPhotoModalOpen}
          onClose={() => setIsUploadPhotoModalOpen(false)}
          onUpdateAvatar={(newAvatarUrl, addToGallery) => {
            let updatedPhotos = currentUser.photos || [];
            if (addToGallery) {
              const newPhoto = {
                id: `photo_${Date.now()}`,
                url: newAvatarUrl,
                caption: 'Profile Avatar',
                tags: ['#Avatar', '#deep_'],
                location: currentUser.location,
                uploadedAt: 'Just now',
                isPrivate: false,
                likesCount: 0,
              };
              updatedPhotos = [newPhoto, ...updatedPhotos];
            }
            const updatedUser: User = {
              ...currentUser,
              avatar: newAvatarUrl,
              photos: updatedPhotos,
            };
            onUpdateProfileVault(updatedUser);
            setSuccessMsg('Profile photo updated successfully!');
            setTimeout(() => setSuccessMsg(null), 3500);
          }}
        />
      )}

    </div>
  );
};
