import React, { useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { Post, User } from '../types';
import { ViralSpreadGraph } from './ViralSpreadGraph';

interface ViralSpreadModalProps {
  post: Post | null;
  allUsers?: User[];
  currentUser?: User;
  isOpen: boolean;
  onClose: () => void;
  onSimulateInfectNextProfile?: (postId: string) => void;
  onViralPostViewed?: (postId: string, viewerUser?: User) => void;
  onViewProfile?: (userId: string) => void;
}

export const ViralSpreadModal: React.FC<ViralSpreadModalProps> = ({
  post,
  allUsers = [],
  currentUser,
  isOpen,
  onClose,
  onSimulateInfectNextProfile,
  onViralPostViewed,
  onViewProfile,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(244,63,94,0.35)] border border-rose-500/50 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <ViralSpreadGraph
          post={post}
          allUsers={allUsers}
          currentUser={currentUser}
          onSimulateInfectNextProfile={onSimulateInfectNextProfile}
          onViralPostViewed={onViralPostViewed}
          onClose={onClose}
          onViewProfile={onViewProfile}
          height={560}
          isModal={true}
        />
      </div>
    </div>
  );
};
