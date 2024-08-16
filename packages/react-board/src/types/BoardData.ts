import { BoardColumnNode, BoardColumnValue } from './BoardColumnNode'

export type BoardData<ColumnValue extends BoardColumnValue> =
	& {
		columns: BoardColumnNode<ColumnValue>[]
	}
