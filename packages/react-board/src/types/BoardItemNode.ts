import { EntityAccessor } from '@contember/binding'

export type BoardItemNode = {
	id: string | number
	index: number
	value: EntityAccessor
}
