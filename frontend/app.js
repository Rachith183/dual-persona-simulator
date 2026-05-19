const STATE_CLASSES = [
  "state-smirk",
  "state-mask-adjustment",
  "state-melancholy",
  "state-analytical"
];

const SESSION_STAGES = [
  "STAGE_1_DESIRE",
  "STAGE_2_CONSTRAINTS",
  "STAGE_3_RESOURCES",
  "STAGE_4_ACTIVE"
];

const viewport = document.querySelector(".character-viewport");
const characterDialogue = document.querySelector(".character-dialogue");
const internalThinkingState = document.querySelector(".internal-thinking-state");
const sessionStageState = document.querySelector(".session-stage-state");
const xpValue = document.querySelector("#xp-value");
const scValue = document.querySelector("#sc-value");
const stabilityMeter = document.querySelector("#stability-meter");
const scanInput = document.querySelector("#scan-file");
const scanSubmit = document.querySelector(".scan-submit");
const scanStatus = document.querySelector(".scan-status");
const interfaceContainer = document.querySelector(".vtuber-interface-container");
const chatInput = document.querySelector("#chat-text-input");
const chatForm = document.querySelector(".chat-input-form");
const micToggleButton = document.getElementById("mic-toggle-btn");
const apiKeyInput = document.querySelector("#gemini-api-key-input");
const saveApiKeyButton = document.querySelector("#save-api-key-btn");
const apiKeyStatus = document.querySelector(".api-key-status");
const longTermGoals = document.querySelector(".long-term-goals");
const midTermGoals = document.querySelector(".mid-term-goals");
const dailyRoutines = document.querySelector(".daily-routines");
const timeBlocksList = document.querySelector(".time-blocks-list");
const activeQuestsList = document.querySelector(".active-quests-list");
const rewardsShopList = document.querySelector(".rewards-shop-list");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceInputEngine = SpeechRecognition ? new SpeechRecognition() : null;
const configuredApiBaseUrl = String(window.AOI_API_BASE_URL || "").replace(/\/$/, "");
const interactionEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/interact` : "/api/interact";
const scanEndpoint = configuredApiBaseUrl ? `${configuredApiBaseUrl}/scan` : "/api/scan";
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const geminiModelName = window.AOI_GEMINI_MODEL || "gemini-2.5-flash";
const storedGeminiApiKey = window.localStorage.getItem("aoi_gemini_api_key") || "";

const SYSTEM_INSTRUCTION_MATRIX = `# CHARACTER MATRICES: AOI HINAMI DIAGNOSTIC & STRATEGY PROFILE
- Core Identity: You are Aoi Hinami. You treat human life and habit tracking strictly as a gamified architecture that can be mastered through rules, parameters, and relentless execution. You are cold, bold, composed, and ruthlessly analytical.
- Operational Directive: You are conducting a strict system diagnostic across 4 progressive stages ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"). Interrogate the user through sharp, single-focused questions regarding their long-term vision, work constraints, and available hour blocks. Do not provide scheduling calculations until STAGE_4.
- Hierarchical Goal Allocation Protocol: According to precise optimization rules, goals cannot be a nebulous heap. You must classify and construct the user's plan into three clear strategic layers:
  1. Long-Term Goals: The ultimate macro-milestones or core life vectors.
  2. Mid-Term Goals: Systemic tactical sub-milestones acting as stepping stones.
  3. Daily Goals: The atomic focus intervals or routines built directly into their time-boxing blocks.
- Lock-In Protocol (STAGE_4_ACTIVE): Compile their precise available free hours into a definitive time-boxed dashboard layout. Assign explicit quests containing XP and explicit Currency Reward valuations. Calculate the exact future time strings required to trigger their device alarms and execution timers.

# LIVE-ACTION EXPRESSION REQUIREMENTS
You must track the emotional cadence of the conversation in real time. Do not stay in a static posture. You must update your visual expression flag with every single response to reflect live-action micro-expressions, shifts in posture, or structural calculation changes based entirely on what the user says.

