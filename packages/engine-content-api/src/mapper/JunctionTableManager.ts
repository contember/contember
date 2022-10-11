import { getEntity } from '@contember/schema-utils'
import { PathFactory, WhereBuilder } from './select'
import { PredicateFactory } from '../acl'
import {
	Client,
	ConflictActionType,
	DeleteBuilder,
	InsertBuilder,
	Literal,
	Operator,
	SelectBuilder,
} from '@contember/database'
import { Acl, Input, Model } from '@contember/schema'
import {
	MutationJunctionUpdateOk,
	MutationNoResultError,
	MutationNothingToDo,
	MutationResultList,
	MutationResultType,
	NothingToDoReason,
} from './Result'
import { ImplementationException } from '../exception'
import { AfterJunctionUpdateEvent, BeforeJunctionUpdateEvent } from './EventManager'
import { Mapper } from './Mapper'

type OkResultFactory = () => MutationJunctionUpdateOk

type JunctionMutationResult =
	| MutationJunctionUpdateOk
	| MutationNothingToDo
	| MutationNoResultError

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
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
	): Promise<MutationResultList> {
		const beforeEvent = new BeforeJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'connect')
		await mapper.eventManager.fire(beforeEvent)
		const result = await this.executeJunctionModification(
			mapper.db,
			owningEntity,
			relation,
			owningUnique,
			inverseUnique,
			this.connectJunctionHandler,
		)
		if (result.result !== MutationResultType.noResultError) {
			const afterEvent = new AfterJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'connect', result.result === MutationResultType.ok)
			await mapper.eventManager.fire(afterEvent)
		}
		return [result]
	}

	public async disconnectJunction(
		mapper: Mapper,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
	): Promise<MutationResultList> {
		const beforeEvent = new BeforeJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'connect')
		await mapper.eventManager.fire(beforeEvent)
		const result = await this.executeJunctionModification(
			mapper.db,
			owningEntity,
			relation,
			owningUnique,
			inverseUnique,
			this.disconnectJunctionHandler,
		)
		if (result.result !== MutationResultType.noResultError) {
			const afterEvent = new AfterJunctionUpdateEvent(owningEntity, relation, owningUnique, inverseUnique, 'disconnect', result.result === MutationResultType.ok)
			beforeEvent.afterEvent = afterEvent
			await mapper.eventManager.fire(afterEvent)
		}
		return [result]
	}


	private async executeJunctionModification(
		db: Client,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		owningPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
		handler: JunctionHandler,
	): Promise<JunctionMutationResult> {
		const joiningTable = relation.joiningTable
		const inverseEntity = getEntity(this.schema, relation.target)
		if (inverseEntity.view || owningEntity.view) {
			throw new ImplementationException()
		}

		const owningPredicate = this.predicateFactory.create(owningEntity, Acl.Operation.update, [relation.name])
		let inversePredicate: Input.OptionalWhere = {}
		if (relation.inversedBy) {
			inversePredicate = this.predicateFactory.create(inverseEntity, Acl.Operation.update, [relation.inversedBy])
		}

		const hasNoPredicates = Object.keys(owningPredicate).length === 0 && Object.keys(inversePredicate).length === 0

		const okResultFactory = () =>
			new MutationJunctionUpdateOk([], owningEntity, relation, owningPrimary, inversePrimary)
		if (hasNoPredicates) {
			return await handler.executeSimple({ db, joiningTable, owningPrimary, inversePrimary, okResultFactory })
		} else {
			const owningWhere: Input.OptionalWhere = {
				and: [owningPredicate, { [owningEntity.primary]: { eq: owningPrimary } }],
			}

			const inverseWhere: Input.OptionalWhere = {
				and: [inversePredicate, { [inverseEntity.primary]: { eq: inversePrimary } }],
			}

			const dataCallback: SelectBuilder.Callback = qb => {
				qb = qb
					.select(expr => expr.select(['owning', owningEntity.primaryColumn]), joiningTable.joiningColumn.columnName)
					.select(
						expr => expr.select(['inverse', inverseEntity.primaryColumn]),
						joiningTable.inverseJoiningColumn.columnName,
					)
					.select(expr => expr.raw('true'), 'selected')
					.from(new Literal('(values (null))'), 't')

					.join(owningEntity.tableName, 'owning', condition => condition.raw('true'))
					.join(inverseEntity.tableName, 'inverse', condition => condition.raw('true'))
				qb = this.whereBuilder.build(qb, owningEntity, this.pathFactory.create([], 'owning'), owningWhere)
				qb = this.whereBuilder.build(qb, inverseEntity, this.pathFactory.create([], 'inverse'), inverseWhere)
				return qb
			}

			return await handler.executeComplex({ db, joiningTable, dataCallback, okResultFactory })
		}
	}
}

