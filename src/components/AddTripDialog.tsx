import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { usePasscode } from "@/contexts/PasscodeContext";

interface AddTripDialogProps {
  watches: { id: string; brand: string; model: string }[];
  onSuccess: () => void;
}

export const AddTripDialog = ({ watches, onSuccess }: AddTripDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestVerification } = usePasscode();
  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    watchModel: "",
    days: "1",
    purpose: "Business",
  });

  const handleOpenDialog = () => {
    requestVerification(() => setOpen(true));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("trips").insert({
        location: formData.location,
        start_date: formData.startDate,
        watch_model: formData.watchModel,
        days: parseFloat(formData.days),
        purpose: formData.purpose,
      });

      if (error) throw error;

      toast.success("Trip added successfully");
      setOpen(false);
      setFormData({
        location: "",
        startDate: "",
        watchModel: "",
        days: "1",
        purpose: "Business",
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding trip:", error);
      toast.error("Failed to add trip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleOpenDialog}>
        <Plus className="w-4 h-4 mr-2" />
        Add Trip
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="watchModel">Watch</Label>
            <Select
              value={formData.watchModel}
              onValueChange={(value) => setFormData({ ...formData, watchModel: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select watch" />
              </SelectTrigger>
              <SelectContent>
                {watches.map((watch) => (
                  <SelectItem key={watch.id} value={`${watch.brand} ${watch.model}`}>
                    {watch.brand} {watch.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="days">Days</Label>
            <Input
              id="days"
              type="number"
              step="0.5"
              min="0.5"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Select
              value={formData.purpose}
              onValueChange={(value) => setFormData({ ...formData, purpose: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Business">Business</SelectItem>
                <SelectItem value="Vacation">Vacation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Trip"}
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
