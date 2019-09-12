export const ErrorCodeString: { [key: string]: string } = {
	TOO_WEAK: 'Password is too weak.',
	EMAIL_ALREADY_EXISTS: 'Email already exists.',
	UNKNOWN_EMAIL: 'Unknown email.',
	INVALID_PASSWORD: 'Password is invalid',
	ALREADY_MEMBER: 'User is already member of this project.',
}

export const getErrorCodeString = (code: string): string => {
	if (code in ErrorCodeString) {
		return ErrorCodeString[code]
	}
	return code
}
