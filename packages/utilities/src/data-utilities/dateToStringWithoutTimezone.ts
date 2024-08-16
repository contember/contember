export const dateToStringWithoutTimezone = (date: Date, { includeTime }: { includeTime?: boolean } = {}): string => {
	const [year, month, day] = [
		date.getFullYear(),
		(date.getMonth() + 1).toFixed(0).padStart(2, '0'),
		date.getDate().toFixed(0).padStart(2, '0'),
	]
	let serialized = `${year}-${month}-${day}`

	if (includeTime) {
		const [hours, minutes] = [
			date.getHours().toFixed(0).padStart(2, '0'),
			date.getMinutes().toFixed(0).padStart(2, '0'),
		]
		serialized += ` ${hours}:${minutes}`
	}

	return serialized
}
