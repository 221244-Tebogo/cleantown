<!-- Banner -->
<p align="center">
  <img src="./Mockup/cleantown_banner.png" alt="CleanTown Banner" />
</p>

<h2 align="center">CleanTown — Smarter Waste Management for Your City</h2>
<p align="center">React Native (Expo) · TypeScript · Firebase · Google Auth · Camera · Location · Civic UX</p>

<!-- Badges -->
<p align="center">
  <a href="https://github.com/YOUR_GH_USER/cleantown/fork" target="_blank">
    <img src="https://img.shields.io/github/forks/YOUR_GH_USER/cleantown" alt="Forks"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/cleantown/stargazers" target="_blank">
    <img src="https://img.shields.io/github/stars/YOUR_GH_USER/cleantown" alt="Stars"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/cleantown/commits/main" target="_blank">
    <img src="https://img.shields.io/github/commit-activity/m/YOUR_GH_USER/cleantown" alt="Commit Activity"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/cleantown/issues" target="_blank">
    <img src="https://img.shields.io/github/issues/YOUR_GH_USER/cleantown" alt="Issues"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/cleantown/pulls" target="_blank">
    <img src="https://img.shields.io/github/issues-pr/YOUR_GH_USER/cleantown" alt="PRs"/>
  </a>
  <a href="https://github.com/YOUR_GH_USER/cleantown/blob/main/LICENSE" target="_blank">
    <img src="https://img.shields.io/github/license/YOUR_GH_USER/cleantown?color=f85149" alt="License">
  </a>
</p>

<!-- Tech Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Expo-000000?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React%20Native-61DAFB?logo=react&logoColor=000" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=000" />
  <img src="https://img.shields.io/badge/Auth-Google%20Sign--In-DB4437" />
  <img src="https://img.shields.io/badge/Camera-expo--camera-0B284A" />
  <img src="https://img.shields.io/badge/Location-expo--location-0B284A" />
  <img src="https://img.shields.io/badge/Maps-react--native--maps-0B284A" />
  <img src="https://img.shields.io/badge/Storage-AsyncStorage-0B284A" />
</p>

---

## Table of Contents

1. [About](#about)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Tech Stack](#tech-stack)
5. [Project Architecture](#project-architecture)
6. [Installation](#installation)
7. [Environment Variables](#environment-variables)
8. [Run](#run)
9. [Project Structure](#project-structure)
10. [Credits](#credits)

---

## About

CleanTown is a React Native app for **citizen-led reporting of litter, illegal dumping, and overflowing bins**. Reports are tagged with GPS coordinates and synced to Firebase for city authorities to act on.

- **Google Authentication** — Secure login via Firebase + Expo Auth Session  
- **Civic Reporting** — Camera + location-based submissions  
- **Realtime Firestore** — Keep reports synced across users and devices  
- **Local Storage** — Draft reports saved offline  
- **Map Visualization** — Track submitted reports and city-wide hotspots  

---

## Features

| Feature | Description |
|---------|-------------|
| Home | Quick access to report, view past submissions, and see map hotspots |
| Google Auth | Secure login, fast resume, and session sync |
| Camera | Snap photos of litter, hazards, or illegal dumping |
| Location | Automatic GPS tagging of reports |
| Map | Interactive map view of submissions and hotspots |

---

## Screenshots

<p align="center">
  <img src="./Mockups/cover.png" alt="CleanTown — Home · Report · Map" width="600"/>
</p>

---

## Tech Stack

- **React Native** + **Expo**  
- **TypeScript**  
- **Firebase** (Auth + Firestore)  
- **Expo Modules:** Camera, Location, Maps, AsyncStorage  
- **Google OAuth** for authentication  

---

## Project Architecture
