import { describe, expect, test } from 'bun:test'
import { matchesCron, parseCronExpression } from '../../../src/schedule/cron.js'

const at = (year: number, month: number, day: number, hour = 0, minute = 0): Date => new Date(Date.UTC(year, month - 1, day, hour, minute))

const matches = (expr: string, date: Date): boolean => matchesCron(parseCronExpression(expr), date)

describe('cron parser', () => {
	test('rejects wrong field count', () => {
		expect(() => parseCronExpression('* * * *')).toThrow()
		expect(() => parseCronExpression('* * * * * *')).toThrow()
		expect(() => parseCronExpression('')).toThrow()
	})

	test('rejects out-of-range values', () => {
		expect(() => parseCronExpression('60 * * * *')).toThrow()
		expect(() => parseCronExpression('* 24 * * *')).toThrow()
		expect(() => parseCronExpression('* * 0 * *')).toThrow() // day-of-month min is 1
		expect(() => parseCronExpression('* * 32 * *')).toThrow()
		expect(() => parseCronExpression('* * * 13 *')).toThrow()
		expect(() => parseCronExpression('* * * * 8')).toThrow()
	})

	test('rejects malformed steps and ranges', () => {
		expect(() => parseCronExpression('*/0 * * * *')).toThrow()
		expect(() => parseCronExpression('*/a * * * *')).toThrow()
		expect(() => parseCronExpression('30-10 * * * *')).toThrow() // end before start
		expect(() => parseCronExpression('1,,2 * * * *')).toThrow() // empty list item
	})

	test('accepts numeric fields, ranges, steps and lists', () => {
		expect(() => parseCronExpression('*/5 0-12 1,15 */2 1-5')).not.toThrow()
		expect(() => parseCronExpression('17 3 * * *')).not.toThrow()
	})
})

describe('cron matcher', () => {
	test('wildcard matches everything', () => {
		expect(matches('* * * * *', at(2024, 1, 1, 0, 0))).toBe(true)
		expect(matches('* * * * *', at(2024, 6, 15, 13, 37))).toBe(true)
	})

	test('exact minute/hour', () => {
		expect(matches('17 3 * * *', at(2024, 5, 10, 3, 17))).toBe(true)
		expect(matches('17 3 * * *', at(2024, 5, 10, 3, 18))).toBe(false)
		expect(matches('17 3 * * *', at(2024, 5, 10, 4, 17))).toBe(false)
	})

	test('step in minute field', () => {
		const due = [0, 15, 30, 45]
		for (let minute = 0; minute < 60; minute++) {
			expect(matches('*/15 * * * *', at(2024, 1, 1, 8, minute))).toBe(due.includes(minute))
		}
	})

	test('range in hour field', () => {
		expect(matches('0 9-17 * * *', at(2024, 1, 1, 9, 0))).toBe(true)
		expect(matches('0 9-17 * * *', at(2024, 1, 1, 17, 0))).toBe(true)
		expect(matches('0 9-17 * * *', at(2024, 1, 1, 8, 0))).toBe(false)
		expect(matches('0 9-17 * * *', at(2024, 1, 1, 18, 0))).toBe(false)
	})

	test('range with step', () => {
		const due = [0, 10, 20, 30]
		for (let minute = 0; minute < 60; minute++) {
			expect(matches('0-30/10 * * * *', at(2024, 1, 1, 0, minute))).toBe(due.includes(minute))
		}
	})

	test('list in minute field', () => {
		expect(matches('1,2,3 * * * *', at(2024, 1, 1, 0, 2))).toBe(true)
		expect(matches('1,2,3 * * * *', at(2024, 1, 1, 0, 4))).toBe(false)
	})

	test('day-of-month only (day-of-week is star ⇒ AND)', () => {
		// Jan 13 2024 is a Saturday; Jan 12 is a Friday.
		expect(matches('0 0 13 * *', at(2024, 1, 13))).toBe(true)
		expect(matches('0 0 13 * *', at(2024, 1, 12))).toBe(false)
	})

	test('day-of-week only (day-of-month is star ⇒ AND)', () => {
		// Fridays in Jan 2024: 5, 12, 19, 26.
		expect(matches('0 0 * * 5', at(2024, 1, 12))).toBe(true)
		expect(matches('0 0 * * 5', at(2024, 1, 13))).toBe(false)
	})

	test('both day fields restricted ⇒ OR (classic cron rule)', () => {
		// "13th OR Friday": Jan 13 (Sat, dom match), Jan 12 (Fri, dow match), Jan 6 (Sat, neither).
		expect(matches('0 0 13 * 5', at(2024, 1, 13))).toBe(true)
		expect(matches('0 0 13 * 5', at(2024, 1, 12))).toBe(true)
		expect(matches('0 0 13 * 5', at(2024, 1, 6))).toBe(false)
	})

	test('7 is an alias for Sunday', () => {
		// Jan 7 2024 is a Sunday (dow 0).
		expect(matches('0 0 * * 7', at(2024, 1, 7))).toBe(true)
		expect(matches('0 0 * * 0', at(2024, 1, 7))).toBe(true)
		expect(matches('0 0 * * 7', at(2024, 1, 8))).toBe(false)
	})

	test('month field', () => {
		expect(matches('0 0 1 1 *', at(2024, 1, 1))).toBe(true)
		expect(matches('0 0 1 1 *', at(2024, 2, 1))).toBe(false)
	})

	test('matching is evaluated in UTC', () => {
		// Minute/hour are read via getUTC*, so the same wall-clock instant matches regardless of host TZ.
		expect(matches('30 14 * * *', new Date('2024-03-10T14:30:00Z'))).toBe(true)
		expect(matches('30 14 * * *', new Date('2024-03-10T14:31:00Z'))).toBe(false)
	})
})
