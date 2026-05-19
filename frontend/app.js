const STATE_CLASSES = [
  "state-smirk",
  "state-evasion",
  "state-mask-adjustment",
  "state-melancholy",
  "state-analytical"
];

const PARALLAX_LAYERS = [
  { selector: ".layer-bg", max: 0 },
  { selector: ".layer-left-hair-back", max: 2 },
  { selector: ".layer-right-hair-back", max: 2 },
  { selector: ".layer-body", max: 4 },
  { selector: ".layer-face-base", max: 6 },
  { selector: ".layer-mouth", max: 8 },
  { selector: ".layer-left-eye", max: 12 },
  { selector: ".layer-right-eye", max: 12 },
  { selector: ".layer-left-strand", max: 15 },
  { selector: ".layer-right-strand", max: 15 },
  { selector: ".layer-bangs", max: 15 }
];

const viewport = document.querySelector(".character-viewport");
const characterDialogue = document.querySelector(".character-dialogue");
const internalThinkingState = document.querySelector(".internal-thinking-state");
const quizQuestion = document.querySelector(".quiz-question");
const quizOptions = document.querySelector(".quiz-options");
const xpValue = document.querySelector("#xp-value");
const scValue = document.querySelector("#sc-value");
const stabilityMeter = document.querySelector("#stability-meter");
const scanInput = document.querySelector("#scan-file");
const scanSubmit = document.querySelector(".scan-submit");
const scanStatus = document.querySelector(".scan-status");
const headHitbox = document.querySelector(".hitbox-head");
const chestHitbox = document.querySelector(".hitbox-chest");
const interfaceContainer = document.querySelector(".vtuber-interface-container");
const chatInput = document.querySelector("#chat-text-input");
const chatForm = document.querySelector(".chat-input-form");
const micToggleButton = document.getElementById("mic-toggle-btn");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceInputEngine = SpeechRecognition ? new SpeechRecognition() : null;
const configuredApiBaseUrl = String(window.AOI_API_BASE_URL || "").replace(/\/$/, "");
const interactionEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/interact` : "/api/interact";
const scanEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/scan` : "/api/scan";

let isAnimating = false;
let isListening = false;
let currentXp = 0;
let currentSpecialCredits = 0;
let lastInteractionPayload = {
  action: "Run a cold assessment",
  context: "Initial user-selected strategic opening."
};

function selectAoiVoice(voices) {
  const priorityTokens = [
    "Google US English",
    "Microsoft Zira",
    "en-US",
    "en-GB"
  ];
  const femaleHints = [
    "female",
    "zira",
    "samantha",
    "victoria",
    "serena",
    "susan",
    "google us english"
  ];

  return voices.find((voice) => {
    const searchableProfile = `${voice.name} ${voice.lang}`.toLowerCase();
    const hasPriorityToken = priorityTokens.some((token) => searchableProfile.includes(token.toLowerCase()));
    const hasFemaleHint = femaleHints.some((hint) => searchableProfile.includes(hint));
    return hasPriorityToken && hasFemaleHint;
  }) || voices.find((voice) => {
    const searchableProfile = `${voice.name} ${voice.lang}`.toLowerCase();
    return priorityTokens.some((token) => searchableProfile.includes(token.toLowerCase()));
  }) || voices[0] || null;
}

