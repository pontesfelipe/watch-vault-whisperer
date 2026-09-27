import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_items",
  title: "List collection items",
  description: "List items (watches, sneakers, purses) the signed-in user owns, optionally filtered by collection or status.",
  inputSchema: {
    collection_id: z.string().uuid().optional().describe("Only items in this collection."),
    status: z.enum(["active", "sold", "traded", "lost", "stolen", "gave_away"]).optional().describe("Filter by item status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ collection_id, status }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    let q = sb
      .from("watches")
      .select("id, brand, model, reference, year, dial_color, type, cost, msrp, average_resale_price, status, collection_id")
      .eq("user_id", ctx.getUserId()!)
      .order("sort_order");
    if (collection_id) q = q.eq("collection_id", collection_id);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const items = (data ?? []).map((w) => ({
      id: w.id as string,
      brand: w.brand as string,
      model: w.model as string,
      reference: (w.reference as string | null) ?? null,
      year: (w.year as number | null) ?? null,
      dial_color: w.dial_color as string,
      type: w.type as string,
      price_paid: Number(w.cost),
      msrp: w.msrp == null ? null : Number(w.msrp),
      market_value: w.average_resale_price == null ? null : Number(w.average_resale_price),
      status: w.status as string,
      collection_id: (w.collection_id as string | null) ?? null,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(items) }],
      structuredContent: { items },
    };
  },
});
