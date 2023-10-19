import {
	ForeignKeyConstraintMetadata,
	GetForeignKeyConstraintNameArgs,
	GetIndexNameArgs,
	GetUniqueConstraintNameArgs,
	IndexMetadata,
	SchemaDatabaseMetadata,
	UniqueConstraintMetadata,
} from '@contember/schema-utils'

const stringArrayEquals = (colA: string[], colB: string[]) => {
	if (colA.length !== colB.length) {
		return false
	}
	const a = [...colA].sort()
	const b = [...colB].sort()
	return a.every((it, index) => it === b[index])
}

export class ResolvedDatabaseMetadata implements SchemaDatabaseMetadata {
	constructor(
		private readonly foreignKeys: ForeignKeyConstraintMetadata[],
		private readonly uniqueConstraints: UniqueConstraintMetadata[],
		private readonly indexes: IndexMetadata[],
	) {
	}

	getAllUniqueConstraints(): UniqueConstraintMetadata[] {
		return this.uniqueConstraints
	}

	getUniqueConstraint(tableName: string, constraintName: string): UniqueConstraintMetadata | null {
		return this.uniqueConstraints.find(it => it.tableName === tableName && it.constraintName === constraintName) ?? null
	}

	getForeignKeyConstraint(tableName: string, constraintName: string): ForeignKeyConstraintMetadata | null {
		return this.foreignKeys.find(it => it.fromTable === tableName && it.constraintName === constraintName) ?? null
	}

	getForeignKeyConstraintNames({ fromTable, fromColumn, toTable, toColumn }: GetForeignKeyConstraintNameArgs): string[] {
		return this.foreignKeys
			.filter(it =>
				it.fromTable === fromTable
				&& it.toTable === toTable
				&& it.fromColumn === fromColumn
				&& it.toColumn === toColumn,
			)
			.map(it => it.constraintName)
	}

	getUniqueConstraintNames({ tableName, columnNames }: GetUniqueConstraintNameArgs): string[] {
		return this.uniqueConstraints
			.filter(it => it.tableName === tableName && stringArrayEquals(columnNames, it.columnNames))
			.map(it => it.constraintName)
	}

	getIndexNames({ tableName, columnNames }: GetIndexNameArgs): string[] {
		return this.indexes
			.filter(it => it.tableName === tableName && stringArrayEquals(columnNames, it.columnNames))
			.map(it => it.indexName)
	}
}
