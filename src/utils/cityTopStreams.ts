import { CityRegion, HashtagGroup, Post, User } from '../types';
import { CITY_REGIONS, TAG_CITY_MAPPING, getCityForHashtag, getAutomaticCityForPost } from './cityRegions';
import { formatStreamName, normalizeTag } from './hashtagGroups';

export interface TopStreamItem extends HashtagGroup {
  rank: number;
  activityScore: number;
  postCount: number;
  creatorCount: number;
  growthRate: string;
  sampleExcerpt?: string;
  recentAuthors?: { id: string; name: string; avatar: string }[];
}

/**
 * Curated supplemental themes per city to ensure every city has at least 10 rich sovereign streams.
 */
const CITY_THEMATIC_STREAMS: Record<string, { tag: string; name: string; description: string; category: string; vibe: string }[]> = {
  kyoto: [
    { tag: 'Kyoto', name: '#Kyoto (Kyoto) Stream', description: 'Traditional bamboo paths, ink calligraphy, quiet cedar shrines, and mindful aesthetic reflections.', category: 'Places & Aesthetics', vibe: 'Rain on cedar roofs and timeless craftsmanship.' },
    { tag: 'Zen', name: '#Zen (Kyoto) Stream', description: 'Mindful stillness, meditative prose, tatami room contemplations, and undisturbed focus.', category: 'Mindfulness & Solitude', vibe: 'Still water reflects all things without ripples.' },
    { tag: 'Haiku', name: '#Haiku (Kyoto) Stream', description: 'Seventeen-syllable captures, seasonal kigo stanzas, ink sketches, and ephemeral beauty.', category: 'Literature & Verse', vibe: 'Three lines of ink holding a universe of season.' },
    { tag: 'Tea', name: '#Tea (Kyoto) Stream', description: 'Uji matcha rituals, acoustic brewing ambience, ceramic appreciation, and calm gatherings.', category: 'Ritual & Culture', vibe: 'Boiling kettle sounds, green powder whispers, present focus.' },
    { tag: 'Bamboo', name: '#Bamboo (Kyoto) Stream', description: 'Wind through Arashiyama groves, organic architecture, hollow depth, and flexible resilience.', category: 'Nature & Solitude', vibe: 'Bending before the autumn gale, never breaking.' },
    { tag: 'Tatami', name: '#Tatami (Kyoto) Stream', description: 'Straw woven sanctuaries, low-table creative salons, morning light geometry, and silent study.', category: 'Sanctuary & Interior', vibe: 'Barefoot upon sweet straw; the mind settles home.' },
    { tag: 'Ink', name: '#Ink (Kyoto) Stream', description: 'Sumi brush strokes, black stone inkwells, handmade washi paper, and calligraphic stanzas.', category: 'Visual Verse & Ink', vibe: 'Black soot and water weaving truth into white fibers.' },
    { tag: 'Cedar', name: '#Cedar (Kyoto) Stream', description: 'Rain falling on aged wood, mountain shrines, moss stone steps, and restorative quietude.', category: 'Nature & Atmosphere', vibe: 'The scent of damp timber after a three-day downpour.' },
    { tag: 'Gardens', name: '#Gardens (Kyoto) Stream', description: 'Raked gravel waves, moss cushions, stone placement philosophy, and miniature cosmos.', category: 'Contemplative Spaces', vibe: 'Waves carved in stone without a drop of water.' },
    { tag: 'KyotoCraft', name: '#KyotoCraft (Kyoto) Stream', description: 'Centuries-old joinery, lacquerware, hand-spun silks, and sovereign artisanal independence.', category: 'Artisanal Craft', vibe: 'Generations of hands refining a single curve.' },
  ],
  berlin: [
    { tag: 'Encrypted', name: '#Encrypted (Berlin) Stream', description: 'Zero-Knowledge profile vaults, client-side AES-256 cryptography, sovereign identity, and verifiable peer data.', category: 'Cryptography & Privacy', vibe: 'Master keys stay in browser memory. Servers are dumb pipes.' },
    { tag: 'Cipher', name: '#Cipher (Berlin) Stream', description: 'Mathematical verse, steganographic visual art, crypto riddles, and verifiable algorithmic proofs.', category: 'Cryptography & Riddles', vibe: 'Truth hidden in plain sight across public channels.' },
    { tag: 'Privacy', name: '#Privacy (Berlin) Stream', description: 'Data sovereignty protocols, un-trackable communication, anti-surveillance design, and local-first memory.', category: 'Sovereign Network', vibe: 'Your thoughts are yours alone until you choose to broadcast.' },
    { tag: 'Cyber', name: '#Cyber (Berlin) Stream', description: 'Brutalist interfaces, peer-to-peer telemetry, hardware encryption dongles, and underground terminals.', category: 'Cybernetics', vibe: 'Minimal latency, maximum cryptographic resilience.' },
    { tag: 'Underground', name: '#Underground (Berlin) Stream', description: 'Basement modular synthesizers, dim red light studios, sub-bass depth, and unindexed salons.', category: 'Music & Counterculture', vibe: 'Signal thrives where the commercial cameras cannot reach.' },
    { tag: 'ZeroKnowledge', name: '#ZeroKnowledge (Berlin) Stream', description: 'Mathematical proofs of state without revealing underlying private keys or sensitive user facts.', category: 'Cryptography & Science', vibe: 'Prove everything, reveal nothing.' },
    { tag: 'Synthesizer', name: '#Synthesizer (Berlin) Stream', description: 'Voltage-controlled oscillators, patch cables, generative ambient drones, and analog sound design.', category: 'Audio Architecture', vibe: 'Square waves softened by vintage German filters.' },
    { tag: 'Mesh', name: '#Mesh (Berlin) Stream', description: 'Decentralized local mesh nodes, peer relay topology, and offline packet hopping protocols.', category: 'Decentralized Systems', vibe: 'When the backbone drops, the local neighborhood links stand.' },
    { tag: 'Hardware', name: '#Hardware (Berlin) Stream', description: 'Custom mechanical keyboards, soldering iron verse, open FPGA boards, and physical computing.', category: 'Makers & Hardware', vibe: 'Firmware you can audit with an oscilloscope.' },
    { tag: 'Monochrome', name: '#Monochrome (Berlin) Stream', description: 'High contrast black and white design, concrete architecture, austere typography, and stark verse.', category: 'Design & Philosophy', vibe: 'Removing color makes the underlying bones unmistakable.' },
  ],
  san_francisco: [
    { tag: 'Mates', name: '#Mates (San Francisco) Stream', description: 'Discovering genuine compatibility through shared dislikes, mutual creative values, and depth scoring.', category: 'Social Compatibility', vibe: 'Bonding over shared silence and disliking artificial noise.' },
    { tag: 'Tech', name: '#Tech (San Francisco) Stream', description: 'Sovereign client architectures, distributed graph state, local AI inference, and decentralized tools.', category: 'Technology', vibe: 'Building tools that empower human autonomy.' },
    { tag: 'AI', name: '#AI (San Francisco) Stream', description: 'Local neural models, creative prompt engineering, automated poetic analysis, and generative verse.', category: 'Artificial Intelligence', vibe: 'Silicon mirrors of human metaphorical thought.' },
    { tag: 'Crypto', name: '#Crypto (San Francisco) Stream', description: 'Cryptographic hash functions, verifiable ledger roots, smart contracts, and economic sovereignty.', category: 'Decentralized Finance', vibe: 'Immutable state anchored across thousands of independent nodes.' },
    { tag: 'Sovereign', name: '#Sovereign (San Francisco) Stream', description: 'Personal servers, self-hosted libraries, private photo vaults, and unplatformable communities.', category: 'Digital Freedom', vibe: 'Own your data from the silicon up.' },
    { tag: 'Fog', name: '#Fog (San Francisco) Stream', description: 'Twin Peaks mist, Pacific twilight walks, moody coastal photography, and introspective writing.', category: 'Atmosphere & Solitude', vibe: 'The city softens when Karl rolls through the avenues.' },
    { tag: 'Compatibility', name: '#Compatibility (San Francisco) Stream', description: 'Deep psychological depth questions, multi-vector affinity testing, and lasting peer friendships.', category: 'Human Connection', vibe: 'Real alignment is found in how you resolve creative friction.' },
    { tag: 'Pacific', name: '#Pacific (San Francisco) Stream', description: 'Ocean Beach waves, cold surf poetry, sea wall conversations, and sunset horizon meditations.', category: 'Coastal Solitude', vibe: 'Salt air clearing the mind of digital residue.' },
    { tag: 'Indie', name: '#Indie (San Francisco) Stream', description: 'Boutique software studios, zines, self-published chapbooks, and indie creators charting new paths.', category: 'Independent Creators', vibe: 'One creator, one laptop, one sovereign vision.' },
    { tag: 'Algorithms', name: '#Algorithms (San Francisco) Stream', description: 'Heuristic search, vector embeddings, graph algorithms, and elegant data structure craft.', category: 'Computer Science', vibe: 'Efficiency and elegance converge in tight big-O loops.' },
  ],
  london: [
    { tag: 'Verse', name: '#Verse (London) Stream', description: 'Spoken word recordings, chapbook manuscripts, acoustic solitude scores, and rainy-day stanzas.', category: 'Literature & Verse', vibe: 'Harmonizing acoustic frequency with contemplative writing.' },
    { tag: 'Literature', name: '#Literature (London) Stream', description: 'Classic and modernist prose, literary criticism, secondhand bookstore finds, and marginalia.', category: 'Books & Criticism', vibe: 'The weight of a hundred-year-old hardcover in hand.' },
    { tag: 'Acoustic', name: '#Acoustic (London) Stream', description: 'Fingerstyle guitar, upright piano reverberations, vinyl crackle, and late-night accompaniment.', category: 'Music & Score', vibe: 'Wood and strings vibrating in an unamplified room.' },
    { tag: 'Essays', name: '#Essays (London) Stream', description: 'Long-form cultural essays, personal letters, epistolary fiction, and thoughtful critiques.', category: 'Non-Fiction & Prose', vibe: 'Testing ideas against the grain of lived experience.' },
    { tag: 'Rain', name: '#Rain (London) Stream', description: 'Cobblestone reflections, café window condensation, gray afternoon clarity, and quiet walks.', category: 'Atmosphere & Solitude', vibe: 'The rhythm of drops upon an umbrella fabric.' },
    { tag: 'Chapbook', name: '#Chapbook (London) Stream', description: 'Hand-sewn poetry chapbooks, PDF manuscript layouts, typography grids, and pocket editions.', category: 'Publishing & Design', vibe: 'Thirty-two pages bound by needle and waxed thread.' },
    { tag: 'SpokenWord', name: '#SpokenWord (London) Stream', description: 'Vocal performance, breath cadences, live salon recordings, and rhythmically spoken stanzas.', category: 'Audio Verse', vibe: 'The voice as the first and purest musical instrument.' },
    { tag: 'Salon', name: '#Salon (London) Stream', description: 'Private drawing room readings, late-night tea debates, philosophical inquiry, and peer critiques.', category: 'Creative Salon', vibe: 'Candlelight discussions continuing until the dawn trains run.' },
    { tag: 'Bloomsbury', name: '#Bloomsbury (London) Stream', description: 'Square gardens, blue plaques, historical writing retreats, and intellectual community traditions.', category: 'Heritage & History', vibe: 'Walking the very pavements where Woolf composed her sentences.' },
    { tag: 'Solitude', name: '#Solitude (London) Stream', description: 'Finding profound creative isolation inside a bustling metropolis of millions.', category: 'Mindfulness & Focus', vibe: 'A crowded underground train where nobody knows your thoughts.' },
  ],
  tokyo: [
    { tag: 'deep_', name: '#deep_ (Tokyo) Stream', description: 'The flagship collective exploring intentional connections, encrypted feeds, and sovereign digital presence.', category: 'Network Ecosystem', vibe: 'Trading endless algorithmic loops for mindful focus and sovereign connections.' },
    { tag: 'NeoTokyo', name: '#NeoTokyo (Tokyo) Stream', description: 'Cyber-literary experimentation, neon-soaked night photography, holographic prose, and retro tech.', category: 'Futurism & Aesthetics', vibe: 'High tech, quiet heart.' },
    { tag: 'Ambient', name: '#Ambient (Tokyo) Stream', description: 'Field recordings from train stations, rain drains, vending machine hums, and minimal synthesis.', category: 'Sound Design', vibe: 'The city itself is an endlessly playing soundtrack.' },
    { tag: 'Midnight', name: '#Midnight (Tokyo) Stream', description: 'Late-night ramen counters, empty alleyways, 3 AM creative surges, and nocturnal inspiration.', category: 'Nocturnal Life', vibe: 'When the city sleeps, the creators finally awaken.' },
    { tag: 'Hardware', name: '#Hardware (Tokyo) Stream', description: 'Akihabara component scavenging, vacuum tube amplifiers, custom key switches, and retro microcomputers.', category: 'Makers & Electronics', vibe: 'Bespoke circuits crafted with relentless precision.' },
    { tag: 'Neon', name: '#Neon (Tokyo) Stream', description: 'Cyan and magenta glow, wet asphalt reflections, glowing storefronts, and vibrant night palettes.', category: 'Visual Aesthetics', vibe: 'Color burning through the mist like visual poetry.' },
    { tag: 'Focus', name: '#Focus (Tokyo) Stream', description: 'Monk-like dedication to craft, deliberate hours of undistracted practice, and micro-mastery.', category: 'Productivity & Flow', vibe: 'One brush, one canvas, zero incoming notifications.' },
    { tag: 'SoundDesign', name: '#SoundDesign (Tokyo) Stream', description: 'Spatial audio experiments, binaural city ambiances, tape loops, and generative acoustics.', category: 'Audio Craft', vibe: 'Every whisper in the train car carries acoustic weight.' },
    { tag: 'CyberLiterary', name: '#CyberLiterary (Tokyo) Stream', description: 'Terminal-based poetry, markdown chapbooks, code as literature, and algorithmic metaphors.', category: 'Digital Literature', vibe: 'Functions that return emotion rather than integers.' },
    { tag: 'Subway', name: '#Subway (Tokyo) Stream', description: 'Yamanote loop observations, silent passengers reading books, rhythmic train chime recordings.', category: 'Urban Observations', vibe: 'Millions moving together in synchronous silence.' },
  ],
  paris: [
    { tag: 'Poetry', name: '#Poetry (Paris) Stream', description: 'Classical and modern verse architecture, salon discourse, existential philosophy, and printed chapbooks.', category: 'Literature & Verse', vibe: 'Rhyme, meter, metaphor, and emotional clarity over algorithmic noise.' },
    { tag: 'Philosophy', name: '#Philosophy (Paris) Stream', description: 'Existential inquiry, phenomenology of social networks, ethics of digital identity, and dialectics.', category: 'Philosophy', vibe: 'Questioning the very categories by which we measure connection.' },
    { tag: 'Art', name: '#Art (Paris) Stream', description: 'Oil palettes, gallery salons, visual metaphors, photographic compositions, and aesthetic critique.', category: 'Visual Arts', vibe: 'Seeing what ordinary glances consistently overlook.' },
    { tag: 'Chapbook', name: '#Chapbook (Paris) Stream', description: 'Printed PDFs, typography layout, cover illustration, and poetic booklet archiving.', category: 'Publishing', vibe: 'Tangible pages surviving the digital ephemera.' },
    { tag: 'Stanza', name: '#Stanza (Paris) Stream', description: 'Structural breakdown of poetic form: quatrains, couplets, free verse cadence, and enjambment.', category: 'Poetic Craft', vibe: 'The architecture of line breaks and intentional white space.' },
    { tag: 'Seine', name: '#Seine (Paris) Stream', description: 'Bouquiniste green stalls, river bridge breezes, dusk reflections, and riverside manuscript reading.', category: 'Places & Atmosphere', vibe: 'The river that has reflected a thousand writers before us.' },
    { tag: 'Existential', name: '#Existential (Paris) Stream', description: 'Facing the absurdity of modern hyper-consumption with deliberate artistic integrity.', category: 'Existential Thought', vibe: 'You are the author of your own meaning.' },
    { tag: 'Cafe', name: '#Cafe (Paris) Stream', description: 'Zinc countertop espressos, corner tables for writing notebooks, observed strangers, and morning stanzas.', category: 'Writer Rituals', vibe: 'A small cup of black coffee and three clean white pages.' },
    { tag: 'Rhyme', name: '#Rhyme (Paris) Stream', description: 'Sonnet sequences, slant rhymes, phonetic depth, and internal music of human speech.', category: 'Poetic Craft', vibe: 'Words echoing each other across stanzas like bells.' },
    { tag: 'Salon', name: '#Salon (Paris) Stream', description: 'Intimate evening readings where creators share works-in-progress without fear of algorithmic censure.', category: 'Creative Salon', vibe: 'Where manuscripts are weighed by heart, not by clicks.' },
  ],
  reykjavik: [
    { tag: 'Minimalism', name: '#Minimalism (Reykjavik) Stream', description: 'Focusing on essential design, uncluttered mental spaces, zero digital bloat, and deliberate consumption.', category: 'Lifestyle & Philosophy', vibe: 'Less noise, deeper signal.' },
    { tag: 'Solitude', name: '#Solitude (Reykjavik) Stream', description: 'Glacial silence, midnight sun writing retreats, winter dark contemplation, and inner stillness.', category: 'Mindfulness & Solitude', vibe: 'Alone with the landscape, whole with oneself.' },
    { tag: 'Aurora', name: '#Aurora (Reykjavik) Stream', description: 'Night sky light ribbons, geomagnetic phenomena, celestial poetry, and midnight recordings.', category: 'Sky & Space', vibe: 'Green fire washing across the cold basalt horizon.' },
    { tag: 'Glacier', name: '#Glacier (Reykjavik) Stream', description: 'Ancient ice compression, millennial timescales, geological patience, and stark beauty.', category: 'Nature & Geology', vibe: 'Ice that was snow when emperors were crowned.' },
    { tag: 'Basalt', name: '#Basalt (Reykjavik) Stream', description: 'Hexagonal stone pillars, black sand beaches, volcanic stone textures, and mineral verse.', category: 'Earth & Textures', vibe: 'Cool geometric stone sculpted by magma and Atlantic surf.' },
    { tag: 'Silence', name: '#Silence (Reykjavik) Stream', description: 'Acoustic quiet where your own heartbeat is the loudest percussion in the valley.', category: 'Acoustic Sanctuary', vibe: 'Silence is not empty; it is full of answers.' },
    { tag: 'Nordic', name: '#Nordic (Reykjavik) Stream', description: 'Saga traditions, winter wool, geothermal hot springs, and unhurried northern living.', category: 'Culture & Heritage', vibe: 'Ancient tales retold beside glowing hearths.' },
    { tag: 'Volcanic', name: '#Volcanic (Reykjavik) Stream', description: 'Subterranean fire, thermal vents, primal creation of new earth, and passionate verse.', category: 'Nature & Power', vibe: 'The planet remaking itself under your boots.' },
    { tag: 'Soundscape', name: '#Soundscape (Reykjavik) Stream', description: 'Wind through lyme grass, cracking icebergs, distant seabird calls, and drone music.', category: 'Ambient Audio', vibe: 'The music of the uninhabited earth.' },
    { tag: 'Icelandic', name: '#Icelandic (Reykjavik) Stream', description: 'Ancient grammar preservation, poetic naming traditions, and literary community bonds.', category: 'Language & Verse', vibe: 'Words that have not altered their spelling in a thousand years.' },
  ],
  new_york: [
    { tag: 'Night', name: '#Night (New York) Stream', description: 'Nocturnal metropolis, 3 AM diners, steam rising from street grates, and nocturnal stanzas.', category: 'Urban Solitude', vibe: 'Finding depth amid the nocturnal pulse of the creative metropolis.' },
    { tag: 'Urban', name: '#Urban (New York) Stream', description: 'Brownstone stoops, subway transit rhythm, architecture of steel and brick, and city vignettes.', category: 'City Life', vibe: 'Eight million stories intersecting on one avenue block.' },
    { tag: 'Jazz', name: '#Jazz (New York) Stream', description: 'Syncopated verse, brass depth, late-night basement clubs, and improvisational writing.', category: 'Music & Improvisation', vibe: 'Playing what is not written on the score.' },
    { tag: 'Indie', name: '#Indie (New York) Stream', description: 'Independent press chapbooks, DIY gallery openings, bedroom record labels, and sovereign artists.', category: 'Independent Culture', vibe: 'Real culture is created in backrooms, not boardrooms.' },
    { tag: 'Nocturnal', name: '#Nocturnal (New York) Stream', description: 'For wanderers who do their deepest thinking and writing while the rest of the world rests.', category: 'Night Writers', vibe: 'The quietest thoughts arrive when the streetlamps hum alone.' },
    { tag: 'Coffeehouse', name: '#Coffeehouse (New York) Stream', description: 'Village espresso counters, ink stained napkins, eavesdropped genius dialogue, and reading nooks.', category: 'Creative Sanctuaries', vibe: 'Where a single cup buys three hours of uninterrupted writing.' },
    { tag: 'Rhythm', name: '#Rhythm (New York) Stream', description: 'Subway track meters, heartbeat cadence, beat generation roots, and spoken stanzas.', category: 'Poetic Cadence', vibe: 'The beat of tires over asphalt expansion joints.' },
    { tag: 'Metropolis', name: '#Metropolis (New York) Stream', description: 'Canyons of glass and limestone, rooftop skyline panoramas, and the vast scale of human endeavor.', category: 'Architecture & Scale', vibe: 'Tiny human souls building mountains of iron and glass.' },
    { tag: 'Broadsheet', name: '#Broadsheet (New York) Stream', description: 'Newsprint layouts, literary review pamphlets, printed PDF chapbooks, and typewritten stanzas.', category: 'Publishing & Print', vibe: 'Ink drying on coarse paper; hot off the press.' },
    { tag: 'Village', name: '#Village (New York) Stream', description: 'Greenwich alleyways, historic coffee houses, literary landmarks, and enduring bohemian spirit.', category: 'Neighborhoods & Memory', vibe: 'Wandering where the street grid breaks and poetry begins.' },
  ],
  amsterdam: [
    { tag: 'Canals', name: '#Canals (Amsterdam) Stream', description: 'Quiet ripples beneath historic brick bridges, floating houseboats, and water reflections at dusk.', category: 'Places & Reflections', vibe: 'Ripples carrying light under stone archways.' },
    { tag: 'Print', name: '#Print (Amsterdam) Stream', description: 'Traditional letterpress workshops, movable metal type, ink composition, and hand-bound editions.', category: 'Publishing & Craft', vibe: 'The unmistakable scent of fresh black ink on rag paper.' },
    { tag: 'OpenSource', name: '#OpenSource (Amsterdam) Stream', description: 'Decentralized protocol design, verifiable computing, public code commons, and digital sovereignty.', category: 'Cryptography & Tech', vibe: 'Code authored for communal resilience rather than platform enclosure.' },
    { tag: 'Bicycle', name: '#Bicycle (Amsterdam) Stream', description: 'Rain-soaked cycle lanes, quiet evening commutes, bell chimes, and meditative transit cadence.', category: 'Urban Movement', vibe: 'Cadence of pedals through the autumn drizzle.' },
    { tag: 'Typography', name: '#Typography (Amsterdam) Stream', description: 'Dutch modern typography, kerning nuances, grid systems, and book spine hierarchy.', category: 'Design Architecture', vibe: 'Geometry that gives breath to the written phrase.' },
    { tag: 'Jordaan', name: '#Jordaan (Amsterdam) Stream', description: 'Courtyard almshouses (hofjes), hidden gardens, acoustic folk gatherings, and canal side conversations.', category: 'Neighborhoods', vibe: 'Stepping through an arched doorway into absolute silence.' },
    { tag: 'Houseboats', name: '#Houseboats (Amsterdam) Stream', description: 'Floating sanctuaries, woodstove smoke over winter canals, and living gently on the water.', category: 'Waterfront Living', vibe: 'A gentle rock whenever a tour boat glides by.' },
    { tag: 'Letterpress', name: '#Letterpress (Amsterdam) Stream', description: 'Cast iron presses, lead sorting cases, tactile embossed poems, and artisan ink rollers.', category: 'Artisan Craft', vibe: 'Physical impression pressed deep into heavy paper.' },
    { tag: 'Bridges', name: '#Bridges (Amsterdam) Stream', description: 'Arching brick pathways, illuminated evening bridges, and standing mid-water watching dusk fall.', category: 'Architecture', vibe: 'Connecting two shores in stone and light.' },
    { tag: 'Solitude', name: '#Solitude (Amsterdam) Stream', description: 'Quiet morning walks along the Singel before the world stirs; serene personal clarity.', category: 'Mindfulness & Solitude', vibe: 'Misty water reflections before dawn.' },
  ],
  seoul: [
    { tag: 'Hanok', name: '#Hanok (Seoul) Stream', description: 'Clay tile eaves, pine rafters, courtyard stone basins, and rain cascading into courtyard gardens.', category: 'Architecture & Solitude', vibe: 'Wood that breathes with the changing seasons.' },
    { tag: 'Calligraphy', name: '#Calligraphy (Seoul) Stream', description: 'Ink stone grinding, brush stroke pressure, Korean hangul geometry, and contemplative mark-making.', category: 'Visual Verse', vibe: 'Black soot ink meeting fibrous mulberry paper.' },
    { tag: 'TeaHouse', name: '#TeaHouse (Seoul) Stream', description: 'Insadong alleyways, roasted barley aroma, porcelain bowls, and acoustic guzheng melodies.', category: 'Ritual & Gathering', vibe: 'Steam rising slowly between two quiet friends.' },
    { tag: 'NightCity', name: '#NightCity (Seoul) Stream', description: 'Elevated walkways, stream walks along Cheonggyecheon, midnight market neon, and creative solitude.', category: 'Nocturnal Life', vibe: 'The city hums low while the night thoughts deepen.' },
    { tag: 'Zines', name: '#Zines (Seoul) Stream', description: 'Risograph indie publishing, photobook binding, small-batch print shops, and experimental poems.', category: 'Indie Publishing', vibe: 'Limited runs crafted with intimate intention.' },
    { tag: 'Bukchon', name: '#Bukchon (Seoul) Stream', description: 'Winding uphill alleys, traditional wooden gates, panoramic city overlooks, and quiet steps.', category: 'Heritage & Walks', vibe: 'Overlooking a city of glass while leaning against ancient cedar.' },
    { tag: 'Hangul', name: '#Hangul (Seoul) Stream', description: 'Philosophical structure of vowels and consonants, geometric harmony, and poetic typography.', category: 'Language & Design', vibe: 'A phonetic script engineered with poetic mathematical elegance.' },
    { tag: 'Midnight', name: '#Midnight (Seoul) Stream', description: '24-hour study cafes, late-night writers desks, quiet coffee shops, and deep nocturnal inspiration.', category: 'Night Writers', vibe: 'The quietest hours are when deepest stanzas form.' },
    { tag: 'Rooftop', name: '#Rooftop (Seoul) Stream', description: 'Namsan mountain breezes, night views over glowing city ridges, and contemplative heights.', category: 'Urban Panoramas', vibe: 'Cool wind brushing past the neon horizon.' },
    { tag: 'Acoustic', name: '#Acoustic (Seoul) Stream', description: 'Nylon string guitars in quiet basement studios, indie folk ballads, and gentle analog loops.', category: 'Music & Audio', vibe: 'Fingers sliding softly across wooden fretboards.' },
  ],
};

