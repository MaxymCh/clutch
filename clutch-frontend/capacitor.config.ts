import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clutch.ewc',
  appName: 'Clutch',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
