import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Save, X, Package, FileText, Receipt, History } from "lucide-react";
import { toast } from "sonner";

interface Provenance {
  id?: string;
  purchase_year: number | null;
  original_owner: string | null;
  service_history: string | null;
  has_original_box: boolean;
  has_original_papers: boolean;
  has_original_receipt: boolean;
  additional_notes: string | null;
}

interface WatchProvenanceCardProps {
  watchId: string;
  isOwner: boolean;
}

const EMPTY: Provenance = {
  purchase_year: null,
  original_owner: null,
  service_history: null,
  has_original_box: false,
  has_original_papers: false,
  has_original_receipt: false,
  additional_notes: null,
};

export function WatchProvenanceCard({ watchId, isOwner }: WatchProvenanceCardProps) {
  const { user } = useAuth();
  const [data, setData] = useState<Provenance>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Provenance>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState(false);

  useEffect(() => {
    loadProvenance();
  }, [watchId]);

  const loadProvenance = async () => {
    const { data: row } = await (supabase as any)
      .from("watch_provenance")
      .select("*")
      .eq("watch_id", watchId)
      .maybeSingle();

    if (row) {
      setData(row);
      setDraft(row);
      setExists(true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      watch_id: watchId,
      user_id: user.id,
      purchase_year: draft.purchase_year,
      original_owner: draft.original_owner?.trim() || null,
      service_history: draft.service_history?.trim() || null,
      has_original_box: draft.has_original_box,
      has_original_papers: draft.has_original_papers,
      has_original_receipt: draft.has_original_receipt,
      additional_notes: draft.additional_notes?.trim() || null,
    };

    let error;
    if (exists) {
      ({ error } = await (supabase as any)
        .from("watch_provenance")
        .update(payload)
        .eq("watch_id", watchId));
    } else {
      ({ error } = await (supabase as any)
        .from("watch_provenance")
        .insert(payload));
    }

    if (error) {
      toast.error("Failed to save provenance");
    } else {
      toast.success("Provenance saved");
      setData(draft);
      setExists(true);
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) return null;

  const hasData = exists && (data.purchase_year || data.original_owner || data.service_history || data.has_original_box || data.has_original_papers || data.has_original_receipt);

  if (!hasData && !isOwner) return null;

  return (
    <Card className="p-5 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Provenance</h3>
        </div>
        {isOwner && !editing && (
          <Button variant="ghost" size="sm" onClick={() => { setDraft(data); setEditing(true); }}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Purchase Year</label>
            <Input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={draft.purchase_year ?? ""}
              onChange={(e) => setDraft({ ...draft, purchase_year: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g. 2020"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Original Owner</label>
            <Input
              value={draft.original_owner ?? ""}
              onChange={(e) => setDraft({ ...draft, original_owner: e.target.value })}
              placeholder="First owner, dealer name, etc."
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Service History</label>
            <Textarea
              value={draft.service_history ?? ""}
              onChange={(e) => setDraft({ ...draft, service_history: e.target.value })}
              placeholder="Service dates, what was done..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground block">Included Items</label>
            <div className="flex flex-wrap gap-4">
              {[
                { key: "has_original_box" as const, label: "Original Box", icon: Package },
                { key: "has_original_papers" as const, label: "Papers", icon: FileText },
                { key: "has_original_receipt" as const, label: "Receipt", icon: Receipt },
              ].map(({ key, label, icon: Icon }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={draft[key]}
                    onCheckedChange={(v) => setDraft({ ...draft, [key]: !!v })}
                  />
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Additional Notes</label>
            <Textarea
              value={draft.additional_notes ?? ""}
              onChange={(e) => setDraft({ ...draft, additional_notes: e.target.value })}
              placeholder="Any other relevant details..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : hasData ? (
        <div className="space-y-3 text-sm">
          {data.purchase_year && (
            <div>
              <span className="text-muted-foreground">Purchase Year:</span>{" "}
              <span className="text-foreground font-medium">{data.purchase_year}</span>
            </div>
          )}
          {data.original_owner && (
            <div>
              <span className="text-muted-foreground">Original Owner:</span>{" "}
              <span className="text-foreground font-medium">{data.original_owner}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {data.has_original_box && <Badge variant="outline"><Package className="h-3 w-3 mr-1" /> Box</Badge>}
            {data.has_original_papers && <Badge variant="outline"><FileText className="h-3 w-3 mr-1" /> Papers</Badge>}
            {data.has_original_receipt && <Badge variant="outline"><Receipt className="h-3 w-3 mr-1" /> Receipt</Badge>}
          </div>
          {data.service_history && (
            <div>
              <span className="text-muted-foreground block mb-1">Service History:</span>
              <p className="text-foreground whitespace-pre-line">{data.service_history}</p>
            </div>
          )}
          {data.additional_notes && (
            <div>
              <span className="text-muted-foreground block mb-1">Notes:</span>
              <p className="text-foreground whitespace-pre-line">{data.additional_notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">No provenance recorded yet</p>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Add Provenance
          </Button>
        </div>
      )}
    </Card>
  );
}
