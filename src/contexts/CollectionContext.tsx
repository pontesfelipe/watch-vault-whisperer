import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCollectionData, Collection } from '@/hooks/useCollectionData';
import { CollectionType, CollectionTypeConfig, getCollectionConfig } from '@/types/collection';

interface CollectionContextType {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string) => void;
  currentCollection: Collection | undefined;
  currentCollectionType: CollectionType;
  currentCollectionConfig: CollectionTypeConfig;
  collections: Collection[];
  collectionsLoading: boolean;
  refetchCollections: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider = ({ children }: { children: ReactNode }) => {
  const { collections, loading, refetch } = useCollectionData();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Auto-select collection when data loads based on user preference
  useEffect(() => {
    if (!loading && collections.length > 0 && !selectedCollectionId) {
      const collectionIds = collections.map(c => c.id);
      
      // Check for user's default collection preference first
      const defaultCollectionId = localStorage.getItem('defaultCollectionId');
      if (defaultCollectionId && collectionIds.includes(defaultCollectionId)) {
        setSelectedCollectionId(defaultCollectionId);
        return;
      }
      
      // Check for last selected collection
      const savedId = localStorage.getItem('selectedCollectionId');
      if (savedId && collectionIds.includes(savedId)) {
        setSelectedCollectionId(savedId);
        return;
      }
      
      // Fall back to owned collection or first available
      const ownedCollection = collections.find(c => c.role === 'owner');
      setSelectedCollectionId(ownedCollection?.id || collections[0].id);
    }
  }, [collections, loading, selectedCollectionId]);

  // Persist selection
  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem('selectedCollectionId', selectedCollectionId);
    }
  }, [selectedCollectionId]);

  const currentCollection = collections.find(c => c.id === selectedCollectionId);
  const currentCollectionType: CollectionType = currentCollection?.collection_type || 'watches';
  const currentCollectionConfig = getCollectionConfig(currentCollectionType);

  return (
    <CollectionContext.Provider value={{ 
      selectedCollectionId, 
      setSelectedCollectionId,
      currentCollection,
      currentCollectionType,
      currentCollectionConfig,
      collections,
      collectionsLoading: loading,
      refetchCollections: refetch
    }}>
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) throw new Error('useCollection must be used within CollectionProvider');
  return context;
};
