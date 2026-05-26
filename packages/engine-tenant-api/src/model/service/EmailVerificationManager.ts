import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { UserMailer } from '../mailing'
import { PersonRow } from '../queries'
import { PermissionContext } from '../authorization'
import { ProjectManager } from './ProjectManager'
import { DatabaseContext } from '../utils'
import { ImplementationException } from '../../exceptions'
import { getPreferredProject } from './helpers/getPreferredProject'
import { CreatePersonTokenCommand, InvalidateTokenCommand, MarkEmailVerifiedCommand } from '../commands'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'
import { NextMailAttemptQuery } from '../queries/authLog/NextMailAttemptQuery'
import { validateToken } from '../utils'
import { PersonToken } from '../type'

interface MailOptions {
	project?: string
	mailVariant?: string
}

export class EmailVerificationManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
	) {}

	/**
	 * Sends a verification mail unless the per-email backoff says to hold off.
	 * Returns whether a mail was actually sent, so the caller only records an
	 * `email_verify_init` audit entry for mails that really went out — otherwise
	 * a throttled attempt would both tell the user to check their inbox and log
	 * a phantom init that pushes the backoff out further.
	 */
	public async sendVerificationEmail(
		dbContext: DatabaseContext,
		permissionContext: PermissionContext,
		person: PersonRow,
		mailOptions: MailOptions = {},
	): Promise<boolean> {
		if (!person.email) {
			throw new ImplementationException()
		}

		// Per-email exponential backoff on outbound mails, so a resend button
		// (or an attacker poking the endpoint) can't be used to flood the
		// mailbox. Reuses the login_* backoff config against person_auth_log.
		const nextAllowed = await dbContext.queryHandler.fetch(
			new NextMailAttemptQuery(person.email, 'email_verify_init', 'email_verify_complete'),
		)
		if (nextAllowed > dbContext.providers.now()) {
			return false
		}

		const result = await dbContext.commandBus.execute(CreatePersonTokenCommand.createEmailVerificationRequest(person.id))
		const projects = await this.projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
		const project = getPreferredProject(projects, mailOptions.project ?? null)

		await this.mailer.sendEmailVerificationEmail(
			dbContext,
			{
				email: person.email,
				token: result.token,
				project: project?.name,
				projectSlug: project?.slug,
			},
			{
				variant: mailOptions.mailVariant || '',
				projectId: project?.id ?? null,
			},
		)
		return true
	}

	public async verifyEmail(dbContext: DatabaseContext, token: string): Promise<VerifyEmailResponse> {
		const tokenRow = await dbContext.queryHandler.fetch(PersonTokenQuery.byToken(token, 'email_verification'))
		const validation = validateToken({ entry: tokenRow, token, now: dbContext.providers.now(), validationType: 'token' })
		if (!validation.ok) {
			return new ResponseError(validation.error, validation.errorMessage)
		}
		return await dbContext.transaction(async db => {
			await db.commandBus.execute(new InvalidateTokenCommand(validation.result.id))
			await db.commandBus.execute(new MarkEmailVerifiedCommand(validation.result.person_id))
			return new ResponseOk(null)
		})
	}
}

export type VerifyEmailResponse = Response<null, PersonToken.TokenValidationError>
