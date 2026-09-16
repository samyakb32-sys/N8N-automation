// Multi-LLM Thinking View — mock demo.
// Replace mockRespond() calls with real API calls per README.md to go live.

const models = ["claude", "gpt", "gemini"];

const mockThoughts = {
  claude: "Parsing the request... considering the most direct, well-structured answer.",
  gpt: "Breaking the question into steps, checking for ambiguity before answering.",
  gemini: "Cross-referencing the prompt against known context, drafting a concise reply."
};

function mockRespond(prompt) {
  return `Here's a response to: "${prompt}"\n\n(This is a mock reply. Wire your API key in app.js to get a real answer from this model.)`;
}

async function streamText(el, text, speed = 12) {
  el.textContent = "";
  for (let i = 0; i < text.length; i++) {
    el.textContent += text[i];
    if (i % 3 === 0) await new Promise(r => setTimeout(r, speed));
  }
}

async function runModel(model, prompt) {
  const thinkBox = document.getElementById(`think-${model}`);
  const thinkText = thinkBox.querySelector(".think-text");
  const respBox = document.getElementById(`resp-${model}`);

  thinkBox.classList.add("show");
  thinkBox.open = true;
  respBox.innerHTML = "";

  await streamText(thinkText, mockThoughts[model], 8);
  await new Promise(r => setTimeout(r, 300));
  thinkBox.open = false;

  const answer = mockRespond(prompt);
  await streamText(respBox, answer, 10);
}

document.getElementById("sendBtn").addEventListener("click", send);
document.getElementById("promptInput").addEventListener("keydown", e => {
  if (e.key === "Enter") send();
});

function send() {
  const input = document.getElementById("promptInput");
  const prompt = input.value.trim();
  if (!prompt) return;
  input.value = "";
  document.getElementById("sendBtn").disabled = true;

  Promise.all(models.map(m => runModel(m, prompt))).finally(() => {
    document.getElementById("sendBtn").disabled = false;
  });
}
