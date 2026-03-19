const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB_NAME,
    maxPoolSize: 20,
  });

  console.log(`MongoDB connected to DB "${env.MONGODB_DB_NAME}"`);
};

module.exports = connectDB;
