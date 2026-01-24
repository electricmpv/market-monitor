import { eq, and, desc, sql, gte, lte, or, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  rawItems, InsertRawItem, RawItem,
  topics, InsertTopic, Topic,
  keywords, InsertKeyword, Keyword,
  kols, InsertKol, Kol,
  userActions, InsertUserAction, UserAction,
  learningWeights, InsertLearningWeight, LearningWeight,
  snapshots, InsertSnapshot, Snapshot,
  dataSources, InsertDataSource, DataSource,
  systemConfig, InsertSystemConfig, SystemConfig,
  weeklyRecommendations, InsertWeeklyRecommendation, WeeklyRecommendation,
  pushHistory, InsertPushHistory, PushHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// User Functions (from template)
// ============================================================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// Raw Items Functions
// ============================================================================
export async function insertRawItem(item: InsertRawItem): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(rawItems).values(item);
  return Number(result[0].insertId);
}

export async function getRawItemByExternalId(source: string, externalId: string): Promise<RawItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(rawItems)
    .where(and(
      eq(rawItems.source, source as any),
      eq(rawItems.externalId, externalId)
    ))
    .limit(1);
  
  return result[0];
}

export async function getUnprocessedRawItems(limit: number = 100): Promise<RawItem[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(rawItems)
    .where(eq(rawItems.layer0Passed, false))
    .orderBy(desc(rawItems.fetchedAt))
    .limit(limit);
}

export async function updateRawItemLayer0(id: number, passed: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(rawItems)
    .set({ layer0Passed: passed })
    .where(eq(rawItems.id, id));
}

export async function updateRawItemLayer1(id: number, passed: boolean, result: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(rawItems)
    .set({ layer1Passed: passed, layer1Result: result })
    .where(eq(rawItems.id, id));
}

// ============================================================================
// Topics Functions
// ============================================================================
export async function insertTopic(topic: InsertTopic): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(topics).values(topic);
  return Number(result[0].insertId);
}

export async function getTopicsByRadar(radar: string, status?: string, limit: number = 50): Promise<Topic[]> {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(topics.radar, radar as any)];
  if (status) {
    conditions.push(eq(topics.status, status as any));
  }
  
  return db.select().from(topics)
    .where(and(...conditions))
    .orderBy(desc(topics.trendScore))
    .limit(limit);
}

export async function getTopicById(id: number): Promise<Topic | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(topics).where(eq(topics.id, id)).limit(1);
  return result[0];
}

export async function updateTopicScores(id: number, scores: {
  velocityScore?: number;
  consensusScore?: number;
  credibilityScore?: number;
  fitScore?: number;
  noveltyScore?: number;
  trendScore?: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(topics).set(scores).where(eq(topics.id, id));
}

export async function updateTopicAnalysis(id: number, analysis: {
  pmAnalysis?: string;
  techAnalysis?: string;
  vcAnalysis?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(topics).set(analysis).where(eq(topics.id, id));
}

export async function updateTopicStatus(id: number, status: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(topics).set({ status: status as any }).where(eq(topics.id, id));
}

export async function getTopicsForPush(limit: number = 10): Promise<Topic[]> {
  const db = await getDb();
  if (!db) return [];
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return db.select().from(topics)
    .where(and(
      eq(topics.status, 'new'),
      gte(topics.trendScore, 3.0),
      or(
        sql`${topics.lastPushedAt} IS NULL`,
        lte(topics.lastPushedAt, oneDayAgo)
      )
    ))
    .orderBy(desc(topics.trendScore))
    .limit(limit);
}

// ============================================================================
// Keywords Functions
// ============================================================================
export async function getAllKeywords(): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(keywords).where(eq(keywords.enabled, true));
}

export async function getKeywordsByRadar(radar: string): Promise<Keyword[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(keywords)
    .where(and(eq(keywords.radar, radar as any), eq(keywords.enabled, true)));
}

export async function insertKeyword(keyword: InsertKeyword): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(keywords).values(keyword);
  return Number(result[0].insertId);
}

export async function updateKeywordWeight(id: number, weight: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(keywords).set({ weight }).where(eq(keywords.id, id));
}

export async function incrementKeywordStats(id: number, field: 'matchCount' | 'buildCount' | 'passCount'): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(keywords)
    .set({ [field]: sql`${keywords[field]} + 1` })
    .where(eq(keywords.id, id));
}

export async function deleteKeyword(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(keywords).set({ enabled: false }).where(eq(keywords.id, id));
}

// ============================================================================
// KOLs Functions
// ============================================================================
export async function getAllKols(): Promise<Kol[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(kols).where(eq(kols.enabled, true));
}

export async function getKolsByPlatform(platform: string): Promise<Kol[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(kols)
    .where(and(eq(kols.platform, platform as any), eq(kols.enabled, true)));
}

export async function insertKol(kol: InsertKol): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(kols).values(kol);
  return Number(result[0].insertId);
}

export async function updateKolWeight(id: number, weight: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(kols).set({ weight }).where(eq(kols.id, id));
}

export async function deleteKol(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(kols).set({ enabled: false }).where(eq(kols.id, id));
}

// ============================================================================
// User Actions Functions
// ============================================================================
export async function insertUserAction(action: InsertUserAction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(userActions).values(action);
  return Number(result[0].insertId);
}

