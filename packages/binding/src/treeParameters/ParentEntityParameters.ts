import type {
	SingleEntityEventListeners,
	SugarableSingleEntityEventListeners,
	UnsugarableSingleEntityEventListeners,
} from './SingleEntityEventListeners'

export interface ParentEntityParameters extends SingleEntityEventListeners {}

export interface SugarableParentEntityParameters extends SugarableSingleEntityEventListeners {}

export interface UnsugarableParentEntityParameters extends UnsugarableSingleEntityEventListeners {}

export interface SugaredParentEntityParameters extends UnsugarableParentEntityParameters {}
