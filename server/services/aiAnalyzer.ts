/**
 * AI Analyzer Service - Three Persona Analysis
 * PM (Product Manager): Market opportunity, user needs, monetization
 * Tech Lead: Technical feasibility, architecture, implementation
 * VC Analyst: Market size, competition, investment potential
 */

import { invokeLLM } from '../_core/llm';
import { getTopicById, updateTopicAnalysis, updateTopicScores } from '../db';
import type { Topic, RawItem } from '../../drizzle/schema';

// ============================================================================
// Types
// ============================================================================
interface PersonaAnalysis {
  pm: string;
  tech: string;
  vc: string;
}

interface SolopreneurFit {
  complexity: number; // 1-5 (1=simple, 5=complex)
  capital: number;    // 1-5 (1=low, 5=high)
  ttm: number;        // 1-5 (1=fast, 5=slow)
  moat: number;       // 1-5 (1=weak, 5=strong)
  overall: number;    // Weighted average
}

// ============================================================================
// Persona Prompts
// ============================================================================

const PM_PERSONA = `You are a cynical, experienced Product Manager who has seen hundreds of failed startups. 
Your job is to be brutally honest about market opportunities.

Analyze this opportunity and provide:
1. **Market Pain** (1-2 sentences): Is this a real pain point? Who feels it most?
2. **Willingness to Pay** (1-2 sentences): Will people actually pay for this? How much?
3. **Competition** (1-2 sentences): Who else is solving this? Why would you win?
4. **Red Flags** (1-2 sentences): What could go wrong? Why might this fail?
5. **Verdict** (1 sentence): Build it or skip it?

Be direct, use simple language, no corporate jargon. If it's a bad idea, say so.`;

const TECH_PERSONA = `You are a senior software architect who has built and shipped many products.
Your job is to evaluate technical feasibility for a solo developer.

Analyze this opportunity and provide:
1. **Core Tech** (1-2 sentences): What's the main technical challenge?
2. **MVP Scope** (1-2 sentences): What's the minimum viable product? How long to build?
3. **Tech Stack** (1-2 sentences): What would you use? Any gotchas?
4. **Scaling Concerns** (1-2 sentences): What breaks at scale?
5. **Verdict** (1 sentence): Feasible for one person in 30 days?

Be practical, focus on what a solo dev can actually build.`;

const VC_PERSONA = `You are a venture capital analyst who evaluates early-stage opportunities.
Your job is to assess market potential and investment worthiness.

Analyze this opportunity and provide:
1. **Market Size** (1-2 sentences): TAM/SAM/SOM estimate? Growing or shrinking?
2. **Timing** (1-2 sentences): Why now? What's changed?
3. **Moat Potential** (1-2 sentences): Can you build defensibility? Network effects?
4. **Exit Path** (1-2 sentences): Who would acquire this? IPO potential?
5. **Verdict** (1 sentence): Would you invest at seed stage?

Be analytical, use data when possible, but be honest about uncertainties.`;

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Generate PM analysis for a topic
 */
async function generatePMAnalysis(topic: Topic, rawItem?: RawItem): Promise<string> {
  const context = `
Topic: ${topic.title}
Summary: ${topic.summary || 'No summary available'}
Category: ${topic.category}
Radar: ${topic.radar}
Current Scores: Velocity=${topic.velocityScore?.toFixed(1)}, Consensus=${topic.consensusScore?.toFixed(1)}, Fit=${topic.fitScore?.toFixed(1)}
Source: ${rawItem?.source || 'Unknown'}
Engagement: Score=${rawItem?.score || 0}, Stars=${rawItem?.stars || 0}, Comments=${rawItem?.comments || 0}
`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: PM_PERSONA },
        { role: 'user', content: `Analyze this opportunity:\n${context}` }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'Analysis unavailable';
  } catch (e) {
    console.error('[PM Analysis] Error:', e);
    return 'Analysis failed';
  }
}

/**
 * Generate Tech Lead analysis for a topic
 */
async function generateTechAnalysis(topic: Topic, rawItem?: RawItem): Promise<string> {
  const context = `
Topic: ${topic.title}
Summary: ${topic.summary || 'No summary available'}
Category: ${topic.category}
Radar: ${topic.radar}
Source: ${rawItem?.source || 'Unknown'}
Content: ${rawItem?.content?.slice(0, 500) || 'No additional content'}
`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: TECH_PERSONA },
        { role: 'user', content: `Analyze this opportunity:\n${context}` }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'Analysis unavailable';
  } catch (e) {
    console.error('[Tech Analysis] Error:', e);
    return 'Analysis failed';
  }
}

