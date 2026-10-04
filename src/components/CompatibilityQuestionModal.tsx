import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Zap,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Shuffle,
  Send,
  Lock,
  Check,
  Flame,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { CompatibilityQuestion, User } from '../types';
import { COMPATIBILITY_QUESTIONS } from '../utils/compatibilityQuestions';

interface CompatibilityQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: User;
  onSendQuestion: (question: CompatibilityQuestion) => void;
}

export const CompatibilityQuestionModal: React.FC<CompatibilityQuestionModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSendQuestion,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [selectedMyAnswerId, setSelectedMyAnswerId] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    'All',
    'Aesthetics & Poetry',
    'Deep Philosophy',
    'Night Owl vs Dawn',
    'Privacy & Cipher',
    'Creative Rhythm',
    'Discernment & Values',
  ];

  const filteredQuestions =
    selectedCategory === 'All'
      ? COMPATIBILITY_QUESTIONS
      : COMPATIBILITY_QUESTIONS.filter((q) => q.category === selectedCategory);

  const currentQuestion =
    filteredQuestions[activeQuestionIndex % (filteredQuestions.length || 1)] ||
    COMPATIBILITY_QUESTIONS[0];

  const handleShuffle = () => {
    const nextIdx = (activeQuestionIndex + 1) % filteredQuestions.length;
    setActiveQuestionIndex(nextIdx);
    setSelectedMyAnswerId(null);
  };

  const handleSend = () => {
    if (!currentQuestion) return;
    const finalQuestion: CompatibilityQuestion = {
      ...currentQuestion,
      senderAnswer: selectedMyAnswerId || undefined,
      isAnsweredBySender: Boolean(selectedMyAnswerId),
      isAnsweredByReceiver: false,
    };
    onSendQuestion(finalQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-950/80 backdrop-blur-2xl border border-pink-500/60 rounded-3xl shadow-[0_0_50px_rgba(236,72,153,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Glowing Header Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-pink-500/20 bg-neutral-900/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(236,72,153,0.6)]">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-space-mono font-bold text-sm sm:text-base text-white">
                  Send Compatibility Question
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-950 border border-pink-400/40 text-pink-300">
                  Vibe Check
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To <strong className="text-pink-300">{participant.name}</strong> • Adjusts mutual compatibility score in real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters Bar */}
        <div className="px-4 py-2.5 bg-black/60 border-b border-pink-500/15 overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setActiveQuestionIndex(0);
                setSelectedMyAnswerId(null);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-pink-600 text-white font-bold shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-neutral-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Question Selector Controls */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-pink-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Probe #{activeQuestionIndex + 1} of {filteredQuestions.length}</span>
            </span>

            <button
              type="button"
              onClick={handleShuffle}
              className="px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-pink-500/30 text-xs text-slate-300 hover:text-pink-300 font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shuffle className="w-3 h-3 text-pink-400" />
              <span>Shuffle Next</span>
            </button>
          </div>

          {/* Active Question Box */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-pink-500/40 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/30">
                {currentQuestion.category}
              </span>
              <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                E2EE Encrypted
              </span>
            </div>

            <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
              {currentQuestion.question}
            </h4>

            {/* Options Selection (Pick your answer before sending) */}
            <div className="space-y-2 pt-1">
              <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <span>Select your personal stance:</span>
                <span className="text-pink-400 font-normal">(Recorded securely)</span>
              </p>

              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedMyAnswerId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMyAnswerId(opt.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-pink-950/80 border-pink-400 text-pink-100 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                        : 'bg-neutral-950/80 border-slate-800 text-slate-300 hover:border-pink-500/30 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-black/60 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-pink-400 shrink-0">
                          {idx === 0 ? 'A' : 'B'}
                        </span>
                        <span className="font-semibold text-xs text-white">{opt.text}</span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {opt.subtitle && (
                      <p className="text-[10px] text-slate-400 pl-7">{opt.subtitle}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Score Impact Predictor */}
          <div className="p-3 rounded-2xl bg-neutral-900/60 border border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-pink-950 border border-pink-500/40 flex items-center justify-center text-pink-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Mutual Match</span>
                <strong className="text-pink-300 font-bold text-xs">
                  +{currentQuestion.scoreMatchDelta}% Synergy
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">Divergence</span>
                <strong className="text-indigo-300 font-bold text-xs">
                  {currentQuestion.scoreDivergeDelta}% Contrast
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-pink-500/20 bg-neutral-900/90 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-pink-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(236,72,153,0.5)] transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Send Question to {participant.name.split(' ')[0]}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
