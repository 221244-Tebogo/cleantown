import { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { Screen, Card, H2, P, Btn, Input } from "../src/ui";
import {
  listCleanups,          // optional if you prefer one-off load
  createCleanup,
  subscribeCleanups,     // real-time updates
} from "../services/cleanupService";

export default function Cleanups({ user }) {
  const [list, setList] = useState([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // EITHER: one-off load
    // (async () => setList(await listCleanups()))();

    // OR: real-time subscription (recommended)
    const unsub = subscribeCleanups(setList);
    return () => unsub();
  }, []);

  const create = async () => {
    if (!user) { setMsg("Please sign in to create a cleanup."); return; }
    if (!title.trim()) { setMsg("Title is required."); return; }

    // Normalize date string to ISO for safer parsing (iOS-friendly)
    const normalized =
      when && !when.includes("T") ? when.replace(" ", "T") : when;

    setBusy(true);
    try {
      await createCleanup({
        title: title.trim(),
        when: normalized,       // service will new Date(when)
        userId: user?.uid,
        description: "",
      });
      setTitle("");
      setWhen("");
      setMsg("Cleanup created.");
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const renderItem = ({ item }) => {
    const ts = item?.scheduledAt;
    const time = ts?.seconds
      ? new Date(ts.seconds * 1000).toLocaleString()
      : (ts instanceof Date ? ts.toLocaleString() : "");
    return (
      <Card style={{ marginBottom: 10 }}>
        <H2>{item.title}</H2>
        <P>
          {(item.status || "planned")} · {time}
        </P>
      </Card>
    );
  };

  return (
    <Screen>
      <Card><H2>Upcoming Cleanups</H2></Card>

      <Card>
        <FlatList
          data={list}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          ListEmptyComponent={<P>No cleanups yet.</P>}
        />
      </Card>

      <Card>
        <H2>Create Cleanup</H2>
        <Input
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
        />
        <Input
          placeholder="YYYY-MM-DD HH:mm"
          value={when}
          onChangeText={setWhen}
        />
        <Btn onPress={create}>{busy ? "Creating..." : "Create"}</Btn>
        {msg ? <P>{msg}</P> : null}
      </Card>
    </Screen>
  );
}
