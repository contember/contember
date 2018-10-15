import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'
import { Hashing } from '../utils'

export default class PlaceholderGenerator {
	public static generateFieldMarkerPlaceholder(marker: FieldMarker): string {
		return PlaceholderGenerator.getFieldPlaceholder(marker.fieldName)
	}

	public static getFieldPlaceholder(fieldName: FieldName): string {
		return fieldName
	}

	//

	public static generateReferenceMarkerPlaceholder(marker: ReferenceMarker): string {
		return PlaceholderGenerator.getReferencePlaceholder(marker.fieldName, marker.where, marker.reducedBy)
	}

	public static getReferencePlaceholder(
		fieldName: FieldName,
		where?: Input.Where<GraphQlBuilder.Literal>,
		reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	): string {
		return (where || reducedBy) ? `${fieldName}_${Hashing.hashWhere(where, reducedBy)}` : fieldName
	}

	//

	public static generateMarkerTreeRootPlaceholder(marker: MarkerTreeRoot): string {
		return PlaceholderGenerator.getMarkerTreePlaceholder(marker.associatedField, marker.id)
	}

	public static getMarkerTreePlaceholder(associatedField: FieldName | undefined, id?: MarkerTreeRoot.TreeId): string {
		return associatedField ? `${associatedField}__data` : `__root_${id}`
	}
}
