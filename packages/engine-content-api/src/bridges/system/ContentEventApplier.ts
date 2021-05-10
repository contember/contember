import { ContentEvent, CreateEvent, DeleteEvent, EventType, UpdateEvent } from '@contember/engine-common'
import { Client, DeleteBuilder, SelectBuilder } from '@contember/database'
import { Acl, Model, Schema } from '@contember/schema'
import { acceptEveryFieldVisitor } from '@contember/schema-utils'
import {
	ConditionBuilder,
	InsertBuilderFactory,
	JoinBuilder,
	JunctionConnectHandler,
	JunctionDisconnectHandler,
	JunctionTableManager,
	MutationCreateOk,
	MutationDeleteOk,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResult,
	MutationResultList,
	MutationResultType,
	MutationUpdateOk,
	NothingToDoReason,
	PathFactory,
	UpdateBuilderFactory,
	WhereBuilder,
} from '../../mapper'
import assert from 'assert'
import { assertNever } from '../../utils'
import { PermissionsByIdentityFactory, PredicateFactory, VariableInjector } from '../../acl'
import { ConstraintHelper } from '@contember/database'

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
	relation: Model.ManyHasManyOwningRelation
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

				visitOneHasOneOwning({}, relation: Model.OneHasOneOwningRelation) {
					entityResult.columns[relation.joiningColumn.columnName] = relation
				}

				visitManyHasManyOwning({}, relation: Model.ManyHasManyOwningRelation) {
					result.junctions[relation.joiningTable.tableName] = {
						entity,
						relation,
					}
				}

				visitColumn({}, column: Model.AnyColumn) {
					entityResult.columns[column.columnName] = column
				}

				visitManyHasManyInverse() {}

				visitOneHasMany() {}

				visitOneHasOneInverse() {}
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
	pathFactory: PathFactory
}
export interface ContentApplyDependenciesFactory {
	create(schema: Schema, roles: string[], identityVariables: Acl.VariablesMap): ContentApplyDependencies
}

export class ContentApplyDependenciesFactoryImpl implements ContentApplyDependenciesFactory {
	create(schema: Schema, roles: string[], identityVariables: Acl.VariablesMap): ContentApplyDependencies {
		const pathFactory = new PathFactory()
		const whereBuilder = new WhereBuilder(
			schema.model,
			new JoinBuilder(schema.model),
			new ConditionBuilder(),
			pathFactory,
		)
		const permissionsFactory = new PermissionsByIdentityFactory()
		const { permissions } = permissionsFactory.createPermissions(schema, {
			projectRoles: roles,
		})

		const predicateFactory = new PredicateFactory(permissions, new VariableInjector(schema.model, identityVariables))
		const insertBuilderFactory = new InsertBuilderFactory(schema.model, whereBuilder, pathFactory)
		const junctionTableManager = new JunctionTableManager(
			schema.model,
			predicateFactory,
			whereBuilder,
			new JunctionConnectHandler(),
			new JunctionDisconnectHandler(),
			pathFactory,
		)
		const updateBuilderFactory = new UpdateBuilderFactory(schema.model, whereBuilder, pathFactory)
		return {
			insertBuilderFactory,
			junctionTableManager,
			predicateFactory,
			updateBuilderFactory,
			whereBuilder,
			pathFactory,
		}
	}
}

export class ContentEventApplier {
	constructor(private readonly contentApplyDependenciesFactory: ContentApplyDependenciesFactory) {}

	public async apply(context: ContentEventApplierContext, events: ContentEvent[]): Promise<ContentEventApplyResult> {
		const constraintHelper = new ConstraintHelper(context.db)
		const tables = buildTables(context.schema.model)
		const deps = {
			...this.contentApplyDependenciesFactory.create(context.schema, context.roles, context.identityVariables),
			db: context.db,
		}
		const applied: ContentEvent[] = []
		let trxId: string | null = null
		let deletedEntities = new Set<string>()
		const getEntityRef = (name: string, id: string) => `${name}#${id}`
		for (const event of events) {
			if (event.transactionId !== trxId) {
				deletedEntities = new Set<string>()
				await constraintHelper.setFkConstraintsImmediate()
				await constraintHelper.setFkConstraintsDeferred()
				trxId = event.transactionId
			}
			let result
			const entityTable = tables.entities[event.tableName]
			const junctionTable = tables.junctions[event.tableName]
			if (entityTable) {
				if (event.type === EventType.delete) {
					deletedEntities.add(getEntityRef(tables.entities[event.tableName].entity.name, event.rowId[0]))
				}
				result = await this.applyEntityEvent(
					{
						...deps,
						entityTable: entityTable,
					},
					event,
				)
			} else if (junctionTable) {
				const primaryRef = getEntityRef(junctionTable.entity.name, event.rowId[0])
				const inverseRef = getEntityRef(junctionTable.relation.target, event.rowId[1])
				if (deletedEntities.has(primaryRef) || deletedEntities.has(inverseRef)) {
					// already deleted using cascade
					continue
				}
				result = await this.applyJunctionEvent(
					{
						...deps,
						junctionTable: junctionTable,
					},
					event,
				)
			} else {
				throw new Error()
			}

			if (result.result !== MutationResultType.ok) {
				return new ContentEventApplyErrorResult(applied, event)
			}
			applied.push(event)
		}
		await constraintHelper.setFkConstraintsImmediate()
		return new ContentEventApplyOkResult(applied)
	}

	private async applyEntityEvent(
		context: {
			db: Client
			whereBuilder: WhereBuilder
			predicateFactory: PredicateFactory
			entityTable: EntityTable
			insertBuilderFactory: InsertBuilderFactory
			updateBuilderFactory: UpdateBuilderFactory
			pathFactory: PathFactory
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
			pathFactory: PathFactory
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
		const inQbWithWhere = context.whereBuilder.build(inQb, entity, context.pathFactory.create([]), {
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
