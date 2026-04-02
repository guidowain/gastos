import { google } from 'googleapis';

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n');
  return new google.auth.JWT(email, undefined, key, [
    'https://www.googleapis.com/auth/spreadsheets',
  ]);
}

export async function readSheet(range: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SPREADSHEET_ID!,
    range,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });
  return (res.data.values as string[][]) || [];
}

export async function appendRow(sheetName: string, values: (string | number)[]): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SPREADSHEET_ID!,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

export async function deleteRow(sheetId: number, rowIndex: number): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SPREADSHEET_ID!,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

export function parseNum(val: string | number | undefined): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  // Remove currency prefixes and whitespace
  let s = val.replace(/^\$|^U\$D/g, '').trim();
  // Argentine format: dots as thousands separator, comma as decimal
  // e.g. "630.303,00" or "1.294.952" or "43.929,36"
  if (s.includes(',')) {
    // Has comma — comma is decimal separator, dots are thousands
    s = s.replace(/\./g, '').replace(',', '.');
  } else if ((s.match(/\./g) || []).length === 1 && s.indexOf('.') === s.length - 4) {
    // Single dot with exactly 3 digits after — it's a thousands separator, not decimal
    // e.g. "630.303" means 630303
    s = s.replace(/\./g, '');
  } else {
    // Multiple dots or dot in other position — remove dots (thousands separators)
    s = s.replace(/\./g, '');
  }
  return parseFloat(s) || 0;
}

export function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}
