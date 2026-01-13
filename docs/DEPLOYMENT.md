# Multi-Collection Deployment Guide

## Overview

This guide covers deploying the multi-collection feature to production, including database migrations, application deployment, and rollback procedures.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Migration](#database-migration)
4. [Application Deployment](#application-deployment)
5. [Verification](#verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Readiness

- [ ] All code changes merged to main branch
- [ ] All tests passing (unit, integration, e2e)
- [ ] TypeScript compilation successful with no errors
- [ ] Linting passes with no warnings
- [ ] Code reviewed and approved
- [ ] Documentation complete and reviewed

### Database Readiness

- [ ] Migration scripts tested in staging environment
- [ ] Database backup created
- [ ] RLS policies verified in staging
- [ ] Indexes created and tested
- [ ] Query performance validated

### Testing Checklist

- [ ] Unit tests: 100% pass rate
- [ ] Integration tests: 100% pass rate
- [ ] E2E tests: All critical paths verified
- [ ] Load testing: Performance acceptable
- [ ] Cross-browser testing: Chrome, Safari, Firefox
- [ ] Mobile testing: iOS and Android
- [ ] Accessibility testing: WCAG 2.1 AA compliance

### Infrastructure Readiness

- [ ] Staging environment matches production
- [ ] SSL certificates valid
- [ ] DNS records configured
- [ ] CDN configured for static assets
- [ ] Monitoring and alerting configured
- [ ] Backup systems tested

### Communication Readiness

- [ ] User communication drafted
- [ ] Support team briefed
- [ ] Rollback plan documented
- [ ] On-call schedule established
- [ ] Stakeholders notified of deployment window

---

## Environment Setup

### Development Environment

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Update with your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Start local development
npm run dev
```

### Staging Environment

```bash
# Set up staging environment variables
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key

# Build for staging
npm run build

# Deploy to staging
npm run deploy:staging
```

### Production Environment

```bash
# Set up production environment variables
VITE_SUPABASE_URL=https://production-project.supabase.co
VITE_SUPABASE_ANON_KEY=production-anon-key

# Build for production
npm run build

# Deploy to production
npm run deploy:production
```

---

## Database Migration

### Step 1: Backup Production Database

**Critical**: Always backup before migration!

#### Option A: Supabase Dashboard

1. Navigate to Supabase Dashboard → Database → Backups
2. Click "Create Backup"
3. Wait for backup to complete
4. Download backup file for local storage

#### Option B: Supabase CLI

```bash
# Dump entire database
npx supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Dump schema only
npx supabase db dump --schema-only -f schema-backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file exists and is not empty
ls -lh backup-*.sql
```

#### Option C: pg_dump (Direct)

```bash
# Using connection string
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Verify backup
head -n 20 backup-*.sql
```

### Step 2: Test Migration in Staging

Before applying to production, test in staging:

```bash
# Apply migration to staging
npx supabase db push --db-url $STAGING_DATABASE_URL

# Verify migration
npx supabase db diff --db-url $STAGING_DATABASE_URL

# Run verification queries
psql $STAGING_DATABASE_URL -f verify-migration.sql
```

**Verification queries** (`verify-migration.sql`):

```sql
-- Check collection_type enum exists
SELECT enum_range(NULL::collection_type);

-- Verify collections have collection_type
SELECT collection_type, COUNT(*)
FROM collections
GROUP BY collection_type;

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sneaker_specs', 'purse_specs');

-- Verify indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE indexname LIKE '%collection_id%';

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('sneaker_specs', 'purse_specs');
```

### Step 3: Apply Migration to Production

**Recommended Time**: During low-traffic period (e.g., 2-4 AM local time)

#### Option A: Supabase Dashboard (Recommended for Safety)

1. Navigate to: Database → Migrations
2. Click "New Migration"
3. Upload `20260113000000_add_multi_collection_support.sql`
4. Review SQL in preview
5. Click "Run Migration"
6. Monitor execution

#### Option B: Supabase CLI

```bash
# Apply migration
npx supabase db push --db-url $PRODUCTION_DATABASE_URL

# Watch for errors
echo $?  # Should be 0 if successful
```

#### Option C: Direct psql

```bash
# Apply migration with transaction
psql $PRODUCTION_DATABASE_URL <<EOF
BEGIN;

\i supabase/migrations/20260113000000_add_multi_collection_support.sql

-- Verify critical changes
SELECT COUNT(*) FROM collections WHERE collection_type IS NOT NULL;
SELECT COUNT(*) FROM sneaker_specs;
SELECT COUNT(*) FROM purse_specs;

COMMIT;
EOF
```

### Step 4: Verify Migration Success

Run verification queries:

```bash
psql $PRODUCTION_DATABASE_URL -f verify-migration.sql
```

Expected output:
```
enum_range: {watches,sneakers,purses}
collection_type | count
-----------------+-------
watches         | 150
(1 row)

table_name
-----------------
sneaker_specs
purse_specs
(2 rows)

[Indexes and policies listed]
```

### Step 5: Migration Monitoring

Monitor database performance after migration:

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%collection_id%'
ORDER BY idx_scan DESC;

-- Monitor query performance
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%collection%'
ORDER BY mean_time DESC
LIMIT 20;
```

---

## Application Deployment

### Step 1: Build Production Bundle

```bash
# Clean previous builds
rm -rf dist

# Install dependencies (ensure lockfile is up to date)
npm ci

# Run build
npm run build

# Verify build output
ls -lh dist/
```

**Expected output structure**:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other assets]
└── [other files]
```

### Step 2: Test Production Build Locally

```bash
# Preview production build
npm run preview

# Open browser to http://localhost:4173
# Verify:
# - Collection type selector works
# - Creating collections with different types
# - Switching between collections
# - Type-specific forms render correctly
# - Dashboard shows type-specific labels
```

### Step 3: Deploy to Hosting Platform

#### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod

# Or using GitHub integration (recommended)
git push origin main
# Vercel auto-deploys from main branch
```

#### Netlify Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to production
netlify deploy --prod

# Or using GitHub integration (recommended)
git push origin main
# Netlify auto-deploys from main branch
```

#### Custom Server Deployment

```bash
# Build production bundle
npm run build

# Upload to server
rsync -avz --delete dist/ user@server:/var/www/app/

# On server, restart web server
ssh user@server 'sudo systemctl restart nginx'
```

### Step 4: Update Environment Variables

Ensure production environment has correct variables:

**Vercel/Netlify Dashboard:**
1. Navigate to Settings → Environment Variables
2. Update/add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - Any other environment-specific vars
3. Redeploy if needed

**Custom Server:**
```bash
# Update .env.production
cat > /var/www/app/.env.production <<EOF
VITE_SUPABASE_URL=https://production.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
EOF
```

---

## Verification

### Post-Deployment Checks

**Critical Paths** (test in order):

1. **User Authentication**
   - [ ] Login works
   - [ ] Sign up works
   - [ ] Password reset works
   - [ ] 2FA works (if enabled)

2. **Collection Management**
   - [ ] Create new collection (watches)
   - [ ] Create new collection (sneakers)
   - [ ] Create new collection (purses)
   - [ ] Switch between collections
   - [ ] Collection switcher shows correct type icons
   - [ ] Delete collection works

3. **Item Management (Watches)**
   - [ ] Add watch with watch-specific fields
   - [ ] Edit watch
   - [ ] Delete watch
   - [ ] Upload photo
   - [ ] View watch details

4. **Item Management (Sneakers)**
   - [ ] Add sneaker with sneaker-specific fields
   - [ ] Sneaker specs save correctly
   - [ ] Size and colorway display properly
   - [ ] Condition tracking works

5. **Item Management (Purses)**
   - [ ] Add purse with purse-specific fields
   - [ ] Purse specs save correctly
   - [ ] Material and hardware display properly
   - [ ] Authenticity verification works

6. **Dashboard**
   - [ ] Stats show correct values
   - [ ] Labels update based on collection type
   - [ ] Charts render correctly
   - [ ] Most used item displays correctly

7. **Features**
   - [ ] Trips work (collection-scoped)
   - [ ] Events work (collection-scoped)
   - [ ] Wear logging works
   - [ ] Water usage works (watches only)
   - [ ] Wishlist works (collection-scoped)

8. **Social Features**
   - [ ] Friends list loads
   - [ ] Messages work
   - [ ] Forum posts load
   - [ ] Trade matches work

9. **Performance**
   - [ ] Page load < 2 seconds
   - [ ] Time to interactive < 3 seconds
   - [ ] Images load progressively
   - [ ] No console errors

10. **Cross-Browser**
    - [ ] Chrome (latest)
    - [ ] Safari (latest)
    - [ ] Firefox (latest)
    - [ ] Edge (latest)

11. **Mobile**
    - [ ] iOS Safari
    - [ ] Android Chrome
    - [ ] Responsive layouts work
    - [ ] Touch interactions work

### Automated Verification

Create a verification script:

```bash
#!/bin/bash
# verify-deployment.sh

echo "🔍 Verifying deployment..."

# Check app is accessible
if curl -s https://your-app.com | grep -q "Collection Vault"; then
  echo "✅ App is accessible"
else
  echo "❌ App is not accessible"
  exit 1
fi

# Check API health
if curl -s https://your-project.supabase.co/rest/v1/ | grep -q "ok"; then
  echo "✅ Supabase API is healthy"
else
  echo "❌ Supabase API is down"
  exit 1
fi

# Check database connection
if psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
  echo "✅ Database is accessible"
else
  echo "❌ Database is not accessible"
  exit 1
fi

# Verify migration applied
ENUM_CHECK=$(psql $DATABASE_URL -t -c "SELECT enum_range(NULL::collection_type)")
if [[ $ENUM_CHECK == *"watches"* ]] && [[ $ENUM_CHECK == *"sneakers"* ]]; then
  echo "✅ Migration applied successfully"
else
  echo "❌ Migration not applied correctly"
  exit 1
fi

echo "✅ All verification checks passed!"
```

Run verification:
```bash
chmod +x verify-deployment.sh
./verify-deployment.sh
```

---

## Rollback Procedures

### When to Rollback

Rollback if:
- Critical bugs discovered
- Data corruption detected
- Performance degradation > 50%
- Security vulnerability found
- User-facing errors affecting > 5% of users

### Rollback Application

#### Vercel/Netlify

```bash
# Vercel: Rollback to previous deployment
vercel rollback

# Or via dashboard: Deployments → Previous deployment → Promote to Production
```

#### Custom Server

```bash
# Assuming you tagged the release
git checkout v1.0.0  # Previous stable version
npm ci
npm run build
rsync -avz --delete dist/ user@server:/var/www/app/
ssh user@server 'sudo systemctl restart nginx'
```

### Rollback Database

**Option 1: Restore from Backup**

```bash
# Stop application first to prevent writes
# Then restore
psql $DATABASE_URL < backup-20260113.sql

# Verify restoration
psql $DATABASE_URL -c "SELECT COUNT(*) FROM collections"
```

**Option 2: Rollback Migration (if safe)**

Create rollback migration:

```sql
-- 20260113000001_rollback_multi_collection.sql
BEGIN;

-- Remove collection_id from tables
ALTER TABLE trips DROP COLUMN IF EXISTS collection_id;
ALTER TABLE events DROP COLUMN IF EXISTS collection_id;
ALTER TABLE water_usage DROP COLUMN IF EXISTS collection_id;
ALTER TABLE wishlist DROP COLUMN IF EXISTS collection_id;
ALTER TABLE personal_notes DROP COLUMN IF EXISTS collection_id;
ALTER TABLE collection_insights DROP COLUMN IF EXISTS collection_id;
ALTER TABLE collection_gap_suggestions DROP COLUMN IF EXISTS collection_id;

-- Drop specs tables
DROP TABLE IF EXISTS sneaker_specs;
DROP TABLE IF EXISTS purse_specs;

-- Remove collection_type column
ALTER TABLE collections DROP COLUMN IF EXISTS collection_type;

-- Drop enum type
DROP TYPE IF EXISTS collection_type;

COMMIT;
```

Apply rollback:

```bash
psql $DATABASE_URL -f supabase/migrations/20260113000001_rollback_multi_collection.sql
```

**Warning**: This will lose any data created in sneaker_specs and purse_specs tables!

### Post-Rollback Verification

```bash
# Verify app works
curl -s https://your-app.com | grep "Collection Vault"

# Verify database state
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('sneaker_specs', 'purse_specs')"
# Should return 0 rows

# Check user can access their data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM watches WHERE collection_id IS NOT NULL"
```

---

## Monitoring

### Application Monitoring

**Metrics to track:**

1. **Performance**
   - Page load time
   - Time to interactive
   - API response times
   - Database query times

2. **Errors**
   - JavaScript errors
   - API errors (4xx, 5xx)
   - Database errors
   - Authentication failures

3. **Usage**
   - Active users
   - Collection creations by type
   - Items added by type
   - Feature usage (trips, events, etc.)

### Monitoring Setup

#### Sentry (Error Tracking)

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

#### Vercel Analytics

```typescript
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

#### Custom Metrics

```typescript
// src/lib/analytics.ts
export const trackCollectionCreated = (type: CollectionType) => {
  if (window.gtag) {
    window.gtag('event', 'collection_created', {
      collection_type: type
    });
  }
};

export const trackItemAdded = (collectionType: CollectionType) => {
  if (window.gtag) {
    window.gtag('event', 'item_added', {
      collection_type: collectionType
    });
  }
};
```

### Database Monitoring

```sql
-- Create monitoring view
CREATE OR REPLACE VIEW deployment_health AS
SELECT
  'collections' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS rows_last_hour,
  COUNT(*) FILTER (WHERE collection_type = 'watches') AS watches_count,
  COUNT(*) FILTER (WHERE collection_type = 'sneakers') AS sneakers_count,
  COUNT(*) FILTER (WHERE collection_type = 'purses') AS purses_count
FROM collections
UNION ALL
SELECT
  'watches' AS table_name,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS rows_last_hour,
  NULL, NULL, NULL
FROM watches;

-- Query monitoring view
SELECT * FROM deployment_health;
```

### Alerting

Set up alerts for:

1. **Error Rate > 1%**
   - Trigger: > 1% of requests fail
   - Action: Page on-call engineer
   - Severity: Critical

2. **Database CPU > 80%**
   - Trigger: CPU usage > 80% for 5 minutes
   - Action: Alert on Slack
   - Severity: Warning

3. **Response Time > 2s**
   - Trigger: P95 response time > 2 seconds
   - Action: Alert on Slack
   - Severity: Warning

4. **Zero Traffic**
   - Trigger: No requests in 5 minutes
   - Action: Page on-call engineer
   - Severity: Critical

---

## Troubleshooting

### Common Issues

#### Issue: "collection_type does not exist"

**Cause**: Migration not applied or failed

**Solution**:
```bash
# Check if migration applied
psql $DATABASE_URL -c "SELECT enum_range(NULL::collection_type)"

# If error, apply migration
psql $DATABASE_URL -f supabase/migrations/20260113000000_add_multi_collection_support.sql
```

#### Issue: Items not showing in new collections

**Cause**: collection_id not set when creating items

**Solution**:
```typescript
// Ensure collection_id is set
const { error } = await supabase
  .from('watches')
  .insert({
    ...itemData,
    collection_id: selectedCollectionId, // Must be set!
    user_id: user.id
  });
```

#### Issue: Type-specific fields not saving

**Cause**: Specs tables not being updated

**Solution**:
```typescript
// After creating base item, create specs
if (collectionType === 'sneakers') {
  await supabase
    .from('sneaker_specs')
    .insert({
      watch_id: newItem.id,
      colorway,
      shoe_size,
      // ... other sneaker fields
    });
}
```

#### Issue: Performance degradation

**Cause**: Missing indexes on collection_id

**Solution**:
```sql
-- Add indexes if missing
CREATE INDEX IF NOT EXISTS idx_trips_collection_id ON trips(collection_id);
CREATE INDEX IF NOT EXISTS idx_events_collection_id ON events(collection_id);
CREATE INDEX IF NOT EXISTS idx_water_usage_collection_id ON water_usage(collection_id);
```

#### Issue: Users can't switch collections

**Cause**: Context not updating or localStorage issue

**Solution**:
```bash
# Clear localStorage
localStorage.clear();

# Or programmatically in console
localStorage.removeItem('selectedCollectionId');
```

#### Issue: RLS policies blocking queries

**Cause**: New tables don't have RLS policies

**Solution**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('sneaker_specs', 'purse_specs');

-- Verify policies exist
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('sneaker_specs', 'purse_specs');
```

---

## Post-Deployment Tasks

### Day 1

- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify all collection types being used
- [ ] Review performance metrics
- [ ] Address critical bugs

### Week 1

- [ ] Analyze usage patterns
- [ ] Review support tickets
- [ ] Optimize slow queries
- [ ] Gather user feedback
- [ ] Plan improvements

### Month 1

- [ ] Review analytics
- [ ] Plan next features
- [ ] Optimize based on usage
- [ ] Update documentation
- [ ] Celebrate success! 🎉

---

## Conclusion

Following this deployment guide ensures a smooth rollout of the multi-collection feature with minimal risk and maximum reliability.

**Remember:**
- Always backup before deploying
- Test thoroughly in staging
- Monitor closely after deployment
- Have a rollback plan ready
- Communicate with users

For additional support:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Development guide
- [USER_GUIDE.md](./USER_GUIDE.md) - User documentation
- [FAQ.md](./FAQ.md) - Frequently asked questions

Happy deploying! 🚀
