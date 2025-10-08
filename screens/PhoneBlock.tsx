import React, { useRef, useState } from "react";
import { Alert, View } from "react-native";
import { Screen, Card, H2, P, Btn, Input } from "../src/ui";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { app } from "../firebase";
import { phoneStart, phoneConfirm } from "../services/authService";

export default function PhoneBlock() {
  const recaptchaRef = useRef(null);
  const [phone, setPhone] = useState("+27"); 
  const [code, setCode] = useState("");
  const [confirmObj, setConfirmObj] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    try {
      setBusy(true);
      const confirmation = await phoneStart(phone, recaptchaRef); // native path
      setConfirmObj(confirmation);
      Alert.alert("Code sent", "Check your SMS inbox.");
    } catch (e: any) {
      Alert.alert("Phone auth failed", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!confirmObj || !code) return;
    try {
      setBusy(true);
      await phoneConfirm(confirmObj, code);
    } catch (e: any) {
      Alert.alert("Invalid code", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      {/* Native reCAPTCHA modal */}
      <FirebaseRecaptchaVerifierModal ref={recaptchaRef} firebaseConfig={app.options as any} />
      <H2>Sign in with phone</H2>
      <Input placeholder="+27..." value={phone} onChangeText={setPhone} style={{ marginBottom: 8 }} />
      {!confirmObj ? (
        <Btn onPress={send}>{busy ? "Sending..." : "Send code"}</Btn>
      ) : (
        <>
          <Input placeholder="123456" value={code} onChangeText={setCode} style={{ marginTop: 8, marginBottom: 8 }} />
          <Btn onPress={confirm}>{busy ? "Verifying..." : "Confirm code"}</Btn>
        </>
      )}
    </Card>
  );
}
