export type TimeInputString = string
export const TimeInputStringRegExp = /^(?:0\d|1\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/
export function assertTimeString(value: unknown): asserts value is TimeInputString {
	if (!(typeof value === 'string' && value.match(TimeInputStringRegExp))) {
		throw new Error('Expecting time value in format `hh:mm` or `hh:mm:ss`, got ' + JSON.stringify(value))
	}
}

export type DateInputString = string
export const DateInputStringRegExp = /^\d+-(?:0\d|1[0-2])-(?:[0-2]\d|3[0-1])$/
export function assertDateString(value: unknown): asserts value is DateInputString {
	if (!(typeof value === 'string' && value.match(DateInputStringRegExp))) {
		throw new Error('Expecting time value in format `yyyy-mm-dd`, got ' + JSON.stringify(value))
	}
}

export type DateTimeInputString = string
export const DateTimeInputStringRegExp = /^\d+-\d{2}-\d{2}T\d{2}:\d{2}$/
export function assertDatetimeString(value: unknown): asserts value is DateTimeInputString {
	if (typeof value !== 'string') {
		throw new Error('Expecting time value in format `YYYY-MM-DDThh:mm`, got ' + JSON.stringify(value))
	} else {
		const [date, time] = value.split('T')

		try {
			assertTimeString(time)
			assertDateString(date)
		} catch (error) {
			throw new Error('Expecting time value in format `YYYY-MM-DDThh:mm`, got ' + JSON.stringify(value))
		}
	}
}

export type WeekInputString = string
export const WeekInputStringRegExp = /^\d{4}-W(?:[0-4]\d|5[0-2])$/
export function assertWeekInputString(value: unknown): asserts value is WeekInputString {
	if (!(typeof value === 'string' && value.match(WeekInputStringRegExp))) {
		throw new Error('Expecting week value in format `YYYY-W52`, got ' + JSON.stringify(value))
	}
}

export type MonthInputString = string
export const MonthInputStringRegExp = /^\d{4}-\d{2}$/
export function assertMonthInputString(value: unknown): asserts value is MonthInputString {
	if (!(typeof value === 'string' && value.match(MonthInputStringRegExp))) {
		throw new Error('Expecting month value in format `YYYY-MM`, got ' + JSON.stringify(value))
	}
}

export type ColorString = string
export const ColorRegExp = /^#(?:[0-9abcdef]{3,4}|[0-9abcdef]{6}|[0-9abcdef]{8})$/
export function assertColorString(value: unknown): asserts value is ColorString {
	if (!(typeof value === 'string' && value.match(ColorRegExp))) {
		throw new Error('Expecting color value in format `#RGB`, `#RGBA`, `#RRGGBB` or `#RRGGBBAA`, got ' + JSON.stringify(value))
	}
}
