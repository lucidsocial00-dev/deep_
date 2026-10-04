import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Lock,
  Flame,
  Check,
  Bot,
  UserCheck,
} from 'lucide-react';
import { CompatibilityQuestion, User } from '../types';

interface CompatibilityQuestionCardProps {
  question: CompatibilityQuestion;
  currentUser: User;
  participant: User;
  isSenderMe: boolean;
  onAnswerQuestion: (questionId: string, optionId: string, simulatePartner?: boolean) => void;
  onSimulatePartnerAnswer?: (questionId: string) => void;
}

export const CompatibilityQuestionCard: React.FC<CompatibilityQuestionCardProps> = ({
  question,
  currentUser,
  participant,
  isSenderMe,
  onAnswerQuestion,
  onSimulatePartnerAnswer,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    isSenderMe ? question.senderAnswer || null : question.receiverAnswer || null
  );

  const senderOption = question.options.find((o) => o.id === question.senderAnswer);
  const receiverOption = question.options.find((o) => o.id === question.receiverAnswer);

  const isFullyResolved = Boolean(question.senderAnswer && question.receiverAnswer);
  const isMatch = isFullyResolved && question.senderAnswer === question.receiverAnswer;

  const handleSelectOption = (optId: string) => {
    setSelectedOptionId(optId);
    onAnswerQuestion(question.id, optId, true);
  };

  return (
    <div className="my-2 rounded-2xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 border border-pink-500/50 p-3.5 sm:p-4 text-left shadow-[0_0_20px_rgba(236,72,153,0.2)] relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge & Category */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pink-950/80 border border-pink-400/40 text-[10px] font-mono text-pink-300 shadow-[0_0_10px_rgba(236,72,153,0.3)]">
          <Zap className="w-3 h-3 text-pink-400 fill-pink-400 animate-pulse" />
          <span className="font-bold">Compatibility Probe</span>
          <span className="text-slate-400">•</span>
          <span className="text-pink-200">{question.category}</span>
        </div>

        <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          <span>Score Synced</span>
        </span>
      </div>

      {/* Question Text */}
      <h4 className="text-xs sm:text-sm font-bold text-slate-100 mb-3 leading-snug">
        {question.question}
      </h4>

      {/* Interactive Options List */}
      <div className="space-y-2 mb-3">
        {question.options.map((option, idx) => {
          const isSenderChoice = question.senderAnswer === option.id;
          const isReceiverChoice = question.receiverAnswer === option.id;
          const isMyChoice = isSenderMe ? isSenderChoice : isReceiverChoice;
          const isPartnerChoice = isSenderMe ? isReceiverChoice : isSenderChoice;

          let optionStyle =
            'bg-neutral-900/80 border-slate-800 text-slate-300 hover:border-pink-500/40 hover:bg-neutral-800/80';

          if (isFullyResolved) {
            if (isSenderChoice && isReceiverChoice) {
              optionStyle =
                'bg-pink-950/70 border-pink-400 text-pink-100 shadow-[0_0_15px_rgba(236,72,153,0.35)]';
            } else if (isMyChoice) {
              optionStyle = 'bg-indigo-950/60 border-indigo-400 text-indigo-100';
            } else if (isPartnerChoice) {
              optionStyle = 'bg-cyan-950/60 border-cyan-400/80 text-cyan-100';
            }
          } else if (isMyChoice) {
            optionStyle =
              'bg-pink-950/60 border-pink-400 text-pink-100 shadow-[0_0_10px_rgba(236,72,153,0.25)]';
          }

          return (
            <button
              key={option.id}
              type="button"
              disabled={isFullyResolved}
              onClick={() => handleSelectOption(option.id)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all relative flex flex-col gap-0.5 cursor-pointer disabled:cursor-default ${optionStyle}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-lg bg-black/50 border border-slate-700 flex items-center justify-center text-[10px] font-mono font-bold text-pink-400 shrink-0">
                    {idx === 0 ? 'A' : 'B'}
                  </span>
                  <span className="font-semibold text-xs leading-tight">{option.text}</span>
                </div>

                {/* Badges for who selected this */}
                <div className="flex items-center gap-1 shrink-0">
                  {isMyChoice && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500 text-white flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                      You
                    </span>
                  )}
                  {isPartnerChoice && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-600 text-white flex items-center gap-0.5">
                      <UserCheck className="w-2.5 h-2.5" />
                      {participant.name.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>

              {option.subtitle && (
                <p className="text-[10px] text-slate-400 pl-7 leading-tight">
                  {option.subtitle}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Outcome Status / Score Impact Banner */}
      {isFullyResolved ? (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 animate-in fade-in zoom-in-95 duration-200 ${
            isMatch
              ? 'bg-pink-950/90 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.4)] text-pink-200'
              : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isMatch ? (
              <div className="w-7 h-7 rounded-lg bg-pink-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_10px_rgba(236,72,153,0.8)]">
                <Sparkles className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                <Flame className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {isMatch ? '✨ Harmonic Depth Score Match!' : '⚡ Intriguing Creative Contrast'}
              </p>
              <p className="text-[10px] text-slate-300 font-mono">
                {isMatch
                  ? `You both picked the same frequency on this probe.`
                  : `Complementary viewpoints discovered between you two.`}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 font-mono">
            <span
              className={`text-xs font-bold flex items-center justify-end gap-0.5 ${
                isMatch ? 'text-pink-300' : 'text-indigo-300'
              }`}
            >
              {isMatch ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                  +{question.scoreMatchDelta}%
                </>
              ) : (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-indigo-400" />
                  {question.scoreDivergeDelta}%
                </>
              )}
            </span>
            <span className="text-[9px] text-slate-400 block">Score Boost</span>
          </div>
        </div>
      ) : (
        /* Pending State */
        <div className="p-2.5 rounded-xl bg-neutral-900 border border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <HelpCircle className="w-4 h-4 text-pink-400 animate-pulse shrink-0" />
            <span className="text-[11px]">
              {!selectedOptionId
                ? 'Select an option above to submit your answer'
                : `Waiting for ${participant.name} to respond...`}
            </span>
          </div>

          {selectedOptionId && onSimulatePartnerAnswer && (
            <button
              type="button"
              onClick={() => onSimulatePartnerAnswer(question.id)}
              className="px-2 py-1 rounded-lg bg-pink-900/60 hover:bg-pink-800 border border-pink-400/50 text-pink-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all hover:scale-105 shrink-0"
              title={`Simulate ${participant.name}'s answer to see score shift`}
            >
              <Bot className="w-3 h-3 text-pink-400" />
              <span>Simulate Peer</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
