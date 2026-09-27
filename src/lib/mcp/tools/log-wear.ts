import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "log_wear",
  title: "Log a wear",
  description: "Record that the signed-in user wore/carried one of their items on a date.",
  inputSchema: {
    item_id: z.string().uuid().describe("ID of the item (from list_items)."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe("Date in YYYY-MM-DD."),
    days: z.union([z.literal(0.25), z.literal(0.5), z.literal(1)]).default(1).describe("Portion of the day: 0.25, 0.5 or 1."),
    notes: z.string().max(500).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ item_id, date, days, notes }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const userId = ctx.getUserId()!;
    const { data: existing, error: exErr } = await sb
      .from("wear_entries").select("days").eq("user_id", userId).eq("wear_date", date);
    if (exErr) throw new ToolError(exErr.message);
    const used = (existing ?? []).reduce((s, r: any) => s + Number(r.days), 0);
    if (used + days > 1) throw new ToolError(`Only ${Math.max(0, 1 - used)} day remaining on ${date}.`);
    const { data, error } = await sb
      .from("wear_entries")
      .insert({ user_id: userId, watch_id: item_id, wear_date: date, days, notes: notes ?? null })
      .select("id")
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Logged wear ${data.id} on ${date}.` }],
      structuredContent: { id: data.id as string },
    };
  },
});
