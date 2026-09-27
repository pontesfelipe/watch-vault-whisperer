import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCollections from "./tools/list-collections";
import listItems from "./tools/list-items";
import listWears from "./tools/list-wears";
import logWear from "./tools/log-wear";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sora-vault",
  title: "Sora Vault",
  version: "0.1.0",
  instructions:
    "Tools for Sora Vault, a collection tracker for watches, sneakers and purses. Use list_collections and list_items to see what the user owns, list_wears for recent wear history, and log_wear to record a wear.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCollections, listItems, listWears, logWear],
});
