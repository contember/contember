import { AuthorizationScope, AccessNode } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { Project } from '../type'
import { TenantRole } from './Roles'

export class ProjectScope implements AuthorizationScope<Identity> {
	constructor(private readonly project: Pick<Project, 'slug'> | null) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		if (!this.project) {
			return new AccessNode.Roles([])
		}
		const roles = await identity.getProjectRoles(this.project.slug)
		const tenantRoles = []
		if (roles.length > 0) {
			tenantRoles.push(TenantRole.PROJECT_MEMBER)
		}
		if (roles.includes(Identity.ProjectRole.ADMIN)) {
			tenantRoles.push(TenantRole.PROJECT_ADMIN)
		}
		return new AccessNode.Roles(tenantRoles)
	}
}
