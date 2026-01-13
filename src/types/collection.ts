// Collection Type System for Multi-Collection Support

export type CollectionType = 'watches' | 'sneakers' | 'purses';

// Base item interface shared across all collection types
export interface BaseItem {
  id: string;
  brand: string;
  model: string;
  cost: number;
  msrp: number | null;
  average_resale_price: number | null;
  status: 'active' | 'sold' | 'traded';
  sort_order: number;
  collection_id: string | null;
  user_id: string | null;
  ai_image_url: string | null;
  available_for_trade: boolean;
  when_bought: string | null;
  why_bought: string | null;
  what_i_like: string | null;
  what_i_dont_like: string | null;
  created_at: string;
  updated_at: string;
}

// Watch-specific fields
export interface WatchSpecificFields {
  dial_color: string;
  type: string;
  case_size: string | null;
  lug_to_lug_size: string | null;
  movement: string | null;
  has_sapphire: boolean | null;
  caseback_material: string | null;
  warranty_date: string | null;
  warranty_card_url: string | null;
  sentiment: string | null;
  sentiment_analyzed_at: string | null;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'grail' | null;
  historical_significance: 'regular' | 'notable' | 'historically_significant' | null;
  metadata_analyzed_at: string | null;
  metadata_analysis_reasoning: string | null;
}

export interface Watch extends BaseItem, WatchSpecificFields {}

// Sneaker-specific fields
export interface SneakerSpecs {
  id: string;
  item_id: string;
  user_id: string | null;
  colorway: string | null;
  shoe_size: string | null;
  size_type: 'US' | 'UK' | 'EU' | 'CM';
  sku: string | null;
  style_code: string | null;
  condition: 'deadstock' | 'vnds' | 'used' | 'worn';
  box_included: boolean;
  og_all: boolean;
  collaboration: string | null;
  limited_edition: boolean;
  release_date: string | null;
  silhouette: string | null;
  created_at: string;
  updated_at: string;
}

export interface Sneaker extends BaseItem {
  dial_color: string; // Used as colorway display
  type: string; // Used as silhouette category
  specs?: SneakerSpecs;
}

// Purse-specific fields
export interface PurseSpecs {
  id: string;
  item_id: string;
  user_id: string | null;
  material: string | null;
  hardware_color: string | null;
  size_category: 'mini' | 'small' | 'medium' | 'large' | 'oversized';
  authenticity_verified: boolean;
  serial_number: string | null;
  dust_bag_included: boolean;
  closure_type: string | null;
  strap_type: 'fixed' | 'removable' | 'adjustable' | 'chain' | 'none';
  box_included: boolean;
  authenticity_card_included: boolean;
  color: string | null;
  pattern: string | null;
  created_at: string;
  updated_at: string;
}

export interface Purse extends BaseItem {
  dial_color: string; // Used as color display
  type: string; // Used as style category
  specs?: PurseSpecs;
}

// Union type for any collection item
export type CollectionItem = Watch | Sneaker | Purse;

// Configuration for each collection type
export interface CollectionTypeConfig {
  type: CollectionType;
  label: string;
  singularLabel: string;
  pluralLabel: string;
  icon: string;
  description: string;
  primaryColorField: string;
  primaryColorLabel: string;
  typeField: string;
  typeLabel: string;
  typeOptions: string[];
  defaultTypeOption: string;
}

// Collection type configurations
export const COLLECTION_CONFIGS: Record<CollectionType, CollectionTypeConfig> = {
  watches: {
    type: 'watches',
    label: 'Watches',
    singularLabel: 'Watch',
    pluralLabel: 'Watches',
    icon: 'Watch',
    description: 'Track your watch collection with movement, case size, and water resistance details',
    primaryColorField: 'dial_color',
    primaryColorLabel: 'Dial Color',
    typeField: 'type',
    typeLabel: 'Type',
    typeOptions: ['Diver', 'Dress', 'Field', 'Pilot', 'Racing', 'Sport', 'Tool', 'Casual'],
    defaultTypeOption: 'Sport',
  },
  sneakers: {
    type: 'sneakers',
    label: 'Sneakers',
    singularLabel: 'Sneaker',
    pluralLabel: 'Sneakers',
    icon: 'Footprints',
    description: 'Catalog your sneaker collection with colorway, size, and condition tracking',
    primaryColorField: 'dial_color',
    primaryColorLabel: 'Colorway',
    typeField: 'type',
    typeLabel: 'Silhouette',
    typeOptions: ['Running', 'Basketball', 'Skateboarding', 'Lifestyle', 'Training', 'Retro', 'Limited'],
    defaultTypeOption: 'Lifestyle',
  },
  purses: {
    type: 'purses',
    label: 'Purses',
    singularLabel: 'Purse',
    pluralLabel: 'Purses',
    icon: 'ShoppingBag',
    description: 'Manage your purse collection with material, authenticity, and hardware details',
    primaryColorField: 'dial_color',
    primaryColorLabel: 'Color',
    typeField: 'type',
    typeLabel: 'Style',
    typeOptions: ['Tote', 'Crossbody', 'Shoulder', 'Clutch', 'Backpack', 'Satchel', 'Hobo'],
    defaultTypeOption: 'Crossbody',
  },
};

// Utility functions
export const getCollectionConfig = (type: CollectionType): CollectionTypeConfig => {
  return COLLECTION_CONFIGS[type];
};

export const getItemLabel = (type: CollectionType, plural = false): string => {
  const config = COLLECTION_CONFIGS[type];
  return plural ? config.pluralLabel : config.singularLabel;
};

export const getTypeOptions = (type: CollectionType): string[] => {
  return COLLECTION_CONFIGS[type].typeOptions;
};

export const isWatchCollection = (type: CollectionType): boolean => type === 'watches';
export const isSneakerCollection = (type: CollectionType): boolean => type === 'sneakers';
export const isPurseCollection = (type: CollectionType): boolean => type === 'purses';

// Sneaker condition display helper
export const SNEAKER_CONDITIONS: Record<string, { label: string; description: string }> = {
  deadstock: { label: 'Deadstock (DS)', description: 'Brand new, never worn' },
  vnds: { label: 'Very Near Deadstock (VNDS)', description: 'Worn 1-2 times, like new' },
  used: { label: 'Used', description: 'Lightly worn, good condition' },
  worn: { label: 'Worn', description: 'Visible wear' },
};

// Purse size display helper
export const PURSE_SIZES: Record<string, { label: string; description: string }> = {
  mini: { label: 'Mini', description: 'Small accessories, compact' },
  small: { label: 'Small', description: 'Essentials only' },
  medium: { label: 'Medium', description: 'Everyday carry' },
  large: { label: 'Large', description: 'Work or travel' },
  oversized: { label: 'Oversized', description: 'Maximum capacity' },
};

// Strap type display helper
export const STRAP_TYPES: Record<string, string> = {
  fixed: 'Fixed Strap',
  removable: 'Removable Strap',
  adjustable: 'Adjustable Strap',
  chain: 'Chain Strap',
  none: 'No Strap',
};
