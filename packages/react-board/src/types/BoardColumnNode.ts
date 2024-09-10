import { ReactNode } from 'react'
import { EntityAccessor } from '@contember/react-binding'
import { BoardItemNode } from './BoardItemNode'

export type BoardStaticColumnValue = {
	value: string
	label?: ReactNode
}
export type BoardColumnValue = BoardStaticColumnValue | EntityAccessor

export type BoardColumnNode<ColumnValue extends BoardColumnValue = BoardColumnValue> = {
	id: string | number
	index: number
	value: ColumnValue | null
	items: BoardItemNode[]
}
