import { Client, Connection, ConstraintHelper, wrapIdentifier } from '@contember/database'
import { Model, Schema } from '@contember/schema'
import * as Typesafe from '@contember/typesafe'
import { ParseError } from '@contember/typesafe'
import { Command, CommandArgsMap, CommandName } from './Command'
import { DatabaseContext, StageBySlugQuery } from '@contember/engine-system-api'
import { DbColumnSchema, TransferMapping, TransferTableMapping } from './TransferMapping'
import { ContentSchemaTransferMappingFactory } from './ContentSchemaTransferMappingFactory'
import { SystemSchemaTransferMappingFactory } from './SystemSchemaTransferMappingFactory'
import { AuthResult, HttpError } from '../common'
import { ProjectGroupContainer } from '../projectGroup/ProjectGroupContainer'

type Cell = boolean | number | string | null
type Row = readonly Cell[]

type InsertContext = {
	tableName: string
	insertStartFragment: string
	rowFragment: string
	rowParser: Typesafe.Type<Row>
	rows: Array<Row>
	insertedRowCount: number
}

export class ImportError extends Error {
}

type CommandProcessor<T extends CommandName> = (it: CommandIterator<T>) => Promise<CommandIterator | null>
type CommandProcessorMap<T extends CommandName> = { [N in CommandName]?: N extends T ? CommandProcessor<N> : undefined }

class CommandIterator<T extends CommandName = CommandName> {
	private constructor(
		public readonly commandName: T,
		public readonly commandArgs: CommandArgsMap[T],
		private readonly commandIterator: AsyncIterator<Command>,
	) {
	}

	public static async create(commands: AsyncIterable<Command>): Promise<CommandIterator | null> {
		const commandIterator = commands[Symbol.asyncIterator]()
		const result = await commandIterator.next()

		if (result.done) {
			return null
		}

		const [name, ...args] = result.value
		return new CommandIterator(name, args, commandIterator)
	}

	async next(): Promise<CommandIterator | null> {
		const result = await this.commandIterator.next()

		if (result.done) {
			return null
		}

		const [name, ...args] = result.value
		return new CommandIterator(name, args, this.commandIterator)
	}
}

export class ImportExecutor {
	constructor(
		private readonly contentSchemaTransferMappingFactory: ContentSchemaTransferMappingFactory,
		private readonly systemSchemaTransferMappingFactory: SystemSchemaTransferMappingFactory,
	) {
	}

	async import(groupContainer: ProjectGroupContainer, authResult: AuthResult, commands: AsyncIterable<Command>) {
		const it = await CommandIterator.create(commands)

		const final = await this.match(it, {
			importContentSchemaBegin: it => this.importContentSchemaBegin(groupContainer, authResult, it),
			importSystemSchemaBegin: it => this.importSystemSchemaBegin(groupContainer, authResult, it),
		})

		if (final !== null) {
			throw new ImportError(`Unexpected ${final.commandName}`)
		}
	}

	private async match<T extends CommandName>(it: CommandIterator<T> | null, processors: CommandProcessorMap<T>) {
		let next: CommandIterator | null = it

		while (next !== null) {
			const processor = processors[next.commandName]

			if (processor) {
				next = await processor(next as any)

			} else {
				break
			}
		}

		return next
	}

	private async importContentSchemaBegin(groupContainer: ProjectGroupContainer, authResult: AuthResult, it: CommandIterator<'importContentSchemaBegin'>) {
		const [options] = it.commandArgs
		const projectContainer = await this.createProjectContainer(groupContainer, options.project)
		const systemDatabaseContext = projectContainer.systemDatabaseContextFactory.create()
		const stage = await this.fetchStageBySlug(systemDatabaseContext, options.project, options.stage)

		const contentSchema = await projectContainer.contentSchemaResolver.getSchema(systemDatabaseContext, stage.slug)

		if (contentSchema.version !== options.schemaVersion) {
			throw new ImportError(`Incompatible schema version (import version ${options.schemaVersion} does not match server version ${contentSchema.version})`)
		}

		await this.requireImportAccess(groupContainer, contentSchema, authResult, options.project, 'content')
		const contentDatabaseClient = projectContainer.connection.createClient(stage.schema, {})
		const mapping = this.contentSchemaTransferMappingFactory.createContentSchemaMapping(contentSchema)

		return await contentDatabaseClient.transaction(async db => {
			await this.disableTriggers(db, options.tables)
			await this.lockTables(db, options.tables)
			await this.truncateTables(db, options.tables)

			const constraintHelper = new ConstraintHelper(db)
			await constraintHelper.setFkConstraintsDeferred()

			const result = await this.match(await it.next(), {
				importSequence: it => this.importSequence(db, mapping, it),
				insertBegin: it => this.insertBegin(db, mapping, it),
			})

			await constraintHelper.setFkConstraintsImmediate()
			await this.enableTriggers(db, options.tables)

			return result
		})
	}

