import { getEntity } from '@contember/schema-utils'
import { PathFactory } from './select/Path'
import WhereBuilder from './select/WhereBuilder'
import PredicateFactory from '../acl/PredicateFactory'
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
	MutationResult,
	MutationResultList,
	NothingToDoReason,
} from './Result'

type OkResultFactory = () => MutationJunctionUpdateOk

class JunctionTableManager {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly connectJunctionHandler: JunctionTableManager.JunctionConnectHandler,
		private readonly disconnectJunctionHandler: JunctionTableManager.JunctionDisconnectHandler,
		private readonly pathFactory: PathFactory,
	) {}

	public async connectJunction(
		db: Client,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return [
			await this.executeJunctionModification(
				db,
				owningEntity,
				relation,
				ownerUnique,
				inverseUnique,
				this.connectJunctionHandler,
			),
		]
	}

	public async disconnectJunction(
		db: Client,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.PrimaryValue,
		inverseUnique: Input.PrimaryValue,
	): Promise<MutationResultList> {
		return [
			await this.executeJunctionModification(
				db,
				owningEntity,
				relation,
				ownerUnique,
				inverseUnique,
				this.disconnectJunctionHandler,
			),
		]
	}

	private async executeJunctionModification(
		db: Client,
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerPrimary: Input.PrimaryValue,
		inversePrimary: Input.PrimaryValue,
		handler: JunctionTableManager.JunctionHandler,
	): Promise<MutationResult> {
		const joiningTable = relation.joiningTable
		const inverseEntity = getEntity(this.schema, relation.target)

		const owningPredicate = this.predicateFactory.create(owningEntity, Acl.Operation.update, [relation.name])
		let inversePredicate: Input.Where = {}
		if (relation.inversedBy) {
			inversePredicate = this.predicateFactory.create(inverseEntity, Acl.Operation.update, [relation.inversedBy])
		}

		const hasNoPredicates = Object.keys(owningPredicate).length === 0 && Object.keys(inversePredicate).length === 0

		const okResultFactory = () => new MutationJunctionUpdateOk([], owningEntity, relation, ownerPrimary, inversePrimary)
		if (hasNoPredicates) {
			return await handler.executeSimple({ db, joiningTable, ownerPrimary, inversePrimary, okResultFactory })
		} else {
			const ownerWhere: Input.Where = {
				and: [owningPredicate, { [owningEntity.primary]: { eq: ownerPrimary } }],
			}

			const inverseWhere: Input.Where = {
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
				qb = this.whereBuilder.build(qb, owningEntity, this.pathFactory.create([], 'owning'), ownerWhere)
				qb = this.whereBuilder.build(qb, inverseEntity, this.pathFactory.create([], 'inverse'), inverseWhere)
				return qb
			}

			return await handler.executeComplex({ db, joiningTable, dataCallback, okResultFactory })
		}
	}
}

namespace JunctionTableManager {
	interface JunctionSimpleExecutionArgs {
		db: Client
		joiningTable: Model.JoiningTable
		ownerPrimary: Input.PrimaryValue
		inversePrimary: Input.PrimaryValue
		okResultFactory: OkResultFactory
	}

	interface JunctionComplexExecutionArgs {
		db: Client
		joiningTable: Model.JoiningTable
		dataCallback: SelectBuilder.Callback
		okResultFactory: OkResultFactory
	}

	export interface JunctionHandler {
		executeSimple(args: JunctionSimpleExecutionArgs): Promise<MutationResult>

		executeComplex(args: JunctionComplexExecutionArgs): Promise<MutationResult>
	}

	export class JunctionConnectHandler implements JunctionHandler {
		async executeSimple({
			db,
			joiningTable,
			ownerPrimary,
			inversePrimary,
			okResultFactory,
		}: JunctionSimpleExecutionArgs): Promise<MutationResult> {
			const result = await InsertBuilder.create()
				.into(joiningTable.tableName)
				.values({
					[joiningTable.joiningColumn.columnName]: expr => expr.selectValue(ownerPrimary),
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
		}: JunctionComplexExecutionArgs): Promise<MutationResult> {
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
			ownerPrimary,
			inversePrimary,
			okResultFactory,
		}: JunctionSimpleExecutionArgs): Promise<MutationResult> {
			const qb = DeleteBuilder.create()
				.from(joiningTable.tableName)
				.where(cond => cond.compare(joiningTable.joiningColumn.columnName, Operator.eq, ownerPrimary))
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
		}: JunctionComplexExecutionArgs): Promise<MutationResult> {
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
}

export default JunctionTableManager
