import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  fullName: string;
  phone?: string;
  email?: string;
  cohort?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: {
      type: String,
      required: [true, "Student ID is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    cohort: {
      type: String,
      default: "Cohort 1",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
