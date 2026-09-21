import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";

const uri = "mongodb+srv://Attendancedb:hcZc39TGzyORqwsQ@attendancedb.t56fghx.mongodb.net/Attendancedb?retryWrites=true&w=majority&appName=Attendancedb";

async function testConnection() {
  console.log("Testing with Google/Cloudflare DNS...");
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("SUCCESS! Connected to MongoDB Atlas successfully.");
    const admin = mongoose.connection.db?.admin();
    const dbs = await admin?.listDatabases();
    console.log("Databases on cluster:", dbs?.databases.map((d) => d.name));
    process.exit(0);
  } catch (err: unknown) {
    console.error("Connection error:", (err as Error).message);
    process.exit(1);
  }
}

testConnection();
