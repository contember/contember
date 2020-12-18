export const validateInstanceName = (name: string) => {
	if (!name.match(/^[a-z][-_a-z0-9]*$/)) {
		throw 'Invalid instance name. It can contain only alphanumeric letters and cannot start with a number'
	}
}
