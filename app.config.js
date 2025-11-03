// File: app.config.ts  (replace your app.json with this)
import type { ExpoConfig } from "@expo/config";
import "dotenv/config";

const config: ExpoConfig = {
  name: "cleantown-rn",
  slug: "cleantown-rn",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "cleantownrn", // used by AuthSession redirects
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  ios: {
    bundleIdentifier: "com.cleantown", // <- must match your iOS OAuth client
    supportsTablet: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSLocationWhenInUseUsageDescription:
        "We use your location to show your position on the map.",
    },
  },

  android: {
    package: "com.cleantown", // <- must match your Android OAuth client
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
      backgroundColor: "#E6F4FE",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
    config: {
      googleMaps: {
        apiKey:
          process.env.ANDROID_MAPS_KEY || "YOUR_ANDROID_GOOGLE_MAPS_API_KEY",
      },
    },
  },

  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "expo-maps",
      {
        requestLocationPermission: true,
        locationPermission:
          "Allow $(PRODUCT_NAME) to use your location while using the app.",
      },
    ],
  ],

  experiments: { typedRoutes: true, reactCompiler: true },

  extra: {
    eas: { projectId: "YOUR_EAS_PROJECT_ID" }, // set when you use EAS
    // Optional: also expose Google IDs here if you prefer Constants.expoConfig
    google: {
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    },
  },
};

export default config;
