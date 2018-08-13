import { CrudQueryBuilder } from 'cms-client'
import { FieldContextValue } from '../coreComponents/FieldContext'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import RootEntityMarker from '../dao/RootEntityMarker'

export default class EntityTreeToQueryConverter {
	constructor(private rem: RootEntityMarker) {}

	public convert(): string | undefined {
		const entityMarker = this.rem.content

		if (entityMarker instanceof EntityMarker) {
			const queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			return queryBuilder.get(entityMarker.entityName, object => {
				if (entityMarker.where) {
					object = object.where(entityMarker.where)
				}

				return this.registerQueryPart(entityMarker, object)
			}).getGql()
		}
	}

	private registerQueryPart(
		context: FieldContextValue,
		builder: CrudQueryBuilder.GetQueryBuilder
	): CrudQueryBuilder.GetQueryBuilder {
		if (context instanceof EntityMarker) {
			builder = builder.column('id')

			for (const field in context.fields) {
				const fieldValue: FieldContextValue = context.fields[field]

				if (fieldValue instanceof FieldMarker) {
					builder = builder.column(fieldValue.name)
				} else if (fieldValue instanceof EntityMarker) {
					builder = builder.relation(field, builder => {
						if (fieldValue.where) {
							builder = builder.where(fieldValue.where)
						}
						return this.registerQueryPart(fieldValue, builder)
					})
				}
			}
		}

		return builder
	}
}
