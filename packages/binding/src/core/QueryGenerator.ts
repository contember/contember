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
import { ContentEntitySelection, ContentQuery, ContentQueryBuilder, replaceGraphQlLiteral } from '@contember/client'
import { Filter } from '../treeParameters'


export class QueryGenerator {
	constructor(
		private tree: MarkerTreeRoot,
		private qb: ContentQueryBuilder,
	) {}

	public getReadQuery(): Record<string, ContentQuery<any>> {
		const result: Record<string, ContentQuery<any>> = {}
		for (const [, subTreeMarker] of this.tree.subTrees) {
			if (subTreeMarker.parameters.isCreating) {
				continue
			}
			if (subTreeMarker instanceof EntitySubTreeMarker) {
				result[subTreeMarker.placeholderName] = this.addGetQuery(subTreeMarker)
			} else if (subTreeMarker instanceof EntityListSubTreeMarker) {
				result[subTreeMarker.placeholderName] = this.createListQuery(subTreeMarker)
			}
		}
		return result
	}

	private addGetQuery(subTree: EntitySubTreeMarker): ContentQuery<any> {
		if (subTree.parameters.isCreating) {
			throw new Error()
		}

		return this.qb.get(
			subTree.entityName,
			{
				by: replaceGraphQlLiteral(subTree.parameters.where),
			},
			it =>  QueryGenerator.registerQueryPart(subTree.fields.markers, it),
		)
	}

	private createListQuery(subTree: EntityListSubTreeMarker): ContentQuery<any> {
		if (subTree.parameters.isCreating) {
			throw new Error()
		}
		return this.qb.list(
			subTree.entityName,
			{
				filter: resolveFilter(subTree.parameters.filter),
				orderBy: replaceGraphQlLiteral(subTree.parameters.orderBy),
				offset: subTree.parameters.offset,
				limit: subTree.parameters.limit,
			},
			it =>  QueryGenerator.registerQueryPart(subTree.fields.markers, it),
		)
	}

	public static registerQueryPart(fields: EntityFieldMarkers, selection: ContentEntitySelection): ContentEntitySelection {
		selection = selection.$(PRIMARY_KEY_NAME).$('__typename')

		for (const [, fieldValue] of fields) {
			if (fieldValue instanceof FieldMarker) {
				if (fieldValue.fieldName !== PRIMARY_KEY_NAME) {
					selection = selection.$(fieldValue.fieldName)
				}
			} else if (fieldValue instanceof HasOneRelationMarker) {
				const relation = fieldValue.parameters

				if (relation.reducedBy) {
					// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
					const relationField = `${relation.field}By${ucfirst(Object.keys(relation.reducedBy)[0])}`
					selection = selection.$(
						relationField,
						{ by: replaceGraphQlLiteral(relation.reducedBy), as: fieldValue.placeholderName },
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)
				} else {
					selection = selection.$(
						relation.field,
						{ filter: resolveFilter(relation.filter), as: fieldValue.placeholderName },
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)
				}
			} else if (fieldValue instanceof HasManyRelationMarker) {
				const relation = fieldValue.parameters


				selection = selection.$(
					relation.field,
					{
						as: fieldValue.placeholderName,
						filter: resolveFilter(relation.filter),
						orderBy: replaceGraphQlLiteral(relation.orderBy),
						offset: relation.offset,
						limit: relation.limit,
					},
					it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
				)
			} else {
				assertNever(fieldValue)
			}
		}

		return selection
	}
}

const resolveFilter = (input?: Filter): Filter<never> => {
	return replaceGraphQlLiteral<unknown>(input) as Filter<never>
}
