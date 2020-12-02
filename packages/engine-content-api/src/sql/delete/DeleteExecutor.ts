import { Acl, Input, Model } from '@contember/schema'
import { assertNever } from '../../utils'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import WhereBuilder from '../select/WhereBuilder'
import { Client, DeleteBuilder, ForeignKeyViolationError, SelectBuilder } from '@contember/database'
import { PathFactory } from '../select/Path'
import PredicateFactory from '../../acl/PredicateFactory'
import UpdateBuilderFactory from '../update/UpdateBuilderFactory'
import {
	MutationDeleteOk,
	MutationEntryNotFoundError,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	NothingToDoReason,
} from '../Result'
import Mapper from '../Mapper'

type EntityRelationTuple = [Model.Entity, Model.ManyHasOneRelation | Model.OneHasOneOwningRelation]

export class DeleteExecutor {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly pathFactory: PathFactory,
	) {}

	public async execute(
		mapper: Mapper,
		entity: Model.Entity,
		by: Input.UniqueWhere,
		filter?: Input.Where,
	): Promise<MutationResultList> {
		const db = mapper.db
		await db.query('SET CONSTRAINTS ALL DEFERRED')
		const primaryValue = await mapper.getPrimaryValue(entity, by)
		if (!primaryValue) {
			return [new MutationEntryNotFoundError([], by)]
		}
		if (mapper.deletedEntities.isDeleted(entity.name, primaryValue)) {
			return [new MutationNothingToDo([], NothingToDoReason.alreadyDeleted)]
		}
		const primaryWhere = { [entity.primary]: { eq: primaryValue } }
		const result = await this.delete(db, entity, filter ? { and: [primaryWhere, filter] } : primaryWhere)
		if (result.length === 0) {
			return [new MutationNoResultError([])]
		}

		try {
			await db.query('SET CONSTRAINTS ALL IMMEDIATE')
			mapper.deletedEntities.markDeleted(entity.name, primaryValue)
			return [new MutationDeleteOk([], entity, primaryValue)]
		} catch (e) {
			if (e instanceof ForeignKeyViolationError) {
				return [new MutationNoResultError([])]
			}
			throw e
		}
	}

	private async delete(db: Client, entity: Model.Entity, where: Input.Where): Promise<string[]> {
		const predicate = this.predicateFactory.create(entity, Acl.Operation.delete)
		const inQb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn])
		const inQbWithWhere = this.whereBuilder.build(inQb, entity, this.pathFactory.create([]), {
			and: [where, predicate],
		})
		const qb = DeleteBuilder.create()
			.from(entity.tableName)
			.where(condition => condition.in(entity.primaryColumn, inQbWithWhere))
			.returning(entity.primaryColumn)
		const result = await qb.execute(db)
		const ids = result.map(it => it[entity.primaryColumn]) as string[]
		await this.executeOnDelete(db, entity, ids)

		return ids as string[]
	}

	private async executeOnDelete(db: Client, entity: Model.Entity, values: Input.PrimaryValue[]): Promise<void> {
		if (values.length === 0) {
			return
		}
		const owningRelations = this.findOwningRelations(entity)
		for (const [owningEntity, relation] of owningRelations) {
			const relationWhere: Input.Where = { [relation.name]: { [entity.primary]: { in: values } } }
			switch (relation.joiningColumn.onDelete) {
				case Model.OnDelete.restrict:
					break
				case Model.OnDelete.cascade:
					await this.delete(db, owningEntity, relationWhere)
					break
				case Model.OnDelete.setNull:
					await this.setNull(db, owningEntity, relation, relationWhere)
					break
				default:
					assertNever(relation.joiningColumn.onDelete)
			}
		}
	}

	private async setNull(
		db: Client,
		entity: Model.Entity,
		relation: Model.Relation & Model.JoiningColumnRelation,
		where: Input.Where,
	): Promise<void> {
		const updateBuilder = this.updateBuilderFactory.create(entity, where)
		const predicateWhere = this.predicateFactory.create(entity, Acl.Operation.update, [relation.name])
		updateBuilder.addOldWhere(predicateWhere)
		updateBuilder.addNewWhere(predicateWhere)
		updateBuilder.addFieldValue(relation.name, null)
		await updateBuilder.execute(db)
	}

	private findOwningRelations(entity: Model.Entity): EntityRelationTuple[] {
		return Object.values(this.schema.entities)
			.map(entity =>
				acceptEveryFieldVisitor<null | EntityRelationTuple>(this.schema, entity, {
					visitColumn: () => null,
					visitManyHasManyInverse: () => null,
					visitManyHasManyOwning: () => null,
					visitOneHasOneInverse: () => null,
					visitOneHasMany: () => null,
					visitOneHasOneOwning: ({}, relation): EntityRelationTuple => [entity, relation],
					visitManyHasOne: ({}, relation): EntityRelationTuple => [entity, relation],
				}),
			)
			.reduce<EntityRelationTuple[]>(
				(acc, value) => [
					...acc,
					...Object.values(value).filter<EntityRelationTuple>((it): it is EntityRelationTuple => it !== null),
				],
				[],
			)
			.filter(([{}, relation]) => relation.target === entity.name)
	}
}
