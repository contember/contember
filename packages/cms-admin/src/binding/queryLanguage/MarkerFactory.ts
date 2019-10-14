import { Input } from '@contember/schema'
import { GraphQlBuilder } from 'cms-client'
import { EntityName, FieldName, Filter, RelativeSingleField, UniqueWhere } from '../bindingTypes'
import {
	ConnectionMarker,
	EntityFields,
	EntityListTreeConstraints,
	Environment,
	MarkerTreeRoot,
	SingleEntityTreeConstraints,
} from '../dao'
import { QueryLanguage } from './QueryLanguage'

export namespace MarkerFactory {
	export interface SugaredSingleEntityTreeConstraints extends Omit<SingleEntityTreeConstraints, 'where'> {
		where: string | Input.UniqueWhere<GraphQlBuilder.Literal>
	}
	export const createSingleEntityMarkerTreeRoot = (
		environment: Environment,
		entityName: EntityName,
		fields: EntityFields,
		constraints: SugaredSingleEntityTreeConstraints,
		associatedField?: FieldName,
	): MarkerTreeRoot<SingleEntityTreeConstraints> =>
		new MarkerTreeRoot<SingleEntityTreeConstraints>(
			environment.getSystemVariable('treeIdSeed'),
			entityName,
			fields,
			{
				...constraints,
				where:
					typeof constraints.where === 'string'
						? QueryLanguage.parseUniqueWhere(constraints.where, environment)
						: constraints.where,
			},
			associatedField,
		)

	export interface SugaredEntityListTreeConstraints extends Omit<EntityListTreeConstraints, 'filter'> {
		filter?: string | Filter
	}
	export const createEntityListMarkerTreeRoot = (
		environment: Environment,
		entityName: EntityName,
		fields: EntityFields,
		constraints: SugaredEntityListTreeConstraints,
		associatedField?: FieldName,
	): MarkerTreeRoot<EntityListTreeConstraints> =>
		new MarkerTreeRoot<EntityListTreeConstraints>(
			environment.getSystemVariable('treeIdSeed'),
			entityName,
			fields,
			{
				...constraints,
				filter:
					typeof constraints.filter === 'string'
						? QueryLanguage.parseFilter(constraints.filter, environment)
						: constraints.filter,
			},
			associatedField,
		)

	export const createConnectionMarker = (
		field: RelativeSingleField,
		to: UniqueWhere | Input.UniqueWhere<GraphQlBuilder.Literal>,
		environment: Environment,
	) => new ConnectionMarker(field, typeof to === 'string' ? QueryLanguage.parseUniqueWhere(to, environment) : to)
}
