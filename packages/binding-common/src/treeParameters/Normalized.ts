import type {
	Alias,
	EntityName,
	ExpectedQualifiedEntityMutation,
	ExpectedRelationMutation,
	FieldName,
	FieldValue,
	Filter,
	Limit,
	Offset,
	OrderBy,
	SetOnCreate,
	UniqueWhere,
} from './primitives'
import type { EventListenersStore } from './EventListenersStore'
import type { EntityAccessor, EntityListAccessor, FieldAccessor } from '../types'

export interface RelativeEntityList {
	hasOneRelationPath: HasOneRelation[]
	hasManyRelation: HasManyRelation
}

export interface ParentEntityParameters {
	eventListeners: EntityEventListenerStore | undefined
}


export interface QualifiedEntityList {
	entityName: EntityName
	hasOneRelationPath: HasOneRelation[]

	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
	filter: Filter | undefined

	alias: Set<Alias> | undefined
	expectedMutation: ExpectedQualifiedEntityMutation
	initialEntityCount: number
	isCreating: false
	isNonbearing: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

export type QualifiedFieldList = {
	entityName: EntityName
	field: FieldName
	hasOneRelationPath: HasOneRelation[]

	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
	filter: Filter | undefined

	alias: Set<Alias> | undefined
	defaultValue: FieldValue | undefined
	expectedMutation: ExpectedQualifiedEntityMutation
	initialEntityCount: number
	isNonbearing: boolean

	eventListeners: FieldEventListenerStore | undefined
}

export interface QualifiedSingleEntity {
	entityName: EntityName
	hasOneRelationPath: HasOneRelation[]

	where: UniqueWhere
	filter: Filter | undefined

	alias: Set<Alias> | undefined
	expectedMutation: ExpectedQualifiedEntityMutation
	isCreating: false
	isNonbearing: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityEventListenerStore | undefined
}

export interface RelativeSingleEntity {
	hasOneRelationPath: HasOneRelation[]
}

export type RelativeSingleField = {
	field: FieldName
	hasOneRelationPath: HasOneRelation[]

	defaultValue: FieldValue | undefined
	isNonbearing: boolean

	eventListeners: FieldEventListenerStore | undefined
}

export interface UnconstrainedQualifiedEntityList {
	entityName: EntityName
	hasOneRelationPath: HasOneRelation[]

	alias: Set<Alias> | undefined
	expectedMutation: ExpectedQualifiedEntityMutation
	initialEntityCount: number
	isCreating: true
	isNonbearing: boolean
	isUnpersisted: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

export interface UnconstrainedQualifiedSingleEntity {
	entityName: EntityName
	hasOneRelationPath: HasOneRelation[]

	alias: Set<Alias> | undefined
	expectedMutation: ExpectedQualifiedEntityMutation
	isCreating: true
	isNonbearing: boolean
	isUnpersisted: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityEventListenerStore | undefined
}

export interface HasManyRelation {
	field: FieldName

	orderBy: OrderBy | undefined
	offset: Offset | undefined
	limit: Limit | undefined
	filter: Filter | undefined

	expectedMutation: ExpectedRelationMutation
	initialEntityCount: number
	isNonbearing: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityListEventListenerStore | undefined
	childEventListeners: EntityEventListenerStore | undefined
}

export interface HasOneRelation {
	field: FieldName

	reducedBy: UniqueWhere | undefined
	filter: Filter | undefined

	expectedMutation: ExpectedRelationMutation
	isNonbearing: boolean
	setOnCreate: SetOnCreate

	eventListeners: EntityEventListenerStore | undefined
}

export type EntityListEventListenerStore = EventListenersStore<
	EntityListAccessor.EntityListEventListenerMap
>


export type FieldEventListenerStore<Value extends FieldValue = FieldValue> = EventListenersStore<
	FieldAccessor.FieldEventListenerMap<Value>
>

export type EntityEventListenerStore = EventListenersStore<
	EntityAccessor.EntityEventListenerMap
>
