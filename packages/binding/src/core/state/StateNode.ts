import { EntityListState } from './EntityListState'
import { EntityState } from './EntityState'
import { FieldState } from './FieldState'

export type RootStateNode = EntityState | EntityListState
export type StateINode = EntityState | EntityListState
export type StateNode = EntityState | EntityListState | FieldState
