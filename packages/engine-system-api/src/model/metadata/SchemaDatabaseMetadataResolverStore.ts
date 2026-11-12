import { DatabaseContext } from '../database/index.js'
import { DatabaseMetadata, DatabaseMetadataResolver } from '@contember/database'

export class DatabaseMetadataNotLoadedError extends Error {
	constructor() {
		super('Database metadata is not loaded')
	}
}

/** Stands in for metadata that is not loaded yet; any read throws, so a caller can load it and retry. */
const notLoadedDatabaseMetadata: DatabaseMetadata = {
	get uniqueConstraints(): never {
		throw new DatabaseMetadataNotLoadedError()
	},
	get foreignKeys(): never {
		throw new DatabaseMetadataNotLoadedError()
	},
	get indexes(): never {
		throw new DatabaseMetadataNotLoadedError()
	},
}

export class SchemaDatabaseMetadataResolverStore {
	private cache: Map<string, DatabaseMetadata> = new Map()

	constructor(
		private resolver: DatabaseMetadataResolver,
		private db: DatabaseContext,
	) {
	}

	public async getMetadata(schema: string): Promise<DatabaseMetadata> {
		const cached = this.cache.get(schema)
		if (cached) {
			return cached
		}

		const newValue = await this.resolver.resolveMetadata(this.db.client, schema)
		this.cache.set(schema, newValue)
		return newValue
	}

	/**
	 * Runs `cb` with a stand-in that throws on any read; only then is the metadata read from the catalog and `cb` run
	 * again, so it must have no other side effects. Bypasses the cache: renames and drops do not invalidate it.
	 */
	public async withMetadata<T>(schema: string, cb: (metadata: DatabaseMetadata) => T): Promise<T> {
		try {
			return await cb(notLoadedDatabaseMetadata)
		} catch (e) {
			if (!(e instanceof DatabaseMetadataNotLoadedError)) {
				throw e
			}
			return cb(await this.resolver.resolveMetadata(this.db.client, schema))
		}
	}

	public invalidate(schema: string): void {
		this.cache.delete(schema)
	}
}

export class MigrationsDatabaseMetadataResolverStoreFactory {
	constructor(
		private resolver: DatabaseMetadataResolver,
	) {
	}

	public create(db: DatabaseContext) {
		return new SchemaDatabaseMetadataResolverStore(this.resolver, db)
	}
}
