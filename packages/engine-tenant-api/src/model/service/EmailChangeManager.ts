import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { UserMailer } from '../mailing'
import { PersonQuery, PersonRow } from '../queries'
import { PermissionContext } from '../authorization'
import { ProjectManager } from './ProjectManager'
import { ApiKeyManager } from './apiKey'
import { EmailValidator, EmailValidatorError } from './EmailValidator'
import { DatabaseContext } from '../utils'
import { ImplementationException } from '../../exceptions'
import { getPreferredProject } from './helpers/getPreferredProject'
import { CreatePersonTokenCommand, InvalidateTokenCommand, MarkEmailVerifiedCommand } from '../commands'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'
import { validateToken } from '../utils'
import { normalizeEmail } from '../utils/email'
import { PersonToken } from '../type'

interface MailOptions {
	project?: string
	mailVariant?: string
}

export class EmailChangeManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
		private readonly emailValidator: EmailValidator,
		private readonly apiKeyManager: ApiKeyManager,
	) {}

	public async requestEmailChange(
		dbContext: DatabaseContext,
		permissionContext: PermissionContext,
		person: PersonRow,
		newEmail: string,
		mailOptions: MailOptions = {},
	): Promise<RequestEmailChangeResponse> {
		const normalizedNewEmail = normalizeEmail(newEmail)
		const validationError = await this.emailValidator.validateEmail(dbContext, normalizedNewEmail)
		if (validationError !== null) {
			return new ResponseError(validationError.error, validationError.errorMessage)
		}

		const result = await dbContext.commandBus.execute(
			CreatePersonTokenCommand.createEmailChangeRequest(person.id, normalizedNewEmail),
		)
		const projects = await this.projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
		const project = getPreferredProject(projects, mailOptions.project ?? null)

		// The verification link goes to the NEW address — clicking it proves
		// ownership of the address being switched to, which is the whole point.
		await this.mailer.sendEmailChangeVerifyEmail(
			dbContext,
			{
				email: normalizedNewEmail,
				token: result.token,
				project: project?.name,
				projectSlug: project?.slug,
			},
			{
				variant: mailOptions.mailVariant || '',
				projectId: project?.id ?? null,
			},
		)
		return new ResponseOk(null)
	}

	public async confirmEmailChange(dbContext: DatabaseContext, token: string): Promise<ConfirmEmailChangeResponse> {
		const tokenRow = await dbContext.queryHandler.fetch(PersonTokenQuery.byToken(token, 'email_change'))
		const validation = validateToken({ entry: tokenRow, token, now: dbContext.providers.now(), validationType: 'token' })
		if (!validation.ok) {
			return new ResponseError(validation.error, validation.errorMessage)
		}
		const newEmail = validation.result.meta?.email
		if (!newEmail) {
			throw new ImplementationException('email_change token is missing its email payload')
		}

		const person = await dbContext.queryHandler.fetch(PersonQuery.byId(validation.result.person_id))
		if (!person) {
			throw new ImplementationException()
		}

		// Re-check uniqueness at confirmation time: another account may have
		// claimed the address between request and confirmation.
		const validationError = await this.emailValidator.validateEmail(dbContext, newEmail)
		if (validationError !== null) {
			return new ResponseError(validationError.error, validationError.errorMessage)
		}

		const oldEmail = person.email
		await dbContext.transaction(async db => {
			await db.commandBus.execute(new InvalidateTokenCommand(validation.result.id))
			await db.commandBus.execute(new MarkEmailVerifiedCommand(person.id, newEmail))
			// An email change is a takeover-grade event: drop every existing
			// session so a stale attacker session cannot ride the new address.
			await this.apiKeyManager.disableIdentityApiKeys(db, person.identity_id)
		})

		if (oldEmail) {
			await this.mailer.sendEmailChangeNotifyEmail(
				dbContext,
				{ email: oldEmail, newEmail },
				{ projectId: null, variant: '' },
			)
		}

		return new ResponseOk({ personId: person.id, newEmail })
	}
}

export type RequestEmailChangeResponse = Response<null, EmailValidatorError>

export type ConfirmEmailChangeResponse = Response<
	{ personId: string; newEmail: string },
	PersonToken.TokenValidationError | EmailValidatorError
>
