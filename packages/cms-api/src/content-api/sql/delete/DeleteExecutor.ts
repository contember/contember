import { Acl, Input, Model, assertNever } from 'cms-common'
import UniqueWhereExpander from '../../graphQlResolver/UniqueWhereExpander'
import { acceptEveryFieldVisitor } from '../../../content-schema/modelUtils'
import WhereBuilder from '../select/WhereBuilder'
import KnexWrapper from '../../../core/knex/KnexWrapper'
import Path from '../select/Path'
import PredicateFactory from '../../../acl/PredicateFactory'
import Returning from '../../../core/knex/internal/Returning'
import Mapper from '../Mapper'
import UpdateBuilderFactory from '../update/UpdateBuilderFactory'

type EntityRelationTuple = [Model.Entity, Model.ManyHasOneRelation | Model.OneHasOneOwnerRelation]

class DeleteExecutor {
	constructor(
		private readonly schema: Model.Schema,
		private readonly db: KnexWrapper,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly updateBuilderFactory: UpdateBuilderFactory
	) {}

	public async execute(entity: Model.Entity, where: Input.UniqueWhere): Promise<void> {
		await this.db.query('SET CONSTRAINTS ALL DEFERRED')
		const uniqueWhere = this.uniqueWhereExpander.expand(entity, where)
		const result = await this.delete(entity, uniqueWhere)
		if (result.length === 0) {
			throw new Mapper.NoResultError()
		}
		await this.executeCascade(entity, result)

		await this.db.query('SET CONSTRAINTS ALL IMMEDIATE')
	}

	private async executeCascade(entity: Model.Entity, values: Input.PrimaryValue[]): Promise<void> {
		await Promise.all(
			this.findOwningRelations(entity).map(async ([owningEntity, relation]) => {
				const relationWhere: Input.Where = { [relation.name]: { [entity.primary]: { in: values } } }
				switch (relation.joiningColumn.onDelete) {
					case Model.OnDelete.restrict:
						break
					case Model.OnDelete.cascade:
						const result = await this.delete(owningEntity, relationWhere)
						if (result.length > 0) {
							await this.executeCascade(owningEntity, result)
						}
						break
					case Model.OnDelete.setNull:
						await this.setNull(owningEntity, relation, relationWhere)
						break
					default:
						assertNever(relation.joiningColumn.onDelete)
				}
			})
		)
	}

	private async delete(entity: Model.Entity, where: Input.Where): Promise<Returning.Result[]> {
		const predicate = this.predicateFactory.create(entity, Acl.Operation.delete)
		const inQb = this.db
			.selectBuilder()
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn])
		const inQbWithWhere = this.whereBuilder.build(inQb, entity, new Path([]), { and: [where, predicate] })

		const qb = this.db
			.deleteBuilder()
			.from(entity.tableName)
			.where(condition => condition.in(entity.primaryColumn, inQbWithWhere))
			.returning(entity.primaryColumn)

		return await qb.execute()
	}

	private async setNull(
		entity: Model.Entity,
		relation: Model.Relation & Model.JoiningColumnRelation,
		where: Input.Where
	): Promise<void> {
		const updateBuilder = this.updateBuilderFactory.create(entity, where)
		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, [relation.name])
		updateBuilder.addOldWhere(predicateWhere)
		updateBuilder.addNewWhere(predicateWhere)
		updateBuilder.addFieldValue(relation.name, null)
		await updateBuilder.execute()
	}

	private findOwningRelations(entity: Model.Entity): EntityRelationTuple[] {
		return Object.values(this.schema.entities)
			.map(entity =>
				acceptEveryFieldVisitor<null | EntityRelationTuple>(this.schema, entity, {
					visitColumn: () => null,
					visitManyHasManyInversed: () => null,
					visitManyHasManyOwner: () => null,
					visitOneHasOneInversed: () => null,
					visitOneHasMany: () => null,
					visitOneHasOneOwner: ({}, relation): EntityRelationTuple => [entity, relation],
					visitManyHasOne: ({}, relation): EntityRelationTuple => [entity, relation],
				})
			)
			.reduce<EntityRelationTuple[]>(
				(acc, value) => [
					...acc,
					...Object.values(value).filter<EntityRelationTuple>((it): it is EntityRelationTuple => it !== null),
				],
				[]
			)
			.filter(([{}, relation]) => relation.target === entity.name)
	}
}

export default DeleteExecutor
