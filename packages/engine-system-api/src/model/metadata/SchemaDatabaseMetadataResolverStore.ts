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
	 * Runs `cb` with the cached metadata, or with a stand-in that throws on any read.
	 * Only when `cb` reads it is the metadata resolved and `cb` run again, so it must have no side effects
	 * beyond what it returns and the cache invalidation.
	 */
	public async withMetadata<T>(schema: string, cb: (metadata: DatabaseMetadata) => T): Promise<T> {
		try {
			return cb(this.cache.get(schema) ?? notLoadedDatabaseMetadata)
		} catch (e) {
			if (!(e instanceof DatabaseMetadataNotLoadedError)) {
				throw e
			}
			return cb(await this.getMetadata(schema))
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
