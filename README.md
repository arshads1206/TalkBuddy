# Talk Buddy - Hybrid Edition
By **Arshad**

<!-- BADGES:START -->
[![ai](https://img.shields.io/badge/-ai-ff6f00?style=flat-square)](https://github.com/topics/ai) [![conversation-practice](https://img.shields.io/badge/-conversation--practice-blue?style=flat-square)](https://github.com/topics/conversation-practice) [![cross-platform](https://img.shields.io/badge/-cross--platform-blue?style=flat-square)](https://github.com/topics/cross-platform) [![electron](https://img.shields.io/badge/-electron-47848f?style=flat-square)](https://github.com/topics/electron) [![fastapi](https://img.shields.io/badge/-fastapi-009688?style=flat-square)](https://github.com/topics/fastapi) [![browser](https://img.shields.io/badge/-browser--support-brightgreen?style=flat-square)](https://github.com/topics/browser) [![typescript](https://img.shields.io/badge/-typescript-3178c6?style=flat-square)](https://github.com/topics/typescript)
<!-- BADGES:END -->

Practice real-world conversations with an AI partner — job interviews, client presentations, difficult meetings, delivering bad news — in a safe, private space where it's OK to stumble. Talk Buddy listens to you, responds out loud, and keeps a transcript you can review afterward.

## 🚀 The Hybrid Evolution
*Note: This project originated as a fork of [michael-borck/talk-buddy](https://github.com/michael-borck/talk-buddy) (an Electron-only desktop app). It has been fundamentally re-architected by Arshad to support a true **Hybrid Application Model**.*

### What's New?
The original application strictly relied on Electron's IPC (`window.electronAPI`) for all system access, rendering it useless in a standard web browser (like Chrome, Edge, or CodeSandbox).

**We completely solved this by introducing:**
1. **The Platform Abstraction Layer**: A new layer of services (`ChatService.ts`, `PreferenceService.ts`, etc.) that dynamically detects the running environment. If running in Electron, it uses native IPC. If running in a browser, it gracefully falls back to REST `fetch()`.
2. **The FastAPI Bridge**: A robust Python backend (`main.py`) that acts as a proxy for the browser, bypassing CORS restrictions, managing connection pooling (`httpx.AsyncClient`), and safely handling Base64 audio encodings to prevent binary corruption over HTTP.
3. **The Node DB Helper**: To preserve the complex SQLite logic without reinventing the wheel in Python, the FastAPI backend spawns a tiny Node.js subprocess (`run_db_op.js`) to execute database operations natively and pipe the results back to the browser.
4. **Resilient Embedded TTS**: Fixed severe `UnicodeEncodeError` crashes in the embedded Python `piper.exe` subprocess on Windows by injecting strict `UTF-8` encoding pipelines.

## What it does

You pick a scenario (or write your own), press the mic, and have a spoken conversation with the AI. When you're done you get a transcript and optional analysis of how it went.

```
You speak → Speech recognition → AI thinks → Voice speaks back
           (Listening)            (AI Brain)   (Voice)
```

Everything runs on your computer. Your recordings and transcripts never leave your machine. You bring your own AI key (Anthropic, OpenAI, Gemini, Groq, or a local Ollama model) and choose how speech is handled — either a built-in offline engine or a cloud server.

## Features

- **True Hybrid Environment** — Run securely as an Electron Desktop app or directly in your web browser.
- **Hold-to-speak conversations** with spacebar or button — the AI responds out loud in real time
- **Scenario library** — pre-built scenarios for interviews, presentations, HR meetings, and more; create your own
- **Session history** with transcripts and optional AI analysis
- **Multiple AI providers** — Anthropic (Claude), OpenAI (GPT), Google (Gemini), Groq, Ollama, or any custom endpoint
- **Built-in offline speech** — works without internet using the embedded Piper + Whisper engine
- **Privacy-first** — all data stored locally in SQLite; bring your own keys; nothing phoned home

## Quick start

```bash
git clone https://github.com/arshads1206/TalkBuddy.git
cd TalkBuddy
npm install
```

### Running the App

**For Desktop (Electron):**
```bash
npm run dev
```

**For Browser (FastAPI Bridge):**
1. Start the Vite Dev Server: `npm run dev`
2. In a separate terminal, start the FastAPI bridge:
```bash
cd fastapi-backend
python -m venv venv
venv\Scripts\activate  # On Windows
pip install -r requirements.txt
python main.py
```
3. Open `http://localhost:3307` in your browser.

## How the Hybrid Architecture Works

```
TalkBuddy/
├── src/
│   ├── main/                  # Electron main process
│   └── renderer/              # React application (Vite-bundled)
│       └── platform/          # **NEW**: Platform Abstraction Layer (switches between IPC & REST)
├── fastapi-backend/           # **NEW**: Python bridge for Browser mode
│   ├── main.py                # FastAPI proxy server (handles CORS, Base64 Audio, Networking)
│   └── run_db_op.js           # Node helper to execute SQLite from Python
├── embedded-server/           # Optional offline speech engine (Python + Piper + Whisper)
│   └── server.py              # Flask server with OpenAI-compatible endpoints
```

### The Dual Pipeline

- **In Electron**: React → `src/renderer/platform/` → `window.electronAPI` → `src/main/index.js` → SQLite
- **In Browser**: React → `src/renderer/platform/` → `FastAPI Proxy` → `run_db_op.js` → SQLite

## Configuration
All settings are in the app's Settings page (the wrench icon in the sidebar). You can configure your **Listening** engines, **Voice** engines, and your **AI Brain** (OpenAI, Gemini, Ollama, etc.).

## Data storage
All data stays on your computer in a single SQLite file:
- macOS: `~/Library/Application Support/Talk Buddy/talkbuddy.db`
- Windows: `%APPDATA%/Talk Buddy/talkbuddy.db`

Audio recordings are **not stored** — only the text transcripts survive.

## Acknowledgments
- **Original Foundation**: [Michael Borck](https://github.com/michael-borck/talk-buddy) (Created the original Electron desktop application structure and Studio Calm design).
- **Hybrid Re-Architecture**: Arshad (Introduced FastAPI bridging, Platform Abstraction Layer, Browser compatibility, and TTS unicode fixes).
- [Electron](https://www.electronjs.org/) & [React](https://react.dev/)
- [Piper](https://github.com/rhasspy/piper) — offline voice synthesis (embedded server)

