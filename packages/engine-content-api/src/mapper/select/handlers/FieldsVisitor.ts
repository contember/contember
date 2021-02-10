import { Acl, Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { RelationFetcher } from '../RelationFetcher'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler'
import { PredicateFactory } from '../../../acl'
import { WhereBuilder } from '../WhereBuilder'
import { ObjectNode } from '../../../inputProcessing'
import { JoiningColumns } from '../../types'

export class FieldsVisitor implements Model.RelationByTypeVisitor<void>, Model.ColumnVisitor<void> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly executionContext: SelectExecutionHandlerContext,
	) {}

	visitColumn(entity: Model.Entity, column: Model.AnyColumn): void {
		const columnPath = this.executionContext.path
		this.executionContext.addColumn(qb => {
			const tableAlias = columnPath.back().getAlias()
			const columnAlias = columnPath.getAlias()

			const fieldPredicate = this.predicateFactory.shouldApplyCellLevelPredicate(
				entity,
				Acl.Operation.read,
				column.name,
			)
				? this.predicateFactory.create(entity, Acl.Operation.read, [column.name])
				: undefined

			if (!fieldPredicate || Object.keys(fieldPredicate).length === 0) {
				return qb.select([tableAlias, column.columnName], columnAlias)
			}
			return this.whereBuilder.buildAdvanced(entity, columnPath.back(), fieldPredicate, cb =>
				qb.select(
					expr =>
						expr.case(caseExpr =>
							caseExpr
								.when(
									whenExpr => whenExpr.selectCondition(cb),
									thenExpr => thenExpr.select([tableAlias, column.columnName]),
								)
								.else(elseExpr => elseExpr.raw('null')),
						),
					columnAlias,
				),
			)
		})
	}

	public visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): void {
		const joiningTable = targetRelation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.inverseJoiningColumn,
			targetColumn: joiningTable.joiningColumn,
		}

		this.executionContext.addData(entity.primary, async ids =>
			this.relationFetcher.fetchManyHasManyGroups(
				this.mapper,
				this.executionContext.field as ObjectNode,
				targetEntity,
				relation,
				targetRelation,
				columns,
				ids,
			),
		)
	}

	public visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
	): void {
		const joiningTable = relation.joiningTable
		const columns: JoiningColumns = {
			sourceColumn: joiningTable.joiningColumn,
			targetColumn: joiningTable.inverseJoiningColumn,
		}

		this.executionContext.addData(
			entity.primary,
			async ids =>
				this.relationFetcher.fetchManyHasManyGroups(
					this.mapper,
					this.executionContext.field as ObjectNode,
					targetEntity,
					relation,
					relation,
					columns,
					ids,
				),
			[],
		)
	}

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): void {
		this.executionContext.addData(
			entity.primary,
			async ids =>
				this.relationFetcher.fetchOneHasManyGroups(
					this.mapper,
					this.executionContext.field as ObjectNode,
					targetEntity,
					relation,
					targetRelation,
					ids,
				),
			[],
		)
	}

	public visitOneHasOneInverse(
		entity: Model.Entity,
		relation: Model.OneHasOneInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneOwningRelation,
	): void {
		this.executionContext.addData(
			entity.primary,
			async ids => {
				const idsWhere: Input.Where = {
					[targetRelation.name]: {
						[entity.primary]: {
							in: ids,
						},
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation.name)
			},
			null,
		)
	}

	public visitOneHasOneOwning(
		entity: Model.Entity,
		relation: Model.OneHasOneOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.OneHasOneInverseRelation | null,
	): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null,
		)
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.field as ObjectNode
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetEntity.primary)
			},
			null,
		)
	}
}
