import { Client as PgClient } from 'pg'
import { Connection, EventManager, Pool } from '@contember/database'
import { DatabaseContext } from '@contember/engine-tenant-api'
import { createProviders } from '../src/providers.js'

type Interface<T> = { [P in keyof T]: T[P] }

export function createMock<T>(members: Interface<T>): T {
	return members
}

/** A tenant database context over a pool that never connects; for code that only passes the context on. */
export const createUnusedTenantDatabaseContext = (module: string): DatabaseContext => {
	const connection = new Connection(new Pool(() => new PgClient(), { maxConnections: 1, logError: () => {} }), new EventManager(null))
	return new DatabaseContext(connection.createClient('tenant', { module }), {
		...createProviders(),
		uuid: () => '00000000-0000-0000-0000-000000000000',
		encrypt: () => Promise.reject(new Error('Not used')),
		decrypt: () => Promise.reject(new Error('Not used')),
		encryptionEnabled: false,
	})
}
