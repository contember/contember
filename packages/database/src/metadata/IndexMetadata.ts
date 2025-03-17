import { stringArrayEquals } from './stringArrayEquals'

export interface IndexMetadata {
	indexName: string
	tableName: string
	columnNames: string[]
	unique: boolean
}

export type IndexFilter = Partial<IndexMetadata>

export class IndexMetadataSet {
	constructor(
		private readonly indexes: IndexMetadata[],
	) {
	}

	public toArray(): IndexMetadata[] {
		return this.indexes
	}

	public getNames(): string[] {
		return this.indexes.map(it => it.indexName)
	}

	public filter(filter: IndexFilter): IndexMetadataSet {
		return new IndexMetadataSet(this.indexes.filter(it => {
			if (filter.tableName !== undefined && it.tableName !== filter.tableName) {
				return false
			}
			if (filter.indexName !== undefined && it.indexName !== filter.indexName) {
				return false
			}
			if (filter.columnNames !== undefined && !stringArrayEquals(it.columnNames, filter.columnNames)) {
				return false
			}
			if (filter.unique !== undefined && it.unique !== filter.unique) {
				return false
			}
			return true
		}))
	}
}
