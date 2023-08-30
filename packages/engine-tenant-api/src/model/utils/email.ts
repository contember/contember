export const normalizeEmail = (email: string) => {
	return email.replaceAll(/\s/g, '').toLocaleLowerCase()
}

export const validateEmail = (email: string): boolean => {
	return email.length >= 3
		&& email.includes('@')
		&& !!email.match(/^[^\s@]+@[\w_-]+(\.[\w_-]+)*$/)
}
