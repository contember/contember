import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { UserMailer } from '../mailing/index.js'
import { PersonQuery, PersonRow } from '../queries/index.js'
import { PermissionContext } from '../authorization/index.js'
import { ProjectManager } from './ProjectManager.js'
import { DatabaseContext } from '../utils/index.js'
import { ImplementationException } from '../../exceptions.js'
import { getPreferredProject } from './helpers/getPreferredProject.js'
import { CreatePersonTokenCommand, InvalidateTokenCommand, MarkEmailVerifiedCommand } from '../commands/index.js'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery.js'
import { NextMailAttemptQuery } from '../queries/authLog/NextMailAttemptQuery.js'
import { validateToken } from '../utils/index.js'
import { PersonToken } from '../type/index.js'
import { AuthLogService } from './AuthLogService.js'

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
		const retryAfter = await dbContext.queryHandler.fetch(
			new NextMailAttemptQuery(person.email, 'email_verify_init', 'email_verify_complete'),
		)
		if (retryAfter > 0) {
			return false
		}

		const result = await dbContext.commandBus.execute(CreatePersonTokenCommand.createEmailVerificationRequest(person.id, person.email))
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
			// Carry whatever we know about the subject so the audit log can tie the
			// failure to a person/token even on an invalid/expired token (matches
			// PasswordResetManager — see email_verify_complete audit entry).
			return new ResponseError(validation.error, validation.errorMessage, {
				[AuthLogService.Key]: new AuthLogService.Bag(
					tokenRow ? { personId: tokenRow.person_id, tokenId: tokenRow.id } : {},
				),
			})
		}
		const authLogData = new AuthLogService.Bag({
			personId: validation.result.person_id,
			tokenId: validation.result.id,
		})
		const person = await dbContext.queryHandler.fetch(PersonQuery.byId(validation.result.person_id))
		if (!person) {
			throw new ImplementationException()
		}
		// Bind the token to the address it was issued for: if the person's e-mail
		// changed after the token was minted (an admin profile edit, or a separate
		// email-change flow), a stale verification link must not stamp the new,
		// unproven address as verified. Tokens issued before this binding carry no
		// email payload — fall back to the legacy behaviour for those.
		const issuedFor = validation.result.meta?.email
		if (issuedFor != null && issuedFor !== person.email) {
			return new ResponseError('TOKEN_INVALID', 'Verification token was issued for a different e-mail address', {
				[AuthLogService.Key]: authLogData,
			})
		}
		return await dbContext.transaction(async db => {
			await db.commandBus.execute(new InvalidateTokenCommand(validation.result.id))
			await db.commandBus.execute(new MarkEmailVerifiedCommand(validation.result.person_id))
			return new ResponseOk({ [AuthLogService.Key]: authLogData })
		})
	}
}

export type VerifyEmailResponse = Response<
	{ [AuthLogService.Key]: AuthLogService.Bag },
	PersonToken.TokenValidationError,
	{ [AuthLogService.Key]: AuthLogService.Bag }
>
