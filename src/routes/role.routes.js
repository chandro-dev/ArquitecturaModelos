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

router.get("/", listRoles);
router.get("/:roleId", validate(roleIdParamSchema), getRoleById);
router.post("/", auth, requireAdmin, validate(createRoleSchema), createRole);
router.patch("/:roleId", auth, requireAdmin, validate(updateRoleSchema), updateRole);
router.delete("/:roleId", auth, requireAdmin, validate(roleIdParamSchema), deleteRole);

module.exports = router;
