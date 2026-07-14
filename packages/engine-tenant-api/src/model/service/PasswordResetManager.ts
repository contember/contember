import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { UserMailer } from '../mailing/index.js'
import { ConfigurationQuery, PersonRow } from '../queries/index.js'
import { PermissionContext } from '../authorization/index.js'
import { ProjectManager } from './ProjectManager.js'
import { DatabaseContext } from '../utils/index.js'
import { ImplementationException } from '../../exceptions.js'
import { getPreferredProject } from './helpers/getPreferredProject.js'
import { CreatePersonTokenCommand, ResetPasswordCommand } from '../commands/personToken/index.js'
import { PasswordStrengthValidator } from './PasswordStrengthValidator.js'
import { ResetPasswordErrorCode, WeakPasswordReason } from '../../schema/index.js'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery.js'
import { AuthLogService } from './AuthLogService.js'
import { NextMailAttemptQuery } from '../queries/authLog/NextMailAttemptQuery.js'

interface MailOptions {
	project?: string
	mailVariant?: string
}

export class PasswordResetManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
		private readonly passwordStrengthValidator: PasswordStrengthValidator,
	) {}

	public async createPasswordResetRequest(
		dbContext: DatabaseContext,
		permissionContext: PermissionContext,
		person: PersonRow,
		mailOptions: MailOptions = {},
	): Promise<void> {
		if (!person.email) {
			throw new ImplementationException()
		}

		// Per-email exponential backoff on outbound mails — don't spam a real
		// user with reset mails just because attackers keep poking the
		// endpoint. Reuses login_* backoff config against person_auth_log.
		const retryAfter = await dbContext.queryHandler.fetch(
			new NextMailAttemptQuery(person.email, 'password_reset_init', 'password_reset'),
		)
		if (retryAfter > 0) {
			return
		}

		const result = await dbContext.commandBus.execute(CreatePersonTokenCommand.createPasswordResetRequest(person.id))
		const projects = await this.projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
		const project = getPreferredProject(projects, mailOptions.project ?? null)

		await this.mailer.sendPasswordResetEmail(
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
	}

	public async resetPassword(dbContext: DatabaseContext, token: string, password: string): Promise<ResetPasswordResponse> {
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery(dbContext.providers))
		const tokenRow = await dbContext.queryHandler.fetch(PersonTokenQuery.byToken(token, 'password_reset'))
		if (!tokenRow) {
			return new ResponseError('TOKEN_NOT_FOUND', 'Token not found', {
				[AuthLogService.Key]: new AuthLogService.Bag({}),
			})
		}

		const authLogData = new AuthLogService.Bag({
			personId: tokenRow.person_id,
			tokenId: tokenRow.id,
		})
		const weakPassword = await this.passwordStrengthValidator.verify(password, config.password, 'PASSWORD_TOO_WEAK')
		if (!weakPassword.ok) {
			return new ResponseError(weakPassword.error, weakPassword.errorMessage, {
				...weakPassword.metadata ?? {},
				[AuthLogService.Key]: authLogData,
			})
		}
		const resetPasswordResult = await dbContext.commandBus.execute(new ResetPasswordCommand(token, password))
		if (!resetPasswordResult.ok) {
			return new ResponseError(resetPasswordResult.error, resetPasswordResult.errorMessage, {
				...resetPasswordResult.metadata ?? {},
				[AuthLogService.Key]: authLogData,
			})
		}
		return new ResponseOk({
			[AuthLogService.Key]: authLogData,
		})
	}
}

export type ResetPasswordResponse = Response<
	{
		[AuthLogService.Key]: AuthLogService.Bag
	},
	ResetPasswordErrorCode,
	{
		weakPasswordReasons?: WeakPasswordReason[]
		[AuthLogService.Key]: AuthLogService.Bag
	}
>
