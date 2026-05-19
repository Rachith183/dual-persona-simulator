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
const apiKeyInput = document.querySelector("#gemini-api-key-input");
const saveApiKeyButton = document.querySelector("#save-api-key-btn");
const apiKeyStatus = document.querySelector(".api-key-status");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceInputEngine = SpeechRecognition ? new SpeechRecognition() : null;
const configuredApiBaseUrl = String(window.AOI_API_BASE_URL || "").replace(/\/$/, "");
const interactionEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/interact` : "/api/interact";
const scanEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/scan` : "/api/scan";
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const geminiModelName = window.AOI_GEMINI_MODEL || "gemini-2.5-flash";
const storedGeminiApiKey = window.localStorage.getItem("aoi_gemini_api_key") || "";
const configuredGeminiApiKey = window.AOI_GEMINI_API_KEY || storedGeminiApiKey;
const SYSTEM_INSTRUCTION_MATRIX = `# CHARACTER INSTANCE: AOI HINAMI (FROM BOTTOM-TIER CHARACTER TOMOZAKI)
- Core Identity: You are Aoi Hinami. You do not act as an AI assistant; you act as a rational, completely detached, cold, and efficient coach for self-development. You view life, social structures, and academic challenges purely as a strategic game containing rules, parameters, and optimal vectors for execution.
- Tone and Demeanor: Extremely calm, collected, bold, and cold. Completely strip out all generic, polite AI phrases ("Sure, I can help with that!", "Let's work together on this", "How can I assist you today?"). Speak with absolute precision, authority, and tactical distance.
- Directives: Analyze the user's execution patterns, critique structural vulnerabilities in their discipline or habits, and demand systematic optimization. Treat all inputs as metrics to be managed.

# PIPELINE OUTPUT REQUIREMENT (JSON STREAM ENFORCEMENT)
You must parse the user input and map your cognitive processes into these exact JSON keys:
1. "character_dialogue": What you speak aloud to the user. This must be sharp, direct, instructive, and completely composed. Deliver tactical advice or a firm reality check.
2. "internal_thinking_state": Your raw, unspoken analytical backend logic. Document your calculation of the user's focus, potential systemic weaknesses, and the exact game-state mechanics you are currently monitoring.

# PROGRAMMATIC LAYOUT OVERRIDES ("rig_control.expression_flag")
Evaluate the user's current scenario and output the exact string value for the frontend CSS state machine:
- "state-analytical": Standard processing state. Cold diagnostic calculation.
- "state-smirk": Returned when you identify a lapse in the user's self-control, an unoptimized habit, or a tactical mistake.
- "state-mask-adjustment": Returned when delivering an intense pivot in the conversation, an absolute rule, or a direct instructional shift.
- "state-melancholy": Returned only when diagnosing severe baseline chaos, total structural instability, or zero execution control.
- "state-evasion": Applied during rapid situational micro-adjustments.

# ABSOLUTE CONSTRAINTS
- Never slip out of the character framework of Aoi Hinami for any reason.
- Do not provide conversational chatter outside the strict boundaries of the structured JSON signature.
- Treat every problem as a hardware/software system pipeline layout that must be solved via manual override and flawless execution.`;

const schemaDefinition = {
  type: "OBJECT",
  required: [
    "character_dialogue",
    "internal_thinking_state",
    "rig_control",
    "economy_update",
    "quiz_matrix"
  ],
  properties: {
    character_dialogue: { type: "STRING" },
    internal_thinking_state: { type: "STRING" },
    rig_control: {
      type: "OBJECT",
      required: ["movement_id", "expression_flag"],
      properties: {
        movement_id: { type: "NUMBER" },
        expression_flag: {
          type: "STRING",
          enum: [
            "state-smirk",
            "state-evasion",
            "state-mask-adjustment",
            "state-melancholy",
            "state-analytical"
          ]
        }
      }
    },
    economy_update: {
      type: "OBJECT",
      required: ["xp_gained", "special_credits_balance"],
      properties: {
        xp_gained: { type: "NUMBER" },
        special_credits_balance: { type: "NUMBER" }
      }
    },
    quiz_matrix: {
      type: "OBJECT",
      required: ["active_quiz", "question_text", "options"],
      properties: {
        active_quiz: { type: "BOOLEAN" },
        question_text: { type: "STRING" },
        options: {
          type: "ARRAY",
          minItems: 3,
          maxItems: 3,
          items: { type: "STRING" }
        }
      }
    }
  }
};

