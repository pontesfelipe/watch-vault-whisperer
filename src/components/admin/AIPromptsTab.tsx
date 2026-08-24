import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { RotateCcw, Save } from "lucide-react";

interface PromptTemplate {
  id: string;
  key: string;
  label: string;
  description: string | null;
  placeholders: string[];
  template: string;
  default_template: string;
  updated_at: string;
}

export function AIPromptsTab() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ai_prompt_templates")
      .select("*")
      .order("key");

    if (error) {
      console.error("Error loading prompt templates:", error);
      toast.error("Failed to load prompts");
    } else {
      const rows = (data || []) as PromptTemplate[];
      setPrompts(rows);
      setDrafts(Object.fromEntries(rows.map((p) => [p.key, p.template])));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (prompt: PromptTemplate) => {
    const value = (drafts[prompt.key] ?? "").trim();
    if (!value) {
      toast.error("Prompt cannot be empty");
      return;
    }
    setSavingKey(prompt.key);
    const { error } = await (supabase as any)
      .from("ai_prompt_templates")
      .update({ template: value, updated_by: user?.id ?? null })
      .eq("id", prompt.id);
    setSavingKey(null);

    if (error) {
      console.error("Error saving prompt:", error);
      toast.error("Failed to save prompt");
      return;
    }
    toast.success(`${prompt.label} updated`);
    load();
  };

  const resetToDefault = (prompt: PromptTemplate) => {
    setDrafts((prev) => ({ ...prev, [prompt.key]: prompt.default_template }));
    toast.info("Default restored in the editor — press Save to apply");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Image Prompts</CardTitle>
          <CardDescription>
            These prompts drive watch image generation. Placeholders in double braces are replaced
            automatically at generation time — keep them in the text.
          </CardDescription>
        </CardHeader>
      </Card>

      {prompts.map((prompt) => {
        const draft = drafts[prompt.key] ?? "";
        const dirty = draft !== prompt.template;
        return (
          <Card key={prompt.id}>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{prompt.label}</CardTitle>
                {dirty && <Badge variant="secondary">Unsaved</Badge>}
              </div>
              {prompt.description && <CardDescription>{prompt.description}</CardDescription>}
              {prompt.placeholders?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {prompt.placeholders.map((p) => (
                    <Badge key={p} variant="outline" className="font-mono text-[11px]">
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) =>
                  setDrafts((prev) => ({ ...prev, [prompt.key]: e.target.value }))
                }
                rows={10}
                className="font-mono text-xs leading-relaxed"
                aria-label={`${prompt.label} prompt text`}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {draft.length} characters · last updated{" "}
                  {new Date(prompt.updated_at).toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetToDefault(prompt)}
                    disabled={draft === prompt.default_template}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset to default
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save(prompt)}
                    disabled={!dirty || savingKey === prompt.key}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {savingKey === prompt.key ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
