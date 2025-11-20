import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
  notes?: string | null;
}

interface EditWearEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: WearEntry[];
  watchName: string;
  onUpdate: () => void;
}

export const EditWearEntryDialog = ({ 
  open, 
  onOpenChange, 
  entries, 
  watchName,
  onUpdate 
}: EditWearEntryDialogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDays, setEditDays] = useState<number>(1);
  const [editNotes, setEditNotes] = useState<string>("");

  const handleEdit = (entry: WearEntry) => {
    setEditingId(entry.id);
    setEditDays(entry.days);
    setEditNotes(entry.notes || "");
  };

  const handleSave = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wear_entries")
        .update({ 
          days: editDays,
          notes: editNotes || null
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Entry updated");
      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this wear entry?")) return;

    try {
      const { error } = await supabase
        .from("wear_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Entry deleted");
      onUpdate();
      
      if (entries.length === 1) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Failed to delete entry");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wear Entries - {watchName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="border border-border rounded-lg p-4">
              {editingId === entry.id ? (
                <div className="space-y-3">
                  <div>
                    <Label>Date</Label>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(entry.wear_date), "MMMM d, yyyy")}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`days-${entry.id}`}>Days Worn</Label>
                    <Input
                      id={`days-${entry.id}`}
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={editDays}
                      onChange={(e) => setEditDays(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`notes-${entry.id}`}>Notes</Label>
                    <Textarea
                      id={`notes-${entry.id}`}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(entry.id)}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {format(new Date(entry.wear_date), "MMMM d, yyyy")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(entry)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Days: {entry.days}
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Notes: {entry.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
