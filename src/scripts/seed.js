const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Role = require("../models/Role");
const Prompt = require("../models/Prompt");

const seedData = [
  {
    role: {
      title: "Desarrollador Junior",
      description:
        "Perfil enfocado en fundamentos de programación, resolución de problemas y buenas prácticas básicas de desarrollo.",
      tags: ["Frontend", "Backend", "JavaScript", "Remoto"],
      difficulty: "Fácil",
    },
    prompt: {
      systemInstruction:
        "Eres un entrevistador técnico senior. Realiza una entrevista estructurada, amable pero exigente. Debes hacer preguntas claras, repreguntar cuando haga falta, y mantener foco en fundamentos técnicos y comunicación.",
      firstMessage:
        "Hola, bienvenido a la entrevista para Desarrollador Junior. Para empezar, cuéntame brevemente sobre ti y tu experiencia en programación.",
    },
  },
  {
    role: {
      title: "Gerente de Ventas",
      description:
        "Rol orientado a liderazgo comercial, negociación, forecast y manejo de equipos de alto rendimiento.",
      tags: ["Ventas", "Liderazgo", "B2B", "Presencial"],
      difficulty: "Intermedio",
    },
    prompt: {
      systemInstruction:
        "Eres un Head of Sales entrevistando un candidato para Gerente de Ventas. Evalúa estrategia comercial, liderazgo, gestión de pipeline y comunicación ejecutiva.",
      firstMessage:
        "Hola, gracias por postularte al puesto de Gerente de Ventas. ¿Puedes contarme tu enfoque para construir un pipeline saludable?",
    },
  },
];

const run = async () => {
  await connectDB();

  for (const item of seedData) {
    const role = await Role.findOneAndUpdate({ title: item.role.title }, item.role, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
      runValidators: true,
    });

    await Prompt.findOneAndUpdate(
      { roleId: role._id },
      {
        roleId: role._id,
        systemInstruction: item.prompt.systemInstruction,
        firstMessage: item.prompt.firstMessage,
      },
      {
        upsert: true,
        returnDocument: "after",
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  }

  console.log("Seed completed: roles and prompts are ready.");
  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
