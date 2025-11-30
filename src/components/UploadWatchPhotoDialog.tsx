import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Upload, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UploadWatchPhotoDialogProps {
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

export function UploadWatchPhotoDialog({ watch, onSuccess }: UploadWatchPhotoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPhotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateAIImage = async () => {
    if (!photoBase64) {
      toast.error("Please upload a photo first");
      return;
    }

    setIsUploading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-watch-image', {
        body: {
          watchId: watch.id,
          brand: watch.brand,
          model: watch.model,
          dialColor: watch.dial_color,
          type: watch.type,
          caseSize: watch.case_size,
          movement: watch.movement,
          referenceImageBase64: photoBase64
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("AI image generated successfully!");
      setOpen(false);
      setPreviewUrl(null);
      setPhotoBase64(null);
      onSuccess();
    } catch (error) {
      console.error("Error generating AI image:", error);
      toast.error("Failed to generate AI image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setPreviewUrl(null);
    setPhotoBase64(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" title="Upload photo & generate AI image">
          <Camera className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate AI Watch Image</DialogTitle>
          <DialogDescription>
            Upload a photo of your {watch.brand} {watch.model} to generate an enhanced AI image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain bg-muted"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleGenerateAIImage}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload a photo of your watch
              </p>
              <p className="text-xs text-muted-foreground">
                The AI will use this as a reference to create an enhanced image
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
