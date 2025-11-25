<!-- ===================== -->
<!-- HERO BANNER SECTION   -->
<!-- ===================== -->

<p align="center">
  <img src="./Mockup/cleantown_banner.jpg" alt="CleanTown Banner" />
</p>

<h2 align="center">CleanTown — AI-Powered Civic Cleanup for Your City</h2>
<p align="center">
  React Native (Expo) · TypeScript · Firebase · Gemini AI · Camera · Location · Civic UX & Gamification
</p>

<!-- ===================== -->
<!-- INTRO WITH GAMIFIED SNAPSHOTS -->
<!-- ===================== -->

## Why CleanTown?

CleanTown turns illegal dumping reports into cooperative civic missions. Capture a photo, GPS pin, and optional audio to alert clean-up crews faster while unlocking XP and eco-hero badges.

- Gemini AI triages each report, estimating volume, category, and suggested cleanup actions.
- Realtime Firestore sync powers the live map, leaderboards, and cleanup scheduler.
- Gamified UX rewards streaks, verified missions, and community cleanups.
- Built with Expo + TypeScript, the app taps into camera, location, audio, and storage APIs for dependable field reporting.

<p align="center">
  <img src="./assets/citizen_report.png" alt="Citizen Report Icon" height="110" />
  <img src="./assets/cleantonw-sweeping-floor.png" alt="Sweeping Hero" height="110" />
  <img src="./assets/cleantown-trophy-winner.png" alt="Trophy Icon" height="110" />
</p>

<!-- ===================== -->
<!-- GITHUB + TECH BADGES  -->
<!-- ===================== -->

<p align="center">
  <a href="https://github.com/YOUR_GH_USER/CleanTown/fork" target="_blank">
    <img src="https://img.shields.io/github/forks/YOUR_GH_USER/CleanTown" alt="Forks"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/CleanTown/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/YOUR_GH_USER/CleanTown" alt="Stars"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/CleanTown/commits/main" target="_blank">
    <img src="https://img.shields.io/github/commit-activity/m/YOUR_GH_USER/CleanTown" alt="Commit Activity"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/CleanTown/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/YOUR_GH_USER/CleanTown" alt="Issues"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/CleanTown/pulls" target="_blank">
    <img src="https://img.shields.io/github/issues-pr/YOUR_GH_USER/CleanTown" alt="PRs"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/CleanTown/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/YOUR_GH_USER/CleanTown?color=f85149" alt="License">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Expo-000000?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=000" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=000" />
  <img src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4" />
  <img src="https://img.shields.io/badge/Camera-expo--camera-0B284A" />
  <img src="https://img.shields.io/badge/Location-expo--location-0B284A" />
  <img src="https://img.shields.io/badge/Maps-react--native--maps-0B284A" />
  <img src="https://img.shields.io/badge/Storage-AsyncStorage-0B284A" />
</p>

---

## Mission Boosts

- **Rapid Deploy:** capture, tag, and send a mission in seconds using Expo camera + GPS.  
- **Squad XP:** neighbourhood leaderboards track weekly clean-team progress.  
- **Eco-Hero Perks:** AI-reviewed missions unlock themed badges, coins, and streak powers.  
- **Cleanup Signals:** Firestore broadcasts alerts to local authorities and volunteer crews.  

## Table of Contents

