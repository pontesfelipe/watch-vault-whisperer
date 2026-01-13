# API Reference

## Overview

This document provides technical reference for hooks, contexts, utilities, and components in the multi-collection platform.

## Table of Contents

1. [Contexts](#contexts)
2. [Hooks](#hooks)
3. [Types](#types)
4. [Utilities](#utilities)
5. [Components](#components)

---

## Contexts

### CollectionContext

Manages the currently selected collection and provides collection type configuration.

**Location**: `src/contexts/CollectionContext.tsx`

#### Interface

```typescript
interface CollectionContextType {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string) => void;
  currentCollection: Collection | undefined;
  currentCollectionType: CollectionType; // 'watches' | 'sneakers' | 'purses'
  currentCollectionConfig: CollectionTypeConfig;
  collections: Collection[];
  collectionsLoading: boolean;
  refetchCollections: () => Promise<void>;
}
```

#### Usage

```typescript
import { useCollection } from '@/contexts/CollectionContext';

function MyComponent() {
  const {
    selectedCollectionId,
    currentCollectionType,
    currentCollectionConfig,
    collections
  } = useCollection();

  // Use collection type for conditional logic
  if (currentCollectionType === 'watches') {
    // Show watch-specific features
  }

  // Use collection config for dynamic labels
  return <h1>{currentCollectionConfig.plural}</h1>;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `selectedCollectionId` | `string \| null` | ID of currently selected collection |
| `setSelectedCollectionId` | `(id: string) => void` | Function to switch collections |
| `currentCollection` | `Collection \| undefined` | Full collection object for selected collection |
| `currentCollectionType` | `CollectionType` | Type of current collection (watches/sneakers/purses) |
| `currentCollectionConfig` | `CollectionTypeConfig` | Configuration object for current type |
| `collections` | `Collection[]` | All collections accessible to user |
| `collectionsLoading` | `boolean` | Loading state for collections fetch |
| `refetchCollections` | `() => Promise<void>` | Refetch collections from database |

---

## Hooks

### useCollectionData()

Fetches all collections accessible to the current user.

**Location**: `src/hooks/useCollectionData.ts`

#### Signature

```typescript
function useCollectionData(): {
  collections: Collection[];
  loading: boolean;
  refetch: () => Promise<void>;
}
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `collections` | `Collection[]` | Array of collections with role information |
| `loading` | `boolean` | Loading state |
| `refetch` | `() => Promise<void>` | Function to refetch data |

#### Example

```typescript
import { useCollectionData } from '@/hooks/useCollectionData';

function CollectionList() {
  const { collections, loading, refetch } = useCollectionData();

  if (loading) return <Spinner />;

  return (
    <div>
      {collections.map(collection => (
        <div key={collection.id}>
          {collection.name} ({collection.collection_type})
          - Role: {collection.role}
        </div>
      ))}
    </div>
  );
}
```

---

### useItemData()

Fetches items for a specific collection, including type-specific specs.

**Location**: `src/hooks/useItemData.ts` (to be created)

#### Signature

```typescript
function useItemData(
  collectionId: string | null,
  collectionType: CollectionType
): {
  items: CollectionItem[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | `string \| null` | Collection ID to fetch items for |
| `collectionType` | `CollectionType` | Type of collection (determines which specs to fetch) |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `items` | `CollectionItem[]` | Array of items with type-specific fields merged |
| `isLoading` | `boolean` | Loading state |
| `refetch` | `() => Promise<void>` | Function to refetch data |

#### Example

```typescript
import { useItemData } from '@/hooks/useItemData';
import { useCollection } from '@/contexts/CollectionContext';

function ItemList() {
  const { selectedCollectionId, currentCollectionType } = useCollection();
  const { items, isLoading } = useItemData(selectedCollectionId, currentCollectionType);

  if (isLoading) return <Spinner />;

  return (
    <div>
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

---

### useTripData()

Fetches trips for a specific collection.

**Location**: `src/hooks/useTripData.ts`

#### Signature

```typescript
function useTripData(collectionId: string | null): {
  trips: Trip[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | `string \| null` | Collection ID to filter trips by |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `trips` | `Trip[]` | Array of trips for the collection |
| `isLoading` | `boolean` | Loading state |
| `refetch` | `() => Promise<void>` | Function to refetch data |

---

### useEventData()

Fetches events for a specific collection.

**Location**: `src/hooks/useEventData.ts`

#### Signature

```typescript
function useEventData(collectionId: string | null): {
  events: Event[];
  isLoading: boolean;
  refetch: () => Promise<void>;
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | `string \| null` | Collection ID to filter events by |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `events` | `Event[]` | Array of events for the collection |
| `isLoading` | `boolean` | Loading state |
| `refetch` | `() => Promise<void>` | Function to refetch data |

---

### useStatsCalculations()

Calculates statistics for a collection with type-aware labels.

**Location**: `src/hooks/useStatsCalculations.ts`

#### Signature

```typescript
function useStatsCalculations(
  collectionId: string | null,
  collectionType: CollectionType
): {
  totalItems: number;
  totalValue: number;
  mostWornItem: CollectionItem | null;
  avgWear: number;
  labels: {
    totalItems: string;
    mostUsed: string;
    avgUsage: string;
  };
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `collectionId` | `string \| null` | Collection ID to calculate stats for |
| `collectionType` | `CollectionType` | Type of collection (affects labels) |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `totalItems` | `number` | Total number of items |
| `totalValue` | `number` | Sum of all purchase costs |
| `mostWornItem` | `CollectionItem \| null` | Item with highest wear count |
| `avgWear` | `number` | Average days worn per item |
| `labels` | `object` | Type-specific labels for stats |

#### Example

```typescript
import { useStatsCalculations } from '@/hooks/useStatsCalculations';
import { useCollection } from '@/contexts/CollectionContext';

function Dashboard() {
  const { selectedCollectionId, currentCollectionType } = useCollection();
  const { totalItems, totalValue, mostWornItem, labels } = useStatsCalculations(
    selectedCollectionId,
    currentCollectionType
  );

  return (
    <div>
      <StatsCard title={labels.totalItems} value={totalItems} />
      <StatsCard title="Total Value" value={`$${totalValue.toLocaleString()}`} />
      {mostWornItem && (
        <StatsCard title={labels.mostUsed} value={`${mostWornItem.brand} ${mostWornItem.model}`} />
      )}
    </div>
  );
}
```

---

## Types

### CollectionType

Union type for supported collection types.

```typescript
type CollectionType = 'watches' | 'sneakers' | 'purses';
```

---

### Collection

Interface for collection objects.

```typescript
interface Collection {
  id: string;
  name: string;
  collection_type: CollectionType;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: 'owner' | 'editor' | 'viewer'; // User's role in this collection
  ownerName?: string; // For admin view
  ownerEmail?: string; // For admin view
}
```

---

### CollectionTypeConfig

Configuration object defining behavior for each collection type.

```typescript
interface CollectionTypeConfig {
  type: CollectionType;
  singular: string;        // "Watch", "Sneaker", "Purse"
  plural: string;          // "Watches", "Sneakers", "Purses"
  icon: string;            // Emoji or icon identifier
  primaryFields: string[]; // Fields to show in cards/lists
  detailFields: string[];  // Fields to show in detail view
  formFields: string[];    // Fields to show in add/edit forms
  statsLabels: {
    totalItems: string;    // "Total Watches"
    mostUsed: string;      // "Most Worn Watch"
    avgUsage: string;      // "Avg Days/Watch"
  };
}
```

---

### BaseItem

Base interface for all collection items.

```typescript
interface BaseItem {
  id: string;
  collection_id: string;
  user_id: string;
  brand: string;
  model: string;
  cost: number;
  msrp?: number;
  image_url?: string;
  ai_image_url?: string;
  metadata_analysis_reasoning?: string;
  status: 'active' | 'sold' | 'traded';
  when_bought?: string;
  warranty_date?: string;
  warranty_card_url?: string;
  available_for_trade: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

---

### Watch

Watch-specific interface extending BaseItem.

```typescript
interface Watch extends BaseItem {
  dial_color?: string;
  case_size?: number;
  lug_to_lug_size?: number;
  caseback_material?: string;
  type?: string;
  movement?: string;
  has_sapphire?: boolean;
  average_resale_price?: number;
  rarity?: string;
  historical_significance?: string;
}
```

---

### Sneaker

Sneaker-specific interface extending BaseItem.

```typescript
interface Sneaker extends BaseItem {
  colorway?: string;
  shoe_size?: number;
  size_type?: 'US' | 'UK' | 'EU';
  release_date?: string;
  retail_price?: number;
  sku?: string;
  style_code?: string;
  collaboration?: string;
  limited_edition?: boolean;
  condition?: 'deadstock' | 'vnds' | 'used';
  box_included?: boolean;
  og_all?: boolean;
}
```

---

### Purse

Purse-specific interface extending BaseItem.

```typescript
interface Purse extends BaseItem {
  material?: string;
  hardware_color?: string;
  condition?: 'pristine' | 'excellent' | 'good' | 'fair';
  authenticity_verified?: boolean;
  serial_number?: string;
  dust_bag_included?: boolean;
  authenticity_card?: boolean;
  original_receipt?: boolean;
  size_category?: 'mini' | 'small' | 'medium' | 'large';
  closure_type?: string;
  strap_type?: string;
  interior_color?: string;
  number_of_compartments?: number;
}
```

---

### CollectionItem

Union type for any collection item.

```typescript
type CollectionItem = Watch | Sneaker | Purse;
```

---

## Utilities

### getCollectionConfig()

Returns configuration object for a collection type.

**Location**: `src/types/collection.ts`

#### Signature

```typescript
function getCollectionConfig(type: CollectionType): CollectionTypeConfig
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `CollectionType` | Type of collection |

#### Returns

`CollectionTypeConfig` - Configuration object for the type

#### Example

```typescript
import { getCollectionConfig } from '@/types/collection';

const config = getCollectionConfig('watches');
console.log(config.singular); // "Watch"
console.log(config.plural); // "Watches"
console.log(config.icon); // "⌚"
console.log(config.statsLabels.totalItems); // "Total Watches"
```

---

### getItemTypeLabel()

Returns singular or plural label for a collection type.

**Location**: `src/types/collection.ts`

#### Signature

```typescript
function getItemTypeLabel(type: CollectionType, count?: number): string
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | `CollectionType` | - | Type of collection |
| `count` | `number` | `1` | Item count (determines singular/plural) |

#### Returns

`string` - Singular label if count === 1, plural otherwise

#### Example

```typescript
import { getItemTypeLabel } from '@/types/collection';

getItemTypeLabel('watches', 1); // "Watch"
getItemTypeLabel('watches', 5); // "Watches"
getItemTypeLabel('sneakers'); // "Sneaker" (default count = 1)
```

---

## Components

### DynamicItemCard

Renders an item card with type-specific layout and fields.

**Location**: `src/components/DynamicItemCard.tsx` (to be created)

#### Props

```typescript
interface DynamicItemCardProps {
  item: CollectionItem;
  onClick?: () => void;
  showTradeStatus?: boolean;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `item` | `CollectionItem` | - | Item to display |
| `onClick` | `() => void` | - | Click handler |
| `showTradeStatus` | `boolean` | `true` | Show "Available for Trade" badge |

#### Example

```typescript
import { DynamicItemCard } from '@/components/DynamicItemCard';

function ItemList({ items }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <DynamicItemCard
          key={item.id}
          item={item}
          onClick={() => navigate(`/item/${item.id}`)}
        />
      ))}
    </div>
  );
}
```

---

### DynamicItemForm

Renders an item form with type-specific fields and validation.

**Location**: `src/components/DynamicItemForm.tsx` (to be created)

#### Props

```typescript
interface DynamicItemFormProps {
  collectionType: CollectionType;
  defaultValues?: Partial<CollectionItem>;
  onSubmit: (data: CollectionItem) => void;
  onCancel?: () => void;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `collectionType` | `CollectionType` | - | Type of collection (determines form fields) |
| `defaultValues` | `Partial<CollectionItem>` | - | Default values for edit mode |
| `onSubmit` | `(data: CollectionItem) => void` | - | Submit handler |
| `onCancel` | `() => void` | - | Cancel handler |

#### Example

```typescript
import { DynamicItemForm } from '@/components/DynamicItemForm';
import { useCollection } from '@/contexts/CollectionContext';

function AddItemDialog() {
  const { currentCollectionType, selectedCollectionId } = useCollection();

  const handleSubmit = async (data) => {
    await supabase.from('watches').insert({
      ...data,
      collection_id: selectedCollectionId,
      user_id: user.id
    });
  };

  return (
    <Dialog>
      <DialogContent>
        <DynamicItemForm
          collectionType={currentCollectionType}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

### CollectionSwitcher

Dropdown component for switching between collections.

**Location**: `src/components/CollectionSwitcher.tsx`

#### Props

```typescript
interface CollectionSwitcherProps {
  className?: string;
}
```

#### Example

```typescript
import { CollectionSwitcher } from '@/components/CollectionSwitcher';

function Navigation() {
  return (
    <nav>
      <CollectionSwitcher className="w-64" />
    </nav>
  );
}
```

---

### CreateCollectionDialog

Dialog for creating new collections with type selection.

**Location**: `src/components/CreateCollectionDialog.tsx` (to be created)

#### Props

```typescript
interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collection: Collection) => void;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Dialog open state |
| `onOpenChange` | `(open: boolean) => void` | - | State change handler |
| `onSuccess` | `(collection: Collection) => void` | - | Success callback with created collection |

#### Example

```typescript
import { CreateCollectionDialog } from '@/components/CreateCollectionDialog';

function CollectionList() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Collection
      </Button>
      <CreateCollectionDialog
        open={open}
        onOpenChange={setOpen}
        onSuccess={(collection) => {
          toast.success(`Created ${collection.name}!`);
          navigate(`/collection/${collection.id}`);
        }}
      />
    </>
  );
}
```

---

## Constants

### COLLECTION_TYPE_CONFIGS

Object mapping collection types to their configurations.

**Location**: `src/types/collection.ts`

#### Type

```typescript
const COLLECTION_TYPE_CONFIGS: Record<CollectionType, CollectionTypeConfig>
```

#### Usage

```typescript
import { COLLECTION_TYPE_CONFIGS } from '@/types/collection';

// Get all collection types
const types = Object.keys(COLLECTION_TYPE_CONFIGS); // ['watches', 'sneakers', 'purses']

// Iterate over configurations
Object.values(COLLECTION_TYPE_CONFIGS).forEach(config => {
  console.log(`${config.icon} ${config.plural}`);
});
// ⌚ Watches
// 👟 Sneakers
// 👜 Purses
```

---

## Database Queries

### Fetching Items with Specs

When fetching items, you may need to join with type-specific specs tables:

```typescript
// For sneakers
const { data: sneakers } = await supabase
  .from('watches')
  .select(`
    *,
    sneaker_specs (*)
  `)
  .eq('collection_id', collectionId);

// For purses
const { data: purses } = await supabase
  .from('watches')
  .select(`
    *,
    purse_specs (*)
  `)
  .eq('collection_id', collectionId);

// For watches (no additional specs table)
const { data: watches } = await supabase
  .from('watches')
  .select('*')
  .eq('collection_id', collectionId);
```

### Creating Items with Specs

When creating sneakers or purses, insert into both tables:

```typescript
// Create sneaker
const { data: item, error: itemError } = await supabase
  .from('watches')
  .insert({
    collection_id,
    user_id,
    brand,
    model,
    cost
  })
  .select()
  .single();

if (!itemError && item) {
  await supabase
    .from('sneaker_specs')
    .insert({
      watch_id: item.id,
      colorway,
      shoe_size,
      size_type,
      sku
    });
}
```

---

## Migration Helpers

### Checking Collection Type

When refactoring existing components, check collection type:

```typescript
import { useCollection } from '@/contexts/CollectionContext';

function MyComponent() {
  const { currentCollectionType } = useCollection();

  // Conditional features
  if (currentCollectionType === 'watches') {
    return <WaterResistanceFeature />;
  }

  if (currentCollectionType === 'sneakers') {
    return <SizeConversionHelper />;
  }

  if (currentCollectionType === 'purses') {
    return <AuthenticityVerification />;
  }

  return null;
}
```

### Dynamic Labels

Replace hardcoded strings with dynamic labels:

```typescript
import { useCollection } from '@/contexts/CollectionContext';

function MyComponent() {
  const { currentCollectionConfig } = useCollection();

  return (
    <>
      {/* Before */}
      <h1>My Watches</h1>

      {/* After */}
      <h1>My {currentCollectionConfig.plural}</h1>
    </>
  );
}
```

---

## Best Practices

### 1. Always Use Collection Context

```typescript
// ✅ Good
import { useCollection } from '@/contexts/CollectionContext';

function MyComponent() {
  const { selectedCollectionId, currentCollectionType } = useCollection();
  // Use these values
}

// ❌ Bad - Don't access localStorage directly
function MyComponent() {
  const collectionId = localStorage.getItem('selectedCollectionId');
}
```

### 2. Type-Specific Logic

```typescript
// ✅ Good - Use type checking
if (currentCollectionType === 'watches') {
  // Watch-specific logic
}

// ❌ Bad - Don't assume type
function MyComponent({ item }) {
  // Assumes item is always a watch
  return <div>{item.dial_color}</div>; // Breaks for sneakers/purses
}
```

### 3. Hook Dependencies

```typescript
// ✅ Good - Include all dependencies
const { items } = useItemData(selectedCollectionId, currentCollectionType);

// ❌ Bad - Missing collectionType
const { items } = useItemData(selectedCollectionId);
```

### 4. Null Safety

```typescript
// ✅ Good - Handle null collection
const { selectedCollectionId } = useCollection();

if (!selectedCollectionId) {
  return <CreateFirstCollection />;
}

// Proceed with collection operations

// ❌ Bad - Assume collection exists
const { items } = useItemData(selectedCollectionId); // May pass null
```

---

## Conclusion

This API reference provides a comprehensive overview of the multi-collection platform's technical interfaces. For implementation guidance, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).

For user documentation, see [USER_GUIDE.md](./USER_GUIDE.md).

For frequently asked questions, see [FAQ.md](./FAQ.md).
