import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_collections",
  title: "List collections",
  description: "List the signed-in user's collections (watches, sneakers, purses).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb
      .from("collections")
      .select("id, name, collection_type, created_at")
      .order("created_at");
    if (error) throw new ToolError(error.message);
    const collections = (data ?? []).map((c) => ({
      id: c.id as string,
      name: c.name as string,
      collection_type: c.collection_type as string,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(collections) }],
      structuredContent: { collections },
    };
  },
});
