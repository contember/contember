import { useEffect, useRef } from 'react'

export const useIsMounted = () => {
	const isMountedRef = useRef(true)
	useEffect(
		() => () => {
			isMountedRef.current = false
		},
		[],
	)
	return isMountedRef
}
