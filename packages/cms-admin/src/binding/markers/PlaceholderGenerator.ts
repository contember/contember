import { FieldName } from '../bindingTypes'
import { Hashing } from '../utils'
import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { MarkerTreeRoot } from './MarkerTreeRoot'
import { ReferenceMarker } from './ReferenceMarker'

export class PlaceholderGenerator {
	public static generateFieldMarkerPlaceholder(marker: FieldMarker): string {
		return PlaceholderGenerator.getFieldPlaceholder(marker.fieldName)
	}

	public static getFieldPlaceholder(fieldName: FieldName): string {
		return fieldName
	}

	//

	public static generateConnectionMarkerPlaceholder(marker: ConnectionMarker): string {
		return PlaceholderGenerator.getFieldPlaceholder(marker.fieldName)
	}

	public static getConnectionPlaceholder(fieldName: FieldName): string {
		return fieldName
	}

	//

	public static generateReferenceMarkerPlaceholder(marker: ReferenceMarker): string {
		return marker.fieldName
	}

	public static getReferencePlaceholder(fieldName: FieldName, reference: ReferenceMarker.ReferenceConstraints): string {
		return reference.filter || reference.reducedBy
			? `${fieldName}_${Hashing.hashReferenceConstraints(reference)}`
			: fieldName
	}

	//

	public static generateMarkerTreeRootPlaceholder(marker: MarkerTreeRoot): string {
		return PlaceholderGenerator.getMarkerTreePlaceholder(marker.associatedField || marker.id)
	}

	public static getMarkerTreePlaceholder(associatedField: FieldName): string
	public static getMarkerTreePlaceholder(id: MarkerTreeRoot.TreeId): string
	public static getMarkerTreePlaceholder(identifier: FieldName | MarkerTreeRoot.TreeId): string {
		return `root_${identifier}`
	}
}
