export class AchievementSystem {
  async generatePersonalizedBadge(userData: any, achievement: string) {
    const prompt = `Create a fun badge description and name for a user who: ${achievement}
    User stats: Level ${userData.level}, ${userData.points} points, ${userData.cleanups} cleanups
    
    Make it:
    - Celebratory and fun
    - Include a creative badge name
    - Short description of achievement
    - Motivational message
    - Include relevant emojis`;

    const response = await geminiAI.analyzeReport(undefined, prompt);

    return {
      name: this.extractBadgeName(response.description),
      description: response.description,
      unlockedAt: new Date(),
      rarity: this.calculateRarity(achievement),
    };
  }

  async generateLevelUpMessage(level: number) {
    const prompt = `Create an exciting level-up message for reaching level ${level} in a cleanup app!
    Make it feel like a game achievement with celebration and motivation to continue.`;

    const response = await geminiAI.analyzeReport(undefined, prompt);
    return response.description;
  }
}
