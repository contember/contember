export type GetForeignKeyConstraintNameArgs = {
	fromTable: string
	fromColumn: string
	toTable: string
	toColumn: string
}

export type GetUniqueConstraintNameArgs = {
	tableName: string
	columnNames: string[]
}

export type GetIndexNameArgs = {
	tableName: string
	columnNames: string[]
}

export interface IndexMetadata {
	indexName: string
	tableName: string
	columnNames: string[]
}

export interface UniqueConstraintMetadata {
	constraintName: string
	tableName: string
	columnNames: string[]
}

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

export interface SchemaDatabaseMetadata {
	getAllUniqueConstraints(): UniqueConstraintMetadata[]

	getUniqueConstraint(tableName: string, constraintName: string): UniqueConstraintMetadata | null

	getForeignKeyConstraint(tableName: string, constraintName: string): ForeignKeyConstraintMetadata | null

	getForeignKeyConstraintNames({ fromTable, fromColumn, toTable, toColumn }: GetForeignKeyConstraintNameArgs): string[]

	getUniqueConstraintNames({ tableName, columnNames }: GetUniqueConstraintNameArgs): string[]

	getIndexNames({ tableName, columnNames }: GetIndexNameArgs): string[]
}


export const dummySchemaDatabaseMetadata: SchemaDatabaseMetadata = {
	getAllUniqueConstraints(): UniqueConstraintMetadata[] {
		return []
	},
	getForeignKeyConstraint(): ForeignKeyConstraintMetadata | null {
		return null
	}, getUniqueConstraint(): UniqueConstraintMetadata | null {
		return null
	},
	getForeignKeyConstraintNames: ({ toColumn, toTable, fromColumn, fromTable }) => {
		return [`fk_${fromTable}_${fromColumn}_${toTable}_${toColumn}`]
	},
	getUniqueConstraintNames: ({ columnNames, tableName }) => {
		return [`uniq_${tableName}_${columnNames.join('_')}`]
	},
	getIndexNames: ({ columnNames, tableName }) => {
		return [`idx_${tableName}_${columnNames.join('_')}`]
	},
}
