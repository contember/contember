export interface Database {
	tables: Table[]
	domains: Domain[]
}

export interface Table {
	name: string
	primaryKeys: string[]
	columns: Column[]
	foreignKeyConstraints: ForeignKeyConstraint[]
	uniqueConstraints: UniqueConstraint[]
}

export interface Column {
	name: string
	notNull: boolean
	type: string
	typeKind: ColumnTypeKind
}

export enum ColumnTypeKind {
	base = 'b',
	composite = 'c',
	domain = 'd',
	enum_ = 'e',
	pseudo = 'p',
	range = 'r',
	multirange = 'm'
}

export interface UniqueConstraint {
	name: string
	columns: string[]
}

export interface ForeignKeyConstraint {
	name: string
	columns: string[]
	targetTable: string
	targetColumns: string[]
	deferrable: boolean
	deferred: boolean
}

export interface Domain {
	name: string
	baseType: string
	baseTypeKind: ColumnTypeKind
	enumValues?: string[]
}
