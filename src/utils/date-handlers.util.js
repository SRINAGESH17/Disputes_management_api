

const OneMinuteFromNow = () => new Date(Date.now() + (1000 * 60));

const fiveMinutesFromNow = () => new Date(Date.now() + (1000 * 60 * 5));

const thirtyDaysFromNow = () => new Date(Date.now() + (1000 * 60 * 60 * 24 * 30));

const getWeeksInAMonth = (year, month) => {
  const weeks = [];

  const firstDateOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDateOfMonth = new Date(Date.UTC(year, month + 1, 0));

  let current = new Date(firstDateOfMonth);

  while (current <= lastDateOfMonth) {
    const weekStart = new Date(current);
    weekStart.setUTCHours(0, 0, 0, 0); // Start of the day

    const weekEnd = new Date(current);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + (6 - ((weekEnd.getUTCDay() + 6) % 7))); // Get Sunday
    if (weekEnd > lastDateOfMonth) weekEnd.setTime(lastDateOfMonth.getTime());

    weekEnd.setUTCHours(23, 59, 59, 999); // End of the day

    weeks.push({
      start: weekStart.toISOString(),
      end: weekEnd.toISOString()
    });

    // Move current to the next day after weekEnd
    current = new Date(weekEnd);
    current.setUTCDate(current.getUTCDate() + 1);
    current.setUTCHours(0, 0, 0, 0);
  }

  return weeks;
};


const getLastSixMonthsDetails = (year, month) => {
  const months = [];
  let count = 7;
  while (count > 1) {
    let m = month - count;
    let y = year;
    if (m < 0) {
      m += 12;
      y -= 1;
    }
    const firstDate = new Date(Date.UTC(y, m, 1));
    const lastDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    months.push({
      month: m + 1, // 1-based month
      year: y,
      firstDate: firstDate.toISOString(),
      lastDate: lastDate.toISOString()
    });
    count--;
  }
  return months;
};

export {
  OneMinuteFromNow,
  fiveMinutesFromNow,
  thirtyDaysFromNow,
  getWeeksInAMonth,
  getLastSixMonthsDetails
}