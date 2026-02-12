export interface GoogleCalendarDateTime {
  dateTime?: string;
  date?: string;
  timeZone?: string;
}

export interface GoogleCalendarAttachment {
  fileUrl: string;
  title: string;
  mimeType: string;
  iconLink: string;
  fileId?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: GoogleCalendarDateTime;
  end: GoogleCalendarDateTime;
  htmlLink: string;
  status: string;
  created: string;
  updated: string;
  attachments?: GoogleCalendarAttachment[];
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: {
      entryPointType: string;
      uri: string;
      label?: string;
    }[];
    conferenceSolution?: {
      name: string;
      iconUri: string;
    };
  };
}

export interface GoogleCalendarEventsResponse {
  kind: string;
  summary: string;
  items: GoogleCalendarEvent[];
  timeZone: string;
  nextPageToken?: string;
}

export interface CalendarEventAttachment {
  url: string;
  title: string;
  mimeType: string;
  iconUrl: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  endDate: Date;
  monthYear: string;
  formattedDate: string;
  googleCalendarLink: string;
  addToCalendarLink: string;
  meetLink: string;
  eventType: string;
  attachments: CalendarEventAttachment[];
}
