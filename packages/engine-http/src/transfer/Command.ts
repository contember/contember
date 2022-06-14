import * as Typesafe from '@contember/typesafe'

const tuple = <T extends any[]>(...values: T) => values

export const Command = Typesafe.discriminatedTupleUnion({
	importTenantSchemaBegin: tuple(),
	importSystemSchemaBegin: tuple(
		Typesafe.object({
			project: Typesafe.string,
			tables: Typesafe.array(Typesafe.string),
		}),
	),
	importContentSchemaBegin: tuple(
		Typesafe.object({
			project: Typesafe.string,
			stage: Typesafe.string,
			schemaVersion: Typesafe.string,
			tables: Typesafe.array(Typesafe.string),
		}),
	),
	insertBegin: tuple(
		Typesafe.object({
			table: Typesafe.string,
			columns: Typesafe.array(Typesafe.string),
		}),
	),
	insertRow: tuple(
		Typesafe.array(Typesafe.anyJson), // values
	),
	insertEnd: tuple(),
})

export type Command = ReturnType<typeof Command>
export type CommandName = Command[0]
export type CommandArgsMap<S extends Command = Command> = { [K in S[0]]: S extends readonly [K, ...infer T] ? T : never }
