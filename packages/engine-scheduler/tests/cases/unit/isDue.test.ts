import { describe, expect, test } from 'bun:test'
import { isScheduleDue } from '../../../src/schedule/isDue.js'
import { parseSchedule, Schedule } from '../../../src/schedule/types.js'

const iso = (s: string): Date => new Date(s)

describe('isScheduleDue — interval', () => {
	const everyMinute: Schedule = { everySeconds: 60 }

	test('due when never run', () => {
		expect(isScheduleDue(everyMinute, null, iso('2024-01-01T00:00:00Z'))).toBe(true)
	})

	test('not due before the interval elapses', () => {
		const last = iso('2024-01-01T00:00:00Z')
		expect(isScheduleDue(everyMinute, last, iso('2024-01-01T00:00:30Z'))).toBe(false)
	})

	test('due exactly at the interval boundary (>=)', () => {
		const last = iso('2024-01-01T00:00:00Z')
		expect(isScheduleDue(everyMinute, last, iso('2024-01-01T00:01:00Z'))).toBe(true)
	})

	test('due after the interval elapses', () => {
		const last = iso('2024-01-01T00:00:00Z')
		expect(isScheduleDue(everyMinute, last, iso('2024-01-01T00:05:00Z'))).toBe(true)
	})

	test('everyMinutes interval', () => {
		const schedule: Schedule = { everyMinutes: 5 }
		const last = iso('2024-01-01T00:00:00Z')
		expect(isScheduleDue(schedule, last, iso('2024-01-01T00:04:59Z'))).toBe(false)
		expect(isScheduleDue(schedule, last, iso('2024-01-01T00:05:00Z'))).toBe(true)
	})
})

describe('isScheduleDue — cron', () => {
	const everyFive: Schedule = { cron: '*/5 * * * *' }

	test('first run only fires on a currently-matching minute (no history replay)', () => {
		expect(isScheduleDue(everyFive, null, iso('2024-01-01T05:05:00Z'))).toBe(true)
		expect(isScheduleDue(everyFive, null, iso('2024-01-01T05:03:00Z'))).toBe(false)
	})

	test('does not fire twice within the same minute', () => {
		const last = iso('2024-01-01T05:05:30Z') // already ran in the 05:05 slot
		expect(isScheduleDue(everyFive, last, iso('2024-01-01T05:05:45Z'))).toBe(false)
	})

	test('fires once at the next matching minute', () => {
		const last = iso('2024-01-01T05:00:30Z')
		expect(isScheduleDue(everyFive, last, iso('2024-01-01T05:05:10Z'))).toBe(true)
	})

	test('catches up a matching minute missed by a coarse tick / short outage', () => {
		const last = iso('2024-01-01T05:00:30Z')
		// No tick between 05:00 and 05:12; the 05:05 (and 05:10) slot is still due.
		expect(isScheduleDue(everyFive, last, iso('2024-01-01T05:12:00Z'))).toBe(true)
	})

	test('daily cron: due once per day, survives restart via last-run', () => {
		const daily: Schedule = { cron: '0 3 * * *' }
		// Ran yesterday; now just past 03:00 today ⇒ due.
		expect(isScheduleDue(daily, iso('2024-01-01T03:00:10Z'), iso('2024-01-02T03:00:20Z'))).toBe(true)
		// Ran today at 03:00; a few minutes later ⇒ not due again.
		expect(isScheduleDue(daily, iso('2024-01-02T03:00:10Z'), iso('2024-01-02T03:05:00Z'))).toBe(false)
	})

	test('ancient last-run stays bounded and still fires once', () => {
		const daily: Schedule = { cron: '0 0 * * *' }
		const ancient = iso('2020-01-01T00:00:00Z')
		expect(isScheduleDue(daily, ancient, iso('2024-06-15T00:00:30Z'))).toBe(true)
	})
})

describe('parseSchedule', () => {
	test('bare string parses as cron', () => {
		expect(parseSchedule('17 3 * * *')).toEqual({ cron: '17 3 * * *' })
	})

	test('invalid cron string throws', () => {
		expect(() => parseSchedule('not a cron')).toThrow()
		expect(() => parseSchedule('99 * * * *')).toThrow()
	})

	test('interval objects', () => {
		expect(parseSchedule({ everySeconds: 30 })).toEqual({ everySeconds: 30 })
		expect(parseSchedule({ everyMinutes: 15 })).toEqual({ everyMinutes: 15 })
	})

	test('non-positive intervals throw', () => {
		expect(() => parseSchedule({ everySeconds: 0 })).toThrow()
		expect(() => parseSchedule({ everyMinutes: -1 })).toThrow()
	})

	test('empty interval object throws', () => {
		expect(() => parseSchedule({})).toThrow()
	})
})
