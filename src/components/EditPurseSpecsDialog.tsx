import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PURSE_SIZES, STRAP_TYPES } from "@/types/collection";

interface EditPurseSpecsDialogProps {
  itemId: string;
  itemName: string;
  onSuccess: () => void;
}

export const EditPurseSpecsDialog = ({ itemId, itemName, onSuccess }: EditPurseSpecsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [specId, setSpecId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    material: "",
    hardwareColor: "",
    sizeCategory: "medium" as string,
    authenticityVerified: false,
    serialNumber: "",
    dustBagIncluded: false,
    closureType: "",
    strapType: "removable" as string,
    boxIncluded: false,
    authenticityCardIncluded: false,
    color: "",
    pattern: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const fetchSpecs = async () => {
      const { data, error } = await supabase
        .from("purse_specs")
        .select("*")
        .eq("item_id", itemId)
        .maybeSingle();

      if (data) {
        setSpecId(data.id);
        setFormValues({
          material: data.material || "",
          hardwareColor: data.hardware_color || "",
          sizeCategory: data.size_category || "medium",
          authenticityVerified: data.authenticity_verified || false,
          serialNumber: data.serial_number || "",
          dustBagIncluded: data.dust_bag_included || false,
          closureType: data.closure_type || "",
          strapType: data.strap_type || "removable",
          boxIncluded: data.box_included || false,
          authenticityCardIncluded: data.authenticity_card_included || false,
          color: data.color || "",
          pattern: data.pattern || "",
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
        material: formValues.material || null,
        hardware_color: formValues.hardwareColor || null,
        size_category: formValues.sizeCategory,
        authenticity_verified: formValues.authenticityVerified,
        serial_number: formValues.serialNumber || null,
        dust_bag_included: formValues.dustBagIncluded,
        closure_type: formValues.closureType || null,
        strap_type: formValues.strapType,
        box_included: formValues.boxIncluded,
        authenticity_card_included: formValues.authenticityCardIncluded,
        color: formValues.color || null,
        pattern: formValues.pattern || null,
      };

      if (specId) {
        const { error } = await supabase
          .from("purse_specs")
          .update(specsData)
          .eq("id", specId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("purse_specs")
          .insert(specsData);

        if (error) throw error;
      }

      toast({
        title: "Purse specs updated",
        description: "Details saved successfully",
      });

      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating purse specs:", error);
      toast({
        title: "Error",
        description: "Failed to update purse specs",
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
          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-xs">Specs</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-surface border-borderSubtle max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-textMain flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Edit Purse Specs
          </DialogTitle>
          <p className="text-sm text-textMuted">{itemName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material</Label>
              <Input
                id="material"
                value={formValues.material}
                onChange={(e) => setFormValues({ ...formValues, material: e.target.value })}
                placeholder="Leather, Canvas, etc."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardwareColor">Hardware Color</Label>
              <Input
                id="hardwareColor"
                value={formValues.hardwareColor}
                onChange={(e) => setFormValues({ ...formValues, hardwareColor: e.target.value })}
                placeholder="Gold, Silver, etc."
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formValues.color}
                onChange={(e) => setFormValues({ ...formValues, color: e.target.value })}
                placeholder="Black, Brown, etc."
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pattern">Pattern</Label>
              <Input
                id="pattern"
                value={formValues.pattern}
                onChange={(e) => setFormValues({ ...formValues, pattern: e.target.value })}
                placeholder="Monogram, Solid, etc."
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sizeCategory">Size Category</Label>
            <Select
              value={formValues.sizeCategory}
              onValueChange={(value) => setFormValues({ ...formValues, sizeCategory: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PURSE_SIZES).map(([key, { label, description }]) => (
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

          <div className="space-y-2">
            <Label htmlFor="strapType">Strap Type</Label>
            <Select
              value={formValues.strapType}
              onValueChange={(value) => setFormValues({ ...formValues, strapType: value })}
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STRAP_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="closureType">Closure Type</Label>
            <Input
              id="closureType"
              value={formValues.closureType}
              onChange={(e) => setFormValues({ ...formValues, closureType: e.target.value })}
              placeholder="Zipper, Magnetic, Clasp, etc."
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input
              id="serialNumber"
              value={formValues.serialNumber}
              onChange={(e) => setFormValues({ ...formValues, serialNumber: e.target.value })}
              placeholder="For authenticity tracking"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <Checkbox
                id="authenticityVerified"
                checked={formValues.authenticityVerified}
                onCheckedChange={(checked) => setFormValues({ ...formValues, authenticityVerified: !!checked })}
              />
              <Label htmlFor="authenticityVerified" className="cursor-pointer">Authenticity Verified</Label>
            </div>
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
                id="dustBagIncluded"
                checked={formValues.dustBagIncluded}
                onCheckedChange={(checked) => setFormValues({ ...formValues, dustBagIncluded: !!checked })}
              />
              <Label htmlFor="dustBagIncluded" className="cursor-pointer">Dust Bag Included</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="authenticityCardIncluded"
                checked={formValues.authenticityCardIncluded}
                onCheckedChange={(checked) => setFormValues({ ...formValues, authenticityCardIncluded: !!checked })}
              />
              <Label htmlFor="authenticityCardIncluded" className="cursor-pointer">Authenticity Card Included</Label>
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
