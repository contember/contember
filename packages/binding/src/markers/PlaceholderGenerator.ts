import { FieldName } from '../treeParameters'
import { Hashing } from '../utils'
import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { MarkerSubTree, MarkerSubTreeParameters } from './MarkerSubTree'
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
		return PlaceholderGenerator.getConnectionPlaceholder(marker.fieldName)
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

	public static generateMarkerSubTreePlaceholder(marker: MarkerSubTree): string {
		return PlaceholderGenerator.getMarkerSubTreePlaceholder(marker.parameters)
	}

	public static getMarkerSubTreePlaceholder(subTreeParameters: MarkerSubTreeParameters): string {
		return `contember__subTree_${Hashing.hashMarkerTreeParameters(subTreeParameters)}`
	}
}
