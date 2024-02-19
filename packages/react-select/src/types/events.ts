import { EntityAccessor } from '@contember/binding'

export interface SelectEvents {
	onSelect?: (entity: EntityAccessor) => void
	onUnselect?: (entity: EntityAccessor) => void
}
