import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImpersonatedUser {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  startImpersonation: (userId: string) => Promise<void>;
  stopImpersonation: () => void;
  effectiveUserId: string | null;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children, realUserId }: { children: ReactNode; realUserId: string | null }) {
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);

  const startImpersonation = useCallback(async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles' as any)
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleData) {
        toast.error("Cannot impersonate admin users");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        toast.error("User not found");
        return;
      }

      setImpersonatedUser(profile);
      toast.success(`Now viewing as ${profile.full_name || profile.email}`, {
        description: "You are in demo/impersonation mode. Data is read from this user's perspective.",
        duration: 5000,
      });
    } catch (err) {
      console.error("Impersonation error:", err);
      toast.error("Failed to start impersonation");
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedUser(null);
    toast.info("Exited impersonation mode");
  }, []);

  const effectiveUserId = impersonatedUser?.id ?? realUserId;

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating: !!impersonatedUser,
        impersonatedUser,
        startImpersonation,
        stopImpersonation,
        effectiveUserId,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error("useImpersonation must be used within ImpersonationProvider");
  }
  return context;
}
