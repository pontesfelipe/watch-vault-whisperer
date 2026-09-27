import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_wears",
  title: "List recent wears",
  description: "List the signed-in user's recent wear log entries, newest first.",
  inputSchema: {
    days_back: z.number().int().min(1).max(365).default(30).describe("How many days back to include."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days_back }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const since = new Date(Date.now() - days_back * 86400000).toISOString().slice(0, 10);
    const { data, error } = await sb
      .from("wear_entries")
      .select("id, wear_date, days, notes, watch_id, watches(brand, model)")
      .eq("user_id", ctx.getUserId()!)
      .gte("wear_date", since)
      .order("wear_date", { ascending: false });
    if (error) throw new ToolError(error.message);
    const wears = (data ?? []).map((e: any) => ({
      id: e.id as string,
      date: e.wear_date as string,
      days: Number(e.days),
      notes: (e.notes as string | null) ?? null,
      item_id: e.watch_id as string,
      item: e.watches ? `${e.watches.brand} ${e.watches.model}` : null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(wears) }],
      structuredContent: { wears },
    };
  },
});
