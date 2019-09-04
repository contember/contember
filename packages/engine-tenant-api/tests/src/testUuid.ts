export const testUuidPrefix = '123e4567-e89b-12d3-a456-'
export const testUuid = (number: number) => {
	return testUuidPrefix + number.toString().padStart(12, '0')
}
