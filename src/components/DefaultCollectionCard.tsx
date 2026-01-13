import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection } from "@/contexts/CollectionContext";
import { ItemTypeIcon } from "@/components/ItemTypeIcon";
import { getCollectionConfig } from "@/types/collection";
import { Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export const DefaultCollectionCard = () => {
  const { collections, collectionsLoading } = useCollection();
  const [defaultCollectionId, setDefaultCollectionId] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem('defaultCollectionId');
    if (saved) {
      setDefaultCollectionId(saved);
    }
  }, []);

  const handleChange = (value: string) => {
    setDefaultCollectionId(value);
    if (value === "auto") {
      localStorage.removeItem('defaultCollectionId');
      toast.success("Default collection set to automatic (your owned collection)");
    } else {
      localStorage.setItem('defaultCollectionId', value);
      const collection = collections.find(c => c.id === value);
      toast.success(`Default collection set to "${collection?.name}"`);
    }
  };

  if (collectionsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Default Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Default Collection
        </CardTitle>
        <CardDescription>
          Choose which collection opens by default when you log in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="defaultCollection">Default Collection</Label>
          <Select value={defaultCollectionId || "auto"} onValueChange={handleChange}>
            <SelectTrigger id="defaultCollection">
              <SelectValue placeholder="Select default collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <span className="flex items-center gap-2">
                  Automatic (your owned collection)
                </span>
              </SelectItem>
              {collections.map((collection) => {
                const config = getCollectionConfig(collection.collection_type);
                return (
                  <SelectItem key={collection.id} value={collection.id}>
                    <span className="flex items-center gap-2">
                      <ItemTypeIcon type={collection.collection_type} size="sm" />
                      {collection.name}
                      <span className="text-muted-foreground text-xs">({config.label})</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-2">
            This preference is saved locally and persists even after logging out.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
