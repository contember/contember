export interface ForeignKeyConstraintMetadata {
	constraintName: string
	fromTable: string
	fromColumn: string
	toTable: string
	toColumn: string
	deleteAction: ForeignKeyDeleteAction
}

export enum ForeignKeyDeleteAction {
	noaction = 'a',
	restrict = 'r',
	cascade = 'c',
	setnull = 'n',
	setdefault = 'd'
}

export interface ForeignKeyFilter {
	fromTable?: string
	fromColumn?: string
	toTable?: string
	toColumn?: string
	constraintName?: string
}

export class ForeignKeyConstraintMetadataSet {
	constructor(
		private readonly constraints: ForeignKeyConstraintMetadata[],
	) {
	}

	public toArray(): ForeignKeyConstraintMetadata[] {
		return this.constraints
	}

	public first(): ForeignKeyConstraintMetadata | null {
		return this.constraints.length > 0 ? this.constraints[0] : null
	}

	public getNames(): string[] {
		return this.constraints.map(it => it.constraintName)
	}

	public filter(filter: ForeignKeyFilter): ForeignKeyConstraintMetadataSet {
		return new ForeignKeyConstraintMetadataSet(this.constraints.filter(it => {
			if (filter.fromTable !== undefined && it.fromTable !== filter.fromTable) {
				return false
			}
			if (filter.fromColumn !== undefined && it.fromColumn !== filter.fromColumn) {
				return false
			}
			if (filter.toTable !== undefined && it.toTable !== filter.toTable) {
				return false
			}
			if (filter.toColumn !== undefined && it.toColumn !== filter.toColumn) {
				return false
			}
			if (filter.constraintName !== undefined && it.constraintName !== filter.constraintName) {
				return false
			}
			return true
		}))
	}
}
