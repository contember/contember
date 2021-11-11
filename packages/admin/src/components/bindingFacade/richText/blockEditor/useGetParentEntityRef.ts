import { useEntityKey, useGetEntityByKey } from '@contember/binding'
import { useEffect, useRef, useState } from 'react'

export const useGetParentEntityRef = () => {
	const key = useEntityKey()
	const getEntity = useGetEntityByKey()
	const [initialGetter] = useState(() => () => getEntity(key))
	const ref = useRef(initialGetter)
	useEffect(() => {
		ref.current = () => getEntity(key)
	}, [getEntity, key])
	return ref
}
