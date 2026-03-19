# Interview Role-Play Simulator Backend

Backend profesional en `Node.js + Express + MongoDB` para simular entrevistas de trabajo con IA (OpenAI o Gemini), guardar historial y calcular retroalimentación detallada.

## Stack

- Express 5
- Mongoose (MongoDB Atlas)
- JWT + bcrypt (autenticación)
- Zod (validación de payloads)
- OpenAI / Gemini (proveedor IA configurable)

## Estructura

```txt
src/
  app.js
  server.js
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  validators/
  scripts/
```

## Configuración

1. Copiar variables:

```bash
cp .env.example .env
```

2. Ajustar `.env`:

- `MONGODB_URI` (ya incluye tu conexión)
- `MONGODB_DB_NAME=interviewapp`
- `JWT_SECRET` largo y seguro
- `AI_PROVIDER=openai` o `AI_PROVIDER=gemini`
- API Key según proveedor elegido

## Ejecución

```bash
npm install
npm run dev
```

Servidor: `http://localhost:4000`

Healthcheck: `GET /api/health`

## Seed inicial (roles + prompts)

```bash
npm run seed
```

## Endpoints principales

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/me/preferences`

### Roles

- `GET /api/roles`
- `GET /api/roles/:roleId`
- `POST /api/roles` (admin)
- `PATCH /api/roles/:roleId` (admin)
- `DELETE /api/roles/:roleId` (admin)

### Prompts

- `GET /api/prompts/:roleId` (admin)
- `PUT /api/prompts/:roleId` (admin)

### Interviews

- `POST /api/interviews/start`
- `POST /api/interviews/:interviewId/message`
- `POST /api/interviews/:interviewId/complete`
- `GET /api/interviews/:interviewId`
- `GET /api/interviews/me/history?page=1&limit=10&status=completed`
- `GET /api/interviews/me/progress`

## Estructura de feedback guardada

```json
{
  "technicalScore": 75,
  "softSkillsScore": 85,
  "overallScore": 80,
  "strengths": ["..."],
  "improvements": ["..."],
  "generalComment": "..."
}
```

## Notas de seguridad

- No expongas API Keys en Angular; solo en backend.
- Rotar credenciales si fueron compartidas en texto plano.
- Para operar como admin, marca `isAdmin: true` en el usuario en MongoDB.
