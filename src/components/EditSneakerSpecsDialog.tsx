import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Footprints } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SNEAKER_CONDITIONS } from "@/types/collection";

interface EditSneakerSpecsDialogProps {
  itemId: string;
  itemName: string;
  onSuccess: () => void;
}

export const EditSneakerSpecsDialog = ({ itemId, itemName, onSuccess }: EditSneakerSpecsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specId, setSpecId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    colorway: "",
    shoeSize: "",
    sizeType: "US" as string,
    sku: "",
    styleCode: "",
    condition: "used" as string,
    boxIncluded: false,
    ogAll: false,
    collaboration: "",
    limitedEdition: false,
    releaseDate: "",
    silhouette: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const fetchSpecs = async () => {
      const { data, error } = await supabase
        .from("sneaker_specs")
        .select("*")
        .eq("item_id", itemId)
        .maybeSingle();

      if (data) {
        setSpecId(data.id);
        setFormValues({
          colorway: data.colorway || "",
          shoeSize: data.shoe_size || "",
          sizeType: data.size_type || "US",
          sku: data.sku || "",
          styleCode: data.style_code || "",
          condition: data.condition || "used",
          boxIncluded: data.box_included || false,
          ogAll: data.og_all || false,
          collaboration: data.collaboration || "",
          limitedEdition: data.limited_edition || false,
          releaseDate: data.release_date || "",
          silhouette: data.silhouette || "",
        });
      }
    };

    fetchSpecs();
  }, [open, itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specsData = {
        item_id: itemId,
        colorway: formValues.colorway || null,
        shoe_size: formValues.shoeSize || null,
        size_type: formValues.sizeType,
        sku: formValues.sku || null,
        style_code: formValues.styleCode || null,
        condition: formValues.condition,
        box_included: formValues.boxIncluded,
        og_all: formValues.ogAll,
        collaboration: formValues.collaboration || null,
        limited_edition: formValues.limitedEdition,
        release_date: formValues.releaseDate || null,
        silhouette: formValues.silhouette || null,
      };

      if (specId) {
        const { error } = await supabase
          .from("sneaker_specs")
          .update(specsData)
          .eq("id", specId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sneaker_specs")
          .insert(specsData);

        if (error) throw error;
      }

      toast({
        title: "Sneaker specs updated",
        description: "Details saved successfully",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating sneaker specs:", error);
      toast({
        title: "Error",
        description: "Failed to update sneaker specs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 border-borderSubtle h-9 sm:h-10 px-2 sm:px-3">
          <Footprints className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-xs">Specs</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface border-borderSubtle max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-textMain flex items-center gap-2">
            <Footprints className="w-5 h-5 text-primary" />
            Edit Sneaker Specs
          </DialogTitle>
          <p className="text-sm text-textMuted">{itemName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shoeSize">Shoe Size</Label>
              <Input
                id="shoeSize"
                value={formValues.shoeSize}
                onChange={(e) => setFormValues({ ...formValues, shoeSize: e.target.value })}
                placeholder="10.5"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizeType">Size Type</Label>
              <Select
                value={formValues.sizeType}
                onValueChange={(value) => setFormValues({ ...formValues, sizeType: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">US</SelectItem>
                  <SelectItem value="UK">UK</SelectItem>
                  <SelectItem value="EU">EU</SelectItem>
                  <SelectItem value="CM">CM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="colorway">Colorway</Label>
            <Input
              id="colorway"
              value={formValues.colorway}
              onChange={(e) => setFormValues({ ...formValues, colorway: e.target.value })}
              placeholder="Black/White/University Red"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select
              value={formValues.condition}
              onValueChange={(value) => setFormValues({ ...formValues, condition: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SNEAKER_CONDITIONS).map(([key, { label, description }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{label}</span>
                      <span className="text-xs text-textMuted">{description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formValues.sku}
                onChange={(e) => setFormValues({ ...formValues, sku: e.target.value })}
                placeholder="DQ3083-001"
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="styleCode">Style Code</Label>
              <Input
                id="styleCode"
                value={formValues.styleCode}
                onChange={(e) => setFormValues({ ...formValues, styleCode: e.target.value })}
                placeholder="CW2288"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="silhouette">Silhouette</Label>
            <Input
              id="silhouette"
              value={formValues.silhouette}
              onChange={(e) => setFormValues({ ...formValues, silhouette: e.target.value })}
              placeholder="Air Jordan 1 High"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaboration">Collaboration</Label>
            <Input
              id="collaboration"
              value={formValues.collaboration}
              onChange={(e) => setFormValues({ ...formValues, collaboration: e.target.value })}
              placeholder="Travis Scott, Off-White, etc."
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDate">Release Date</Label>
            <Input
              id="releaseDate"
              type="date"
              value={formValues.releaseDate}
              onChange={(e) => setFormValues({ ...formValues, releaseDate: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="boxIncluded"
                checked={formValues.boxIncluded}
                onCheckedChange={(checked) => setFormValues({ ...formValues, boxIncluded: !!checked })}
              />
              <Label htmlFor="boxIncluded" className="cursor-pointer">Box Included</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="ogAll"
                checked={formValues.ogAll}
                onCheckedChange={(checked) => setFormValues({ ...formValues, ogAll: !!checked })}
              />
              <Label htmlFor="ogAll" className="cursor-pointer">OG All (All original accessories)</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="limitedEdition"
                checked={formValues.limitedEdition}
                onCheckedChange={(checked) => setFormValues({ ...formValues, limitedEdition: !!checked })}
              />
              <Label htmlFor="limitedEdition" className="cursor-pointer">Limited Edition</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Specs"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
