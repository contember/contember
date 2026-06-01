import type {
	FieldName,
	HasManyRelation,
	HasOneRelation,
	QualifiedEntityList,
	QualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
} from '../treeParameters/index.js'
import { Hashing } from '../utils/Hashing.js'
import { Environment } from '../environment/index.js'
import { PlaceholderParametersGenerator } from './PlaceholderParametersGenerator.js'

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
