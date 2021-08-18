import { memo } from 'react'
import { connect } from 'react-redux'
import type State from '../../state'
import { pageRequest } from '../../state/request'
import { Link, PublicAnchorProps } from '../Link'
import type { LinkComponent } from '../Link/LinkComponent'

export interface PageConfig {
	name: string
	params?: {}
}

export type PageChange = () => PageConfig

const PageLink = memo(({ project, to, stage, ...props }: Props) => {
	const changed =
		typeof to === 'string'
			? {
					name: to,
					params: {},
			  }
			: to()
	return <Link requestChange={pageRequest(project, stage, changed.name, changed.params || {})} {...props} />
})

interface StateProps {
	project: string
	stage: string
}

export interface PageLinkProps extends Omit<LinkComponent.Props, 'goTo' | 'href' | 'requestChange'> {
	to: PageChange | string
}

type Props = PageLinkProps & StateProps & PublicAnchorProps

export default connect<StateProps, {}, PageLinkProps, State>(({ request }) => {
	if (request.name === 'project_page') {
		return { project: request.project, stage: request.stage }
	} else {
		throw 'Cannot render PageLink outside project pages.'
	}
})(PageLink)
