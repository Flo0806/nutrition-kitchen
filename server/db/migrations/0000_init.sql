CREATE TABLE `recipe_ingredients` (
	`recipe_id` integer NOT NULL,
	`position` integer NOT NULL,
	`food_code` text,
	`custom` text,
	`amount` real,
	PRIMARY KEY(`recipe_id`, `position`),
	FOREIGN KEY (`recipe_id`) REFERENCES `recipes`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recipe_ingredients_source" CHECK(("recipe_ingredients"."food_code" is null) <> ("recipe_ingredients"."custom" is null)),
	CONSTRAINT "recipe_ingredients_amount" CHECK("recipe_ingredients"."amount" is null or "recipe_ingredients"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE `recipes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`title` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`piece_weight` real,
	`baking_loss` real,
	`options` text NOT NULL,
	`image` text,
	`share_slug` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "recipes_title_length" CHECK(length(trim("recipes"."title")) between 1 and 120),
	CONSTRAINT "recipes_piece_weight" CHECK("recipes"."piece_weight" is null or "recipes"."piece_weight" >= 0),
	CONSTRAINT "recipes_baking_loss" CHECK("recipes"."baking_loss" is null or "recipes"."baking_loss" >= 0),
	CONSTRAINT "recipes_share_slug" CHECK("recipes"."share_slug" is null or length("recipes"."share_slug") >= 10)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `recipes_share_slug_unique` ON `recipes` (`share_slug`);--> statement-breakpoint
CREATE INDEX `recipes_user` ON `recipes` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`name` text NOT NULL,
	`avatar_url` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "users_provider_known" CHECK("users"."provider" in ('google', 'bluesky'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_provider_account` ON `users` (`provider`,`provider_id`);