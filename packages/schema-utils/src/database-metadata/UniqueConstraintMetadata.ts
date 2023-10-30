import { stringArrayEquals } from './stringArrayEquals'

export interface UniqueConstraintMetadata {
	constraintName: string
	tableName: string
	columnNames: string[]
}

export interface UniqueConstraintFilter {
	tableName?: string
	constraintName?: string
	columnNames?: string[]
}

export class UniqueConstraintMetadataSet {
	constructor(
		private readonly constraints: UniqueConstraintMetadata[],
	) {
	}

	public toArray(): UniqueConstraintMetadata[] {
		return this.constraints
	}

	first(): UniqueConstraintMetadata | null {
		return this.constraints.length > 0 ? this.constraints[0] : null
	}

	public getNames(): string[] {
		return this.constraints.map(it => it.constraintName)
	}

	public filter(filter: UniqueConstraintFilter): UniqueConstraintMetadataSet {
		return new UniqueConstraintMetadataSet(this.constraints.filter(it => {
			if (filter.tableName !== undefined && it.tableName !== filter.tableName) {
				return false
			}
			if (filter.constraintName !== undefined && it.constraintName !== filter.constraintName) {
				return false
			}
			if (filter.columnNames !== undefined && !stringArrayEquals(it.columnNames, filter.columnNames)) {
				return false
			}
			return true
		}))
	}
}