interface JunctionSimpleExecutionArgs {
	db: Client
	joiningTable: Model.JoiningTable
	owningPrimary: Input.PrimaryValue
	inversePrimary: Input.PrimaryValue
	okResultFactory: OkResultFactory
}

interface JunctionComplexExecutionArgs {
	db: Client
	joiningTable: Model.JoiningTable
	dataCallback: SelectBuilder.Callback
	okResultFactory: OkResultFactory
}

interface JunctionHandler {
	executeSimple(args: JunctionSimpleExecutionArgs): Promise<JunctionMutationResult>

	executeComplex(args: JunctionComplexExecutionArgs): Promise<JunctionMutationResult>
}

export class JunctionConnectHandler implements JunctionHandler {
	async executeSimple({
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

	async executeComplex({
		db,
		joiningTable,
		dataCallback,
		okResultFactory,
	}: JunctionComplexExecutionArgs): Promise<JunctionMutationResult> {
		const insert = InsertBuilder.create()
			.into(joiningTable.tableName)
			.values({
				[joiningTable.joiningColumn.columnName]: expr => expr.select(['data', joiningTable.joiningColumn.columnName]),
				[joiningTable.inverseJoiningColumn.columnName]: expr =>
					expr.select(['data', joiningTable.inverseJoiningColumn.columnName]),
			})
			.returning(new Literal('true as inserted'))
			.from(qb => qb.from('data'))
			.onConflict(ConflictActionType.doNothing)

		const qb = SelectBuilder.create()
			.with('data', dataCallback)
			.with('insert', insert)
			.from(new Literal('(values (null))'), 't')
			.leftJoin('data', 'data', condition => condition.raw('true'))
			.leftJoin('insert', 'insert', condition => condition.raw('true'))
			.select(expr => expr.raw('coalesce(data.selected, false)'), 'selected')
			.select(expr => expr.raw('coalesce(insert.inserted, false)'), 'inserted')

		const result = await qb.getResult(db)
		if (result[0]['selected'] === false) {
			return new MutationNoResultError([])
		}
		if (result[0]['inserted'] === false) {
			return new MutationNothingToDo([], NothingToDoReason.alreadyExists)
		}
		return okResultFactory()
	}
}

export class JunctionDisconnectHandler implements JunctionHandler {
	public async executeSimple({
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
			return new MutationNothingToDo([], NothingToDoReason.alreadyExists)
		}
		return okResultFactory()
	}

	public async executeComplex({
		db,
		joiningTable,
		dataCallback,
		okResultFactory,
	}: JunctionComplexExecutionArgs): Promise<JunctionMutationResult> {
		const deleteQb = DeleteBuilder.create()
			.from(joiningTable.tableName)
			.using('data')
			.where(cond => {
				cond = cond.compareColumns([joiningTable.tableName, joiningTable.joiningColumn.columnName], Operator.eq, [
					'data',
					joiningTable.joiningColumn.columnName,
				])
				cond = cond.compareColumns(
					[joiningTable.tableName, joiningTable.inverseJoiningColumn.columnName],
					Operator.eq,
					['data', joiningTable.inverseJoiningColumn.columnName],
				)
				return cond
			})
			.returning(new Literal('true as deleted'))

		const qb = SelectBuilder.create()
			.with('data', dataCallback)
			.with('delete', deleteQb)
			.from(new Literal('(values (null))'), 't')
			.leftJoin('data', 'data', condition => condition.raw('true'))
			.leftJoin('delete', 'delete', condition => condition.raw('true'))
			.select(expr => expr.raw('coalesce(data.selected, false)'), 'selected')
			.select(expr => expr.raw('coalesce(delete.deleted, false)'), 'deleted')

		const result = await qb.getResult(db)
		if (result[0]['selected'] === false) {
			return new MutationNoResultError([])
		}
		if (result[0]['inserted'] === false) {
			return new MutationNothingToDo([], NothingToDoReason.alreadyExists)
		}
		return okResultFactory()
	}
}
