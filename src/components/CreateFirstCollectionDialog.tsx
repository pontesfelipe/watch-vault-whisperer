import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";

interface CreateFirstCollectionDialogProps {
  onSuccess: () => void;
}

export const CreateFirstCollectionDialog = ({ onSuccess }: CreateFirstCollectionDialogProps) => {
  const [name, setName] = useState("My Collection");
  const [loading, setLoading] = useState(false);
  const [checkKey, setCheckKey] = useState(0);
  const { toast } = useToast();
  const { isAllowed, loading: checkingAccess } = useAllowedUserCheck();

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

  if (checkingAccess) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isAllowed === false) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Access Required</DialogTitle>
            <DialogDescription>
              Your account needs to be approved before you can create collections.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please contact an administrator to request access to the watch tracker application. You can submit a registration request from the sign-in page.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
              Refresh Status
            </Button>
            <Button onClick={() => window.location.href = '/auth'} className="flex-1">
              Sign In Page
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
