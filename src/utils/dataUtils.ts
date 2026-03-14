/**
 * Robust CSV parser that handles different delimiters and quoted values.
 */
export function parseCSV(csvText: string): any[] {
  // Strip UTF-8 BOM if present
  const cleanedText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanedText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  // Auto-detect delimiter
  const firstLine = lines[0];
  const delimiters = [',', ';', '\t'];
  let delimiter = ',';
  let maxCount = -1;
  delimiters.forEach(d => {
    const count = firstLine.split(d).length;
    if (count > maxCount) {
      maxCount = count;
      delimiter = d;
    }
  });

  const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => {
    // Basic CSV splitting with delimiter
    const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj: any = {};
    headers.forEach((header, i) => {
      // Use the header as key, ensuring we don't have empty keys
      if (header) {
        obj[header] = values[i] || '';
      }
    });
    return obj;
  });
  return rows;
}

/**
 * Fuzzy matches column headers to expected field names.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  name: ['patient name', 'full name', 'name', 'client', 'patient', 'fname', 'lname', 'first name', 'last name', 'id', 'p_id', 'case id'],
  age: ['age', 'years', 'patient age', 'y.o.', 'dob'],
  gender: ['gender', 'sex', 'm/f', 'male/female'],
  symptoms: ['symptoms', 'condition', 'description', 'symptom', 'chief complaint', 'notes', 'diagnosis', 'issue', 'complaint'],
  bp: ['bp', 'blood pressure', 'pressure', 'systolic', 'diastolic'],
  hr: ['hr', 'heart rate', 'bpm', 'pulse'],
  temp: ['temp', 'temperature', 'body temp', 'fever'],
  o2: ['o2', 'spo2', 'oxygen', 'saturation', 'o2 sat'],
};

export function fuzzyMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // First pass: try exact matches (case-insensitive)
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.includes(lowerHeader)) {
        if (!mapping[field]) {
          mapping[field] = header;
          break;
        }
      }
    }
  });

  // Second pass: try fuzzy matches (includes) for unmapped fields
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (!mapping[field] && aliases.some(alias => lowerHeader.includes(alias))) {
        mapping[field] = header;
        break;
      }
    }
  });

  // Fallback for name: if still not mapped, try the first column if it's not already mapped elsewhere
  if (!mapping.name && headers.length > 0) {
    const firstHeader = headers[0];
    const isMapped = Object.values(mapping).includes(firstHeader);
    if (!isMapped) {
      mapping.name = firstHeader;
    }
  }

  return mapping;
}
