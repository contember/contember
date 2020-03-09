import { AccessNode, AuthorizationScope } from '@contember/authorization'
import { Project } from '../type'
import { TenantRole } from './Roles'
import { Acl } from '@contember/schema'
import { SwitchEvaluatorNode } from './SwitchEvaluatorNode'
import { AclSchemaEvaluatorFactory } from './AclSchemaEvaluatorFactory'
import { Identity } from './Identity'
import { ProjectRole } from '@contember/engine-common'
import { MembershipAwareAccessNode } from './MembershipAwareAccessNode'

export class ProjectScope implements AuthorizationScope<Identity> {
	constructor(
		private readonly project: Pick<Project, 'slug'>,
		private readonly aclSchema: Acl.Schema,
		private readonly aclSchemaEvaluatorFactory: AclSchemaEvaluatorFactory,
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
		const evaluator = await this.aclSchemaEvaluatorFactory.create(this.aclSchema)
		return new AccessNode.Union([
			new AccessNode.Roles(tenantRoles),
			new AccessNode.Intersection([
				new SwitchEvaluatorNode(new AccessNode.Roles(projectRoles), evaluator),
				new MembershipAwareAccessNode(projectMemberships, this.aclSchema),
			]),
		])
	}
}
