// screens/Chat.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Chat() {
  return (
    <View style={s.c}>
      <Text style={s.h}>Chat AI</Text>
      <Text style={s.p}>Your assistant lives here. Wire your UI next.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#0B284A", padding: 16, justifyContent: "center" },
  h: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 8 },
  p: { color: "rgba(255,255,255,0.8)" },
});


// import React from 'react';
// import { StyleSheet, Text, View } from 'react-native';

// export default function Chat() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.text}>Welcome to Gemini Chat!</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#0B284A',
//   },
//   text: {
//     color: '#FFFFFF',
//     fontSize: 24,
//   },
// });
