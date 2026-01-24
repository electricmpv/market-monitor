/**
 * Seed Data - Initialize keywords and KOLs from the high signal-to-noise library
 */

import { insertKeyword, insertKol, getAllKeywords, getAllKols, upsertDataSource } from '../db';
import type { InsertKeyword, InsertKol } from '../../drizzle/schema';

// ============================================================================
// Track 3: 装修视觉质检 Keywords
// ============================================================================
const TRACK3_PAIN_HUNTER: InsertKeyword[] = [
  { keyword: 'finish quality failed inspection', radar: 'pain_hunter', category: 'construction_defects' },
  { keyword: 'contractor won\'t fix defects', radar: 'pain_hunter', category: 'construction_defects' },
  { keyword: 'rework costs more than original', radar: 'pain_hunter', category: 'construction_defects' },
  { keyword: 'how to document construction defects', radar: 'pain_hunter', category: 'construction_defects' },
  { keyword: 'inspection takes too long', radar: 'pain_hunter', category: 'efficiency' },
  { keyword: 'manual quality control is slow', radar: 'pain_hunter', category: 'efficiency' },
  { keyword: 'checking every room is tedious', radar: 'pain_hunter', category: 'efficiency' },
  { keyword: 'pre-delivery inspection nightmare', radar: 'pain_hunter', category: 'efficiency' },
  { keyword: 'dispute with contractor over quality', radar: 'pain_hunter', category: 'disputes' },
  { keyword: 'insurance claim denied for photo proof', radar: 'pain_hunter', category: 'disputes' },
  { keyword: 'how to prove workmanship defects', radar: 'pain_hunter', category: 'disputes' },
  { keyword: 'standardized inspection checklist', radar: 'pain_hunter', category: 'standardization' },
];

const TRACK3_TECH_SCOUT: InsertKeyword[] = [
  { keyword: 'crack detection computer vision', radar: 'tech_scout', category: 'vision_ai' },
  { keyword: 'surface defect detection AI', radar: 'tech_scout', category: 'vision_ai' },
  { keyword: 'real-time visual inspection', radar: 'tech_scout', category: 'vision_ai' },
  { keyword: 'image-based quality assessment', radar: 'tech_scout', category: 'vision_ai' },
  { keyword: 'edge AI inference', radar: 'tech_scout', category: 'edge_ai' },
  { keyword: 'lightweight vision model', radar: 'tech_scout', category: 'edge_ai' },
  { keyword: 'vision model optimization', radar: 'tech_scout', category: 'edge_ai' },
  { keyword: 'multimodal quality control', radar: 'tech_scout', category: 'multimodal' },
  { keyword: 'audio-visual defect detection', radar: 'tech_scout', category: 'multimodal' },
  { keyword: 'construction AI benchmark', radar: 'tech_scout', category: 'industry' },
];

