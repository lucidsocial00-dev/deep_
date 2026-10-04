import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Check, X, AlertTriangle, Calendar, Lock, Unlock, Moon, Sparkles } from 'lucide-react';

interface AdultSwimAgeGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmVerification: (data: { birthDate: string; age: number; remember: boolean }) => void;
}

export const AdultSwimAgeGateModal: React.FC<AdultSwimAgeGateModalProps> = ({
  isOpen,
  onClose,
  onConfirmVerification,
}) => {
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [hasAgreedCertification, setHasAgreedCertification] = useState<boolean>(false);
  const [rememberVerification, setRememberVerification] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Current year / date reference
  const today = new Date();
  const currentYear = today.getFullYear();

  // Generate Year options (from currentYear down to 1920)
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = [
    { value: '01', label: '01 - January' },
    { value: '02', label: '02 - February' },
    { value: '03', label: '03 - March' },
    { value: '04', label: '04 - April' },
    { value: '05', label: '05 - May' },
    { value: '06', label: '06 - June' },
    { value: '07', label: '07 - July' },
    { value: '08', label: '08 - August' },
    { value: '09', label: '09 - September' },
    { value: '10', label: '10 - October' },
    { value: '11', label: '11 - November' },
    { value: '12', label: '12 - December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  // Calculate age based on selections
  const calculateAge = (): number | null => {
    if (!birthYear || !birthMonth || !birthDay) return null;
    const y = parseInt(birthYear, 10);
    const m = parseInt(birthMonth, 10) - 1;
    const d = parseInt(birthDay, 10);

    const birth = new Date(y, m, d);
    if (isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge();
  const isOldEnough = calculatedAge !== null && calculatedAge >= 18;
  const isUnderage = calculatedAge !== null && calculatedAge < 18;

  const handleConfirm = () => {
    if (!birthYear || !birthMonth || !birthDay) {
      setErrorMessage('Please select your complete date of birth.');
      return;
    }

    if (calculatedAge === null || calculatedAge < 18) {
      setErrorMessage(`Access denied: You must be at least 18 years old to access Adult Swim (current age: ${calculatedAge ?? 0}).`);
      return;
    }

    if (!hasAgreedCertification) {
      setErrorMessage('Please certify that you are 18+ and consent to viewing after-hours material.');
      return;
    }

    setErrorMessage(null);
    const birthDateStr = `${birthYear}-${birthMonth}-${birthDay}`;
    onConfirmVerification({
      birthDate: birthDateStr,
      age: calculatedAge,
      remember: rememberVerification,
    });
  };

  const handleQuickPreset18 = () => {
    // Convenient helper for quick testing / demonstration: set birth year to 2004 (22 years old)
    setBirthYear('2004');
    setBirthMonth('05');
    setBirthDay('14');
    setHasAgreedCertification(true);
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        {/* Ambient late-night glows */}
        <div className="absolute w-96 h-96 rounded-full bg-rose-600/10 blur-3xl pointer-events-none -top-12 -left-12" />
        <div className="absolute w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-12 -right-12" />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className="relative w-full max-w-lg bg-neutral-950 border-2 border-neutral-800 hover:border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(225,29,72,0.25)] text-slate-100 overflow-hidden my-auto"
        >
          {/* Retro scanline overlay accent */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

          {/* Close / Cancel Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            title="Cancel & Return"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Adult Swim Header Brand */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-tighter text-white bg-black px-2.5 py-1 border border-neutral-700 rounded-lg shadow-inner">
                [adult swim]
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/60 flex items-center gap-1.5 shadow-[0_0_12px_rgba(225,29,72,0.35)]">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                18+ Age Gate
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Midnight Broadcast Verification</span>
              <Moon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You are attempting to access the <strong className="text-slate-200">[adult swim]</strong> feed. This channel contains after-hours creative streams, unfiltered confessions, midnight stanzas, and mature discussions intended strictly for adults aged 18 and older.
            </p>
          </div>

          {/* Date of Birth Selection Box */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4 sm:p-5 mb-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Verify Your Date of Birth</span>
              </label>

              {/* Fast autofill preset for testing */}
              <button
                type="button"
                onClick={handleQuickPreset18}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline font-mono cursor-pointer"
              >
                Quick fill (21+)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Month */}
              <div>
                <span className="block text-[10px] font-mono text-slate-400 mb-1">Month</span>
                <select
                  value={birthMonth}
                  onChange={(e) => {
                    setBirthMonth(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="">Month</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day */}
              <div>
                <span className="block text-[10px] font-mono text-slate-400 mb-1">Day</span>
                <select
                  value={birthDay}
                  onChange={(e) => {
                    setBirthDay(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="">Day</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <span className="block text-[10px] font-mono text-slate-400 mb-1">Year</span>
                <select
                  value={birthYear}
                  onChange={(e) => {
                    setBirthYear(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-slate-200 text-xs sm:text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="">Year</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Age Verification Feedback Indicator */}
            {calculatedAge !== null && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                  isOldEnough
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-200 shadow-[0_0_15px_rgba(225,29,72,0.35)]'
                }`}
              >
                {isOldEnough ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-bold">
                    {isOldEnough
                      ? `Verified: ${calculatedAge} years old`
                      : `Access Restricted: ${calculatedAge} years old`}
                  </p>
                  <p className="text-[11px] opacity-85">
                    {isOldEnough
                      ? 'Age requirement satisfied. You are eligible to enter Adult Swim.'
                      : 'You must be at least 18 years of age to access after-hours uncensored content.'}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* User Certification Checkbox */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={hasAgreedCertification}
                onChange={(e) => {
                  setHasAgreedCertification(e.target.checked);
                  setErrorMessage(null);
                }}
                className="mt-0.5 rounded bg-neutral-900 border-neutral-700 text-rose-500 focus:ring-rose-500/40 w-4 h-4 cursor-pointer"
              />
              <span className="leading-relaxed group-hover:text-slate-100">
                I certify under penalty of perjury that I am at least 18 years old and consent to viewing late-night mature content, explicit poetry stanzas, and unmoderated artistic thoughts.
              </span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-400 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={rememberVerification}
                onChange={(e) => setRememberVerification(e.target.checked)}
                className="rounded bg-neutral-900 border-neutral-700 text-rose-500 focus:ring-rose-500/40 w-4 h-4 cursor-pointer"
              />
              <span className="group-hover:text-slate-300">
                Remember my 18+ verification on this browser (stores secure session flag)
              </span>
            </label>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(225,29,72,0.3)]"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel / Return to Feed
            </button>

            <button
              type="button"
              disabled={!isOldEnough || !hasAgreedCertification}
              onClick={handleConfirm}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isOldEnough && hasAgreedCertification
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] active:scale-95'
                  : 'bg-neutral-800 text-slate-500 border border-neutral-700 cursor-not-allowed opacity-60'
              }`}
            >
              <Unlock className="w-4 h-4" />
              <span>Enter [adult swim]</span>
            </button>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-300 mt-5 font-mono">
            Compliance notice: Age verification is enforced in accordance with digital broadcast guidelines for mature audiences.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
