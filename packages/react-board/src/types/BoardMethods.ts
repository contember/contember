import { EntityAccessor } from '@contember/binding'
import { BoardColumnValue } from './BoardColumnNode'

export type BoardAddColumnMethod = (index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;
export type BoardMoveColumnMethod = (entity: EntityAccessor, index: number) => void;
export type BoardRemoveColumnMethod = (entity: EntityAccessor) => void;
export type BoardMoveItemMethod<ColumnValue extends BoardColumnValue> = (entity: EntityAccessor, column: ColumnValue | null, index: number) => void;
export type BoardAddItemMethod<ColumnValue extends BoardColumnValue> = (column: ColumnValue | null, index: number | undefined, preprocess?: EntityAccessor.BatchUpdatesHandler) => void;
export type BoardRemoveItemMethod = (entity: EntityAccessor) => void;

export type BoardMethods<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
	moveColumn?: BoardMoveColumnMethod
	addColumn?: BoardAddColumnMethod
	removeColumn?: BoardRemoveColumnMethod

	moveItem?: BoardMoveItemMethod<ColumnValue>
	addItem?: BoardAddItemMethod<ColumnValue>
	removeItem?: BoardRemoveItemMethod
}
