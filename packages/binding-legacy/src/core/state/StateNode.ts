import type { EntityListState } from './EntityListState.js'
import type { EntityRealmState } from './EntityRealmState.js'
import type { FieldState } from './FieldState.js'
import type { FieldValue } from '@contember/binding-common'

export type RootStateNode = EntityRealmState | EntityListState
export type StateINode = RootStateNode
export type StateNode<Value extends FieldValue = any> = EntityRealmState | EntityListState | FieldState<Value>
