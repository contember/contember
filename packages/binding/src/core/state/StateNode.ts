import { EntityListState } from './EntityListState'
import { EntityRealmState } from './EntityRealmState'
import { FieldState } from './FieldState'

export type RootStateNode = EntityRealmState | EntityListState
export type StateINode = EntityRealmState | EntityListState
export type StateNode = EntityRealmState | EntityListState | FieldState
