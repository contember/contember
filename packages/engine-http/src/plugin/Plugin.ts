import { MigrationGroup } from '@contember/database-migrations'
import { ExecutionContainerHook } from '@contember/engine-content-api'
import { ConfigProcessor } from '../config/ConfigProcessor'
import * as Typesafe from '@contember/typesafe'
import { GraphQLSchemaContributor } from '../content'
import { Providers } from '../providers'
import { ProjectConfig } from '../project/config'

export interface SchemaContributorArgs<CustomConfig extends Typesafe.JsonObject = Typesafe.JsonObject> {
	project: ProjectConfig & CustomConfig
	providers: Providers
}

export interface Plugin<CustomConfig extends Typesafe.JsonObject = Typesafe.JsonObject> {
	readonly name: string

	getConfigProcessor?(): ConfigProcessor<CustomConfig>

	getSchemaContributor?(args: SchemaContributorArgs<CustomConfig>): GraphQLSchemaContributor | undefined

	getSystemMigrations?(): MigrationGroup<unknown>

	getExecutionContainerHook?(): ExecutionContainerHook
}
