import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DefaultTheme,
  DarkTheme as NavDark,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

import AppUIProvider, { ThemeContext } from "./AppUIProvider";
import AppBackground from "./components/AppBackground";
import { AuthProvider } from "./context/auth";

// Screens
import SplashAnimation from "./screens/Animation";
import Camera from "./screens/Camera";
import Home from "./screens/Home";
import Listen from "./screens/Listen";
import Login from "./screens/Login";
import MapShare from "./screens/MapShare";
import Profile from "./screens/Profile";
import Registration from "./screens/Registration";
import Settings from "./screens/Settings";
import VoiceApp from "./screens/VoiceApp";

// --- NAVIGATORS ---
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ONBOARD_KEY = "@seen_onboarding_v1";

// Hold the native splash until we're ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// Inline MainTabs to avoid missing imports/files
function MainTabs() {
  const bg = "#0B284A";
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: "rgba(255,255,255,0.12)",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const s = size + (focused ? 2 : 0);
          switch (route.name) {
            case "Home":
              return <Ionicons name={focused ? "home" : "home-outline"} size={s} color={color} />;
            case "MapShare":
              return <Ionicons name={focused ? "map" : "map-outline"} size={s} color={color} />;
            case "Camera":
              return <MaterialCommunityIcons name={focused ? "camera" : "camera-outline"} size={s} color={color} />;
            case "Listen":
              return <Ionicons name={focused ? "mic" : "mic-outline"} size={s} color={color} />;
            case "Profile":
              return <Ionicons name={focused ? "person" : "person-outline"} size={s} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} options={{ title: "Home" }} />
      <Tab.Screen name="MapShare" component={MapShare} options={{ title: "Map" }} />
      <Tab.Screen name="Camera" component={Camera} options={{ title: "Report" }} />
      <Tab.Screen name="Listen" component={Listen} options={{ title: "Listen" }} />
      <Tab.Screen name="Profile" component={Profile} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null | undefined>(undefined);

  // Minimal boot
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

  // Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u ?? null));
    return unsub;
  }, []);

  // Hide native splash once "ready"
  useEffect(() => {
    if (ready) {
      (async () => {
        try { await SplashScreen.hideAsync(); } catch {}
      })();
    }
  }, [ready]);

  // Fail-safe: never block forever on custom splash
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
                      <RootStack.Navigator screenOptions={{ headerShown: false }}>
                        {/* Tabs as app root */}
                        <RootStack.Screen name="MainTabs" component={MainTabs} />
                        {/* Extra stack routes accessible from any tab */}
                        <RootStack.Screen name="Settings" component={Settings} />
                        <RootStack.Screen name="VoiceApp" component={VoiceApp} />
                      </RootStack.Navigator>
                    ) : (
                      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                        <AuthStack.Screen name="Login" component={Login} />
                        <AuthStack.Screen name="Registration" component={Registration} />
                      </AuthStack.Navigator>
                    )}
                  </NavigationContainer>
                ) : (
                  // Your Onboarding screen must call onDone() to flip seen=true
                  <SplashAnimation onDone={async () => {
                    try { await AsyncStorage.setItem(ONBOARD_KEY, "1"); } catch {}
                    setSeen(true);
                  }} />
                )}
              </View>
            )}
          </ThemeContext.Consumer>
        </AppUIProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
