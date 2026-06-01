import { BoardColumnNode, BoardColumnValue } from './BoardColumnNode.js'

export type BoardData<ColumnValue extends BoardColumnValue> = {
	columns: BoardColumnNode<ColumnValue>[]
}
