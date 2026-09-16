// Multi-LLM Thinking View — real API mode.
//
// Calls Claude, Gemini directly from the browser (their APIs support it).
// OpenAI's API does not send CORS headers for browser calls, so that panel
// falls back to mock unless you point OPENAI_PROXY_URL at your own proxy
// (e.g. the n8n webhook you already built) that forwards to OpenAI server-side.
//
// Keys are stored only in this browser's localStorage and sent only to the
// respective vendor's API. Do not deploy this page publicly with real keys —
// anyone viewing it could see your keys in network requests / devtools.

const models = ["claude", "gpt", "gemini"];
const labels = { claude: "Claude", gpt: "ChatGPT", gemini: "Gemini" };

const MODEL_IDS = {
  claude: "claude-3-5-sonnet-20241022",
  gpt: "gpt-4o-mini",
  gemini: "gemini-2.0-flash"
};

// Set this to your own backend/n8n webhook that proxies to OpenAI, to enable
// the ChatGPT panel despite OpenAI blocking direct browser CORS.
const OPENAI_PROXY_URL = "";

function getKey(model) {
  return localStorage.getItem(`llm_key_${model}`) || "";
}
function setKey(model, value) {
  localStorage.setItem(`llm_key_${model}`, value);
}

function buildContext(prompt, shared) {
  const others = Object.keys(shared);
  if (others.length === 0) return prompt;
  const prior = others.map(m => `${labels[m]} said:\n${shared[m]}`).join("\n\n");
  return `${prior}\n\nGiven the above, answer this question yourself: ${prompt}`;
}

async function callClaude(prompt) {
  const key = getKey("claude");
  if (!key) return { error: "No Claude API key set." };
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: MODEL_IDS.claude,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) return { error: `Claude API error ${res.status}: ${await res.text()}` };
  const data = await res.json();
  return { text: data.content?.[0]?.text || "(empty response)" };
}

async function callGemini(prompt) {
  const key = getKey("gemini");
  if (!key) return { error: "No Gemini API key set." };
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_IDS.gemini}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  if (!res.ok) return { error: `Gemini API error ${res.status}: ${await res.text()}` };
  const data = await res.json();
  return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)" };
}

async function callOpenAI(prompt) {
  const key = getKey("gpt");
  if (!key) return { error: "No OpenAI API key set." };
  const url = OPENAI_PROXY_URL || "https://api.openai.com/v1/chat/completions";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: MODEL_IDS.gpt,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!res.ok) return { error: `OpenAI API error ${res.status}: ${await res.text()}` };
    const data = await res.json();
    return { text: data.choices?.[0]?.message?.content || "(empty response)" };
  } catch (e) {
    return {
      error:
        "OpenAI blocks direct browser calls (CORS). Set OPENAI_PROXY_URL in app.js to a backend/n8n webhook that forwards to OpenAI server-side."
    };
  }
}

const callers = { claude: callClaude, gpt: callOpenAI, gemini: callGemini };

async function streamText(el, text, speed = 10) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    if (i % 3 === 0) await new Promise(r => setTimeout(r, speed));
  }
}

async function runModel(model, prompt, shared) {
  const thinkBox = document.getElementById(`think-${model}`);
  const thinkText = thinkBox.querySelector(".think-text");
  const respBox = document.getElementById(`resp-${model}`);

  thinkBox.classList.add("show");
  thinkBox.open = true;
  respBox.innerHTML = "";

  const contextNote =
    Object.keys(shared).length === 0
      ? "Calling the API — no prior answers to consider yet."
      : `Calling the API with ${Object.keys(shared).map(m => labels[m]).join(" and ")}'s answer(s) included as context.`;
  await streamText(thinkText, contextNote, 8);

  const contextPrompt = buildContext(prompt, shared);
  const result = await callers[model](contextPrompt);
  thinkBox.open = false;

  if (result.error) {
    respBox.innerHTML = `<span style="color:#e5484d">${result.error}</span>`;
    return;
  }

  await streamText(respBox, result.text, 8);
  shared[model] = result.text;
}

document.getElementById("sendBtn").addEventListener("click", send);
document.getElementById("promptInput").addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

async function send() {
  const input = document.getElementById("promptInput");
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = "";
  document.getElementById("sendBtn").disabled = true;

  const shared = {};
  for (const model of models) {
    await runModel(model, prompt, shared);
  }

  document.getElementById("sendBtn").disabled = false;
}

// --- API key setup UI ---
function initKeyInputs() {
  models.forEach(model => {
    const input = document.getElementById(`key-${model}`);
    if (!input) return;
    input.value = getKey(model);
    input.addEventListener("change", () => setKey(model, input.value.trim()));
  });
}
document.addEventListener("DOMContentLoaded", initKeyInputs);
