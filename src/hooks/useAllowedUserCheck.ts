import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAllowedUserCheck = () => {
  const { user } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    const checkAllowedStatus = async () => {
      if (!user) {
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user is admin
        const { data: roleData } = await ((supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle());

        if (roleData) {
          // Admins are always allowed
          setIsAllowed(true);
          setLoading(false);
          return;
        }

        // Check if user is in allowed_users using secure RPC
        const { data: allowed, error } = await (supabase as any).rpc('is_allowed_user', { 
          _user_id: user.id 
        });

        if (error) {
          console.error('Error checking allowed status via RPC:', error);
          setIsAllowed(false);
        } else {
          setIsAllowed(Boolean(allowed));
        }
      } catch (error) {
        console.error('Error checking allowed status:', error);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAllowedStatus();
  }, [user, refreshKey]);

  return { isAllowed, loading, refresh };
};
