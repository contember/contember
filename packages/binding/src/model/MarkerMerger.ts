import { GraphQlBuilder } from '@contember/client'
import { BindingError } from '../BindingError'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	SubTreeMarker,
} from '../markers'
import { FieldName, UniqueWhere } from '../treeParameters/primitives'
import { assertNever } from '../utils'
import { TreeParameterMerger } from './TreeParameterMerger'

export class MarkerMerger {
	// This method assumes their placeholder names are the same
	public static mergeMarkers(original: Marker, fresh: Marker): Marker {
		if (original instanceof FieldMarker) {
			if (fresh instanceof FieldMarker) {
				if (original.isNonbearing !== fresh.isNonbearing && original.isNonbearing) {
					// If only one isNonbearing, then the whole field is bearing
					return fresh
				}
				// TODO warn in case of defaultValue differences
				return original
			} else if (fresh instanceof HasOneRelationMarker || fresh instanceof HasManyRelationMarker) {
				return this.rejectRelationScalarCombo(original.fieldName)
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('Merging fields and sub trees is an undefined operation.')
			} else if (fresh instanceof ConnectionMarker) {
				return this.rejectConnectionMarkerCombo(fresh)
			}
			assertNever(fresh)
		} else if (original instanceof HasOneRelationMarker) {
			if (fresh instanceof HasOneRelationMarker) {
				return new HasOneRelationMarker(
					TreeParameterMerger.mergeHasOneRelationsWithSamePlaceholders(original.relation, fresh.relation),
					this.mergeEntityFields(original.fields, fresh.fields),
				)
			} else if (fresh instanceof FieldMarker) {
				return this.rejectRelationScalarCombo(original.relation.field)
			} else if (fresh instanceof HasManyRelationMarker) {
				throw new BindingError() // TODO not implemented
			} else if (fresh instanceof ConnectionMarker) {
				return this.rejectConnectionMarkerCombo(fresh)
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof HasManyRelationMarker) {
			if (fresh instanceof HasManyRelationMarker) {
				console.log('hasMany merge', original, fresh)
				return new HasManyRelationMarker(
					TreeParameterMerger.mergeHasManyRelationsWithSamePlaceholders(original.relation, fresh.relation),
					this.mergeEntityFields(original.fields, fresh.fields),
				)
			} else if (fresh instanceof FieldMarker) {
				return this.rejectRelationScalarCombo(original.relation.field)
			} else if (fresh instanceof HasOneRelationMarker) {
				throw new BindingError() // TODO not implemented
			} else if (fresh instanceof ConnectionMarker) {
				return this.rejectConnectionMarkerCombo(fresh)
			} else if (fresh instanceof SubTreeMarker) {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
			assertNever(fresh)
		} else if (original instanceof ConnectionMarker) {
			if (fresh instanceof ConnectionMarker && fresh.fieldName === original.fieldName) {
				return new ConnectionMarker(
					original.fieldName,
					TreeParameterMerger.mergeEntityConnections(original.target, fresh.target)!,
					original.isNonbearing && fresh.isNonbearing, // If one is nonbearing, then so is the result.
				)
			}
			return this.rejectConnectionMarkerCombo(original)
		} else if (original instanceof SubTreeMarker) {
			if (fresh instanceof SubTreeMarker) {
				return new SubTreeMarker(original.parameters, this.mergeEntityFields(original.fields, fresh.fields))
			} else {
				throw new BindingError('MarkerTreeGenerator merging: SubTreeMarkers can only be merged with other sub trees.')
			}
		}
		assertNever(original)
	}

	public static mergeEntityFields(original: EntityFieldMarkers, fresh: EntityFieldMarkers): EntityFieldMarkers {
		for (const [placeholderName, freshMarker] of fresh) {
			const markerFromOriginal = original.get(placeholderName)
			original.set(
				placeholderName,
				markerFromOriginal === undefined ? freshMarker : this.mergeMarkers(markerFromOriginal, freshMarker),
			)
		}
		return original
	}

	private static rejectRelationScalarCombo(fieldName: FieldName): never {
		throw new BindingError(`Cannot combine a relation with a scalar field '${fieldName}'.`)
	}

	private static rejectConnectionMarkerCombo(connectionMarker: ConnectionMarker): never {
		throw new BindingError(`Attempting to combine a connection reference for field '${connectionMarker.fieldName}'.`)
	}
}
