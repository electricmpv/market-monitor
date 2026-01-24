/**
 * Learning Loop Service
 * Tracks user actions and adjusts weights/recommendations accordingly
 */

import {
  insertUserAction,
  getUserActions,
  getLearningWeights,
  upsertLearningWeights,
  updateKeywordWeight,
  incrementKeywordStats,
  updateKolWeight,
  getTopicById,
  getAllKeywords,
  getAllKols,
  insertWeeklyRecommendation,
  getWeeklyRecommendations,
  updateRecommendationDecision,
} from '../db';
import type { UserAction, Topic, Keyword, Kol, LearningWeight } from '../../drizzle/schema';

// ============================================================================
// Types
// ============================================================================
interface ActionFeedback {
  topicId: number;
  action: 'interesting' | 'build' | 'pass' | 'archive';
  userId: number;
}

interface WeightAdjustment {
  keywordId?: number;
  kolId?: number;
  adjustment: number;
  reason: string;
}

interface RecommendationCandidate {
  type: 'keyword' | 'kol' | 'track';
  content: string;
  reason: string;
  score: number;
}

// ============================================================================
// Learning Speed Multipliers
// ============================================================================
const LEARNING_SPEED_MULTIPLIER: Record<string, number> = {
  slow: 0.5,
  normal: 1.0,
  fast: 2.0,
};

// ============================================================================
// User Action Processing
// ============================================================================

/**
 * Process user action and update learning weights
 */
export async function processUserAction(feedback: ActionFeedback): Promise<WeightAdjustment[]> {
  const adjustments: WeightAdjustment[] = [];
  
  // Get topic details
  const topic = await getTopicById(feedback.topicId);
  if (!topic) return adjustments;
  
  // Get user's learning settings
  const weights = await getLearningWeights(feedback.userId);
  const speedMultiplier = LEARNING_SPEED_MULTIPLIER[weights?.learningSpeed || 'normal'];
  
  // Record the action
  await insertUserAction({
    userId: feedback.userId,
    topicId: feedback.topicId,
    action: feedback.action,
    trendScoreAtAction: topic.trendScore,
    velocityScoreAtAction: topic.velocityScore,
    consensusScoreAtAction: topic.consensusScore,
  });
  
  // Parse matched keywords from topic
  const matchedKeywords: string[] = topic.tags ? JSON.parse(topic.tags) : [];
  const allKeywords = await getAllKeywords();
  
  // Determine weight adjustment based on action
  let baseAdjustment = 0;
  let statField: 'matchCount' | 'buildCount' | 'passCount' = 'matchCount';
  
  switch (feedback.action) {
    case 'build':
      baseAdjustment = 0.1 * speedMultiplier; // Positive reinforcement
      statField = 'buildCount';
      break;
    case 'interesting':
      baseAdjustment = 0.05 * speedMultiplier; // Mild positive
      statField = 'matchCount';
      break;
    case 'pass':
      baseAdjustment = -0.05 * speedMultiplier; // Mild negative
      statField = 'passCount';
      break;
    case 'archive':
      baseAdjustment = -0.1 * speedMultiplier; // Negative reinforcement
      statField = 'passCount';
      break;
  }
  
  // Adjust keyword weights
  for (const keywordText of matchedKeywords) {
    const keyword = allKeywords.find(k => k.keyword.toLowerCase() === keywordText.toLowerCase());
    if (keyword) {
      const newWeight = Math.max(0.1, Math.min(2.0, (keyword.weight || 1.0) + baseAdjustment));
      await updateKeywordWeight(keyword.id, newWeight);
      await incrementKeywordStats(keyword.id, statField);
      
      adjustments.push({
        keywordId: keyword.id,
        adjustment: baseAdjustment,
        reason: `User ${feedback.action} topic with keyword "${keywordText}"`,
      });
    }
  }
  
  // Adjust dimension weights based on action patterns
  if (weights?.autoLearn) {
    await adjustDimensionWeights(feedback.userId, topic, feedback.action, speedMultiplier);
  }
  
  return adjustments;
}

/**
 * Adjust the five dimension weights based on user preferences
 */
async function adjustDimensionWeights(
  userId: number,
  topic: Topic,
  action: string,
  speedMultiplier: number
): Promise<void> {
  const currentWeights = await getLearningWeights(userId);
  if (!currentWeights) {
    // Initialize default weights
    await upsertLearningWeights(userId, {
      velocityWeight: 0.25,
      consensusWeight: 0.20,
      credibilityWeight: 0.15,
      fitWeight: 0.25,
      noveltyWeight: 0.15,
    });
    return;
  }
  
  // Determine which dimensions contributed to this topic's score
  const isPositive = action === 'build' || action === 'interesting';
  const adjustment = (isPositive ? 0.02 : -0.02) * speedMultiplier;
  
  // Adjust weights based on which scores were high for this topic
  const newWeights: Partial<LearningWeight> = {};
  
  if ((topic.velocityScore || 0) > 3) {
    newWeights.velocityWeight = Math.max(0.05, Math.min(0.5, (currentWeights.velocityWeight || 0.25) + adjustment));
  }
  if ((topic.consensusScore || 0) > 3) {
    newWeights.consensusWeight = Math.max(0.05, Math.min(0.5, (currentWeights.consensusWeight || 0.20) + adjustment));
  }
  if ((topic.credibilityScore || 0) > 3) {
    newWeights.credibilityWeight = Math.max(0.05, Math.min(0.5, (currentWeights.credibilityWeight || 0.15) + adjustment));
  }
  if ((topic.fitScore || 0) > 3) {
    newWeights.fitWeight = Math.max(0.05, Math.min(0.5, (currentWeights.fitWeight || 0.25) + adjustment));
  }
  if ((topic.noveltyScore || 0) > 3) {
    newWeights.noveltyWeight = Math.max(0.05, Math.min(0.5, (currentWeights.noveltyWeight || 0.15) + adjustment));
  }
  
  // Normalize weights to sum to 1.0
  const total = (newWeights.velocityWeight || currentWeights.velocityWeight || 0.25) +
                (newWeights.consensusWeight || currentWeights.consensusWeight || 0.20) +
                (newWeights.credibilityWeight || currentWeights.credibilityWeight || 0.15) +
                (newWeights.fitWeight || currentWeights.fitWeight || 0.25) +
                (newWeights.noveltyWeight || currentWeights.noveltyWeight || 0.15);
  
  if (Object.keys(newWeights).length > 0) {
    // Normalize
    Object.keys(newWeights).forEach(key => {
      (newWeights as any)[key] = (newWeights as any)[key] / total;
    });
    
    await upsertLearningWeights(userId, newWeights);
  }
}

