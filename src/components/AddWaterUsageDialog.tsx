import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Droplets, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AddWaterUsageDialogProps {
  watches: { id: string; brand: string; model: string }[];
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddWaterUsageDialog = ({ watches, onSuccess, open, onOpenChange }: AddWaterUsageDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      watchId: formData.get("watchId") as string,
      activityDate: formData.get("activityDate") as string,
      activityType: formData.get("activityType") as string,
      durationMinutes: formData.get("durationMinutes") ? parseFloat(formData.get("durationMinutes") as string) : null,
      depthMeters: formData.get("depthMeters") ? parseFloat(formData.get("depthMeters") as string) : null,
      notes: formData.get("notes") as string || null,
    };

    try {
      const { error } = await supabase.from("water_usage").insert({
        watch_id: data.watchId,
        activity_date: data.activityDate,
        activity_type: data.activityType,
        duration_minutes: data.durationMinutes,
        depth_meters: data.depthMeters,
        notes: data.notes,
        user_id: user?.id,
      });

      if (error) throw error;

      toast.success("Water usage entry added successfully");
      onOpenChange(false);
      onSuccess();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error("Error adding water usage:", error);
      toast.error("Failed to add water usage entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-primary" />
            Log Water Activity
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="activityType">Activity Type</Label>
            <Select name="activityType" required>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pool">Pool</SelectItem>
                <SelectItem value="Hot tub">Hot tub</SelectItem>
                <SelectItem value="Lake">Lake</SelectItem>
                <SelectItem value="Ocean">Ocean</SelectItem>
                <SelectItem value="Beach">Beach</SelectItem>
                <SelectItem value="Swimming">Swimming</SelectItem>
                <SelectItem value="Diving">Diving</SelectItem>
                <SelectItem value="Snorkeling">Snorkeling</SelectItem>
                <SelectItem value="Shower">Shower</SelectItem>
                <SelectItem value="Rain">Rain Exposure</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="depthMeters">Depth (meters)</Label>
              <Input
                id="depthMeters"
                name="depthMeters"
                type="number"
                step="0.1"
                min="0"
                placeholder="Optional"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional details..."
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
