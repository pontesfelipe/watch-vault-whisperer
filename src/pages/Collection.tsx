import { useState, useEffect } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableWatchCard } from "@/components/SortableWatchCard";
import { AddWatchDialog } from "@/components/AddWatchDialog";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { EditCollectionDialog } from "@/components/EditCollectionDialog";
import { CreateFirstCollectionDialog } from "@/components/CreateFirstCollectionDialog";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { AnalyzeWatchMetadataDialog } from "@/components/AnalyzeWatchMetadataDialog";
import { ImportSpreadsheetDialog } from "@/components/ImportSpreadsheetDialog";
import { useWatchData } from "@/hooks/useWatchData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useCollection } from "@/contexts/CollectionContext";
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
  const { selectedCollectionId, currentCollection } = useCollection();
  const { watches, wearEntries, loading, refetch } = useWatchData(selectedCollectionId);
  const { trips } = useTripData();
  const { waterUsages } = useWaterUsageData();
  const { collections, loading: collectionsLoading, refetch: refetchCollections } = useCollectionData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [localWatches, setLocalWatches] = useState(watches);
  const { toast } = useToast();

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
            year
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading collection...</p>
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
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <CollectionSwitcher />
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {currentCollection?.name || "My Collection"}
              </h1>
              <p className="text-muted-foreground">
                {watches.length} {watches.length === 1 ? "watch" : "watches"} in your collection
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
          <ImportSpreadsheetDialog />
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
          <QuickAddWearDialog watches={watches} onSuccess={refetch} />
          <AddWatchDialog onSuccess={refetch} />
        </div>
      </div>

      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search watches..."
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
              ? "No watches match your filters"
              : "No watches yet. Add your first watch!"}
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
                  onDelete={refetch}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default Collection;
