/**
 * Relative Timestamp Formatter
 * Converts dates, timestamp numbers, or natural relative strings (e.g. '8 min ago', '2 hours ago')
 * into compact, high-legibility indicators like '2m ago', '1h ago', '3d ago', 'just now'.
 */

export function formatRelativeTime(input?: string | number | Date | null): string {
  if (!input) return 'just now';

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return 'just now';

    // Already in compact format like "2m ago", "1h ago", "3d ago"
    if (/^\d+[smhdw]\s*ago$/i.test(trimmed)) {
      return trimmed.toLowerCase();
    }

    const lower = trimmed.toLowerCase();
    if (lower === 'just now' || lower === 'now') return 'just now';
    if (lower === 'yesterday') return '1d ago';

    // Matches strings like "8 min ago", "18 minutes ago", "8 mins ago"
    const minMatch = lower.match(/^(\d+)\s*(?:min|minute|m)s?\s*ago$/);
    if (minMatch) return `${minMatch[1]}m ago`;

    // Matches strings like "2 hours ago", "1 hr ago", "3 hrs ago"
    const hourMatch = lower.match(/^(\d+)\s*(?:hour|hr|h)s?\s*ago$/);
    if (hourMatch) return `${hourMatch[1]}h ago`;

    // Matches strings like "1 day ago", "3 days ago"
    const dayMatch = lower.match(/^(\d+)\s*(?:day|d)s?\s*ago$/);
    if (dayMatch) return `${dayMatch[1]}d ago`;

    // Matches strings like "2 weeks ago"
    const weekMatch = lower.match(/^(\d+)\s*(?:week|wk|w)s?\s*ago$/);
    if (weekMatch) return `${weekMatch[1]}w ago`;

    // Try parsing as Date/timestamp string
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return getRelativeFromDate(parsedDate);
    }

    return trimmed;
  }

  if (typeof input === 'number') {
    const date = new Date(input > 1e11 ? input : input * 1000);
    return getRelativeFromDate(date);
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    return getRelativeFromDate(input);
  }

  return 'just now';
}

function getRelativeFromDate(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0 || diffMs < 45 * 1000) return 'just now';

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}
