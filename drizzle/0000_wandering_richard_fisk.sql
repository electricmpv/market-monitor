CREATE TABLE IF NOT EXISTS `data_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('github','hackernews','reddit','producthunt','huggingface','ycombinator','twitter') NOT NULL,
	`enabled` boolean DEFAULT true,
	`lastSyncAt` timestamp,
	`lastError` text,
	`itemCount` int DEFAULT 0,
	`config` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `data_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_sources_source_unique` UNIQUE(`source`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(256) NOT NULL,
	`radar` enum('pain_hunter','tech_scout','funding_watch') NOT NULL,
	`category` varchar(64),
	`weight` float DEFAULT 1,
	`matchCount` int DEFAULT 0,
	`buildCount` int DEFAULT 0,
	`passCount` int DEFAULT 0,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `kols` (
	`id` int AUTO_INCREMENT NOT NULL,
	`handle` varchar(128) NOT NULL,
	`platform` enum('twitter','github','reddit','hackernews') NOT NULL,
	`name` text,
	`weight` float DEFAULT 1,
	`matchCount` int DEFAULT 0,
	`buildCount` int DEFAULT 0,
	`passCount` int DEFAULT 0,
	`enabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kols_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `learning_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`velocityWeight` float DEFAULT 0.25,
	`consensusWeight` float DEFAULT 0.2,
	`credibilityWeight` float DEFAULT 0.15,
	`fitWeight` float DEFAULT 0.25,
	`noveltyWeight` float DEFAULT 0.15,
	`learningSpeed` enum('slow','normal','fast') DEFAULT 'normal',
	`autoLearn` boolean DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learning_weights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `push_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topicId` int,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending','sent','failed') DEFAULT 'pending',
	`errorMessage` text,
	`pushedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `push_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `raw_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` enum('github','hackernews','reddit','producthunt','huggingface','ycombinator','twitter') NOT NULL,
	`externalId` varchar(256) NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`author` varchar(128),
	`stars` int DEFAULT 0,
	`score` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`upvotes` int DEFAULT 0,
	`retweets` int DEFAULT 0,
	`publishedAt` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`layer0Passed` boolean DEFAULT false,
	`layer1Passed` boolean DEFAULT false,
	`layer1Result` json,
	`semanticHash` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `raw_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rawItemId` int NOT NULL,
	`stars` int DEFAULT 0,
	`score` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`upvotes` int DEFAULT 0,
	`snapshotAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `system_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(128) NOT NULL,
	`configValue` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `topics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`semanticHash` varchar(64) NOT NULL,
	`canonicalItemId` int,
	`memberItemIds` text,
	`title` text NOT NULL,
	`summary` text,
	`category` enum('pain','tech','funding','other') DEFAULT 'other',
	`tags` text,
	`radar` enum('pain_hunter','tech_scout','funding_watch') NOT NULL,
	`velocityScore` float DEFAULT 0,
	`consensusScore` float DEFAULT 0,
	`credibilityScore` float DEFAULT 0,
	`fitScore` float DEFAULT 0,
	`noveltyScore` float DEFAULT 0,
	`trendScore` float DEFAULT 0,
	`crossPlatformCount` int DEFAULT 1,
	`crossPlatformSources` text,
	`status` enum('new','updated','stale','archived') DEFAULT 'new',
	`pmAnalysis` text,
	`techAnalysis` text,
	`vcAnalysis` text,
	`complexity` int DEFAULT 3,
	`capital` int DEFAULT 3,
	`ttm` int DEFAULT 3,
	`moat` int DEFAULT 3,
	`lastPushedAt` timestamp,
	`pushCount` int DEFAULT 0,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastUpdatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topicId` int NOT NULL,
	`action` enum('interesting','build','pass','archive') NOT NULL,
	`trendScoreAtAction` float,
	`velocityScoreAtAction` float,
	`consensusScoreAtAction` float,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `weekly_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recType` enum('keyword','kol','track') NOT NULL,
	`content` varchar(256) NOT NULL,
	`reason` text,
	`decision` enum('pending','accept','reject','pin') DEFAULT 'pending',
	`weekStart` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`decidedAt` timestamp,
	CONSTRAINT `weekly_recommendations_id` PRIMARY KEY(`id`)
);
