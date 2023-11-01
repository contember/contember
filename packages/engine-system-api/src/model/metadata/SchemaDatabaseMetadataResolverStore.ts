import { DatabaseContext } from '../database'
import { DatabaseMetadata, DatabaseMetadataResolver } from '@contember/database'

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
