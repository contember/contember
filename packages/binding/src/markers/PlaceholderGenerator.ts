import {
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	FieldName,
	HasManyRelation,
	HasOneRelation,
} from '../treeParameters'
import { Hashing } from '../utils'
import { FieldMarker } from './FieldMarker'
import { HasManyRelationMarker } from './HasManyRelationMarker'
import { HasOneRelationMarker } from './HasOneRelationMarker'
import { SubTreeMarker, SubTreeMarkerParameters } from './SubTreeMarker'

export class PlaceholderGenerator {
	public static generateFieldMarkerPlaceholder(marker: FieldMarker): string {
		return PlaceholderGenerator.getFieldPlaceholder(marker.fieldName)
	}

	public static getFieldPlaceholder(fieldName: FieldName): string {
		return fieldName
	}

	//

	public static generateHasOneRelationMarkerPlaceholder(marker: HasOneRelationMarker): string {
		return PlaceholderGenerator.getHasOneRelationPlaceholder(marker.relation)
	}

	public static getHasOneRelationPlaceholder(relation: HasOneRelation | DesugaredHasOneRelation): string {
		return `${relation.field}_${Hashing.hashHasOneRelation(relation)}`
	}

	//

	public static generateHasManyRelationMarkerPlaceholder(marker: HasManyRelationMarker): string {
		return PlaceholderGenerator.getHasManyRelationPlaceholder(marker.relation)
	}

	public static getHasManyRelationPlaceholder(relation: HasManyRelation | DesugaredHasManyRelation): string {
		return `${relation.field}_${Hashing.hashHasManyRelation(relation)}`
	}

	//

	public static generateSubTreeMarkerPlaceholder(marker: SubTreeMarker): string {
		return PlaceholderGenerator.getSubTreeMarkerPlaceholder(marker.parameters)
	}

	public static getSubTreeMarkerPlaceholder(subTreeParameters: SubTreeMarkerParameters): string {
		return `subTree_${Hashing.hashMarkerTreeParameters(subTreeParameters)}`
	}
}
