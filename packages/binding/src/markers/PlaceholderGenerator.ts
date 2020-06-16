import { FieldName } from '../treeParameters'
import { Hashing } from '../utils'
import { ConnectionMarker } from './ConnectionMarker'
import { FieldMarker } from './FieldMarker'
import { SubTreeMarker, SubTreeMarkerParameters } from './SubTreeMarker'
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

	public static generateSubTreeMarkerPlaceholder(marker: SubTreeMarker): string {
		return PlaceholderGenerator.getSubTreeMarkerPlaceholder(marker.parameters)
	}

	public static getSubTreeMarkerPlaceholder(subTreeParameters: SubTreeMarkerParameters): string {
		return `subTree_${Hashing.hashMarkerTreeParameters(subTreeParameters)}`
	}
}
