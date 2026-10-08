import ExcelJS from "exceljs";
import { EXPORT_CATEGORIES, EXPORT_HEADERS, type ExportRow } from "./organized-export";

export async function leadExportWorkbook(rows: ExportRow[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Harmony MedSpa Dashboard";
  for (const name of ["Overall Data", ...EXPORT_CATEGORIES]) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 4, xSplit: 3 }] });
    sheet.addRow([`Harmony MedSpa — ${name}`]);
    sheet.addRow(["Full available history. Marketing Leads are manual campaign entries; calls are events, not unique patients."]);
    sheet.addRow(["Linked calls include saved contact details. Pending caller names and numbers remain blank. Booking status does not confirm sales revenue."]);
    sheet.mergeCells(1, 1, 1, 12);
    sheet.mergeCells(2, 1, 2, 12);
    sheet.mergeCells(3, 1, 3, 12);
    sheet.getRow(1).font = { name: "Arial", size: 16, bold: true, color: { argb: "FF155E59" } };
    sheet.getRow(2).font = sheet.getRow(3).font = { name: "Arial", size: 10 };
    const data = name === "Overall Data" ? rows : rows.filter((row) => row[0] === name);
    sheet.addTable({ name: name.replaceAll(" ", "") + "Table", ref: "A4", headerRow: true, style: { theme: "TableStyleMedium4", showRowStripes: true }, columns: EXPORT_HEADERS.map((header) => ({ name: header, filterButton: true })), rows: data });
    sheet.columns.forEach((column, index) => { column.width = [5, 6, 7, 22, 23].includes(index) ? 32 : 24; });
    sheet.eachRow((row, index) => {
      if (index <= 3) return;
      row.font = { name: "Arial", size: 10 };
      row.alignment = { vertical: "top" };
      // Explicit string cells preserve phone/identifier text and never run formulas.
      row.eachCell((cell) => { if (typeof cell.value === "string") cell.numFmt = "@"; });
    });
  }
  return workbook.xlsx.writeBuffer();
}
