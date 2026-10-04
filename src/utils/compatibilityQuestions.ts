import { CompatibilityQuestion } from '../types';

export const COMPATIBILITY_QUESTIONS: CompatibilityQuestion[] = [
  {
    id: 'cq_aesthetics_1',
    question: 'When crafting or reading poetry, what pulls you into depth most?',
    category: 'Aesthetics & Poetry',
    options: [
      {
        id: 'opt_raw_vulnerability',
        text: 'Raw emotional vulnerability & authentic heartbeat',
        subtitle: 'Unfiltered truth over polished structure',
      },
      {
        id: 'opt_metaphor_structure',
        text: 'Metaphorical depth & intricate rhythmic cadence',
        subtitle: 'Geometric elegance and enigmatic cipher layers',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 8,
    scoreDivergeDelta: -3,
  },
  {
    id: 'cq_philosophy_1',
    question: 'What creates the strongest foundation for enduring intellectual friendship?',
    category: 'Deep Philosophy',
    options: [
      {
        id: 'opt_shared_discernment',
        text: 'Mutual discernment: filtering out superficial noise together',
        subtitle: 'Disliking the same hollow distractions builds true trust',
      },
      {
        id: 'opt_passionate_debate',
        text: 'Dynamic contrast: debating contrasting perspectives with fervor',
        subtitle: 'Friction and counter-theses sharpen the intellect',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 9,
    scoreDivergeDelta: -2,
  },
  {
    id: 'cq_rhythm_1',
    question: 'At what hour does your creative cipher achieve peak clarity?',
    category: 'Night Owl vs Dawn',
    options: [
      {
        id: 'opt_midnight_twilight',
        text: 'Midnight Twilight (23:00 - 04:00)',
        subtitle: 'Ambient stillness, glowing screens, deep solitude',
      },
      {
        id: 'opt_early_dawn',
        text: 'Crisp Dawn (05:00 - 09:00)',
        subtitle: 'Fresh sunlight, black coffee, untainted morning clarity',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 7,
    scoreDivergeDelta: -4,
  },
  {
    id: 'cq_privacy_1',
    question: 'How do you view end-to-end encrypted cipher channels?',
    category: 'Privacy & Cipher',
    options: [
      {
        id: 'opt_sacred_sanctuary',
        text: 'A sacred sanctuary for authentic human vulnerability',
        subtitle: 'Freedom from algorithmic surveillance allows real souls to meet',
      },
      {
        id: 'opt_playful_riddle',
        text: 'An exhilarating game of underground aesthetics & mystery',
        subtitle: 'Selective access and cryptographic poetry as performance art',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 8,
    scoreDivergeDelta: -3,
  },
  {
    id: 'cq_values_1',
    question: 'When exploring long-form literature or research essays, your instinct is:',
    category: 'Discernment & Values',
    options: [
      {
        id: 'opt_full_immersion',
        text: 'Full immersion: reading every stanza and marginalia note',
        subtitle: 'Slow contemplation, savoring deliberate pacing',
      },
      {
        id: 'opt_spark_synthesis',
        text: 'Spark synthesis: extracting core aphorisms to fuel new creation',
        subtitle: 'Translating concepts directly into original output',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 7,
    scoreDivergeDelta: -3,
  },
  {
    id: 'cq_atmosphere_1',
    question: 'Which spatial atmosphere mirrors your inner mental landscape?',
    category: 'Creative Rhythm',
    options: [
      {
        id: 'opt_misty_kyoto',
        text: 'Misty cobblestones & moss-covered temples (Kyoto / Edinburgh)',
        subtitle: 'Ancient echoes, acoustic rain, meditative silence',
      },
      {
        id: 'opt_cyber_berlin',
        text: 'Neon-lit midnight towers & modular synth waves (Berlin / Tokyo)',
        subtitle: 'Forward momentum, electric bass, synthetic energy',
      },
    ],
    isAnsweredBySender: false,
    isAnsweredByReceiver: false,
    scoreMatchDelta: 8,
    scoreDivergeDelta: -4,
  },
];

export function getRandomCompatibilityQuestion(excludeIds: string[] = []): CompatibilityQuestion {
  const available = COMPATIBILITY_QUESTIONS.filter((q) => !excludeIds.includes(q.id));
  const pool = available.length > 0 ? available : COMPATIBILITY_QUESTIONS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return { ...pool[randomIndex] };
}

// Generate realistic simulated answers for peer participants
export function getSimulatedPeerAnswer(
  question: CompatibilityQuestion,
  peerName: string,
  userChoiceId?: string
): string {
  // 75% chance of matching to give high depth, 25% chance of creative nuance
  const shouldMatch = Math.random() < 0.75;
  if (userChoiceId && shouldMatch) {
    return userChoiceId;
  }
  // Otherwise pick based on deterministic hash of peer name + question id
  const hash = (peerName.charCodeAt(0) || 10) + (question.id.charCodeAt(3) || 5);
  const optionIndex = hash % question.options.length;
  return question.options[optionIndex].id;
}
