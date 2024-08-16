export const tenantErrorMessages: { [key: string]: string } = {
	TOO_WEAK: 'Password is too weak.',
	EMAIL_ALREADY_EXISTS: 'Email already exists.',
	UNKNOWN_EMAIL: 'Unknown email.',
	INVALID_PASSWORD: 'Password is invalid.',
	ALREADY_MEMBER: 'User is already a member of this project.',
}

export const getTenantErrorMessage = (errorCode: string): string => {
	if (errorCode in tenantErrorMessages) {
		return tenantErrorMessages[errorCode]
	}
	return `Unknown error occurred. [${errorCode}]`
}