function dispatchAoiVoice(text, voices) {
  if (!text || typeof SpeechSynthesisUtterance === "undefined") {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedVoice = selectAoiVoice(voices);

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.rate = 1.10;
  utterance.pitch = 0.95;
  utterance.volume = 1.0;
  window.speechSynthesis.speak(utterance);
}

function executeAoiVoiceEngine(text) {
  window.speechSynthesis.cancel();

  if (!("speechSynthesis" in window) || !text) {
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  if (voices.length > 0) {
    dispatchAoiVoice(text, voices);
    return;
  }

  window.speechSynthesis.onvoiceschanged = () => {
    dispatchAoiVoice(text, window.speechSynthesis.getVoices());
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizePointer(event, element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const normalizedX = clamp((event.clientX - centerX) / (rect.width / 2), -1, 1);
  const normalizedY = clamp((event.clientY - centerY) / (rect.height / 2), -1, 1);

  return { x: normalizedX, y: normalizedY };
}

function setLayerTransform(layer, xPixels, yPixels, rotationDegrees = 0) {
  layer.style.setProperty("--tx", `${xPixels.toFixed(2)}px`);
  layer.style.setProperty("--ty", `${yPixels.toFixed(2)}px`);
  layer.style.setProperty("--rot", `${rotationDegrees.toFixed(2)}deg`);

  if (!layer.classList.contains("breathing-layer")) {
    layer.style.transform = `translate3d(${xPixels.toFixed(2)}px, ${yPixels.toFixed(2)}px, 0) rotate(${rotationDegrees.toFixed(2)}deg)`;
  }
}

function applyParallax(vector) {
  PARALLAX_LAYERS.forEach((entry) => {
    const layer = document.querySelector(entry.selector);

    if (!layer) {
      return;
    }

    const xPixels = vector.x * entry.max;
    const yPixels = vector.y * entry.max * 0.72;
    setLayerTransform(layer, xPixels, yPixels, 0);
  });
}

function resetParallax() {
  applyParallax({ x: 0, y: 0 });
}

function setExpressionState(expressionFlag) {
  const normalizedFlag = STATE_CLASSES.includes(expressionFlag) ? expressionFlag : "state-analytical";
  viewport.classList.remove(...STATE_CLASSES);
  viewport.classList.add(normalizedFlag);
}

function triggerPhysicalReaction(source) {
  if (isAnimating) {
    return;
  }

  isAnimating = true;
  const availableStates = source === "head"
    ? ["state-smirk", "state-evasion", "state-mask-adjustment", "state-analytical"]
    : ["state-evasion", "state-melancholy", "state-analytical"];
  const selectedState = availableStates[Math.floor(Math.random() * availableStates.length)];

  setExpressionState(selectedState);
  resetParallax();

  window.setTimeout(() => {
    isAnimating = false;
    setExpressionState("state-analytical");
    resetParallax();
  }, 820);
}

function animateNumber(element, startValue, endValue, durationMilliseconds) {
  const startTimestamp = performance.now();
  const delta = endValue - startValue;

  function tick(timestamp) {
    const elapsed = timestamp - startTimestamp;
    const progress = clamp(elapsed / durationMilliseconds, 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(startValue + delta * easedProgress);
    element.textContent = value.toString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function updateEconomy(economyUpdate) {
  if (!economyUpdate) {
    return;
  }

  const nextXp = currentXp + Number(economyUpdate.xp_gained || 0);
  const nextSpecialCredits = Number(economyUpdate.special_credits_balance || currentSpecialCredits);

  animateNumber(xpValue, currentXp, nextXp, 520);
  animateNumber(scValue, currentSpecialCredits, nextSpecialCredits, 520);

  currentXp = nextXp;
  currentSpecialCredits = nextSpecialCredits;

  const stabilityValue = clamp(82 + Math.floor(currentXp / 50) - Math.floor(currentSpecialCredits / 200), 12, 100);
  stabilityMeter.value = stabilityValue;
  stabilityMeter.textContent = stabilityValue.toString();
}

function renderQuiz(quizMatrix) {
  quizOptions.replaceChildren();

  if (!quizMatrix || quizMatrix.active_quiz !== true) {
    quizQuestion.textContent = "No active decision branch.";
    return;
  }

  quizQuestion.textContent = quizMatrix.question_text || "Choose the next strategic vector.";

  quizMatrix.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.type = "button";
    button.textContent = option;
    button.dataset.option = option;
    quizOptions.append(button);
  });
}

function hydrateInterface(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("API response was not a JSON object.");
  }

  characterDialogue.textContent = payload.character_dialogue || "No dialogue returned.";
  internalThinkingState.textContent = payload.internal_thinking_state || "No internal state returned.";

  if (payload.rig_control) {
    setExpressionState(payload.rig_control.expression_flag);
  }

  updateEconomy(payload.economy_update);
  renderQuiz(payload.quiz_matrix);
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  executeAoiVoiceEngine(data.character_dialogue);
  return data;
}

function sendChatMessageToServer(messageText) {
  const normalizedMessage = String(messageText || "").trim();

  if (!normalizedMessage) {
    return;
  }

  const payload = {
    action: normalizedMessage,
    context: characterDialogue.textContent.trim(),
    internal_state: internalThinkingState.textContent.trim()
  };

  sendInteraction(payload);
}

async function sendInteraction(payload) {
  lastInteractionPayload = payload;

  try {
    characterDialogue.textContent = "Processing strategic branch...";
    const data = await postJson(interactionEndpoint, payload);
    hydrateInterface(data);
  } catch (error) {
    characterDialogue.textContent = "Backend interaction failed.";
    internalThinkingState.textContent = error.message;
    setExpressionState("state-melancholy");
  }
}

async function sendScan() {
  const selectedFile = scanInput.files && scanInput.files[0];

  if (!selectedFile) {
    scanStatus.textContent = "Select a document before scanning.";
    return;
  }

  const formData = new FormData();
  formData.append("document", selectedFile);
  formData.append("context", JSON.stringify(lastInteractionPayload));

  try {
    scanStatus.textContent = `Scanning ${selectedFile.name}...`;
    const response = await fetch(scanEndpoint, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Scan failed with status ${response.status}`);
    }

    const data = await response.json();
    executeAoiVoiceEngine(data.character_dialogue);
    hydrateInterface(data);
    scanStatus.textContent = `${selectedFile.name} processed.`;
  } catch (error) {
    scanStatus.textContent = error.message;
    setExpressionState("state-melancholy");
  }
}

viewport.addEventListener("mousemove", (event) => {
  if (isAnimating) {
    return;
  }

  applyParallax(normalizePointer(event, viewport));
});

viewport.addEventListener("mouseleave", () => {
  if (!isAnimating) {
    resetParallax();
  }
});

headHitbox.addEventListener("click", () => {
  triggerPhysicalReaction("head");
});

chestHitbox.addEventListener("click", () => {
  triggerPhysicalReaction("chest");
});

quizOptions.addEventListener("click", (event) => {
  const optionButton = event.target.closest(".quiz-option");

  if (!optionButton) {
    return;
  }

  const payload = {
    action: optionButton.dataset.option,
    context: "Initial local branch selection.",
    internal_state: internalThinkingState.textContent.trim()
  };
  sendInteraction(payload);
});

scanSubmit.addEventListener("click", sendScan);

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const messageText = chatInput.value;
  chatInput.value = "";
  sendChatMessageToServer(messageText);
});

if (voiceInputEngine) {
  voiceInputEngine.continuous = false;
  voiceInputEngine.interimResults = false;
  voiceInputEngine.lang = "en-US";

  voiceInputEngine.onstart = () => {
    isListening = true;
    interfaceContainer.classList.add("voice-active");
    micToggleButton.setAttribute("aria-pressed", "true");
    window.speechSynthesis.cancel();
  };

  voiceInputEngine.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendChatMessageToServer(transcript);
  };

  voiceInputEngine.onerror = (event) => {
    console.error("Voice input engine error:", event);
    voiceInputEngine.stop();
  };

  voiceInputEngine.onend = () => {
    isListening = false;
    interfaceContainer.classList.remove("voice-active");
    micToggleButton.setAttribute("aria-pressed", "false");
  };

  micToggleButton.addEventListener("click", () => {
    if (isListening) {
      voiceInputEngine.stop();
      return;
    }

    voiceInputEngine.start();
  });
} else {
  micToggleButton.disabled = true;
  micToggleButton.setAttribute("aria-disabled", "true");
}

resetParallax();
