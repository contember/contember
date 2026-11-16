const ISO_DATE_PREFIX_REGEX = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/

// Over-matching only defers a value to PostgreSQL; `2025-02-29BC` has no word boundary before BC.
const BC_ERA_REGEX = /BC/i

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const daysInMonth = (year: number, month: number): number => {
	const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
	return month === 2 && isLeapYear ? 29 : DAYS_IN_MONTH[month - 1]
}

/**
 * True for an ISO-shaped calendar date that does not exist (e.g. 2026-02-30, year 0000), which PostgreSQL would refuse.
 * Other input formats PostgreSQL accepts, and BC dates, are left for PostgreSQL to judge.
 */
export const isImpossibleCalendarDate = (value: string): boolean => {
	const match = ISO_DATE_PREFIX_REGEX.exec(value)
	if (!match || BC_ERA_REGEX.test(value)) {
		return false
	}
	const year = Number(match[1])
	const month = Number(match[2])
	const day = Number(match[3])
	return year === 0 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)
}
