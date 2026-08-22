const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");

// Set DNS servers to Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/devfusion";

    if (!mongoURI) {
      throw new Error(
        "MongoDB connection string is missing in environment variables",
      );
    }
    console.log("Mongo URI:", mongoURI);
    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoURI, {
      autoIndex: true,
    });

    console.log("MongoDB connected successfully");

    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
