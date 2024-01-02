import { Identity, SystemContainer } from '@contember/engine-system-api'
import { SystemGraphQLContext } from './SystemGraphQLHandlerFactory'
import { AuthResult } from '../common'
import { Acl } from '@contember/schema'
import { ProjectContainer } from '../project'

export class SystemGraphQLContextFactory {
	public async create({ authResult, memberships,  projectContainer, systemContainer, onClearCache }: {
		authResult: AuthResult
		memberships: readonly Acl.Membership[]
		projectContainer: ProjectContainer
		systemContainer: SystemContainer
		onClearCache: () => void
	}): Promise<SystemGraphQLContext> {
		const identity = new Identity(
			authResult.identityId,
			memberships.map(it => it.role),
		)

		const dbContext = projectContainer.systemDatabaseContext
		const schema = await projectContainer.contentSchemaResolver.getSchema(dbContext)
		const systemContext = await systemContainer.resolverContextFactory.create(
			schema,
			dbContext,
			{ ...projectContainer.project, systemSchema: dbContext.client.schema },
			identity,
		)
		return {
			...systemContext,
			onClearCache,
		}
	}
}
