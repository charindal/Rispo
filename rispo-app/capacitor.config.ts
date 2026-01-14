import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.infratech.rispo.app',
  appName: 'rispo-app',
  webDir: 'build',
  server: {
    // Enable cleartext traffic for HTTP connections (required for local development)
    // For production, use HTTPS
    androidScheme: 'https',
    // Add CORS configuration
    allowNavigation: ['*']
  },
  android: {
    // Allow cleartext traffic for HTTP (dev only - use HTTPS in production!)
    allowMixedContent: true
  }
};

export default config;
