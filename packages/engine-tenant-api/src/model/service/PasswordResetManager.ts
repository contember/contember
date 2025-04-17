import { Response } from '../utils/Response'
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
		const weakPassword = await this.passwordStrengthValidator.verify(password, config.password, 'PASSWORD_TOO_WEAK')
		if (!weakPassword.ok) {
			return weakPassword
		}
		return await dbContext.commandBus.execute(new ResetPasswordCommand(token, password))
	}
}

export type ResetPasswordResponse = Response<null, ResetPasswordErrorCode, {
	weakPasswordReasons?: WeakPasswordReason[]
}>
