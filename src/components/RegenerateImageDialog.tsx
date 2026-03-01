import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RefreshCw, Camera, Sparkles, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RegenerateImageDialogProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    dial_color: string;
    type: string;
    case_size?: string;
    movement?: string;
  };
  onSuccess: () => void;
}

export function RegenerateImageDialog({ watch, onSuccess }: RegenerateImageDialogProps) {
  const [open, setOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    if (!open || isAdmin || !user) return;
    const checkUsage = async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("ai_feature_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("feature_name", "regenerate-watch-image")
        .gte("used_at", startOfMonth.toISOString());
      setUsageCount(count ?? 0);
    };
    checkUsage();
  }, [open, isAdmin, user]);

  const hasReachedLimit = !isAdmin && (usageCount ?? 0) >= 1;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use an image under 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleRegenerate = async (withPhoto: boolean) => {
    setRegenerating(true);
    try {
      const body: Record<string, unknown> = {
        watchId: watch.id,
        brand: watch.brand,
        model: watch.model,
        edition: watch.model,
        dialColor: watch.dial_color,
        type: watch.type,
        caseSize: watch.case_size || undefined,
        movement: watch.movement || undefined,
      };

      if (withPhoto && photoBase64) {
        body.referenceImageBase64 = photoBase64;
      }

      const { data, error } = await supabase.functions.invoke("generate-watch-image", { body });
      
      if (error) {
        // Check for monthly limit error
        if (data?.code === "MONTHLY_LIMIT") {
          toast({ title: "Limit reached", description: "You can regenerate 1 image per month.", variant: "destructive" });
          setUsageCount(1);
          return;
        }
        throw error;
      }

      toast({ title: "Success", description: "AI image regenerated successfully" });
      setUsageCount((prev) => (prev ?? 0) + 1);
      onSuccess();
      setOpen(false);
      clearPhoto();
    } catch (err) {
      console.error("Regenerate failed:", err);
      toast({ title: "Error", description: "Failed to regenerate image. Please try again.", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) clearPhoto(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Regenerate Image
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate AI Image</DialogTitle>
          <DialogDescription>
            For best results with lesser-known brands, take or upload a photo of your watch — the AI will use it as a reference to create a standardized catalog image.
          </DialogDescription>
        </DialogHeader>

        {hasReachedLimit ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              You've used your monthly image regeneration. Resets next month.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {!isAdmin && (
              <p className="text-xs text-muted-foreground text-center">
                {usageCount === 0 ? "1 regeneration remaining this month" : "Loading..."}
              </p>
            )}

            {/* Photo preview */}
            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted">
                <img src={photoPreview} alt="Your watch" className="w-full h-48 object-contain" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm"
                  onClick={clearPhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-24 flex-col gap-2"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Take Photo</span>
                </Button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  className="flex-1 h-24 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Photo</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              {photoBase64 && (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleRegenerate(true)}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  {regenerating ? "Generating..." : "Generate from Photo"}
                </Button>
              )}

              <Button
                variant={photoBase64 ? "outline" : "default"}
                className="w-full gap-2"
                onClick={() => handleRegenerate(false)}
                disabled={regenerating}
              >
                {regenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {regenerating ? "Generating..." : "Generate from AI Only"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Photo-based generation works best for microbrands and niche watches.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
