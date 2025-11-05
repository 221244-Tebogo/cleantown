import { registerRootComponent } from "expo";
import "expo-dev-client";
import "react-native-gesture-handler"; // must be 1st
import App from "./App.tsx";
registerRootComponent(App);
