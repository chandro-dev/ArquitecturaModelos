const express = require("express");
const validate = require("../middlewares/validate");
const { auth } = require("../middlewares/auth");
const { register, login, me, updatePreferences, toggleMission, refreshMissions } = require("../controllers/auth.controller");
const {
  registerSchema,
  loginSchema,
  updatePreferencesSchema,
} = require("../validators/auth.validators");

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Error de validación
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
router.get("/me", auth, me);

/**
 * @swagger
 * /auth/me/preferences:
 *   patch:
 *     summary: Actualizar preferencias del usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PreferencesInput'
 *     responses:
 *       200:
 *         description: Preferencias actualizadas
 *       401:
 *         description: No autorizado
 */
router.patch("/me/preferences", auth, validate(updatePreferencesSchema), updatePreferences);
router.patch("/missions/:missionId/toggle", auth, toggleMission);
router.post("/missions/refresh", auth, refreshMissions);

module.exports = router;
