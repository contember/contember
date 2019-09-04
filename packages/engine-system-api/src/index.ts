import { MigrationFilesManager } from '@contember/engine-common'

export * from './SchemaVersionBuilder'
export * from './SchemaMigrator'
export * from './MigrationsResolver'
export * from './SystemContainerFactory'
export * from './SystemExecutionContainer'
export * from './resolvers'
export * from './SystemVariablesSetupHelper'
export * from './model'
export * from './types'
export { default as typeDefs } from './schema/system.graphql'
import * as Schema from './schema'
import { UuidProvider } from './utils/uuid'

export { Schema }

export type Providers = UuidProvider

export const createMigrationFilesManager = (): MigrationFilesManager => {
	return new MigrationFilesManager(__dirname + '/../../migrations')
}
