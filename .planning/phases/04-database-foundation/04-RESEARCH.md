# Phase 4: Database Foundation - Research

**Researched:** 2026-01-29
**Domain:** Database infrastructure with Neon Postgres, Drizzle ORM, and Vercel Edge Runtime
**Confidence:** HIGH

## Summary

Phase 4 establishes the database infrastructure for user-specific features in v2.0. The standard stack for serverless Next.js applications on Vercel Edge Runtime is Neon Postgres with Drizzle ORM using the HTTP driver. This combination provides Edge Runtime compatibility, excellent TypeScript ergonomics, and production-ready serverless database access.

The research confirms that:
1. Neon's serverless HTTP driver is the correct choice for Edge Runtime (WebSockets don't persist across requests)
2. Drizzle ORM has excellent support for schema design patterns needed (soft deletes, JSON columns, foreign keys)
3. Migration workflows are well-established with both development (push) and production (generate + migrate) patterns
4. Database schema patterns for authentication sync, post history, usage tracking, and subscriptions are well-documented

**Primary recommendation:** Use Drizzle ORM with Neon HTTP driver, employ identity columns over serial types (PostgreSQL modern standard), implement soft deletes via `deleted_at` timestamp with partial unique indexes, and use `drizzle-kit push` for development with `generate + migrate` for production deployments.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@neondatabase/serverless` | Latest (GA v1.0+) | Neon Postgres driver for serverless/edge | Official Neon driver, supports HTTP (no TCP), Edge Runtime compatible, handles connection pooling for serverless |
| `drizzle-orm` | Latest | TypeScript ORM with Edge Runtime support | Best TypeScript ergonomics, edge-compatible, excellent Neon integration, supports all needed schema patterns |
| `drizzle-kit` | Latest | Schema migrations and management | Official migration tool, supports both push (dev) and generate+migrate (prod) workflows |

**Sources:**
- [Drizzle with Vercel Edge Functions](https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions)
- [Neon serverless driver documentation](https://neon.com/docs/serverless/serverless-driver)
- [Connect from Drizzle to Neon](https://neon.com/docs/guides/drizzle)

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dotenv` | Latest | Environment variable management | Local development (Vercel handles production env vars) |
| `zod` | 4.3.6 (already installed) | Runtime validation for JSONB data | Validating generation config from database |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Drizzle ORM | Prisma | Prisma requires Data Proxy ($29/mo) for Edge Runtime, larger bundle size, less TypeScript-native |
| Neon HTTP driver | Neon WebSocket driver | WebSockets can't outlive single request in Edge Runtime, must create/close per request |
| Neon Postgres | PlanetScale MySQL | PostgreSQL has better JSON support (jsonb), PlanetScale deprecated free tier |
| Generate + Migrate | Push only | Push is great for dev but risky for production (no review, no rollback, no version control) |

**Installation:**
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## Architecture Patterns

### Recommended Project Structure

```
app/
├── db/
│   ├── index.ts              # Database client initialization
│   ├── schema.ts             # All table schemas and relations
│   └── migrations/           # Generated SQL migrations (gitignored in dev, committed in prod)
│       ├── 0000_*.sql
│       └── meta/
├── lib/
│   └── db-utils.ts          # Reusable query helpers
drizzle.config.ts            # Drizzle Kit configuration
```

