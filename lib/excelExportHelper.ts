import ExcelJS from 'exceljs';

export interface ExcelExportOptions {
  filename: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number | boolean | null | undefined)[][];
}

/**
 * Generates and downloads a native Excel (.xlsx) spreadsheet with styled headers and auto-fitted columns.
 */
export async function exportToExcel({
  filename,
  sheetName = 'Data',
  headers,
  rows,
}: ExcelExportOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sabrang 2026 Admin';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // 1. Add Headers with dark slate styling
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // 2. Add Data Rows
  rows.forEach((rowData) => {
    const row = worksheet.addRow(rowData);
    row.height = 20;
    row.font = { size: 10, name: 'Calibri' };
    row.alignment = { vertical: 'middle', horizontal: 'left' };

    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        left: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFF1F5F9' } },
      };
    });
  });

  // 3. Auto-fit column widths based on contents
  worksheet.columns.forEach((column, i) => {
    let maxLen = headers[i] ? headers[i].toString().length : 12;
    rows.forEach((r) => {
      const cellVal = r[i] !== null && r[i] !== undefined ? r[i]!.toString() : '';
      if (cellVal.length > maxLen) {
        maxLen = cellVal.length;
      }
    });
    column.width = Math.min(50, Math.max(maxLen + 4, 15));
  });

  // 4. Export & Trigger Browser Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanFilename = filename.endsWith('.xlsx') ? filename : `${filename.replace(/\.csv$/i, '')}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
