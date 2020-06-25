import { BindingError } from '../BindingError'
import { PRIMARY_KEY_NAME, TYPENAME_KEY_NAME } from '../bindingTypes'
import {
	EntityFieldMarkers,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	SubTreeMarker,
} from '../markers'
import { FieldName } from '../treeParameters'
import { assertNever } from '../utils'
import { TreeParameterMerger } from './TreeParameterMerger'

export class MarkerMerger {
	// This method assumes their placeholder names are the same
	public static mergeMarkers(original: Marker, fresh: Marker): Marker {
		if (original instanceof FieldMarker) {
			if (fresh instanceof FieldMarker) {
				return this.mergeFieldMarkers(original, fresh)
			} else if (fresh instanceof HasOneRelationMarker || fresh instanceof HasManyRelationMarker) {
				return this.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof SubTreeMarker) {
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
			} else if (fresh instanceof SubTreeMarker) {
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
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof SubTreeMarker) {
			if (fresh instanceof SubTreeMarker) {
				return this.mergeSubTreeMarkers(original, fresh)
			} else {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
		}
		assertNever(original)
	}

	public static mergeEntityFields(original: EntityFieldMarkers, fresh: EntityFieldMarkers): EntityFieldMarkers {
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

	public static mergeHasOneRelationMarkers(original: HasOneRelationMarker, fresh: HasOneRelationMarker) {
		return new HasOneRelationMarker(
			TreeParameterMerger.mergeHasOneRelationsWithSamePlaceholders(original.relation, fresh.relation),
			this.mergeEntityFields(original.fields, fresh.fields),
		)
	}

	public static mergeHasManyRelationMarkers(original: HasManyRelationMarker, fresh: HasManyRelationMarker) {
		return new HasManyRelationMarker(
			TreeParameterMerger.mergeHasManyRelationsWithSamePlaceholders(original.relation, fresh.relation),
			this.mergeEntityFields(original.fields, fresh.fields),
		)
	}

	public static mergeSubTreeMarkers(original: SubTreeMarker, fresh: SubTreeMarker) {
		return new SubTreeMarker(original.parameters, this.mergeEntityFields(original.fields, fresh.fields))
	}

	public static mergeFieldMarkers(original: FieldMarker, fresh: FieldMarker) {
		if (original.isNonbearing !== fresh.isNonbearing && original.isNonbearing) {
			// If only one isNonbearing, then the whole field is bearing
			return fresh
		}
		// TODO warn in case of defaultValue differences
		return original
	}

	public static mergeInSystemFields(original: EntityFieldMarkers) {
		const primaryKey = new FieldMarker(PRIMARY_KEY_NAME)
		const typeName = new FieldMarker(TYPENAME_KEY_NAME)
		// We could potentially share this map for all fields. Maybe sometime later.
		const freshFields: EntityFieldMarkers = new Map([
			[primaryKey.placeholderName, primaryKey],
			[typeName.placeholderName, typeName],
		])
		return this.mergeEntityFields(original, freshFields)
	}

	private static rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new BindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}
}
