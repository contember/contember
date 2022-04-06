import {
	assertTimeString,
	DateInputString, DateTimeInputString, TimeInputString,
} from './ControlValues'

export function splitDatetime(datetime: string | null | undefined): string[] {
  return (datetime ?? 'T').split('T')
}

export function toDate(value?: any): Date | null {
	let date: Date

	try {
		assertTimeString(value)
		date = new Date(`1970-01-01T${value}`)
	} catch (error) {
		date = new Date(value ?? NaN)
	}

	return isNaN(date.valueOf()) ? null : date
}

export function toDateString(value?: any): DateInputString | null {
	const date = toDate(value)

	if (date) {
		const year = date.getFullYear()
		const month = (date.getMonth() + 1).toFixed(0).padStart(2, '0')
		const day = date.getDate().toFixed(0).padStart(2, '0')

		return `${year}-${month}-${day}`
	}

	return null
}

export function toTimeString(value?: any): TimeInputString | null {
	const date = toDate(value)

	if (date) {
		const hours = date.getHours().toFixed(0).padStart(2, '0')
		const minutes = date.getMinutes().toFixed(0).padStart(2, '0')

		return `${hours}:${minutes}`
	}

	return null
}

export function toDatetimeString(value?: any): DateTimeInputString | null {
	const date = toDate(value)

	if (date) {
		return `${toDateString(date)}T${toTimeString(date)}`
	}

	return null
}

export function toISOString(value?: any): string | null {
	return toDate(value)?.toISOString() ?? null
}
