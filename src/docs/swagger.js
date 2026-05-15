const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Interview Role-Play Simulator API",
      version: "1.0.0",
      description:
        "API para autenticación, gestión de roles/prompts y simulación de entrevistas con IA.",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local",
      },
    ],
    tags: [
      { name: "Health" },
      { name: "Auth" },
      { name: "Roles" },
      { name: "Prompts" },
      { name: "Interviews" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Validation error" },
          },
        },
        RegisterInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8, maxLength: 72 },
          },
        },
        LoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        PreferencesInput: {
          type: "object",
          properties: {
            preferredMode: { type: "string", enum: ["text", "voice"] },
            theme: { type: "string", enum: ["light", "dark", "system"] },
          },
        },
        RoleInput: {
          type: "object",
          required: ["title", "description", "difficulty"],
          properties: {
            title: { type: "string", minLength: 2, maxLength: 140 },
            description: { type: "string", minLength: 10, maxLength: 1200 },
            tags: {
              type: "array",
              items: { type: "string", minLength: 1, maxLength: 40 },
            },
            difficulty: {
              type: "string",
              enum: ["Fácil", "Intermedio", "Difícil"],
            },
          },
        },
        UpsertPromptInput: {
          type: "object",
          required: ["systemInstruction", "firstMessage"],
          properties: {
            systemInstruction: {
              type: "string",
              minLength: 30,
              maxLength: 8000,
            },
            firstMessage: { type: "string", minLength: 10, maxLength: 1500 },
          },
        },
        StartInterviewInput: {
          type: "object",
          required: ["roleId"],
          properties: {
            roleId: { type: "string", minLength: 24, maxLength: 24 },
            mode: { type: "string", enum: ["text", "voice"] },
          },
        },
        SendMessageInput: {
          type: "object",
          required: ["text"],
          properties: {
            text: { type: "string", minLength: 1, maxLength: 4000 },
          },
        },
      },
    },
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Servicio activo",
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registrar usuario",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterInput" },
              },
            },
          },
          responses: {
            201: { description: "Usuario registrado" },
            400: {
              description: "Payload inválido",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Iniciar sesión",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginInput" },
              },
            },
          },
          responses: {
            200: { description: "Login exitoso" },
            401: { description: "Credenciales inválidas" },
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Perfil del usuario autenticado",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Perfil obtenido" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/api/auth/me/preferences": {
        patch: {
          tags: ["Auth"],
          summary: "Actualizar preferencias del usuario",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PreferencesInput" },
              },
            },
          },
          responses: {
            200: { description: "Preferencias actualizadas" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/api/auth/missions/{missionId}/toggle": {
        patch: {
          tags: ["Auth"],
          summary: "Alternar estado de una misión técnica",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "missionId",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Estado de misión actualizado" },
            401: { description: "No autorizado" },
            404: { description: "Misión no encontrada" },
          },
        },
      },
      "/api/auth/missions/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Regenerar misiones y plan de estudio con IA",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Misiones regeneradas exitosamente" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/api/roles": {
        get: {
          tags: ["Roles"],
          summary: "Listar roles",
          responses: {
            200: { description: "Listado obtenido" },
          },
        },
        post: {
          tags: ["Roles"],
          summary: "Crear rol (admin)",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoleInput" },
              },
            },
          },
          responses: {
            201: { description: "Rol creado" },
            403: { description: "Acceso admin requerido" },
          },
        },
      },
      "/api/roles/{roleId}": {
        get: {
          tags: ["Roles"],
          summary: "Obtener rol por id",
          parameters: [
            {
              in: "path",
              name: "roleId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          responses: {
            200: { description: "Rol encontrado" },
            404: { description: "Rol no encontrado" },
          },
        },
        patch: {
          tags: ["Roles"],
          summary: "Actualizar rol (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "roleId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RoleInput" },
              },
            },
          },
          responses: {
            200: { description: "Rol actualizado" },
            403: { description: "Acceso admin requerido" },
          },
        },
        delete: {
          tags: ["Roles"],
          summary: "Eliminar rol (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "roleId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          responses: {
            204: { description: "Rol eliminado" },
            403: { description: "Acceso admin requerido" },
          },
        },
      },
      "/api/prompts/{roleId}": {
        get: {
          tags: ["Prompts"],
          summary: "Obtener prompt de un rol (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "roleId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          responses: {
            200: { description: "Prompt obtenido" },
            403: { description: "Acceso admin requerido" },
          },
        },
        put: {
          tags: ["Prompts"],
          summary: "Crear/actualizar prompt de rol (admin)",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "roleId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpsertPromptInput" },
              },
            },
          },
          responses: {
            200: { description: "Prompt guardado" },
            403: { description: "Acceso admin requerido" },
          },
        },
      },
      "/api/interviews/start": {
        post: {
          tags: ["Interviews"],
          summary: "Iniciar entrevista",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StartInterviewInput" },
              },
            },
          },
          responses: {
            201: { description: "Entrevista iniciada" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/api/interviews/me/history": {
        get: {
          tags: ["Interviews"],
          summary: "Historial del usuario",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "page",
              schema: { type: "integer", minimum: 1, default: 1 },
            },
            {
              in: "query",
              name: "limit",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
            },
            {
              in: "query",
              name: "status",
              schema: { type: "string", enum: ["in_progress", "completed"] },
            },
          ],
          responses: {
            200: { description: "Historial obtenido" },
          },
        },
      },
      "/api/interviews/me/progress": {
        get: {
          tags: ["Interviews"],
          summary: "Métricas de progreso del usuario",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Progreso obtenido" },
          },
        },
      },
      "/api/interviews/{interviewId}": {
        get: {
          tags: ["Interviews"],
          summary: "Detalle de entrevista",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "interviewId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          responses: {
            200: { description: "Entrevista encontrada" },
            404: { description: "Entrevista no encontrada" },
          },
        },
      },
      "/api/interviews/{interviewId}/message": {
        post: {
          tags: ["Interviews"],
          summary: "Enviar mensaje a la entrevista",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "interviewId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SendMessageInput" },
              },
            },
          },
          responses: {
            200: { description: "Mensaje procesado" },
          },
        },
      },
      "/api/interviews/{interviewId}/complete": {
        post: {
          tags: ["Interviews"],
          summary: "Finalizar entrevista y calcular feedback",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "interviewId",
              required: true,
              schema: { type: "string", minLength: 24, maxLength: 24 },
            },
          ],
          responses: {
            200: { description: "Entrevista completada" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
