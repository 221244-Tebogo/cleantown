import { useEffect, useState } from "react";
import { Screen, Card, H2, P, Btn } from "../src/ui";
import { doc, getDoc } from "firebase/firestore";

export default function Profile({ user }){
  const [profile, setProfile] = useState(null);
  useEffect(()=>{
    (async()=>{
      const snap = await getDoc(doc(db,"users", user.uid));
      setProfile(snap.exists() ? snap.data() : { displayName:user.uid, totalPoints:0, streakDays:0 });
    })();
  },[user]);
  return (
    <Screen>
      <Card><H2>My Profile</H2></Card>
      <Card>
        <P>Name: {profile?.displayName || user.uid}</P>
        <P>Points: {profile?.totalPoints ?? 0}</P>
        <P>Streak: {profile?.streakDays ?? 0} days</P>
      </Card>
    </Screen>
  );
}
