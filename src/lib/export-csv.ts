/**
 * Utility to convert an array of objects into a CSV string and trigger a browser download.
 */
export function exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) {
    alert("No data available to export");
    return;
  }

  const columnHeaders = headers || Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const headerRow = columnHeaders.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");

  const dataRows = rows.map((row) =>
    columnHeaders
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
