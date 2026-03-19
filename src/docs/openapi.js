const env = require("../config/env");

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Interview Role-Play Simulator API",
    version: "1.0.0",
    description:
      "API backend para simulador de entrevistas con IA. Incluye autenticacion, catalogo de roles, prompts y sesiones de entrevista con feedback.",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: "Local development",
    },
  ],
  tags: [
    { name: "Health", description: "Estado del servicio" },
    { name: "Auth", description: "Registro, login y perfil" },
    { name: "Roles", description: "Catalogo de perfiles de puesto" },
    { name: "Prompts", description: "Instrucciones del entrevistador IA" },
    { name: "Interviews", description: "Motor de entrevistas y progreso" },
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
          details: {
            type: "array",
            items: { type: "string" },
            example: ["name is required"],
          },
        },
      },
      Preferences: {
        type: "object",
        properties: {
          preferredMode: { type: "string", enum: ["text", "voice"] },
          theme: { type: "string", enum: ["light", "dark", "system"] },
        },
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string", example: "69b84bf1e8156a1e55e12dcc" },
          name: { type: "string", example: "Ana Gomez" },
          email: { type: "string", format: "email", example: "ana@test.com" },
          preferences: { $ref: "#/components/schemas/Preferences" },
          isAdmin: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Login successful" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Role: {
        type: "object",
        properties: {
          _id: { type: "string", example: "69b84a31e8156a1e55e12db1" },
          title: { type: "string", example: "Desarrollador Junior" },
          description: { type: "string" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["Frontend", "React", "Remoto"],
          },
          difficulty: { type: "string", enum: ["Fácil", "Intermedio", "Difícil"] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Prompt: {
        type: "object",
        properties: {
          _id: { type: "string" },
          roleId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Role" }] },
          systemInstruction: { type: "string" },
          firstMessage: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Message: {
        type: "object",
        properties: {
          sender: { type: "string", enum: ["user", "ai"] },
          text: { type: "string" },
          timestamp: { type: "string", format: "date-time" },
          audioUrl: { type: "string", nullable: true },
        },
      },
      Feedback: {
        type: "object",
        properties: {
          technicalScore: { type: "number", minimum: 0, maximum: 100 },
          softSkillsScore: { type: "number", minimum: 0, maximum: 100 },
          overallScore: { type: "number", minimum: 0, maximum: 100 },
          strengths: { type: "array", items: { type: "string" } },
          improvements: { type: "array", items: { type: "string" } },
          generalComment: { type: "string" },
        },
      },
      Interview: {
        type: "object",
        properties: {
          _id: { type: "string", example: "69b84c53e8156a1e55e12dcf" },
          userId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/User" }] },
          roleId: { oneOf: [{ type: "string" }, { $ref: "#/components/schemas/Role" }] },
          status: { type: "string", enum: ["in_progress", "completed"] },
          mode: { type: "string", enum: ["text", "voice"] },
          messages: { type: "array", items: { $ref: "#/components/schemas/Message" } },
          feedback: { allOf: [{ $ref: "#/components/schemas/Feedback" }], nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      StartInterviewRequest: {
        type: "object",
        required: ["roleId"],
        properties: {
          roleId: { type: "string", example: "69b84a31e8156a1e55e12db1" },
          mode: { type: "string", enum: ["text", "voice"] },
        },
      },
      SendMessageRequest: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string", example: "He trabajado en un e-commerce con Node.js." },
        },
      },
      CompleteInterviewResponse: {
        allOf: [{ $ref: "#/components/schemas/Interview" }],
      },
      PaginatedInterviews: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/Interview" },
          },
          pagination: {
            type: "object",
            properties: {
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 10 },
              total: { type: "integer", example: 25 },
              totalPages: { type: "integer", example: 3 },
            },
          },
        },
      },
      ProgressResponse: {
        type: "object",
        properties: {
          summary: {
            type: "object",
            properties: {
              totalInterviews: { type: "integer" },
              avgTechnicalScore: { type: "number" },
              avgSoftSkillsScore: { type: "number" },
              avgOverallScore: { type: "number" },
            },
          },
          recent: {
            type: "array",
            items: {
              type: "object",
              properties: {
                interviewId: { type: "string" },
                roleTitle: { type: "string" },
                technicalScore: { type: "number", nullable: true },
                softSkillsScore: { type: "number", nullable: true },
                overallScore: { type: "number", nullable: true },
                completedAt: { type: "string", format: "date-time" },
              },
            },
          },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Healthcheck",
        responses: {
          200: {
            description: "Servicio operativo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    service: { type: "string", example: "interview-backend" },
                  },
                },
              },
            },
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
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Ana Gomez" },
                  email: { type: "string", format: "email", example: "ana@test.com" },
                  password: { type: "string", minLength: 8, example: "StrongPass123!" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          409: { description: "Email duplicado" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "ana@test.com" },
                  password: { type: "string", example: "StrongPass123!" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Sesion iniciada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: { description: "Credenciales invalidas" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Perfil del usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Perfil",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me/preferences": {
      patch: {
        tags: ["Auth"],
        summary: "Actualizar preferencias",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Preferences" },
            },
          },
        },
        responses: {
          200: { description: "Preferencias actualizadas" },
        },
      },
    },
    "/api/roles": {
      get: {
        tags: ["Roles"],
        summary: "Listar roles",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "tag", in: "query", schema: { type: "string" } },
          {
            name: "difficulty",
            in: "query",
            schema: { type: "string", enum: ["Fácil", "Intermedio", "Difícil"] },
          },
        ],
        responses: {
          200: {
            description: "Roles disponibles",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Role" },
                    },
                  },
                },
              },
            },
          },
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
              schema: {
                type: "object",
                required: ["title", "description", "difficulty"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  difficulty: { type: "string", enum: ["Fácil", "Intermedio", "Difícil"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Rol creado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } },
          },
          403: { description: "Requiere admin" },
        },
      },
    },
    "/api/roles/{roleId}": {
      get: {
        tags: ["Roles"],
        summary: "Obtener rol por ID",
        parameters: [
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Rol",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } },
          },
          404: { description: "No encontrado" },
        },
      },
      patch: {
        tags: ["Roles"],
        summary: "Actualizar rol (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  difficulty: { type: "string", enum: ["Fácil", "Intermedio", "Difícil"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Rol actualizado",
            content: { "application/json": { schema: { $ref: "#/components/schemas/Role" } } },
          },
        },
      },
      delete: {
        tags: ["Roles"],
        summary: "Eliminar rol (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          204: { description: "Eliminado" },
        },
      },
    },
    "/api/prompts/{roleId}": {
      get: {
        tags: ["Prompts"],
        summary: "Obtener prompt por roleId (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Prompt",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Prompt" } },
            },
          },
        },
      },
      put: {
        tags: ["Prompts"],
        summary: "Crear/actualizar prompt por roleId (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "roleId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["systemInstruction", "firstMessage"],
                properties: {
                  systemInstruction: { type: "string" },
                  firstMessage: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Prompt actualizado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Prompt" } },
            },
          },
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
              schema: { $ref: "#/components/schemas/StartInterviewRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Entrevista iniciada",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Interview" } },
            },
          },
        },
      },
    },
    "/api/interviews/{interviewId}": {
      get: {
        tags: ["Interviews"],
        summary: "Obtener entrevista por ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "interviewId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Entrevista",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/Interview" } },
            },
          },
        },
      },
    },
    "/api/interviews/{interviewId}/message": {
      post: {
        tags: ["Interviews"],
        summary: "Enviar mensaje y recibir respuesta IA",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "interviewId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendMessageRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Respuesta IA generada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    interviewId: { type: "string" },
                    status: { type: "string", enum: ["in_progress", "completed"] },
                    aiMessage: { type: "string" },
                    messagesCount: { type: "integer" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/interviews/{interviewId}/complete": {
      post: {
        tags: ["Interviews"],
        summary: "Finalizar entrevista y generar feedback",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "interviewId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Entrevista completada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CompleteInterviewResponse" },
              },
            },
          },
        },
      },
    },
    "/api/interviews/me/history": {
      get: {
        tags: ["Interviews"],
        summary: "Historial de entrevistas del usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["in_progress", "completed"] },
          },
        ],
        responses: {
          200: {
            description: "Lista paginada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedInterviews" },
              },
            },
          },
        },
      },
    },
    "/api/interviews/me/progress": {
      get: {
        tags: ["Interviews"],
        summary: "Metricas de progreso del usuario",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Resumen de progreso",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProgressResponse" },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = openApiSpec;
