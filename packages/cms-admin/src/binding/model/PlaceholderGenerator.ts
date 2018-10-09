import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { FieldName } from '../bindingTypes'
import FieldMarker from '../dao/FieldMarker'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'
import ReferenceMarker from '../dao/ReferenceMarker'
import { TreeId } from '../dao/TreeId'
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
		return PlaceholderGenerator.getReferencePlaceholder(marker.fieldName, marker.where)
	}

	public static getReferencePlaceholder(fieldName: FieldName, where?: Input.Where<GraphQlBuilder.Literal>): string {
		return where ? `${fieldName}_${Hashing.hashWhere(where)}` : fieldName
	}

	//

	public static generateMarkerTreeRootPlaceholder(marker: MarkerTreeRoot): string {
		return PlaceholderGenerator.getMarkerTreePlaceholder(marker.id, marker.associatedField)
	}

	public static getMarkerTreePlaceholder(id: TreeId, associatedField?: FieldName): string {
		return associatedField ? `${associatedField}__data` : `__root_${id}`
	}
}
