function shiftDay(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

// Counts consecutive days ending today. If today isn't checked yet,
// the streak is still alive as long as yesterday was checked.
function currentStreak(dates, today) {
  const done = new Set(dates);
  let day = done.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (done.has(day)) {
    count += 1;
    day = shiftDay(day, -1);
  }
  return count;
}

module.exports = { currentStreak, shiftDay };