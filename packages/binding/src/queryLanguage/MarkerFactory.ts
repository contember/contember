import { Environment } from '../dao'
import {
	ConnectionMarker,
	EntityFields,
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
	SubTreeIdentifier,
	SugaredQualifiedEntityList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUniqueWhere,
} from '../treeParameters'
import { QueryLanguage } from './QueryLanguage'

export namespace MarkerFactory {
	export const createSingleEntityMarkerTreeRoot = (
		environment: Environment,
		singleEntity: SugaredQualifiedSingleEntity,
		fields: EntityFields,
		subTreeIdentifier?: SubTreeIdentifier,
	) => {
		const qualifiedSingleEntity = QueryLanguage.desugarQualifiedSingleEntity(singleEntity, environment)
		return new MarkerTreeRoot<TaggedQualifiedSingleEntity>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...qualifiedSingleEntity,
				type: 'unique',
			},
			fields,
			subTreeIdentifier,
		)
	}

	export const createEntityListMarkerTreeRoot = (
		environment: Environment,
		entityList: SugaredQualifiedEntityList,
		fields: EntityFields,
		subTreeIdentifier?: SubTreeIdentifier,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarQualifiedEntityList(entityList, environment)

		return new MarkerTreeRoot<TaggedQualifiedEntityList>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...qualifiedEntityList,
				type: 'nonUnique',
			},
			wrapRelativeEntityFields(qualifiedEntityList.hasOneRelationPath, fields),
			subTreeIdentifier,
		)
	}

	export const createUnconstrainedMarkerTreeRoot = (
		environment: Environment,
		entityList: SugaredUnconstrainedQualifiedEntityList,
		fields: EntityFields,
	) => {
		const qualifiedEntityList = QueryLanguage.desugarUnconstrainedQualifiedEntityList(entityList, environment)

		return new MarkerTreeRoot<TaggedUnconstrainedQualifiedEntityList>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...qualifiedEntityList,
				type: 'unconstrained',
			},
			fields,
			undefined,
		)
	}

	export const createRelativeSingleEntityFields = (
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		entityFields: EntityFields,
	) => {
		const relativeSingleEntity = QueryLanguage.desugarRelativeSingleEntity(field, environment)
		return wrapRelativeEntityFields(relativeSingleEntity.hasOneRelationPath, entityFields)
	}

	export const createRelativeEntityListFields = (
		field: SugaredRelativeEntityList,
		environment: Environment,
		entityFields: EntityFields,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) => {
		const relativeEntityList = QueryLanguage.desugarRelativeEntityList(field, environment)
		const hasManyRelationMarker = createHasManyRelationMarker(
			relativeEntityList.hasManyRelation,
			entityFields,
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
	): EntityFields => {
		const relativeSingleField = QueryLanguage.desugarRelativeSingleField(field, environment)
		const placeholderName = PlaceholderGenerator.getFieldPlaceholder(relativeSingleField.field)

		return wrapRelativeEntityFields(
			relativeSingleField.hasOneRelationPath,
			new Map([[placeholderName, getMarker(relativeSingleField)]]),
		)
	}

	export const wrapRelativeEntityFields = (
		hasOneRelationPath: HasOneRelation[],
		entityFields: EntityFields,
	): EntityFields => {
		for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
			const marker = createHasOneRelationMarker(hasOneRelationPath[i], entityFields)
			entityFields = new Map([[marker.placeholderName, marker]])
		}
		return entityFields
	}

	export const createHasOneRelationMarker = (hasOneRelation: HasOneRelation, entityFields: EntityFields) =>
		new ReferenceMarker(
			hasOneRelation.field,
			ExpectedEntityCount.UpToOne,
			entityFields,
			hasOneRelation.filter,
			hasOneRelation.reducedBy,
		)

	export const createHasManyRelationMarker = (
		hasManyRelation: HasManyRelation,
		entityFields: EntityFields,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) =>
		new ReferenceMarker(
			hasManyRelation.field,
			ExpectedEntityCount.PossiblyMany,
			entityFields,
			hasManyRelation.filter,
			undefined,
			preferences,
		)
}
