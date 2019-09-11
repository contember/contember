import { ProjectMemberManager } from '../service'
import { Identity } from '@contember/engine-common'
import { ProjectAwareIdentity } from './ProjectAwareIdentity'

export class IdentityFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(args: { id: string; roles: string[] }): Identity {
		return new ProjectAwareIdentity(args.id, args.roles, this.projectMemberManager)
	}
}
