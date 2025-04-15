import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'todo-app',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  },
  ios: {
    contentInset: 'always',
    scheme: 'app',
    limitsNavigationsToAppBoundDomains: true,
    preferredContentMode: 'mobile'
  },
  plugins: {
    Camera: {
      useLegacyPhotoLibrary: false,
      presentationStyle: 'fullScreen'
    }
  }
};

export default config;
