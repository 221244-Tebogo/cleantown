// // index.js
// import "react-native-gesture-handler"; // must be 1st

// import { registerRootComponent } from "expo";
// import App from "./App";

// registerRootComponent(App);
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
