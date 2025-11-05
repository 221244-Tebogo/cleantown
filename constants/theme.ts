import { Platform } from "react-native"; // <-- REQUIRED

export const Colors = {
  brand: "#72C55D",
  tabIcon: "#1C2530",
  tabIconActive: "#72C55D",
  tabBarBg: "rgba(255,255,255,0.96)",
  buttonPrimaryBg: "#72C55D",
  buttonPrimaryText: "#0B0F14",
  buttonOutlineBg: "#FFFFFF",
  buttonOutlineBorder: "#72C55D",
  buttonOutlineText: "#72C55D",
  homeMainBottom: "#FFF7CA",
  cardIdentify: "#F1FEC5",
  cardHotspots: "#FFD8B9",
  cardLeaderboard: "#FFE17A",
  textDark: "#0B0F14",
  textSub: "#627082",
};

export const Radii = { sm: 10, md: 14, lg: 18, xl: 22, full: 999 };

export const Fonts = {
  h1: Platform.select({
    ios: "CherryBombOne-Regular",
    android: "CherryBombOne_400Regular",
    default: "CherryBombOne-Regular",
  }),
  semibold: Platform.select({
    ios: "Poppins-SemiBold",
    android: "Poppins_600SemiBold",
    default: "Poppins-SemiBold",
  }),
  regular: Platform.select({
    ios: "Poppins-Regular",
    android: "Poppins_400Regular",
    default: "Poppins-Regular",
  }),
};
