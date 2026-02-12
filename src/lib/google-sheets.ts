import { google } from "googleapis";

function getAuth() {
  const email = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = import.meta.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!email || !key) {
    throw new Error("Google Sheets credentials not configured");
  }

  return new google.auth.JWT(email, undefined, key, [
    "https://www.googleapis.com/auth/spreadsheets",
  ]);
}

export async function appendToSheet(
  sheetName: string,
  values: string[][]
): Promise<void> {
  const spreadsheetId = import.meta.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_ID not configured");
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}
