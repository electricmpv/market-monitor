/**
 * Push Service - WeChat Push via PushPlus
 */

import { getTopicsForPush, insertPushHistory, updatePushStatus, getConfig, setConfig } from '../db';
import { generatePushSummary } from './aiAnalyzer';
import type { Topic } from '../../drizzle/schema';

// ============================================================================
// Types
// ============================================================================
interface PushResult {
  success: boolean;
  topicId?: number;
  error?: string;
}

// ============================================================================
// PushPlus Integration
// ============================================================================

/**
 * Send push notification via PushPlus
 */
async function sendPushPlus(title: string, content: string, token: string): Promise<boolean> {
  try {
    const response = await fetch('http://www.pushplus.plus/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        title,
        content,
        template: 'markdown',
      }),
    });
    
    const result = await response.json();
    return result.code === 200;
  } catch (e) {
    console.error('[PushPlus] Error:', e);
    return false;
  }
}

/**
 * Format topic for push notification
 */
function formatTopicForPush(topic: Topic, summary: string): string {
  const radarEmoji: Record<string, string> = {
    pain_hunter: '🎯',
    tech_scout: '🔬',
    funding_watch: '💰',
  };
  
  const emoji = radarEmoji[topic.radar] || '📊';
  
  return `
${emoji} **${topic.title}**

**雷达**: ${topic.radar.replace('_', ' ').toUpperCase()}
**趋势分数**: ${topic.trendScore?.toFixed(1)}/5.0
**跨平台共识**: ${topic.crossPlatformCount} 个来源

---

${summary}

---

**五维评分**:
- 🚀 加速度: ${topic.velocityScore?.toFixed(1)}/5
- 🌐 共识度: ${topic.consensusScore?.toFixed(1)}/5
- ⭐ 可信度: ${topic.credibilityScore?.toFixed(1)}/5
- 🎯 适合度: ${topic.fitScore?.toFixed(1)}/5
- ✨ 新颖度: ${topic.noveltyScore?.toFixed(1)}/5

[查看详情](https://your-domain.com/topic/${topic.id})
`;
}

/**
 * Send daily digest push
 */
export async function sendDailyDigest(): Promise<PushResult[]> {
  const results: PushResult[] = [];
  
  // Get PushPlus token from config
  const token = await getConfig('PUSHPLUS_TOKEN');
  if (!token) {
    console.warn('[Push] PushPlus token not configured');
    return [{ success: false, error: 'PushPlus token not configured' }];
  }
  
  // Get topics to push
  const topics = await getTopicsForPush(5);
  
  if (topics.length === 0) {
    console.log('[Push] No topics to push today');
    return [{ success: true, error: 'No topics to push' }];
  }
  
  // Format digest
  const date = new Date().toLocaleDateString('zh-CN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  let digestContent = `# 📊 AI市场机会日报 - ${date}\n\n`;
  digestContent += `今日发现 **${topics.length}** 个值得关注的机会\n\n---\n\n`;
  
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const summary = await generatePushSummary(topic);
    
    digestContent += `## ${i + 1}. ${topic.title}\n\n`;
    digestContent += formatTopicForPush(topic, summary);
    digestContent += '\n\n---\n\n';
    
    // Record push history
    const pushId = await insertPushHistory({
      topicId: topic.id,
      title: topic.title,
      content: summary,
      status: 'pending',
    });
    
    results.push({ success: true, topicId: topic.id });
  }
  
  // Send the digest
  const success = await sendPushPlus(
    `📊 AI市场机会日报 - ${date}`,
    digestContent,
    token
  );
  
  // Update push status
  for (const result of results) {
    if (result.topicId) {
      // Update status in push history
      // Note: We'd need to track the push history ID for each topic
    }
  }
  
  if (!success) {
    return [{ success: false, error: 'Failed to send push notification' }];
  }
  
  // Update last push time
  await setConfig('LAST_PUSH_TIME', new Date().toISOString());
  
  return results;
}

/**
 * Send single topic push (for urgent/high-score topics)
 */
export async function sendSingleTopicPush(topicId: number): Promise<PushResult> {
  const token = await getConfig('PUSHPLUS_TOKEN');
  if (!token) {
    return { success: false, error: 'PushPlus token not configured' };
  }
  
  const topic = await getTopicsForPush(100).then(topics => topics.find(t => t.id === topicId));
  if (!topic) {
    return { success: false, error: 'Topic not found or not eligible for push' };
  }
  
  const summary = await generatePushSummary(topic);
  const content = formatTopicForPush(topic, summary);
  
  const pushId = await insertPushHistory({
    topicId: topic.id,
    title: topic.title,
    content: summary,
    status: 'pending',
  });
  
  const success = await sendPushPlus(
    `🔔 新机会: ${topic.title}`,
    content,
    token
  );
  
  await updatePushStatus(pushId, success ? 'sent' : 'failed', success ? undefined : 'Push failed');
  
  return { success, topicId };
}

/**
 * Check if it's time for daily push (08:30 AM)
 */
export function shouldSendDailyPush(): boolean {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Send at 08:30
  return hours === 8 && minutes >= 30 && minutes < 35;
}

/**
 * Get push configuration
 */
export async function getPushConfig(): Promise<{
  enabled: boolean;
  token: string | null;
  lastPushTime: string | null;
  pushTime: string;
}> {
  const token = await getConfig('PUSHPLUS_TOKEN');
  const lastPushTime = await getConfig('LAST_PUSH_TIME');
  const pushTime = await getConfig('PUSH_TIME') || '08:30';
  
  return {
    enabled: !!token,
    token: token ? '****' + token.slice(-4) : null,
    lastPushTime,
    pushTime,
  };
}

/**
 * Update push configuration
 */
export async function updatePushConfig(config: {
  token?: string;
  pushTime?: string;
}): Promise<void> {
  if (config.token) {
    await setConfig('PUSHPLUS_TOKEN', config.token);
  }
  if (config.pushTime) {
    await setConfig('PUSH_TIME', config.pushTime);
  }
}
