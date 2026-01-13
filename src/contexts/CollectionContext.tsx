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

  // Auto-select user's own collection when data loads (always prioritize owned)
  useEffect(() => {
    if (!loading && collections.length > 0) {
      // Always prioritize the user's owned collection on page load
      const ownedCollection = collections.find(c => c.role === 'owner');
      
      if (ownedCollection && (!selectedCollectionId || selectedCollectionId !== ownedCollection.id)) {
        // Check if there's a saved ID and it's not the owned collection
        const savedId = localStorage.getItem('selectedCollectionId');
        const collectionIds = collections.map(c => c.id);
        
        // Only use saved ID if user explicitly selected it before (not on first load)
        if (selectedCollectionId && savedId && collectionIds.includes(savedId)) {
          // User has already made a selection in this session, respect it
          return;
        }
        
        // Default to owned collection
        setSelectedCollectionId(ownedCollection.id);
      } else if (!ownedCollection && !selectedCollectionId) {
        // No owned collection, fall back to first available
        setSelectedCollectionId(collections[0].id);
      }
    }
  }, [collections, loading]);

  // Persist selection
  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem('selectedCollectionId', selectedCollectionId);
    }
  }, [selectedCollectionId]);

  const currentCollection = collections.find(c => c.id === selectedCollectionId);
  const currentCollectionType = currentCollection?.collection_type || 'watches';
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
