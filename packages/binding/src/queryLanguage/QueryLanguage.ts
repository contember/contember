import { emptyObject } from '@contember/react-utils'
import { Environment } from '../dao'
import { TreeParameterMerger, VariableInputTransformer } from '../core'
import {
	Alias,
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	EntityCreationParametersDefaults,
	EntityListEventListeners,
	EntityListParameters,
	EntityListPreferencesDefaults,
	EntityName,
	FieldName,
	Filter,
	HasManyRelation,
	HasOneRelation,
	LeafFieldDefaults,
	QualifiedEntityList,
	QualifiedEntityParametersDefaults,
	QualifiedFieldList,
	QualifiedSingleEntity,
	RelationDefaults,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SingleEntityEventListeners,
	SugarableEntityListParameters,
	SugarableHasManyRelation,
	SugarableHasOneRelation,
	SugaredFilter,
	SugaredQualifiedEntityList,
	SugaredQualifiedFieldList,
	SugaredQualifiedSingleEntity,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
	SugaredSetOnCreate,
	SugaredUnconstrainedQualifiedEntityList,
	SugaredUnconstrainedQualifiedSingleEntity,
	UnconstrainedQualifiedEntityList,
	UnconstrainedQualifiedSingleEntity,
	UniqueWhere,
	UnsugarableEntityListEventListeners,
	UnsugarableEntityListParameters,
	UnsugarableHasManyRelation,
	UnsugarableHasOneRelation,
	UnsugarableSingleEntityEventListeners,
} from '../treeParameters'
import { Parser } from './Parser'

export namespace QueryLanguage {
	const preparePrimitiveEntryPoint = <Entry extends Parser.EntryPoint>(entryPoint: Entry) => (
		input: string | Parser.ParserResult[Entry],
		environment: Environment,
	): Parser.ParserResult[Entry] => {
		if (typeof input === 'string') {
			return Parser.parseQueryLanguageExpression(input, entryPoint, environment)
		}
		return input
	}

