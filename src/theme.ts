export const colors = {
  primary: "#72C55D",
  primaryDark: "#1C853E",
  accent: "#FFE17A",
  sky: "#E9F7FB",
  ink: "#1C2530",

  background: "#FFFFFF",
  card: "#F3F4F6",
  text: "#111827",
  muted: "#6B7280",
  danger: "#EF4444",

  homeMain: "#FFF7CA",
  idTrash: "#41AB30",
  hotspots: "#FC7A12",
  leaderboard: "#FDB901",

  navBackground: "#72C55D",
  navIcons: "#1C2530",
  points: "#1C2530",
  pointsBackground: "#FFFFFF",
  pointsText: "#1C2530",

  gradientStart: "#D3F3F0",
  gradientEnd: "#BBE2F1",

  outline: "#72C55D",
};

export const fonts = {
  heading: "CherryBomb-One",
  body: "Poppins-Regular",
  bodyBold: "Poppins-Bold",
  bodySemiBold: "Poppins-SemiBold",
};

export const spacing = (n: number) => n * 8;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
};

export const buttonVariants = {
  primary: {
    container: {
      backgroundColor: colors.primary,
      borderRadius: radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    text: {
      color: "#fff",
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
    },
  },
  outline: {
    container: {
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: colors.outline,
      borderRadius: radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    text: {
      color: colors.outline,
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
    },
  },
};

export const textStyles = {
  h1: {
    fontFamily: fonts.heading,
    fontSize: 32,
    color: "#2A7390",
  },
  h2: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.ink,
  },
  h3: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 20,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.text,
  },
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
  },
  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
  },
};

export const backgroundStyles = {
  radialGradient: {
    background: `radial-gradient(circle at center, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
  },
  screen: {
    flex: 1,
    background: `radial-gradient(circle at center, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`,
  },
};
