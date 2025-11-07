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

interface AddEventDialogProps {
  watches: { id: string; brand: string; model: string }[];
  onSuccess: () => void;
}

export const AddEventDialog = ({ watches, onSuccess }: AddEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { requestVerification } = usePasscode();
  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    watchModels: [] as string[],
    days: "0.5",
    purpose: "",
  });

  const handleOpenDialog = () => {
    requestVerification(() => setOpen(true));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("events").insert({
        location: formData.location,
        start_date: formData.startDate,
        watch_model: formData.watchModels,
        days: parseFloat(formData.days),
        purpose: formData.purpose,
      });

      if (error) throw error;

      toast.success("Event added successfully");
      setOpen(false);
      setFormData({
        location: "",
        startDate: "",
        watchModels: [],
        days: "0.5",
        purpose: "",
      });
      onSuccess();
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleOpenDialog}>
        <Plus className="w-4 h-4 mr-2" />
        Add Event
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
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
            <Label htmlFor="startDate">Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="watchModel">Watches</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
              {watches.map((watch) => {
                const watchName = `${watch.brand} ${watch.model}`;
                const isSelected = formData.watchModels.includes(watchName);
                return (
                  <label key={watch.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, watchModels: [...formData.watchModels, watchName] });
                        } else {
                          setFormData({ ...formData, watchModels: formData.watchModels.filter(w => w !== watchName) });
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{watchName}</span>
                  </label>
                );
              })}
            </div>
            {formData.watchModels.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.watchModels.length} watch{formData.watchModels.length !== 1 ? 'es' : ''} selected
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="days">Duration (days)</Label>
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
            <Label htmlFor="purpose">Purpose/Name</Label>
            <Input
              id="purpose"
              value={formData.purpose}
              placeholder="e.g., Wedding, Gala, Conference"
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Event"}
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