	private async importSystemSchemaBegin(groupContainer: ProjectGroupContainer, authResult: AuthResult, it: CommandIterator<'importSystemSchemaBegin'>) {
		const [options] = it.commandArgs
		const projectContainer = await this.createProjectContainer(groupContainer, options.project)
		const schema = await groupContainer.projectSchemaResolver.getSchema(options.project)

		if (schema === undefined) {
			throw new ImportError(`Project ${options.project} does not have schema`)
		}

		await this.requireImportAccess(groupContainer, schema, authResult, options.project, 'system')
		const systemDatabaseContext = projectContainer.systemDatabaseContextFactory.create()
		const mapping = this.systemSchemaTransferMappingFactory.build()

		return await systemDatabaseContext.client.transaction(async db => {
			await this.truncateTables(db, options.tables)

			const constraintHelper = new ConstraintHelper(db)
			await constraintHelper.setFkConstraintsDeferred()

			return await this.match(await it.next(), {
				insertBegin: it => this.insertBegin(db, mapping, it),
			})
		})
	}

	private async importSequence(db: Client<Connection.TransactionLike>, mapping: TransferMapping, it: CommandIterator<'importSequence'>): Promise<CommandIterator | null> {
		const [options] = it.commandArgs

		await db.query(
			'SELECT setval(pg_get_serial_sequence(?, ?), ?)',
			[`${db.schema}.${options.table}`, options.column, options.value],
		)

		return it.next()
	}

	private async insertBegin(db: Client<Connection.TransactionLike>, mapping: TransferMapping, it: CommandIterator<'insertBegin'>): Promise<CommandIterator | null> {
		const [options] = it.commandArgs
		const insertContext = await this.buildInsertContext(db, mapping, db.schema, options.table, options.columns)
		let insertRowsPromise: Promise<Connection.Result> | null = null

		const result = await this.match(await it.next(), {
			insertRow: async it => {
				const [values] = it.commandArgs

				try {
					insertContext.rows.push(insertContext.rowParser(values))

				} catch (e) {
					if (e instanceof ParseError) {
						throw new ImportError(`Invalid row ${JSON.stringify(values)} for table ${options.table}: ${e.message}`)

					} else {
						throw e
					}
				}

				if (insertContext.rows.length === 1000) {
					await insertRowsPromise
					insertRowsPromise = this.insertRows(db, insertContext)
					insertContext.insertedRowCount += insertContext.rows.length
					insertContext.rows = []
				}

				return await it.next()
			},
		})

		if (insertContext.rows.length > 0) {
			await insertRowsPromise
			await this.insertRows(db, insertContext)
			insertContext.insertedRowCount += insertContext.rows.length
			insertContext.rows = []
		}

		if (result === null || result.commandName !== 'insertEnd') {
			throw new ImportError(`Missing insertEnd command`)
		}

		return await result.next()
	}

	private async createProjectContainer(groupContainer: ProjectGroupContainer, projectSlug: string) {
		const projectContainerResolver = groupContainer.projectContainerResolver
		const projectContainer = await projectContainerResolver.getProjectContainer(projectSlug, { alias: true })

		if (projectContainer === undefined) {
			throw new ImportError(`Project ${projectSlug} does not exists.`)
		}

		return projectContainer
	}

	private async requireImportAccess(groupContainer: ProjectGroupContainer, schema: Schema, authResult: AuthResult, projectSlug: string, kind: 'content' | 'system') {
		const { effective: memberships } = await groupContainer.projectMembershipResolver.resolveMemberships({
			request: { get: () => '' },
			acl: schema.acl,
			projectSlug: projectSlug,
			identity: {
				identityId: authResult.identityId,
				roles: authResult.roles,
			},
		})

		const projectRoles = memberships.map(it => it.role)

		if (!projectRoles.some(role => schema.acl.roles[role]?.[kind]?.import)) {
			throw new HttpError(`You are not allowed to import ${kind} in ${projectSlug}`, 403)
		}
	}

