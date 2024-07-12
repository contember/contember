import type { EntityListState } from './EntityListState'
import type { EntityRealmState } from './EntityRealmState'
import type { FieldState } from './FieldState'
import type { FieldValue } from '../../treeParameters'

export type RootStateNode = EntityRealmState | EntityListState
export type StateINode = RootStateNode
export type StateNode<Value extends FieldValue = any> = EntityRealmState | EntityListState | FieldState<Value>
