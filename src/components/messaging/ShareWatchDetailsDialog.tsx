import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WatchForShare {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost?: number;
  msrp?: number;
  average_resale_price?: number;
  case_size?: string;
  lug_to_lug_size?: string;
  movement?: string;
  caseback_material?: string;
  has_sapphire?: boolean;
  warranty_date?: string;
  rarity?: string;
  historical_significance?: string;
}

interface ShareWatchDetailsDialogProps {
  conversationId: string;
  onSendMessage: (conversationId: string, content: string) => Promise<{ success?: boolean; error?: string }>;
}

const SHARE_FIELDS = [
  { key: "brand", label: "Brand", always: true },
  { key: "model", label: "Model", always: true },
  { key: "dial_color", label: "Dial Color", always: false },
  { key: "type", label: "Type/Style", always: false },
  { key: "cost", label: "Purchase Price", always: false },
  { key: "msrp", label: "MSRP", always: false },
  { key: "average_resale_price", label: "Avg Resale Price", always: false },
  { key: "case_size", label: "Case Size", always: false },
  { key: "lug_to_lug_size", label: "Lug-to-Lug", always: false },
  { key: "movement", label: "Movement", always: false },
  { key: "caseback_material", label: "Caseback Material", always: false },
  { key: "has_sapphire", label: "Sapphire Crystal", always: false },
  { key: "warranty_date", label: "Warranty Date", always: false },
  { key: "rarity", label: "Rarity", always: false },
  { key: "historical_significance", label: "Historical Significance", always: false },
] as const;

export function ShareWatchDetailsDialog({ conversationId, onSendMessage }: ShareWatchDetailsDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [watches, setWatches] = useState<WatchForShare[]>([]);
  const [selectedWatchId, setSelectedWatchId] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<string[]>(
    SHARE_FIELDS.filter(f => f.always).map(f => f.key)
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchWatches = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("watches")
      .select("id, brand, model, dial_color, type, cost, msrp, average_resale_price, case_size, lug_to_lug_size, movement, caseback_material, has_sapphire, warranty_date, rarity, historical_significance")
      .eq("user_id", user.id)
      .order("brand");

    if (error) {
      console.error("Error fetching watches:", error);
      toast.error("Failed to load watches");
    } else {
      setWatches(data || []);
    }
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchWatches();
      setSelectedWatchId("");
      setSelectedFields(SHARE_FIELDS.filter(f => f.always).map(f => f.key));
    }
  };

  const toggleField = (fieldKey: string) => {
    const field = SHARE_FIELDS.find(f => f.key === fieldKey);
    if (field?.always) return; // Can't toggle required fields
    
    setSelectedFields(prev => 
      prev.includes(fieldKey) 
        ? prev.filter(f => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const selectAll = () => {
    setSelectedFields(SHARE_FIELDS.map(f => f.key));
  };

  const selectNone = () => {
    setSelectedFields(SHARE_FIELDS.filter(f => f.always).map(f => f.key));
  };

  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === "") return "N/A";
    
    if (key === "cost" || key === "msrp" || key === "average_resale_price") {
      return `$${Number(value).toLocaleString()}`;
    }
    if (key === "has_sapphire") {
      return value ? "Yes" : "No";
    }
    if (key === "warranty_date") {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  const handleShare = async () => {
    const watch = watches.find(w => w.id === selectedWatchId);
    if (!watch) return;

    setSending(true);
    
    // Build the message
    let message = `📋 **Watch Details**\n\n`;
    message += `🕐 **${watch.brand} ${watch.model}**\n\n`;
    
    selectedFields.forEach(fieldKey => {
      if (fieldKey === "brand" || fieldKey === "model") return; // Already in header
      const field = SHARE_FIELDS.find(f => f.key === fieldKey);
      if (field) {
        const value = watch[fieldKey as keyof WatchForShare];
        if (value !== null && value !== undefined && value !== "") {
          message += `• ${field.label}: ${formatValue(fieldKey, value)}\n`;
        }
      }
    });

    const result = await onSendMessage(conversationId, message);
    
    if (result.success) {
      toast.success("Watch details shared!");
      setOpen(false);
    } else {
      toast.error("Failed to share watch details");
    }
    
    setSending(false);
  };

  const selectedWatch = watches.find(w => w.id === selectedWatchId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Share watch details">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Watch Details</DialogTitle>
          <DialogDescription>
            Select a watch from your collection and choose which details to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Watch Selection */}
          <div className="space-y-2">
            <Label>Select Watch</Label>
            <Select value={selectedWatchId} onValueChange={setSelectedWatchId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading..." : "Choose a watch"} />
              </SelectTrigger>
              <SelectContent>
                {watches.map(watch => (
                  <SelectItem key={watch.id} value={watch.id}>
                    {watch.brand} {watch.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          {selectedWatch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Details to Share</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectNone} className="text-xs h-7">
                    Minimum
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[200px] border rounded-md p-3">
                <div className="space-y-2">
                  {SHARE_FIELDS.map(field => {
                    const value = selectedWatch[field.key as keyof WatchForShare];
                    const hasValue = value !== null && value !== undefined && value !== "";
                    
                    return (
                      <div 
                        key={field.key} 
                        className="flex items-center justify-between py-1"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={field.key}
                            checked={selectedFields.includes(field.key)}
                            onCheckedChange={() => toggleField(field.key)}
                            disabled={field.always || !hasValue}
                          />
                          <label 
                            htmlFor={field.key}
                            className={`text-sm cursor-pointer ${!hasValue ? "text-muted-foreground" : ""}`}
                          >
                            {field.label}
                          </label>
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {hasValue ? formatValue(field.key, value) : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!selectedWatchId || sending}
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Share Details
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}