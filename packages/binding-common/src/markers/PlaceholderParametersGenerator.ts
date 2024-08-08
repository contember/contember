import {
	HasManyRelation,
	HasOneRelation,
	QualifiedEntityList,
	QualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { Environment } from '../environment'

export class PlaceholderParametersGenerator {

	public static createHasOneRelationParameters(relation: HasOneRelation): any {
		return {
			type: 'hasOne',
			field: relation.field,
			filter: relation.filter,
			reducedBy: relation.reducedBy,
		}
	}

	public static createHasManyRelationParameters(relation: HasManyRelation): any {
		return {
			type: 'hasMany',
			field: relation.field,
			filter: relation.filter,
			offset: relation.offset,
			limit: relation.limit,
			orderBy: relation.orderBy,
		}
	}

	public static createEntityListSubTreeParameters(
		parameters: QualifiedEntityList | UnconstrainedQualifiedEntityList,
		environment: Environment,
	): any {
		if (parameters.isCreating) {
			return {
				type: 'entityListSubtree',
				isCreating: true,
				entityName: parameters.entityName,
				variables: environment.getAllVariables(),
			}
		}
		return {
			type: 'entityListSubtree',
			isCreating: false,
			entityName: parameters.entityName,
			filter: parameters.filter,
			offset: parameters.offset,
			limit: parameters.limit,
			orderBy: parameters.orderBy,
			variables: environment.getAllVariables(),
		}
	}

	public static createEntitySubTreeParameters(
		parameters: QualifiedSingleEntity | UnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): any {
		if (parameters.isCreating) {
			return {
				type: 'entitySubTree',
				isCreating: true,
				entityName: parameters.entityName,
				variables: environment.getAllVariables(),
			}
		}
		return {
			type: 'entitySubTree',
			isCreating: false,
			where: parameters.where,
			entityName: parameters.entityName,
			filter: parameters.filter,
			variables: environment.getAllVariables(),
		}
	}

}
