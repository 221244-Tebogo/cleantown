import React, { createContext, useMemo, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

export const ThemeContext = createContext<{ isDark: boolean; toggle: () => void }>({
  isDark: false,
  toggle: () => {},
});

export default function AppUIProvider({ children }: { children: React.ReactNode }) {
  const systemScheme: ColorSchemeName = useColorScheme();
  const [manualDark, setManualDark] = useState<boolean | null>(null);

  const isDark = manualDark ?? (systemScheme === "dark");

  const value = useMemo(
    () => ({ isDark, toggle: () => setManualDark((d) => !(d ?? (systemScheme === "dark"))) }),
    [isDark, systemScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
