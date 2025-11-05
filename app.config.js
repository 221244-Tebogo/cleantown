import "dotenv/config";

export default {
  expo: {
    name: "cleantown",
    slug: "cleantown",
    scheme: "cleantown",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",

    ios: {
      bundleIdentifier: "cleantown-rn",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "We use your location to show your position on the map.",
        NSCalendarsUsageDescription:
          "This app adds cleanup events to your calendar.",
        NSMicrophoneUsageDescription:
          "We need microphone access for voice features.",
        NSSpeechRecognitionUsageDescription:
          "We need speech recognition to enable voice commands.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.company.cleantown",
      edgeToEdgeEnabled: true,
      permissions: [
        "RECORD_AUDIO",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "INTERNET",
        "MODIFY_AUDIO_SETTINGS",
        "SYSTEM_ALERT_WINDOW",
        "WAKE_LOCK",
        "BLUETOOTH",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundColor: "#0B284A",
      },
    },

    web: {
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      // "expo-router", // ❌ removed on purpose
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/citizen_report.png",
          resizeMode: "contain",
          backgroundColor: "#FBBC05",
        },
      ],
    ],

    extra: {
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      google: {
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      },
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      maps: {
        ios: process.env.IOS_MAPS_KEY,
        android: process.env.ANDROID_MAPS_KEY,
      },
      environment: process.env.EXPO_PUBLIC_ENV || "development",
      eas: { projectId: "697d10aa-7c58-4839-ab9a-8f51aa9d9c3b" },
    },
  },
};