/**
 * Returns exactly 10 top streams for any given city, ranked by activity, members, and regional depth.
 */
export function getTop10StreamsForCity(
  groups: HashtagGroup[],
  cityName: string,
  allPosts: Post[] = [],
  allUsers: User[] = []
): TopStreamItem[] {
  if (!cityName) {
    cityName = 'Kyoto';
  }

  const cleanCity = cityName.trim();
  const cityKey = cleanCity.toLowerCase().replace(/\s+/g, '_');
  const region = CITY_REGIONS.find((r) => r.name.toLowerCase() === cleanCity.toLowerCase() || r.id === cityKey) || CITY_REGIONS[0];
  const targetCityName = region.name;
  const targetCityKey = region.id;

  // 1. Gather all existing streams that belong to this city or its popular tags
  const candidateMap = new Map<string, HashtagGroup>();

  // Add existing groups explicitly tied to this city
  groups.forEach((g) => {
    const groupCity = g.city || getCityForHashtag(g.tag).city;
    if (groupCity.toLowerCase() === targetCityName.toLowerCase()) {
      const clean = normalizeTag(g.tag).toLowerCase();
      candidateMap.set(clean, {
        ...g,
        city: targetCityName,
        country: region.country,
      });
    }
  });

  // Check popular tags from this city's region
  (region.popularTags || []).forEach((tag) => {
    const clean = normalizeTag(tag).toLowerCase();
    if (!candidateMap.has(clean)) {
      const existing = groups.find((g) => normalizeTag(g.tag).toLowerCase() === clean);
      if (existing) {
        candidateMap.set(clean, {
          ...existing,
          city: targetCityName,
          country: region.country,
        });
      }
    }
  });

  // 2. Check thematic predefined streams for this city if candidate count < 10
  const cityThematic = CITY_THEMATIC_STREAMS[targetCityKey] || CITY_THEMATIC_STREAMS['kyoto'] || [];
  cityThematic.forEach((theme) => {
    const clean = normalizeTag(theme.tag).toLowerCase();
    if (!candidateMap.has(clean)) {
      candidateMap.set(clean, {
        tag: theme.tag,
        name: theme.name,
        description: theme.description,
        category: theme.category,
        city: targetCityName,
        country: region.country,
        memberIds: ['usr_me', 'usr_1', 'usr_3'],
        createdAt: '2025',
        isHot: clean === region.highlightTag.toLowerCase(),
        bannerGradient: region.gradient,
        vibeStatement: theme.vibe,
        rules: [
          `Celebrate original stanzas and works related to #${theme.tag}.`,
          `Keep all regional dialogue respectful and creatively grounded.`,
          `Share PDF chapbooks and companion acoustic scores.`,
        ],
      });
    }
  });

  // 3. Score and rank every candidate stream
  const scoredItems: TopStreamItem[] = Array.from(candidateMap.values()).map((g) => {
    const cleanTag = normalizeTag(g.tag).toLowerCase();

    // Calculate matching posts
    const matchingPosts = allPosts.filter((p) => {
      const tagMatch = p.hashtags.some((h) => normalizeTag(h).toLowerCase() === cleanTag);
      const cityMatch = (p.city || getAutomaticCityForPost(p).city).toLowerCase() === targetCityName.toLowerCase();
      return tagMatch || (cityMatch && p.content.toLowerCase().includes(cleanTag));
    });

    const postCount = Math.max(matchingPosts.length, g.isHot ? 14 : 5);
    const memberCount = Math.max(g.memberIds?.length || 0, g.isHot ? 8 : 3);

    // Activity score calculation
    let activityScore = memberCount * 7 + postCount * 5 + (g.isHot ? 35 : 10);
    if (cleanTag === region.highlightTag.toLowerCase()) {
      activityScore += 45;
    }
    // Cap score around 99 for clean aesthetic presentation
    const normalizedScore = Math.min(99, Math.max(65, Math.round(activityScore * 0.75)));

    // Growth velocity
    const velocityNum = Math.round(18 + (activityScore % 45));
    const growthRate = `+${velocityNum}% 24h`;

    // Sample excerpt
    let sampleExcerpt = g.vibeStatement;
    if (matchingPosts.length > 0) {
      const postWithContent = matchingPosts.find((p) => p.content && p.content.length > 20);
      if (postWithContent) {
        sampleExcerpt = postWithContent.content.slice(0, 110).trim() + (postWithContent.content.length > 110 ? '...' : '');
      }
    }

    // Recent authors
    const authorIds = Array.from(new Set(matchingPosts.map((p) => p.authorId)));
    const recentAuthors = authorIds
      .map((id) => allUsers.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u))
      .slice(0, 3)
      .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));

    return {
      ...g,
      rank: 0,
      activityScore: normalizedScore,
      postCount,
      creatorCount: Math.max(recentAuthors.length, memberCount),
      growthRate,
      sampleExcerpt,
      recentAuthors,
    };
  });

  // Sort descending by activityScore and postCount
  scoredItems.sort((a, b) => {
    if (b.activityScore !== a.activityScore) {
      return b.activityScore - a.activityScore;
    }
    return b.postCount - a.postCount;
  });

  // Guarantee exactly top 10 items with 1-indexed ranks
  const top10 = scoredItems.slice(0, 10).map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  return top10;
}
