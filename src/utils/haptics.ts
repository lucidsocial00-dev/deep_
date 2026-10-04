/**
 * Haptic Vibration Feedback Utilities using the Navigator Vibration API (navigator.vibrate)
 * Provides subtle tactile feedback for key user interactions where hardware and browser support it.
 */

/**
 * Check if the Navigator Vibration API is supported and available in the current runtime
 */
export function isVibrationSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator &&
    typeof navigator.vibrate === 'function'
  );
}

/**
 * Low-level safe vibration trigger wrapped in error handling.
 * Gracefully handles browsers that throw SecurityError in cross-origin frames or if user hasn't interacted.
 */
export function triggerVibration(pattern: number | number[]): boolean {
  if (!isVibrationSupported()) {
    return false;
  }
  try {
    return navigator.vibrate(pattern);
  } catch {
    // Gracefully ignore any DOM or permission errors
    return false;
  }
}

// Timestamp guards to prevent accidental double-firing on simultaneous event propagation
let lastLikeVibrationTime = 0;
let lastDislikeVibrationTime = 0;
let lastRankBadgeVibrationTime = 0;

/**
 * Subtle device vibration when a user successfully likes a post.
 * Pattern: Crisp, subtle 15ms tap.
 */
export function triggerLikeVibration(): boolean {
  const now = Date.now();
  if (now - lastLikeVibrationTime < 150) {
    return false;
  }
  lastLikeVibrationTime = now;
  // 15ms: ultra-subtle, tactile haptic click
  return triggerVibration(15);
}

/**
 * Subtle device vibration when a user dislikes a post.
 * Pattern: Dual tactile low-frequency tap [12, 30, 10] ms.
 */
export function triggerDislikeVibration(): boolean {
  const now = Date.now();
  if (now - lastDislikeVibrationTime < 150) {
    return false;
  }
  lastDislikeVibrationTime = now;
  return triggerVibration([12, 30, 10]);
}

/**
 * Subtle celebratory device vibration when a user earns a new reading rank badge.
 * Pattern: Refined tiered crescendo pulses [30, 45, 30, 45, 60] ms.
 * Clearly distinguishable as an achievement/rank-up without being jarring.
 */
export function triggerReadingRankBadgeVibration(): boolean {
  const now = Date.now();
  if (now - lastRankBadgeVibrationTime < 350) {
    return false;
  }
  lastRankBadgeVibrationTime = now;
  // Gentle tiered fanfare pulses
  return triggerVibration([30, 45, 30, 45, 60]);
}

let lastPollVoteVibrationTime = 0;

/**
 * Subtle tactile haptic vibration when a user casts a vote on a poll option.
 * Pattern: Crisp double-click tap [18, 35, 22] ms for a satisfying tactile ballot drop / vote register.
 */
export function triggerPollVoteVibration(): boolean {
  const now = Date.now();
  if (now - lastPollVoteVibrationTime < 150) {
    return false;
  }
  lastPollVoteVibrationTime = now;
  return triggerVibration([18, 35, 22]);
}
