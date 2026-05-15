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

const generateSystemInstructionForJD = (jd, companyName) => {
  return [
    `Eres un reclutador experto para la empresa ${companyName || "una empresa líder"}.`,
    "Tu objetivo es realizar una entrevista técnica y conductual basada en la siguiente Descripción de Puesto (JD):",
    "---",
    jd,
    "---",
    "Instrucciones:",
    "1. Sé profesional pero natural.",
    "2. Haz preguntas de una en una.",
    "3. Si el candidato da respuestas vagas, repregunta para profundizar.",
    "4. Evalúa tanto conocimientos técnicos como ajuste cultural.",
  ].join("\n");
};

const generateInitialMessageForJD = async (jd, companyName) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: generateSystemInstructionForJD(jd, companyName),
  });

  const prompt = "Genera un mensaje inicial de bienvenida para el candidato, presentándote y mencionando brevemente el puesto basado en el JD. Sé directo y profesional.";
  
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

const generateSentimentAnalysis = async (userText) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: "Eres un psicólogo experto en comunicación no verbal y análisis de discurso para procesos de reclutamiento."
  });

  const prompt = [
    "Analiza el sentimiento y tono de la siguiente respuesta de un candidato en una entrevista.",
    "Devuelve solo JSON válido.",
    "Estructura:",
    '{ "label": "Seguro|Dudoso|Nervioso|Neutral", "score": 0-100, "tone": "string breve" }',
    "",
    `Respuesta: "${userText}"`
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = extractJsonObject(raw);
    return JSON.parse(jsonStr || raw);
  } catch (_error) {
    return { label: "Neutral", score: 50, tone: "Análisis no disponible" };
  }
};

const generateSentimentSummary = async (history) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: "Analista de comportamiento profesional."
  });

  const transcript = serializeTranscript(history);
  const prompt = [
    "Basado en la siguiente entrevista, genera un resumen emocional del candidato.",
    "Devuelve solo JSON válido.",
    "Estructura:",
    '{ "predominantEmotion": "string", "confidenceAverage": 0-100, "emotionalEvolution": number[] (lista de scores de confianza por cada mensaje del usuario) }',
    "",
    "Transcripción:",
    transcript
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = extractJsonObject(raw);
    return JSON.parse(jsonStr || raw);
  } catch (_error) {
    return { predominantEmotion: "Neutral", confidenceAverage: 50, emotionalEvolution: [] };
  }
};

const generateMissionsWithAI = async (history, preferences) => {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: env.GEMINI_MODEL,
    systemInstruction: "Eres un coach de carrera experto que genera misiones diarias para mejorar habilidades de entrevista."
  });

  const transcript = history && history.length > 0 ? serializeTranscript(history) : "Sin entrevistas previas.";
  const prompt = [
    "Basado en este historial de entrevistas y preferencias, genera un paquete de crecimiento profesional.",
    `Preferencias: ${JSON.stringify(preferences)}`,
    "Devuelve solo JSON válido.",
    "Estructura:",
    "{",
    '  "dailyTasks": [ { "description": "string", "type": "score_technical|score_confidence|count", "targetValue": number, "xpReward": number, "category": "string" } ],',
    '  "studyPlan": [ { "topic": "string", "description": "string", "xpReward": number } ]',
    "}",
    "",
    "Historial:",
    transcript
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = extractJsonObject(raw);
    const data = JSON.parse(jsonStr || raw);
    
    // Ensure we have the right structure
    return {
      dailyTasks: data.dailyTasks || [],
      studyPlan: data.studyPlan || []
    };
  } catch (_error) {
    // Fallback static missions if AI fails
    return {
      dailyTasks: [
        { description: "Completa una entrevista técnica", type: "count", targetValue: 1, xpReward: 100, category: "Básico" }
      ],
      studyPlan: [
        { topic: "Optimización de React", description: "Estudia el uso de useMemo y useCallback para mejorar el rendimiento.", xpReward: 100 }
      ]
    };
  }
};

module.exports = {
  generateInterviewReply,
  generateInterviewFeedback,
  generateSystemInstructionForJD,
  generateInitialMessageForJD,
  generateSentimentAnalysis,
  generateSentimentSummary,
  generateMissionsWithAI,
};
