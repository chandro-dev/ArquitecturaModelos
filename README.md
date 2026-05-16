# 🧠 Interview AI - Backend Studio Inteligente

Bienvenido al núcleo de **Interview AI**, una plataforma de simulación de entrevistas de alto rendimiento impulsada por Inteligencia Artificial (Google Gemini). Este backend está diseñado bajo una arquitectura robusta, escalable y orientada a la gamificación del aprendizaje profesional.

---

## 🏛️ Arquitectura del Sistema

El proyecto sigue un patrón de **Capas (Layered Architecture)** para asegurar la separación de responsabilidades:

1.  **Routes**: Definición de endpoints y orquestación de middlewares.
2.  **Controllers**: Manejo de peticiones HTTP, validación de entrada (Zod) y gestión de respuestas.
3.  **Services**: Capa de lógica de negocio pura. Aquí reside la integración con Gemini AI y el motor de gamificación.
4.  **Models**: Esquemas de datos persistentes usando Mongoose (MongoDB).
5.  **Utils/Middlewares**: Funciones compartidas (JWT, Error Handling, Auth).

---

## 🛠️ Stack Tecnológico

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Base de Datos**: MongoDB (Mongoose ODM)
- **IA Engine**: Google Generative AI (Gemini Pro)
- **Seguridad**: JWT (JSON Web Tokens) & BcryptJS
- **Validación**: Zod
- **Documentación**: Swagger UI

---

## 📊 Modelo de Datos (Esquemas Principales)

### 👤 User
Gestiona la identidad y el progreso del candidato.
- **Identidad**: Email (unique), Password (hashed).
- **Gamificación**: 
  - `xp`: Puntos de experiencia acumulados.
  - `level`: Rango actual (Junior a Staff Engineer).
- **Misiones**: 
  - `dailyTasks`: Objetivos automáticos basados en desempeño.
  - `studyMissions`: Ruta de aprendizaje técnica generada por IA.

### 📝 Interview
Almacena las sesiones de práctica.
- **Messages**: Historial de chat con metadatos de `sentiment` (Confianza, Tono).
- **Feedback**: Análisis técnico, Soft Skills y `sentimentSummary`.
- **Status**: pending, completed.

### 🎭 Role
Roles predefinidos para las entrevistas (ej: React Developer, Backend Engineer).

<<<<<<< HEAD
Healthcheck: `GET /api/health`
OpenAPI JSON: `GET /api/openapi.json`
Swagger UI: `GET /api-docs`
=======
---
>>>>>>> 283628565f4cd912a623475139c8e17cb7559932

## 🚀 Funcionalidades Core

### 1. Motor de Entrevista Adaptativo
Utiliza Gemini AI para generar preguntas contextuales basadas en el Job Description (JD) o el Rol seleccionado. Procesa respuestas en tiempo real.

### 2. Análisis de Sentimiento (Real-time)
Cada respuesta del usuario es analizada para detectar:
- **Nivel de Confianza** (0-100%).
- **Tono Emocional** (Seguro, Dudoso, Nervioso).

### 3. Sistema de Gamificación
- **XP**: Se otorga por cada mensaje enviado y por completar entrevistas con buen puntaje.
- **Misiones Diarias**: Tareas generadas por IA que desafían al usuario a mejorar sus debilidades.
- **Learning Path**: Temas técnicos sugeridos que el usuario marca manualmente al dominarlos.

---

## 🛣️ API Endpoints (Resumen)

### Auth & User
- `POST /api/auth/register`: Registro de nuevos talentos.
- `POST /api/auth/login`: Autenticación y generación de tareas.
- `GET /api/auth/me`: Perfil completo con XP y misiones.
- `PATCH /api/auth/missions/:id/toggle`: Marcar tema técnico como aprendido.
- `POST /api/auth/missions/refresh`: Regenerar plan de estudio con IA.

### Interviews
- `POST /api/interviews/start`: Iniciar nueva sesión.
- `POST /api/interviews/:id/message`: Enviar respuesta y recibir feedback emocional.
- `POST /api/interviews/:id/complete`: Finalizar y recibir reporte detallado.
- `GET /api/interviews/me/history`: Historial de desempeño.

---

<<<<<<< HEAD
## Swagger / OpenAPI

- Toda la documentacion esta en Swagger UI: `http://localhost:4000/api-docs`
- Especificacion consumible por herramientas: `http://localhost:4000/api/openapi.json`
- Desde Swagger puedes:
  - Probar endpoints directamente.
  - Configurar `Authorize` con `Bearer <JWT>`.
  - Validar contratos request/response para Angular.

## Estructura de feedback guardada
=======
## ⚙️ Configuración del Entorno (.env)
>>>>>>> 283628565f4cd912a623475139c8e17cb7559932

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/interviewapp
JWT_SECRET=tu_secreto_super_seguro
GEMINI_API_KEY=tu_google_gemini_key
GEMINI_MODEL=gemini-1.5-pro
```

---

## 📈 Próximos Pasos
- [ ] Implementación de WebSockets para feedback emocional instantáneo.
- [ ] Integración de Speech-to-Text (STT) para entrevistas por voz.
- [ ] Sistema de Medallas (Achievements) persistente.

---
*Desarrollado con ❤️ para la nueva generación de ingenieros.*
