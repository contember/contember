import { Command } from '../Command'
import { AuthActionType } from '../../type/AuthLog'
import { InsertBuilder } from '@contember/database'
import { JSONValue } from '@contember/schema'

export class CreateAuthLogEntryCommand implements Command<void> {
	constructor(
		private readonly data: CreateAuthLogEntryCommand.Entry,
	) {
	}


	async execute({ db, providers }: Command.Args): Promise<void> {
		await InsertBuilder.create()
			.into('person_auth_log')
			.values({
				id: providers.uuid(),
				invoked_by_id: this.data.invokedById,
				person_id: this.data.personId,
				person_input_identifier: this.data.personInputIdentifier,
				person_token_id: this.data.personTokenId,
				type: this.data.type,
				success: this.data.success,
				error_code: this.data.errorCode,
				error_message: this.data.errorMessage,
				ip_address: this.data.ipAddress,
				user_agent: this.data.userAgent,
				identity_provider_id: this.data.identityProviderId,
				metadata: this.data.metadata ?? {},
			})
			.execute(db)

	}
}

namespace CreateAuthLogEntryCommand {
	export type Entry = {
		type: AuthActionType
		invokedById: string
		personInputIdentifier?: string
		personId?: string
		personTokenId?: string
		success: boolean
		errorCode?: string
		errorMessage?: string
		ipAddress?: string
		userAgent?: string
		identityProviderId?: string
		metadata?: JSONValue
	}
}
