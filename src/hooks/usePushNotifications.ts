import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePushNotifications() {
  const { user } = useAuth();
  const registered = useRef(false);

  useEffect(() => {
    if (!user || registered.current) return;
    if (!Capacitor.isNativePlatform()) return;

    const register = async () => {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          // Store the token for the user
          try {
            await supabase.functions.invoke('register-push-token', {
              body: { token: token.value, platform: Capacitor.getPlatform() },
            });
          } catch (err) {
            console.error('Failed to register push token:', err);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('Push registration error:', err.error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
        });

        registered.current = true;
      } catch (err) {
        console.error('Push notification setup error:', err);
      }
    };

    register();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user]);
}
