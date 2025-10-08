export default {
  expo: {
    name: "CleanTown",
    slug: "cleantown-rn",
    scheme: "cleantown",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: { bundler: "metro", favicon: "./assets/favicon.png" },
    newArchEnabled: true,
    plugins: [],
    extra: {
      
    },
  },
};
