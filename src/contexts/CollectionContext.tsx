import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCollectionData, Collection } from '@/hooks/useCollectionData';

interface CollectionContextType {
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string) => void;
  currentCollection: Collection | undefined;
  collections: Collection[];
  collectionsLoading: boolean;
  refetchCollections: () => Promise<void>;
}

const CollectionContext = createContext<CollectionContextType | undefined>(undefined);

export const CollectionProvider = ({ children }: { children: ReactNode }) => {
  const { collections, loading, refetch } = useCollectionData();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Auto-select first collection when data loads
  useEffect(() => {
    if (!loading && collections.length > 0 && !selectedCollectionId) {
      const savedId = localStorage.getItem('selectedCollectionId');
      const collectionIds = collections.map(c => c.id);
      
      // Use saved ID if it exists in current collections
      if (savedId && collectionIds.includes(savedId)) {
        setSelectedCollectionId(savedId);
      } else {
        // Prioritize user's own collections (owner role) over shared ones
        const ownedCollection = collections.find(c => c.role === 'owner');
        const defaultCollection = ownedCollection || collections[0];
        setSelectedCollectionId(defaultCollection.id);
      }
    }
  }, [collections, loading, selectedCollectionId]);

  // Persist selection
  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem('selectedCollectionId', selectedCollectionId);
    }
  }, [selectedCollectionId]);

  const currentCollection = collections.find(c => c.id === selectedCollectionId);

  return (
    <CollectionContext.Provider value={{ 
      selectedCollectionId, 
      setSelectedCollectionId,
      currentCollection,
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
