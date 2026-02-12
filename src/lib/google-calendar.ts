import type {
  GoogleCalendarEventsResponse,
  GoogleCalendarEvent,
  CalendarEvent,
  CalendarEventAttachment,
} from './types/google-calendar';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars';

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const SHORT_SPANISH_MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

function formatDateSpanish(date: Date): string {
  const day = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month}, ${year}`;
}

function formatMonthYear(date: Date): string {
  const month = SHORT_SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

function parseEventDate(gcDateTime: { dateTime?: string; date?: string }): Date {
  if (gcDateTime.dateTime) {
    return new Date(gcDateTime.dateTime);
  }
  if (gcDateTime.date) {
    return new Date(gcDateTime.date + 'T12:00:00');
  }
  return new Date();
}

function extractEventType(summary?: string): string {
  if (!summary) return 'Evento';
  const match = summary.match(/^\[(.+?)\]/);
  return match ? match[1] : 'Evento';
}

function cleanSummary(summary?: string): string {
  if (!summary) return 'Evento sin título';
  return summary.replace(/^\[.+?\]\s*/, '').trim() || 'Evento sin título';
}

function toGoogleCalendarDateFormat(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function buildAddToCalendarUrl(event: GoogleCalendarEvent, title: string): string {
  const start = parseEventDate(event.start);
  const end = parseEventDate(event.end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toGoogleCalendarDateFormat(start)}/${toGoogleCalendarDateFormat(end)}`,
  });

  if (event.description) {
    params.set('details', event.description);
  }
  if (event.location) {
    params.set('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function transformEvent(event: GoogleCalendarEvent): CalendarEvent {
  const startDate = parseEventDate(event.start);
  const endDate = parseEventDate(event.end);
  const title = cleanSummary(event.summary);

  const attachments: CalendarEventAttachment[] = (event.attachments || []).map((a) => ({
    url: a.fileUrl,
    title: a.title,
    mimeType: a.mimeType,
    iconUrl: a.iconLink,
  }));

  return {
    id: event.id,
    title,
    description: event.description || '',
    location: event.location || '',
    date: startDate,
    endDate: endDate,
    monthYear: formatMonthYear(startDate),
    formattedDate: formatDateSpanish(startDate),
    googleCalendarLink: event.htmlLink,
    addToCalendarLink: buildAddToCalendarUrl(event, title),
    meetLink: event.hangoutLink || '',
    eventType: extractEventType(event.summary),
    attachments,
  };
}

export async function getUpcomingEvents(maxResults = 50): Promise<CalendarEvent[]> {
  const apiKey = import.meta.env.GOOGLE_CALENDAR_API_KEY;
  const calendarId = import.meta.env.GOOGLE_CALENDAR_ID;

  if (!apiKey || !calendarId) {
    console.warn(
      '[Google Calendar] Missing GOOGLE_CALENDAR_API_KEY or GOOGLE_CALENDAR_ID. Returning empty events.'
    );
    return [];
  }

  const now = new Date().toISOString();
  const encodedCalendarId = encodeURIComponent(calendarId);

  const params = new URLSearchParams({
    key: apiKey,
    timeMin: now,
    orderBy: 'startTime',
    singleEvents: 'true',
    maxResults: String(maxResults),
    supportsAttachments: 'true',
    conferenceDataVersion: '1',
  });

  const url = `${CALENDAR_API_BASE}/${encodedCalendarId}/events?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[Google Calendar] API request failed (${response.status}): ${errorBody}`
      );
      return [];
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    return data.items
      .filter((event: GoogleCalendarEvent) => event.status !== 'cancelled')
      .map(transformEvent);
  } catch (error) {
    console.error('[Google Calendar] Failed to fetch events:', error);
    return [];
  }
}
