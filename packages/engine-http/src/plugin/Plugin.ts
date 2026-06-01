import { MigrationGroup } from '@contember/database-migrations'
import { ExecutionContainerHook } from '@contember/engine-content-api'
import { ConfigProcessor } from '../config/ConfigProcessor.js'
import * as Typesafe from '@contember/typesafe'
import { GraphQLSchemaContributor } from '../content/index.js'
import { Providers } from '../providers.js'
import { MasterContainerHook } from '../MasterContainer.js'

export interface SchemaContributorArgs {
	providers: Providers
}

export interface Plugin<CustomConfig extends Typesafe.JsonObject = Typesafe.JsonObject> {
	readonly name: string

	getConfigProcessor?(): ConfigProcessor<CustomConfig>

	getSchemaContributor?(args: SchemaContributorArgs): GraphQLSchemaContributor | undefined

	getSystemMigrations?(): MigrationGroup<unknown>

	getExecutionContainerHook?(): ExecutionContainerHook

	getMasterContainerHook?(): MasterContainerHook
}
