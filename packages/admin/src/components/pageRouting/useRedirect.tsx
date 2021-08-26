import { useCallback } from 'react'
import type { RequestChange } from '../../routing'
import { useRoutingLinkFactory } from '../../routing'

export const useRedirect = () => {
	const linkFactory = useRoutingLinkFactory()
	return useCallback(
		(requestChange: RequestChange) => {
			linkFactory(requestChange).navigate()
		},
		[linkFactory],
	)
}
