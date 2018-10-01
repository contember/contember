import { Acl, Input, Model } from 'cms-common'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import { acceptFieldVisitor, acceptRelationTypeVisitor, getColumnName } from '../../../content-schema/modelUtils'
import SelectHydrator from './SelectHydrator'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import Mapper from '../Mapper'
import WhereBuilder from './WhereBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'
import PredicateFactory from '../../../acl/PredicateFactory'
import OrderByBuilder from './OrderByBuilder'
import RelationFetchVisitorFactory from './RelationFetchVisitorFactory'
import LimitByGroupWrapper from '../../../core/knex/LimitByGroupWrapper'

export default class SelectBuilder {
	public readonly rows: PromiseLike<SelectHydrator.Rows>

	private queryWrapper: LimitByGroupWrapper | null = null

	private firer: () => void = () => {
		throw new Error()
	}

	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly whereBuilder: WhereBuilder,
		private readonly orderByBuilder: OrderByBuilder,
		private readonly predicateFactory: PredicateFactory,
		private readonly mapper: Mapper,
		private readonly qb: QueryBuilder,
		private readonly hydrator: SelectHydrator,
		private readonly relationFetchVisitorFactory: RelationFetchVisitorFactory
	) {
		const blocker: Promise<void> = new Promise(resolve => (this.firer = resolve))
		this.rows = this.createRowsPromise(blocker)
	}

	public async execute(): Promise<SelectHydrator.Rows> {
		this.firer()
		return await this.rows
	}

	public async select(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, path: Path, groupBy?: string) {
		const promise = this.selectInternal(entity, path, input)
		const where = input.args.where
		if (where) {
			this.whereBuilder.build(this.qb, entity, path, where)
		}
		const orderBy = input.args.orderBy

		if (groupBy) {
			const groupByColumn = getColumnName(this.schema, entity, groupBy)
			this.queryWrapper = new LimitByGroupWrapper(
				[path.getAlias(), groupByColumn],
				(orderable, qb) => {
					if (orderBy) {
						this.orderByBuilder.build(this.qb, orderable, entity, new Path([]), orderBy)
					}
				},
				input.args.offset,
				input.args.limit
			)
		} else {
			if (orderBy) {
				this.orderByBuilder.build(this.qb, this.qb, entity, path, orderBy)
			}
			if (input.args.limit) {
				this.qb.limit(input.args.limit, input.args.offset)
			}
		}

		await promise
	}

	private async selectInternal(entity: Model.Entity, path: Path, input: ObjectNode) {
		if (!input.fields.find(it => it.name === entity.primary && it.alias === entity.primary)) {
			this.addColumn(entity, path.for(entity.primaryColumn), entity.fields[entity.primary] as Model.AnyColumn)
		}

		const promises: Promise<void>[] = []
		for (let field of input.fields) {
			if (field.name === '_meta') {
				this.processMetaFields(field as ObjectNode, path, entity)
				continue
			}

			const promise = acceptFieldVisitor(this.schema, entity, field.name, {
				visitColumn: async (entity, column) => {
					const columnPath = path.for(field.alias)
					this.addColumn(entity, columnPath, column)
				},
				visitRelation: async (entity, relation, targetEntity) => {
					await this.addRelation(field as ObjectNode, path, entity)
				},
			})
			if (promise) {
				promises.push(promise)
			}
		}

		await Promise.all(Object.values(promises))
	}

	private processMetaFields(field: ObjectNode, path: Path, entity: Model.Entity) {
		for (let metaField of (field as ObjectNode).fields) {
			const columnPath = path.for(field.alias).for(metaField.alias)
			for (let metaInfo of (metaField as ObjectNode).fields) {
				if (metaInfo.name === Input.FieldMeta.updatable) {
					this.addMetaFlag(entity, metaField.name, path, columnPath.for(metaInfo.alias), Acl.Operation.update)
				}
				if (metaInfo.name === Input.FieldMeta.readable) {
					this.addMetaFlag(entity, metaField.name, path, columnPath.for(metaInfo.alias), Acl.Operation.read)
				}
			}
		}
	}

	private addMetaFlag(
		entity: Model.Entity,
		fieldName: string,
		tablePath: Path,
		metaPath: Path,
		operation: Acl.Operation.read | Acl.Operation.update
	) {
		if (entity.primary === fieldName) {
			return
		}
		const fieldPredicate = this.predicateFactory.create(entity, operation, [fieldName])

		this.qb.select(
			expr =>
				expr.selectCondition(condition => {
					this.whereBuilder.buildInternal(this.qb, condition, entity, tablePath, fieldPredicate)
					if (condition.isEmpty()) {
						condition.raw('true')
					}
				}),
			metaPath.getAlias()
		)
		this.hydrator.addColumn(metaPath)
	}

	private addColumn(entity: Model.Entity, columnPath: Path, column: Model.AnyColumn): void {
		const tableAlias = columnPath.back().getAlias()
		const columnAlias = columnPath.getAlias()

		this.hydrator.addColumn(columnPath)

		const fieldPredicate =
			entity.primary === column.name
				? undefined
				: this.predicateFactory.create(entity, Acl.Operation.read, [column.name])

		if (!fieldPredicate || Object.keys(fieldPredicate).length === 0) {
			this.qb.select([tableAlias, column.columnName], columnAlias)
		} else {
			this.qb.select(
				expr =>
					expr.case(caseExpr =>
						caseExpr
							.when(
								whenExpr =>
									whenExpr.selectCondition(condition =>
										this.whereBuilder.buildInternal(this.qb, condition, entity, columnPath.back(), fieldPredicate)
									),
								thenExpr => thenExpr.select([tableAlias, column.columnName])
							)
							.else(elseExpr => elseExpr.raw('null'))
					),
				columnAlias
			)
		}
	}

	private async addRelation(object: ObjectNode<Input.ListQueryInput>, path: Path, entity: Model.Entity) {
		const idsGetter = (fieldName: string) => {
			const columnName = getColumnName(this.schema, entity, fieldName)
			return this.getColumnValues(path.for(fieldName), columnName)
		}

		const fetchVisitor = this.relationFetchVisitorFactory.create(
			this.mapper,
			idsGetter,
			object,
			(parentKey, data, defaultValue) => {
				this.hydrator.addPromise(path.for(object.alias), path.for(parentKey), data, defaultValue)
			}
		)
		acceptRelationTypeVisitor(this.schema, entity, object.name, fetchVisitor)
	}

	private async createRowsPromise(blocker: PromiseLike<void>): Promise<SelectHydrator.Rows> {
		await blocker
		if (this.queryWrapper) {
			return await this.queryWrapper.getResult(this.qb)
		}
		return await this.qb.getResult()
	}

	private async getColumnValues(columnPath: Path, columnName: string): Promise<Input.PrimaryValue[]> {
		this.qb.select([columnPath.back().getAlias(), columnName], columnPath.getAlias())
		const rows = await this.rows
		const columnAlias = columnPath.getAlias()
		return rows.map(it => it[columnAlias]).filter((val, index, all) => all.indexOf(val) === index)
	}
}
