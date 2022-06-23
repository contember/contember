import { ProjectMemberManager } from '../service/index.js'
import { Identity, ProjectAwareIdentity } from './Identity.js'
import { DatabaseContext } from '../utils/index.js'

export class IdentityFactory {
	constructor(private readonly projectMemberManager: ProjectMemberManager) {}

	public create(dbContext: DatabaseContext, args: { id: string; roles: readonly string[] }): Identity {
		return new ProjectAwareIdentity(args.id, args.roles, dbContext, this.projectMemberManager)
	}
}
