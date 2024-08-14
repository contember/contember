import {
	EntityFieldMarkers,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	Filter,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	PRIMARY_KEY_NAME,
	assertNever,
} from '@contember/binding-common'
import { ContentEntitySelection, ContentQuery, ContentQueryBuilder, replaceGraphQlLiteral } from '@contember/client'


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
				filter: resolveFilter(subTree.parameters.filter),
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

				const resolvedFilter = resolveFilter(relation.filter)
				if (relation.reducedBy) {
					// Assuming there's exactly one reducer field as enforced by MarkerTreeGenerator
					const relationField = `${relation.field}By${ucfirst(Object.keys(relation.reducedBy)[0])}`
					selection = selection.$(
						relationField,
						{
							by: replaceGraphQlLiteral(relation.reducedBy),
							filter: resolvedFilter,
							as: fieldValue.placeholderName,
						},
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)

					if (resolvedFilter !== undefined) {
						selection.$(
							relationField,
							{
								by: replaceGraphQlLiteral(relation.reducedBy),
								as: QueryGenerator.getStubAlias(fieldValue.placeholderName),
							},
							it => it.$(PRIMARY_KEY_NAME),
						)
					}

				} else {
					selection = selection.$(
						relation.field,
						{
							filter: resolvedFilter,
							as: fieldValue.placeholderName,
						},
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)

					if (resolvedFilter !== undefined) {
						selection.$(
							relation.field,
							{
								as: QueryGenerator.getStubAlias(fieldValue.placeholderName),
							},
							it => it.$(PRIMARY_KEY_NAME),
						)
					}
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

	public static getStubAlias(alias: string): string {
		return `${alias}__stub`
	}
}

const resolveFilter = (input?: Filter): Filter<never> | undefined => {
	return replaceGraphQlLiteral<unknown>(input) as Filter<never>
}
const ucfirst = (string: string) => `${string.charAt(0).toUpperCase()}${string.substring(1)}`
