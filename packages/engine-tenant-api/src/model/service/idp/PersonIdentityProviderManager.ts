import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'
import { DisconnectIdpErrorCode } from '../../../schema/index.js'
import { DatabaseContext } from '../../utils/index.js'
import { PersonIdentityProviderRow, PersonIdentityProvidersQuery, PersonRow } from '../../queries/index.js'
import { DisconnectPersonIdentityProviderCommand } from '../../commands/idp/DisconnectPersonIdentityProviderCommand.js'

/**
 * Manages the external IdP connections of the *currently authenticated* person.
 *
 * Lock-out policy: a person may always disconnect a provider as long as it does
 * not remove their last remaining sign-in method. A connection is refused only
 * when, after removal, the person would have no password, no passwordless
 * sign-in enabled and no other IdP connection left — which would lock them out
 * of their account entirely.
 */
export class PersonIdentityProviderManager {
	public async listPersonIdentityProviders(db: DatabaseContext, personId: string): Promise<PersonIdentityProviderRow[]> {
		return await db.queryHandler.fetch(new PersonIdentityProvidersQuery(personId))
	}

	public async disconnectIdentityProvider(db: DatabaseContext, person: PersonRow, identityProviderSlug: string): Promise<DisconnectIDPResponse> {
		return await db.transaction(async db => {
			const connections = await db.queryHandler.fetch(new PersonIdentityProvidersQuery(person.id))
			const connection = connections.find(it => it.identityProviderSlug === identityProviderSlug)
			if (!connection) {
				return new ResponseError('NOT_FOUND', `You are not connected to the identity provider "${identityProviderSlug}".`)
			}

			const hasPassword = person.password_hash !== null
			const hasPasswordless = person.passwordless_enabled === true
			const otherConnections = connections.filter(it => it.id !== connection.id)
			const wouldLockOut = !hasPassword && !hasPasswordless && otherConnections.length === 0
			if (wouldLockOut) {
				return new ResponseError(
					'LAST_AUTH_METHOD',
					'Cannot disconnect the only remaining sign-in method. Set up a password or another sign-in method first.',
				)
			}

			await db.commandBus.execute(new DisconnectPersonIdentityProviderCommand(person.id, connection.id))
			return new ResponseOk(null)
		})
	}
}

export type DisconnectIDPResponse = Response<null, DisconnectIdpErrorCode>
