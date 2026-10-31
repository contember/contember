import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler.js'
import { isCompleteDate } from '../internal/helpers/isCompleteDate.js'

export type DateRangeFilterArtifacts = {
	start?: string
	end?: string
	nullCondition?: boolean
}

const toLocalIsoString = (date: Date) => {
	const pad = (num: number, length: number = 2) => {
		const str = num.toString()
		return '0'.repeat(Math.max(0, length - str.length)) + str
	}
	// Derived from the instant, not getTimezoneOffset(): that is fractional in some browsers and truncated in others
	// for historical local mean time (e.g. +00:57:44), so the offset may carry seconds.
	const wallClockAsUtc = new Date(0)
	wallClockAsUtc.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate())
	wallClockAsUtc.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
	const offsetSeconds = Math.round((wallClockAsUtc.getTime() - date.getTime()) / 1000)
	const absOffset = Math.abs(offsetSeconds)

	return pad(date.getFullYear(), 4)
		+ '-' + pad(date.getMonth() + 1)
		+ '-' + pad(date.getDate())
		+ 'T' + pad(date.getHours())
		+ ':' + pad(date.getMinutes())
		+ ':' + pad(date.getSeconds())
		+ (offsetSeconds >= 0 ? '+' : '-') + pad(Math.floor(absOffset / 3600))
		+ ':' + pad(Math.floor(absOffset / 60) % 60)
		+ (absOffset % 60 !== 0 ? ':' + pad(absOffset % 60) : '')
}

export const createDateFilter = createFieldFilterHandler<DateRangeFilterArtifacts>({
	createCondition: filter => {
		const inclusion: Input.Condition[] = []
		const exclusion: Input.Condition[] = []

		// a bound from stored state or a predefined range may still be incomplete
		const start = filter.start && isCompleteDate(filter.start) ? filter.start : undefined
		const end = filter.end && isCompleteDate(filter.end) ? filter.end : undefined
		if (start || end) {
			const normalizedStart = start ? new Date(start + 'T00:00:00') : undefined
			const normalizedEnd = end ? new Date(end + 'T00:00:00') : undefined
			normalizedEnd?.setDate(normalizedEnd.getDate() + 1)

			inclusion.push({
				gte: normalizedStart && !isNaN(normalizedStart.getTime()) ? toLocalIsoString(normalizedStart) : undefined,
				lt: normalizedEnd && !isNaN(normalizedEnd.getTime()) ? toLocalIsoString(normalizedEnd) : undefined,
			})
		}
		if (filter.nullCondition === true) {
			inclusion.push({ isNull: true })
		}
		if (filter.nullCondition === false) {
			exclusion.push({ isNull: false })
		}

		return {
			and: [
				{ or: inclusion },
				...exclusion,
			],
		}
	},
	isEmpty: filter => !filter.start && !filter.end && filter.nullCondition === undefined,
})
