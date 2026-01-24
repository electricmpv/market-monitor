/**
 * Data Collector Service
 * Fetches data from multiple sources: RSS feeds, GitHub API, Hacker News API
 */

import { insertRawItem, getRawItemByExternalId, updateDataSourceSync, getAllKeywords } from '../db';
import type { InsertRawItem, Keyword } from '../../drizzle/schema';

// ============================================================================
// Types
// ============================================================================
interface FetchResult {
  source: string;
  itemsFound: number;
  itemsNew: number;
  error?: string;
}

interface RSSItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  author?: string;
  guid?: string;
}

// ============================================================================
// RSS Parser (Simple XML parsing without external deps)
// ============================================================================
function parseRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    
    const getTag = (tag: string): string => {
      const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = itemXml.match(regex);
      return (m?.[1] || m?.[2] || '').trim();
    };
    
    items.push({
      title: getTag('title'),
      link: getTag('link'),
      description: getTag('description'),
      pubDate: getTag('pubDate'),
      author: getTag('author') || getTag('dc:creator'),
      guid: getTag('guid') || getTag('link'),
    });
  }
  
  return items;
}

// ============================================================================
// Data Source Fetchers
// ============================================================================

/**
 * Fetch Hacker News top/new stories
 */
export async function fetchHackerNews(type: 'top' | 'new' = 'top', limit: number = 30): Promise<FetchResult> {
  const result: FetchResult = { source: 'hackernews', itemsFound: 0, itemsNew: 0 };
  
  try {
    const endpoint = type === 'top' 
      ? 'https://hacker-news.firebaseio.com/v0/topstories.json'
      : 'https://hacker-news.firebaseio.com/v0/newstories.json';
    
    const idsRes = await fetch(endpoint);
    const ids: number[] = await idsRes.json();
    const topIds = ids.slice(0, limit);
    
    result.itemsFound = topIds.length;
    
    for (const id of topIds) {
      try {
        const existing = await getRawItemByExternalId('hackernews', String(id));
        if (existing) continue;
        
        const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const item = await itemRes.json();
        
        if (!item || item.deleted || item.dead) continue;
        
        const rawItem: InsertRawItem = {
          source: 'hackernews',
          externalId: String(id),
          url: item.url || `https://news.ycombinator.com/item?id=${id}`,
          title: item.title || '',
          content: item.text || '',
          author: item.by || '',
          score: item.score || 0,
          comments: item.descendants || 0,
          publishedAt: item.time ? new Date(item.time * 1000) : new Date(),
        };
        
        await insertRawItem(rawItem);
        result.itemsNew++;
      } catch (e) {
        console.error(`[HN] Failed to fetch item ${id}:`, e);
      }
    }
    
    await updateDataSourceSync('hackernews', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('hackernews', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch GitHub trending repositories
 */
export async function fetchGitHubTrending(language: string = '', since: string = 'daily'): Promise<FetchResult> {
  const result: FetchResult = { source: 'github', itemsFound: 0, itemsNew: 0 };
  
  try {
    // Use GitHub Search API for trending repos
    const query = language 
      ? `language:${language} created:>${getDateDaysAgo(7)} stars:>10`
      : `created:>${getDateDaysAgo(7)} stars:>50`;
    
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=30`;
    
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MarketMonitor/3.0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }
    
    const data = await res.json();
    const repos = data.items || [];
    
    result.itemsFound = repos.length;
    
    for (const repo of repos) {
      try {
        const existing = await getRawItemByExternalId('github', String(repo.id));
        if (existing) continue;
        
        const rawItem: InsertRawItem = {
          source: 'github',
          externalId: String(repo.id),
          url: repo.html_url,
          title: repo.full_name,
          content: repo.description || '',
          author: repo.owner?.login || '',
          stars: repo.stargazers_count || 0,
          score: repo.stargazers_count || 0,
          publishedAt: repo.created_at ? new Date(repo.created_at) : new Date(),
        };
        
        await insertRawItem(rawItem);
        result.itemsNew++;
      } catch (e) {
        console.error(`[GitHub] Failed to process repo ${repo.full_name}:`, e);
      }
    }
    
    await updateDataSourceSync('github', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('github', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch Reddit posts from specific subreddits
 */
export async function fetchReddit(subreddits: string[] = ['LocalLLaMA', 'MachineLearning', 'artificial']): Promise<FetchResult> {
  const result: FetchResult = { source: 'reddit', itemsFound: 0, itemsNew: 0 };
  
  try {
    for (const subreddit of subreddits) {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'MarketMonitor/3.0' }
        });
        
        if (!res.ok) continue;
        
        const data = await res.json();
        const posts = data?.data?.children || [];
        
        result.itemsFound += posts.length;
        
        for (const post of posts) {
          const p = post.data;
          if (!p || p.stickied) continue;
          
          const existing = await getRawItemByExternalId('reddit', p.id);
          if (existing) continue;
          
          const rawItem: InsertRawItem = {
            source: 'reddit',
            externalId: p.id,
            url: `https://reddit.com${p.permalink}`,
            title: p.title || '',
            content: p.selftext || '',
            author: p.author || '',
            upvotes: p.ups || 0,
            score: p.score || 0,
            comments: p.num_comments || 0,
            publishedAt: p.created_utc ? new Date(p.created_utc * 1000) : new Date(),
          };
          
          await insertRawItem(rawItem);
          result.itemsNew++;
        }
      } catch (e) {
        console.error(`[Reddit] Failed to fetch r/${subreddit}:`, e);
      }
    }
    
    await updateDataSourceSync('reddit', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('reddit', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch Product Hunt posts via RSS
 */
export async function fetchProductHunt(): Promise<FetchResult> {
  const result: FetchResult = { source: 'producthunt', itemsFound: 0, itemsNew: 0 };
  
  try {
    const res = await fetch('https://www.producthunt.com/feed?category=undefined');
    const xml = await res.text();
    const items = parseRSS(xml);
    
    result.itemsFound = items.length;
    
    for (const item of items) {
      if (!item.guid || !item.title) continue;
      
      const existing = await getRawItemByExternalId('producthunt', item.guid);
      if (existing) continue;
      
      const rawItem: InsertRawItem = {
        source: 'producthunt',
        externalId: item.guid,
        url: item.link || '',
        title: item.title,
        content: item.description || '',
        author: item.author || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      };
      
      await insertRawItem(rawItem);
      result.itemsNew++;
    }
    
    await updateDataSourceSync('producthunt', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('producthunt', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch Hugging Face Daily Papers
 */
export async function fetchHuggingFace(): Promise<FetchResult> {
  const result: FetchResult = { source: 'huggingface', itemsFound: 0, itemsNew: 0 };
  
  try {
    const res = await fetch('https://huggingface.co/api/daily_papers');
    const papers = await res.json();
    
    result.itemsFound = papers.length || 0;
    
    for (const paper of papers || []) {
      if (!paper.paper?.id) continue;
      
      const existing = await getRawItemByExternalId('huggingface', paper.paper.id);
      if (existing) continue;
      
      const rawItem: InsertRawItem = {
        source: 'huggingface',
        externalId: paper.paper.id,
        url: `https://huggingface.co/papers/${paper.paper.id}`,
        title: paper.paper.title || '',
        content: paper.paper.summary || '',
        author: paper.paper.authors?.map((a: any) => a.name).join(', ') || '',
        upvotes: paper.paper.upvotes || 0,
        score: paper.paper.upvotes || 0,
        publishedAt: paper.publishedAt ? new Date(paper.publishedAt) : new Date(),
      };
      
      await insertRawItem(rawItem);
      result.itemsNew++;
    }
    
    await updateDataSourceSync('huggingface', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('huggingface', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch Y Combinator Launch RSS
 */
export async function fetchYCombinator(): Promise<FetchResult> {
  const result: FetchResult = { source: 'ycombinator', itemsFound: 0, itemsNew: 0 };
  
  try {
    const res = await fetch('https://www.ycombinator.com/rss');
    const xml = await res.text();
    const items = parseRSS(xml);
    
    result.itemsFound = items.length;
    
    for (const item of items) {
      if (!item.guid || !item.title) continue;
      
      const existing = await getRawItemByExternalId('ycombinator', item.guid);
      if (existing) continue;
      
      const rawItem: InsertRawItem = {
        source: 'ycombinator',
        externalId: item.guid,
        url: item.link || '',
        title: item.title,
        content: item.description || '',
        author: item.author || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      };
      
      await insertRawItem(rawItem);
      result.itemsNew++;
    }
    
    await updateDataSourceSync('ycombinator', result.itemsNew);
  } catch (e) {
    result.error = String(e);
    await updateDataSourceSync('ycombinator', 0, result.error);
  }
  
  return result;
}

/**
 * Fetch Twitter using BYOC (Bring Your Own Cookie) strategy
 * Uses cookies provided by user to scrape tweets from KOL list
 */
export async function fetchTwitter(): Promise<FetchResult> {
  const result: FetchResult = { source: 'twitter', itemsFound: 0, itemsNew: 0 };
  
  try {
    const { getConfig } = await import('../db');
    const cookiesJson = await getConfig('twitter_cookies');
    
    if (!cookiesJson) {
      console.log('[Twitter] No cookies configured, skipping');
      return result;
    }
    
    const cookies = JSON.parse(cookiesJson);
    if (!cookies || typeof cookies !== 'object') {
      throw new Error('Invalid cookies format');
    }
    
    // Get KOL list from database
    const { getKolsByPlatform } = await import('../db');
    const kols = await getKolsByPlatform('twitter');
    
    if (kols.length === 0) {
      console.log('[Twitter] No Twitter KOLs configured');
      return result;
    }
    
    console.log(`[Twitter] Fetching tweets from ${kols.length} KOLs`);
    
    // Convert cookies object to Cookie header string
    const cookieHeader = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    // Fetch tweets from each KOL with rate limiting
    for (const kol of kols) {
      try {
        const username = kol.handle;
        console.log(`[Twitter] Fetching tweets from @${username}`);
        
        // Step 1: Get user's rest_id from handle using UserByScreenName
        const userByScreenNameUrl = `https://twitter.com/i/api/graphql/G3KGOASz96M-Qu0nwmGXNg/UserByScreenName?variables=${encodeURIComponent(
          JSON.stringify({
            screen_name: username,
            withSafetyModeUserFields: true
          })
        )}&features=${encodeURIComponent(
          JSON.stringify({
            hidden_profile_likes_enabled: false,
            responsive_web_graphql_exclude_directive_enabled: true,
            verified_phone_label_enabled: false,
            subscriptions_verification_info_verified_since_enabled: true,
            highlights_tweets_tab_ui_enabled: true,
            creator_subscriptions_tweet_preview_api_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            responsive_web_graphql_timeline_navigation_enabled: true
          })
        )}`;
        
        const userResponse = await fetch(userByScreenNameUrl, {
          headers: {
            'authority': 'twitter.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
            'content-type': 'application/json',
            'cookie': cookieHeader,
            'referer': `https://twitter.com/${username}`,
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': 'en',
          },
        });
        
        if (!userResponse.ok) {
          console.warn(`[Twitter] Failed to get user ID for @${username}: ${userResponse.status}`);
          
          // Cookie expired or invalid
          if (userResponse.status === 401 || userResponse.status === 403) {
            console.error('[Twitter] Cookies expired or invalid. Please update in Settings.');
            const { updateDataSourceSync } = await import('../db');
            await updateDataSourceSync('twitter', 0, 'Cookies expired - please update in Settings');
            throw new Error('Twitter cookies expired');
          }
          
          if (userResponse.status === 429) {
            console.log('[Twitter] Rate limit hit, waiting 60s...');
            await sleep(60000);
          }
          continue;
        }
        
        const userData = await userResponse.json();
        const userId = userData?.data?.user?.result?.rest_id;
        
        if (!userId) {
          console.warn(`[Twitter] Could not find rest_id for @${username}`);
          continue;
        }
        
        console.log(`[Twitter] Got rest_id ${userId} for @${username}`);
        
        // Step 2: Fetch tweets using the numeric rest_id
        const url = `https://twitter.com/i/api/graphql/V7H0Ap3_Hh2FyS75OCDO3Q/UserTweets?variables=${encodeURIComponent(
          JSON.stringify({
            userId: userId, // ✅ Fixed: Use numeric rest_id instead of handle
            count: 20,
            includePromotedContent: false,
            withQuickPromoteEligibilityTweetFields: false,
            withVoice: false,
            withV2Timeline: true
          })
        )}&features=${encodeURIComponent(
          JSON.stringify({
            rweb_lists_timeline_redesign_enabled: true,
            responsive_web_graphql_exclude_directive_enabled: true,
            verified_phone_label_enabled: false,
            creator_subscriptions_tweet_preview_api_enabled: true,
            responsive_web_graphql_timeline_navigation_enabled: true,
            responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
            tweetypie_unmention_optimization_enabled: true,
            responsive_web_edit_tweet_api_enabled: true,
            graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
            view_counts_everywhere_api_enabled: true,
            longform_notetweets_consumption_enabled: true,
            responsive_web_twitter_article_tweet_consumption_enabled: false,
            tweet_awards_web_tipping_enabled: false,
            freedom_of_speech_not_reach_fetch_enabled: true,
            standardized_nudges_misinfo: true,
            tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
            longform_notetweets_rich_text_read_enabled: true,
            longform_notetweets_inline_media_enabled: true,
            responsive_web_media_download_video_enabled: false,
            responsive_web_enhance_cards_enabled: false
          })
        )}`;
        
        const response = await fetch(url, {
          headers: {
            'authority': 'twitter.com',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
            'content-type': 'application/json',
            'cookie': cookieHeader,
            'referer': `https://twitter.com/${username}`,
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': 'en',
          },
        });
        
        if (!response.ok) {
          console.warn(`[Twitter] Failed to fetch @${username}: ${response.status}`);
          
          // Cookie expired or invalid
          if (response.status === 401 || response.status === 403) {
            console.error('[Twitter] Cookies expired or invalid. Please update in Settings.');
            const { updateDataSourceSync } = await import('../db');
            await updateDataSourceSync('twitter', 0, 'Cookies expired - please update in Settings');
            throw new Error('Twitter cookies expired');
          }
          
          // Rate limit hit, wait longer
          if (response.status === 429) {
            console.log('[Twitter] Rate limit hit, waiting 60s...');
            await sleep(60000);
          }
          continue;
        }
        
        const data = await response.json();
        const tweets = extractTweetsFromResponse(data);
        
        result.itemsFound += tweets.length;
        
        for (const tweet of tweets) {
          const existing = await getRawItemByExternalId('twitter', tweet.id);
          if (existing) continue;
          
          const rawItem: InsertRawItem = {
            source: 'twitter',
            externalId: tweet.id,
            url: `https://twitter.com/${username}/status/${tweet.id}`,
            title: tweet.text.substring(0, 200),
            content: tweet.text,
            author: username,
            score: tweet.likes || 0,
            comments: tweet.replies || 0,
            publishedAt: tweet.createdAt ? new Date(tweet.createdAt) : new Date(),
          };
          
          await insertRawItem(rawItem);
          result.itemsNew++;
        }
        
        // Rate limiting: sleep 10s between each KOL
        await sleep(10000);
        
      } catch (e) {
        console.error(`[Twitter] Error fetching @${kol.handle}:`, e);
        continue;
      }
    }
    
    await updateDataSourceSync('twitter', result.itemsNew);
    
  } catch (e) {
    result.error = String(e);
    console.error('[Twitter] Fatal error:', e);
    await updateDataSourceSync('twitter', 0, result.error);
  }
  
  return result;
}

/**
 * Extract tweets from Twitter API response
 */
function extractTweetsFromResponse(data: any): Array<{
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  replies: number;
}> {
  const tweets: Array<{
    id: string;
    text: string;
    createdAt: string;
    likes: number;
    replies: number;
  }> = [];
  
  try {
    const instructions = data?.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
    
    for (const instruction of instructions) {
      if (instruction.type === 'TimelineAddEntries') {
        const entries = instruction.entries || [];
        
        for (const entry of entries) {
          if (entry.entryId?.startsWith('tweet-')) {
            const tweetResult = entry.content?.itemContent?.tweet_results?.result;
            if (!tweetResult) continue;
            
            const legacy = tweetResult.legacy;
            if (!legacy) continue;
            
            tweets.push({
              id: tweetResult.rest_id || legacy.id_str,
              text: legacy.full_text || '',
              createdAt: legacy.created_at || '',
              likes: legacy.favorite_count || 0,
              replies: legacy.reply_count || 0,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error('[Twitter] Error parsing response:', e);
  }
  
  return tweets;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch all data sources (including Twitter)
 */
export async function fetchAllSources(): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  
  // Fetch in parallel with some delay to avoid rate limiting
  const [hn, github, reddit, ph, hf, yc] = await Promise.all([
    fetchHackerNews('top', 30),
    fetchGitHubTrending('', 'daily'),
    fetchReddit(['LocalLLaMA', 'MachineLearning', 'artificial', 'startups', 'SideProject']),
    fetchProductHunt(),
    fetchHuggingFace(),
    fetchYCombinator(),
  ]);
  
  results.push(hn, github, reddit, ph, hf, yc);
  
  // Fetch Twitter separately (slower, rate-limited)
  const twitter = await fetchTwitter();
  results.push(twitter);
  
  return results;
}

// ============================================================================
// Helper Functions
// ============================================================================
function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
