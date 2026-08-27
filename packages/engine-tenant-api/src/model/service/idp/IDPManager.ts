import { Response, ResponseError, ResponseOk } from '../../utils/Response'
import { AddIdpErrorCode, DisableIdpErrorCode, EnableIdpErrorCode, UpdateIdpErrorCode } from '../../../schema'
import { DatabaseContext } from '../../utils'
import { IdentityProviderData } from '../../type'
import { IdentityProviderBySlugQuery, IdentityProvidersQuery } from '../../queries'
import { CreateIdpCommand } from '../../commands/idp/CreateIdpCommand'
import { IDPHandlerRegistry } from './IDPHandlerRegistry'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError'
import { InvalidIDPConfigurationError } from './InvalidIDPConfigurationError'
import { DisableIdpCommand } from '../../commands/idp/DisableIdpCommand'
import { EnableIdpCommand } from '../../commands/idp/EnableIdpCommand'
import { UpdateIdpCommand, UpdateIdpData } from '../../commands/idp/UpdateIdpCommand'
import { IdentityProviderDto } from '../../queries/idp/types'

export class IDPManager {
	constructor(
		private readonly idpRegistry: IDPHandlerRegistry,
	) {
	}

	public async addIDP(db: DatabaseContext, idp: IdentityProviderData): Promise<RegisterIDPResponse> {
		return await db.transaction(async (db): Promise<RegisterIDPResponse> => {
			try {
				const providerService = this.idpRegistry.getHandler(idp.type)
				this.assertNoUnknownConfigurationKeys(providerService.validateConfiguration(idp.configuration), idp.configuration)
			} catch (e) {
				if (e instanceof IdentityProviderNotFoundError) {
					return new ResponseError('UNKNOWN_TYPE', `IDP type ${idp.type} not found`)
				}
				if (e instanceof InvalidIDPConfigurationError) {
					return new ResponseError('INVALID_CONFIGURATION', `Invalid IDP configuration: ${e.message}`)
				}
				throw e
			}

			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(idp.slug))
			if (existing) {
				return new ResponseError('ALREADY_EXISTS', `IDP with slug ${idp.slug} already exists`)
			}
			await db.commandBus.execute(new CreateIdpCommand(idp))
			return new ResponseOk(null)
		})
	}

	public async disableIDP(db: DatabaseContext, slug: string): Promise<DisableIDPResponse> {
		return await db.transaction(async db => {
			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(slug))
			if (!existing) {
				return new ResponseError('NOT_FOUND', `IDP ${slug} not found`)
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
				return new ResponseError('NOT_FOUND', `IDP ${slug} not found`)
			}
			if (existing.disabledAt) {
				await db.commandBus.execute(new EnableIdpCommand(existing.id))
			}
			return new ResponseOk(null)
		})
	}

	public async updateIDP(db: DatabaseContext, slug: string, data: UpdateIdpData, mergeConfiguration: boolean): Promise<UpdateIDPResponse> {
		return await db.transaction(async db => {
			const existing = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(slug))
			if (!existing) {
				return new ResponseError('NOT_FOUND', `IDP ${slug} not found`)
			}

			const newConfiguration = (() => {
				if (!data.configuration) {
					return existing.configuration
				}
				if (!mergeConfiguration) {
					return data.configuration
				}

				const newConfiguration = { ...existing.configuration }
				for (const [key, value] of Object.entries(data.configuration)) {
					if (value === null) {
						delete newConfiguration[key]
					} else {
						newConfiguration[key] = value
					}
				}

				return newConfiguration
			})()

			try {
				const type = data.type ?? existing.type
				const providerService = this.idpRegistry.getHandler(type)
				if (data.configuration !== undefined || type !== existing.type) {
					this.assertNoUnknownConfigurationKeys(providerService.validateConfiguration(newConfiguration), newConfiguration)
				}
			} catch (e) {
				if (e instanceof InvalidIDPConfigurationError) {
					return new ResponseError('INVALID_CONFIGURATION', `Invalid IDP configuration: ${e.message}`)
				}
				throw e
			}

			await db.commandBus.execute(
				new UpdateIdpCommand(existing.id, {
					...data,
					configuration: data.configuration ? newConfiguration : undefined,
				}),
			)

			return new ResponseOk(null)
		})
	}

	/**
	 * Reject top-level `configuration` keys the provider does not recognise.
	 *
	 * Every provider configuration is parsed with `Typesafe.partial`, which silently DROPS unknown
	 * properties. Without this check `addIDP` / `updateIDP` answer `ok` to a configuration the
	 * provider will never act on — a typo like `fetchUserinfo` (lowercase i) reads as a successfully
	 * applied setting while the option stays off, and an option that a given engine version does not
	 * support yet looks indistinguishable from one that works.
	 *
	 * The parsed result carries exactly the keys the provider understood, so the difference against
	 * the submitted object is the set of ignored keys. All of them are reported at once (rather than
	 * the first, as `Typesafe.noExtraProps` would) so a configuration with several typos takes one
	 * round trip to fix.
	 *
	 * Write time only: reading a stored configuration is deliberately left untouched, so a row written
	 * before this check keeps authenticating instead of locking its users out.
	 */
	private assertNoUnknownConfigurationKeys(parsed: {}, submitted: Record<string, unknown>): void {
		const known = new Set(Object.keys(parsed))
		const unknown = Object.keys(submitted).filter(key => !known.has(key))
		if (unknown.length > 0) {
			throw new InvalidIDPConfigurationError(
				`unknown configuration ${unknown.length === 1 ? 'property' : 'properties'} ${unknown.join(', ')}; `
					+ `remove ${unknown.length === 1 ? 'it' : 'them'} or check the spelling — the provider would ignore ${unknown.length === 1 ? 'it' : 'them'}`,
			)
		}
	}

	public async listIDP(db: DatabaseContext): Promise<IdentityProviderDto[]> {
		const result = await db.queryHandler.fetch(new IdentityProvidersQuery())
		return result.map(it => {
			const providerService = this.idpRegistry.getHandlerOrNull(it.type)
			const configuration = providerService?.getPublicConfiguration
				? providerService.getPublicConfiguration(it.configuration)
				: it.configuration

			return { ...it, configuration }
		})
	}
}

export type RegisterIDPResponse = Response<null, AddIdpErrorCode>
export type DisableIDPResponse = Response<null, DisableIdpErrorCode>
export type EnableIDPResponse = Response<null, EnableIdpErrorCode>
export type UpdateIDPResponse = Response<null, UpdateIdpErrorCode>
