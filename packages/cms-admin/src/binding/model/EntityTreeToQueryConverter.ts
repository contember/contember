import { CrudQueryBuilder, GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import DataBindingError from '../dao/DataBindingError'
import EntityMarker from '../dao/EntityMarker'
import FieldMarker from '../dao/FieldMarker'
import Marker from '../dao/Marker'

export default class EntityTreeToQueryConverter {
	constructor(private marker: EntityMarker) {
	}

	public convertToGetQuery(where: Input.UniqueWhere<GraphQlBuilder.Literal>): string {
		const queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

		return queryBuilder
			.get(this.marker.entityName, object => {
				if (this.marker.where) {
					throw new DataBindingError(
						'When selecting a single item, it does not make sense for a top-level Entity to have a where clause.'
					)
				}
				return this.registerListQueryPart(
					this.marker,
					new CrudQueryBuilder.ListQueryBuilder(object.where(where).objectBuilder)
				)
			})
			.getGql()
	}

	public convertToListQuery(where?: Input.Where<GraphQlBuilder.Literal>): string {
		const queryBuilder = new CrudQueryBuilder.CrudQueryBuilder()

		return (
			queryBuilder
			// This naming convention is unfortunate & temporary
				.list(`${this.marker.entityName}s`, object => {
					let listQueryBuilder = object

					if (this.marker.where) {
						if (where) {
							listQueryBuilder = listQueryBuilder.where({
								and: [where, this.marker.where]
							} as Input.Where<GraphQlBuilder.Literal>) // TODO: This is necessary for the time being because TS…
						} else {
							listQueryBuilder = listQueryBuilder.where(this.marker.where)
						}
					} else if (where) {
						listQueryBuilder = listQueryBuilder.where(where)
					}

					return this.registerListQueryPart(
						this.marker,
						new CrudQueryBuilder.ListQueryBuilder(listQueryBuilder.objectBuilder)
					)
				})
				.getGql()
		)
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
