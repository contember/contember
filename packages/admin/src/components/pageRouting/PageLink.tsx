import { memo, useMemo } from 'react'
import { Link, LinkProps, PublicAnchorProps } from '../Link'
import { LinkTarget } from '../Link/useLink'

export interface PageConfig {
	name: string
	params?: {}
}

/** @deprecated */
export type PageChange = () => PageConfig

/** @deprecated */
export const PageLink = memo(({  to,  ...props }: PageLinkProps) => {
	const passedTo: LinkTarget = useMemo(() => {
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
	return <Link to={passedTo} {...props} />
})
PageLink.displayName = 'PageLink'

export interface PageLinkProps extends Omit<LinkProps & PublicAnchorProps, 'href' | 'to'> {
	to: PageChange | LinkTarget
}
