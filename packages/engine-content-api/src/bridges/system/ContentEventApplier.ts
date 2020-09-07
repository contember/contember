import { ContentEvent, CreateEvent, DeleteEvent, EventType, UpdateEvent } from '@contember/engine-common'
import { Client, DeleteBuilder, SelectBuilder } from '@contember/database'
import { Acl, Model, Schema } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import JunctionTableManager from '../../sql/JunctionTableManager'
import assert from 'assert'
import { assertNever } from '../../utils'
import PredicateFactory from '../../acl/PredicateFactory'
import WhereBuilder from '../../sql/select/WhereBuilder'
import Path from '../../sql/select/Path'
import UpdateBuilderFactory from '../../sql/update/UpdateBuilderFactory'
import InsertBuilderFactory from '../../sql/insert/InsertBuilderFactory'
import JoinBuilder from '../../sql/select/JoinBuilder'
import ConditionBuilder from '../../sql/select/ConditionBuilder'
import { PermissionsByIdentityFactory } from '../../acl'
import VariableInjector from '../../acl/VariableInjector'
import {
	MutationCreateOk,
	MutationDeleteOk,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResult,
	MutationResultList,
	MutationResultType,
	MutationUpdateOk,
	NothingToDoReason,
} from '../../sql/Result'

export interface ContentEventApplierContext {
	db: Client
	schema: Schema
	identityVariables: Acl.VariablesMap
	roles: string[]
}

export class ContentEventApplyOkResult {
	public readonly ok = true as const

	constructor(public readonly appliedEvents: ContentEvent[]) {}
}

export class ContentEventApplyErrorResult {
	public readonly ok = false as const

	constructor(public readonly appliedEvents: ContentEvent[], public readonly failedEvent: ContentEvent) {}
}
export type ContentEventApplyResult = ContentEventApplyOkResult | ContentEventApplyErrorResult

type EntityTable = {
	entity: Model.Entity
	columns: Record<string, Model.AnyField>
}
type EntityTables = Record<string, EntityTable>

type JunctionTable = {
	entity: Model.Entity
	relation: Model.ManyHasManyOwnerRelation
}
type JunctionTables = Record<string, JunctionTable>

type Tables = {
	entities: EntityTables
	junctions: JunctionTables
}

const buildTables = (schema: Model.Schema): Tables => {
	const result: Tables = {
		entities: {},
		junctions: {},
	}
	for (let entity of Object.values(schema.entities)) {
		const entityResult: EntityTable = {
			entity,
			columns: {},
		}
		result.entities[entity.tableName] = entityResult
		acceptEveryFieldVisitor(
			schema,
			entity,
			new (class implements Model.RelationByTypeVisitor<void> {
				visitManyHasOne({}, relation: Model.ManyHasOneRelation) {
					entityResult.columns[relation.joiningColumn.columnName] = relation
				}

				visitOneHasOneOwner({}, relation: Model.OneHasOneOwnerRelation) {
					entityResult.columns[relation.joiningColumn.columnName] = relation
				}

				visitManyHasManyOwner({}, relation: Model.ManyHasManyOwnerRelation) {
					result.junctions[relation.joiningTable.tableName] = {
						entity,
						relation,
					}
				}

				visitColumn({}, column: Model.AnyColumn) {
					entityResult.columns[column.columnName] = column
				}

				visitManyHasManyInversed() {}

				visitOneHasMany() {}

				visitOneHasOneInversed() {}
			})(),
		)
	}
	return result
}
export interface ContentApplyDependencies {
	whereBuilder: WhereBuilder
	predicateFactory: PredicateFactory
	junctionTableManager: JunctionTableManager
	insertBuilderFactory: InsertBuilderFactory
	updateBuilderFactory: UpdateBuilderFactory
}
export interface ContentApplyDependenciesFactory {
	create(schema: Schema, roles: string[], identityVariables: Acl.VariablesMap): ContentApplyDependencies
}

