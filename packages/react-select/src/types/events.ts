import { EntityAccessor } from '@contember/react-binding'

export interface SelectEvents {
	onSelect?: (entity: EntityAccessor) => void
	onUnselect?: (entity: EntityAccessor) => void
}
