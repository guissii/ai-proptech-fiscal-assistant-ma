CREATE TABLE `conversations` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`city` enum('fes','rabat','casa') NOT NULL DEFAULT 'rabat',
	`language` enum('fr','ar','en') NOT NULL DEFAULT 'fr',
	`title` text,
	`flowType` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `simulations` (
	`id` varchar(64) NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('achat','location','airbnb','detention','tpi') NOT NULL,
	`city` enum('fes','rabat','casa') NOT NULL,
	`quartier` varchar(255),
	`inputData` json NOT NULL,
	`results` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulations_id` PRIMARY KEY(`id`)
);
