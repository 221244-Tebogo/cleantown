import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import "react-native-gesture-handler";

import { AuthProvider, useAuth } from "./context/auth";

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


// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import { onAuthStateChanged } from "firebase/auth";
// import { useEffect, useState } from "react";
// import 'react-native-gesture-handler';
// import { auth } from "./firebase";

// import Auth from "./screens/Auth";
// import Cleanups from "./screens/Cleanups";
// import Home from "./screens/Home";
// import Leaderboard from "./screens/Leaderboard";
// import MapViewScreen from "./screens/MapViewScreen";
// import Profile from "./screens/Profile";
// import Report from "./screens/Report";

// const Stack = createNativeStackNavigator();

// export default function App() {
//   const [user, setUser] = useState<any>(null);
//   const [ready, setReady] = useState(false);

//   useEffect(() => {
//     const off = onAuthStateChanged(auth, (u) => {
//       setUser(u);
//       setReady(true);
//     });
//     return off;
//   }, []);

//   if (!ready) return null; // simple splash; or render a loading card

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: true }}>
//         {!user ? (
//           // Auth-only stack
//           <Stack.Screen name="Auth" component={Auth} options={{ title: "Sign in" }} />
//         ) : (
//           // App stack
//           <>
//             <Stack.Screen name="Home" options={{ title: "CleanTown" }}>
//               {(props) => <Home {...props} user={user} />}
//             </Stack.Screen>
//             <Stack.Screen name="Report">
//               {(props) => <Report {...props} user={user} />}
//             </Stack.Screen>
//             <Stack.Screen name="Cleanups">
//               {(props) => <Cleanups {...props} user={user} />}
//             </Stack.Screen>
//             <Stack.Screen name="Leaderboard" component={Leaderboard} />
//             <Stack.Screen name="Profile">
//               {(props) => <Profile {...props} user={user} />}
//             </Stack.Screen>
//             <Stack.Screen name="Map" component={MapViewScreen} />
//           </>
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }
