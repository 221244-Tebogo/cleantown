import DateTimePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Button, FlatList, Platform, Text, View } from "react-native";
import * as AddCalendarEvent from "react-native-add-calendar-event";


import {
  createCleanup,
  deleteCleanup,
  subscribeCleanups,
  updateCleanup,
} from "../services/cleanupService";
import { Btn, Card, H2, Input, P, Screen } from "../src/ui";

type CleanupItem = {
  id: string;
  title: string;
  status?: "planned" | "completed" | "cancelled";
  scheduledAt?: { seconds?: number; nanoseconds?: number } | Date;
  userId?: string;
};

export default function Cleanups({ user }: { user?: { uid: string } }) {
  const [list, setList] = useState<CleanupItem[]>([]);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // DatePicker state
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    console.log("[Cleanups] subscribing to cleanups…");
    const unsub = subscribeCleanups((items) => {
      console.log("[Cleanups] snapshot items:", items);
      setList(items);
    });
    return () => {
      console.log("[Cleanups] unsubscribing");
      unsub();
    };
  }, []);

  const create = async () => {
    console.log("[create] start", { user: !!user, title, when, platform: Platform.OS });
    if (!user) return setMsg("Please sign in to create a cleanup.");
    if (!title.trim()) return setMsg("Title is required.");
    if (!when) return setMsg("Please select a date/time.");

    setBusy(true);
    setMsg("");
    try {
      console.log("[create] calling createCleanup");
      const id = await createCleanup({
        title: title.trim(),
        when,
        userId: user.uid,
      });
      console.log("[create] created doc id:", id);

      // Add to device calendar (optional)
      const eventConfig = {
        title: title.trim(),
        startDate: when.toISOString(),
        endDate: new Date(when.getTime() + 60 * 60 * 1000).toISOString(), // +1h
        notes: "Cleanup event created from the app",
      };

      AddCalendarEvent.presentEventCreatingDialog(eventConfig)
        .then(() => console.log("[create] calendar dialog shown"))
        .catch((err) => console.warn("[create] Calendar add failed:", err));

      setTitle("");
      setWhen(null);
      setMsg("Cleanup created successfully!");
    } catch (e: any) {
      const errText = e?.code ? `${e.code}: ${e.message}` : e?.message || String(e);
      console.log("[create] error:", e);
      setMsg(errText);
    } finally {
      setBusy(false);
      console.log("[create] done");
    }
  };

  const handleDelete = async (id: string) => {
    console.log("[delete] try", id);
    try {
      await deleteCleanup(id);
      console.log("[delete] ok", id);
    } catch (e: any) {
      console.log("[delete] error:", e);
      setMsg(e?.message || "Delete failed.");
    }
  };

  const handleMarkDone = async (id: string) => {
    console.log("[markDone] try", id);
    try {
      await updateCleanup(id, { status: "completed" });
      console.log("[markDone] ok", id);
    } catch (e: any) {
      console.log("[markDone] error:", e);
      setMsg(e?.message || "Update failed.");
    }
  };

  // Picker change (native)
  const onChangePicker = (event: any, selectedDate?: Date) => {
    console.log("[picker] onChange", { eventType: event?.type, selectedDate });
    if (event?.type === "dismissed") {
      setShowPicker(false);
      return;
    }
    if (selectedDate) {
      setWhen(selectedDate);
      console.log("[picker] setWhen", selectedDate?.toISOString?.());
    }
    if (Platform.OS === "android") {
      setShowPicker(false);
      console.log("[picker] closing modal on Android");
    }
  };

  const renderItem = ({ item }: { item: CleanupItem }) => {
    const time =
      item.scheduledAt && (item.scheduledAt as any).seconds
        ? new Date((item.scheduledAt as any).seconds * 1000).toLocaleString()
        : item.scheduledAt instanceof Date
        ? item.scheduledAt.toLocaleString()
        : "";

    return (
      <Card style={{ marginBottom: 10 }}>
        <H2>{item.title}</H2>
        <P>{(item.status || "planned").toUpperCase()} · {time}</P>
        {item.userId === user?.uid && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Btn onPress={() => handleMarkDone(item.id)}>Mark Done</Btn>
            <Btn onPress={() => handleDelete(item.id)} color="red">Delete</Btn>
          </View>
        )}
      </Card>
    );
  };

  const openPicker = () => {
    console.log("[picker] open pressed. Platform:", Platform.OS);
    if (Platform.OS === "web") {
      // On web we rely on the HTML input below—just ensure it's visible
      setShowPicker((v) => {
        const next = !v;
        console.log("[picker] showPicker(web) =>", next);
        return next;
      });
    } else {
      setShowPicker(true);
      console.log("[picker] showPicker(native) => true");
    }
  };

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
          onChangeText={(t) => {
            console.log("[input:title]", t);
            setTitle(t);
          }}
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
            minimumDate={new Date()} // prevent past dates
          />
        )}

        {/* Web fallback: native HTML input */}
        {showPicker && Platform.OS === "web" && (
          <View style={{ marginTop: 8 }}>
            {/* @ts-ignore: react-native-web allows raw elements */}
            <input
              type="datetime-local"
              onChange={(e: any) => {
                const val = e?.target?.value; // "2025-10-30T13:45"
                console.log("[web input] change:", val);
                if (val) {
                  const dt = new Date(val);
                  if (!isNaN(dt.getTime())) {
                    setWhen(dt);
                    console.log("[web input] setWhen:", dt.toISOString());
                  } else {
                    console.log("[web input] invalid date from value:", val);
                  }
                }
              }}
              // default shows current or selected
              defaultValue={
                when
                  ? moment(when).format("YYYY-MM-DDTHH:mm")
                  : moment().add(5, "minutes").format("YYYY-MM-DDTHH:mm")
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
              {when ? `Selected: ${moment(when).format("YYYY-MM-DD HH:mm")}` : "Pick a date & time"}
            </Text>
          </View>
        )}

        <Btn onPress={create}>{busy ? "Creating..." : "Create"}</Btn>
        {msg ? <P>{msg}</P> : null}
      </Card>
    </Screen>
  );
}
