/**
 * Export Utility to convert JSON datasets into Excel-compatible CSV files
 * and trigger instant browser downloads.
 */

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const sanitizeCell = (cell: string | number | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const str = String(cell).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(sanitizeCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCell).join(','));

  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
