import { getEntity } from '@contember/schema-utils'
import { PathFactory, WhereBuilder } from './select/index.js'
import { PredicateFactory } from '../acl/index.js'
import { Client, ConflictActionType, DeleteBuilder, InsertBuilder, LockType, Operator, SelectBuilder } from '@contember/database'
import { Acl, Input, Model } from '@contember/schema'
import {
	MutationJunctionUpdateOk,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from './Result.js'
import { ImplementationException } from '../exception.js'
import { AfterJunctionUpdateEvent, BeforeJunctionUpdateEvent } from './EventManager.js'
import { MutationAccess } from './MutationAccess.js'
import { Mapper } from './Mapper.js'

type OkResultFactory = () => MutationJunctionUpdateOk

type JunctionMutationResult =
	| MutationJunctionUpdateOk
	| MutationNothingToDo
	| MutationNoResultError

interface JunctionEndpoint {
	entity: Model.Entity
	primary: Input.PrimaryValue
}

export class JunctionTableManager {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly connectJunctionHandler: JunctionConnectHandler,
		private readonly disconnectJunctionHandler: JunctionDisconnectHandler,
		private readonly pathFactory: PathFactory,
	) {}

	public async connectJunction(
		mapper: Mapper,
		owningAccess: MutationAccess,
		inverseAccess: MutationAccess,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
		owningOperation: Acl.Operation.create | Acl.Operation.update,
		inverseOperation: Acl.Operation.create | Acl.Operation.update,
	): Promise<MutationResultList> {
		const result = await this.executeJunctionModification(
			mapper.db,
			owningAccess,
			inverseAccess,
			owningEntity,
			relation,
			owningUnique,
			inverseUnique,
			owningOperation,
			inverseOperation,
			this.connectJunctionHandler,
		)
		if (result.result !== MutationResultType.noResultError) {
			const beforeEvent = new BeforeJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'connect')
			const afterEvent = new AfterJunctionUpdateEvent(
				owningEntity,
				relation,
				owningUnique,
				inverseUnique,
				'connect',
				result.result === MutationResultType.ok,
			)
			beforeEvent.afterEvent = afterEvent
			mapper.eventManager.deferUntilCommit(beforeEvent)
			mapper.eventManager.deferUntilCommit(afterEvent)
		}
		return [result]
	}

	public async disconnectJunction(
		mapper: Mapper,
		owningAccess: MutationAccess,
		inverseAccess: MutationAccess,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
	): Promise<MutationResultList> {
		const result = await this.executeJunctionModification(
			mapper.db,
			owningAccess,
			inverseAccess,
			owningEntity,
			relation,
			owningUnique,
			inverseUnique,
			Acl.Operation.update,
			Acl.Operation.update,
			this.disconnectJunctionHandler,
		)
		if (result.result !== MutationResultType.noResultError) {
			const beforeEvent = new BeforeJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'disconnect')
			const afterEvent = new AfterJunctionUpdateEvent(
				owningEntity,
				relation,
				owningUnique,
				inverseUnique,
				'disconnect',
				result.result === MutationResultType.ok,
			)
			beforeEvent.afterEvent = afterEvent
			mapper.eventManager.deferUntilCommit(beforeEvent)
			mapper.eventManager.deferUntilCommit(afterEvent)
		}
		return [result]
	}

	private async executeJunctionModification(
		db: Client,
		owningAccess: MutationAccess,
		inverseAccess: MutationAccess,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
		owningOperation: Acl.Operation.create | Acl.Operation.update,
		inverseOperation: Acl.Operation.create | Acl.Operation.update,
		handler: JunctionHandler,
	): Promise<JunctionMutationResult> {
		const joiningTable = relation.joiningTable
		const inverseEntity = getEntity(this.schema, relation.target)
		if (inverseEntity.view || owningEntity.view) {
			throw new ImplementationException()
		}

		const owningPredicate = this.predicateFactory.create(
			owningEntity,
			owningOperation,
			[relation.name],
			owningAccess.predicateContext,
		)
		let inversePredicate: Input.OptionalWhere = {}
		if (relation.inversedBy) {
			inversePredicate = this.predicateFactory.create(
				inverseEntity,
				inverseOperation,
				[relation.inversedBy],
				inverseAccess.predicateContext,
			)
		}

		const okResultFactory = () => new MutationJunctionUpdateOk([], owningEntity, relation, owningPrimary, inversePrimary)
		const endpointsExist = await this.lockEndpoints(db, [
			{ entity: owningEntity, primary: owningPrimary },
			{ entity: inverseEntity, primary: inversePrimary },
		])
		if (!endpointsExist) {
			return new MutationNoResultError([])
		}

		const preOwningPredicate = owningOperation === Acl.Operation.update ? owningPredicate : {}
		const preInversePredicate = inverseOperation === Acl.Operation.update ? inversePredicate : {}
		if (
			!await this.checkEndpointAuthorization(
				db,
				owningEntity,
				inverseEntity,
				owningPrimary,
				inversePrimary,
				preOwningPredicate,
				preInversePredicate,
			)
		) {
			return new MutationNoResultError([])
		}

		const result = await handler.execute({ db, joiningTable, owningPrimary, inversePrimary, okResultFactory })
		if (result.result === MutationResultType.noResultError) {
			return result
		}

		return await this.checkEndpointAuthorization(
				db,
				owningEntity,
				inverseEntity,
				owningPrimary,
				inversePrimary,
				owningPredicate,
				inversePredicate,
			)
			? result
			: new MutationNoResultError([])
	}

	private async lockEndpoints(db: Client, endpoints: readonly JunctionEndpoint[]): Promise<boolean> {
		const lockGroups = new Map<string, JunctionEndpoint[]>()
		for (const endpoint of endpoints) {
			const key = `${endpoint.entity.tableName}\u0000${endpoint.entity.primaryColumn}`
			const group = lockGroups.get(key)
			if (group === undefined) {
				lockGroups.set(key, [endpoint])
			} else if (!group.some(it => it.primary === endpoint.primary)) {
				group.push(endpoint)
			}
		}

		for (const [, group] of [...lockGroups].sort(([left], [right]) => left.localeCompare(right))) {
			const entity = group[0].entity
			const primaries = group.map(it => it.primary).sort((left, right) => String(left).localeCompare(String(right)))
			const path = this.pathFactory.create([])
			const lockedRows = await SelectBuilder.create<{ primary: Input.PrimaryValue }>()
				.select([path.alias, entity.primaryColumn], 'primary')
				.from(entity.tableName, path.alias)
				.where(condition => condition.in([path.alias, entity.primaryColumn], primaries))
				.orderBy([path.alias, entity.primaryColumn])
				.lock(LockType.forUpdate, undefined, [path.alias])
				.getResult(db)
			if (lockedRows.length !== primaries.length) {
				return false
			}
		}
		return true
	}

	private async checkEndpointAuthorization(
		db: Client,
		owningEntity: Model.Entity,
		inverseEntity: Model.Entity,
		owningPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
		owningPredicate: Input.OptionalWhere,
		inversePredicate: Input.OptionalWhere,
	): Promise<boolean> {
		if (Object.keys(owningPredicate).length === 0 && Object.keys(inversePredicate).length === 0) {
			return true
		}

		let qb = SelectBuilder.create().select(expr => expr.raw('true'), 'authorized')
			.from(owningEntity.tableName, 'owning')
			.join(inverseEntity.tableName, 'inverse', condition => condition.raw('true'))
		qb = this.whereBuilder.build(qb, owningEntity, this.pathFactory.create([], 'owning'), {
			and: [owningPredicate, { [owningEntity.primary]: { eq: owningPrimary } }],
		})
		qb = this.whereBuilder.build(qb, inverseEntity, this.pathFactory.create([], 'inverse'), {
			and: [inversePredicate, { [inverseEntity.primary]: { eq: inversePrimary } }],
		})
		return (await qb.getResult(db)).length === 1
	}
}

