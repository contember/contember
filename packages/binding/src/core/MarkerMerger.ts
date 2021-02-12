import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME } from '../bindingTypes'
import { Environment } from '../dao'
import {
	EntityFieldMarkers,
	EntityFieldMarkersContainer,
	EntityFieldPlaceholders,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	MarkerTreeRoot,
} from '../markers'
import { FieldName, PlaceholderName } from '../treeParameters'
import { assertNever } from '../utils'
import { TreeParameterMerger } from './TreeParameterMerger'

export class MarkerMerger {
	// This method assumes their placeholder names are the same
	public static mergeMarkers(original: Marker, fresh: Marker): Marker {
		if (original === fresh) {
			return original
		}
		if (original instanceof FieldMarker) {
			if (fresh instanceof FieldMarker) {
				return this.mergeFieldMarkers(original, fresh)
			} else if (fresh instanceof HasOneRelationMarker || fresh instanceof HasManyRelationMarker) {
				return this.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof EntitySubTreeMarker || fresh instanceof EntityListSubTreeMarker) {
				throw new BindingError('Merging fields and sub trees is an undefined operation.')
			}
			assertNever(fresh)
		} else if (original instanceof HasOneRelationMarker) {
			if (fresh instanceof HasOneRelationMarker) {
				return this.mergeHasOneRelationMarkers(original, fresh)
			} else if (fresh instanceof FieldMarker) {
				return this.rejectRelationScalarCombo(original.relation.field)
			} else if (fresh instanceof HasManyRelationMarker) {
				throw new BindingError() // TODO not implemented
			} else if (fresh instanceof EntitySubTreeMarker || fresh instanceof EntityListSubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof HasManyRelationMarker) {
			if (fresh instanceof HasManyRelationMarker) {
				return this.mergeHasManyRelationMarkers(original, fresh)
			} else if (fresh instanceof FieldMarker) {
				return this.rejectRelationScalarCombo(original.relation.field)
			} else if (fresh instanceof HasOneRelationMarker) {
				throw new BindingError() // TODO not implemented
			} else if (fresh instanceof EntitySubTreeMarker || fresh instanceof EntityListSubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof EntitySubTreeMarker) {
			if (fresh instanceof EntitySubTreeMarker) {
				return this.mergeEntitySubTreeMarkers(original, fresh)
			} else {
				throw new BindingError(
					'MarkerTreeGenerator merging: EntitySubTreeMarker can only be merged with other entity sub trees.',
				)
			}
		} else if (original instanceof EntityListSubTreeMarker) {
			if (fresh instanceof EntityListSubTreeMarker) {
				return this.mergeEntityListSubTreeMarkers(original, fresh)
			} else {
				throw new BindingError(
					'MarkerTreeGenerator merging: EntityListSubTreeMarker can only be merged with other list sub trees.',
				)
			}
		}
		assertNever(original)
	}

	public static mergeMarkerTreeRoots(original: MarkerTreeRoot, fresh: MarkerTreeRoot): MarkerTreeRoot {
		if (original === fresh) {
			return original
		}
		const newSubTrees = this.mergeEntityFields(original.subTrees, fresh.subTrees) as Map<
			PlaceholderName,
			EntitySubTreeMarker | EntityListSubTreeMarker
		>

		const newOriginalAliases = new Map(original.placeholdersByAliases)
		for (const [alias, placeholder] of fresh.placeholdersByAliases) {
			const fromOriginal = newOriginalAliases.get(alias)
			if (fromOriginal === undefined) {
				newOriginalAliases.set(alias, placeholder)
			} else if (fromOriginal === placeholder) {
				// Do nothing
			} else {
				throw new BindingError(`Illegal subTree alias '${alias}' points to distinct subTrees.`)
			}
		}
		return new MarkerTreeRoot(newSubTrees, newOriginalAliases)
	}

	public static mergeEntityFields(original: EntityFieldMarkers, fresh: EntityFieldMarkers): EntityFieldMarkers {
		if (original === fresh) {
			return original
		}
		const newOriginal: EntityFieldMarkers = new Map(original)
		for (const [placeholderName, freshMarker] of fresh) {
			const markerFromOriginal = newOriginal.get(placeholderName)
			newOriginal.set(
				placeholderName,
				markerFromOriginal === undefined ? freshMarker : this.mergeMarkers(markerFromOriginal, freshMarker),
			)
		}
		return newOriginal
	}

	public static mergeEntityFieldPlaceholders(
		original: EntityFieldPlaceholders,
		fresh: EntityFieldPlaceholders,
	): EntityFieldPlaceholders {
		if (original === fresh) {
			return original
		}
		const newOriginal: EntityFieldPlaceholders = new Map(original)
		for (const [fieldName, freshPlaceholders] of fresh) {
			const placeholderFromOriginal = newOriginal.get(fieldName)

			if (placeholderFromOriginal === undefined) {
				newOriginal.set(fieldName, freshPlaceholders)
			} else if (placeholderFromOriginal instanceof Set) {
				const combinedSet = new Set(placeholderFromOriginal)
				if (freshPlaceholders instanceof Set) {
					for (const freshPlaceholder of freshPlaceholders) {
						combinedSet.add(freshPlaceholder)
					}
				} else if (typeof freshPlaceholders === 'string') {
					combinedSet.add(freshPlaceholders)
				} else {
					assertNever(freshPlaceholders)
				}
				newOriginal.set(fieldName, combinedSet)
			} else if (typeof placeholderFromOriginal === 'string') {
				if (typeof freshPlaceholders === 'string') {
					if (placeholderFromOriginal === freshPlaceholders) {
						// Do nothing
					} else {
						newOriginal.set(fieldName, new Set([placeholderFromOriginal, freshPlaceholders]))
					}
				} else if (freshPlaceholders instanceof Set) {
					if (freshPlaceholders.has(placeholderFromOriginal)) {
						newOriginal.set(fieldName, freshPlaceholders)
					} else {
						const combinedSet = new Set(freshPlaceholders)
						combinedSet.add(placeholderFromOriginal)
						newOriginal.set(fieldName, combinedSet)
					}
				} else {
					assertNever(freshPlaceholders)
				}
			} else {
				assertNever(placeholderFromOriginal)
			}
		}
		return newOriginal
	}

	public static mergeEntityFieldsContainers(
		original: EntityFieldMarkersContainer,
		fresh: EntityFieldMarkersContainer,
	): EntityFieldMarkersContainer {
		if (original === fresh) {
			return original
		}
		return new EntityFieldMarkersContainer(
			original.hasAtLeastOneBearingField || fresh.hasAtLeastOneBearingField,
			this.mergeEntityFields(original.markers, fresh.markers),
			this.mergeEntityFieldPlaceholders(original.placeholders, fresh.placeholders),
		)
	}

	public static mergeHasOneRelationMarkers(original: HasOneRelationMarker, fresh: HasOneRelationMarker) {
		if (original === fresh) {
			return original
		}
		return new HasOneRelationMarker(
			TreeParameterMerger.mergeHasOneRelationsWithSamePlaceholders(original.relation, fresh.relation),
			this.mergeEntityFieldsContainers(original.fields, fresh.fields),
			this.mergeEnvironments(original.environment, fresh.environment),
		)
	}

	public static mergeHasManyRelationMarkers(original: HasManyRelationMarker, fresh: HasManyRelationMarker) {
		if (original === fresh) {
			return original
		}
		return new HasManyRelationMarker(
			TreeParameterMerger.mergeHasManyRelationsWithSamePlaceholders(original.relation, fresh.relation),
			this.mergeEntityFieldsContainers(original.fields, fresh.fields),
			this.mergeEnvironments(original.environment, fresh.environment),
		)
	}

	public static mergeEntitySubTreeMarkers(original: EntitySubTreeMarker, fresh: EntitySubTreeMarker) {
		if (original === fresh) {
			return original
		}
		return new EntitySubTreeMarker(
			TreeParameterMerger.mergeEntitySubTreeParametersWithSamePlaceholders(original.parameters, fresh.parameters),
			this.mergeEntityFieldsContainers(original.fields, fresh.fields),
			this.mergeEnvironments(original.environment, fresh.environment),
		)
	}

	public static mergeEntityListSubTreeMarkers(original: EntityListSubTreeMarker, fresh: EntityListSubTreeMarker) {
		if (original === fresh) {
			return original
		}
		return new EntityListSubTreeMarker(
			TreeParameterMerger.mergeEntityListSubTreeParametersWithSamePlaceholders(original.parameters, fresh.parameters),
			this.mergeEntityFieldsContainers(original.fields, fresh.fields),
			this.mergeEnvironments(original.environment, fresh.environment),
		)
	}

	public static mergeFieldMarkers(original: FieldMarker, fresh: FieldMarker) {
		if (original === fresh) {
			return original
		}
		if (original.isNonbearing !== fresh.isNonbearing && original.isNonbearing) {
			// If only one isNonbearing, then the whole field is bearing
			return fresh
		}
		// TODO warn in case of defaultValue differences
		return original
	}

	public static mergeInSystemFields(original: EntityFieldMarkersContainer): EntityFieldMarkersContainer {
		const primaryKey = new FieldMarker(PRIMARY_KEY_NAME, undefined, true)
		// We could potentially share this instance for all fields. Maybe sometime later.
		const freshFields = new EntityFieldMarkersContainer(
			false,
			new Map([[primaryKey.placeholderName, primaryKey]]),
			new Map([[PRIMARY_KEY_NAME, primaryKey.placeholderName]]),
		)
		return this.mergeEntityFieldsContainers(original, freshFields)
	}

	public static mergeEnvironments(original: Environment, fresh: Environment): Environment {
		if (original === fresh) {
			return original
		}
		return original.putDelta(fresh.getAllNames())
	}

	private static rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new BindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}
}
