import { Environment } from './Environment'
import {
	HasOneRelation,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { QueryLanguage } from '../queryLanguage'
import { TreeNodeUtils } from '../utils/TreeNodeUtils'
import { whereToFilter } from '../utils/whereToFilter'

export class TreeNodeEnvironmentFactory {

	public static createEnvironmentForEntityListSubtree(
		environment: Environment,
		sugaredEntityList: SugaredQualifiedEntityList | SugaredUnconstrainedQualifiedEntityList,
	): Environment {
		let entityList
		let rootWhere
		let expectedCardinality: Environment.SubTreeNode['expectedCardinality']

		if (sugaredEntityList.isCreating) {
			entityList = QueryLanguage.desugarUnconstrainedQualifiedEntityList(sugaredEntityList, environment)
			rootWhere = {} as const
			expectedCardinality = 'zero'

		} else {
			entityList = QueryLanguage.desugarQualifiedEntityList(sugaredEntityList, environment)
			rootWhere = entityList.filter ?? {}
			expectedCardinality = 'zero-to-many'
		}

		const entitySchema = TreeNodeUtils.resolveEntity(environment.getSchema(), entityList.entityName, 'entity list')

		return environment.withSubTree({
			type: 'subtree-entity-list',
			entity: entitySchema,
			expectedCardinality,
			filter: rootWhere,
		})
	}

	public static createEnvironmentForEntitySubtree(
		environment: Environment,
		sugaredEntityList: SugaredQualifiedSingleEntity | SugaredUnconstrainedQualifiedSingleEntity,
	): Environment {
		let entity
		let rootWhere
		let expectedCardinality: Environment.SubTreeNode['expectedCardinality']

		if (sugaredEntityList.isCreating) {
			rootWhere = { } as const
			expectedCardinality = 'zero'
			entity = QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(sugaredEntityList, environment)

		} else {
			entity = QueryLanguage.desugarQualifiedSingleEntity(sugaredEntityList, environment)
			rootWhere = whereToFilter(entity.where)
			expectedCardinality = entity.setOnCreate ? 'zero-or-one' : 'one'
		}

		const entitySchema = TreeNodeUtils.resolveEntity(environment.getSchema(), entity.entityName, 'entity')

		return environment.withSubTree({
			type: 'subtree-entity',
			entity: entitySchema,
			expectedCardinality: expectedCardinality,
			filter: rootWhere,
		})
	}

	public static createEnvironmentForEntityList(
		environment: Environment,
		sugaredRelativeEntityList: SugaredRelativeEntityList,
	): Environment {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(sugaredRelativeEntityList, environment)
		const hasOneEnvironment = this.traverseHasOnePath(environment, relativeEntityList.hasOneRelationPath)
		const hasManyField = relativeEntityList.hasManyRelation.field

		const field = TreeNodeUtils.resolveHasManyRelation(hasOneEnvironment, hasManyField)

		const targetEntity = environment.getSchema().getEntity(field.targetEntity)

		return hasOneEnvironment.withSubTreeChild({
			type: 'entity-list',
			field,
			entity: targetEntity,
		})
	}

	public static createEnvironmentForEntity(
		environment: Environment,
		sugaredRelativeSingleEntity: SugaredRelativeSingleEntity,
	) {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(sugaredRelativeSingleEntity, environment)

		return this.traverseHasOnePath(environment, relativeSingleEntity.hasOneRelationPath)
	}

	public static createEnvironmentForField(
		environment: Environment,
		sugaredRelativeSingleField: SugaredRelativeSingleField,
	) {
		const relativeSingleField = QueryLanguage.desugarRelativeSingleField(sugaredRelativeSingleField, environment)
		const hasOneEnvironment = this.traverseHasOnePath(environment, relativeSingleField.hasOneRelationPath)

		const field = TreeNodeUtils.resolveColumn(hasOneEnvironment, relativeSingleField.field)

		return hasOneEnvironment.withSubTreeChild({
			type: 'column',
			entity: environment.getSubTreeNode().entity,
			field,
		})
	}

	private static traverseHasOnePath(
		environment: Environment,
		hasOneRelationPath: HasOneRelation[],
	): Environment {
		for (const pathItem of hasOneRelationPath) {
			const field = TreeNodeUtils.resolveHasOneRelation(environment, pathItem.field, !!pathItem.reducedBy)
			const targetEntity = environment.getSchema().getEntity(field.targetEntity)

			environment = environment.withSubTreeChild({
				type: 'entity',
				field,
				entity: targetEntity,
			})
		}
		return environment
	}

}
