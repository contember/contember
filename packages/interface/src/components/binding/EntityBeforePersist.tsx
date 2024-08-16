import { EntityAccessor, useEntityBeforePersist } from '@contember/react-binding'

export const EntityBeforePersist = ({ listener }: { listener: EntityAccessor.EntityEventListenerMap['beforePersist']}) => {
	useEntityBeforePersist(listener)
	return null
}
