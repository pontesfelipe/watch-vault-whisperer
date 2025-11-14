import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateFirstCollectionDialogProps {
  onSuccess: () => void;
}

export const CreateFirstCollectionDialog = ({ onSuccess }: CreateFirstCollectionDialogProps) => {
  const [name, setName] = useState("My Collection");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create the collection
      const { data: collection, error: collectionError } = await ((supabase as any)
        .from("collections")
        .insert({
          name: name.trim(),
          created_by: user.id,
        })
        .select()
        .single());

      if (collectionError) throw collectionError;

      // Add user as owner
      const { error: userCollectionError } = await ((supabase as any)
        .from("user_collections")
        .insert({
          user_id: user.id,
          collection_id: collection.id,
          role: 'owner',
        }));

      if (userCollectionError) throw userCollectionError;

      toast({
        title: "Success",
        description: "Your collection has been created!",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create collection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Create Your First Collection</DialogTitle>
          <DialogDescription>
            Collections help you organize your watches. Give your first collection a name to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Collection"
              disabled={loading}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Collection"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
