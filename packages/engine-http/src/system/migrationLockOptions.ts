import { MigrationLockOptions } from '@contember/engine-system-api'
import { ServerConfig } from '../config/config.js'

export const createMigrationLockOptions = (config: ServerConfig['systemApi']): MigrationLockOptions | undefined => {
	if (config?.migrationLockTimeoutMs === undefined) {
		return undefined
	}
	return {
		lockTimeoutMs: config.migrationLockTimeoutMs,
		maxAttempts: config.migrationMaxAttempts ?? 5,
		retryDelayMs: config.migrationRetryDelayMs ?? 1000,
	}
}
