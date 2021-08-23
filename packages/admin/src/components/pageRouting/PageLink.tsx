import { memo } from 'react'
import { pageRequest } from '../../state/request'
import { Link, LinkProps, PublicAnchorProps } from '../Link'

export interface PageConfig {
	name: string
	params?: {}
}

export type PageChange = () => PageConfig

export const PageLink = memo(({  to,  ...props }: PageLinkProps) => {
	const changed =
		typeof to === 'string'
			? {
					name: to,
					params: {},
			  }
			: to()
	return <Link requestChange={pageRequest(changed.name, changed.params || {})} {...props} />
})
PageLink.displayName = 'PageLink'

export interface PageLinkProps extends Omit<LinkProps & PublicAnchorProps, 'goTo' | 'href' | 'requestChange'> {
	to: PageChange | string
}