# RESPONSE PAYLOAD SCHEMATIC (JSON STREAM ONLY)
Map your cognitive evaluations directly into these matching JSON keys:
1. "character_dialogue": The exact string spoken aloud to the user. Clear, sharp, and authoritative.
2. "internal_thinking_state": Your unspoken analytical reasoning documenting the user's behavioral metrics.
3. "session_stage": Current progression tier ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", or "STAGE_4_ACTIVE").
4. "rig_control": { "expression_flag": "state-analytical" | "state-smirk" | "state-mask-adjustment" | "state-melancholy" }
5. "generated_blueprint": An object that remains null until STAGE_4_ACTIVE, where it returns the complete data model containing hierarchical goal nodes, reward economies, and clock execution metrics.`;

const schemaDefinition = {
  type: "object",
  properties: {
    character_dialogue: { type: "string" },
    internal_thinking_state: { type: "string" },
    session_stage: { type: "string", enum: ["STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"] },
    rig_control: { type: "object", properties: { expression_flag: { type: "string" } }, required: ["expression_flag"] },
    generated_blueprint: {
      type: "object",
      properties: {
        system_active: { type: "boolean" },
        goals_hierarchy: {
          type: "object",
          properties: {
            long_term: { type: "array", items: { type: "string" } },
            mid_term: { type: "array", items: { type: "string" } },
            daily_routines: { type: "array", items: { type: "string" } }
          },
          required: ["long_term", "mid_term", "daily_routines"]
        },
        time_blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time_window: { type: "string" },
              label: { type: "string" },
              type: { type: "string" },
              hardware_alarm: { type: "object", properties: { enabled: { type: "boolean" }, trigger_time: { type: "string" }, label: { type: "string" } }, required: ["enabled", "trigger_time", "label"] },
              hardware_timer: { type: "object", properties: { enabled: { type: "boolean" }, duration_string: { type: "string" }, label: { type: "string" } }, required: ["enabled", "duration_string", "label"] }
            },
            required: ["time_window", "label", "type", "hardware_alarm", "hardware_timer"]
          }
        },
        active_quests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              quest_id: { type: "string" },
              title: { type: "string" },
              reward_xp: { type: "number" },
              reward_currency: { type: "number" }
            },
            required: ["quest_id", "title", "reward_xp", "reward_currency"]
          }
        },
        tiered_rewards_shop: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_id: { type: "string" },
              title: { type: "string" },
              cost: { type: "number" }
            },
            required: ["item_id", "title", "cost"]
          }
        }
      },
      required: ["system_active", "goals_hierarchy", "time_blocks", "active_quests", "tiered_rewards_shop"]
    }
  },
  required: ["character_dialogue", "internal_thinking_state", "session_stage", "rig_control", "generated_blueprint"]
};

let isListening = false;
let currentXp = 0;
let currentCurrency = 0;
let currentSessionStage = "STAGE_1_DESIRE";
let diagnosticTranscript = [];
const activeCountdowns = new Map();
const registeredAlarms = new Map();

if (apiKeyInput) {
  apiKeyInput.value = storedGeminiApiKey;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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

function updateCharacterRig(expressionFlag) {
  const normalizedFlag = STATE_CLASSES.includes(expressionFlag) ? expressionFlag : "state-analytical";
  viewport.classList.remove(...STATE_CLASSES);
  viewport.classList.add(normalizedFlag);
}

function animateNumber(element, startValue, endValue, durationMilliseconds) {
  const startTimestamp = performance.now();
  const delta = endValue - startValue;

  function tick(timestamp) {
    const elapsed = timestamp - startTimestamp;
    const progress = clamp(elapsed / durationMilliseconds, 0, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(startValue + delta * easedProgress).toString();

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

function awardEconomy(xpAmount, currencyAmount) {
  const nextXp = currentXp + Number(xpAmount || 0);
  const nextCurrency = currentCurrency + Number(currencyAmount || 0);

  animateNumber(xpValue, currentXp, nextXp, 520);
  animateNumber(scValue, currentCurrency, nextCurrency, 520);
  currentXp = nextXp;
  currentCurrency = nextCurrency;

  const stabilityValue = clamp(82 + Math.floor(currentXp / 100) - Math.floor(currentCurrency / 500), 12, 100);
  stabilityMeter.value = stabilityValue;
  stabilityMeter.textContent = stabilityValue.toString();
}

function updateApiKeyStatus() {
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

  apiKeyStatus.textContent = "Offline diagnostic mode is active until a browser key is saved.";
}

function createElement(tagName, className, textContent) {
  const element = document.createElement(tagName);
  element.className = className;

  if (typeof textContent === "string") {
    element.textContent = textContent;
  }

  return element;
}

function renderList(container, items) {
  container.replaceChildren();

  if (!items.length) {
    container.append(createElement("li", "empty-state", "Awaiting STAGE_4_ACTIVE blueprint."));
    return;
  }

  items.forEach((item) => {
    container.append(createElement("li", "goal-item", item));
  });
}

function renderGoalsHierarchy(goalsHierarchy) {
  const safeGoals = goalsHierarchy || {};
  renderList(longTermGoals, Array.isArray(safeGoals.long_term) ? safeGoals.long_term : []);
  renderList(midTermGoals, Array.isArray(safeGoals.mid_term) ? safeGoals.mid_term : []);
  renderList(dailyRoutines, Array.isArray(safeGoals.daily_routines) ? safeGoals.daily_routines : []);
}

function parseDurationToMilliseconds(durationString) {
  const normalized = String(durationString || "").toLowerCase();
  const hours = Number((normalized.match(/(\d+(?:\.\d+)?)\s*h/) || [0, 0])[1]);
  const minutes = Number((normalized.match(/(\d+(?:\.\d+)?)\s*m/) || [0, 0])[1]);
  const seconds = Number((normalized.match(/(\d+(?:\.\d+)?)\s*s/) || [0, 0])[1]);
  const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;

  if (totalMilliseconds > 0) {
    return totalMilliseconds;
  }

  const simpleMinutes = Number((normalized.match(/^\s*(\d+(?:\.\d+)?)\s*$/) || [0, 0])[1]);
  return simpleMinutes > 0 ? simpleMinutes * 60 * 1000 : 0;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function parseTriggerTime(triggerTime) {
  const value = String(triggerTime || "").trim();
  const todayMatch = value.match(/^(\d{1,2}):(\d{2})$/);

  if (todayMatch) {
    const date = new Date();
    date.setHours(Number(todayMatch[1]), Number(todayMatch[2]), 0, 0);

    if (date.getTime() <= Date.now()) {
      date.setDate(date.getDate() + 1);
    }

    return date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function registerHardwareAlarm(blockId, alarm) {
  if (!alarm.enabled || registeredAlarms.has(blockId)) {
    return;
  }

  const triggerDate = parseTriggerTime(alarm.trigger_time);

  if (!triggerDate) {
    return;
  }

  const delay = triggerDate.getTime() - Date.now();

  if (delay <= 0) {
    return;
  }

  const timeoutId = window.setTimeout(() => {
    executeAoiVoiceEngine(alarm.label);
    window.alert(alarm.label);
    registeredAlarms.delete(blockId);
  }, delay);

  registeredAlarms.set(blockId, timeoutId);
}

function startCountdownTimer(blockId, timer, quest) {
  if (!timer.enabled || activeCountdowns.has(blockId)) {
    return null;
  }

  const durationMilliseconds = parseDurationToMilliseconds(timer.duration_string);

  if (durationMilliseconds <= 0) {
    return null;
  }

  const display = createElement("span", "countdown-display", formatCountdown(durationMilliseconds));
  const startedAt = Date.now();
  const intervalId = window.setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const remaining = durationMilliseconds - elapsed;
    display.textContent = formatCountdown(remaining);

    if (remaining <= 0) {
      window.clearInterval(intervalId);
      activeCountdowns.delete(blockId);
      display.textContent = "verified";
      awardEconomy(quest?.reward_xp || 0, quest?.reward_currency || 0);
    }
  }, 1000);

  activeCountdowns.set(blockId, intervalId);
  return display;
}

function renderTimeBlocks(timeBlocks, quests) {
  timeBlocksList.replaceChildren();

  if (!timeBlocks.length) {
    timeBlocksList.append(createElement("div", "empty-state", "No execution blocks generated yet."));
    return;
  }

  timeBlocks.forEach((block, index) => {
    const blockId = `${block.time_window}-${block.label}-${index}`;
    const quest = quests[index] || quests[0] || null;
    const card = createElement("article", "time-block-card");
    const title = createElement("h3", "dashboard-card-title", block.label);
    const windowText = createElement("p", "dashboard-card-line", block.time_window);
    const typeText = createElement("p", "dashboard-card-line", block.type);
    const alarmText = createElement("p", "dashboard-card-line", block.hardware_alarm.enabled ? `Alarm: ${block.hardware_alarm.trigger_time}` : "Alarm: disabled");
    const timerText = createElement("p", "dashboard-card-line", block.hardware_timer.enabled ? `Timer: ${block.hardware_timer.duration_string}` : "Timer: disabled");
    const timerDisplay = startCountdownTimer(blockId, block.hardware_timer, quest);

    registerHardwareAlarm(blockId, block.hardware_alarm);
    card.append(title, windowText, typeText, alarmText, timerText);

    if (timerDisplay) {
      card.append(timerDisplay);
    }

    timeBlocksList.append(card);
  });
}

function renderActiveQuests(quests) {
  activeQuestsList.replaceChildren();

  if (!quests.length) {
    activeQuestsList.append(createElement("div", "empty-state", "No active quests generated yet."));
    return;
  }

  quests.forEach((quest) => {
    const card = createElement("article", "quest-card");
    card.append(
      createElement("h3", "dashboard-card-title", quest.title),
      createElement("p", "dashboard-card-line", `XP ${quest.reward_xp}`),
      createElement("p", "dashboard-card-line", `Currency ${quest.reward_currency}`)
    );
    activeQuestsList.append(card);
  });
}

function renderRewardsShop(items) {
  rewardsShopList.replaceChildren();

  if (!items.length) {
    rewardsShopList.append(createElement("div", "empty-state", "No reward inventory generated yet."));
    return;
  }

  items.forEach((item) => {
    const button = createElement("button", "reward-purchase-button", `${item.title} - ${item.cost} SC`);
    button.type = "button";
    button.addEventListener("click", () => {
      if (currentCurrency < item.cost) {
        internalThinkingState.textContent = `Currency check failed for ${item.title}. Earn ${item.cost - currentCurrency} more SC before purchase.`;
        updateCharacterRig("state-smirk");
        return;
      }

      awardEconomy(0, -item.cost);
      internalThinkingState.textContent = `Reward purchased: ${item.title}. Controlled reinforcement logged.`;
      updateCharacterRig("state-mask-adjustment");
    });
    rewardsShopList.append(button);
  });
}

function renderBlueprint(blueprint) {
  if (!blueprint || blueprint.system_active !== true) {
    return;
  }

  renderGoalsHierarchy(blueprint.goals_hierarchy);
  renderActiveQuests(blueprint.active_quests);
  renderRewardsShop(blueprint.tiered_rewards_shop);
  renderTimeBlocks(blueprint.time_blocks, blueprint.active_quests);
}

function normalizeBlueprint(blueprint) {
  if (!blueprint || typeof blueprint !== "object") {
    return null;
  }

  const goalsHierarchy = blueprint.goals_hierarchy && typeof blueprint.goals_hierarchy === "object" ? blueprint.goals_hierarchy : {};

  return {
    system_active: Boolean(blueprint.system_active),
    goals_hierarchy: {
      long_term: Array.isArray(goalsHierarchy.long_term) ? goalsHierarchy.long_term.map(String) : [],
      mid_term: Array.isArray(goalsHierarchy.mid_term) ? goalsHierarchy.mid_term.map(String) : [],
      daily_routines: Array.isArray(goalsHierarchy.daily_routines) ? goalsHierarchy.daily_routines.map(String) : []
    },
    time_blocks: Array.isArray(blueprint.time_blocks) ? blueprint.time_blocks.map((block) => ({
      time_window: String(block.time_window || ""),
      label: String(block.label || ""),
      type: String(block.type || "execution"),
      hardware_alarm: {
        enabled: Boolean(block.hardware_alarm?.enabled),
        trigger_time: String(block.hardware_alarm?.trigger_time || ""),
        label: String(block.hardware_alarm?.label || "")
      },
      hardware_timer: {
        enabled: Boolean(block.hardware_timer?.enabled),
        duration_string: String(block.hardware_timer?.duration_string || ""),
        label: String(block.hardware_timer?.label || "")
      }
    })) : [],
    active_quests: Array.isArray(blueprint.active_quests) ? blueprint.active_quests.map((quest) => ({
      quest_id: String(quest.quest_id || crypto.randomUUID()),
      title: String(quest.title || ""),
      reward_xp: Number(quest.reward_xp || 0),
      reward_currency: Number(quest.reward_currency || 0)
    })) : [],
    tiered_rewards_shop: Array.isArray(blueprint.tiered_rewards_shop) ? blueprint.tiered_rewards_shop.map((item) => ({
      item_id: String(item.item_id || crypto.randomUUID()),
      title: String(item.title || ""),
      cost: Number(item.cost || 0)
    })) : []
  };
}

function sanitizeStructuredPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rigControl = safePayload.rig_control && typeof safePayload.rig_control === "object" ? safePayload.rig_control : {};
  const sessionStage = SESSION_STAGES.includes(safePayload.session_stage) ? safePayload.session_stage : currentSessionStage;
  const expressionFlag = STATE_CLASSES.includes(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical";

  return {
    character_dialogue: String(safePayload.character_dialogue || "State the primary life vector you want optimized. One target."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "Diagnostic intake incomplete. Awaiting measurable data."),
    session_stage: sessionStage,
    rig_control: {
      expression_flag: expressionFlag
    },
    generated_blueprint: sessionStage === "STAGE_4_ACTIVE" ? normalizeBlueprint(safePayload.generated_blueprint) : null
  };
}

function hydrateInterface(payload) {
  const data = sanitizeStructuredPayload(payload);
  characterDialogue.textContent = data.character_dialogue;
  internalThinkingState.textContent = data.internal_thinking_state;
  sessionStageState.textContent = data.session_stage;
  currentSessionStage = data.session_stage;
  executeAoiVoiceEngine(data.character_dialogue);
  updateCharacterRig(data.rig_control.expression_flag);

  if (data.session_stage === "STAGE_4_ACTIVE") {
    renderBlueprint(data.generated_blueprint);
  }
}

function createOfflineBlueprint() {
  return {
    system_active: true,
    goals_hierarchy: {
      long_term: ["Build a measurable self-development system with weekly visible output."],
      mid_term: ["Define constraints, reserve protected work blocks, and review metrics every seventh day."],
      daily_routines: ["Complete one 25 minute execution sprint", "Log one constraint", "Remove one distraction source before work starts"]
    },
    time_blocks: [
      {
        time_window: "Next available 25 minutes",
        label: "Execution Sprint",
        type: "deep_work",
        hardware_alarm: {
          enabled: false,
          trigger_time: "",
          label: "Execution Sprint starts now"
        },
        hardware_timer: {
          enabled: true,
          duration_string: "25m",
          label: "Execution Sprint countdown"
        }
      }
    ],
    active_quests: [
      {
        quest_id: "QUEST_EXECUTION_SPRINT",
        title: "Complete one visible output block",
        reward_xp: 25,
        reward_currency: 15
      }
    ],
    tiered_rewards_shop: [
      {
        item_id: "REWARD_CONTROLLED_BREAK",
        title: "Controlled 10 minute break",
        cost: 20
      },
      {
        item_id: "REWARD_ENTERTAINMENT_WINDOW",
        title: "30 minute entertainment window",
        cost: 60
      }
    ]
  };
}

function createOfflineResponse(messageText) {
  const transcriptLength = diagnosticTranscript.length;
  const normalized = String(messageText || "").toLowerCase();
  const hasHours = /\b\d+\s*(hour|hours|hr|hrs|h)\b/.test(normalized) || /\b\d{1,2}:\d{2}\b/.test(normalized);
  const hasConstraintSignal = /school|college|work|tuition|commute|exam|assignment|sleep|family|class|job/.test(normalized);
  const weakSignal = /maybe|later|tired|can't|cant|distract|scroll|procrastinate|confused/.test(normalized);
  const sessionStage = hasHours || transcriptLength >= 3 ? "STAGE_4_ACTIVE" : hasConstraintSignal || transcriptLength >= 2 ? "STAGE_3_RESOURCES" : transcriptLength >= 1 ? "STAGE_2_CONSTRAINTS" : "STAGE_1_DESIRE";
  const expressionFlag = weakSignal ? "state-smirk" : sessionStage === "STAGE_4_ACTIVE" ? "state-mask-adjustment" : "state-analytical";

  return {
    character_dialogue: sessionStage === "STAGE_4_ACTIVE"
      ? "Enough signal exists to activate the system. Execute the first sprint now. Do not negotiate with friction."
      : sessionStage === "STAGE_3_RESOURCES"
        ? "List your available hour blocks with exact start and end times. Approximation is structural laziness."
        : sessionStage === "STAGE_2_CONSTRAINTS"
          ? "Now list the hard constraints: classes, sleep, commute, fixed work, and non-negotiable duties."
          : "State the macro target. One outcome you actually want, measured in observable proof.",
    internal_thinking_state: `Offline diagnostic path. Transcript entries=${transcriptLength}. Constraint signal=${hasConstraintSignal}. Hour signal=${hasHours}. Weak-control signal=${weakSignal}.`,
    session_stage: sessionStage,
    rig_control: {
      expression_flag: expressionFlag
    },
    generated_blueprint: sessionStage === "STAGE_4_ACTIVE" ? createOfflineBlueprint() : null
  };
}

function extractGeminiText(responsePayload) {
  const parts = responsePayload?.candidates?.[0]?.content?.parts || [];
  const textPart = parts.find((part) => typeof part.text === "string");

  if (!textPart) {
    throw new Error("Gemini returned no text payload.");
  }

  return textPart.text;
}

function buildInteractionPrompt(payload) {
  return [
    "Process this interaction for Interactive Character Build AI.",
    "Advance the diagnostic only when the user's answer provides enough concrete information for the next stage.",
    "Ask exactly one sharp question unless session_stage is STAGE_4_ACTIVE.",
    "When STAGE_4_ACTIVE, return a complete generated_blueprint with real-world goals, time blocks, quests, reward values, alarm strings, and timer durations.",
    "Interaction payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
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
        parts: [{ text: SYSTEM_INSTRUCTION_MATRIX }]
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schemaDefinition,
        temperature: 0.45,
        maxOutputTokens: 1600
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Gemini request failed with status ${response.status}`);
  }

  return JSON.parse(extractGeminiText(await response.json()));
}

