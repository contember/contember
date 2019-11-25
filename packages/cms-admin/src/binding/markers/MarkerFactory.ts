import { Environment } from '../dao'
import { VariableInputTransformer } from '../model'
import { QueryLanguage } from '../queryLanguage'
import {
	ExpectedEntityCount,
	HasManyRelation,
	HasOneRelation,
	OptionallyVariableFieldValue,
	RelativeSingleField,
	SubTreeIdentifier,
	SugaredEntityListTreeConstraints,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredSingleEntityTreeConstraints,
	SugaredUniqueWhere,
} from '../treeParameters'
import {
	ConnectionMarker,
	EntityFields,
	FieldMarker,
	Marker,
	MarkerTreeRoot,
	ReferenceMarker,
	TaggedEntityListTreeConstraints,
	TaggedSingleEntityTreeConstraints,
} from './index'
import { PlaceholderGenerator } from './PlaceholderGenerator'

export namespace MarkerFactory {
	export const createSingleEntityMarkerTreeRoot = (
		environment: Environment,
		constraints: SugaredSingleEntityTreeConstraints,
		fields: EntityFields,
		subTreeIdentifier?: SubTreeIdentifier,
	): MarkerTreeRoot<TaggedSingleEntityTreeConstraints> =>
		new MarkerTreeRoot<TaggedSingleEntityTreeConstraints>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...constraints,
				where: QueryLanguage.parseUniqueWhere(constraints.where, environment),
				type: 'unique',
			},
			fields,
			subTreeIdentifier,
		)

	export const createEntityListMarkerTreeRoot = (
		environment: Environment,
		constraints: SugaredEntityListTreeConstraints,
		fields: EntityFields,
		subTreeIdentifier?: SubTreeIdentifier,
	): MarkerTreeRoot<TaggedEntityListTreeConstraints> =>
		new MarkerTreeRoot<TaggedEntityListTreeConstraints>(
			environment.getSystemVariable('treeIdFactory')(),
			{
				...constraints,
				orderBy: constraints.orderBy ? QueryLanguage.parseOrderBy(constraints.orderBy, environment) : undefined,
				filter: constraints.filter ? QueryLanguage.parseFilter(constraints.filter, environment) : undefined,
				type: 'nonUnique',
			},
			fields,
			subTreeIdentifier,
		)

	export const createRelativeSingleEntityFields = (
		field: SugaredRelativeSingleEntity,
		environment: Environment,
		entityFields: EntityFields,
	) => {
		const relativeSingleEntity = QueryLanguage.parseRelativeSingleEntity(field, environment)
		return wrapRelativeEntityFields(relativeSingleEntity.hasOneRelationPath, entityFields)
	}

	export const createRelativeEntityListFields = (
		field: SugaredRelativeEntityList,
		environment: Environment,
		entityFields: EntityFields,
		preferences?: Partial<ReferenceMarker.ReferencePreferences>,
	) => {
		const relativeEntityList = QueryLanguage.parseRelativeEntityList(field, environment)
		const hasManyRelationMarker = createHasManyRelationMarker(
			relativeEntityList.hasManyRelationPath,
			entityFields,
			preferences,
		)
		return wrapRelativeEntityFields(relativeEntityList.hasOneRelationPath, {
			[hasManyRelationMarker.placeholderName]: hasManyRelationMarker,
		})
	}

	export const createConnectionMarker = (
		field: SugaredRelativeSingleField,
		to: SugaredUniqueWhere,
		environment: Environment,
		isNonbearing: boolean = true,
	) =>
		wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new ConnectionMarker(
					relativeSingleField.fieldName,
					QueryLanguage.parseUniqueWhere(to, environment),
					isNonbearing,
				),
		)

	export const createFieldMarker = (
		field: SugaredRelativeSingleField,
		environment: Environment,
		defaultValue?: OptionallyVariableFieldValue,
		isNonbearing: boolean = false,
	) =>
		wrapRelativeSingleField(
			field,
			environment,
			relativeSingleField =>
				new FieldMarker(
					relativeSingleField.fieldName,
					defaultValue === undefined ? undefined : VariableInputTransformer.transformValue(defaultValue, environment),
					isNonbearing,
				),
		)

	export const wrapRelativeSingleField = (
		field: SugaredRelativeSingleField,
		environment: Environment,
		getMarker: (relativeSingleField: RelativeSingleField) => Marker,
	): EntityFields => {
		const relativeSingleField = QueryLanguage.parseRelativeSingleField(field, environment)
		const placeholderName = PlaceholderGenerator.getFieldPlaceholder(relativeSingleField.fieldName)

		return wrapRelativeEntityFields(relativeSingleField.hasOneRelationPath, {
			[placeholderName]: getMarker(relativeSingleField),
		})
	}

	export const wrapRelativeEntityFields = (
		hasOneRelationPath: HasOneRelation[],
		entityFields: EntityFields,
	): EntityFields => {
		for (let i = hasOneRelationPath.length - 1; i >= 0; i--) {
			const marker = createHasOneRelationMarker(hasOneRelationPath[i], entityFields)
			entityFields = {
				[marker.placeholderName]: marker,
			}
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