	private async fetchStageBySlug(systemDatabaseContext: DatabaseContext, projectSlug: string, stageSlug: string) {
		const stage = await systemDatabaseContext.queryHandler.fetch(new StageBySlugQuery(stageSlug))

		if (stage === null) {
			throw new ImportError(`Project ${projectSlug} does not have stage ${stageSlug}.`)
		}

		return stage
	}

	private async disableTriggers(db: Client, tableNames: readonly string[]) {
		for (const tableName of tableNames) {
			const tableNameQuoted = `${wrapIdentifier(db.schema)}.${wrapIdentifier(tableName)}`
			await db.query(`ALTER TABLE ${tableNameQuoted} DISABLE TRIGGER USER`)
		}
	}

	private async enableTriggers(db: Client, tableNames: readonly string[]) {
		for (const tableName of tableNames) {
			const tableNameQuoted = `${wrapIdentifier(db.schema)}.${wrapIdentifier(tableName)}`
			await db.query(`ALTER TABLE ${tableNameQuoted} ENABLE TRIGGER USER`)
		}
	}

	private async lockTables(db: Client, tableNames: readonly string[]) {
		const tableNamesQuoted = tableNames.map(it => `${wrapIdentifier(db.schema)}.${wrapIdentifier(it)}`)
		await db.query(`LOCK ${tableNamesQuoted.join(', ')} IN EXCLUSIVE MODE`)
	}

	private async truncateTables(db: Client, tableNames: readonly string[]) {
		const tableNamesQuoted = tableNames.map(it => `${wrapIdentifier(db.schema)}.${wrapIdentifier(it)}`)
		await db.query(`TRUNCATE ${tableNamesQuoted.join(', ')}`)
	}

	private async insertRows(db: Client, context: InsertContext) {
		const rowsFragment = context.rows.map(_ => context.rowFragment).join(',\n')
		const sql = context.insertStartFragment + rowsFragment
		const parameters: Cell[] = []

		for (const row of context.rows) {
			for (const cell of row) {
				parameters.push(cell)
			}
		}

		return await db.query(sql, parameters)
	}

	private async buildInsertContext(db: Client, mapping: TransferMapping, schema: string, tableName: string, columnNames: readonly string[]): Promise<InsertContext> {
		const tableMapping = mapping.tables[tableName]
		const columns = []

		if (tableMapping === undefined) {
			throw new ImportError(`Unknown table ${tableName}`)
		}

		for (const columnName of columnNames) {
			const column = tableMapping.columns[columnName]

			if (column === undefined) {
				throw new ImportError(`Unknown column ${tableName}.${columnName}`)
			}

			columns.push(column)
		}

		const insertStartFragment = (tableMapping.createInsertStartFragment ?? this.createInsertStartFragment)(schema, tableName, columnNames)
		const rowFragment = '(' + columns.map(_ => '?').join(', ') + ')'
		const rowParser = await this.buildRowParser(db, tableMapping, columns)

		return {
			tableName,
			insertStartFragment,
			rowFragment,
			rowParser,
			rows: [],
			insertedRowCount: 0,
		}
	}

	private createInsertStartFragment(schema: string, tableName: string, columnNames: readonly string[]): string {
		const tableQuoted = `${wrapIdentifier(schema)}.${wrapIdentifier(tableName)}`
		const columnsQuoted = '(' + columnNames.map(it => wrapIdentifier(it)).join(', ') + ')'
		return `INSERT INTO ${tableQuoted} ${columnsQuoted} VALUES\n`
	}

	private async buildRowParser(db: Client, tableMapping: TransferTableMapping, columns: DbColumnSchema[]): Promise<Typesafe.Type<readonly Cell[]>> {
		const baseType = Typesafe.tuple(...columns.map(it => {
			const base = this.buildColumnRuntimeType(it.type)
			return it.nullable ? Typesafe.nullable(base) : base
		}))

		if (tableMapping.createRowParser === undefined) {
			return baseType
		}

		return await tableMapping.createRowParser(db, columns.map(it => it.name), baseType)
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
}
