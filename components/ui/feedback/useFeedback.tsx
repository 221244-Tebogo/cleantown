import * as Haptics from "expo-haptics";
import { useState } from "react";

export function useFeedback() {
  const [points, setPoints] = useState<number | null>(null);
  const [badgeTitle, setBadgeTitle] = useState<string | null>(null);

  const giveSuccess = async () => {
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  };

  return {
    // points: animate “+XP”
    showPoints: (n: number) => { setPoints(n); giveSuccess(); setTimeout(() => setPoints(null), 1100); },
    // badge popup
    showBadge: (title: string) => { setBadgeTitle(title); giveSuccess(); setTimeout(() => setBadgeTitle(null), 1400); },

    // state for render props
    points,
    badgeTitle,
  };
}
