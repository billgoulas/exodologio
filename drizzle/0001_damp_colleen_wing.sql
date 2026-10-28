CREATE TABLE `bankConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankId` varchar(50) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountNumber` varchar(255),
	`accountHolder` varchar(255),
	`accountType` varchar(50),
	`currency` varchar(3) DEFAULT 'EUR',
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`connectedAt` timestamp DEFAULT (now()),
	`lastSyncedAt` timestamp,
	`syncStatus` varchar(50) DEFAULT 'active',
	`syncErrorMessage` text,
	`isActive` boolean DEFAULT true,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bankOAuthState` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bankId` varchar(50) NOT NULL,
	`stateToken` varchar(255) NOT NULL,
	`codeVerifier` varchar(255),
	`requestedAt` timestamp DEFAULT (now()),
	`expiresAt` timestamp,
	`isUsed` boolean DEFAULT false,
	`usedAt` timestamp,
	CONSTRAINT `bankOAuthState_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankOAuthState_stateToken_unique` UNIQUE(`stateToken`)
);
--> statement-breakpoint
CREATE TABLE `bankSyncLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankConnectionId` int NOT NULL,
	`userId` int NOT NULL,
	`syncType` varchar(50),
	`startedAt` timestamp,
	`completedAt` timestamp,
	`status` varchar(50),
	`transactionsCount` int DEFAULT 0,
	`newTransactionsCount` int DEFAULT 0,
	`duplicatesSkipped` int DEFAULT 0,
	`errorMessage` text,
	`errorCode` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankSyncLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bankTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bankConnectionId` int NOT NULL,
	`userId` int NOT NULL,
	`bankTransactionId` varchar(255) NOT NULL,
	`bankTransactionRef` varchar(255),
	`amount` text NOT NULL,
	`currency` varchar(3) NOT NULL,
	`transactionDate` timestamp NOT NULL,
	`bookingDate` timestamp,
	`description` text,
	`counterpartyName` varchar(255),
	`counterpartyAccount` varchar(255),
	`transactionType` varchar(50),
	`localTransactionId` int,
	`importStatus` varchar(50) DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bankTransactions_id` PRIMARY KEY(`id`)
);