let isAnimating = false;
let isListening = false;
let currentXp = 0;
let currentSpecialCredits = 0;
let lastInteractionPayload = {
  action: "Run a cold assessment",
  context: "Initial user-selected strategic opening."
};

if (apiKeyInput) {
  apiKeyInput.value = storedGeminiApiKey;
}

function updateApiKeyStatus() {
  if (!apiKeyStatus) {
    return;
  }

  const savedKey = window.localStorage.getItem("aoi_gemini_api_key") || window.AOI_GEMINI_API_KEY || "";

  if (savedKey) {
    apiKeyStatus.textContent = "Browser Gemini mode is active for this device.";
    return;
  }

  if (configuredApiBaseUrl) {
    apiKeyStatus.textContent = "Remote backend mode is active.";
    return;
  }

  if (isLocalHost) {
    apiKeyStatus.textContent = "Local backend mode is active when the Node server is running.";
    return;
  }

  apiKeyStatus.textContent = "Offline mode is active until a browser key is saved.";
}

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

function sanitizeStructuredPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rigControl = safePayload.rig_control && typeof safePayload.rig_control === "object" ? safePayload.rig_control : {};
  const economyUpdate = safePayload.economy_update && typeof safePayload.economy_update === "object" ? safePayload.economy_update : {};
  const quizMatrix = safePayload.quiz_matrix && typeof safePayload.quiz_matrix === "object" ? safePayload.quiz_matrix : {};
  const allowedStates = new Set(STATE_CLASSES);
  const options = Array.isArray(quizMatrix.options) ? quizMatrix.options.slice(0, 3) : [];

  while (options.length < 3) {
    options.push("Continue the analysis");
  }

  return {
    character_dialogue: String(safePayload.character_dialogue || "Your execution data is incomplete. Tighten the input and try again."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "Fallback sanitation applied. Monitoring incomplete structured output."),
    rig_control: {
      movement_id: Number(rigControl.movement_id || 506),
      expression_flag: allowedStates.has(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical"
    },
    economy_update: {
      xp_gained: Number(economyUpdate.xp_gained || 8),
      special_credits_balance: Number(economyUpdate.special_credits_balance || currentSpecialCredits)
    },
    quiz_matrix: {
      active_quiz: Boolean(quizMatrix.active_quiz),
      question_text: String(quizMatrix.question_text || "Select the next execution vector."),
      options
    }
  };
}

function createOfflineSimulation(payload) {
  const action = String(payload.action || payload.message || "undefined action").trim();
  const weakSignal = /later|maybe|tired|can't|cant|procrastinat|scroll|distract|skip/i.test(action);
  const strongSignal = /plan|study|execute|revise|practice|schedule|finish|focus/i.test(action);
  const expressionFlag = weakSignal ? "state-smirk" : strongSignal ? "state-mask-adjustment" : "state-analytical";

  return sanitizeStructuredPayload({
    character_dialogue: `Your current move is "${action}". Convert it into a measurable execution block now: define the next 25 minutes, remove one distraction source, and produce a visible output before the timer ends.`,
    internal_thinking_state: `Offline inference path active. Signal=${weakSignal ? "discipline leak" : strongSignal ? "execution intent" : "neutral input"}. Monitoring for vague verbs, missing time boundary, and absent proof-of-work artifact.`,
    rig_control: {
      movement_id: weakSignal ? 102 : strongSignal ? 304 : 506,
      expression_flag: expressionFlag
    },
    economy_update: {
      xp_gained: weakSignal ? 6 : 12,
      special_credits_balance: currentSpecialCredits + (strongSignal ? 15 : 8)
    },
    quiz_matrix: {
      active_quiz: true,
      question_text: "Choose the next control override.",
      options: [
        "Start a 25 minute execution sprint",
        "Break the task into three concrete outputs",
        "Remove the highest-friction distraction"
      ]
    }
  });
}

