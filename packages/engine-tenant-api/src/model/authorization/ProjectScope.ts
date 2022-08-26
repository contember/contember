import { AccessNode, AuthorizationScope } from '@contember/authorization'
import { Project } from '../type'
import { TenantRole } from './Roles'
import { Acl, ProjectRole } from '@contember/schema'
import { AclSchemaAccessNodeFactory } from './AclSchemaAccessNodeFactory'
import { Identity } from './Identity'

export class ProjectScope implements AuthorizationScope<Identity> {
	constructor(
		private readonly project: Pick<Project, 'slug'>,
		private readonly aclSchema: Acl.Schema,
		private readonly aclSchemaAccessNodeFactory: AclSchemaAccessNodeFactory,
	) {}

	async getIdentityAccess(identity: Identity): Promise<AccessNode> {
		const projectMemberships = await identity.getProjectMemberships(this.project.slug)
		const tenantRoles = []
		if (projectMemberships.length > 0) {
			tenantRoles.push(TenantRole.PROJECT_MEMBER)
		}
		const projectRoles = projectMemberships.map(it => it.role)
		if (projectRoles.includes(ProjectRole.ADMIN)) {
			tenantRoles.push(TenantRole.PROJECT_ADMIN)
		}
		const accessNode = this.aclSchemaAccessNodeFactory.create(this.aclSchema, projectMemberships)
		return new AccessNode.Union([
			new AccessNode.Roles(tenantRoles),
			accessNode,
		])
	}
}
