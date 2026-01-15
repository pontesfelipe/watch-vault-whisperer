import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useCollectionData, Collection } from '@/hooks/useCollectionData';
import { CollectionType, CollectionTypeConfig, getCollectionConfig } from '@/types/collection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load user's default collection preference from database
  useEffect(() => {
    const loadDefaultPreference = async () => {
      if (!user) {
        setPreferencesLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('default_collection_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data?.default_collection_id) {
          localStorage.setItem('defaultCollectionId', data.default_collection_id);
        } else {
          localStorage.removeItem('defaultCollectionId');
        }
      } catch (error) {
        console.error('Error loading default collection preference:', error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadDefaultPreference();
  }, [user]);

  // Auto-select collection when data loads based on user preference
  useEffect(() => {
    if (!loading && preferencesLoaded && collections.length > 0 && !selectedCollectionId) {
      const collectionIds = collections.map(c => c.id);
      
      // Check for user's default collection preference first (now synced from DB)
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
  }, [collections, loading, preferencesLoaded, selectedCollectionId]);

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
