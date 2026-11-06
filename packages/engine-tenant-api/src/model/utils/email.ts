export const normalizeEmail = (email: string) => {
	return email.replaceAll(/\s/g, '').toLocaleLowerCase()
}

/**
 * An e-mail address a client entered, parsed once where it enters. A mail to anyone but a stored person
 * (see `MailPerson`) needs one, so no raw input string can become a recipient.
 */
export class EmailAddress {
	private constructor(public readonly value: string) {}

	/**
	 * Drops surrounding whitespace. Whitespace inside makes the input invalid (null) instead of being stripped, so
	 * the input cannot stand for a different address than the one used. Case is kept: a lookup also matches legacy
	 * rows stored with their original case.
	 */
	static parse(input: string): EmailAddress | null {
		const email = input.trim()
		return email === '' || /\s/.test(email) ? null : new EmailAddress(email)
	}

	/** The form new addresses are stored in (see `normalizeEmail`). */
	normalized(): EmailAddress {
		return new EmailAddress(normalizeEmail(this.value))
	}
}

export const validateEmail = (email: string): boolean => {
	return email.length >= 3
		&& email.includes('@')
		&& !!email.match(/^[^\s@]+@[\w_-]+(\.[\w_-]+)*$/)
}
