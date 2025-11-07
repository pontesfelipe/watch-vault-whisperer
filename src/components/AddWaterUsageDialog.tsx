import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Droplets } from "lucide-react";

interface AddWaterUsageDialogProps {
  watches: { id: string; brand: string; model: string }[];
  onSuccess: () => void;
}

export const AddWaterUsageDialog = ({ watches, onSuccess }: AddWaterUsageDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const watchId = formData.get("watchId") as string;
    const activityDate = formData.get("activityDate") as string;
    const activityType = formData.get("activityType") as string;
    const durationMinutes = formData.get("durationMinutes") as string;
    const depthMeters = formData.get("depthMeters") as string;
    const notes = formData.get("notes") as string;

    try {
      const { error } = await supabase.from("water_usage").insert({
        watch_id: watchId,
        activity_date: activityDate,
        activity_type: activityType,
        duration_minutes: durationMinutes ? parseFloat(durationMinutes) : null,
        depth_meters: depthMeters ? parseFloat(depthMeters) : null,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success("Water usage logged successfully");
      setOpen(false);
      onSuccess();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error adding water usage:", error);
      toast.error("Failed to log water usage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Droplets className="w-4 h-4" />
          Log Water Usage
        </Button>
      </DialogTrigger>
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-foreground">Log Water Usage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="watchId">Watch</Label>
            <Select name="watchId" required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select watch" />
              </SelectTrigger>
              <SelectContent>
                {watches.map((watch) => (
                  <SelectItem key={watch.id} value={watch.id}>
                    {watch.brand} {watch.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="activityDate">Date</Label>
            <Input
              id="activityDate"
              name="activityDate"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="activityType">Activity Type</Label>
            <Select name="activityType" required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Swimming">Swimming</SelectItem>
                <SelectItem value="Diving">Diving</SelectItem>
                <SelectItem value="Shower">Shower</SelectItem>
                <SelectItem value="Rain">Rain</SelectItem>
                <SelectItem value="Washing Hands">Washing Hands</SelectItem>
                <SelectItem value="Snorkeling">Snorkeling</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              step="1"
              min="1"
              placeholder="Optional"
              className="bg-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="depthMeters">Depth (meters)</Label>
            <Input
              id="depthMeters"
              name="depthMeters"
              type="number"
              step="0.1"
              min="0"
              placeholder="Optional - for diving/swimming"
              className="bg-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional details..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Logging..." : "Log Usage"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
