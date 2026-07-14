import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, RotateCcw, Trash2, DollarSign, MessageSquare, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollection } from "@/contexts/CollectionContext";
import { ItemTypeIcon } from "@/components/ItemTypeIcon";

const SALE_REASONS: Record<'sold' | 'traded', string[]> = {
  sold: [
    "Funding a new purchase",
    "No longer wearing it",
    "Didn't like it anymore",
    "Needed the cash",
    "Upgrading",
    "Doesn't fit my style",
    "Other",
  ],
  traded: [
    "Upgrading",
    "Wanted a different style",
    "Doesn't fit collection",
    "Better value in trade",
    "Other",
  ],
};

interface PastWatchCardProps {
  watch: {
    id: string;
    brand: string;
    model: string;
    dial_color: string;
    type: string;
    cost: number;
    status: string;
    when_bought?: string;
    sale_price?: number | null;
    sale_reason?: string | null;
    sale_notes?: string | null;
  };
  totalDays: number;
  onUpdate: () => void;
  collectionId: string;
}

export const PastWatchCard = ({ watch, totalDays, onUpdate, collectionId }: PastWatchCardProps) => {
  const { toast } = useToast();
  const { currentCollectionConfig, currentCollectionType } = useCollection();
  const singularLabel = currentCollectionConfig.singularLabel;
  const usageVerbPast = currentCollectionConfig.usageVerbPast;
  const usageNoun = currentCollectionConfig.usageNoun;
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editStatus, setEditStatus] = useState<'sold' | 'traded'>(
    (watch.status as 'sold' | 'traded') || 'sold'
  );
  const [editPrice, setEditPrice] = useState<string>(
    watch.sale_price != null ? String(watch.sale_price) : ""
  );
  const [editReason, setEditReason] = useState<string>(watch.sale_reason || "");
  const [editNotes, setEditNotes] = useState<string>(watch.sale_notes || "");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from("watches")
        .update({
          status: editStatus,
          sale_price: editPrice ? parseFloat(editPrice) : null,
          sale_reason: editReason || null,
          sale_notes: editNotes || null,
        })
        .eq("id", watch.id);
      if (error) throw error;
      toast({ title: "Updated", description: `${watch.brand} ${watch.model} details saved` });
      setShowEditDialog(false);
      onUpdate();
    } catch (e) {
      toast({ title: "Error", description: "Failed to update details", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const { error } = await supabase
        .from("watches")
        .update({ status: 'active', collection_id: collectionId })
        .eq("id", watch.id);

      if (error) throw error;

      toast({
        title: `${singularLabel} Restored`,
        description: `${watch.brand} ${watch.model} is back in your collection`,
      });

      setShowRestoreDialog(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to restore ${singularLabel.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handlePermanentDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete related data first
      await supabase.from("wear_entries").delete().eq("watch_id", watch.id);
      await supabase.from("water_usage").delete().eq("watch_id", watch.id);
      await supabase.from("watch_specs").delete().eq("watch_id", watch.id);
      
      // Delete the item
      const { error } = await supabase.from("watches").delete().eq("id", watch.id);

      if (error) throw error;

      toast({
        title: `${singularLabel} Deleted`,
        description: `${singularLabel} and all related data permanently removed`,
      });

      setShowRestoreDialog(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete ${singularLabel.toLowerCase()}`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="relative overflow-hidden border-borderSubtle bg-surfaceMuted/50 opacity-75 hover:opacity-100 transition-all duration-300">
      <div className="relative p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ItemTypeIcon type={currentCollectionType} className="w-4 h-4 text-textMuted" />
              <h3 className="font-semibold text-sm text-textMain">{watch.brand}</h3>
            </div>
            <p className="text-xs text-textSoft">{watch.model}</p>
          </div>
          <Badge 
            variant={watch.status === 'sold' ? 'secondary' : 'outline'} 
            className="text-xs capitalize"
          >
            {watch.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-textMuted">{currentCollectionConfig.primaryColorLabel}</span>
            <span className="text-textSoft">{watch.dial_color}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-textMuted">{currentCollectionConfig.typeLabel}</span>
            <span className="text-textSoft">{watch.type}</span>
          </div>
          {watch.sale_price != null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-textMuted flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {watch.status === 'sold' ? 'Sold for' : 'Trade value'}
              </span>
              <span className="text-textSoft font-medium">
                ${Number(watch.sale_price).toLocaleString()}
              </span>
            </div>
          )}
          {watch.sale_reason && (
            <div className="flex items-start justify-between text-xs gap-2">
              <span className="text-textMuted">Reason</span>
              <span className="text-textSoft text-right">{watch.sale_reason}</span>
            </div>
          )}
          {watch.sale_price != null && watch.cost != null && totalDays > 0 && (
            (() => {
              const net = Number(watch.cost) - Number(watch.sale_price);
              const perWear = net / totalDays;
              return (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-borderSubtle">
                  <span className="text-textMuted">Cost per {usageNoun}</span>
                  <span className={`font-semibold ${perWear >= 0 ? 'text-textMain' : 'text-primary'}`}>
                    {perWear < 0 ? '+' : ''}${Math.abs(perWear).toFixed(2)}
                  </span>
                </div>
              );
            })()
          )}
          {watch.sale_notes && (
            <div className="flex items-start gap-1 text-xs text-textSoft pt-1 border-t border-borderSubtle">
              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0 text-textMuted" />
              <span className="italic">{watch.sale_notes}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-borderSubtle">
            <div className="flex items-center gap-1 text-textMuted">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">Total Days {usageVerbPast.charAt(0).toUpperCase() + usageVerbPast.slice(1)}</span>
            </div>
            <span className="text-lg font-bold text-primary">{totalDays}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          onClick={() => setShowRestoreDialog(true)}
        >
          <RotateCcw className="w-3 h-3" />
          Manage
        </Button>

        <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
          <DialogContent className="bg-surface border-borderSubtle sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-textMain">Manage Past {singularLabel}</DialogTitle>
              <DialogDescription className="text-textSoft">
                {watch.brand} {watch.model} was marked as {watch.status}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 border-borderSubtle"
                onClick={() => {
                  setShowRestoreDialog(false);
                  setShowEditDialog(true);
                }}
                disabled={isRestoring || isDeleting}
              >
                <Pencil className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Edit Details</span>
                  <span className="text-xs text-textMuted">Update price, reason, notes or status</span>
                </div>
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 border-borderSubtle"
                onClick={handleRestore}
                disabled={isRestoring || isDeleting}
              >
                <RotateCcw className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Restore to Collection</span>
                  <span className="text-xs text-textMuted">Bring back to active collection</span>
                </div>
              </Button>
              <Button
                variant="destructive"
                className="justify-start gap-3 h-auto py-3"
                onClick={handlePermanentDelete}
                disabled={isRestoring || isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Delete Permanently</span>
                  <span className="text-xs opacity-80">Remove all data forever</span>
                </div>
              </Button>
              <Button
                variant="ghost"
                className="mt-2"
                onClick={() => setShowRestoreDialog(false)}
                disabled={isRestoring || isDeleting}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-surface border-borderSubtle sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-textMain">Edit Past {singularLabel}</DialogTitle>
              <DialogDescription className="text-textSoft">
                Update details for {watch.brand} {watch.model}.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as 'sold' | 'traded')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="traded">Traded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-price">
                  {editStatus === 'sold' ? 'Sale price (USD)' : 'Value received (USD)'}
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-reason">Reason</Label>
                <Select value={editReason} onValueChange={setEditReason}>
                  <SelectTrigger id="edit-reason">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_REASONS[editStatus].map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  rows={3}
                  placeholder="Notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowEditDialog(false)} disabled={isSavingEdit}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveEdit} disabled={isSavingEdit}>
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};