import type { AuthResult, ProjectGroupContainer } from '@contember/engine-http'
import type { PanelAccessCheck } from './PanelApiController.js'
import { TtlCache } from './TtlCache.js'

/**
 * Evaluates the tenant-configured panel policy, memoized per api key so a page of parallel requests
 * costs one lookup rather than one per request. The TTL is deliberately short: revoking someone's
 * access should take effect in seconds, not on their next sign-in.
 */
export class ConfiguredPanelAccessCheck implements PanelAccessCheck {
	private readonly cache: TtlCache<boolean>

	constructor(ttlMs: number = 10_000) {
		this.cache = new TtlCache(ttlMs)
	}

	public async isAllowed({ projectGroup, authResult }: { projectGroup: ProjectGroupContainer; authResult: AuthResult }): Promise<boolean> {
		const { panelAccessResolver, databaseContext } = projectGroup.tenantContainer
		return await this.cache.resolve(
			`${projectGroup.slug ?? ''}:${authResult.apiKeyId}`,
			() => panelAccessResolver.isAllowed(databaseContext, authResult.identityId, authResult.roles),
		)
	}
}
