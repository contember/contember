import { CommandBus } from '../commands/CommandBus'
import { Client } from '@contember/database'
import {
	AddProjectMemberCommand,
	AddProjectMemberCommandError,
	CreateIdentityCommand,
	CreatePersonCommand,
} from '../commands'
import { Providers } from '../providers'
import { PersonQuery, PersonRow } from '../queries'
import { Membership } from '../type/Membership'
import { InviteErrorCode } from '../../schema'
import { ImplementationException } from '../../exceptions'
import { TenantRole } from '../authorization/Roles'

export class InviteManager {
	constructor(private readonly client: Client, private readonly providers: Providers) {}

	async invite(email: string, projectId: string, memberships: readonly Membership[]): Promise<InviteResponse> {
		return await this.client.transaction(async trx => {
			const bus = new CommandBus(trx, this.providers)
			let person: Omit<PersonRow, 'roles'> | null = await trx.createQueryHandler().fetch(PersonQuery.byEmail(email))
			let generatedPassword
			if (!person) {
				const identityId = await bus.execute(new CreateIdentityCommand([TenantRole.PERSON]))
				generatedPassword = (await this.providers.randomBytes(9)).toString('base64')
				person = await bus.execute(new CreatePersonCommand(identityId, email, generatedPassword))
			}
			const result = await bus.execute(new AddProjectMemberCommand(projectId, person.identity_id, memberships))
			if (result.ok) {
				return new InviteResponseOk(person, generatedPassword)
			}
			trx.connection.rollback()
			switch (result.error) {
				case AddProjectMemberCommandError.alreadyMember:
					return new InviteResponseError([InviteErrorCode.AlreadyMember])
				case AddProjectMemberCommandError.projectNotFound:
				case AddProjectMemberCommandError.identityNotfound:
					throw new ImplementationException()
			}
		})
	}
}

export type InviteResponse = InviteResponseOk | InviteResponseError

export class InviteResponseOk {
	readonly ok = true

	constructor(public readonly person: Omit<PersonRow, 'roles'>, public readonly generatedPassword?: string) {}
}

export class InviteResponseError {
	readonly ok = false

	constructor(public readonly errors: Array<InviteErrorCode>) {}
}
