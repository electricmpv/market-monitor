import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Import services
import { fetchAllSources, fetchHackerNews, fetchGitHubTrending, fetchReddit, fetchProductHunt, fetchHuggingFace, fetchYCombinator, fetchTwitter } from "./services/dataCollector";
import { processFilterPipeline } from "./services/filterEngine";
import { generateFullAnalysis, evaluateSolopreneurFit } from "./services/aiAnalyzer";
import { processUserAction, generateWeeklyRecommendations, processRecommendationDecision, getLearningAnalytics } from "./services/learningLoop";
import { sendDailyDigest, sendSingleTopicPush, getPushConfig, updatePushConfig } from "./services/pushService";
import { seedAllData, getSeedDataSummary } from "./services/seedData";

// Import db functions
import {
  getDashboardStats,
  getTopicsByRadar,
  getTopicById,
  updateTopicStatus,
  getAllKeywords,
  getKeywordsByRadar,
  insertKeyword,
  updateKeywordWeight,
  deleteKeyword,
  getAllKols,
  insertKol,
  updateKolWeight,
  deleteKol,
  getAllDataSources,
  upsertDataSource,
  getLearningWeights,
  upsertLearningWeights,
  getWeeklyRecommendations,
  getPushHistory,
  getConfig,
  setConfig,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================================================
  // Dashboard
  // ============================================================================
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return getDashboardStats();
    }),
  }),

  // ============================================================================
  // Topics
  // ============================================================================
  topics: router({
    list: protectedProcedure
      .input(z.object({
        radar: z.enum(['pain_hunter', 'tech_scout', 'funding_watch']).optional(),
        status: z.enum(['new', 'interesting', 'build', 'pass', 'archived']).optional(),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        if (input.radar) {
          return getTopicsByRadar(input.radar, input.status, input.limit);
        }
        // Get all radars
        const [pain, tech, funding] = await Promise.all([
          getTopicsByRadar('pain_hunter', input.status, input.limit),
          getTopicsByRadar('tech_scout', input.status, input.limit),
          getTopicsByRadar('funding_watch', input.status, input.limit),
        ]);
        return { pain_hunter: pain, tech_scout: tech, funding_watch: funding };
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getTopicById(input.id);
      }),
    
    analyze: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return generateFullAnalysis(input.id);
      }),
    
    evaluateFit: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return evaluateSolopreneurFit(input.id);
      }),
    
    action: protectedProcedure
      .input(z.object({
        topicId: z.number(),
        action: z.enum(['interesting', 'build', 'pass', 'archive']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Update topic status
        await updateTopicStatus(input.topicId, input.action);
        
        // Process learning
        const adjustments = await processUserAction({
          topicId: input.topicId,
          action: input.action,
          userId: ctx.user.id,
        });
        
        return { success: true, adjustments };
      }),
  }),

  // ============================================================================
  // Keywords
  // ============================================================================
  keywords: router({
    list: protectedProcedure
      .input(z.object({
        radar: z.enum(['pain_hunter', 'tech_scout', 'funding_watch']).optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.radar) {
          return getKeywordsByRadar(input.radar);
        }
        return getAllKeywords();
      }),
    
    add: protectedProcedure
      .input(z.object({
        keyword: z.string().min(2).max(256),
        radar: z.enum(['pain_hunter', 'tech_scout', 'funding_watch']),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await insertKeyword({
          keyword: input.keyword,
          radar: input.radar,
          category: input.category,
        });
        return { id };
      }),
    
    updateWeight: protectedProcedure
      .input(z.object({
        id: z.number(),
        weight: z.number().min(0.1).max(2.0),
      }))
      .mutation(async ({ input }) => {
        await updateKeywordWeight(input.id, input.weight);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKeyword(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // KOLs
  // ============================================================================
  kols: router({
    list: protectedProcedure.query(async () => {
      return getAllKols();
    }),
    
    add: protectedProcedure
      .input(z.object({
        handle: z.string().min(1).max(128),
        platform: z.enum(['twitter', 'github', 'reddit', 'hackernews']),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await insertKol({
          handle: input.handle,
          platform: input.platform,
          name: input.name,
        });
        return { id };
      }),
    
    updateWeight: protectedProcedure
      .input(z.object({
        id: z.number(),
        weight: z.number().min(0.1).max(2.0),
      }))
      .mutation(async ({ input }) => {
        await updateKolWeight(input.id, input.weight);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteKol(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Data Sources
  // ============================================================================
  sources: router({
    list: protectedProcedure.query(async () => {
      return getAllDataSources();
    }),
    
    toggle: protectedProcedure
      .input(z.object({
        source: z.enum(['github', 'hackernews', 'reddit', 'producthunt', 'huggingface', 'ycombinator', 'twitter']),
        enabled: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await upsertDataSource({
          source: input.source,
          enabled: input.enabled,
        });
        return { success: true };
      }),
    
    sync: protectedProcedure
      .input(z.object({
        source: z.enum(['github', 'hackernews', 'reddit', 'producthunt', 'huggingface', 'ycombinator', 'twitter', 'all']).optional(),
      }).optional())
      .mutation(async ({ input }) => {
        if (!input?.source || input.source === 'all') {
          const results = await fetchAllSources();
          return { results };
        }
        
        let result;
        switch (input.source) {
          case 'hackernews':
            result = await fetchHackerNews();
            break;
          case 'github':
            result = await fetchGitHubTrending();
            break;
          case 'reddit':
            result = await fetchReddit();
            break;
          case 'producthunt':
            result = await fetchProductHunt();
            break;
          case 'huggingface':
            result = await fetchHuggingFace();
            break;
          case 'ycombinator':
            result = await fetchYCombinator();
            break;
          case 'twitter':
            result = await fetchTwitter();
            break;
          default:
            throw new Error('Unknown source');
        }
        
        return { results: [result] };
      }),
    
    process: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional())
      .mutation(async ({ input }) => {
        const result = await processFilterPipeline(input?.limit || 50);
        return result;
      }),
  }),

  // ============================================================================
  // Learning
  // ============================================================================
  learning: router({
    weights: protectedProcedure.query(async ({ ctx }) => {
      return getLearningWeights(ctx.user.id);
    }),
    
    updateWeights: protectedProcedure
      .input(z.object({
        velocityWeight: z.number().min(0.05).max(0.5).optional(),
        consensusWeight: z.number().min(0.05).max(0.5).optional(),
        credibilityWeight: z.number().min(0.05).max(0.5).optional(),
        fitWeight: z.number().min(0.05).max(0.5).optional(),
        noveltyWeight: z.number().min(0.05).max(0.5).optional(),
        learningSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
        autoLearn: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await upsertLearningWeights(ctx.user.id, input);
        return { success: true };
      }),
    
    analytics: protectedProcedure.query(async ({ ctx }) => {
      return getLearningAnalytics(ctx.user.id);
    }),
    
    recommendations: protectedProcedure.query(async ({ ctx }) => {
      return getWeeklyRecommendations(ctx.user.id);
    }),
    
    generateRecommendations: protectedProcedure.mutation(async ({ ctx }) => {
      return generateWeeklyRecommendations(ctx.user.id);
    }),
    
    decideRecommendation: protectedProcedure
      .input(z.object({
        id: z.number(),
        decision: z.enum(['accept', 'reject', 'pin']),
      }))
      .mutation(async ({ input }) => {
        await processRecommendationDecision(input.id, input.decision);
        return { success: true };
      }),
  }),

  // ============================================================================
  // Push Notifications
  // ============================================================================
  push: router({
    config: protectedProcedure.query(async () => {
      return getPushConfig();
    }),
    
    updateConfig: protectedProcedure
      .input(z.object({
        token: z.string().optional(),
        pushTime: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updatePushConfig(input);
        return { success: true };
      }),
    
    sendDigest: protectedProcedure.mutation(async () => {
      return sendDailyDigest();
    }),
    
    sendTopic: protectedProcedure
      .input(z.object({ topicId: z.number() }))
      .mutation(async ({ input }) => {
        return sendSingleTopicPush(input.topicId);
      }),
    
    history: protectedProcedure.query(async () => {
      return getPushHistory();
    }),
  }),

  // ============================================================================
  // Settings
  // ============================================================================
  settings: router({
    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return getConfig(input.key);
      }),
    
    set: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        await setConfig(input.key, input.value);
        return { success: true };
      }),
    
    seed: protectedProcedure.mutation(async () => {
      return seedAllData();
    }),
    
    seedSummary: protectedProcedure.query(() => {
      return getSeedDataSummary();
    }),
    
    // LLM Configuration
    saveLLMConfig: protectedProcedure
      .input(z.object({
        usageType: z.enum(['search', 'report']),
        config: z.object({
          provider: z.string(),
          baseUrl: z.string(),
          apiKey: z.string(),
          model: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const configKey = input.usageType === 'search' ? 'llm_search_config' : 'llm_report_config';
        await setConfig(configKey, JSON.stringify(input.config));
        return { success: true };
      }),
    
    testLLMConfig: protectedProcedure
      .input(z.object({
        usageType: z.enum(['search', 'report']),
        config: z.object({
          provider: z.string(),
          baseUrl: z.string(),
          apiKey: z.string(),
          model: z.string(),
        }),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Save config temporarily for testing
        const configKey = input.usageType === 'search' ? 'llm_search_config' : 'llm_report_config';
        await setConfig(configKey, JSON.stringify(input.config));
        
        try {
          // Test the connection
          await invokeLLM({
            messages: [{ role: 'user', content: 'Hello' }],
            usageType: input.usageType,
          });
          return { success: true };
        } catch (error) {
          throw new Error(`LLM connection test failed: ${error}`);
        }
      }),
    
    // Twitter Cookies
    saveTwitterCookies: protectedProcedure
      .input(z.object({ cookies: z.string() }))
      .mutation(async ({ input }) => {
        // Validate JSON format
        try {
          JSON.parse(input.cookies);
        } catch (e) {
          throw new Error('Invalid JSON format');
        }
        
        await setConfig('twitter_cookies', input.cookies);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
