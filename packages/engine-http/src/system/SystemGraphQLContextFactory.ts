import { Identity, SystemContainer } from '@contember/engine-system-api'
import { SystemGraphQLContext } from './SystemGraphQLHandlerFactory'
import { AuthMiddlewareState, AuthResult } from '../common'
import { Membership } from '@contember/engine-tenant-api'
import { KoaContext } from '../koa'
import { GraphQLKoaState } from '../graphql'
import { ProjectContainer } from '../ProjectContainer'

export class SystemGraphQLContextFactory {
	public async create({ authResult, memberships, koaContext, projectContainer, systemContainer, onClearCache }: {
		authResult: AuthResult
		memberships: readonly Membership[]
		koaContext: KoaContext<GraphQLKoaState & AuthMiddlewareState>
		projectContainer: ProjectContainer
		systemContainer: SystemContainer
		onClearCache: () => void
	}): Promise<SystemGraphQLContext> {
		const identity = new Identity(
			authResult.identityId,
			memberships.map(it => it.role),
		)
		const dbContextFactory = projectContainer.systemDatabaseContextFactory

		const systemContext = await systemContainer.resolverContextFactory.create(
			dbContextFactory.create(),
			projectContainer.project,
			identity,
		)
		return {
			...systemContext,
			onClearCache,
			koaContext,
		}
	}
}
