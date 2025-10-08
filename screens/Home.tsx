import { Screen, Card, H2, P, Btn } from "../src/ui";
import { anonymousLogin, logout } from "../services/authService";

export default function Home({ navigation, user }) {
  return (
    <Screen>
      <Card>
        <H2>Welcome to CleanTown</H2>
        <P>Turns reporting illegal dumping into a community-driven mission for cleaner neighbourhoods.</P>
        <P>• Report with photo + GPS{"\n"}• Join cleanups{"\n"}• Earn points</P>
        {!user ? (
          <Btn onPress={async ()=>{ try{ await anonymousLogin(); } catch(e){} }}>
            Continue
          </Btn>
        ) : (
          <Btn onPress={async ()=>{ try{ await logout(); } catch(e){} }}>
            Logout
          </Btn>
        )}
      </Card>

      <Card>
        <Btn style={{marginBottom:8}} onPress={()=>navigation.navigate("Report")}>Report dumping</Btn>
        <Btn style={{marginBottom:8}} onPress={()=>navigation.navigate("Cleanups")}>Cleanups</Btn>
        <Btn style={{marginBottom:8}} onPress={()=>navigation.navigate("Leaderboard")}>Leaderboard</Btn>
        {user && <Btn onPress={()=>navigation.navigate("Profile")}>My Profile</Btn>}
      </Card>

      <Card>
        <Btn onPress={()=>navigation.navigate("Map")}>Open Map</Btn>
      </Card>
    </Screen>
  );
}
