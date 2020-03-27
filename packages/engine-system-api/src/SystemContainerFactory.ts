import { AccessEvaluator, Authorizator } from '@contember/authorization'
import { MigrationFilesManager } from '@contember/schema-migrations'
import StagesQueryResolver from './resolvers/query/StagesQueryResolver'
import DiffResponseBuilder from './model/events/DiffResponseBuilder'
import DiffQueryResolver from './resolvers/query/DiffQueryResolver'
import { Builder, Container } from '@contember/dic'
import TableReferencingResolver from './model/events/TableReferencingResolver'
import ResolverFactory from './resolvers/ResolverFactory'
import ReleaseMutationResolver from './resolvers/mutation/ReleaseMutationResolver'
import { SystemExecutionContainer } from './SystemExecutionContainer'
import { MigrationsResolver, ModificationHandlerFactory } from '@contember/schema-migrations'
import { ProjectConfig } from './types'
import RebeaseAllMutationResolver from './resolvers/mutation/RebeaseAllMutationResolver'
import { Resolvers } from './schema'
import PermissionsFactory from './model/authorization/PermissionsFactory'
import { ContentPermissionVerifier } from './model/events/EventsPermissionsVerifier'
import { UuidProvider } from './utils/uuid'

export interface SystemContainer {
	systemResolvers: Resolvers
	authorizator: Authorizator
	systemExecutionContainerFactory: SystemExecutionContainer.Factory
}

export class SystemContainerFactory {
	public create(container: {
		providers: UuidProvider
		project: ProjectConfig
		migrationFilesManager: MigrationFilesManager
		contentPermissionsVerifier: ContentPermissionVerifier
		migrationsResolver: MigrationsResolver
		modificationHandlerFactory: ModificationHandlerFactory
	}): Container<SystemContainer> {
		return new Builder({})
			.addService('providers', () => container.providers)
			.addService('systemStagesQueryResolver', () => new StagesQueryResolver())
			.addService('tableReferencingResolver', () => new TableReferencingResolver())
			.addService('accessEvaluator', ({}) => new AccessEvaluator.PermissionEvaluator(new PermissionsFactory().create()))
			.addService('authorizator', ({ accessEvaluator }): Authorizator => new Authorizator.Default(accessEvaluator))

			.addService('systemDiffResponseBuilder', () => new DiffResponseBuilder())
			.addService(
				'systemDiffQueryResolver',
				({ systemDiffResponseBuilder }) => new DiffQueryResolver(systemDiffResponseBuilder),
			)
			.addService('releaseMutationResolver', () => new ReleaseMutationResolver())
			.addService('rebaseMutationResolver', () => new RebeaseAllMutationResolver())
			.addService(
				'systemResolvers',
				({ systemStagesQueryResolver, systemDiffQueryResolver, releaseMutationResolver, rebaseMutationResolver }) =>
					new ResolverFactory(
						systemStagesQueryResolver,
						systemDiffQueryResolver,
						releaseMutationResolver,
						rebaseMutationResolver,
					).create(),
			)
			.addService(
				'systemExecutionContainerFactory',
				({ authorizator, providers }) =>
					new SystemExecutionContainer.Factory(
						container.project,
						container.migrationsResolver,
						container.migrationFilesManager,
						authorizator,
						container.modificationHandlerFactory,
						container.contentPermissionsVerifier,
						providers,
					),
			)

			.build()
			.pick('systemResolvers', 'authorizator', 'systemExecutionContainerFactory')
	}
}