- [About the Project](#about-the-project)  
- [Mockups](#Mockups)  
- [MVG Features](#mvg-features)  
- [Gamification & Eco-Heroes](#gamification--eco-heroes)  
- [Built With](#built-with)  
- [Firestore Data Model & Security Rules](#firestore-data-model--security-rules)  
- [Prerequisites](#prerequisites)  
- [Getting Started](#getting-started)  
- [Project Features](#project-features)  
- [Development Process](#development-process)  
- [Final Outcome](#final-outcome)  
- [Video Demo](#video-demo)  
- [Conclusion](#conclusion)  
- [Footer](#footer)  
- [References](#references)  

---

## About the Project

CleanTown is a **gamified, community-driven environmental mobile app** that helps users report illegal dumping, litter and waste hotspots in their neighbourhoods.

Users capture a **photo, GPS location and optional audio note**, and submit a “mission” to the system.  
A **Gemini-powered AI service** analyses each report to:

- identify the **waste category** (household, construction, hazardous)  
- estimate **severity & volume**  
- highlight potential **environmental risk**  
- suggest **cleanup actions**

This data powers:

- a **live dumping map**  
- a **cleanup scheduler**  
- **leaderboards & XP progression**  
- **gamified analytics**

---

### Reporting Flow

![Report Litter Screen](./Mockup/CleanTown-ReportLitter.jpg)

### Leaderboard & Gamification

![Leaderboard Screen](./Mockup/CleanTown-Leaderboard.jpg)

---

## MVG Features

- **AI Waste Classification** – Gemini analyses image + context to classify dumping type.  
- **GPS Auto-tagging** – Location auto-attached for every mission.  
- **Photo + Audio Notes** – Rich context for municipal teams and recyclers.  
- **Location Heatmaps** – Visual hotspots for recurring dumping zones.  
- **XP System & Badges** – Players earn points and unlock eco-levels.  
- **Realtime Firestore Sync** – Multi-device, multi-user data in sync.  
- **Cleanup Scheduler** – Plan and track community cleanups.  
- **Offline Draft Reports** – Save missions and sync when back online.  

<p align="center">
  <img src="./assets/cleantown-confetti-celebration.png" alt="Confetti Celebration" height="130" />
  <img src="./assets/cleantown-sad-littter.png" alt="Sad Litter" height="130" />
  <img src="./assets/mascot_celebrate.png" alt="Celebrating Mascot" height="130" />
</p>

---

## Gamification & Eco-Heroes

<p align="center">
  <img src="./assets/Beginner-badge.png" height="80" />
  <img src="./assets/Bronze-badge.png" height="80" />
  <img src="./assets/Silver-badge.png" height="80" />
  <img src="./assets/Gold-badge.png" height="80" />
  <img src="./assets/Diamond.png" height="80" />
</p>

<p align="center">
  <img src="./assets/cleaning-hero.png" height="130" />
  <img src="./assets/Cleaning-hero-flying-t-mission.png" height="130" />
  <img src="./assets/cleantown-hero-shield.png" height="130" />
</p>

---

## Built With

### Core Framework & Runtime
- **React** `^19.1.0`  
- **React Native** `^0.81.5`  
- **Expo SDK** `~54.0.0`  
- **TypeScript** `~5.9.2`  
- **Node.js** `>= 18.x`

### Backend, Database & AI
- **Firebase** (Auth, Firestore, Storage)  
- **Google Gemini AI** via `@google/generative-ai`  

### Navigation & State
- `@react-navigation/native`  
- `@react-navigation/bottom-tabs`  
- `@react-navigation/native-stack`  
- `@react-native-async-storage/async-storage`  

### Native & Hardware (Expo APIs)
- `expo-camera` – report photos  
- `expo-image-picker` – gallery uploads  
- `expo-location` – GPS coordinates  
- `expo-av` – audio notes  
- `react-native-maps` – interactive map view  

### UI, Styling & UX
- `@expo-google-fonts/poppins`  
- `@expo-google-fonts/cherry-bomb-one`  
- `@expo/vector-icons`  
- `react-native-reanimated`  
- `react-native-linear-gradient`, `react-native-radial-gradient`  
- `react-native-safe-area-context`  

---

## Firestore Data Model & Security Rules

CleanTown uses Firestore collections for:

- `users` — profiles, points, badges  
- `reports` — illegal dumping reports & AI analysis  
- `cleanupEvents` — community cleanups  
- `pointsTransactions` — XP / rewards log  

### Example Rules

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthed() { return request.auth != null; }
    function isOwner(uid) { return isAuthed() && request.auth.uid == uid; }

    match /users/{userId} {
      allow read: if true;
      allow create, update: if isOwner(userId);
    }

    match /reports/{id} {
      allow read: if true;
      allow create: if isAuthed() &&
        (request.resource.data.userId == request.auth.uid ||
         request.resource.data.uid == request.auth.uid);

      allow update: if isAuthed() && (
        ((resource.data.userId == request.auth.uid ||
          resource.data.uid == request.auth.uid) &&
          request.resource.data.diff(resource.data).changedKeys()
            .hasOnly(['status','description','category','photoUrl','audioUrl',
                      'updatedAt','hasPhoto','hasAudio','note','type','aiAnalysis']))
        ||
        request.resource.data.diff(resource.data).changedKeys()
          .hasOnly(['confirmations','updatedAt'])
      );

      allow delete: if isOwner(resource.data.userId) || isOwner(resource.data.uid);
    }
  }
}

---

# Prerequisites

To run CleanTown locally, you’ll need both the tooling and cloud access configured ahead of time.

## Software
- Node.js 18+
- Git
- Expo CLI
- Android Studio or Xcode
- Expo Go (mobile)

## Cloud Services & API Keys
- Firebase project (Auth, Firestore, Storage enabled)
- Google Gemini API key
- Create a `.env` file in the project root and store:

```
EXPO_PUBLIC_FIREBASE_API_KEY=<your firebase api key>
EXPO_PUBLIC_GEMINI_API_KEY=<your gemini api key>
```

---

# Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_GH_USER/CleanTown.git
   cd CleanTown
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the Expo development server**
   ```bash
   npm run start
   ```

---

<p align="center">
  <img src="./assets/Broom.png" alt="Broom Icon" height="120" />
  <img src="./assets/trash_bag.png" alt="Trash Bag Icon" height="120" />
  <img src="./assets/Recycle.png" alt="Recycle Icon" height="120" />
</p>

---

# Project Features

- AI-powered trash detection and report enrichment
- Realtime Firestore syncing across devices
- Audio notes alongside photo + GPS captures
- XP, leveling, and badges for missions
- Cleanup scheduler and live dumping map
- Gamified mission feed with offline-safe drafts
- Add Dashboard, link municipalities to local Reports

<p align="center">
  <img src="./assets/leaderboard-icon.png" alt="Leaderboard Icon" height="90" />
  <img src="./assets/hazard.png" alt="Hazard Icon" height="90" />
  <img src="./assets/report-icon.png" alt="Report Icon" height="90" />
</p>

---

# Development Process

Document your build journey here (architecture decisions, design sprints, or lessons learned). Keeping this section updated helps collaborators understand context quickly.

---

# Final Outcome

CleanTown transforms environmental reporting into a gamified experience powered by AI.

<p align="center">
  <img src="./assets/celebrate.png" alt="Celebrate Icon" height="140" />
</p>

---

# Video Demo

<p align="center">
  <a href="https://drive.google.com/file/d/1WMe61b3ln4BBaojFvhz2A130MwoaDMvs/view" target="_blank">
    <img src="./Mockup/Video_Walkthrough.png" alt="CleanTown Video Walkthrough" width="70%" />
  </a>
</p>

---

# Conclusion

CleanTown blends civic responsibility with modern UX and gamified AI systems to foster cleaner communities.

---

# Footer

Built with dedication to cleaner cities.

---

# References

- https://codepen.io/LukyVj/pen/oNPJrdy
- https://genially.com/features/gamification/
