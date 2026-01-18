import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

  const saveLastSelectedCollection = useCallback(
    async (collectionId: string) => {
      if (!user) return;

      try {
        // First check if user preferences record exists
        const { data: existingPref, error: checkError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError) throw checkError;

        let error;
        if (existingPref) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_preferences')
            .update({
              last_selected_collection_id: collectionId,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);
          error = updateError;
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({
              user_id: user.id,
              last_selected_collection_id: collectionId,
              updated_at: new Date().toISOString(),
            });
          error = insertError;
        }

        if (error) throw error;
      } catch (error) {
        console.error('Error saving last selected collection:', error);
      }
    },
    [user]
  );

  // Verification routine: whenever the user changes (logout/login), re-run selection logic
  useEffect(() => {
    setSelectedCollectionId(null);
    setPreferencesLoaded(false);
  }, [user?.id]);

  // Load user's preferences from database (cross-device persistence)
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferencesLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('default_collection_id, last_selected_collection_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error) {
          if (data?.default_collection_id) {
            localStorage.setItem('defaultCollectionId', data.default_collection_id);
          } else {
            localStorage.removeItem('defaultCollectionId');
          }

          if (data?.last_selected_collection_id) {
            localStorage.setItem('lastSelectedCollectionId', data.last_selected_collection_id);
          } else {
            localStorage.removeItem('lastSelectedCollectionId');
          }
        }
      } catch (error) {
        console.error('Error loading collection preferences:', error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, [user]);

  // Auto-select collection when data loads based on user preference
  useEffect(() => {
    if (!loading && preferencesLoaded && collections.length > 0 && !selectedCollectionId) {
      const collectionIds = collections.map((c) => c.id);

      // 1) Cross-device last selected collection
      const lastSelectedCollectionId = localStorage.getItem('lastSelectedCollectionId');
      if (lastSelectedCollectionId && collectionIds.includes(lastSelectedCollectionId)) {
        setSelectedCollectionId(lastSelectedCollectionId);
        return;
      }

      // 2) User default collection preference
      const defaultCollectionId = localStorage.getItem('defaultCollectionId');
      if (defaultCollectionId && collectionIds.includes(defaultCollectionId)) {
        setSelectedCollectionId(defaultCollectionId);
        return;
      }

      // 3) Same-device last selected collection
      const savedId = localStorage.getItem('selectedCollectionId');
      if (savedId && collectionIds.includes(savedId)) {
        setSelectedCollectionId(savedId);
        return;
      }

      // 4) Fall back to owned collection or first available
      const ownedCollection = collections.find((c) => c.role === 'owner');
      setSelectedCollectionId(ownedCollection?.id || collections[0].id);
    }
  }, [collections, loading, preferencesLoaded, selectedCollectionId]);

  // Persist selection (same-device + cross-device)
  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem('selectedCollectionId', selectedCollectionId);
      localStorage.setItem('lastSelectedCollectionId', selectedCollectionId);
      void saveLastSelectedCollection(selectedCollectionId);
    }
  }, [selectedCollectionId, saveLastSelectedCollection]);

  const currentCollection = collections.find((c) => c.id === selectedCollectionId);
  const currentCollectionType: CollectionType = currentCollection?.collection_type || 'watches';
  const currentCollectionConfig = getCollectionConfig(currentCollectionType);

  return (
    <CollectionContext.Provider
      value={{
        selectedCollectionId,
        setSelectedCollectionId,
        currentCollection,
        currentCollectionType,
        currentCollectionConfig,
        collections,
        collectionsLoading: loading,
        refetchCollections: refetch,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) throw new Error('useCollection must be used within CollectionProvider');
  return context;
};
