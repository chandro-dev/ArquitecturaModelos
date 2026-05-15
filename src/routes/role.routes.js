const express = require("express");
const validate = require("../middlewares/validate");
const { auth, requireAdmin } = require("../middlewares/auth");
const {
  listRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/role.controller");
const {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
} = require("../validators/role.validators");

const router = express.Router();

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Listar todos los roles
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Lista de roles
 */
router.get("/", listRoles);

/**
 * @swagger
 * /roles/{roleId}:
 *   get:
 *     summary: Obtener un rol por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle del rol
 *       404:
 *         description: Rol no encontrado
 */
router.get("/:roleId", validate(roleIdParamSchema), getRoleById);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Crear un nuevo rol (Admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       201:
 *         description: Rol creado
 *       403:
 *         description: No autorizado (requiere admin)
 */
router.post("/", auth, requireAdmin, validate(createRoleSchema), createRole);

/**
 * @swagger
 * /roles/{roleId}:
 *   patch:
 *     summary: Actualizar un rol existente (Admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleInput'
 *     responses:
 *       200:
 *         description: Rol actualizado
 *       403:
 *         description: No autorizado
 */
router.patch("/:roleId", auth, requireAdmin, validate(updateRoleSchema), updateRole);

/**
 * @swagger
 * /roles/{roleId}:
 *   delete:
 *     summary: Eliminar un rol (Admin)
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Rol eliminado
 *       403:
 *         description: No autorizado
 */
router.delete("/:roleId", auth, requireAdmin, validate(roleIdParamSchema), deleteRole);

module.exports = router;
