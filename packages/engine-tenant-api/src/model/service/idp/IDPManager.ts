import { Response, ResponseError, ResponseOk } from '../../utils/Response.js'
import { AddIdpErrorCode, DisableIdpErrorCode, EnableIdpErrorCode, UpdateIdpErrorCode } from '../../../schema/index.js'
import { DatabaseContext } from '../../utils/index.js'
import { IdentityProviderData } from '../../type/index.js'
import { IdentityProviderBySlugQuery, IdentityProvidersQuery } from '../../queries/index.js'
import { CreateIdpCommand } from '../../commands/idp/CreateIdpCommand.js'
import { IDPHandlerRegistry } from './IDPHandlerRegistry.js'
import { IdentityProviderNotFoundError } from './IdentityProviderNotFoundError.js'
import { InvalidIDPConfigurationError } from './InvalidIDPConfigurationError.js'
import { findClaimMappingShapeErrors, findRemovedRuleKeys, isRecord, parseClaimMapping } from './ClaimMapping.js'
import { validateClaimMappingMembership } from './ClaimMappingValidation.js'
import { ProjectSchemaResolver } from '../../type/index.js'
import { DisableIdpCommand } from '../../commands/idp/DisableIdpCommand.js'
import { EnableIdpCommand } from '../../commands/idp/EnableIdpCommand.js'
import { UpdateIdpCommand, UpdateIdpData } from '../../commands/idp/UpdateIdpCommand.js'
import { ClearMembershipLeasesByProviderCommand } from '../../commands/membership/ClearMembershipLeasesByProviderCommand.js'
import { IdentityProviderDto } from '../../queries/idp/types.js'

export class IDPManager {
	constructor(
		private readonly idpRegistry: IDPHandlerRegistry,
		private readonly projectSchemaResolver: ProjectSchemaResolver,
	) {
	}

