import { getEntity } from '@contember/schema-utils'
import Path from './select/Path'
import UniqueWhereExpander from '../graphQlResolver/UniqueWhereExpander'
import WhereBuilder from './select/WhereBuilder'
import PredicateFactory from '../acl/PredicateFactory'
import { Client, DeleteBuilder, Operator } from '@contember/database'
import { Acl, Input, Model } from '@contember/schema'
import { ConflictActionType } from '@contember/database'
import { ConditionBuilder } from '@contember/database'
import { SelectBuilder } from '@contember/database'
import { Literal, InsertBuilder } from '@contember/database'
import { NoResultError } from './NoResultError'

class JunctionTableManager {
	constructor(
		private readonly schema: Model.Schema,
		private readonly predicateFactory: PredicateFactory,
		private readonly uniqueWhereExpander: UniqueWhereExpander,
		private readonly whereBuilder: WhereBuilder,
		private readonly connectJunctionHandler: JunctionTableManager.JunctionConnectHandler,
		private readonly disconnectJunctionHandler: JunctionTableManager.JunctionDisconnectHandler,
	) {}

	public async connectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere,
	): Promise<void> {
		await this.executeJunctionModification(
			owningEntity,
			relation,
			ownerUnique,
			inversedUnique,
			this.connectJunctionHandler,
		)
	}

	public async disconnectJunction(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere,
	): Promise<void> {
		await this.executeJunctionModification(
			owningEntity,
			relation,
			ownerUnique,
			inversedUnique,
			this.disconnectJunctionHandler,
		)
	}

	private async executeJunctionModification(
		owningEntity: Model.Entity,
		relation: Model.ManyHasManyOwnerRelation,
		ownerUnique: Input.UniqueWhere,
		inversedUnique: Input.UniqueWhere,
		handler: JunctionTableManager.JunctionHandler,
	): Promise<void> {
		const joiningTable = relation.joiningTable
		const inversedEntity = getEntity(this.schema, relation.target)

		const owningPredicate = this.predicateFactory.create(owningEntity, Acl.Operation.update, [relation.name])
		let inversePredicate: Input.Where = {}
		if (relation.inversedBy) {
			inversePredicate = this.predicateFactory.create(inversedEntity, Acl.Operation.update, [relation.inversedBy])
		}

		const hasNoPredicates = Object.keys(owningPredicate).length === 0 && Object.keys(inversePredicate).length === 0
		const hasPrimaryValues = ownerUnique[owningEntity.primary] && inversedUnique[inversedEntity.primary]

		if (hasNoPredicates && hasPrimaryValues) {
			const ownerPrimary = ownerUnique[owningEntity.primary] as Input.PrimaryValue
			const inversedPrimary = inversedUnique[inversedEntity.primary] as Input.PrimaryValue
			await handler.executeSimple(joiningTable, ownerPrimary, inversedPrimary)
		} else {
			const ownerWhere: Input.Where = {
				and: [owningPredicate, this.uniqueWhereExpander.expand(owningEntity, ownerUnique)],
			}

			const inversedWhere: Input.Where = {
				and: [inversePredicate, this.uniqueWhereExpander.expand(inversedEntity, inversedUnique)],
			}

			const dataCallback: SelectBuilder.Callback = qb => {
				qb = qb
					.select(expr => expr.select(['owning', owningEntity.primaryColumn]), joiningTable.joiningColumn.columnName)
					.select(
						expr => expr.select(['inversed', inversedEntity.primaryColumn]),
						joiningTable.inverseJoiningColumn.columnName,
					)
					.select(expr => expr.raw('true'), 'selected')
					.from(new Literal('(values (null))'), 't')

					.join(owningEntity.tableName, 'owning', condition => condition.raw('true'))
					.join(inversedEntity.tableName, 'inversed', condition => condition.raw('true'))
				qb = this.whereBuilder.build(qb, owningEntity, new Path([], 'owning'), ownerWhere)
				qb = this.whereBuilder.build(qb, inversedEntity, new Path([], 'inversed'), inversedWhere)
				return qb
			}

			await handler.executeComplex(joiningTable, dataCallback)
		}
	}
}

namespace JunctionTableManager {
	export interface JunctionHandler {
		executeSimple(
			joiningTable: Model.JoiningTable,
			ownerPrimary: Input.PrimaryValue,
			inversedPrimary: Input.PrimaryValue,
		): Promise<void>

		executeComplex(joiningTable: Model.JoiningTable, dataCallback: SelectBuilder.Callback): Promise<void>
	}

	export class JunctionConnectHandler implements JunctionHandler {
		constructor(private readonly db: Client, private readonly providers: { uuid: () => string }) {}

		async executeSimple(
			joiningTable: Model.JoiningTable,
			ownerPrimary: Input.PrimaryValue,
			inversedPrimary: Input.PrimaryValue,
		): Promise<void> {
			await InsertBuilder.create()
				.into(joiningTable.tableName)
				.values({
					id: this.providers.uuid(),
					[joiningTable.joiningColumn.columnName]: expr => expr.selectValue(ownerPrimary),
					[joiningTable.inverseJoiningColumn.columnName]: expr => expr.selectValue(inversedPrimary),
				})
				.onConflict(ConflictActionType.doNothing)
				.execute(this.db)
		}

		async executeComplex(joiningTable: Model.JoiningTable, dataCallback: SelectBuilder.Callback): Promise<void> {
			const insert = InsertBuilder.create()
				.into(joiningTable.tableName)
				.values({
					id: expr => expr.selectValue(this.providers.uuid()),
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

			const result = await qb.getResult(this.db)
			if (result[0]['selected'] === false) {
				throw new NoResultError()
			}
		}
	}

	export class JunctionDisconnectHandler implements JunctionHandler {
		constructor(private readonly db: Client) {}

		public async executeSimple(
			joiningTable: Model.JoiningTable,
			ownerPrimary: Input.PrimaryValue,
			inversedPrimary: Input.PrimaryValue,
		): Promise<void> {
			const qb = DeleteBuilder.create()
				.from(joiningTable.tableName)
				.where(cond => cond.compare(joiningTable.joiningColumn.columnName, Operator.eq, ownerPrimary))
				.where(cond => cond.compare(joiningTable.inverseJoiningColumn.columnName, Operator.eq, inversedPrimary))

			await qb.execute(this.db)
		}

		public async executeComplex(joiningTable: Model.JoiningTable, dataCallback: SelectBuilder.Callback): Promise<void> {
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

			const result = await qb.getResult(this.db)
			if (result[0]['selected'] === false) {
				throw new NoResultError()
			}
		}
	}
}

export default JunctionTableManager
