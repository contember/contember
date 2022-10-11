import { Acl, Input, Model } from '@contember/schema'
import { assertNever } from '../../utils'
import { Client, DeleteBuilder, Literal, SelectBuilder } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { PredicateFactory } from '../../acl'
import { UpdateBuilderFactory } from '../update'
import {
	ConstraintType,
	MutationConstraintViolationError,
	MutationDeleteOk,
	MutationEntryNotFoundError,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	MutationUpdateOk,
	NothingToDoReason,
} from '../Result'
import { Mapper } from '../Mapper'
import { CheckedPrimary } from '../CheckedPrimary'
import { DeleteState } from './DeleteState'
import {
	EntityReferenceRow,
	findOwningRelations,
	findRelationsWithOrphanRemoval,
	formatConstraintViolationMessage,
	OneHasOneOwningRelationTuple,
} from './helpers'
import { getEntity } from '@contember/schema-utils'
import { AfterUpdateEvent, BeforeDeleteEvent, BeforeUpdateEvent, EventManager } from '../EventManager'
import { ImplementationException } from '../../exception'

type DeleteQueue = [entity: Model.Entity, ids: Input.PrimaryValue[]][]

type DeleteInfoRow = { allowed: boolean; id: Input.PrimaryValue } & { [K in `_${string}`]: Input.PrimaryValue }

