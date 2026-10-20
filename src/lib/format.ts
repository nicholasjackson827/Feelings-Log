const pad = (n: number) => String(n).padStart(2, '0')

/** Date → value for <input type="datetime-local"> (local time, minute precision). */
export function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Local calendar day key, e.g. "2026-10-19". */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDay(date: Date, now = new Date()): string {
  const today = dayKey(now)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const key = dayKey(date)
  if (key === today) return 'Today'
  if (key === dayKey(yesterday)) return 'Yesterday'
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
  })
}

/** Short label for a non-"now" timestamp, e.g. "9:15 PM" today or "Yesterday 9:15 PM". */
export function formatWhen(date: Date): string {
  const day = formatDay(date)
  return day === 'Today' ? formatTime(date) : `${day} ${formatTime(date)}`
}
