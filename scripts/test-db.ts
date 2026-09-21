import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import dns from "dns";
import mongoose from "mongoose";

// Set reliable public DNS servers for local SRV resolution
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {}

const uri = process.env.MONGODB_URI || "";

async function runTest() {
  console.log("----------------------------------------");
  console.log("MONGODB ATLAS LIVE CONNECTION TEST");
  console.log("----------------------------------------");

  if (!uri) {
    console.error("❌ ERROR: MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const maskedUri = uri.replace(/:([^@]+)@/, ":****@");
  console.log("Testing Connection to:", maskedUri);

  // Test Attempt 1: Standard MONGODB_URI from .env.local
  const start1 = Date.now();
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      family: 4,
    });
    const elapsed = Date.now() - start1;
    console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    console.log("Connected Host:", conn.connection.host);
    console.log("Database Name:", conn.connection.name);
    console.log("Ping Latency:", elapsed, "ms");
    const ping = await conn.connection.db?.admin().ping();
    console.log("Atlas Admin Ping Response:", ping);
    await mongoose.disconnect();
    console.log("----------------------------------------");
    process.exit(0);
  } catch (err1: any) {
    console.log("SRV format attempt notice:", err1.message);

    // Test Attempt 2: Direct Shard Replica Set (bypasses ISP SRV block)
    console.log("\nTesting direct connection to Atlas shard cluster...");
    const directUri = uri
      .replace("mongodb+srv://", "mongodb://")
      .replace("@attendancedb.t56fghx.mongodb.net", "@ac-t6xiwfa-shard-00-00.t56fghx.mongodb.net:27017,ac-t6xiwfa-shard-00-01.t56fghx.mongodb.net:27017,ac-t6xiwfa-shard-00-02.t56fghx.mongodb.net:27017")
      .includes("ssl=true") 
        ? uri 
        : uri.replace("mongodb+srv://", "mongodb://").replace("@attendancedb.t56fghx.mongodb.net", "@ac-t6xiwfa-shard-00-00.t56fghx.mongodb.net:27017,ac-t6xiwfa-shard-00-01.t56fghx.mongodb.net:27017,ac-t6xiwfa-shard-00-02.t56fghx.mongodb.net:27017") + (uri.includes("?") ? "&ssl=true&authSource=admin" : "?ssl=true&authSource=admin");

    const start2 = Date.now();
    try {
      const conn = await mongoose.connect(directUri, {
        serverSelectionTimeoutMS: 6000,
        family: 4,
      });
      const elapsed = Date.now() - start2;
      console.log("✅ SUCCESS: Connected to MongoDB Atlas Shards!");
      console.log("Connected Host:", conn.connection.host);
      console.log("Database Name:", conn.connection.name);
      console.log("Ping Latency:", elapsed, "ms");
      const ping = await conn.connection.db?.admin().ping();
      console.log("Atlas Admin Ping Response:", ping);
      await mongoose.disconnect();
      console.log("----------------------------------------");
      process.exit(0);
    } catch (err2: any) {
      console.error("\n❌ CONNECTION FAILED");
      console.error("Error Message:", err2.message);
      console.log("----------------------------------------");
      process.exit(1);
    }
  }
}

runTest();
