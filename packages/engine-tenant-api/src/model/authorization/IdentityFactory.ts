import { ProjectMemberManager } from '../service'
import { Identity, ProjectAwareIdentity } from './Identity'

export class IdentityFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(args: { id: string; roles: string[] }): Identity {
		return new ProjectAwareIdentity(args.id, args.roles, this.projectMemberManager)
	}
}
