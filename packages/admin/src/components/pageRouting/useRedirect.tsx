import { useCallback } from 'react'
import { RoutingLinkTarget, useRoutingLinkFactory } from '../../routing'

export const useRedirect = () => {
	const linkFactory = useRoutingLinkFactory()
	return useCallback(
		(target: RoutingLinkTarget) => {
			linkFactory(target).navigate()
		},
		[linkFactory],
	)
}
