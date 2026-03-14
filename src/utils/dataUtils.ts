/**
 * Simple CSV parser that handles basic quoting and delimiters.
 */
export function parseCSV(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line => {
    // Basic CSV splitting (doesn't handle commas inside quotes, but fine for simple hacks)
    const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
    const obj: any = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
  return rows;
}

/**
 * Fuzzy matches column headers to expected field names.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  name: ['patient name', 'full name', 'name', 'client', 'patient'],
  age: ['age', 'years', 'patient age'],
  gender: ['gender', 'sex', 'm/f'],
  symptoms: ['symptoms', 'condition', 'description', 'symptom', 'chief complaint', 'notes'],
  bp: ['bp', 'blood pressure', 'pressure'],
  hr: ['hr', 'heart rate', 'bpm', 'pulse'],
  temp: ['temp', 'temperature', 'body temp'],
  o2: ['o2', 'spo2', 'oxygen', 'saturation'],
};

export function fuzzyMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (aliases.some(alias => lowerHeader.includes(alias))) {
        // Only map if not already mapped to avoid grabbing similar fields twice
        if (!mapping[field]) {
          mapping[field] = header;
          break;
        }
      }
    }
  });

  return mapping;
}
