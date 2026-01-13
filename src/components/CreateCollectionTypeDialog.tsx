import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CollectionType, COLLECTION_CONFIGS, getCollectionConfig } from "@/types/collection";
import { ItemTypeIcon } from "./ItemTypeIcon";

interface CreateCollectionTypeDialogProps {
  onSuccess: () => void;
}

export const CreateCollectionTypeDialog = ({ onSuccess }: CreateCollectionTypeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [collectionType, setCollectionType] = useState<CollectionType>("watches");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !user) {
      toast.error("Collection name is required");
      return;
    }

    setLoading(true);

    try {
      // Create the collection with type
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections' as any)
        .insert({
          name: name.trim(),
          created_by: user.id,
          collection_type: collectionType,
        } as any)
        .select()
        .single();

      if (collectionError) throw collectionError;

      // Link user to collection as owner
      const { error: linkError } = await supabase
        .from('user_collections' as any)
        .insert({
          user_id: user.id,
          collection_id: (collectionData as any).id,
          role: 'owner',
        } as any);

      if (linkError) throw linkError;

      const config = getCollectionConfig(collectionType);
      toast.success(`${config.singularLabel} collection created!`);
      setOpen(false);
      setName("");
      setCollectionType("watches");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" />
          New Collection
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
            <DialogDescription>
              Choose a collection type and give it a name.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Collection Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Collection"
                required
              />
            </div>

            <div className="space-y-3">
              <Label>Collection Type</Label>
              <RadioGroup
                value={collectionType}
                onValueChange={(value) => setCollectionType(value as CollectionType)}
                className="grid gap-3"
              >
                {Object.values(COLLECTION_CONFIGS).map((config) => (
                  <div key={config.type} className="relative">
                    <RadioGroupItem
                      value={config.type}
                      id={config.type}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={config.type}
                      className="flex items-start gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
                    >
                      <ItemTypeIcon type={config.type} size="lg" className="mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{config.label}</p>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
