import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const wearSchema = z.object({
  watchId: z.string().uuid(),
  wearDate: z.string().min(1, "Date is required"),
  fullDay: z.boolean(),
});

interface QuickAddWearDialogProps {
  watches: Array<{ id: string; brand: string; model: string }>;
  onSuccess: () => void;
}

export const QuickAddWearDialog = ({ watches, onSuccess }: QuickAddWearDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWatchId, setSelectedWatchId] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const data = wearSchema.parse({
        watchId: selectedWatchId,
        wearDate: formData.get("wearDate"),
        fullDay: formData.get("fullDay") === "true",
      });

      const days = data.fullDay ? 1 : 0.5;
      
      // Fix timezone issue: ensure the date is stored as-is without timezone conversion
      const dateObj = new Date(data.wearDate + 'T00:00:00');
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const { error } = await supabase.from("wear_entries").insert({
        watch_id: data.watchId,
        wear_date: formattedDate,
        days: days,
        user_id: user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Duplicate Entry",
            description: "This watch already has a wear entry for this date",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Wear entry added",
      });

      setOpen(false);
      setSelectedWatchId("");
      onSuccess();
      (e.target as HTMLFormElement).reset();
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
          description: "Failed to add wear entry",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedWatches = [...watches].sort((a, b) => {
    const brandCompare = a.brand.localeCompare(b.brand);
    if (brandCompare !== 0) return brandCompare;
    return a.model.localeCompare(b.model);
  });

  // Get today's date in local timezone
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Wear
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Quick Add Wear Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="watch">Select Watch</Label>
            <Select value={selectedWatchId} onValueChange={setSelectedWatchId} required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Choose a watch..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-[300px]">
                {sortedWatches.map((watch) => (
                  <SelectItem key={watch.id} value={watch.id}>
                    {watch.brand} - {watch.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wearDate">Date</Label>
            <Input
              id="wearDate"
              name="wearDate"
              type="date"
              required
              max={getTodayDate()}
              defaultValue={getTodayDate()}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label>Wear Duration</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fullDay"
                  value="true"
                  defaultChecked
                  className="w-4 h-4"
                />
                <span className="text-sm">Full Day</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fullDay"
                  value="false"
                  className="w-4 h-4"
                />
                <span className="text-sm">Half Day</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !selectedWatchId} className="flex-1">
              {loading ? "Adding..." : "Add Entry"}
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
