import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import dns from "dns";
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "";

async function testConnection() {
  if (!uri) {
    console.error("❌ MONGODB_URI is not defined in environment or .env.local");
    process.exit(1);
  }

  console.log("Testing MongoDB connection from environment configuration...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("SUCCESS! Connected to MongoDB Atlas successfully.");
    const admin = mongoose.connection.db?.admin();
    const dbs = await admin?.listDatabases();
    console.log("Databases on cluster:", dbs?.databases.map((d) => d.name));
    await mongoose.disconnect();
    process.exit(0);
  } catch (err: unknown) {
    console.error("Connection error:", (err as Error).message);
    process.exit(1);
  }
}

testConnection();
