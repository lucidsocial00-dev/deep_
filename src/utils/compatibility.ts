import { CompatibilityResult, PollAlignmentItem, Post, User } from '../types';

export function calculateCompatibility(
  userA: User,
  userB: User,
  allPosts: Post[]
): CompatibilityResult {
  const mutualLikedPosts: Post[] = [];
  const mutualDislikedPosts: Post[] = [];
  const differingLikedPosts: Post[] = [];
  const pollAlignments: PollAlignmentItem[] = [];

  let agreementPoints = 0;
  let totalEvaluations = 0;
  let pollSynergyBonus = 0;
  let pollAgreementsCount = 0;

  // Evaluate post reaction overlap
  allPosts.forEach((post) => {
    const aLiked = (post.likedBy || []).includes(userA.id) || (userA.likedPostIds || []).includes(post.id);
    const aDisliked = (post.dislikedBy || []).includes(userA.id) || (userA.dislikedPostIds || []).includes(post.id);
    const bLiked = (post.likedBy || []).includes(userB.id) || (userB.likedPostIds || []).includes(post.id);
    const bDisliked = (post.dislikedBy || []).includes(userB.id) || (userB.dislikedPostIds || []).includes(post.id);

    if (aLiked && bLiked) {
      mutualLikedPosts.push(post);
      agreementPoints += 1.0;
      totalEvaluations += 1.0;
    } else if (aDisliked && bDisliked) {
      // Mutual Dislikes add strong bond points!
      mutualDislikedPosts.push(post);
      agreementPoints += 1.25;
      totalEvaluations += 1.0;
    } else if ((aLiked && bDisliked) || (aDisliked && bLiked)) {
      differingLikedPosts.push(post);
      totalEvaluations += 1.0;
    } else if ((aLiked && !bLiked && !bDisliked) || (bLiked && !aLiked && !aDisliked)) {
      // Partial interest
      totalEvaluations += 0.25;
    }
  });

  // Evaluate Community Poll Consensus & Dialectics
  allPosts.forEach((post) => {
    if (!post.poll) return;
    const poll = post.poll;

    // Check which option userA and userB selected
    const userAOpt = poll.options.find(
      (opt) =>
        (opt.votedUserIds || []).includes(userA.id) ||
        (userA.id === 'usr_me' && poll.userVotedOptionId === opt.id)
    );

    const userBOpt = poll.options.find(
      (opt) =>
        (opt.votedUserIds || []).includes(userB.id) ||
        (userB.id === 'usr_me' && poll.userVotedOptionId === opt.id)
    );

    if (userAOpt && userBOpt) {
      // Case 1: Both users actively participated in this poll
      if (userAOpt.id === userBOpt.id) {
        // Mutual Consensus! Same worldview / aesthetic choice
        pollAgreementsCount++;
        pollSynergyBonus += 4;
        agreementPoints += 1.8;
        totalEvaluations += 1.0;
        pollAlignments.push({
          postId: post.id,
          question: poll.question,
          userAChoice: userAOpt.text,
          userBChoice: userBOpt.text,
          isAgreement: true,
          scoreImpact: 4,
        });
      } else {
        // Dialectic debate (healthy divergence)
        agreementPoints += 0.35;
        totalEvaluations += 1.0;
        pollAlignments.push({
          postId: post.id,
          question: poll.question,
          userAChoice: userAOpt.text,
          userBChoice: userBOpt.text,
          isAgreement: false,
          scoreImpact: 0,
        });
      }
    } else if (userAOpt && post.authorId === userB.id) {
      // Case 2: UserA responded to UserB's authored poll
      pollSynergyBonus += 3;
      agreementPoints += 1.2;
      totalEvaluations += 0.8;
      pollAlignments.push({
        postId: post.id,
        question: poll.question,
        userAChoice: userAOpt.text,
        userBChoice: `Author question: "${poll.question}"`,
        isAgreement: true,
        scoreImpact: 3,
      });
    } else if (userBOpt && post.authorId === userA.id) {
      // Case 3: UserB responded to UserA's authored poll
      pollSynergyBonus += 3;
      agreementPoints += 1.2;
      totalEvaluations += 0.8;
      pollAlignments.push({
        postId: post.id,
        question: poll.question,
        userAChoice: `Author question: "${poll.question}"`,
        userBChoice: userBOpt.text,
        isAgreement: true,
        scoreImpact: 3,
      });
    }
  });

  // Calculate Hashtag overlap
  const userAHashtags = new Set<string>();
  const userBHashtags = new Set<string>();

  allPosts.forEach((p) => {
    const aLiked = (p.likedBy || []).includes(userA.id) || (userA.likedPostIds || []).includes(p.id);
    const bLiked = (p.likedBy || []).includes(userB.id) || (userB.likedPostIds || []).includes(p.id);
    if (aLiked) (p.hashtags || []).forEach((h) => userAHashtags.add(h));
    if (bLiked) (p.hashtags || []).forEach((h) => userBHashtags.add(h));
  });

  const sharedHashtags: string[] = [];
  userAHashtags.forEach((tag) => {
    if (userBHashtags.has(tag)) sharedHashtags.push(tag);
  });

  // Base deterministic seed if interaction volume is emerging
  if (totalEvaluations === 0) {
    totalEvaluations = 4;
    const hashA = (userA.id.charCodeAt(0) || 100) + userA.name.length * 3;
    const hashB = (userB.id.charCodeAt(0) || 100) + userB.name.length * 3;
    agreementPoints = ((hashA + hashB) % 3) + 3.2;
  }

  // Bonus points for shared hashtag interests
  agreementPoints += sharedHashtags.length * 0.45;
  totalEvaluations += Math.max(0.5, sharedHashtags.length * 0.25);

  let rawPercentage = Math.round((agreementPoints / totalEvaluations) * 100);

  // Apply dynamic bonuses from answered compatibility questions and community polls
  const bonusFromA = userA.compatibilityBonuses?.[userB.id] || 0;
  const bonusFromB = userB.compatibilityBonuses?.[userA.id] || 0;
  const totalBonus = bonusFromA + bonusFromB;

  rawPercentage += totalBonus + pollSynergyBonus;

  // Normalize score range nicely between 40% and 99%
  const matchPercentage = Math.min(99, Math.max(40, rawPercentage));

  // Determine dynamic vibe title
  let aiVibeTitle = 'Curious Depth Score';
  if (matchPercentage >= 92) {
    aiVibeTitle = 'Harmonic Soul Depth';
  } else if (matchPercentage >= 84) {
    aiVibeTitle = 'Poetic & Aesthetic Twin';
  } else if (matchPercentage >= 75) {
    aiVibeTitle = 'Aligned Cipher Companion';
  } else if (matchPercentage >= 65) {
    aiVibeTitle = 'Complementary Thinkers';
  }

  // Synergy highlights breakdown
  const synergyHighlights: string[] = [];

  // Add highlights from answered compatibility questions
  const answersA = userA.compatibilityAnswers?.[userB.id] || [];
  const answersB = userB.compatibilityAnswers?.[userA.id] || [];
  const allAnswers = [...answersA, ...answersB];

  if (allAnswers.length > 0) {
    allAnswers.forEach((ans) => {
      if (ans.isMatch) {
        synergyHighlights.unshift(
          `✨ Harmonic alignment: "${ans.question}" (${ans.userAnswerText.slice(0, 40)}...)`
        );
      } else {
        synergyHighlights.push(
          `⚡ Nuanced contrast: "${ans.question}"`
        );
      }
    });
  }

  // Add highlights from poll consensus
  pollAlignments.forEach((pa) => {
    if (pa.isAgreement) {
      synergyHighlights.unshift(
        `📊 Poll consensus: "${pa.question}" (+${pa.scoreImpact}% match)`
      );
    } else {
      synergyHighlights.push(
        `⚖️ Dialectic contrast in poll: "${pa.question}"`
      );
    }
  });

  if (mutualLikedPosts.length > 0) {
    const hasPoetry = mutualLikedPosts.some((p) => p.poetryFormatted);
    if (hasPoetry) {
      synergyHighlights.push(`Both resonate with lyrical verses & rhythmic poetry`);
    } else {
      synergyHighlights.push(`Bonded across ${mutualLikedPosts.length} shared post favorites`);
    }
  }

  if (mutualDislikedPosts.length > 0) {
    synergyHighlights.push(
      `Shared discernment: You both filtered out ${mutualDislikedPosts.length} noisy/superficial posts`
    );
  }

  if (sharedHashtags.length > 0) {
    synergyHighlights.push(`Mutual affinity for ${sharedHashtags.slice(0, 3).join(', ')}`);
  } else {
    synergyHighlights.push(`Organic potential for new aesthetic discovery`);
  }

  return {
    userA,
    userB,
    matchPercentage,
    mutualLikesCount: mutualLikedPosts.length,
    mutualDislikesCount: mutualDislikedPosts.length,
    totalComparisons: Math.round(totalEvaluations),
    mutualLikedPosts,
    mutualDislikedPosts,
    differingLikedPosts,
    pollAlignments,
    pollAgreementsCount,
    pollBonusPercentage: pollSynergyBonus,
    aiVibeTitle,
    synergyHighlights,
    aiAnalysis: `Calculated from reaction vector alignment across ${allPosts.length} feed entries, shared dislike synergy, community poll consensus, and aesthetic hashtag overlap.`,
  };
}

