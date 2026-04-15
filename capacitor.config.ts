import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.soravault',
  appName: 'Sora Vault',
  webDir: 'dist',
  server: {
    url: 'https://76228ce7-4d0e-4a88-a39a-2cfc7311b440.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
