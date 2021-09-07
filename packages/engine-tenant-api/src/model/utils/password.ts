export const MIN_PASSWORD_LENGTH = 6
export const isWeakPassword = (password: string) => password.length < MIN_PASSWORD_LENGTH
export const getPasswordWeaknessMessage = (password: string): null | string => {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return `Password is too weak. Minimum length is ${MIN_PASSWORD_LENGTH}`
	}
	return null
}
