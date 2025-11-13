import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Watch {
  id: string;
  brand: string;
  model: string;
  why_bought?: string;
  when_bought?: string;
  what_i_like?: string;
  what_i_dont_like?: string;
}

interface EditPersonalNotesDialogProps {
  watch: Watch;
  onSuccess: () => void;
  onClose: () => void;
}

export function EditPersonalNotesDialog({ watch, onSuccess, onClose }: EditPersonalNotesDialogProps) {
  const [formData, setFormData] = useState({
    why_bought: watch.why_bought || "",
    when_bought: watch.when_bought || "",
    what_i_like: watch.what_i_like || "",
    what_i_dont_like: watch.what_i_dont_like || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("watches")
        .update(formData as any)
        .eq("id", watch.id);

      if (error) throw error;

      toast.success("Personal notes updated successfully");
      onSuccess();
    } catch (error) {
      console.error("Error updating personal notes:", error);
      toast.error("Failed to update personal notes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Personal Notes: {watch.brand} {watch.model}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="why_bought">Why I bought</Label>
            <Textarea
              id="why_bought"
              value={formData.why_bought}
              onChange={(e) => setFormData({ ...formData, why_bought: e.target.value })}
              placeholder="Describe why you bought this watch..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="when_bought">When I bought</Label>
            <Input
              id="when_bought"
              value={formData.when_bought}
              onChange={(e) => setFormData({ ...formData, when_bought: e.target.value })}
              placeholder="e.g., March-24, Christmas 2023, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="what_i_like">What I like</Label>
            <Textarea
              id="what_i_like"
              value={formData.what_i_like}
              onChange={(e) => setFormData({ ...formData, what_i_like: e.target.value })}
              placeholder="What do you like about this watch..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="what_i_dont_like">What I don't like about this watch</Label>
            <Textarea
              id="what_i_dont_like"
              value={formData.what_i_dont_like}
              onChange={(e) => setFormData({ ...formData, what_i_dont_like: e.target.value })}
              placeholder="What don't you like about this watch..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
