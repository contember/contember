import type { EntityListState } from './EntityListState'
import type { EntityRealmState } from './EntityRealmState'
import type { FieldState } from './FieldState'

export type RootStateNode = EntityRealmState | EntityListState
export type StateINode = EntityRealmState | EntityListState
export type StateNode = EntityRealmState | EntityListState | FieldState
