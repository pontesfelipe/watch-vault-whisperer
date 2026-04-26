import { useState } from "react";
import { Plus, X, Tag as TagIcon, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserTags } from "@/hooks/useUserTags";

interface WearTagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  label?: string;
  helperText?: string;
}

export const WearTagSelector = ({
  selectedTagIds,
  onChange,
  label = "Tags (Optional)",
  helperText = "Tag this entry to track it on Canvas",
}: WearTagSelectorProps) => {
  const { tags, canCreateMore, createTag } = useUserTags();
  const [creating, setCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreate = async () => {
    if (!newTagName.trim() || busy) return;
    setBusy(true);
    const tag = await createTag(newTagName.trim());
    setBusy(false);
    if (tag) {
      onChange([...selectedTagIds, tag.id]);
      setNewTagName("");
      setCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <TagIcon className="w-3.5 h-3.5" />
          {label}
        </Label>
        {!creating && canCreateMore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setCreating(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            New tag
          </Button>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              } else if (e.key === "Escape") {
                setCreating(false);
                setNewTagName("");
              }
            }}
            placeholder="Tag name..."
            maxLength={32}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={handleCreate}
            disabled={!newTagName.trim() || busy}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              setCreating(false);
              setNewTagName("");
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {tags.length === 0 && !creating ? (
        <p className="text-xs text-textMuted">
          No tags yet. Create one to start tracking entries by context.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className="focus:outline-none"
                aria-pressed={isSelected}
              >
                <Badge
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-colors hover:bg-accent/20"
                >
                  {tag.name}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {helperText && tags.length > 0 && (
        <p className="text-xs text-textMuted">{helperText}</p>
      )}
    </div>
  );
};