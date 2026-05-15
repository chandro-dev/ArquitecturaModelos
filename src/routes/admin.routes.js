const express = require("express");
const { auth, requireAdmin } = require("../middlewares/auth");
const { getGlobalStats, listUsers, listAllInterviews } = require("../controllers/admin.controller");

const router = express.Router();

// Todas las rutas requieren autenticación y rol de administrador
router.use(auth);
router.use(requireAdmin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Obtener estadísticas globales (Solo Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/stats", getGlobalStats);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Listar todos los usuarios (Solo Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/users", listUsers);

/**
 * @swagger
 * /admin/interviews:
 *   get:
 *     summary: Listar todas las entrevistas de la plataforma (Solo Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/interviews", listAllInterviews);

module.exports = router;
