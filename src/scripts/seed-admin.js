const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

const adminData = {
  name: "Admin Sistema",
  email: "admin@interviewai.com",
  password: "adminpassword123", // Recomiendo cambiarla después del primer login
  isAdmin: true,
  role: "admin"
};

const run = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ email: adminData.email });
  if (existingAdmin) {
    console.log("Admin user already exists.");
  } else {
    // El modelo User usualmente encripta el password en un hook pre-save, 
    // pero si no, lo hacemos manualmente o confiamos en el hook.
    await User.create(adminData);
    console.log("Admin user created successfully.");
    console.log("Email: " + adminData.email);
    console.log("Password: " + adminData.password);
  }

  await mongoose.connection.close();
};

run().catch(async (error) => {
  console.error("Admin seed failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
