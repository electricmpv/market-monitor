/**
 * Filter Engine - Three Layer Filtering System
 * Layer 0: Hard filters (language, length, blacklist, minimum engagement)
 * Layer 1: FAST_LLM semantic relevance check
 * Layer 2: Topic clustering and cross-platform consensus
 */

import { invokeLLM } from '../_core/llm';
import { 
  getUnprocessedRawItems, 
  updateRawItemLayer0, 
  updateRawItemLayer1,
  getAllKeywords,
  insertTopic,
  getTopicsByRadar
} from '../db';
import type { RawItem, Keyword, Topic } from '../../drizzle/schema';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================
interface Layer1Result {
  relevant: boolean;
  radar: 'pain_hunter' | 'tech_scout' | 'funding_watch' | null;
  category: string;
  confidence: number;
  matchedKeywords: string[];
  summary: string;
}

interface ScoreResult {
  velocityScore: number;
  consensusScore: number;
  credibilityScore: number;
  fitScore: number;
  noveltyScore: number;
  trendScore: number;
}

// ============================================================================
// Layer 0: Hard Filters
// ============================================================================

// Blacklist patterns (spam, irrelevant content)
const BLACKLIST_PATTERNS = [
  /crypto\s*giveaway/i,
  /free\s*airdrop/i,
  /\$\d+k?\s*in\s*\d+\s*(days?|hours?)/i,
  /dm\s*me\s*for/i,
  /join\s*my\s*discord/i,
  /subscribe\s*to\s*my/i,
  /follow\s*for\s*follow/i,
  /click\s*the\s*link/i,
  /limited\s*time\s*offer/i,
  /act\s*now/i,
  /100%\s*guaranteed/i,
];

// Minimum engagement thresholds by source
const MIN_ENGAGEMENT: Record<string, { score?: number; stars?: number; upvotes?: number; comments?: number; retweets?: number }> = {
  hackernews: { score: 5 },
  github: { stars: 10 },
  reddit: { upvotes: 10 },
  producthunt: { upvotes: 5 },
  huggingface: { upvotes: 3 },
  ycombinator: {},
  twitter: { retweets: 5 },
};

/**
 * Layer 0: Hard filter - fast, no LLM needed
 */
export function layer0Filter(item: RawItem): boolean {
  // 1. Check minimum length
  const textLength = (item.title?.length || 0) + (item.content?.length || 0);
  if (textLength < 20) return false;
  
  // 2. Check blacklist patterns
  const fullText = `${item.title} ${item.content}`.toLowerCase();
  for (const pattern of BLACKLIST_PATTERNS) {
    if (pattern.test(fullText)) return false;
  }
  
  // 3. Check minimum engagement
  const minEng = MIN_ENGAGEMENT[item.source] || {};
  if (minEng.score && (item.score || 0) < minEng.score) return false;
  if (minEng.stars && (item.stars || 0) < minEng.stars) return false;
  if (minEng.upvotes && (item.upvotes || 0) < minEng.upvotes) return false;
  
  // 4. Check for non-English (basic heuristic - skip if mostly non-ASCII)
  const asciiRatio = (fullText.match(/[\x00-\x7F]/g)?.length || 0) / fullText.length;
  if (asciiRatio < 0.7) return false;
  
  return true;
}

// ============================================================================
// Layer 1: LLM Semantic Relevance
// ============================================================================

/**
 * Layer 1: LLM-based semantic relevance check
 */
