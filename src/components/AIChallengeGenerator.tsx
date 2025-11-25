export default function AIChallengeGenerator() {
  const [currentChallenge, setCurrentChallenge] = useState(null);

  const challengeTypes = {
    timed: "Speed Cleanup - collect as much as possible in 30 minutes!",
    targeted: "Precision Pick - find and collect specific items",
    exploration: "Area Discovery - clean new locations",
    social: "Team Up - clean with friends"
  };

  const generateChallenge = async (type: string) => {
    const prompt = `Create a ${type} cleanup challenge with:
    - Creative name with emoji
    - Clear objectives
    - Time limit or special rules
    - Exciting rewards
    - Fun constraints or bonuses
    - Motivational description
    
    Make it feel like a mini-game!`;

    const response = await geminiAI.analyzeReport(undefined, prompt);
    setCurrentChallenge(this.parseChallenge(response.description));
  };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
        🎮 Daily Challenges
      </Text>
      
      <ScrollView horizontal>
        {Object.entries(challengeTypes).map(([key, title]) => (
          <Pressable
            key={key}
            onPress={() => generateChallenge(key)}
            style={{ 
              backgroundColor: '#3b82f6', 
              padding: 16, 
              margin: 8, 
              borderRadius: 12,
              minWidth: 150 
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              {title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {currentChallenge && (
        <Animated.View style={{ 
          backgroundColor: '#fff', 
          padding: 16, 
          marginTop: 16, 
          borderRadius: 12,
          borderLeftWidth: 4,
          borderLeftColor: '#f59e0b'
        }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>
            {currentChallenge.emoji} {currentChallenge.name}
          </Text>
          <Text style={{ marginVertical: 8 }}>{currentChallenge.description}</Text>
          <Text>Goal: {currentChallenge.objective}</Text>
          <Text>⏱Time: {currentChallenge.duration}</Text>
          <Text>Reward: {currentChallenge.reward} points</Text>
          
          <Pressable style={{ 
            backgroundColor: '#10b981', 
            padding: 12, 
            borderRadius: 8, 
            marginTop: 12 
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              Start Challenge!
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}