import { DatabaseContext } from '../utils'
import { validateEmail } from '../utils/email'
import { ResponseError } from '../utils/Response'
import { PersonQuery } from '../queries'

export class EmailValidator {

	public async validateEmail(db: DatabaseContext, email: string): Promise<ResponseError<EmailValidatorError> | null> {
		if (!validateEmail(email.trim())) {
			return new ResponseError('INVALID_EMAIL_FORMAT', 'E-mail address is not in a valid format')
		}
		if (await this.isEmailAlreadyUsed(db, email)) {
			return new ResponseError('EMAIL_ALREADY_EXISTS', `User with email ${email} already exists`)
		}
		return null
	}

	private async isEmailAlreadyUsed(db: DatabaseContext, email: string): Promise<boolean> {
		const personOrNull = await db.queryHandler.fetch(PersonQuery.byEmail(email))
		return personOrNull !== null
	}
}

export type EmailValidatorError =
	| 'EMAIL_ALREADY_EXISTS'
	| 'INVALID_EMAIL_FORMAT'
