// src/lib/exportSchedule.ts
// Xarici paket tələb etmir — xlsx əvəzinə CSV, PDF üçün browser print

export type ScheduleRow = {
  day:       string;
  time:      string;
  subject:   string;
  teacher:   string;
  room:      string;
  week?:     string;
  subgroup?: string;
  group?:    string;
};

const DAYS = [
  'Bazar ertəsi','Çərşənbə axşamı','Çərşənbə',
  'Cümə axşamı','Cümə','Şənbə',
];

function wk(w?: string) {
  if (!w || w === 'hamisi') return 'Hamısı';
  return w === 'ust' ? 'Üst' : w === 'alt' ? 'Alt' : w;
}

function sg(s?: string) {
  if (!s || s === 'hamisi') return 'Hamısı';
  return s;
}

/* ── Excel (CSV) ──────────────────────────────────────── */
export function exportToExcel(data: ScheduleRow[], title = 'Cədvəl') {
  const headers = ['Gün','Vaxt','Fənn','Müəllim','Otaq','Qrup','Həftə','Yarımqrup'];

  const rows: string[][] = [];
  DAYS.forEach(day => {
    data.filter(d => d.day === day).forEach(r => {
      rows.push([
        day, r.time, r.subject, r.teacher, r.room,
        r.group ?? '', wk(r.week), sg(r.subgroup),
      ]);
    });
  });

  // BOM + CSV (Excel UTF-8 üçün BOM lazımdır)
  const csv = '\uFEFF' + [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${title}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  // Promise wrapper (ExportButtons async onClick ilə uyğun)
  return Promise.resolve();
}

/* ── PDF (Browser Print) ──────────────────────────────── */
export function exportToPDF(data: ScheduleRow[], title = 'Cədvəl') {
  const date = new Date().toLocaleDateString('az-AZ', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const grouped: Record<string, ScheduleRow[]> = {};
  DAYS.forEach(d => {
    const items = data.filter(r => r.day === d);
    if (items.length) grouped[d] = items;
  });

  const tbody = Object.entries(grouped).map(([day, items]) =>
    items.map((r, i) => `
      <tr>
        ${i === 0
          ? `<td rowspan="${items.length}" class="day">${day}</td>`
          : ''}
        <td>${r.time}</td>
        <td>${r.subject}</td>
        <td>${r.teacher}</td>
        <td>${r.room}</td>
        <td>${r.group ?? ''}</td>
        <td>${wk(r.week)}</td>
        <td>${sg(r.subgroup)}</td>
      </tr>`
    ).join('')
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="az"><head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm; }
  body  { font-family: Arial, sans-serif; font-size: 10pt; color: #111; }
  h1    { font-size: 14pt; margin: 0 0 3px; color: #1e3a5f; }
  p     { font-size: 9pt; color: #666; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th    { background: #3b82f6; color: #fff; font-size: 9pt; font-weight: 700;
          padding: 6px 8px; text-align: left; border: 1px solid #2563eb; }
  td    { padding: 5px 8px; border: 1px solid #d1d5db; font-size: 9pt; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  .day  { font-weight: 700; color: #1d4ed8; background: #eff6ff !important;
          text-align: center; vertical-align: middle; }
</style>
</head><body>
<h1>${title}</h1>
<p>Çap tarixi: ${date}</p>
<table>
  <thead><tr>
    <th style="width:14%">Gün</th><th style="width:11%">Vaxt</th>
    <th style="width:22%">Fənn</th><th style="width:18%">Müəllim</th>
    <th style="width:8%">Otaq</th><th style="width:10%">Qrup</th>
    <th style="width:9%">Həftə</th><th style="width:8%">Yarımqrup</th>
  </tr></thead>
  <tbody>${tbody}</tbody>
</table>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}