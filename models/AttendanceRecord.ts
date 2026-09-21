import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendanceRecord extends Document {
  sessionId: mongoose.Types.ObjectId;
  studentId: string;
  studentName: string;
  checkedInAt: Date;
  status: "present" | "late";
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "AttendanceSession",
      required: [true, "Session ID is required"],
      index: true,
    },
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      uppercase: true,
      trim: true,
      index: true,
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["present", "late"],
      default: "present",
    },
    deviceInfo: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to strictly prevent duplicate attendance for the same session
AttendanceRecordSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>("AttendanceRecord", AttendanceRecordSchema);

export default AttendanceRecord;