export class ContentApplyDependenciesFactoryImpl implements ContentApplyDependenciesFactory {
	create(schema: Schema, roles: string[], identityVariables: Acl.VariablesMap): ContentApplyDependencies {
		const whereBuilder = new WhereBuilder(schema.model, new JoinBuilder(schema.model), new ConditionBuilder())
		const permissionsFactory = new PermissionsByIdentityFactory()
		const { permissions } = permissionsFactory.createPermissions(schema, {
			projectRoles: roles,
		})

		const predicateFactory = new PredicateFactory(permissions, new VariableInjector(schema.model, identityVariables))
		const insertBuilderFactory = new InsertBuilderFactory(schema.model, whereBuilder)
		const junctionTableManager = new JunctionTableManager(
			schema.model,
			predicateFactory,
			whereBuilder,
			new JunctionTableManager.JunctionConnectHandler(),
			new JunctionTableManager.JunctionDisconnectHandler(),
		)
		const updateBuilderFactory = new UpdateBuilderFactory(schema.model, whereBuilder)
		return {
			insertBuilderFactory,
			junctionTableManager,
			predicateFactory,
			updateBuilderFactory,
			whereBuilder,
		}
	}
}

export class ContentEventApplier {
	constructor(private readonly contentApplyDependenciesFactory: ContentApplyDependenciesFactory) {}

	public async apply(context: ContentEventApplierContext, events: ContentEvent[]): Promise<ContentEventApplyResult> {
		const tables = buildTables(context.schema.model)
		const deps = this.contentApplyDependenciesFactory.create(context.schema, context.roles, context.identityVariables)
		const applied: ContentEvent[] = []
		for (const event of events) {
			const result = await this.applyEvent(
				{
					tables,
					db: context.db,
					...deps,
				},
				event,
			)
			if (result.result !== MutationResultType.ok) {
				return new ContentEventApplyErrorResult(applied, event)
			}
			applied.push(event)
		}
		return new ContentEventApplyOkResult(applied)
	}

	private async applyEvent(
		context: {
			db: Client
			tables: Tables
			whereBuilder: WhereBuilder
			predicateFactory: PredicateFactory
			junctionTableManager: JunctionTableManager
			insertBuilderFactory: InsertBuilderFactory
			updateBuilderFactory: UpdateBuilderFactory
		},
		event: ContentEvent,
	): Promise<MutationResult> {
		if (context.tables.entities[event.tableName]) {
			return await this.applyEntityEvent(
				{
					...context,
					entityTable: context.tables.entities[event.tableName],
				},
				event,
			)
		} else if (context.tables.junctions[event.tableName]) {
			return await this.applyJunctionEvent(
				{
					...context,
					junctionTable: context.tables.junctions[event.tableName],
				},
				event,
			)
		} else {
			throw new Error()
		}
	}

	private async applyEntityEvent(
		context: {
			db: Client
			whereBuilder: WhereBuilder
			predicateFactory: PredicateFactory
			entityTable: EntityTable
			insertBuilderFactory: InsertBuilderFactory
			updateBuilderFactory: UpdateBuilderFactory
		},
		event: ContentEvent,
	): Promise<MutationResult> {
		switch (event.type) {
			case EventType.create:
				return await this.applyEntityCreate(context, event)
			case EventType.delete:
				return await this.applyEntityDelete(context, event)
			case EventType.update:
				return await this.applyEntityUpdate(context, event)
			default:
				assertNever(event)
		}
	}

	private async applyEntityCreate(
		context: {
			db: Client
			predicateFactory: PredicateFactory
			entityTable: EntityTable
			insertBuilderFactory: InsertBuilderFactory
		},
		event: CreateEvent,
	): Promise<MutationResult> {
		assert.equal(event.rowId.length, 1)
		const entity = context.entityTable.entity
		const affectedField = Object.keys(event.values).map(it => context.entityTable.columns[it].name)
		const predicate = context.predicateFactory.create(entity, Acl.Operation.create, affectedField)
		const insertBuilder = context.insertBuilderFactory.create(entity)
		insertBuilder.addWhere(predicate)
		insertBuilder.addFieldValue(entity.primaryColumn, event.rowId[0])
		for (const [col, value] of Object.entries(event.values)) {
			insertBuilder.addFieldValue(context.entityTable.columns[col].name, value)
		}
		const result = await insertBuilder.execute(context.db)
		if (result.primaryValue === null) {
			return new MutationNoResultError([])
		}
		assert.equal(result.primaryValue, event.rowId[0])
		return new MutationCreateOk([], entity, result.primaryValue, {}, event.values)
	}

