const express = require("express");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const {
  start,
  startCustom,
  sendMessage,
  complete,
  byId,
  myInterviews,
  myProgress,
} = require("../controllers/interview.controller");
const {
  startInterviewSchema,
  startCustomInterviewSchema,
  sendMessageSchema,
  completeInterviewSchema,
  interviewIdParamSchema,
  listInterviewsSchema,
} = require("../validators/interview.validators");

const router = express.Router();

router.use(auth);

/**
 * @swagger
 * /interviews/start:
 *   post:
 *     summary: Iniciar una nueva sesión de entrevista estándar
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartInterviewInput'
 *     responses:
 *       201:
 *         description: Entrevista iniciada
 */
router.post("/start", validate(startInterviewSchema), start);

/**
 * @swagger
 * /interviews/start-custom:
 *   post:
 *     summary: Iniciar una sesión de entrevista basada en un Job Description (JD)
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customJD]
 *             properties:
 *               customJD:
 *                 type: string
 *                 description: El texto descriptivo del puesto vacante
 *               companyName:
 *                 type: string
 *                 description: Nombre de la empresa (opcional)
 *               mode:
 *                 type: string
 *                 enum: [text, voice]
 *     responses:
 *       201:
 *         description: Entrevista personalizada iniciada
 */
router.post("/start-custom", validate(startCustomInterviewSchema), startCustom);

/**
 * @swagger
 * /interviews/me/history:
 *   get:
 *     summary: Obtener historial de entrevistas del usuario
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historial de entrevistas
 */
router.get("/me/history", validate(listInterviewsSchema), myInterviews);

/**
 * @swagger
 * /interviews/me/progress:
 *   get:
 *     summary: Obtener métricas de progreso del usuario
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas de progreso
 */
router.get("/me/progress", myProgress);

/**
 * @swagger
 * /interviews/{interviewId}:
 *   get:
 *     summary: Obtener detalle de una entrevista específica
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la entrevista
 */
router.get("/:interviewId", validate(interviewIdParamSchema), byId);

/**
 * @swagger
 * /interviews/{interviewId}/message:
 *   post:
 *     summary: Enviar un mensaje durante la entrevista
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageInput'
 *     responses:
 *       200:
 *         description: Respuesta de la IA
 */
router.post("/:interviewId/message", validate(sendMessageSchema), sendMessage);

/**
 * @swagger
 * /interviews/{interviewId}/complete:
 *   post:
 *     summary: Finalizar la entrevista y obtener retroalimentación
 *     tags: [Interviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: interviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entrevista completada y calificada
 */
router.post("/:interviewId/complete", validate(completeInterviewSchema), complete);

module.exports = router;
