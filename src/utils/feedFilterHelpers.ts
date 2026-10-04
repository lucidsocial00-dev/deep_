import { Post } from '../types';

/**
 * Checks if a post qualifies as Poetry (exclusive poetry feed mode).
 */
export function isPoetryPost(post: Post): boolean {
  if (post.poetryFormatted) return true;

  const poetryTags = [
    'poetry',
    'verse',
    'poem',
    'poems',
    'stanza',
    'stanzas',
    'rhyme',
    'haiku',
    'sonnet',
    'ballad',
    'audioverse',
    'spokenword',
    'canto',
    'couplet',
    'lyric',
    'quatrain',
    'versecraft',
    'poet',
  ];

  const hasPoetryTag = post.hashtags?.some((h) =>
    poetryTags.includes(h.toLowerCase().replace(/^#+/, ''))
  );
  if (hasPoetryTag) return true;

  // Visual quote card citing poetry
  if (post.quoteCard && post.quoteCard.sourceType === 'poetry') {
    return true;
  }

  return false;
}

/**
 * Checks if a post qualifies as Literature (PDFs, manuscripts, books, reading links, and long articles).
 */
export function isLiteraturePost(post: Post): boolean {
  // Attached PDF or manuscript document
  if (post.document) return true;

  // Attached curated reading links (articles, scholarly essays, books)
  if (post.readingLink || (post.readingLinks && post.readingLinks.length > 0)) return true;

  // Quote card citing PDF document
  if (post.quoteCard && post.quoteCard.sourceType === 'pdf') return true;

  // Literature, manuscripts, books, longform essays tags
  const literatureTags = [
    'literature',
    'manuscript',
    'manuscripts',
    'books',
    'book',
    'reading',
    'document',
    'documents',
    'essay',
    'essays',
    'longform',
    'longread',
    'article',
    'articles',
    'zine',
    'zines',
    'print',
    'scholarly',
    'publication',
    'reader',
    'treatise',
    'prose',
    'anthology',
    'paper',
  ];

  const hasLiteratureTag = post.hashtags?.some((h) =>
    literatureTags.includes(h.toLowerCase().replace(/^#+/, ''))
  );
  if (hasLiteratureTag) return true;

  // Long articles (e.g. >= 100 words or length >= 350 chars with article/essay/book/manuscript keywords)
  const text = (post.content || '').toLowerCase();
  const wordCount = post.content ? post.content.trim().split(/\s+/).filter(Boolean).length : 0;
  if (wordCount >= 100) {
    return true;
  }

  if (
    post.content &&
    post.content.trim().length >= 350 &&
    (text.includes('article') ||
      text.includes('manuscript') ||
      text.includes('chapter') ||
      text.includes('essay') ||
      text.includes('book') ||
      text.includes('pdf') ||
      text.includes('treatise') ||
      text.includes('reading') ||
      text.includes('publication'))
  ) {
    return true;
  }

  return false;
}
