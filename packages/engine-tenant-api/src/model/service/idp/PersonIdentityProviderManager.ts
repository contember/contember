import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'
import { DisconnectIdpErrorCode } from '../../../schema/index.js'
import { DatabaseContext } from '../../utils/index.js'
import { ConfigurationQuery, PersonIdentityProviderRow, PersonIdentityProvidersQuery, PersonRow } from '../../queries/index.js'
import { DisconnectPersonIdentityProviderCommand } from '../../commands/idp/DisconnectPersonIdentityProviderCommand.js'
import { isPasswordlessEnabled } from '../helpers/isPasswordlessEnabled.js'

/**
 * Manages the external IdP connections of the *currently authenticated* person.
 *
 * Lock-out policy: a person may always disconnect a provider as long as it does
 * not remove their last remaining sign-in method. A connection is refused only
 * when, after removal, the person would have no password, no passwordless
 * sign-in enabled and no other *usable* IdP connection left — which would lock
 * them out of their account entirely. Whether passwordless counts is decided by
 * the same tenant policy the sign-in flow applies, and connections to disabled
 * providers are not counted as a usable fallback (they cannot sign in).
 */
export class PersonIdentityProviderManager {
	public async listPersonIdentityProviders(db: DatabaseContext, personId: string): Promise<PersonIdentityProviderRow[]> {
		return await db.queryHandler.fetch(new PersonIdentityProvidersQuery(personId))
	}

	public async disconnectIdentityProvider(db: DatabaseContext, person: PersonRow, connectionId: string): Promise<DisconnectIDPResponse> {
		return await db.transaction(async db => {
			const connections = await db.queryHandler.fetch(new PersonIdentityProvidersQuery(person.id))
			const connection = connections.find(it => it.id === connectionId)
			if (!connection) {
				return new ResponseError('NOT_FOUND', `You are not connected to the identity provider connection "${connectionId}".`)
			}

			const configuration = await db.queryHandler.fetch(new ConfigurationQuery(db.providers))
			const hasPassword = person.password_hash !== null
			const hasPasswordless = isPasswordlessEnabled(configuration.passwordless.enabled, person.passwordless_enabled)
			const otherUsableConnections = connections.filter(it => it.id !== connection.id && it.identityProviderDisabledAt === null)
			const wouldLockOut = !hasPassword && !hasPasswordless && otherUsableConnections.length === 0
			if (wouldLockOut) {
				return new ResponseError(
					'LAST_AUTH_METHOD',
					'Cannot disconnect the only remaining sign-in method. Set up a password or another sign-in method first.',
				)
			}

			await db.commandBus.execute(new DisconnectPersonIdentityProviderCommand(person.id, connection.id))
			return new ResponseOk({ slug: connection.identityProviderSlug })
		})
	}
}

export interface DisconnectIDPResult {
	readonly slug: string
}

export type DisconnectIDPResponse = Response<DisconnectIDPResult, DisconnectIdpErrorCode>
