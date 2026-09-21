import mongoose from "mongoose";
import connectToDatabase from "./mongodb";
import User from "@/models/User";
import Student from "@/models/Student";
import AttendanceSession from "@/models/AttendanceSession";
import AttendanceRecord from "@/models/AttendanceRecord";
import {
  loadDatabase,
  saveDatabase,
  resetDatabase,
  StoredStudent,
  StoredSession,
  StoredRecord,
  StoredUser,
} from "./store";
import bcrypt from "bcryptjs";

function generateSlug(title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${cleanTitle}-${randomSuffix}`;
}

let mongoAvailable: boolean | null = null;

async function isMongoAvailable(): Promise<boolean> {
  if (mongoAvailable === true) return true;
  try {
    const conn = await connectToDatabase();
    mongoAvailable = !!conn && conn.connection.readyState === 1;
    return mongoAvailable;
  } catch {
    mongoAvailable = false;
    return false;
  }
}

// ==================== USERS & AUTH ====================
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
      if (user) {
        return {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim()
  );
  return user || null;
}

// ==================== STUDENTS ====================
export async function getStudentsList(search = "", cohort = "") {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const query: Record<string, unknown> = {};
      if (search) {
        query.$or = [
          { studentId: { $regex: search, $options: "i" } },
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (cohort && cohort !== "all") query.cohort = cohort;

      const students = await Student.find(query).sort({ studentId: 1 }).lean();
      const studentIds = students.map((s) => s.studentId);
      const counts = await AttendanceRecord.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        { $group: { _id: "$studentId", count: { $sum: 1 } } },
      ]);
      const countMap = new Map(counts.map((c) => [c._id, c.count]));

      return students.map((s) => ({
        _id: s._id.toString(),
        studentId: s.studentId,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        cohort: s.cohort,
        attendanceCount: countMap.get(s.studentId) || 0,
        createdAt: s.createdAt,
      }));
    } catch {
      // Fallback to store
    }
  }

  const db = loadDatabase();
  let students = [...db.students];

  if (search) {
    const q = search.toLowerCase();
    students = students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }

  if (cohort && cohort !== "all") {
    students = students.filter((s) => s.cohort === cohort);
  }

  const recordMap = new Map<string, number>();
  db.records.forEach((r) => {
    recordMap.set(r.studentId, (recordMap.get(r.studentId) || 0) + 1);
  });

  return students.map((s) => ({
    ...s,
    attendanceCount: recordMap.get(s.studentId) || 0,
  }));
}

export async function createStudentData(data: {
  studentId: string;
  fullName: string;
  email?: string;
  phone?: string;
  cohort?: string;
}): Promise<StoredStudent> {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const existing = await Student.findOne({ studentId: data.studentId });
      if (existing) throw new Error(`Student ID ${data.studentId} already exists`);
      const student = await Student.create(data);
      return {
        _id: student._id.toString(),
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email || "",
        phone: student.phone || "",
        cohort: student.cohort || "Cohort 1",
        createdAt: student.createdAt ? new Date(student.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: student.updatedAt ? new Date(student.updatedAt).toISOString() : new Date().toISOString(),
      };
    } catch (e) {
      if ((e as Error).message.includes("already exists")) throw e;
    }
  }

  const db = loadDatabase();
  const existing = db.students.find(
    (s) => s.studentId.toUpperCase() === data.studentId.toUpperCase()
  );
  if (existing) throw new Error(`Student ID ${data.studentId} already exists`);

  const now = new Date().toISOString();
  const newStudent: StoredStudent = {
    _id: `stu_${Date.now()}`,
    studentId: data.studentId.toUpperCase(),
    fullName: data.fullName,
    email: data.email || "",
    phone: data.phone || "",
    cohort: data.cohort || "Cohort 1",
    createdAt: now,
    updatedAt: now,
  };

  db.students.push(newStudent);
  saveDatabase(db);
  return newStudent;
}

export async function updateStudentData(id: string, data: Partial<StoredStudent>): Promise<StoredStudent> {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const filter = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { studentId: id }] }
        : { studentId: id };
      const student = await Student.findOneAndUpdate(filter, data, { new: true }).lean();
      if (student) {
        return {
          _id: student._id.toString(),
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email || "",
          phone: student.phone || "",
          cohort: student.cohort || "Cohort 1",
          createdAt: student.createdAt ? new Date(student.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: student.updatedAt ? new Date(student.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const idx = db.students.findIndex((s) => s._id === id || s.studentId === id);
  if (idx === -1) throw new Error("Student not found");

  db.students[idx] = {
    ...db.students[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  return db.students[idx];
}

export async function deleteStudentData(id: string) {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const filter = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { studentId: id }] }
        : { studentId: id };
      await Student.findOneAndDelete(filter);
      return true;
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  db.students = db.students.filter((s) => s._id !== id && s.studentId !== id);
  saveDatabase(db);
  return true;
}

// ==================== SESSIONS ====================
export async function getSessionsList(status = "all", search = "") {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const query: Record<string, unknown> = {};
      if (status !== "all") query.status = status;
      if (search) query.title = { $regex: search, $options: "i" };

      const sessions = await AttendanceSession.find(query).sort({ date: -1 }).lean();
      const totalStudents = await Student.countDocuments();
      const sessionIds = sessions.map((s) => s._id);
      const stats = await AttendanceRecord.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        { $group: { _id: "$sessionId", count: { $sum: 1 } } },
      ]);
      const statsMap = new Map(stats.map((s) => [s._id.toString(), s.count]));

      return sessions.map((s) => {
        const presentCount = statsMap.get(s._id.toString()) || 0;
        const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
        return {
          _id: s._id.toString(),
          title: s.title,
          description: s.description,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          status: s.status,
          slug: s.slug,
          presentCount,
          totalStudents,
          attendanceRate: rate,
        };
      });
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  let sessions = [...db.sessions];

  if (status !== "all") sessions = sessions.filter((s) => s.status === status);
  if (search) {
    const q = search.toLowerCase();
    sessions = sessions.filter((s) => s.title.toLowerCase().includes(q));
  }

  const totalStudents = db.students.length;
  const countMap = new Map<string, number>();
  db.records.forEach((r) => {
    countMap.set(r.sessionId, (countMap.get(r.sessionId) || 0) + 1);
  });

  return sessions.map((s) => {
    const presentCount = countMap.get(s._id) || 0;
    const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
    return {
      ...s,
      presentCount,
      totalStudents,
      attendanceRate: rate,
    };
  });
}

export async function getSessionDetails(idOrSlug: string) {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      let session;
      if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        session = await AttendanceSession.findById(idOrSlug).lean();
      }
      if (!session) {
        session = await AttendanceSession.findOne({ slug: idOrSlug }).lean();
      }

      if (session) {
        const records = await AttendanceRecord.find({ sessionId: session._id })
          .sort({ checkedInAt: -1 })
          .lean();
        const allStudents = await Student.find().lean();
        const checkedInIds = new Set(records.map((r) => r.studentId));
        const absentStudents = allStudents.filter((s) => !checkedInIds.has(s.studentId));

        const presentCount = records.length;
        const totalStudents = allStudents.length;
        const absentCount = Math.max(0, totalStudents - presentCount);
        const lateCount = records.filter((r) => r.status === "late").length;
        const attendanceRate =
          totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

        return {
          _id: session._id.toString(),
          title: session.title,
          description: session.description,
          date: session.date,
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          slug: session.slug,
          records: records.map((r) => ({
            _id: r._id.toString(),
            studentId: r.studentId,
            studentName: r.studentName,
            checkedInAt: new Date(r.checkedInAt).toISOString(),
            status: r.status,
          })),
          absentStudents: absentStudents.map((s) => ({
            _id: s._id.toString(),
            studentId: s.studentId,
            fullName: s.fullName,
            email: s.email,
            phone: s.phone,
          })),
          stats: {
            totalStudents,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate,
          },
        };
      }
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const session = db.sessions.find(
    (s) => s._id === idOrSlug || s.slug === idOrSlug
  );
  if (!session) return null;

  const records = db.records
    .filter((r) => r.sessionId === session._id)
    .sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());

  const checkedInIds = new Set(records.map((r) => r.studentId));
  const absentStudents = db.students.filter((s) => !checkedInIds.has(s.studentId));

  const totalStudents = db.students.length;
  const presentCount = records.length;
  const absentCount = Math.max(0, totalStudents - presentCount);
  const lateCount = records.filter((r) => r.status === "late").length;
  const attendanceRate =
    totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  return {
    ...session,
    records,
    absentStudents,
    stats: {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      attendanceRate,
    },
  };
}

export async function createSessionData(data: {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "upcoming" | "open" | "closed";
}): Promise<StoredSession> {
  const slug = generateSlug(data.title);

  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const session = await AttendanceSession.create({ ...data, slug });
      return {
        _id: session._id.toString(),
        title: session.title,
        description: session.description,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        slug: session.slug,
        qrCodeUrl: session.qrCodeUrl,
        createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
      };
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const now = new Date().toISOString();
  const newSession: StoredSession = {
    _id: `sess_${Date.now()}`,
    ...data,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  db.sessions.unshift(newSession);
  saveDatabase(db);
  return newSession;
}

export async function updateSessionData(
  idOrSlug: string,
  data: Partial<StoredSession>
): Promise<StoredSession> {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const query = mongoose.Types.ObjectId.isValid(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug };
      const updated = await AttendanceSession.findOneAndUpdate(query, data, {
        new: true,
      }).lean();
      if (updated) {
        return {
          _id: updated._id.toString(),
          title: updated.title,
          description: updated.description,
          date: updated.date,
          startTime: updated.startTime,
          endTime: updated.endTime,
          status: updated.status,
          slug: updated.slug,
          qrCodeUrl: updated.qrCodeUrl,
          createdAt: updated.createdAt ? new Date(updated.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: updated.updatedAt ? new Date(updated.updatedAt).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const idx = db.sessions.findIndex(
    (s) => s._id === idOrSlug || s.slug === idOrSlug
  );
  if (idx === -1) throw new Error("Session not found");

  db.sessions[idx] = {
    ...db.sessions[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  return db.sessions[idx];
}

export async function deleteSessionData(idOrSlug: string) {
  const isMongo = await isMongoAvailable();
  if (isMongo) {
    try {
      const query = mongoose.Types.ObjectId.isValid(idOrSlug)
        ? { _id: idOrSlug }
        : { slug: idOrSlug };
      const session = await AttendanceSession.findOneAndDelete(query);
      if (session) {
        await AttendanceRecord.deleteMany({ sessionId: session._id });
        return true;
      }
    } catch {
      // Fallback
    }
  }

  const db = loadDatabase();
  const session = db.sessions.find(
    (s) => s._id === idOrSlug || s.slug === idOrSlug
  );
  if (!session) throw new Error("Session not found");

  db.sessions = db.sessions.filter((s) => s._id !== session._id);
  db.records = db.records.filter((r) => r.sessionId !== session._id);
  saveDatabase(db);
  return true;
}

// ==================== CHECK-IN & ATTENDANCE ====================
export async function submitCheckIn(data: {
  sessionSlug: string;
  studentId: string;
  fullName?: string;
  deviceInfo?: string;
}) {
  const session = await getSessionDetails(data.sessionSlug);
  if (!session) throw new Error("Attendance session not found");

  if (session.status !== "open") {
    throw new Error(
      session.status === "closed"
        ? "This session has been closed."
        : "This session is not open yet."
    );
  }

  const db = loadDatabase();
  let student = db.students.find(
    (s) => s.studentId.toUpperCase() === data.studentId.toUpperCase()
  );

  let resolvedName = student ? student.fullName : data.fullName;

  if (!student) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      throw new Error("First-time check-in requires Full Name");
    }
    student = await createStudentData({
      studentId: data.studentId.toUpperCase(),
      fullName: data.fullName.trim(),
      cohort: "Cohort 1",
    });
    resolvedName = student.fullName;
  }

  // Duplicate attendance check (sessionId + studentId)
  const existingRecord = db.records.find(
    (r) =>
      r.sessionId === session._id &&
      r.studentId.toUpperCase() === data.studentId.toUpperCase()
  );

  if (existingRecord) {
    const err = new Error(
      `Attendance already recorded for Student ID (${data.studentId.toUpperCase()}). Duplicate check-ins are not permitted.`
    );
    (err as { isDuplicate?: boolean }).isDuplicate = true;
    throw err;
  }

  // Determine late status
  const now = new Date();
  let status: "present" | "late" = "present";
  if (session.startTime && session.date) {
    const [startHour, startMin] = session.startTime.split(":").map(Number);
    const sessionStart = new Date(session.date);
    sessionStart.setHours(startHour, startMin + 15, 0, 0);
    if (now.getTime() > sessionStart.getTime()) {
      status = "late";
    }
  }

  const newRecord: StoredRecord = {
    _id: `rec_${Date.now()}`,
    sessionId: session._id,
    studentId: student.studentId,
    studentName: resolvedName || student.fullName,
    checkedInAt: now.toISOString(),
    status,
    deviceInfo: data.deviceInfo || "",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.records.push(newRecord);
  saveDatabase(db);

  return {
    recordId: newRecord._id,
    studentId: newRecord.studentId,
    studentName: newRecord.studentName,
    checkedInAt: newRecord.checkedInAt,
    status: newRecord.status,
    sessionTitle: session.title,
    sessionDate: session.date,
  };
}

// ==================== ANALYTICS ====================
export async function getAnalyticsMetrics() {
  const db = loadDatabase();
  const totalStudents = db.students.length;
  const totalSessions = db.sessions.length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = db.sessions.filter((s) => s.date === todayStr);
  const todaySessionIds = new Set(todaySessions.map((s) => s._id));

  const todayAttendanceCount = db.records.filter((r) =>
    todaySessionIds.has(r.sessionId)
  ).length;

  const countMap = new Map<string, { total: number; late: number }>();
  db.records.forEach((r) => {
    const current = countMap.get(r.sessionId) || { total: 0, late: 0 };
    current.total += 1;
    if (r.status === "late") current.late += 1;
    countMap.set(r.sessionId, current);
  });

  let totalActualAttendance = 0;
  const sessionTrends = db.sessions.map((s) => {
    const stats = countMap.get(s._id) || { total: 0, late: 0 };
    const present = stats.total;
    const late = stats.late;
    const absent = Math.max(0, totalStudents - present);
    const rate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
    totalActualAttendance += present;

    return {
      id: s._id,
      name: s.title.length > 20 ? s.title.slice(0, 18) + "..." : s.title,
      fullTitle: s.title,
      date: s.date,
      status: s.status,
      present,
      absent,
      late,
      attendanceRate: rate,
    };
  });

  const totalPossible = totalSessions * totalStudents;
  const overallAttendanceRate =
    totalPossible > 0 ? Math.round((totalActualAttendance / totalPossible) * 100) : 0;

  const studentCountMap = new Map<string, number>();
  db.records.forEach((r) => {
    studentCountMap.set(r.studentId, (studentCountMap.get(r.studentId) || 0) + 1);
  });

  const studentsWithRates = db.students.map((s) => {
    const attended = studentCountMap.get(s.studentId) || 0;
    const rate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
    return {
      studentId: s.studentId,
      fullName: s.fullName,
      email: s.email,
      attended,
      totalSessions,
      rate,
    };
  });

  const topStudents = [...studentsWithRates]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  const atRiskStudents = studentsWithRates.filter(
    (s) => totalSessions >= 2 && s.rate < 75
  );

  return {
    totalStudents,
    totalSessions,
    todayAttendanceCount,
    overallAttendanceRate,
    sessionTrends,
    topStudents,
    atRiskStudents,
  };
}

export function reseedDatabaseStore() {
  return resetDatabase();
}
