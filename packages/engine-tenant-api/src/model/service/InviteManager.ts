import {
	CreateIdentityCommand,
	CreateOrUpdateProjectMembershipCommand,
	CreatePasswordResetRequestCommand,
	CreatePersonCommand,
	SavePasswordResetRequestCommand,
} from '../commands/index.js'
import { Providers } from '../providers.js'
import { PersonQuery, PersonRow } from '../queries/index.js'
import { Membership, Project } from '../type/index.js'
import { InviteErrorCode, InviteMethod } from '../../schema/index.js'
import { TenantRole } from '../authorization/index.js'
import { UserMailer } from '../mailing/index.js'
import { createAppendMembershipVariables } from './membershipUtils.js'
import { Response, ResponseOk } from '../utils/Response.js'
import { DatabaseContext, TokenHash } from '../utils/index.js'
import { NoPassword, PasswordPlain } from '../dtos/index.js'

export interface InviteOptions {
	noEmail?: boolean
	password?: string
	emailVariant?: string
	method?: InviteMethod
	passwordResetTokenHash?: TokenHash
}

const INVITATION_RESET_TOKEN_EXPIRATION_MINUTES = 60 * 24

export class InviteManager {
	constructor(
		private readonly providers: Providers,
		private readonly mailer: UserMailer,
	) {}

	async invite(
		dbContext: DatabaseContext,
		email: string,
		project: Project,
		memberships: readonly Membership[],
		{ method, emailVariant, noEmail = false, password, passwordResetTokenHash }: InviteOptions = {},
	): Promise<InviteResponse> {
		return await dbContext.transaction(async trx => {
			let person: Omit<PersonRow, 'roles'> | null = await trx.queryHandler.fetch(PersonQuery.byEmail(email))
			const isNew = !person
			let generatedPassword: string | null = null
			let resetToken: string | null = null
			if (!person) {
				const identityId = await trx.commandBus.execute(new CreateIdentityCommand([TenantRole.PERSON]))

				generatedPassword = password ??
					(method === InviteMethod.CreatePassword ? (await this.providers.randomBytes(9)).toString('base64') : null)
				const passwordWrapper = generatedPassword !== null ? new PasswordPlain(generatedPassword) : NoPassword

				person = await trx.commandBus.execute(new CreatePersonCommand(identityId, email, passwordWrapper))
				if (method === InviteMethod.ResetPassword) {
					const result = await trx.commandBus.execute(new CreatePasswordResetRequestCommand(person.id, INVITATION_RESET_TOKEN_EXPIRATION_MINUTES))
					resetToken = result.token
				}
				if (passwordResetTokenHash) {
					await trx.commandBus.execute(new SavePasswordResetRequestCommand(person.id, passwordResetTokenHash, INVITATION_RESET_TOKEN_EXPIRATION_MINUTES))
				}
			}
			for (const membershipUpdate of createAppendMembershipVariables(memberships)) {
				await trx.commandBus.execute(new CreateOrUpdateProjectMembershipCommand(project.id, person.identity_id, membershipUpdate))
			}
			if (!noEmail) {
				const customMailOptions = {
					projectId: project.id,
					variant: emailVariant ?? '',
				}
				if (isNew) {
					await this.mailer.sendNewUserInvitedMail(
						trx,
						{ email, project: project.name, password: generatedPassword, token: resetToken },
						customMailOptions,
					)
				} else {
					await this.mailer.sendExistingUserInvitedEmail(trx, { email, project: project.name }, customMailOptions)
				}
			}
			return new ResponseOk(new InviteResult(person, isNew))
		})
	}
}

export type InviteResponse = Response<InviteResult, InviteErrorCode>

export class InviteResult {
	constructor(public readonly person: Omit<PersonRow, 'roles'>, public readonly isNew: boolean) {}
}
