import * as XLSX from "xlsx";

export interface AttendanceExportItem {
  studentId: string;
  studentName: string;
  checkedInAt: string | Date;
  status: string;
}

export function generateAttendanceExcel(
  sessionTitle: string,
  sessionDate: string,
  records: AttendanceExportItem[]
): Buffer {
  const wb = XLSX.utils.book_new();

  // Create custom header rows with session metadata
  const rows: (string | number)[][] = [
    ["ATTENDANCE REPORT"],
    ["Session Title:", sessionTitle],
    ["Session Date:", sessionDate],
    ["Total Present:", records.length],
    ["Exported At:", new Date().toLocaleString()],
    [], // Blank line
    ["#", "Student ID", "Full Name", "Check-in Time", "Status"],
  ];

  records.forEach((rec, idx) => {
    const formattedTime =
      typeof rec.checkedInAt === "string"
        ? rec.checkedInAt
        : new Date(rec.checkedInAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });

    rows.push([
      idx + 1,
      rec.studentId,
      rec.studentName,
      formattedTime,
      rec.status.toUpperCase(),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability
  ws["!cols"] = [
    { wch: 6 },  // #
    { wch: 18 }, // Student ID
    { wch: 28 }, // Full Name
    { wch: 22 }, // Check-in Time
    { wch: 14 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Attendance");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
