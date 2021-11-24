import {
	CreateIdentityCommand,
	CreateOrUpdateProjectMembershipCommand,
	CreatePasswordResetRequestCommand,
	CreatePersonCommand,
} from '../commands'
import { Providers } from '../providers'
import { PersonQuery, PersonRow } from '../queries'
import { Membership } from '../type/Membership'
import { InviteErrorCode, InviteMethod } from '../../schema'
import { TenantRole } from '../authorization'
import { UserMailer } from '../mailing'
import { Project } from '../type'
import { createAppendMembershipVariables } from './membershipUtils'
import { Response, ResponseOk } from '../utils/Response'
import { DatabaseContext } from '../utils'

export interface InviteOptions {
	noEmail?: boolean
	password?: string
	emailVariant?: string
	method?: InviteMethod
}

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
		options: InviteOptions = {},
	): Promise<InviteResponse> {
		return await dbContext.transaction(async trx => {
			let person: Omit<PersonRow, 'roles'> | null = await trx.queryHandler.fetch(PersonQuery.byEmail(email))
			const isNew = !person
			let generatedPassword: string | null = null
			let resetToken: string | null = null
			if (!person) {
				const shouldResetPassword = options.method === InviteMethod.ResetPassword
				const identityId = await trx.commandBus.execute(new CreateIdentityCommand([TenantRole.PERSON]))

				generatedPassword = options.password ??
					(!shouldResetPassword ? (await this.providers.randomBytes(9)).toString('base64') : null)

				person = await trx.commandBus.execute(new CreatePersonCommand(identityId, email, generatedPassword))
				if (shouldResetPassword) {
					const result = await trx.commandBus.execute(new CreatePasswordResetRequestCommand(person.id))
					resetToken = result.token
				}
			}
			for (const membershipUpdate of createAppendMembershipVariables(memberships)) {
				await trx.commandBus.execute(new CreateOrUpdateProjectMembershipCommand(project.id, person.identity_id, membershipUpdate))
			}
			if (!options.noEmail) {
				const customMailOptions = {
					projectId: project.id,
					variant: options.emailVariant || '',
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
