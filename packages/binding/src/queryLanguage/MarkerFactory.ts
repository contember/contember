import { BindingError } from '../BindingError'
import { MarkerMerger, TreeParameterMerger } from '../core'
import { Environment } from '../dao'
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
import {
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

export namespace MarkerFactory {
	const createSubTreeMarker = <
		Params extends Record<'hasOneRelationPath', HasOneRelation[]> & Record<Key, EntityEventListenerStore | undefined>,
		Key extends keyof Params
	>(
		qualifiedParams: Params,
		key: Key,
		Marker: new (params: Params, fields: EntityFieldMarkersContainer, env: Environment) =>
			| EntitySubTreeMarker
			| EntityListSubTreeMarker,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker => {
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
			wrapRelativeEntityFieldMarkers(
				qualifiedParams.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(entityFields),
			),
			environment,
		)
		return new EntityFieldsWithHoistablesMarker(
			createEntityFieldMarkersContainer(undefined),
			new Map([[subTree.placeholderName, subTree]]),
			undefined,
		)
	}

	export const createEntitySubTreeMarker = (
		entity: SugaredQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker => {
		const desugared = QueryLanguage.desugarQualifiedSingleEntity(entity, environment)
		const qualifiedSingleEntity: QualifiedSingleEntity = {
			...desugared,
			setOnCreate: TreeParameterMerger.mergeSetOnCreate(desugared.setOnCreate || {}, desugared.where),
		}

		return createSubTreeMarker(qualifiedSingleEntity, 'eventListeners', EntitySubTreeMarker, fields, environment)
	}

	export const createUnconstrainedEntitySubTreeMarker = (
		entity: SugaredUnconstrainedQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker =>
		createSubTreeMarker(
			QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(entity, environment),
			'eventListeners',
			EntitySubTreeMarker,
			fields,
			environment,
		)

	export const createEntityListSubTreeMarker = (
		entityList: SugaredQualifiedEntityList,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker =>
		createSubTreeMarker(
			QueryLanguage.desugarQualifiedEntityList(entityList, environment),
			'childEventListeners',
			EntityListSubTreeMarker,
			fields,
			environment,
		)

	export const createUnconstrainedEntityListSubTreeMarker = (
		entityList: SugaredUnconstrainedQualifiedEntityList,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker =>
		createSubTreeMarker(
			QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment),
			'childEventListeners',
			EntityListSubTreeMarker,
			fields,
			environment,
		)

	export const createParentEntityMarker = (
		parentEntity: SugaredParentEntityParameters,
		fields: EntityFieldMarkersContainer | EntityFieldsWithHoistablesMarker,
		environment: Environment,
	): EntityFieldsWithHoistablesMarker => {
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

	export const createRelativeSingleEntityFields = (
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer,
	) => {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(field, environment)

		if (fields instanceof EntityFieldMarkersContainer) {
			return wrapRelativeEntityFieldMarkers(relativeSingleEntity.hasOneRelationPath, environment, fields)
		}
		relativeSingleEntity.hasOneRelationPath[
			relativeSingleEntity.hasOneRelationPath.length - 1
		] = TreeParameterMerger.mergeInParentEntity(
			relativeSingleEntity.hasOneRelationPath[relativeSingleEntity.hasOneRelationPath.length - 1],
			'eventListeners',
			fields.parentReference,
		)
		return new EntityFieldsWithHoistablesMarker(
			wrapRelativeEntityFieldMarkers(relativeSingleEntity.hasOneRelationPath, environment, fields.fields),
			fields.subTrees,
			undefined,
		)
	}

	export const createRelativeEntityListFields = (
		field: SugaredRelativeEntityList,
		environment: Environment,
		fields: EntityFieldsWithHoistablesMarker | EntityFieldMarkersContainer,
	) => {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(field, environment)

		if (fields instanceof EntityFieldMarkersContainer) {
			const hasManyRelationMarker = createHasManyRelationMarker(relativeEntityList.hasManyRelation, environment, fields)
			return wrapRelativeEntityFieldMarkers(
				relativeEntityList.hasOneRelationPath,
				environment,
				createEntityFieldMarkersContainer(hasManyRelationMarker),
			)
		}

		relativeEntityList.hasManyRelation = TreeParameterMerger.mergeInParentEntity(
			relativeEntityList.hasManyRelation,
			'childEventListeners',
			fields.parentReference,
		)

		const hasManyRelationMarker = createHasManyRelationMarker(
			relativeEntityList.hasManyRelation,
			environment,
			fields.fields,
		)
		return new EntityFieldsWithHoistablesMarker(
			wrapRelativeEntityFieldMarkers(
				relativeEntityList.hasOneRelationPath,
				environment,
				createEntityFieldMarkersContainer(hasManyRelationMarker),
			),
			fields.subTrees,
			undefined,
		)
	}

	export const createFieldMarker = (field: SugaredRelativeSingleField, environment: Environment) =>
		wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new FieldMarker(relativeSingleField.field, relativeSingleField.defaultValue, relativeSingleField.isNonbearing),
		)

	const wrapRelativeSingleField = (
		field: SugaredRelativeSingleField,
		environment: Environment,
		getMarker: (relativeSingleField: RelativeSingleField) => EntityFieldMarker,
	) => {
		const relativeSingleField = QueryLanguage.desugarRelativeSingleField(field, environment)

		return wrapRelativeEntityFieldMarkers(
			relativeSingleField.hasOneRelationPath,
			environment,
			createEntityFieldMarkersContainer(getMarker(relativeSingleField)),
		)
	}

	const wrapRelativeEntityFieldMarkers = (
		hasOneRelationPath: HasOneRelation[],
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	): EntityFieldMarkersContainer => {
		for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
			const marker = createHasOneRelationMarker(hasOneRelationPath[i], environment, fields)
			fields = createEntityFieldMarkersContainer(marker)
		}
		return fields
	}

	export const createEntityFieldMarkersContainer = (
		marker: EntityFieldMarker | undefined,
	): EntityFieldMarkersContainer => {
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

	const createHasOneRelationMarker = (
		hasOneRelation: HasOneRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	): HasOneRelationMarker =>
		new HasOneRelationMarker(
			{
				...hasOneRelation,
				setOnCreate: hasOneRelation.reducedBy
					? TreeParameterMerger.mergeSetOnCreate(hasOneRelation.setOnCreate || {}, hasOneRelation.reducedBy)
					: hasOneRelation.setOnCreate,
			},
			MarkerMerger.mergeInSystemFields(fields),
			environment,
		)

	const createHasManyRelationMarker = (
		hasManyRelation: HasManyRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) => new HasManyRelationMarker(hasManyRelation, MarkerMerger.mergeInSystemFields(fields), environment)
}
