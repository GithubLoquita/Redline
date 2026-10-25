# REDLINE: Electric Racing Experience

**Developed by:** ANIX Software Technology  
**Visual Identity:** Signature Red & Black Electric Racing (#FF2020 / #070707)

---

## 1. Project Overview

**REDLINE** is a futuristic, browser-based 3D car racing game inspired by modern electric sports cars, Tesla-style vehicle design, and professional racing simulators. Built entirely with **Three.js** and **WebGL**, REDLINE delivers high-speed arcade racing directly in the browser across desktop and mobile devices without requiring third-party plugins, paid APIs, or user registration.

### Key Highlights
- **100% Procedural 3D Models:** Tesla-inspired electric hypercars (Apex Hyperion, CyberPulse GT, Vortex Plaid) constructed with multi-part geometry, rotating alloy wheels, stationary brake calipers, glass panoramic canopy, aerodynamic diffusers, and glowing LED headlight/taillight systems.
- **Dynamic 3D Metropolis & Highway:** Infinite procedural multi-lane expressway with animated road markings, guardrails with red/white reflectors, illuminated overhead gantries, and a procedural neon skyscraper skyline.
- **Autonomous Traffic Simulation:** AI-driven sedans, cyber SUVs, delivery trucks, and sports coupes with lane-changing logic, following distances, and realistic collision boundaries.
- **Arcade Racing Physics:** Responsive steering, speed-dependent handling, chassis roll and pitch dynamics, drift/handbrake mechanics, aerodynamic drag, and nitro boost with camera FOV distortion and exhaust flame cones.
- **Near-Miss Scoring System:** Squeezing past traffic at speeds exceeding 110 km/h triggers real-time near-miss alerts, builds combo multipliers up to 4.0x, and instantly refills Nitro energy reserves.
- **Procedural Web Audio Engine:** Zero external 404 dependencies! Fully synthesized electric motor whine linked to vehicle RPM, bandpass-filtered tire squeal during high-speed drifts, nitro whoosh, crash impact thuds, and UI chimes.
- **Comprehensive Game Modes:**
  1. *Endless Traffic:* Survive and rack up points through dense highway traffic.
  2. *Time Attack:* 60-second countdown race against the clock.
  3. *Checkpoint Rush:* Clear highway laser gates to earn bonus time.
  4. *Free Drive:* Relaxing, damage-free high-speed cruising across the cyber city.
- **Multi-Platform Controls:** Full keyboard support, Gamepad API auto-detection (Xbox/PlayStation/generic controllers), and responsive on-screen mobile touch pedals.

---

## 2. Technology Stack

- **Graphics & 3D:** Three.js (r160+), WebGL2 with software WebGL fallback guards
- **Frontend & UI:** React 19, Tailwind CSS v4, Lucide Icons, Google Fonts (Orbitron, Inter)
- **Audio:** Web Audio API (procedural synthesis using oscillators, gain nodes, and biquad filters)
- **Persistence:** LocalStorage for high scores, custom vehicle colors, and user settings
- **Build Tool:** Vite

---

## 3. Project Structure

```
redline-racing/
├── index.html                  # HTML entry point with Orbitron & Inter fonts
├── package.json                # Project dependencies and build scripts
├── vite.config.ts              # Vite configuration
├── README.md                   # Complete documentation
├── tests/
│   └── game-logic.test.js      # Unit tests for physics, collision & score math
└── src/
    ├── main.tsx                # React application bootstrap
    ├── App.tsx                 # Core game state coordinator and modal router
    ├── types.ts                # TypeScript interfaces and game types
    ├── index.css               # Tailwind CSS and theme design system
    ├── audio/
    │   └── soundEngine.ts      # Web Audio procedural sound synthesizer
    ├── game/
    │   ├── carBuilder.ts       # Procedural 3D hero cars & wheel kinematics
    │   ├── trafficBuilder.ts   # 3D traffic vehicles (sedans, SUVs, trucks)
    │   ├── cityEnvironment.ts  # Highway chunks, neon gantries, skyscrapers
    │   ├── physicsEngine.ts    # Vehicle kinematics, traffic AI, collisions
    │   └── racingScene.ts      # Three.js scene, lighting rig & camera dynamics
    ├── components/
    │   ├── MainMenu.tsx        # Showroom landing screen
    │   ├── GarageModal.tsx     # Car selector & custom paint swatches
    │   ├── GameModeModal.tsx   # Mode selection modal
    │   ├── SettingsModal.tsx   # Graphics, audio, physics & accessibility
    │   ├── HowToPlayModal.tsx  # Controls briefing & pro racing tips
    │   ├── RacingHUD.tsx       # Digital speedometer, RPM, nitro & lane radar
    │   ├── MobileControls.tsx  # Touch steering paddles & accelerator pedals
    │   ├── PauseModal.tsx      # In-race pause menu
    │   └── GameOverModal.tsx   # Run telemetry breakdown & high score badge
    └── utils/
        ├── inputManager.ts     # Keyboard, Gamepad API & mobile touch input
        └── storage.ts          # LocalStorage persistence manager
```

---

## 4. Local Installation & Development

### Prerequisites
- Node.js (version 18 or newer)
- npm or yarn

### Installation
```bash
# Clone the repository and navigate to the project directory
cd redline-racing

# Install dependencies
npm install
```

### Development Server
```bash
# Start local development server on port 3000
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

### Running Unit Tests
```bash
# Run game logic unit tests
node tests/game-logic.test.js
```

---

## 5. Production Build & Deployment

### Build Command
```bash
# Compile and optimize for production
npm run build
```
This generates the optimized static bundle in the `dist/` directory.

### Deploying to Static Hosting

#### Vercel
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Set the build command to `npm run build` and output directory to `dist`.

#### Netlify
1. Connect your Git repository in the Netlify dashboard.
2. Build command: `npm run build`
3. Publish directory: `dist`

---

## 6. Controls Guide

| Action | Desktop Keyboard | Gamepad | Mobile Touch |
| :--- | :--- | :--- | :--- |
| **Accelerate** | `W` or `Up Arrow` | `RT` / `R2` / `A Button` | Gas Pedal (Right) |
| **Brake / Reverse** | `S` or `Down Arrow` | `LT` / `L2` / `B Button` | Brake Pedal (Right) |
| **Steer Left** | `A` or `Left Arrow` | Left Stick / D-Pad Left | Left Paddle |
| **Steer Right** | `D` or `Right Arrow` | Left Stick / D-Pad Right | Right Paddle |
| **Nitro Boost** | `Shift` or `N` | `X` / `LB` / `L1` | Nitro Button (Right) |
| **Handbrake / Drift** | `Space` | `RB` / `R1` | Drift Button (Left) |
| **Cycle Camera** | `C` | `Y Button` | Camera Icon (HUD) |
| **Pause / Resume** | `Escape` | `Start / Options` | Pause Icon (HUD) |
| **Quick Restart** | `R` | - | Restart Button |

---

## 7. License & Credits

- **Software Technology:** ANIX Software Technology
- **3D Graphics Engine:** Three.js (MIT License)
- **Fonts:** Orbitron & Inter (Google Fonts, Open Font License)
