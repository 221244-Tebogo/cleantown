import { geminiAI } from "./geminiAI";

export interface Mission {
  id: string;
  title: string;
  description: string;
  theme: "story" | "challenge" | "discovery";
  difficulty: "easy" | "medium" | "hard";
  target: {
    type: string; // "plastic bottles", "glass", "mixed"
    quantity: number;
    area: string; // "park", "beach", "urban"
  };
  rewards: {
    points: number;
    badge?: string;
    unlock?: string;
  };
  story?: {
    character: string;
    narrative: string;
    urgency: string;
  };
}

class MissionGenerator {
  async generatePersonalizedMission(userData: any): Promise<Mission> {
    const prompt = `Create a fun cleanup mission for a user who has: 
    - Level: ${userData.level}
    - Previous missions: ${userData.completedMissions}
    - Favorite areas: ${userData.favoriteLocations}
    - Points: ${userData.points}
    
    Make it engaging with a story element! Return JSON format.`;

    const response = await geminiAI.analyzeReport(undefined, prompt);
    return this.parseMissionResponse(response.description);
  }

  async generateStoryMission(): Promise<Mission> {
    const themes = [
      "Ocean Guardian protecting marine life from plastic",
      "Urban Ranger cleaning city streets",
      "Park Protector saving green spaces",
      "River Warrior preventing water pollution",
    ];

    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const prompt = `Create an exciting cleanup mission with this theme: "${randomTheme}"
    Include:
    - Catchy title with emoji
    - Engaging story narrative
    - Specific cleanup targets
    - Rewards that feel meaningful
    - Urgency and purpose
    
    Make it feel like a game quest!`;

    const response = await geminiAI.analyzeReport(undefined, prompt);
    return this.parseMissionResponse(response.description);
  }
}
