const { GoogleGenerativeAI } = require("@google/generative-ai");
const env = require("../config/env");
const AppError = require("../utils/AppError");

let geminiClient;

const getGeminiClient = () => {
  if (!env.GEMINI_API_KEY) {
    throw new AppError("GEMINI_API_KEY is missing in environment", 500);
  }
  if (!geminiClient) geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return geminiClient;
};

const serializeTranscript = (history) =>
  history
    .map(
      (msg) =>
        `${msg.sender === "ai" ? "ENTREVISTADOR" : "CANDIDATO"}: ${msg.text}`,
    )
    .join("\n");

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
    generalComment: feedback.generalComment
      ? String(feedback.generalComment)
      : "",
  };
};

const parseFeedbackFromText = (text) => {
  try {
    return normalizeFeedback(JSON.parse(text));
  } catch (_error) {
    const maybeJson = extractJsonObject(text);
    if (!maybeJson)
      throw new AppError("AI feedback response is not valid JSON", 502);
    return normalizeFeedback(JSON.parse(maybeJson));
  }
};

const generateReplyWithGemini = async ({
  systemInstruction,
  history,
  roleTitle,
  difficulty,
}) => {
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

const generateFeedbackWithGemini = async ({
  systemInstruction,
  history,
  roleTitle,
  difficulty,
}) => {
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

const generateInterviewReply = async ({
  systemInstruction,
  history,
  roleTitle,
  difficulty,
}) => {
  return generateReplyWithGemini({
    systemInstruction,
    history,
    roleTitle,
    difficulty,
  });
};

const generateInterviewFeedback = async ({
  systemInstruction,
  history,
  roleTitle,
  difficulty,
}) => {
  return generateFeedbackWithGemini({
    systemInstruction,
    history,
    roleTitle,
    difficulty,
  });
};

module.exports = {
  generateInterviewReply,
  generateInterviewFeedback,
};
