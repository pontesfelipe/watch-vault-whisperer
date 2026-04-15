import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "icon" | "default";
  className?: string;
  label?: string;
}

export function ShareButton({ url, title, text, variant = "ghost", size = "sm", className, label }: ShareButtonProps) {
  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: text || title, url: fullUrl });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleShare} aria-label="Share">
      <Share2 className="h-4 w-4" />
      {label && <span className="ml-1">{label}</span>}
    </Button>
  );
}
