function pad(n) {
  return String(n).padStart(2, '0');
}

// Server timestamps ("2026-10-11 07:30:00") are UTC without a zone marker;
// shown as local "2026-10-11 09:30", or just the date.
export function localDateTime(utc, withTime = true) {
  if (!utc) {
    return undefined;
  }
  const d = new Date(`${utc.replace(' ', 'T')}Z`);
  if (isNaN(d)) {
    return utc;
  }
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}
