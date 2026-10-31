/**
 * Minimal, dependency-free 5-field cron parser + matcher.
 *
 * Fields (in order): minute (0-59), hour (0-23), day-of-month (1-31), month (1-12),
 * day-of-week (0-6, Sunday = 0; 7 is accepted as an alias for Sunday). Each field supports
 * `*`, single values, lists (`a,b`), ranges (`a-b`) and steps (`* / n`, `a-b/n`, `a/n`).
 * Names (JAN, MON, …) are intentionally NOT supported — numeric fields only.
 *
 * Matching is evaluated in UTC so it is deterministic regardless of the host time zone.
 * The classic day-of-month / day-of-week rule is honored: when BOTH are restricted (neither
 * starts with `*`), a date matches if EITHER matches; otherwise both must match.
 */

export interface CronField {
	readonly values: ReadonlySet<number>
	/** True when the field text begins with `*` (`*` or `* / n`) — drives the DOM/DOW OR rule. */
	readonly isStar: boolean
}

export interface ParsedCron {
	readonly minute: CronField
	readonly hour: CronField
	readonly dayOfMonth: CronField
	readonly month: CronField
	readonly dayOfWeek: CronField
}

interface FieldRange {
	readonly min: number
	readonly max: number
}

const RANGES = {
	minute: { min: 0, max: 59 },
	hour: { min: 0, max: 23 },
	dayOfMonth: { min: 1, max: 31 },
	month: { min: 1, max: 12 },
	dayOfWeek: { min: 0, max: 6 },
} as const

const parsePositiveInt = (raw: string, expr: string): number => {
	if (!/^\d+$/.test(raw)) {
		throw new Error(`Invalid cron expression "${expr}": expected an integer, got "${raw}".`)
	}
	return Number(raw)
}

const parseField = (token: string, range: FieldRange, expr: string, normalizeSevenToZero: boolean): CronField => {
	const values = new Set<number>()
	const add = (value: number) => {
		const normalized = normalizeSevenToZero && value === 7 ? 0 : value
		if (normalized < range.min || normalized > range.max) {
			throw new Error(`Invalid cron expression "${expr}": value ${value} out of range ${range.min}-${range.max}.`)
		}
		values.add(normalized)
	}

	for (const part of token.split(',')) {
		if (part === '') {
			throw new Error(`Invalid cron expression "${expr}": empty list item.`)
		}
		const [baseRaw, stepRaw, ...rest] = part.split('/')
		if (rest.length > 0) {
			throw new Error(`Invalid cron expression "${expr}": malformed step in "${part}".`)
		}
		const step = stepRaw === undefined ? 1 : parsePositiveInt(stepRaw, expr)
		if (step < 1) {
			throw new Error(`Invalid cron expression "${expr}": step must be >= 1.`)
		}

		let start: number
		let end: number
		if (baseRaw === '*') {
			start = range.min
			end = range.max
		} else if (baseRaw.includes('-')) {
			const [fromRaw, toRaw, ...more] = baseRaw.split('-')
			if (more.length > 0) {
				throw new Error(`Invalid cron expression "${expr}": malformed range "${baseRaw}".`)
			}
			start = parsePositiveInt(fromRaw, expr)
			end = parsePositiveInt(toRaw, expr)
		} else {
			start = parsePositiveInt(baseRaw, expr)
			// A bare value with a step (`a/n`) counts from `a` up to the field max.
			end = stepRaw === undefined ? start : range.max
		}
		if (end < start) {
			throw new Error(`Invalid cron expression "${expr}": range end ${end} precedes start ${start}.`)
		}
		for (let value = start; value <= end; value += step) {
			add(value)
		}
	}

	return { values, isStar: token.startsWith('*') }
}

export const parseCronExpression = (expr: string): ParsedCron => {
	const tokens = expr.trim().split(/\s+/)
	if (tokens.length !== 5) {
		throw new Error(`Invalid cron expression "${expr}": expected 5 fields, got ${tokens.length}.`)
	}
	const [minute, hour, dayOfMonth, month, dayOfWeek] = tokens
	return {
		minute: parseField(minute, RANGES.minute, expr, false),
		hour: parseField(hour, RANGES.hour, expr, false),
		dayOfMonth: parseField(dayOfMonth, RANGES.dayOfMonth, expr, false),
		month: parseField(month, RANGES.month, expr, false),
		dayOfWeek: parseField(dayOfWeek, RANGES.dayOfWeek, expr, true),
	}
}

/** Whether the given instant (evaluated in UTC, minute precision) matches the parsed expression. */
export const matchesCron = (parsed: ParsedCron, date: Date): boolean => {
	if (!parsed.minute.values.has(date.getUTCMinutes())) {
		return false
	}
	if (!parsed.hour.values.has(date.getUTCHours())) {
		return false
	}
	if (!parsed.month.values.has(date.getUTCMonth() + 1)) {
		return false
	}
	const domMatch = parsed.dayOfMonth.values.has(date.getUTCDate())
	const dowMatch = parsed.dayOfWeek.values.has(date.getUTCDay())
	// Both restricted → OR; otherwise (either is `*`) → AND (the `*` side always matches).
	if (parsed.dayOfMonth.isStar || parsed.dayOfWeek.isStar) {
		return domMatch && dowMatch
	}
	return domMatch || dowMatch
}
