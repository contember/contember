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
