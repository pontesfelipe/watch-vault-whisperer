import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const watchSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(100),
  model: z.string().trim().min(1, "Model is required").max(200),
  dialColor: z.string().trim().min(1, "Dial color is required").max(50),
  type: z.string().trim().min(1, "Type is required").max(100),
  cost: z.number().min(0, "Cost must be positive"),
  averageResalePrice: z.number().min(0, "Resale price must be positive").optional(),
  warrantyDate: z.string().optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'very_rare', 'grail']).optional(),
  historicalSignificance: z.enum(['regular', 'notable', 'historically_significant']).optional(),
});

interface Watch {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost: number;
  case_size?: string;
  lug_to_lug_size?: string;
  caseback_material?: string;
  movement?: string;
  has_sapphire?: boolean;
  average_resale_price?: number;
  warranty_date?: string;
  warranty_card_url?: string;
  rarity?: string;
  historical_significance?: string;
  available_for_trade?: boolean;
}

export const EditWatchDialog = ({ watch, onSuccess }: { watch: Watch; onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    brand: watch.brand,
    model: watch.model,
    dialColor: watch.dial_color,
    type: watch.type,
    cost: watch.cost.toString(),
    caseSize: watch.case_size || "",
    lugToLugSize: watch.lug_to_lug_size || "",
    casebackMaterial: watch.caseback_material || "",
    movement: watch.movement || "",
    hasSapphire: watch.has_sapphire,
    averageResalePrice: watch.average_resale_price?.toString() || "",
    warrantyDate: watch.warranty_date || "",
    warrantyCardFile: null as File | null,
    rarity: (watch.rarity || "common") as "common" | "uncommon" | "rare" | "very_rare" | "grail",
    historicalSignificance: (watch.historical_significance || "regular") as "regular" | "notable" | "historically_significant",
    availableForTrade: watch.available_for_trade || false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setFormValues({
        brand: watch.brand,
        model: watch.model,
        dialColor: watch.dial_color,
        type: watch.type,
        cost: watch.cost.toString(),
        caseSize: watch.case_size || "",
        lugToLugSize: watch.lug_to_lug_size || "",
        casebackMaterial: watch.caseback_material || "",
        movement: watch.movement || "",
        hasSapphire: watch.has_sapphire,
        averageResalePrice: watch.average_resale_price?.toString() || "",
        warrantyDate: watch.warranty_date || "",
        warrantyCardFile: null,
        rarity: (watch.rarity || "common") as any,
        historicalSignificance: (watch.historical_significance || "regular") as any,
        availableForTrade: watch.available_for_trade || false,
      });
    }
  }, [open, watch]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = watchSchema.parse({
        brand: formValues.brand,
        model: formValues.model,
        dialColor: formValues.dialColor,
        type: formValues.type,
        cost: parseFloat(formValues.cost),
        averageResalePrice: formValues.averageResalePrice ? parseFloat(formValues.averageResalePrice) : undefined,
        warrantyDate: formValues.warrantyDate || undefined,
        rarity: formValues.rarity,
        historicalSignificance: formValues.historicalSignificance,
      });

      // Upload warranty card if provided
      let warrantyCardUrl = watch.warranty_card_url;
      if (formValues.warrantyCardFile) {
        const fileExt = formValues.warrantyCardFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('warranty-cards')
          .upload(fileName, formValues.warrantyCardFile);

        if (uploadError) {
          toast({
            title: "Upload Error",
            description: "Failed to upload warranty card",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('warranty-cards')
          .getPublicUrl(fileName);

        warrantyCardUrl = publicUrl;
      }

      const { error } = await supabase
        .from("watches")
        .update({
          brand: data.brand,
          model: data.model,
          dial_color: data.dialColor,
          type: data.type,
          cost: data.cost,
          case_size: formValues.caseSize || null,
          lug_to_lug_size: formValues.lugToLugSize || null,
          caseback_material: formValues.casebackMaterial || null,
          movement: formValues.movement || null,
          has_sapphire: formValues.hasSapphire,
          average_resale_price: data.averageResalePrice || null,
          warranty_date: data.warrantyDate || null,
          warranty_card_url: warrantyCardUrl,
          rarity: data.rarity || 'common',
          historical_significance: data.historicalSignificance || 'regular',
          available_for_trade: formValues.availableForTrade,
        })
        .eq("id", watch.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Watch updated successfully",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update watch",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Watch</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formValues.brand}
              onChange={(e) => setFormValues({ ...formValues, brand: e.target.value })}
              required
              maxLength={100}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={formValues.model}
              onChange={(e) => setFormValues({ ...formValues, model: e.target.value })}
              required
              maxLength={200}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialColor">Dial Color</Label>
            <Input
              id="dialColor"
              value={formValues.dialColor}
              onChange={(e) => setFormValues({ ...formValues, dialColor: e.target.value })}
              required
              maxLength={50}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              value={formValues.type}
              onChange={(e) => setFormValues({ ...formValues, type: e.target.value })}
              required
              maxLength={100}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">Cost ($)</Label>
            <Input
              id="cost"
              value={formValues.cost}
              onChange={(e) => setFormValues({ ...formValues, cost: e.target.value })}
              type="number"
              step="0.01"
              min="0"
              required
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rarity">Rarity</Label>
            <Select
              value={formValues.rarity}
              onValueChange={(value) => setFormValues({ ...formValues, rarity: value as any })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="uncommon">Uncommon</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="very_rare">Very Rare</SelectItem>
                <SelectItem value="grail">Grail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="historicalSignificance">Historical Significance</Label>
            <Select
              value={formValues.historicalSignificance}
              onValueChange={(value) => setFormValues({ ...formValues, historicalSignificance: value as any })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select significance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="notable">Notable</SelectItem>
                <SelectItem value="historically_significant">Historically Significant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="availableForTrade"
              checked={formValues.availableForTrade}
              onCheckedChange={(checked) =>
                setFormValues({ ...formValues, availableForTrade: checked === true })
              }
            />
            <Label
              htmlFor="availableForTrade"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Available for trade/sell
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="averageResalePrice">Avg. US Resale Price (Market Data) - Optional</Label>
            <Input
              id="averageResalePrice"
              value={formValues.averageResalePrice}
              onChange={(e) => setFormValues({ ...formValues, averageResalePrice: e.target.value })}
              type="number"
              step="0.01"
              min="0"
              placeholder="From online resale marketplaces"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              Based on data from Chrono24, Bob's Watches, WatchBox, and Crown & Caliber
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyDate">Warranty Expiration Date - Optional</Label>
            <Input
              id="warrantyDate"
              value={formValues.warrantyDate}
              onChange={(e) => setFormValues({ ...formValues, warrantyDate: e.target.value })}
              type="date"
              className="bg-background border-border"
            />
            {formValues.warrantyDate && new Date(formValues.warrantyDate) < new Date() && (
              <p className="text-xs text-destructive">Warranty has expired</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyCard">Warranty Card - Optional</Label>
            <Input
              id="warrantyCard"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFormValues({ ...formValues, warrantyCardFile: e.target.files?.[0] || null })}
              className="bg-background border-border"
            />
            {watch.warranty_card_url && !formValues.warrantyCardFile && (
              <p className="text-xs text-muted-foreground">
                Current: <a href={watch.warranty_card_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View existing card</a>
              </p>
            )}
            {formValues.warrantyCardFile && (
              <p className="text-xs text-green-500">New file selected: {formValues.warrantyCardFile.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caseSize">Case Size - Optional</Label>
            <Input
              id="caseSize"
              value={formValues.caseSize}
              onChange={(e) => setFormValues({ ...formValues, caseSize: e.target.value })}
              placeholder="e.g., 41mm"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lugToLugSize">Lug to Lug - Optional</Label>
            <Input
              id="lugToLugSize"
              value={formValues.lugToLugSize}
              onChange={(e) => setFormValues({ ...formValues, lugToLugSize: e.target.value })}
              placeholder="e.g., 48mm"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="movement">Movement - Optional</Label>
            <Input
              id="movement"
              value={formValues.movement}
              onChange={(e) => setFormValues({ ...formValues, movement: e.target.value })}
              placeholder="e.g., Automatic"
              className="bg-background border-border"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
