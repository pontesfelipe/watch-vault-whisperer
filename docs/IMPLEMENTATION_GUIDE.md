# Multi-Collection Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the multi-collection feature, transforming the Watch Vault Whisperer into a platform supporting watches, sneakers, and purses.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Database Migration](#phase-1-database-migration)
3. [Phase 2: Backend Integration](#phase-2-backend-integration)
4. [Phase 3: Hooks Refactoring](#phase-3-hooks-refactoring)
5. [Phase 4: UI Components](#phase-4-ui-components)
6. [Phase 5: Forms and Validation](#phase-5-forms-and-validation)
7. [Phase 6: Dashboard Updates](#phase-6-dashboard-updates)
8. [Phase 7: Testing](#phase-7-testing)
9. [Phase 8: Deployment](#phase-8-deployment)

---

## Prerequisites

### Required Knowledge

- React and TypeScript
- Supabase (PostgreSQL, RLS, Storage)
- React Query (TanStack Query)
- Tailwind CSS and Shadcn UI

### Development Environment

```bash
# Ensure you have the latest dependencies
npm install

# Start local Supabase (if using local development)
npx supabase start

# Start development server
npm run dev
```

### Database Access

Ensure you have admin access to your Supabase project to run migrations.

---

## Phase 1: Database Migration

### Step 1.1: Apply Migration

The migration file has been created at:
```
supabase/migrations/20260113000000_add_multi_collection_support.sql
```

**Apply the migration:**

```bash
# For local development
npx supabase db push

# For production (use Supabase dashboard)
# Navigate to: Database > Migrations > Upload SQL file
```

### Step 1.2: Verify Migration

```sql
-- Check collection_type enum exists
SELECT enum_range(NULL::collection_type);
-- Expected: {watches,sneakers,purses}

-- Check collections table has collection_type column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'collections';

-- Check sneaker_specs and purse_specs tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('sneaker_specs', 'purse_specs');

-- Check collection_id columns added to feature tables
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'collection_id'
AND table_schema = 'public';
```

### Step 1.3: Backfill Existing Data

All existing collections will default to `'watches'` type. No action needed for backward compatibility.

**Optional**: If you want to manually set collection types:

```sql
UPDATE collections
SET collection_type = 'watches'
WHERE collection_type IS NULL;
```

---

## Phase 2: Backend Integration

### Step 2.1: Update Supabase Types

If using Supabase CLI to generate types:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Or manually add to your types file:

```typescript
// src/integrations/supabase/types.ts
export type CollectionType = 'watches' | 'sneakers' | 'purses';

export interface Database {
  public: {
    Tables: {
      collections: {
        Row: {
          id: string;
          name: string;
          collection_type: CollectionType;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          collection_type?: CollectionType;
          created_by: string;
        };
        Update: {
          name?: string;
          collection_type?: CollectionType;
        };
      };
      // ... other tables
    };
  };
}
```

### Step 2.2: Update Collection Queries

Update any existing collection queries to include `collection_type`:

```typescript
// Before
const { data } = await supabase
  .from('collections')
  .select('id, name, created_by, created_at');

// After
const { data } = await supabase
  .from('collections')
  .select('id, name, collection_type, created_by, created_at');
```

---

## Phase 3: Hooks Refactoring

### Step 3.1: Update useWatchData Hook

File: `src/hooks/useWatchData.ts`

**Current implementation** fetches watches without considering collection type. Update to support type-specific queries:

```typescript
// Add collection type parameter
export const useItemData = (
  collectionId: string | null,
  collectionType: CollectionType
) => {
  const { user } = useAuth();

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['items', collectionId, collectionType],
    queryFn: async () => {
      if (!collectionId || !user) return [];

      // Fetch base items
      const { data: itemsData, error } = await supabase
        .from('watches')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Fetch type-specific specs if needed
      if (collectionType === 'sneakers') {
        const { data: specs } = await supabase
          .from('sneaker_specs')
          .select('*')
          .in('watch_id', itemsData.map(i => i.id));

        // Merge specs with items
        return itemsData.map(item => ({
          ...item,
          ...specs?.find(s => s.watch_id === item.id)
        }));
      } else if (collectionType === 'purses') {
        const { data: specs } = await supabase
          .from('purse_specs')
          .select('*')
          .in('watch_id', itemsData.map(i => i.id));

        return itemsData.map(item => ({
          ...item,
          ...specs?.find(s => s.watch_id === item.id)
        }));
      }

      return itemsData;
    },
    enabled: !!collectionId && !!user,
  });

  return { items, isLoading, refetch };
};
```

### Step 3.2: Update useTripData Hook

File: `src/hooks/useTripData.ts`

Add collection_id filtering:

```typescript
export const useTripData = (collectionId: string | null) => {
  const { user } = useAuth();

  const { data: trips, isLoading, refetch } = useQuery({
    queryKey: ['trips', collectionId],
    queryFn: async () => {
      if (!collectionId || !user) return [];

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('collection_id', collectionId) // NEW: Filter by collection
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId && !!user,
  });

  return { trips, isLoading, refetch };
};
```

### Step 3.3: Update useEventData Hook

File: `src/hooks/useEventData.ts`

Similar changes:

```typescript
export const useEventData = (collectionId: string | null) => {
  const { user } = useAuth();

  const { data: events, isLoading, refetch } = useQuery({
    queryKey: ['events', collectionId],
    queryFn: async () => {
      if (!collectionId || !user) return [];

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('collection_id', collectionId) // NEW: Filter by collection
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId && !!user,
  });

  return { events, isLoading, refetch };
};
```

### Step 3.4: Update useWaterUsageData Hook

File: `src/hooks/useWaterUsageData.ts`

```typescript
export const useWaterUsageData = (collectionId: string | null) => {
  const { user } = useAuth();

  const { data: waterUsage, isLoading, refetch } = useQuery({
    queryKey: ['water_usage', collectionId],
    queryFn: async () => {
      if (!collectionId || !user) return [];

      const { data, error } = await supabase
        .from('water_usage')
        .select('*')
        .eq('collection_id', collectionId) // NEW: Filter by collection
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId && !!user,
  });

  return { waterUsage, isLoading, refetch };
};
```

### Step 3.5: Update useStatsCalculations Hook

File: `src/hooks/useStatsCalculations.ts`

Make stats collection-aware and use dynamic labels:

```typescript
export const useStatsCalculations = (
  collectionId: string | null,
  collectionType: CollectionType
) => {
  const { items } = useItemData(collectionId, collectionType);
  const { wearEntries } = useWearData(collectionId);
  const config = getCollectionConfig(collectionType);

  // Calculate stats using items instead of watches
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);

  // Most worn item
  const wearCounts = items.map(item => ({
    item,
    totalWear: wearEntries
      .filter(w => w.watch_id === item.id)
      .reduce((sum, w) => sum + w.days, 0)
  }));

  const mostWornItem = wearCounts.reduce((max, curr) =>
    curr.totalWear > max.totalWear ? curr : max,
    { item: null, totalWear: 0 }
  );

  return {
    totalItems,
    totalValue,
    mostWornItem: mostWornItem.item,
    avgWear: totalItems > 0 ?
      wearEntries.reduce((sum, w) => sum + w.days, 0) / totalItems : 0,
    labels: config.statsLabels
  };
};
```

---

## Phase 4: UI Components

### Step 4.1: Create Dynamic Item Card Component

File: `src/components/DynamicItemCard.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { CollectionItem } from '@/types/collection';

interface DynamicItemCardProps {
  item: CollectionItem;
  onClick?: () => void;
}

export const DynamicItemCard = ({ item, onClick }: DynamicItemCardProps) => {
  const { currentCollectionType, currentCollectionConfig } = useCollection();

  const renderPrimaryInfo = () => {
    const fields = currentCollectionConfig.primaryFields;

    return (
      <div className="space-y-2">
        <h3 className="font-semibold">{item.brand} {item.model}</h3>

        {/* Render type-specific fields */}
        {currentCollectionType === 'watches' && (
          <>
            <p className="text-sm text-muted-foreground">
              {item.dial_color} • {item.type}
            </p>
            {item.case_size && (
              <p className="text-xs">Case: {item.case_size}mm</p>
            )}
          </>
        )}

        {currentCollectionType === 'sneakers' && (
          <>
            <p className="text-sm text-muted-foreground">
              {item.colorway}
            </p>
            {item.shoe_size && (
              <p className="text-xs">Size: {item.shoe_size} {item.size_type}</p>
            )}
          </>
        )}

        {currentCollectionType === 'purses' && (
          <>
            <p className="text-sm text-muted-foreground">
              {item.material} • {item.hardware_color}
            </p>
            {item.size_category && (
              <p className="text-xs">Size: {item.size_category}</p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
      onClick={onClick}
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt={`${item.brand} ${item.model}`}
          className="w-full h-48 object-cover rounded mb-4"
        />
      )}
      {renderPrimaryInfo()}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-sm font-medium">
          ${item.cost?.toLocaleString()}
        </span>
        {item.available_for_trade && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Available for Trade
          </span>
        )}
      </div>
    </div>
  );
};
```

### Step 4.2: Create Dynamic Form Component

File: `src/components/DynamicItemForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCollection } from '@/contexts/CollectionContext';

// Base schema
const baseItemSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  cost: z.number().positive("Cost must be positive"),
  msrp: z.number().optional(),
  when_bought: z.string().optional(),
});

// Watch schema
const watchSchema = baseItemSchema.extend({
  dial_color: z.string().optional(),
  case_size: z.number().optional(),
  movement: z.string().optional(),
  type: z.string().optional(),
});

// Sneaker schema
const sneakerSchema = baseItemSchema.extend({
  colorway: z.string().optional(),
  shoe_size: z.number().optional(),
  size_type: z.enum(['US', 'UK', 'EU']).optional(),
  sku: z.string().optional(),
  condition: z.enum(['deadstock', 'vnds', 'used']).optional(),
});

// Purse schema
const purseSchema = baseItemSchema.extend({
  material: z.string().optional(),
  hardware_color: z.string().optional(),
  size_category: z.enum(['mini', 'small', 'medium', 'large']).optional(),
  authenticity_verified: z.boolean().optional(),
});

export const DynamicItemForm = ({ onSubmit, defaultValues }) => {
  const { currentCollectionType, currentCollectionConfig } = useCollection();

  // Select schema based on collection type
  const schema =
    currentCollectionType === 'watches' ? watchSchema :
    currentCollectionType === 'sneakers' ? sneakerSchema :
    purseSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const renderTypeSpecificFields = () => {
    if (currentCollectionType === 'watches') {
      return (
        <>
          <FormField name="dial_color" label="Dial Color" />
          <FormField name="case_size" label="Case Size (mm)" type="number" />
          <FormField name="movement" label="Movement" />
          <FormSelect
            name="type"
            label="Type"
            options={['Automatic', 'Manual', 'Quartz', 'Smartwatch']}
          />
        </>
      );
    }

    if (currentCollectionType === 'sneakers') {
      return (
        <>
          <FormField name="colorway" label="Colorway" />
          <FormField name="shoe_size" label="Shoe Size" type="number" />
          <FormSelect
            name="size_type"
            label="Size Type"
            options={['US', 'UK', 'EU']}
          />
          <FormField name="sku" label="SKU" />
          <FormSelect
            name="condition"
            label="Condition"
            options={['deadstock', 'vnds', 'used']}
          />
        </>
      );
    }

    if (currentCollectionType === 'purses') {
      return (
        <>
          <FormField name="material" label="Material" />
          <FormField name="hardware_color" label="Hardware Color" />
          <FormSelect
            name="size_category"
            label="Size Category"
            options={['mini', 'small', 'medium', 'large']}
          />
          <FormCheckbox name="authenticity_verified" label="Authenticity Verified" />
        </>
      );
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Common fields */}
      <FormField name="brand" label="Brand" required />
      <FormField name="model" label="Model" required />
      <FormField name="cost" label="Cost" type="number" required />
      <FormField name="msrp" label="MSRP" type="number" />
      <FormField name="when_bought" label="Date Purchased" type="date" />

      {/* Type-specific fields */}
      {renderTypeSpecificFields()}

      <Button type="submit">
        Save {currentCollectionConfig.singular}
      </Button>
    </form>
  );
};
```

### Step 4.3: Update Collection Page

File: `src/pages/Collection.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { DynamicItemCard } from '@/components/DynamicItemCard';
import { useItemData } from '@/hooks/useItemData';

export const Collection = () => {
  const {
    selectedCollectionId,
    currentCollectionType,
    currentCollectionConfig
  } = useCollection();

  const { items, isLoading } = useItemData(
    selectedCollectionId,
    currentCollectionType
  );

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">
          {currentCollectionConfig.icon} My {currentCollectionConfig.plural}
        </h1>
        <AddItemDialog />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map(item => (
            <DynamicItemCard
              key={item.id}
              item={item}
              onClick={() => navigate(`/item/${item.id}`)}
            />
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No {currentCollectionConfig.plural.toLowerCase()} yet.
            Add your first {currentCollectionConfig.singular.toLowerCase()}!
          </p>
        </div>
      )}
    </div>
  );
};
```

---

## Phase 5: Forms and Validation

### Step 5.1: Create Collection Type Selector

File: `src/components/CreateCollectionDialog.tsx`

```typescript
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { COLLECTION_TYPE_CONFIGS, CollectionType } from '@/types/collection';

export const CreateCollectionDialog = ({ open, onOpenChange }) => {
  const [name, setName] = useState('');
  const [collectionType, setCollectionType] = useState<CollectionType>('watches');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('collections')
      .insert({
        name,
        collection_type: collectionType,
        created_by: user.id
      });

    if (!error) {
      toast.success('Collection created!');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium">Collection Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded"
              placeholder="My Collection"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">
              Collection Type
            </label>
            <RadioGroup value={collectionType} onValueChange={setCollectionType}>
              {Object.values(COLLECTION_TYPE_CONFIGS).map(config => (
                <div key={config.type} className="flex items-center space-x-3 mb-3">
                  <RadioGroupItem value={config.type} id={config.type} />
                  <label htmlFor={config.type} className="flex items-center cursor-pointer">
                    <span className="text-2xl mr-3">{config.icon}</span>
                    <div>
                      <p className="font-medium">{config.plural}</p>
                      <p className="text-sm text-muted-foreground">
                        Track your {config.plural.toLowerCase()} collection
                      </p>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button type="submit" className="w-full">
            Create Collection
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

### Step 5.2: Update Item Creation

When creating items, ensure collection_id is set:

```typescript
const handleAddItem = async (formData) => {
  const { error } = await supabase
    .from('watches')
    .insert({
      ...formData,
      collection_id: selectedCollectionId,
      user_id: user.id,
    });

  // If sneaker, also insert sneaker_specs
  if (currentCollectionType === 'sneakers' && itemId) {
    await supabase
      .from('sneaker_specs')
      .insert({
        watch_id: itemId,
        ...sneakerSpecificFields
      });
  }

  // If purse, also insert purse_specs
  if (currentCollectionType === 'purses' && itemId) {
    await supabase
      .from('purse_specs')
      .insert({
        watch_id: itemId,
        ...purseSpecificFields
      });
  }
};
```

---

## Phase 6: Dashboard Updates

### Step 6.1: Update Dashboard Stats

File: `src/pages/Dashboard.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { useStatsCalculations } from '@/hooks/useStatsCalculations';

export const Dashboard = () => {
  const {
    selectedCollectionId,
    currentCollectionType,
    currentCollectionConfig
  } = useCollection();

  const {
    totalItems,
    totalValue,
    mostWornItem,
    avgWear,
    labels
  } = useStatsCalculations(selectedCollectionId, currentCollectionType);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">
        {currentCollectionConfig.icon} Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title={labels.totalItems}
          value={totalItems}
          icon={currentCollectionConfig.icon}
        />
        <StatsCard
          title="Total Value"
          value={`$${totalValue.toLocaleString()}`}
          icon="💰"
        />
        <StatsCard
          title={labels.avgUsage}
          value={avgWear.toFixed(1)}
          icon="📊"
        />
      </div>

      {mostWornItem && (
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">{labels.mostUsed}</h2>
          <DynamicItemCard item={mostWornItem} />
        </div>
      )}
    </div>
  );
};
```

---

## Phase 7: Testing

### Step 7.1: Unit Tests

Create tests for collection type logic:

```typescript
// __tests__/collection.test.ts
import { getCollectionConfig, getItemTypeLabel } from '@/types/collection';

describe('Collection Type System', () => {
  test('getCollectionConfig returns correct config for watches', () => {
    const config = getCollectionConfig('watches');
    expect(config.singular).toBe('Watch');
    expect(config.plural).toBe('Watches');
  });

  test('getCollectionConfig returns correct config for sneakers', () => {
    const config = getCollectionConfig('sneakers');
    expect(config.singular).toBe('Sneaker');
    expect(config.statsLabels.mostUsed).toBe('Most Worn Sneaker');
  });

  test('getItemTypeLabel returns singular for count 1', () => {
    expect(getItemTypeLabel('purses', 1)).toBe('Purse');
  });

  test('getItemTypeLabel returns plural for count > 1', () => {
    expect(getItemTypeLabel('purses', 5)).toBe('Purses');
  });
});
```

### Step 7.2: Integration Tests

Test collection switching and data isolation:

```typescript
// __tests__/integration/collection-switching.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { Collection } from '@/pages/Collection';

describe('Collection Switching', () => {
  test('displays correct items when switching collections', async () => {
    // Mock collection data
    const watchCollection = { id: '1', collection_type: 'watches' };
    const sneakerCollection = { id: '2', collection_type: 'sneakers' };

    // Render with watch collection
    const { rerender } = render(<Collection />, {
      wrapper: ({ children }) => (
        <CollectionProvider initialCollection={watchCollection}>
          {children}
        </CollectionProvider>
      )
    });

    await waitFor(() => {
      expect(screen.getByText('My Watches')).toBeInTheDocument();
    });

    // Switch to sneaker collection
    rerender(
      <CollectionProvider initialCollection={sneakerCollection}>
        <Collection />
      </CollectionProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('My Sneakers')).toBeInTheDocument();
    });
  });
});
```

### Step 7.3: E2E Tests

Test full workflows with Playwright/Cypress:

```typescript
// e2e/create-collection.spec.ts
test('create sneaker collection and add item', async ({ page }) => {
  await page.goto('/collections');

  // Click create collection
  await page.click('text=Create Collection');

  // Fill form
  await page.fill('input[name="name"]', 'My Sneakers');
  await page.click('text=Sneakers');
  await page.click('button[type="submit"]');

  // Verify collection created
  await expect(page.locator('text=My Sneakers')).toBeVisible();

  // Add sneaker
  await page.click('text=Add Sneaker');
  await page.fill('input[name="brand"]', 'Nike');
  await page.fill('input[name="model"]', 'Air Jordan 1');
  await page.fill('input[name="colorway"]', 'Chicago');
  await page.fill('input[name="shoe_size"]', '10');
  await page.click('button[type="submit"]');

  // Verify sneaker added
  await expect(page.locator('text=Nike Air Jordan 1')).toBeVisible();
  await expect(page.locator('text=Chicago')).toBeVisible();
});
```

---

## Phase 8: Deployment

### Step 8.1: Pre-Deployment Checklist

- [ ] All migrations tested in staging
- [ ] Type definitions updated
- [ ] All hooks updated to be collection-aware
- [ ] UI components support all collection types
- [ ] Forms validated for each type
- [ ] Dashboard stats working correctly
- [ ] Tests passing (unit, integration, e2e)
- [ ] Performance tested with large datasets
- [ ] Documentation updated
- [ ] User communication prepared

### Step 8.2: Database Migration

```bash
# 1. Backup production database
npx supabase db dump > backup-$(date +%Y%m%d).sql

# 2. Apply migration to production (via Supabase dashboard)
# Navigate to: Database > Migrations > Upload SQL file
# Upload: supabase/migrations/20260113000000_add_multi_collection_support.sql

# 3. Verify migration
# Run verification queries from Step 1.2
```

### Step 8.3: Application Deployment

```bash
# 1. Build production bundle
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to hosting (Vercel/Netlify/etc.)
npm run deploy

# 4. Verify deployment
# - Check all collection types load correctly
# - Test creating new collections
# - Test adding items to each collection type
# - Verify data isolation between collections
```

### Step 8.4: Post-Deployment Verification

```typescript
// Run these queries in Supabase SQL Editor to verify

-- Check all collections have a type
SELECT id, name, collection_type
FROM collections
WHERE collection_type IS NULL;
-- Should return 0 rows

-- Check collection type distribution
SELECT collection_type, COUNT(*)
FROM collections
GROUP BY collection_type;

-- Verify RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN ('sneaker_specs', 'purse_specs');
-- Should show policies for both tables

-- Check indexes exist
SELECT tablename, indexname
FROM pg_indexes
WHERE indexname LIKE '%collection_id%';
-- Should show indexes on trips, events, water_usage, etc.
```

### Step 8.5: Rollback Plan

If issues occur:

```bash
# 1. Revert to previous deployment
npm run deploy:rollback

# 2. Rollback database migration
# Create rollback migration
cat > supabase/migrations/20260113000001_rollback_multi_collection.sql << EOF
-- Remove collection_id from tables
ALTER TABLE trips DROP COLUMN collection_id;
ALTER TABLE events DROP COLUMN collection_id;
ALTER TABLE water_usage DROP COLUMN collection_id;
ALTER TABLE wishlist DROP COLUMN collection_id;
ALTER TABLE personal_notes DROP COLUMN collection_id;
ALTER TABLE collection_insights DROP COLUMN collection_id;
ALTER TABLE collection_gap_suggestions DROP COLUMN collection_id;

-- Drop specs tables
DROP TABLE sneaker_specs;
DROP TABLE purse_specs;

-- Remove collection_type column
ALTER TABLE collections DROP COLUMN collection_type;

-- Drop enum type
DROP TYPE collection_type;
EOF

# 3. Apply rollback
npx supabase db push

# 4. Restore from backup if needed
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

---

## Troubleshooting

### Issue: Collection Type Not Displaying

**Symptoms**: UI shows "undefined" or default values

**Solution**:
1. Check `useCollectionData` hook includes `collection_type` in select query
2. Verify `CollectionContext` properly extracts `collection_type`
3. Check browser console for TypeScript errors

### Issue: Items Not Filtering by Collection

**Symptoms**: Users see items from other collections

**Solution**:
1. Verify hooks pass `collectionId` parameter
2. Check RLS policies are enabled on tables
3. Verify `collection_id` column exists and is populated

### Issue: Type-Specific Fields Not Saving

**Symptoms**: Sneaker/purse specific fields not persisting

**Solution**:
1. Check form submission includes specs table insert
2. Verify `watch_id` foreign key is correctly set
3. Check RLS policies allow insert on specs tables

### Issue: Performance Degradation

**Symptoms**: Slow query performance

**Solution**:
1. Verify indexes exist on `collection_id` columns
2. Add composite indexes if needed
3. Check query explain plans
4. Consider materializing views for complex queries

---

## Next Steps

After completing implementation:

1. **User Documentation**: Update user-facing docs with multi-collection features
2. **Feature Announcements**: Communicate new capabilities to users
3. **Monitoring**: Set up monitoring for collection type usage
4. **Feedback Collection**: Gather user feedback on new collection types
5. **Future Enhancements**: Plan additional collection types based on demand

---

## Support

For questions or issues:

- Open GitHub issue with `[Multi-Collection]` tag
- Check FAQ.md for common questions
- Review ARCHITECTURE.md for design decisions
- Consult API_REFERENCE.md for hook signatures

---

## Conclusion

This implementation guide provides a comprehensive roadmap for adding multi-collection support. Follow each phase carefully, test thoroughly, and maintain backward compatibility throughout the process.

Happy coding! 🚀
