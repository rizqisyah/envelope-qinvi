/*
 * Event date/time formatting for the acara bands (Akad, Resepsi, and the countdown
 * that follows them). The API gives `event_date` as a date string and `event_time`
 * as a range, and Frame 242 prints them in a very specific shape:
 *
 *   Saturday,            <- English weekday, on its own line
 *   19 April 2029        <- day month year
 *   10.00 WIB - 12.00 WIB
 *
 * The invitation copy is Indonesian but the design sets its dates in English, so
 * that is what these return. The zone suffix is part of the design's string, not
 * something the API sends.
 */
const ZONE = 'WIB'
const RANGE_SEPARATORS = ['|', 's/d', ' - ', '-', '–']

export type EventDate = { weekday: string; date: string }

export function formatEventDate(raw?: string | null): EventDate | null {
  if (!raw) return null
  /*
   * A bare 'YYYY-MM-DD' is parsed as UTC midnight, so west of Greenwich it renders
   * as the day before -- the wedding would read Friday to a guest in New York.
   * Build those as a local date instead; anything with a time keeps its own offset.
   */
  const parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = parts
    ? new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]))
    : new Date(raw)
  if (Number.isNaN(d.getTime())) return null
  return {
    weekday: d.toLocaleDateString('en-GB', { weekday: 'long' }),
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

/** '10:00:00' -> '10.00'. Anything unparseable comes back as given. */
function clockOf(part: string): string {
  const m = part.trim().match(/^(\d{1,2})[.:](\d{2})/)
  return m ? `${m[1].padStart(2, '0')}.${m[2]}` : part.trim()
}

export function formatEventTime(raw?: string | null): string {
  if (!raw) return ''
  const sep = RANGE_SEPARATORS.find((s) => raw.includes(s))
  if (!sep) return `${clockOf(raw)} ${ZONE}`
  const [from, to] = raw.split(sep)
  // An end of midnight is how the API says "no end time".
  const end = clockOf(to ?? '')
  if (!end || end === '00.00' || end === '23.59') return `${clockOf(from)} ${ZONE} - Selesai`
  return `${clockOf(from)} ${ZONE} - ${end} ${ZONE}`
}
