# The S Tier Move: Dual Persona Simulator

A gamified VTuber-style 2.5D psychological simulation interface with layered character parallax, interactive hitboxes, structured dialogue hydration, academic document scanning, and a strict JSON Gemini backend contract.

## Project Structure

```text
.
├── backend/
│   └── server.js
├── frontend/
│   ├── app.js
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
├── package.json
└── README.md
```

## Layer Mapping

The frontend uses the existing files in `layers/` directly:

| Rig Layer | Asset Path |
| --- | --- |
| `.layer-bg` | `../layers/baground.png` |
| `.layer-left-hair-back` | `../layers/left hair back.png` |
| `.layer-right-hair-back` | `../layers/right hair back.png` |
| `.layer-body` | `../layers/base.png` |
| `.layer-face-base` | `../layers/faceless.png` |
| `.layer-mouth` | `../layers/mouth.png` |
| `.layer-left-eye` | `../layers/left eye.png` |
| `.layer-right-eye` | `../layers/right eye.png` |
| `.layer-left-strand` | `../layers/left strand hair.png` |
| `.layer-right-strand` | `../layers/right strand hair.png` |
| `.layer-bangs` | `../layers/bang.png` |

## Local Development

Install dependencies:

```bash
npm install
```

Run the backend and static frontend server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

## Gemini Configuration

Set a Gemini API key before starting the backend:

```bash
GEMINI_API_KEY=your_key_here npm start
```

On Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_key_here"
npm start
```

The backend uses `gemini-1.5-pro` and enforces a structured JSON response with:

- `character_dialogue`
- `internal_thinking_state`
- `rig_control`
- `economy_update`
- `quiz_matrix`

## Hosting Notes

GitHub Pages can host the static frontend only. The Gemini API key and `/api/interact` plus `/api/scan` routes need a server runtime.

Recommended hosting options:

- Firebase Hosting for `frontend/` plus Firebase Cloud Functions or Cloud Run for `backend/server.js`.
- GitHub Pages for `frontend/` plus Firebase Cloud Functions, Cloud Run, Render, Railway, or another Node runtime for the backend.

Firebase is enough for the full product when it includes Hosting plus Functions or Cloud Run. Firebase Hosting by itself is not enough for the Gemini backend because browser-side API keys would be exposed.
