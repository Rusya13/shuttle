# Minigame Requirements & Ideas

## General Constraints
- **Theme:** Space Shuttle / Space Exploration.
- **Target Session Duration:** 10-15 minutes.
- **Engagement Goal:** High replayability, "easy to learn, hard to master."
- **Playable Area:** 320x320 pixels (Strict limit).
- **Platform:** Web (HTML/Canvas/JS).

## Game Concepts (Brainstorming)

### 1. Shuttle Ascent (Vertical Dodger)
**Concept:** The shuttle is launching into orbit. The player must dodge falling space debris, satellites, and birds/planes (at lower altitudes) while collecting fuel canisters to keep the engines running.
**Mechanics:**
- **Controls:** Left/Right arrow keys or mouse drag.
- **Progression:** Speed increases with altitude.
- **Win Condition:** Reach "Stable Orbit" (score threshold) or Infinite High Score mode.

### 2. Orbital Docker (Precision Physics)
**Concept:** You are in orbit and must dock with the International Space Station (ISS). The station is rotating, and you have limited fuel/monopropellant.
**Mechanics:**
- **Controls:** Thrusters (WASD/Arrows) for movement and rotation.
- **Challenge:** Realistic(ish) inertia. If you move too fast, you crash. If you run out of fuel, you drift forever.
- **Win Condition:** Successful soft dock within the time limit.

### 3. Cargo Bay Tetris (Puzzle)
**Concept:** You are the payload specialist. You must fit odd-shaped satellite components and supplies into the Shuttle's cargo bay before the launch window closes.
**Mechanics:**
- **Controls:** Drag and drop, rotate pieces.
- **Challenge:** The pieces come out on a conveyor belt. If the bay overflows or isn't balanced, the launch fails.
- **Win Condition:** Pack a certain efficiency % within the time limit.
