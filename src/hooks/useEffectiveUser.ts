import { useAuth } from "@/contexts/AuthContext";
import { useImpersonation } from "@/contexts/ImpersonationContext";

/**
 * Returns the effective user ID for data fetching.
 * When admin is impersonating, returns the impersonated user's ID.
 * Otherwise returns the authenticated user's ID.
 */
export function useEffectiveUser() {
  const { user, isAdmin } = useAuth();
  const { isImpersonating, impersonatedUser, effectiveUserId } = useImpersonation();

  return {
    /** The user ID to use for all data queries */
    effectiveUserId: effectiveUserId ?? user?.id ?? null,
    /** Whether we're currently impersonating another user */
    isImpersonating,
    /** The real authenticated user */
    realUser: user,
    /** The impersonated user profile (if active) */
    impersonatedUser,
    /** Whether the real user is admin */
    isAdmin,
    /** Whether data queries should filter by user (true when impersonating OR not admin) */
    shouldFilterByUser: isImpersonating || !isAdmin,
  };
}
