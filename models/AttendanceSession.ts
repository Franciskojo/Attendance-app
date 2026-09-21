import mongoose, { Schema, Document, Model } from "mongoose";

export type SessionStatus = "upcoming" | "open" | "closed";

export interface IAttendanceSession extends Document {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  slug: string;
  qrCodeUrl?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Session date is required"],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
    },
    status: {
      type: String,
      enum: ["upcoming", "open", "closed"],
      default: "upcoming",
      index: true,
    },
    slug: {
      type: String,
      required: [true, "Session slug is required"],
      unique: true,
      index: true,
    },
    qrCodeUrl: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const AttendanceSession: Model<IAttendanceSession> =
  mongoose.models.AttendanceSession ||
  mongoose.model<IAttendanceSession>("AttendanceSession", AttendanceSessionSchema);

export default AttendanceSession;
