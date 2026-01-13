import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { useAllowedUserCheck } from "@/hooks/useAllowedUserCheck";
import { useAuth } from "@/contexts/AuthContext";
import { CollectionType, COLLECTION_CONFIGS, getCollectionConfig } from "@/types/collection";
import { ItemTypeIcon } from "./ItemTypeIcon";

interface CreateFirstCollectionDialogProps {
  onSuccess: () => void;
}

export const CreateFirstCollectionDialog = ({ onSuccess }: CreateFirstCollectionDialogProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("My Collection");
  const [collectionType, setCollectionType] = useState<CollectionType>("watches");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAllowed, loading: checkingAccess, refresh } = useAllowedUserCheck();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !user) {
      toast({
        title: "Error",
        description: "Please enter a collection name",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: `Your ${config.singularLabel.toLowerCase()} collection has been created!`,
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
        <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isAllowed === false) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && window.history.back()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Access Required</DialogTitle>
            <DialogDescription>
              Your account needs to be approved before you can create collections.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please contact an administrator to request access to the application. You can submit a registration request from the sign-in page.
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button onClick={refresh} variant="outline" className="flex-1">
              Refresh Status
            </Button>
            <Button onClick={() => window.history.back()} className="flex-1">
              Go Back
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && window.history.back()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Welcome! Create Your First Collection</DialogTitle>
          <DialogDescription>
            Choose what type of collection you want to track and give it a name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>What would you like to collect?</Label>
            <RadioGroup
              value={collectionType}
              onValueChange={(value) => setCollectionType(value as CollectionType)}
              className="grid gap-3"
            >
              {Object.values(COLLECTION_CONFIGS).map((config) => (
                <div key={config.type} className="relative">
                  <RadioGroupItem
                    value={config.type}
                    id={`first-${config.type}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`first-${config.type}`}
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
