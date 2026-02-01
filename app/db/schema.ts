import { pgTable, integer, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// USERS TABLE (Supabase Auth sync)
// ============================================
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  authId: text('auth_id').notNull(), // Supabase auth.users.id (UUID)
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  // Partial unique: email unique only for non-deleted users (allows reuse after soft delete)
  uniqueIndex('users_email_unique').on(table.email).where(sql`${table.deletedAt} IS NULL`),
  uniqueIndex('users_auth_id_unique').on(table.authId),
  index('users_deleted_at_idx').on(table.deletedAt),
]);

// ============================================
// POSTS TABLE (Generation history)
// ============================================
export type GenerationConfig = {
  industry: string;
  topic: string;
  tone: string;
  length: number;
  emoji: boolean;
  imageStyle?: string;
};

export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  imageUrl: text('image_url'),
  config: jsonb('config').$type<GenerationConfig>().notNull(),
  isFavorite: integer('is_favorite').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('posts_user_id_idx').on(table.userId),
  index('posts_user_created_idx').on(table.userId, table.createdAt),
  index('posts_deleted_at_idx').on(table.deletedAt),
  index('posts_favorite_idx').on(table.userId, table.isFavorite),
]);

// ============================================
// USAGE LIMITS TABLE (Daily reset tracking)
// ============================================
export const usageLimits = pgTable('usage_limits', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('usage_limits_user_id_unique').on(table.userId),
  index('usage_limits_reset_at_idx').on(table.resetAt),
]);

// ============================================
// SUBSCRIPTIONS TABLE (Stripe sync)
// ============================================
export const subscriptions = pgTable('subscriptions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(), // 'free' | 'active' | 'canceled' | 'past_due'
  credits: integer('credits').default(0).notNull(),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: integer('cancel_at_period_end').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('subscriptions_user_id_unique').on(table.userId),
  uniqueIndex('subscriptions_stripe_customer_unique').on(table.stripeCustomerId),
  uniqueIndex('subscriptions_stripe_sub_unique').on(table.stripeSubscriptionId),
  index('subscriptions_status_idx').on(table.status),
]);

// ============================================
// WEBHOOK EVENTS TABLE (Stripe idempotency)
// ============================================
export const webhookEvents = pgTable('webhook_events', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  stripeEventId: text('stripe_event_id').notNull(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('webhook_events_stripe_event_id_unique').on(table.stripeEventId),
  index('webhook_events_event_type_idx').on(table.eventType),
]);

// ============================================
// RELATIONS (for query API)
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  usageLimit: one(usageLimits, {
    fields: [users.id],
    references: [usageLimits.userId],
  }),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const usageLimitsRelations = relations(usageLimits, ({ one }) => ({
  user: one(users, {
    fields: [usageLimits.userId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));
