import { MarkerMerger, TreeParameterMerger } from '../core'
import type { Environment } from '../dao'
import {
	EntityFieldMarker,
	EntityFieldMarkersContainer,
	EntityFieldsWithHoistablesMarker,
	EntityListSubTreeMarker,
	EntitySubTreeMarker,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
} from '../markers'
import type {
	EntityEventListenerStore,
	HasManyRelation,
	HasOneRelation,
	QualifiedSingleEntity,
	RelativeSingleField,
	SugaredParentEntityParameters,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { assertNever } from '../utils'
import { QueryLanguage } from './QueryLanguage'

export class MarkerFactory {
	private static createSubTreeMarker<
		Params extends Record<'hasOneRelationPath', HasOneRelation[]> & Record<Key, EntityEventListenerStore | undefined>,
		Key extends keyof Params,
	>(
		qualifiedParams: Params,
		key: Key,
		Marker: new (params: Params, fields: EntityFieldMarkersContainer, env: Environment) =>
			| EntitySubTreeMarker
			| EntityListSubTreeMarker,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		let entityFields: EntityFieldMarkersContainer | undefined

		if (fields instanceof EntityFieldsWithHoistablesMarker) {
			// TODO this is wrong with respect to hasOneRelationPath
			qualifiedParams = TreeParameterMerger.mergeInParentEntity(qualifiedParams, key, fields.parentReference)
			entityFields = fields.fields
		} else {
			entityFields = fields
		}

		const subTree = new Marker(
			qualifiedParams,
			this.wrapRelativeEntityFieldMarkers(
				qualifiedParams.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(entityFields),
			),
			environment,
		)
		if (fields instanceof EntityFieldsWithHoistablesMarker) {
			return new EntityFieldsWithHoistablesMarker(
				this.createEntityFieldMarkersContainer(undefined),
				MarkerMerger.mergeSubTreeMarkers(fields.subTrees, new Map([[subTree.placeholderName, subTree]])),
				undefined,
			)
		}
		return new EntityFieldsWithHoistablesMarker(
			this.createEntityFieldMarkersContainer(undefined),
			new Map([[subTree.placeholderName, subTree]]),
			undefined,
		)
	}

	public static createEntitySubTreeMarker(
		entity: SugaredQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		const qualifiedSingleEntity: QualifiedSingleEntity = QueryLanguage.desugarQualifiedSingleEntity(entity, environment, { missingSetOnCreate: 'fillAndWarn' })

		return this.createSubTreeMarker(qualifiedSingleEntity, 'eventListeners', EntitySubTreeMarker, fields, environment)
	}

	public static createUnconstrainedEntitySubTreeMarker(
		entity: SugaredUnconstrainedQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		return this.createSubTreeMarker(
			QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(entity, environment),
			'eventListeners',
			EntitySubTreeMarker,
			fields,
			environment,
		)
	}

	public static createEntityListSubTreeMarker(
		entityList: SugaredQualifiedEntityList,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		return this.createSubTreeMarker(
			QueryLanguage.desugarQualifiedEntityList(entityList, environment),
			'childEventListeners',
			EntityListSubTreeMarker,
			fields,
			environment,
		)
	}

	public static createUnconstrainedEntityListSubTreeMarker(
		entityList: SugaredUnconstrainedQualifiedEntityList,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		return this.createSubTreeMarker(
			QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment),
			'childEventListeners',
			EntityListSubTreeMarker,
			fields,
			environment,
		)
	}

	public static createParentEntityMarker(
		parentEntity: SugaredParentEntityParameters,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		const desugared = QueryLanguage.desugarParentEntityParameters(parentEntity, environment)
		if (fields instanceof EntityFieldMarkersContainer) {
			return new EntityFieldsWithHoistablesMarker(fields, undefined, desugared)
		}
		return new EntityFieldsWithHoistablesMarker(
			fields.fields,
			fields.subTrees,
			TreeParameterMerger.mergeParentEntityParameters(fields.parentReference, desugared),
		)
	}

	public static createEntityFieldsWithHoistablesMarker(
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker {
		if (fields instanceof EntityFieldMarkersContainer) {
			return new EntityFieldsWithHoistablesMarker(fields, undefined, undefined)
		}
		return new EntityFieldsWithHoistablesMarker(fields.fields, fields.subTrees, undefined)
	}

	public static createRelativeSingleEntityFields(
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer,
	) {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(field, environment)

		if (fields instanceof EntityFieldMarkersContainer) {
			return this.wrapRelativeEntityFieldMarkers(relativeSingleEntity.hasOneRelationPath, environment, fields)
		}
		relativeSingleEntity.hasOneRelationPath[relativeSingleEntity.hasOneRelationPath.length - 1] =
			TreeParameterMerger.mergeInParentEntity(
				relativeSingleEntity.hasOneRelationPath[relativeSingleEntity.hasOneRelationPath.length - 1],
				'eventListeners',
				fields.parentReference,
			)
		return new EntityFieldsWithHoistablesMarker(
			this.wrapRelativeEntityFieldMarkers(relativeSingleEntity.hasOneRelationPath, environment, fields.fields),
			fields.subTrees,
			undefined,
		)
	}

	public static createRelativeEntityListFields(
		field: SugaredRelativeEntityList,
		environment: Environment,
		fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer,
	) {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(field, environment)

		if (fields instanceof EntityFieldMarkersContainer) {
			const hasManyRelationMarker = this.createHasManyRelationMarker(
				relativeEntityList.hasManyRelation,
				environment,
				fields,
			)
			return this.wrapRelativeEntityFieldMarkers(
				relativeEntityList.hasOneRelationPath,
				environment.getParent(),
				this.createEntityFieldMarkersContainer(hasManyRelationMarker),
			)
		}

		relativeEntityList.hasManyRelation = TreeParameterMerger.mergeInParentEntity(
			relativeEntityList.hasManyRelation,
			'childEventListeners',
			fields.parentReference,
		)

		const hasManyRelationMarker = this.createHasManyRelationMarker(
			relativeEntityList.hasManyRelation,
			environment,
			fields.fields,
		)
		return new EntityFieldsWithHoistablesMarker(
			this.wrapRelativeEntityFieldMarkers(
				relativeEntityList.hasOneRelationPath,
				environment.getParent(),
				this.createEntityFieldMarkersContainer(hasManyRelationMarker),
			),
			fields.subTrees,
			undefined,
		)
	}

	public static createFieldMarker(field: SugaredRelativeSingleField, environment: Environment) {
		return this.wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new FieldMarker(relativeSingleField.field, relativeSingleField.defaultValue, relativeSingleField.isNonbearing),
		)
	}

	private static wrapRelativeSingleField(
		field: SugaredRelativeSingleField,
		environment: Environment,
		getMarker: (relativeSingleField: RelativeSingleField) => EntityFieldMarker,
	) {
		const relativeSingleField = QueryLanguage.desugarRelativeSingleField(field, environment)

		return this.wrapRelativeEntityFieldMarkers(
			relativeSingleField.hasOneRelationPath,
			environment.getParent(),
			this.createEntityFieldMarkersContainer(getMarker(relativeSingleField)),
		)
	}

	private static wrapRelativeEntityFieldMarkers(
		hasOneRelationPath: HasOneRelation[],
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	): EntityFieldMarkersContainer {
		for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
			const marker = this.createHasOneRelationMarker(hasOneRelationPath[i], environment, fields)
			environment = environment.getParent()
			fields = this.createEntityFieldMarkersContainer(marker)
		}
		return fields
	}

	public static createEntityFieldMarkersContainer(marker: EntityFieldMarker | undefined): EntityFieldMarkersContainer {
		if (marker instanceof FieldMarker) {
			return new EntityFieldMarkersContainer(
				!marker.isNonbearing,
				new Map([[marker.placeholderName, marker]]),
				new Map([[marker.fieldName, marker.placeholderName]]),
			)
		} else if (marker instanceof HasOneRelationMarker || marker instanceof HasManyRelationMarker) {
			return new EntityFieldMarkersContainer(
				!marker.parameters.isNonbearing,
				new Map([[marker.placeholderName, marker]]),
				new Map([[marker.parameters.field, marker.placeholderName]]),
			)
		} else if (marker === undefined) {
			return new EntityFieldMarkersContainer(false, new Map(), new Map())
		} else {
			return assertNever(marker)
		}
	}

	private static createHasOneRelationMarker(
		hasOneRelation: HasOneRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	): HasOneRelationMarker {
		return new HasOneRelationMarker(
			{
				...hasOneRelation,
				setOnCreate: hasOneRelation.reducedBy
					? TreeParameterMerger.mergeSetOnCreate(hasOneRelation.setOnCreate || {}, hasOneRelation.reducedBy)
					: hasOneRelation.setOnCreate,
			},
			MarkerMerger.mergeInSystemFields(fields),
			environment,
		)
	}

	private static createHasManyRelationMarker(
		hasManyRelation: HasManyRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) {
		return new HasManyRelationMarker(hasManyRelation, MarkerMerger.mergeInSystemFields(fields), environment)
	}
}
