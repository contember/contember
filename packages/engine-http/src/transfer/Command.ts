import * as Typesafe from '@contember/typesafe'

export type ImportTenantSchemaBegin = ReturnType<typeof ImportTenantSchemaBegin>
export const ImportTenantSchemaBegin = Typesafe.tuple(
	Typesafe.literal('importTenantSchemaBegin'),
)

export type ImportSystemSchemaBegin = ReturnType<typeof ImportSystemSchemaBegin>
export const ImportSystemSchemaBegin = Typesafe.tuple(
	Typesafe.literal('importSystemSchemaBegin'),
	Typesafe.object({
		project: Typesafe.string,
		tables: Typesafe.array(Typesafe.string),
	}),
)

export type ImportContentSchemaBegin = ReturnType<typeof ImportContentSchemaBegin>
export const ImportContentSchemaBegin = Typesafe.tuple(
	Typesafe.literal('importContentSchemaBegin'),
	Typesafe.object({
		project: Typesafe.string,
		stage: Typesafe.string,
		schemaVersion: Typesafe.string,
		tables: Typesafe.array(Typesafe.string),
	}),
)

export type InsertBeginCommand = ReturnType<typeof InsertBeginCommand>
export const InsertBeginCommand = Typesafe.tuple(
	Typesafe.literal('insertBegin'),
	Typesafe.object({
		table: Typesafe.string,
		columns: Typesafe.array(Typesafe.string),
	}),
)

export type InsertRowCommand = ReturnType<typeof InsertRowCommand>
export const InsertRowCommand = Typesafe.tuple(
	Typesafe.literal('insertRow'),
	Typesafe.array(Typesafe.anyJson), // values
)

export type InsertEndCommand = ReturnType<typeof InsertEndCommand>
export const InsertEndCommand = Typesafe.tuple(
	Typesafe.literal('insertEnd'),
)

export const Command = Typesafe.union(
	ImportTenantSchemaBegin,
	ImportSystemSchemaBegin,
	ImportContentSchemaBegin,
	InsertBeginCommand,
	InsertRowCommand,
	InsertEndCommand,
)

export type Command = ReturnType<typeof Command>
export type CommandName = Command[0]
export type CommandArgsMap<S extends Command = Command> = { [K in S[0]]: S extends readonly [K, ...infer T] ? T : never }
