import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WatchCard } from "@/components/WatchCard";
import { AddWatchDialog } from "@/components/AddWatchDialog";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { EditCollectionDialog } from "@/components/EditCollectionDialog";
import { CreateFirstCollectionDialog } from "@/components/CreateFirstCollectionDialog";
import { useWatchData } from "@/hooks/useWatchData";
import { useStatsCalculations } from "@/hooks/useStatsCalculations";
import { useTripData } from "@/hooks/useTripData";
import { useWaterUsageData } from "@/hooks/useWaterUsageData";
import { useCollectionData } from "@/hooks/useCollectionData";

const Collection = () => {
  const { watches, wearEntries, loading, refetch } = useWatchData();
  const { trips } = useTripData();
  const { waterUsages } = useWaterUsageData();
  const { collections, loading: collectionsLoading, refetch: refetchCollections } = useCollectionData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [showAddWatch, setShowAddWatch] = useState(false);

  const stats = useStatsCalculations(watches, wearEntries, trips, waterUsages);
  
  // Use first collection as default (user's primary collection)
  const currentCollection = collections[0];

  // Show onboarding dialog if user has no collections
  if (!collectionsLoading && collections.length === 0) {
    return <CreateFirstCollectionDialog onSuccess={refetchCollections} />;
  }

  if (loading || collectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading collection...</p>
        </div>
      </div>
    );
  }

  const filteredWatches = watches.filter((watch) => {
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
        <div className="flex gap-2">
          <QuickAddWearDialog watches={watches} onSuccess={refetch} />
          <Button onClick={() => setShowAddWatch(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Watch
          </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWatches.map((watch) => (
            <WatchCard
              key={watch.id}
              watch={watch}
              totalDays={wearEntries.filter((w) => w.watch_id === watch.id).length}
              onDelete={refetch}
            />
          ))}
        </div>
      )}

      <AddWatchDialog onSuccess={refetch} />
    </div>
  );
};

export default Collection;
