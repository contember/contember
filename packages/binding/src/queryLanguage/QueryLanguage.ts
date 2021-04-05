import { emptyObject } from '@contember/react-utils'
import { TreeParameterMerger, VariableInputTransformer } from '../core'
import { Environment } from '../dao'
import {
	Alias,
	DesugaredHasManyRelation,
	DesugaredHasOneRelation,
	EntityCreationParametersDefaults,
	EntityEventListenerStore,
	EntityListEventListenerStore,
	EntityListParameters,
	EntityListPreferencesDefaults,
	EntityName,
	FieldEventListenerStore,
	FieldName,
	Filter,
	HasManyRelation,
	HasOneRelation,
	LeafFieldDefaults,
	ParentEntityParameters,
	QualifiedEntityList,
	QualifiedEntityParametersDefaults,
	QualifiedFieldList,
	QualifiedSingleEntity,
	RelationDefaults,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugarableEntityListParameters,
	SugarableHasManyRelation,
	SugarableHasOneRelation,
	SugaredFilter,
	SugaredParentEntityParameters,
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
	UnsugarableFieldEventListeners,
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
	): EntityEventListenerStore | undefined => {
		if (
			unsugarable.onBeforePersist === undefined &&
			unsugarable.onBeforeUpdate === undefined &&
			unsugarable.onInitialize === undefined &&
			unsugarable.onPersistError === undefined &&
			unsugarable.onPersistSuccess === undefined &&
			unsugarable.onUpdate === undefined
		) {
			return undefined
		}

		const store: EntityEventListenerStore = new Map()

		if (unsugarable.onConnectionUpdate) {
			store.set(
				'connectionUpdate',
				new Map(
					Object.entries(unsugarable.onConnectionUpdate).map(([fieldName, listener]) => [
						fieldName,
						desugarEventListener(listener),
					]),
				),
			)
		}

		const beforePersist = desugarEventListener(unsugarable.onBeforePersist)
		const beforeUpdate = desugarEventListener(unsugarable.onBeforeUpdate)
		const initialize = desugarEventListener(unsugarable.onInitialize)
		const persistError = desugarEventListener(unsugarable.onPersistError)
		const persistSuccess = desugarEventListener(unsugarable.onPersistSuccess)
		const update = desugarEventListener(unsugarable.onUpdate)

		if (beforePersist) {
			store.set('beforePersist', beforePersist)
		}
		if (beforeUpdate) {
			store.set('beforeUpdate', beforeUpdate)
		}
		if (initialize) {
			store.set('initialize', initialize)
		}
		if (persistError) {
			store.set('persistError', persistError)
		}
		if (persistSuccess) {
			store.set('persistSuccess', persistSuccess)
		}
		if (update) {
			store.set('update', update)
		}

		return store
	}

	const desugarEntityListEventListeners = (
		unsugarable: UnsugarableEntityListEventListeners,
	):
		| {
				eventListeners: EntityListEventListenerStore | undefined
				childEventListeners: EntityEventListenerStore | undefined
		  }
		| undefined => {
		if (
			unsugarable.onBeforePersist === undefined &&
			unsugarable.onBeforeUpdate === undefined &&
			unsugarable.onChildBeforeUpdate === undefined &&
			unsugarable.onChildInitialize === undefined &&
			unsugarable.onChildUpdate === undefined &&
			unsugarable.onInitialize === undefined &&
			unsugarable.onPersistError === undefined &&
			unsugarable.onPersistSuccess === undefined &&
			unsugarable.onUpdate === undefined
		) {
			return undefined
		}

		const eventListeners: EntityListEventListenerStore = new Map()

		const beforePersist = desugarEventListener(unsugarable.onBeforePersist)
		const beforeUpdate = desugarEventListener(unsugarable.onBeforeUpdate)
		const initialize = desugarEventListener(unsugarable.onInitialize)
		const persistError = desugarEventListener(unsugarable.onPersistError)
		const persistSuccess = desugarEventListener(unsugarable.onPersistSuccess)
		const update = desugarEventListener(unsugarable.onUpdate)

		if (beforePersist) {
			eventListeners.set('beforePersist', beforePersist)
		}
		if (beforeUpdate) {
			eventListeners.set('beforeUpdate', beforeUpdate)
		}
		if (initialize) {
			eventListeners.set('initialize', initialize)
		}
		if (persistError) {
			eventListeners.set('persistError', persistError)
		}
		if (persistSuccess) {
			eventListeners.set('persistSuccess', persistSuccess)
		}
		if (update) {
			eventListeners.set('update', update)
		}

		const childEventListeners: EntityEventListenerStore = new Map()

		const childBeforeUpdate = desugarEventListener(unsugarable.onChildBeforeUpdate)
		const childInitialize = desugarEventListener(unsugarable.onChildInitialize)
		const childUpdate = desugarEventListener(unsugarable.onChildUpdate)

		if (childBeforeUpdate) {
			childEventListeners.set('beforeUpdate', childBeforeUpdate)
		}
		if (childInitialize) {
			childEventListeners.set('initialize', childInitialize)
		}
		if (childUpdate) {
			childEventListeners.set('update', childUpdate)
		}

		return {
			eventListeners,
			childEventListeners,
		}
	}

	const desugarFieldEventListeners = (
		unsugarable: UnsugarableFieldEventListeners,
	): FieldEventListenerStore | undefined => {
		if (unsugarable.onBeforeUpdate === undefined && unsugarable.onUpdate === undefined) {
			return undefined
		}

		const store: FieldEventListenerStore = new Map()

		const beforeUpdate = desugarEventListener(unsugarable.onBeforeUpdate)
		const update = desugarEventListener(unsugarable.onUpdate)

		if (beforeUpdate) {
			store.set('beforeUpdate', beforeUpdate)
		}
		if (update) {
			store.set('update', update)
		}

		return store
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
	): HasManyRelation => {
		const eventListeners = desugarEntityListEventListeners(unsugarable)
		return {
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
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
		}
	}

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
	): HasManyRelation => {
		const eventListeners = desugarEntityListEventListeners(unsugarablePart)
		return {
			...desugarEntityListParameters(sugarablePart, unsugarablePart, environment),
			expectedMutation: unsugarablePart.expectedMutation ?? RelationDefaults.expectedMutation,
			setOnCreate: unsugarablePart.setOnCreate
				? desugarSetOnCreate(unsugarablePart.setOnCreate, environment)
				: undefined,
			field: sugarablePart.field,
			isNonbearing: unsugarablePart.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarablePart.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
		}
	}

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

		const eventListeners = desugarEntityListEventListeners(unsugarableEntityList)

		return {
			isCreating: true,
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
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
			isCreating: true,
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

		const eventListeners = desugarEntityListEventListeners(unsugarableEntityList)

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
			isCreating: false,
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
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
			defaultValue:
				unsugarableFieldList.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableFieldList.defaultValue, environment)
					: undefined,
			expectedMutation: unsugarableFieldList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: desugarFieldEventListeners(unsugarableFieldList),
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
			isCreating: false,
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

	export const desugarParentEntityParameters = (
		parentEntity: SugaredParentEntityParameters,
		environment: Environment,
	): ParentEntityParameters => ({
		eventListeners: desugarSingleEntityEventListeners(parentEntity),
	})

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
			hasOneRelationPath = augmentDesugaredHasOneRelationPath(desugaredField.hasOneRelationPath, {}, environment)
			fieldName = desugaredField.field
		} else {
			hasOneRelationPath = desugarHasOneRelationPath(field.hasOneRelationPath, {}, environment)
			fieldName = field.field
		}

		return {
			eventListeners: desugarFieldEventListeners(unsugarableField),
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