**Source:** [Drizzle ORM Schema Documentation](https://orm.drizzle.team/docs/sql-schema-declaration)

### Pattern 1: Database Client Initialization (Edge Runtime)

**What:** Initialize Drizzle with Neon HTTP driver for Edge Runtime compatibility
**When to use:** Every serverless/edge environment (Vercel Edge Functions, Cloudflare Workers)

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions
// app/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

// CRITICAL: Use DATABASE_URL (pooled connection) not DATABASE_URL_UNPOOLED
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

**Why DATABASE_URL (pooled):** Vercel sets both `DATABASE_URL` (pooled via PgBouncer) and `DATABASE_URL_UNPOOLED`. Always use pooled for serverless to avoid exhausting connections.

### Pattern 2: Modern Schema Design with Identity Columns

**What:** Use `generatedAlwaysAsIdentity()` instead of deprecated `serial()` types
**When to use:** All new tables requiring auto-incrementing IDs

**Example:**
```typescript
// Source: https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717
// Modern PostgreSQL 15+ pattern
import { pgTable, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // Soft delete
});
```

**Why identity over serial:** PostgreSQL recommends identity columns (SQL standard), better permission handling, explicit generation strategy.

### Pattern 3: Soft Deletes with Partial Unique Indexes

**What:** Implement recoverable deletion using `deleted_at` timestamp with unique constraints only on active records
**When to use:** User data, posts, any data that needs recovery or compliance retention

**Example:**
```typescript
// Source: https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: text('email').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  // Unique constraint only applies to non-deleted records
  uniqueIndex('users_email_unique').on(table.email).where(sql`${table.deletedAt} IS NULL`),
  // Index for filtering deleted records efficiently
  index('users_deleted_at_idx').on(table.deletedAt),
]);
```

**Why partial indexes:** Allows email reuse after soft delete, prevents unique constraint violations, maintains referential integrity.

**Source:** [Soft deletion with PostgreSQL](https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database)

### Pattern 4: Type-Safe JSONB Columns

**What:** Store flexible JSON data with TypeScript type safety using `.$type<>()`
**When to use:** Generation config, user preferences, any semi-structured data

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/column-types/pg
import { pgTable, integer, jsonb } from 'drizzle-orm/pg-core';

type GenerationConfig = {
  industry: string;
  tone: string;
  length: number;
  imageStyle?: string;
};

export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  config: jsonb('config').$type<GenerationConfig>().notNull(),
  // Provides compile-time type safety, no runtime validation
});

// In queries, config is typed as GenerationConfig
const post = await db.select().from(posts).where(eq(posts.id, 1));
// post.config.industry is type-safe
```

**Runtime validation:** Combine with Zod for runtime safety:
```typescript
import { z } from 'zod';

const GenerationConfigSchema = z.object({
  industry: z.string(),
  tone: z.string(),
  length: z.number(),
  imageStyle: z.string().optional(),
});

// Validate before insert
const validated = GenerationConfigSchema.parse(userInput);
await db.insert(posts).values({ config: validated });
```

### Pattern 5: Foreign Keys with Cascade and Indexes

**What:** Define relationships with proper cascade behavior and performance indexes
**When to use:** All table relationships

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/indexes-constraints
export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
}, (table) => [
  // CRITICAL: Always index foreign keys for query performance
  index('posts_user_id_idx').on(table.userId),
  // Composite index for common query patterns
  index('posts_user_created_idx').on(table.userId, table.createdAt),
]);
```

**Why cascade deletes:** When user is deleted, all posts are automatically removed (or soft-deleted if using deleted_at pattern).

**Why index foreign keys:** PostgreSQL doesn't auto-index foreign keys, queries like "get user's posts" will be slow without index.

### Pattern 6: UTC Timestamps for All Time Data

**What:** Store all timestamps in UTC using `timestamp with time zone`
**When to use:** Always, for created_at, updated_at, deleted_at, reset times

**Example:**
```typescript
// Source: https://www.tinybird.co/blog/database-timestamps-timezones
export const usageLimits = pgTable('usage_limits', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(), // UTC
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('usage_limits_user_id_idx').on(table.userId),
  index('usage_limits_reset_at_idx').on(table.resetAt), // For daily reset queries
]);
```

**Why UTC:** Simpler logic, no timezone conversion bugs, standard for distributed systems. Display in local time in frontend.

