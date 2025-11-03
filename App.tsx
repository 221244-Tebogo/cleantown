import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./context/auth";
import TabNavigator from "./navigation/TabNavigator";

import "react-native-gesture-handler";

import Alerts from "./screens/Alerts";
import Cleanups from "./screens/Cleanups";
import Login from "./screens/Login";
import MapViewScreen from "./screens/MapViewScreen";
import Report from "./screens/Report";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={Login} options={{ title: "Sign in", headerShown: true }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen name="Report" options={{ headerShown: true }}>
            {(props) => <Report {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Cleanups" options={{ headerShown: true }}>
            {(props) => <Cleanups {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Map" component={MapViewScreen} options={{ headerShown: true }} />
          <Stack.Screen
            name="Alerts"
            component={Alerts}
            options={{ title: "Nearby Alerts", headerShown: true }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
