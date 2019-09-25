import { MigrationFilesManager } from '@contember/engine-common'

export const createMigrationFilesManager = (): MigrationFilesManager => {
	return new MigrationFilesManager(__dirname + '/../../../migrations')
}
