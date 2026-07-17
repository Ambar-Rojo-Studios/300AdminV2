export interface FirebaseEnvironment {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
  vapidKey: string;
}

export interface AppEnvironment {
  production: boolean;
  apiBaseUrl: string;
  tinymceApiKey: string;
  googleMapsApiKey: string;
  firebase: FirebaseEnvironment;
}

declare global {
  interface Window {
    __env?: Partial<AppEnvironment> & { firebase?: Partial<FirebaseEnvironment> };
  }
}

const defaults: AppEnvironment = {
  production: true,
  apiBaseUrl: 'https://app300-lugares.onrender.com',
  tinymceApiKey: 'vyd9f6lzy6nuczv9t2fywkmt9eqt1a105vfyi3l36zqqm5u7',
  googleMapsApiKey: 'AIzaSyCWNmsHV-WjD__L5gERIzsZh3983SoFtkg',
  firebase: {
    apiKey: 'AIzaSyAHwZU9K05QST_uX5oNT8LLYbE5nKRwwcY',
    authDomain: 'fir-ar-300lugares.firebaseapp.com',
    projectId: 'fir-ar-300lugares',
    storageBucket: 'fir-ar-300lugares.firebasestorage.app',
    messagingSenderId: '908646719757',
    appId: '1:908646719757:web:ec3a2bf5f201f7541fd044',
    measurementId: 'G-9XDR073PBH',
    vapidKey: 'BOd1R0MRTptxg2GSKrvFFP5ysyuR8nCBVNBUChNuqDZBd8GKBEoMMWKxpXF8DN2cYdPsin4CdVqQ5A69H2E6lsE'
  }
};

const runtimeConfig = typeof window !== 'undefined' ? window.__env : undefined;

export const environment: AppEnvironment = {
  ...defaults,
  ...(runtimeConfig || {}),
  firebase: {
    ...defaults.firebase,
    ...(runtimeConfig?.firebase || {})
  }
};