	const desugarSugarableUnconstrainedQualifiedEntityList = preparePrimitiveEntryPoint(
		Parser.EntryPoint.UnconstrainedQualifiedEntityList,
	)
	const desugarSugarableUnconstrainedQualifiedSingleEntity = preparePrimitiveEntryPoint(
		Parser.EntryPoint.UnconstrainedQualifiedEntityList,
	)
	const desugarSugarableQualifiedEntityList = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedEntityList)
	const desugarSugarableQualifiedFieldList = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedFieldList)
	const desugarSugarableQualifiedSingleEntity = preparePrimitiveEntryPoint(Parser.EntryPoint.QualifiedSingleEntity)
	const desugarSugarableRelativeEntityList = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeEntityList)
	const desugarSugarableRelativeSingleEntity = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeSingleEntity)
	const desugarSugarableRelativeSingleField = preparePrimitiveEntryPoint(Parser.EntryPoint.RelativeSingleField)

	const desugarEntityListParameters = (
		sugarablePart: SugarableEntityListParameters,
		unsugarablePart: UnsugarableEntityListParameters,
		environment: Environment,
	): EntityListParameters => ({
		filter: sugarablePart.filter ? desugarFilter(sugarablePart.filter, environment) : undefined,
		limit: unsugarablePart.limit,
		offset: unsugarablePart.offset,
		orderBy: unsugarablePart.orderBy ? desugarOrderBy(unsugarablePart.orderBy, environment) : undefined,
		initialEntityCount: unsugarablePart.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
	})

	export const desugarSetOnCreate = (setOnCreate: SugaredSetOnCreate, environment: Environment): UniqueWhere => {
		if (Array.isArray(setOnCreate)) {
			const whereList = setOnCreate.map(connection => desugarUniqueWhere(connection, environment))
			return whereList.reduce(
				(accumulator, uniqueWhere) => TreeParameterMerger.mergeSetOnCreate(accumulator, uniqueWhere)!,
			)
		}
		if (typeof setOnCreate === 'string') {
			return desugarUniqueWhere(setOnCreate, environment)
		}
		return setOnCreate
	}

	function desugarEventListener<F extends Function>(listener: F | Set<F>): Set<F>
	function desugarEventListener<F extends Function>(listener: F | Set<F> | undefined): Set<F> | undefined
	function desugarEventListener<F extends Function>(listener: F | Set<F> | undefined): Set<F> | undefined {
		if (typeof listener === 'function') {
			return new Set([listener])
		}
		return listener
	}

	const desugarSingleEntityEventListeners = (
		unsugarable: UnsugarableSingleEntityEventListeners,
	): SingleEntityEventListeners['eventListeners'] => {
		const connectionUpdate = unsugarable.onConnectionUpdate
			? new Map(
					Object.entries(unsugarable.onConnectionUpdate).map(([fieldName, listener]) => [
						fieldName,
						desugarEventListener(listener),
					]),
			  )
			: undefined

		return {
			beforePersist: desugarEventListener(unsugarable.onBeforePersist),
			beforeUpdate: desugarEventListener(unsugarable.onBeforeUpdate),
			connectionUpdate,
			initialize: desugarEventListener(unsugarable.onInitialize),
			persistError: desugarEventListener(unsugarable.onPersistError),
			persistSuccess: desugarEventListener(unsugarable.onPersistSuccess),
			update: desugarEventListener(unsugarable.onUpdate),
		}
	}

	const desugarEntityListEventListeners = (
		unsugarable: UnsugarableEntityListEventListeners,
	): EntityListEventListeners['eventListeners'] => {
		return {
			beforePersist: desugarEventListener(unsugarable.onBeforePersist),
			beforeUpdate: desugarEventListener(unsugarable.onBeforeUpdate),
			childInitialize: desugarEventListener(unsugarable.onChildInitialize),
			initialize: desugarEventListener(unsugarable.onInitialize),
			persistError: desugarEventListener(unsugarable.onPersistError),
			persistSuccess: desugarEventListener(unsugarable.onPersistSuccess),
			update: desugarEventListener(unsugarable.onUpdate),
		}
	}

	const desugarSubTreeAlias = (alias: Alias | Set<Alias> | undefined): Set<Alias> | undefined => {
		if (alias === undefined) {
			return undefined
		}
		if (alias instanceof Set) {
			return alias
		}
		return new Set<Alias>().add(alias)
	}

	const desugarHasOneRelation = (
		sugarable: SugarableHasOneRelation,
		unsugarable: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation => ({
		field: sugarable.field,
		filter: sugarable.filter ? desugarFilter(sugarable.filter, environment) : undefined,
		expectedMutation: unsugarable.expectedMutation ?? RelationDefaults.expectedMutation,
		reducedBy: sugarable.reducedBy ? desugarUniqueWhere(sugarable.reducedBy, environment) : undefined,
		setOnCreate: unsugarable.setOnCreate ? desugarSetOnCreate(unsugarable.setOnCreate, environment) : undefined,
		isNonbearing: unsugarable.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
		// forceCreation: unsugarable.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
		eventListeners: desugarSingleEntityEventListeners(unsugarable),
	})

	const augmentDesugaredHasOneRelationPath = (
		path: DesugaredHasOneRelation[],
		unsugarable: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation[] =>
		path.map((desugaredHasOneRelation, i) =>
			// Unsugarable applies to the last
			desugarHasOneRelation(desugaredHasOneRelation, i === path.length - 1 ? unsugarable : {}, environment),
		)

	const augmentDesugaredHasManyRelation = (
		relation: DesugaredHasManyRelation,
		unsugarable: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation => ({
		field: relation.field,
		filter: relation.filter,
		expectedMutation: unsugarable.expectedMutation ?? RelationDefaults.expectedMutation,
		isNonbearing: unsugarable.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
		// forceCreation: unsugarable.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
		initialEntityCount: unsugarable.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
		setOnCreate: unsugarable.setOnCreate ? desugarSetOnCreate(unsugarable.setOnCreate, environment) : undefined,
		orderBy: unsugarable.orderBy ? desugarOrderBy(unsugarable.orderBy, environment) : undefined,
		offset: unsugarable.offset,
		limit: unsugarable.limit,
		eventListeners: desugarEntityListEventListeners(unsugarable),
	})

	const desugarHasOneRelationPath = (
		input: SugarableHasOneRelation[] | SugarableHasOneRelation | undefined,
		lastRelation: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation[] => {
		if (input === undefined) {
			input = []
		} else if (!Array.isArray(input)) {
			input = [input]
		}

		const relationPath: HasOneRelation[] = []

		const cappedLength = input.length - 1
		let i = 0
		for (; i < cappedLength; i++) {
			// Deliberately leaving out the last element
			const pathNode = input[i]

			relationPath.push(desugarHasOneRelation(pathNode, {}, environment))
		}
		if (i in input) {
			relationPath.push(desugarHasOneRelation(input[i], lastRelation, environment))
		}

		return relationPath
	}

	const desugarHasManyRelation = (
		sugarablePart: SugarableHasManyRelation,
		unsugarablePart: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation => ({
		...desugarEntityListParameters(sugarablePart, unsugarablePart, environment),
		expectedMutation: unsugarablePart.expectedMutation ?? RelationDefaults.expectedMutation,
		setOnCreate: unsugarablePart.setOnCreate ? desugarSetOnCreate(unsugarablePart.setOnCreate, environment) : undefined,
		field: sugarablePart.field,
		isNonbearing: unsugarablePart.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
		// forceCreation: unsugarablePart.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
		eventListeners: desugarEntityListEventListeners(unsugarablePart),
	})

	export const desugarUniqueWhere = preparePrimitiveEntryPoint(Parser.EntryPoint.UniqueWhere)
	export const desugarFilter: (
		input: string | Parser.ParserResult[Parser.EntryPoint.Filter],
		environment: Environment,
	) => Parser.ParserResult[Parser.EntryPoint.Filter] = preparePrimitiveEntryPoint(Parser.EntryPoint.Filter)
	export const desugarOrderBy = preparePrimitiveEntryPoint(Parser.EntryPoint.OrderBy)

	export const desugarUnconstrainedQualifiedEntityList = (
		{ entities, ...unsugarableEntityList }: SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): UnconstrainedQualifiedEntityList => {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entities === 'string') {
			const desugared = desugarSugarableUnconstrainedQualifiedEntityList(entities, environment)
			entityName = desugared.entityName
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, emptyObject, environment)
		} else {
			entityName = entities.entityName
			hasOneRelationPath = desugarHasOneRelationPath(entities.hasOneRelationPath, emptyObject, environment)
		}

		return {
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: desugarEntityListEventListeners(unsugarableEntityList),
			initialEntityCount: unsugarableEntityList.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
			alias: desugarSubTreeAlias(unsugarableEntityList.alias),
			entityName,
			hasOneRelationPath,
		}
	}

	export const desugarUnconstrainedQualifiedSingleEntity = (
		{ entity, ...unsugarableSingleEntity }: SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): UnconstrainedQualifiedSingleEntity => {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entity === 'string') {
			const desugared = desugarSugarableUnconstrainedQualifiedSingleEntity(entity, environment)
			entityName = desugared.entityName
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(
				desugared.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		} else {
			entityName = entity.entityName
			hasOneRelationPath = desugarHasOneRelationPath(entity.hasOneRelationPath, unsugarableSingleEntity, environment)
		}

		return {
			isNonbearing: unsugarableSingleEntity.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableSingleEntity.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableSingleEntity.setOnCreate
				? desugarSetOnCreate(unsugarableSingleEntity.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableSingleEntity.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: desugarSingleEntityEventListeners(unsugarableSingleEntity),
			alias: desugarSubTreeAlias(unsugarableSingleEntity.alias),
			entityName,
			hasOneRelationPath,
		}
	}

	export const desugarQualifiedEntityList = (
		{ entities, ...unsugarableEntityList }: SugaredQualifiedEntityList,
		environment: Environment,
	): QualifiedEntityList => {
		let entityName: EntityName
		let hasOneRelationPath: HasOneRelation[]

		let filter: SugaredFilter | undefined

		if (typeof entities === 'string') {
			const desugared = desugarSugarableQualifiedEntityList(entities, environment)

			entityName = desugared.entityName
			filter = desugared.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, emptyObject, environment)
		} else {
			entityName = entities.entityName
			filter = entities.filter
			hasOneRelationPath = desugarHasOneRelationPath(entities.hasOneRelationPath, emptyObject, environment)
		}

		return {
			entityName,
			hasOneRelationPath,
			...desugarEntityListParameters(
				{
					filter,
				},
				unsugarableEntityList,
				environment,
			),
			alias: desugarSubTreeAlias(unsugarableEntityList.alias),
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: desugarEntityListEventListeners(unsugarableEntityList),
		}
	}

	export const desugarQualifiedFieldList = (
		{ fields, ...unsugarableFieldList }: SugaredQualifiedFieldList,
		environment: Environment,
	): QualifiedFieldList => {
		let field: FieldName
		let entityName: EntityName
		let filter: SugaredFilter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof fields === 'string') {
			const desugared = desugarSugarableQualifiedFieldList(fields, environment)

			field = desugared.field
			entityName = desugared.entityName
			filter = desugared.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugared.hasOneRelationPath, emptyObject, environment)
		} else {
			field = fields.field
			entityName = fields.entityName
			filter = fields.filter
			hasOneRelationPath = desugarHasOneRelationPath(fields.hasOneRelationPath, emptyObject, environment)
		}

		return {
			field,
			entityName,
			hasOneRelationPath,
			alias: desugarSubTreeAlias(unsugarableFieldList.alias),
			isNonbearing: unsugarableFieldList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableFieldList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableFieldList.setOnCreate
				? desugarSetOnCreate(unsugarableFieldList.setOnCreate, environment)
				: undefined,
			defaultValue:
				unsugarableFieldList.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableFieldList.defaultValue, environment)
					: undefined,
			expectedMutation: unsugarableFieldList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: desugarEntityListEventListeners(unsugarableFieldList),
			...desugarEntityListParameters(
				{
					filter,
				},
				unsugarableFieldList,
				environment,
			),
		}
	}

	export const desugarQualifiedSingleEntity = (
		{ entity, ...unsugarableSingleEntity }: SugaredQualifiedSingleEntity,
		environment: Environment,
	): QualifiedSingleEntity => {
		let entityName: EntityName
		let where: UniqueWhere
		let filter: Filter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof entity === 'string') {
			const desugaredEntity = desugarSugarableQualifiedSingleEntity(entity, environment)

			entityName = desugaredEntity.entityName
			where = desugaredEntity.where
			filter = desugaredEntity.filter
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(
				desugaredEntity.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		} else {
			entityName = entity.entityName
			where = desugarUniqueWhere(entity.where, environment)
			filter = entity.filter ? desugarFilter(entity.filter, environment) : undefined
			hasOneRelationPath = desugarHasOneRelationPath(entity.hasOneRelationPath, unsugarableSingleEntity, environment)
		}

		// const forceCreation: boolean =
		// 	unsugarableSingleEntity.forceCreation !== undefined
		// 		? unsugarableSingleEntity.forceCreation !== undefined
		// 		: EntityCreationParametersDefaults.forceCreation
		const setOnCreate: UniqueWhere | undefined =
			unsugarableSingleEntity.setOnCreate !== undefined
				? desugarSetOnCreate(unsugarableSingleEntity.setOnCreate, environment)
				: undefined
		const isNonbearing: boolean =
			unsugarableSingleEntity.isNonbearing !== undefined
				? unsugarableSingleEntity.isNonbearing
				: EntityCreationParametersDefaults.isNonbearing
		const eventListeners = desugarSingleEntityEventListeners(unsugarableSingleEntity)
		const expectedMutation =
			unsugarableSingleEntity.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation
		const alias = desugarSubTreeAlias(unsugarableSingleEntity.alias)

		return {
			alias,
			entityName,
			where,
			filter,
			hasOneRelationPath,
			// forceCreation,
			setOnCreate,
			isNonbearing,
			eventListeners,
			expectedMutation,
		}
	}

	export const desugarRelativeSingleEntity = (
		sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
		environment: Environment,
	): RelativeSingleEntity => {
		if (typeof sugaredRelativeSingleEntity === 'string') {
			return desugarRelativeSingleEntity(
				{
					field: sugaredRelativeSingleEntity,
				},
				environment,
			)
		}

		const { field, ...unsugarableEntity } = sugaredRelativeSingleEntity
		const hasOneRelationPath =
			typeof field === 'string'
				? augmentDesugaredHasOneRelationPath(
						desugarSugarableRelativeSingleEntity(field, environment).hasOneRelationPath,
						unsugarableEntity,
						environment,
				  )
				: desugarHasOneRelationPath(field, unsugarableEntity, environment)

		return {
			hasOneRelationPath,
		}
	}

	export const desugarRelativeSingleField = (
		sugaredRelativeSingleField: string | SugaredRelativeSingleField,
		environment: Environment,
	): RelativeSingleField => {
		if (typeof sugaredRelativeSingleField === 'string') {
			return desugarRelativeSingleField(
				{
					field: sugaredRelativeSingleField,
				},
				environment,
			)
		}

		const { field, ...unsugarableField } = sugaredRelativeSingleField

		let hasOneRelationPath: HasOneRelation[]
		let fieldName: FieldName
		if (typeof field === 'string') {
			const desugaredField = desugarSugarableRelativeSingleField(field, environment)
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(
				desugaredField.hasOneRelationPath,
				unsugarableField,
				environment,
			)
			fieldName = desugaredField.field
		} else {
			hasOneRelationPath = desugarHasOneRelationPath(field.hasOneRelationPath, unsugarableField, environment)
			fieldName = field.field
		}

		return {
			hasOneRelationPath,
			field: fieldName,
			isNonbearing: unsugarableField.isNonbearing ?? LeafFieldDefaults.isNonbearing,
			defaultValue:
				unsugarableField.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableField.defaultValue, environment)
					: undefined,
		}
	}

	export const desugarRelativeEntityList = (
		sugaredRelativeEntityList: string | SugaredRelativeEntityList,
		environment: Environment,
	): RelativeEntityList => {
		if (typeof sugaredRelativeEntityList === 'string') {
			return desugarRelativeEntityList(
				{
					field: sugaredRelativeEntityList,
				},
				environment,
			)
		}

		const { field, ...unsugarableEntityList } = sugaredRelativeEntityList
		let hasOneRelationPath: HasOneRelation[]
		let hasManyRelation: HasManyRelation
		if (typeof field === 'string') {
			const desugaredField = desugarSugarableRelativeEntityList(field, environment)
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(
				desugaredField.hasOneRelationPath,
				emptyObject,
				environment,
			)
			hasManyRelation = augmentDesugaredHasManyRelation(
				desugaredField.hasManyRelation,
				unsugarableEntityList,
				environment,
			)
		} else {
			hasOneRelationPath = desugarHasOneRelationPath(field.hasOneRelationPath || [], emptyObject, environment)
			hasManyRelation = desugarHasManyRelation(field.hasManyRelation, unsugarableEntityList, environment)
		}

		return {
			hasManyRelation,
			hasOneRelationPath,
		}
	}
}
