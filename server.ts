import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Lazy initialization for Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // API Route: AI Compatibility Analysis
  app.post('/api/gemini/compatibility', async (req, res) => {
    try {
      const { userA, userB, mutualLikes, mutualDislikes, differingLikes, matchPercent } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          analysis: `${userA.name} and ${userB.name} share a ${matchPercent}% vibe compatibility based on their likes and dislikes! You both connect strongly on core artistic and cultural themes.`,
          synergyHighlights: [
            `Strong alignment on ${mutualLikes[0] || 'shared aesthetic posts'}`,
            `Shared perspective against ${mutualDislikes[0] || 'common dislikes'}`,
            `Playful balance in distinct tastes`,
          ],
          aiVibeTitle: `${matchPercent >= 85 ? 'Soul-Bound Creative Mates' : matchPercent >= 65 ? 'Dynamic Resonance Partners' : 'Exploratory Counterpoints'}`,
        });
      }

      const prompt = `Analyze the friendship compatibility between two users on a social and poetry network:
User A: ${userA.name} (${userA.bio || 'Passionate creator'})
User B: ${userB.name} (${userB.bio || 'Creative enthusiast'})

Calculated Compatibility Score: ${matchPercent}%

Mutual Liked Items/Topics: ${JSON.stringify(mutualLikes)}
Mutual Disliked Items/Topics: ${JSON.stringify(mutualDislikes)}
Divergent Liked Items: ${JSON.stringify(differingLikes)}

Provide a creative, engaging, and insightful 2-paragraph friendship "Vibe Synergy Report".
Explain WHY they match, what poetry/discussions they will enjoy together, and how their mutual likes and dislikes make their bond unique.
Return a JSON response with keys:
- "analysis": string (the detailed 2-paragraph report)
- "synergyHighlights": array of 3 short punchy bullet points
- "aiVibeTitle": short catchy title for their dynamic (e.g. "Cosmic Poetry Duo", "Eclectic Debate Mates")`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        analysis: parsed.analysis || 'Great vibe connection!',
        synergyHighlights: parsed.synergyHighlights || ['Shared artistic vision', 'Mutual dislikes bring unity', 'Great conversation starters'],
        aiVibeTitle: parsed.aiVibeTitle || 'Resonant Creative Mates',
      });
    } catch (error: any) {
      console.error('Gemini compatibility error:', error);
      return res.status(500).json({ error: 'Failed to generate compatibility report', details: error.message });
    }
  });

  // API Route: AI Poetry / PDF Document Analysis
  app.post('/api/gemini/analyze-document', async (req, res) => {
    try {
      const { title, textContent, type } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: `This ${type || 'document'} titled "${title}" explores expressive themes with nuanced tone and emotional depth.`,
          themes: ['Creative Expression', 'Reflective Thought', 'Artistic Vision'],
          haikuResponse: 'Words flow like calm stream,\nBound in pages of paper,\nEchoing in mind.',
        });
      }

      const prompt = `Analyze this ${type === 'poetry' ? 'Poem / Literary Piece' : 'Document / PDF Piece'} titled "${title}":
Text Preview / Excerpt:
"""
${textContent.slice(0, 3000)}
"""

Provide an insightful, poetic summary and literary breakdown. Return JSON with:
- "summary": string (3-4 sentences summarizing key themes and literary impression)
- "themes": array of strings (top 4 thematic tags)
- "haikuResponse": string (a 3-line haiku responding to the piece)
- "rhythmTone": string (e.g. "Elegiac & Melancholic", "Uplifting & Rhythmic", "Analytical & Structured")`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Gemini document analysis error:', error);
      return res.status(500).json({ error: 'Failed to analyze document', details: error.message });
    }
  });

  // API Route: AI Suggest Relevant Hashtags
  app.post('/api/gemini/suggest-hashtags', async (req, res) => {
    try {
      const { content, documentTitle, documentSummary } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback suggested hashtags if Gemini client not available
        const words = (content || '')
          .split(/\s+/)
          .filter((w: string) => w.length > 4)
          .slice(0, 3)
          .map((w: string) => w.replace(/[^a-zA-Z0-9]/g, ''));
        const fallbackTags = Array.from(new Set([...words, 'Poetry', 'Verse', 'deep_'])).slice(0, 5);

        return res.json({
          hashtags: fallbackTags,
          reasoning: 'Generated intelligent hashtags based on text content and document themes.',
        });
      }

      const prompt = `Analyze this user post and attached document details to suggest 4 to 6 relevant single-word hashtags:
User Post Content: "${content || 'No text provided'}"
Attached Document Title: "${documentTitle || 'None'}"
Attached Document Excerpt/Summary: "${documentSummary || 'None'}"

Rules:
1. Provide 4 to 6 single-word hashtags (no spaces or hyphens) representing core themes, mood, literary genre, or topics.
2. Return a JSON object with:
   - "hashtags": array of strings (e.g. ["Poetry", "Reflective", "Cyberpunk", "MidnightVerse", "DeepTech"])
   - "reasoning": a concise 1-sentence explanation of why these hashtags were chosen.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const cleanTags = (parsed.hashtags || ['Poetry', 'Verse', 'deep_']).map((t: string) =>
        t.replace(/^#+/, '').replace(/[^a-zA-Z0-9_]/g, '')
      ).filter(Boolean);

      return res.json({
        hashtags: cleanTags.length > 0 ? cleanTags : ['Poetry', 'Verse', 'deep_'],
        reasoning: parsed.reasoning || 'Suggested based on your post themes and document summary.',
      });
    } catch (error: any) {
      console.error('Gemini suggest-hashtags error:', error);
      return res.status(500).json({ error: 'Failed to suggest hashtags', details: error.message });
    }
  });

  // API Route: AI Trending Hashtag Story Summarizer
  app.post('/api/gemini/trending-hashtag', async (req, res) => {
    try {
      const { hashtag, postsExcerpts } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          summary: `#${hashtag} is trending globally with intense discussion and creative contributions across the community.`,
          keyTakeaways: ['High community engagement', 'Diverse perspectives shared', 'Active literary & social conversation'],
        });
      }

      const prompt = `Summarize what is driving the trending topic #${hashtag} based on these recent user posts:
${JSON.stringify(postsExcerpts)}

Return JSON with:
- "summary": string (3 short sentences explaining why #${hashtag} is trending right now)
- "keyTakeaways": array of 3 bullet points
- "vibeSentiment": string (e.g. "Inspiring & Philosophical", "High Energy & Creative", "Thought-Provoking")`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (error: any) {
      console.error('Gemini hashtag summary error:', error);
      return res.status(500).json({ error: 'Failed to summarize hashtag', details: error.message });
    }
  });

  // API Route: AI Reading Time & Group Points Estimator
  app.post('/api/reading/estimate', async (req, res) => {
    try {
      const { url, hashtag, text, title: providedTitle } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required for reading time estimation' });
      }

      let cleanDomain = 'web';
      try {
        const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
        cleanDomain = parsedUrl.hostname.replace(/^www\./, '');
      } catch {
        cleanDomain = url.split('/')[0] || 'web';
      }

      const targetHashtag = (hashtag || 'deep_').replace(/^#+/, '').trim() || 'deep_';
      const ai = getGeminiClient();

      let title = providedTitle || '';
      let excerpt = text || '';
      let wordCount = 0;
      let estimatedMinutes = 0;

      // If text is provided, count directly
      if (text && text.trim().length > 30) {
        wordCount = text.trim().split(/\s+/).length;
        if (wordCount < 120) {
          // It's a short excerpt, estimate whole article from context
          wordCount = Math.floor(wordCount * 7 + 450);
        }
      }

      if (ai && (!title || !wordCount)) {
        try {
          const prompt = `Analyze this reading link for a mindful reading platform:
URL: ${url}
Provided Hashtag Group: #${targetHashtag}
Provided Text / Snippet: "${text || 'None'}"
Provided Title: "${providedTitle || 'None'}"

Instructions:
1. Estimate the realistic total article word count (typical articles range from 450 to 4500 words).
2. Calculate estimated reading time in minutes at average reading speed (220 words/minute).
3. Generate a compelling, accurate title for the piece if not provided.
4. Provide a 2-sentence literary or insightful summary excerpt.
5. Confirm or refine the most relevant Hashtag Group (e.g., "${targetHashtag}").

Return JSON with:
- "title": string
- "excerpt": string
- "wordCount": number (integer)
- "estimatedMinutes": number (integer, min 1)
- "hashtag": string (single clean hashtag without #)
- "category": string`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const parsed = JSON.parse(response.text || '{}');
          title = title || parsed.title;
          excerpt = excerpt || parsed.excerpt;
          wordCount = wordCount || Number(parsed.wordCount) || 1200;
          estimatedMinutes = Number(parsed.estimatedMinutes) || Math.max(1, Math.ceil(wordCount / 220));
        } catch (aiErr) {
          console.warn('Gemini reading estimate fallback:', aiErr);
        }
      }

      // Fallback heuristics if Gemini wasn't available or didn't populate
      if (!wordCount) {
        const lower = url.toLowerCase();
        if (lower.includes('research') || lower.includes('paper') || lower.includes('archive')) {
          wordCount = 2800;
        } else if (lower.includes('essay') || lower.includes('longform') || lower.includes('philosophy')) {
          wordCount = 1900;
        } else if (lower.includes('poem') || lower.includes('verse') || lower.includes('stanza')) {
          wordCount = 550;
        } else {
          wordCount = 1100;
        }
      }

      if (!estimatedMinutes) {
        estimatedMinutes = Math.max(1, Math.ceil(wordCount / 220));
      }

      if (!title) {
        const pathEnd = url.split('/').filter(Boolean).pop() || '';
        const cleanSlug = pathEnd.replace(/[-_]/g, ' ').replace(/\.html?$/i, '');
        title = cleanSlug && cleanSlug.length > 3 ? cleanSlug.charAt(0).toUpperCase() + cleanSlug.slice(1) : `Article on ${cleanDomain}`;
      }

      if (!excerpt) {
        excerpt = `Curated reading for #${targetHashtag} exploring core perspectives and contemporary thought.`;
      }

      // Points calculation formula:
      // Base: 10 pts
      // Length factor: 10 pts per minute
      // Depth bonus for longform readings
      const basePoints = 10;
      const minutePoints = estimatedMinutes * 10;
      let depthBonus = 0;
      let difficulty: 'Quick Read' | 'Moderate Read' | 'Deep Dive' | 'Longform Scholarly' = 'Quick Read';

      if (estimatedMinutes >= 15) {
        depthBonus = 75;
        difficulty = 'Longform Scholarly';
      } else if (estimatedMinutes >= 8) {
        depthBonus = 35;
        difficulty = 'Deep Dive';
      } else if (estimatedMinutes >= 4) {
        depthBonus = 15;
        difficulty = 'Moderate Read';
      }

      const totalPoints = basePoints + minutePoints + depthBonus;

      const readingLink = {
        id: 'read_' + Math.random().toString(36).substring(2, 9),
        url: url.startsWith('http') ? url : `https://${url}`,
        title,
        domain: cleanDomain,
        excerpt,
        wordCount,
        estimatedMinutes,
        readingPoints: totalPoints,
        hashtag: targetHashtag,
        difficulty,
        readTimeFormatted: `${estimatedMinutes} min read`,
        addedAt: 'Just now',
      };

      return res.json({
        readingLink,
        pointsBreakdown: {
          base: basePoints,
          perMinute: minutePoints,
          depthBonus,
          totalPoints,
          hashtag: targetHashtag,
        },
      });
    } catch (error: any) {
      console.error('Reading time estimation error:', error);
      return res.status(500).json({ error: 'Failed to estimate reading time', details: error.message });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VibePulse Express Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