// ============================================================================
// Weekly Recommendations
// ============================================================================

/**
 * Generate weekly recommendations for a user
 */
export async function generateWeeklyRecommendations(userId: number): Promise<RecommendationCandidate[]> {
  const recommendations: RecommendationCandidate[] = [];
  
  // Get user's recent actions
  const recentActions = await getUserActions(userId, 100);
  
  // Analyze patterns in positive actions
  const positiveActions = recentActions.filter(a => a.action === 'build' || a.action === 'interesting');
  const negativeActions = recentActions.filter(a => a.action === 'pass' || a.action === 'archive');
  
  // Get all keywords and their stats
  const keywords = await getAllKeywords();
  
  // Find high-performing keywords to recommend
  const highPerformers = keywords
    .filter(k => (k.buildCount || 0) > 0 && (k.buildCount || 0) > (k.passCount || 0))
    .sort((a, b) => ((b.buildCount || 0) / Math.max(1, b.matchCount || 1)) - ((a.buildCount || 0) / Math.max(1, a.matchCount || 1)))
    .slice(0, 3);
  
  for (const keyword of highPerformers) {
    recommendations.push({
      type: 'keyword',
      content: keyword.keyword,
      reason: `This keyword has a ${Math.round(((keyword.buildCount || 0) / Math.max(1, keyword.matchCount || 1)) * 100)}% build rate`,
      score: (keyword.buildCount || 0) / Math.max(1, keyword.matchCount || 1),
    });
  }
  
  // Find underperforming keywords to suggest removing
  const lowPerformers = keywords
    .filter(k => (k.passCount || 0) > 3 && (k.passCount || 0) > (k.buildCount || 0) * 2)
    .sort((a, b) => (b.passCount || 0) - (a.passCount || 0))
    .slice(0, 2);
  
  for (const keyword of lowPerformers) {
    recommendations.push({
      type: 'keyword',
      content: `Remove: ${keyword.keyword}`,
      reason: `This keyword has been passed ${keyword.passCount} times with low build rate`,
      score: -(keyword.passCount || 0) / Math.max(1, keyword.matchCount || 1),
    });
  }
  
  // Suggest new keywords based on topic patterns
  // TODO: Implement topic analysis to suggest new keywords
  
  // Save recommendations to database
  const weekStart = getWeekStart();
  for (const rec of recommendations) {
    await insertWeeklyRecommendation({
      userId,
      recType: rec.type,
      content: rec.content,
      reason: rec.reason,
      weekStart,
    });
  }
  
  return recommendations;
}

/**
 * Process user decision on a recommendation
 */
export async function processRecommendationDecision(
  recommendationId: number,
  decision: 'accept' | 'reject' | 'pin'
): Promise<void> {
  await updateRecommendationDecision(recommendationId, decision);
  
  // TODO: Apply the recommendation if accepted
  // - If keyword recommendation accepted, add/remove keyword
  // - If KOL recommendation accepted, add/remove KOL
  // - If track recommendation accepted, enable/disable track
}

// ============================================================================
// Analytics
// ============================================================================

/**
 * Get learning analytics for a user
 */
export async function getLearningAnalytics(userId: number): Promise<{
  totalActions: number;
  buildRate: number;
  passRate: number;
  topKeywords: { keyword: string; buildRate: number }[];
  dimensionWeights: LearningWeight | null;
}> {
  const actions = await getUserActions(userId, 500);
  const weights = await getLearningWeights(userId);
  const keywords = await getAllKeywords();
  
  const totalActions = actions.length;
  const buildCount = actions.filter(a => a.action === 'build').length;
  const passCount = actions.filter(a => a.action === 'pass' || a.action === 'archive').length;
  
  const topKeywords = keywords
    .filter(k => (k.matchCount || 0) > 0)
    .map(k => ({
      keyword: k.keyword,
      buildRate: (k.buildCount || 0) / Math.max(1, k.matchCount || 1),
    }))
    .sort((a, b) => b.buildRate - a.buildRate)
    .slice(0, 10);
  
  return {
    totalActions,
    buildRate: totalActions > 0 ? buildCount / totalActions : 0,
    passRate: totalActions > 0 ? passCount / totalActions : 0,
    topKeywords,
    dimensionWeights: weights || null,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
