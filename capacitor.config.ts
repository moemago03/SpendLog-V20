import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spendilog.app',
  appName: 'SpendiLog',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '859713826525-32eec24v15heole20l1cv0drqqbf3f1i.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
