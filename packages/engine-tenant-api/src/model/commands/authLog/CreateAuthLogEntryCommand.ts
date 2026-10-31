import { Command } from '../Command.js'
import { AuthActionType } from '../../type/AuthLog.js'
import { ConflictActionType, InsertBuilder } from '@contember/database'
import { JSONValue } from '@contember/schema'

export class CreateAuthLogEntryCommand implements Command<void> {
	constructor(
		private readonly data: CreateAuthLogEntryCommand.Entry,
	) {
	}

	async execute({ db, providers }: Command.Args): Promise<void> {
		const insert = InsertBuilder.create()
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
				trust_id: this.data.trustId,
				token_ref: this.data.tokenRef,
			})
		// A token's success row is unique per (trust_id, token_ref); a repeat sighting from another worker is ignored.
		await (this.data.tokenRef !== undefined ? insert.onConflict(ConflictActionType.doNothing) : insert).execute(db)
	}
}

namespace CreateAuthLogEntryCommand {
	export type Entry = {
		type: AuthActionType
		/** The identity that initiated the action. Omit (→ NULL) when there is no acting identity, e.g. an IdP-initiated back-channel logout. */
		invokedById?: string
		personInputIdentifier?: string
		personId?: string
		/** A `person_token` id (password reset, e-mail verification, passwordless). FK-checked, so never an `api_key` id: put that in `eventData`. */
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
		/** The workload identity trust of a `workload_*` entry. */
		trustId?: string
		/** The `jti` of an admitted workload token, or `sha256:` + its hash; makes the insert ignore a duplicate. */
		tokenRef?: string
	}
}
