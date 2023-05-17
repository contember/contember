import { SchemaDatabaseMetadata } from '@contember/schema-utils'
import { SchemaDatabaseMetadataResolver } from './SchemaDatabaseMetadataResolver'
import { DatabaseContext } from '../database'

export class SchemaDatabaseMetadataResolverStore {

	private cache: Map<string, SchemaDatabaseMetadata> = new Map()

	constructor(
		private resolver: SchemaDatabaseMetadataResolver,
		private db: DatabaseContext,
	) {
	}

	public async getMetadata(schema: string): Promise<SchemaDatabaseMetadata> {
		const cached = this.cache.get(schema)
		if (cached) {
			return cached
		}

		const newValue = await this.resolver.resolveMetadata(this.db, schema)
		this.cache.set(schema, newValue)
		return newValue
	}

	public invalidate(schema: string): void {
		this.cache.delete(schema)
	}
}


export class MigrationsDatabaseMetadataResolverStoreFactory {
	constructor(
		private resolver: SchemaDatabaseMetadataResolver,
	) {
	}

	public create(db: DatabaseContext) {
		return new SchemaDatabaseMetadataResolverStore(this.resolver, db)
	}
}
