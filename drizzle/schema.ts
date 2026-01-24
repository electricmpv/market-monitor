import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float, boolean } from "drizzle-orm/mysql-core";

// ============================================================================
// User Table (from template)
// ============================================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// Raw Items - Original data from all sources
// ============================================================================
export const rawItems = mysqlTable("raw_items", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["github", "hackernews", "reddit", "producthunt", "huggingface", "ycombinator", "twitter"]).notNull(),
  externalId: varchar("externalId", { length: 256 }).notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  author: varchar("author", { length: 128 }),
  
  // Raw metrics from source
  stars: int("stars").default(0),
  score: int("score").default(0),
  comments: int("comments").default(0),
  upvotes: int("upvotes").default(0),
  retweets: int("retweets").default(0),
  
  // Timestamps
  publishedAt: timestamp("publishedAt"),
  fetchedAt: timestamp("fetchedAt").defaultNow().notNull(),
  
  // Processing status
  layer0Passed: boolean("layer0Passed").default(false),
  layer1Passed: boolean("layer1Passed").default(false),
  layer1Result: json("layer1Result"),
  
  // Semantic hash for deduplication
  semanticHash: varchar("semanticHash", { length: 64 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RawItem = typeof rawItems.$inferSelect;
export type InsertRawItem = typeof rawItems.$inferInsert;

// ============================================================================
// Snapshots - Track metrics over time for velocity calculation
// ============================================================================
export const snapshots = mysqlTable("snapshots", {
  id: int("id").autoincrement().primaryKey(),
  rawItemId: int("rawItemId").notNull(),
  
  // Metrics at snapshot time
  stars: int("stars").default(0),
  score: int("score").default(0),
  comments: int("comments").default(0),
  upvotes: int("upvotes").default(0),
  
  snapshotAt: timestamp("snapshotAt").defaultNow().notNull(),
});

export type Snapshot = typeof snapshots.$inferSelect;
export type InsertSnapshot = typeof snapshots.$inferInsert;

// ============================================================================
// Topics - Clustered items with cross-platform consensus
// ============================================================================
export const topics = mysqlTable("topics", {
  id: int("id").autoincrement().primaryKey(),
  
  // Topic identity
  semanticHash: varchar("semanticHash", { length: 64 }).notNull(),
  canonicalItemId: int("canonicalItemId"),
  memberItemIds: text("memberItemIds"), // JSON string of number[]
  
  // Topic metadata
  title: text("title").notNull(),
  summary: text("summary"),
  category: mysqlEnum("category", ["pain", "tech", "funding", "other"]).default("other"),
  tags: text("tags"), // JSON string of string[]
  
  // Radar assignment
  radar: mysqlEnum("radar", ["pain_hunter", "tech_scout", "funding_watch"]).notNull(),
  
  // Five-dimension scores (0-5 scale)
  velocityScore: float("velocityScore").default(0),
  consensusScore: float("consensusScore").default(0),
  credibilityScore: float("credibilityScore").default(0),
  fitScore: float("fitScore").default(0),
  noveltyScore: float("noveltyScore").default(0),
  
  // Aggregated trend score
  trendScore: float("trendScore").default(0),
  
  // Cross-platform tracking
  crossPlatformCount: int("crossPlatformCount").default(1),
  crossPlatformSources: text("crossPlatformSources"), // JSON string of string[]
  
  // Status
  status: mysqlEnum("status", ["new", "updated", "stale", "archived"]).default("new"),
  
  // AI Analysis (three personas)
  pmAnalysis: text("pmAnalysis"),
  techAnalysis: text("techAnalysis"),
  vcAnalysis: text("vcAnalysis"),
  
  // Solopreneur fit details
  complexity: int("complexity").default(3),
  capital: int("capital").default(3),
  ttm: int("ttm").default(3),
  moat: int("moat").default(3),
  
  // Push tracking
  lastPushedAt: timestamp("lastPushedAt"),
  pushCount: int("pushCount").default(0),
  
  // Timestamps
  firstSeenAt: timestamp("firstSeenAt").defaultNow().notNull(),
  lastUpdatedAt: timestamp("lastUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

// ============================================================================
// Keywords - Configurable monitoring keywords
// ============================================================================
export const keywords = mysqlTable("keywords", {
  id: int("id").autoincrement().primaryKey(),
  
  // Keyword info
  keyword: varchar("keyword", { length: 256 }).notNull(),
  radar: mysqlEnum("radar", ["pain_hunter", "tech_scout", "funding_watch"]).notNull(),
  category: varchar("category", { length: 64 }),
  
  // Weight (adjustable, learnable)
  weight: float("weight").default(1.0),
  
  // Stats
  matchCount: int("matchCount").default(0),
  buildCount: int("buildCount").default(0),
  passCount: int("passCount").default(0),
  
  // Status
  enabled: boolean("enabled").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Keyword = typeof keywords.$inferSelect;
export type InsertKeyword = typeof keywords.$inferInsert;

// ============================================================================
// KOLs - Key Opinion Leaders to monitor
// ============================================================================
export const kols = mysqlTable("kols", {
  id: int("id").autoincrement().primaryKey(),
  
  // KOL info
  handle: varchar("handle", { length: 128 }).notNull(),
  platform: mysqlEnum("platform", ["twitter", "github", "reddit", "hackernews"]).notNull(),
  name: text("name"),
  
  // Weight (adjustable, learnable)
  weight: float("weight").default(1.0),
  
  // Stats
  matchCount: int("matchCount").default(0),
  buildCount: int("buildCount").default(0),
  passCount: int("passCount").default(0),
  
  // Status
  enabled: boolean("enabled").default(true),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Kol = typeof kols.$inferSelect;
export type InsertKol = typeof kols.$inferInsert;

// ============================================================================
// User Actions - Track user decisions for learning
// ============================================================================
export const userActions = mysqlTable("user_actions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  topicId: int("topicId").notNull(),
  
  // Action type
  action: mysqlEnum("action", ["interesting", "build", "pass", "archive"]).notNull(),
  
  // Context at action time
  trendScoreAtAction: float("trendScoreAtAction"),
  velocityScoreAtAction: float("velocityScoreAtAction"),
  consensusScoreAtAction: float("consensusScoreAtAction"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserAction = typeof userActions.$inferSelect;
export type InsertUserAction = typeof userActions.$inferInsert;

// ============================================================================
// Learning Weights - User preference weights
// ============================================================================
export const learningWeights = mysqlTable("learning_weights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Five dimension weights (sum to 1.0)
  velocityWeight: float("velocityWeight").default(0.25),
  consensusWeight: float("consensusWeight").default(0.20),
  credibilityWeight: float("credibilityWeight").default(0.15),
  fitWeight: float("fitWeight").default(0.25),
  noveltyWeight: float("noveltyWeight").default(0.15),
  
  // Learning settings
  learningSpeed: mysqlEnum("learningSpeed", ["slow", "normal", "fast"]).default("normal"),
  autoLearn: boolean("autoLearn").default(true),
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LearningWeight = typeof learningWeights.$inferSelect;
export type InsertLearningWeight = typeof learningWeights.$inferInsert;

// ============================================================================
// System Config - Global configuration
// ============================================================================
export const systemConfig = mysqlTable("system_config", {
  id: int("id").autoincrement().primaryKey(),
  configKey: varchar("configKey", { length: 128 }).notNull().unique(),
  configValue: text("configValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// ============================================================================
// Data Sources - Track source status
// ============================================================================
export const dataSources = mysqlTable("data_sources", {
  id: int("id").autoincrement().primaryKey(),
  
  source: mysqlEnum("source", ["github", "hackernews", "reddit", "producthunt", "huggingface", "ycombinator", "twitter"]).notNull().unique(),
  
  enabled: boolean("enabled").default(true),
  lastSyncAt: timestamp("lastSyncAt"),
  lastError: text("lastError"),
  itemCount: int("itemCount").default(0),
  
  // Source-specific config
  config: text("config"), // JSON string
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

// ============================================================================
// Weekly Recommendations - System-generated recommendations
// ============================================================================
export const weeklyRecommendations = mysqlTable("weekly_recommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Recommendation type
  recType: mysqlEnum("recType", ["keyword", "kol", "track"]).notNull(),
  
  // Recommendation content
  content: varchar("content", { length: 256 }).notNull(),
  reason: text("reason"),
  
  // User decision
  decision: mysqlEnum("decision", ["pending", "accept", "reject", "pin"]).default("pending"),
  
  // Week info
  weekStart: timestamp("weekStart").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  decidedAt: timestamp("decidedAt"),
});

export type WeeklyRecommendation = typeof weeklyRecommendations.$inferSelect;
export type InsertWeeklyRecommendation = typeof weeklyRecommendations.$inferInsert;

// ============================================================================
// Push History - Track push notifications
// ============================================================================
export const pushHistory = mysqlTable("push_history", {
  id: int("id").autoincrement().primaryKey(),
  
  topicId: int("topicId"),
  
  // Push content
  title: text("title").notNull(),
  content: text("content").notNull(),
  
  // Push status
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  
  pushedAt: timestamp("pushedAt").defaultNow().notNull(),
});

export type PushHistory = typeof pushHistory.$inferSelect;
export type InsertPushHistory = typeof pushHistory.$inferInsert;
