import ExcelJS from 'exceljs';

/**
 * Creates a new ExcelJS workbook
 */
export function createWorkbook(): ExcelJS.Workbook {
  return new ExcelJS.Workbook();
}

/**
 * Adds a sheet to a workbook from an array of objects (json_to_sheet equivalent)
 */
export function addSheetFromJson(
  workbook: ExcelJS.Workbook,
  data: Record<string, any>[],
  sheetName: string
): ExcelJS.Worksheet {
  const worksheet = workbook.addWorksheet(sheetName);
  if (data.length === 0) return worksheet;

  // Set columns from keys of first object
  const keys = Object.keys(data[0]);
  worksheet.columns = keys.map(key => ({ header: key, key, width: 20 }));

  // Add rows
  data.forEach(row => worksheet.addRow(row));

  return worksheet;
}

/**
 * Writes a workbook to a file and triggers download
 */
export async function writeWorkbookToFile(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads an Excel file and returns parsed sheet data (array of arrays per sheet)
 */
export async function readWorkbook(file: File): Promise<ExcelJS.Workbook> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

/**
 * Converts a worksheet to an array of arrays (like XLSX.utils.sheet_to_json with header:1)
 */
export function sheetToArrayOfArrays(worksheet: ExcelJS.Worksheet): any[][] {
  const rows: any[][] = [];
  worksheet.eachRow((row) => {
    rows.push(row.values as any[]);
  });
  // ExcelJS row.values is 1-indexed (index 0 is undefined), normalize to 0-indexed
  return rows.map(row => row.slice(1));
}
