import { Environment } from '../dao'
import {
	EntityFieldMarkersContainer,
	FieldMarker,
	HasManyRelationMarker,
	HasOneRelationMarker,
	Marker,
	SubTreeMarker,
} from '../markers'
import { MarkerMerger, TreeParameterMerger } from '../model'
import {
	BoxedQualifiedEntityList,
	BoxedQualifiedSingleEntity,
	BoxedUnconstrainedQualifiedEntityList,
	BoxedUnconstrainedQualifiedSingleEntity,
	HasManyRelation,
	HasOneRelation,
	RelativeSingleField,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
} from '../treeParameters'
import { QueryLanguage } from './QueryLanguage'

export namespace MarkerFactory {
	export const createSingleEntitySubTreeMarker = (
		environment: Environment,
		singleEntity: SugaredQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer,
	) => {
		const qualifiedSingleEntity = QueryLanguage.desugarQualifiedSingleEntity(singleEntity, environment)

		return new SubTreeMarker(
			new BoxedQualifiedSingleEntity({
				...qualifiedSingleEntity,
				setOnCreate: TreeParameterMerger.mergeSetOnCreate(
					qualifiedSingleEntity.setOnCreate || {},
					qualifiedSingleEntity.where,
				),
			}),
			wrapRelativeEntityFieldMarkers(
				qualifiedSingleEntity.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(fields),
			),
			environment,
		)
	}

	export const createEntityListSubTreeMarker = (
		environment: Environment,
		entityList: SugaredQualifiedEntityList,
		fields: EntityFieldMarkersContainer,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarQualifiedEntityList(entityList, environment)

		return new SubTreeMarker(
			new BoxedQualifiedEntityList(qualifiedEntityList),
			wrapRelativeEntityFieldMarkers(
				qualifiedEntityList.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(fields),
			),
			environment,
		)
	}

	export const createUnconstrainedEntityListSubTreeMarker = (
		environment: Environment,
		entityList: SugaredUnconstrainedQualifiedEntityList,
		fields: EntityFieldMarkersContainer,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment)

		return new SubTreeMarker(
			new BoxedUnconstrainedQualifiedEntityList(qualifiedEntityList),
			wrapRelativeEntityFieldMarkers(
				qualifiedEntityList.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(fields),
			),
			environment,
		)
	}

	export const createUnconstrainedSingleEntitySubTreeMarker = (
		environment: Environment,
		entityList: SugaredUnconstrainedQualifiedSingleEntity,
		fields: EntityFieldMarkersContainer,
	) => {
		const qualifiedSingleEntity = QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(entityList, environment)

		return new SubTreeMarker(
			new BoxedUnconstrainedQualifiedSingleEntity(qualifiedSingleEntity),
			wrapRelativeEntityFieldMarkers(
				qualifiedSingleEntity.hasOneRelationPath,
				environment,
				MarkerMerger.mergeInSystemFields(fields),
			),
			environment,
		)
	}

	export const createRelativeSingleEntityFields = (
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) => {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(field, environment)
		return wrapRelativeEntityFieldMarkers(relativeSingleEntity.hasOneRelationPath, environment, fields)
	}

	export const createRelativeEntityListFields = (
		field: SugaredRelativeEntityList,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) => {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(field, environment)
		const hasManyRelationMarker = createHasManyRelationMarker(relativeEntityList.hasManyRelation, environment, fields)
		return wrapRelativeEntityFieldMarkers(
			relativeEntityList.hasOneRelationPath,
			environment,
			createEntityFieldMarkersContainer(hasManyRelationMarker),
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
		getMarker: (relativeSingleField: RelativeSingleField) => Marker,
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

	export const createEntityFieldMarkersContainer = (marker: Marker) => {
		if (marker instanceof FieldMarker) {
			return new EntityFieldMarkersContainer(
				marker.isNonbearing,
				new Map([[marker.placeholderName, marker]]),
				new Map([[marker.fieldName, marker.placeholderName]]),
			)
		} else if (marker instanceof SubTreeMarker) {
			return new EntityFieldMarkersContainer(
				false,
				new Map([[marker.placeholderName, marker]]),
				new Map(), // The subTree has no field associated with it.
			)
		} else {
			return new EntityFieldMarkersContainer(
				marker.relation.isNonbearing,
				new Map([[marker.placeholderName, marker]]),
				new Map([[marker.relation.field, marker.placeholderName]]),
			)
		}
	}

	export const createHasOneRelationMarker = (
		hasOneRelation: HasOneRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) =>
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

	export const createHasManyRelationMarker = (
		hasManyRelation: HasManyRelation,
		environment: Environment,
		fields: EntityFieldMarkersContainer,
	) => new HasManyRelationMarker(hasManyRelation, MarkerMerger.mergeInSystemFields(fields), environment)
}
