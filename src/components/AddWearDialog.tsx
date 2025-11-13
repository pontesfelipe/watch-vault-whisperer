import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";

const wearSchema = z.object({
  watchId: z.string().uuid(),
  wearDate: z.string().min(1, "Date is required"),
  days: z.number().min(0.1, "Days must be at least 0.1").max(31, "Days cannot exceed 31"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

export const AddWearDialog = ({ watchId, onSuccess }: { watchId: string; onSuccess: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const data = wearSchema.parse({
        watchId,
        wearDate: formData.get("wearDate"),
        days: parseFloat(formData.get("days") as string),
        notes: formData.get("notes") || undefined,
      });

      const roundedDays = Math.round(data.days * 10) / 10;
      
      // Fix timezone issue: ensure the date is stored as-is without timezone conversion
      const dateObj = new Date(data.wearDate + 'T00:00:00');
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const { error } = await supabase.from("wear_entries").insert({
        watch_id: data.watchId,
        wear_date: formattedDate,
        days: roundedDays,
        notes: data.notes,
        user_id: user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Duplicate Entry",
            description: "A wear entry for this date already exists",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={handleOpenDialog} variant="outline" size="sm" className="gap-2">
        <Calendar className="w-4 h-4" />
        Log Wear
      </Button>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Wear Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wearDate">Date</Label>
            <Input
              id="wearDate"
              name="wearDate"
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-background border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="days">Days Worn</Label>
            <Input
              id="days"
              name="days"
              type="number"
              step="0.1"
              min="0.1"
              max="31"
              defaultValue="1"
              required
              className="bg-background border-border"
            />
            <p className="text-xs text-muted-foreground">Use one decimal (e.g., 1.0, 0.5)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this wear session..."
              maxLength={500}
              className="bg-background border-border resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
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
