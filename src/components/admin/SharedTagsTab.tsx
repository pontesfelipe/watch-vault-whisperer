import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TagRow {
  id: string;
  name: string;
  category: string | null;
  is_global: boolean;
  created_by: string | null;
}

export const SharedTagsTab = () => {
  const { user } = useAuth();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [isGlobal, setIsGlobal] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data, error } = await (supabase.from("tags") as any)
      .select("id, name, category, is_global, created_by")
      .order("name");
    if (error) toast.error("Failed to load tags");
    setTags((data as TagRow[]) || []);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim() || !user) return;
    setBusy(true);
    const { error } = await (supabase.from("tags") as any).insert({
      name: name.trim(),
      category: category.trim() || null,
      is_global: isGlobal,
      created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Tag created");
    setName(""); setCategory("");
    load();
  };

  const toggleGlobal = async (t: TagRow, value: boolean) => {
    const { error } = await (supabase.from("tags") as any).update({ is_global: value }).eq("id", t.id);
    if (error) return toast.error(error.message);
    setTags((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_global: value } : x)));
  };

  const remove = async (t: TagRow) => {
    const { error } = await (supabase.from("tags") as any).delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    setTags((prev) => prev.filter((x) => x.id !== t.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
        <CardDescription>Global tags are visible to every user. Non-global tags are visible only to their creator.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Input placeholder="Tag name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Category (optional)" value={category} onChange={(e) => setCategory(e.target.value)} />
          <div className="flex items-center gap-2 min-h-[44px]">
            <Switch id="tag-global" checked={isGlobal} onCheckedChange={setIsGlobal} />
            <Label htmlFor="tag-global">Global</Label>
          </div>
          <Button onClick={create} disabled={busy || !name.trim()}>Create</Button>
        </div>
        <div className="divide-y divide-border">
          {tags.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{t.name}</span>
                {t.category && <Badge variant="outline">{t.category}</Badge>}
                {!t.is_global && <Badge variant="secondary">Private</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={t.is_global} onCheckedChange={(v) => toggleGlobal(t, v)} aria-label="Global" />
                <Button variant="ghost" size="icon" onClick={() => remove(t)} aria-label="Delete tag">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {tags.length === 0 && <p className="text-sm text-muted-foreground py-2">No tags yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
};
