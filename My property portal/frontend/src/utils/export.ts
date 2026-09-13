/**
 * Export Utility
 * Converts an array of JSON objects into a downloadable CSV file.
 * This completely avoids the need for external heavy libraries like exceljs.
 */
export const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) return;

  // 1. Extract headers
  const headers = Object.keys(data[0]);

  // 2. Map data rows
  const csvRows = [
    headers.join(','), // Header row
    ...data.map((row) =>
      headers
        .map((fieldName) => {
          let value = row[fieldName];
          // Handle strings with commas by wrapping in quotes
          if (typeof value === 'string') {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(','),
    ),
  ];

  // 3. Create Blob
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  // 4. Trigger download natively
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
