import { EntityAccessor } from '@contember/binding'

export type RepeaterMoveItemIndex = number | 'first' | 'last' | 'previous' | 'next'
export type RepeaterMoveItemMethod = (entity: EntityAccessor, index: RepeaterMoveItemIndex) => void
export type RepeaterAddItemIndex = number | 'first' | 'last' | undefined
export type RepeaterAddItemMethod = (index: RepeaterAddItemIndex, preprocess?: EntityAccessor.BatchUpdatesHandler) => void
export type RepeaterRemoveItemMethod = (entity: EntityAccessor) => void
export type RepeaterMethods = {
	moveItem?: RepeaterMoveItemMethod
	addItem: RepeaterAddItemMethod
	removeItem: RepeaterRemoveItemMethod
}
