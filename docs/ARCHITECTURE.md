# Multi-Collection Architecture Documentation

## Overview

This document describes the architecture for transforming the Watch Vault Whisperer into a multi-collection platform supporting watches, sneakers/shoes, and purses. The refactoring maintains backward compatibility while enabling users to manage multiple types of collections within a single application.

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Collection Types](#collection-types)
5. [Data Model](#data-model)
6. [Application Layers](#application-layers)
7. [State Management](#state-management)
8. [UI/UX Architecture](#uiux-architecture)
9. [Security & Permissions](#security--permissions)
10. [Migration Strategy](#migration-strategy)

---

## Architecture Principles

### Core Principles

1. **Collection-Type Agnostic Core**: The core application logic should be agnostic to collection types, with type-specific behavior configured through metadata.

2. **Backward Compatibility**: Existing watch collections must continue to work without migration, with all current features preserved.

3. **Extensibility**: The architecture should allow for easy addition of new collection types in the future.

4. **Data Isolation**: Collections are isolated by `collection_id`, ensuring proper data scoping and security.

5. **Type Safety**: TypeScript types ensure compile-time safety across all collection types.

6. **Progressive Enhancement**: Features can be progressively enhanced per collection type without affecting others.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   UI Layer  │  │  State Mgmt  │  │  Business Logic  │   │
│  │  (React)    │◄─┤  (Context)   │◄─┤     (Hooks)      │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│         │                 │                    │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   PostgreSQL     │  │    Row Level Security        │    │
│  │   Database       │  │    (RLS Policies)            │    │
│  └──────────────────┘  └──────────────────────────────┘    │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │   Storage API    │  │    Realtime Subscriptions    │    │
│  │   (Images)       │  │    (Future Enhancement)      │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Application Shell                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Collection Context Provider            │    │
│  │  • Selected Collection                              │    │
│  │  • Collection Type (watches/sneakers/purses)        │    │
│  │  • Collection Config (labels, fields, icons)        │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │               Dynamic UI Components                 │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │   Item List  │  │   Item Form  │               │    │
│  │  │  (Dynamic)   │  │  (Dynamic)   │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  │  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  Dashboard   │  │   Detail     │               │    │
│  │  │  (Dynamic)   │  │   View       │               │    │
│  │  └──────────────┘  └──────────────┘               │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### `collections` Table

```sql
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection_type collection_type NOT NULL DEFAULT 'watches',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key Fields:**
- `collection_type`: Enum ('watches', 'sneakers', 'purses')
- Determines UI behavior, form fields, and validation rules

#### `user_collections` Table

```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  role collection_role NOT NULL, -- 'owner', 'editor', 'viewer'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, collection_id)
);
```

**Roles:**
- **owner**: Full control, can delete collection, manage users
- **editor**: Can add/edit/delete items, cannot manage collection settings
- **viewer**: Read-only access

#### `watches` Table (Renamed to Items in Future)

This table stores ALL collection items (watches, sneakers, purses). The name is kept for backward compatibility but will be treated as generic "items".

```sql
CREATE TABLE watches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Common fields (all collection types)
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  cost NUMERIC,
  msrp NUMERIC,
  image_url TEXT,
  ai_image_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'traded'
  when_bought DATE,
  warranty_date DATE,
  warranty_card_url TEXT,
  available_for_trade BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- Watch-specific fields
  dial_color TEXT,
  case_size NUMERIC,
  lug_to_lug_size NUMERIC,
  caseback_material TEXT,
  type TEXT,
  movement TEXT,
  has_sapphire BOOLEAN,
  average_resale_price NUMERIC,
  rarity TEXT,
  historical_significance TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Design Decision**: Keep table name as `watches` for backward compatibility. TypeScript types and UI will abstract this.

#### `sneaker_specs` Table

Extended attributes specific to sneakers:

```sql
CREATE TABLE sneaker_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,

  -- Sneaker-specific attributes
  shoe_size NUMERIC,
  size_type TEXT, -- 'US', 'UK', 'EU'
  colorway TEXT,
  release_date DATE,
  retail_price NUMERIC,
  sku TEXT,
  style_code TEXT,
  collaboration TEXT,
  limited_edition BOOLEAN DEFAULT false,
  condition TEXT, -- 'deadstock', 'vnds', 'used'
  box_included BOOLEAN DEFAULT true,
  og_all BOOLEAN DEFAULT false, -- Original All accessories

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `purse_specs` Table

Extended attributes specific to purses:

```sql
CREATE TABLE purse_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watch_id UUID NOT NULL REFERENCES watches(id) ON DELETE CASCADE,

  -- Purse-specific attributes
  material TEXT, -- 'leather', 'canvas', 'synthetic'
  hardware_color TEXT, -- 'gold', 'silver', 'rose gold'
  condition TEXT, -- 'pristine', 'excellent', 'good', 'fair'
  authenticity_verified BOOLEAN DEFAULT false,
  serial_number TEXT,
  dust_bag_included BOOLEAN DEFAULT false,
  authenticity_card BOOLEAN DEFAULT false,
  original_receipt BOOLEAN DEFAULT false,
  size_category TEXT, -- 'mini', 'small', 'medium', 'large'
  closure_type TEXT, -- 'zipper', 'magnetic', 'clasp'
  strap_type TEXT, -- 'shoulder', 'crossbody', 'top handle', 'clutch'
  interior_color TEXT,
  number_of_compartments INTEGER,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Feature Tables (Collection-Scoped)

All feature tables now include `collection_id` for proper scoping:

- `trips` - Travel history with linked items
- `events` - Events with linked items
- `water_usage` - Water resistance testing (watches only)
- `wishlist` - Desired items per collection
- `personal_notes` - Collection-specific notes
- `wear_entries` - Daily usage tracking
- `collection_insights` - AI-generated insights per collection
- `collection_gap_suggestions` - AI recommendations per collection

### Social Features (User-Scoped)

These remain user-scoped, not collection-scoped:

- `friendships` - User-to-user relationships
- `friend_requests` - Pending friend requests
- `conversations` - Direct messages
- `messages` - Chat messages
- `posts` - Forum posts
- `post_comments` - Forum comments
- `post_votes` - Post voting

---

## Collection Types

### Type Configuration System

Each collection type is configured via `CollectionTypeConfig`:

```typescript
interface CollectionTypeConfig {
  type: CollectionType;
  singular: string;        // "Watch", "Sneaker", "Purse"
  plural: string;          // "Watches", "Sneakers", "Purses"
  icon: string;            // Emoji or icon identifier
  primaryFields: string[]; // Fields shown in cards/lists
  detailFields: string[];  // Fields shown in detail view
  formFields: string[];    // Fields shown in add/edit forms
  statsLabels: {
    totalItems: string;    // "Total Watches"
    mostUsed: string;      // "Most Worn Watch"
    avgUsage: string;      // "Avg Days/Watch"
  };
}
```

### Watches Configuration

```typescript
{
  type: 'watches',
  singular: 'Watch',
  plural: 'Watches',
  icon: '⌚',
  primaryFields: ['brand', 'model', 'dial_color', 'type'],
  statsLabels: {
    totalItems: 'Total Watches',
    mostUsed: 'Most Worn Watch',
    avgUsage: 'Avg Days/Watch'
  }
}
```

**Unique Features:**
- Movement type (automatic, manual, quartz)
- Case specifications (size, material, sapphire crystal)
- Water resistance tracking
- Warranty management

### Sneakers Configuration

```typescript
{
  type: 'sneakers',
  singular: 'Sneaker',
  plural: 'Sneakers',
  icon: '👟',
  primaryFields: ['brand', 'model', 'colorway', 'shoe_size'],
  statsLabels: {
    totalItems: 'Total Sneakers',
    mostUsed: 'Most Worn Sneaker',
    avgUsage: 'Avg Days/Sneaker'
  }
}
```

**Unique Features:**
- Size and region (US, UK, EU)
- Colorway and style codes
- Release date tracking
- Condition (deadstock, VNDS, used)
- Box and accessories tracking

### Purses Configuration

```typescript
{
  type: 'purses',
  singular: 'Purse',
  plural: 'Purses',
  icon: '👜',
  primaryFields: ['brand', 'model', 'material', 'hardware_color'],
  statsLabels: {
    totalItems: 'Total Purses',
    mostUsed: 'Most Carried Purse',
    avgUsage: 'Avg Days/Purse'
  }
}
```

**Unique Features:**
- Material and hardware specifications
- Authenticity verification
- Serial number tracking
- Size category and configuration
- Dust bag and authentication cards

---

## Data Model

### Type Hierarchy

```
BaseItem (Common attributes)
    │
    ├── Watch (extends BaseItem + watch-specific fields)
    │
    ├── Sneaker (extends BaseItem + sneaker-specific fields)
    │
    └── Purse (extends BaseItem + purse-specific fields)
```

### TypeScript Types

```typescript
// Base item interface
interface BaseItem {
  id: string;
  collection_id: string;
  user_id: string;
  brand: string;
  model: string;
  cost: number;
  msrp?: number;
  image_url?: string;
  status: 'active' | 'sold' | 'traded';
  when_bought?: string;
  warranty_date?: string;
  available_for_trade: boolean;
  sort_order: number;
}

// Type-specific interfaces extend BaseItem
interface Watch extends BaseItem {
  dial_color?: string;
  case_size?: number;
  movement?: string;
  has_sapphire?: boolean;
}

interface Sneaker extends BaseItem {
  colorway?: string;
  shoe_size?: number;
  size_type?: 'US' | 'UK' | 'EU';
  sku?: string;
  condition?: 'deadstock' | 'vnds' | 'used';
}

interface Purse extends BaseItem {
  material?: string;
  hardware_color?: string;
  size_category?: 'mini' | 'small' | 'medium' | 'large';
  authenticity_verified?: boolean;
}

// Union type for any collection item
type CollectionItem = Watch | Sneaker | Purse;
```

---

## Application Layers

### 1. Presentation Layer (UI Components)

**Responsibilities:**
- Render dynamic UI based on collection type
- Handle user interactions
- Display type-specific forms and fields

**Key Components:**
- `DynamicItemCard` - Renders item cards based on collection type
- `DynamicItemForm` - Renders add/edit forms with type-specific fields
- `DynamicDashboard` - Shows stats with type-appropriate labels
- `CollectionTypeSwitcher` - Allows switching between collections

### 2. State Management Layer

**Responsibilities:**
- Manage global collection state
- Provide collection type configuration
- Handle collection switching

**Key Contexts:**
- `CollectionContext` - Manages selected collection and provides type config
- `AuthContext` - User authentication and permissions
- `ThemeContext` - UI theming

### 3. Business Logic Layer (Hooks)

**Responsibilities:**
- Fetch and manage data
- Handle CRUD operations
- Apply collection-scoped filtering

**Key Hooks:**
- `useCollectionData()` - Fetches user's collections
- `useItemData(collectionId, collectionType)` - Fetches items for collection
- `useTripData(collectionId)` - Collection-scoped trips
- `useEventData(collectionId)` - Collection-scoped events
- `useStatsCalculations(collectionId, collectionType)` - Type-aware statistics

### 4. Data Layer (Supabase Integration)

**Responsibilities:**
- Database queries and mutations
- Real-time subscriptions
- File storage operations
- Row-level security enforcement

---

## State Management

### Collection Context Structure

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

### Context Usage Pattern

```typescript
const { currentCollectionType, currentCollectionConfig } = useCollection();

// Use config for dynamic labels
<h1>{currentCollectionConfig.plural}</h1>
<p>{currentCollectionConfig.statsLabels.totalItems}: {count}</p>

// Use type for conditional logic
if (currentCollectionType === 'watches') {
  // Show watch-specific features (water resistance)
}
```

---

## UI/UX Architecture

### Dynamic UI Rendering

The UI adapts based on `currentCollectionType`:

1. **Navigation Labels**: "My Watches" vs "My Sneakers" vs "My Purses"
2. **Form Fields**: Different fields shown based on type
3. **Stats Dashboard**: Type-specific metrics and labels
4. **Detail Views**: Type-appropriate attributes displayed
5. **Icons and Imagery**: Collection type icons (⌚👟👜)

### Responsive Layouts

- Mobile-first design
- Grid/List view toggle
- Touch-optimized interactions
- Responsive sidebars and navigation

### Theme Integration

- Dark/Light mode support
- Collection type color schemes (future enhancement)
- Consistent component styling across types

---

## Security & Permissions

### Row-Level Security (RLS)

All tables enforce RLS policies:

```sql
-- Example: Users can only view items in their accessible collections
CREATE POLICY "Users can view items in their collections"
ON watches FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_collections uc
    WHERE uc.collection_id = watches.collection_id
    AND uc.user_id = auth.uid()
  )
);
```

### Permission Model

| Role | Create Items | Edit Items | Delete Items | Manage Collection | Share Collection |
|------|--------------|------------|--------------|-------------------|------------------|
| Owner | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ |
| Viewer | ❌ | ❌ | ❌ | ❌ | ❌ |

### Data Isolation

- Collections are isolated by `collection_id`
- RLS policies enforce access control
- Users can only access collections in `user_collections` table
- Admin users have global access for management

---

## Migration Strategy

### Phase 1: Database Schema (✅ Complete)

- Add `collection_type` enum
- Add `collection_type` column to `collections` table
- Create `sneaker_specs` and `purse_specs` tables
- Add `collection_id` to feature tables (trips, events, etc.)

### Phase 2: Type System (✅ Complete)

- Create TypeScript types for collection types
- Define collection type configurations
- Update existing type definitions

### Phase 3: State Management (✅ Complete)

- Update `CollectionContext` with type awareness
- Add type config to context
- Update `useCollectionData` hook

### Phase 4: Data Layer (🔄 In Progress)

- Update hooks to be collection-type aware
- Add collection_id filtering to all queries
- Create type-specific data fetching hooks

### Phase 5: UI Components (📋 Pending)

- Create dynamic form components
- Update dashboard with type-specific metrics
- Refactor item cards and lists
- Add collection type selector for new collections

### Phase 6: Testing & Migration (📋 Pending)

- Test all collection types
- Migrate existing watch collections
- Validate data integrity
- Performance testing

### Phase 7: Deployment (📋 Pending)

- Database migration deployment
- Application deployment
- User communication
- Rollback plan

---

## Performance Considerations

### Database Optimization

- Indexes on `collection_id` columns
- Indexes on `collection_type` for filtering
- Efficient RLS policies
- Query result caching with React Query

### Application Performance

- Lazy loading of type-specific components
- Memoization of collection configs
- Optimized re-renders with React context
- Image optimization and lazy loading

### Scalability

- Horizontal scaling through Supabase
- CDN for static assets
- Database connection pooling
- Edge functions for computations

---

## Future Enhancements

### Additional Collection Types

The architecture supports easy addition of new types:

1. Add new enum value to `collection_type`
2. Create type-specific specs table if needed
3. Add configuration to `COLLECTION_TYPE_CONFIGS`
4. Create TypeScript interface
5. Deploy

### Advanced Features

- **Collection Templates**: Pre-configured collections for common use cases
- **Import/Export**: Bulk data import from CSV/Excel
- **Collection Analytics**: Advanced insights and trends
- **Social Sharing**: Public collection profiles
- **Marketplace Integration**: Price tracking and marketplace listings
- **Collection Insurance**: Integration with insurance providers
- **Collection Valuation**: AI-powered valuation tools

---

## Conclusion

This multi-collection architecture provides a robust, scalable foundation for managing diverse collection types while maintaining code quality, type safety, and user experience. The design prioritizes flexibility, extensibility, and backward compatibility, ensuring smooth evolution of the platform.

For implementation details, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md).
For user documentation, see [USER_GUIDE.md](./USER_GUIDE.md).
For frequently asked questions, see [FAQ.md](./FAQ.md).
