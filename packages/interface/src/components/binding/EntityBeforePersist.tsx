import { EntityAccessor, useEntityBeforePersist } from '@contember/interface'

export const EntityBeforePersist = ({ listener }: { listener: EntityAccessor.EntityEventListenerMap['beforePersist']}) => {
	useEntityBeforePersist(listener)
	return null
}
