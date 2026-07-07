import { describe, expect, test } from 'bun:test'
import { isScheduleDue } from '@contember/engine-scheduler'
import { toSchedulerSchedule } from '../../../src/schedule.js'
import { resolveRetentionConfig } from '../../../src/config.js'

describe('toSchedulerSchedule', () => {
	test('maps each schema schedule variant to the scheduler schedule', () => {
		expect(toSchedulerSchedule({ cron: '17 3 * * *' })).toStrictEqual({ cron: '17 3 * * *' })
		expect(toSchedulerSchedule({ everySeconds: 30 })).toStrictEqual({ everySeconds: 30 })
		expect(toSchedulerSchedule({ everyMinutes: 60 })).toStrictEqual({ everyMinutes: 60 })
	})

	test('re-validates the cron string (throws on garbage)', () => {
		expect(() => toSchedulerSchedule({ cron: 'not a cron' })).toThrow()
	})

	test('re-validates positive intervals', () => {
		expect(() => toSchedulerSchedule({ everyMinutes: 0 })).toThrow()
	})

	test('adapted schedule drives the scheduler due-check (interval)', () => {
		const schedule = toSchedulerSchedule({ everyMinutes: 60 })
		const now = new Date('2026-07-07T12:00:00Z')
		expect(isScheduleDue(schedule, new Date('2026-07-07T10:30:00Z'), now)).toBe(true) // 90 min elapsed
		expect(isScheduleDue(schedule, new Date('2026-07-07T11:30:00Z'), now)).toBe(false) // 30 min elapsed
		expect(isScheduleDue(schedule, null, now)).toBe(true) // never run
	})
})

describe('resolveRetentionConfig', () => {
	test('applies defaults when the section is absent', () => {
		expect(resolveRetentionConfig(undefined)).toStrictEqual({
			defaultSchedule: { everyMinutes: 60 },
			batchSize: 1000,
			maxPerRun: 100_000,
		})
	})

	test('normalizes a cron default schedule and overrides limits', () => {
		expect(resolveRetentionConfig({ defaultSchedule: '0 * * * *', batchSize: 5000, maxPerRun: 250_000 })).toStrictEqual({
			defaultSchedule: { cron: '0 * * * *' },
			batchSize: 5000,
			maxPerRun: 250_000,
		})
	})

	test('rejects non-positive limits', () => {
		expect(() => resolveRetentionConfig({ batchSize: 0 })).toThrow(/batchSize/)
		expect(() => resolveRetentionConfig({ maxPerRun: -1 })).toThrow(/maxPerRun/)
	})
})
