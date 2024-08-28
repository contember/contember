import { Response, ResponseError } from '../utils/Response'
import { getPasswordWeaknessMessage } from '../utils/password'
import { UserMailer } from '../mailing'
import { PersonRow } from '../queries'
import { PermissionContext } from '../authorization'
import { ProjectManager } from './ProjectManager'
import { DatabaseContext } from '../utils'
import { ImplementationException } from '../../exceptions'
import { getPreferredProject } from './helpers/getPreferredProject'
import { CreatePersonTokenCommand, ResetPasswordCommand, ResetPasswordCommandErrorCode } from '../commands/personToken'

interface MailOptions {
	project?: string
	mailVariant?: string
}

export class PasswordResetManager {
	constructor(
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
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
		const weakPassword = getPasswordWeaknessMessage(password)
		if (weakPassword) {
			return new ResponseError('PASSWORD_TOO_WEAK', weakPassword)
		}
		return await dbContext.commandBus.execute(new ResetPasswordCommand(token, password))
	}
}

export type ResetPasswordErrorCode = 'PASSWORD_TOO_WEAK'

export type ResetPasswordResponse = Response<null, ResetPasswordErrorCode | ResetPasswordCommandErrorCode>
