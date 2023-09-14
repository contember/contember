import { TreeParameterMerger, VariableInputTransformer } from '../core'
import type { Environment } from '../dao'
import {
	Alias,
	EntityCreationParametersDefaults,
	EntityEventListenerStore,
	EntityListEventListenerStore,
	EntityListParameters,
	EntityListPreferencesDefaults,
	EntityName,
	EventListenersStore,
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
import { GraphQlLiteral } from '@contember/client'
import { ParsedHasManyRelation, ParsedHasOneRelation } from './ParserResults'

const emptyObject = Object.freeze({})

export class QueryLanguage {

	private static preparePrimitiveEntryPoint<Entry extends Parser.EntryPoint>(entryPoint: Entry) {
		return (input: string, environment: Environment): Parser.ParserResult[Entry] =>
			Parser.parseQueryLanguageExpression(input, entryPoint, environment)
	}

	private static preparePrimitiveEntryPointWithFallback<Entry extends Parser.EntryPoint>(entryPoint: Entry) {
		return (input: string | Parser.ParserResult[Entry], environment: Environment): Parser.ParserResult[Entry] => {
			if (typeof input === 'string') {
				return Parser.parseQueryLanguageExpression(input, entryPoint, environment)
			}
			return input
		}
	}

	private static parseUnconstrainedQualifiedEntityList = QueryLanguage.preparePrimitiveEntryPoint('unconstrainedQualifiedEntityList')
	private static parseUnconstrainedQualifiedSingleEntity = QueryLanguage.preparePrimitiveEntryPoint('unconstrainedQualifiedEntityList')
	private static parseQualifiedEntityList = QueryLanguage.preparePrimitiveEntryPoint('qualifiedEntityList')
	private static parseQualifiedFieldList = QueryLanguage.preparePrimitiveEntryPoint('qualifiedFieldList')
	private static parseQualifiedSingleEntity = QueryLanguage.preparePrimitiveEntryPoint('qualifiedSingleEntity')
	private static parseRelativeEntityList = QueryLanguage.preparePrimitiveEntryPoint('relativeEntityList')
	private static parseRelativeSingleEntity = QueryLanguage.preparePrimitiveEntryPoint('relativeSingleEntity')
	private static parseRelativeSingleField = QueryLanguage.preparePrimitiveEntryPoint('relativeSingleField')

	public static desugarUniqueWhere = QueryLanguage.preparePrimitiveEntryPointWithFallback('uniqueWhere')
	public static desugarFilter = QueryLanguage.preparePrimitiveEntryPointWithFallback('filter')
	public static desugarOrderBy = QueryLanguage.preparePrimitiveEntryPointWithFallback('orderBy')
	public static desugarTaggedMap = QueryLanguage.preparePrimitiveEntryPointWithFallback('taggedMap')


	private static desugarEntityListParameters(
		sugarablePart: SugarableEntityListParameters,
		unsugarablePart: UnsugarableEntityListParameters,
		environment: Environment,
	): EntityListParameters {
		return {
			filter: sugarablePart.filter ? this.desugarFilter(sugarablePart.filter, environment) : undefined,
			limit: unsugarablePart.limit,
			offset: unsugarablePart.offset,
			orderBy: unsugarablePart.orderBy ? this.desugarOrderBy(unsugarablePart.orderBy, environment) : undefined,
			initialEntityCount: unsugarablePart.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
		}
	}

	public static desugarSetOnCreate(setOnCreate: SugaredSetOnCreate, environment: Environment): UniqueWhere {
		if (Array.isArray(setOnCreate)) {
			const whereList = setOnCreate.map(connection => this.desugarUniqueWhere(connection, environment))
			return whereList.reduce(
				(accumulator, uniqueWhere) => TreeParameterMerger.mergeSetOnCreate(accumulator, uniqueWhere)!,
			)
		}
		if (typeof setOnCreate === 'string') {
			return this.desugarUniqueWhere(setOnCreate, environment)
		}
		return setOnCreate
	}

	public static desugarEventListener<F extends Function>(listener: F | Set<F>): Set<F>
	public static desugarEventListener<F extends Function>(listener: F | Set<F> | undefined): Set<F> | undefined
	public static desugarEventListener<F extends Function>(listener: F | Set<F> | undefined): Set<F> | undefined {
		if (typeof listener === 'function') {
			return new Set([listener])
		}
		return listener
	}

	private static desugarSingleEntityEventListeners(
		unsugarable: UnsugarableSingleEntityEventListeners,
	): EntityEventListenerStore | undefined {
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

		const store: EntityEventListenerStore = new EventListenersStore()

		if (unsugarable.onConnectionUpdate) {
			for (const fieldName in unsugarable.onConnectionUpdate) {
				const listener = this.desugarEventListener(unsugarable.onConnectionUpdate[fieldName])
				store.set({ type: 'connectionUpdate', key: fieldName }, listener)
			}
		}

		const beforePersist = this.desugarEventListener(unsugarable.onBeforePersist)
		const beforeUpdate = this.desugarEventListener(unsugarable.onBeforeUpdate)
		const initialize = this.desugarEventListener(unsugarable.onInitialize)
		const persistError = this.desugarEventListener(unsugarable.onPersistError)
		const persistSuccess = this.desugarEventListener(unsugarable.onPersistSuccess)
		const update = this.desugarEventListener(unsugarable.onUpdate)

		if (beforePersist) {
			store.set({ type: 'beforePersist' }, beforePersist)
		}
		if (beforeUpdate) {
			store.set({ type: 'beforeUpdate' }, beforeUpdate)
		}
		if (initialize) {
			store.set({ type: 'initialize' }, initialize)
		}
		if (persistError) {
			store.set({ type: 'persistError' }, persistError)
		}
		if (persistSuccess) {
			store.set({ type: 'persistSuccess' }, persistSuccess)
		}
		if (update) {
			store.set({ type: 'update' }, update)
		}

		return store
	}

	private static desugarEntityListEventListeners(unsugarable: UnsugarableEntityListEventListeners):
		| {
				eventListeners: EntityListEventListenerStore | undefined
				childEventListeners: EntityEventListenerStore | undefined
		  }
		| undefined {
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

		const eventListeners: EntityListEventListenerStore = new EventListenersStore()

		const beforePersist = this.desugarEventListener(unsugarable.onBeforePersist)
		const beforeUpdate = this.desugarEventListener(unsugarable.onBeforeUpdate)
		const initialize = this.desugarEventListener(unsugarable.onInitialize)
		const persistError = this.desugarEventListener(unsugarable.onPersistError)
		const persistSuccess = this.desugarEventListener(unsugarable.onPersistSuccess)
		const update = this.desugarEventListener(unsugarable.onUpdate)

		if (beforePersist) {
			eventListeners.set({ type: 'beforePersist' }, beforePersist)
		}
		if (beforeUpdate) {
			eventListeners.set({ type: 'beforeUpdate' }, beforeUpdate)
		}
		if (initialize) {
			eventListeners.set({ type: 'initialize' }, initialize)
		}
		if (persistError) {
			eventListeners.set({ type: 'persistError' }, persistError)
		}
		if (persistSuccess) {
			eventListeners.set({ type: 'persistSuccess' }, persistSuccess)
		}
		if (update) {
			eventListeners.set({ type: 'update' }, update)
		}

		const childEventListeners: EntityEventListenerStore = new EventListenersStore()

		const childBeforeUpdate = this.desugarEventListener(unsugarable.onChildBeforeUpdate)
		const childInitialize = this.desugarEventListener(unsugarable.onChildInitialize)
		const childUpdate = this.desugarEventListener(unsugarable.onChildUpdate)

		if (childBeforeUpdate) {
			childEventListeners.set({ type: 'beforeUpdate' }, childBeforeUpdate)
		}
		if (childInitialize) {
			childEventListeners.set({ type: 'initialize' }, childInitialize)
		}
		if (childUpdate) {
			childEventListeners.set({ type: 'update' }, childUpdate)
		}

		return {
			eventListeners,
			childEventListeners,
		}
	}

	private static desugarFieldEventListeners(
		unsugarable: UnsugarableFieldEventListeners,
	): FieldEventListenerStore | undefined {
		if (unsugarable.onBeforeUpdate === undefined && unsugarable.onUpdate === undefined) {
			return undefined
		}

		const store: FieldEventListenerStore = new EventListenersStore()

		const beforeUpdate = this.desugarEventListener(unsugarable.onBeforeUpdate)
		const update = this.desugarEventListener(unsugarable.onUpdate)

		if (beforeUpdate) {
			store.set({ type: 'beforeUpdate' }, beforeUpdate)
		}
		if (update) {
			store.set({ type: 'update' }, update)
		}

		return store
	}

	private static desugarSubTreeAlias(alias: Alias | Set<Alias> | undefined): Set<Alias> | undefined {
		if (alias === undefined) {
			return undefined
		}
		if (alias instanceof Set) {
			return alias
		}
		return new Set<Alias>().add(alias)
	}

	private static desugarHasOneRelation(
		sugarable: SugarableHasOneRelation,
		unsugarable: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation {
		return {
			field: sugarable.field,
			filter: sugarable.filter ? this.desugarFilter(sugarable.filter, environment) : undefined,
			expectedMutation: unsugarable.expectedMutation ?? RelationDefaults.expectedMutation,
			reducedBy: sugarable.reducedBy ? this.desugarUniqueWhere(sugarable.reducedBy, environment) : undefined,
			setOnCreate: unsugarable.setOnCreate ? this.desugarSetOnCreate(unsugarable.setOnCreate, environment) : undefined,
			isNonbearing: unsugarable.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarable.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			eventListeners: this.desugarSingleEntityEventListeners(unsugarable),
		}
	}

	private static augmentDesugaredHasOneRelationPath(
		path: ParsedHasOneRelation[],
		unsugarable: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation[] {
		return path.map((desugaredHasOneRelation, i) =>
			// Unsugarable applies to the last
			this.desugarHasOneRelation(desugaredHasOneRelation, i === path.length - 1 ? unsugarable : {}, environment),
		)
	}

	private static augmentDesugaredHasManyRelation(
		relation: ParsedHasManyRelation,
		unsugarable: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation {
		const eventListeners = this.desugarEntityListEventListeners(unsugarable)
		return {
			field: relation.field,
			filter: relation.filter,
			expectedMutation: unsugarable.expectedMutation ?? RelationDefaults.expectedMutation,
			isNonbearing: unsugarable.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarable.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			initialEntityCount: unsugarable.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
			setOnCreate: unsugarable.setOnCreate ? this.desugarSetOnCreate(unsugarable.setOnCreate, environment) : undefined,
			orderBy: unsugarable.orderBy ? this.desugarOrderBy(unsugarable.orderBy, environment) : undefined,
			offset: unsugarable.offset,
			limit: unsugarable.limit,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
		}
	}

	private static desugarHasOneRelationPath(
		input: SugarableHasOneRelation[] | SugarableHasOneRelation | undefined,
		lastRelation: UnsugarableHasOneRelation,
		environment: Environment,
	): HasOneRelation[] {
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

			relationPath.push(this.desugarHasOneRelation(pathNode, {}, environment))
		}
		if (i in input) {
			relationPath.push(this.desugarHasOneRelation(input[i], lastRelation, environment))
		}

		return relationPath
	}

	private static desugarHasManyRelation(
		sugarablePart: SugarableHasManyRelation,
		unsugarablePart: UnsugarableHasManyRelation,
		environment: Environment,
	): HasManyRelation {
		const eventListeners = this.desugarEntityListEventListeners(unsugarablePart)
		return {
			...this.desugarEntityListParameters(sugarablePart, unsugarablePart, environment),
			expectedMutation: unsugarablePart.expectedMutation ?? RelationDefaults.expectedMutation,
			setOnCreate: unsugarablePart.setOnCreate
				? this.desugarSetOnCreate(unsugarablePart.setOnCreate, environment)
				: undefined,
			field: sugarablePart.field,
			isNonbearing: unsugarablePart.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarablePart.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
		}
	}

	public static desugarUnconstrainedQualifiedEntityList(
		{ entities, ...unsugarableEntityList }: SugaredUnconstrainedQualifiedEntityList,
		environment: Environment,
	): UnconstrainedQualifiedEntityList {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entities === 'string') {
			const parsed = this.parseUnconstrainedQualifiedEntityList(entities, environment)
			entityName = parsed.entityName
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				emptyObject,
				environment,
			)
		} else {
			entityName = entities.entityName
			hasOneRelationPath = this.desugarHasOneRelationPath(entities.hasOneRelationPath, emptyObject, environment)
		}

		const eventListeners = this.desugarEntityListEventListeners(unsugarableEntityList)

		return {
			isCreating: true,
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? this.desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
			initialEntityCount: unsugarableEntityList.initialEntityCount ?? EntityListPreferencesDefaults.initialEntityCount,
			alias: this.desugarSubTreeAlias(unsugarableEntityList.alias),
			entityName,
			hasOneRelationPath,
		}
	}

	public static desugarUnconstrainedQualifiedSingleEntity(
		{ entity, ...unsugarableSingleEntity }: SugaredUnconstrainedQualifiedSingleEntity,
		environment: Environment,
	): UnconstrainedQualifiedSingleEntity {
		let hasOneRelationPath: HasOneRelation[]
		let entityName: EntityName

		if (typeof entity === 'string') {
			const parsed = this.parseUnconstrainedQualifiedSingleEntity(entity, environment)
			entityName = parsed.entityName
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		} else {
			entityName = entity.entityName
			hasOneRelationPath = this.desugarHasOneRelationPath(
				entity.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		}

		return {
			isCreating: true,
			isNonbearing: unsugarableSingleEntity.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableSingleEntity.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableSingleEntity.setOnCreate
				? this.desugarSetOnCreate(unsugarableSingleEntity.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableSingleEntity.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: this.desugarSingleEntityEventListeners(unsugarableSingleEntity),
			alias: this.desugarSubTreeAlias(unsugarableSingleEntity.alias),
			entityName,
			hasOneRelationPath,
		}
	}

	public static desugarQualifiedEntityList(
		{ entities, ...unsugarableEntityList }: SugaredQualifiedEntityList,
		environment: Environment,
	): QualifiedEntityList {
		let entityName: EntityName
		let hasOneRelationPath: HasOneRelation[]

		let filter: SugaredFilter | undefined

		if (typeof entities === 'string') {
			const parsed = this.parseQualifiedEntityList(entities, environment)

			entityName = parsed.entityName
			filter = parsed.filter
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				emptyObject,
				environment,
			)
		} else {
			entityName = entities.entityName
			filter = entities.filter
			hasOneRelationPath = this.desugarHasOneRelationPath(entities.hasOneRelationPath, emptyObject, environment)
		}

		const eventListeners = this.desugarEntityListEventListeners(unsugarableEntityList)

		return {
			entityName,
			hasOneRelationPath,
			...this.desugarEntityListParameters(
				{
					filter,
				},
				unsugarableEntityList,
				environment,
			),
			alias: this.desugarSubTreeAlias(unsugarableEntityList.alias),
			isCreating: false,
			isNonbearing: unsugarableEntityList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableEntityList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			setOnCreate: unsugarableEntityList.setOnCreate
				? this.desugarSetOnCreate(unsugarableEntityList.setOnCreate, environment)
				: undefined,
			expectedMutation: unsugarableEntityList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			childEventListeners: eventListeners?.childEventListeners,
			eventListeners: eventListeners?.eventListeners,
		}
	}

	public static desugarQualifiedFieldList(
		{ fields, ...unsugarableFieldList }: SugaredQualifiedFieldList,
		environment: Environment,
	): QualifiedFieldList {
		let field: FieldName
		let entityName: EntityName
		let filter: SugaredFilter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof fields === 'string') {
			const parsed = this.parseQualifiedFieldList(fields, environment)

			field = parsed.field
			entityName = parsed.entityName
			filter = parsed.filter
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				emptyObject,
				environment,
			)
		} else {
			field = fields.field
			entityName = fields.entityName
			filter = fields.filter
			hasOneRelationPath = this.desugarHasOneRelationPath(fields.hasOneRelationPath, emptyObject, environment)
		}

		return {
			field,
			entityName,
			hasOneRelationPath,
			alias: this.desugarSubTreeAlias(unsugarableFieldList.alias),
			isNonbearing: unsugarableFieldList.isNonbearing ?? EntityCreationParametersDefaults.isNonbearing,
			// forceCreation: unsugarableFieldList.forceCreation ?? EntityCreationParametersDefaults.forceCreation,
			defaultValue:
				unsugarableFieldList.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableFieldList.defaultValue, environment)
					: undefined,
			expectedMutation: unsugarableFieldList.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation,
			eventListeners: this.desugarFieldEventListeners(unsugarableFieldList),
			...this.desugarEntityListParameters({ filter }, unsugarableFieldList, environment),
		}
	}

	public static desugarQualifiedSingleEntity(
		{ entity, ...unsugarableSingleEntity }: SugaredQualifiedSingleEntity,
		environment: Environment,
		options: { missingSetOnCreate?: 'fill' | 'fillAndWarn' } = {},
	): QualifiedSingleEntity {
		let entityName: EntityName
		let where: UniqueWhere
		let filter: Filter | undefined
		let hasOneRelationPath: HasOneRelation[]

		if (typeof entity === 'string') {
			const parsed = this.parseQualifiedSingleEntity(entity, environment)

			entityName = parsed.entityName
			where = parsed.where
			filter = parsed.filter
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		} else {
			entityName = entity.entityName
			where = this.desugarUniqueWhere(entity.where, environment)
			filter = entity.filter ? this.desugarFilter(entity.filter, environment) : undefined
			hasOneRelationPath = this.desugarHasOneRelationPath(
				entity.hasOneRelationPath,
				unsugarableSingleEntity,
				environment,
			)
		}

		// const forceCreation: boolean =
		// 	unsugarableSingleEntity.forceCreation !== undefined
		// 		? unsugarableSingleEntity.forceCreation !== undefined
		// 		: EntityCreationParametersDefaults.forceCreation
		let setOnCreate: UniqueWhere | undefined =
			unsugarableSingleEntity.setOnCreate !== undefined
				? this.desugarSetOnCreate(unsugarableSingleEntity.setOnCreate, environment)
				: undefined

		// todo: remove deprecated code
		if (!setOnCreate && options.missingSetOnCreate) {
			const whereValues = Object.values(where)
			if (whereValues.length === 1 && whereValues[0] instanceof GraphQlLiteral) {
				setOnCreate = where
				if (import.meta.env.DEV && options.missingSetOnCreate === 'fillAndWarn') {
					console.warn('Automatic creation of singleton entities in EditPage is deprecated. Please use setOnCreate prop.')
				}
			}
		}

		const isNonbearing: boolean =
			unsugarableSingleEntity.isNonbearing !== undefined
				? unsugarableSingleEntity.isNonbearing
				: EntityCreationParametersDefaults.isNonbearing
		const eventListeners = this.desugarSingleEntityEventListeners(unsugarableSingleEntity)
		const expectedMutation =
			unsugarableSingleEntity.expectedMutation ?? QualifiedEntityParametersDefaults.expectedMutation
		const alias = this.desugarSubTreeAlias(unsugarableSingleEntity.alias)

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

	public static desugarParentEntityParameters(
		parentEntity: SugaredParentEntityParameters,
		environment: Environment,
	): ParentEntityParameters {
		return {
			eventListeners: this.desugarSingleEntityEventListeners(parentEntity),
		}
	}

	public static desugarRelativeSingleEntity(
		sugaredRelativeSingleEntity: string | SugaredRelativeSingleEntity,
		environment: Environment,
	): RelativeSingleEntity {
		if (typeof sugaredRelativeSingleEntity === 'string') {
			return this.desugarRelativeSingleEntity({ field: sugaredRelativeSingleEntity }, environment)
		}

		const { field, ...unsugarableEntity } = sugaredRelativeSingleEntity
		let hasOneRelationPath: HasOneRelation[]
		if (typeof field === 'string') {
			const parsed = this.parseRelativeSingleEntity(field, environment)
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				unsugarableEntity,
				environment,
			)

		} else {
			hasOneRelationPath = this.desugarHasOneRelationPath(field, unsugarableEntity, environment)
		}

		return {
			hasOneRelationPath,
		}
	}

	public static desugarRelativeSingleField(
		sugaredRelativeSingleField: string | SugaredRelativeSingleField,
		environment: Environment,
	): RelativeSingleField {
		if (typeof sugaredRelativeSingleField === 'string') {
			return this.desugarRelativeSingleField({ field: sugaredRelativeSingleField }, environment)
		}

		const { field, ...unsugarableField } = sugaredRelativeSingleField

		let hasOneRelationPath: HasOneRelation[]
		let fieldName: FieldName
		if (typeof field === 'string') {
			const parsed = this.parseRelativeSingleField(field, environment)
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(parsed.hasOneRelationPath, {}, environment)
			fieldName = parsed.field
		} else {
			hasOneRelationPath = this.desugarHasOneRelationPath(field.hasOneRelationPath, {}, environment)
			fieldName = field.field
		}

		return {
			eventListeners: this.desugarFieldEventListeners(unsugarableField),
			hasOneRelationPath,
			field: fieldName,
			isNonbearing: unsugarableField.isNonbearing ?? LeafFieldDefaults.isNonbearing,
			defaultValue:
				unsugarableField.defaultValue !== undefined
					? VariableInputTransformer.transformValue(unsugarableField.defaultValue, environment)
					: undefined,
		}
	}

	public static desugarRelativeEntityList(
		sugaredRelativeEntityList: string | SugaredRelativeEntityList,
		environment: Environment,
	): RelativeEntityList {
		if (typeof sugaredRelativeEntityList === 'string') {
			return this.desugarRelativeEntityList(
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
			const parsed = this.parseRelativeEntityList(field, environment)
			hasOneRelationPath = this.augmentDesugaredHasOneRelationPath(
				parsed.hasOneRelationPath,
				emptyObject,
				environment,
			)
			hasManyRelation = this.augmentDesugaredHasManyRelation(
				parsed.hasManyRelation,
				unsugarableEntityList,
				environment,
			)
		} else {
			hasOneRelationPath = this.desugarHasOneRelationPath(field.hasOneRelationPath || [], emptyObject, environment)
			hasManyRelation = this.desugarHasManyRelation(field.hasManyRelation, unsugarableEntityList, environment)
		}

		return {
			hasManyRelation,
			hasOneRelationPath,
		}
	}
}