/**
 * Generate VC Analyst analysis for a topic
 */
async function generateVCAnalysis(topic: Topic, rawItem?: RawItem): Promise<string> {
  const context = `
Topic: ${topic.title}
Summary: ${topic.summary || 'No summary available'}
Category: ${topic.category}
Radar: ${topic.radar}
Cross-Platform Count: ${topic.crossPlatformCount}
Current Scores: Velocity=${topic.velocityScore?.toFixed(1)}, Consensus=${topic.consensusScore?.toFixed(1)}, Credibility=${topic.credibilityScore?.toFixed(1)}
`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: VC_PERSONA },
        { role: 'user', content: `Analyze this opportunity:\n${context}` }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : 'Analysis unavailable';
  } catch (e) {
    console.error('[VC Analysis] Error:', e);
    return 'Analysis failed';
  }
}

/**
 * Generate all three persona analyses for a topic
 */
export async function generateFullAnalysis(topicId: number): Promise<PersonaAnalysis | null> {
  const topic = await getTopicById(topicId);
  if (!topic) return null;
  
  // Generate all analyses in parallel
  const [pm, tech, vc] = await Promise.all([
    generatePMAnalysis(topic),
    generateTechAnalysis(topic),
    generateVCAnalysis(topic),
  ]);
  
  // Save to database
  await updateTopicAnalysis(topicId, {
    pmAnalysis: pm,
    techAnalysis: tech,
    vcAnalysis: vc,
  });
  
  return { pm, tech, vc };
}

/**
 * Evaluate solopreneur fit in detail
 */
export async function evaluateSolopreneurFit(topicId: number): Promise<SolopreneurFit | null> {
  const topic = await getTopicById(topicId);
  if (!topic) return null;
  
  const prompt = `Evaluate this opportunity for a solo developer/entrepreneur:

Topic: ${topic.title}
Summary: ${topic.summary || 'No summary'}
Category: ${topic.category}

Rate each dimension from 1-5:
- Complexity: 1=very simple (weekend project), 5=very complex (needs team)
- Capital: 1=can start free, 5=needs significant investment
- TTM (Time to Market): 1=can ship in days, 5=needs months
- Moat: 1=easily copied, 5=strong defensibility

Respond in JSON format:
{
  "complexity": 1-5,
  "capital": 1-5,
  "ttm": 1-5,
  "moat": 1-5,
  "reasoning": "Brief explanation"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are evaluating business opportunities for solo developers. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'solopreneur_fit',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              complexity: { type: 'number' },
              capital: { type: 'number' },
              ttm: { type: 'number' },
              moat: { type: 'number' },
              reasoning: { type: 'string' }
            },
            required: ['complexity', 'capital', 'ttm', 'moat', 'reasoning'],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;
    
    const result = JSON.parse(content);
    
    // Calculate overall fit (inverse of complexity/capital/ttm, plus moat)
    // Lower complexity, capital, ttm = better fit
    // Higher moat = better fit
    const overall = (
      (6 - result.complexity) * 0.3 +
      (6 - result.capital) * 0.25 +
      (6 - result.ttm) * 0.25 +
      result.moat * 0.2
    );
    
    // Update topic with fit scores
    await updateTopicScores(topicId, {
      fitScore: overall,
    });
    
    return {
      complexity: result.complexity,
      capital: result.capital,
      ttm: result.ttm,
      moat: result.moat,
      overall,
    };
  } catch (e) {
    console.error('[Solopreneur Fit] Error:', e);
    return null;
  }
}

/**
 * Generate quick summary for push notification
 */
export async function generatePushSummary(topic: Topic): Promise<string> {
  const prompt = `Create a brief, compelling summary (max 100 words) for this market opportunity:

Topic: ${topic.title}
Summary: ${topic.summary || 'No summary'}
Category: ${topic.category}
Radar: ${topic.radar}
Trend Score: ${topic.trendScore?.toFixed(1)}/5

The summary should:
1. Highlight the key opportunity
2. Mention why it's trending
3. Include a call to action

Write in a direct, engaging style.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: 'You are a market intelligence analyst writing brief summaries.' },
        { role: 'user', content: prompt }
      ]
    });
    
    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content : topic.summary || topic.title;
  } catch (e) {
    return topic.summary || topic.title;
  }
}
