import { Audio } from "expo-av";

const buttonPressSfx = require("../../assets/button-pressed-38129.mp3");
const aiDingSfx = require("../../assets/mobile-game-alert-positive-selection-roy.mp3");

export const BUTTON_PRESS_SOUND = buttonPressSfx;
export const AI_DING_SOUND = aiDingSfx;

export async function playSound(soundFile: any) {
  try {
    const { sound } = await Audio.Sound.createAsync(soundFile);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (!status.isLoaded || status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (err) {
    console.warn("Sound failed to play:", err);
  }
}
