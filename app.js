// Multi-LLM Thinking View — mock demo.
// Models now run in sequence and each one can "see" the answers already
// given by the models before it, so the thinking + response references them.
// Replace mockRespond() with real API calls per README.md to go live —
// in a real backend you'd pass `shared` (the other models' text so far)
// into each model's prompt/context the same way this mock does.

const models = ["claude", "gpt", "gemini"];
const labels = { claude: "Claude", gpt: "ChatGPT", gemini: "Gemini" };

function mockThinking(model, prompt, shared) {
  const others = Object.keys(shared);
  if (others.length === 0) {
    return "Parsing the request... considering the most direct, well-structured answer. No other model has responded yet, so I'll set the initial framing.";
  }
  const refs = others.map(m => `${labels[m]}'s take ("${shared[m].slice(0, 60)}...")`).join(" and ");
  return `Reading ${refs} before answering. I'll build on what's useful and flag anything I'd do differently.`;
}

function mockRespond(model, prompt, shared) {
  const others = Object.keys(shared);
  if (others.length === 0) {
    return `Here's my take on: "${prompt}"\n\n(Mock reply — wire a real API call in app.js to replace this.)`;
  }
  const lastModel = others[others.length - 1];
  return `Building on ${labels[lastModel]}'s answer above, here's my take on: "${prompt}"\n\nI agree with the core direction but would add more detail here.\n\n(Mock reply — wire a real API call in app.js to replace this.)`;
}

async function streamText(el, text, speed = 12) {
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

  await streamText(thinkText, mockThinking(model, prompt, shared), 8);
  await new Promise(r => setTimeout(r, 300));
  thinkBox.open = false;

  const answer = mockRespond(model, prompt, shared);
  await streamText(respBox, answer, 10);
  shared[model] = answer;
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

  const shared = {}; // answers so far, keyed by model — each model reads this before running
  for (const model of models) {
    await runModel(model, prompt, shared);
  }

  document.getElementById("sendBtn").disabled = false;
}
