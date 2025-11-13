import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Loader2, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Watch reference database for auto-population
const WATCH_REFERENCES: Record<string, {
  brand: string;
  model: string;
  dialColor: string;
  type: string;
  cost: number;
}> = {
  "310.": { brand: "Omega", model: "Speedmaster Moonwatch Pro (Sapphire)", dialColor: "Black", type: "Chronograph", cost: 8000 },
  "310.30.42.50.01.001": { brand: "Omega", model: "Speedmaster Moonwatch Pro (Sapphire)", dialColor: "Black", type: "Chronograph", cost: 8000 },
  "220.12.41.21.03.001": { brand: "Omega", model: "Seamaster 300", dialColor: "Blue", type: "Diver", cost: 5900 },
  "522.10.42.21.03.001": { brand: "Omega", model: "Speedmaster '57", dialColor: "Blue", type: "Chronograph", cost: 10700 },
  "IW328201": { brand: "IWC", model: "Mark XX", dialColor: "Black", type: "Pilot", cost: 5600 },
  "AB0138241B1A1": { brand: "Breitling", model: "Navitimer GMT", dialColor: "Black", type: "GMT", cost: 6200 },
  "U10370161B1A1": { brand: "Breitling", model: "Superocean Heritage", dialColor: "Blue", type: "Diver", cost: 5400 },
  "L3.774.1.90.2": { brand: "Longines", model: "Legend Diver Bronze", dialColor: "Bronze", type: "Diver", cost: 3100 },
  "01 917 6746 4063": { brand: "ORIS", model: "Propilot Coulson Ltd Edition", dialColor: "Blue", type: "Pilot", cost: 4700 },
  "01 761 7691 4051": { brand: "ORIS", model: "Artelier Pointer Day Date", dialColor: "Silver", type: "Dress", cost: 2500 },
  "PAM01404": { brand: "Panerai", model: "Luminor Marina Luna Rossa PAM 01404 GMT", dialColor: "Blue", type: "GMT", cost: 10100 },
  "CBK221B.BA0715": { brand: "Tag Heuer", model: "Carrera 5 Day Date", dialColor: "Blue", type: "Chronograph", cost: 3000 },
  "SO33T100": { brand: "Swatch", model: "Moonswatch Earth", dialColor: "Blue", type: "Chronograph", cost: 270 },
  "SO33B100": { brand: "Swatch", model: "Moonswatch Saturn", dialColor: "Beige", type: "Chronograph", cost: 270 },
  "CA-53W": { brand: "Casio", model: "Databank", dialColor: "Black", type: "Digital", cost: 30 },
};

const watchSchema = z.object({
  brand: z.string().trim().min(1, "Brand is required").max(100),
  model: z.string().trim().min(1, "Model is required").max(200),
  dialColor: z.string().trim().min(1, "Dial color is required").max(50),
  type: z.string().trim().min(1, "Type is required").max(100),
  cost: z.number().min(0, "Cost must be positive"),
  averageResalePrice: z.number().min(0, "Resale price must be positive").optional(),
  warrantyDate: z.string().optional(),
});

