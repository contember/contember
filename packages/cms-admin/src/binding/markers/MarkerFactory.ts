import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFields,
	MarkerTreeRoot,
	TaggedEntityListTreeConstraints,
	TaggedSingleEntityTreeConstraints,
} from '../markers'
import {
	AssociatedField,
	SugaredEntityListTreeConstraints,
	SugaredRelativeSingleField,
	SugaredSingleEntityTreeConstraints,
	SugaredUniqueWhere,
} from '../treeParameters'
import { QueryLanguage } from './QueryLanguage'

export namespace MarkerFactory {
	export const createSingleEntityMarkerTreeRoot = (
		environment: Environment,
		constraints: SugaredSingleEntityTreeConstraints,
		fields: EntityFields,
		associatedField?: AssociatedField,
	): MarkerTreeRoot<TaggedSingleEntityTreeConstraints> =>
		new MarkerTreeRoot<TaggedSingleEntityTreeConstraints>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...constraints,
				where: QueryLanguage.parseUniqueWhere(constraints.where, environment),
				type: 'unique',
			},
			fields,
			associatedField,
		)

	export const createEntityListMarkerTreeRoot = (
		environment: Environment,
		constraints: SugaredEntityListTreeConstraints,
		fields: EntityFields,
		associatedField?: AssociatedField,
	): MarkerTreeRoot<TaggedEntityListTreeConstraints> =>
		new MarkerTreeRoot<TaggedEntityListTreeConstraints>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...constraints,
				orderBy: constraints.orderBy ? QueryLanguage.parseOrderBy(constraints.orderBy, environment) : undefined,
				filter: constraints.filter ? QueryLanguage.parseFilter(constraints.filter, environment) : undefined,
				type: 'nonUnique',
			},
			fields,
			associatedField,
		)

	export const createConnectionMarker = (
		field: SugaredRelativeSingleField,
		to: SugaredUniqueWhere,
		isNonbearing: boolean | undefined,
		environment: Environment,
	) =>
		new ConnectionMarker(
			QueryLanguage.parseRelativeSingleField(field, environment),
			QueryLanguage.parseUniqueWhere(to, environment),
			isNonbearing,
		)

	export const createRelativeSingleFieldMarker = () => {
		
	}
}
