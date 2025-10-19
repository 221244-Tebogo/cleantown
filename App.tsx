import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./context/auth";

import "react-native-gesture-handler";


import Alerts from "./screens/Alerts";
import Cleanups from "./screens/Cleanups";
import Home from "./screens/Home";
import Leaderboard from "./screens/Leaderboard";
import Login from "./screens/Login";
import MapViewScreen from "./screens/MapViewScreen";
import Profile from "./screens/Profile";
import Report from "./screens/Report";


const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      {!user ? (
        <Stack.Screen name="Login" component={Login} options={{ title: "Sign in" }} />
      ) : (
        <>
          <Stack.Screen name="Home" options={{ title: "CleanTown" }}>
            {(props) => <Home {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Report">
            {(props) => <Report {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Cleanups">
            {(props) => <Cleanups {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Leaderboard" component={Leaderboard} />
          <Stack.Screen name="Profile">
            {(props) => <Profile {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="Map" component={MapViewScreen} />
          <Stack.Screen
name="Alerts" component={Alerts} options={{ title: "Nearby Alerts" }}
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
