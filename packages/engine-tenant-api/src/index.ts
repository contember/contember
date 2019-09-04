import * as Schema from './schema'
import { MigrationFilesManager } from '@contember/engine-common'

export * from './model'
export * from './TenantContainer'
export * from './resolvers'
export { Schema }
export { default as typeDefs } from './schema/tenant.graphql'

export const createMigrationFilesManager = (): MigrationFilesManager => {
	return new MigrationFilesManager(__dirname + '/../../migrations')
}
