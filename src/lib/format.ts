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

/**
 * The instant the countdown counts to: `event_date` at `event_time`'s start.
 *
 * Built in the GUEST'S local zone, not WIB. The payload carries no offset -- the
 * design's "WIB" is a literal in its own copy, not data -- so there is nothing to
 * pin to, and a guest-local reading is the one a bare `new Date(...)` gives. A
 * guest abroad therefore sees the countdown reach zero at their own local
 * wall-clock time, which is a choice, not an oversight; pinning to +07:00 would
 * need the API to say so.
 *
 * Missing time means midnight local, the same anchor `formatEventDate` uses.
 */
export function parseEventStart(date?: string | null, time?: string | null): Date | null {
  if (!date) return null
  const d = date.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!d) {
    const loose = new Date(date)
    return Number.isNaN(loose.getTime()) ? null : loose
  }
  const sep = time ? RANGE_SEPARATORS.find((s) => time.includes(s)) : undefined
  const start = sep && time ? time.split(sep)[0] : time
  const t = (start ?? '').trim().match(/^(\d{1,2})[.:](\d{2})/)
  const at = new Date(
    Number(d[1]),
    Number(d[2]) - 1,
    Number(d[3]),
    t ? Number(t[1]) : 0,
    t ? Number(t[2]) : 0,
  )
  return Number.isNaN(at.getTime()) ? null : at
}

export type Remaining = { days: number; hours: number; minutes: number; seconds: number }

/** Whole units left until `target`, clamped at zero once it has passed. */
export function remainingUntil(target: Date | null, now: number = Date.now()): Remaining {
  const ms = target ? target.getTime() - now : 0
  if (!target || ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const s = Math.floor(ms / 1000)
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor(s / 3600) % 24,
    minutes: Math.floor(s / 60) % 60,
    seconds: s % 60,
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

/*
 * "2 hari lalu" — the wish list's timestamps. The design prints Indonesian relative
 * time, and unlike the dates above it does not switch to English.
 */
const AGO: [seconds: number, unit: string][] = [
  [60, 'menit'],
  [3600, 'jam'],
  [86400, 'hari'],
  [2592000, 'bulan'],
  [31536000, 'tahun'],
]

export function relativeTime(value?: string | Date | null, now: number = Date.now()): string {
  if (!value) return ''
  /*
   * The API sends MySQL-style "2026-07-28 10:00:00" — a space, no T, no zone. Chromium
   * parses that; WebKit returns NaN, which would blank every timestamp on iPhone. The
   * ISO form is understood by both, so normalise before parsing. A bare date with no
   * zone is read as local time by both engines, which is what the guest expects.
   */
  const at =
    value instanceof Date
      ? value
      : new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value) ? value.replace(' ', 'T') : value)
  if (Number.isNaN(at.getTime())) return ''

  // Under a minute, and also anything in the future: a guest's clock skewed ahead of
  // the server would otherwise read "-3 menit lalu".
  const secs = Math.floor((now - at.getTime()) / 1000)
  if (secs < 60) return 'baru saja'

  for (let i = AGO.length - 1; i >= 0; i--) {
    const [step, unit] = AGO[i]
    if (secs >= step) return `${Math.floor(secs / step)} ${unit} lalu`
  }
  return 'baru saja'
}

/*
 * "09. 09. 26" — the glimpse band's date plate. Neither of the formats above produces it:
 * two-digit day, month and YEAR, separated by ". " with the trailing dot on the first two.
 * The design's own string is 09. 09. 26 for a 2026-09-09 wedding, so the last field is the
 * year, not the day repeated.
 */
export function formatShortDate(raw?: string | null): string {
  if (!raw) return ''
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}. ${m[2]}. ${m[1].slice(2)}`
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}. ${p(d.getMonth() + 1)}. ${String(d.getFullYear()).slice(2)}`
}
