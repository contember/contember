import { Acl, Input, Model } from '@contember/schema'
import { Mapper } from '../../Mapper'
import { RelationFetcher } from '../RelationFetcher'
import { SelectExecutionHandlerContext } from '../SelectExecutionHandler'
import { PredicateFactory } from '../../../acl'
import { WhereBuilder } from '../WhereBuilder'

export class FieldsVisitor implements Model.RelationByTypeVisitor<void>, Model.ColumnVisitor<void> {
	constructor(
		private readonly schema: Model.Schema,
		private readonly relationFetcher: RelationFetcher,
		private readonly predicateFactory: PredicateFactory,
		private readonly whereBuilder: WhereBuilder,
		private readonly mapper: Mapper,
		private readonly executionContext: SelectExecutionHandlerContext,
	) {}

	visitColumn({ entity, column }: Model.ColumnContext): void {
		const columnPath = this.executionContext.path
		this.executionContext.addColumn(qb => {
			const tableAlias = columnPath.back().alias
			const columnAlias = columnPath.alias

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

	public visitManyHasManyInverse({ relation, entity, targetEntity, targetRelation }: Model.ManyHasManyInverseContext): void {
		const field = this.executionContext.objectNode
		if (!field) {
			throw new Error()
		}
		this.executionContext.addData(
			entity.primary,
			async ids =>
				this.relationFetcher.fetchManyHasManyGroups(
					{
						mapper: this.mapper,
						field: field,
						targetEntity: targetEntity,
						sourceRelation: relation,
						targetRelation,
						directionFrom: 'inverse',
						ids: ids,
					},
				),
			[],
		)
	}

	public visitManyHasManyOwning({ targetRelation, relation, targetEntity, entity }: Model.ManyHasManyOwningContext): void {
		const field = this.executionContext.objectNode
		if (!field) {
			throw new Error()
		}

		this.executionContext.addData(
			entity.primary,
			async ids =>
				this.relationFetcher.fetchManyHasManyGroups({
					mapper: this.mapper,
					field: field,
					targetEntity: targetEntity,
					sourceRelation: relation,
					targetRelation,
					directionFrom: 'owning',
					ids: ids,
				}),
			[],
		)
	}

	public visitOneHasMany({ entity, targetRelation, targetEntity, relation }: Model.OneHasManyContext): void {
		const field = this.executionContext.objectNode
		if (!field) {
			throw new Error()
		}

		this.executionContext.addData(
			entity.primary,
			async ids =>
				this.relationFetcher.fetchOneHasManyGroups({
					mapper: this.mapper,
					objectNode: field,
					targetEntity: targetEntity,
					relation: relation,
					targetRelation: targetRelation,
					ids: ids,
				}),
			[],
		)
	}

	public visitOneHasOneInverse({ entity, targetRelation, targetEntity }: Model.OneHasOneInverseContext): void {
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
				const field = this.executionContext.objectNode
				if (!field) {
					throw new Error()
				}
				const where: Input.Where = {
					and: [idsWhere, field.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = field.withArg('filter', where)

				return this.mapper.selectAssoc(targetEntity, objectWithWhere, targetRelation, targetRelation.name)
			},
			null,
		)
	}

	public visitOneHasOneOwning({ relation, targetRelation, targetEntity }: Model.OneHasOneOwningContext): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.objectNode
				if (!objectNode) {
					throw new Error()
				}
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.selectAssoc(targetEntity, objectWithWhere, targetRelation, targetEntity.primary)
			},
			null,
		)
	}

	public visitManyHasOne({ relation, targetEntity, targetRelation }: Model.ManyHasOneContext): void {
		this.executionContext.addData(
			relation.name,
			async ids => {
				const idsWhere: Input.Where = {
					[targetEntity.primary]: {
						in: ids,
					},
				}
				const objectNode = this.executionContext.objectNode
				if (!objectNode) {
					throw new Error()
				}
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.selectAssoc(targetEntity, objectWithWhere, targetRelation, targetEntity.primary)
			},
			null,
		)
	}
}
