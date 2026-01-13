import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCollection } from "@/contexts/CollectionContext";
import { CollectionType, getCollectionConfig, SNEAKER_CONDITIONS, PURSE_SIZES, STRAP_TYPES } from "@/types/collection";

interface AddItemDialogProps {
  onSuccess: () => void;
}

export const AddItemDialog = ({ onSuccess }: AddItemDialogProps) => {
  const { selectedCollectionId, currentCollectionType, currentCollectionConfig } = useCollection();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const { toast } = useToast();

  // Base form values (shared across all types)
  const [baseValues, setBaseValues] = useState({
    brand: "",
    model: "",
    primaryColor: "", // dial_color for watches, colorway for sneakers, color for purses
    type: "", // watch type, silhouette, or purse style
    cost: "",
    msrp: "",
    availableForTrade: false,
  });

  // Sneaker-specific values
  const [sneakerValues, setSneakerValues] = useState({
    shoeSize: "",
    sizeType: "US",
    sku: "",
    styleCode: "",
    condition: "used",
    boxIncluded: false,
    ogAll: false,
    collaboration: "",
    limitedEdition: false,
  });

  // Purse-specific values
  const [purseValues, setPurseValues] = useState({
    material: "",
    hardwareColor: "",
    sizeCategory: "medium",
    authenticityVerified: false,
    serialNumber: "",
    dustBagIncluded: false,
    closureType: "",
    strapType: "fixed",
    boxIncluded: false,
    authenticityCardIncluded: false,
    pattern: "",
  });

  const config = currentCollectionConfig;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!baseValues.brand.trim() || !baseValues.model.trim() || !baseValues.primaryColor.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get max sort order
      const { data: maxSortData } = await supabase
        .from("watches")
        .select("sort_order")
        .eq("collection_id", selectedCollectionId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSortOrder = maxSortData?.sort_order ? maxSortData.sort_order + 1 : 1;

      // Insert base item (using watches table for all types)
      const { data: insertData, error: insertError } = await supabase
        .from("watches")
        .insert({
          brand: baseValues.brand.trim(),
          model: baseValues.model.trim(),
          dial_color: baseValues.primaryColor.trim(),
          type: baseValues.type || config.defaultTypeOption,
          cost: parseFloat(baseValues.cost) || 0,
          msrp: baseValues.msrp ? parseFloat(baseValues.msrp) : null,
          when_bought: purchaseDate ? format(purchaseDate, "yyyy-MM-dd") : null,
          collection_id: selectedCollectionId,
          user_id: user.id,
          sort_order: nextSortOrder,
          available_for_trade: baseValues.availableForTrade,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert type-specific specs
      if (currentCollectionType === 'sneakers') {
        const { error: specsError } = await supabase
          .from('sneaker_specs' as any)
          .insert({
            item_id: insertData.id,
            user_id: user.id,
            colorway: baseValues.primaryColor.trim(),
            shoe_size: sneakerValues.shoeSize || null,
            size_type: sneakerValues.sizeType,
            sku: sneakerValues.sku || null,
            style_code: sneakerValues.styleCode || null,
            condition: sneakerValues.condition,
            box_included: sneakerValues.boxIncluded,
            og_all: sneakerValues.ogAll,
            collaboration: sneakerValues.collaboration || null,
            limited_edition: sneakerValues.limitedEdition,
            silhouette: baseValues.type || null,
          } as any);

        if (specsError) {
          console.error("Error inserting sneaker specs:", specsError);
        }
      } else if (currentCollectionType === 'purses') {
        const { error: specsError } = await supabase
          .from('purse_specs' as any)
          .insert({
            item_id: insertData.id,
            user_id: user.id,
            material: purseValues.material || null,
            hardware_color: purseValues.hardwareColor || null,
            size_category: purseValues.sizeCategory,
            authenticity_verified: purseValues.authenticityVerified,
            serial_number: purseValues.serialNumber || null,
            dust_bag_included: purseValues.dustBagIncluded,
            closure_type: purseValues.closureType || null,
            strap_type: purseValues.strapType,
            box_included: purseValues.boxIncluded,
            authenticity_card_included: purseValues.authenticityCardIncluded,
            color: baseValues.primaryColor.trim(),
            pattern: purseValues.pattern || null,
          } as any);

        if (specsError) {
          console.error("Error inserting purse specs:", specsError);
        }
      }

      toast({
        title: "Success",
        description: `${config.singularLabel} added to your collection`,
      });

      // Reset form
      setOpen(false);
      setPurchaseDate(undefined);
      setBaseValues({
        brand: "",
        model: "",
        primaryColor: "",
        type: "",
        cost: "",
        msrp: "",
        availableForTrade: false,
      });
      setSneakerValues({
        shoeSize: "",
        sizeType: "US",
        sku: "",
        styleCode: "",
        condition: "used",
        boxIncluded: false,
        ogAll: false,
        collaboration: "",
        limitedEdition: false,
      });
      setPurseValues({
        material: "",
        hardwareColor: "",
        sizeCategory: "medium",
        authenticityVerified: false,
        serialNumber: "",
        dustBagIncluded: false,
        closureType: "",
        strapType: "fixed",
        boxIncluded: false,
        authenticityCardIncluded: false,
        pattern: "",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error adding item:", error);
      toast({
        title: "Error",
        description: error.message || `Failed to add ${config.singularLabel.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (currentCollectionType) {
      case 'sneakers':
        return (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium text-sm">Sneaker Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Input
                  value={sneakerValues.shoeSize}
                  onChange={(e) => setSneakerValues({ ...sneakerValues, shoeSize: e.target.value })}
                  placeholder="e.g., 10.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Size Type</Label>
                <Select value={sneakerValues.sizeType} onValueChange={(v) => setSneakerValues({ ...sneakerValues, sizeType: v })}>
                  <SelectTrigger>
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
              <Label>Condition</Label>
              <Select value={sneakerValues.condition} onValueChange={(v) => setSneakerValues({ ...sneakerValues, condition: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SNEAKER_CONDITIONS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value.label} - {value.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={sneakerValues.sku}
                  onChange={(e) => setSneakerValues({ ...sneakerValues, sku: e.target.value })}
                  placeholder="e.g., DQ4499-103"
                />
              </div>
              <div className="space-y-2">
                <Label>Style Code</Label>
                <Input
                  value={sneakerValues.styleCode}
                  onChange={(e) => setSneakerValues({ ...sneakerValues, styleCode: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Collaboration (if any)</Label>
              <Input
                value={sneakerValues.collaboration}
                onChange={(e) => setSneakerValues({ ...sneakerValues, collaboration: e.target.value })}
                placeholder="e.g., Travis Scott, Off-White"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="boxIncluded"
                  checked={sneakerValues.boxIncluded}
                  onCheckedChange={(checked) => setSneakerValues({ ...sneakerValues, boxIncluded: !!checked })}
                />
                <Label htmlFor="boxIncluded" className="text-sm">Box Included</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ogAll"
                  checked={sneakerValues.ogAll}
                  onCheckedChange={(checked) => setSneakerValues({ ...sneakerValues, ogAll: !!checked })}
                />
                <Label htmlFor="ogAll" className="text-sm">OG All</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="limitedEdition"
                  checked={sneakerValues.limitedEdition}
                  onCheckedChange={(checked) => setSneakerValues({ ...sneakerValues, limitedEdition: !!checked })}
                />
                <Label htmlFor="limitedEdition" className="text-sm">Limited Edition</Label>
              </div>
            </div>
          </div>
        );

      case 'purses':
        return (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium text-sm">Purse Details</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material</Label>
                <Input
                  value={purseValues.material}
                  onChange={(e) => setPurseValues({ ...purseValues, material: e.target.value })}
                  placeholder="e.g., Leather, Canvas"
                />
              </div>
              <div className="space-y-2">
                <Label>Hardware Color</Label>
                <Input
                  value={purseValues.hardwareColor}
                  onChange={(e) => setPurseValues({ ...purseValues, hardwareColor: e.target.value })}
                  placeholder="e.g., Gold, Silver"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={purseValues.sizeCategory} onValueChange={(v) => setPurseValues({ ...purseValues, sizeCategory: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURSE_SIZES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Strap Type</Label>
                <Select value={purseValues.strapType} onValueChange={(v) => setPurseValues({ ...purseValues, strapType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STRAP_TYPES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Closure Type</Label>
                <Input
                  value={purseValues.closureType}
                  onChange={(e) => setPurseValues({ ...purseValues, closureType: e.target.value })}
                  placeholder="e.g., Zipper, Clasp"
                />
              </div>
              <div className="space-y-2">
                <Label>Pattern</Label>
                <Input
                  value={purseValues.pattern}
                  onChange={(e) => setPurseValues({ ...purseValues, pattern: e.target.value })}
                  placeholder="e.g., Monogram, Plain"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input
                value={purseValues.serialNumber}
                onChange={(e) => setPurseValues({ ...purseValues, serialNumber: e.target.value })}
                placeholder="For authenticity tracking"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authenticityVerified"
                  checked={purseValues.authenticityVerified}
                  onCheckedChange={(checked) => setPurseValues({ ...purseValues, authenticityVerified: !!checked })}
                />
                <Label htmlFor="authenticityVerified" className="text-sm">Authenticity Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dustBagIncluded"
                  checked={purseValues.dustBagIncluded}
                  onCheckedChange={(checked) => setPurseValues({ ...purseValues, dustBagIncluded: !!checked })}
                />
                <Label htmlFor="dustBagIncluded" className="text-sm">Dust Bag</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="purseBoxIncluded"
                  checked={purseValues.boxIncluded}
                  onCheckedChange={(checked) => setPurseValues({ ...purseValues, boxIncluded: !!checked })}
                />
                <Label htmlFor="purseBoxIncluded" className="text-sm">Box Included</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="authenticityCardIncluded"
                  checked={purseValues.authenticityCardIncluded}
                  onCheckedChange={(checked) => setPurseValues({ ...purseValues, authenticityCardIncluded: !!checked })}
                />
                <Label htmlFor="authenticityCardIncluded" className="text-sm">Auth Card</Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Add {config.singularLabel}
      </Button>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New {config.singularLabel}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Base fields */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand *</Label>
            <Input
              id="brand"
              value={baseValues.brand}
              onChange={(e) => setBaseValues({ ...baseValues, brand: e.target.value })}
              required
              placeholder={currentCollectionType === 'sneakers' ? "e.g., Nike, Adidas" : currentCollectionType === 'purses' ? "e.g., Louis Vuitton, Chanel" : "e.g., Omega, Rolex"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model *</Label>
            <Input
              id="model"
              value={baseValues.model}
              onChange={(e) => setBaseValues({ ...baseValues, model: e.target.value })}
              required
              placeholder={currentCollectionType === 'sneakers' ? "e.g., Air Jordan 1 High OG" : currentCollectionType === 'purses' ? "e.g., Neverfull MM" : "e.g., Speedmaster Professional"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryColor">{config.primaryColorLabel} *</Label>
            <Input
              id="primaryColor"
              value={baseValues.primaryColor}
              onChange={(e) => setBaseValues({ ...baseValues, primaryColor: e.target.value })}
              required
              placeholder={currentCollectionType === 'sneakers' ? "e.g., Chicago, Bred" : currentCollectionType === 'purses' ? "e.g., Black, Tan" : "e.g., Black, Blue"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{config.typeLabel}</Label>
            <Select 
              value={baseValues.type || config.defaultTypeOption} 
              onValueChange={(v) => setBaseValues({ ...baseValues, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.typeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                value={baseValues.cost}
                onChange={(e) => setBaseValues({ ...baseValues, cost: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="msrp">MSRP</Label>
              <Input
                id="msrp"
                type="number"
                value={baseValues.msrp}
                onChange={(e) => setBaseValues({ ...baseValues, msrp: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Purchase Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="availableForTrade"
              checked={baseValues.availableForTrade}
              onCheckedChange={(checked) => setBaseValues({ ...baseValues, availableForTrade: !!checked })}
            />
            <Label htmlFor="availableForTrade" className="text-sm">Available for Trade</Label>
          </div>

          {/* Type-specific fields */}
          {renderTypeSpecificFields()}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add ${config.singularLabel}`
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
