import { EntityAccessor, useEntityKey, useGetEntityByKey } from '@contember/react-binding'
import { useEffect, useRef, useState } from 'react'

export const useGetParentEntityRef = () => {
	const key = useEntityKey()
	const getEntity = useGetEntityByKey()
	const [initialGetter] = useState(() => () => getEntity(key))
	const ref = useRef<() => EntityAccessor>(initialGetter)
	useEffect(() => {
		ref.current = () => getEntity(key)
	}, [getEntity, key])
	return ref
}
