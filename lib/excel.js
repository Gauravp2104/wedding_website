import ExcelJS from 'exceljs';

// Column layout shared by the on-the-fly Excel export.
const COLUMNS = [
  { header: 'Name', key: 'name', width: 28 },
  { header: 'Attending', key: 'attending', width: 12 },
  { header: 'Guests', key: 'guests', width: 8 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Phone', key: 'phone', width: 20 },
  { header: 'Events', key: 'events', width: 40 },
  { header: 'Message', key: 'message', width: 50 },
  { header: 'Submitted', key: 'submittedAt', width: 24 },
];

export function buildWorkbook(rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gautam & Sandhya Wedding';
  wb.created = new Date();

  const ws = wb.addWorksheet('RSVPs');
  ws.columns = COLUMNS;

  // Maroon/gold header styling.
  ws.getRow(1).font = { bold: true, color: { argb: 'FFF5E6C8' } };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF7A1F2B' },
  };
  ws.getRow(1).alignment = { vertical: 'middle' };

  rows.forEach((r) => {
    ws.addRow({
      name: r.name,
      attending: r.attending === 'yes' ? 'Yes' : 'No',
      guests: r.guests,
      email: r.email || '',
      phone: r.phone || '',
      events: (r.events || []).join(', '),
      message: r.message || '',
      submittedAt: r.submittedAt,
    });
  });

  ws.views = [{ state: 'frozen', ySplit: 1 }]; // keep header visible while scrolling
  return wb;
}

// Returns the .xlsx as a Buffer — used to stream a download without touching disk.
export async function workbookBuffer(rows) {
  const wb = buildWorkbook(rows);
  return wb.xlsx.writeBuffer();
}
