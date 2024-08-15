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

		const db = projectContainer.systemDatabaseContext
		const systemContext = await systemContainer.resolverContextFactory.create({
			db,
			identity,
			project: { ...projectContainer.project, systemSchema: db.client.schema },
			getSchema: async options => {
				 return (await projectContainer.contentSchemaResolver.getSchema({ db, ...options })).schema
			},
		})
		return {
			...systemContext,
			onClearCache,
		}
	}
}
