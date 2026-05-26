import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { UserMailer } from '../mailing/index.js'
import { PersonQuery, PersonRow } from '../queries/index.js'
import { PermissionContext } from '../authorization/index.js'
import { ProjectManager } from './ProjectManager.js'
import { ApiKeyManager } from './apiKey/index.js'
import { EmailValidator, EmailValidatorError } from './EmailValidator.js'
import { DatabaseContext } from '../utils/index.js'
import { ImplementationException } from '../../exceptions.js'
import { getPreferredProject } from './helpers/getPreferredProject.js'
import { CreatePersonTokenCommand, InvalidateTokenCommand, MarkEmailVerifiedCommand } from '../commands/index.js'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery.js'
import { NextMailAttemptQuery } from '../queries/authLog/NextMailAttemptQuery.js'
import { validateToken } from '../utils/index.js'
import { normalizeEmail } from '../utils/email.js'
import { PersonToken } from '../type/index.js'
import { UniqueViolationError } from '@contember/database'

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

	/**
	 * Request an e-mail change. Validation and rate-limiting run BEFORE any
	 * write, so a rejected request never leaves a half-applied profile (e.g. a
	 * persisted name change without the e-mail change going through). Any
	 * immediate side-changes the caller wants applied atomically with the token
	 * (the name change) are passed via `applyWithinTransaction`.
	 */
	public async requestEmailChange(
		dbContext: DatabaseContext,
		permissionContext: PermissionContext,
		person: PersonRow,
		newEmail: string,
		mailOptions: MailOptions = {},
		applyWithinTransaction?: (db: DatabaseContext) => Promise<void>,
	): Promise<RequestEmailChangeResponse> {
		const normalizedNewEmail = normalizeEmail(newEmail)
		const validationError = await this.emailValidator.validateEmail(dbContext, normalizedNewEmail)
		if (validationError !== null) {
			return new ResponseError(validationError.error, validationError.errorMessage)
		}

		// Per-recipient exponential backoff: an authenticated user (or a hijacked
		// session) must not be able to flood an arbitrary address with
		// "confirm your new e-mail" mails. Keyed on the normalized NEW address so
		// the `email_change_init` auth-log entries (written with the same
		// normalized address) actually drive the backoff. Reuses login_* config.
		const nextAllowed = await dbContext.queryHandler.fetch(
			new NextMailAttemptQuery(normalizedNewEmail, 'email_change_init', 'email_change_complete'),
		)
		if (nextAllowed > dbContext.providers.now()) {
			return new ResponseError('RATE_LIMIT_EXCEEDED', 'Too many e-mail change requests for this address.')
		}

		const projects = await this.projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
		const project = getPreferredProject(projects, mailOptions.project ?? null)

		await dbContext.transaction(async db => {
			if (applyWithinTransaction) {
				await applyWithinTransaction(db)
			}
			const result = await db.commandBus.execute(
				CreatePersonTokenCommand.createEmailChangeRequest(person.id, normalizedNewEmail),
			)
			// The verification link goes to the NEW address — clicking it proves
			// ownership of the address being switched to, which is the whole point.
			await this.mailer.sendEmailChangeVerifyEmail(
				db,
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
		})
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
		try {
			await dbContext.transaction(async db => {
				await db.commandBus.execute(new InvalidateTokenCommand(validation.result.id))
				await db.commandBus.execute(new MarkEmailVerifiedCommand(person.id, newEmail))
				// An email change is a takeover-grade event: drop every existing
				// session so a stale attacker session cannot ride the new address.
				await this.apiKeyManager.disableIdentityApiKeys(db, person.identity_id)
			})
		} catch (e) {
			// The uniqueness re-check above narrows but cannot fully close the
			// window: another account may claim the address between the check and
			// this UPDATE. The unique index is the real guard — translate its
			// violation into a clean error instead of leaking a 500.
			if (e instanceof UniqueViolationError) {
				return new ResponseError('EMAIL_ALREADY_EXISTS', `User with email ${newEmail} already exists`)
			}
			throw e
		}

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

export type RequestEmailChangeResponse = Response<null, EmailValidatorError | 'RATE_LIMIT_EXCEEDED'>

export type ConfirmEmailChangeResponse = Response<
	{ personId: string; newEmail: string },
	PersonToken.TokenValidationError | EmailValidatorError
>
