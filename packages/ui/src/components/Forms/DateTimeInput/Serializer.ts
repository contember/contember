type TimeInputValue = string
type DateInputValue = string
type DatetimeInputValue = string

const timeInputValueRegExp = /^\d{2}:\d{2}(?::\d{2})?$/
const dateInputValueRegExp = /^\d{4}-\d{2}-\d{2}$/
const datetimeInputValueRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export function splitDateTime(datetime: string | null | undefined): string[] {
  return (datetime ?? 'T').split('T')
}

export function assertTimeString(value: unknown): asserts value is TimeInputValue {
	if (!(typeof value === 'string' && value.match(timeInputValueRegExp))) {
		throw new Error('Expecting time value in format `hh:mm` or `hh:mm:ss`, got ' + JSON.stringify(value))
	}
}

export function assertDateString(value: unknown): asserts value is DateInputValue {
	if (!(typeof value === 'string' && value.match(dateInputValueRegExp))) {
		throw new Error('Expecting time value in format `yyyy-mm-dd`, got ' + JSON.stringify(value))
	}
}

export function assertDatetimeString(value: unknown): asserts value is DatetimeInputValue {
	if (!(typeof value === 'string' && value.match(datetimeInputValueRegExp))) {
		throw new Error('Expecting time value in format `YYYY-MM-DDThh:mm`, got ' + JSON.stringify(value))
	}
}

export const stringToDate = (value: string | void): Date | null => {
	if (value) {
		return new Date(value)
	}

	return null
}

export const dateToDateValue = (date: Date) => {
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toFixed(0).padStart(2, '0')
	const day = date.getDate().toFixed(0).padStart(2, '0')

	return `${year}-${month}-${day}`
}

export const dateToTimeValue = (date: Date) => {
	const hours = date.getHours().toFixed(0).padStart(2, '0')
	const minutes = date.getMinutes().toFixed(0).padStart(2, '0')

	return `${hours}:${minutes}`
}

export const dateToDatetimeLocalValue = (date: Date): string => {
	return `${dateToDateValue(date)}T${dateToTimeValue(date)}`
}
