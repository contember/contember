import { Command } from '../Command.js'
import { AuthActionType } from '../../type/AuthLog.js'
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
				target_person_id: this.data.targetPersonId,
				event_data: this.data.eventData,
				geo_country: this.data.geoCountry,
				device_fingerprint: this.data.deviceFingerprint,
			})
			.execute(db)
	}
}

namespace CreateAuthLogEntryCommand {
	export type Entry = {
		type: AuthActionType
		/** The identity that initiated the action. Omit (→ NULL) when there is no acting identity, e.g. an IdP-initiated back-channel logout. */
		invokedById?: string
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
		targetPersonId?: string
		eventData?: JSONValue
		/** A03: country derived from the trusted reverse-proxy geo header, when present. */
		geoCountry?: string
		/** A03: hash of the client user-agent (never the raw UA). */
		deviceFingerprint?: string
	}
}
