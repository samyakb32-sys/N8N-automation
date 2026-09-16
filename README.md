# Multi-LLM Thinking View

A shared chat UI that sends one prompt to Claude, ChatGPT, and Gemini side by side, showing a "thinking" step before each answer.

## Run it

Just open `index.html` in a browser. No build step.

## Current state

Ships with **mock responses** — no API keys required, safe to open and demo immediately.

## Wiring real models

Browser calls to Claude/OpenAI/Gemini APIs directly are blocked by CORS and expose your API key to anyone viewing page source. Use a small backend proxy (e.g. the n8n workflow you already built) instead:

1. Point `app.js`'s `runModel()` at your n8n webhook URL instead of `mockRespond()`.
2. n8n receives the prompt, calls each LLM's API with server-side stored keys, returns the three responses.
3. Replace the `fetch` call's response handling to stream or display the returned text per model.

This keeps API keys off the client and reuses the n8n router you already built.
