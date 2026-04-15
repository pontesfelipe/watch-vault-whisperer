import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareWristCheckCardProps {
  watch: {
    brand: string;
    model: string;
    ai_image_url?: string;
  };
  date: string;
  username?: string;
}

export function ShareWristCheckCard({ watch, date, username }: ShareWristCheckCardProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
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

      // Watch image
      if (watch.ai_image_url) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = watch.ai_image_url!;
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
      ctx.fillText(watch.brand, 540, 880);

      ctx.fillStyle = "#A0A0B0";
      ctx.font = "300 32px system-ui, sans-serif";
      ctx.fillText(watch.model, 540, 930);

      // Date
      ctx.fillStyle = "#D4A543";
      ctx.font = "20px system-ui, sans-serif";
      ctx.fillText(date, 540, 1000);

      // Gold accent line
      ctx.fillStyle = "#D4A543";
      ctx.fillRect(100, 1060, 880, 2);

      // Footer
      ctx.fillStyle = "#666";
      ctx.font = "18px system-ui, sans-serif";
      ctx.fillText(username ? `@${username}` : "", 540, 1120);

      ctx.fillStyle = "#D4A543";
      ctx.font = "bold 22px system-ui, sans-serif";
      ctx.fillText("SORA VAULT", 540, 1200);

      ctx.fillStyle = "#555";
      ctx.font = "16px system-ui, sans-serif";
      ctx.fillText("soravault.app", 540, 1240);

      // Convert to blob and share
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );

      if (navigator.share && navigator.canShare?.({ files: [new File([blob], "wrist-check.png")] })) {
        await navigator.share({
          title: `${watch.brand} ${watch.model} — Wrist Check`,
          text: `Wearing my ${watch.brand} ${watch.model} today 🕰️`,
          files: [new File([blob], "wrist-check.png", { type: "image/png" })],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wrist-check-${watch.brand}-${watch.model}.png`.replace(/\s+/g, "-").toLowerCase();
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Wrist check card downloaded!");
      }
    } catch (err) {
      console.error("Share error:", err);
      toast.error("Failed to share");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={sharing}
      className="gap-1.5"
    >
      <Share2 className="h-3.5 w-3.5" />
      {sharing ? "Generating..." : "Share"}
    </Button>
  );
}
