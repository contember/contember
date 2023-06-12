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
import { Environment } from '../dao'
import { PlaceholderParametersGenerator } from './PlaceholderParametersGenerator'

export class PlaceholderGenerator {
	public static getFieldPlaceholder(fieldName: FieldName): string {
		return fieldName // hashing intentionally ignored
	}

	public static getHasOneRelationPlaceholder(relation: HasOneRelation): string {
		return `${relation.field}_${Hashing.hashAny(PlaceholderParametersGenerator.createHasOneRelationParameters(relation))}`
	}

	public static getHasManyRelationPlaceholder(relation: HasManyRelation): string {
		return `${relation.field}_${Hashing.hashAny(PlaceholderParametersGenerator.createHasManyRelationParameters(relation))}`
	}

	public static getEntitySubTreePlaceholder(
		subTreeParameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): string {
		return `est_${Hashing.hashAny(PlaceholderParametersGenerator.createEntitySubTreeParameters(subTreeParameters, environment))}`
	}

	public static getEntityListSubTreePlaceholder(
		subTreeParameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
		environment: Environment,
	): string {
		return `lst_${Hashing.hashAny(PlaceholderParametersGenerator.createEntityListSubTreeParameters(subTreeParameters, environment))}`
	}
}
