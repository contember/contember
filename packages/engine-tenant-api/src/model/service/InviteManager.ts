import { CommandBus, CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { Client } from '@contember/database'
import { Providers } from '../providers'
import { PersonQuery, PersonRow } from '../queries'
import { Membership } from '../type/Membership'
import { InviteErrorCode } from '../../schema'
import { TenantRole } from '../authorization'
import { UserMailer } from '../mailing'
import { Project } from '../type'
import { createAppendMembershipVariables } from './membershipUtils'
import { CreateOrUpdateProjectMembershipCommand } from '../commands/membership/CreateOrUpdateProjectMembershipCommand'

export interface InviteOptions {
	noEmail?: boolean
	password?: string
}

export class InviteManager {
	constructor(
		private readonly client: Client,
		private readonly providers: Providers,
		private readonly mailer: UserMailer,
	) {}

	async invite(
		email: string,
		project: Project,
		memberships: readonly Membership[],
		options: InviteOptions = {},
	): Promise<InviteResponse> {
		return await this.client.transaction(async trx => {
			const bus = new CommandBus(trx, this.providers)
			let person: Omit<PersonRow, 'roles'> | null = await trx.createQueryHandler().fetch(PersonQuery.byEmail(email))
			const isNew = !person
			let generatedPassword: string = ''
			if (!person) {
				const identityId = await bus.execute(new CreateIdentityCommand([TenantRole.PERSON]))
				generatedPassword = options.password || (await this.providers.randomBytes(9)).toString('base64')
				person = await bus.execute(new CreatePersonCommand(identityId, email, generatedPassword))
			}
			for (const membershipUpdate of createAppendMembershipVariables(memberships)) {
				await bus.execute(new CreateOrUpdateProjectMembershipCommand(project.id, person.identity_id, membershipUpdate))
			}
			if (!options.noEmail) {
				const customMailOptions = {
					projectId: project.id,
					variant: '',
				}
				if (isNew) {
					await this.mailer.sendNewUserInvitedMail(
						{ email, project: project.name, password: generatedPassword },
						customMailOptions,
					)
				} else {
					await this.mailer.sendExistingUserInvitedEmail({ email, project: project.name }, customMailOptions)
				}
			}
			return new InviteResponseOk(person, isNew)
		})
	}
}

export type InviteResponse = InviteResponseOk | InviteResponseError

export class InviteResponseOk {
	readonly ok = true

	constructor(public readonly person: Omit<PersonRow, 'roles'>, public readonly isNew: boolean) {}
}

export class InviteResponseError {
	readonly ok = false

	constructor(public readonly errors: Array<InviteErrorCode>) {}
}
