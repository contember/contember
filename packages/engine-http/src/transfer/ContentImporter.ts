import { Client, ConstraintHelper, wrapIdentifier } from '@contember/database'
import { Model } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'
import { Command } from './Command'
import { PgColumnSchema, PgSchema, PgSchemaBuilder } from './PgSchemaBuilder'
import { Readable } from 'stream'
import { assertNever, VersionedSchema } from '@contember/engine-system-api'


type Cell = boolean | number | string | null
type Row = readonly Cell[]

type InsertContext = {
	table: string,
	columns: readonly string[]
	rowType: Typesafe.Type<Row>
	rows: Array<Row>
}

export class ContentImporter {
	async import(db: Client, stream: Readable, schema: VersionedSchema) {
		await db.transaction(async db => {
			const pgSchema = PgSchemaBuilder.build(schema)
			const lines = this.readLines(stream)
			const commands = this.readCommands(lines)
			await this.executeCommands(commands, db, pgSchema, schema.version)
		})
	}

	private async executeCommands(commands: AsyncIterable<Command>, db: Client, schema: PgSchema, schemaVersion: string) {
		let insertContext: InsertContext | null = null

		for await (const command of commands) {
			const [commandName] = command

			if (commandName === 'checkSchemaVersion') {
				const [, expectedVersion] = command
				if (schemaVersion !== expectedVersion) {
					throw new Error(`Incompatible schema version`)
				}

			} else if (commandName === 'deferForeignKeyConstraints') {
				const constraintHelper = new ConstraintHelper(db)
				await constraintHelper.setFkConstraintsDeferred()

			} else if (commandName === 'truncate') {
				const [, tableNames] = command
				await this.truncate(db, tableNames)

			} else if (commandName === 'insertBegin') {
				if (insertContext !== null) {
					throw new Error(`You need to call insertEnd before calling ${commandName}`)
				}

				const [, tableName, columnNames] = command
				insertContext = this.buildInsertContext(schema, tableName, columnNames)

			} else if (commandName === 'insertRow') {
				if (insertContext === null) {
					throw new Error(`You need to call insertBegin before calling ${commandName}`)
				}

				const [, values] = command
				insertContext.rows.push(insertContext.rowType(values))

				if (insertContext.rows.length === 100) {
					await this.insertRows(db, insertContext)
				}

			} else if (commandName === 'insertEnd') {
				if (insertContext === null) {
					throw new Error(`You need to call insertBegin before calling ${commandName}`)
				}

				if (insertContext.rows.length > 0) {
					await this.insertRows(db, insertContext)
				}

				insertContext = null

			} else {
				assertNever(commandName)
			}
		}
	}

	private async truncate(db: Client, tableNames: readonly string[]) {
		const tableNamesQuoted = tableNames.map(it => `${wrapIdentifier(db.schema)}.${wrapIdentifier(it)}`)
		await db.query(`TRUNCATE ${tableNamesQuoted.join(', ')}`)
	}

	private async insertRows(db: Client, context: InsertContext) {
		const repeatAndJoin = (s: string, sep: string, count: number) => `${s}${sep}`.repeat(count - 1) + s

		const tableQuoted = `${wrapIdentifier(db.schema)}.${wrapIdentifier(context.table)}`
		const columnsQuoted = '(' + context.columns.map(it => wrapIdentifier(it)) + ')'
		const row = '(' + repeatAndJoin('?', ', ', context.columns.length) + ')'
		const rows = repeatAndJoin(row, ',\n', context.rows.length)
		const sql = `INSERT INTO ${tableQuoted} ${columnsQuoted} VALUES\n${rows}`
		const parameters: Cell[] = []

		for (const row of context.rows) {
			for (const cell of row) {
				parameters.push(cell)
			}
		}

		await db.query(sql, parameters)
		context.rows = []
	}

	private buildInsertContext(schema: PgSchema, tableName: string, columnNames: readonly string[]): InsertContext {
		const table = schema.tables[tableName]
		const columns = []

		if (table === undefined) {
			throw new Error(`Unknown table ${tableName}`)
		}

		for (const columnName of columnNames) {
			const column = table.columns[columnName]

			if (column === undefined) {
				throw new Error(`Unknown column ${tableName}.${columnName}`)
			}

			columns.push(column)
		}

		const rowRuntimeType = this.buildRowRuntimeType(columns)
		return { table: tableName, columns: columnNames, rowType: rowRuntimeType, rows: [] }
	}

	private buildRowRuntimeType(columns: PgColumnSchema[]): Typesafe.Type<readonly Cell[]> {
		return Typesafe.tuple(...columns.map(it => {
			const base = this.buildColumnRuntimeType(it.type)
			return it.nullable ? Typesafe.nullable(base) : base
		}))
	}

	private buildColumnRuntimeType(columnType: Model.ColumnType): Typesafe.Type<Exclude<Cell, null>> {
		switch (columnType) {
			case Model.ColumnType.Uuid: return Typesafe.string // TODO
			case Model.ColumnType.String: return Typesafe.string
			case Model.ColumnType.Int: return Typesafe.number // TODO
			case Model.ColumnType.Double: return Typesafe.number
			case Model.ColumnType.Bool: return Typesafe.boolean
			case Model.ColumnType.Enum: return Typesafe.string // TODO
			case Model.ColumnType.DateTime: return Typesafe.string // TODO
			case Model.ColumnType.Date: return Typesafe.string // TODO
			case Model.ColumnType.Json: return Typesafe.string
		}
	}

	private async* readCommands(lines: AsyncIterable<string>) {
		for await (let line of lines) {
			yield Command(JSON.parse(line))
		}
	}

	private async* readLines(stream: AsyncIterable<Buffer>) {
		let chunks = []

		for await (let chunk of stream) {
			while (true) {
				const eolIndex = chunk.indexOf('\n')

				if (eolIndex < 0) {
					chunks.push(chunk)
					break
				}

				chunks.push(chunk.slice(0, eolIndex))
				chunk = chunk.slice(eolIndex + 1)
				yield Buffer.concat(chunks).toString('utf8')
				chunks = []
			}
		}
	}
}
