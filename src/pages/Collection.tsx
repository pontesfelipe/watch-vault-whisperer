import { useState, useEffect } from "react";
import { Search, RefreshCw, History, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableWatchCard } from "@/components/SortableWatchCard";
import { PastWatchCard } from "@/components/PastWatchCard";
import { PastWatchesStats } from "@/components/PastWatchesStats";
import { AddWatchDialog } from "@/components/AddWatchDialog";
import { AddItemDialog } from "@/components/AddItemDialog";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { EditCollectionDialog } from "@/components/EditCollectionDialog";
import { CreateFirstCollectionDialog } from "@/components/CreateFirstCollectionDialog";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { AnalyzeWatchMetadataDialog } from "@/components/AnalyzeWatchMetadataDialog";
import { ImportSpreadsheetDialog } from "@/components/ImportSpreadsheetDialog";
import { ItemTypeIcon } from "@/components/ItemTypeIcon";
import { useWatchData } from "@/hooks/useWatchData";
import { usePastWatchData } from "@/hooks/usePastWatchData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useCollection } from "@/contexts/CollectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";

const Collection = () => {
  const { selectedCollectionId, currentCollection, currentCollectionType, currentCollectionConfig, collections, collectionsLoading, refetchCollections } = useCollection();
  const { watches, wearEntries, loading, refetch } = useWatchData(selectedCollectionId);
  const { pastWatches, wearEntries: pastWearEntries, loading: pastLoading, refetch: refetchPast } = usePastWatchData();
  const { trips } = useTripData();
  const { waterUsages } = useWaterUsageData();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [localWatches, setLocalWatches] = useState(watches);
  const [showPastWatches, setShowPastWatches] = useState(false);
  const { toast } = useToast();

  const handleRefetchAll = () => {
    refetch();
    refetchPast();
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update local watches when watches prop changes
  useEffect(() => {
    setLocalWatches(watches);
  }, [watches]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localWatches.findIndex((w) => w.id === active.id);
    const newIndex = localWatches.findIndex((w) => w.id === over.id);

    const newOrder = arrayMove(localWatches, oldIndex, newIndex);
    setLocalWatches(newOrder);

    // Update sort_order in database
    try {
      const updates = newOrder.map((watch, index) => ({
        id: watch.id,
        sort_order: index + 1,
      }));

      for (const update of updates) {
        await supabase
          .from("watches")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);
      }

      toast({
        title: "Order Updated",
        description: "Watch order has been saved",
      });
    } catch (error) {
      console.error("Error updating watch order:", error);
      toast({
        title: "Error",
        description: "Failed to update watch order",
        variant: "destructive",
      });
      // Revert on error
      setLocalWatches(watches);
    }
  };

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);

  const handleBulkUpdatePrices = async () => {
    setIsBulkUpdating(true);
    let successCount = 0;
    let errorCount = 0;

    toast({
      title: "Updating Prices",
      description: `Fetching market prices for ${watches.length} watches...`,
    });

    for (const watch of watches) {
      try {
        // Extract year from when_bought
        let year: number | undefined;
        if (watch.when_bought) {
          const yearMatch = watch.when_bought.match(/\d{4}/);
          if (yearMatch) {
            year = parseInt(yearMatch[0]);
          }
        }

        const { data, error } = await supabase.functions.invoke('fetch-watch-price', {
          body: { 
            brand: watch.brand, 
            model: watch.model,
            watchId: watch.id,
            dialColor: watch.dial_color,
            year,
            caseSize: watch.case_size,
            movement: watch.movement,
            hasSapphire: watch.has_sapphire
          }
        });

        if (error || data.error) {
          errorCount++;
        } else {
          successCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        errorCount++;
      }
    }

    setIsBulkUpdating(false);
    refetch();

    toast({
      title: "Bulk Update Complete",
      description: `Updated ${successCount} watches. ${errorCount > 0 ? `${errorCount} failed.` : ''}`,
    });
  };

  // Show onboarding dialog if user has no collections
  if (!collectionsLoading && collections.length === 0) {
    return <CreateFirstCollectionDialog onSuccess={refetchCollections} />;
  }

  if (loading || collectionsLoading || !selectedCollectionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-textMuted">Loading collection...</p>
        </div>
      </div>
    );
  }

  const filteredWatches = localWatches.filter((watch) => {
    const matchesSearch =
      watch.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      watch.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrand === "all" || watch.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const uniqueBrands = Array.from(new Set(watches.map((w) => w.brand))).sort();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <CollectionSwitcher />
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl md:text-4xl font-semibold text-textMain">
                    {currentCollection?.name || "My Collection"}
                  </h1>
                  {currentCollection && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentCollection.role === 'owner' 
                        ? 'bg-primary/10 text-primary' 
                        : currentCollection.role === 'editor'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {currentCollection.role === 'owner' ? 'Owner' : currentCollection.role === 'editor' ? 'Editor' : 'Viewer'}
                    </span>
                  )}
                </div>
              <p className="text-sm text-textMuted mt-1">
                {watches.length} {watches.length === 1 ? currentCollectionConfig.singularLabel.toLowerCase() : currentCollectionConfig.pluralLabel.toLowerCase()} in {currentCollection?.role === 'owner' ? 'your' : 'this'} collection
              </p>
            </div>
              {currentCollection && currentCollection.role === 'owner' && (
                <EditCollectionDialog 
                  collectionId={currentCollection.id}
                  currentName={currentCollection.name}
                  onSuccess={refetchCollections}
                />
              )}
            </div>
          </div>
        <div className="flex gap-2">
          {currentCollectionType === 'watches' && <QuickAddWearDialog watches={watches} onSuccess={refetch} />}
          {currentCollectionType === 'watches' ? (
            <AddWatchDialog onSuccess={refetch} />
          ) : (
            <AddItemDialog onSuccess={refetch} />
          )}
        </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {isAdmin && <ImportSpreadsheetDialog />}
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkUpdatePrices}
            disabled={isBulkUpdating || watches.length === 0}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isBulkUpdating ? 'animate-spin' : ''}`} />
            {isBulkUpdating ? 'Updating...' : 'Update All Prices'}
          </Button>
          <AnalyzeWatchMetadataDialog watches={watches} onSuccess={refetch} />
        </div>
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={`Search ${currentCollectionConfig.pluralLabel.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredWatches.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery || selectedBrand !== "all"
              ? `No ${currentCollectionConfig.pluralLabel.toLowerCase()} match your filters`
              : `No ${currentCollectionConfig.pluralLabel.toLowerCase()} yet. Add your first ${currentCollectionConfig.singularLabel.toLowerCase()}!`}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredWatches.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWatches.map((watch) => (
                <SortableWatchCard
                  key={watch.id}
                  watch={watch}
                  totalDays={wearEntries.filter((w) => w.watch_id === watch.id).length}
                  onDelete={handleRefetchAll}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Past Watches Section */}
      {pastWatches.length > 0 && (
        <div className="mt-12 pt-8 border-t border-borderSubtle">
          <button
            onClick={() => setShowPastWatches(!showPastWatches)}
            className="flex items-center gap-3 w-full text-left mb-4 group"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-textMuted" />
              <h2 className="text-xl font-semibold text-textMain">Past Watches</h2>
              <span className="text-sm text-textMuted">({pastWatches.length})</span>
            </div>
            {showPastWatches ? (
              <ChevronUp className="w-5 h-5 text-textMuted group-hover:text-textMain transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-textMuted group-hover:text-textMain transition-colors" />
            )}
          </button>
          
          {showPastWatches && (
            <>
              <p className="text-sm text-textMuted mb-4">
                Watches you've sold or traded. Historical wear data is preserved.
              </p>
              <PastWatchesStats pastWatches={pastWatches} wearEntries={pastWearEntries} />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {pastWatches.map((watch) => (
                  <PastWatchCard
                    key={watch.id}
                    watch={watch}
                    totalDays={pastWearEntries.filter((w) => w.watch_id === watch.id).length}
                    onUpdate={handleRefetchAll}
                    collectionId={selectedCollectionId || ''}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Collection;
