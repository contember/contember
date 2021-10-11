import { ProjectMemberManager } from '../service'
import { Identity, ProjectAwareIdentity } from './Identity'
import { DatabaseContext } from '../utils'

export class IdentityFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(dbContext: DatabaseContext, args: { id: string; roles: string[] }): Identity {
		return new ProjectAwareIdentity(args.id, args.roles, dbContext, this.projectMemberManager)
	}
}
