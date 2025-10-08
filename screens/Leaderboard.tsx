import { useEffect, useState } from "react";
import { Screen, Card, H2, P, Btn } from "../src/ui";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function Leaderboard(){
  const [rows, setRows] = useState([]);
  useEffect(()=>{
    (async()=>{
      const snap = await getDocs(query(collection(db,"users"), orderBy("totalPoints","desc")));
      setRows(snap.docs.map(d=>({ id:d.id, ...d.data() })));
    })();
  },[]);
  return (
    <Screen>
      <Card><H2>Leaderboard</H2></Card>
      {rows.map((u,i)=>(
        <Card key={u.id}><P>#{i+1} {u.displayName || "User"} — {u.totalPoints ?? 0} pts</P></Card>
      ))}
      {!rows.length && <Card><P>No scores yet.</P></Card>}
    </Screen>
  );
}
