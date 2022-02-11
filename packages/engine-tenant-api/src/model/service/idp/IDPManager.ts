import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { DisableIdpErrorCode, EnableIdpErrorCode, AddIdpErrorCode } from '../../../schema'
import { DatabaseContext } from '../../utils'
import { IdentityProvider } from '../../type'
import { IdentityProviderBySlugQuery } from '../../queries'
import { CreateIdpCommand } from '../../commands/idp/CreateIdpCommand'
import { IDPHandlerRegistry } from './IDPHandlerRegistry'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError'
import { InvalidIDPConfigurationError } from './InvalidIDPConfigurationError'
import { DisableIdpCommand } from '../../commands/idp/DisableIdpCommand'
import { EnableIdpCommand } from '../../commands/idp/EnableIdpCommand'

export class IDPManager {
	constructor(
		private readonly idpRegistry: IDPHandlerRegistry,
	) {
	}

	public async addIDP(db: DatabaseContext, idp: IdentityProvider): Promise<RegisterIDPResponse> {
		return await db.transaction(async db => {
			try {
				const providerService = this.idpRegistry.getHandler(idp.type)
				providerService.validateConfiguration(idp.configuration)
			} catch (e) {
				if (e instanceof IdentityProviderNotFoundError) {
					return new ResponseError(AddIdpErrorCode.UnknownType, `IDP type ${idp.type} not found`)
				}
				if (e instanceof InvalidIDPConfigurationError) {
					return new ResponseError(AddIdpErrorCode.InvalidConfiguration, `Invalid IDP configuration: ${e.message}`)
				}
				throw e
			}

			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(idp.slug))
			if (existing) {
				return new ResponseError(AddIdpErrorCode.AlreadyExists, `IDP with slug ${idp.slug} already exists`)
			}
			await db.commandBus.execute(new CreateIdpCommand(idp))
			return new ResponseOk(null)
		})
	}

	public async disableIDP(db: DatabaseContext, slug: string): Promise<DisableIDPResponse> {
		return await db.transaction(async db => {
			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(slug))
			if (!existing) {
				return new ResponseError(DisableIdpErrorCode.NotFound, `IDP ${slug} not found`)
			}
			if (!existing.disabledAt) {
				await db.commandBus.execute(new DisableIdpCommand(existing.id))
			}
			return new ResponseOk(null)
		})
	}


	public async enableIDP(db: DatabaseContext, slug: string): Promise<EnableIDPResponse> {
		return await db.transaction(async db => {
			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(slug))
			if (!existing) {
				return new ResponseError(EnableIdpErrorCode.NotFound, `IDP ${slug} not found`)
			}
			if (existing.disabledAt) {
				await db.commandBus.execute(new EnableIdpCommand(existing.id))
			}
			return new ResponseOk(null)
		})
	}
}

export type RegisterIDPResponse = Response<null, AddIdpErrorCode>
export type DisableIDPResponse = Response<null, DisableIdpErrorCode>
export type EnableIDPResponse = Response<null, EnableIdpErrorCode>
