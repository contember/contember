import { asyncIterableTransaction, Client, Compiler, Connection, wrapIdentifier } from '@contember/database'
import { Command } from './Command'
import { TransferMapping, TransferTableMapping } from './TransferMapping'
import { Model } from '@contember/schema'
import { ContentSchemaTransferMappingFactory } from './ContentSchemaTransferMappingFactory'
import { SystemSchemaTransferMappingFactory } from './SystemSchemaTransferMappingFactory'
import * as Typesafe from '@contember/typesafe'
import { StagesQuery } from '@contember/engine-system-api'
import { ProjectContainer } from '../project'

export type ExportRequest = ReturnType<typeof ExportRequest>
export const ExportRequest = Typesafe.object({
	// tenant: Typesafe.boolean,
	projects: Typesafe.array(Typesafe.intersection(
		Typesafe.object({
			slug: Typesafe.string,
			system: Typesafe.boolean,
		}),
		Typesafe.partial({
			targetSlug: Typesafe.string,
		}),
	)),
})

export class ExportExecutor {
	constructor(
		private readonly contentSchemaTransferMappingFactory: ContentSchemaTransferMappingFactory,
		private readonly systemSchemaTransferMappingFactory: SystemSchemaTransferMappingFactory,
	) {
	}

	async* export(request: ExportRequest, projectContainers: Record<string, ProjectContainer>): AsyncIterable<Command> {
		for (const project of request.projects) {
			const projectContainer = projectContainers[project.slug]
			const systemContext = projectContainer.systemDatabaseContextFactory.create()

			if (project.system) {
				const systemMapping = this.systemSchemaTransferMappingFactory.build()
				yield ['importSystemSchemaBegin', { project: project.targetSlug ?? project.slug, tables: Object.keys(systemMapping.tables) }]
				yield* this.exportSchema(systemContext.client, systemMapping)
			}

			for (const stage of await systemContext.queryHandler.fetch(new StagesQuery())) {
				const contentSchema = await projectContainer.contentSchemaResolver.getSchema(systemContext, stage.slug)
				const contentMapping = this.contentSchemaTransferMappingFactory.createContentSchemaMapping(contentSchema)
				const contentDatabaseClient = projectContainer.connection.createClient(stage.schema, {})

				yield [
					'importContentSchemaBegin', {
						project: project.targetSlug ?? project.slug,
						stage: stage.slug,
						schemaVersion: contentSchema.version,
						tables: Object.keys(contentMapping.tables),
					},
				]

				yield* this.exportSchema(contentDatabaseClient, contentMapping)
			}
		}
	}

	private async* exportSchema(db: Client, mapping: TransferMapping): AsyncIterable<Command> {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this
		yield* asyncIterableTransaction(db, async function* (db) {
			await db.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE')
			for (const table of Object.values(mapping.tables)) {
				yield* that.exportSequences(db, table)
				yield* that.exportTable(db, table)
			}
		})
	}

	private async* exportSequences(db: Client<Connection.TransactionLike>, table: TransferTableMapping): AsyncIterable<Command> {
		for (const column of Object.values(table.columns)) {
			if (column.type === Model.ColumnType.Int && column.sequence) {
				const seqNameResult = await db.query<{ name: string }>(
					'SELECT pg_get_serial_sequence(?, ?) AS name',
					[`${db.schema}.${table.name}`, column.name],
				)

				const seqNameQuoted = seqNameResult.rows[0].name.split('.').map(it => wrapIdentifier(it)).join('.')
				const seqValueResult = await db.query<{ last_value: number|string }>(`SELECT last_value FROM ${seqNameQuoted}`)
				const seqValue = seqValueResult.rows[0].last_value
				yield ['importSequence', { table: table.name, column: column.name, value: Number(seqValue) }]
			}
		}
	}

	private async* exportTable(db: Client<Connection.TransactionLike>, table: TransferTableMapping): AsyncIterable<Command> {
		const DB_FETCH_BATCH_SIZE = 100
		const query = (table.createSelect ?? this.buildQuery)(db, table)
		let empty = true

		for await (const row of this.cursorQuery(db, DB_FETCH_BATCH_SIZE, query.sql, query.parameters)) {
			if (empty) {
				yield ['insertBegin', { table: table.name, columns: Object.keys(table.columns) }]
				empty = false
			}

			yield ['insertRow', Object.values(row)]
		}

		if (!empty) {
			yield ['insertEnd']
		}
	}

	private buildQuery(db: Client<Connection.TransactionLike>, table: TransferTableMapping) {
		let builder = db.selectBuilder().from(table.name)

		for (const column of Object.values(table.columns)) {
			if (column.type === Model.ColumnType.Json || column.type === Model.ColumnType.Date || column.type === Model.ColumnType.DateTime) {
				builder = builder.select(expr => expr.raw(`${wrapIdentifier(column.name)}::text`))

			} else {
				builder = builder.select(column.name)
			}
		}

		const namespaceContext = new Compiler.Context(db.schema, new Set())
		return builder.createQuery(namespaceContext)
	}

	private async* cursorQuery(db: Client<Connection.TransactionLike>, batchSize: number, sql: string, parameters: readonly any[] = []) {
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
