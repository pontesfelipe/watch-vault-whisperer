# Multi-Collection Implementation Guide for Lovable

## 🎯 Overview

Transform the Watch Vault Whisperer into a multi-collection platform supporting:
- ⌚ **Watches** (existing, enhanced)
- 👟 **Sneakers** (new)
- 👜 **Purses** (new)

**Status**: Foundation complete (database migration, types, context). Need UI implementation.

---

## 📋 Table of Contents

1. [Current State](#current-state)
2. [Required Changes](#required-changes)
3. [Implementation Steps](#implementation-steps)
4. [Code to Implement](#code-to-implement)
5. [Testing Checklist](#testing-checklist)
6. [Deployment](#deployment)

---

## Current State

### ✅ Already Completed

1. **Database Migration** (`supabase/migrations/20260113000000_add_multi_collection_support.sql`)
   - Added `collection_type` enum
   - Created `sneaker_specs` and `purse_specs` tables
   - Added `collection_id` to feature tables
   - Set up RLS policies

2. **TypeScript Types** (`src/types/collection.ts`)
   - Full type system for all collection types
   - Configuration constants
   - Utility functions

3. **Context Updates**
   - `CollectionContext` enhanced with type awareness
   - `useCollectionData` includes collection_type

### 🔄 Needs Implementation

- Hook refactoring (useItemData, useTripData, etc.)
- Dynamic UI components
- Forms with type-specific fields
- Dashboard updates
- Collection type selector

---

## Required Changes

### Phase 1: Data Layer (Hooks)

**Files to Create/Update:**
1. `src/hooks/useItemData.ts` - Fetch items with type-specific specs
2. `src/hooks/useTripData.ts` - Add collection filtering
3. `src/hooks/useEventData.ts` - Add collection filtering
4. `src/hooks/useWaterUsageData.ts` - Add collection filtering
5. `src/hooks/useStatsCalculations.ts` - Type-aware statistics

### Phase 2: UI Components

**Files to Create:**
1. `src/components/DynamicItemCard.tsx` - Type-aware item display
2. `src/components/DynamicItemForm.tsx` - Type-specific forms
3. `src/components/CreateCollectionDialog.tsx` - Collection type selector
4. `src/components/ItemTypeIcon.tsx` - Type-specific icons

**Files to Update:**
1. `src/pages/Collection.tsx` - Use dynamic components
2. `src/pages/Dashboard.tsx` - Type-aware metrics
3. `src/pages/WatchDetail.tsx` → `src/pages/ItemDetail.tsx` - Generic item details
4. `src/components/AddWatchDialog.tsx` - Make type-aware

### Phase 3: Forms & Validation

**Files to Create:**
1. `src/lib/schemas/watchSchema.ts` - Watch validation
2. `src/lib/schemas/sneakerSchema.ts` - Sneaker validation
3. `src/lib/schemas/purseSchema.ts` - Purse validation
4. `src/lib/schemas/index.ts` - Schema selector

---

## Implementation Steps

### Step 1: Apply Database Migration

```bash
# Using Supabase CLI
npx supabase db push

# Or via Supabase Dashboard
# Upload: supabase/migrations/20260113000000_add_multi_collection_support.sql
```

**Verify migration:**
```sql
SELECT enum_range(NULL::collection_type);
-- Should return: {watches,sneakers,purses}
```

### Step 2: Implement Data Hooks

See [Code Section](#code-to-implement) below for complete implementations.

### Step 3: Create UI Components

See [Code Section](#code-to-implement) below for complete implementations.

### Step 4: Update Existing Pages

See [Code Section](#code-to-implement) below for complete implementations.

### Step 5: Testing

Run through [Testing Checklist](#testing-checklist) below.

---

## Code to Implement

### 1. useItemData Hook

**File**: `src/hooks/useItemData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CollectionType, CollectionItem } from '@/types/collection';

export const useItemData = (
  collectionId: string | null,
  collectionType: CollectionType
) => {
  const { user } = useAuth();

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ['items', collectionId, collectionType],
    queryFn: async (): Promise<CollectionItem[]> => {
      if (!collectionId || !user) return [];

      // Fetch base items
      const { data: itemsData, error } = await supabase
        .from('watches')
        .select('*')
        .eq('collection_id', collectionId)
        .eq('status', 'active')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (!itemsData) return [];

      // Fetch type-specific specs
      if (collectionType === 'sneakers') {
        const { data: specs } = await supabase
          .from('sneaker_specs')
          .select('*')
          .in('watch_id', itemsData.map(i => i.id));

        return itemsData.map(item => ({
          ...item,
          ...(specs?.find(s => s.watch_id === item.id) || {})
        }));
      }

      if (collectionType === 'purses') {
        const { data: specs } = await supabase
          .from('purse_specs')
          .select('*')
          .in('watch_id', itemsData.map(i => i.id));

        return itemsData.map(item => ({
          ...item,
          ...(specs?.find(s => s.watch_id === item.id) || {})
        }));
      }

      return itemsData;
    },
    enabled: !!collectionId && !!user,
  });

  return {
    items: items || [],
    isLoading,
    refetch
  };
};
```

---

### 2. Update useTripData Hook

**File**: `src/hooks/useTripData.ts`

**Find and replace:**

```typescript
// OLD:
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('user_id', user.id) // Remove this
  .order('start_date', { ascending: false });

// NEW:
const { data, error } = await supabase
  .from('trips')
  .select('*')
  .eq('collection_id', collectionId) // Add collection filter
  .order('start_date', { ascending: false });
```

**Complete updated hook:**

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
        .eq('collection_id', collectionId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId && !!user,
  });

  return { trips: trips || [], isLoading, refetch };
};
```

---

### 3. Update useEventData Hook

**File**: `src/hooks/useEventData.ts`

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
        .eq('collection_id', collectionId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collectionId && !!user,
  });

  return { events: events || [], isLoading, refetch };
};
```

---

### 4. Update useStatsCalculations Hook

**File**: `src/hooks/useStatsCalculations.ts`

```typescript
import { useItemData } from './useItemData';
import { useWearData } from './useWearData';
import { CollectionType, getCollectionConfig } from '@/types/collection';

export const useStatsCalculations = (
  collectionId: string | null,
  collectionType: CollectionType
) => {
  const { items } = useItemData(collectionId, collectionType);
  const { wearEntries } = useWearData(collectionId);
  const config = getCollectionConfig(collectionType);

  // Calculate stats
  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (item.cost || 0), 0);

  // Most worn item
  const wearCounts = items.map(item => ({
    item,
    totalWear: wearEntries
      .filter(w => w.watch_id === item.id)
      .reduce((sum, w) => sum + w.days, 0)
  }));

  const mostWornItem = wearCounts.length > 0
    ? wearCounts.reduce((max, curr) =>
        curr.totalWear > max.totalWear ? curr : max
      )
    : { item: null, totalWear: 0 };

  const totalWear = wearEntries.reduce((sum, w) => sum + w.days, 0);
  const avgWear = totalItems > 0 ? totalWear / totalItems : 0;

  return {
    totalItems,
    totalValue,
    mostWornItem: mostWornItem.item,
    avgWear,
    labels: config.statsLabels
  };
};
```

---

### 5. DynamicItemCard Component

**File**: `src/components/DynamicItemCard.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { CollectionItem } from '@/types/collection';
import { Card } from '@/components/ui/card';

interface DynamicItemCardProps {
  item: CollectionItem;
  onClick?: () => void;
}

export const DynamicItemCard = ({ item, onClick }: DynamicItemCardProps) => {
  const { currentCollectionType } = useCollection();

  const renderTypeSpecificInfo = () => {
    if (currentCollectionType === 'watches') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            {item.dial_color} • {item.type}
          </p>
          {item.case_size && (
            <p className="text-xs">Case: {item.case_size}mm</p>
          )}
        </>
      );
    }

    if (currentCollectionType === 'sneakers') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            {item.colorway}
          </p>
          {item.shoe_size && (
            <p className="text-xs">
              Size: {item.shoe_size} {item.size_type}
            </p>
          )}
          {item.condition && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
              {item.condition.toUpperCase()}
            </span>
          )}
        </>
      );
    }

    if (currentCollectionType === 'purses') {
      return (
        <>
          <p className="text-sm text-muted-foreground">
            {item.material} • {item.hardware_color} hardware
          </p>
          {item.size_category && (
            <p className="text-xs">Size: {item.size_category}</p>
          )}
          {item.authenticity_verified && (
            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
              ✓ Authenticated
            </span>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {item.image_url && (
        <div className="aspect-square overflow-hidden">
          <img
            src={item.image_url}
            alt={`${item.brand} ${item.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg">
          {item.brand}
        </h3>
        <p className="text-muted-foreground">{item.model}</p>

        {renderTypeSpecificInfo()}

        <div className="flex justify-between items-center pt-2 border-t">
          <span className="font-medium">
            ${item.cost?.toLocaleString()}
          </span>
          {item.available_for_trade && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              For Trade
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
```

---

### 6. DynamicItemForm Component

**File**: `src/components/DynamicItemForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCollection } from '@/contexts/CollectionContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Base schema
const baseItemSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  cost: z.coerce.number().positive("Cost must be positive"),
  msrp: z.coerce.number().optional(),
  when_bought: z.string().optional(),
});

// Watch schema
const watchSchema = baseItemSchema.extend({
  dial_color: z.string().optional(),
  case_size: z.coerce.number().optional(),
  movement: z.string().optional(),
  type: z.string().optional(),
  has_sapphire: z.boolean().optional(),
});

// Sneaker schema
const sneakerSchema = baseItemSchema.extend({
  colorway: z.string().optional(),
  shoe_size: z.coerce.number().optional(),
  size_type: z.enum(['US', 'UK', 'EU']).optional(),
  sku: z.string().optional(),
  style_code: z.string().optional(),
  condition: z.enum(['deadstock', 'vnds', 'used']).optional(),
  box_included: z.boolean().optional(),
  og_all: z.boolean().optional(),
});

// Purse schema
const purseSchema = baseItemSchema.extend({
  material: z.string().optional(),
  hardware_color: z.string().optional(),
  size_category: z.enum(['mini', 'small', 'medium', 'large']).optional(),
  authenticity_verified: z.boolean().optional(),
  serial_number: z.string().optional(),
  dust_bag_included: z.boolean().optional(),
});

interface DynamicItemFormProps {
  defaultValues?: any;
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

export const DynamicItemForm = ({
  defaultValues,
  onSubmit,
  onCancel
}: DynamicItemFormProps) => {
  const { currentCollectionType, currentCollectionConfig } = useCollection();

  // Select schema based on collection type
  const schema =
    currentCollectionType === 'watches' ? watchSchema :
    currentCollectionType === 'sneakers' ? sneakerSchema :
    purseSchema;

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
  });

  const renderWatchFields = () => (
    <>
      <FormField
        control={form.control}
        name="dial_color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dial Color</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Blue, Black, White..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="case_size"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Case Size (mm)</FormLabel>
            <FormControl>
              <Input type="number" {...field} placeholder="40" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="movement"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Movement</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select movement" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="automatic">Automatic</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="quartz">Quartz</SelectItem>
                <SelectItem value="smartwatch">Smartwatch</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Diver, Dress, Sport..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  const renderSneakerFields = () => (
    <>
      <FormField
        control={form.control}
        name="colorway"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Colorway</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Chicago, Bred, Triple White..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="shoe_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size</FormLabel>
              <FormControl>
                <Input type="number" step="0.5" {...field} placeholder="10" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="size_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Region</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="US/UK/EU" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="sku"
        render={({ field }) => (
          <FormItem>
            <FormLabel>SKU / Style Code</FormLabel>
            <FormControl>
              <Input {...field} placeholder="555088-101" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="condition"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Condition</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="deadstock">Deadstock (DS)</SelectItem>
                <SelectItem value="vnds">VNDS</SelectItem>
                <SelectItem value="used">Used</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormField
          control={form.control}
          name="box_included"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Original Box Included</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="og_all"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">OG All (Box, Laces, Receipt, etc.)</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </>
  );

  const renderPurseFields = () => (
    <>
      <FormField
        control={form.control}
        name="material"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Material</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Leather, Canvas, Synthetic..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hardware_color"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hardware Color</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select hardware" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="rose_gold">Rose Gold</SelectItem>
                <SelectItem value="gunmetal">Gunmetal</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="size_category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Size Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="mini">Mini</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="serial_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Serial Number</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Serial number..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <FormField
          control={form.control}
          name="authenticity_verified"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Authenticity Verified</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dust_bag_included"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className="!mt-0">Dust Bag Included</FormLabel>
            </FormItem>
          )}
        />
      </div>
    </>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Common fields */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Rolex, Nike, Louis Vuitton..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Submariner, Air Jordan 1..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost *</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="5000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="msrp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MSRP</FormLabel>
                <FormControl>
                  <Input type="number" {...field} placeholder="8000" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="when_bought"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type-specific fields */}
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-4">
            {currentCollectionConfig.singular} Details
          </h3>

          {currentCollectionType === 'watches' && renderWatchFields()}
          {currentCollectionType === 'sneakers' && renderSneakerFields()}
          {currentCollectionType === 'purses' && renderPurseFields()}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            Save {currentCollectionConfig.singular}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
```

---

### 7. CreateCollectionDialog Component

**File**: `src/components/CreateCollectionDialog.tsx`

```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { COLLECTION_TYPE_CONFIGS, CollectionType } from '@/types/collection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateCollectionDialog = ({
  open,
  onOpenChange,
  onSuccess
}: CreateCollectionDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [collectionType, setCollectionType] = useState<CollectionType>('watches');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Create collection
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .insert({
          name,
          collection_type: collectionType,
          created_by: user.id
        })
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Add user as owner
      const { error: userCollectionError } = await supabase
        .from('user_collections')
        .insert({
          user_id: user.id,
          collection_id: collection.id,
          role: 'owner'
        });

      if (userCollectionError) throw userCollectionError;

      toast.success(`${COLLECTION_TYPE_CONFIGS[collectionType].singular} collection created!`);
      setName('');
      setCollectionType('watches');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Choose what type of collection you want to create
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Collection"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Collection Type</Label>
            <RadioGroup value={collectionType} onValueChange={(value) => setCollectionType(value as CollectionType)}>
              {Object.values(COLLECTION_TYPE_CONFIGS).map(config => (
                <div key={config.type} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <RadioGroupItem value={config.type} id={config.type} className="mt-1" />
                  <label htmlFor={config.type} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{config.icon}</span>
                      <span className="font-medium">{config.plural}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track your {config.plural.toLowerCase()} collection with specialized features
                    </p>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating...' : 'Create Collection'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
```

---

### 8. Update Collection Page

**File**: `src/pages/Collection.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { useItemData } from '@/hooks/useItemData';
import { DynamicItemCard } from '@/components/DynamicItemCard';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DynamicItemForm } from '@/components/DynamicItemForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const Collection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    selectedCollectionId,
    currentCollectionType,
    currentCollectionConfig
  } = useCollection();

  const { items, isLoading, refetch } = useItemData(
    selectedCollectionId,
    currentCollectionType
  );

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleAddItem = async (formData: any) => {
    if (!selectedCollectionId || !user) return;

    try {
      // Insert base item
      const { data: item, error: itemError } = await supabase
        .from('watches')
        .insert({
          ...formData,
          collection_id: selectedCollectionId,
          user_id: user.id,
          status: 'active',
          sort_order: items.length
        })
        .select()
        .single();

      if (itemError) throw itemError;

      // Insert type-specific specs
      if (currentCollectionType === 'sneakers') {
        const { error: specsError } = await supabase
          .from('sneaker_specs')
          .insert({
            watch_id: item.id,
            colorway: formData.colorway,
            shoe_size: formData.shoe_size,
            size_type: formData.size_type,
            sku: formData.sku,
            style_code: formData.style_code,
            condition: formData.condition,
            box_included: formData.box_included,
            og_all: formData.og_all
          });

        if (specsError) throw specsError;
      } else if (currentCollectionType === 'purses') {
        const { error: specsError } = await supabase
          .from('purse_specs')
          .insert({
            watch_id: item.id,
            material: formData.material,
            hardware_color: formData.hardware_color,
            size_category: formData.size_category,
            authenticity_verified: formData.authenticity_verified,
            serial_number: formData.serial_number,
            dust_bag_included: formData.dust_bag_included
          });

        if (specsError) throw specsError;
      }

      toast.success(`${currentCollectionConfig.singular} added successfully!`);
      setAddDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span className="text-4xl">{currentCollectionConfig.icon}</span>
          My {currentCollectionConfig.plural}
        </h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add {currentCollectionConfig.singular}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">
            No {currentCollectionConfig.plural.toLowerCase()} yet.
          </p>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Your First {currentCollectionConfig.singular}
          </Button>
        </div>
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add {currentCollectionConfig.singular}
            </DialogTitle>
          </DialogHeader>
          <DynamicItemForm
            onSubmit={handleAddItem}
            onCancel={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

---

### 9. Update Dashboard Page

**File**: `src/pages/Dashboard.tsx`

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { useStatsCalculations } from '@/hooks/useStatsCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicItemCard } from '@/components/DynamicItemCard';

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
      <div className="flex items-center gap-2 mb-8">
        <span className="text-4xl">{currentCollectionConfig.icon}</span>
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {labels.totalItems}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {labels.avgUsage}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {avgWear.toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Worn Item */}
      {mostWornItem && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{labels.mostUsed}</h2>
          <div className="max-w-sm">
            <DynamicItemCard item={mostWornItem} />
          </div>
        </div>
      )}

      {/* Additional dashboard sections... */}
    </div>
  );
};
```

---

### 10. Update CollectionSwitcher Component

**File**: `src/components/CollectionSwitcher.tsx` (if it exists, otherwise create it)

```typescript
import { useCollection } from '@/contexts/CollectionContext';
import { COLLECTION_TYPE_CONFIGS } from '@/types/collection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateCollectionDialog } from './CreateCollectionDialog';

export const CollectionSwitcher = () => {
  const {
    selectedCollectionId,
    setSelectedCollectionId,
    collections,
    refetchCollections
  } = useCollection();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={selectedCollectionId || undefined}
          onValueChange={setSelectedCollectionId}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map(collection => {
              const config = COLLECTION_TYPE_CONFIGS[collection.collection_type];
              return (
                <SelectItem key={collection.id} value={collection.id}>
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <span>{collection.name}</span>
                    {collection.role && (
                      <span className="text-xs text-muted-foreground">
                        ({collection.role})
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Button
          size="icon"
          variant="outline"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateCollectionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refetchCollections}
      />
    </>
  );
};
```

---

## Testing Checklist

### Database Testing

- [ ] Migration applies successfully
- [ ] Enum values exist: `{watches,sneakers,purses}`
- [ ] Tables created: `sneaker_specs`, `purse_specs`
- [ ] Indexes exist on `collection_id` columns
- [ ] RLS policies work for new tables

### Collection Management

- [ ] Create watch collection
- [ ] Create sneaker collection
- [ ] Create purse collection
- [ ] Switch between collections
- [ ] Collection switcher shows correct icons
- [ ] Collection type persists on refresh

### Items (Watches)

- [ ] Add watch with watch-specific fields
- [ ] Edit watch
- [ ] Delete watch
- [ ] Watch fields display correctly
- [ ] Movement, case size, dial color save

### Items (Sneakers)

- [ ] Add sneaker with sneaker-specific fields
- [ ] Sneaker specs save to sneaker_specs table
- [ ] Colorway, size, SKU display correctly
- [ ] Condition badge shows correctly
- [ ] Box/OG all checkboxes work

### Items (Purses)

- [ ] Add purse with purse-specific fields
- [ ] Purse specs save to purse_specs table
- [ ] Material, hardware display correctly
- [ ] Authenticity badge shows when verified
- [ ] Serial number saves

### Dashboard

- [ ] Stats show correct values
- [ ] Labels change based on collection type
  - "Total Watches" vs "Total Sneakers" vs "Total Purses"
  - "Most Worn Watch" vs "Most Worn Sneaker" vs "Most Carried Purse"
- [ ] Most used item displays correctly
- [ ] Charts render

### Features

- [ ] Trips filter by collection
- [ ] Events filter by collection
- [ ] Wear logging works
- [ ] Water usage works (watches only)
- [ ] Stats calculations accurate

### UI/UX

- [ ] Forms show correct fields per type
- [ ] Type-specific icons display
- [ ] Dynamic labels everywhere
- [ ] No hardcoded "watch" references visible
- [ ] Mobile responsive

### Performance

- [ ] Page loads < 2 seconds
- [ ] No console errors
- [ ] Images load properly
- [ ] Smooth collection switching

---

## Deployment

### Pre-Deployment

```bash
# 1. Backup database
npx supabase db dump > backup-$(date +%Y%m%d).sql

# 2. Test in staging
npx supabase db push --db-url $STAGING_DATABASE_URL

# 3. Verify staging works
# Test all collection types in staging
```

### Production Deployment

```bash
# 1. Apply migration to production
# Via Supabase Dashboard: Database > Migrations > Upload SQL file

# 2. Verify migration
psql $DATABASE_URL -c "SELECT enum_range(NULL::collection_type)"

# 3. Deploy application
npm run build
npm run deploy

# 4. Verify production
# Test creating collections and adding items
```

### Post-Deployment

```bash
# Monitor for errors
# Check application logs
# Verify users can create collections
# Monitor database performance
```

---

## Rollback Plan

If critical issues occur:

```bash
# 1. Revert application deployment
npm run deploy:rollback

# 2. Rollback database (if needed)
psql $DATABASE_URL -f rollback-migration.sql

# 3. Restore from backup (last resort)
psql $DATABASE_URL < backup-YYYYMMDD.sql
```

---

## Support & Questions

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Full Implementation**: See `docs/IMPLEMENTATION_GUIDE.md`
- **User Guide**: See `docs/USER_GUIDE.md`
- **FAQ**: See `docs/FAQ.md`
- **API Reference**: See `docs/API_REFERENCE.md`

---

## Summary

This guide provides all the code needed to implement multi-collection support. The key changes are:

1. **Database**: Migration already created and ready to apply
2. **Types**: Complete type system in `src/types/collection.ts`
3. **Hooks**: Implement collection-aware data fetching
4. **Components**: Create dynamic, type-aware UI components
5. **Pages**: Update to use dynamic components and labels
6. **Forms**: Type-specific validation and fields

**Total Estimated Implementation Time**: 2-3 weeks

**Priority Order**:
1. Apply database migration
2. Implement hooks (data layer)
3. Create UI components
4. Update pages
5. Test thoroughly
6. Deploy

Good luck! 🚀 ⌚👟👜
