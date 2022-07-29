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

	visitColumn(entity: Model.Entity, column: Model.AnyColumn): void {
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

	public visitManyHasManyInverse(
		entity: Model.Entity,
		relation: Model.ManyHasManyInverseRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyOwningRelation,
	): void {
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

	public visitManyHasManyOwning(
		entity: Model.Entity,
		relation: Model.ManyHasManyOwningRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasManyInverseRelation | null,
	): void {
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

	public visitOneHasMany(
		entity: Model.Entity,
		relation: Model.OneHasManyRelation,
		targetEntity: Model.Entity,
		targetRelation: Model.ManyHasOneRelation,
	): void {
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
				const field = this.executionContext.objectNode
				if (!field) {
					throw new Error()
				}
				const where: Input.Where = {
					and: [idsWhere, field.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = field.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation, targetRelation.name)
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
				const objectNode = this.executionContext.objectNode
				if (!objectNode) {
					throw new Error()
				}
				const where: Input.Where = {
					and: [idsWhere, objectNode.args.filter].filter((it): it is Input.Where => it !== undefined),
				}
				const objectWithWhere = objectNode.withArg('filter', where)

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation, targetEntity.primary)
			},
			null,
		)
	}

	public visitManyHasOne(entity: Model.Entity, relation: Model.ManyHasOneRelation, targetEntity: Model.Entity, targetRelation: Model.OneHasManyRelation | null): void {
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

				return this.mapper.select(targetEntity, objectWithWhere, targetRelation, targetEntity.primary)
			},
			null,
		)
	}
}