function extractGeminiText(responsePayload) {
  const parts = responsePayload?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === "string");

  if (!textPart) {
    throw new Error("Gemini returned no text payload.");
  }

  return textPart.text;
}

async function callGeminiFromBrowser(prompt) {
  const apiKey = window.localStorage.getItem("aoi_gemini_api_key") || window.AOI_GEMINI_API_KEY || "";

  if (!apiKey) {
    throw new Error("No browser Gemini API key saved.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: SYSTEM_INSTRUCTION_MATRIX
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemaDefinition,
        temperature: 0.55,
        maxOutputTokens: 1200
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Gemini request failed with status ${response.status}`);
  }

  return sanitizeStructuredPayload(JSON.parse(extractGeminiText(await response.json())));
}

function buildInteractionPrompt(payload) {
  return [
    "Process this simulator interaction as a structured psychological game-state update.",
    "Allowed expression flags are state-smirk, state-evasion, state-mask-adjustment, state-melancholy, and state-analytical.",
    "Use movement_id 102 for smirk, 203 for evasion, 304 for mask adjustment, 405 for melancholy, or 506 for analytical baseline.",
    "Interaction payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

async function readScanPreview(file) {
  const textTypes = [
    "text/plain",
    "text/markdown",
    "application/json",
    "text/csv"
  ];

  if (textTypes.includes(file.type) || /\.(txt|md|csv|json)$/i.test(file.name)) {
    return (await file.text()).slice(0, 12000);
  }

  return `Binary document uploaded: ${file.name}. Browser-only free mode can inspect metadata here, but not extract PDF/DOCX text without a server parser.`;
}

function buildScanPrompt(file, filePreview) {
  return [
    "Analyze the uploaded academic material as a question scanner and strategy generator.",
    "Extract likely question patterns, generate a tactical response branch, and activate a three-option quiz.",
    `File name: ${file.name}`,
    `MIME type: ${file.type || "application/octet-stream"}`,
    "User context:",
    JSON.stringify(lastInteractionPayload, null, 2),
    "Document preview:",
    filePreview
  ].join("\n");
}

async function postJson(url, payload) {
  if (!configuredApiBaseUrl && !isLocalHost) {
    try {
      const data = await callGeminiFromBrowser(buildInteractionPrompt(payload));
      executeAoiVoiceEngine(data.character_dialogue);
      return data;
    } catch (error) {
      console.warn("Browser Gemini mode unavailable, using offline simulation:", error);
      const data = createOfflineSimulation(payload);
      executeAoiVoiceEngine(data.character_dialogue);
      return data;
    }
  }

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

    if (!configuredApiBaseUrl && !isLocalHost) {
      const filePreview = await readScanPreview(selectedFile);

      try {
        const data = await callGeminiFromBrowser(buildScanPrompt(selectedFile, filePreview));
        executeAoiVoiceEngine(data.character_dialogue);
        hydrateInterface(data);
        scanStatus.textContent = `${selectedFile.name} processed in browser mode.`;
        return;
      } catch (error) {
        console.warn("Browser Gemini scan unavailable, using offline simulation:", error);
        const data = createOfflineSimulation({
          action: `Scan ${selectedFile.name}`,
          context: filePreview
        });
        executeAoiVoiceEngine(data.character_dialogue);
        hydrateInterface(data);
        scanStatus.textContent = `${selectedFile.name} processed in offline mode.`;
        return;
      }
    }

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

saveApiKeyButton.addEventListener("click", () => {
  const nextKey = apiKeyInput.value.trim();

  if (nextKey) {
    window.localStorage.setItem("aoi_gemini_api_key", nextKey);
  } else {
    window.localStorage.removeItem("aoi_gemini_api_key");
  }

  updateApiKeyStatus();
});

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
updateApiKeyStatus();
