CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"branch_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"party_size" integer NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"arrived" boolean DEFAULT false NOT NULL,
	"arrived_at" timestamp,
	"completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branch_unavailable_dates" (
	"id" serial PRIMARY KEY NOT NULL,
	"branch_id" integer NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "restaurant_auth" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_auth_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurant_branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"tables_count" integer NOT NULL,
	"seats_count" integer NOT NULL,
	"opening_time" text NOT NULL,
	"closing_time" text NOT NULL,
	"reservation_duration" integer DEFAULT 120 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "restaurant_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"about" text NOT NULL,
	"cuisine" text NOT NULL,
	"price_range" text NOT NULL,
	"logo" text DEFAULT '' NOT NULL,
	"is_profile_complete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "restaurant_profiles_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"about" text NOT NULL,
	"logo" text NOT NULL,
	"cuisine" text NOT NULL,
	"locations" jsonb NOT NULL,
	"price_range" text NOT NULL,
	CONSTRAINT "restaurants_auth_id_unique" UNIQUE("auth_id")
);
--> statement-breakpoint
CREATE TABLE "saved_restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"branch_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"gender" text NOT NULL,
	"birthday" timestamp NOT NULL,
	"city" text NOT NULL,
	"favorite_cuisines" text[] NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_password_reset_tokens" ADD CONSTRAINT "restaurant_password_reset_tokens_restaurant_id_restaurant_auth_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant_auth"("id") ON DELETE no action ON UPDATE no action;