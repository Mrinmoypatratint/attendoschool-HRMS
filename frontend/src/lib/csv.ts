/**
 * csv.ts
 * -------
 * Client-side CSV export helper. Builds RFC-4180-style CSV text in memory and
 * streams it to the browser as a file download — no server round-trip and no
 * third-party dependencies. Used by list/report screens for "Export to CSV".
 */

/**
 * Minimal, dependency-free CSV export. Properly escapes quotes/commas/newlines
 * and triggers a client-side download.
 *
 * @param filename Desired file name; a ".csv" extension is appended if missing.
 * @param headers  Column header labels written as the first row.
 * @param rows     Data rows; `null`/`undefined` cells become empty strings.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | null | undefined>>
): void {
  // Escape a single cell: wrap in double quotes (and double any embedded
  // quotes) only when the value contains a quote, comma, or line break.
  const esc = (v: string | number | null | undefined): string => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Join cells with commas and rows with CRLF, header row first.
  const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  // Prepend BOM so Excel detects UTF-8.
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  // Use a transient anchor element to trigger the browser's download flow.
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Release the blob URL so the object can be garbage-collected.
  URL.revokeObjectURL(url);
}
