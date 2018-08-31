import { CrudQueryBuilder } from 'cms-client'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'

export default class EntityTreeToQueryConverter {
	constructor(private marker: EntityMarker | undefined) {}

	public convert(): string | undefined {
		const entityMarker = this.marker

		if (entityMarker) {
			const queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			return queryBuilder
				.get(entityMarker.entityName, object => {
					if (entityMarker.where) {
						object = object.where(entityMarker.where)
					}

					return this.registerQueryPart(entityMarker, object)
				})
				.getGql()
		}
	}

	private registerQueryPart(
		context: EntityMarker,
		builder: CrudQueryBuilder.GetQueryBuilder
	): CrudQueryBuilder.GetQueryBuilder {
		builder = builder.column('id')

		for (const field in context.fields) {
			const fieldValue: Marker = context.fields[field]

			if (fieldValue) {
				if (fieldValue instanceof FieldMarker) {
					builder = builder.column(fieldValue.name)
				} else {
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
