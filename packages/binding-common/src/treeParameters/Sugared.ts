import type {
	Alias,
	EntityName,
	ExpectedQualifiedEntityMutation,
	ExpectedRelationMutation,
	FieldName,
	FieldValue,
	Limit,
	Offset,
	OptionallyVariableFieldValue,
	SugaredFilter,
	SugaredOrderBy,
	SugaredSetOnCreate,
	SugaredUniqueWhere,
} from './primitives'
import type { EntityAccessor, EntityListAccessor, FieldAccessor } from '../types'

export interface SugaredParentEntityParameters extends UnsugarableSingleEntityEventListeners {
}

export interface SugaredQualifiedEntityList extends UnsugarableEntityListEventListeners {
	// E.g. Author[age < 123].son.sisters(name = 'Jane')
	entities:
		| string
		| {
			filter?: SugaredFilter
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
			entityName: EntityName
		}

	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit

	alias?: Alias | Set<Alias>
	expectedMutation?: ExpectedQualifiedEntityMutation
	initialEntityCount?: number
	isCreating?: false
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}

export interface SugaredQualifiedSingleEntity extends UnsugarableSingleEntityEventListeners {
	entity:
		| string
		| {
			where: SugaredUniqueWhere
			filter?: SugaredFilter
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
			entityName: EntityName
		}

	alias?: Alias | Set<Alias>
	expectedMutation?: ExpectedQualifiedEntityMutation
	isCreating?: false
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}

export interface SugaredRelativeEntityList extends UnsugarableEntityListEventListeners {
	// E.g. genres(slug = 'sciFi').authors[age < 123]
	field:
		| string
		| {
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
			hasManyRelation: SugarableHasManyRelation
		}
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit

	expectedMutation?: ExpectedRelationMutation
	initialEntityCount?: number
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}


export interface SugaredRelativeSingleEntity extends UnsugarableSingleEntityEventListeners {
	// E.g. localesByLocale(locale.slug = en)
	field:
		| string
		| SugarableHasOneRelation[]
		| SugarableHasOneRelation

	expectedMutation?: ExpectedRelationMutation
	isNonbearing?: boolean
	setOnCreate?: SugaredSetOnCreate
}


export interface SugaredRelativeSingleField extends UnsugarableFieldEventListeners {
	/** E.g. authors(id = 123).person.name */
	field:
		| string
		| {
			field: FieldName
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
		}

	defaultValue?: OptionallyVariableFieldValue
	isNonbearing?: boolean
}

export interface SugaredQualifiedFieldList extends UnsugarableFieldEventListeners {
	// E.g. Author[age < 123].son.sister.name
	fields:
		| string
		| {
			filter?: SugaredFilter
			field: FieldName
			entityName: EntityName
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
		}
	orderBy?: SugaredOrderBy
	offset?: Offset
	limit?: Limit

	alias?: Alias | Set<Alias>
	defaultValue?: OptionallyVariableFieldValue
	expectedMutation?: ExpectedQualifiedEntityMutation
	initialEntityCount?: number
	isNonbearing?: boolean
}


export interface SugaredUnconstrainedQualifiedEntityList extends UnsugarableEntityListEventListeners {
	entities:
		| string
		| {
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
			entityName: EntityName
		}

	alias?: Alias | Set<Alias>
	expectedMutation?: ExpectedQualifiedEntityMutation
	initialEntityCount?: number
	isCreating: true
	isNonbearing?: boolean
	isUnpersisted?: boolean
	setOnCreate?: SugaredSetOnCreate
}


export interface SugaredUnconstrainedQualifiedSingleEntity extends UnsugarableSingleEntityEventListeners {
	// E.g. Author.son.sisters(name = 'Jane')
	entity:
		| string
		| {
			entityName: EntityName
			hasOneRelationPath?: SugarableHasOneRelation[] | SugarableHasOneRelation
		}

	alias?: Alias | Set<Alias>
	expectedMutation?: ExpectedQualifiedEntityMutation
	isCreating: true
	isNonbearing?: boolean
	isUnpersisted?: boolean
	setOnCreate?: SugaredSetOnCreate
}


export interface SugarableHasManyRelation {
	filter?: SugaredFilter
	field: FieldName
}


export interface SugarableHasOneRelation {
	field: FieldName
	reducedBy?: SugaredUniqueWhere
	filter?: SugaredFilter
}

// --- event listeners

export type UnsugarableEntityListEventListeners = {
	onBeforePersist?: EntityListAccessor.BeforePersistHandler | Set<EntityListAccessor.BeforePersistHandler>
	onBeforeUpdate?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onPersistError?: EntityListAccessor.PersistErrorHandler | Set<EntityListAccessor.PersistErrorHandler>
	onPersistSuccess?: EntityListAccessor.PersistSuccessHandler | Set<EntityListAccessor.PersistSuccessHandler>
	onUpdate?: EntityListAccessor.UpdateListener | Set<EntityListAccessor.UpdateListener>
	onInitialize?: EntityListAccessor.BatchUpdatesHandler | Set<EntityListAccessor.BatchUpdatesHandler>
	onChildBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onChildInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onChildUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
}



export type UnsugarableSingleEntityEventListeners = {
	onBeforePersist?: EntityAccessor.BeforePersistHandler | Set<EntityAccessor.BeforePersistHandler>
	onBeforeUpdate?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onPersistError?: EntityAccessor.PersistErrorHandler | Set<EntityAccessor.PersistErrorHandler>
	onPersistSuccess?: EntityAccessor.PersistSuccessHandler | Set<EntityAccessor.PersistSuccessHandler>
	onUpdate?: EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
	onInitialize?: EntityAccessor.BatchUpdatesHandler | Set<EntityAccessor.BatchUpdatesHandler>
	onConnectionUpdate?: {
		[fieldName: string]: | EntityAccessor.UpdateListener | Set<EntityAccessor.UpdateListener>
	}
}

export type UnsugarableFieldEventListeners<Persisted extends FieldValue = FieldValue> = {
	onInitialize?: FieldAccessor.InitializeListener<Persisted> | Set<FieldAccessor.InitializeListener<Persisted>>
	onBeforeUpdate?: FieldAccessor.BeforeUpdateListener<Persisted> | Set<FieldAccessor.BeforeUpdateListener<Persisted>>
	onUpdate?: FieldAccessor.UpdateListener<Persisted> | Set<FieldAccessor.UpdateListener<Persisted>>
}

// --- type checks

const checkEntityListEvents:
	keyof UnsugarableEntityListEventListeners extends `on${Capitalize<keyof (EntityListAccessor.EntityListEventListenerMap & EntityListAccessor.ChildEventListenerMap)>}`
		? `on${Capitalize<keyof (EntityListAccessor.EntityListEventListenerMap & EntityListAccessor.ChildEventListenerMap)>}` extends keyof UnsugarableEntityListEventListeners
			? true
			: false
		: false = true
const checkSingleEntityEvents:
	keyof UnsugarableSingleEntityEventListeners extends `on${Capitalize<keyof EntityAccessor.EntityEventListenerMap>}`
		? `on${Capitalize<keyof EntityAccessor.EntityEventListenerMap>}` extends keyof UnsugarableSingleEntityEventListeners
			? true
			: false
		: false = true
const checkFieldEvents:
	keyof UnsugarableFieldEventListeners extends `on${Capitalize<keyof FieldAccessor.FieldEventListenerMap>}`
		? `on${Capitalize<keyof FieldAccessor.FieldEventListenerMap>}` extends keyof UnsugarableFieldEventListeners
			? true
			: false
		: false = true
