import { CrudQueryBuilder } from '@contember/client'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import {
	EntityFieldMarkers,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
} from '../markers'
import { assertNever, ucfirst } from '../utils'

type BaseQueryBuilder = Omit<CrudQueryBuilder.CrudQueryBuilder, CrudQueryBuilder.Mutations>

type ReadBuilder = CrudQueryBuilder.ReadBuilder.Builder<never>

export class QueryGenerator {
	constructor(private tree: MarkerTreeRoot) {}

	public getReadQuery(): string | undefined {
		try {
			let baseQueryBuilder: BaseQueryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			for (const [, subTreeMarker] of this.tree.subTrees) {
				baseQueryBuilder = this.addSubQuery(subTreeMarker, baseQueryBuilder)
			}
			return baseQueryBuilder.getGql()
		} catch (e) {
			return undefined
		}
	}

	private addSubQuery(
		subTree: EntitySubTreeMarker | EntityListSubTreeMarker,
		baseQueryBuilder: BaseQueryBuilder,
	): BaseQueryBuilder {
		if (subTree.parameters.isCreating) {
			// Unconstrained trees, by definition, don't have any queries.
			return baseQueryBuilder
		}

		if (subTree instanceof EntityListSubTreeMarker) {
			return this.addListQuery(baseQueryBuilder, subTree)
		} else if (subTree instanceof EntitySubTreeMarker) {
			return this.addGetQuery(baseQueryBuilder, subTree)
		}

		assertNever(subTree)
	}

	private addGetQuery(baseQueryBuilder: BaseQueryBuilder, subTree: EntitySubTreeMarker): BaseQueryBuilder {
		if (subTree.parameters.isCreating) {
			return baseQueryBuilder
		}
		const populatedListQueryBuilder = QueryGenerator.registerQueryPart(
			subTree.fields.markers,
			CrudQueryBuilder.ReadBuilder.instantiate<CrudQueryBuilder.GetQueryArguments>().by(subTree.parameters.where),
		)
		return baseQueryBuilder.get(
			subTree.entityName,
			CrudQueryBuilder.ReadBuilder.instantiate(
				populatedListQueryBuilder ? populatedListQueryBuilder.objectBuilder : undefined,
			),
			subTree.placeholderName,
		)
	}

	private addListQuery(baseQueryBuilder: BaseQueryBuilder, subTree: EntityListSubTreeMarker): BaseQueryBuilder {
		if (subTree.parameters.isCreating) {
			return baseQueryBuilder
		}

		let finalBuilder: ReadBuilder

		if (subTree.parameters) {
			const parameters = subTree.parameters
			const withFilter: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter'
			>> = parameters.filter
				? CrudQueryBuilder.ReadBuilder.instantiate().filter(parameters.filter)
				: CrudQueryBuilder.ReadBuilder.instantiate()

			const withOrderBy: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy'
			>> = parameters.orderBy ? withFilter.orderBy(parameters.orderBy) : withFilter

			const withOffset: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy' | 'offset'
			>> = parameters.offset === undefined ? withOrderBy : withOrderBy.offset(parameters.offset)

			finalBuilder = parameters.limit === undefined ? withOffset : withOffset.limit(parameters.limit)
		} else {
			finalBuilder = CrudQueryBuilder.ReadBuilder.instantiate()
		}

		// const fullyPopulated = withAllParams
		// 	.anyRelation('pageInfo', builder => builder.column('totalCount'))
		// 	.anyRelation('edges', builder =>
		// 		builder.anyRelation('node', builder => QueryGenerator.registerQueryPart(subTree.fields.markers, builder)),
		// 	)

		return baseQueryBuilder.list(
			subTree.entityName,
			QueryGenerator.registerQueryPart(subTree.fields.markers, finalBuilder),
			subTree.placeholderName,
		)
	}

	public static registerQueryPart(fields: EntityFieldMarkers, builder: ReadBuilder): ReadBuilder {
		builder = builder.column(PRIMARY_KEY_NAME)

		for (const [, fieldValue] of fields) {
			if (fieldValue instanceof FieldMarker) {
				if (fieldValue.fieldName !== PRIMARY_KEY_NAME) {
					builder = builder.column(fieldValue.fieldName)
				}
			} else if (fieldValue instanceof HasOneRelationMarker) {
				const relation = fieldValue.relation
				const builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate(
					this.registerQueryPart(fieldValue.fields.markers, CrudQueryBuilder.ReadBuilder.instantiate()).objectBuilder,
				)

				const filteredBuilder: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
					CrudQueryBuilder.ReadArguments,
					'filter'
				>> = relation.filter ? builderWithBody.filter(relation.filter) : builderWithBody

				if (relation.reducedBy) {
					// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
					const relationField = `${relation.field}By${ucfirst(Object.keys(relation.reducedBy)[0])}`
					builder = builder.reductionRelation(
						relationField,
						filteredBuilder.by(relation.reducedBy),
						fieldValue.placeholderName,
					)
				} else {
					builder = builder.hasOneRelation(
						relation.field,
						filteredBuilder,
						// TODO this will currently always go to the latter condition, resulting in less than ideal queries.
						fieldValue.placeholderName === relation.field ? undefined : fieldValue.placeholderName,
					)
				}
			} else if (fieldValue instanceof HasManyRelationMarker) {
				const relation = fieldValue.relation
				const builderWithBody = CrudQueryBuilder.ReadBuilder.instantiate(
					this.registerQueryPart(fieldValue.fields.markers, CrudQueryBuilder.ReadBuilder.instantiate()).objectBuilder,
				)

				const withFilter: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
					CrudQueryBuilder.ReadArguments,
					'filter'
				>> = relation.filter ? builderWithBody.filter(relation.filter) : builderWithBody

				const withOrderBy: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
					CrudQueryBuilder.ReadArguments,
					'filter' | 'orderBy'
				>> = relation.orderBy ? withFilter.orderBy(relation.orderBy) : withFilter

				const withOffset: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
					CrudQueryBuilder.ReadArguments,
					'filter' | 'orderBy' | 'offset'
				>> = relation.offset === undefined ? withOrderBy : withOrderBy.offset(relation.offset)

				const withLimit = relation.limit === undefined ? withOffset : withOffset.limit(relation.limit)

				builder = builder.anyRelation(
					relation.field,
					withLimit,
					fieldValue.placeholderName === relation.field ? undefined : fieldValue.placeholderName,
				)
			} else if (fieldValue instanceof EntityListSubTreeMarker || fieldValue instanceof EntitySubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(fieldValue)
			}
		}

		return builder
	}
}
