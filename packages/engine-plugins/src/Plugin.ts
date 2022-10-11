import { ConfigProcessor } from './ConfigProcessor'
import { GraphQLSchemaContributor } from './GraphQLSchemaContributor'
import { ProjectConfig, ProjectContainer } from './ProjectContainer'
import { MigrationGroup } from '@contember/database-migrations'
import { MapperContainerHook } from '@contember/engine-content-api'

export interface Plugin<ProjectConf extends ProjectConfig = ProjectConfig> {
	getConfigProcessor?(): ConfigProcessor<ProjectConf>

	getSchemaContributor?(container: ProjectContainer<ProjectConf>): GraphQLSchemaContributor | undefined

	getSystemMigrations?(): MigrationGroup<unknown>

	getMapperContainerHook?(): MapperContainerHook
}
