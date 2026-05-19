# Interactive Character Build AI

Interactive Character Build AI is a gamified real-world performance target builder. It uses an Aoi Hinami-style diagnostic flow to convert vague goals into hierarchical targets, daily routines, quests, currency rewards, alarms, and countdown timers.

Live frontend:

```text
https://rachith183.github.io/dual-persona-simulator/
```

Repository:

```text
https://github.com/Rachith183/dual-persona-simulator
```

## 1. Current Status

1. The frontend is hosted on GitHub Pages.
2. The Firebase login is complete, but Firebase Functions and Secret Manager are blocked because the Firebase project is on the free Spark plan.
3. The app now supports a no-paid browser mode instead of requiring Firebase Functions.
4. The old simulator title and narrative framing were removed.
5. The active product title is now `Interactive Character Build AI`.
6. Pointer-tracking and hitbox-driven reactions were removed.
7. Character posture now changes only through `rig_control.expression_flag` from the structured response payload.

## 2. Project Structure

```text
.
├── backend/
│   └── server.js
├── frontend/
│   ├── app.js
│   ├── config.js
│   ├── index.html
│   └── style.css
├── layers/
│   ├── baground.png
│   ├── bang.png
│   ├── base.png
│   ├── faceless.png
│   ├── left eye.png
│   ├── left hair back.png
│   ├── left strand hair.png
│   ├── mouth.png
│   ├── right eye.png
│   ├── right hair back.png
│   └── right strand hair.png
├── scripts/
│   └── prepare-pages.mjs
├── .github/
│   └── workflows/
│       └── pages.yml
├── firebase.json
├── package.json
└── README.md
```

## 3. Main Architecture

The app has two operating paths:

1. GitHub Pages static frontend
2. Optional Node/Firebase backend

The recommended free path is GitHub Pages plus browser Gemini mode. The optional backend remains in the repo for later if Blaze, Cloud Run, Render, Railway, or another backend host becomes available.

## 4. Frontend Features

The frontend supports:

1. Response-driven 2.5D character rig
2. Native browser Text-to-Speech
3. Native browser Speech-to-Text when supported
4. Four-stage diagnostic onboarding
5. Hierarchical goal panels
6. Active quest cards
7. SC rewards shop
8. Time blocks
9. Alarm registration using browser timers
10. Countdown timers that award XP and SC when complete
11. Offline diagnostic fallback when no API key or backend is available

## 5. Diagnostic Stages

The app tracks four stages:

```text
STAGE_1_DESIRE
STAGE_2_CONSTRAINTS
STAGE_3_RESOURCES
STAGE_4_ACTIVE
```

Stage behavior:

1. `STAGE_1_DESIRE`: asks for the user’s primary long-term target.
2. `STAGE_2_CONSTRAINTS`: asks for fixed duties, friction, school, work, sleep, commute, and restrictions.
3. `STAGE_3_RESOURCES`: asks for exact available hour blocks.
4. `STAGE_4_ACTIVE`: generates the execution blueprint, quests, rewards, alarms, and timers.

## 6. Structured Payload Contract

Every AI response should match this structure:

```json
{
  "character_dialogue": "string",
  "internal_thinking_state": "string",
  "session_stage": "STAGE_1_DESIRE",
  "rig_control": {
    "expression_flag": "state-analytical"
  },
  "generated_blueprint": null
}
```

When `session_stage` becomes `STAGE_4_ACTIVE`, `generated_blueprint` becomes:

```json
{
  "system_active": true,
  "goals_hierarchy": {
    "long_term": ["string"],
    "mid_term": ["string"],
    "daily_routines": ["string"]
  },
  "time_blocks": [
    {
      "time_window": "string",
      "label": "string",
      "type": "string",
      "hardware_alarm": {
        "enabled": true,
        "trigger_time": "string",
        "label": "string"
      },
      "hardware_timer": {
        "enabled": true,
        "duration_string": "25m",
        "label": "string"
      }
    }
  ],
  "active_quests": [
    {
      "quest_id": "string",
      "title": "string",
      "reward_xp": 25,
      "reward_currency": 15
    }
  ],
  "tiered_rewards_shop": [
    {
      "item_id": "string",
      "title": "string",
      "cost": 20
    }
  ]
}
```

