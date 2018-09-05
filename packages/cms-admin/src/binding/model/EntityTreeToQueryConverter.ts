import { CrudQueryBuilder } from 'cms-client'
import DataBindingError from '../dao/DataBindingError'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'

export default class EntityTreeToQueryConverter {
	constructor(private marker: EntityMarker | undefined) {}

	public convertToGetQuery(where: Input.UniqueWhere<GraphQlBuilder.Literal>): string | undefined {
		const entityMarker = this.marker

		if (entityMarker) {
			const queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

			return queryBuilder
				.get(`get${entityMarker.entityName}`, object => {
					if (entityMarker.where) {
						throw new DataBindingError(
							'When selecting a single item, it does not make sense for a top-level Entity to have a where clause.'
						)
					}

					return this.registerListQueryPart(entityMarker,
						new CrudQueryBuilder.ListQueryBuilder(object.where(where).objectBuilder)
					)
				})
				.getGql()
		}
	}

	private registerListQueryPart(
		context: EntityMarker,
		builder: CrudQueryBuilder.ListQueryBuilder
	): CrudQueryBuilder.ListQueryBuilder {
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
						return this.registerListQueryPart(fieldValue, builder)
					})
				}
			}
		}

		return builder
	}
}
