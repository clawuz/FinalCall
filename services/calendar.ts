// Calendar service — implementation pending
import * as Calendar from 'expo-calendar';

export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function addAwardDeadlineToCalendar(
  title: string,
  deadline: Date,
  notes?: string,
): Promise<string | null> {
  const hasPermission = await requestCalendarPermissions();
  if (!hasPermission) return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find((c) => c.allowsModifications);

  if (!defaultCalendar) return null;

  const eventId = await Calendar.createEventAsync(defaultCalendar.id, {
    title: `Son Basvuru: ${title}`,
    startDate: deadline,
    endDate: deadline,
    notes: notes ?? '',
    allDay: true,
  });

  return eventId;
}
