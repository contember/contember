import {
	assertNever,
	EntityFieldMarkers,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker, FieldMeta,
	HasManyRelationMarker,
	HasOneRelationMarker,
	MarkerTreeRoot,
	PRIMARY_KEY_NAME,
} from '@contember/binding-common'
import { ContentEntitySelection, ContentQuery, ContentQueryBuilder } from '@contember/client'


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
				by: subTree.parameters.where,
				filter: subTree.parameters.filter,
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
				filter: subTree.parameters.filter,
				orderBy: subTree.parameters.orderBy,
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
						{
							by: relation.reducedBy,
							filter: relation.filter,
							as: fieldValue.placeholderName,
						},
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)
				} else {
					selection = selection.$(
						relation.field,
						{
							filter: relation.filter,
							as: fieldValue.placeholderName,
						},
						it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
					)
				}
			} else if (fieldValue instanceof HasManyRelationMarker) {
				const relation = fieldValue.parameters


				selection = selection.$(
					relation.field,
					{
						as: fieldValue.placeholderName,
						filter: relation.filter,
						orderBy: relation.orderBy,
						offset: relation.offset,
						limit: relation.limit,
					},
					it => QueryGenerator.registerQueryPart(fieldValue.fields.markers, it),
				)
			} else {
				assertNever(fieldValue)
			}
			selection = QueryGenerator.withMetaField(selection, fieldValue.parameters.field, fieldValue.parameters.meta)
		}

		return selection
	}

	private static withMetaField(selection: ContentEntitySelection, fieldName: string, metaField: FieldMeta): ContentEntitySelection {
		if (metaField.length === 0) {
			return selection
		}
		return selection.meta(fieldName, metaField)
	}
}

const ucfirst = (string: string) => `${string.charAt(0).toUpperCase()}${string.substring(1)}`
