import { Acl, Input, Model } from '@contember/schema'
import { assertNever } from '../../utils'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import { Client, DeleteBuilder, ForeignKeyViolationError, SelectBuilder } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { PredicateFactory } from '../../acl'
import { UpdateBuilderFactory } from '../update'
import {
	MutationDeleteOk,
	MutationEntryNotFoundError,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	NothingToDoReason,
} from '../Result'
import { Mapper } from '../Mapper'
import { CheckedPrimary } from '../CheckedPrimary'

type EntityOwningRelationTuple = [Model.Entity, Model.ManyHasOneRelation | Model.OneHasOneOwningRelation]
type OneHasOneOwningRelationTuple = [Model.Entity, Model.OneHasOneOwningRelation]

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
		by: Input.UniqueWhere | CheckedPrimary,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		return mapper.mutex.execute(async () => {
			const db = mapper.db
			await db.query('SET CONSTRAINTS ALL DEFERRED')
			const primaryValue = await mapper.getPrimaryValue(entity, by)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], by as Input.UniqueWhere)]
			}
			if (mapper.deletedEntities.isDeleted(entity.name, primaryValue)) {
				return [new MutationNothingToDo([], NothingToDoReason.alreadyDeleted)]
			}
			const primaryWhere = { [entity.primary]: { eq: primaryValue } }
			const result = await this.delete(mapper, entity, filter ? { and: [primaryWhere, filter] } : primaryWhere)
			if (result.length === 0) {
				return [new MutationNoResultError([])]
			}

			try {
				await db.query('SET CONSTRAINTS ALL IMMEDIATE')
				return [new MutationDeleteOk([], entity, primaryValue)]
			} catch (e) {
				if (e instanceof ForeignKeyViolationError) {
					return [new MutationNoResultError([])]
				}
				throw e
			}
		})
	}

	private async delete(mapper: Mapper, entity: Model.Entity, where: Input.OptionalWhere): Promise<string[]> {
		const db = mapper.db
		const predicate = this.predicateFactory.create(entity, Acl.Operation.delete)
		const inQb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn])
		const inQbWithWhere = this.whereBuilder.build(inQb, entity, this.pathFactory.create([]), {
			and: [where, predicate],
		})
		const orphanRemovals = this.findRelationsWithOrphanRemoval(entity)
		const orphanColumns = orphanRemovals.map(([, rel]) => rel.joiningColumn.columnName)
		const qb = DeleteBuilder.create()
			.from(entity.tableName)
			.where(condition => condition.in(entity.primaryColumn, inQbWithWhere))
			.returning(entity.primaryColumn, ...orphanColumns)
		const result = await qb.execute(db)
		const ids = result.map(it => it[entity.primaryColumn]) as string[]
		for (const id of ids) {
			mapper.deletedEntities.markDeleted(entity.name, id)
		}
		await this.executeOnDelete(mapper, entity, ids)

		for (const [entity, relation] of orphanRemovals) {
			const ids = result.map(it => it[relation.joiningColumn.columnName]).filter(it => it !== null)
			const where: Input.Where = { [entity.primary]: { in: ids } }
			await this.delete(mapper, entity, where)
		}

		return ids as string[]
	}

	private async executeOnDelete(mapper: Mapper, entity: Model.Entity, values: Input.PrimaryValue[]): Promise<void> {
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
					await this.delete(mapper, owningEntity, relationWhere)
					break
				case Model.OnDelete.setNull:
					await this.setNull(mapper.db, owningEntity, relation, relationWhere)
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

	private findOwningRelations(entity: Model.Entity): EntityOwningRelationTuple[] {
		return Object.values(this.schema.entities)
			.map(entity =>
				acceptEveryFieldVisitor<null | EntityOwningRelationTuple>(this.schema, entity, {
					visitColumn: () => null,
					visitManyHasManyInverse: () => null,
					visitManyHasManyOwning: () => null,
					visitOneHasOneInverse: () => null,
					visitOneHasMany: () => null,
					visitOneHasOneOwning: ({}, relation): EntityOwningRelationTuple => [entity, relation],
					visitManyHasOne: ({}, relation): EntityOwningRelationTuple => [entity, relation],
				}),
			)
			.reduce<EntityOwningRelationTuple[]>(
				(acc, value) => [
					...acc,
					...Object.values(value).filter<EntityOwningRelationTuple>(
						(it): it is EntityOwningRelationTuple => it !== null,
					),
				],
				[],
			)
			.filter(([{}, relation]) => relation.target === entity.name)
	}

	private findRelationsWithOrphanRemoval(entity: Model.Entity): OneHasOneOwningRelationTuple[] {
		return Object.values(
			acceptEveryFieldVisitor<OneHasOneOwningRelationTuple | null>(this.schema, entity, {
				visitColumn: () => null,
				visitManyHasManyInverse: () => null,
				visitManyHasManyOwning: () => null,
				visitOneHasOneInverse: () => null,
				visitOneHasMany: () => null,
				visitOneHasOneOwning: ({}, relation, targetEntity) =>
					relation.orphanRemoval ? [targetEntity, relation] : null,
				visitManyHasOne: () => null,
			}),
		).filter((it): it is OneHasOneOwningRelationTuple => it !== null)
	}
}
