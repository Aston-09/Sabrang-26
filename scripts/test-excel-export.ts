import ExcelJS from 'exceljs';

async function testExcelExport() {
  console.log("=================================================");
  console.log("🚀 RUNNING EXCEL (.XLSX) EXPORT TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      if (details) console.log(`   └─ ${details}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (details) console.error(`   └─ ${details}`);
    }
  }

  // 1. Create a mock workbook using ExcelJS
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Registrations');

  const headers = ['S.No', 'Registration Number', 'Student Name', 'Email', 'Payment Amount', 'Date'];
  const data = [
    [1, '2025BTECH095', 'Rahul Sharma', 'rahul@jklu.edu.in', '₹ 2500', '23-Aug-26'],
    [2, '2025BTECH142', 'Priya Verma', 'priya@jklu.edu.in', '₹ 2500', '23-Aug-26'],
    [3, '2025BTECH177', 'Arjun Singh', 'arjun@jklu.edu.in', '₹ 2500', '23-Aug-26'],
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };

  data.forEach(row => worksheet.addRow(row));

  // 2. Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  assert(
    buffer && buffer.byteLength > 0,
    'Test 1 — Excel Binary Buffer Generation (.xlsx)',
    `Generated buffer size: ${buffer.byteLength} bytes`
  );

  // 3. Read back workbook from buffer to verify integrity
  const readWorkbook = new ExcelJS.Workbook();
  await readWorkbook.xlsx.load(buffer as any);
  const readSheet = readWorkbook.getWorksheet('Registrations');

  assert(
    readSheet !== undefined && readSheet.rowCount === 4, // 1 header + 3 data rows
    'Test 2 — XLSX Row Count & Sheet Structure Verification',
    `Total rows in exported worksheet: ${readSheet?.rowCount}`
  );

  const firstHeader = readSheet?.getRow(1).getCell(2).value;
  assert(
    firstHeader === 'Registration Number',
    'Test 3 — Header Column Mapping & Value Integrity',
    `Row 1, Cell 2 Header: "${firstHeader}"`
  );

  const studentName = readSheet?.getRow(2).getCell(3).value;
  assert(
    studentName === 'Rahul Sharma',
    'Test 4 — Data Cell Mapping Integrity',
    `Row 2, Cell 3 Value: "${studentName}"`
  );

  console.log("\n=================================================");
  console.log(`📊 TEST RESULTS: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log("=================================================");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testExcelExport();
