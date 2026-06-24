// src/lib/exportSchedule.ts
// npm install xlsx jspdf jspdf-autotable

export type ScheduleRow = {
  day:      string;
  time:     string;
  subject:  string;
  teacher:  string;
  room:     string;
  week?:    string;
  subgroup?: string;
  group?:   string;
};

const DAYS = [
  'Bazar ertəsi',
  'Çərşənbə axşamı',
  'Çərşənbə',
  'Cümə axşamı',
  'Cümə',
  'Şənbə',
];

function weekLabel(w?: string) {
  if (!w || w === 'hamisi') return 'Hamısı';
  if (w === 'ust') return 'Üst';
  if (w === 'alt') return 'Alt';
  return w;
}

function subgroupLabel(s?: string) {
  if (!s || s === 'hamisi') return 'Hamısı';
  return s;
}

/* ── Excel Export (SheetJS) ────────────────────────────── */
export async function exportToExcel(
  data: ScheduleRow[],
  title = 'Cədvəl',
) {
  const XLSX = await import('xlsx');

  const header = [
    'Gün', 'Vaxt', 'Fənn', 'Müəllim', 'Otaq', 'Həftə', 'Yarımqrup',
  ];

  const rows: string[][] = [];

  DAYS.forEach(day => {
    const items = data.filter(d => d.day === day);
    if (!items.length) return;
    items.forEach(item => {
      rows.push([
        day,
        item.time,
        item.subject,
        item.teacher,
        item.room,
        weekLabel(item.week),
        subgroupLabel(item.subgroup),
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Column widths
  ws['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 30 },
    { wch: 26 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
  ];

  // Header row style
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) {
      cell.s = {
        font:      { bold: true, color: { rgb: 'FFFFFF' } },
        fill:      { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center' },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Cədvəl');
  XLSX.writeFile(wb, `${title}.xlsx`);
}

/* ── PDF Export (browser print) ───────────────────────── */
export function exportToPDF(data: ScheduleRow[], title = 'Cədvəl') {
  const date = new Date().toLocaleDateString('az-AZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const grouped: Record<string, ScheduleRow[]> = {};
  DAYS.forEach(d => {
    const items = data.filter(r => r.day === d);
    if (items.length) grouped[d] = items;
  });

  const tableRows = Object.entries(grouped)
    .map(([day, items]) =>
      items
        .map(
          (item, i) => `
          <tr>
            ${i === 0
              ? `<td rowspan="${items.length}" class="day-cell">${day}</td>`
              : ''}
            <td>${item.time}</td>
            <td>${item.subject}</td>
            <td>${item.teacher}</td>
            <td>${item.room}</td>
            <td>${weekLabel(item.week)}</td>
            <td>${subgroupLabel(item.subgroup)}</td>
          </tr>`,
        )
        .join(''),
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 15mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; }
  h1  { font-size: 14pt; margin: 0 0 4px; color: #1e3a5f; }
  p   { font-size: 9pt; color: #666; margin: 0 0 12px; }
  table {
    width: 100%; border-collapse: collapse;
  }
  th {
    background: #3b82f6; color: #fff;
    font-size: 9pt; font-weight: 700;
    padding: 6px 8px; text-align: left;
    border: 1px solid #2563eb;
  }
  td {
    padding: 5px 8px; border: 1px solid #d1d5db;
    font-size: 9pt; vertical-align: top;
  }
  tr:nth-child(even) td { background: #f8fafc; }
  .day-cell {
    font-weight: 700; background: #eff6ff !important;
    color: #1d4ed8; text-align: center;
    vertical-align: middle;
  }
</style>
</head>
<body>
<h1>${title}</h1>
<p>Çap tarixi: ${date}</p>
<table>
  <thead>
    <tr>
      <th style="width:15%">Gün</th>
      <th style="width:12%">Vaxt</th>
      <th style="width:24%">Fənn</th>
      <th style="width:20%">Müəllim</th>
      <th style="width:8%">Otaq</th>
      <th style="width:9%">Həftə</th>
      <th style="width:12%">Yarımqrup</th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}