export class DeleteExecutor {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly updateBuilderFactory: UpdateBuilderFactory,
		private readonly pathFactory: PathFactory,
	) {
	}

	public async execute(
		mapper: Mapper,
		entity: Model.Entity,
		by: Input.UniqueWhere | CheckedPrimary,
		filter?: Input.OptionalWhere,
	): Promise<MutationResultList> {
		return mapper.mutex.execute(async () => {
			const primaryValue = await mapper.getPrimaryValue(entity, by)
			if (!primaryValue) {
				return [new MutationEntryNotFoundError([], by as Input.UniqueWhere)]
			}

			if (mapper.deletedEntities.isDeleted(entity.name, primaryValue)) {
				return [new MutationNothingToDo([], NothingToDoReason.alreadyDeleted)]
			}

			const primaryWhere = { [entity.primary]: { eq: primaryValue } }
			const where = filter ? { and: [primaryWhere, filter] } : primaryWhere
			const state = new DeleteState(mapper.deletedEntities)
			const deletePrimary = await this.collectDeleteInfo(state, mapper, entity, where)

			const deleteQueue: DeleteQueue = [[entity, deletePrimary]]
			await this.collectOrphanRemovals(state, mapper, deleteQueue)
			if (!state.isOk()) {
				return state.getResult()
			}
			const result = state.getResult()
			const entryToEventMap = new Map<MutationUpdateOk, BeforeUpdateEvent>()
			for (const entry of result) {
				if (entry instanceof MutationDeleteOk) {
					await mapper.eventManager.fire(new BeforeDeleteEvent(entry.entity, entry.primary))
				} else if (entry instanceof MutationUpdateOk) {
					const beforeUpdateEvent = new BeforeUpdateEvent(entry.entity, [{
						columnName: Object.keys(entry.values)[0],
						fieldName: Object.keys(entry.input)[0],
						columnType: 'text',
						resolvedValue: null,
						value: Promise.resolve(null),
					}], entry.primary)
					entryToEventMap.set(entry, beforeUpdateEvent)
					await mapper.eventManager.fire(beforeUpdateEvent)
				}
			}

			await this.executeDeletes(deleteQueue, mapper.db)

			for (const entry of result) {
				if (entry instanceof MutationUpdateOk) {
					const beforeEvent = entryToEventMap.get(entry)
					if (!beforeEvent) {
						throw new ImplementationException()
					}
					const data = [{
						columnName: Object.keys(entry.values)[0],
						fieldName: Object.keys(entry.input)[0],
						columnType: 'text',
						resolvedValue: null,
						value: Promise.resolve(null),
						old: Object.values(entry.oldValues ?? {})[0],
					}]
					const afterEvent = new AfterUpdateEvent(entry.entity, data, entry.primary)
					beforeEvent.afterEvent = afterEvent
					await mapper.eventManager.fire(afterEvent)
				}
			}

			state.confirmDeleted()

			return state.getResult()
		})
	}

	private async executeDeletes(deleteQueue: DeleteQueue, db: Client): Promise<void> {
		for (const [entity, ids] of deleteQueue) {
			if (ids.length === 0) {
				continue
			}
			await DeleteBuilder.create()
				.from(entity.tableName)
				.where(expr => expr.in(entity.primaryColumn, ids))
				.execute(db)
		}
	}

	private async collectDeleteInfo(
		state: DeleteState,
		mapper: Mapper,
		entity: Model.Entity,
		where: Input.OptionalWhere,
	): Promise<Input.PrimaryValue[]> {
		const predicate = this.predicateFactory.createDeletePredicate(entity)
		const orphanRemovals = findRelationsWithOrphanRemoval(this.schema, entity)

		const qb = SelectBuilder.create<DeleteInfoRow>()
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn], 'id')

		const qbWithOrphanColumns = this.qbOrphanColumns(qb, orphanRemovals)
		const qbWithAllowedFlag = this.qbWithAllowed(entity, predicate, qbWithOrphanColumns)
		const qbWithWhere = this.whereBuilder.build(qbWithAllowedFlag, entity, this.pathFactory.create([]), where)

		const fullResult = await qbWithWhere.getResult(mapper.db)

		if (fullResult.length === 0) {
			state.pushFailResult(new MutationNoResultError([]))
			return []
		}

		const result = this.filterPlannedForDelete(state, entity, fullResult)

		const disallowed: Input.PrimaryValue[] = result.filter(it => !it.allowed).map(it => it.id)
		if (disallowed.length) {
			state.pushFailResult(new MutationEntryNotFoundError([], { [entity.primary]: { in: disallowed } }))
			return []
		}

		return await this.processDeleteResult(state, mapper, entity, result, orphanRemovals)
	}


	private async collectOnDeleteInfo(state: DeleteState, mapper: Mapper, entity: Model.Entity, values: Input.PrimaryValue[]): Promise<void> {
		if (values.length === 0) {
			return
		}
		const owningRelations = findOwningRelations(this.schema, entity)
		for (const [owningEntity, relation] of owningRelations) {
			if (relation.joiningColumn.onDelete === Model.OnDelete.restrict) {
				await this.collectRestrictResult(state, mapper, owningEntity, relation, values)
			} else if (relation.joiningColumn.onDelete === Model.OnDelete.cascade) {
				await this.collectCascadeResult(state, mapper, owningEntity, relation, values)
			} else if (relation.joiningColumn.onDelete === Model.OnDelete.setNull) {
				await this.collectSetNullResult(state, mapper, owningEntity, relation, values)
			} else {
				assertNever(relation.joiningColumn.onDelete)
			}
		}
	}

	private async collectCascadeResult(
		state: DeleteState,
		mapper: Mapper,
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation | Model.OneHasOneOwningRelation,
		values: Input.PrimaryValue[],
	): Promise<void> {
		const predicate = this.predicateFactory.createDeletePredicate(entity)
		const orphanRemovals = findRelationsWithOrphanRemoval(this.schema, entity)

		const qb = this.createFetchByIdQueryBuilder(entity, relation, values)
		const qbWithOrphanColumns = this.qbOrphanColumns(qb, orphanRemovals)
		const qbWithAllowed = this.qbWithAllowed(entity, predicate, qbWithOrphanColumns)

		const result = this.filterPlannedForDelete(state, entity, await qbWithAllowed.getResult(mapper.db))

		const disallowed = result.filter(it => !it.allowed)

		if (disallowed.length > 0) {
			const message = formatConstraintViolationMessage(disallowed, entity, relation)
				+ ' OnDelete behaviour of this relation is set to "cascade". This is possibly caused by ACL denial.'

			state.pushFailResult(new MutationConstraintViolationError([], ConstraintType.foreignKey, message))
			return
		}

		this.processDeleteResult(state, mapper, entity, result, orphanRemovals)
	}


	private async collectSetNullResult(
		state: DeleteState,
		mapper: Mapper,
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation | Model.OneHasOneOwningRelation,
		values: Input.PrimaryValue[],
	): Promise<void> {
		const predicate = this.predicateFactory.create(entity, Acl.Operation.update, [relation.name])

		const qb = this.createFetchByIdQueryBuilder(entity, relation, values)
		const qbWithAllowed = this.qbWithAllowed(entity, predicate, qb)

		const result = this.filterPlannedForDelete(state, entity, await qbWithAllowed.getResult(mapper.db))

		const disallowed = result.filter(it => !it.allowed)

		if (disallowed.length === 0) {
			const input = { [relation.name]: { disconnect: true } }
			const values = { [relation.joiningColumn.columnName]: null }

			state.pushOkResult(result.map(it => new MutationUpdateOk([], entity, it.id, input, values, { [relation.joiningColumn.columnName]: it.ref })))
			return
		}

		const message = formatConstraintViolationMessage(disallowed, entity, relation)
			+ ' OnDelete behaviour of this relation is set to "set null". This is possibly caused by ACL denial.'
		state.pushFailResult(new MutationConstraintViolationError([], ConstraintType.foreignKey, message))
	}


	private async collectRestrictResult(
		state: DeleteState,
		mapper: Mapper,
		entity: Model.Entity,
		relation: Model.ManyHasOneRelation | Model.OneHasOneOwningRelation,
		values: Input.PrimaryValue[],
	): Promise<void> {
		if (mapper.constraintHelper.areFkConstraintsDeferred()) {
			return
		}
		const qb = this.createFetchByIdQueryBuilder(entity, relation, values)
		const result = this.filterPlannedForDelete(state, entity, await qb.getResult(mapper.db))

		if (result.length === 0) {
			return
		}

		const message = formatConstraintViolationMessage(result, entity, relation)
			+ ' OnDelete behaviour of this relation is set to "restrict". You might consider changing it to "setNull" or "cascade".'

		state.pushFailResult(new MutationConstraintViolationError([], ConstraintType.foreignKey, message))
	}

	private async collectOrphanRemovals(state: DeleteState, mapper: Mapper, deleteQueue: DeleteQueue) {
		do {
			if (!state.isOk()) {
				return
			}

			const orphanRemoval = state.fetchOrphanRemovals()
			if (orphanRemoval === null) {
				break
			}

			const entity = getEntity(this.schema, orphanRemoval[0])
			const orphanResult = await this.collectDeleteInfo(state, mapper, entity, { [entity.primary]: { in: orphanRemoval[1] } })
			deleteQueue.push([entity, orphanResult])

		} while (true)
	}

	private qbWithAllowed<R>(entity: Model.Entity, predicate: Input.OptionalWhere, selectQb: SelectBuilder<R>): SelectBuilder<R & { allowed: boolean }> {
		return this.whereBuilder.buildAdvanced<R & { allowed: boolean }>(entity, this.pathFactory.create([]), predicate, cb => {
			const qb = selectQb.select(expr => expr.selectCondition(cb), 'allowed')
			return (qb === selectQb ? qb.select(new Literal('true'), 'allowed') : qb) as SelectBuilder<R & { allowed: boolean }>
		})
	}

	private qbOrphanColumns<R>(qb: SelectBuilder<R>, orphanRemovals: OneHasOneOwningRelationTuple[]): SelectBuilder<R> {
		const orphanColumns = orphanRemovals.map(([, rel]) => rel.joiningColumn.columnName)
		return orphanColumns.reduce((qb, column) => qb.select(['root_', column], `_${column}`), qb)
	}

	private createFetchByIdQueryBuilder(entity: Model.Entity, relation: Model.ManyHasOneRelation | Model.OneHasOneOwningRelation, values: Input.PrimaryValue[]) {
		return SelectBuilder.create<EntityReferenceRow>()
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn], 'id')
			.select(['root_', relation.joiningColumn.columnName], 'ref')
			.where(expr => expr.in(relation.joiningColumn.columnName, values))
	}

	private filterPlannedForDelete<R extends {id: Input.PrimaryValue}>(state: DeleteState, entity: Model.Entity, values: R[]): R[] {
		return values.filter(it => !state.isPlannedDelete(entity.name, it.id))
	}


	private async processDeleteResult(
		state: DeleteState,
		mapper: Mapper,
		entity: Model.Entity,
		result: DeleteInfoRow[],
		orphanRemovals: OneHasOneOwningRelationTuple[],
	): Promise<Input.PrimaryValue[]> {
		const ids = result.map(it => it.id)
		state.markPlannedDelete(entity.name, ids)
		state.pushOkResult(ids.map(id => new MutationDeleteOk([], entity, id)))

		await this.collectOnDeleteInfo(state, mapper, entity, ids)

		for (const [entity, relation] of orphanRemovals) {
			const ids = result.map(it => it[`_${relation.joiningColumn.columnName}`]).filter(it => it !== null)
			if (ids.length) {
				state.addOrphanRemoval(entity.name, ids)
			}
		}
		return ids
	}
}
