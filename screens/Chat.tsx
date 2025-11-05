
// screens/Chat.tsx
// screens/Chat.tsx
import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ChatMessage, openaiChatDev } from "../services/openai-dev";

type Item = ChatMessage & { id: string };

export default function Chat() {
  const [messages, setMessages] = useState<Item[]>([
    { id: "sys", role: "system", content: "You are a helpful assistant for the CleanTown app." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<Item>>(null);

  const append = (m: ChatMessage) => setMessages((p) => [...p, { ...m, id: `${Date.now()}-${Math.random()}` }]);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    append(userMsg);
    setInput("");
    setLoading(true);
    try {
      const convo: ChatMessage[] = messages.map(({ role, content }) => ({ role, content }));
      const reply = await openaiChatDev([...convo, userMsg]);
      append({ role: "assistant", content: reply });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e: any) {
      append({ role: "assistant", content: `⚠️ ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <FlatList
        ref={listRef}
        data={messages.filter((m) => m.role !== "system")}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === "user" ? styles.user : styles.bot]}>
            <Text style={styles.text}>{item.content}</Text>
          </View>
        )}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.row}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type message…"
          style={styles.input}
          multiline
        />
        <TouchableOpacity onPress={onSend} style={styles.send} disabled={loading}>
          {loading ? <ActivityIndicator /> : <Text>Send</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: "85%" },
  user: { alignSelf: "flex-end", backgroundColor: "#E6F2FF" },
  bot: { alignSelf: "flex-start", backgroundColor: "#F4F4F5" },
  text: { fontSize: 16 },
  row: { flexDirection: "row", alignItems: "center", padding: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#ddd", gap: 8 },
  input: { flex: 1, minHeight: 44, maxHeight: 120, padding: 10, borderWidth: 1, borderColor: "#ddd", borderRadius: 12 },
  send: { paddingHorizontal: 16, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#ddd" },
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
