// App.tsx (relevant parts)
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import Auth from "./screens/Auth";
import Home from "./screens/Home";
import Report from "./screens/Report";
import Cleanups from "./screens/Cleanups";
import Leaderboard from "./screens/Leaderboard";
import Profile from "./screens/Profile";
import MapViewScreen from "./screens/MapViewScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return off;
  }, []);

  if (!ready) return null; // simple splash; or render a loading card

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!user ? (
          // Auth-only stack
          <Stack.Screen name="Auth" component={Auth} options={{ title: "Sign in" }} />
        ) : (
          // App stack
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
