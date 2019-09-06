import { ProjectMemberManager } from '../model/service'
import { Authorizator } from '@contember/authorization'
import { Identity } from '@contember/engine-common'
import { ResolverContext } from './ResolverContext'
import { PermissionContext, ProjectAwareIdentity } from '../model/authorization'

export class ResolverContextFactory {
	constructor(
		private readonly projectMemberManager: ProjectMemberManager,
		private readonly authorizator: Authorizator<Identity>,
	) {}

	public create(authContext: { apiKeyId: string; identityId: string; roles: string[] }): ResolverContext {
		return new ResolverContext(
			authContext.apiKeyId,
			new PermissionContext(
				new ProjectAwareIdentity(authContext.identityId, authContext.roles, this.projectMemberManager),
				this.authorizator,
			),
		)
	}
}