## 7. Character Rig States

The frontend accepts these expression flags:

```text
state-analytical
state-smirk
state-mask-adjustment
state-melancholy
```

State behavior:

1. `state-analytical`: base processing profile with breathing animation.
2. `state-smirk`: slight upward posture shift for detected discipline leaks or tactical mistakes.
3. `state-mask-adjustment`: angular correction posture for strict rule changes or system lock-in.
4. `state-melancholy`: lowered posture and reduced saturation for critical instability.

## 8. No-Paid Gemini Mode

Firebase Functions and Firebase Secret Manager require the Blaze plan. Since the project is staying free, use browser Gemini mode.

Steps:

1. Open the hosted frontend:

```text
https://rachith183.github.io/dual-persona-simulator/
```

2. Find the `Free Gemini Browser Mode` panel.
3. Paste a Gemini API key into the input.
4. Click `Save Key`.
5. The key is saved only in that browser’s `localStorage`.
6. The key is not committed into GitHub.
7. If the key fails or is missing, offline diagnostic mode runs automatically.

Important security note:

Browser API keys are visible to the browser. Restrict the key in Google AI Studio or Google Cloud API key settings to the GitHub Pages referrer:

```text
https://rachith183.github.io/dual-persona-simulator/*
```

## 9. Offline Mode

Offline mode is built in so the app remains usable without paid hosting or a working API key.

Offline mode can:

1. Ask staged diagnostic questions
2. Progress through the onboarding flow
3. Generate a local execution blueprint
4. Render goals
5. Render quests
6. Render rewards
7. Start countdown timers
8. Award XP and SC
9. Trigger TTS
10. Update character rig states

Offline mode is less intelligent than Gemini, but it keeps the interface functional.

## 10. Local Development

Install dependencies:

```bash
npm install
```

Run the local backend and frontend:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

If port `3000` is already busy, run:

```powershell
$env:PORT="3001"
npm start
```

Then open:

```text
http://localhost:3001
```

## 11. Optional Local Backend Gemini Key

Set a Gemini API key before starting the backend:

```bash
GEMINI_API_KEY=your_key_here npm start
```

On Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_key_here"
npm start
```

The backend uses:

```text
gemini-1.5-pro
```

The browser free mode uses:

```text
gemini-2.5-flash
```

## 12. GitHub Pages Deployment

Build the static artifact:

```bash
npm run prepare:pages
```

Output:

```text
dist/github-pages
```

Deployment is automated through:

```text
.github/workflows/pages.yml
```

Push to `main` and GitHub Actions publishes the frontend.

## 13. Firebase Notes

Firebase project:

```text
cleancredit-live
```

Firebase login was completed, but this command failed:

```powershell
firebase functions:secrets:set GEMINI_API_KEY --project cleancredit-live
```

Reason:

```text
Firebase Functions secrets require the Blaze pay-as-you-go plan.
```

Because the project is on the Spark plan, do not use Firebase Functions for this app right now. Use GitHub Pages plus browser Gemini mode or offline mode.

## 14. Animation Verification

The character rig was checked with headless Chrome.

Verified:

1. Character layers render.
2. HUD renders.
3. Goal/reward dashboard renders.
4. Breathing animation is active.
5. Expression classes are present.
6. Old pointer tracking was removed.
7. Rig state is now controlled only by response data.

Latest local render check:

```text
dist/character-build-check.png
```

## 15. Safe Development Rules

1. Do not commit API keys.
2. Do not commit `.env`.
3. Do not hardcode paid Firebase secret usage unless Blaze is available.
4. Keep `frontend/config.js` empty by default.
5. Use browser `localStorage` for the temporary free-mode key.
6. Keep all UI labels aligned to `Interactive Character Build AI`.
7. Do not reintroduce old narrative, novel, simulator, or twin-mask naming.

## 16. Common Commands

Check backend syntax:

```bash
node --check backend/server.js
```

Check frontend syntax:

```bash
node --check frontend/app.js
```

Build static Pages artifact:

```bash
npm run prepare:pages
```

Commit and push:

```bash
git add .
git commit -m "Update Interactive Character Build AI"
git push
```
