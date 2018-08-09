import * as GraphQlBuilder from 'cms-client/dist/src/graphQlBuilder'
import { FieldContextValue } from '../coreComponents/FieldContext'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import RootEntityMarker from '../dao/RootEntityMarker'

export default class TreeToQueryConverter {
	constructor(private rem: RootEntityMarker) {}

	public convert(): string | undefined {
		const entityMarker = this.rem.content

		if (entityMarker instanceof EntityMarker) {
			const queryBuilder = new GraphQlBuilder.QueryBuilder()

			return queryBuilder.query(builder =>
				builder.object(entityMarker.entityName, object => {
					if (entityMarker.where) {
						object = object.argument('where', entityMarker.where)
					}

					return this.registerQueryPart(entityMarker, object)
				})
			)
		}
	}

	private registerQueryPart(
		context: FieldContextValue,
		builder: GraphQlBuilder.ObjectBuilder
	): GraphQlBuilder.ObjectBuilder {
		if (context instanceof EntityMarker) {
			builder = builder.field('id')

			for (const field in context.fields) {
				const fieldValue: FieldContextValue = context.fields[field]

				if (fieldValue instanceof FieldMarker) {
					builder = builder.field(fieldValue.name)
				} else if (fieldValue instanceof EntityMarker) {
					builder = builder.object(field, builder => this.registerQueryPart(fieldValue, builder))

					if (fieldValue.where) {
						builder = builder.argument('where', fieldValue.where)
					}
				}
			}
		}

		return builder
	}
}
