import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { useUserTags } from "@/hooks/useUserTags";
import { toast } from "sonner";

const TAG_SUGGESTIONS = ["Daily Driver", "Weekend", "Dressy", "Sport", "Travel", "Special Occasion", "Beater"];

export function TagManagerCard() {
  const { tags, canCreateMore, createTag, updateTag, deleteTag } = useUserTags();
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async () => {
    if (!newTagName.trim()) return;
    const result = await createTag(newTagName);
    if (result) {
      setNewTagName("");
      toast.success("Tag created");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    await updateTag(editingId, editingName);
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id: string) => {
    await deleteTag(id);
    toast.success("Tag removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags
        </CardTitle>
        <CardDescription>
          Create up to 15 custom tags to categorize your items. Tags can be assigned to items and used as Canvas widgets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-1">
              {editingId === tag.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="h-7 w-28 text-sm"
                    maxLength={30}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveEdit}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Badge variant="secondary" className="gap-1 pr-1">
                  {tag.name}
                  <Button
                    size="icon" variant="ghost" className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => { setEditingId(tag.id); setEditingName(tag.name); }}
                  >
                    <Pencil className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-4 w-4 p-0 hover:bg-transparent text-destructive"
                    onClick={() => handleDelete(tag.id)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </Badge>
              )}
            </div>
          ))}
        </div>

        {canCreateMore && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="New tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="text-sm"
                maxLength={30}
              />
              <Button size="sm" onClick={handleCreate} disabled={!newTagName.trim()}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {tags.length === 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground">Suggestions:</span>
                {TAG_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewTagName(s)}
                    className="text-xs text-primary hover:underline"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-right">{tags.length}/15 tags</p>
      </CardContent>
    </Card>
  );
}
