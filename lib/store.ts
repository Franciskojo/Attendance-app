import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "attendance_db.json");

export interface StoredUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: "admin" | "rep";
  createdAt: string;
  updatedAt: string;
}

export interface StoredStudent {
  _id: string;
  studentId: string;
  fullName: string;
  phone?: string;
  email?: string;
  cohort?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredSession {
  _id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "open" | "closed";
  slug: string;
  qrCodeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredRecord {
  _id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  checkedInAt: string;
  status: "present" | "late";
  deviceInfo?: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: StoredUser[];
  students: StoredStudent[];
  sessions: StoredSession[];
  records: StoredRecord[];
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialData(): DatabaseSchema {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@cohort.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const hashedPassword = bcrypt.hashSync(adminPassword, 10);
  const now = new Date().toISOString();

  const adminId = "usr_admin_001";
  const users: StoredUser[] = [
    {
      _id: adminId,
      name: "Course Representative",
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    users,
    students: [],
    sessions: [],
    records: [],
  };
}

export function loadDatabase(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function resetDatabase(): DatabaseSchema {
  const initial = getInitialData();
  saveDatabase(initial);
  return initial;
}
