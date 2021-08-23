import { memo } from 'react'
import { useSelector } from 'react-redux'
import type State from '../../state'
import { pageRequest } from '../../state/request'
import { Link, LinkProps, PublicAnchorProps } from '../Link'

export interface PageConfig {
	name: string
	params?: {}
}

export type PageChange = () => PageConfig

export const PageLink = memo(({  to,  ...props }: PageLinkProps) => {
	const request = useSelector<State, {project: string, stage: string} | null>(selector => selector.request)
	if (!request) {
		throw 'Cannot render PageLink without resolved request'
	}
	const changed =
		typeof to === 'string'
			? {
					name: to,
					params: {},
			  }
			: to()
	return <Link requestChange={pageRequest(request.project, request.stage, changed.name, changed.params || {})} {...props} />
})
PageLink.displayName = 'PageLink'

export interface PageLinkProps extends Omit<LinkProps & PublicAnchorProps, 'goTo' | 'href' | 'requestChange'> {
	to: PageChange | string
}
