import { useState, useRef } from "react";
import { ResponsiveDialog } from "@/components/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Image as ImageIcon, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Watch {
  id: string;
  brand: string;
  model: string;
  ai_image_url?: string | null;
}

interface WristCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watches: Watch[];
  username?: string;
}

export function WristCheckDialog({ open, onOpenChange, watches, username }: WristCheckDialogProps) {
  const { user } = useAuth();
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [caption, setCaption] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [sharing, setSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoUrl(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoFile(null);
  };

  const handleShare = async () => {
    if (!selectedWatch) {
      toast.error("Select a watch first");
      return;
    }

    setSharing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
      gradient.addColorStop(0, "#080B14");
      gradient.addColorStop(1, "#0F1420");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1350);

      // Gold accent line
      ctx.fillStyle = "#D4A543";
      ctx.fillRect(100, 200, 880, 2);

      // Title
      ctx.fillStyle = "#D4A543";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("WRIST CHECK", 540, 170);

      // Image (user photo or AI image)
      const imageUrl = photoUrl || selectedWatch.ai_image_url;
      if (imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageUrl;
          });
          const size = 500;
          const x = (1080 - size) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(x, 280, size, size, 32);
          ctx.clip();
          ctx.drawImage(img, x, 280, size, size);
          ctx.restore();
        } catch {
          // Skip image if it fails
        }
      }

      // Watch info
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 48px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(selectedWatch.brand, 540, 880);

      ctx.fillStyle = "#A0A0B0";
      ctx.font = "300 32px system-ui, sans-serif";
      ctx.fillText(selectedWatch.model, 540, 930);

      // Caption
      if (caption) {
        ctx.fillStyle = "#CCCCCC";
        ctx.font = "italic 24px system-ui, sans-serif";
        const maxWidth = 700;
        const lines = wrapText(ctx, `"${caption}"`, maxWidth);
        let y = 980;
        for (const line of lines.slice(0, 2)) {
          ctx.fillText(line, 540, y);
          y += 34;
        }
      }

      // Date
      ctx.fillStyle = "#D4A543";
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillText(new Date().toLocaleDateString("en-US", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric" 
      }), 540, 1060);

      // Gold accent line
      ctx.fillStyle = "#D4A543";
      ctx.fillRect(100, 1100, 880, 2);

      // Footer
      if (username) {
        ctx.fillStyle = "#666";
        ctx.font = "18px system-ui, sans-serif";
        ctx.fillText(`@${username}`, 540, 1150);
      }

      ctx.fillStyle = "#D4A543";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillText("SORA VAULT", 540, 1220);

      ctx.fillStyle = "#555";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("soravault.app", 540, 1260);

      // Convert to blob and share
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      const file = new File([blob], "wrist-check.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${selectedWatch.brand} ${selectedWatch.model} — Wrist Check`,
          text: caption || `Wearing my ${selectedWatch.brand} ${selectedWatch.model} today 🕰️`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wrist-check-${selectedWatch.brand}-${selectedWatch.model}.png`
          .replace(/\s+/g, "-")
          .toLowerCase();
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Wrist check card downloaded!");
      }

      onOpenChange(false);
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to share");
    } finally {
      setSharing(false);
    }
  };

  const reset = () => {
    setSelectedWatch(null);
    setCaption("");
    clearPhoto();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Wrist Check"
      className="sm:max-w-lg"
    >
      <div className="space-y-4">
        {/* Watch Selector */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Select your watch</Label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {watches.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWatch(w)}
                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                  selectedWatch?.id === w.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {w.ai_image_url ? (
                  <img
                    src={w.ai_image_url}
                    alt={`${w.brand} ${w.model}`}
                    className="w-10 h-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {w.brand.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{w.brand}</p>
                  <p className="text-xs text-muted-foreground truncate">{w.model}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Add a photo (optional)</Label>
          {photoUrl ? (
            <div className="relative w-full aspect-square max-w-[200px] mx-auto">
              <img
                src={photoUrl}
                alt="Wrist check photo"
                className="w-full h-full object-cover rounded-xl"
              />
              <button
                onClick={clearPhoto}
                className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="gap-1.5 flex-1"
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 flex-1"
              >
                <ImageIcon className="h-4 w-4" />
                Gallery
              </Button>
            </div>
          )}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Caption */}
        <div>
          <Label htmlFor="caption" className="text-sm font-medium mb-2 block">
            Caption (optional)
          </Label>
          <Textarea
            id="caption"
            placeholder="What's the occasion?"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={120}
            className="resize-none"
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1">{caption.length}/120</p>
        </div>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          disabled={!selectedWatch || sharing}
          className="w-full gap-2"
        >
          <Share2 className="h-4 w-4" />
          {sharing ? "Generating..." : "Share Wrist Check"}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
