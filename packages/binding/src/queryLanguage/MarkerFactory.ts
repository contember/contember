import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFieldMarkers,
	FieldMarker,
	Marker,
	MarkerTreeRoot,
	PlaceholderGenerator,
	ReferenceMarker,
	TaggedQualifiedEntityList,
	TaggedQualifiedSingleEntity,
	TaggedUnconstrainedQualifiedEntityList,
} from '../markers'
import {
	ExpectedEntityCount,
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
	SugaredUniqueWhere,
} from '../treeParameters'
import { QueryLanguage } from './QueryLanguage'

export namespace MarkerFactory {
	export const createSingleEntityMarkerTreeRoot = (
		environment: Environment,
		singleEntity: SugaredQualifiedSingleEntity,
		fields: EntityFieldMarkers,
	) => {
		const qualifiedSingleEntity = QueryLanguage.desugarQualifiedSingleEntity(singleEntity, environment)
		return new MarkerTreeRoot<TaggedQualifiedSingleEntity>(
			{
				...qualifiedSingleEntity,
				type: 'unique',
			},
			fields,
		)
	}

	export const createEntityListMarkerTreeRoot = (
		environment: Environment,
		entityList: SugaredQualifiedEntityList,
		fields: EntityFieldMarkers,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarQualifiedEntityList(entityList, environment)

		return new MarkerTreeRoot<TaggedQualifiedEntityList>(
			{
				...qualifiedEntityList,
				type: 'nonUnique',
			},
			wrapRelativeEntityFields(qualifiedEntityList.hasOneRelationPath, fields),
		)
	}

	export const createUnconstrainedEntityListMarkerTreeRoot = (
		environment: Environment,
		entityList: SugaredUnconstrainedQualifiedEntityList,
		fields: EntityFieldMarkers,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment)

		return new MarkerTreeRoot<TaggedUnconstrainedQualifiedEntityList>(
			{
				...qualifiedEntityList,
				type: 'unconstrainedNonUnique',
			},
			fields,
		)
	}

	export const createUnconstrainedSingleEntityMarkerTreeRoot = (
		environment: Environment,
		entityList: SugaredUnconstrainedQualifiedSingleEntity,
		fields: EntityFieldMarkers,
	) => {
		const qualifiedSingleEntity = QueryLanguage.desugarUnconstrainedQualifiedSingleEntity(entityList, environment)

		return new MarkerTreeRoot<TaggedUnconstrainedQualifiedEntityList>(
			{
				...qualifiedSingleEntity,
				type: 'unconstrainedNonUnique',
			},
			fields,
		)
	}

	export const createRelativeSingleEntityFields = (
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		entityFieldMarkers: EntityFieldMarkers,
	) => {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(field, environment)
		return wrapRelativeEntityFields(relativeSingleEntity.hasOneRelationPath, entityFieldMarkers)
	}

	export const createRelativeEntityListFields = (
		field: SugaredRelativeEntityList,
		environment: Environment,
		entityFieldMarkers: EntityFieldMarkers,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) => {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(field, environment)
		const hasManyRelationMarker = createHasManyRelationMarker(
			relativeEntityList.hasManyRelation,
			entityFieldMarkers,
			preferences,
		)
		return wrapRelativeEntityFields(
			relativeEntityList.hasOneRelationPath,
			new Map([[hasManyRelationMarker.placeholderName, hasManyRelationMarker]]),
		)
	}

	export const createConnectionMarker = (
		field: SugaredRelativeSingleField,
		to: SugaredUniqueWhere,
		environment: Environment,
	) =>
		wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new ConnectionMarker(
					relativeSingleField.field,
					QueryLanguage.desugarUniqueWhere(to, environment),
					relativeSingleField.isNonbearing,
				),
		)

	export const createFieldMarker = (field: SugaredRelativeSingleField, environment: Environment) =>
		wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new FieldMarker(relativeSingleField.field, relativeSingleField.defaultValue, relativeSingleField.isNonbearing),
		)

	export const wrapRelativeSingleField = (
		field: SugaredRelativeSingleField,
		environment: Environment,
		getMarker: (relativeSingleField: RelativeSingleField) => Marker,
	): EntityFieldMarkers => {
		const relativeSingleField = QueryLanguage.desugarRelativeSingleField(field, environment)
		const placeholderName = PlaceholderGenerator.getFieldPlaceholder(relativeSingleField.field)

		return wrapRelativeEntityFields(
			relativeSingleField.hasOneRelationPath,
			new Map([[placeholderName, getMarker(relativeSingleField)]]),
		)
	}

	export const wrapRelativeEntityFields = (
		hasOneRelationPath: HasOneRelation[],
		entityFieldMarkers: EntityFieldMarkers,
	): EntityFieldMarkers => {
		for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
			const marker = createHasOneRelationMarker(hasOneRelationPath[i], entityFieldMarkers)
			entityFieldMarkers = new Map([[marker.placeholderName, marker]])
		}
		return entityFieldMarkers
	}

	export const createHasOneRelationMarker = (hasOneRelation: HasOneRelation, entityFieldMarkers: EntityFieldMarkers) =>
		new ReferenceMarker(
			hasOneRelation.field,
			ExpectedEntityCount.UpToOne,
			entityFieldMarkers,
			hasOneRelation.filter,
			hasOneRelation.reducedBy,
		)

	export const createHasManyRelationMarker = (
		hasManyRelation: HasManyRelation,
		entityFieldMarkers: EntityFieldMarkers,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) =>
		new ReferenceMarker(
			hasManyRelation.field,
			ExpectedEntityCount.PossiblyMany,
			entityFieldMarkers,
			hasManyRelation.filter,
			undefined, // No reducedBy for hasMany
			preferences,
		)
}
