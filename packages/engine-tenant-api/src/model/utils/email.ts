import { Literal } from '@contember/database'

export const normalizeEmail = (email: string) => {
	return email.replaceAll(/\s/g, '').toLocaleLowerCase()
}
