// Collection Types and Configuration

export type CollectionType = 'watches' | 'sneakers' | 'purses';

export interface Collection {
  id: string;
  name: string;
  collection_type: CollectionType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserCollection {
  id: string;
  user_id: string;
  collection_id: string;
  role: 'owner' | 'editor' | 'viewer';
  created_at: string;
}

// Base item interface (common across all collection types)
export interface BaseItem {
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

// Watch-specific interface (extends BaseItem)
export interface Watch extends BaseItem {
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

// Sneaker-specific interface (extends BaseItem)
export interface Sneaker extends BaseItem {
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
  og_all?: boolean; // Original All (box, receipt, laces, etc.)
}

// Purse-specific interface (extends BaseItem)
export interface Purse extends BaseItem {
  material?: string; // leather, canvas, synthetic, etc.
  hardware_color?: string; // gold, silver, rose gold, etc.
  condition?: 'pristine' | 'excellent' | 'good' | 'fair';
  authenticity_verified?: boolean;
  serial_number?: string;
  dust_bag_included?: boolean;
  authenticity_card?: boolean;
  original_receipt?: boolean;
  size_category?: 'mini' | 'small' | 'medium' | 'large';
  closure_type?: string; // zipper, magnetic, clasp, etc.
  strap_type?: string; // shoulder, crossbody, top handle, clutch
  interior_color?: string;
  number_of_compartments?: number;
}

// Union type for any collection item
export type CollectionItem = Watch | Sneaker | Purse;

// Sneaker specs (additional details table)
export interface SneakerSpecs {
  id: string;
  watch_id: string; // References the item in watches table
  shoe_size?: number;
  size_type?: string;
  colorway?: string;
  release_date?: string;
  retail_price?: number;
  sku?: string;
  style_code?: string;
  collaboration?: string;
  limited_edition?: boolean;
  condition?: string;
  box_included?: boolean;
  og_all?: boolean;
  created_at: string;
  updated_at: string;
}

// Purse specs (additional details table)
export interface PurseSpecs {
  id: string;
  watch_id: string; // References the item in watches table
  material?: string;
  hardware_color?: string;
  condition?: string;
  authenticity_verified?: boolean;
  serial_number?: string;
  dust_bag_included?: boolean;
  authenticity_card?: boolean;
  original_receipt?: boolean;
  size_category?: string;
  closure_type?: string;
  strap_type?: string;
  interior_color?: string;
  number_of_compartments?: number;
  created_at: string;
  updated_at: string;
}

// Configuration for each collection type
export interface CollectionTypeConfig {
  type: CollectionType;
  singular: string;
  plural: string;
  icon: string;
  primaryFields: string[]; // Fields to show in cards/lists
  detailFields: string[]; // Fields to show in detail view
  formFields: string[]; // Fields to show in add/edit forms
  statsLabels: {
    totalItems: string;
    mostUsed: string;
    avgUsage: string;
  };
}

// Collection type configurations
export const COLLECTION_TYPE_CONFIGS: Record<CollectionType, CollectionTypeConfig> = {
  watches: {
    type: 'watches',
    singular: 'Watch',
    plural: 'Watches',
    icon: '⌚',
    primaryFields: ['brand', 'model', 'dial_color', 'type'],
    detailFields: [
      'brand', 'model', 'dial_color', 'type', 'case_size', 'movement',
      'cost', 'msrp', 'average_resale_price', 'when_bought', 'warranty_date'
    ],
    formFields: [
      'brand', 'model', 'dial_color', 'type', 'case_size', 'lug_to_lug_size',
      'caseback_material', 'movement', 'has_sapphire', 'cost', 'msrp'
    ],
    statsLabels: {
      totalItems: 'Total Watches',
      mostUsed: 'Most Worn Watch',
      avgUsage: 'Avg Days/Watch'
    }
  },
  sneakers: {
    type: 'sneakers',
    singular: 'Sneaker',
    plural: 'Sneakers',
    icon: '👟',
    primaryFields: ['brand', 'model', 'colorway', 'shoe_size'],
    detailFields: [
      'brand', 'model', 'colorway', 'shoe_size', 'size_type', 'sku',
      'style_code', 'release_date', 'cost', 'retail_price', 'condition'
    ],
    formFields: [
      'brand', 'model', 'colorway', 'shoe_size', 'size_type', 'sku',
      'style_code', 'release_date', 'cost', 'retail_price', 'condition',
      'limited_edition', 'collaboration', 'box_included', 'og_all'
    ],
    statsLabels: {
      totalItems: 'Total Sneakers',
      mostUsed: 'Most Worn Sneaker',
      avgUsage: 'Avg Days/Sneaker'
    }
  },
  purses: {
    type: 'purses',
    singular: 'Purse',
    plural: 'Purses',
    icon: '👜',
    primaryFields: ['brand', 'model', 'material', 'hardware_color'],
    detailFields: [
      'brand', 'model', 'material', 'hardware_color', 'size_category',
      'strap_type', 'closure_type', 'cost', 'msrp', 'condition',
      'authenticity_verified', 'serial_number'
    ],
    formFields: [
      'brand', 'model', 'material', 'hardware_color', 'size_category',
      'strap_type', 'closure_type', 'interior_color', 'number_of_compartments',
      'cost', 'msrp', 'condition', 'authenticity_verified', 'serial_number',
      'dust_bag_included', 'authenticity_card', 'original_receipt'
    ],
    statsLabels: {
      totalItems: 'Total Purses',
      mostUsed: 'Most Carried Purse',
      avgUsage: 'Avg Days/Purse'
    }
  }
};

// Helper function to get collection config
export const getCollectionConfig = (type: CollectionType): CollectionTypeConfig => {
  return COLLECTION_TYPE_CONFIGS[type];
};

// Helper function to get item type label
export const getItemTypeLabel = (type: CollectionType, count: number = 1): string => {
  const config = getCollectionConfig(type);
  return count === 1 ? config.singular : config.plural;
};
