import type {
	FieldName,
	HasManyRelation,
	HasOneRelation,
	QualifiedEntityList,
	QualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { Hashing } from '../utils'

export class PlaceholderGenerator {
	public static getFieldPlaceholder(fieldName: FieldName): string {
		return fieldName
	}

	public static getHasOneRelationPlaceholder(relation: HasOneRelation): string {
		return `${relation.field}_${Hashing.hashHasOneRelation(relation)}`
	}

	public static getHasManyRelationPlaceholder(relation: HasManyRelation): string {
		return `${relation.field}_${Hashing.hashHasManyRelation(relation)}`
	}

	public static getEntitySubTreePlaceholder(
		subTreeParameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
	): string {
		return `est_${Hashing.hashEntitySubTreeParameters(subTreeParameters)}`
	}

	public static getEntityListSubTreePlaceholder(
		subTreeParameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
	): string {
		return `lst_${Hashing.hashEntityListSubTreeParameters(subTreeParameters)}`
	}
}
