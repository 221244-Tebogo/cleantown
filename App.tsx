import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, DarkTheme as NavDark, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

import AppUIProvider, { ThemeContext } from "./AppUIProvider";
import AppBackground from "./components/AppBackground";
import { AuthProvider } from "./context/auth";
import SplashAnimation from "./screens/Animation";

import Camera from "./screens/Camera";
import Home from "./screens/Home";
import Listen from "./screens/Listen";
import Login from "./screens/Login";
import MapShare from "./screens/MapShare";
import Onboarding from "./screens/Onboarding";
import Profile from "./screens/Profile";
import Registration from "./screens/Registration";
import Settings from "./screens/Settings";
import VoiceApp from "./screens/VoiceApp";

// Keep stacks local so types don't get cranky
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

const ONBOARD_KEY = "@seen_onboarding_v1";

// Hold the native splash until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Minimal boot: read onboarding flag (don’t block on fonts you don't load)
  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem(ONBOARD_KEY);
        setSeen(flag === "1");
      } catch {
        setSeen(true);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // Hide native splash the moment we're "ready"
  useEffect(() => {
    if (ready) {
      (async () => {
        try { await SplashScreen.hideAsync(); } catch {}
      })();
    }
  }, [ready]);

  // Extra guard: if your custom animation fails to call onDone, don't block forever
  useEffect(() => {
    if (showSplash) {
      const t = setTimeout(() => setShowSplash(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showSplash]);

  if (!ready || seen === null || user === undefined) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0B284A" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  const themeLight = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#0B284A" } };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <AppUIProvider>
          <ThemeContext.Consumer>
            {({ isDark }) => (
              <View style={{ flex: 1 }}>
                <AppBackground />
                <StatusBar style="light" />

                {showSplash ? (
                  <SplashAnimation onDone={() => setShowSplash(false)} />
                ) : seen ? (
                  <NavigationContainer theme={isDark ? NavDark : themeLight}>
                    {user ? (
                      <AppStack.Navigator screenOptions={{ headerShown: false }}>
                        <AppStack.Screen name="Home" component={Home} />
                        <AppStack.Screen name="MapShare" component={MapShare} />
                        <AppStack.Screen name="Listen" component={Listen} />
                        <AppStack.Screen name="VoiceApp" component={VoiceApp} />
                        <AppStack.Screen name="Camera" component={Camera} />
                        <AppStack.Screen name="Settings" component={Settings} />
                        <AppStack.Screen name="Profile" component={Profile} />
                      </AppStack.Navigator>
                    ) : (
                      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                        <AuthStack.Screen name="Login" component={Login} />
                        <AuthStack.Screen name="Registration" component={Registration} />
                      </AuthStack.Navigator>
                    )}
                  </NavigationContainer>
                ) : (
                  <Onboarding
                    onDone={async () => {
                      try { await AsyncStorage.setItem(ONBOARD_KEY, "1"); } catch {}
                      setSeen(true);
                    }}
                  />
                )}
              </View>
            )}
          </ThemeContext.Consumer>
        </AppUIProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
