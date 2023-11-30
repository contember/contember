import { EntityAccessor } from '@contember/react-binding'
import { ReactNode } from 'react'

export type BoardItem = {
	id: string | number
	index: number
	value: EntityAccessor
}

export type BoardStaticColumnValue = {
	value: string
	label?: ReactNode
}
export type BoardColumnValue = BoardStaticColumnValue | EntityAccessor

export type BoardColumn<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
	id: string | number
	index: number
	value: ColumnValue | null
	items: BoardItem[]
}

export type BoardAddColumnMethod = (index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;
export type BoardMoveColumnMethod = (entity: EntityAccessor, index: number) => void;
export type BoardRemoveColumnMethod = (entity: EntityAccessor) => void;
export type BoardMoveItemMethod<ColumnValue extends BoardColumnValue> = (entity: EntityAccessor, column: ColumnValue | null, index: number) => void;
export type BoardAddItemMethod<ColumnValue extends BoardColumnValue> = (column: ColumnValue | null, index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;
export type BoardRemoveItemMethod = (entity: EntityAccessor) => void;

export type BoardMethods<ColumnValue extends BoardColumnValue> = {
	moveColumn?: BoardMoveColumnMethod
	addColumn?: BoardAddColumnMethod
	removeColumn?: BoardRemoveColumnMethod

	moveItem?: BoardMoveItemMethod<ColumnValue>
	addItem?: BoardAddItemMethod<ColumnValue>
	removeItem?: BoardRemoveItemMethod

}

export type BoardBindingProps<ColumnValue extends BoardColumnValue> =
	& {
		columns: BoardColumn<ColumnValue>[]
	}
	& BoardMethods<ColumnValue>