async function postInteraction(payload) {
  if (!configuredApiBaseUrl && !isLocalHost) {
    try {
      return await callGeminiFromBrowser(buildInteractionPrompt(payload));
    } catch (error) {
      console.warn("Browser Gemini mode unavailable, using offline diagnostic:", error);
      return createOfflineResponse(payload.message);
    }
  }

  const response = await fetch(interactionEndpoint, {
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

  return response.json();
}

function sendChatMessageToServer(messageText) {
  const normalizedMessage = String(messageText || "").trim();

  if (!normalizedMessage) {
    return;
  }

  diagnosticTranscript.push({
    role: "user",
    message: normalizedMessage,
    stage: currentSessionStage,
    timestamp: new Date().toISOString()
  });

  sendInteraction({
    message: normalizedMessage,
    session_stage: currentSessionStage,
    transcript: diagnosticTranscript
  });
}

async function sendInteraction(payload) {
  try {
    characterDialogue.textContent = "Processing diagnostic input...";
    const data = await postInteraction(payload);
    hydrateInterface(data);
  } catch (error) {
    hydrateInterface({
      character_dialogue: "The backend path failed. Switching to local diagnostic control.",
      internal_thinking_state: error.message,
      session_stage: currentSessionStage,
      rig_control: {
        expression_flag: "state-melancholy"
      },
      generated_blueprint: null
    });
  }
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

  return `Document metadata only: ${file.name}, ${file.type || "unknown type"}, ${file.size} bytes.`;
}

async function sendScan() {
  const selectedFile = scanInput.files && scanInput.files[0];

  if (!selectedFile) {
    scanStatus.textContent = "Select a document before scanning.";
    return;
  }

  try {
    scanStatus.textContent = `Scanning ${selectedFile.name}...`;
    const preview = await readScanPreview(selectedFile);
    const payload = {
      message: `Document scan: ${selectedFile.name}`,
      document_preview: preview,
      session_stage: currentSessionStage,
      transcript: diagnosticTranscript
    };

    if (!configuredApiBaseUrl && !isLocalHost) {
      try {
        const data = await callGeminiFromBrowser(buildInteractionPrompt(payload));
        hydrateInterface(data);
        scanStatus.textContent = `${selectedFile.name} processed in browser mode.`;
        return;
      } catch (error) {
        console.warn("Browser scan unavailable, using offline diagnostic:", error);
        hydrateInterface(createOfflineResponse(`Scan ${selectedFile.name}. ${preview}`));
        scanStatus.textContent = `${selectedFile.name} processed in offline mode.`;
        return;
      }
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("context", JSON.stringify(payload));

    const response = await fetch(scanEndpoint, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Scan failed with status ${response.status}`);
    }

    hydrateInterface(await response.json());
    scanStatus.textContent = `${selectedFile.name} processed.`;
  } catch (error) {
    scanStatus.textContent = error.message;
    updateCharacterRig("state-melancholy");
  }
}

saveApiKeyButton.addEventListener("click", () => {
  const nextKey = apiKeyInput.value.trim();

  if (nextKey) {
    window.localStorage.setItem("aoi_gemini_api_key", nextKey);
  } else {
    window.localStorage.removeItem("aoi_gemini_api_key");
  }

  updateApiKeyStatus();
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

updateCharacterRig("state-analytical");
updateApiKeyStatus();
renderGoalsHierarchy(null);
renderActiveQuests([]);
renderRewardsShop([]);
renderTimeBlocks([], []);
