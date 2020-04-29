import { Input, Model } from '@contember/schema'
import { acceptFieldVisitor, getColumnName } from '@contember/schema-utils'
import SelectHydrator from './SelectHydrator'
import Path from './Path'
import WhereBuilder from './WhereBuilder'
import { Client, SelectBuilder as DbSelectBuilder } from '@contember/database'
import OrderByBuilder from './OrderByBuilder'
import FieldsVisitorFactory from './handlers/FieldsVisitorFactory'
import { LimitByGroupWrapper } from '@contember/database'
import SelectExecutionHandler from './SelectExecutionHandler'
import MetaHandler from './handlers/MetaHandler'
import Mapper from '../Mapper'
import { FieldNode, ObjectNode } from '../../inputProcessing'

export default class SelectBuilder {
	private resolver: (value: SelectHydrator.Rows) => void = () => {
		throw new Error('SelectBuilder: Resolver called too soon')
	}
	public readonly rows: Promise<SelectHydrator.Rows> = new Promise(resolve => (this.resolver = resolve))

	private queryWrapper: LimitByGroupWrapper | null = null

	constructor(
		private readonly schema: Model.Schema,
		private readonly whereBuilder: WhereBuilder,
		private readonly orderByBuilder: OrderByBuilder,
		private readonly metaHandler: MetaHandler,
		private qb: DbSelectBuilder<DbSelectBuilder.Result, any>,
		private readonly hydrator: SelectHydrator,
		private readonly fieldsVisitorFactory: FieldsVisitorFactory,
		private readonly selectHandlers: { [key: string]: SelectExecutionHandler<any> },
	) {}

	public async execute(db: Client): Promise<SelectHydrator.Rows> {
		let result: SelectHydrator.Rows
		if (this.queryWrapper) {
			result = await this.queryWrapper.getResult(this.qb, db)
		} else {
			result = await this.qb.getResult(db)
		}
		this.resolver(result)
		return result
	}

	public async select(
		mapper: Mapper,
		entity: Model.Entity,
		input: ObjectNode<Input.ListQueryInput>,
		path: Path,
		groupBy?: string,
	) {
		const promise = this.selectInternal(mapper, entity, path, input)
		const where = input.args.filter
		if (where) {
			this.qb = this.whereBuilder.build(this.qb, entity, path, where)
		}
		const orderBy = input.args.orderBy || []

		if (groupBy) {
			const groupByColumn = getColumnName(this.schema, entity, groupBy)
			this.queryWrapper = new LimitByGroupWrapper(
				[path.getAlias(), groupByColumn],
				(orderable, qb) => {
					if (orderBy.length > 0) {
						;[qb, orderable] = this.orderByBuilder.build(this.qb, orderable, entity, new Path([]), orderBy)
					}
					return [orderable, qb]
				},
				input.args.offset,
				input.args.limit,
			)
		} else {
			if (orderBy.length > 0) {
				;[this.qb] = this.orderByBuilder.build(this.qb, this.qb, entity, path, orderBy)
			}
			if (input.args.limit) {
				this.qb = this.qb.limit(input.args.limit, input.args.offset)
			}
		}

		await promise
	}

	private async selectInternal(mapper: Mapper, entity: Model.Entity, path: Path, input: ObjectNode) {
		if (!input.fields.find(it => it.name === entity.primary && it.alias === entity.primary)) {
			input = input.withField(new FieldNode(entity.primary, entity.primary, {}))
		}

		for (let field of input.fields) {
			const fieldPath = path.for(field.alias)
			const executionContext: SelectExecutionHandler.Context = {
				mapper,
				field: field,
				addData: async (fieldName, cb, defaultValue = null) => {
					const columnName = getColumnName(this.schema, entity, fieldName)
					const ids = (await this.getColumnValues(path.for(fieldName), columnName)).filter(it => it !== null)

					const data = (async () => (ids.length > 0 ? cb(ids) : {}))()
					this.hydrator.addPromise(fieldPath, path.for(fieldName), data, defaultValue)
				},
				addColumn: (qbCallback, path) => {
					this.qb = qbCallback(this.qb)
					this.hydrator.addColumn(path || fieldPath)
				},
				path: fieldPath,
				entity: entity,
			}

			if (field.name === '_meta') {
				this.metaHandler.process(executionContext)
				continue
			}

			// Disregarding __typename field since it's automatically handled by apollo server
			if (field.name === '__typename') {
				continue
			}

			if (field.meta.extensionKey) {
				const handler = this.selectHandlers[field.meta.extensionKey]
				if (!handler) {
					throw new Error(`Handler for ${field.meta.extensionKey} not found`)
				}
				handler.process(executionContext)
				continue
			}

			const fieldVisitor = this.fieldsVisitorFactory.create(mapper, executionContext)
			acceptFieldVisitor(this.schema, entity, field.name, fieldVisitor)
		}
	}

	private async getColumnValues(columnPath: Path, columnName: string): Promise<Input.PrimaryValue[]> {
		this.qb = this.qb.select([columnPath.back().getAlias(), columnName], columnPath.getAlias())
		const rows = await this.rows
		const columnAlias = columnPath.getAlias()
		return rows
			.map((it): Input.PrimaryValue => it[columnAlias] as Input.PrimaryValue)
			.filter((val, index, all) => all.indexOf(val) === index)
	}
}
