import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { UserMailer } from '../mailing'
import { ConfigurationQuery, PersonRow } from '../queries'
import { PermissionContext } from '../authorization'
import { ProjectManager } from './ProjectManager'
import { DatabaseContext } from '../utils'
import { ImplementationException } from '../../exceptions'
import { getPreferredProject } from './helpers/getPreferredProject'
import { CreatePersonTokenCommand, ResetPasswordCommand } from '../commands/personToken'
import { PasswordStrengthValidator } from './PasswordStrengthValidator'
import { ResetPasswordErrorCode, WeakPasswordReason } from '../../schema'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'
import { AuthLogService } from './AuthLogService'

interface MailOptions {
	project?: string
	mailVariant?: string
}

export class PasswordResetManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
		private readonly passwordStrengthValidator: PasswordStrengthValidator,
	) { }

	public async createPasswordResetRequest(
		dbContext: DatabaseContext,
		permissionContext: PermissionContext,
		person: PersonRow,
		mailOptions: MailOptions = {},
	): Promise<void> {
		const result = await dbContext.commandBus.execute(CreatePersonTokenCommand.createPasswordResetRequest(person.id))
		const projects = await this.projectManager.getProjectsByIdentity(dbContext, person.identity_id, permissionContext)
		const project = getPreferredProject(projects, mailOptions.project ?? null)
		if (!person.email) {
			throw new ImplementationException()
		}

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
		const config = await dbContext.queryHandler.fetch(new ConfigurationQuery())
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
		const resetPasswordResult =  await dbContext.commandBus.execute(new ResetPasswordCommand(token, password))
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

export type ResetPasswordResponse = Response<{
	[AuthLogService.Key]: AuthLogService.Bag
}, ResetPasswordErrorCode, {
	weakPasswordReasons?: WeakPasswordReason[]
	[AuthLogService.Key]: AuthLogService.Bag
}>