**Source:** [Why You Should Always Store Timestamps in UTC](https://shadhujan.medium.com/why-you-should-always-store-timestamps-in-utc-timestamp-vs-timestamptz-explained-5a1444814539)

### Pattern 7: Relations for Query API

**What:** Define relations separately from schema for relational queries
**When to use:** When you need to query related data (user with posts, post with user)

**Example:**
```typescript
// Source: https://orm.drizzle.team/docs/relations-schema-declaration
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

// Query with relations
const userWithPosts = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { posts: true },
});
```

**Important:** Relations are application-level only, they don't create database foreign keys. You must define foreign keys in schema AND relations for full functionality.

### Anti-Patterns to Avoid

- **Don't create pools outside request handlers:** In Edge Runtime, connections can't persist. Always use the singleton `db` instance from `drizzle(sql)`.
- **Don't use serial types:** Use `generatedAlwaysAsIdentity()` instead (PostgreSQL 10+ standard).
- **Don't forget to index foreign keys:** Drizzle/PostgreSQL won't auto-create them, leading to slow queries.
- **Don't use timestamp without timezone:** Always use `timestamp('created_at', { withTimezone: true })` to store UTC.
- **Don't store local time:** Always store UTC, convert to local timezone in frontend.
- **Don't forget soft delete filters:** Every query must include `where(isNull(table.deletedAt))` or use a wrapper function.

**Source:** [The real serverless compute to database connection problem](https://vercel.com/blog/the-real-serverless-compute-to-database-connection-problem-solved)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Connection pooling | Custom connection manager | Neon's built-in pooling + PgBouncer | Serverless connection management is complex, Neon handles it |
| Soft delete filtering | Manual WHERE clauses everywhere | Wrapper function or view | Easy to forget, causes data leaks |
| Migration versioning | Custom SQL file tracking | `drizzle-kit generate` + `migrate` | Tracks applied migrations, handles rollbacks, detects conflicts |
| JSON validation | Manual type checking | Zod schemas | Runtime validation, better error messages, schema evolution |
| Daily reset logic | Cron jobs or manual checks | Database-level default + query filter | More reliable, no external scheduler needed |
| Clerk webhook verification | Manual HMAC verification | Svix SDK (built into Clerk) | Handles signature verification, replay protection |

**Key insight:** Serverless databases have unique challenges (connection limits, cold starts, stateless execution). Use battle-tested solutions from Neon and Drizzle rather than reimplementing connection management.

## Common Pitfalls

### Pitfall 1: Using WebSocket Driver in Edge Runtime

**What goes wrong:** Connection pool leaks, "connection limit exceeded" errors, function timeouts

**Why it happens:** Edge Runtime suspends functions between requests. WebSocket connections can't persist, but pool cleanup timers also don't fire. Result: leaked connections until pooler-side timeout.

**How to avoid:**
- Use Neon HTTP driver (`neon()` from `@neondatabase/serverless`)
- Never use WebSocket driver (`Pool` or `Client`) in Edge Functions
- Use WebSocket only in long-running Node.js servers

**Warning signs:**
- "remaining connection slots reserved for non-replication superuser connections"
- Intermittent connection failures after deployment
- Works locally but fails in production

**Sources:**
- [The Problem with Using Databases on the Edge](https://dev.to/reggi/the-problem-with-using-databases-on-the-edge-serverless-50fp)
- [Neon serverless driver docs](https://neon.com/docs/serverless/serverless-driver)

### Pitfall 2: Forgetting Partial Indexes for Soft Deletes

**What goes wrong:** Cannot reuse email after soft delete, unique constraint violations

**Why it happens:** Default unique constraints apply to ALL rows including soft-deleted ones. User deletes account (soft delete), later tries to sign up with same email, gets "email already exists" error.

**How to avoid:**
```typescript
// WRONG: Unique constraint includes deleted records
export const users = pgTable('users', {
  email: text('email').notNull().unique(),
  deletedAt: timestamp('deleted_at'),
});

// CORRECT: Partial unique index excludes deleted records
export const users = pgTable('users', {
  email: text('email').notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email).where(sql`${table.deletedAt} IS NULL`),
]);
```

**Warning signs:**
- "duplicate key value violates unique constraint" on re-signup
- Deleted users can't recreate accounts with same email

**Source:** [Soft deletion with PostgreSQL](https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database)

### Pitfall 3: Not Indexing Foreign Keys

**What goes wrong:** Slow queries, high database CPU, poor user experience

**Why it happens:** PostgreSQL doesn't automatically create indexes on foreign key columns. Queries like "get all posts for user" do full table scans.

**How to avoid:**
```typescript
// WRONG: Foreign key without index
export const posts = pgTable('posts', {
  userId: integer('user_id').references(() => users.id).notNull(),
});

// CORRECT: Foreign key with index
export const posts = pgTable('posts', {
  userId: integer('user_id').references(() => users.id).notNull(),
}, (table) => [
  index('posts_user_id_idx').on(table.userId),
]);
```

**Warning signs:**
- Queries slow down as table grows
- `EXPLAIN ANALYZE` shows "Seq Scan" on foreign key columns
- Database CPU spikes during common queries

**Source:** [Drizzle ORM Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints)

### Pitfall 4: Using Wrong Environment Variable in Production

**What goes wrong:** Connection limit errors, slow queries, pooling not working

**Why it happens:** Neon integration creates both `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED`. Using unpooled in serverless exhausts connections.

**How to avoid:**
- **Always use:** `DATABASE_URL` (pooled via PgBouncer)
- **Never use in serverless:** `DATABASE_URL_UNPOOLED` (direct connection)
- Unpooled is only for migrations or long-running servers

**Warning signs:**
- "sorry, too many clients already" errors
- Works with few users, breaks under load
- Connection errors in production but not preview

**Sources:**
- [Neon-Vercel Integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
- [Connection pooling](https://neon.com/docs/connect/connection-pooling)

### Pitfall 5: Running Migrations in Edge Functions

**What goes wrong:** Concurrent migration execution, corrupted migration state, deployment failures

**Why it happens:** Edge Functions spawn multiple instances. Each instance tries to run migrations, creating race conditions.

**How to avoid:**
- **Development:** Use `drizzle-kit push` locally
- **Production:** Run migrations at build time via Vercel build command
- Never call `migrate(db)` in Edge Function handlers

**Correct approach:**
```json
// package.json
{
  "scripts": {
    "build": "drizzle-kit migrate && next build"
  }
}
```

**Warning signs:**
- "migration already applied" errors
- Inconsistent database state across deployments
- Migrations work locally but fail in production

**Sources:**
- [Drizzle migrations to postgres in production](https://budivoogt.com/blog/drizzle-migrations)
- [Running drizzle migrations before Next.js starts on Vercel](https://community.vercel.com/t/running-drizzle-migrations-for-my-db-before-next-js-starts-on-vercel/18074)

### Pitfall 6: Mixing Schema Design Patterns

**What goes wrong:** Inconsistent code, confusion about which pattern to use, harder maintenance

**Why it happens:** Drizzle supports multiple import patterns (named imports, callback pattern, namespace imports). Mixing them reduces readability.

**How to avoid:** Choose one pattern and stick to it project-wide

**Recommended pattern (callback for brevity):**
```typescript
import { pgTable, integer, text, timestamp, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', (t) => ({
  id: t.integer('id').primaryKey().generatedAlwaysAsIdentity(),
  email: t.text('email').notNull(),
}), (table) => [
  index('users_email_idx').on(table.email),
]);
```

**Warning signs:**
- Some tables use `pgTable('table', {})`, others use `pgTable('table', (t) => ({}))`
- Mix of `integer()` and `t.integer()`

**Source:** [Drizzle ORM Schema](https://orm.drizzle.team/docs/sql-schema-declaration)

## Code Examples

Verified patterns from official sources:

### Database Client Setup (Edge Runtime)

```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions
// app/db/index.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Complete Schema Example (Users + Posts + Usage + Subscriptions)

```typescript
// Source: Combined from official Drizzle docs
// app/db/schema.ts
import { pgTable, integer, text, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Users table (for Clerk webhook sync)
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  clerkId: text('clerk_id').notNull().unique(), // From Clerk webhook
  email: text('email').notNull(),
  name: text('name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email).where(sql`${table.deletedAt} IS NULL`),
  uniqueIndex('users_clerk_id_unique').on(table.clerkId),
  index('users_deleted_at_idx').on(table.deletedAt),
]);

// Posts table (generation history)
export const posts = pgTable('posts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  imageUrl: text('image_url'),
  config: jsonb('config').$type<{
    industry: string;
    tone: string;
    length: number;
    imageStyle?: string;
  }>().notNull(),
  isFavorite: integer('is_favorite').default(0).notNull(), // 0 or 1 (SQLite-style for simplicity)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('posts_user_id_idx').on(table.userId),
  index('posts_user_created_idx').on(table.userId, table.createdAt),
  index('posts_deleted_at_idx').on(table.deletedAt),
  index('posts_favorite_idx').on(table.userId, table.isFavorite),
]);

// Usage limits table (daily reset tracking)
export const usageLimits = pgTable('usage_limits', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  usedCount: integer('used_count').default(0).notNull(),
  resetAt: timestamp('reset_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('usage_limits_user_id_idx').on(table.userId),
  index('usage_limits_reset_at_idx').on(table.resetAt),
]);

// Subscriptions table (Stripe sync)
export const subscriptions = pgTable('subscriptions', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(), // active, canceled, past_due, etc.
  credits: integer('credits').default(0).notNull(), // For credit-based users
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: integer('cancel_at_period_end').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('subscriptions_user_id_idx').on(table.userId),
  index('subscriptions_stripe_customer_idx').on(table.stripeCustomerId),
  index('subscriptions_status_idx').on(table.status),
]);

// Relations (for query API)
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
```

### Drizzle Config File

```typescript
// Source: https://orm.drizzle.team/docs/drizzle-config-file
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './app/db/schema.ts',
  out: './app/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### Edge Runtime API Route

```typescript
// Source: https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions
// app/api/posts/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { db } from '@/app/db';
import { posts } from '@/app/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Query with soft delete filter
  const userPosts = await db
    .select()
    .from(posts)
    .where(
      eq(posts.userId, parseInt(userId)) &&
      isNull(posts.deletedAt)
    )
    .orderBy(desc(posts.createdAt))
    .limit(50);

  return NextResponse.json({ posts: userPosts });
}
```

### Soft Delete Helper Function

```typescript
// Source: https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database
// app/lib/db-utils.ts
import { SQL, sql } from 'drizzle-orm';
import { PgColumn } from 'drizzle-orm/pg-core';

// Helper to filter out soft-deleted records
export function notDeleted(deletedAtColumn: PgColumn): SQL {
  return sql`${deletedAtColumn} IS NULL`;
}

// Usage in queries
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { notDeleted } from '@/app/lib/db-utils';

const activeUsers = await db
  .select()
  .from(users)
  .where(notDeleted(users.deletedAt));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serial` primary keys | `generatedAlwaysAsIdentity()` | PostgreSQL 10+ (2017), Drizzle adoption 2024 | Better SQL standard compliance, explicit generation strategy |
| TCP connections | HTTP/WebSocket protocols | Neon serverless driver (2023) | Enables Edge Runtime, no connection pooling needed |
| `timestamp` without timezone | `timestamp with timezone` | Best practice since PostgreSQL 7.x, enforced in modern docs | Prevents timezone bugs, UTC by default |
| Hard deletes | Soft deletes with `deleted_at` | Industry standard for SaaS (2010s+) | Data recovery, compliance, audit trails |
| Runtime migrations | Build-time migrations | Serverless best practice (2020+) | Avoids race conditions, faster cold starts |
| Manual JSON validation | Zod + `.$type<>()` | Drizzle v0.26+ (2023) | Type safety + runtime validation |

**Deprecated/outdated:**
- **`serial` / `bigserial`**: Use `generatedAlwaysAsIdentity()` instead (PostgreSQL 10+ standard)
- **Drizzle Kit `push` for production**: Use `generate` + `migrate` for version control and review
- **WebSocket driver in Edge Runtime**: Use HTTP driver (WebSockets leak connections)
- **Unindexed foreign keys**: Always index foreign key columns for performance
- **Direct database connections in serverless**: Always use pooled connections (`DATABASE_URL`)

## Open Questions

Things that couldn't be fully resolved:

1. **Neon Preview Branch Strategy**
   - What we know: Neon supports database branches for preview deployments
   - What's unclear: Whether Vercel integration auto-creates branches or requires manual setup
   - Recommendation: Research during Phase 4 implementation, may need manual branch creation per preview

2. **Clerk Webhook Endpoint Security**
   - What we know: Clerk uses Svix for webhook signing (HMAC-SHA256)
   - What's unclear: Whether Edge Functions support Svix SDK or need manual verification
   - Recommendation: Defer to Phase 5 (Auth), likely needs Svix SDK or `@clerk/nextjs` webhook helpers

3. **Migration Rollback Strategy**
   - What we know: `drizzle-kit` generates SQL migrations but rollback not officially documented
   - What's unclear: Best practice for production rollbacks (manual SQL vs. git revert + regenerate)
   - Recommendation: Implement via git (revert schema changes, regenerate migrations, redeploy)

## Sources

### Primary (HIGH confidence)

- [Drizzle ORM - Drizzle with Vercel Edge Functions](https://orm.drizzle.team/docs/tutorials/drizzle-with-vercel-edge-functions)
- [Neon serverless driver documentation](https://neon.com/docs/serverless/serverless-driver)
- [Connect from Drizzle to Neon](https://neon.com/docs/guides/drizzle)
- [Drizzle ORM Schema Documentation](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Drizzle ORM Indexes & Constraints](https://orm.drizzle.team/docs/indexes-constraints)
- [Drizzle ORM PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/relations-schema-declaration)
- [Neon Connection Pooling](https://neon.com/docs/connect/connection-pooling)
- [Neon-Vercel Integration](https://neon.com/docs/guides/neon-managed-vercel-integration)

### Secondary (MEDIUM confidence)

- [Drizzle ORM PostgreSQL Best Practices Guide (2025)](https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717)
- [Soft deletion with PostgreSQL](https://evilmartians.com/chronicles/soft-deletion-with-postgresql-but-with-logic-on-the-database)
- [Why You Should Always Store Timestamps in UTC](https://shadhujan.medium.com/why-you-should-always-store-timestamps-in-utc-timestamp-vs-timestamptz-explained-5a1444814539)
- [Best practices for timestamps and time zones in databases](https://www.tinybird.co/blog/database-timestamps-timezones)
- [How to sync Clerk user data to your database](https://clerk.com/articles/how-to-sync-clerk-user-data-to-your-database)
- [Best Practices for User Authentication Module](https://www.red-gate.com/blog/user-authentication-module/)
- [Drizzle migrations to postgres in production](https://budivoogt.com/blog/drizzle-migrations)

### Tertiary (LOW confidence - Community discussions)

- [The Problem with Using Databases on the Edge](https://dev.to/reggi/the-problem-with-using-databases-on-the-edge-serverless-50fp)
- [The real serverless compute to database connection problem, solved](https://vercel.com/blog/the-real-serverless-compute-to-database-connection-problem-solved)
- [Running drizzle migrations before Next.js starts on Vercel](https://community.vercel.com/t/running-drizzle-migrations-for-my-db-before-next-js-starts-on-vercel/18074)
- [Drizzle ORM soft delete discussion](https://github.com/drizzle-team/drizzle-orm/discussions/4031)
- [Type safety on JSONB fields from PostgreSQL](https://github.com/drizzle-team/drizzle-orm/discussions/386)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation from Drizzle and Neon, confirmed Edge Runtime compatibility
- Architecture: HIGH - Patterns sourced from official Drizzle docs and Neon guides
- Pitfalls: MEDIUM to HIGH - Mix of official docs and well-documented community issues
- Schema examples: HIGH - Based on official Drizzle column types and constraints documentation
- Clerk webhook sync: MEDIUM - Official Clerk article, but implementation details need Phase 5 verification

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days, stable domain with incremental updates)
**Next review needed:** When Drizzle ORM releases major version update or Neon changes driver API