export async function layer1Filter(item: RawItem, keywords: Keyword[]): Promise<Layer1Result> {
  const keywordList = keywords.map(k => `${k.keyword} (${k.radar})`).join('\n');
  
  const prompt = `You are analyzing content for a market opportunity monitoring system focused on AI/Tech/Web3.

CONTENT TO ANALYZE:
Title: ${item.title}
Content: ${item.content?.slice(0, 1000) || 'No content'}
Source: ${item.source}
Engagement: Score=${item.score}, Stars=${item.stars}, Upvotes=${item.upvotes}, Comments=${item.comments}

MONITORING KEYWORDS (with radar type):
${keywordList}

TASK: Determine if this content is relevant to any of the monitoring keywords and which radar it belongs to.

RADARS:
- pain_hunter: User complaints, frustrations, unmet needs, market gaps
- tech_scout: Technical breakthroughs, new tools, frameworks, papers
- funding_watch: Startup funding, acquisitions, market validation

Respond in JSON format:
{
  "relevant": true/false,
  "radar": "pain_hunter" | "tech_scout" | "funding_watch" | null,
  "category": "brief category label",
  "confidence": 0.0-1.0,
  "matchedKeywords": ["keyword1", "keyword2"],
  "summary": "One sentence summary of why this is relevant or not"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a market intelligence analyst. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'layer1_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              relevant: { type: 'boolean' },
              radar: { type: ['string', 'null'], enum: ['pain_hunter', 'tech_scout', 'funding_watch', null] },
              category: { type: 'string' },
              confidence: { type: 'number' },
              matchedKeywords: { type: 'array', items: { type: 'string' } },
              summary: { type: 'string' }
            },
            required: ['relevant', 'radar', 'category', 'confidence', 'matchedKeywords', 'summary'],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') throw new Error('No response from LLM');
    
    return JSON.parse(content);
  } catch (e) {
    console.error('[Layer1] LLM error:', e);
    return {
      relevant: false,
      radar: null,
      category: 'error',
      confidence: 0,
      matchedKeywords: [],
      summary: 'Error processing content'
    };
  }
}

// ============================================================================
// Layer 2: Topic Clustering
// ============================================================================

/**
 * Generate semantic hash for deduplication
 */
export function generateSemanticHash(title: string, content: string): string {
  // Normalize text
  const normalized = `${title} ${content}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
  
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Check if content is similar to existing topics
 */
export async function findSimilarTopic(item: RawItem, radar: string): Promise<Topic | null> {
  const existingTopics = await getTopicsByRadar(radar, undefined, 100);
  
  const itemHash = generateSemanticHash(item.title, item.content || '');
  
  // Simple hash-based dedup
  for (const topic of existingTopics) {
    if (topic.semanticHash === itemHash) {
      return topic;
    }
  }
  
  // TODO: Add vector similarity search with ChromaDB for better dedup
  
  return null;
}

// ============================================================================
// Five-Dimension Scoring System
// ============================================================================

/**
 * Calculate velocity score (0-5) based on engagement acceleration
 */
export function calculateVelocityScore(item: RawItem, snapshots: any[] = []): number {
  // If no snapshots, use current engagement
  const currentEngagement = (item.score || 0) + (item.stars || 0) + (item.upvotes || 0);
  
  if (snapshots.length < 2) {
    // No historical data - estimate based on age and current engagement
    const ageHours = (Date.now() - new Date(item.publishedAt || item.fetchedAt).getTime()) / (1000 * 60 * 60);
    const engagementRate = currentEngagement / Math.max(ageHours, 1);
    
    // Normalize to 0-5 scale
    if (engagementRate > 50) return 5;
    if (engagementRate > 20) return 4;
    if (engagementRate > 10) return 3;
    if (engagementRate > 5) return 2;
    if (engagementRate > 1) return 1;
    return 0;
  }
  
  // Calculate acceleration from snapshots
  const oldest = snapshots[snapshots.length - 1];
  const newest = snapshots[0];
  const oldEngagement = (oldest.score || 0) + (oldest.stars || 0) + (oldest.upvotes || 0);
  const newEngagement = (newest.score || 0) + (newest.stars || 0) + (newest.upvotes || 0);
  const timeDiff = (new Date(newest.snapshotAt).getTime() - new Date(oldest.snapshotAt).getTime()) / (1000 * 60 * 60);
  
  const acceleration = (newEngagement - oldEngagement) / Math.max(timeDiff, 1);
  
  if (acceleration > 100) return 5;
  if (acceleration > 50) return 4;
  if (acceleration > 20) return 3;
  if (acceleration > 10) return 2;
  if (acceleration > 0) return 1;
  return 0;
}

/**
 * Calculate consensus score (0-5) based on cross-platform presence
 */
export function calculateConsensusScore(crossPlatformCount: number): number {
  if (crossPlatformCount >= 4) return 5;
  if (crossPlatformCount >= 3) return 4;
  if (crossPlatformCount >= 2) return 3;
  return 1;
}

/**
 * Calculate credibility score (0-5) based on source and author
 */
export function calculateCredibilityScore(item: RawItem, kolWeight: number = 1.0): number {
  let score = 2; // Base score
  
  // Source credibility
  const sourceCredibility: Record<string, number> = {
    hackernews: 4,
    github: 4,
    huggingface: 5,
    ycombinator: 5,
    reddit: 3,
    producthunt: 3,
    twitter: 2,
  };
  
  score = sourceCredibility[item.source] || 2;
  
  // Boost for KOL
  score = Math.min(5, score * kolWeight);
  
  return score;
}

/**
 * Calculate solopreneur fit score (0-5)
 */
export async function calculateFitScore(item: RawItem, layer1Result: Layer1Result): Promise<number> {
  // Use LLM to evaluate fit for solopreneur
  const prompt = `Evaluate this opportunity for a solo developer/entrepreneur (solopreneur):

Title: ${item.title}
Summary: ${layer1Result.summary}
Category: ${layer1Result.category}

Rate on a scale of 1-5 based on:
- Technical complexity (can one person build it?)
- Capital requirements (can start with <$1000?)
- Time to market (can ship MVP in <30 days?)
- Moat potential (can build defensible advantage?)

Respond with a single number 1-5 representing overall solopreneur fit.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are evaluating business opportunities. Respond with only a number 1-5.' },
        { role: 'user', content: prompt }
      ]
    });
    
    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    const score = parseInt(content || '3');
    return Math.min(5, Math.max(1, score));
  } catch (e) {
    return 3; // Default middle score
  }
}

/**
 * Calculate novelty score (0-5) based on how new/unique the topic is
 */
export function calculateNoveltyScore(item: RawItem, existingTopicCount: number): number {
  // Newer items get higher novelty
  const ageHours = (Date.now() - new Date(item.publishedAt || item.fetchedAt).getTime()) / (1000 * 60 * 60);
  
  let score = 5;
  if (ageHours > 168) score = 1; // > 1 week
  else if (ageHours > 72) score = 2; // > 3 days
  else if (ageHours > 24) score = 3; // > 1 day
  else if (ageHours > 6) score = 4; // > 6 hours
  
  // Reduce score if many similar topics exist
  if (existingTopicCount > 10) score = Math.max(1, score - 2);
  else if (existingTopicCount > 5) score = Math.max(1, score - 1);
  
  return score;
}

/**
 * Calculate weighted trend score
 */
export function calculateTrendScore(
  scores: Omit<ScoreResult, 'trendScore'>,
  weights: { velocity: number; consensus: number; credibility: number; fit: number; novelty: number }
): number {
  const totalWeight = weights.velocity + weights.consensus + weights.credibility + weights.fit + weights.novelty;
  
  return (
    (scores.velocityScore * weights.velocity +
     scores.consensusScore * weights.consensus +
     scores.credibilityScore * weights.credibility +
     scores.fitScore * weights.fit +
     scores.noveltyScore * weights.novelty) / totalWeight
  );
}

// ============================================================================
// Main Processing Pipeline
// ============================================================================

/**
 * Process unprocessed items through the filter pipeline
 */
export async function processFilterPipeline(limit: number = 50): Promise<{
  processed: number;
  passed: number;
  topics: number;
}> {
  const result = { processed: 0, passed: 0, topics: 0 };
  
  const items = await getUnprocessedRawItems(limit);
  const keywords = await getAllKeywords();
  
  for (const item of items) {
    result.processed++;
    
    // Layer 0: Hard filter
    const passedLayer0 = layer0Filter(item);
    await updateRawItemLayer0(item.id, passedLayer0);
    
    if (!passedLayer0) continue;
    
    // Layer 1: LLM semantic filter
    const layer1Result = await layer1Filter(item, keywords);
    await updateRawItemLayer1(item.id, layer1Result.relevant, layer1Result);
    
    if (!layer1Result.relevant || !layer1Result.radar) continue;
    
    result.passed++;
    
    // Layer 2: Topic clustering
    const existingTopic = await findSimilarTopic(item, layer1Result.radar);
    
    if (existingTopic) {
      // Merge into existing topic (update cross-platform count)
      // TODO: Implement topic merging
      continue;
    }
    
    // Create new topic
    const semanticHash = generateSemanticHash(item.title, item.content || '');
    const existingTopics = await getTopicsByRadar(layer1Result.radar, undefined, 100);
    
    // Calculate scores
    const velocityScore = calculateVelocityScore(item);
    const consensusScore = calculateConsensusScore(1);
    const credibilityScore = calculateCredibilityScore(item);
    const fitScore = await calculateFitScore(item, layer1Result);
    const noveltyScore = calculateNoveltyScore(item, existingTopics.length);
    
    const trendScore = calculateTrendScore(
      { velocityScore, consensusScore, credibilityScore, fitScore, noveltyScore },
      { velocity: 0.25, consensus: 0.20, credibility: 0.15, fit: 0.25, novelty: 0.15 }
    );
    
    await insertTopic({
      semanticHash,
      canonicalItemId: item.id,
      memberItemIds: JSON.stringify([item.id]),
      title: item.title,
      summary: layer1Result.summary,
      category: layer1Result.category as any,
      tags: JSON.stringify(layer1Result.matchedKeywords),
      radar: layer1Result.radar,
      velocityScore,
      consensusScore,
      credibilityScore,
      fitScore,
      noveltyScore,
      trendScore,
      crossPlatformCount: 1,
      crossPlatformSources: JSON.stringify([item.source]),
      status: 'new',
    });
    
    result.topics++;
  }
  
  return result;
}
