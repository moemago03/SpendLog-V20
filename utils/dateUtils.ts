/**
 * Checks if two Date objects represent the same calendar day (ignores time).
 * @param date1 The first date.
 * @param date2 The second date.
 * @returns True if they are the same day, false otherwise.
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

/**
 * Generates an array of date objects between a start and end date.
 * @param startDateStr ISO string for the start date
 * @param endDateStr ISO string for the end date
 * @returns An array of objects, each containing the Date object and its YYYY-MM-DD ISO string representation.
 */
export const getDaysArray = (startDateStr: string, endDateStr: string): { date: Date, iso: string }[] => {
    const dates = [];
    let currentDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(currentDate.getTime()) || isNaN(endDate.getTime()) || currentDate > endDate) {
        return [];
    }

    // Set time to noon UTC to avoid DST or timezone boundary issues.
    currentDate.setUTCHours(12, 0, 0, 0);
    endDate.setUTCHours(12, 0, 0, 0);

    while (currentDate <= endDate) {
        // toISOString().slice(0, 10) is a reliable way to get YYYY-MM-DD in UTC.
        dates.push({
            date: new Date(currentDate),
            iso: currentDate.toISOString().slice(0, 10)
        });
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return dates;
};

/**
 * Converts a Date object to a "YYYY-MM-DD" string.
 * @param date The date to convert.
 * @returns The date formatted as an ISO date string (without time).
 */
export const dateToISOString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


/**
 * Generates an array of Date objects for a calendar grid for a given month and year.
 * The grid will be dynamically sized to 4, 5, or 6 weeks.
 * @param year The full year
 * @param month The month index (0-11)
 * @returns An array of Date objects representing the grid.
 */
export const getMonthGridDays = (year: number, month: number): Date[] => {
    const dates: Date[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Day of the week for the first day (0=Sun, 1=Mon, ..., 6=Sat)
    // Adjust to make Monday the start of the week (0=Mon, ..., 6=Sun)
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;

    // Add padding days from the previous month
    for (let i = 0; i < startDayOfWeek; i++) {
        const prevMonthDay = new Date(year, month, 1 - (startDayOfWeek - i));
        dates.push(prevMonthDay);
    }

    // Add days of the current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
        dates.push(new Date(year, month, i));
    }
    
    // Add padding days for the next month to complete the final week
    const remaining = 7 - (dates.length % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            dates.push(new Date(year, month + 1, i));
        }
    }

    return dates;
};

/**
 * Calculates the start (Monday) and end (Sunday) of the week for a given date.
 * @param date The date within the desired week.
 * @returns An object containing the start and end Date objects for the week.
 */
export const getWeekRange = (date: Date): { start: Date, end: Date } => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Normalize time
    const day = d.getDay(); // Sunday - 0, Monday - 1, ...
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    
    const startOfWeek = new Date(d.setDate(diffToMonday));
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { start: startOfWeek, end: endOfWeek };
};

/**
 * Calculates the start (1st day) and end (last day) of the month for a given date.
 * @param date The date within the desired month.
 * @returns An object containing the start and end Date objects for the month.
 */
export const getMonthRange = (date: Date): { start: Date, end: Date } => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Normalize time
    const year = d.getFullYear();
    const month = d.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
};