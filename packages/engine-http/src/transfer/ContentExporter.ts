import { Client, Compiler, Connection } from '@contember/database'
import { Command } from './Command'
import { PgSchema, PgSchemaBuilder, PgTableSchema } from './PgSchemaBuilder'
import TransactionLike = Connection.TransactionLike
import { VersionedSchema } from '@contember/engine-system-api'
import { asyncIterableTransaction } from '@contember/database'
import { Buffer } from 'buffer'

export class ContentExporter {
	async* export(db: Client, projectSchema: VersionedSchema): AsyncIterable<Buffer> {
		const that = this
		yield* asyncIterableTransaction(db, async function* (db) {
			await db.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE')
			const commands = that.exportSchema(db, PgSchemaBuilder.build(projectSchema), projectSchema.version)
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

	private async* exportSchema(db: Client<TransactionLike>, schema: PgSchema, schemaVersion: string): AsyncIterable<Command> {
		yield ['checkSchemaVersion', schemaVersion]
		yield ['deferForeignKeyConstraints']
		yield ['truncate', Object.keys(schema.tables)]

		for (const table of Object.values(schema.tables)) {
			yield* this.exportTable(db, table)
		}
	}

	private async* exportTable(db: Client<TransactionLike>, table: PgTableSchema): AsyncIterable<Command> {
		const query = this.buildQuery(db, table)
		let empty = true

		for await (const row of this.cursorQuery(db, 100, query.sql, query.parameters)) {
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

	private buildQuery(db: Client<TransactionLike>, table: PgTableSchema) {
		let builder = db.selectBuilder().from(table.name)

		for (const column of Object.keys(table.columns)) {
			builder = builder.select(column)
		}

		const namespaceContext = new Compiler.Context(db.schema, new Set())
		return builder.createQuery(namespaceContext)
	}

	private async* cursorQuery(db: Client<TransactionLike>, batchSize: number, sql: string, parameters: readonly any[] = []) {
		await db.query(`DECLARE contember_cursor NO SCROLL CURSOR FOR ${sql}`, parameters)

		while (true) {
			const result = await db.query(`FETCH ${Number(batchSize)} FROM contember_cursor`)

			if (result.rowCount === 0) {
				break
			}

			yield* result.rows
		}

		await db.query(`CLOSE contember_cursor`)
	}
}
