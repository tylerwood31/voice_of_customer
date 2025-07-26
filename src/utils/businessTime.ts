// npm i date-fns date-fns-tz
import { isBefore, addMinutes, differenceInMinutes, startOfDay, endOfDay, isWeekend } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export type BusinessTimeConfig = {
  timezone: string;              // e.g. "America/New_York"
  workdayStartHour: number;      // e.g. 9
  workdayEndHour: number;        // e.g. 17  (exclusive)
  // Optional company holidays in "YYYY-MM-DD" (local to timezone)
  holidays?: string[];
};

// Returns business minutes between two datetimes
export function businessMinutesBetween(startISO: string | Date, endISO: string | Date, cfg: BusinessTimeConfig): number {
  if (!startISO || !endISO) return 0;

  const start = new Date(startISO);
  const end = new Date(endISO);
  if (!isBefore(start, end)) return 0;

  const { timezone, workdayStartHour, workdayEndHour, holidays = [] } = cfg;

  const isHoliday = (d: Date) => {
    const zoned = utcToZonedTime(d, timezone);
    const y = zoned.getFullYear();
    const m = String(zoned.getMonth() + 1).padStart(2, "0");
    const day = String(zoned.getDate()).padStart(2, "0");
    return holidays.includes(`${y}-${m}-${day}`);
  };

  let cursor = start;
  let minutes = 0;

  while (isBefore(cursor, end)) {
    const zoned = utcToZonedTime(cursor, timezone);

    // Skip weekends and holidays
    if (!isWeekend(zoned) && !isHoliday(zoned)) {
      // Workday bounds in local time
      const workStart = new Date(zoned);
      workStart.setHours(workdayStartHour, 0, 0, 0);

      const workEnd = new Date(zoned);
      workEnd.setHours(workdayEndHour, 0, 0, 0);

      const dayStart = startOfDay(zoned);
      const dayEnd = endOfDay(zoned);

      // Convert those local times back to UTC equivalents of the same wall clock time
      const workStartUTC = new Date(workStart.getTime() - zoned.getTimezoneOffset() * 60000);
      const workEndUTC   = new Date(workEnd.getTime()   - zoned.getTimezoneOffset() * 60000);
      const dayStartUTC  = new Date(dayStart.getTime()  - zoned.getTimezoneOffset() * 60000);
      const dayEndUTC    = new Date(dayEnd.getTime()    - zoned.getTimezoneOffset() * 60000);

      // Segment we should consider this loop: from max(cursor, workStartUTC) to min(end, workEndUTC, dayEndUTC)
      const segStart = maxDate(cursor, workStartUTC);
      const segEnd   = minDate(end, workEndUTC, dayEndUTC);

      if (isBefore(segStart, segEnd)) {
        minutes += differenceInMinutes(segEnd, segStart);
      }

      // Jump to the next day 00:00 local (translated back to UTC)
      cursor = addMinutes(dayEndUTC, 1); // 1 minute after end of day
    } else {
      // Skip to next day start if it's weekend/holiday
      const zonedStartNext = startOfDay(addMinutes(endOfDay(zoned), 1));
      const nextUTC = new Date(zonedStartNext.getTime() - zonedStartNext.getTimezoneOffset() * 60000);
      cursor = nextUTC;
    }
  }

  return minutes;
}

export function businessHoursBetween(startISO: string | Date, endISO: string | Date, cfg: BusinessTimeConfig): number {
  return businessMinutesBetween(startISO, endISO, cfg) / 60;
}

export function businessDaysBetween(startISO: string | Date, endISO: string | Date, cfg: BusinessTimeConfig): number {
  return businessHoursBetween(startISO, endISO, cfg) / (cfg.workdayEndHour - cfg.workdayStartHour);
}

// helpers
function maxDate(...dates: Date[]) {
  return new Date(Math.max.apply(null, dates.map(d => d.getTime())));
}
function minDate(...dates: Date[]) {
  return new Date(Math.min.apply(null, dates.map(d => d.getTime())));
}