export async function getUserActions(userId: number, limit: number = 100): Promise<UserAction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(userActions)
    .where(eq(userActions.userId, userId))
    .orderBy(desc(userActions.createdAt))
    .limit(limit);
}

export async function getUserActionForTopic(userId: number, topicId: number): Promise<UserAction | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(userActions)
    .where(and(eq(userActions.userId, userId), eq(userActions.topicId, topicId)))
    .limit(1);
  
  return result[0];
}

// ============================================================================
// Learning Weights Functions
// ============================================================================
export async function getLearningWeights(userId: number): Promise<LearningWeight | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(learningWeights)
    .where(eq(learningWeights.userId, userId))
    .limit(1);
  
  return result[0];
}

export async function upsertLearningWeights(userId: number, weights: Partial<InsertLearningWeight>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getLearningWeights(userId);
  
  if (existing) {
    await db.update(learningWeights)
      .set(weights)
      .where(eq(learningWeights.userId, userId));
  } else {
    await db.insert(learningWeights).values({ userId, ...weights });
  }
}

// ============================================================================
// Snapshots Functions
// ============================================================================
export async function insertSnapshot(snapshot: InsertSnapshot): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(snapshots).values(snapshot);
  return Number(result[0].insertId);
}

export async function getSnapshotsForItem(rawItemId: number, hours: number = 72): Promise<Snapshot[]> {
  const db = await getDb();
  if (!db) return [];
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return db.select().from(snapshots)
    .where(and(
      eq(snapshots.rawItemId, rawItemId),
      gte(snapshots.snapshotAt, since)
    ))
    .orderBy(desc(snapshots.snapshotAt));
}

// ============================================================================
// Data Sources Functions
// ============================================================================
export async function getAllDataSources(): Promise<DataSource[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(dataSources);
}

export async function upsertDataSource(source: InsertDataSource): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(dataSources).values(source).onDuplicateKeyUpdate({
    set: {
      enabled: source.enabled,
      lastSyncAt: source.lastSyncAt,
      lastError: source.lastError,
      itemCount: source.itemCount,
      config: source.config,
    }
  });
}

export async function updateDataSourceSync(source: string, itemCount: number, error?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(dataSources)
    .set({
      lastSyncAt: new Date(),
      lastError: error || null,
      itemCount: sql`${dataSources.itemCount} + ${itemCount}`
    })
    .where(eq(dataSources.source, source as any));
}

// ============================================================================
// System Config Functions
// ============================================================================
export async function getConfig(key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(systemConfig)
    .where(eq(systemConfig.configKey, key))
    .limit(1);
  
  return result[0]?.configValue || null;
}

export async function setConfig(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(systemConfig)
    .values({ configKey: key, configValue: value })
    .onDuplicateKeyUpdate({ set: { configValue: value } });
}

// ============================================================================
// Weekly Recommendations Functions
// ============================================================================
export async function getWeeklyRecommendations(userId: number): Promise<WeeklyRecommendation[]> {
  const db = await getDb();
  if (!db) return [];
  
  const weekStart = getWeekStart();
  
  return db.select().from(weeklyRecommendations)
    .where(and(
      eq(weeklyRecommendations.userId, userId),
      eq(weeklyRecommendations.weekStart, weekStart)
    ))
    .orderBy(desc(weeklyRecommendations.createdAt));
}

export async function insertWeeklyRecommendation(rec: InsertWeeklyRecommendation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(weeklyRecommendations).values(rec);
  return Number(result[0].insertId);
}

export async function updateRecommendationDecision(id: number, decision: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(weeklyRecommendations)
    .set({ decision: decision as any, decidedAt: new Date() })
    .where(eq(weeklyRecommendations.id, id));
}

// ============================================================================
// Push History Functions
// ============================================================================
export async function insertPushHistory(push: InsertPushHistory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pushHistory).values(push);
  return Number(result[0].insertId);
}

export async function updatePushStatus(id: number, status: string, errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(pushHistory)
    .set({ status: status as any, errorMessage })
    .where(eq(pushHistory.id, id));
}

export async function getPushHistory(limit: number = 50): Promise<PushHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(pushHistory)
    .orderBy(desc(pushHistory.pushedAt))
    .limit(limit);
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

// ============================================================================
// Dashboard Stats
// ============================================================================
export async function getDashboardStats(): Promise<{
  totalTopics: number;
  newTopics: number;
  totalKeywords: number;
  totalKols: number;
  lastSyncTime: Date | null;
}> {
  const db = await getDb();
  if (!db) return {
    totalTopics: 0,
    newTopics: 0,
    totalKeywords: 0,
    totalKols: 0,
    lastSyncTime: null
  };
  
  const [topicStats] = await db.select({
    total: sql<number>`COUNT(*)`,
    new: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`
  }).from(topics);
  
  const [keywordCount] = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(keywords).where(eq(keywords.enabled, true));
  
  const [kolCount] = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(kols).where(eq(kols.enabled, true));
  
  const [lastSync] = await db.select({
    lastSyncAt: sql<Date>`MAX(lastSyncAt)`
  }).from(dataSources);
  
  return {
    totalTopics: Number(topicStats?.total) || 0,
    newTopics: Number(topicStats?.new) || 0,
    totalKeywords: Number(keywordCount?.count) || 0,
    totalKols: Number(kolCount?.count) || 0,
    lastSyncTime: lastSync?.lastSyncAt || null
  };
}
