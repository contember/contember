import { AnchorHTMLAttributes, memo, useMemo } from 'react'
import { RoutingLink, RoutingLinkProps, RoutingLinkTarget } from '../../routing'

export interface PageConfig {
	name: string
	params?: {}
}

/** @deprecated */
export type PageChange = () => PageConfig

/** @deprecated */
export const PageLink = memo(({  to,  ...props }: PageLinkProps) => {
	const passedTo: RoutingLinkTarget = useMemo(() => {
		if (typeof to === 'function') {
			return currentRequest => {
				const newRequest = to(currentRequest)
				if (newRequest !== null && 'name' in newRequest) {
					return {
						pageName: newRequest.name,
						parameters: newRequest.params,
						dimensions: currentRequest?.dimensions ?? {},
					}
				}
				return newRequest
			}
		}
		return to
	}, [to])
	return <RoutingLink to={passedTo} {...props} />
})
PageLink.displayName = 'PageLink'

export interface PageLinkProps extends Omit<RoutingLinkProps & AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'to'> {
	to: PageChange | RoutingLinkTarget
}
