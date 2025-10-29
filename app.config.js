import "dotenv/config";

export default {
  expo: {
    name: "cleantown-rn",
    slug: "cleantown-rn",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "cleantownrn",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      bundleIdentifier: "com.tebogo-r.cleantownrn",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSLocationWhenInUseUsageDescription:
          "We use your location to show your position on the map.",
        // ✅ Required for react-native-add-calendar-event on iOS
        NSCalendarsUsageDescription:
          "This app adds cleanup events to your calendar.",
      },
    },

    android: {
      package: "com.tebogo_r.cleantownrn",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,

      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
      ],
      config: {
        googleMaps: {
          apiKey: process.env.ANDROID_MAPS_KEY,
        },
      },
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
    },

    plugins: [
      // Calendar plugin (adds native bits during prebuild)
      [
        "react-native-add-calendar-event",
        {
          calendarPermission: "This app adds cleanup events to your calendar.",
        },
      ],
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

    experiments: { typedRoutes: true },

    extra: {
      google: {
        expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "",
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      },
      eas: { projectId: process.env.EAS_PROJECT_ID || "" },
    },
  },
};
