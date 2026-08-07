import { DatabaseContext } from '../utils/index.js'
import { AllProjectRolesByIdentityQuery, ConfigurationQuery } from '../queries/index.js'
import { Providers } from '../providers.js'

/**
 * Decides whether an identity may enter the management panel served by the engine.
 *
 * This is an **entry gate for the console, not an authorization system**: everything the panel shows
 * still goes through the tenant ACL, and whoever gets in could equally call `/tenant` directly. Its
 * job is to keep the console door shut for accounts that have no business there, so an admin surface
 * on a public API port does not look like a leak.
 *
 * An identity is allowed when it holds one of `globalRoles`, or a membership with one of
 * `projectRoles` in **any** project. Empty lists mean nobody.
 */
export class PanelAccessResolver {
	constructor(private readonly providers: Providers) {}

	async isAllowed(db: DatabaseContext, identityId: string, globalRoles: readonly string[]): Promise<boolean> {
		const config = await db.queryHandler.fetch(new ConfigurationQuery(this.providers))
		const policy = config.panel

		if (policy.globalRoles.some(role => globalRoles.includes(role))) {
			return true
		}
		if (policy.projectRoles.length === 0) {
			return false
		}
		const projectRoles = await db.queryHandler.fetch(new AllProjectRolesByIdentityQuery(identityId))
		return projectRoles.some(it => policy.projectRoles.includes(it.role))
	}
}