	private async applyEntityUpdate(
		context: {
			db: Client
			predicateFactory: PredicateFactory
			updateBuilderFactory: UpdateBuilderFactory
			entityTable: EntityTable
		},
		event: UpdateEvent,
	): Promise<MutationResult> {
		assert.equal(event.rowId.length, 1)
		const entity = context.entityTable.entity
		const primary = event.rowId[0]
		const updateBuilder = context.updateBuilderFactory.create(entity, {
			[entity.primary]: { eq: primary },
		})
		const affectedField = Object.keys(event.values).map(it => context.entityTable.columns[it].name)
		const predicate = context.predicateFactory.create(entity, Acl.Operation.update, affectedField)
		updateBuilder.addOldWhere(predicate)
		updateBuilder.addNewWhere(predicate)
		for (const [col, value] of Object.entries(event.values)) {
			updateBuilder.addFieldValue(context.entityTable.columns[col].name, value)
		}
		const result = await updateBuilder.execute(context.db)
		if (!result.executed) {
			return new MutationNothingToDo([], NothingToDoReason.noData)
		}
		if (result.affectedRows !== 1) {
			return new MutationNoResultError([])
		}
		return new MutationUpdateOk([], entity, primary, {}, event.values)
	}

	private async applyEntityDelete(
		context: {
			db: Client
			predicateFactory: PredicateFactory
			whereBuilder: WhereBuilder
			entityTable: EntityTable
		},
		event: DeleteEvent,
	): Promise<MutationResult> {
		assert.equal(event.rowId.length, 1)
		const entity = context.entityTable.entity
		const predicate = context.predicateFactory.create(entity, Acl.Operation.delete)
		const inQb = SelectBuilder.create() //
			.from(entity.tableName, 'root_')
			.select(['root_', entity.primaryColumn])
		const primary = event.rowId[0]
		const inQbWithWhere = context.whereBuilder.build(inQb, entity, new Path([]), {
			and: [
				{
					[entity.primary]: { eq: primary },
				},
				predicate,
			],
		})

		const qb = DeleteBuilder.create()
			.from(entity.tableName)
			.where(condition => condition.in(entity.primaryColumn, inQbWithWhere))
		const result = await qb.execute(context.db)
		if (result === 0) {
			return new MutationNoResultError([])
		}
		return new MutationDeleteOk([], entity, primary)
	}

	private async applyJunctionEvent(
		context: {
			db: Client
			junctionTableManager: JunctionTableManager
			junctionTable: JunctionTable
		},
		event: ContentEvent,
	): Promise<MutationResult> {
		const result: MutationResultList = await (() => {
			switch (event.type) {
				case EventType.create:
					return this.applyJunctionConnect(context, event)
				case EventType.delete:
					return this.applyJunctionDisconnect(context, event)
				case EventType.update:
					throw new Error()
				default:
					return assertNever(event)
			}
		})()
		assert.equal(result.length, 1)
		return result[0]
	}

	private async applyJunctionConnect(
		context: {
			db: Client
			junctionTableManager: JunctionTableManager
			junctionTable: JunctionTable
		},
		event: CreateEvent,
	): Promise<MutationResultList> {
		assert.equal(event.rowId.length, 2)
		return await context.junctionTableManager.connectJunction(
			context.db,
			context.junctionTable.entity,
			context.junctionTable.relation,
			event.rowId[0],
			event.rowId[1],
		)
	}

	private async applyJunctionDisconnect(
		context: {
			db: Client
			junctionTableManager: JunctionTableManager
			junctionTable: JunctionTable
		},
		event: DeleteEvent,
	): Promise<MutationResultList> {
		assert.equal(event.rowId.length, 2)
		return await context.junctionTableManager.disconnectJunction(
			context.db,
			context.junctionTable.entity,
			context.junctionTable.relation,
			event.rowId[0],
			event.rowId[1],
		)
	}
}
