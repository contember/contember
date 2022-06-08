import { Client, Compiler, Connection } from '@contember/database'
import { Command } from './Command'
import { DbSchema, DbSchemaBuilder, DbTableSchema } from './DbSchemaBuilder'
import TransactionLike = Connection.TransactionLike
import { VersionedSchema } from '@contember/engine-system-api'
import { asyncIterableTransaction } from '@contember/database'
import { Buffer } from 'buffer'

const DB_FETCH_BATCH_SIZE = 100

export class ContentExporter {
	async* export(db: Client, projectSchema: VersionedSchema): AsyncIterable<Buffer> {
		const that = this
		yield* asyncIterableTransaction(db, async function* (db) {
			await db.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE')
			const commands = that.exportSchema(db, DbSchemaBuilder.build(projectSchema), projectSchema.version)
			yield* that.toBuffer(commands)
		})
	}

	private async* toBuffer(commands: AsyncIterable<Command>): AsyncIterable<Buffer> {
		const newLine = Buffer.from('\n')
		for await (const command of commands) {
			yield Buffer.from(JSON.stringify(command))
			yield newLine
		}
	}

	private async* exportSchema(db: Client<TransactionLike>, schema: DbSchema, schemaVersion: string): AsyncIterable<Command> {
		yield ['checkSchemaVersion', schemaVersion]
		yield ['deferForeignKeyConstraints']
		yield ['truncate', Object.keys(schema.tables)]

		for (const table of Object.values(schema.tables)) {
			yield* this.exportTable(db, table)
		}
	}

	private async* exportTable(db: Client<TransactionLike>, table: DbTableSchema): AsyncIterable<Command> {
		const query = this.buildQuery(db, table)
		let empty = true

		for await (const row of this.cursorQuery(db, DB_FETCH_BATCH_SIZE, query.sql, query.parameters)) {
			if (empty) {
				yield ['insertBegin', table.name, Object.keys(table.columns)]
				empty = false
			}

			yield ['insertRow', Object.values(row)]
		}

		if (!empty) {
			yield ['insertEnd']
		}
	}

	private buildQuery(db: Client<TransactionLike>, table: DbTableSchema) {
		let builder = db.selectBuilder().from(table.name)

		for (const column of Object.keys(table.columns)) {
			builder = builder.select(column)
		}

		const namespaceContext = new Compiler.Context(db.schema, new Set())
		return builder.createQuery(namespaceContext)
	}

	private async* cursorQuery(db: Client<TransactionLike>, batchSize: number, sql: string, parameters: readonly any[] = []) {
		await db.query(`DECLARE contember_cursor NO SCROLL CURSOR FOR ${sql}`, parameters)

		const fetchSql = `FETCH ${Number(batchSize)} FROM contember_cursor`
		let resultPromise: Promise<Connection.Result> | null = db.query(fetchSql)

		while (resultPromise !== null) {
			const result: Connection.Result = await resultPromise
			resultPromise = result.rowCount < batchSize ? null : db.query(fetchSql) // pipeline
			yield* result.rows
		}

		await db.query(`CLOSE contember_cursor`)
	}
}
