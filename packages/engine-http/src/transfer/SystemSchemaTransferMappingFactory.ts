import { TransferMapping, TransferTableMapping } from './TransferMapping.js'
import { Model } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'
import { Compiler, Operator, wrapIdentifier } from '@contember/database'
import { ImportError } from './ImportExecutor.js'

export class SystemSchemaTransferMappingFactory {
	build(): TransferMapping {
		return {
			tables: this.associateByName([
				this.buildEventDataMapping(),
				{
					name: 'stage',
					columns: this.associateByName([
						{ name: 'id', type: Model.ColumnType.Uuid },
						{ name: 'name', type: Model.ColumnType.String },
						{ name: 'slug', type: Model.ColumnType.String }, // TODO: validate?
						{ name: 'schema', type: Model.ColumnType.String },
					]),
				},
				{
					name: 'stage_transaction',
					columns: this.associateByName([
						{ name: 'transaction_id', type: Model.ColumnType.Uuid },
						{ name: 'stage_id', type: Model.ColumnType.Uuid },
						{ name: 'applied_at', type: Model.ColumnType.DateTime },
					]),
				},
			]),
		}
	}

	private buildEventDataMapping(): TransferTableMapping {
		return {
			name: 'event_data',

			columns: this.associateByName([
				{ name: 'id', type: Model.ColumnType.Uuid },
				{ name: 'type', type: Model.ColumnType.Enum, values: ['create', 'update', 'delete'] },
				{ name: 'table_name', type: Model.ColumnType.String },
				{ name: 'row_ids', type: Model.ColumnType.Json, schema: Typesafe.array(Typesafe.string) },
				{ name: 'values', type: Model.ColumnType.Json, nullable: true, schema: Typesafe.object({}) },
				{ name: 'created_at', type: Model.ColumnType.DateTime },
				{ name: 'schema_version', type: Model.ColumnType.String },
				{ name: 'identity_id', type: Model.ColumnType.Uuid },
				{ name: 'transaction_id', type: Model.ColumnType.Uuid },
			]),

			createSelect: (db, table) => {
				const namespaceContext = new Compiler.Context(db.schema, new Set())

				let builder = db.selectBuilder()

				for (const column of Object.values(table.columns)) {
					if (column.name === 'schema_version') {
						builder = builder.select(['schema_migration', 'version'], 'schema_version')

					} else if (column.type === Model.ColumnType.Json || column.type === Model.ColumnType.Date || column.type === Model.ColumnType.DateTime) {
						builder = builder.select(expr => expr.raw(`${wrapIdentifier('event_data')}.${wrapIdentifier(column.name)}::text`))

					} else {
						builder = builder.select(['event_data', column.name])
					}
				}

				return builder
					.from('event_data')
					.join(
						'schema_migration',
						undefined,
						expr => expr.compareColumns(['schema_migration', 'id'], Operator.eq, ['event_data', 'schema_id']),
					)
					.createQuery(namespaceContext)
			},

			createInsertStartFragment: (schema, tableName, columnNames) => {
				const columnNames2 = [
					'id',
					'type',
					'table_name',
					'row_ids',
					'values',
					'created_at',
					'schema_id',
					'identity_id',
					'transaction_id',
				]

				const tableQuoted = `${wrapIdentifier(schema)}.${wrapIdentifier(tableName)}`
				const columnsQuoted = '(' + columnNames2.map(it => wrapIdentifier(it)).join(', ') + ')'
				return `INSERT INTO ${tableQuoted} ${columnsQuoted} VALUES\n`
			},

			createRowParser: async (db, columns, baseType) => {
				const schemaMigrations = await db.selectBuilder<{id: string; version: string}>()
					.select('id')
					.select('version')
					.from('schema_migration')
					.getResult(db)

				const versionToId = new Map(schemaMigrations.map(row => ([row.version, row.id])))
				const schemaVersionColumnIndex = columns.indexOf('schema_version')

				if (schemaVersionColumnIndex < 0) {
					return baseType
				}

				return (input, path) => {
					const row = baseType(input, path)
					const schemaVersion = Typesafe.string(row[schemaVersionColumnIndex])
					const schemaVersionId = versionToId.get(schemaVersion)

					if (schemaVersionId === undefined) {
						throw new ImportError(`Unknown schema version ${schemaVersion}`)
					}

					const newRow = [...row]
					newRow[schemaVersionColumnIndex] = schemaVersionId

					return newRow
				}
			},
		}
	}

	private associateByName<T extends { name: string }>(items: T[]): Record<string, T> {
		return Object.fromEntries(items.map(item => [item.name, item]))
	}
}
