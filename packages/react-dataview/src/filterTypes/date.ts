import { Input } from '@contember/client'
import { createFieldFilterHandler } from './createFilterHandler'

export type DateRangeFilterArtifacts = {
	start?: string
	end?: string
	nullCondition?: boolean
}


const toLocalIsoString = (date: Date) => {
	const tzo = -date.getTimezoneOffset()
	const dif = tzo >= 0 ? '+' : '-'
	const pad = (num: number, length: number = 2) => {
		const str = num.toString()
		return '0'.repeat(Math.max(0, length - str.length)) + str
	}

	return pad(date.getFullYear(), 4) +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds()) +
		dif + pad(Math.floor(Math.abs(tzo) / 60)) +
		':' + pad(Math.abs(tzo) % 60)
}

export const createDateFilter = createFieldFilterHandler<DateRangeFilterArtifacts>({
	createCondition: filter => {
		const inclusion: Input.Condition[] = []
		const exclusion: Input.Condition[] = []

		if (filter.start || filter.end) {
			const normalizedStart = filter.start ? new Date(filter.start + 'T00:00:00') : undefined
			const normalizedEnd = filter.end ? new Date(filter.end + 'T00:00:00') : undefined
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
