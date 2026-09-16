# Multi-LLM Thinking View

A shared chat UI that sends one prompt to Claude, ChatGPT, and Gemini in sequence — each model sees the answers already given by the ones before it — and shows a short "thinking" note before each answer.

## Run it

Open `index.html` in a browser. No build step, no server required.

## Real API keys

Paste each key into the input under that model's column. Keys are saved only in **this browser's localStorage** — never sent anywhere except that vendor's own API.

| Model | Direct browser call | Get a key |
|---|---|---|
| Claude | ✅ works (Anthropic allows it via a browser-access header) | https://console.anthropic.com/settings/keys |
| Gemini | ✅ works | https://aistudio.google.com/apikey |
| ChatGPT | ❌ OpenAI blocks direct browser calls (CORS) | https://platform.openai.com/api-keys |

### Getting ChatGPT working

OpenAI's API doesn't send CORS headers for browser-origin requests, so the ChatGPT panel will show a CORS error until you add a proxy:

1. Point `OPENAI_PROXY_URL` in `app.js` at a backend endpoint you control (e.g. the n8n webhook from the LLM Router workflow).
2. That backend takes the prompt, calls `api.openai.com/v1/chat/completions` server-side with your key, and returns `{ choices: [{ message: { content: "..." } }] }` (or adapt the response parsing in `callOpenAI()` to match your proxy's shape).

## Security note

This page keeps API keys in the browser and calls vendor APIs directly — fine for local/personal use on your own machine. **Do not deploy this publicly** (e.g. on a shared website) with real keys entered, since anyone using the page could extract them from network requests or devtools. For a public deployment, route every model through your own backend instead.

## Model IDs used

Edit `MODEL_IDS` in `app.js` to change which model each panel calls:
- Claude: `claude-3-5-sonnet-20241022`
- OpenAI: `gpt-4o-mini`
- Gemini: `gemini-2.0-flash`
