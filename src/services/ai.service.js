const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");
const AppError = require("../utils/AppError");

let openaiClient;
let geminiClient;

const getOpenAIClient = () => {
  if (!env.OPENAI_API_KEY) {
    throw new AppError("OPENAI_API_KEY is missing in environment", 500);
  }
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openaiClient;
};

const getGeminiClient = () => {
  if (!env.GEMINI_API_KEY) {
    throw new AppError("GEMINI_API_KEY is missing in environment", 500);
  }
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return geminiClient;
};

const serializeTranscript = (history) =>
  history
    .map((msg) => `${msg.sender === "ai" ? "ENTREVISTADOR" : "CANDIDATO"}: ${msg.text}`)
    .join("\n");

const toOpenAIMessages = (systemInstruction, history) => {
  const messages = [{ role: "system", content: systemInstruction }];
  for (const msg of history) {
    messages.push({
      role: msg.sender === "ai" ? "assistant" : "user",
      content: msg.text,
    });
  }
  return messages;
};

const clampScore = (value) => Math.max(0, Math.min(100, Number(value) || 0));

const extractJsonObject = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
};

const normalizeFeedback = (feedback) => {
  const technicalScore = clampScore(feedback.technicalScore);
  const softSkillsScore = clampScore(feedback.softSkillsScore);
  const overallScore =
    feedback.overallScore !== undefined
      ? clampScore(feedback.overallScore)
      : Math.round((technicalScore + softSkillsScore) / 2);

  return {
    technicalScore,
    softSkillsScore,
    overallScore,
    strengths: Array.isArray(feedback.strengths)
      ? feedback.strengths.filter(Boolean).map(String).slice(0, 10)
      : [],
    improvements: Array.isArray(feedback.improvements)
      ? feedback.improvements.filter(Boolean).map(String).slice(0, 10)
      : [],
    generalComment: feedback.generalComment ? String(feedback.generalComment) : "",
  };
};

const parseFeedbackFromText = (text) => {
  try {
    return normalizeFeedback(JSON.parse(text));
  } catch (_error) {
    const maybeJson = extractJsonObject(text);
    if (!maybeJson) throw new AppError("AI feedback response is not valid JSON", 502);
    return normalizeFeedback(JSON.parse(maybeJson));
  }
};

const generateReplyWithOpenAI = async ({ systemInstruction, history }) => {
  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.7,
    messages: toOpenAIMessages(systemInstruction, history),
  });

  const answer = completion.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new AppError("OpenAI returned empty response", 502);
  return answer;
};

const generateReplyWithGemini = async ({ systemInstruction, history, roleTitle, difficulty }) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction,
  });

  const transcript = serializeTranscript(history);
  const prompt = [
    `Rol de entrevista: ${roleTitle}`,
    `Dificultad esperada: ${difficulty}`,
    "Continua la entrevista con una sola pregunta o repregunta.",
    "Mantén tono profesional y natural, sin explicar que eres una IA.",
    "",
    "Transcripción hasta ahora:",
    transcript || "Aún no hay mensajes.",
  ].join("\n");

  const result = await model.generateContent(prompt);
  const answer = result.response.text().trim();
  if (!answer) throw new AppError("Gemini returned empty response", 502);
  return answer;
};

const generateFeedbackWithOpenAI = async ({ systemInstruction, history, roleTitle, difficulty }) => {
  const client = getOpenAIClient();
  const transcript = serializeTranscript(history);

  const completion = await client.chat.completions.create({
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `${systemInstruction}

Evalúa el desempeño del candidato en una entrevista de trabajo para ${roleTitle} (${difficulty}).
Responde únicamente JSON válido con esta estructura:
{
  "technicalScore": 0-100,
  "softSkillsScore": 0-100,
  "overallScore": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "generalComment": "..."
}
`,
      },
      {
        role: "user",
        content: `Transcripción de la entrevista:\n${transcript}`,
      },
    ],
  });

  const raw = completion.choices?.[0]?.message?.content?.trim();
  if (!raw) throw new AppError("OpenAI returned empty feedback", 502);
  return parseFeedbackFromText(raw);
};

const generateFeedbackWithGemini = async ({ systemInstruction, history, roleTitle, difficulty }) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction,
  });

  const transcript = serializeTranscript(history);
  const prompt = [
    `Evalúa esta entrevista para el rol ${roleTitle} con nivel ${difficulty}.`,
    "Devuelve solo JSON válido sin markdown ni texto adicional.",
    "Estructura requerida:",
    '{ "technicalScore": number, "softSkillsScore": number, "overallScore": number, "strengths": string[], "improvements": string[], "generalComment": string }',
    "",
    "Transcripción:",
    transcript,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const raw = result.response.text().trim();
  if (!raw) throw new AppError("Gemini returned empty feedback", 502);
  return parseFeedbackFromText(raw);
};

const generateInterviewReply = async ({ systemInstruction, history, roleTitle, difficulty }) => {
  if (env.AI_PROVIDER === "openai") {
    return generateReplyWithOpenAI({ systemInstruction, history });
  }
  return generateReplyWithGemini({ systemInstruction, history, roleTitle, difficulty });
};

const generateInterviewFeedback = async ({ systemInstruction, history, roleTitle, difficulty }) => {
  if (env.AI_PROVIDER === "openai") {
    return generateFeedbackWithOpenAI({ systemInstruction, history, roleTitle, difficulty });
  }
  return generateFeedbackWithGemini({ systemInstruction, history, roleTitle, difficulty });
};

module.exports = {
  generateInterviewReply,
  generateInterviewFeedback,
};
