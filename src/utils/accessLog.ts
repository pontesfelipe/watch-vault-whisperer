import { supabase } from "@/integrations/supabase/client";

export async function logAccess(
  action: string,
  options: { page?: string; details?: Record<string, any>; userId?: string; userEmail?: string } = {}
) {
  try {
    let userId = options.userId;
    let userEmail = options.userEmail;
    if (!userId) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
      userEmail = userEmail ?? data.user?.email ?? undefined;
    }
    if (!userId) return;
    await supabase.from("access_logs").insert({
      user_id: userId,
      user_email: userEmail ?? null,
      action,
      page: options.page ?? (typeof window !== "undefined" ? window.location.pathname : null),
      details: options.details ?? null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  } catch (e) {
    console.error("logAccess failed", e);
  }
}