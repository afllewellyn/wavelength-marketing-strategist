/**
 * Parses a user-uploaded LinkedIn job-title list (.xlsx / .xls / .csv) entirely in
 * the browser — the file never leaves the device. LinkedIn has no public title-list
 * download and its Standardized Data API is gated behind partner approval, so users
 * bring their own list (Sales Navigator export, a compiled sheet, etc.). Origins
 * vary, so this picks the title column by header match and otherwise falls back to
 * the first column.
 */

const TITLE_HEADER_PATTERNS = ['job title', 'jobtitle', 'titlesv2', 'title', 'name'];

export async function parseLinkedInTitles(file: File): Promise<string[]> {
  // Lazy-load SheetJS so it stays out of the initial bundle — it's only needed on upload.
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];

  // 2D array of rows so we can detect a header and choose the right column.
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  if (rows.length === 0) return [];

  const colIndex = pickTitleColumn(rows[0]);
  // If the first row is a header (matched a known title header), skip it.
  const headerMatched = colIndex.matchedHeader;
  const dataRows = headerMatched ? rows.slice(1) : rows;

  const titles = dataRows
    .map((r) => r[colIndex.index])
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter(Boolean);

  // De-dupe case-insensitively while preserving the first-seen casing.
  const seen = new Set<string>();
  const result: string[] = [];
  for (const t of titles) {
    const key = t.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }
  return result;
}

function pickTitleColumn(headerRow: unknown[]): { index: number; matchedHeader: boolean } {
  const headers = headerRow.map((h) => (h == null ? '' : String(h).trim().toLowerCase()));
  for (const pattern of TITLE_HEADER_PATTERNS) {
    const idx = headers.findIndex((h) => h === pattern || h.includes(pattern));
    if (idx !== -1) return { index: idx, matchedHeader: true };
  }
  // No recognizable header — assume the first column holds titles.
  return { index: 0, matchedHeader: false };
}

/**
 * Accepts a raw LinkedIn Standardized Data API `/v2/titles` JSON paste (for users
 * who have Marketing API access) and extracts the localized title names.
 */
export function parseTitlesApiJson(text: string): string[] {
  try {
    const parsed = JSON.parse(text) as { elements?: unknown[]; data?: unknown[] };
    const elements: unknown[] = Array.isArray(parsed.elements)
      ? parsed.elements
      : Array.isArray(parsed.data)
        ? parsed.data
        : [];
    const names = elements
      .map((el) => {
        const name = (el as { name?: unknown })?.name;
        if (typeof name === 'string') return name;
        const localized = (name as { localized?: Record<string, string>; preferredLocale?: string })?.localized;
        return localized?.en_US ?? Object.values(localized ?? {})[0] ?? '';
      })
      .map((v) => (typeof v === 'string' ? v.trim() : ''))
      .filter(Boolean);
    return [...new Set(names)];
  } catch {
    return [];
  }
}
