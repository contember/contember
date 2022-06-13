import { Model } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'
import { Client, Literal } from '@contember/database'

type Cell = boolean | number | string | null

export type TransferMapping = { tables: TransferTableMappingMap }

export type TransferTableMappingMap = Record<string, TransferTableMapping>
export type TransferTableMapping = {
	name: string
	columns: DbColumnSchemaMap

	createSelect?: (db: Client, table: TransferTableMapping) => Literal
	createInsertStartFragment?: (schema: string, tableName: string, columnNames: readonly string[]) => string
	createRowParser?: (db: Client, columns: string[], baseType: Typesafe.Type<readonly Cell[]>) => Promise<Typesafe.Type<readonly Cell[]>>
}

export type DbColumnSchemaMap = Record<string, DbColumnSchema>
export type DbColumnSchema =
	| { name: string; nullable?: boolean; type: Exclude<Model.ColumnType, Model.ColumnType.Enum | Model.ColumnType.Json> }
	| { name: string; nullable?: boolean; type: Model.ColumnType.Json; schema?: Typesafe.Type }
	| { name: string; nullable?: boolean; type: Model.ColumnType.Enum; values: readonly string[] }

// TODO: content sequence
