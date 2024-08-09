import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../consts'
import {
	EntityFieldMarkersContainer,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import { assertNever } from '../utils/assertNever'
import { LocalizedBindingError } from '../LocalizedBindingError'

export class MarkerComparator {
	public static isSubTreeSubsetOf(
		candidate: EntitySubTreeMarker | EntityListSubTreeMarker,
		superset: EntitySubTreeMarker | EntityListSubTreeMarker,
	): boolean {
		if (candidate.placeholderName !== superset.placeholderName) {
			return false
		}
		return this.isSubsetOf(candidate.fields, superset.fields)
	}

	public static assertEntityMarkersSubsetOf(
		candidate: EntityFieldMarkersContainer,
		superset: EntityFieldMarkersContainer,
	) {
		this.assertSubsetOf(candidate, superset)
	}

	private static assertSubsetOf(candidate: EntityFieldMarkersContainer, superset: EntityFieldMarkersContainer) {
		for (const [placeholderName, candidateMarker] of candidate.markers) {
			const fromSuperset = superset.markers.get(placeholderName)

			if (fromSuperset === undefined) {
				if (candidateMarker instanceof FieldMarker) {
					if (candidateMarker.fieldName === PRIMARY_KEY_NAME || candidateMarker.fieldName === TYPENAME_KEY_NAME) {
						continue
					}
					throw new LocalizedBindingError(`The field '${candidateMarker.fieldName}' is missing.`, [candidateMarker])
				}
				if (candidateMarker instanceof HasOneRelationMarker || candidateMarker instanceof HasManyRelationMarker) {
					const differentPlaceholders = superset.placeholders.get(candidateMarker.parameters.field)

					if (differentPlaceholders === undefined) {
						throw new LocalizedBindingError(`The relation '${candidateMarker.parameters.field}' is missing.`, [
							candidateMarker,
						])
					}
					// TODO be more specific
					throw new LocalizedBindingError(
						`The relation '${candidateMarker.parameters.field}' exists but its parameters don't match exactly. ` +
							`Check that all relation parameters are the same.`,
						[candidateMarker],
					)
				}
				assertNever(candidateMarker)
			}
			if (candidateMarker instanceof FieldMarker) {
				continue
			}
			try {
				if (
					(candidateMarker instanceof HasOneRelationMarker && fromSuperset instanceof HasOneRelationMarker) ||
					(candidateMarker instanceof HasManyRelationMarker && fromSuperset instanceof HasManyRelationMarker)
				) {
					this.assertSubsetOf(candidateMarker.fields, fromSuperset.fields)
				}
			} catch (e) {
				if (e instanceof LocalizedBindingError) {
					throw e.nestedIn(candidateMarker)
				}
				throw e
			}
		}
	}

	private static isSubsetOf(candidate: EntityFieldMarkersContainer, superset: EntityFieldMarkersContainer): boolean {
		for (const [placeholderName, candidateMarker] of candidate.markers) {
			const fromSuperset = superset.markers.get(placeholderName)

			if (fromSuperset === undefined) {
				if (
					candidateMarker instanceof FieldMarker &&
					(candidateMarker.fieldName === PRIMARY_KEY_NAME || candidateMarker.fieldName === TYPENAME_KEY_NAME)
				) {
					continue
				}
				return false
			}
			if (candidateMarker instanceof FieldMarker || fromSuperset instanceof FieldMarker) {
				continue
			}
			if (!this.isSubsetOf(candidateMarker.fields, fromSuperset.fields)) {
				return false
			}
		}
		return true
	}

	//private static assertAreMarkersSubsetOf(): {}
}