export const AddWatchDialog = ({ onSuccess }: { onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelRef, setModelRef] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [formValues, setFormValues] = useState({
    brand: "",
    model: "",
    dialColor: "",
    type: "",
    cost: "",
    caseSize: "",
    lugToLugSize: "",
    casebackMaterial: "",
    movement: "",
    hasSapphire: null as boolean | null,
    averageResalePrice: "",
    warrantyDate: "",
    warrantyCardFile: null as File | null,
  });
  const { toast } = useToast();

  const handleLookupReference = async () => {
    const searchBrand = formValues.brand.trim();
    const searchRef = modelRef.trim();
    
    if (!searchBrand || !searchRef) {
      toast({
        title: "Missing Information",
        description: "Please enter both Brand and Model Reference",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, try local database for instant results
      const localMatch = WATCH_REFERENCES[searchRef.toUpperCase()];
      if (localMatch && localMatch.brand.toLowerCase().includes(searchBrand.toLowerCase())) {
      setFormValues({
        brand: localMatch.brand,
        model: localMatch.model,
        dialColor: localMatch.dialColor,
        type: localMatch.type,
        cost: localMatch.cost.toString(),
        caseSize: "",
        lugToLugSize: "",
        casebackMaterial: "",
        movement: "",
        hasSapphire: null,
        averageResalePrice: "",
        warrantyDate: "",
        warrantyCardFile: null,
      });
        toast({
          title: "Watch Found",
          description: `Loaded ${localMatch.brand} ${localMatch.model}`
        });
        setLoading(false);
        return;
      }
      
      // If not found locally, search the internet
      const { data, error } = await supabase.functions.invoke('search-watch-info', {
        body: { brand: searchBrand, modelReference: searchRef }
      });
      
      if (error || data?.error) {
        toast({
          title: "Not Found",
          description: `Could not find ${searchBrand} ${searchRef} online. Please enter details manually.`,
          variant: "destructive"
        });
        return;
      }
      
      // Auto-populate the form with internet search results
      setFormValues({
        brand: searchBrand,
        model: data.model,
        dialColor: data.dialColor,
        type: data.type,
        cost: data.cost.toString(),
        caseSize: data.caseSize || "",
        lugToLugSize: data.lugToLugSize || "",
        casebackMaterial: data.casebackMaterial || "",
        movement: data.movement || "",
        hasSapphire: data.hasSapphire,
        averageResalePrice: data.averageResalePrice ? data.averageResalePrice.toString() : "",
        warrantyDate: "",
        warrantyCardFile: null,
      });
      
      toast({
        title: "Watch Found Online",
        description: `Loaded ${searchBrand} ${data.model} from web search`
      });
      
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for watch information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      });

      // Upload warranty card if provided
      let warrantyCardUrl = null;
      if (formValues.warrantyCardFile) {
        const fileExt = formValues.warrantyCardFile.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('warranty-cards')
          .upload(fileName, formValues.warrantyCardFile);

        if (uploadError) {
          toast({
            title: "Upload Error",
            description: "Failed to upload warranty card",
            variant: "destructive",
          });
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('warranty-cards')
          .getPublicUrl(fileName);
        
        warrantyCardUrl = publicUrl;
      }

      const { error } = await supabase.from("watches").insert({
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
        when_bought: purchaseDate ? format(purchaseDate, "yyyy-MM-dd") : null,
        warranty_card_url: warrantyCardUrl,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Watch added to your collection",
      });

      setOpen(false);
      setModelRef("");
      setPurchaseDate(undefined);
      setFormValues({
        brand: "",
        model: "",
        dialColor: "",
        type: "",
        cost: "",
        caseSize: "",
        lugToLugSize: "",
        casebackMaterial: "",
        movement: "",
        hasSapphire: null,
        averageResalePrice: "",
        warrantyDate: "",
        warrantyCardFile: null,
      });
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
          description: "Failed to add watch",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Add to Collection
      </Button>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Watch</DialogTitle>
        </DialogHeader>
        
        <div className="bg-muted/50 p-3 rounded-lg border border-border">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Quick Add:</strong> Enter Brand and Model Reference, then click Search to auto-fill details from the web.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formValues.brand}
              onChange={(e) => setFormValues({ ...formValues, brand: e.target.value })}
              required
              maxLength={100}
              placeholder="e.g., Omega, Rolex, IWC"
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelRef">Model Reference (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="modelRef"
                value={modelRef}
                onChange={(e) => setModelRef(e.target.value)}
                placeholder="e.g., 310.30.42.50.01.001"
                className="bg-background border-border"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookupReference}
                disabled={!modelRef || !formValues.brand || loading}
                className="shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-1" />
                )}
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              With brand entered above, click Search to auto-fill remaining fields
            </p>
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
              placeholder="e.g., Diver, Chronograph, Pilot"
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
            <Label htmlFor="averageResalePrice">Avg. US Resale Price (Auto-fetched) - Optional</Label>
            <Input
              id="averageResalePrice"
              value={formValues.averageResalePrice}
              onChange={(e) => setFormValues({ ...formValues, averageResalePrice: e.target.value })}
              type="number"
              step="0.01"
              min="0"
              placeholder="Auto-filled from online sources (editable)"
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">
              {formValues.averageResalePrice 
                ? "✓ Auto-populated from US resale marketplaces" 
                : "Will be fetched automatically when you click Search above"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whenBought">Date of Purchase - Optional</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-background border-border",
                    !purchaseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={purchaseDate}
                  onSelect={setPurchaseDate}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={2000}
                  toYear={new Date().getFullYear()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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
            <p className="text-xs text-muted-foreground">Upload warranty card image or PDF</p>
          </div>

          {/* Optional Specifications Section */}
          {(formValues.caseSize || formValues.lugToLugSize || formValues.casebackMaterial || 
            formValues.movement || formValues.hasSapphire !== null) && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Additional Specifications</h3>
              
              {formValues.caseSize && (
                <div className="space-y-1">
                  <Label htmlFor="caseSize" className="text-xs text-muted-foreground">Case Size</Label>
                  <Input
                    id="caseSize"
                    value={formValues.caseSize}
                    onChange={(e) => setFormValues({ ...formValues, caseSize: e.target.value })}
                    className="bg-background border-border text-sm"
                    placeholder="e.g., 41mm"
                  />
                </div>
              )}
              
              {formValues.lugToLugSize && (
                <div className="space-y-1">
                  <Label htmlFor="lugToLugSize" className="text-xs text-muted-foreground">Lug to Lug</Label>
                  <Input
                    id="lugToLugSize"
                    value={formValues.lugToLugSize}
                    onChange={(e) => setFormValues({ ...formValues, lugToLugSize: e.target.value })}
                    className="bg-background border-border text-sm"
                    placeholder="e.g., 48mm"
                  />
                </div>
              )}
              
              {formValues.casebackMaterial && (
                <div className="space-y-1">
                  <Label htmlFor="casebackMaterial" className="text-xs text-muted-foreground">Caseback Material</Label>
                  <Input
                    id="casebackMaterial"
                    value={formValues.casebackMaterial}
                    onChange={(e) => setFormValues({ ...formValues, casebackMaterial: e.target.value })}
                    className="bg-background border-border text-sm"
                    placeholder="e.g., Stainless Steel, Sapphire Crystal"
                  />
                </div>
              )}
              
              {formValues.movement && (
                <div className="space-y-1">
                  <Label htmlFor="movement" className="text-xs text-muted-foreground">Movement</Label>
                  <Input
                    id="movement"
                    value={formValues.movement}
                    onChange={(e) => setFormValues({ ...formValues, movement: e.target.value })}
                    className="bg-background border-border text-sm"
                    placeholder="e.g., Omega Co-Axial 8800"
                  />
                </div>
              )}
              
              {formValues.hasSapphire !== null && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sapphire Crystal</Label>
                  <div className="text-sm text-foreground">
                    {formValues.hasSapphire ? "Yes" : "No"}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Watch"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
