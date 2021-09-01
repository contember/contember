import { useCallback } from 'react'
import { RoutingLinkTarget, useRoutingLinkFactory } from '../../routing'

export const useRedirect = () => {
	const linkFactory = useRoutingLinkFactory()
	return useCallback(
		(requestChange: RoutingLinkTarget) => {
			linkFactory(requestChange).navigate()
		},
		[linkFactory],
	)
}