const TRACK3_FUNDING: InsertKeyword[] = [
  { keyword: 'construction tech startup funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'building inspection AI raise', radar: 'funding_watch', category: 'funding' },
  { keyword: 'defect detection startup', radar: 'funding_watch', category: 'funding' },
  { keyword: 'home renovation software funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'quality assurance platform raise', radar: 'funding_watch', category: 'funding' },
  { keyword: 'YC construction', radar: 'funding_watch', category: 'yc' },
  { keyword: 'YC quality control', radar: 'funding_watch', category: 'yc' },
  { keyword: 'facility management AI funding', radar: 'funding_watch', category: 'funding' },
];

// ============================================================================
// Track 1: Web3 KOL CRM Keywords
// ============================================================================
const TRACK1_PAIN_HUNTER: InsertKeyword[] = [
  { keyword: 'finding real crypto influencers', radar: 'pain_hunter', category: 'web3_kol' },
  { keyword: 'fake followers on crypto twitter', radar: 'pain_hunter', category: 'web3_kol' },
  { keyword: 'influencer engagement too low', radar: 'pain_hunter', category: 'web3_kol' },
  { keyword: 'how to vet crypto KOL authenticity', radar: 'pain_hunter', category: 'web3_kol' },
  { keyword: 'crypto marketing budget wasted', radar: 'pain_hunter', category: 'web3_cost' },
  { keyword: 'influencer collab costs too much', radar: 'pain_hunter', category: 'web3_cost' },
  { keyword: 'small project can\'t afford marketing', radar: 'pain_hunter', category: 'web3_cost' },
  { keyword: 'how to measure influencer ROI', radar: 'pain_hunter', category: 'web3_measurement' },
  { keyword: 'tracking marketing attribution in crypto', radar: 'pain_hunter', category: 'web3_measurement' },
  { keyword: 'where to find micro influencers web3', radar: 'pain_hunter', category: 'web3_discovery' },
];

const TRACK1_TECH_SCOUT: InsertKeyword[] = [
  { keyword: 'social media analytics platform', radar: 'tech_scout', category: 'analytics' },
  { keyword: 'twitter API analysis', radar: 'tech_scout', category: 'analytics' },
  { keyword: 'real-time social listening', radar: 'tech_scout', category: 'analytics' },
  { keyword: 'influencer scoring algorithm', radar: 'tech_scout', category: 'scoring' },
  { keyword: 'authenticity detection for social media', radar: 'tech_scout', category: 'scoring' },
  { keyword: 'graph database for social networks', radar: 'tech_scout', category: 'graph' },
  { keyword: 'network effect measurement', radar: 'tech_scout', category: 'graph' },
  { keyword: 'GDPR compliant social data', radar: 'tech_scout', category: 'compliance' },
];

const TRACK1_FUNDING: InsertKeyword[] = [
  { keyword: 'crypto analytics startup funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'Web3 intelligence platform raise', radar: 'funding_watch', category: 'funding' },
  { keyword: 'blockchain intelligence startup series', radar: 'funding_watch', category: 'funding' },
  { keyword: 'influencer management platform funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'creator economy platform raise', radar: 'funding_watch', category: 'funding' },
  { keyword: 'crypto marketing automation startup', radar: 'funding_watch', category: 'funding' },
  { keyword: 'Web3 growth tool series', radar: 'funding_watch', category: 'funding' },
  { keyword: 'YC crypto', radar: 'funding_watch', category: 'yc' },
  { keyword: 'a16z portfolio Web3', radar: 'funding_watch', category: 'vc' },
  { keyword: 'sequoia crypto investments', radar: 'funding_watch', category: 'vc' },
];

// ============================================================================
// Track 2: Web3 退场风险预警 Keywords
// ============================================================================
const TRACK2_PAIN_HUNTER: InsertKeyword[] = [
  { keyword: 'how to detect rug pull early', radar: 'pain_hunter', category: 'risk_detection' },
  { keyword: 'scam detection crypto', radar: 'pain_hunter', category: 'risk_detection' },
  { keyword: 'exit scam warning signs', radar: 'pain_hunter', category: 'risk_detection' },
  { keyword: 'token health check', radar: 'pain_hunter', category: 'health_monitoring' },
  { keyword: 'development activity tracking', radar: 'pain_hunter', category: 'health_monitoring' },
  { keyword: 'holder concentration risk', radar: 'pain_hunter', category: 'health_monitoring' },
  { keyword: 'community sentiment analysis', radar: 'pain_hunter', category: 'sentiment' },
  { keyword: 'whale movement monitoring', radar: 'pain_hunter', category: 'sentiment' },
  { keyword: 'liquidity withdrawal risk', radar: 'pain_hunter', category: 'exchange' },
];

const TRACK2_TECH_SCOUT: InsertKeyword[] = [
  { keyword: 'on-chain metrics analysis', radar: 'tech_scout', category: 'onchain' },
  { keyword: 'token flow analysis', radar: 'tech_scout', category: 'onchain' },
  { keyword: 'smart contract monitoring', radar: 'tech_scout', category: 'onchain' },
  { keyword: 'blockchain data aggregation', radar: 'tech_scout', category: 'data' },
  { keyword: 'real-time chain data API', radar: 'tech_scout', category: 'data' },
  { keyword: 'correlation between social sentiment and on-chain', radar: 'tech_scout', category: 'crossdata' },
  { keyword: 'multimodal risk scoring', radar: 'tech_scout', category: 'crossdata' },
  { keyword: 'anomaly detection for blockchain', radar: 'tech_scout', category: 'ml' },
];

const TRACK2_FUNDING: InsertKeyword[] = [
  { keyword: 'token risk assessment startup', radar: 'funding_watch', category: 'funding' },
  { keyword: 'blockchain security platform funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'crypto intelligence platform raise', radar: 'funding_watch', category: 'funding' },
  { keyword: 'on-chain analytics startup series', radar: 'funding_watch', category: 'funding' },
  { keyword: 'crypto fund management tool funding', radar: 'funding_watch', category: 'funding' },
  { keyword: 'YC blockchain', radar: 'funding_watch', category: 'yc' },
  { keyword: 'a16z crypto infrastructure', radar: 'funding_watch', category: 'vc' },
];

// ============================================================================
// AI 前沿 Keywords (Bonus Track)
// ============================================================================
const AI_FRONTIER: InsertKeyword[] = [
  { keyword: 'vision AI old industry', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'document AI compliance', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'workflow automation for SMB', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'data extraction from unstructured sources', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'voice cloning for business', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'real-time video processing', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'multimodal understanding', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'personalization at scale', radar: 'tech_scout', category: 'ai_frontier' },
  { keyword: 'fine-tuning for specific domain', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'prompt engineering as a service', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'model observability', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'synthetic data generation', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'edge AI offline', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'AI for data quality', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'cost optimization for LLM', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'AI transparency interpretability', radar: 'tech_scout', category: 'ai_engineering' },
  { keyword: 'AI agent framework', radar: 'tech_scout', category: 'ai_agent' },
  { keyword: 'browser automation AI', radar: 'tech_scout', category: 'ai_agent' },
  { keyword: 'RAG retrieval augmented generation', radar: 'tech_scout', category: 'ai_agent' },
  { keyword: 'MCP model context protocol', radar: 'tech_scout', category: 'ai_agent' },
];

// ============================================================================
// KOLs
// ============================================================================
const KOLS: InsertKol[] = [
  // Track 3 KOLs
  { handle: 'buildots_io', platform: 'twitter', name: 'Buildots (Construction AI)' },
  { handle: 'openspace_ai', platform: 'twitter', name: 'OpenSpace (Construction Progress)' },
  { handle: 'doxel_com', platform: 'twitter', name: 'Doxel (AI Construction)' },
  
  // Track 1 KOLs
  { handle: 'dvassallo', platform: 'twitter', name: 'Daniel Vassallo (Indie Hacker)' },
  { handle: 'eriktorenberg', platform: 'twitter', name: 'Erik Torenberg (VC)' },
  { handle: 'jessepollak', platform: 'twitter', name: 'Jesse Pollak (Base/Coinbase)' },
  { handle: 'tarunchitra', platform: 'twitter', name: 'Tarun Chitra (Variant Fund)' },
  { handle: 'balajis', platform: 'twitter', name: 'Balaji Srinivasan (Web3)' },
  
  // Track 2 KOLs
  { handle: 'ArkhamIntel', platform: 'twitter', name: 'Arkham Intelligence' },
  { handle: 'CertikCommunity', platform: 'twitter', name: 'Certik (Security)' },
  
  // AI Frontier KOLs
  { handle: 'andrewng', platform: 'twitter', name: 'Andrew Ng (AI Pioneer)' },
  { handle: 'karpathy', platform: 'twitter', name: 'Andrej Karpathy (Tesla AI)' },
  { handle: 'emollick', platform: 'twitter', name: 'Ethan Mollick (Wharton)' },
  { handle: 'swyx', platform: 'twitter', name: 'Shawn Wang (Latent Space)' },
  { handle: 'yoheinakajima', platform: 'twitter', name: 'Yohei Nakajima (AutoGPT)' },
  { handle: 'sama', platform: 'twitter', name: 'Sam Altman (OpenAI)' },
  { handle: 'patrickc', platform: 'twitter', name: 'Patrick Collison (Stripe)' },
  { handle: 'ylecun', platform: 'twitter', name: 'Yann LeCun (Meta AI)' },
  
  // GitHub KOLs
  { handle: 'langchain-ai', platform: 'github', name: 'LangChain' },
  { handle: 'openai', platform: 'github', name: 'OpenAI' },
  { handle: 'huggingface', platform: 'github', name: 'Hugging Face' },
  
  // Reddit communities (as KOLs)
  { handle: 'LocalLLaMA', platform: 'reddit', name: 'r/LocalLLaMA' },
  { handle: 'MachineLearning', platform: 'reddit', name: 'r/MachineLearning' },
  { handle: 'artificial', platform: 'reddit', name: 'r/artificial' },
  { handle: 'CryptoCurrency', platform: 'reddit', name: 'r/CryptoCurrency' },
  { handle: 'HomeImprovement', platform: 'reddit', name: 'r/HomeImprovement' },
];

// ============================================================================
// Seed Function
// ============================================================================

/**
 * Seed all keywords and KOLs
 */
export async function seedAllData(): Promise<{
  keywordsAdded: number;
  kolsAdded: number;
}> {
  let keywordsAdded = 0;
  let kolsAdded = 0;
  
  // Check existing data
  const existingKeywords = await getAllKeywords();
  const existingKols = await getAllKols();
  
  const existingKeywordSet = new Set(existingKeywords.map(k => k.keyword.toLowerCase()));
  const existingKolSet = new Set(existingKols.map(k => `${k.platform}:${k.handle.toLowerCase()}`));
  
  // Combine all keywords
  const allKeywords = [
    ...TRACK3_PAIN_HUNTER,
    ...TRACK3_TECH_SCOUT,
    ...TRACK3_FUNDING,
    ...TRACK1_PAIN_HUNTER,
    ...TRACK1_TECH_SCOUT,
    ...TRACK1_FUNDING,
    ...TRACK2_PAIN_HUNTER,
    ...TRACK2_TECH_SCOUT,
    ...TRACK2_FUNDING,
    ...AI_FRONTIER,
  ];
  
  // Insert keywords
  for (const keyword of allKeywords) {
    if (!existingKeywordSet.has(keyword.keyword.toLowerCase())) {
      try {
        await insertKeyword(keyword);
        keywordsAdded++;
      } catch (e) {
        console.error(`Failed to insert keyword: ${keyword.keyword}`, e);
      }
    }
  }
  
  // Insert KOLs
  for (const kol of KOLS) {
    const key = `${kol.platform}:${kol.handle.toLowerCase()}`;
    if (!existingKolSet.has(key)) {
      try {
        await insertKol(kol);
        kolsAdded++;
      } catch (e) {
        console.error(`Failed to insert KOL: ${kol.handle}`, e);
      }
    }
  }
  
  // Initialize data sources
  const sources = ['github', 'hackernews', 'reddit', 'producthunt', 'huggingface', 'ycombinator', 'twitter'] as const;
  for (const source of sources) {
    await upsertDataSource({
      source,
      enabled: source !== 'twitter', // Twitter disabled by default (needs API key)
      itemCount: 0,
    });
  }
  
  return { keywordsAdded, kolsAdded };
}

/**
 * Get seed data summary
 */
export function getSeedDataSummary(): {
  totalKeywords: number;
  totalKols: number;
  byRadar: Record<string, number>;
  byPlatform: Record<string, number>;
} {
  const allKeywords = [
    ...TRACK3_PAIN_HUNTER,
    ...TRACK3_TECH_SCOUT,
    ...TRACK3_FUNDING,
    ...TRACK1_PAIN_HUNTER,
    ...TRACK1_TECH_SCOUT,
    ...TRACK1_FUNDING,
    ...TRACK2_PAIN_HUNTER,
    ...TRACK2_TECH_SCOUT,
    ...TRACK2_FUNDING,
    ...AI_FRONTIER,
  ];
  
  const byRadar: Record<string, number> = {};
  for (const kw of allKeywords) {
    byRadar[kw.radar] = (byRadar[kw.radar] || 0) + 1;
  }
  
  const byPlatform: Record<string, number> = {};
  for (const kol of KOLS) {
    byPlatform[kol.platform] = (byPlatform[kol.platform] || 0) + 1;
  }
  
  return {
    totalKeywords: allKeywords.length,
    totalKols: KOLS.length,
    byRadar,
    byPlatform,
  };
}
