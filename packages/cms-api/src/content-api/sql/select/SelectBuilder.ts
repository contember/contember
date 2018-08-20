import { Input, Model } from 'cms-common'
import ObjectNode from '../../graphQlResolver/ObjectNode'
import { acceptFieldVisitor, acceptRelationTypeVisitor } from '../../../content-schema/modelUtils'
import SelectHydrator from './SelectHydrator'
import Path from './Path'
import JoinBuilder from './JoinBuilder'
import HasManyFetchVisitor from './HasManyFetchVisitor'
import Mapper from '../mapper'
import WhereBuilder from './WhereBuilder'
import QueryBuilder from '../../../core/knex/QueryBuilder'

export default class SelectBuilder {
	public readonly rows: PromiseLike<SelectHydrator.Rows>

	constructor(
		private readonly schema: Model.Schema,
		private readonly joinBuilder: JoinBuilder,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly qb: QueryBuilder,
		private readonly hydrator: SelectHydrator,
		private readonly firer: PromiseLike<void>
	) {
		this.rows = this.createRowsPromise(firer)
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

	public async selectOne(entity: Model.Entity, input: ObjectNode<Input.UniqueQueryInput>, path?: Path) {
		path = path || new Path([])
		const promise = this.selectInternal(entity, path, input)
		const where = input.args.where
		if (where) {
			this.whereBuilder.buildUnique(this.qb, entity, path, where)
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
				visitHasMany: async (entity, relation, targetEntity) => {
					await this.addHasMany(field as ObjectNode, path, entity, targetEntity)
				},
				visitHasOne: async (entity, relation, targetEntity) => {
					this.addHasOne(field as ObjectNode, path, entity, targetEntity)
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

	private async addHasMany(
		object: ObjectNode<Input.ListQueryInput>,
		path: Path,
		entity: Model.Entity,
		targetEntity: Model.Entity
	) {
		const ids = this.getColumnValues(path.for(targetEntity.primary))
		const fetchVisitor = new HasManyFetchVisitor(this.schema, this.mapper, ids, object)

		const group = acceptRelationTypeVisitor(this.schema, entity, object.name, fetchVisitor)
		this.hydrator.addGroupPromise(path.for(object.alias), path.for(entity.primary), group)
		await group
	}

	private addHasOne(object: ObjectNode, path: Path, entity: Model.Entity, targetEntity: Model.Entity): void {
		const targetPath = path.for(object.alias)

		const primaryPath = this.joinBuilder.join(this.qb, targetPath, entity, object.name)
		this.hydrator.addEntity(primaryPath)

		this.select(targetEntity, object, targetPath)
	}

	private async createRowsPromise(firer: PromiseLike<void>): Promise<SelectHydrator.Rows> {
		await firer
		return await this.qb.getResult()
	}

	private async getColumnValues(column: Path): Promise<Input.PrimaryValue[]> {
		const rows = await this.rows
		const columnAlias = column.getAlias()
		return rows.map(it => it[columnAlias])
	}
}
