// screens/Cleanups.tsx
import DateTimePicker from "@react-native-datetimepicker/datetimepicker";

import { getAuth } from "firebase/auth";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import * as AddCalendarEvent from "react-native-add-calendar-event";

import {
  createCleanup,
  deleteCleanup,
  joinCleanup,
  subscribeCleanups,
  updateCleanup
} from "../services/cleanups"; // ✅ your file that includes join/leave (+points)

import { Btn, Card, H2, Input, P, Screen } from "../src/ui";

// ---------- Types ----------
type CleanupItem = {
  id: string;
  title: string;
  status?: "planned" | "completed" | "cancelled";
  scheduledAt?: { seconds?: number; nanoseconds?: number } | Date;
  userId?: string; // creator
};

// ---------- Inline JoinButton (uses your joinCleanup that awards points) ----------
function JoinButton({
  cleanupId,
  displayName,
  disabled,
}: {
  cleanupId: string;
  displayName?: string;
  disabled?: boolean;
}) {
  const onJoin = async () => {
    try {
      const res = await joinCleanup(cleanupId, displayName);
      const msg = res?.firstJoin
        ? `Joined! +${res.addedPoints} points earned.`
        : "You're already joined. Name updated.";
      Alert.alert("Cleanup", msg);
    } catch (e: any) {
      Alert.alert("Join failed", e?.message || String(e));
    }
  };

  return (
    <Pressable
      disabled={!!disabled}
      onPress={onJoin}
      style={{
        backgroundColor: disabled ? "#bfbfbf" : "#FBBC05",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: "#0B0F14", fontWeight: "800" }}>
        {disabled ? "Joined" : "Join Cleanup"}
      </Text>
    </Pressable>
  );
}

// ---------- Main Screen ----------
export default function Cleanups() {
  const auth = getAuth();
  const user = auth.currentUser || null;

  const [list, setList] = useState<CleanupItem[]>([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // DatePicker state
  const [showPicker, setShowPicker] = useState(false);

  // Subscribe to cleanups
  useEffect(() => {
    const unsub = subscribeCleanups((items) => {
      setList(items);
    });
    return () => unsub();
  }, []);

  // Creator’s display name (if you store it on auth profile)
  const displayName = useMemo(
    () => user?.displayName ?? undefined,
    [user?.displayName]
  );

  // --------- CREATE ----------
  const onCreate = async () => {
    if (!user) return setMsg("Please sign in to create a cleanup.");
    if (!title.trim()) return setMsg("Title is required.");
    if (!when) return setMsg("Please select a date/time.");

    setBusy(true);
    setMsg("");
    try {
      const id = await createCleanup({
        title: title.trim(),
        when,
        description: "",
      });

      // Optional: add to device calendar
      const eventConfig = {
        title: title.trim(),
        startDate: when.toISOString(),
        endDate: new Date(when.getTime() + 60 * 60 * 1000).toISOString(), // +1 hour
        notes: "Cleanup created from CleanTown",
      };
      AddCalendarEvent.presentEventCreatingDialog(eventConfig).catch(() => {});

      setTitle("");
      setWhen(null);
      setMsg("Cleanup created successfully!");
    } catch (e: any) {
      const errText = e?.code ? `${e.code}: ${e.message}` : e?.message || String(e);
      setMsg(errText);
    } finally {
      setBusy(false);
    }
  };

  // --------- DELETE / DONE ----------
  const handleDelete = async (id: string) => {
    try {
      await deleteCleanup(id);
    } catch (e: any) {
      setMsg(e?.message || "Delete failed.");
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      await updateCleanup(id, { status: "completed" });
    } catch (e: any) {
      setMsg(e?.message || "Update failed.");
    }
  };

  // --------- DateTime pickers ----------
  const onChangePicker = (event: any, selectedDate?: Date) => {
    if (event?.type === "dismissed") {
      setShowPicker(false);
      return;
    }
    if (selectedDate) setWhen(selectedDate);
    if (Platform.OS === "android") setShowPicker(false);
  };

  const openPicker = () => {
    if (Platform.OS === "web") {
      setShowPicker((v) => !v);
    } else {
      setShowPicker(true);
    }
  };

  // --------- Render Row ----------
  const renderItem = ({ item }: { item: CleanupItem }) => {
    const isOwner = item.userId && user?.uid && item.userId === user.uid;

    const time =
      item.scheduledAt && (item.scheduledAt as any).seconds
        ? new Date((item.scheduledAt as any).seconds * 1000).toLocaleString()
        : item.scheduledAt instanceof Date
        ? item.scheduledAt.toLocaleString()
        : "";

    return (
      <Card style={{ marginBottom: 10 }}>
        <H2>{item.title}</H2>
        <P>
          {(item.status || "planned").toUpperCase()} · {time || "—"}
        </P>

        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Owner controls */}
          {isOwner ? (
            <>
              <Btn onPress={() => handleMarkDone(item.id)}>Mark Done</Btn>
              <Btn onPress={() => handleDelete(item.id)} color="red">
                Delete
              </Btn>
            </>
          ) : (
            // Join button for non-owners (awards points on first join)
            <JoinButton cleanupId={item.id} displayName={displayName} />
          )}

          {/* Optional: allow leaving if you add UI for it */}
          {/* <Btn onPress={() => leaveCleanup(item.id)} color="gray">Leave</Btn> */}
        </View>
      </Card>
    );
  };

  // --------- UI ----------
  return (
    <Screen>
      <Card>
        <H2>Upcoming Cleanups</H2>
      </Card>

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

        {/* Date/time selector */}
        <View style={{ marginVertical: 10 }}>
          <Button
            title={
              when ? moment(when).format("YYYY-MM-DD HH:mm") : "Select Date & Time"
            }
            onPress={openPicker}
          />
        </View>

        {/* Native picker (iOS/Android) */}
        {showPicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={when || new Date()}
            mode="datetime"
            display="default"
            onChange={onChangePicker}
            minimumDate={new Date()}
          />
        )}

        {/* Web fallback */}
        {showPicker && Platform.OS === "web" && (
          <View style={{ marginTop: 8 }}>
            {/* @ts-ignore */}
            <input
              type="datetime-local"
              onChange={(e: any) => {
                const val = e?.target?.value; // "2025-11-05T13:45"
                if (val) {
                  const dt = new Date(val);
                  if (!isNaN(dt.getTime())) setWhen(dt);
                }
              }}
              defaultValue={
                when
                  ? moment(when).format("YYYY-MM-DDTHH:mm")
                  : moment().add(15, "minutes").format("YYYY-MM-DDTHH:mm")
              }
              min={moment().format("YYYY-MM-DDTHH:mm")}
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid rgba(0,0,0,0.2)",
                fontSize: 16,
                width: "100%",
                background: "white",
              }}
            />
            <Text style={{ marginTop: 6 }}>
              {when
                ? `Selected: ${moment(when).format("YYYY-MM-DD HH:mm")}`
                : "Pick a date & time"}
            </Text>
          </View>
        )}

        <Btn onPress={onCreate} disabled={busy}>
          {busy ? "Creating..." : "Create"}
        </Btn>
        {msg ? <P>{msg}</P> : null}
      </Card>
    </Screen>
  );
}
