import * as Schema from './schema'
import { UuidProvider } from './utils/uuid'

export * from './SchemaVersionBuilder'
export { SchemaMigrator, MigrationsResolver } from '@contember/schema-migrations'
export * from './SystemContainerFactory'
export * from './SystemExecutionContainer'
export * from './resolvers'
export * from './SystemVariablesSetupHelper'
export * from './model'
export * from './types'
export { default as typeDefs } from './schema/system.graphql'

export { Schema }

export type Providers = UuidProvider

export const getSystemMigrationsDirectory = () => __dirname + '/../../migrations'
