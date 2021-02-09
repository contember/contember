import { BindingError } from '../BindingError'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	SubTreeMarker,
} from '../markers'
import { assertNever } from '../utils'

export class MarkerComparisonError extends BindingError {
	public constructor(
		message: string,
		public readonly stackPath: Array<FieldMarker | HasOneRelationMarker | HasManyRelationMarker>,
	) {
		super(message)
	}
}

export class MarkerComparator {
	public static assertEntityMarkersSubsetOf(
		candidate: EntityFieldMarkersContainer,
		superset: EntityFieldMarkersContainer,
	) {
		this.assertSubsetOf(candidate, superset)
	}

	private static assertSubsetOf(candidate: EntityFieldMarkersContainer, superset: EntityFieldMarkersContainer) {
		for (const [placeholderName, candidateMarker] of candidate.markers) {
			if (candidateMarker instanceof SubTreeMarker) {
				continue // We don't handle sub trees from here.
			}

			const fromSuperset = superset.markers.get(placeholderName)

			if (fromSuperset === undefined) {
				if (candidateMarker instanceof FieldMarker) {
					throw new MarkerComparisonError(`The field '${candidateMarker.fieldName}' is missing.`, [candidateMarker])
				}
				if (candidateMarker instanceof HasOneRelationMarker || candidateMarker instanceof HasManyRelationMarker) {
					const differentPlaceholders = superset.placeholders.get(candidateMarker.relation.field)

					if (differentPlaceholders === undefined) {
						throw new MarkerComparisonError(`The relation '${candidateMarker.relation.field}' is missing.`, [
							candidateMarker,
						])
					}
					// TODO be more specific
					throw new MarkerComparisonError(
						`The relation '${candidateMarker.relation.field}' exists but its parameters don't match exactly. ` +
							`Check that all relation parameters are the same.`,
						[candidateMarker],
					)
				}
				assertNever(candidateMarker)
			}
			try {
				if (
					(candidateMarker instanceof HasOneRelationMarker && fromSuperset instanceof HasOneRelationMarker) ||
					(candidateMarker instanceof HasManyRelationMarker && fromSuperset instanceof HasManyRelationMarker)
				) {
					this.assertSubsetOf(candidateMarker.fields, fromSuperset.fields)
				}
			} catch (e) {
				if (e instanceof MarkerComparisonError) {
					throw new MarkerComparisonError(e.message, [...e.stackPath, candidateMarker])
				}
				throw e
			}
		}
	}

	//private static assertAreMarkersSubsetOf(): {}
}
