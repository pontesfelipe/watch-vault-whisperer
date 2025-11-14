import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAllowedUserCheck = () => {
  const { user } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

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

        // Check if user email is in allowed_users
        const { data: allowedData } = await ((supabase as any)
          .from('allowed_users')
          .select('email')
          .eq('email', user.email)
          .maybeSingle());

        setIsAllowed(!!allowedData);
      } catch (error) {
        console.error('Error checking allowed status:', error);
        setIsAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkAllowedStatus();
  }, [user]);

  return { isAllowed, loading };
};
