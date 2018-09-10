import { Input, Model } from 'cms-common'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import { acceptFieldVisitor, acceptRelationTypeVisitor, getColumnName } from '../../../content-schema/modelUtils'
import SelectHydrator from './SelectHydrator'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import RelationFetchVisitor from './RelationFetchVisitor'
import Mapper from '../Mapper'
import WhereBuilder from './WhereBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'

export default class SelectBuilder {
	public readonly rows: PromiseLike<SelectHydrator.Rows>
	private firer: () => void = () => {
		throw new Error()
	}

	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly qb: QueryBuilder,
		private readonly hydrator: SelectHydrator
	) {
		const blocker: Promise<void> = new Promise(resolve => (this.firer = resolve))
		this.rows = this.createRowsPromise(blocker)
	}

	public async execute(): Promise<SelectHydrator.Rows> {
		this.firer()
		return await this.rows
	}

	public async select(entity: Model.Entity, input: ObjectNode<Input.ListQueryInput>, path?: Path) {
		path = path || new Path([])
		const promise = this.selectInternal(entity, path, input)
		const where = input.args.where
		if (where) {
			this.whereBuilder.build(this.qb, entity, path, where)
		}
		await promise
	}

	private async selectInternal(entity: Model.Entity, path: Path, input: ObjectNode) {
		if (!input.fields.find(it => it.name === entity.primary && it.alias === entity.primary)) {
			this.addColumn(path, entity.fields[entity.primary] as Model.AnyColumn, entity.primary)
		}

		const promises: Promise<void>[] = []
		for (let field of input.fields) {
			const promise = acceptFieldVisitor(this.schema, entity, field.name, {
				visitColumn: async (entity, column) => {
					this.addColumn(path, column, field.alias)
				},
				visitRelation: async (entity, relation, targetEntity) => {
					await this.addRelation(field as ObjectNode, path, entity)
				}
			})
			if (promise) {
				promises.push(promise)
			}
		}

		await Promise.all(Object.values(promises))
	}

	private addColumn(path: Path, column: Model.AnyColumn, alias: string): void {
		const columnPath = path.for(alias)
		const tableAlias = path.getAlias()
		const columnAlias = columnPath.getAlias()

		this.hydrator.addColumn(columnPath)
		this.qb.select([tableAlias, column.columnName], columnAlias)
	}

	private async addRelation(object: ObjectNode<Input.ListQueryInput>, path: Path, entity: Model.Entity) {
		const idsGetter = (fieldName: string) => {
			const columnName = getColumnName(this.schema, entity, fieldName)
			return this.getColumnValues(path.for(fieldName), columnName)
		}
		const fetchVisitor = new RelationFetchVisitor(
			this.schema,
			this.mapper,
			idsGetter,
			object,
			(parentKey, data, defaultValue) => {
				this.hydrator.addPromise(path.for(object.alias), path.for(parentKey), data, defaultValue)
			}
		)
		acceptRelationTypeVisitor(this.schema, entity, object.name, fetchVisitor)
	}

	private addHasOne(object: ObjectNode, path: Path, entity: Model.Entity, targetEntity: Model.Entity): void {
		//not currently used, maybe in the future
		const targetPath = path.for(object.alias)

		const primaryPath = this.joinBuilder.join(this.qb, targetPath, entity, object.name)
		this.hydrator.addEntity(primaryPath)

		this.select(targetEntity, object, targetPath)
	}

	private async createRowsPromise(blocker: PromiseLike<void>): Promise<SelectHydrator.Rows> {
		await blocker
		return await this.qb.getResult()
	}

	private async getColumnValues(columnPath: Path, columnName: string): Promise<Input.PrimaryValue[]> {
		this.qb.select([columnPath.back().getAlias(), columnName], columnPath.getAlias())
		const rows = await this.rows
		const columnAlias = columnPath.getAlias()
		return rows.map(it => it[columnAlias]).filter((val, index, all) => all.indexOf(val) === index)
	}
}
