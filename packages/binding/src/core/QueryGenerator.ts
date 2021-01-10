import { CrudQueryBuilder } from '@contember/client'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	EntityFieldMarkers,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	SubTreeMarker,
} from '../markers'
import { BoxedQualifiedEntityList, BoxedQualifiedSingleEntity } from '../treeParameters'
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

	private addSubQuery(subTree: SubTreeMarker, baseQueryBuilder: BaseQueryBuilder): BaseQueryBuilder {
		switch (subTree.parameters.type) {
			case 'qualifiedSingleEntity':
				return this.addGetQuery(baseQueryBuilder, subTree as SubTreeMarker<BoxedQualifiedSingleEntity>)
			case 'qualifiedEntityList':
				return this.addListQuery(baseQueryBuilder, subTree as SubTreeMarker<BoxedQualifiedEntityList>)
			case 'unconstrainedQualifiedSingleEntity':
			case 'unconstrainedQualifiedEntityList':
				// Unconstrained trees, by definition, don't have any queries.
				return baseQueryBuilder
		}
		assertNever(subTree.parameters)
	}

	private addGetQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: SubTreeMarker<BoxedQualifiedSingleEntity>,
	): BaseQueryBuilder {
		const populatedListQueryBuilder = QueryGenerator.registerQueryPart(
			subTree.fields.markers,
			CrudQueryBuilder.ReadBuilder.instantiate<CrudQueryBuilder.GetQueryArguments>().by(subTree.parameters.value.where),
		)
		return baseQueryBuilder.get(
			subTree.entityName,
			CrudQueryBuilder.ReadBuilder.instantiate(
				populatedListQueryBuilder ? populatedListQueryBuilder.objectBuilder : undefined,
			),
			subTree.placeholderName,
		)
	}

	private addListQuery(
		baseQueryBuilder: BaseQueryBuilder,
		subTree: SubTreeMarker<BoxedQualifiedEntityList>,
	): BaseQueryBuilder {
		let finalBuilder: ReadBuilder

		if (subTree.parameters) {
			const parametersValue = subTree.parameters.value
			const withFilter: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter'
			>> = parametersValue.filter
				? CrudQueryBuilder.ReadBuilder.instantiate().filter(parametersValue.filter)
				: CrudQueryBuilder.ReadBuilder.instantiate()

			const withOrderBy: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy'
			>> = parametersValue.orderBy ? withFilter.orderBy(parametersValue.orderBy) : withFilter

			const withOffset: CrudQueryBuilder.ReadBuilder.Builder<Exclude<
				CrudQueryBuilder.ReadArguments,
				'filter' | 'orderBy' | 'offset'
			>> = parametersValue.offset === undefined ? withOrderBy : withOrderBy.offset(parametersValue.offset)

			finalBuilder = parametersValue.limit === undefined ? withOffset : withOffset.limit(parametersValue.limit)
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
		builder = builder.column(TYPENAME_KEY_NAME)

		for (const [, fieldValue] of fields) {
			if (fieldValue instanceof FieldMarker) {
				if (fieldValue.fieldName !== PRIMARY_KEY_NAME && fieldValue.fieldName !== TYPENAME_KEY_NAME) {
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
			} else if (fieldValue instanceof SubTreeMarker) {
				// Do nothing: all sub trees have been hoisted and shouldn't appear here.
			} else {
				assertNever(fieldValue)
			}
		}

		return builder
	}
}
