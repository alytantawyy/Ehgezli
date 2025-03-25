ALTER TABLE "restaurants" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "restaurants" CASCADE;--> statement-breakpoint
ALTER TABLE "restaurant_profiles" ADD COLUMN "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant_profiles" ADD CONSTRAINT "restaurant_profiles_restaurant_id_restaurant_auth_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant_auth"("id") ON DELETE no action ON UPDATE no action;