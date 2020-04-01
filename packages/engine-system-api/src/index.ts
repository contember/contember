import * as Schema from './schema'
import { UuidProvider } from './utils/uuid'

export * from './SchemaVersionBuilder'
export { SchemaMigrator, MigrationsResolver } from '@contember/schema-migrations'
export * from './SystemContainer'
export * from './resolvers'
export * from './SystemVariablesSetupHelper'
export * from './model'
export * from './types'
export * from './ProjectInitializer'
export { default as typeDefs } from './schema/system.graphql'
export * from './utils/providers'
export { Schema }

export const systemMigrationsDirectory = __dirname + '/../../migrations'