interface JunctionSimpleExecutionArgs {
	db: Client
	joiningTable: Model.JoiningTable
	owningPrimary: Input.PrimaryValue
	inversePrimary: Input.PrimaryValue
	okResultFactory: OkResultFactory
}

interface JunctionHandler {
	execute(args: JunctionSimpleExecutionArgs): Promise<JunctionMutationResult>
}

export class JunctionConnectHandler implements JunctionHandler {
	async execute({
		db,
		joiningTable,
		owningPrimary,
		inversePrimary,
		okResultFactory,
	}: JunctionSimpleExecutionArgs): Promise<JunctionMutationResult> {
		const result = await InsertBuilder.create()
			.into(joiningTable.tableName)
			.values({
				[joiningTable.joiningColumn.columnName]: expr => expr.selectValue(owningPrimary),
				[joiningTable.inverseJoiningColumn.columnName]: expr => expr.selectValue(inversePrimary),
			})
			.onConflict(ConflictActionType.doNothing)
			.execute(db)
		if (result === 0) {
			return new MutationNothingToDo([], NothingToDoReason.alreadyExists)
		}
		return okResultFactory()
	}
}

export class JunctionDisconnectHandler implements JunctionHandler {
	public async execute({
		db,
		joiningTable,
		owningPrimary,
		inversePrimary,
		okResultFactory,
	}: JunctionSimpleExecutionArgs): Promise<JunctionMutationResult> {
		const qb = DeleteBuilder.create()
			.from(joiningTable.tableName)
			.where(cond => cond.compare(joiningTable.joiningColumn.columnName, Operator.eq, owningPrimary))
			.where(cond => cond.compare(joiningTable.inverseJoiningColumn.columnName, Operator.eq, inversePrimary))

		const result = await qb.execute(db)
		if (result === 0) {
			return new MutationNothingToDo([], NothingToDoReason.alreadyDeleted)
		}
		return okResultFactory()
	}
}