	public async addIDP(db: DatabaseContext, idp: IdentityProviderData): Promise<RegisterIDPResponse> {
		return await db.transaction(async (db): Promise<RegisterIDPResponse> => {
			try {
				const providerService = this.idpRegistry.getHandler(idp.type)
				this.assertNoUnknownConfigurationKeys(providerService.validateConfiguration(idp.configuration), idp.configuration)
				await this.assertValidClaimMapping(idp.configuration)
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

			const newConfiguration = !data.configuration
				? existing.configuration
				: (mergeConfiguration ? deepMergeConfiguration(existing.configuration, data.configuration) : data.configuration)

			try {
				const type = data.type ?? existing.type
				const providerService = this.idpRegistry.getHandler(type)
				if (data.configuration !== undefined || type !== existing.type) {
					this.assertNoUnknownConfigurationKeys(providerService.validateConfiguration(newConfiguration), newConfiguration)
					await this.assertValidClaimMapping(newConfiguration)
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

			// Turning the lease off must reach the rows it already stamped — nothing else clears a stored
			// expiry for someone who never signs in again.
			if (readMembershipLease(existing.configuration) !== undefined && readMembershipLease(newConfiguration) === undefined) {
				await db.commandBus.execute(new ClearMembershipLeasesByProviderCommand(existing.id))
			}

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
	 * round trip to fix, matching {@link findRemovedRuleKeys}.
	 *
	 * Only the top level is checked: nested shapes that need strictness validate themselves
	 * (`claimMapping` via {@link parseClaimMapping}). Reading a stored configuration is deliberately
	 * left untouched — this runs at write time only, so a row written before this check keeps
	 * authenticating instead of locking its users out.
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

	/**
	 * Validate the optional A09 `claimMapping` embedded in an IdP `configuration`: reject a removed
	 * `grantRoles` (global-role mapping was dropped — see {@link parseClaimMapping}), reject a
	 * malformed shape, and validate each granted membership's role against the target project's ACL
	 * schema (mirroring the direct add-member path). Throws {@link InvalidIDPConfigurationError},
	 * surfaced as `INVALID_CONFIGURATION`.
	 */
	private async assertValidClaimMapping(configuration: Record<string, unknown>): Promise<void> {
		const removed = findRemovedRuleKeys(configuration)
		if (removed.length > 0) {
			throw new InvalidIDPConfigurationError(
				`claimMapping no longer supports ${removed.join(', ')} (global-role mapping was removed); grant a project membership via grantMembership instead`,
			)
		}
		let mapping
		try {
			mapping = parseClaimMapping(configuration)
		} catch (e) {
			throw new InvalidIDPConfigurationError(`Invalid claimMapping: ${e instanceof Error ? e.message : String(e)}`)
		}
		if (!mapping) {
			return
		}
		// Reject contradictory / empty-by-construction rule shapes (a rule setting both equals+contains; a
		// variable's `from.where` without `from.pick`) before the per-project ACL checks, so a
		// misconfiguration is caught even when the target project does not exist yet (ACL loop skipped).
		const shapeErrors = findClaimMappingShapeErrors(mapping)
		if (shapeErrors.length > 0) {
			throw new InvalidIDPConfigurationError(shapeErrors[0])
		}
		// Validate each granted membership's role AND its variables against the target project's ACL schema,
		// via the shared {@link validateClaimMappingMembership} (the same checks `IDPClaimSyncService`
		// re-runs at apply time, so the two enforcement points can't drift). A project that does not (yet)
		// exist is skipped — it may be created later, and a sign-in referencing a missing project is
		// harmless (the grant is skipped). NOTE: this validation runs only here at add/update time and is
		// NOT re-checked when the project/role appears later; the unsafe-condition-variable case is caught
		// again at apply time by `IDPClaimSyncService`, but other drift (unknown role/variable) is not.
		for (const rule of mapping.rules) {
			const membership = rule.grantMembership
			if (!membership) {
				continue
			}
			const schema = await this.projectSchemaResolver.getSchema(membership.project)
			if (!schema) {
				continue
			}
			const errors = validateClaimMappingMembership(schema.acl, membership)
			if (errors.length > 0) {
				throw new InvalidIDPConfigurationError(errors[0].message)
			}
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

/**
 * Recursively merge configurer-supplied `updates` into the stored `base` configuration (the
 * `mergeConfiguration: true` path of {@link IDPManager.updateIDP}), returning a new object:
 * - a plain-object value is merged INTO an existing plain-object value at the same key, so updating one
 *   field of a nested config object preserves its siblings. This matters for `configuration.claimMapping`,
 *   which holds two independent concerns in one object — the OIDC identity-remap (`email` / `name` /
 *   `externalIdentifier` / `attributesKey`) and the A09 `rules` — so a shallow replace of `claimMapping`
 *   while updating one would silently wipe the other.
 * - any non-object value (including ARRAYS, e.g. the A09 `rules` list) REPLACES wholesale — arrays are
 *   never merged element-wise.
 * - a `null` value DELETES the key (the established "send null to unset" convention).
 * - `__proto__` / `constructor` / `prototype` keys are skipped at EVERY level: they are never a legitimate
 *   config field and writing one through could pollute the object's prototype.
 */
const deepMergeConfiguration = (base: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown> => {
	const result: Record<string, unknown> = { ...base }
	for (const [key, value] of Object.entries(updates)) {
		if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
			continue
		}
		if (value === null) {
			delete result[key]
		} else if (isRecord(value)) {
			const existingChild = result[key]
			result[key] = deepMergeConfiguration(isRecord(existingChild) ? existingChild : {}, value)
		} else {
			result[key] = value
		}
	}
	return result
}

/**
 * Raw `claimMapping.membershipLease`, unparsed so a stored config predating validation cannot make an update throw.
 * Only a removal changes it: {@link deepMergeConfiguration} keeps a key the merge does not mention, and deletes an explicit `null`.
 */
const readMembershipLease = (configuration: Record<string, unknown>): unknown => {
	const claimMapping = configuration.claimMapping
	return isRecord(claimMapping) ? claimMapping.membershipLease : undefined
}

export type RegisterIDPResponse = Response<null, AddIdpErrorCode>
export type DisableIDPResponse = Response<null, DisableIdpErrorCode>
export type EnableIDPResponse = Response<null, EnableIdpErrorCode>
export type UpdateIDPResponse = Response<null, UpdateIdpErrorCode>
