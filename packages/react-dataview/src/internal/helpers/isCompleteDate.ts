// A date input reports every keystroke of the year, so typing 2020 passes through 0002, 0020 and 0202.
export const isCompleteDate = (value: string): boolean => {
	const match = value.match(/^(\d{4})-\d{2}-\d{2}$/)
	return match !== null && Number(match[1]) >= 1000
}
