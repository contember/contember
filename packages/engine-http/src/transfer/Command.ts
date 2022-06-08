import * as Typesafe from '@contember/typesafe'

export const CheckSchemaVersion = Typesafe.tuple(
	Typesafe.literal('checkSchemaVersion'),
	Typesafe.string, // schemaVersion
)

export const DeferForeignKeyConstraintCommand = Typesafe.tuple(
	Typesafe.literal('deferForeignKeyConstraints'),
)

export const TruncateCommand = Typesafe.tuple(
	Typesafe.literal('truncate'),
	Typesafe.array(Typesafe.string), // tableNames
)

export const InsertBeginCommand = Typesafe.tuple(
	Typesafe.literal('insertBegin'),
	Typesafe.string, // tableName
	Typesafe.array(Typesafe.string), // columnNames
)

export const InsertRowCommand = Typesafe.tuple(
	Typesafe.literal('insertRow'),
	Typesafe.array(Typesafe.anyJson), // values
)

export const InsertEndCommand = Typesafe.tuple(
	Typesafe.literal('insertEnd'),
)

export const Command = Typesafe.union(
	CheckSchemaVersion,
	DeferForeignKeyConstraintCommand,
	TruncateCommand,
	InsertBeginCommand,
	InsertRowCommand,
	InsertEndCommand,
)

export type Command = ReturnType<typeof Command>
