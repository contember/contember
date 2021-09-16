import type {
	SingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'

export interface ParentEntityParameters extends SingleEntityEventListeners {}

export interface UnsugarableParentEntityParameters extends UnsugarableSingleEntityEventListeners {}

export interface SugaredParentEntityParameters extends UnsugarableParentEntityParameters {}
