export const testUuidPrefix = '123e4567-e89b-12d3-'
export const testUuid = (number: number, prefix = 'a456') => {
	return testUuidPrefix + prefix + '-' + number.toString().padStart(12, '0')
}
